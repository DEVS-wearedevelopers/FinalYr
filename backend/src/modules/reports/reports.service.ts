/**
 * reports.service.ts
 * Thin orchestrator — each step is logged and isolated.
 * Order of operations for submitReport:
 *   1. Validate input (reports.validator)
 *   2. Guard: user must have organizationId
 *   3. Cache report locally to JSON (reports.cache) ← never lost even if DB fails
 *   4. Insert sentinel_report into DB (reports.repository)
 *   5. Mark cache entry as synced (or failed)
 *   6. Update facility last_report_at (non-fatal if it fails)
 *   7. Calculate CBS score and insert ai_alert (reports.scorer + reports.repository)
 */

import { ReportsRepository } from './reports.repository.js';
import { reportSchema }       from './reports.validator.js';
import { cacheReport, markSynced, markFailed } from './reports.cache.js';
import {
    computeSymptomWeight,
    computeTemporalWeight,
    computeScaleWeight,
    buildCbsScore,
} from './reports.scorer.js';
import { syslog } from '../admin/system-logger.js';

const MOD = 'reports';

const LOG = (step: string, msg: string, data?: unknown) => {
    const ts = new Date().toISOString();
    console.log(`[REPORTS][${step}] ${ts} — ${msg}`, data !== undefined ? JSON.stringify(data) : '');
    syslog.info(`[${step}] ${msg}`, { module: MOD, data });
};
const ERR = (step: string, msg: string, err?: unknown, data?: unknown) => {
    console.error(`[REPORTS][${step}] ❌ ${msg}`, err);
    syslog.logModuleError(MOD, step, msg, err, data);
};

export class ReportsService {
    constructor(private repo: ReportsRepository) {}

    // ─────────────────────────────────────────────────────────────────────────
    async submitReport(user: any, body: any) {
        LOG('SUBMIT', 'Received report submission request', { userId: user.id, role: user.role, organizationId: user.organizationId });

        // ── Step 1: Validate ─────────────────────────────────────────────────
        LOG('VALIDATE', 'Running Zod validation on request body');
        const result = reportSchema.safeParse(body);
        if (!result.success) {
            ERR('VALIDATE', 'Validation failed', result.error.format());
            throw new Error(`Validation failed: ${JSON.stringify(result.error.format())}`);
        }
        const { patientCount, originLocation, symptomMatrix, severity, notes, source } = result.data;
        LOG('VALIDATE', '\u2705 Input valid', { patientCount, symptoms: symptomMatrix, severity, source });

        // \u2500\u2500 Step 2: Guard \u2500
        // Community reports are anonymous \u2014 no organizationId required.
        // Institution reports must always have a linked facility.
        if (source === 'institution') {
            LOG('GUARD', 'Checking organizationId (institution submission)', { organizationId: user.organizationId });
            if (!user.organizationId) {
                ERR('GUARD', 'No organizationId on user \u2014 facility not linked');
                throw new Error('Facility not linked: Your account has no facility/organization assigned. Contact your EOC administrator.');
            }
            LOG('GUARD', '\u2705 organizationId present', { organizationId: user.organizationId });
        } else {
            LOG('GUARD', 'Community report \u2014 skipping organizationId check');
        }
        // ── Step 3: Cache locally ─────────────────────────────────────────────
        LOG('CACHE', 'Saving report to local JSON cache before DB insert');
        const cacheId = cacheReport(
            { patientCount, originLocation, symptomMatrix, severity, notes },
            { id: user.id, email: user.email, role: user.role, organizationId: user.organizationId }
        );
        LOG('CACHE', `✅ Cached with id=${cacheId}`);

        // ── Step 4: Insert sentinel_report into DB ────────────────────────────
        LOG('DB:REPORT', 'Inserting sentinel_report row into Supabase', {
            organization_id: user.organizationId,
            submitted_by: user.id,
            patient_count: patientCount,
            origin_address: originLocation.address,
            symptoms_count: symptomMatrix.length,
        });

        const reportPayload = {
            submitted_by:         user.id || null,
            organization_id:      user.organizationId || null,
            source,
            patient_count:        patientCount,
            origin_lat:           originLocation.lat,
            origin_lng:           originLocation.lng,
            origin_address:       originLocation.address,
            symptom_matrix:       symptomMatrix,
            severity,
            notes,
            status:               'Pending AI',
        };

        const { data: reportRow, error: reportError } = await this.repo.insertSentinelReport(reportPayload);

        if (reportError || !reportRow) {
            ERR('DB:REPORT', 'DB insert failed', { message: reportError?.message, code: (reportError as any)?.code, details: (reportError as any)?.details });
            markFailed(cacheId, reportError?.message ?? 'Unknown DB error');
            throw new Error(`Database Error: ${reportError?.message || 'Failed to insert report'}`);
        }

        LOG('DB:REPORT', '✅ sentinel_report inserted', { id: reportRow.id, status: reportRow.status });

        // ── Step 5: Mark cache synced ─────────────────────────────────────────
        markSynced(cacheId, reportRow.id);

        // ── Step 6: Update facility last_report_at (non-fatal) ───────────────
        LOG('DB:FACILITY', 'Updating facility last_report_at', { organizationId: user.organizationId });
        try {
            await this.repo.updateFacilityLastReportAt(user.organizationId);
            LOG('DB:FACILITY', '✅ last_report_at updated');
        } catch (facilityUpdateErr) {
            ERR('DB:FACILITY', 'Non-fatal: failed to update facility last_report_at (facility may not exist in facilities table)', facilityUpdateErr);
            // Don't throw — this should never block a report submission
        }

        // ── Step 7: Score + insert ai_alert, capture the alert row ───────────
        LOG('SCORER', 'Starting CBS scoring', { patientCount, symptoms: symptomMatrix });
        let alert: any = null;
        try {
            alert = await this.scoreAndCreateAlert(user, reportRow.id, patientCount, symptomMatrix);
        } catch (scoringErr) {
            ERR('SCORER', 'Non-fatal: AI scoring/alert creation failed — report was still saved', scoringErr);
        }

        LOG('SUBMIT', '✅ Report submission complete', { reportId: reportRow.id, cacheId });
        return { report: reportRow, alert };
    }


    // ─────────────────────────────────────────────────────────────────────────
    private async scoreAndCreateAlert(
        user: any,
        reportId: string,
        patientCount: number,
        symptomMatrix: string[]
    ) {
        // Step 7a: Symptom weight
        const W = computeSymptomWeight(symptomMatrix);
        LOG('SCORER', `W (symptom weight) = ${W}`);

        // Step 7b: Temporal trend — how many reports from this org in last 24h
        let recentCount = 0;
        LOG('SCORER', 'Fetching recent report count from DB (last 24h)');
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const { count, error: countErr } = await this.repo.getRecentReportCount(
                user.organizationId,
                yesterday.toISOString()
            );
            if (countErr) {
                ERR('SCORER', 'Failed to fetch recent count', countErr);
            } else {
                recentCount = count ?? 0;
                LOG('SCORER', `Recent report count = ${recentCount}`);
            }
        } catch (e) {
            ERR('SCORER', 'Exception fetching recent count', e);
        }

        const T = computeTemporalWeight(recentCount);
        const S = computeScaleWeight(patientCount);
        LOG('SCORER', `T (temporal) = ${T}, S (scale) = ${S}`);

        const { CBS, severity_index, bypass_reason } = buildCbsScore(W, T, S, recentCount);
        LOG('SCORER', `✅ CBS = ${CBS}, severity_index = ${severity_index}, bypass = ${bypass_reason ?? 'none'}`);

        // Step 7c: Insert ai_alert
        const alertPayload = {
            report_id:      reportId,
            facility_id:    user.organizationId,   // TEXT — no FK constraint
            zone_id:        user.organizationId,
            cbs_score:      CBS,
            severity_index,
            status:         'pending_investigation',
            symptom_weight: W,
            bypass_reason,
            created_at:     new Date().toISOString(),
        };

        LOG('DB:ALERT', 'Inserting ai_alert row', alertPayload);
        const { data: alertRow, error: alertError } = await this.repo.insertAiAlert(alertPayload);

        if (alertError) {
            ERR('DB:ALERT', 'ai_alert insert failed', { message: alertError.message, code: (alertError as any)?.code, details: (alertError as any)?.details, hint: (alertError as any)?.hint });
            throw new Error(`ai_alert insert error: ${alertError.message}`);
        }

        LOG('DB:ALERT', '✅ ai_alert inserted', { id: (alertRow as any)?.id });
        return alertRow;
    }

    // ─────────────────────────────────────────────────────────────────────────
    async getFeed(user: any) {
        LOG('FEED', 'Fetching reports feed', { organizationId: user.organizationId });
        if (!user.organizationId) {
            ERR('FEED', 'No organizationId — returning empty feed');
            return [];
        }
        const { data, error } = await this.repo.getReportsFeed(user.organizationId);
        if (error) {
            ERR('FEED', 'DB error fetching feed', error);
            throw new Error(`Database Error: ${error.message}`);
        }
        LOG('FEED', `✅ Returned ${data?.length ?? 0} reports`);
        return data;
    }

    // ─────────────────────────────────────────────────────────────────────────
    async getAnalytics(user: any) {
        LOG('ANALYTICS', 'Fetching facility analytics', { organizationId: user.organizationId });

        // Guard: if no organizationId, return zeros so dashboard renders without crashing
        if (!user.organizationId) {
            ERR('ANALYTICS', 'No organizationId — account has no linked facility. Returning defaults.');
            return {
                dataQualityScore: 100,
                reportsThisMonth: 0,
                reportsLastMonth: 0,
                eocFlags: [],
                advisory: { active: false },
                _warning: 'Your account has no facility linked. Ask your EOC administrator to assign one.',
            };
        }

        const analytics = await this.repo.getFacilityAnalytics(user.organizationId);
        const advisory  = await this.repo.getActiveAdvisory(user.organizationId);
        LOG('ANALYTICS', '✅ Analytics fetched', { reportsThisMonth: analytics.reportsThisMonth });

        return {
            ...analytics,
            advisory: advisory
                ? {
                    active:   true,
                    severity: advisory.severity === 'CRITICAL' ? 'red' : (advisory.severity === 'WARNING' ? 'amber' : 'blue'),
                    message:  advisory.message,
                }
                : { active: false },
        };
    }
}

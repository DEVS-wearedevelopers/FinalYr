import { ReportsRepository } from './reports.repository.js';
import { z } from 'zod';

export const reportSchema = z.object({
    patientCount: z.number().int().positive(),
    originLocation: z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().optional()
    }),
    symptomMatrix: z.array(z.string()).nonempty(),
    severity: z.number().min(1).max(10),
    notes: z.string().optional()
});

export class ReportsService {
    constructor(private reportsRepository: ReportsRepository) { }

    async submitReport(user: any, body: any) {
        const result = reportSchema.safeParse(body);
        if (!result.success) {
            throw new Error(`Validation failed: ${JSON.stringify(result.error.format())}`);
        }

        const { patientCount, originLocation, symptomMatrix, severity, notes } = result.data;

        if (!user.organizationId) {
            throw new Error('Facility not linked: Your account has no facility/organization assigned. Contact your EOC administrator.');
        }

        const { data, error } = await this.reportsRepository.insertSentinelReport({
            submitted_by: user.id,
            organization_id: user.organizationId,
            patient_count: patientCount,
            origin_lat: originLocation.lat,
            origin_lng: originLocation.lng,
            origin_address: originLocation.address,
            symptom_matrix: symptomMatrix,
            severity,
            notes,
            status: 'Pending AI',
            professional_id_hash: 'todo-generate-hash'
        });

        if (error || !data) {
            throw new Error(`Database Error: ${error?.message || 'Failed to insert report'}`);
        }

        // Update the facility's last_report_at timestamp
        await this.reportsRepository.updateFacilityLastReportAt(user.organizationId);

        await this.calculateAndCreateAlert(user, data.id, patientCount, symptomMatrix);
        return data;
    }

    private async calculateAndCreateAlert(user: any, reportId: string, patientCount: number, symptomMatrix: string[]) {
        try {
            const symptoms = symptomMatrix.map(s => s.toLowerCase());
            let W = 0.2;

            const hasFever = symptoms.includes('fever');
            const hasHemorrhage = symptoms.some(s => s.includes('hemorrhage') || s.includes('bleeding'));
            const hasNeurological = symptoms.some(s => s.includes('seizure') || s.includes('confusion') || s.includes('paralysis'));
            const hasRespiratory = symptoms.some(s => s.includes('cough') || s.includes('breath') || s.includes('respiratory'));
            const hasEnteric = symptoms.includes('vomiting') && symptoms.some(s => s.includes('diarrhea') || s.includes('diarrhoea'));

            if (hasFever && hasHemorrhage) W = 1.0;
            else if (hasFever && hasNeurological) W = 0.9;
            else if (hasFever && hasRespiratory) W = 0.7;
            else if (hasEnteric) W = 0.6;
            else if (hasFever) W = 0.4;
            else if (hasRespiratory) W = 0.3;

            let CBS = 0;
            let severity_index = 0;
            let bypass_reason: string | null = null;
            let T = 0.3;

            if (W === 1.0) {
                CBS = 1.0;
                severity_index = 10;
                bypass_reason = "CRITICAL_HEMORRHAGIC";
            } else {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                const { count, error: countError } = await this.reportsRepository.getRecentReportCount(
                    user.organizationId,
                    yesterday.toISOString()
                );

                if (!countError && count !== null) {
                    if (count >= 10) T = 1.0;
                    else if (count >= 5) T = 0.8;
                }

                let S = 0.4;
                if (patientCount >= 20) S = 1.0;
                else if (patientCount >= 10) S = 0.8;

                CBS = (W * 0.40) + (T * 0.35) + (S * 0.25);
                CBS = Math.max(0, Math.min(1, CBS));
                CBS = Math.round(CBS * 100) / 100;
                severity_index = Math.ceil(CBS * 10);
            }

            await this.reportsRepository.insertAiAlert({
                report_id: reportId,
                facility_id: user.organizationId,
                zone_id: user.organizationId,
                cbs_score: CBS,
                severity_index,
                status: 'pending_investigation',
                symptom_weight: W,
                bypass_reason,
                created_at: new Date().toISOString()
            });
        } catch (scoringError) {
            console.error("AI Scoring Error:", scoringError);
        }
    }

    async getFeed(user: any) {
        const { data, error } = await this.reportsRepository.getReportsFeed(user.organizationId);
        if (error) {
            throw new Error(`Database Error: ${error.message}`);
        }
        return data;
    }

    async getAnalytics(user: any) {
        const analytics = await this.reportsRepository.getFacilityAnalytics(user.organizationId);
        const advisory = await this.reportsRepository.getActiveAdvisory(user.organizationId);
        
        return {
            ...analytics,
            advisory: advisory ? {
                active: true,
                severity: advisory.severity === 'CRITICAL' ? 'red' : (advisory.severity === 'WARNING' ? 'amber' : 'blue'),
                message: advisory.message
            } : { active: false }
        };
    }
}

import { AlertsRepository } from './alerts.repository.js';
import { syslog } from '../admin/system-logger.js';
import { z } from 'zod';

const MOD = 'alerts';

export const statusSchema = z.object({
    status: z.enum(['probable', 'confirmed', 'invalidated'])
});

export class AlertsService {
    constructor(private repo: AlertsRepository) {}

    async getInbox(user: any) {
        syslog.info('PHO inbox requested', { module: MOD, userId: user.id });
        const { data, error } = await this.repo.getPhoInbox();
        if (error) {
            syslog.logModuleError(MOD, 'getInbox', 'DB error fetching PHO inbox', error);
            throw new Error(`Database Error: ${error.message}`);
        }
        syslog.info(`Inbox returned ${data?.length ?? 0} alerts`, { module: MOD });
        return data;
    }

    async claimAlert(alertId: string, user: any) {
        syslog.info(`PHO claiming alert ${alertId}`, { module: MOD, userId: user.id });
        const { data, error } = await this.repo.claimAlert(alertId, user.id);
        if (error || !data) {
            syslog.logModuleError(MOD, 'claimAlert', 'Failed to claim alert', error, { alertId });
            throw new Error(`Database Error: ${error?.message || 'Failed to claim alert'}`);
        }
        return data;
    }

    async updateStatus(alertId: string, user: any, body: any) {
        const result = statusSchema.safeParse(body);
        if (!result.success) {
            throw new Error(`Validation failed: ${JSON.stringify(result.error.format())}`);
        }
        syslog.info(`Updating alert ${alertId} → ${result.data.status}`, { module: MOD, userId: user.id });
        const { data, error } = await this.repo.updateAlertStatus(alertId, user.id, result.data.status);
        if (error || !data) {
            syslog.logModuleError(MOD, 'updateStatus', 'Failed to update alert status', error, { alertId, status: result.data.status });
            throw new Error(`Database Error: ${error?.message || 'Failed to update alert — you may not own this alert'}`);
        }
        return { status: result.data.status, data };
    }

    async broadcastAlert(user: any, message?: string) {
        syslog.info(`Broadcast triggered by PHO ${user.id}`, { module: MOD });

        const advisoryText = message ||
            'A health advisory has been issued by your Public Health Officer. Please stay alert and follow recommended hygiene practices.';

        // Persist to advisories table so institutions see it in their Inbox
        const { error } = await this.repo.insertAdvisory({
            issued_by: user.id,
            message:   advisoryText,
            severity:  'ADVISORY',
            zone_id:   'national',   // PHO broadcasts are system-wide
            dismissed: false,
        });

        if (error) {
            syslog.logModuleError(MOD, 'broadcastAlert', 'Failed to write advisory', error);
            throw new Error(`Database Error: ${error.message}`);
        }

        syslog.info('Advisory persisted to DB', { module: MOD });
        return { message: 'Broadcast sent. Institutions in your zone will see this in their Inbox.' };
    }

    async escalateAlert(alertId: string) {
        syslog.info(`Alert ${alertId} escalated to EOC`, { module: MOD });
        const { error } = await this.repo.escalateAlert(alertId);
        if (error) {
            syslog.logModuleError(MOD, 'escalateAlert', 'Failed to escalate alert', error, { alertId });
            throw new Error(`Database Error: ${error.message}`);
        }
        return { message: 'Alert escalated to EOC for rapid response', alertId };
    }

    async getPhoAdvisories() {
        return await this.repo.getPhoAdvisories();
    }

    async getLocalAlerts(lat: string, lng: string) {
        if (!lat || !lng) throw new Error('Validation failed: Missing coordinates');
        // Spatial proximity filter requires PostGIS — currently returns all confirmed/probable alerts
        syslog.info(`Civilian local alerts requested (lat=${lat}, lng=${lng})`, { module: MOD });
        const { data, error } = await this.repo.getLocalAlerts();
        if (error) {
            syslog.logModuleError(MOD, 'getLocalAlerts', 'DB error', error);
            throw new Error(`Database Error: ${error.message}`);
        }
        return data ?? [];
    }

    async getNationalTrends() {
        const { data, error } = await this.repo.getNationalTrendCounts();
        if (error || !data) return { totalAlerts: 0, confirmed: 0, investigating: 0, probable: 0 };

        return {
            totalAlerts:   data.length,
            confirmed:     data.filter(a => a.status === 'confirmed').length,
            investigating: data.filter(a => a.status === 'investigating').length,
            probable:      data.filter(a => a.status === 'probable').length,
            avgCbs:        data.length > 0
                ? Math.round((data.reduce((s, a) => s + (a.cbs_score ?? 0), 0) / data.length) * 100) / 100
                : 0,
        };
    }
}

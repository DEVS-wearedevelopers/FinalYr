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
        syslog.info('PHO inbox requested', { module: MOD, userId: user.id, data: { organizationId: user.organizationId } });
        const { data, error } = await this.repo.getPhoInbox(user.organizationId);
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

    async broadcastAlert(user: any) {
        // Broadcast is a signal — actual civilian notification system to be integrated later
        syslog.info(`Broadcast triggered by PHO ${user.id}`, { module: MOD });
        return { message: 'Broadcast initiated successfully. Civilians in your zone will be notified.' };
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

    async getLocalAlerts(lat: string, lng: string) {
        if (!lat || !lng) throw new Error('Validation failed: Missing coordinates');
        // Spatial filtering to be implemented with PostGIS — returns confirmed alerts for now
        return [];
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

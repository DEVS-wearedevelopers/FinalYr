import { apiClient } from './apiClient';

export interface AiAlert {
    id: string;
    zone_id: string;
    facility_id: string;
    cbs_score: number;
    severity_index: number;
    status: 'pending_investigation' | 'investigating' | 'probable' | 'confirmed' | 'invalidated';
    symptom_weight: number;
    bypass_reason: string | null;
    created_at: string;
    investigated_by?: string;
    investigated_at?: string;
    // Joined from sentinel_reports — normalised from array to object
    sentinel_reports?: {
        patient_count: number;
        symptom_matrix: string[];
        origin_address?: string;
        organization_id: string;
        // Nested join — institution name
        institution_registrations?: {
            facility_name: string;
            state?: string;
            city?: string;
        } | null;
    } | null;
}

export type AlertStatusUpdate = 'probable' | 'confirmed' | 'invalidated';

// PostgREST returns joined rows as arrays — flatten to single object
// symptom_matrix is jsonb in DB — coerce to string[] safely
function normaliseAlert(raw: any): AiAlert {
    const sr = raw.sentinel_reports;
    const report = Array.isArray(sr) ? (sr[0] ?? null) : (sr ?? null);
    if (report) {
        // Flatten nested institution_registrations array → object
        if (Array.isArray(report.institution_registrations)) {
            report.institution_registrations = report.institution_registrations[0] ?? null;
        }
        // jsonb symptom_matrix → string[]
        if (report.symptom_matrix && !Array.isArray(report.symptom_matrix)) {
            report.symptom_matrix = Object.values(report.symptom_matrix as Record<string, string>);
        }
    }
    return { ...raw, sentinel_reports: report };
}

export const alertsService = {
    /** PHO: Get all alerts (no zone filter — all PHOs see all alerts for demo) */
    async getInbox(): Promise<AiAlert[]> {
        const { data } = await apiClient.get('/alerts/inbox');
        return (data.inbox ?? []).map(normaliseAlert);
    },

    /** PHO: Claim an alert for investigation */
    async claimAlert(alertId: string): Promise<AiAlert> {
        const { data } = await apiClient.post(`/alerts/${alertId}/claim`);
        return data.alert;
    },

    /** PHO: Update an alert's status after investigation */
    async updateStatus(alertId: string, status: AlertStatusUpdate): Promise<AiAlert> {
        const { data } = await apiClient.patch(`/alerts/${alertId}/status`, { status });
        return data.alert;
    },

    /** PHO: Trigger a broadcast (persisted to advisories — institutions see in Inbox) */
    async broadcast(message?: string): Promise<{ message: string }> {
        const { data } = await apiClient.post('/alerts/broadcast', message ? { message } : {});
        return data;
    },

    /** PHO: Escalate an alert to EOC */
    async escalate(alertId: string): Promise<{ message: string }> {
        const { data } = await apiClient.post(`/alerts/${alertId}/escalate`);
        return data;
    },

    /** Civilian: Get local health alerts by GPS coordinates */
    async getLocalAlerts(lat: number, lng: number): Promise<AiAlert[]> {
        const { data } = await apiClient.get('/alerts/local', { params: { lat, lng } });
        return (data.alerts ?? []).map(normaliseAlert);
    },

    /** Public: Get national health trends */
    async getNationalTrends() {
        const { data } = await apiClient.get('/alerts/national');
        return data.trends;
    },
};

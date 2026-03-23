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
    // Joined from sentinel_reports
    sentinel_reports?: {
        patient_count: number;
        symptom_matrix: string[];
        origin_address?: string;
        organization_id: string;
    } | null;
}

export type AlertStatusUpdate = 'probable' | 'confirmed' | 'invalidated';

export const alertsService = {
    /** PHO: Get all pending alerts in the PHO's zone, sorted by CBS score */
    async getInbox(): Promise<AiAlert[]> {
        const { data } = await apiClient.get('/alerts/inbox');
        return data.inbox ?? [];
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

    /** PHO: Trigger a broadcast to civilians in zone */
    async broadcast(): Promise<{ message: string }> {
        const { data } = await apiClient.post('/alerts/broadcast');
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
        return data.alerts ?? [];
    },

    /** Public: Get national health trends */
    async getNationalTrends() {
        const { data } = await apiClient.get('/alerts/national');
        return data.trends;
    },
};

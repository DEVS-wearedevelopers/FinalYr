import { apiClient } from './apiClient';

export interface SubmitReportPayload {
    patientCount: number;
    originLocation: {
        lat: number;
        lng: number;
        address?: string;
    };
    symptomMatrix: string[];
    severity: number;
    notes?: string;
}

export interface SentinelReport {
    id: string;
    created_at: string;
    patient_count: number;
    symptom_matrix: string[];
    severity: number;
    status: string;
    notes?: string;
    origin_address?: string;
}

export const reportsService = {
    async submitReport(payload: SubmitReportPayload) {
        const { data } = await apiClient.post('/reports', payload);
        return data;
    },

    async getReportsFeed(): Promise<SentinelReport[]> {
        const { data } = await apiClient.get('/reports/feed');
        return data.reports ?? [];
    },

    async submitCommunityReport(payload: {
        lga: string;
        symptoms: string[];
        severity: number;
        reporter_name?: string;
        notes?: string;
    }) {
        // No auth header needed — this endpoint is fully public
        const { data } = await apiClient.post('/reports/community', payload);
        return data;
    },
};

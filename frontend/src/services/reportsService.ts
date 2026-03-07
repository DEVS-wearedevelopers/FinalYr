import { apiClient } from './apiClient';

// Temporary mock headers until real JWT auth is wired
const mockHeaders = {
    'X-Mock-Role': 'institution',
    'X-Mock-OrgId': 'test-org-123',
};

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
        const { data } = await apiClient.post('/reports', payload, {
            headers: mockHeaders,
        });
        return data;
    },

    async getReportsFeed(): Promise<SentinelReport[]> {
        const { data } = await apiClient.get('/reports/feed', {
            headers: mockHeaders,
        });
        return data.reports ?? [];
    },
};

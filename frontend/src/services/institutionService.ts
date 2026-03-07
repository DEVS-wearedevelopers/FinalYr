import { apiClient } from './apiClient';

export interface InstitutionRegistrationPayload {
    // Step 1
    facility_name: string;
    facility_type: string;
    registration_number: string;

    // Step 2
    director_full_name: string;
    professional_folio_number: string;
    institutional_email: string;
    phone_number: string;

    // Step 3
    street_address?: string | null;
    city?: string | null;
    state?: string | null;
    lga?: string | null;
    postal_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;

    // Step 4
    data_sharing_consent: boolean;
    accountability_clause: boolean;
}

export const institutionService = {
    async submitRegistration(payload: InstitutionRegistrationPayload) {
        const { data } = await apiClient.post('/institutions/register', payload);
        return data as { message: string; registration: { id: string; status: string } };
    },

    async getRegistration(id: string) {
        const { data } = await apiClient.get(`/institutions/${id}`);
        return data.registration;
    },
};

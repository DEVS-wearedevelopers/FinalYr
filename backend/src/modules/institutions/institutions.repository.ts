import { supabase } from '../../supabase.js';

export interface InstitutionRegistrationRecord {
    facility_name: string;
    facility_type: string;
    registration_number: string;
    director_full_name: string;
    professional_folio_number: string;
    institutional_email: string;
    phone_number: string;
    street_address: string | null;
    city: string | null;
    state: string | null;
    lga: string | null;
    postal_code: string | null;
    latitude: number | null;
    longitude: number | null;
    data_sharing_consent: boolean;
    accountability_clause: boolean;
    status: string;
}

export class InstitutionsRepository {
    async create(record: InstitutionRegistrationRecord) {
        return await supabase
            .from('institution_registrations')
            .insert([{ ...record, status: 'pending', submitted_at: new Date().toISOString() }])
            .select()
            .single();
    }

    async findById(id: string) {
        return await supabase
            .from('institution_registrations')
            .select('*')
            .eq('id', id)
            .single();
    }

    async findAll() {
        return await supabase
            .from('institution_registrations')
            .select('*')
            .order('submitted_at', { ascending: false });
    }

    async updateStatus(id: string, status: string, reviewerNotes?: string) {
        return await supabase
            .from('institution_registrations')
            .update({
                status,
                reviewer_notes: reviewerNotes ?? null,
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();
    }
}

import { z } from 'zod';
import { InstitutionsRepository } from './institutions.repository.js';
import { supabase } from '../../supabase.js';

const BLOCKED_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'];

export const institutionRegistrationSchema = z.object({
    // Step 1
    facility_name: z.string().min(2, 'Facility name is required'),
    facility_type: z.string().min(1, 'Facility type is required'),
    registration_number: z.string().min(1, 'Registration number is required'),

    // Step 2
    director_full_name: z.string().min(2, 'Director full name is required'),
    professional_folio_number: z.string().min(1, 'Professional folio number is required'),
    institutional_email: z.string().email('Invalid email').refine(
        (email) => {
            const domain = email.split('@')[1]?.toLowerCase();
            return domain && !BLOCKED_EMAIL_DOMAINS.includes(domain);
        },
        { message: 'Personal email providers are not allowed. Use an institutional email.' }
    ),
    phone_number: z.string().min(7, 'Phone number is required'),

    // Step 3
    street_address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    lga: z.string().nullable().optional(),
    postal_code: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),

    // Step 4
    data_sharing_consent: z.boolean().refine(v => v === true, { message: 'Data sharing consent is required' }),
    accountability_clause: z.boolean().refine(v => v === true, { message: 'Accountability clause must be accepted' }),
});

export class InstitutionsService {
    constructor(private repo: InstitutionsRepository) { }

    async submitRegistration(body: unknown) {
        const result = institutionRegistrationSchema.safeParse(body);
        if (!result.success) {
            throw new Error(`Validation failed: ${JSON.stringify(result.error.format())}`);
        }

        const { data, error } = await this.repo.create({
            ...result.data,
            street_address: result.data.street_address ?? null,
            city: result.data.city ?? null,
            state: result.data.state ?? null,
            lga: result.data.lga ?? null,
            postal_code: result.data.postal_code ?? null,
            latitude: result.data.latitude ?? null,
            longitude: result.data.longitude ?? null,
            status: 'pending',
        });

        if (error) {
            throw new Error(`DB Error: ${error.message}`);
        }

        return data;
    }

    async getRegistration(id: string) {
        const { data, error } = await this.repo.findById(id);
        if (error) throw new Error(`Not found: ${error.message}`);
        return data;
    }

    async getAllRegistrations() {
        const { data, error } = await this.repo.findAll();
        if (error) throw new Error(`DB Error: ${error.message}`);
        return data;
    }

    async updateStatus(id: string, status: string, reviewerNotes?: string) {
        const allowed = ['pending', 'mdcn_check', 'document_review', 'admin_review', 'approved', 'rejected'];
        if (!allowed.includes(status)) {
            throw new Error(`Invalid status: ${status}`);
        }
        const { data, error } = await this.repo.updateStatus(id, status, reviewerNotes);
        if (error) throw new Error(`Update error: ${error.message}`);

        // ── On approval: provision auth user + link profile ──────────────────
        if (status === 'approved' && data) {
            const reg = data as any;

            // Skip if user was already provisioned
            if (!reg.user_id) {
                // Generate a secure temporary password
                const tempPassword = `Merms@${Math.random().toString(36).slice(2, 10)}`;

                // Create the Supabase auth user
                const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                    email: reg.institutional_email,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: {
                        role: 'institution',
                        organizationId: reg.id,
                        firstName: reg.director_full_name,
                    },
                });

                if (authError || !authData?.user) {
                    // Log but don't fail the status update — admin can retry
                    console.error('[APPROVAL] Failed to create auth user:', authError?.message);
                } else {
                    const newUserId = authData.user.id;

                    // Link the user_id back to the registration row
                    await this.repo.linkUserId(id, newUserId);

                    // Ensure profile has organization_id set (trigger may have created it already)
                    await supabase
                        .from('profiles')
                        .upsert({
                            id: newUserId,
                            email: reg.institutional_email,
                            role: 'institution',
                            first_name: reg.director_full_name,
                            organization_id: reg.id,
                        }, { onConflict: 'id' });

                    console.log(`[APPROVAL] ✅ Institution user provisioned: ${reg.institutional_email} | tempPassword: ${tempPassword}`);
                    console.log(`[APPROVAL] ℹ️  Share temp password with institution securely. They should reset on first login.`);

                    // Return enriched response with temp credentials
                    return { ...data, provisioned_email: reg.institutional_email, temp_password: tempPassword };
                }
            }
        }

        return data;
    }

    // Fields an institution can update without EOC re-verification
    private readonly EDITABLE_FIELDS = [
        'phone_number', 'contact_person_email', 'street_address',
        'city', 'state', 'postal_code', 'bed_capacity',
    ];

    async updateOwnProfile(id: string, body: Record<string, any>) {
        // Strip any fields that require EOC verification — institution cannot self-modify those
        const safe = Object.fromEntries(
            Object.entries(body).filter(([k]) => this.EDITABLE_FIELDS.includes(k))
        );
        if (Object.keys(safe).length === 0) {
            throw new Error('No editable fields provided');
        }
        const { data, error } = await this.repo.updateEditableFields(id, safe);
        if (error) throw new Error(`Update error: ${error.message}`);
        return data;
    }
}

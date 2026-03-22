import { AuthRepository } from './auth.repository.js';
import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['pho', 'institution', 'civilian']).default('civilian'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    organizationId: z.string().optional()
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

export class AuthService {
    constructor(private authRepository: AuthRepository) { }

    async registerUser(body: any) {
        const result = registerSchema.safeParse(body);
        if (!result.success) {
            throw new Error(`Validation failed: ${JSON.stringify(result.error.format())}`);
        }

        const { email, password, role, firstName, lastName, organizationId } = result.data;

        const { data: authData, error: authError } = await this.authRepository.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role, firstName, lastName, organizationId }
        });

        if (authError || !authData.user) {
            throw new Error(`Auth Error: ${authError?.message || 'Failed to create user'}`);
        }

        const { error: dbError } = await this.authRepository.createProfile({
            id: authData.user.id,
            email,
            role,
            first_name: firstName,
            last_name: lastName,
            organization_id: organizationId
        });

        if (dbError) {
            console.error('Error inserting profile:', dbError.message);
        }

        return {
            id: authData.user.id,
            email: authData.user.email,
            role
        };
    }

    async loginUser(body: any) {
        const result = loginSchema.safeParse(body);
        if (!result.success) {
            throw new Error(`Validation failed: ${JSON.stringify(result.error.format())}`);
        }

        const { email, password } = result.data;
        const { data, error } = await this.authRepository.signInWithPassword({ email, password });

        if (error || !data.user || !data.session) {
            throw new Error(`Login Error: ${error?.message || 'Invalid credentials'}`);
        }

        return {
            session: data.session,
            user: data.user
        };
    }
}

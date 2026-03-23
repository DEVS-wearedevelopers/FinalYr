import { supabase } from '../../supabase.js';

export class AuthRepository {
    async createUser(authData: any) {
        return await supabase.auth.admin.createUser(authData);
    }

    async createProfile(profileData: any) {
        return await supabase.from('profiles').insert([profileData]);
    }

    async signInWithPassword(credentials: any) {
        return await supabase.auth.signInWithPassword(credentials);
    }

    async upsertProfile(profileData: any) {
        return await supabase.from('profiles').upsert([profileData], { onConflict: 'id' });
    }
}

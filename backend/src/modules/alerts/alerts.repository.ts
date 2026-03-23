import { supabase } from '../../supabase.js';

export class AlertsRepository {
    /** PHO inbox: all alerts globally.
     *  NOTE: sentinel_reports → institution_registrations have no FK in the schema,
     *  so we fetch only what Supabase can resolve (ai_alerts + sentinel_reports via report_id). */
    async getPhoInbox() {
        return await supabase
            .from('ai_alerts')
            .select(`
                *,
                sentinel_reports (
                    patient_count,
                    symptom_matrix,
                    origin_address,
                    organization_id
                )
            `)
            .neq('status', 'invalidated')
            .order('cbs_score', { ascending: false });
    }

    /** Claim an alert — sets status to 'investigating' and records the PHO */
    async claimAlert(alertId: string, userId: string) {
        return await supabase
            .from('ai_alerts')
            .update({
                status: 'investigating',
                investigated_by: userId,
                investigated_at: new Date().toISOString(),
            })
            .eq('id', alertId)
            .select()
            .single();
    }

    /** Update alert status — only the PHO who claimed it can update */
    async updateAlertStatus(alertId: string, userId: string, status: string) {
        return await supabase
            .from('ai_alerts')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', alertId)
            .eq('investigated_by', userId)
            .select()
            .single();
    }

    /** Escalate: mark alert as probable (signals EOC) */
    async escalateAlert(alertId: string) {
        return await supabase
            .from('ai_alerts')
            .update({ status: 'probable' })
            .eq('id', alertId)
            .select()
            .single();
    }

    /** National trends: count alerts by status from the last 30 days */
    async getNationalTrendCounts() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return await supabase
            .from('ai_alerts')
            .select('status, cbs_score, zone_id', { count: 'exact' })
            .gte('created_at', thirtyDaysAgo.toISOString());
    }

    /** Civilian: return confirmed/probable alerts, ordered by severity.
     *  Spatial filtering will be added when PostGIS is enabled. */
    async getLocalAlerts() {
        return await supabase
            .from('ai_alerts')
            .select('*, sentinel_reports(patient_count, symptom_matrix, origin_address)')
            .in('status', ['probable', 'confirmed'])
            .order('cbs_score', { ascending: false })
            .limit(20);
    }

    /** PHO broadcast: persist advisory to DB so institutions see it in Inbox */
    async insertAdvisory(advisory: {
        issued_by: string;
        message: string;
        severity: 'ADVISORY' | 'WARNING' | 'CRITICAL';
        zone_id: string;
        dismissed: boolean;
    }) {
        return await supabase
            .from('advisories')
            .insert([advisory]);
    }

    /** PHO Inbox: advisories from EOC (no facility_id = global / cross-role message) */
    async getPhoAdvisories() {
        return await supabase
            .from('advisories')
            .select('*')
            .eq('dismissed', false)
            .order('created_at', { ascending: false });
    }
}

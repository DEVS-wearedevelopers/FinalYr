import { supabase } from '../../supabase.js';

export class AlertsRepository {
    /** PHO inbox: all alerts in the PHO's zone, CBS descending, with joined report data */
    async getPhoInbox(zoneId: string) {
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
            .eq('zone_id', zoneId)
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
}

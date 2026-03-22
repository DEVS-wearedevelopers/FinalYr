import { supabase } from '../../supabase.js';

export class ReportsRepository {
    async insertSentinelReport(reportData: any) {
        return await supabase.from('sentinel_reports').insert([reportData]).select().single();
    }

    async getRecentReportCount(organizationId: string, sinceDate: string) {
        return await supabase
            .from('sentinel_reports')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .gte('created_at', sinceDate);
    }

    async insertAiAlert(alertData: any) {
        return await supabase.from('ai_alerts').insert([alertData]);
    }

    async getReportsFeed(organizationId: string) {
        return await supabase
            .from('sentinel_reports')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });
    }

    async updateFacilityLastReportAt(facilityId: string) {
        return await supabase
            .from('facilities')
            .update({ last_report_at: new Date().toISOString() })
            .eq('id', facilityId);
    }

    async getFacilityAnalytics(facilityId: string) {
        const { data: facility } = await supabase
            .from('facilities')
            .select('data_quality_score')
            .eq('id', facilityId)
            .maybeSingle();

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const { data: reports } = await supabase
            .from('sentinel_reports')
            .select('created_at')
            .eq('organization_id', facilityId)
            .gte('created_at', sixtyDaysAgo.toISOString());

        let thisMonth = 0;
        let lastMonth = 0;
        const now = new Date();

        reports?.forEach(r => {
             const d = new Date(r.created_at);
             if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
                 thisMonth++;
             } else {
                 lastMonth++;
             }
        });

        return {
             dataQualityScore: facility?.data_quality_score || 100,
             reportsThisMonth: thisMonth,
             reportsLastMonth: lastMonth,
             eocFlags: []
        };
    }

    async getActiveAdvisory(facilityId: string) {
        const { data } = await supabase
            .from('advisories')
            .select('*')
            .eq('facility_id', facilityId)
            .eq('dismissed', false)
            .order('created_at', { ascending: false })
            .limit(1);
        return data?.[0] || null;
    }
}

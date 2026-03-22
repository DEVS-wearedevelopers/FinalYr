import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PreventionCard } from '@/components/civilian/PreventionCard';
import { apiClient } from '@/services/apiClient';

export default function CivilianPulse() {
    const [report, setReport] = useState<any>(null);
    const [trends, setTrends] = useState<any[]>([]);
    const [preventions, setPreventions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPulseData = async () => {
            setLoading(true);
            try {
                // 1. Fetch latest article
                const { data: reportData } = await apiClient.get('/articles?published=true&limit=1&sort=created_at,desc');
                setReport(Array.isArray(reportData) && reportData.length > 0 ? reportData[0] : null);

                // 2. Fetch trailing 7-day alert trends
                const zoneId = localStorage.getItem('civ_zone') || 'sw';
                const { data: trendData } = await apiClient.get(`/alerts/trends?zone_id=${zoneId}&days=7`);
                setTrends(Array.isArray(trendData) ? trendData.slice(0, 3) : []);

                // 3. Fetch prevention tips
                const { data: tipData } = await apiClient.get('/articles?published=true&type=PREVENTION&limit=6');
                setPreventions(Array.isArray(tipData) ? tipData : []);

            } catch {
                setReport(null);
                setTrends([]);
                setPreventions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPulseData();
    }, []);

    const mapEnumToCondition = (type: string) => {
        const t = type?.toUpperCase();
        if (t === 'RESPIRATORY') return 'Respiratory Illness';
        if (t === 'ENTERIC') return 'Digestive Illness';
        if (t === 'NEUROLOGICAL') return 'Neurological Symptoms';
        if (t === 'HEMORRHAGIC') return 'Urgent: Hemorrhagic Symptoms';
        if (t === 'DERMAL') return 'Skin Condition';
        return 'General Health Concern';
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20">
            <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-slate-200 mb-6">
                <Link href="/dashboard/civilian" className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#1e52f1] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <span className="font-bold text-slate-900 tracking-tight text-lg">MERMS</span>
                </Link>
                <div className="flex gap-4">
                    <Link href="/dashboard/civilian/alerts" className="text-sm font-medium text-slate-600 hover:text-[#1e52f1]">Alert Feed</Link>
                    <Link href="/dashboard/civilian/notifications" className="text-sm font-medium text-slate-600 hover:text-[#1e52f1]">Preferences</Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 space-y-10">
                {/* Block 1 — This Week's Report */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 px-1">This Week's Report</h2>
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        {loading ? (
                            <p className="text-sm text-slate-500 animate-pulse">Loading report...</p>
                        ) : report ? (
                            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 font-sans">
                                {report.content_markdown || report.content}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-600 font-medium italic">
                                This week's health report is being prepared. Check back soon.
                            </p>
                        )}
                    </div>
                </section>

                {/* Block 2 — Trending Conditions */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 px-1">Trending Conditions</h2>
                    <div className="flex flex-col gap-3">
                        {loading ? (
                            <p className="text-sm text-slate-500 animate-pulse px-1">Analyzing zone data...</p>
                        ) : trends.length > 0 ? (
                            trends.slice(0, 3).map((trend, idx) => (
                                <div key={idx} className="bg-white border-l-4 border-[#1e52f1] border-slate-200 rounded-lg p-4 shadow-sm">
                                    <span className="font-bold text-slate-800 tracking-tight text-sm">
                                        {idx + 1}. {mapEnumToCondition(trend.category || trend.type)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <p className="font-semibold text-slate-600 text-sm">No significant health trends in your area currently.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Block 3 — Prevention Cards */}
                {!loading && preventions.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4 px-1">Prevention Guidelines</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {preventions.map((p, i) => (
                                <PreventionCard
                                    key={i}
                                    title={p.title || 'Health Tip'}
                                    tip={p.summary || p.content_markdown || 'Maintain standard precautions.'}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

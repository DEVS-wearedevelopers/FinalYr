'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { alertsService } from '@/services/alertsService';

const CivilianMap = dynamic(() => import('./CivilianMap'), { ssr: false });

// ── Types ──────────────────────────────────────────────────────────────────────
type Alert = {
    id: string; cbs_score: number; severity_index: number;
    status: 'pending_investigation' | 'investigating' | 'probable' | 'confirmed' | 'invalidated';
    zone_id: string; created_at: string;
    sentinel_reports?: { patient_count: number; symptom_matrix: string[]; origin_address?: string } | null;
};
type NationalTrends = { totalAlerts: number; confirmed: number; investigating: number; probable: number; avgCbs: number };

// ── Severity helpers ───────────────────────────────────────────────────────────
function riskLevel(cbs: number) {
    if (cbs >= 0.8) return { label: 'High Risk',    bg: 'bg-red-600',    light: 'bg-red-50 border-red-200',    text: 'text-red-700',    icon: '🚨', pulse: 'animate-pulse' };
    if (cbs >= 0.5) return { label: 'Elevated',     bg: 'bg-amber-500',  light: 'bg-amber-50 border-amber-200',  text: 'text-amber-700',  icon: '⚠️', pulse: '' };
    return          { label: 'Low Risk',    bg: 'bg-green-500',  light: 'bg-green-50 border-green-200',  text: 'text-green-700',  icon: '✅', pulse: '' };
}

function rel(iso: string) {
    const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
    if (h < 1)   return 'Less than 1 hour ago';
    if (h < 24)  return `${h} hour${h > 1 ? 's' : ''} ago`;
    return `${Math.floor(h / 24)} day${Math.floor(h / 24) > 1 ? 's' : ''} ago`;
}

const STATUS_TEXT: Record<string, string> = {
    pending_investigation: 'Being assessed',
    investigating:         'Under PHO review',
    probable:              'Probable concern',
    confirmed:             'Confirmed — Take action',
    invalidated:           'Cleared — No concern',
};

// ── Location permission state ─────────────────────────────────────────────────
type GeoState = 'idle' | 'loading' | 'granted' | 'denied';

// ── National Trend mini-chart ─────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
    return (
        <div className={`rounded-2xl border p-5 flex flex-col gap-1 ${color}`}>
            <p className="text-3xl font-black">{value}</p>
            <p className="text-sm font-bold opacity-80">{label}</p>
            {sub && <p className="text-xs opacity-60">{sub}</p>}
        </div>
    );
}

// ── Alert Card ────────────────────────────────────────────────────────────────
function AlertCard({ alert }: { alert: Alert }) {
    const [expanded, setExpanded] = useState(false);
    const risk = riskLevel(alert.cbs_score);
    const symptoms = alert.sentinel_reports?.symptom_matrix ?? [];
    return (
        <div className={`rounded-2xl border-2 transition-all ${risk.light} ${risk.pulse}`}>
            <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{risk.icon}</span>
                            <span className={`text-sm font-black ${risk.text}`}>{risk.label}</span>
                            {alert.status === 'confirmed' && (
                                <span className="text-xs font-bold bg-red-600 text-white px-2.5 py-1 rounded-full animate-pulse">CONFIRMED</span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500">{rel(alert.created_at)} · {STATUS_TEXT[alert.status] ?? alert.status}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className={`text-2xl font-black ${risk.text}`}>{alert.cbs_score.toFixed(2)}</p>
                        <p className="text-xs text-slate-400">risk score</p>
                    </div>
                </div>

                {/* Symptoms */}
                <div className="mb-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reported Symptoms</p>
                    <div className="flex flex-wrap gap-1.5">
                        {symptoms.length > 0 ? symptoms.map(s => (
                            <span key={s} className="text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-medium shadow-sm">{s}</span>
                        )) : <span className="text-xs text-slate-400">No details available</span>}
                    </div>
                </div>

                {/* Location */}
                {alert.sentinel_reports?.origin_address && (
                    <div className="flex items-center gap-2 mb-4">
                        <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                        <span className="text-xs text-slate-600">{alert.sentinel_reports.origin_address}</span>
                    </div>
                )}

                {/* What to do — expanded */}
                <button onClick={() => setExpanded(e => !e)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
                    {expanded ? 'Hide advice' : 'What should I do?'}
                    <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
            </div>

            {expanded && (
                <div className="px-5 pb-5 border-t border-white/60 pt-4 space-y-2">
                    {alert.status === 'confirmed' ? (
                        <ul className="space-y-1.5 text-sm text-slate-700">
                            <li>🏥 <strong>Visit your nearest health centre</strong> if you experience any of these symptoms</li>
                            <li>🚫 Avoid crowded places where possible</li>
                            <li>🧼 Wash hands frequently with soap and water for at least 20 seconds</li>
                            <li>💊 Do <strong>not</strong> self-medicate — seek professional advice</li>
                            <li>📞 If symptoms are severe, call your local health emergency line immediately</li>
                        </ul>
                    ) : alert.status === 'probable' ? (
                        <ul className="space-y-1.5 text-sm text-slate-700">
                            <li>👀 <strong>Monitor yourself</strong> for any symptoms listed above</li>
                            <li>🧼 Practice proper hygiene and hand washing</li>
                            <li>🏥 See a doctor early if you develop symptoms — don't wait</li>
                            <li>ℹ️ Authorities are investigating — no widespread alarm yet</li>
                        </ul>
                    ) : (
                        <ul className="space-y-1.5 text-sm text-slate-700">
                            <li>ℹ️ This alert is still being reviewed by health authorities</li>
                            <li>🧼 Continue normal hygiene practices</li>
                            <li>👀 Stay informed via this dashboard for updates</li>
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CivilianDashboard() {
    const router = useRouter();

    // State
    const [alerts, setAlerts]         = useState<Alert[]>([]);
    const [trends, setTrends]         = useState<NationalTrends | null>(null);
    const [geoState, setGeoState]     = useState<GeoState>('idle');
    const [coords, setCoords]         = useState<{ lat: number; lng: number } | null>(null);
    const [alertsLoading, setAlertsLoading] = useState(false);
    const [alertsError, setAlertsError]     = useState('');
    const [trendsLoaded, setTrendsLoaded]   = useState(false);

    const handleLogout = () => { localStorage.removeItem('token'); router.push('/login'); };

    // Load national trends on mount
    useEffect(() => {
        alertsService.getNationalTrends()
            .then(t => { setTrends(t); setTrendsLoaded(true); })
            .catch(() => setTrendsLoaded(true));
    }, []);

    // Request location and load local alerts
    const requestLocation = useCallback(() => {
        setGeoState('loading');
        if (!navigator.geolocation) {
            setGeoState('denied');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async pos => {
                const { latitude, longitude } = pos.coords;
                setCoords({ lat: latitude, lng: longitude });
                setGeoState('granted');
                setAlertsLoading(true);
                setAlertsError('');
                try {
                    const data = await alertsService.getLocalAlerts(latitude, longitude);
                    setAlerts(data);
                } catch (e: any) {
                    setAlertsError(e?.response?.data?.details || 'Failed to load local alerts');
                } finally {
                    setAlertsLoading(false);
                }
            },
            () => setGeoState('denied'),
            { timeout: 8000 }
        );
    }, []);

    const hasHighRisk = alerts.some(a => a.cbs_score >= 0.8);
    const hasActive   = alerts.some(a => a.status !== 'invalidated');

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm">
                <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-[#1e52f1] rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z" /></svg>
                        </div>
                        <span className="font-bold text-base tracking-tight text-slate-900">MERMS</span>
                        <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full">Community Health</span>
                    </div>
                    <button onClick={handleLogout} className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sign out
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-5 py-8 space-y-8">
                {/* Hero greeting */}
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Health Alerts Near You</h1>
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                        Know what's happening in your community. Real-time data from verified health facilities in Lagos.
                    </p>
                </div>

                {/* Live map — verified reports only */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold text-slate-900">Active Report Map</h2>
                        <span className="text-xs bg-green-50 border border-green-200 text-green-700 font-semibold px-2.5 py-1 rounded-full">✓ Verified only</span>
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                        <CivilianMap />
                    </div>
                </section>

                {/* High-risk global banner */}
                {hasHighRisk && (
                    <div className="rounded-2xl bg-red-600 text-white p-5 flex items-start gap-4 animate-pulse">
                        <div className="text-2xl">🚨</div>
                        <div>
                            <p className="font-black text-base">Confirmed Health Concern in Your Area</p>
                            <p className="text-sm text-red-100 mt-1">Health authorities have confirmed a public health concern near you. Scroll down to see details and advice.</p>
                        </div>
                    </div>
                )}

                {/* Location permission box */}
                {geoState === 'idle' && (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                        <div className="w-14 h-14 bg-[#1e52f1]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-[#1e52f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                        </div>
                        <h2 className="text-base font-bold text-slate-900 mb-1.5">See alerts near you</h2>
                        <p className="text-sm text-slate-500 mb-5">Share your location to see health alerts relevant to where you are right now.</p>
                        <button onClick={requestLocation}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e52f1] text-white font-bold text-sm rounded-xl hover:bg-[#1640cc] transition-all shadow-lg shadow-[#1e52f1]/25">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                            Allow location access
                        </button>
                        <p className="text-xs text-slate-400 mt-3">Your location is only used to find nearby alerts — it is never stored.</p>
                    </div>
                )}

                {geoState === 'loading' && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                        <div className="w-8 h-8 border-2 border-[#1e52f1] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm font-semibold text-slate-600">Getting your location…</p>
                    </div>
                )}

                {geoState === 'denied' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                        <div>
                            <p className="text-sm font-bold text-amber-800">Location access denied</p>
                            <p className="text-xs text-amber-700 mt-1">Enable location in your browser settings to see local alerts. You can still view national trends below.</p>
                            <button onClick={requestLocation} className="text-xs font-semibold text-amber-700 underline mt-2">Try again</button>
                        </div>
                    </div>
                )}

                {/* Local alerts list */}
                {geoState === 'granted' && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Alerts Near You</h2>
                                {coords && (
                                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                                        {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)} · <span className={hasActive ? 'text-amber-600 font-semibold' : 'text-green-600 font-semibold'}>{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</span>
                                    </p>
                                )}
                            </div>
                            <button onClick={requestLocation} className="text-xs font-semibold text-[#1e52f1] flex items-center gap-1 hover:underline">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                Refresh
                            </button>
                        </div>

                        {alertsLoading && (
                            <div className="flex justify-center py-10">
                                <div className="w-6 h-6 border-2 border-[#1e52f1] border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}

                        {alertsError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{alertsError}</div>
                        )}

                        {!alertsLoading && !alertsError && alerts.length === 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-7 text-center">
                                <p className="text-3xl mb-2">✅</p>
                                <p className="font-bold text-green-800 text-base">Area Clear</p>
                                <p className="text-sm text-green-700 mt-1">No active health alerts reported near your current location.</p>
                            </div>
                        )}

                        {!alertsLoading && alerts.length > 0 && (
                            <div className="space-y-4">
                                {alerts.map(a => <AlertCard key={a.id} alert={a} />)}
                            </div>
                        )}
                    </section>
                )}

                {/* ── National Trends ───────────────────────────────────────────────── */}
                <section>
                    <h2 className="text-base font-bold text-slate-900 mb-4">National Health Trends</h2>
                    {!trendsLoaded ? (
                        <div className="grid grid-cols-2 gap-3">
                            {[0, 1, 2, 3].map(i => <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 h-24 animate-pulse" />)}
                        </div>
                    ) : trends ? (
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard label="Total Alerts (30 days)" value={trends.totalAlerts} color="bg-white border-slate-200 text-slate-900" />
                            <StatCard label="Confirmed Outbreaks" value={trends.confirmed} sub="Requires action" color={trends.confirmed > 0 ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"} />
                            <StatCard label="Under PHO Review" value={trends.investigating} sub="Being investigated" color="bg-blue-50 border-blue-200 text-blue-700" />
                            <StatCard label="Avg Risk Score" value={trends.avgCbs} sub="National average" color={trends.avgCbs >= 0.6 ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-green-50 border-green-200 text-green-700"} />
                        </div>
                    ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center text-sm text-slate-400">Trends unavailable</div>
                    )}
                </section>

                {/* ── Stay Safe tips ───────────────────────────────────────────────── */}
                <section>
                    <h2 className="text-base font-bold text-slate-900 mb-4">General Health Advice</h2>
                    <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
                        {[
                            { icon: '🧼', tip: 'Wash hands with soap and water for at least 20 seconds', detail: 'Especially before eating, after using the bathroom, and after coughing or sneezing.' },
                            { icon: '😷', tip: 'Wear a mask in crowded or enclosed spaces', detail: 'Particularly relevant when an alert is active in your area.' },
                            { icon: '🏥', tip: 'Seek medical help early', detail: "Don't wait for symptoms to become severe. Early treatment is more effective." },
                            { icon: '💧', tip: 'Stay hydrated', detail: 'Drink clean, treated water. Report unusual water quality to your local authorities.' },
                            { icon: '📢', tip: 'Share, don\'t panic', detail: 'Share verified health alerts with family and friends, not rumours or unverified sources.' },
                        ].map(({ icon, tip, detail }) => (
                            <div key={tip} className="flex items-start gap-4 px-5 py-4">
                                <span className="text-2xl shrink-0">{icon}</span>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{tip}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Emergency contacts */}
                <section>
                    <h2 className="text-base font-bold text-slate-900 mb-4">Emergency Contacts</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { label: 'NCDC Emergency Hotline',        number: '0800 970 0010', tag: 'Nigeria CDC', color: 'bg-red-50 border-red-200' },
                            { label: 'Lagos State Health Helpline',    number: '08023169485',   tag: 'Lagos State', color: 'bg-blue-50 border-blue-200' },
                            { label: 'General Emergency Services',     number: '112',           tag: '24/7',        color: 'bg-green-50 border-green-200' },
                        ].map(({ label, number, tag, color }) => (
                            <a key={label} href={`tel:${number.replace(/\s/g, '')}`}
                                className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all hover:shadow-md ${color}`}>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{label}</p>
                                    <p className="text-xs text-slate-500">{tag}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-slate-700">{number}</span>
                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" /></svg>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <footer className="text-center text-xs text-slate-300 pt-4 pb-8 space-y-1">
                    <p className="font-semibold">MERMS — Medical Emergency Reporting & Monitoring System</p>
                    <p>Data sourced from verified health facilities. Alerts reviewed by licensed Public Health Officers.</p>
                </footer>
            </main>
        </div>
    );
}

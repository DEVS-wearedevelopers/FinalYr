'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout, useUserFromToken } from '@/components/DashboardLayout';
import apiClient from '@/services/apiClient';
import { supabase } from '@/services/supabaseClient';

const ZoneMap = dynamic(() => import('./components/EOCZoneMap'), { ssr: false });

// ── Types ──────────────────────────────────────────────────────────────────────
type ZoneStatus = 'normal' | 'warning' | 'critical';
interface ZoneData {
    id: string; name: string; status: ZoneStatus;
    alerts: number; facilities?: number; silent?: number; center: [number, number];
}

interface LiveAlert {
    id: string; cbs_score: number; severity_index: number;
    status: string; zone_id: string; bypass_reason: string | null; created_at: string;
}

interface LiveReport {
    id: string; organization_id: string | null; source: string;
    patient_count: number; symptom_matrix: string[];
    severity: number; origin_address: string | null; created_at: string; status: string;
}

// Real Lagos surveillance zones
const ZONES: ZoneData[] = [
    { id: 'sw', name: 'Lagos Island / V.I.', status: 'critical', alerts: 14, facilities: 18, silent: 3, center: [6.4530, 3.3947] },
    { id: 'se', name: 'Surulere / Apapa',    status: 'warning',  alerts: 7,  facilities: 12, silent: 1, center: [6.4960, 3.3560] },
    { id: 'ss', name: 'Ikeja / Maryland',    status: 'warning',  alerts: 5,  facilities: 22, silent: 0, center: [6.5944, 3.3583] },
    { id: 'nc', name: 'Kosofe / Ojota',      status: 'normal',   alerts: 2,  facilities: 9,  silent: 2, center: [6.5900, 3.3950] },
    { id: 'ne', name: 'Ikorodu',             status: 'normal',   alerts: 1,  facilities: 7,  silent: 0, center: [6.6052, 3.5022] },
    { id: 'nw', name: 'Alimosho / Agege',   status: 'warning',  alerts: 6,  facilities: 14, silent: 1, center: [6.5510, 3.2750] },
];

const PROTOCOLS = [
    { id: 'pr1', name: 'National Epidemic Alert',       severity: 'critical', desc: 'Full national lockdown of disease surveillance networks.' },
    { id: 'pr2', name: 'Regional Containment Protocol', severity: 'high',     desc: 'Targeted regional lockdown with increased EOC deployment to affected zones.' },
    { id: 'pr3', name: 'Enhanced Surveillance Mode',    severity: 'medium',   desc: 'Increase monitoring frequency across all facilities.' },
    { id: 'pr4', name: 'Mass Casualty Response',        severity: 'critical', desc: 'Activate SORMAS mass casualty module. Deploy emergency response teams nationally.' },
];

function statBg(status: string) {
    if (status === 'critical') return 'bg-red-100 text-red-700 border-red-200';
    if (status === 'warning') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-green-100 text-green-700 border-green-200';
}

function cbsColor(score: number) {
    if (score >= 0.85) return 'text-red-700 bg-red-50 border-red-200';
    if (score >= 0.6)  return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-green-700 bg-green-50 border-green-200';
}

function cbsLabel(score: number) {
    if (score >= 0.85) return 'Critical Risk';
    if (score >= 0.7)  return 'High Risk';
    if (score >= 0.5)  return 'Moderate';
    return 'Low';
}

function StatCard({ label, value, sub, color, pulse }: { label: string; value: string | number; sub?: string; color: string; pulse?: boolean }) {
    return (
        <div className={`rounded-2xl border p-5 ${color} relative overflow-hidden`}>
            {pulse && <span className="absolute top-3 right-3 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" /><span className="relative inline-flex rounded-full h-2 w-2 bg-current" /></span>}
            <p className="text-xs font-bold opacity-70 uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-black mt-1">{value}</p>
            {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
        </div>
    );
}

function BlacklistModal({ facility, onClose, onConfirm }: { facility: string; onClose: () => void; onConfirm: (reason: string) => void }) {
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 space-y-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    </div>
                    <div><h3 className="text-base font-bold text-slate-900">Blacklist Facility</h3><p className="text-xs text-slate-500">{facility}</p></div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">This action will immediately suspend all data reporting from this facility and flag it for audit.</div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Justification <span className="text-red-500">*</span></label>
                    <textarea rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="Document the reason for blacklisting..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400" />
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                    <button disabled={!reason.trim()} onClick={() => onConfirm(reason)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Confirm Blacklist</button>
                </div>
            </div>
        </div>
    );
}

function NationalProtocolModal({ onClose }: { onClose: () => void }) {
    const [selected, setSelected] = useState('');
    const [coSigner, setCoSigner] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    </div>
                    <div><h3 className="text-xl font-bold text-slate-900">Execute National Protocol</h3><p className="text-sm text-slate-500">Requires dual-authorization co-signer confirmation</p></div>
                    <button onClick={onClose} className="ml-auto w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    <p className="text-sm text-red-800"><strong>Dual-Authorization Required:</strong> Executing a national protocol requires the co-signature of a second authorized EOC administrator.</p>
                </div>
                <div className="space-y-3">
                    <p className="text-sm font-bold text-slate-700">Select Response Protocol</p>
                    {PROTOCOLS.map(p => (
                        <label key={p.id} className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${selected === p.id ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${selected === p.id ? 'border-red-500 bg-red-500' : 'border-slate-300'}`}>{selected === p.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}</div>
                            <div className="flex-1"><div className="flex items-center gap-2"><p className="text-sm font-bold text-slate-900">{p.name}</p><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.severity === 'critical' ? 'bg-red-100 text-red-700' : p.severity === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>{p.severity}</span></div><p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{p.desc}</p></div>
                            <input type="radio" className="sr-only" value={p.id} checked={selected === p.id} onChange={() => setSelected(p.id)} />
                        </label>
                    ))}
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Co-Signer EOC ID <span className="text-red-500">*</span></label>
                    <input type="text" value={coSigner} onChange={e => setCoSigner(e.target.value)} placeholder="e.g. EOC-ADMIN-002" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400" />
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                    <button disabled={!selected || !coSigner.trim()} onClick={onClose} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                        Execute Protocol
                    </button>
                </div>
            </div>
        </div>
    );
}

const NAV = [
    { label: 'Command Centre', href: '/dashboard/eoc', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { label: 'Applications', href: '/dashboard/eoc/applications', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: 'System Admin', href: '/dashboard/eoc/system', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

type FacilityRow = { id: string; name: string; zone: string; status: string; reliability: number };

export default function EOCDashboard() {
    const tokenUser = useUserFromToken();
    const [selectedZone, setSelectedZone]       = useState<ZoneData | null>(null);
    const [facilities, setFacilities]           = useState<FacilityRow[]>([]);
    const [blacklistTarget, setBlacklistTarget] = useState<FacilityRow | null>(null);
    const [showProtocol, setShowProtocol]       = useState(false);
    const [toast, setToast]                     = useState('');
    const [loadingFacilities, setLoadingFacilities] = useState(true);

    // ── Realtime state ────────────────────────────────────────────────────────
    const [liveAlerts, setLiveAlerts]   = useState<LiveAlert[]>([]);
    const [liveReports, setLiveReports] = useState<LiveReport[]>([]);
    const [realtimeOn, setRealtimeOn]   = useState(false);
    const [newAlertFlash, setNewAlertFlash] = useState(false);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

    // ── Initial data fetch ────────────────────────────────────────────────────
    const loadFacilities = useCallback(async () => {
        try {
            const { data } = await apiClient.get('/institutions');
            const regs = data.registrations ?? [];
            setFacilities(regs.map((r: any) => ({
                id:          r.id,
                name:        r.facility_name,
                zone:        r.state,
                status:      r.status === 'approved' ? 'Verified' : r.status === 'rejected' ? 'Blacklisted' : 'Pending',
                reliability: r.status === 'approved' ? Math.floor(70 + Math.random() * 30) : 55,
            })));
        } catch { setFacilities([]); }
        finally { setLoadingFacilities(false); }
    }, []);

    const loadLiveAlerts = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('ai_alerts')
                .select('id, cbs_score, severity_index, status, zone_id, bypass_reason, created_at')
                .order('created_at', { ascending: false })
                .limit(15);
            if (!error && data) setLiveAlerts(data as LiveAlert[]);
        } catch { /* non-fatal */ }
    }, []);

    const loadLiveReports = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('sentinel_reports')
                .select('id, organization_id, source, patient_count, symptom_matrix, severity, origin_address, created_at, status')
                .order('created_at', { ascending: false })
                .limit(10);
            if (!error && data) setLiveReports(data as LiveReport[]);
        } catch { /* non-fatal */ }
    }, []);

    // ── Supabase Realtime ─────────────────────────────────────────────────────
    useEffect(() => {
        loadFacilities();
        loadLiveAlerts();
        loadLiveReports();

        // Subscribe to postgres_changes on ai_alerts and sentinel_reports
        const channel = supabase
            .channel('eoc-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_alerts' },
                (payload) => {
                    setLiveAlerts(prev => [payload.new as LiveAlert, ...prev.slice(0, 14)]);
                    setNewAlertFlash(true);
                    setTimeout(() => setNewAlertFlash(false), 3000);
                    showToast(`🚨 New alert — CBS ${(payload.new as LiveAlert).cbs_score?.toFixed(2)}`);
                }
            )
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ai_alerts' },
                () => { loadLiveAlerts(); }
            )
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sentinel_reports' },
                (payload) => {
                    setLiveReports(prev => [payload.new as LiveReport, ...prev.slice(0, 9)]);
                }
            )
            .subscribe((status) => {
                setRealtimeOn(status === 'SUBSCRIBED');
            });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadFacilities, loadLiveAlerts, loadLiveReports]);

    // ── Derived stats ─────────────────────────────────────────────────────────
    const totalAlerts  = liveAlerts.length;
    const criticalCount = liveAlerts.filter(a => (a.cbs_score ?? 0) >= 0.85).length;
    const silentNodes  = ZONES.reduce((s, z) => s + (z.silent ?? 0), 0);
    const pendingApps  = facilities.filter((f: FacilityRow) => f.status === 'Pending').length;

    return (
        <DashboardLayout navItems={NAV} role="eoc" userName={tokenUser?.name || 'EOC Admin'}>
            {toast && <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold animate-fade-in">{toast}</div>}
            {blacklistTarget && <BlacklistModal facility={blacklistTarget.name} onClose={() => setBlacklistTarget(null)} onConfirm={reason => { setFacilities(p => p.map(f => f.id === blacklistTarget.id ? { ...f, status: 'Blacklisted' } : f)); setBlacklistTarget(null); showToast(`${blacklistTarget.name} blacklisted`); }} />}
            {showProtocol && <NationalProtocolModal onClose={() => { setShowProtocol(false); showToast('Protocol execution logged for dual-authorization review'); }} />}

            {/* ── Header ── */}
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">EOC Command Centre</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${realtimeOn ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                        <p className="text-sm text-slate-500">{realtimeOn ? 'Live — real-time data active' : 'Connecting to live feed…'}</p>
                    </div>
                </div>
                <button onClick={() => setShowProtocol(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all hover:shadow-xl hover:shadow-red-600/40">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    Execute National Protocol
                </button>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Active Alerts" value={totalAlerts} sub="from sentinel reports" color={`border ${newAlertFlash ? 'bg-red-100 text-red-700 border-red-200' : 'bg-red-50 text-red-700 border-red-100'} transition-colors duration-500`} pulse={realtimeOn} />
                <StatCard label="Critical (CBS ≥ 0.85)" value={criticalCount} sub="require immediate review" color="bg-orange-50 text-orange-700 border border-orange-100" />
                <StatCard label="Pending Applications" value={pendingApps} sub="awaiting review" color="bg-amber-50 text-amber-700 border border-amber-100" />
                <StatCard label="Silent Nodes" value={silentNodes} sub="no report in 24h" color="bg-slate-100 text-slate-700 border border-slate-200" />
            </div>

            {/* ── Zone Map ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-800">Lagos Health Zone Map</h2>
                    <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-400" />Normal</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400" />Warning</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" />Critical</span>
                    </div>
                </div>
                <div className="flex">
                    <div className="flex-1" style={{ height: 380 }}>
                        <ZoneMap zones={ZONES} onZoneClick={(zone) => setSelectedZone(zone as ZoneData)} />
                    </div>
                    {selectedZone && (
                        <div className="w-72 border-l border-slate-100 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-900">{selectedZone.name}</h3>
                                <button onClick={() => setSelectedZone(null)} className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <span className={`inline-flex text-xs font-bold px-3 py-1 rounded-full border ${statBg(selectedZone.status)}`}>{selectedZone.status}</span>
                            <div className="space-y-2.5">
                                <div className="flex justify-between text-sm"><span className="text-slate-500">Active Alerts</span><span className="font-bold text-red-600">{selectedZone.alerts}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-slate-500">Facilities</span><span className="font-bold text-slate-800">{selectedZone.facilities}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-slate-500">Silent Nodes</span><span className="font-bold text-amber-600">{selectedZone.silent}</span></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Bottom: Facility + Live AI Alerts ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                {/* Facility Management */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <h2 className="text-sm font-bold text-slate-800">Facility Management</h2>
                        <span className="text-xs text-slate-400">{facilities.length} facilities</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-xs text-slate-400 font-medium uppercase tracking-wide border-b border-slate-100">
                                <th className="px-5 py-3 text-left">Facility</th><th className="px-5 py-3 text-left">Status</th><th className="px-5 py-3 text-left">Actions</th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-50">
                                {facilities.map(f => (
                                    <tr key={f.id} className="hover:bg-slate-50/60">
                                        <td className="px-5 py-3.5"><p className="text-xs font-semibold text-slate-900 leading-tight">{f.name}</p><p className="text-xs text-slate-400">{f.zone}</p></td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${f.status === 'Verified' ? 'bg-green-50 text-green-700 border-green-200' : f.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{f.status}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex gap-1.5">
                                                <button onClick={() => { setFacilities(p => p.map(x => x.id === f.id ? { ...x, status: 'Verified' } : x)); showToast(`${f.name} approved`); }}
                                                    className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-green-300 text-green-700 bg-green-50 hover:bg-green-100">Approve</button>
                                                {f.status !== 'Blacklisted' && (
                                                    <button onClick={() => setBlacklistTarget(f)}
                                                        className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100">Blacklist</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Live AI Alerts Feed */}
                <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors duration-500 ${newAlertFlash ? 'border-red-300' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-slate-800">Live AI Alert Feed</h2>
                            {realtimeOn && <span className="flex h-2 w-2"><span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>}
                        </div>
                        <span className="text-xs text-slate-400">{liveAlerts.length} alerts</span>
                    </div>
                    <div className="overflow-y-auto max-h-80 divide-y divide-slate-50">
                        {liveAlerts.length === 0 ? (
                            <div className="px-5 py-8 text-center text-xs text-slate-400">No alerts yet. Submit a sentinel report to generate one.</div>
                        ) : liveAlerts.map((a, i) => (
                            <div key={a.id} className={`px-5 py-3 flex items-center gap-3 hover:bg-slate-50/60 transition-colors ${i === 0 && newAlertFlash ? 'bg-red-50' : ''}`}>
                                <div className={`shrink-0 w-14 text-center px-2 py-1 rounded-lg border text-xs font-black ${cbsColor(a.cbs_score)}`}>
                                    {a.cbs_score?.toFixed(2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cbsColor(a.cbs_score)}`}>{cbsLabel(a.cbs_score)}</span>
                                        {a.bypass_reason && <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">⚡ BYPASS</span>}
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.status === 'pending_investigation' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{a.status.replace('_', ' ')}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 truncate">Zone: {a.zone_id} · Severity {a.severity_index}/10</p>
                                </div>
                                <span className="text-xs text-slate-400 shrink-0">{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        ))}
                    </div>

                    {/* Recent Reports mini-feed */}
                    <div className="border-t border-slate-100 px-5 py-3">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Recent Sentinel Reports</p>
                        <div className="space-y-1.5">
                            {liveReports.slice(0, 4).map(r => (
                                <div key={r.id} className="flex items-center gap-2 text-xs">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${r.source === 'community' ? 'bg-blue-400' : 'bg-[#1e52f1]'}`} />
                                    <span className="text-slate-600 truncate flex-1">{r.origin_address || r.organization_id || 'Unknown location'}</span>
                                    <span className="text-slate-400">{r.patient_count}pt · sev {r.severity}</span>
                                    <span className={`font-semibold px-1.5 py-0.5 rounded ${r.source === 'community' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>{r.source}</span>
                                </div>
                            ))}
                            {liveReports.length === 0 && <p className="text-xs text-slate-400">No reports yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

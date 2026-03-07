'use client';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '@/components/DashboardLayout';

const ZoneMap = dynamic(() => import('./components/EOCZoneMap'), { ssr: false });

// ── Mock data ──────────────────────────────────────────────────────────────────
const ZONES = [
    { id: 'sw', name: 'South West', status: 'critical', alerts: 14, pho: 'Dr. Ngozi Adeyemi', facilities: 142, silent: 3, center: [7.1, 3.5] as [number, number] },
    { id: 'ne', name: 'North East', status: 'warning', alerts: 7, pho: 'Dr. Aisha Zanna', facilities: 98, silent: 1, center: [11.8, 13.2] as [number, number] },
    { id: 'nc', name: 'North Central', status: 'warning', alerts: 5, pho: 'Dr. James Yakubu', facilities: 87, silent: 0, center: [9.1, 7.4] as [number, number] },
    { id: 'nw', name: 'North West', status: 'normal', alerts: 2, pho: 'Dr. Sadiq Maiwada', facilities: 115, silent: 2, center: [12.0, 7.3] as [number, number] },
    { id: 'se', name: 'South East', status: 'normal', alerts: 1, pho: 'Dr. Emeka Chukwu', facilities: 76, silent: 0, center: [6.4, 7.5] as [number, number] },
    { id: 'ss', name: 'South South', status: 'warning', alerts: 6, pho: 'Dr. Blessing Okafor', facilities: 89, silent: 1, center: [4.8, 7.0] as [number, number] },
];
const FACILITIES = [
    { id: 'f1', name: 'Lagos University Teaching Hospital', zone: 'South West', status: 'Verified', reliability: 94 },
    { id: 'f2', name: 'Aminu Kano Teaching Hospital', zone: 'North West', status: 'Pending', reliability: 78 },
    { id: 'f3', name: 'ATBUTH Bauchi', zone: 'North East', status: 'Verified', reliability: 88 },
    { id: 'f4', name: 'Apapa Health Centre', zone: 'South West', status: 'Flagged', reliability: 42 },
    { id: 'f5', name: 'University of Calabar Teaching Hospital', zone: 'South South', status: 'Verified', reliability: 91 },
    { id: 'f6', name: 'Nnamdi Azikiwe University Hospital', zone: 'South East', status: 'Pending', reliability: 65 },
];
const PHOS = [
    { id: 'p1', name: 'Dr. Ngozi Adeyemi', zone: 'South West', clearance: 'Regional Admin', broadcast: true },
    { id: 'p2', name: 'Dr. Aisha Zanna', zone: 'North East', clearance: 'Verification Officer', broadcast: true },
    { id: 'p3', name: 'Dr. James Yakubu', zone: 'North Central', clearance: 'Field Observer', broadcast: false },
    { id: 'p4', name: 'Dr. Sadiq Maiwada', zone: 'North West', clearance: 'Verification Officer', broadcast: true },
    { id: 'p5', name: 'Dr. Emeka Chukwu', zone: 'South East', clearance: 'Regional Admin', broadcast: false },
];
const PROTOCOLS = [
    { id: 'pr1', name: 'National Epidemic Alert', severity: 'critical', desc: 'Full national lockdown of disease surveillance networks. All facilities escalate to emergency reporting frequency.' },
    { id: 'pr2', name: 'Regional Containment Protocol', severity: 'high', desc: 'Targeted regional lockdown with increased PHO deployment to affected zones.' },
    { id: 'pr3', name: 'Enhanced Surveillance Mode', severity: 'medium', desc: 'Increase monitoring frequency across all facilities. PHOs placed on 24h duty rotation.' },
    { id: 'pr4', name: 'Mass Casualty Response', severity: 'critical', desc: 'Activate SORMAS mass casualty module. Deploy emergency response teams nationally.' },
];

function statBg(status: string) {
    if (status === 'critical') return 'bg-red-100 text-red-700 border-red-200';
    if (status === 'warning') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-green-100 text-green-700 border-green-200';
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
    return (
        <div className={`rounded-2xl border p-5 ${color}`}>
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
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">This action will immediately suspend all data reporting from this facility and flag it for audit. This cannot be undone without EOC co-approval.</div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Justification <span className="text-red-500">*</span></label>
                    <textarea rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="Document the reason for blacklisting (e.g., repeated false reports, data integrity failure)..."
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
                    <p className="text-sm text-red-800"><strong>Dual-Authorization Required:</strong> Executing a national protocol requires the co-signature of a second authorized EOC administrator. Unauthorized activation is a criminal offense under Section 12 of the MERMS Act.</p>
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
    { label: 'SORMAS Sync', href: '/dashboard/eoc/sormas', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> },
];

export default function EOCDashboard() {
    const [selectedZone, setSelectedZone] = useState<typeof ZONES[0] | null>(null);
    const [facilities, setFacilities] = useState(FACILITIES);
    const [phos, setPhos] = useState(PHOS);
    const [blacklistTarget, setBlacklistTarget] = useState<typeof FACILITIES[0] | null>(null);
    const [showProtocol, setShowProtocol] = useState(false);
    const [toast, setToast] = useState('');

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

    const totalAlerts = ZONES.reduce((s, z) => s + z.alerts, 0);
    const silentNodes = ZONES.reduce((s, z) => s + z.silent, 0);
    const pendingApps = facilities.filter(f => f.status === 'Pending').length;

    return (
        <DashboardLayout navItems={NAV} role="eoc" userName="EOC Admin">
            {toast && <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold">{toast}</div>}
            {blacklistTarget && <BlacklistModal facility={blacklistTarget.name} onClose={() => setBlacklistTarget(null)} onConfirm={reason => { setFacilities(p => p.map(f => f.id === blacklistTarget.id ? { ...f, status: 'Blacklisted' } : f)); setBlacklistTarget(null); showToast(`${blacklistTarget.name} blacklisted`); }} />}
            {showProtocol && <NationalProtocolModal onClose={() => { setShowProtocol(false); showToast('Protocol execution logged for dual-authorization review'); }} />}

            {/* Execute National Protocol — fixed top right */}
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">EOC Command Centre</h1>
                    <p className="text-sm text-slate-500 mt-0.5">National Emergency Operations · Real-time surveillance</p>
                </div>
                <button onClick={() => setShowProtocol(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all hover:shadow-xl hover:shadow-red-600/40">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    Execute National Protocol
                </button>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Active Alerts" value={totalAlerts} sub="national count" color="bg-red-50 text-red-700 border border-red-100" />
                <StatCard label="Pending Applications" value={pendingApps} sub="awaiting review" color="bg-amber-50 text-amber-700 border border-amber-100" />
                <StatCard label="Silent Nodes" value={silentNodes} sub="no report in 24h" color="bg-slate-100 text-slate-700 border border-slate-200" />
                <StatCard label="Last SORMAS Sync" value="14:32" sub="2026-03-01 · 4m ago" color="bg-green-50 text-green-700 border border-green-100" />
            </div>

            {/* ── Zone Map ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-sm font-bold text-slate-800">National Zone Map</h2>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-400" />Normal</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400" />Warning</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" />Critical</span>
                    </div>
                </div>
                <div className="flex">
                    <div className="flex-1" style={{ height: 380 }}>
                        <ZoneMap zones={ZONES} onZoneClick={setSelectedZone} />
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
                                <div className="flex justify-between text-sm"><span className="text-slate-500">Assigned PHO</span><span className="font-bold text-[#1e52f1] text-xs">{selectedZone.pho}</span></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Bottom side-by-side tables ── */}
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
                                <th className="px-5 py-3 text-left">Facility</th><th className="px-5 py-3 text-left">Status</th><th className="px-5 py-3 text-left">Score</th><th className="px-5 py-3 text-left">Actions</th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-50">
                                {facilities.map(f => (
                                    <tr key={f.id} className="hover:bg-slate-50/60">
                                        <td className="px-5 py-3.5"><p className="text-xs font-semibold text-slate-900 leading-tight">{f.name}</p><p className="text-xs text-slate-400">{f.zone}</p></td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${f.status === 'Verified' ? 'bg-green-50 text-green-700 border-green-200' : f.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : f.status === 'Blacklisted' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{f.status}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2"><div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${f.reliability >= 80 ? 'bg-green-500' : f.reliability >= 60 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${f.reliability}%` }} /></div><span className="text-xs font-bold text-slate-700">{f.reliability}</span></div>
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

                {/* PHO Management */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <h2 className="text-sm font-bold text-slate-800">PHO Management</h2>
                        <span className="text-xs text-slate-400">{phos.length} officers</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-xs text-slate-400 font-medium uppercase tracking-wide border-b border-slate-100">
                                <th className="px-5 py-3 text-left">Officer</th><th className="px-5 py-3 text-left">Zone</th><th className="px-5 py-3 text-left">Clearance</th><th className="px-5 py-3 text-left">Broadcast</th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-50">
                                {phos.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50/60">
                                        <td className="px-5 py-3.5 font-semibold text-xs text-slate-900">{p.name}</td>
                                        <td className="px-5 py-3.5 text-xs text-slate-500">{p.zone}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${p.clearance === 'Regional Admin' ? 'bg-purple-100 text-purple-700' : p.clearance === 'Verification Officer' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{p.clearance}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <button onClick={() => { setPhos(prev => prev.map(x => x.id === p.id ? { ...x, broadcast: !x.broadcast } : x)); showToast(`Broadcast rights ${p.broadcast ? 'revoked from' : 'restored to'} ${p.name}`); }}
                                                className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full border-2 border-transparent transition-all focus:outline-none ${p.broadcast ? 'bg-[#1e52f1]' : 'bg-slate-200'}`}>
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-all ${p.broadcast ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

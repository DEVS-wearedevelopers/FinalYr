'use client';
import React, { useState, useEffect } from 'react';
import { reportsService } from '@/services/reportsService';

const LOCATIONS = ['Hostel A', 'Hostel B', 'Hostel C', 'Cafeteria 1', 'Cafeteria 2', 'Ward 1', 'Ward 2', 'Ward 3', 'OPD', 'Emergency', 'Maternity', 'Paediatrics', 'ICU', 'Lab', 'Pharmacy'];

const GROUPS = [
    { id: 'respiratory', label: 'Respiratory', col: 'blue', syms: ['Cough', 'Fever', 'Shortness of Breath', 'Chest Pain', 'Runny Nose'] },
    { id: 'enteric', label: 'Enteric', col: 'amber', syms: ['Diarrhea', 'Vomiting', 'Abdominal Pain', 'Nausea', 'Dehydration'] },
    { id: 'neurological', label: 'Neurological', col: 'purple', syms: ['Headache', 'Dizziness', 'Seizures', 'Confusion', 'Loss of Consciousness'] },
    { id: 'hemorrhagic', label: 'Hemorrhagic', col: 'red', syms: ['Bleeding (Nose)', 'Bleeding (Gums)', 'Blood in Stool', 'Petechiae', 'Bruising'] },
    { id: 'dermal', label: 'Dermal', col: 'teal', syms: ['Rash', 'Blisters', 'Jaundice', 'Swelling', 'Skin Lesions'] },
];
const BASE: Record<string, string> = {
    blue: 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100',
    amber: 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100',
    purple: 'border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100',
    red: 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100',
    teal: 'border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100',
};
const ACTIVE: Record<string, string> = {
    blue: 'bg-blue-500 border-blue-500 text-white', amber: 'bg-amber-500 border-amber-500 text-white',
    purple: 'bg-purple-500 border-purple-500 text-white', red: 'bg-red-500 border-red-500 text-white',
    teal: 'bg-teal-500 border-teal-500 text-white',
};
const HEMORRHAGIC_SYMS = ['Bleeding (Nose)', 'Bleeding (Gums)', 'Blood in Stool', 'Petechiae', 'Bruising'];

function autoSev(syms: string[]) {
    const h = syms.some(s => HEMORRHAGIC_SYMS.includes(s));
    const f = syms.includes('Fever');
    const hiN = syms.some(s => ['Seizures', 'Loss of Consciousness'].includes(s));
    if (h && f) return { score: 5, label: 'Critical — Immediate Escalation Required', critical: true };
    if (h || hiN) return { score: 4, label: 'High Risk', critical: false };
    if (syms.length >= 3 || f) return { score: 3, label: 'Moderate Risk', critical: false };
    if (syms.length >= 2) return { score: 2, label: 'Low-Moderate Risk', critical: false };
    if (syms.length >= 1) return { score: 1, label: 'Low Risk — Monitor', critical: false };
    return { score: 0, label: '—', critical: false };
}

function Numpad({ value, onChange, max = 9999 }: { value: string; onChange: (v: string) => void; max?: number }) {
    const press = (d: string) => {
        if (d === 'CLR') { onChange(''); return; }
        if (d === '⌫') { onChange(value.slice(0, -1)); return; }
        const n = value + d;
        if (Number(n) <= max) onChange(n);
    };
    return (
        <div className="grid grid-cols-3 gap-2">
            {['7', '8', '9', '4', '5', '6', '1', '2', '3', 'CLR', '0', '⌫'].map(d => (
                <button key={d} type="button" onClick={() => press(d)}
                    className={`h-14 rounded-2xl text-xl font-bold transition-all active:scale-95 select-none
                    ${d === 'CLR' ? 'bg-amber-50 text-amber-600 border border-amber-200 text-sm' :
                            d === '⌫' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                                'bg-white border border-slate-200 text-slate-900 hover:bg-blue-50 hover:border-[#1e52f1]/30'}`}>
                    {d}
                </button>
            ))}
        </div>
    );
}

function LocSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [q, setQ] = useState(value);
    const [open, setOpen] = useState(false);
    const hits = LOCATIONS.filter(l => l.toLowerCase().includes(q.toLowerCase()));
    return (
        <div className="relative">
            <input value={q} onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
                placeholder="Search location…"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1]" />
            {open && hits.length > 0 && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                    {hits.map(l => (
                        <button key={l} type="button" onClick={() => { onChange(l); setQ(l); setOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${value === l ? 'font-bold text-[#1e52f1]' : 'text-slate-700'}`}>{l}</button>
                    ))}
                </div>
            )}
        </div>
    );
}

function makeId() {
    const n = new Date();
    const p = (x: number, z = 2) => String(x).padStart(z, '0');
    return `RPT-${p(n.getDate())}${p(n.getMonth() + 1)}-${p(n.getHours())}${p(n.getMinutes())}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export default function SentinelModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (id: string) => void }) {
    const [step, setStep] = useState<1 | 2 | 3 | 'ok'>(1);
    const [count, setCount] = useState('');
    const [loc, setLoc] = useState('Hostel A');
    const [rtime, setRtime] = useState(() => new Date().toISOString().slice(0, 16));
    const [syms, setSyms] = useState<string[]>([]);
    const [manualSev, setManualSev] = useState<number | null>(null);
    const [pin, setPin] = useState('');
    const [pinErr, setPinErr] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rid, setRid] = useState('');

    const auto = autoSev(syms);
    const sev = manualSev ?? auto.score;
    const critical = auto.critical;
    const latMin = Math.max(0, Math.round((Date.now() - new Date(rtime + ':00').getTime()) / 60000));
    const isLate = latMin > 2;

    const toggle = (s: string) => setSyms(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
    const dominant = (() => {
        for (const g of [...GROUPS].reverse()) {
            const hit = syms.filter(s => g.syms.includes(s));
            if (hit.length) return hit.slice(0, 2).join(' & ');
        }
        return 'Unknown';
    })();

    useEffect(() => {
        if (pin.length !== 4) return;
        if (pin === '1234') {
            setLoading(true);
            (async () => {
                const id = makeId();
                try { await reportsService.submitReport({ patientCount: Number(count), originLocation: { lat: 0, lng: 0, address: loc }, symptomMatrix: syms, severity: sev * 2 }); }
                catch { }
                setRid(id); setStep('ok'); setLoading(false); onSuccess(id);
            })();
        } else {
            setPinErr(true);
            setTimeout(() => { setPin(''); setPinErr(false); }, 700);
        }
    }, [pin]);

    const goBack = () => {
        if (step === 2) setStep(1);
        else if (step === 3) setStep(2);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative z-10 w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${critical && step === 2 ? 'ring-4 ring-red-500' : 'ring-0'}`}>

                {/* Header */}
                {step !== 'ok' && (
                    <div className={`px-6 pt-6 pb-4 border-b transition-colors duration-300 ${critical && step === 2 ? 'bg-red-600 border-red-700' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex gap-1.5">
                                {([1, 2, 3] as const).map(s => (
                                    <div key={s} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${(step === 'ok' ? 3 : step as number) >= s ? (critical && step === 2 ? 'bg-white text-red-600' : 'bg-[#1e52f1] text-white') : 'bg-slate-100 text-slate-400'}`}>{s}</div>
                                ))}
                            </div>
                            <button onClick={onClose} className={`w-8 h-8 rounded-xl flex items-center justify-center ${critical && step === 2 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <h2 className={`text-lg font-bold ${critical && step === 2 ? 'text-white' : 'text-slate-900'}`}>
                            {step === 1 ? "What's happening?" : step === 2 ? (critical ? '⚠ CRITICAL COMBINATION' : "What are you seeing?") : 'Confirm & Send'}
                        </h2>
                        {critical && step === 2 && <p className="text-red-200 text-xs mt-1 font-semibold">This combination triggers an immediate escalation. Confirm to proceed.</p>}
                    </div>
                )}

                <div className="px-6 py-5 max-h-[72vh] overflow-y-auto">

                    {/* STEP 1 */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div className="text-center py-2">
                                <div className={`text-6xl font-black tracking-tight ${count ? 'text-[#1e52f1]' : 'text-slate-200'}`}>{count || '0'}</div>
                                <p className="text-sm text-slate-400 mt-1">patients</p>
                            </div>
                            <Numpad value={count} onChange={setCount} />
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Origin Location</label>
                                <LocSearch value={loc} onChange={setLoc} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Time of observation</label>
                                <input type="datetime-local" value={rtime} onChange={e => setRtime(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1]" />
                                {isLate && <p className="text-xs font-semibold text-amber-600 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />Reporting {latMin} {latMin === 1 ? 'minute' : 'minutes'} late</p>}
                            </div>
                        </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <div className={`space-y-5 transition-colors duration-300 ${critical ? 'bg-red-50/40 -mx-6 px-6 -my-5 py-5' : ''}`}>
                            {syms.length > 0 && (
                                <div className={`rounded-2xl p-3.5 border ${critical ? 'bg-red-100 border-red-300' : 'bg-blue-50 border-blue-200'}`}>
                                    <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${critical ? 'text-red-700' : 'text-[#1e52f1]'}`}>Selected ({syms.length})</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {syms.map(s => <span key={s} className={`text-xs font-bold px-2.5 py-1 rounded-full ${critical ? 'bg-red-500 text-white' : 'bg-[#1e52f1] text-white'}`}>{s}</span>)}
                                    </div>
                                </div>
                            )}
                            {GROUPS.map(g => (
                                <div key={g.id}>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{g.label}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {g.syms.map(s => (
                                            <button key={s} type="button" onClick={() => toggle(s)}
                                                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${syms.includes(s) ? ACTIVE[g.col] : BASE[g.col]}`}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {auto.score > 0 && (
                                <div className={`rounded-xl px-4 py-3 border text-sm font-semibold ${critical ? 'bg-red-600 text-white border-red-700' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                    <span className="text-xs font-bold opacity-60 mr-2">AI Estimate:</span>{auto.label}
                                </div>
                            )}
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-xs font-bold text-slate-600">How severe does this appear to you?</label>
                                    <span className={`text-sm font-black ${critical ? 'text-red-600' : 'text-[#1e52f1]'}`}>{sev || 1}/5</span>
                                </div>
                                <input type="range" min={1} max={5} value={sev || 1} onChange={e => setManualSev(Number(e.target.value))}
                                    className={`w-full h-2 cursor-pointer ${critical ? 'accent-red-600' : 'accent-[#1e52f1]'}`} />
                                <div className="flex justify-between text-xs text-slate-400"><span>Mild</span><span>Critical</span></div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-2">
                                <p className="text-lg font-bold text-slate-900 leading-snug">
                                    You are reporting <span className="text-[#1e52f1]">{count} patient{Number(count) !== 1 ? 's' : ''}</span> with <span className="text-[#1e52f1]">{dominant}</span> at <span className="text-[#1e52f1]">{loc}</span>.
                                </p>
                                <p className="text-xs text-slate-400">{new Date(rtime).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}{isLate && ` · Reported ${latMin}m late`}</p>
                            </div>
                            <div className="space-y-3">
                                <p className="text-sm font-bold text-slate-700 text-center flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                                    Enter your PIN to submit
                                </p>
                                <div className="flex justify-center gap-3 py-1">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${pinErr ? 'border-red-500 bg-red-500' : i < pin.length ? 'border-[#1e52f1] bg-[#1e52f1]' : 'border-slate-300'}`} />
                                    ))}
                                </div>
                                {pinErr && <p className="text-xs text-red-500 text-center">Incorrect PIN. Try again.</p>}
                                <Numpad value={pin} onChange={v => { if (v.length <= 4) setPin(v); }} />
                                <p className="text-xs text-slate-400 text-center">Demo PIN: 1234</p>
                                {loading && <div className="flex justify-center pt-2"><svg className="animate-spin w-6 h-6 text-[#1e52f1]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>}
                            </div>
                        </div>
                    )}

                    {/* SUCCESS */}
                    {step === 'ok' && (
                        <div className="py-6 text-center space-y-5">
                            <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto animate-bounce">
                                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div><h2 className="text-2xl font-black text-slate-900">Packet Delivered</h2><p className="text-sm text-slate-500 mt-1">Report queued for AI analysis</p></div>
                            <div className="bg-slate-900 rounded-2xl p-4">
                                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Report ID</p>
                                <p className="text-base font-mono font-bold text-white tracking-widest">{rid}</p>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                                <span className="text-sm font-semibold text-slate-600">Pending AI Scan</span>
                            </div>
                            <button onClick={() => { setStep(1); setCount(''); setSyms([]); setManualSev(null); setPin(''); }}
                                className="w-full py-3.5 rounded-2xl bg-[#1e52f1] text-white font-bold text-sm hover:bg-[#123bb5] transition-all">
                                + Start New Report
                            </button>
                            <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600">Close</button>
                        </div>
                    )}
                </div>

                {/* Footer nav */}
                {step !== 'ok' && (
                    <div className="flex items-center gap-3 px-6 pb-6 pt-4 border-t border-slate-100">
                        {step > 1 && <button onClick={goBack} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back</button>}
                        <div className="flex-1" />
                        {step < 3 && (
                            <button onClick={() => setStep(s => s === 1 ? 2 : 3 as any)}
                                disabled={step === 1 ? (!count || !loc) : syms.length === 0}
                                className="px-6 py-2.5 rounded-xl bg-[#1e52f1] text-white text-sm font-bold hover:bg-[#123bb5] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                                Continue
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

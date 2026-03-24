'use client';
import React, { useState } from 'react';
import { DashboardLayout, useUserFromToken } from '@/components/DashboardLayout';
import { alertsService } from '@/services/alertsService';

const NAV = [
    { label: 'Alert Inbox', href: '/dashboard/pho',            icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    { label: 'Analytics',   href: '/dashboard/pho/analytics',  icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg> },
    { label: 'Broadcasts',  href: '/dashboard/pho/broadcasts', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> },
];

const TEMPLATES = [
    {
        id: 't1', name: 'Respiratory Advisory',
        type: 'ADVISORY' as const,
        subject: 'Health Advisory: Respiratory Illness Activity in Your Zone',
        body: `Dear Community,\n\nHealthcare surveillance in your zone has detected an increase in respiratory illness cases. Common symptoms include persistent cough, fever, and difficulty breathing.\n\nWhat you should do:\n• Wear a mask in crowded enclosed spaces\n• Wash hands with soap frequently\n• Seek early medical care if symptoms develop\n• Avoid close contact with those who are unwell\n\nThis advisory will remain in effect pending further PHO assessment.\n\n— Public Health Office`,
    },
    {
        id: 't2', name: 'Enteric Outbreak Warning',
        type: 'WARNING' as const,
        subject: 'URGENT: Enteric Disease Activity — Immediate Action Required',
        body: `Dear Community,\n\nHealth monitors have identified a cluster of enteric (gastrointestinal) cases in your zone. Symptoms include vomiting, diarrhoea, and abdominal cramps.\n\nImmediate steps:\n• Do NOT drink untreated water\n• Use oral rehydration salts if you experience diarrhoea\n• Report to your nearest health facility if symptoms are severe\n• Avoid sharing food or utensils with others\n\nAll facilities have been placed on heightened alert.\n\n— Public Health Office`,
    },
    {
        id: 't3', name: 'Hemorrhagic Alert',
        type: 'CRITICAL' as const,
        subject: '🚨 CRITICAL HEALTH ALERT: Suspected Hemorrhagic Activity',
        body: `URGENT NOTICE TO ALL RESIDENTS\n\nHealth authorities have detected suspected hemorrhagic fever signals in your zone. This requires your IMMEDIATE attention.\n\nSymptoms to watch for:\n• Unexplained bleeding or bruising\n• High fever that does not respond to medication\n• Severe headache, muscle pain\n• Vomiting blood\n\nDO NOT delay — if any of these symptoms present, go to the nearest government health center NOW.\n\nAvoid self-medication. Contact tracing is underway.\n\n— PHO Emergency Operations`,
    },
    {
        id: 't4', name: 'All-Clear Notice',
        type: 'ADVISORY' as const,
        subject: 'Health Update: Situation Resolved — Zone Clear',
        body: `Dear Community,\n\nWe are pleased to inform you that the health concern previously identified in your zone has been successfully investigated and resolved.\n\nNo further precautionary action is required at this time. Continue to practice good hygiene and report any unusual illness patterns to your nearest health facility.\n\nThank you for your co-operation during this period.\n\n— Public Health Office`,
    },
];

type BroadcastLog = {
    id: string; template: string; type: string;
    sentAt: string; status: 'sent' | 'pending' | 'failed';
};

const TYPE_DOT: Record<string, string> = {
    ADVISORY: 'bg-blue-500', WARNING: 'bg-amber-500', CRITICAL: 'bg-red-500',
};
const TYPE_BADGE: Record<string, string> = {
    ADVISORY: 'bg-blue-50 text-blue-700 border-blue-200',
    WARNING:  'bg-amber-50 text-amber-700 border-amber-200',
    CRITICAL: 'bg-red-50 text-red-700 border-red-200',
};

export default function PHOBroadcasts() {
    const tokenUser = useUserFromToken();
    const [selectedId, setSelectedId]   = useState(TEMPLATES[0].id);
    const [customBody, setCustomBody]   = useState('');
    const [useCustom, setUseCustom]     = useState(false);
    const [sending, setSending]         = useState(false);
    const [log, setLog]                 = useState<BroadcastLog[]>([]);
    const [toast, setToast]             = useState('');
    const [preview, setPreview]         = useState(false);

    const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };
    const tmpl = TEMPLATES.find(t => t.id === selectedId)!;
    const body = useCustom ? customBody : tmpl.body;

    const send = async () => {
        setSending(true);
        try {
            await alertsService.broadcast();
            setLog(p => [{
                id: `bc-${Date.now()}`, template: useCustom ? 'Custom Message' : tmpl.name,
                type: useCustom ? 'ADVISORY' : tmpl.type,
                sentAt: new Date().toISOString(), status: 'sent',
            }, ...p]);
            showToast('Broadcast sent to all facilities in your zone ✓');
            if (useCustom) setCustomBody('');
        } catch {
            showToast('Broadcast failed — try again');
        } finally { setSending(false); }
    };

    return (
        <DashboardLayout navItems={NAV} role="pho" userName={tokenUser?.name || 'PHO'}>
            {toast && <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold">{toast}</div>}

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Zone Broadcasts</h1>
                <p className="text-slate-500 text-sm mt-0.5">Send health advisories to all institutions and civilians in your zone</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Composer */}
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-800">Compose Broadcast</p>
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                                <div onClick={() => setUseCustom(c => !c)}
                                    className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-all ${useCustom ? 'bg-[#1e52f1]' : 'bg-slate-200'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-all ${useCustom ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                                Custom message
                            </label>
                        </div>

                        {!useCustom && (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Template</p>
                                {TEMPLATES.map(t => (
                                    <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedId === t.id ? 'bg-blue-50/50 border-[#1e52f1]/30' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedId === t.id ? 'border-[#1e52f1] bg-[#1e52f1]' : 'border-slate-300'}`}>
                                            {selectedId === t.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${TYPE_BADGE[t.type]}`}>{t.type}</span>
                                            </div>
                                        </div>
                                        <input type="radio" className="sr-only" checked={selectedId === t.id} onChange={() => setSelectedId(t.id)} />
                                    </label>
                                ))}
                            </div>
                        )}

                        {useCustom && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Message</label>
                                <textarea rows={10} value={customBody} onChange={e => setCustomBody(e.target.value)}
                                    placeholder="Write a health advisory for residents in your zone..."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1]" />
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setPreview(p => !p)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                                {preview ? 'Hide preview' : 'Preview'}
                            </button>
                            <button onClick={send} disabled={sending || (useCustom && !customBody.trim())}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1e52f1] text-white text-sm font-bold hover:bg-[#1640cc] transition-all disabled:opacity-50 shadow-md shadow-[#1e52f1]/20">
                                {sending && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                                Send Broadcast
                            </button>
                        </div>
                    </div>

                    {preview && (
                        <div className="bg-slate-900 rounded-2xl p-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${TYPE_DOT[useCustom ? 'ADVISORY' : tmpl.type]}`} />
                                <span className="text-xs font-bold text-slate-400 uppercase">Preview — as civilians will see it</span>
                            </div>
                            <p className="text-sm font-bold text-white">{useCustom ? 'Custom Advisory' : tmpl.subject}</p>
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{body}</p>
                        </div>
                    )}
                </div>

                {/* Broadcast log */}
                <div>
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-800">Broadcast Log</p>
                            <span className="text-xs text-slate-400">{log.length} sent this session</span>
                        </div>
                        {log.length === 0 ? (
                            <div className="py-16 text-center text-slate-400">
                                <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                                <p className="text-sm font-semibold">No broadcasts yet</p>
                                <p className="text-xs mt-1">Sent broadcasts will appear here</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {log.map(entry => (
                                    <div key={entry.id} className="flex items-center gap-4 px-5 py-4">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${TYPE_DOT[entry.type]}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-800">{entry.template}</p>
                                            <p className="text-xs text-slate-400">{new Date(entry.sentAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                                        </div>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${entry.status === 'sent' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {entry.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

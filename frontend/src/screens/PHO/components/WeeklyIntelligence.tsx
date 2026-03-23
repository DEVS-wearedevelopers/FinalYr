'use client';
import React, { useState } from 'react';

// ── Mock data ──────────────────────────────────────────────────────────────────
const REPORT = {
    generatedAt: '2026-03-23T00:00:00Z',
    zone: 'Lagos Island / Surulere',
    aiSummary: 'Respiratory cases in the Lagos Island / Surulere zone rose 40% week-over-week, primarily driven by sentinel reports from LUTH and Apapa General Hospital. The CBS cluster score for respiratory presentations reached 0.71 — approaching the 0.75 escalation threshold. Hemorrhagic indicators remain below outbreak threshold but show a consistent 3-week upward trajectory originating from Surulere Cottage Hospital. No confirmed outbreak threshold was crossed in this reporting period. Enteric activity appears stable relative to the 14-day baseline. PHO field dispatch to LUTH cluster recommended for Week 13.',
    topCategories: [
        { label: 'Respiratory',  count: 89, change: 40, facilities: 7 },
        { label: 'Enteric',      count: 41, change: -5, facilities: 5 },
        { label: 'Hemorrhagic',  count: 19, change: 18, facilities: 3 },
    ],
    topFacilities: [
        { name: 'Lagos University Teaching Hospital (LUTH)', reports: 34, area: 'Surulere' },
        { name: 'Apapa General Hospital',                    reports: 22, area: 'Apapa' },
        { name: 'Lagos Island General Hospital',             reports: 17, area: 'Lagos Island' },
        { name: 'Gbagada General Hospital',                  reports: 10, area: 'Gbagada' },
        { name: 'Surulere Cottage Hospital',                 reports:  6, area: 'Surulere' },
    ],
    watchItems: [
        { id: 'w1', facility: 'Surulere Cottage Hospital',    category: 'Hemorrhagic',  cbs: 0.34, note: 'Rash + fever cluster — 3 cases over 5 days. Below alert threshold. Monitoring closely.' },
        { id: 'w2', facility: 'St. Nicholas Hospital Lagos',  category: 'Neurological', cbs: 0.38, note: 'Headache and dizziness in 6 patients. No progression detected. Under observation.' },
        { id: 'w3', facility: 'Lagos Island General Hospital',category: 'Enteric',      cbs: 0.29, note: 'Unusual vomiting spike on Day 4. Self-resolved by Day 7. No further action required.' },
    ],
    trend: {
        weeks: ['W9', 'W10', 'W11', 'W12'],
        series: [
            { label: 'Respiratory', color: '#3b82f6', data: [54, 63, 64, 89] },
            { label: 'Enteric',     color: '#f59e0b', data: [47, 44, 43, 41] },
            { label: 'Hemorrhagic', color: '#ef4444', data: [10, 13, 16, 19] },
        ],
    },
};

const NOW = Date.now();
interface QueueItem {
    id: string;
    type: 'WEEKLY NEWSLETTER' | 'PREVENTION CARD' | 'DISEASE ALERT';
    title: string;
    source: string;
    createdAt: string;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
}

const QUEUE_INIT: QueueItem[] = [
    {
        id: 'cq1', type: 'WEEKLY NEWSLETTER',
        title: 'South West Health Digest — Week 49',
        source: 'Based on 87 Respiratory reports from South West Zone this week',
        createdAt: new Date(NOW - 51 * 3600_000).toISOString(),
        content: `Hello neighbour,\n\nThis week our health monitors recorded an increase in respiratory illness cases across Lagos State — particularly cough, fever, and shortness of breath. This is likely linked to seasonal changes and dust exposure.\n\nWhat to watch for: persistent cough lasting more than 5 days, high fever, or difficulty breathing. If you or someone you know experiences these, please visit your nearest health centre early.\n\nStay well and look out for your community.`,
        status: 'pending',
    },
    {
        id: 'cq2', type: 'PREVENTION CARD',
        title: 'Protecting Your Lungs This Season',
        source: 'Based on 87 Respiratory reports from 12 facilities in South West',
        createdAt: new Date(NOW - 22 * 3600_000).toISOString(),
        content: `🫁 Respiratory infections are rising in your area.\n\n✅ Wear a mask in crowded places\n✅ Wash hands frequently with soap and water\n✅ Avoid close contact with people who are coughing\n✅ Keep your home ventilated\n✅ Drink at least 8 glasses of water daily\n\n⚠️ See a doctor if your cough persists beyond 5 days or you develop a fever above 38°C.`,
        status: 'pending',
    },
    {
        id: 'cq3', type: 'DISEASE ALERT',
        title: 'Hemorrhagic Symptom Awareness — South West',
        source: 'Triggered by Watch Item at Surulere Cottage Hospital (CBS: 0.34, below threshold)',
        createdAt: new Date(NOW - 32 * 3600_000).toISOString(),
        content: `Health authorities in South West Zone are monitoring reports of unusual bruising, rash, and bleeding symptoms in a small number of individuals.\n\nThese reports are currently below the official outbreak threshold. There is no cause for widespread alarm.\n\nHowever, if you experience:\n• Unexplained bruising or skin rash\n• Unusual bleeding from nose or gums\n• Persistent high fever\n\nPlease report to your nearest Primary Health Centre immediately and avoid self-medication.`,
        status: 'pending',
    },
];



interface AuditEntry {
    phoId: string; contentId: string; contentTitle: string;
    decision: 'approved' | 'rejected'; reason?: string; timestamp: string;
}

// ── Trend SVG chart ───────────────────────────────────────────────────────────
function TrendChart({ trend }: { trend: typeof REPORT.trend }) {
    const W = 480, H = 140, padX = 36, padY = 14;
    const allVals = trend.series.flatMap(s => s.data);
    const max = Math.max(...allVals, 1);
    const iW = W - padX * 2, iH = H - padY * 2;
    const xStep = iW / (trend.weeks.length - 1);
    const toX = (i: number) => padX + i * xStep;
    const toY = (v: number) => padY + iH - (v / max) * iH;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
            {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                const y = padY + iH * (1 - t);
                return (
                    <g key={i}>
                        <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3 3" />
                        <text x={padX - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#94a3b8">{Math.round(max * t)}</text>
                    </g>
                );
            })}
            {trend.weeks.map((w, i) => (
                <text key={w} x={toX(i)} y={H - 2} textAnchor="middle" fontSize={9}
                    fill={i === trend.weeks.length - 1 ? '#1e52f1' : '#94a3b8'}
                    fontWeight={i === trend.weeks.length - 1 ? 700 : 400}>{w}</text>
            ))}
            {trend.series.map(s => (
                <g key={s.label}>
                    <polyline
                        points={s.data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')}
                        fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    {s.data.map((v, i) => (
                        <circle key={i} cx={toX(i)} cy={toY(v)}
                            r={i === s.data.length - 1 ? 4 : 3}
                            fill={s.color} stroke="white" strokeWidth={1.5}>
                            <title>{s.label}: {v} cases (W{46 + i})</title>
                        </circle>
                    ))}
                </g>
            ))}
        </svg>
    );
}

const TYPE_STYLE: Record<string, string> = {
    'WEEKLY NEWSLETTER': 'bg-blue-100 text-blue-800 border-blue-200',
    'PREVENTION CARD': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'DISEASE ALERT': 'bg-red-100 text-red-800 border-red-200',
};

const PHO_ID = 'PHO-SW-ADY-001';

// ── Main component ────────────────────────────────────────────────────────────
export default function WeeklyIntelligence() {
    const [queue, setQueue] = useState<QueueItem[]>(QUEUE_INIT);
    const [rejectText, setRejectText] = useState<Record<string, string>>({});
    const [rejectOpen, setRejectOpen] = useState<Record<string, boolean>>({});
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
    const [showAudit, setShowAudit] = useState(false);

    const pendingCount = queue.filter(q => q.status === 'pending').length;

    const approve = (item: QueueItem) => {
        setAuditLog(p => [{ phoId: PHO_ID, contentId: item.id, contentTitle: item.title, decision: 'approved', timestamp: new Date().toISOString() }, ...p]);
        setQueue(p => p.map(q => q.id === item.id ? { ...q, status: 'approved' } : q));
    };

    const reject = (item: QueueItem) => {
        const reason = (rejectText[item.id] ?? '').trim();
        if (!reason) return;
        setAuditLog(p => [{ phoId: PHO_ID, contentId: item.id, contentTitle: item.title, decision: 'rejected', reason, timestamp: new Date().toISOString() }, ...p]);
        setQueue(p => p.map(q => q.id === item.id ? { ...q, status: 'rejected' } : q));
        setRejectOpen(p => ({ ...p, [item.id]: false }));
    };

    const r = REPORT;

    return (
        <div className="space-y-8 pb-10">

            {/* ══ SECTION 1: AI WEEKLY ANALYSIS ══════════════════════════════════ */}
            <div className="space-y-5">
                {/* Section header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .3 2.7-1.1 2.7H3.9c-1.4 0-2.1-1.7-1.1-2.7L4.6 15.3" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">AI Weekly Analysis Report</h2>
                            <p className="text-xs text-slate-400">Zone: {r.zone} · Auto-generated {new Date(r.generatedAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} at midnight · Read-only</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                        <span className="text-xs font-bold text-violet-700">ML Generated</span>
                    </div>
                </div>

                {/* AI Summary */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">AI Summary — Week 49 (Feb 24 – Mar 1, 2026)</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed italic">"{r.aiSummary}"</p>
                </div>

                {/* Top 3 categories */}
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Top 3 Reported Symptom Categories</p>
                    <div className="grid grid-cols-3 gap-3">
                        {r.topCategories.map((c, i) => (
                            <div key={c.label} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 hover:shadow-sm transition-shadow">
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600'}`}>#{i + 1}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.change > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{c.change > 0 ? '▲' : '▼'} {Math.abs(c.change)}%</span>
                                </div>
                                <p className="text-sm font-bold text-slate-900">{c.label}</p>
                                <p className="text-3xl font-black text-slate-800">{c.count}</p>
                                <p className="text-xs text-slate-400">cases · {c.facilities} facilities</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Facilities + Watch Items */}
                <div className="grid grid-cols-2 gap-5">
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Top Contributing Facilities</p>
                        </div>
                        {r.topFacilities.map((f, i) => (
                            <div key={f.name} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                <span className="w-5 h-5 rounded-full bg-[#1e52f1]/10 text-[#1e52f1] text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-800 truncate">{f.name}</p>
                                    <p className="text-xs text-slate-400">{f.area}</p>
                                </div>
                                <span className="text-sm font-black text-slate-700 shrink-0">{f.reports}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-100 bg-amber-50/60">
                            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Watch Items — Below CBS Threshold</p>
                        </div>
                        {r.watchItems.map(w => (
                            <div key={w.id} className="px-5 py-3.5 border-b border-slate-50 last:border-0 space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{w.category}</span>
                                    <span className="text-xs font-mono font-bold text-slate-500">CBS {w.cbs.toFixed(2)}</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-800">{w.facility}</p>
                                <p className="text-xs text-slate-500 leading-relaxed">{w.note}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trend chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">4-Week Trend by Disease Category</p>
                        <div className="flex items-center gap-4">
                            {r.trend.series.map(s => (
                                <span key={s.label} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                    <span className="w-4 h-0.5 rounded-full inline-block" style={{ background: s.color }} />
                                    {s.label}
                                </span>
                            ))}
                        </div>
                    </div>
                    <TrendChart trend={r.trend} />
                </div>
            </div>

            {/* ══ SECTION 2: CIVILIAN CONTENT APPROVAL QUEUE ══════════════════════ */}
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Civilian Content Approval Queue</h2>
                            <p className="text-xs text-slate-400">AI-drafted content awaiting PHO sign-off before civilian publication. Nothing publishes without your approval.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {pendingCount > 0 && (
                            <span className="text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full">
                                {pendingCount} pending
                            </span>
                        )}
                        <button onClick={() => setShowAudit(a => !a)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-[#1e52f1] hover:underline">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
                            Audit Log ({auditLog.length})
                        </button>
                    </div>
                </div>

                {/* Queue */}
                <div className="space-y-4">
                    {queue.map(item => {
                        const hoursOld = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 3_600_000);
                        const stale = hoursOld > 48 && item.status === 'pending';

                        return (
                            <div key={item.id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${item.status === 'approved' ? 'border-green-200' : item.status === 'rejected' ? 'border-slate-100 opacity-60' : stale ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}`}>

                                {/* Header row */}
                                <div className="flex items-start gap-4 px-6 pt-5 pb-4 border-b border-slate-100">
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${TYPE_STYLE[item.type] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>{item.type}</span>
                                            {stale && (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-300 animate-pulse">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                    Pending Review — {hoursOld}h old
                                                </span>
                                            )}
                                            {item.status === 'approved' && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">✓ Approved & Published</span>}
                                            {item.status === 'rejected' && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">✗ Rejected</span>}
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4l3 3" /></svg>
                                            {item.source}
                                        </p>
                                    </div>
                                    <div className="text-right text-xs text-slate-400 shrink-0">
                                        <p>{new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                                        <p>{hoursOld}h ago</p>
                                    </div>
                                </div>

                                {/* Content preview */}
                                <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">As civilians will read it</p>
                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{item.content}</p>
                                </div>

                                {/* Actions */}
                                {item.status === 'pending' && (
                                    <div className="px-6 py-4">
                                        {rejectOpen[item.id] ? (
                                            <div className="space-y-2.5">
                                                <label className="block text-xs font-bold text-slate-600">Reason for rejection <span className="text-red-500">*</span></label>
                                                <input type="text" value={rejectText[item.id] ?? ''} onChange={e => setRejectText(p => ({ ...p, [item.id]: e.target.value }))}
                                                    placeholder="e.g. Inaccurate symptom description — needs clinical review"
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400" />
                                                <div className="flex gap-2">
                                                    <button onClick={() => setRejectOpen(p => ({ ...p, [item.id]: false }))} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                                                    <button onClick={() => reject(item)} disabled={!(rejectText[item.id] ?? '').trim()} className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed">Confirm Reject</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-3">
                                                <button onClick={() => approve(item)}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 shadow-sm shadow-green-600/20 transition-all">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                    Approve & Publish
                                                </button>
                                                <button onClick={() => setRejectOpen(p => ({ ...p, [item.id]: true }))}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-300 text-red-600 text-sm font-bold hover:bg-red-50 transition-all">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Audit log */}
                {showAudit && (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Approval Audit Log</h3>
                            <span className="ml-auto text-xs text-slate-400">PHO ID: {PHO_ID}</span>
                        </div>
                        {auditLog.length === 0 ? (
                            <div className="py-10 text-center text-xs text-slate-400">No actions recorded yet during this session.</div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {auditLog.map((entry, i) => (
                                    <div key={i} className="flex items-start gap-4 px-5 py-3.5">
                                        <span className={`text-xs font-black px-2.5 py-1 rounded-full shrink-0 border ${entry.decision === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                            {entry.decision.toUpperCase()}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-800 truncate">{entry.contentTitle}</p>
                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                                                <span className="font-mono">{entry.phoId}</span>
                                                <span>·</span>
                                                <span>ID: {entry.contentId}</span>
                                            </div>
                                            {entry.reason && <p className="text-xs text-slate-500 mt-1 italic">"{entry.reason}"</p>}
                                        </div>
                                        <span className="text-xs text-slate-400 font-mono shrink-0">
                                            {new Date(entry.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

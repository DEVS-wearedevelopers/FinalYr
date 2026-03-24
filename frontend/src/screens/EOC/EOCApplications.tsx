'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout, useUserFromToken } from '@/components/DashboardLayout';
import apiClient from '@/services/apiClient';

const NAV = [
    { label: 'Command Centre', href: '/dashboard/eoc',              icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { label: 'Applications',   href: '/dashboard/eoc/applications', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: 'System Admin',   href: '/dashboard/eoc/system',       icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

type Reg = {
    id: string; facility_name: string; facility_type: string;
    director_full_name: string; institutional_email: string;
    phone_number: string; state: string; city: string;
    status: string; created_at: string; reviewer_notes?: string;
};

const STATUS_STYLE: Record<string, string> = {
    pending:         'bg-slate-100 text-slate-600 border-slate-200',
    mdcn_check:      'bg-blue-100 text-blue-700 border-blue-200',
    document_review: 'bg-amber-100 text-amber-700 border-amber-200',
    admin_review:    'bg-purple-100 text-purple-700 border-purple-200',
    approved:        'bg-green-100 text-green-700 border-green-200',
    rejected:        'bg-red-100 text-red-700 border-red-200',
};

const PIPELINE = ['pending', 'mdcn_check', 'document_review', 'admin_review', 'approved'];

function PipelineStep({ step, current }: { step: string; current: string }) {
    const idx = PIPELINE.indexOf(step);
    const cur = PIPELINE.indexOf(current);
    const done = cur > idx || current === 'approved';
    const active = step === current;
    return (
        <div className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? 'bg-[#1e52f1] text-white' : active ? 'bg-[#1e52f1]/20 text-[#1e52f1] border border-[#1e52f1]' : 'bg-slate-100 text-slate-400'}`}>
                {done ? '✓' : idx + 1}
            </div>
            <span className={`text-xs font-medium capitalize ${active ? 'text-[#1e52f1] font-bold' : done ? 'text-slate-700' : 'text-slate-400'}`}>
                {step.replace('_', ' ')}
            </span>
        </div>
    );
}

function ReviewModal({ reg, onClose, onAction }: { reg: Reg; onClose: () => void; onAction: (status: string, notes: string) => void }) {
    const [notes, setNotes] = useState(reg.reviewer_notes ?? '');
    const [submitting, setSubmitting] = useState(false);

    const act = async (status: string) => {
        setSubmitting(true);
        await onAction(status, notes);
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-100 px-7 py-5 flex items-center justify-between rounded-t-3xl">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">{reg.facility_name}</h3>
                        <p className="text-xs text-slate-400">{reg.facility_type} · {reg.city}, {reg.state}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-7 space-y-6">
                    {/* Pipeline */}
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Review Pipeline</p>
                        <div className="flex flex-wrap gap-4">
                            {PIPELINE.map(s => <PipelineStep key={s} step={s} current={reg.status} />)}
                        </div>
                    </div>

                    {/* Applicant details */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            ['Facility Name', reg.facility_name],
                            ['Facility Type', reg.facility_type],
                            ['Director', reg.director_full_name],
                            ['Email', reg.institutional_email],
                            ['Phone', reg.phone_number],
                            ['Location', `${reg.city}, ${reg.state}`],
                            ['Applied', new Date(reg.created_at).toLocaleDateString('en-GB', { dateStyle: 'medium' })],
                            ['Status', reg.status.replace('_', ' ')],
                        ].map(([label, value]) => (
                            <div key={label} className="bg-slate-50 rounded-xl p-3">
                                <p className="text-xs text-slate-400 font-medium">{label}</p>
                                <p className="text-sm font-semibold text-slate-800 mt-0.5 capitalize">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Reviewer Notes</label>
                        <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="Add any notes about this application (visible to the institution if rejected)..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1]" />
                    </div>

                    {/* Actions */}
                    {reg.status !== 'approved' && reg.status !== 'rejected' && (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            {/* Advance pipeline */}
                            {reg.status !== 'admin_review' && (
                                <button onClick={() => act(PIPELINE[PIPELINE.indexOf(reg.status) + 1])} disabled={submitting}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1e52f1] text-white text-sm font-bold hover:bg-[#1640cc] disabled:opacity-50 transition-all">
                                    {submitting ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
                                    Advance → {PIPELINE[PIPELINE.indexOf(reg.status) + 1]?.replace('_', ' ')}
                                </button>
                            )}
                            {/* Approve */}
                            <button onClick={() => act('approved')} disabled={submitting}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-all">
                                ✓ Approve & Activate
                            </button>
                            {/* Reject */}
                            <button onClick={() => act('rejected')} disabled={submitting || !notes.trim()}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-300 text-red-600 text-sm font-bold hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all col-span-2">
                                ✗ Reject {!notes.trim() && <span className="text-xs font-normal opacity-60">(add notes first)</span>}
                            </button>
                        </div>
                    )}
                    {(reg.status === 'approved' || reg.status === 'rejected') && (
                        <div className={`rounded-xl p-4 text-center text-sm font-semibold ${reg.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            Application {reg.status} — no further actions available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function EOCApplications() {
    const tokenUser = useUserFromToken();
    const [regs, setRegs]         = useState<Reg[]>([]);
    const [loading, setLoading]   = useState(true);
    const [filter, setFilter]     = useState<string>('all');
    const [selected, setSelected] = useState<Reg | null>(null);
    const [toast, setToast]       = useState('');

    const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/institutions');
            setRegs(data.registrations ?? []);
        } catch { setRegs([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleAction = async (status: string, notes: string) => {
        if (!selected) return;
        try {
            await apiClient.patch(`/institutions/${selected.id}/status`, { status, reviewer_notes: notes || undefined });
            showToast(`${selected.facility_name} → ${status}`);
            setSelected(null);
            load();
        } catch { showToast('Action failed — try again'); }
    };

    const counts = {
        all:     regs.length,
        pending: regs.filter(r => r.status === 'pending').length,
        review:  regs.filter(r => ['mdcn_check', 'document_review', 'admin_review'].includes(r.status)).length,
        approved: regs.filter(r => r.status === 'approved').length,
        rejected: regs.filter(r => r.status === 'rejected').length,
    };

    const visible = regs.filter(r => {
        if (filter === 'all') return true;
        if (filter === 'review') return ['mdcn_check', 'document_review', 'admin_review'].includes(r.status);
        return r.status === filter;
    });

    return (
        <DashboardLayout navItems={NAV} role="eoc" userName={tokenUser?.name || 'EOC Admin'}>
            {toast && <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold">{toast}</div>}
            {selected && <ReviewModal reg={selected} onClose={() => setSelected(null)} onAction={handleAction} />}

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institution Applications</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Review and approve facility registrations for MERMS access</p>
                </div>
                <button onClick={load} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Refresh</button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit mb-5">
                {([['all', 'All'], ['pending', 'Pending'], ['review', 'In Review'], ['approved', 'Approved'], ['rejected', 'Rejected']] as [string, string][]).map(([val, label]) => (
                    <button key={val} onClick={() => setFilter(val)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${filter === val ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                        {label}
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === val ? 'bg-slate-100 text-slate-600' : 'bg-slate-200/60 text-slate-400'}`}>
                            {counts[val as keyof typeof counts] ?? 0}
                        </span>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="grid grid-cols-[1fr_120px_120px_100px_110px] gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                    {['Facility', 'Type', 'Location', 'Applied', 'Status'].map(h => (
                        <p key={h} className="text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</p>
                    ))}
                </div>

                {loading && (
                    <div className="flex justify-center py-16">
                        <div className="w-6 h-6 border-2 border-[#1e52f1] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {!loading && visible.length === 0 && (
                    <div className="py-16 text-center text-slate-400 text-sm">No applications match this filter</div>
                )}

                <div className="divide-y divide-slate-50">
                    {visible.map(r => (
                        <div key={r.id} onClick={() => setSelected(r)}
                            className="grid grid-cols-[1fr_120px_120px_100px_110px] gap-4 items-center px-5 py-4 hover:bg-slate-50/60 cursor-pointer transition-colors">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{r.facility_name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{r.director_full_name} · {r.institutional_email}</p>
                            </div>
                            <p className="text-xs text-slate-600">{r.facility_type || '—'}</p>
                            <p className="text-xs text-slate-600">{r.city}, {r.state}</p>
                            <p className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-block capitalize ${STATUS_STYLE[r.status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {r.status.replace('_', ' ')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

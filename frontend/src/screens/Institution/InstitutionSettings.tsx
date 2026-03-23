'use client';
import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import apiClient from '@/services/apiClient';

const NAV = [
    { label: 'Overview', href: '/dashboard/institution', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { label: 'Reports',  href: '/dashboard/institution/reports',  icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: 'Alerts',   href: '/dashboard/institution/alerts',   icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    { label: 'Inbox',    href: '/dashboard/institution/inbox',    icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg> },
    { label: 'Settings', href: '/dashboard/institution/settings', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

// Fields the institution can self-modify (low-risk, no re-verification needed)
const EDITABLE_FIELDS = ['phone_number', 'contact_person_email', 'street_address', 'city', 'state', 'postal_code', 'bed_capacity'];
// Fields that require EOC re-verification to change (read-only in UI)
const LOCKED_FIELDS   = ['facility_name', 'registration_number', 'director_full_name', 'professional_folio_number', 'institutional_email', 'facility_type'];

type Reg = Record<string, any>;

function FieldRow({ label, value, editable, editing, onChange }: { label: string; value: string; editable: boolean; editing: boolean; onChange?: (v: string) => void }) {
    return (
        <div className="flex items-start gap-4 py-3.5 border-b border-slate-100 last:border-0">
            <div className="w-44 shrink-0">
                <p className="text-xs font-bold text-slate-500">{label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                {!editable && <span className="text-xs text-slate-300 font-medium flex items-center gap-1 mt-0.5"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>Requires EOC</span>}
            </div>
            <div className="flex-1">
                {editable && editing ? (
                    <input value={value ?? ''} onChange={e => onChange?.(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#1e52f1]/40 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1] bg-blue-50/30" />
                ) : (
                    <p className={`text-sm ${editable ? 'text-slate-800' : 'text-slate-400'}`}>{value || '—'}</p>
                )}
            </div>
        </div>
    );
}

export default function InstitutionSettings() {
    const [profile, setProfile] = useState<Reg | null>(null);
    const [edits, setEdits]     = useState<Reg>({});
    const [editing, setEditing] = useState(false);
    const [saving, setSaving]   = useState(false);
    const [toast, setToast]     = useState('');
    const [loading, setLoading] = useState(true);

    const showToast = (msg: string, ok = true) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    useEffect(() => {
        apiClient.get('/institutions/profile')
            .then(({ data }) => { setProfile(data.profile); setEdits(data.profile ?? {}); })
            .catch(() => setProfile(null))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = Object.fromEntries(
                EDITABLE_FIELDS.map(f => [f, edits[f]]).filter(([, v]) => v !== undefined)
            );
            await apiClient.patch('/institutions/profile', payload);
            setProfile(p => ({ ...p, ...payload }));
            setEditing(false);
            showToast('Settings saved successfully ✓');
        } catch {
            showToast('Failed to save — please try again', false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout navItems={NAV} role="institution" userName="Institution">
            {toast && (
                <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white transition-all ${toast.includes('Failed') ? 'bg-red-600' : 'bg-green-600'}`}>
                    {toast}
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profile & Settings</h1>
                    <p className="text-slate-500 text-sm mt-0.5">View your institution profile. Editable fields can be updated without EOC re-verification.</p>
                </div>
                <div className="flex gap-2">
                    {editing ? (
                        <>
                            <button onClick={() => { setEditing(false); setEdits(profile ?? {}); }}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1e52f1] text-white text-sm font-bold hover:bg-[#1640cc] transition-all shadow-sm disabled:opacity-50">
                                {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setEditing(true)}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl border-2 border-[#1e52f1] text-[#1e52f1] text-sm font-bold hover:bg-[#1e52f1] hover:text-white transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#1e52f1] border-t-transparent rounded-full animate-spin" /></div>
            ) : !profile ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                    <p className="text-sm font-semibold text-amber-700">Could not load institution profile. Your account may not be linked to a registration.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Left: status card */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-200 p-5">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Registration Status</p>
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${profile.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : profile.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                <span className={`w-2 h-2 rounded-full ${profile.status === 'approved' ? 'bg-green-500' : profile.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                {(profile.status as string)?.replace(/_/g, ' ').toUpperCase() || 'PENDING'}
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-xs"><span className="text-slate-400">Facility Type</span><span className="font-semibold text-slate-700">{profile.facility_type || '—'}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-slate-400">Reviewed</span><span className="font-semibold text-slate-700">{profile.reviewed_at ? new Date(profile.reviewed_at).toLocaleDateString('en-GB') : 'Pending'}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-slate-400">Submitted</span><span className="font-semibold text-slate-700">{profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB') : '—'}</span></div>
                            </div>
                        </div>

                        {/* Reviewer notes if any */}
                        {profile.reviewer_notes && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">EOC Notes</p>
                                <p className="text-xs text-amber-800 leading-relaxed">{profile.reviewer_notes}</p>
                            </div>
                        )}

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Locked Fields</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Fields marked with 🔒 require EOC re-verification to change. Contact your regional EOC administrator to request modifications.
                            </p>
                        </div>
                    </div>

                    {/* Right: field editor */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Editable section */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 bg-blue-50/40 flex items-center gap-2">
                                <svg className="w-4 h-4 text-[#1e52f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                                <p className="text-xs font-bold text-[#1e52f1] uppercase tracking-wide">Editable Information</p>
                                {editing && <span className="ml-auto text-xs text-[#1e52f1]/60">Changes save directly to your profile</span>}
                            </div>
                            <div className="px-5 divide-y divide-slate-50">
                                {EDITABLE_FIELDS.map(f => (
                                    <FieldRow key={f} label={f} value={edits[f] ?? ''} editable={true} editing={editing}
                                        onChange={v => setEdits(p => ({ ...p, [f]: v }))} />
                                ))}
                            </div>
                        </div>

                        {/* Locked section */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Verified Information (EOC-Locked)</p>
                            </div>
                            <div className="px-5 divide-y divide-slate-50">
                                {LOCKED_FIELDS.map(f => (
                                    <FieldRow key={f} label={f} value={profile[f] ?? ''} editable={false} editing={false} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

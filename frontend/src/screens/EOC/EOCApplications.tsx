'use client';
import React, { useState, useEffect } from 'react';
import { DashboardLayout, useUserFromToken } from '@/components/DashboardLayout';
import { mockGetUsers, mockToggleUserActive } from '@/services/mockData';

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV = [
    {
        label: 'Admin Panel', href: '/dashboard/eoc',
        icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    },
    {
        label: 'Applications', href: '/dashboard/eoc/applications',
        icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    },
];

export default function EOCApplications() {
    const tokenUser = useUserFromToken();
    const [users, setUsers] = useState(mockGetUsers());
    const [toast, setToast] = useState('');

    const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

    const toggle = (id: string, active: boolean) => {
        mockToggleUserActive(id, !active);
        setUsers(mockGetUsers());
        showToast(`User ${!active ? 'activated' : 'deactivated'}`);
    };

    const institutions = users.filter(u => u.role === 'institution');
    const phoUsers     = users.filter(u => u.role === 'pho');

    return (
        <DashboardLayout navItems={NAV} role="eoc" userName={tokenUser?.name || 'EOC Admin'}>
            {toast && (
                <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold">{toast}</div>
            )}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Applications &amp; Authorization</h1>
                <p className="text-slate-500 text-sm mt-0.5">Manage institution and PHO account access</p>
            </div>

            {/* Institutions */}
            <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">🏥 Registered Institutions ({institutions.length})</p>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-50">
                    {institutions.map(u => (
                        <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0" style={{ background: u.color }}>
                                {u.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900">{u.name}</p>
                                <p className="text-xs text-slate-400">{u.email}</p>
                                {'zone' in u && <p className="text-xs text-slate-400 mt-0.5">Zone: {(u as any).zone}</p>}
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                                u.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}>{u.active ? 'Active' : 'Disabled'}</span>
                            <button onClick={() => toggle(u.id, u.active)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                                    u.active ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100' : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                                }`}>
                                {u.active ? 'Deactivate' : 'Activate'}
                            </button>
                        </div>
                    ))}
                    {institutions.length === 0 && <div className="px-5 py-8 text-center text-sm text-slate-400">No institutions registered</div>}
                </div>
            </div>

            {/* PHO Officers */}
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">🩺 PHO Officers ({phoUsers.length})</p>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-50">
                    {phoUsers.map(u => (
                        <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0" style={{ background: u.color }}>
                                {u.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900">{u.name}</p>
                                <p className="text-xs text-slate-400">{u.email}</p>
                                {'zone' in u && <p className="text-xs text-slate-400 mt-0.5">Zone: {(u as any).zone}</p>}
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                                u.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}>{u.active ? 'Active' : 'Disabled'}</span>
                            <button onClick={() => toggle(u.id, u.active)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                                    u.active ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100' : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                                }`}>
                                {u.active ? 'Deactivate' : 'Activate'}
                            </button>
                        </div>
                    ))}
                    {phoUsers.length === 0 && <div className="px-5 py-8 text-center text-sm text-slate-400">No PHO officers registered</div>}
                </div>
            </div>
        </DashboardLayout>
    );
}

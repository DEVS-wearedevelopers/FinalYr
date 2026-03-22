'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient } from '@/services/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SystemLog {
    id: string;
    level: 'info' | 'warn' | 'error';
    timestamp: string;
    method?: string;
    path?: string;
    status?: number;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    message: string;
    detail?: string;
    durationMs?: number;
}
interface LogStats { total: number; errors: number; warnings: number; info: number; oldestEntry: string | null; newestEntry: string | null; }
interface UserProfile { id: string; email: string; role: string; first_name: string | null; last_name: string | null; created_at: string; can_broadcast: boolean; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function levelBadge(level: 'info' | 'warn' | 'error') {
    if (level === 'error') return 'bg-red-100 text-red-700 border-red-200';
    if (level === 'warn') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-600 border-blue-200';
}
function relTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    return new Date(iso).toLocaleTimeString();
}

// ─── Nav (matches EOC sidebar) ────────────────────────────────────────────────
const NAV = [
    { label: 'Command Centre', href: '/dashboard/eoc', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { label: 'Applications', href: '/dashboard/eoc/applications', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: 'SORMAS Sync', href: '/dashboard/eoc/sormas', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> },
    { label: 'System Admin', href: '/dashboard/eoc/system', icon: <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

// ─── Sub-tabs ─────────────────────────────────────────────────────────────────
type Tab = 'logs' | 'users';

export default function SystemAdminScreen() {
    const [tab, setTab] = useState<Tab>('logs');

    // logs state
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [stats, setStats] = useState<LogStats | null>(null);
    const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
    const [logsLoading, setLogsLoading] = useState(false);
    const [logErr, setLogErr] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);

    // users state
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('all');
    const [userErr, setUserErr] = useState('');

    const [toast, setToast] = useState('');
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

    // ── Fetch logs ──────────────────────────────────────────────────────────────
    const fetchLogs = useCallback(async () => {
        setLogsLoading(true);
        setLogErr('');
        try {
            const level = logFilter === 'all' ? undefined : logFilter;
            const params = new URLSearchParams({ limit: '200' });
            if (level) params.set('level', level);
            const [logsRes, statsRes] = await Promise.all([
                apiClient.get(`/admin/logs?${params}`),
                apiClient.get('/admin/logs/stats'),
            ]);
            setLogs(logsRes.data.logs ?? []);
            setStats(statsRes.data);
        } catch {
            setLogErr('Failed to load logs. Check your authentication.');
        } finally {
            setLogsLoading(false);
        }
    }, [logFilter]);

    useEffect(() => { if (tab === 'logs') fetchLogs(); }, [tab, fetchLogs]);
    useEffect(() => {
        if (!autoRefresh || tab !== 'logs') return;
        const id = setInterval(fetchLogs, 10_000);
        return () => clearInterval(id);
    }, [autoRefresh, tab, fetchLogs]);

    // ── Fetch users ─────────────────────────────────────────────────────────────
    const fetchUsers = useCallback(async () => {
        setUsersLoading(true);
        setUserErr('');
        try {
            const params = userRoleFilter !== 'all' ? `?role=${userRoleFilter}` : '';
            const res = await apiClient.get(`/admin/users${params}`);
            setUsers(res.data.users ?? []);
        } catch {
            setUserErr('Failed to load users.');
        } finally {
            setUsersLoading(false);
        }
    }, [userRoleFilter]);

    useEffect(() => { if (tab === 'users') fetchUsers(); }, [tab, fetchUsers]);

    const toggleUserStatus = async (userId: string, currentlyActive: boolean) => {
        try {
            await apiClient.patch(`/admin/users/${userId}/status`, { active: !currentlyActive });
            showToast(`User ${!currentlyActive ? 'activated' : 'deactivated'}`);
            fetchUsers();
        } catch {
            showToast('Failed to update user status.');
        }
    };

    const clearLogs = async () => {
        try {
            await apiClient.delete('/admin/logs');
            showToast('Log buffer cleared.');
            fetchLogs();
        } catch {
            showToast('Failed to clear logs.');
        }
    };

    const filteredUsers = users.filter(u => {
        const q = userSearch.toLowerCase();
        return !q || u.email.toLowerCase().includes(q) || `${u.first_name} ${u.last_name}`.toLowerCase().includes(q);
    });

    return (
        <DashboardLayout navItems={NAV} role="eoc" userName="EOC Admin">
            {toast && (
                <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold animate-fade-in">
                    {toast}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">System Administration</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Server logs · User management · Platform health</p>
                </div>
                {stats && (
                    <div className="flex items-center gap-3 text-xs">
                        <span className="px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold">{stats.errors} errors</span>
                        <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">{stats.warnings} warnings</span>
                        <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">{stats.info} info</span>
                    </div>
                )}
            </div>

            {/* Tab switcher */}
            <div className="flex items-center gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
                {([['logs', 'Error Logs'], ['users', 'User Management']] as [Tab, string][]).map(([id, label]) => (
                    <button key={id} onClick={() => setTab(id)}
                        className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Logs Tab ── */}
            {tab === 'logs' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            {(['all', 'error', 'warn', 'info'] as const).map(l => (
                                <button key={l} onClick={() => setLogFilter(l)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${logFilter === l ? (l === 'error' ? 'bg-red-600 text-white border-red-600' : l === 'warn' ? 'bg-amber-500 text-white border-amber-500' : l === 'info' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-800 text-white border-slate-800') : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                                    {l.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                                <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="rounded" />
                                Auto-refresh (10s)
                            </label>
                            <button onClick={fetchLogs} disabled={logsLoading}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all disabled:opacity-50">
                                {logsLoading ? 'Loading…' : '↻ Refresh'}
                            </button>
                            <button onClick={clearLogs}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all">
                                Clear Buffer
                            </button>
                        </div>
                    </div>

                    {logErr && (
                        <div className="px-5 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{logErr}</div>
                    )}

                    {/* Log rows */}
                    <div className="overflow-x-auto">
                        {logsLoading && logs.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Loading logs…</div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm">
                                <svg className="w-8 h-8 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                No log entries — the system is clean.
                            </div>
                        ) : (
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-slate-400 font-medium uppercase tracking-wide border-b border-slate-100 bg-slate-50/60">
                                        <th className="px-4 py-3 text-left w-20">Level</th>
                                        <th className="px-4 py-3 text-left w-24">Time</th>
                                        <th className="px-4 py-3 text-left w-16">Status</th>
                                        <th className="px-4 py-3 text-left w-14">Method</th>
                                        <th className="px-4 py-3 text-left">Message</th>
                                        <th className="px-4 py-3 text-left w-20">User</th>
                                        <th className="px-4 py-3 text-right w-16">ms</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-mono">
                                    {logs.map(log => (
                                        <tr key={log.id} className={`hover:bg-slate-50/80 ${log.level === 'error' ? 'bg-red-50/30' : log.level === 'warn' ? 'bg-amber-50/20' : ''}`}>
                                            <td className="px-4 py-2.5">
                                                <span className={`inline-block px-2 py-0.5 rounded-full font-bold border text-[10px] ${levelBadge(log.level)}`}>{log.level}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{relTime(log.timestamp)}</td>
                                            <td className="px-4 py-2.5 font-bold text-slate-600">{log.status ?? '—'}</td>
                                            <td className="px-4 py-2.5">
                                                {log.method && <span className={`font-bold ${log.method === 'GET' ? 'text-green-600' : log.method === 'POST' ? 'text-blue-600' : log.method === 'PATCH' ? 'text-amber-600' : log.method === 'DELETE' ? 'text-red-600' : 'text-slate-600'}`}>{log.method}</span>}
                                            </td>
                                            <td className="px-4 py-2.5 max-w-xs">
                                                <p className="text-slate-800 truncate font-sans text-xs">{log.message}</p>
                                                {log.detail && <p className="text-slate-400 text-[10px] truncate mt-0.5">{log.detail}</p>}
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-400">
                                                {log.userRole ? <span className="capitalize">{log.userRole}</span> : <span className="text-slate-300">anon</span>}
                                            </td>
                                            <td className="px-4 py-2.5 text-right text-slate-400">{log.durationMs != null ? `${log.durationMs}` : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* ── Users Tab ── */}
            {tab === 'users' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="text" placeholder="Search by name or email…" value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                className="h-9 px-3.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1] outline-none w-64"
                            />
                            <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)}
                                className="h-9 px-3.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1e52f1]/20 focus:border-[#1e52f1] outline-none bg-white">
                                <option value="all">All roles</option>
                                <option value="eoc">EOC</option>
                                <option value="pho">PHO</option>
                                <option value="institution">Institution</option>
                                <option value="civilian">Civilian</option>
                            </select>
                        </div>
                        <button onClick={fetchUsers} disabled={usersLoading}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all disabled:opacity-50">
                            {usersLoading ? 'Loading…' : '↻ Refresh'}
                        </button>
                    </div>

                    {userErr && (
                        <div className="px-5 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{userErr}</div>
                    )}

                    <div className="overflow-x-auto">
                        {usersLoading && users.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Loading users…</div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">No users found.</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs text-slate-400 font-medium uppercase tracking-wide border-b border-slate-100 bg-slate-50/60">
                                        <th className="px-5 py-3 text-left">User</th>
                                        <th className="px-5 py-3 text-left">Role</th>
                                        <th className="px-5 py-3 text-left">Joined</th>
                                        <th className="px-5 py-3 text-left">Broadcast</th>
                                        <th className="px-5 py-3 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/60">
                                            <td className="px-5 py-3.5">
                                                <p className="font-semibold text-slate-900">{u.first_name} {u.last_name}</p>
                                                <p className="text-xs text-slate-400">{u.email}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${u.role === 'eoc' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        u.role === 'pho' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                            u.role === 'institution' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}>{u.role}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-slate-500">
                                                {new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${u.can_broadcast ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                                                    {u.can_broadcast ? 'Active' : 'Restricted'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => toggleUserStatus(u.id, true)}
                                                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-all">
                                                        Deactivate
                                                    </button>
                                                    <button onClick={() => toggleUserStatus(u.id, false)}
                                                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 transition-all">
                                                        Activate
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

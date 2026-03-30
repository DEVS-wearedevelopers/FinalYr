'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DashboardLayout, useUserFromToken } from '@/components/DashboardLayout';
import {
  mockGetUsers, mockGetAuditLogs, mockGetBroadcasts,
  mockToggleUserActive, mockRemoveBroadcast,
  type AuditLog, type Broadcast,
} from '@/services/mockData';
import { useMockSync } from '@/hooks/useMockSync';
import { useWsSync } from '@/hooks/useWsSync';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useHttpSync } from '@/hooks/useHttpSync';
import { onLiveDevicesChange, type LiveDevice } from '@/services/httpSync';
import SyncStatusBadge from '@/components/SyncStatusBadge';
import { onSyncLogChange, getSyncLogs, type SyncLogEntry, type SyncLogLevel } from '@/services/syncLogger';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rel(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

function roleBadge(role: string) {
  const map: Record<string, string> = {
    civilian:    'bg-green-100 text-green-700 border-green-200',
    institution: 'bg-blue-100 text-blue-700 border-blue-200',
    pho:         'bg-purple-100 text-purple-700 border-purple-200',
    eoc:         'bg-red-100 text-red-700 border-red-200',
  };
  return map[role] || 'bg-slate-100 text-slate-600 border-slate-200';
}

function severityBadge(s: AuditLog['severity']) {
  if (s === 'critical') return 'bg-red-50 text-red-700 border-red-200';
  if (s === 'warning')  return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

function levelColor(l: SyncLogLevel) {
  if (l === 'ERROR')   return 'text-red-300 bg-red-950/40 border-red-800';
  if (l === 'WARN')    return 'text-amber-300 bg-amber-950/40 border-amber-800';
  if (l === 'SUCCESS') return 'text-green-300 bg-green-950/40 border-green-800';
  if (l === 'DEBUG')   return 'text-slate-500 bg-slate-800/40 border-slate-700';
  return 'text-blue-300 bg-blue-950/40 border-blue-900';
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <p className="text-sm font-semibold text-slate-800">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700">Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ─── EOC Dashboard ─────────────────────────────────────────────────────────────
export default function EOCDashboard() {
  const tokenUser = useUserFromToken();

  const [activeTab, setActiveTab]   = useState<'users' | 'logs' | 'broadcasts' | 'system' | 'live'>('users');
  const [users, setUsers]           = useState(mockGetUsers());
  const [logs, setLogs]             = useState<AuditLog[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [sysLogs, setSysLogs]       = useState<SyncLogEntry[]>([]);
  const [sysFilter, setSysFilter]   = useState<'all' | 'ERROR' | 'WARN' | 'INFO' | 'SUCCESS' | 'DEBUG'>('all');
  const [toast, setToast]           = useState('');
  const [confirm, setConfirm]       = useState<null | { message: string; action: () => void }>(null);
  const [liveDevices, setLiveDevices] = useState<LiveDevice[]>([]);
  const logEndRef                   = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    setUsers(mockGetUsers());
    setLogs(mockGetAuditLogs());
    setBroadcasts(mockGetBroadcasts());
  }, []);
  useMockSync(load);
  useWsSync(load);
  useSupabaseSync(load);
  useHttpSync(load, 'eoc'); // polls render.com, also populates liveDevices

  // Live sync log — auto-refreshes on every new entry
  useEffect(() => {
    setSysLogs(getSyncLogs());
    const unsub = onSyncLogChange(() => setSysLogs(getSyncLogs()));
    return unsub;
  }, []);

  useEffect(() => onLiveDevicesChange(setLiveDevices), []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleToggle = (userId: string, currentActive: boolean) => {
    const user = users.find(u => u.id === userId)!;
    setConfirm({
      message: `${currentActive ? 'Deactivate' : 'Activate'} ${user.name} (${user.role})? This will ${currentActive ? 'block' : 'restore'} their access immediately.`,
      action: () => {
        mockToggleUserActive(userId, !currentActive);
        setUsers(mockGetUsers());
        setLogs(mockGetAuditLogs());
        // sysLogs auto-refresh via syncLogger subscription
        showToast(`${user.name} ${!currentActive ? 'activated' : 'deactivated'}`);
        setConfirm(null);
      },
    });
  };

  const handleRemoveBroadcast = (id: string) => {
    mockRemoveBroadcast(id);
    setBroadcasts(mockGetBroadcasts());
    setLogs(mockGetAuditLogs());
    showToast('Broadcast removed');
  };



  // Stats
  const activeUsers      = users.filter(u => u.active).length;
  const pendingUsers     = users.filter(u => !u.active).length;
  const criticalLogs     = logs.filter(l => l.severity === 'critical').length;
  const activeBroadcasts = broadcasts.filter(b => b.active).length;
  const sysErrors = sysLogs.filter(l => l.level === 'ERROR').length;
  const sysWarns  = sysLogs.filter(l => l.level === 'WARN').length;

  const visibleSysLogs = sysFilter === 'all' ? sysLogs : sysLogs.filter(l => l.level === sysFilter);

  return (
    <DashboardLayout navItems={NAV} role="eoc" userName={tokenUser?.name || 'EOC Admin'}>
      {toast && (
        <div className="fixed top-5 right-5 z-[300] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold">
          {toast}
        </div>
      )}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">EOC Administration</h1>
          <p className="text-sm text-slate-500 mt-1">Account management · Authorization · Audit &amp; System logs</p>
        </div>
        <div className="flex items-center gap-2">
          <SyncStatusBadge />
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-700">EOC Admin — Full Access</span>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Active Users',      value: activeUsers,      color: 'bg-green-50 text-green-700 border-green-100',  icon: '✅' },
          { label: 'Deactivated',       value: pendingUsers,     color: 'bg-slate-50 text-slate-600 border-slate-200',  icon: '🚫' },
          { label: 'Active Broadcasts', value: activeBroadcasts, color: 'bg-amber-50 text-amber-700 border-amber-100',  icon: '📢' },
          { label: 'Critical Events',   value: criticalLogs,     color: 'bg-red-50 text-red-700 border-red-100',        icon: '🚨' },
          { label: 'Sync Errors',       value: sysErrors,        color: sysErrors > 0 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-200', icon: '💥' },
          { label: 'Sync Warnings',     value: sysWarns,         color: sysWarns > 3 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-200', icon: '⚠️' },
        ].map(card => (
          <div key={card.label} className={`rounded-2xl border p-4 ${card.color}`}>
            <p className="text-xs font-bold opacity-70 uppercase tracking-wide">{card.label}</p>
            <p className="text-3xl font-black mt-1">{card.value}</p>
            <p className="text-lg mt-1">{card.icon}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit mb-6 overflow-x-auto">
        {([
          ['users',      '👥 Users'],
          ['broadcasts', '📢 Broadcasts'],
          ['logs',       '📋 Audit Log'],
          ['system',     '🖥️ System Logs'],
          ['live',       '📡 Live Devices'],
        ] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            } ${tab === 'system' && sysErrors > 0 ? 'relative' : ''}`}>
            {label}
            {tab === 'system' && sysErrors > 0 && (
              <span className="ml-1.5 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">{sysErrors}</span>
            )}
            {tab === 'live' && liveDevices.length > 0 && (
              <span className="ml-1.5 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">{liveDevices.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── USER MANAGEMENT TAB ── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">User Accounts</h2>
            <span className="text-xs text-slate-400">{users.length} total accounts</span>
          </div>
          <div className="divide-y divide-slate-50">
            {users.map(user => (
              <div key={user.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
                  style={{ background: user.color }}>
                  {user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${roleBadge(user.role)}`}>
                  {user.role}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  user.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}>
                  {user.active ? 'Active' : 'Disabled'}
                </span>
                {user.role !== 'eoc' && (
                  <button onClick={() => handleToggle(user.id, user.active)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                      user.active
                        ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                        : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                    }`}>
                    {user.active ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BROADCASTS TAB ── */}
      {activeTab === 'broadcasts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Active Broadcasts</h2>
            <span className="text-xs text-slate-400">{broadcasts.length} total</span>
          </div>
          {broadcasts.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">No broadcasts</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {broadcasts.map(bc => (
                <div key={bc.id} className={`px-5 py-4 ${bc.type === 'lockdown' ? 'bg-purple-50' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          bc.type === 'lockdown' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                          bc.active ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                          {bc.type === 'lockdown' ? '🔒 LOCKDOWN' : bc.active ? '📢 Active' : 'Removed'}
                        </span>
                        <span className="text-xs text-slate-400">{rel(bc.created_at)}</span>
                      </div>
                      <p className={`text-sm font-bold ${bc.type === 'lockdown' ? 'text-purple-900' : 'text-slate-900'}`}>{bc.title}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{bc.message}</p>
                      <p className="text-xs text-slate-400 mt-1">Issued by {bc.issued_by} · {bc.zone}</p>
                    </div>
                    {bc.active && (
                      <button onClick={() => handleRemoveBroadcast(bc.id)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 transition-all shrink-0">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── AUDIT LOG TAB ── */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Audit Log</h2>
            <button onClick={() => setLogs(mockGetAuditLogs())} className="text-xs text-slate-400 hover:text-slate-700 font-semibold">
              ↺ Refresh
            </button>
          </div>
          <div className="overflow-y-auto max-h-[60vh] divide-y divide-slate-50">
            {logs.map(log => (
              <div key={log.id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50/60 transition-colors">
                <span className={`shrink-0 mt-0.5 text-xs font-bold px-2 py-0.5 rounded-full border ${severityBadge(log.severity)}`}>
                  {log.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">{log.action}</p>
                  <p className="text-xs text-slate-500 truncate">by <strong>{log.actor}</strong> · {log.target}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{rel(log.timestamp)}</span>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-slate-400">No log events yet.</div>
            )}
          </div>
        </div>
      )}

      {/* ── SYSTEM LOGS TAB ── */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          {/* Sync error summary */}
          {(sysErrors > 0 || sysWarns > 0) && (
            <div className={`rounded-2xl p-4 border flex items-start gap-3 ${sysErrors > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
              <span className="text-xl">{sysErrors > 0 ? '💥' : '⚠️'}</span>
              <div>
                <p className={`text-sm font-bold ${sysErrors > 0 ? 'text-red-800' : 'text-amber-800'}`}>
                  {sysErrors > 0 ? `${sysErrors} sync error(s) detected` : `${sysWarns} sync warning(s)`}
                </p>
                <p className={`text-xs mt-0.5 ${sysErrors > 0 ? 'text-red-700' : 'text-amber-700'}`}>
                  Check WS-RELAY and HTTP-RELAY entries. Errors here mean cross-device sync may be degraded.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-sm font-bold text-slate-800">Live Sync Log</h2>
                <span className="text-xs text-slate-400">({visibleSysLogs.length}/{sysLogs.length} entries · streams in real time)</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Transport status pills */}
                <SyncStatusBadge />
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                  {(['all', 'ERROR', 'WARN', 'SUCCESS', 'INFO', 'DEBUG'] as const).map(f => (
                    <button key={f} onClick={() => setSysFilter(f)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        sysFilter === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                      } ${f === 'ERROR' && sysFilter !== 'ERROR' && sysErrors > 0 ? 'text-red-500' : ''}`}>
                      {f === 'all' ? 'All' : f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Log entries — terminal style, live streaming */}
            <div className="overflow-y-auto max-h-[60vh] font-mono divide-y divide-white/5 bg-slate-950 rounded-b-2xl">
              {visibleSysLogs.map(log => (
                <div key={log.id} className={`px-5 py-2.5 flex items-start gap-3 hover:bg-white/5 transition-colors ${
                  log.level === 'ERROR'   ? 'border-l-2 border-red-500' :
                  log.level === 'WARN'    ? 'border-l-2 border-amber-500' :
                  log.level === 'SUCCESS' ? 'border-l-2 border-green-500' : ''
                }`}>
                  {/* Timestamp */}
                  <span className="text-slate-600 text-[10px] shrink-0 mt-0.5 hidden sm:block tabular-nums">
                    {new Date(log.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  {/* Level badge */}
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border shrink-0 w-16 text-center ${levelColor(log.level)}`}>
                    {log.level}
                  </span>
                  {/* Module */}
                  <span className="text-slate-500 text-[10px] font-bold shrink-0 w-28 truncate">[{log.module}]</span>
                  {/* Message */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${
                      log.level === 'ERROR'   ? 'text-red-300' :
                      log.level === 'WARN'    ? 'text-amber-300' :
                      log.level === 'SUCCESS' ? 'text-green-300' :
                      log.level === 'DEBUG'   ? 'text-slate-500' : 'text-slate-300'
                    }`}>{log.message}</p>
                    {log.detail && (
                      <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed font-mono">{log.detail}</p>
                    )}
                  </div>
                </div>
              ))}
              {visibleSysLogs.length === 0 && (
                <div className="py-10 text-center text-xs text-slate-600">
                  No entries yet — sync activity will appear here automatically
                </div>
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE DEVICES TAB ── */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Live Connected Devices</h2>
              <p className="text-xs text-slate-400 mt-0.5">Updated every 1.5s via render.com relay</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-green-700">{liveDevices.length} online</span>
            </div>
          </div>

          {liveDevices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 px-5 py-16 text-center">
              <p className="text-3xl mb-3">📡</p>
              <p className="text-sm font-semibold text-slate-600">No devices detected yet</p>
              <p className="text-xs text-slate-400 mt-1">Open any dashboard on another device — it will appear here within 3 seconds</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {liveDevices.map((d) => {
                const secsAgo = Math.floor((Date.now() - d.lastSeen) / 1000);
                const roleColors: Record<string, string> = {
                  civilian:    'bg-green-100 text-green-700 border-green-200',
                  institution: 'bg-blue-100 text-blue-700 border-blue-200',
                  pho:         'bg-purple-100 text-purple-700 border-purple-200',
                  eoc:         'bg-red-100 text-red-700 border-red-200',
                };
                const roleColor = roleColors[d.role] ?? 'bg-slate-100 text-slate-600 border-slate-200';
                return (
                  <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl shrink-0">
                      {d.device === 'mobile' ? '📱' : '🖥️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-900 truncate">{d.user}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${roleColor}`}>{d.role}</span>
                      </div>
                      <p className="text-xs text-slate-400">{d.device === 'mobile' ? 'Mobile device' : 'Desktop browser'}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-slate-400">
                          {secsAgo < 3 ? 'Active now' : `Active ${secsAgo}s ago`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 leading-relaxed">
            <p className="font-bold text-slate-600 mb-1">How this works</p>
            Every dashboard polls <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">GET /sync/state</code> on the render.com backend every 1.5 seconds and announces its presence.
            Devices that haven&lsquo;t polled in 30 seconds are removed automatically.
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

'use client';
import React, { useState, useRef, useCallback } from 'react';
import { DashboardLayout, useUserFromToken } from '@/components/DashboardLayout';
import {
  mockGetUsers, mockGetAuditLogs, mockGetBroadcasts, mockGetReports,
  mockToggleUserActive, mockRemoveBroadcast, MOCK_STATE,
  type AuditLog, type Broadcast,
} from '@/services/mockData';
import { useMockSync } from '@/hooks/useMockSync';
import { useWsSync } from '@/hooks/useWsSync';

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

// ─── System Log entry type ────────────────────────────────────────────────────
type SysLog = {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  module: string;
  message: string;
  detail?: string;
};

function levelColor(l: SysLog['level']) {
  if (l === 'ERROR') return 'text-red-600 bg-red-50 border-red-200';
  if (l === 'WARN')  return 'text-amber-700 bg-amber-50 border-amber-200';
  if (l === 'DEBUG') return 'text-slate-400 bg-slate-50 border-slate-100';
  return 'text-blue-700 bg-blue-50 border-blue-100';
}

function levelDot(l: SysLog['level']) {
  if (l === 'ERROR') return 'bg-red-500';
  if (l === 'WARN')  return 'bg-amber-500';
  if (l === 'DEBUG') return 'bg-slate-400';
  return 'bg-blue-500';
}

// ─── Generate realistic system logs from current mock state ───────────────────
function buildSystemLogs(): SysLog[] {
  const logs: SysLog[] = [];
  const now = Date.now();

  const add = (
    minsAgo: number, level: SysLog['level'], module: string, message: string, detail?: string
  ) => {
    logs.push({
      id: `sys-${minsAgo}-${module}`,
      timestamp: new Date(now - minsAgo * 60000).toISOString(),
      level, module, message, detail,
    });
  };

  // System boot
  add(4320, 'INFO',  'BOOT',       'DOMRS application started — offline demo mode');
  add(4319, 'INFO',  'AUTH',       'Mock auth provider initialized');
  add(4318, 'INFO',  'MOCKDATA',   'Seed data loaded: 2 reports, 1 alert, 1 broadcast');
  add(4317, 'INFO',  'MAP',        'Leaflet tile server connected — openstreetmap.org');
  add(4315, 'DEBUG', 'ROUTER',     'App router initialized — 22 static routes generated');

  // Auth events
  add(2880, 'INFO',  'AUTH',       'Login: eoc@domrs.demo (EOC Admin) — success');
  add(2879, 'INFO',  'AUTH',       'Login: hospital@domrs.demo (Institution) — success');
  add(2878, 'INFO',  'AUTH',       'Login: pho@domrs.demo (PHO) — success');

  // CBS scoring
  const reports = MOCK_STATE.reports;
  reports.forEach((r, i) => {
    const minsAgo = Math.floor((now - new Date(r.created_at).getTime()) / 60000);
    add(minsAgo - 1, 'INFO', 'CBS-ENGINE',
      `CBS score computed: ${r.cbs_score?.toFixed(3)} for report ${r.id}`,
      `source=${r.source} severity=${r.severity} symptoms=${r.symptom_matrix.length}`);
    if (r.cbs_score && r.cbs_score >= 0.85) {
      add(minsAgo - 2, 'WARN', 'CBS-ENGINE',
        `High-risk threshold breached (CBS=${r.cbs_score.toFixed(2)}) — auto-alert raised`,
        `report_id=${r.id} zone=Lagos Island`);
    }
  });

  // Alert events
  const alerts = MOCK_STATE.alerts;
  alerts.forEach(a => {
    const minsAgo = Math.floor((now - new Date(a.created_at).getTime()) / 60000);
    add(minsAgo, 'INFO', 'ALERT-MGR',
      `Alert created: ${a.id} [status=${a.status}] CBS=${a.cbs_score}`,
      `zone=${a.zone_id} report=${a.report_id}`);
    if (a.bypass_reason) {
      add(minsAgo + 1, 'WARN', 'BYPASS',
        `Auto-bypass triggered: ${a.bypass_reason}`,
        `alert_id=${a.id}`);
    }
  });

  // Broadcast events
  const broadcasts = MOCK_STATE.broadcasts;
  broadcasts.forEach(b => {
    const minsAgo = Math.floor((now - new Date(b.created_at).getTime()) / 60000);
    add(minsAgo, 'WARN', 'BROADCAST',
      `Broadcast issued: "${b.title}" [type=${b.type}]`,
      `zone=${b.zone} issuer=${b.issued_by}`);
    if (b.type === 'lockdown') {
      add(minsAgo + 1, 'ERROR', 'BROADCAST',
        `⚠️ LOCKDOWN broadcast dispatched — zone=${b.zone}`,
        `All area entities notified. Emergency protocol activated.`);
    }
  });

  // Legacy HTTP attempts — now fully mocked, shown as WARN not ERROR
  add(120, 'WARN',  'HTTP-CLIENT',
    'GET /alerts/national → intercepted (offline mode) — routed to mockData',
    'alertsService is fully mocked. No network call was made. No action needed.');
  add(119, 'WARN',  'HTTP-CLIENT',
    'Supabase realtime subscription skipped — offline mode active',
    'Mock data store is the source of truth for this session.');
  add(118, 'INFO',  'MOCK-SERVICE',
    'alertsService → fully mocked: all methods return MOCK_STATE data');
  add(117, 'INFO',  'MOCK-SERVICE',
    'reportsService → fully mocked: getReportsFeed() returns MOCK_STATE.reports');

  // Map events
  add(110, 'INFO',  'MAP',     'CivilianMap initialized — Lagos center [6.524, 3.379] zoom=11');
  add(109, 'INFO',  'MAP',     `Map pins loaded: ${MOCK_STATE.reports.filter(r => r.origin_lat).length} reports with coordinates`);
  add(108, 'DEBUG', 'MAP',     'PHOLiveMap auto-refresh interval set: 5000ms');

  // AI analysis
  if (MOCK_STATE.analyses.length > 0) {
    const a = MOCK_STATE.analyses[0];
    const minsAgo = Math.floor((now - new Date(a.generated_at).getTime()) / 60000);
    add(minsAgo, 'INFO', 'AI-ENGINE',
      `Analysis generated — risk=${a.risk_level} trend=${a.trend} hotspot=${a.hotspot}`,
      `patients=${a.total_patients} sentinel=${a.sentinel_count} community=${a.community_count}`);
  }

  // Sort newest first
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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

  const [activeTab, setActiveTab]   = useState<'users' | 'logs' | 'broadcasts' | 'system'>('users');
  const [users, setUsers]           = useState(mockGetUsers());
  const [logs, setLogs]             = useState<AuditLog[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [sysLogs, setSysLogs]       = useState<SysLog[]>([]);
  const [sysFilter, setSysFilter]   = useState<'all' | 'ERROR' | 'WARN' | 'INFO'>('all');
  const [toast, setToast]           = useState('');
  const [confirm, setConfirm]       = useState<null | { message: string; action: () => void }>(null);
  const logEndRef                   = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    setUsers(mockGetUsers());
    setLogs(mockGetAuditLogs());
    setBroadcasts(mockGetBroadcasts());
    setSysLogs(buildSystemLogs());
  }, []);
  useMockSync(load);
  useWsSync(load); // cross-device real-time sync via WebSocket

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleToggle = (userId: string, currentActive: boolean) => {
    const user = users.find(u => u.id === userId)!;
    setConfirm({
      message: `${currentActive ? 'Deactivate' : 'Activate'} ${user.name} (${user.role})? This will ${currentActive ? 'block' : 'restore'} their access immediately.`,
      action: () => {
        mockToggleUserActive(userId, !currentActive);
        setUsers(mockGetUsers());
        setLogs(mockGetAuditLogs());
        setSysLogs(buildSystemLogs());
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

  const refreshSysLogs = () => {
    setSysLogs(buildSystemLogs());
    showToast('System logs refreshed');
  };

  // Stats
  const activeUsers      = users.filter(u => u.active).length;
  const pendingUsers     = users.filter(u => !u.active).length;
  const criticalLogs     = logs.filter(l => l.severity === 'critical').length;
  const activeBroadcasts = broadcasts.filter(b => b.active).length;
  const sysErrors        = sysLogs.filter(l => l.level === 'ERROR').length;
  const sysWarns         = sysLogs.filter(l => l.level === 'WARN').length;

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
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-red-700">EOC Admin — Full Access</span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Active Users',      value: activeUsers,      color: 'bg-green-50 text-green-700 border-green-100',  icon: '✅' },
          { label: 'Deactivated',       value: pendingUsers,     color: 'bg-slate-50 text-slate-600 border-slate-200',  icon: '🚫' },
          { label: 'Active Broadcasts', value: activeBroadcasts, color: 'bg-amber-50 text-amber-700 border-amber-100',  icon: '📢' },
          { label: 'Critical Events',   value: criticalLogs,     color: 'bg-red-50 text-red-700 border-red-100',        icon: '🚨' },
          { label: 'Sys Errors',        value: sysErrors,        color: sysErrors > 0 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-200', icon: '💥' },
          { label: 'Sys Warnings',      value: sysWarns,         color: sysWarns > 3 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-200', icon: '⚠️' },
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
        ] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            } ${tab === 'system' && sysErrors > 0 ? 'relative' : ''}`}>
            {label}
            {tab === 'system' && sysErrors > 0 && (
              <span className="ml-1.5 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">{sysErrors}</span>
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
          {/* Error / warn summary */}
          {(sysErrors > 0 || sysWarns > 0) && (
            <div className={`rounded-2xl p-4 border flex items-start gap-3 ${sysErrors > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
              <span className="text-xl">{sysErrors > 0 ? '💥' : '⚠️'}</span>
              <div>
                <p className={`text-sm font-bold ${sysErrors > 0 ? 'text-red-800' : 'text-amber-800'}`}>
                  {sysErrors > 0 ? `${sysErrors} error(s) detected` : `${sysWarns} warning(s) detected`}
                </p>
                <p className={`text-xs mt-0.5 ${sysErrors > 0 ? 'text-red-700' : 'text-amber-700'}`}>
                  Most are expected in offline demo mode — HTTP client timeouts are automatically bypassed by the mock layer.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-sm font-bold text-slate-800">Application &amp; Error Logs</h2>
                <span className="text-xs text-slate-400">({visibleSysLogs.length}/{sysLogs.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                  {(['all', 'ERROR', 'WARN', 'INFO'] as const).map(f => (
                    <button key={f} onClick={() => setSysFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        sysFilter === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                      } ${f === 'ERROR' && sysFilter !== 'ERROR' && sysErrors > 0 ? 'text-red-500' : ''}`}>
                      {f === 'all' ? 'All' : f}
                    </button>
                  ))}
                </div>
                <button onClick={refreshSysLogs}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Refresh
                </button>
              </div>
            </div>

            {/* Log entries — terminal style */}
            <div className="overflow-y-auto max-h-[60vh] font-mono divide-y divide-slate-50 bg-slate-900 rounded-b-2xl">
              {visibleSysLogs.map(log => (
                <div key={log.id} className={`px-5 py-2.5 flex items-start gap-3 hover:bg-white/5 transition-colors group ${
                  log.level === 'ERROR' ? 'border-l-2 border-red-500' :
                  log.level === 'WARN'  ? 'border-l-2 border-amber-500' : ''
                }`}>
                  {/* Timestamp */}
                  <span className="text-slate-500 text-xs shrink-0 mt-0.5 hidden sm:block">
                    {new Date(log.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  {/* Level badge */}
                  <span className={`text-xs font-black px-2 py-0.5 rounded border shrink-0 w-14 text-center ${levelColor(log.level)}`}>
                    {log.level}
                  </span>
                  {/* Module */}
                  <span className="text-slate-400 text-xs font-bold shrink-0 w-24 truncate">[{log.module}]</span>
                  {/* Message */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${
                      log.level === 'ERROR' ? 'text-red-300' :
                      log.level === 'WARN'  ? 'text-amber-300' :
                      log.level === 'DEBUG' ? 'text-slate-500' : 'text-slate-300'
                    }`}>{log.message}</p>
                    {log.detail && (
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{log.detail}</p>
                    )}
                  </div>
                </div>
              ))}
              {visibleSysLogs.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">No logs match filter</div>
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

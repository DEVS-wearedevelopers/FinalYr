/**
 * DOMRS — Offline Mock Data Store
 * 
 * Replaces all Supabase + backend API calls for demo.
 * 4 Demo accounts — all run locally, no internet required.
 *
 * Demo accounts:
 *   civilian@domrs.demo  / Demo1234  → Civilian
 *   hospital@domrs.demo  / Demo1234  → Institution (Lagos General Hospital)
 *   pho@domrs.demo       / Demo1234  → PHO
 *   eoc@domrs.demo       / Demo1234  → EOC Admin
 */

// ─── Demo Users ───────────────────────────────────────────────────────────────
export const DEMO_USERS = [
  {
    id: 'usr-civilian-001',
    email: 'civilian@domrs.demo',
    password: 'Demo1234',
    role: 'civilian',
    name: 'Emeka Nwosu',
    avatar: 'EN',
    color: '#16a34a',
    active: true,
  },
  {
    id: 'usr-institution-001',
    email: 'hospital@domrs.demo',
    password: 'Demo1234',
    role: 'institution',
    name: 'Lagos General Hospital',
    avatar: 'LG',
    color: '#1e52f1',
    active: true,
    facilityName: 'Lagos General Hospital',
    // Fixed GPS coords — Lagos Island / V.I. area
    lat: 6.4541,
    lng: 3.3947,
    zone: 'Lagos Island / V.I.',
    status: 'approved',
  },
  {
    id: 'usr-pho-001',
    email: 'pho@domrs.demo',
    password: 'Demo1234',
    role: 'pho',
    name: 'Dr. Amaka Osei',
    avatar: 'AO',
    color: '#7c3aed',
    active: true,
    zone: 'Lagos Island / V.I.',
  },
  {
    id: 'usr-eoc-001',
    email: 'eoc@domrs.demo',
    password: 'Demo1234',
    role: 'eoc',
    name: 'EOC Admin',
    avatar: 'EA',
    color: '#dc2626',
    active: true,
  },
  {
    id: 'usr-civilian-002',
    email: 'kryan2333@gmail.com',
    password: '123456',
    role: 'civilian',
    name: 'Kryan',
    avatar: 'KR',
    color: '#0891b2',
    active: true,
  },
];

// Fixed coords per institution
export const INSTITUTION_COORDS: Record<string, { lat: number; lng: number }> = {
  'usr-institution-001': { lat: 6.4541, lng: 3.3947 },
};

// Community zone coords (LGA → coords)
export const LGA_COORDS: Record<string, { lat: number; lng: number }> = {
  'surulere':   { lat: 6.4960, lng: 3.3560 },
  'ikeja':      { lat: 6.5944, lng: 3.3583 },
  'ikorodu':    { lat: 6.6052, lng: 3.5022 },
  'lagos island': { lat: 6.4541, lng: 3.3947 },
  'apapa':      { lat: 6.4481, lng: 3.3633 },
  'kosofe':     { lat: 6.5900, lng: 3.3950 },
  'alimosho':   { lat: 6.5510, lng: 3.2750 },
  'mushin':     { lat: 6.5333, lng: 3.3500 },
  'oshodi':     { lat: 6.5500, lng: 3.3167 },
  'shomolu':    { lat: 6.5333, lng: 3.3833 },
};

// ─── Types ────────────────────────────────────────────────────────────────────
export type Report = {
  id: string;
  source: 'sentinel' | 'community';
  organization_id: string | null;
  patient_count: number;
  symptom_matrix: string[];
  severity: number;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  notes?: string;
  created_at: string;
  status: 'pending_ai' | 'ai_scored' | 'pho_review' | 'validated' | 'dismissed';
  cbs_score?: number;
  lga?: string;
};

export type AiAlert = {
  id: string;
  report_id: string;
  cbs_score: number;
  severity_index: number;
  status: 'pending_investigation' | 'investigating' | 'probable' | 'confirmed' | 'invalidated';
  zone_id: string;
  bypass_reason: string | null;
  created_at: string;
  claimed_by?: string | null;
  justification?: string;
  sentinel_reports?: {
    organization_id: string;
    patient_count: number;
    symptom_matrix: string[];
    origin_address: string;
    origin_lat: number;
    origin_lng: number;
  };
};

export type BroadcastType = 'respiratory' | 'enteric' | 'hemorrhagic' | 'general' | 'lockdown';

export type Broadcast = {
  id: string;
  type: BroadcastType;
  title: string;
  message: string;
  issued_by: string;
  zone: string;
  created_at: string;
  active: boolean;
};

export type AuditLog = {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
};

export type AiAnalysis = {
  id: string;
  generated_at: string;
  summary: string;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  dominant_symptoms: string[];
  hotspot: string;
  total_patients: number;
  sentinel_count: number;
  community_count: number;
  recommendation: string;
  trend: 'rising' | 'stable' | 'declining';
};

// ─── Seed Data ────────────────────────────────────────────────────────────────
const now = () => new Date().toISOString();
const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();

// Keep 2 seed reports (enough to prime the demo)
const SEED_REPORTS: Report[] = [
  {
    id: 'rpt-001',
    source: 'sentinel',
    organization_id: 'usr-institution-001',
    patient_count: 14,
    symptom_matrix: ['Fever', 'Cough', 'Difficulty breathing'],
    severity: 8,
    origin_address: 'Lagos General Hospital, Lagos Island',
    origin_lat: 6.4541,
    origin_lng: 3.3947,
    notes: 'Multiple ward admissions with similar presentation.',
    created_at: ago(120),
    status: 'ai_scored',
    cbs_score: 0.87,
  },
  {
    id: 'rpt-002',
    source: 'community',
    organization_id: null,
    patient_count: 3,
    symptom_matrix: ['Fever', 'Headache', 'Body aches'],
    severity: 5,
    origin_address: 'Surulere, Lagos',
    origin_lat: 6.4960,
    origin_lng: 3.3560,
    lga: 'Surulere',
    created_at: ago(60),
    status: 'pending_ai',
    cbs_score: 0.42,
  },
];

const SEED_ALERTS: AiAlert[] = [
  {
    id: 'alt-001',
    report_id: 'rpt-001',
    cbs_score: 0.87,
    severity_index: 8,
    status: 'investigating',
    zone_id: 'Lagos Island / V.I.',
    bypass_reason: null,
    created_at: ago(120),
    claimed_by: 'usr-pho-001',
    sentinel_reports: {
      organization_id: 'usr-institution-001',
      patient_count: 14,
      symptom_matrix: ['Fever', 'Cough', 'Difficulty breathing'],
      origin_address: 'Lagos General Hospital, Lagos Island',
      origin_lat: 6.4541,
      origin_lng: 3.3947,
    },
  },
];

const SEED_BROADCASTS: Broadcast[] = [
  {
    id: 'brd-001',
    type: 'respiratory',
    title: 'Respiratory Advisory — Heightened Surveillance',
    message:
      'An advisory has been issued for respiratory illness in the Lagos Island zone. All facilities should increase surveillance and report unusual clusters immediately.',
    issued_by: 'Dr. Amaka Osei (PHO)',
    zone: 'Lagos Island / V.I.',
    created_at: ago(200),
    active: true,
  },
];

const SEED_AUDIT_LOGS: AuditLog[] = [
  { id: 'log-001', actor: 'Dr. Amaka Osei', action: 'Claimed alert alt-001', target: 'Alert #alt-001', timestamp: ago(115), severity: 'info' },
  { id: 'log-002', actor: 'EOC Admin', action: 'Activated user usr-pho-001', target: 'Dr. Amaka Osei (PHO)', timestamp: ago(2880), severity: 'info' },
  { id: 'log-003', actor: 'EOC Admin', action: 'Activated user usr-institution-001', target: 'Lagos General Hospital', timestamp: ago(4320), severity: 'info' },
  { id: 'log-004', actor: 'Lagos General Hospital', action: 'Submitted sentinel report rpt-001', target: 'Report #rpt-001', timestamp: ago(120), severity: 'warning' },
  { id: 'log-005', actor: 'Emeka Nwosu', action: 'Submitted community report rpt-002', target: 'Surulere, Lagos', timestamp: ago(60), severity: 'info' },
];

// ─── In-memory State ─────────────────────────────────────────────────────────
export const MOCK_STATE = {
  reports:    [...SEED_REPORTS]    as Report[],
  alerts:     [...SEED_ALERTS]     as AiAlert[],
  broadcasts: [...SEED_BROADCASTS] as Broadcast[],
  auditLogs:  [...SEED_AUDIT_LOGS] as AuditLog[],
  users:      DEMO_USERS.map(u => ({ ...u })) as typeof DEMO_USERS,
  analyses:   [] as AiAnalysis[],
};

// ─── Event Bus + Cross-Tab Sync via localStorage ─────────────────────────────────────────
export type MermsUpdateType = 'report' | 'alert' | 'broadcast' | 'user' | 'analysis';

const STORAGE_KEY = 'domrs_state_v1';

/** Save mutable slices of MOCK_STATE to localStorage for cross-tab sync */
function saveToStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      reports:    MOCK_STATE.reports,
      alerts:     MOCK_STATE.alerts,
      broadcasts: MOCK_STATE.broadcasts,
      auditLogs:  MOCK_STATE.auditLogs,
      ts: Date.now(),
    }));
  } catch { /* quota exceeded — silently skip */ }
}

/** Read back from localStorage and merge into MOCK_STATE (called by other tabs) */
export function loadFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed.reports)    MOCK_STATE.reports    = parsed.reports;
    if (parsed.alerts)     MOCK_STATE.alerts     = parsed.alerts;
    if (parsed.broadcasts) MOCK_STATE.broadcasts = parsed.broadcasts;
    if (parsed.auditLogs)  MOCK_STATE.auditLogs  = parsed.auditLogs;
    return true;
  } catch { return false; }
}

/**
 * Emit update: fires window custom event (same tab) + writes localStorage (other tabs).
 * Components subscribe to BOTH:
 *   window.addEventListener('domrs:update', load)          // same tab
 *   window.addEventListener('storage', onStorage)          // other tabs
 */
export function emitUpdate(type: MermsUpdateType) {
  saveToStorage();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('domrs:update', { detail: { type } }));
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export function mockLogin(email: string, password: string) {
  const user = DEMO_USERS.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) throw new Error('Invalid email or password');
  const st = MOCK_STATE.users.find(u => u.id === user.id);
  if (st && !st.active) throw new Error('Account is deactivated. Contact your EOC admin.');
  const payload = { id: user.id, role: user.role, name: user.name, email: user.email };
  const token = btoa(JSON.stringify(payload));
  return { token, role: user.role, name: user.name };
}

export function mockGetCurrentUser(token: string) {
  try { return JSON.parse(atob(token)) as { id: string; role: string; name: string; email: string }; }
  catch { return null; }
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export function mockGetReports(orgId?: string): Report[] {
  const list = orgId
    ? MOCK_STATE.reports.filter(r => r.organization_id === orgId)
    : MOCK_STATE.reports;
  return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function mockGetAllMapPins(): Report[] {
  return MOCK_STATE.reports.filter(r => r.origin_lat && r.origin_lng);
}

export function mockSubmitReport(payload: {
  source: 'sentinel' | 'community';
  organization_id?: string;
  patient_count: number;
  symptom_matrix: string[];
  severity: number;
  origin_address: string;
  origin_lat?: number;
  origin_lng?: number;
  notes?: string;
  lga?: string;
}): Report {
  const cbs = parseFloat(Math.min(0.99, (payload.severity / 10) * 0.65 + Math.random() * 0.3).toFixed(2));

  // Resolve coords
  let lat = payload.origin_lat ?? 0;
  let lng = payload.origin_lng ?? 0;

  if (!lat && payload.organization_id && INSTITUTION_COORDS[payload.organization_id]) {
    lat = INSTITUTION_COORDS[payload.organization_id].lat;
    lng = INSTITUTION_COORDS[payload.organization_id].lng;
  }
  if (!lat && payload.lga) {
    const key = payload.lga.toLowerCase();
    const match = Object.entries(LGA_COORDS).find(([k]) => key.includes(k));
    if (match) { lat = match[1].lat; lng = match[1].lng; }
  }

  const newReport: Report = {
    id: `rpt-${Date.now()}`,
    source: payload.source,
    organization_id: payload.organization_id ?? null,
    patient_count: payload.patient_count,
    symptom_matrix: payload.symptom_matrix,
    severity: payload.severity,
    origin_address: payload.origin_address,
    origin_lat: lat,
    origin_lng: lng,
    notes: payload.notes,
    lga: payload.lga,
    created_at: now(),
    status: payload.source === 'sentinel' ? 'ai_scored' : 'pending_ai',
    cbs_score: cbs,
  };
  MOCK_STATE.reports.unshift(newReport);

  // Auto-generate alert if CBS high enough for sentinel reports
  if (cbs >= 0.45 && payload.source === 'sentinel') {
    const newAlert: AiAlert = {
      id: `alt-${Date.now()}`,
      report_id: newReport.id,
      cbs_score: cbs,
      severity_index: payload.severity,
      status: cbs >= 0.85 ? 'probable' : 'pending_investigation',
      zone_id: 'Lagos Island / V.I.',
      bypass_reason: cbs >= 0.85 ? 'CBS ≥ 0.85 — auto-escalated' : null,
      created_at: now(),
      claimed_by: null,
      sentinel_reports: {
        organization_id: payload.organization_id ?? 'unknown',
        patient_count: payload.patient_count,
        symptom_matrix: payload.symptom_matrix,
        origin_address: payload.origin_address,
        origin_lat: lat,
        origin_lng: lng,
      },
    };
    MOCK_STATE.alerts.unshift(newAlert);
    emitUpdate('alert');
  }

  // Regenerate AI analysis
  generateAiAnalysis();

  addAuditLog(
    payload.organization_id ? 'Lagos General Hospital' : 'Emeka Nwosu',
    `Submitted ${payload.source} report (${payload.patient_count} patients)`,
    payload.origin_address,
    payload.severity >= 8 ? 'critical' : payload.severity >= 5 ? 'warning' : 'info'
  );

  emitUpdate('report');
  return newReport;
}

// ─── Analytics (Institution) ─────────────────────────────────────────────────
export function mockGetAnalytics(orgId: string) {
  const orgReports = MOCK_STATE.reports.filter(r => r.organization_id === orgId);
  const n = new Date();
  const thisMonth = orgReports.filter(r => {
    const d = new Date(r.created_at);
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  });
  const lastMonth = orgReports.filter(r => {
    const d = new Date(r.created_at);
    const lm = new Date(n.getFullYear(), n.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });
  const activeBroadcast = MOCK_STATE.broadcasts.find(b => b.active);
  return {
    dataQualityScore: 88,
    reportsThisMonth: thisMonth.length,
    reportsLastMonth: Math.max(0, lastMonth.length),
    eocFlags: [] as string[],
    advisory: activeBroadcast
      ? { active: true, severity: activeBroadcast.type === 'lockdown' ? 'red' : 'amber', message: activeBroadcast.message }
      : { active: false, severity: '', message: '' },
  };
}

// ─── Alerts (PHO) ─────────────────────────────────────────────────────────────
export function mockGetAlerts(): AiAlert[] {
  return [...MOCK_STATE.alerts].sort((a, b) => b.cbs_score - a.cbs_score);
}

export function mockClaimAlert(alertId: string, userId: string): AiAlert {
  const alert = MOCK_STATE.alerts.find(a => a.id === alertId);
  if (!alert) throw new Error('Alert not found');
  alert.claimed_by = userId;
  alert.status = 'investigating';
  addAuditLog('Dr. Amaka Osei', `Claimed alert ${alertId}`, `Alert #${alertId}`, 'info');
  emitUpdate('alert');
  return alert;
}

export function mockUpdateAlertStatus(
  alertId: string,
  status: AiAlert['status'],
  justification: string
): AiAlert {
  const alert = MOCK_STATE.alerts.find(a => a.id === alertId);
  if (!alert) throw new Error('Alert not found');
  alert.status = status;
  alert.justification = justification;
  const report = MOCK_STATE.reports.find(r => r.id === alert.report_id);
  if (report) report.status = status === 'confirmed' ? 'validated' : 'pho_review';
  addAuditLog('Dr. Amaka Osei', `Updated alert → ${status}`, `Alert #${alertId}`, status === 'confirmed' ? 'critical' : 'warning');
  emitUpdate('alert');
  return alert;
}

export function mockEscalateAlert(alertId: string): void {
  addAuditLog('Dr. Amaka Osei', `Escalated alert ${alertId} to EOC`, `Alert #${alertId}`, 'critical');
  emitUpdate('alert');
}

/** PHO: Reverse an alert back to pending_investigation for re-triage */
export function mockReverseAlert(alertId: string): AiAlert {
  const alert = MOCK_STATE.alerts.find(a => a.id === alertId);
  if (!alert) throw new Error('Alert not found');
  const prev = alert.status;
  alert.status = 'pending_investigation';
  alert.justification = undefined;
  alert.claimed_by = null;
  const report = MOCK_STATE.reports.find(r => r.id === alert.report_id);
  if (report) report.status = 'ai_scored';
  addAuditLog('Dr. Amaka Osei', `Reversed alert ${alertId} from ${prev} → pending`, `Alert #${alertId}`, 'warning');
  emitUpdate('alert');
  return alert;
}

/** PHO: Delete/invalidate an alert permanently */
export function mockDeleteAlert(alertId: string): void {
  const idx = MOCK_STATE.alerts.findIndex(a => a.id === alertId);
  if (idx === -1) return;
  const alert = MOCK_STATE.alerts[idx];
  alert.status = 'invalidated';
  addAuditLog('Dr. Amaka Osei', `Invalidated and removed alert ${alertId}`, `Alert #${alertId}`, 'warning');
  // Actually remove from active list
  MOCK_STATE.alerts.splice(idx, 1);
  emitUpdate('alert');
}

// ─── Broadcasts ───────────────────────────────────────────────────────────────
export function mockGetBroadcasts(): Broadcast[] {
  return [...MOCK_STATE.broadcasts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export const BROADCAST_TEMPLATES: Array<{
  id: string; type: BroadcastType; name: string; text: string; color: string; icon: string;
}> = [
  {
    id: 't1', type: 'respiratory', name: 'Respiratory Advisory',
    text: 'An advisory has been issued for respiratory illness in your zone. All facilities should increase surveillance and report unusual clusters immediately.',
    color: '#3b82f6', icon: '🫁',
  },
  {
    id: 't2', type: 'enteric', name: 'Enteric Outbreak Warning',
    text: 'A potential enteric outbreak has been identified. All facilities in your zone should activate outbreak protocols immediately.',
    color: '#f59e0b', icon: '🤢',
  },
  {
    id: 't3', type: 'hemorrhagic', name: 'Hemorrhagic Alert',
    text: 'URGENT: Suspected hemorrhagic fever detected in your zone. Implement contact tracing and isolation procedures immediately.',
    color: '#dc2626', icon: '🩸',
  },
  {
    id: 't4', type: 'general', name: 'General Health Watch',
    text: 'Elevated disease activity observed in your zone. Facilities and civilians should remain on heightened alert.',
    color: '#64748b', icon: '📢',
  },
  {
    id: 't5', type: 'lockdown', name: '🔒 Zone Lockdown — Highly Contagious',
    text: 'CRITICAL: Highly contagious disease activity confirmed in your zone. IMMEDIATE LOCKDOWN ORDERED. Residents must stay indoors. Non-emergency movement prohibited. All facilities switch to outbreak response mode. PHO field teams have been deployed.',
    color: '#7c3aed', icon: '🔒',
  },
];

export function mockSendBroadcast(payload: {
  type: BroadcastType;
  title: string;
  message: string;
  issuerName: string;
  zone: string;
}): Broadcast {
  const bc: Broadcast = {
    id: `brd-${Date.now()}`,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    issued_by: payload.issuerName,
    zone: payload.zone,
    created_at: now(),
    active: true,
  };
  MOCK_STATE.broadcasts.unshift(bc);
  addAuditLog(payload.issuerName, `Issued broadcast: ${payload.title}`, `Zone: ${payload.zone}`,
    payload.type === 'lockdown' || payload.type === 'hemorrhagic' ? 'critical' : 'warning');
  emitUpdate('broadcast');
  return bc;
}

export function mockRemoveBroadcast(id: string): void {
  const bc = MOCK_STATE.broadcasts.find(b => b.id === id);
  if (bc) {
    bc.active = false;
    addAuditLog('EOC Admin', `Removed broadcast: ${bc.title}`, bc.zone, 'info');
    emitUpdate('broadcast');
  }
}

// ─── EOC User Management ──────────────────────────────────────────────────────
export function mockGetUsers() { return [...MOCK_STATE.users]; }

export function mockToggleUserActive(userId: string, active: boolean): void {
  const user = MOCK_STATE.users.find(u => u.id === userId);
  if (user) {
    user.active = active;
    addAuditLog('EOC Admin', `${active ? 'Activated' : 'Deactivated'} ${user.name}`, `${user.name} (${user.role})`, active ? 'info' : 'warning');
    emitUpdate('user');
  }
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export function mockGetAuditLogs(): AuditLog[] {
  return [...MOCK_STATE.auditLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function addAuditLog(actor: string, action: string, target: string, severity: AuditLog['severity']) {
  MOCK_STATE.auditLogs.unshift({ id: `log-${Date.now()}`, actor, action, target, timestamp: now(), severity });
}

// ─── Civilian Trends ──────────────────────────────────────────────────────────
export function mockGetNationalTrends() {
  const alerts = MOCK_STATE.alerts;
  return {
    totalAlerts: alerts.length,
    confirmed: alerts.filter(a => a.status === 'confirmed').length,
    investigating: alerts.filter(a => a.status === 'investigating').length,
    probable: alerts.filter(a => a.status === 'probable').length,
    avgCbs: parseFloat((alerts.reduce((s, a) => s + a.cbs_score, 0) / Math.max(alerts.length, 1)).toFixed(2)),
  };
}

export function mockGetLocalAlerts(): AiAlert[] {
  return MOCK_STATE.alerts.filter(a => a.status !== 'invalidated');
}

// ─── AI Analysis Engine ───────────────────────────────────────────────────────
export function generateAiAnalysis(): AiAnalysis {
  const reports = MOCK_STATE.reports;
  const recent = reports.slice(0, 10); // last 10

  // Tally symptoms
  const symptomCount: Record<string, number> = {};
  let totalPatients = 0;
  reports.forEach(r => {
    totalPatients += r.patient_count;
    r.symptom_matrix.forEach(s => { symptomCount[s] = (symptomCount[s] ?? 0) + 1; });
  });

  const dominantSymptoms = Object.entries(symptomCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([s]) => s);

  const avgCbs = MOCK_STATE.alerts.length > 0
    ? MOCK_STATE.alerts.reduce((s, a) => s + a.cbs_score, 0) / MOCK_STATE.alerts.length
    : 0.3;

  const confirmed   = MOCK_STATE.alerts.filter(a => a.status === 'confirmed').length;
  const investigating = MOCK_STATE.alerts.filter(a => a.status === 'investigating').length;

  let risk: AiAnalysis['risk_level'] = 'low';
  if (avgCbs >= 0.8 || confirmed > 0) risk = 'critical';
  else if (avgCbs >= 0.6 || investigating >= 2) risk = 'high';
  else if (avgCbs >= 0.4 || reports.length >= 3) risk = 'moderate';

  // Find hotspot (most reports)
  const locationCount: Record<string, number> = {};
  reports.forEach(r => {
    const loc = r.lga || r.origin_address?.split(',')[0] || 'Unknown';
    locationCount[loc] = (locationCount[loc] ?? 0) + r.patient_count;
  });
  const hotspot = Object.entries(locationCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown';

  const sentinelCount  = reports.filter(r => r.source === 'sentinel').length;
  const communityCount = reports.filter(r => r.source === 'community').length;

  // Trend: if more than half reports are in last 2 hours, rising
  const recentCutoff = Date.now() - 2 * 60 * 60000;
  const recentCount = reports.filter(r => new Date(r.created_at).getTime() > recentCutoff).length;
  const trend: AiAnalysis['trend'] = recentCount >= 2 ? 'rising' : recentCount === 1 ? 'stable' : 'declining';

  const symptomsStr = dominantSymptoms.join(', ') || 'mixed symptoms';
  const riskEmoji = { low: '🟢', moderate: '🟡', high: '🟠', critical: '🔴' }[risk];

  const summaryLines: Record<AiAnalysis['risk_level'], string> = {
    low: `Surveillance data for the Lagos Island zone shows ${reports.length} report(s) with ${totalPatients} total patients across ${sentinelCount} sentinel and ${communityCount} community submissions. Dominant presentations include ${symptomsStr}. Risk profile is currently LOW — no clustering patterns detected. Continued routine monitoring recommended.`,
    moderate: `Moderate activity detected across ${reports.length} report(s) covering ${totalPatients} patients. The hotspot is ${hotspot} with dominant symptoms: ${symptomsStr}. CBS scores average ${avgCbs.toFixed(2)}. ${investigating > 0 ? `${investigating} alert(s) under PHO investigation.` : ''} Recommend increased surveillance and community awareness messaging.`,
    high: `HIGH alert — ${reports.length} reports filed, ${totalPatients} cumulative patients. Hotspot: ${hotspot}. Primary syndrome cluster: ${symptomsStr} (CBS avg ${avgCbs.toFixed(2)}). ${investigating} alert(s) under active PHO investigation. Immediate field assessment recommended. Prepare isolation and contact tracing resources.`,
    critical: `🚨 CRITICAL — ${confirmed > 0 ? `${confirmed} CONFIRMED outbreak(s) active.` : 'Imminent outbreak risk.'} ${totalPatients} patients across ${reports.length} reports. Hotspot: ${hotspot}. Syndrome: ${symptomsStr}. CBS avg ${avgCbs.toFixed(2)} — above emergency threshold. FULL OUTBREAK RESPONSE PROTOCOL should be activated immediately. PHO field teams should be deployed and EOC briefed.`,
  };

  const recommendations: Record<AiAnalysis['risk_level'], string> = {
    low: 'Maintain routine reporting cadence. No escalation needed.',
    moderate: 'Issue area advisory. Brief PHO on clustering trend. Increase sentinel report frequency.',
    high: 'Dispatch PHO field team to hotspot. Issue public health advisory. Prepare isolation capacity.',
    critical: 'ACTIVATE OUTBREAK PROTOCOL. Deploy field teams. Issue zone lockdown advisory if transmission confirmed. Notify EOC and national NCDC.',
  };

  const analysis: AiAnalysis = {
    id: `ai-${Date.now()}`,
    generated_at: now(),
    summary: summaryLines[risk],
    risk_level: risk,
    dominant_symptoms: dominantSymptoms,
    hotspot,
    total_patients: totalPatients,
    sentinel_count: sentinelCount,
    community_count: communityCount,
    recommendation: recommendations[risk],
    trend,
  };

  MOCK_STATE.analyses.unshift(analysis);
  if (MOCK_STATE.analyses.length > 20) MOCK_STATE.analyses.splice(20);
  return analysis;
}

export function mockGetLatestAnalysis(): AiAnalysis | null {
  if (MOCK_STATE.analyses.length === 0) generateAiAnalysis();
  return MOCK_STATE.analyses[0] ?? null;
}

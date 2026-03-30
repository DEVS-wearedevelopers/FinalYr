'use client';
/**
 * syncLogger.ts — Captures real-time sync events from all layers.
 *
 * WS events, HTTP poll results, Supabase channel status changes, and
 * emitUpdate() calls are all logged here with timestamps.
 *
 * Components read from this to show a truthful live log, not fabricated static text.
 */

export type SyncLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS';

export type SyncLogEntry = {
  id:        string;
  ts:        number;      // Date.now()
  level:     SyncLogLevel;
  module:    string;
  message:   string;
  detail?:   string;
};

// In-memory ring buffer — keep last 200 entries
const MAX_ENTRIES = 200;
const _entries: SyncLogEntry[] = [];
let _seq = 0;

const _listeners: Array<() => void> = [];

function add(level: SyncLogLevel, module: string, message: string, detail?: string) {
  const entry: SyncLogEntry = {
    id:      `sl-${++_seq}`,
    ts:      Date.now(),
    level,
    module,
    message,
    detail,
  };
  _entries.unshift(entry);
  if (_entries.length > MAX_ENTRIES) _entries.splice(MAX_ENTRIES);
  _listeners.forEach(fn => fn());
  // Also dispatch a DOM event so non-React code can react
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('domrs:synclog', { detail: entry }));
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
export const syncLog = {
  info:    (module: string, msg: string, detail?: string) => add('INFO',    module, msg, detail),
  warn:    (module: string, msg: string, detail?: string) => add('WARN',    module, msg, detail),
  error:   (module: string, msg: string, detail?: string) => add('ERROR',   module, msg, detail),
  debug:   (module: string, msg: string, detail?: string) => add('DEBUG',   module, msg, detail),
  success: (module: string, msg: string, detail?: string) => add('SUCCESS', module, msg, detail),
};

/** Get a snapshot of log entries. Optionally filter by level. */
export function getSyncLogs(filter?: SyncLogLevel | 'all'): SyncLogEntry[] {
  if (!filter || filter === 'all') return [..._entries];
  return _entries.filter(e => e.level === filter);
}

/** Subscribe to log changes. Returns unsubscribe fn. */
export function onSyncLogChange(fn: () => void): () => void {
  _listeners.push(fn);
  return () => {
    const i = _listeners.indexOf(fn);
    if (i !== -1) _listeners.splice(i, 1);
  };
}

// ── Bootstrap log entries ──────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  add('INFO', 'BOOT', 'DOMRS sync layer initialised');
  add('DEBUG', 'CONFIG', `API URL: ${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}`,
    `Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(hardcoded fallback)'}`);
}

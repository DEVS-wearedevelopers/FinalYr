/**
 * MERMS System Logger — v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Written to:
 *   data/app.log   — all levels (JSONL, one entry per line)
 *   data/error.log — errors only (JSONL, one entry per line)
 *
 * Also keeps an in-memory rolling buffer for GET /admin/logs.
 * Colour-coded stdout output is preserved.
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR   = path.resolve(__dirname, '../../../../data');
const APP_LOG    = path.join(DATA_DIR, 'app.log');
const ERROR_LOG  = path.join(DATA_DIR, 'error.log');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export type LogLevel = 'info' | 'warn' | 'error';

export interface SystemLog {
    id: string;
    level: LogLevel;
    timestamp: string;
    module?: string;       // e.g. 'reports', 'auth', 'admin'
    method?: string;
    path?: string;
    status?: number;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    message: string;
    detail?: string;
    data?: unknown;        // arbitrary structured data
    durationMs?: number;
}

class SystemLogger {
    private logs: SystemLog[] = [];
    private readonly MAX = 500;

    private push(log: SystemLog) {
        // ── In-memory buffer ──────────────────────────────────────────────────
        this.logs.unshift(log);
        if (this.logs.length > this.MAX) this.logs.pop();

        // ── Colour-coded stdout ───────────────────────────────────────────────
        const colour =
            log.level === 'error' ? '\x1b[31m' :
            log.level === 'warn'  ? '\x1b[33m' : '\x1b[36m';
        const mod = log.module ? `[${log.module.toUpperCase()}]` : '';
        console.log(
            `${colour}[${log.level.toUpperCase()}]\x1b[0m${mod} ${log.timestamp} ` +
            `${log.method ?? ''} ${log.path ?? ''} ${log.status ?? ''} — ${log.message}`
        );
        if (log.detail) console.log(`        ↳ ${log.detail}`);
        if (log.data)   console.log(`        ↳ data:`, JSON.stringify(log.data));

        // ── File persistence ──────────────────────────────────────────────────
        try {
            ensureDataDir();
            const line = JSON.stringify(log) + '\n';
            fs.appendFileSync(APP_LOG, line, 'utf-8');
            if (log.level === 'error') {
                fs.appendFileSync(ERROR_LOG, line, 'utf-8');
            }
        } catch (fileErr) {
            // Don't let logging failures crash the app
            console.error('[SYSLOG] ⚠️  Failed to write log to file:', fileErr);
        }
    }

    // ── Public log methods ────────────────────────────────────────────────────

    info(message: string, meta: Partial<Omit<SystemLog, 'id' | 'level' | 'timestamp' | 'message'>> = {}) {
        this.push({ id: crypto.randomUUID(), level: 'info', timestamp: new Date().toISOString(), message, ...meta });
    }

    warn(message: string, meta: Partial<Omit<SystemLog, 'id' | 'level' | 'timestamp' | 'message'>> = {}) {
        this.push({ id: crypto.randomUUID(), level: 'warn', timestamp: new Date().toISOString(), message, ...meta });
    }

    error(message: string, meta: Partial<Omit<SystemLog, 'id' | 'level' | 'timestamp' | 'message'>> = {}) {
        this.push({ id: crypto.randomUUID(), level: 'error', timestamp: new Date().toISOString(), message, ...meta });
    }

    /** Log a full HTTP error with request context */
    logRequestError(opts: {
        method: string;
        path: string;
        status: number;
        error: any;
        module?: string;
        userId?: string;
        userEmail?: string;
        userRole?: string;
        durationMs?: number;
        data?: unknown;
    }) {
        const message = opts.error?.message ?? String(opts.error);
        this.push({
            id: crypto.randomUUID(),
            level: opts.status >= 500 ? 'error' : 'warn',
            timestamp: new Date().toISOString(),
            module: opts.module,
            method: opts.method,
            path: opts.path,
            status: opts.status,
            userId: opts.userId,
            userEmail: opts.userEmail,
            userRole: opts.userRole,
            message: `${opts.status} ${opts.method} ${opts.path} — ${message}`,
            detail: opts.error?.stack ? opts.error.stack.split('\n').slice(0, 3).join(' | ') : undefined,
            data: opts.data,
            durationMs: opts.durationMs,
        });
    }

    /** Log a module-level error (non-HTTP) */
    logModuleError(module: string, step: string, message: string, error: any, data?: unknown) {
        this.push({
            id: crypto.randomUUID(),
            level: 'error',
            timestamp: new Date().toISOString(),
            module,
            message: `[${step}] ${message}`,
            detail: error?.message ?? String(error),
            data,
        });
    }

    // ── Query API ─────────────────────────────────────────────────────────────

    getLogs(opts: { level?: LogLevel; module?: string; limit?: number; offset?: number } = {}) {
        let result = this.logs;
        if (opts.level)  result = result.filter(l => l.level === opts.level);
        if (opts.module) result = result.filter(l => l.module === opts.module);
        const total  = result.length;
        const offset = opts.offset ?? 0;
        const limit  = opts.limit  ?? 100;
        return { total, offset, limit, logs: result.slice(offset, offset + limit) };
    }

    stats() {
        return {
            total:       this.logs.length,
            errors:      this.logs.filter(l => l.level === 'error').length,
            warnings:    this.logs.filter(l => l.level === 'warn').length,
            info:        this.logs.filter(l => l.level === 'info').length,
            logFiles:    { app: APP_LOG, errors: ERROR_LOG },
            oldestEntry: this.logs[this.logs.length - 1]?.timestamp ?? null,
            newestEntry: this.logs[0]?.timestamp ?? null,
        };
    }

    clear() { this.logs = []; }
}

// Singleton
export const syslog = new SystemLogger();

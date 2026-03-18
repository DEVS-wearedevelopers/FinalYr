/**
 * MERMS System Logger
 * -------------------
 * In-memory circular buffer for structured error/event logs.
 * Logs are accessible via GET /admin/logs (EOC-only).
 * Also writes to stdout with colour-coded levels.
 */

export type LogLevel = 'info' | 'warn' | 'error';

export interface SystemLog {
    id: string;
    level: LogLevel;
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

class SystemLogger {
    private logs: SystemLog[] = [];
    private readonly MAX = 500; // rolling buffer

    private push(log: SystemLog) {
        this.logs.unshift(log); // newest first
        if (this.logs.length > this.MAX) this.logs.pop();

        // Colour-coded stdout
        const colour = log.level === 'error' ? '\x1b[31m' : log.level === 'warn' ? '\x1b[33m' : '\x1b[36m';
        console.log(`${colour}[${log.level.toUpperCase()}]\x1b[0m ${log.timestamp} ${log.method ?? ''} ${log.path ?? ''} ${log.status ?? ''} — ${log.message}`);
        if (log.detail) console.log(`        ↳ ${log.detail}`);
    }

    info(message: string, meta: Partial<Omit<SystemLog, 'id' | 'level' | 'timestamp' | 'message'>> = {}) {
        this.push({ id: crypto.randomUUID(), level: 'info', timestamp: new Date().toISOString(), message, ...meta });
    }

    warn(message: string, meta: Partial<Omit<SystemLog, 'id' | 'level' | 'timestamp' | 'message'>> = {}) {
        this.push({ id: crypto.randomUUID(), level: 'warn', timestamp: new Date().toISOString(), message, ...meta });
    }

    error(message: string, meta: Partial<Omit<SystemLog, 'id' | 'level' | 'timestamp' | 'message'>> = {}) {
        this.push({ id: crypto.randomUUID(), level: 'error', timestamp: new Date().toISOString(), message, ...meta });
    }

    /** Log an HTTP request error with full context */
    logRequestError(opts: {
        method: string;
        path: string;
        status: number;
        error: any;
        userId?: string;
        userEmail?: string;
        userRole?: string;
        durationMs?: number;
    }) {
        const message = opts.error?.message ?? String(opts.error);
        this.push({
            id: crypto.randomUUID(),
            level: opts.status >= 500 ? 'error' : 'warn',
            timestamp: new Date().toISOString(),
            method: opts.method,
            path: opts.path,
            status: opts.status,
            userId: opts.userId,
            userEmail: opts.userEmail,
            userRole: opts.userRole,
            message: `${opts.status} ${opts.method} ${opts.path} — ${message}`,
            detail: opts.error?.stack ? opts.error.stack.split('\n').slice(0, 3).join(' | ') : undefined,
            durationMs: opts.durationMs,
        });
    }

    /** Returns filtered + paginated logs */
    getLogs(opts: { level?: LogLevel; limit?: number; offset?: number } = {}) {
        let result = this.logs;
        if (opts.level) result = result.filter(l => l.level === opts.level);
        const total = result.length;
        const offset = opts.offset ?? 0;
        const limit = opts.limit ?? 100;
        return {
            total,
            offset,
            limit,
            logs: result.slice(offset, offset + limit),
        };
    }

    stats() {
        return {
            total: this.logs.length,
            errors: this.logs.filter(l => l.level === 'error').length,
            warnings: this.logs.filter(l => l.level === 'warn').length,
            info: this.logs.filter(l => l.level === 'info').length,
            oldestEntry: this.logs[this.logs.length - 1]?.timestamp ?? null,
            newestEntry: this.logs[0]?.timestamp ?? null,
        };
    }

    clear() {
        this.logs = [];
    }
}

// Singleton — import this everywhere
export const syslog = new SystemLogger();

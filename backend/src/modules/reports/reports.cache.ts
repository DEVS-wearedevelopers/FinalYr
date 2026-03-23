/**
 * reports.cache.ts
 * Local JSON file cache for sentinel reports.
 * Reports are written here BEFORE any DB call.
 * This ensures no report is ever silently lost even if the DB insert fails.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR  = path.resolve(__dirname, '../../../data');
const CACHE_FILE = path.join(CACHE_DIR, 'pending_reports.json');

export interface CachedReport {
    cacheId: string;
    savedAt: string;
    status: 'pending' | 'synced' | 'failed';
    dbReportId?: string;
    payload: Record<string, unknown>;
    user: { id: string; email: string; role: string; organizationId?: string };
    error?: string;
}

function ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
        console.log(`[CACHE] 📁 Created cache directory: ${CACHE_DIR}`);
    }
}

function readAll(): CachedReport[] {
    try {
        if (!fs.existsSync(CACHE_FILE)) return [];
        const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
        return JSON.parse(raw) as CachedReport[];
    } catch (e) {
        console.error('[CACHE] ⚠️  Failed to read cache file:', e);
        return [];
    }
}

function writeAll(records: CachedReport[]) {
    ensureCacheDir();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

/** Write a new report to the local JSON cache. Returns the cacheId. */
export function cacheReport(
    payload: Record<string, unknown>,
    user: CachedReport['user']
): string {
    const cacheId = `RPT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const record: CachedReport = {
        cacheId,
        savedAt: new Date().toISOString(),
        status: 'pending',
        payload,
        user,
    };

    const all = readAll();
    all.push(record);
    writeAll(all);

    console.log(`[CACHE] ✅ Report saved locally | cacheId=${cacheId} | file=${CACHE_FILE}`);
    return cacheId;
}

/** Mark a cached report as synced once the DB insert succeeds. */
export function markSynced(cacheId: string, dbReportId: string) {
    const all = readAll();
    const idx = all.findIndex(r => r.cacheId === cacheId);
    if (idx !== -1) {
        all[idx].status = 'synced';
        all[idx].dbReportId = dbReportId;
        writeAll(all);
        console.log(`[CACHE] 🔗 Marked synced | cacheId=${cacheId} | dbReportId=${dbReportId}`);
    }
}

/** Mark a cached report as failed with the error message. */
export function markFailed(cacheId: string, error: string) {
    const all = readAll();
    const idx = all.findIndex(r => r.cacheId === cacheId);
    if (idx !== -1) {
        all[idx].status = 'failed';
        all[idx].error = error;
        writeAll(all);
        console.error(`[CACHE] ❌ Marked failed | cacheId=${cacheId} | error=${error}`);
    }
}

/** Return all reports that are still pending (for retry logic). */
export function getPendingReports(): CachedReport[] {
    return readAll().filter(r => r.status === 'pending');
}

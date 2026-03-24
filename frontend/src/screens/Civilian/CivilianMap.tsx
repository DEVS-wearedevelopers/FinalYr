'use client';
import React, { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/services/supabaseClient';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ReportPin {
    id: string;
    origin_lat: number;
    origin_lng: number;
    origin_address: string | null;
    symptom_matrix: string[];
    severity: number;
    patient_count: number;
    source: string;
    status: string;
    created_at: string;
}

function pinHtml(source: string, severity: number) {
    const isCommunity = source === 'community';
    const isHigh = severity >= 7;
    const color = isHigh ? '#ef4444' : isCommunity ? '#3b82f6' : '#f59e0b';
    const icon  = isHigh ? '🚨' : isCommunity ? '📍' : '⚠️';
    return `
        <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer">
            <div style="
                background:${color};width:34px;height:34px;border-radius:50%;
                display:flex;align-items:center;justify-content:center;
                font-size:15px;box-shadow:0 2px 10px rgba(0,0,0,0.25);
                border:3px solid white;
            ">${icon}</div>
            <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid ${color};margin-top:-1px;"></div>
        </div>`;
}

export interface CivilianMapHandle {
    addPin: (report: ReportPin) => void;
}

export default function CivilianMap() {
    const mapRef         = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef     = useRef<Map<string, any>>(new Map());
    const LRef           = useRef<any>(null);

    const addMarker = useCallback((L: any, map: any, report: ReportPin) => {
        if (markersRef.current.has(report.id)) return; // dedupe
        if (!report.origin_lat || !report.origin_lng) return;

        const marker = L.marker([report.origin_lat, report.origin_lng], {
            icon: L.divIcon({ className: '', html: pinHtml(report.source, report.severity), iconAnchor: [17, 43] }),
        }).addTo(map);

        const symptoms = (report.symptom_matrix ?? []).map((s: string) =>
            `<span style="display:inline-block;background:#f1f5f9;color:#475569;font-size:10px;padding:1px 6px;border-radius:999px;margin:1px">${s}</span>`
        ).join('');
        const badgeColor = report.severity >= 7 ? '#ef4444' : report.source === 'community' ? '#3b82f6' : '#f59e0b';
        const label = report.source === 'community' ? 'COMMUNITY' : report.severity >= 7 ? 'HIGH SEV.' : 'REPORTED';

        marker.bindPopup(`
            <div style="font-family:sans-serif;min-width:210px;max-width:260px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                    <p style="font-weight:800;font-size:12px;color:#0f172a;margin:0;flex:1">${report.origin_address || 'Unknown location'}</p>
                    <span style="background:${badgeColor};color:white;font-size:9px;font-weight:800;padding:2px 7px;border-radius:999px;white-space:nowrap;margin-left:6px">${label}</span>
                </div>
                <p style="font-size:10px;font-weight:700;color:#475569;margin:0 0 4px">Symptoms:</p>
                <div style="display:flex;flex-wrap:wrap;gap:2px;margin-bottom:8px">${symptoms || '<span style="font-size:10px;color:#94a3b8">No details</span>'}</div>
                <div style="display:flex;justify-content:space-between;font-size:10px;color:#64748b">
                    <span><strong style="color:#0f172a">${report.patient_count}</strong> patient(s)</span>
                    <span>Sev ${report.severity}/10</span>
                </div>
            </div>`, { maxWidth: 280 });

        markersRef.current.set(report.id, marker);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || !mapRef.current) return;
        if (mapInstanceRef.current) return;
        let destroyed = false;

        import('leaflet').then(async L => {
            if (destroyed || !mapRef.current || mapInstanceRef.current) return;
            LRef.current = L;
            delete (L.Icon.Default.prototype as any)._getIconUrl;

            const map = L.map(mapRef.current, {
                center: [6.524, 3.379],
                zoom: 11,
                zoomControl: true,
                scrollWheelZoom: false,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18,
            }).addTo(map);

            mapInstanceRef.current = map;

            // ── Load existing reports ──────────────────────────────────────────
            const { data } = await supabase
                .from('sentinel_reports')
                .select('id, origin_lat, origin_lng, origin_address, symptom_matrix, severity, patient_count, source, status, created_at')
                .not('origin_lat', 'is', null)
                .not('origin_lng', 'is', null)
                .gt('origin_lat', 0)  // skip lat=0 (default for no-location reports)
                .order('created_at', { ascending: false })
                .limit(50);

            if (data && !destroyed) {
                data.forEach((r: ReportPin) => addMarker(L, map, r));
            }

            // ── Realtime: new pins appear live ─────────────────────────────────
            const channel = supabase
                .channel('civilian-map-reports')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sentinel_reports' },
                    (payload) => {
                        const r = payload.new as ReportPin;
                        if (r.origin_lat && r.origin_lat > 0 && r.origin_lng) {
                            addMarker(L, map, r);
                            // Briefly bounce the map to the new pin
                            map.flyTo([r.origin_lat, r.origin_lng], 13, { duration: 1.2 });
                        }
                    }
                )
                .subscribe();

            // Cleanup
            return () => {
                supabase.removeChannel(channel);
            };
        });

        return () => {
            destroyed = true;
            if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
            markersRef.current.clear();
        };
    }, [addMarker]);

    return (
        <div className="relative w-full" style={{ height: 360 }}>
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl shadow border border-slate-200 px-3 py-2 text-xs flex gap-3">
                <span className="flex items-center gap-1.5"><span>🚨</span> High severity</span>
                <span className="flex items-center gap-1.5"><span className="text-blue-500">📍</span> Community</span>
                <span className="flex items-center gap-1.5"><span>⚠️</span> Institution</span>
            </div>
            <div className="absolute top-2 right-2 z-[1000] flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs text-green-600 font-semibold border border-green-200">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live
            </div>
            <div ref={mapRef} className="w-full h-full rounded-2xl" />
        </div>
    );
}

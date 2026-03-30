'use client';
import React, { useEffect, useRef, useCallback } from 'react';
import { Report, AiAlert, MOCK_STATE } from '@/services/mockData';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function alertIcon(status: AiAlert['status'], cbs: number) {
  if (status === 'confirmed') return { color: '#dc2626', icon: '🔴', label: 'CONFIRMED' };
  if (status === 'probable')  return { color: '#ea580c', icon: '🟠', label: 'PROBABLE' };
  if (status === 'investigating') return { color: '#2563eb', icon: '🔵', label: 'INVESTIGATING' };
  if (cbs >= 0.8) return { color: '#ef4444', icon: '🚨', label: 'HIGH RISK' };
  if (cbs >= 0.5) return { color: '#f59e0b', icon: '⚠️', label: 'ELEVATED' };
  return { color: '#22c55e', icon: '✅', label: 'LOW RISK' };
}

function alertPinHtml(status: AiAlert['status'], cbs: number) {
  const { color, icon } = alertIcon(status, cbs);
  const pulse = status === 'confirmed' ? 'animation:pulse 2s infinite;' : '';
  return `
    <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer">
      <div style="
        background:${color};width:40px;height:40px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:17px;box-shadow:0 3px 14px rgba(0,0,0,0.35);
        border:3px solid white;${pulse}
      ">${icon}</div>
      <div style="
        background:${color};color:white;font-size:9px;font-weight:800;
        padding:1px 5px;border-radius:4px;margin-top:2px;white-space:nowrap;
      ">CBS ${cbs.toFixed(2)}</div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid ${color};margin-top:-1px;"></div>
    </div>`;
}

function reportPinHtml(source: string, severity: number) {
  const isCommunity = source === 'community';
  const color = severity >= 7 ? '#ef4444' : isCommunity ? '#60a5fa' : '#fbbf24';
  const icon  = severity >= 7 ? '🚨' : isCommunity ? '📍' : '⚠️';
  return `
    <div style="display:flex;flex-direction:column;align-items:center;opacity:0.7;cursor:pointer">
      <div style="background:${color};width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;border:2px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.2)">${icon}</div>
      <div style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:6px solid ${color};margin-top:-1px;"></div>
    </div>`;
}

function alertPopupHtml(alert: AiAlert) {
  const { color, label } = alertIcon(alert.status, alert.cbs_score);
  const sr = alert.sentinel_reports;
  const symptoms = (sr?.symptom_matrix ?? []).map(s =>
    `<span style="display:inline-block;background:#f1f5f9;color:#475569;font-size:10px;padding:1px 6px;border-radius:999px;margin:1px">${s}</span>`
  ).join('');
  return `
    <div style="font-family:sans-serif;min-width:220px;max-width:280px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="background:${color};color:white;font-size:9px;font-weight:800;padding:2px 8px;border-radius:999px">${label}</span>
        <span style="font-size:11px;font-weight:700;color:#0f172a">CBS ${alert.cbs_score.toFixed(2)}</span>
      </div>
      <p style="font-weight:800;font-size:12px;color:#0f172a;margin:0 0 4px">${sr?.origin_address || 'Unknown location'}</p>
      ${symptoms ? `<div style="margin-bottom:6px">${symptoms}</div>` : ''}
      <div style="display:flex;justify-content:space-between;font-size:10px;color:#64748b">
        <span><strong>${sr?.patient_count ?? '?'}</strong> patients</span>
        <span>Sev ${alert.severity_index}/10</span>
        <span>${alert.zone_id}</span>
      </div>
      ${alert.justification ? `<p style="margin-top:6px;font-size:10px;color:#475569;font-style:italic">"${alert.justification}"</p>` : ''}
    </div>`;
}

interface PHOMapProps {
  height?: number;
  /** If true, only show alert pins; otherwise show all report pins too */
  alertsOnly?: boolean;
}

export default function PHOLiveMap({ height = 440, alertsOnly = false }: PHOMapProps) {
  const mapRef         = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef     = useRef<{ destroy: () => void }[]>([]);
  const LRef           = useRef<any>(null);

  const buildLayers = useCallback((L: any, map: any) => {
    // Clear existing markers
    markersRef.current.forEach(m => m.destroy());
    markersRef.current = [];

    // All report pins (dim)
    if (!alertsOnly) {
      MOCK_STATE.reports
        .filter(r => r.origin_lat && r.origin_lng)
        .forEach(r => {
          const m = L.marker([r.origin_lat, r.origin_lng], {
            icon: L.divIcon({ className: '', html: reportPinHtml(r.source, r.severity), iconAnchor: [11, 28] }),
            zIndexOffset: 0,
          }).addTo(map);
          const symptoms = r.symptom_matrix.join(', ');
          m.bindPopup(`<div style="font-family:sans-serif;font-size:11px"><strong>${r.origin_address}</strong><br>${symptoms}<br><strong>${r.patient_count}</strong> patient(s) · Sev ${r.severity}/10</div>`);
          markersRef.current.push({ destroy: () => m.remove() });
        });
    }

    // Alert pins (prominent)
    MOCK_STATE.alerts
      .filter(a => a.sentinel_reports?.origin_lat && a.sentinel_reports?.origin_lng)
      .forEach(alert => {
        const lat = alert.sentinel_reports!.origin_lat;
        const lng = alert.sentinel_reports!.origin_lng;
        const m = L.marker([lat, lng], {
          icon: L.divIcon({ className: '', html: alertPinHtml(alert.status, alert.cbs_score), iconAnchor: [20, 55] }),
          zIndexOffset: 1000,
        }).addTo(map);
        m.bindPopup(alertPopupHtml(alert), { maxWidth: 300 });
        if (alert.status === 'confirmed') m.openPopup();
        markersRef.current.push({ destroy: () => m.remove() });

        // Confirmed: add pulsing circle overlay
        if (alert.status === 'confirmed' || alert.status === 'probable') {
          const circle = L.circle([lat, lng], {
            radius: 800,
            color: alert.status === 'confirmed' ? '#dc2626' : '#ea580c',
            fillColor: alert.status === 'confirmed' ? '#dc2626' : '#ea580c',
            fillOpacity: 0.08,
            weight: 2,
            dashArray: '6 4',
          }).addTo(map);
          markersRef.current.push({ destroy: () => circle.remove() });
        }
      });
  }, [alertsOnly]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    if (mapInstanceRef.current) return;
    let destroyed = false;

    import('leaflet').then(L => {
      if (destroyed || !mapRef.current || mapInstanceRef.current) return;
      LRef.current = L;
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(mapRef.current, {
        center: [6.52, 3.38],
        zoom: 11,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
      buildLayers(L, map);
    });

    return () => {
      destroyed = true;
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
      markersRef.current = [];
    };
  }, [buildLayers]);

  // Refresh on same-tab mutation, cross-tab storage change, or every 5s
  useEffect(() => {
    const refresh = () => {
      if (LRef.current && mapInstanceRef.current) {
        buildLayers(LRef.current, mapInstanceRef.current);
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'domrs_state_v2') {
        import('@/services/mockData').then(m => { m.loadFromStorage(); refresh(); });
      }
    };
    window.addEventListener('domrs:update', refresh);
    window.addEventListener('storage', onStorage);
    const id = setInterval(refresh, 5000);
    return () => {
      window.removeEventListener('domrs:update', refresh);
      window.removeEventListener('storage', onStorage);
      clearInterval(id);
    };
  }, [buildLayers]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl shadow border border-slate-200 px-3 py-2 text-xs space-y-1">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"/><span>Confirmed / High CBS</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"/><span>Investigating</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block"/><span>Pending / Low risk</span></div>
        {!alertsOnly && <div className="flex items-center gap-2"><span className="text-slate-400">◦</span><span className="text-slate-400">Raw report pins</span></div>}
      </div>
      <div className="absolute top-2 right-2 z-[1000] flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs text-green-600 font-semibold border border-green-200">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>
        PHO Live Map
      </div>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}

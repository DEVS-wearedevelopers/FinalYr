'use client';
import React, { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Report, MOCK_STATE } from '@/services/mockData';

// ─── Pin HTML ─────────────────────────────────────────────────────────────────
function pinHtml(source: string, severity: number, isNew = false) {
  const isCommunity = source === 'community';
  const isHigh = severity >= 7;
  const color = isHigh ? '#ef4444' : isCommunity ? '#3b82f6' : '#f59e0b';
  const icon  = isHigh ? '🚨' : isCommunity ? '📍' : '⚠️';
  const pulse = isNew ? `animation:ping 1s cubic-bezier(0,0,.2,1) 3;` : '';
  return `
    <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer">
      <div style="
        background:${color};width:34px;height:34px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:15px;box-shadow:0 2px 10px rgba(0,0,0,0.28);
        border:3px solid white;${pulse}
      ">${icon}</div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid ${color};margin-top:-1px;"></div>
    </div>`;
}

function popupHtml(report: Report) {
  const badgeColor = report.severity >= 7 ? '#ef4444' : report.source === 'community' ? '#3b82f6' : '#f59e0b';
  const label = report.source === 'community' ? 'COMMUNITY' : report.severity >= 7 ? 'HIGH SEV.' : 'SENTINEL';
  const symptoms = (report.symptom_matrix ?? []).map(s =>
    `<span style="display:inline-block;background:#f1f5f9;color:#475569;font-size:10px;padding:1px 6px;border-radius:999px;margin:1px">${s}</span>`
  ).join('');
  return `
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
      ${report.cbs_score !== undefined ? `<div style="margin-top:6px;padding:4px 8px;border-radius:6px;background:${report.cbs_score >= 0.8 ? '#fef2f2' : report.cbs_score >= 0.5 ? '#fffbeb' : '#f0fdf4'};font-size:10px;font-weight:700;color:${report.cbs_score >= 0.8 ? '#dc2626' : report.cbs_score >= 0.5 ? '#d97706' : '#16a34a'}">CBS Risk Score: ${report.cbs_score.toFixed(2)}</div>` : ''}
    </div>`;
}

// ─── Exported handle ──────────────────────────────────────────────────────────
export interface CivilianMapHandle {
  addPin: (report: Report) => void;
}

interface Props {
  height?: number;
  showLegend?: boolean;
}

const CivilianMap = forwardRef<CivilianMapHandle, Props>(function CivilianMap(
  { height = 360, showLegend = true },
  ref
) {
  const mapRef         = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef     = useRef<Map<string, any>>(new Map());
  const LRef           = useRef<any>(null);

  const addMarker = useCallback((L: any, map: any, report: Report, isNew = false) => {
    if (markersRef.current.has(report.id)) return; // skip duplicates
    if (!report.origin_lat || !report.origin_lng) return;

    const marker = L.marker([report.origin_lat, report.origin_lng], {
      icon: L.divIcon({
        className: '',
        html: pinHtml(report.source, report.severity, isNew),
        iconAnchor: [17, 43],
      }),
    }).addTo(map);

    marker.bindPopup(popupHtml(report), { maxWidth: 280 });
    if (isNew) {
      marker.openPopup();
      map.flyTo([report.origin_lat, report.origin_lng], 13, { duration: 1.0 });
    }
    markersRef.current.set(report.id, marker);
  }, []);

  // Expose addPin via ref (direct call from same page)
  useImperativeHandle(ref, () => ({
    addPin: (report: Report) => {
      if (LRef.current && mapInstanceRef.current) {
        addMarker(LRef.current, mapInstanceRef.current, report, true);
      }
    },
  }), [addMarker]);

  // ── Global sync: domrs:update (same tab) + storage event (other tabs) + poll (cross-device) ─
  useEffect(() => {
    const syncPins = () => {
      if (!LRef.current || !mapInstanceRef.current) return;
      MOCK_STATE.reports
        .filter(r => r.origin_lat && r.origin_lng)
        .forEach(r => addMarker(LRef.current, mapInstanceRef.current, r, false));
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'domrs_state_v2') {
        // Import loadFromStorage to hydrate and then syncPins
        import('@/services/mockData').then(m => { m.loadFromStorage(); syncPins(); });
      }
    };
    // Cross-device fallback: poll every 2 s
    const poll = setInterval(() => {
      import('@/services/mockData').then(m => {
        const changed = m.loadFromStorage();
        if (changed) syncPins();
      });
    }, 2000);

    window.addEventListener('domrs:update', syncPins);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('domrs:update', syncPins);
      window.removeEventListener('storage', onStorage);
      clearInterval(poll);
    };
  }, [addMarker]);

  // ── Map init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    if (mapInstanceRef.current) return;
    let destroyed = false;

    import('leaflet').then(L => {
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

      // Load all existing seed reports
      MOCK_STATE.reports
        .filter(r => r.origin_lat && r.origin_lng)
        .forEach(r => addMarker(L, map, r));
    });

    return () => {
      destroyed = true;
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
      markersRef.current.clear();
    };
  }, [addMarker]);

  return (
    <div className="relative w-full" style={{ height }}>
      {showLegend && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl shadow border border-slate-200 px-3 py-2 text-xs flex gap-3">
          <span className="flex items-center gap-1.5"><span>🚨</span> High severity</span>
          <span className="flex items-center gap-1.5"><span className="text-blue-500">📍</span> Community</span>
          <span className="flex items-center gap-1.5"><span>⚠️</span> Sentinel</span>
        </div>
      )}
      <div className="absolute top-2 right-2 z-[1000] flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs text-green-600 font-semibold border border-green-200">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
        Live
      </div>
      <div ref={mapRef} className="w-full h-full rounded-2xl" />
    </div>
  );
});

export default CivilianMap;

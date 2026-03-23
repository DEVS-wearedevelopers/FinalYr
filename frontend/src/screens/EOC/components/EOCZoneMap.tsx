'use client';
import React, { useEffect, useRef, useState } from 'react';

interface Zone {
    id: string;
    name: string;
    status: 'critical' | 'warning' | 'normal';
    alerts: number;
    center: [number, number];
    pho?: string;
    facilities?: number;
    silent?: number;
}

interface EOCZoneMapProps {
    zones: Zone[];
    onZoneClick: (zone: Zone) => void;
}

// Real Lagos LGA bounding boxes (approximate)
const ZONE_BOUNDS: Record<string, [number, number][]> = {
    sw:  [[6.42, 3.28], [6.42, 3.45], [6.32, 3.45], [6.32, 3.28]], // Lagos Island / Victoria Island
    se:  [[6.48, 3.30], [6.48, 3.45], [6.42, 3.45], [6.42, 3.30]], // Surulere / Apapa
    ss:  [[6.55, 3.25], [6.55, 3.42], [6.48, 3.42], [6.48, 3.25]], // Ikeja / Maryland
    nc:  [[6.62, 3.28], [6.62, 3.50], [6.55, 3.50], [6.55, 3.28]], // Kosofe / Ojota
    ne:  [[6.60, 3.50], [6.60, 3.68], [6.50, 3.68], [6.50, 3.50]], // Ikorodu / Agboville
    nw:  [[6.55, 3.08], [6.55, 3.28], [6.45, 3.28], [6.45, 3.08]], // Alimosho / Agege
};

// Real Lagos hospitals with GPS coords, type, and status
const HOSPITALS = [
    { id: 'h1', name: 'Lagos University Teaching Hospital (LUTH)', lat: 6.5184, lng: 3.3504, type: 'Teaching Hospital',    status: 'critical',  patients: 47 },
    { id: 'h2', name: 'Lagos Island General Hospital',            lat: 6.4541, lng: 3.3947, type: 'General Hospital',     status: 'warning',   patients: 23 },
    { id: 'h3', name: 'Gbagada General Hospital',                 lat: 6.5500, lng: 3.3833, type: 'General Hospital',     status: 'warning',   patients: 12 },
    { id: 'h4', name: 'Reddington Hospital Victoria Island',      lat: 6.4329, lng: 3.4230, type: 'Private Hospital',     status: 'normal',    patients: 6  },
    { id: 'h5', name: 'Eko Hospital Ikeja',                       lat: 6.5944, lng: 3.3583, type: 'Private Hospital',     status: 'normal',    patients: 8  },
    { id: 'h6', name: 'LASUTH Ikeja',                             lat: 6.6016, lng: 3.3506, type: 'Teaching Hospital',    status: 'warning',   patients: 34 },
    { id: 'h7', name: 'Apapa General Hospital',                   lat: 6.4481, lng: 3.3633, type: 'General Hospital',     status: 'critical',  patients: 89 },
    { id: 'h8', name: 'St. Nicholas Hospital Lagos',              lat: 6.4512, lng: 3.3965, type: 'Private Hospital',     status: 'normal',    patients: 4  },
    { id: 'h9', name: 'National Hospital Abuja (Lagos Liaison)',  lat: 6.5833, lng: 3.3500, type: 'Federal Hospital',     status: 'normal',    patients: 3  },
    { id: 'h10',name: 'Ikorodu General Hospital',                 lat: 6.6052, lng: 3.5022, type: 'General Hospital',     status: 'warning',   patients: 18 },
];

function statusColor(status: string) {
    if (status === 'critical') return '#ef4444';
    if (status === 'warning')  return '#f59e0b';
    return '#22c55e';
}

function pinSvg(color: string, count: number) {
    return `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer">
      <div style="
        background:${color};
        color:white;font-size:10px;font-weight:800;
        padding:3px 8px;border-radius:999px;white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        border:2px solid white;
        line-height:1.4;
      ">${count} pts</div>
      <div style="
        width:0;height:0;
        border-left:6px solid transparent;
        border-right:6px solid transparent;
        border-top:9px solid ${color};
        margin-top:-1px;
      "></div>
    </div>`;
}

function clusterIcon(L: any, count: number) {
    const color = count >= 40 ? '#ef4444' : count >= 15 ? '#f59e0b' : '#22c55e';
    return L.divIcon({
        className: '',
        html: `<div style="
            background:${color};color:white;
            width:38px;height:38px;border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:13px;font-weight:900;
            box-shadow:0 2px 10px rgba(0,0,0,0.25);
            border:3px solid white;
        ">${count}</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
    });
}

type ViewMode = 'zones' | 'pins' | 'cluster';

export default function EOCZoneMap({ zones, onZoneClick }: EOCZoneMapProps) {
    const mapRef         = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const layerGroupRef  = useRef<any>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('zones');
    const viewModeRef = useRef<ViewMode>('zones');

    // Render layers depending on mode
    function renderLayers(L: any, map: any, mode: ViewMode) {
        if (layerGroupRef.current) {
            layerGroupRef.current.clearLayers();
        } else {
            layerGroupRef.current = L.layerGroup().addTo(map);
        }
        const lg = layerGroupRef.current;

        if (mode === 'zones') {
            // Zone polygons + label markers
            zones.forEach(zone => {
                const bounds = ZONE_BOUNDS[zone.id];
                if (!bounds) return;
                const color = statusColor(zone.status);
                const polygon = L.polygon(bounds as any, {
                    color, fillColor: color, fillOpacity: 0.3, weight: 2,
                    dashArray: zone.status === 'critical' ? '6 3' : undefined,
                }).addTo(lg);
                polygon.on('click', () => onZoneClick(zone));
                polygon.on('mouseover', () => polygon.setStyle({ fillOpacity: 0.55, weight: 3 }));
                polygon.on('mouseout',  () => polygon.setStyle({ fillOpacity: 0.30, weight: 2 }));
                const center = polygon.getBounds().getCenter();
                L.marker(center, {
                    icon: L.divIcon({
                        className: '',
                        html: `<div style="background:${color};color:white;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;white-space:nowrap;box-shadow:0 1px 6px rgba(0,0,0,0.22);border:1.5px solid rgba(255,255,255,0.6)">${zone.name}<br/><span style="font-size:10px;opacity:0.85">${zone.alerts} alert${zone.alerts !== 1 ? 's' : ''}</span></div>`,
                        iconAnchor: [45, 16],
                    }),
                }).addTo(lg).on('click', () => onZoneClick(zone));
            });

        } else if (mode === 'pins') {
            // Individual hospital pins
            HOSPITALS.forEach(h => {
                const color = statusColor(h.status);
                const marker = L.marker([h.lat, h.lng], {
                    icon: L.divIcon({
                        className: '',
                        html: pinSvg(color, h.patients),
                        iconAnchor: [28, 32],
                    }),
                }).addTo(lg);
                marker.bindPopup(`
                    <div style="font-family:sans-serif;min-width:200px">
                        <p style="font-weight:800;font-size:13px;margin:0 0 4px">${h.name}</p>
                        <p style="color:#64748b;font-size:11px;margin:0 0 8px">${h.type}</p>
                        <div style="display:flex;align-items:center;gap:6px">
                            <span style="background:${color};color:white;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px">${h.status.toUpperCase()}</span>
                            <span style="font-size:11px;color:#475569">${h.patients} patients reported</span>
                        </div>
                    </div>`, { maxWidth: 260 });
            });

        } else {
            // Cluster mode — group by proximity (simple manual cluster)
            const groups: Record<string, typeof HOSPITALS> = {};
            HOSPITALS.forEach(h => {
                const cell = `${Math.round(h.lat * 10)}_${Math.round(h.lng * 10)}`;
                groups[cell] = [...(groups[cell] ?? []), h];
            });
            Object.values(groups).forEach(group => {
                const lat = group.reduce((s, h) => s + h.lat, 0) / group.length;
                const lng = group.reduce((s, h) => s + h.lng, 0) / group.length;
                const total = group.reduce((s, h) => s + h.patients, 0);
                const worstStatus = group.some(h => h.status === 'critical') ? 'critical'
                    : group.some(h => h.status === 'warning') ? 'warning' : 'normal';
                const markerColor = statusColor(worstStatus);
                const marker = L.marker([lat, lng], { icon: clusterIcon(L, total) }).addTo(lg);
                const listItems = group.map(h => `<li style="font-size:11px;padding:2px 0;color:#475569">${h.name} — ${h.patients} pts</li>`).join('');
                marker.bindPopup(`
                    <div style="font-family:sans-serif">
                        <p style="font-weight:800;font-size:12px;margin:0 0 6px;color:${markerColor}">${group.length} facilities in cluster</p>
                        <ul style="margin:0;padding-left:14px">${listItems}</ul>
                    </div>`, { maxWidth: 280 });
            });
        }
    }

    // Initialise map once
    useEffect(() => {
        if (typeof window === 'undefined' || !mapRef.current) return;
        if (mapInstanceRef.current) return;
        let destroyed = false;

        import('leaflet').then(L => {
            if (destroyed || !mapRef.current || mapInstanceRef.current) return;
            delete (L.Icon.Default.prototype as any)._getIconUrl;

            const map = L.map(mapRef.current, {
                center: [6.524379, 3.379206], // Lagos centre
                zoom: 11,
                zoomControl: true,
                scrollWheelZoom: false,
            });

            // Base tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18,
            }).addTo(map);

            mapInstanceRef.current = map;
            renderLayers(L, map, viewModeRef.current);
        });

        return () => {
            destroyed = true;
            if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
            layerGroupRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-render layers when viewMode changes
    useEffect(() => {
        viewModeRef.current = viewMode;
        if (!mapInstanceRef.current) return;
        import('leaflet').then(L => {
            renderLayers(L, mapInstanceRef.current, viewMode);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, zones]);

    return (
        <div className="relative w-full h-full">
            {/* Layer switcher */}
            <div className="absolute top-3 right-3 z-[1000] flex gap-1 bg-white rounded-xl shadow-lg border border-slate-200 p-1">
                {([['zones', '⬡ Zones'], ['pins', '📍 Pins'], ['cluster', '⚪ Cluster']] as [ViewMode, string][]).map(([mode, label]) => (
                    <button key={mode} onClick={() => setViewMode(mode)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === mode ? 'bg-[#1e52f1] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                        {label}
                    </button>
                ))}
            </div>
            {/* Legend */}
            <div className="absolute bottom-3 left-3 z-[1000] flex gap-2 bg-white/90 backdrop-blur-sm rounded-xl shadow border border-slate-200 px-3 py-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"/>Critical</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"/>Warning</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"/>Normal</span>
            </div>
            <div ref={mapRef} className="w-full h-full" />
        </div>
    );
}

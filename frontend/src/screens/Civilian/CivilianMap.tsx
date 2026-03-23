'use client';
import React, { useEffect, useRef } from 'react';

// Verified Lagos hospital reports — only confirmed / probable statuses shown
const VERIFIED_REPORTS = [
    { id: 'r1', name: 'LUTH Medical Centre',          lat: 6.5184, lng: 3.3504, status: 'confirmed', symptoms: ['fever','cough','chest pain','dyspnea'],         patients: 47, address: 'LUTH, Surulere, Lagos' },
    { id: 'r2', name: 'Lagos Island General Hospital', lat: 6.4541, lng: 3.3947, status: 'probable',  symptoms: ['high fever','headache','muscle pain','rash'],    patients: 23, address: 'Lagos Island General Hospital' },
    { id: 'r3', name: 'Apapa General Hospital',        lat: 6.4481, lng: 3.3633, status: 'confirmed', symptoms: ['fever','cough','night sweats','weight loss'],    patients: 89, address: 'Apapa General Hospital, Lagos' },
    { id: 'r4', name: 'Gbagada General Hospital',      lat: 6.5500, lng: 3.3833, status: 'probable',  symptoms: ['watery diarrhoea','vomiting','dehydration'],    patients: 34, address: 'Gbagada General Hospital, Lagos' },
    { id: 'r5', name: 'Ikorodu General Hospital',      lat: 6.6052, lng: 3.5022, status: 'probable',  symptoms: ['unexplained bleeding','high fever','jaundice'], patients: 6,  address: 'Ikorodu General Hospital, Lagos' },
];

function pinHtml(status: string) {
    const color = status === 'confirmed' ? '#ef4444' : '#f59e0b';
    const icon  = status === 'confirmed' ? '🚨' : '⚠️';
    return `
        <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer">
            <div style="
                background:${color};width:32px;height:32px;border-radius:50%;
                display:flex;align-items:center;justify-content:center;
                font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,0.3);
                border:2.5px solid white;
            ">${icon}</div>
            <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color};margin-top:-1px;"></div>
        </div>`;
}

export default function CivilianMap() {
    const mapRef         = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !mapRef.current) return;
        if (mapInstanceRef.current) return;
        let destroyed = false;

        import('leaflet').then(L => {
            if (destroyed || !mapRef.current || mapInstanceRef.current) return;
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

            VERIFIED_REPORTS.forEach(r => {
                const marker = L.marker([r.lat, r.lng], {
                    icon: L.divIcon({ className: '', html: pinHtml(r.status), iconAnchor: [16, 40] }),
                }).addTo(map);

                const sympList = r.symptoms.map(s => `<span style="display:inline-block;background:#f1f5f9;color:#475569;font-size:10px;padding:1px 6px;border-radius:999px;margin:1px">${s}</span>`).join('');
                const badgeColor = r.status === 'confirmed' ? '#ef4444' : '#f59e0b';
                marker.bindPopup(`
                    <div style="font-family:sans-serif;min-width:220px;max-width:260px">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                            <p style="font-weight:800;font-size:12px;color:#0f172a;margin:0;flex:1">${r.name}</p>
                            <span style="background:${badgeColor};color:white;font-size:9px;font-weight:800;padding:2px 7px;border-radius:999px;white-space:nowrap;margin-left:6px">${r.status.toUpperCase()}</span>
                        </div>
                        <p style="font-size:10px;color:#64748b;margin:0 0 8px">📍 ${r.address}</p>
                        <p style="font-size:10px;font-weight:700;color:#475569;margin:0 0 4px">Reported symptoms:</p>
                        <div style="display:flex;flex-wrap:wrap;gap:2px;margin-bottom:8px">${sympList}</div>
                        <p style="font-size:10px;color:#64748b;margin:0"><strong style="color:#0f172a">${r.patients}</strong> patients reported</p>
                    </div>`, { maxWidth: 280 });
            });

            mapInstanceRef.current = map;
        });

        return () => {
            destroyed = true;
            if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
        };
    }, []);

    return (
        <div className="relative w-full" style={{ height: 340 }}>
            {/* Legend */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl shadow border border-slate-200 px-3 py-2 text-xs flex gap-3">
                <span className="flex items-center gap-1.5"><span className="text-base">🚨</span> Confirmed</span>
                <span className="flex items-center gap-1.5"><span className="text-base">⚠️</span> Probable</span>
            </div>
            <div className="absolute top-2 right-2 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs text-slate-500 font-semibold border border-slate-200">
                Verified reports only
            </div>
            <div ref={mapRef} className="w-full h-full rounded-2xl" />
        </div>
    );
}

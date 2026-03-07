'use client';
import React, { useEffect, useRef } from 'react';

interface Zone {
    id: string;
    name: string;
    status: 'critical' | 'warning' | 'normal';
    alerts: number;
    center: [number, number];
}

interface EOCZoneMapProps {
    zones: Zone[];
    onZoneClick: (zone: Zone) => void;
}

// Approximate bounding boxes for Nigeria's 6 geopolitical zones
const ZONE_BOUNDS: Record<string, [number, number][]> = {
    sw: [[9.5, 2.7], [9.5, 6.0], [5.5, 6.0], [5.5, 2.7]],
    se: [[7.5, 6.0], [7.5, 9.5], [4.5, 9.5], [4.5, 6.0]],
    ss: [[6.0, 3.5], [6.0, 9.5], [4.0, 9.5], [4.0, 3.5]],
    nc: [[11.5, 5.0], [11.5, 10.0], [7.5, 10.0], [7.5, 5.0]],
    ne: [[14.0, 9.5], [14.0, 15.0], [9.5, 15.0], [9.5, 9.5]],
    nw: [[14.0, 3.5], [14.0, 9.5], [10.0, 9.5], [10.0, 3.5]],
};

function zoneColor(status: string): string {
    if (status === 'critical') return '#ef4444';
    if (status === 'warning') return '#f59e0b';
    return '#22c55e';
}

export default function EOCZoneMap({ zones, onZoneClick }: EOCZoneMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || mapInstanceRef.current || !mapRef.current) return;

        import('leaflet').then(L => {
            delete (L.Icon.Default.prototype as any)._getIconUrl;

            const map = L.map(mapRef.current!, {
                center: [9.0, 8.0],
                zoom: 5,
                zoomControl: true,
                scrollWheelZoom: false,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 10,
                opacity: 0.4,
            }).addTo(map);

            zones.forEach(zone => {
                const bounds = ZONE_BOUNDS[zone.id];
                if (!bounds) return;
                const color = zoneColor(zone.status);
                const polygon = L.polygon(bounds as any, {
                    color,
                    fillColor: color,
                    fillOpacity: 0.35,
                    weight: 2,
                    dashArray: zone.status === 'critical' ? '6 3' : undefined,
                }).addTo(map);

                polygon.on('click', () => onZoneClick(zone));
                polygon.on('mouseover', () => { polygon.setStyle({ fillOpacity: 0.55, weight: 3 }); });
                polygon.on('mouseout', () => { polygon.setStyle({ fillOpacity: 0.35, weight: 2 }); });

                // Label
                const center = polygon.getBounds().getCenter();
                L.marker(center, {
                    icon: L.divIcon({
                        className: '',
                        html: `<div style="background:${color};color:white;font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 1px 6px rgba(0,0,0,0.25);border:1.5px solid rgba(255,255,255,0.6)">${zone.name}<br/><span style="font-size:10px;opacity:0.85">${zone.alerts} alert${zone.alerts !== 1 ? 's' : ''}</span></div>`,
                        iconAnchor: [40, 16],
                    }),
                }).addTo(map).on('click', () => onZoneClick(zone));
            });

            mapInstanceRef.current = map;
        });

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div ref={mapRef} className="w-full h-full" />;
}

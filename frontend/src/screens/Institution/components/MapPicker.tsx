"use client";
import React, { useEffect, useRef } from "react";

interface MapPickerProps {
    lat: number | null;
    lng: number | null;
    onPick: (lat: number, lng: number, address: NominatimAddress) => void;
}

export interface NominatimAddress {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    county?: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<NominatimAddress> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
        );
        const json = await res.json();
        return (json.address as NominatimAddress) ?? {};
    } catch {
        return {};
    }
}

export default function MapPicker({ lat, lng, onPick }: MapPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window === "undefined" || mapInstanceRef.current) return;

        import("leaflet").then((L) => {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            if (!mapRef.current) return;
            const map = L.map(mapRef.current, { zoomControl: true }).setView(
                [lat ?? 9.082, lng ?? 8.6753],
                lat ? 14 : 6
            );

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            if (lat && lng) {
                markerRef.current = L.marker([lat, lng]).addTo(map);
            }

            map.on("click", async (e: any) => {
                const { lat: clickLat, lng: clickLng } = e.latlng;
                const roundedLat = Number(clickLat.toFixed(6));
                const roundedLng = Number(clickLng.toFixed(6));

                if (markerRef.current) {
                    markerRef.current.setLatLng([roundedLat, roundedLng]);
                } else {
                    markerRef.current = L.marker([roundedLat, roundedLng]).addTo(map);
                }

                const addr = await reverseGeocode(roundedLat, roundedLng);
                onPick(roundedLat, roundedLng, addr);
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

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
                <svg className="w-4 h-4 text-[#1e52f1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span><strong>Click the map</strong> to pin your location — address fields auto-fill from the pin.</span>
            </div>

            <div ref={mapRef} className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 300, zIndex: 0 }} />

            {lat && lng ? (
                <div className="flex items-center gap-4 text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <span className="font-mono text-xs text-slate-700">Lat: <b>{lat}</b></span>
                    <span className="w-px h-4 bg-slate-300" />
                    <span className="font-mono text-xs text-slate-700">Lng: <b>{lng}</b></span>
                    <span className="ml-auto inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Pinned
                    </span>
                </div>
            ) : (
                <div className="text-sm text-slate-400 bg-slate-50 border border-dashed border-slate-300 rounded-xl px-4 py-3">
                    No location pinned yet — click anywhere on the map above.
                </div>
            )}
        </div>
    );
}

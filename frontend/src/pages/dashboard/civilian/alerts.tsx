import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { AlertCard } from '@/components/civilian/AlertCard';
import { apiClient } from '@/services/apiClient';

const ZONE_BOUNDS: Record<string, [number, number][]> = {
    sw: [[9.5, 2.7], [9.5, 6.0], [5.5, 6.0], [5.5, 2.7]],
    se: [[7.5, 6.0], [7.5, 9.5], [4.5, 9.5], [4.5, 6.0]],
    ss: [[6.0, 3.5], [6.0, 9.5], [4.0, 9.5], [4.0, 3.5]],
    nc: [[11.5, 5.0], [11.5, 10.0], [7.5, 10.0], [7.5, 5.0]],
    ne: [[14.0, 9.5], [14.0, 15.0], [9.5, 15.0], [9.5, 9.5]],
    nw: [[14.0, 3.5], [14.0, 9.5], [10.0, 9.5], [10.0, 3.5]],
};

function SimpleZoneMap({ zones }: { zones: { id: string; status: 'SAFE' | 'VIGILANT' | 'CRITICAL' }[] }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || mapInstanceRef.current || !mapRef.current) return;
        
        import('leaflet').then(L => {
            const map = L.map(mapRef.current!, {
                center: [9.0, 8.0],
                zoom: 5,
                zoomControl: false,
                scrollWheelZoom: false,
                dragging: false,
                touchZoom: false,
                doubleClickZoom: false,
                boxZoom: false,
                keyboard: false,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 10,
                opacity: 0.4,
            }).addTo(map);

            zones.forEach(z => {
                const color = z.status === 'CRITICAL' ? '#DC2626' : z.status === 'VIGILANT' ? '#CA8A04' : '#16A34A';
                const bounds = ZONE_BOUNDS[z.id];
                if (bounds) {
                    L.polygon(bounds as any, {
                        color,
                        fillColor: color,
                        fillOpacity: 0.35,
                        weight: 2,
                        interactive: false // Read-only visual context
                    }).addTo(map);
                }
            });

            mapInstanceRef.current = map;
        });

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [zones]);

    return <div ref={mapRef} style={{ height: 350, width: '100%' }} className="rounded-xl overflow-hidden shadow-sm border border-slate-200" />;
}

export default function CivilianAlertsFeed() {
  const [broadcast, setBroadcast] = useState('Your zone is currently being monitored. No active alerts.');
  const [status, setStatus] = useState<'SAFE' | 'VIGILANT' | 'CRITICAL'>('SAFE');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Default zones state
  const zonesInfo: { id: string; status: 'SAFE' | 'VIGILANT' | 'CRITICAL' }[] = [
      { id: 'sw', status: 'SAFE' }, { id: 'se', status: 'SAFE' }, { id: 'ss', status: 'VIGILANT' },
      { id: 'nc', status: 'SAFE' }, { id: 'ne', status: 'VIGILANT' }, { id: 'nw', status: 'SAFE' },
  ];

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const zoneId = localStorage.getItem('civ_zone') || 'sw';
        const { data } = await apiClient.get(`/alerts?status=CONFIRMED&zone_id=${zoneId}`);
        setAlerts(Array.isArray(data) ? data : []);
        
        // Try getting broadcast
        const { data: bData } = await apiClient.get(`/broadcasts/latest?zone_id=${zoneId}`);
        if (bData && bData.message) {
          setBroadcast(bData.message);
          setStatus(bData.severity === 'critical' ? 'CRITICAL' : bData.severity === 'high' ? 'VIGILANT' : 'SAFE');
        }
      } catch (e) {
        // Fallback generic state if API not ready
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const formatDate = (isoString?: string) => {
      if (!isoString) return "March 18, 2026";
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(isoString).toLocaleDateString('en-US', options);
  };

  const mapSymptomToTitle = (type: string) => {
      const mapping: Record<string, string> = {
          RESPIRATORY: "Respiratory Illness Alert",
          ENTERIC: "Food-Related Illness Alert",
          NEUROLOGICAL: "Neurological Alert",
          HEMORRHAGIC: "Urgent Illness Alert",
          DERMAL: "Skin Condition Alert"
      };
      return mapping[type?.toUpperCase()] || "Health Alert";
  };

  const statusColors = {
      SAFE: 'bg-green-100 text-green-800',
      VIGILANT: 'bg-amber-100 text-amber-800',
      CRITICAL: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-slate-200 mb-6">
        <Link href="/dashboard/civilian" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#1e52f1] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-lg">MERMS</span>
        </Link>
        <div className="flex gap-4">
            <Link href="/dashboard/civilian/pulse" className="text-sm font-medium text-slate-600 hover:text-[#1e52f1]">Weekly Pulse</Link>
            <Link href="/dashboard/civilian/notifications" className="text-sm font-medium text-slate-600 hover:text-[#1e52f1]">Preferences</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 space-y-6">
        
        {/* Section 1 - Zone Status Bar */}
        <div className={`w-full p-4 rounded-xl flex items-center justify-center text-center shadow-sm ${statusColors[status]}`}>
            <p className="font-medium text-sm">
                {broadcast}
            </p>
        </div>

        {/* Section 2 - Active Alerts Feed */}
        <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4 px-1">Community Health Alerts</h2>
            {!loading && alerts.length === 0 ? (
                <div className="border border-green-300 bg-green-50 rounded-xl p-5 shadow-sm text-center">
                    <p className="font-semibold text-green-700">No confirmed health alerts in your zone this week.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {alerts.map((a, i) => (
                        <AlertCard 
                            key={i}
                            title={mapSymptomToTitle(a.alert_type || a.symptom)}
                            description={a.message || a.description || "Adhere to standard hygiene practices."}
                            date={formatDate(a.created_at)}
                            advice={a.protocol || a.advice || "No specific action steps provided for this alert."}
                        />
                    ))}
                </div>
            )}
        </section>

        {/* Section 3 - Zone Map */}
        <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4 px-1 mt-8">Regional Health Overview</h2>
            <SimpleZoneMap zones={zonesInfo} />
        </section>

      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ZoneStatusShield } from '@/components/civilian/ZoneStatusShield';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { apiClient } from '@/services/apiClient';

export default function CivilianLanding() {
  const router = useRouter();
  const [denied, setDenied] = useState(false);
  const [manualZone, setManualZone] = useState('');
  
  const [status, setStatus] = useState<'SAFE' | 'VIGILANT' | 'CRITICAL'>('SAFE');
  const [broadcast, setBroadcast] = useState('No active health advisories in your area.');

  useEffect(() => {
    // Attempt to load the broadcast
    const fetchBroadcast = async () => {
      try {
        const { data } = await apiClient.get('/broadcasts/latest');
        if (data && data.message) {
          setBroadcast(data.message);
          setStatus(data.severity === 'critical' ? 'CRITICAL' : data.severity === 'high' ? 'VIGILANT' : 'SAFE');
        }
      } catch {
        // Fallback already set in state
      }
    };
    fetchBroadcast();
  }, []);

  const handleLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          localStorage.setItem('civ_coords', JSON.stringify({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
          router.push('/dashboard/civilian/alerts');
        },
        () => {
          setDenied(true);
        }
      );
    } else {
      setDenied(true);
    }
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualZone.trim()) {
      localStorage.setItem('civ_zone', manualZone);
      router.push('/dashboard/civilian/alerts');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#1e52f1] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-lg">MERMS</span>
        </div>
        <Link href="/login" className="text-sm font-medium text-[#1e52f1] hover:underline">
          Sign in as Resident
        </Link>
      </header>

      <main className="max-w-4xl mx-auto mt-16 px-6 text-center">
        <ZoneStatusShield status={status} />
        
        <p className="mt-8 text-lg font-medium text-slate-700 max-w-xl mx-auto px-4">
          {broadcast}
        </p>

        <div className="mt-10 max-w-sm mx-auto">
          {!denied ? (
            <Button onClick={handleLocation} fullWidth>
              View My Local Zone
            </Button>
          ) : (
            <form onSubmit={submitManual} className="space-y-4 text-left">
              <Input
                label="Enter your location manually"
                type="text"
                value={manualZone}
                onChange={(e) => setManualZone(e.target.value)}
                placeholder="e.g., University of Lagos or South West"
                required
              />
              <Button type="submit" fullWidth>
                Continue to Feed
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

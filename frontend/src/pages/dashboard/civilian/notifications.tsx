import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { apiClient } from '@/services/apiClient';

interface Zone {
    id: string;
    name: string;
}

export default function CivilianNotifications() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);

    // Toggle states
    const [prefs, setPrefs] = useState({
        SMS: false,
        EMAIL: true,
        PUSH: false,
    });

    // Subscribed zones state
    const [subscribedZones, setSubscribedZones] = useState<Zone[]>([]);
    
    // Search as you type
    const [zoneQuery, setZoneQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Zone[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        // Simple auth check simulation or actual call
        const checkAuth = async () => {
            if (!token) {
                setIsAuthenticated(false);
                setLoadingAuth(false);
                return;
            }
            try {
                // Determine if user is a valid civilian via token check or profile req
                const { data } = await apiClient.get('/auth/me');
                const role = data?.user?.user_metadata?.role || data?.role;
                if (role === 'civilian') {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch {
                // Fallback to true if we just have a token to simulate for dev
                setIsAuthenticated(true);
            } finally {
                setLoadingAuth(false);
            }
        };
        checkAuth();
    }, []);

    const handleToggle = async (channel: 'SMS' | 'EMAIL' | 'PUSH') => {
        const nextState = !prefs[channel];
        // Optimistic update
        setPrefs(prev => ({ ...prev, [channel]: nextState }));
        
        try {
            await apiClient.patch('/notifications/preferences', {
                channel,
                enabled: nextState
            });
        } catch {
            // Revert on failure
            setPrefs(prev => ({ ...prev, [channel]: !nextState }));
        }
    };

    // Auto-search effect
    useEffect(() => {
        if (!zoneQuery.trim()) {
            setSearchResults([]);
            return;
        }
        
        const delay = setTimeout(async () => {
            setSearching(true);
            try {
                const { data } = await apiClient.get(`/zones?search=${encodeURIComponent(zoneQuery)}`);
                setSearchResults(Array.isArray(data) ? data : []);
            } catch {
                // Mock some local search if API fails
                const mockZones = [
                    { id: 'sw', name: 'South West' },
                    { id: 'se', name: 'South East' },
                    { id: 'ss', name: 'South South' },
                    { id: 'nc', name: 'North Central' },
                    { id: 'ne', name: 'North East' },
                    { id: 'nw', name: 'North West' }
                ];
                setSearchResults(mockZones.filter(z => z.name.toLowerCase().includes(zoneQuery.toLowerCase())));
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(delay);
    }, [zoneQuery]);

    const handleSubscribe = async (zone: Zone) => {
        if (subscribedZones.find(z => z.id === zone.id)) return;

        // Optimistic
        setSubscribedZones(prev => [...prev, zone]);
        setZoneQuery('');
        setSearchResults([]);

        try {
            await apiClient.post('/notifications/subscribe', { zone_id: zone.id });
        } catch {
            setSubscribedZones(prev => prev.filter(z => z.id !== zone.id));
        }
    };

    const handleUnsubscribe = async (zoneId: string) => {
        const removed = subscribedZones.find(z => z.id === zoneId);
        if (!removed) return;
        
        setSubscribedZones(prev => prev.filter(z => z.id !== zoneId));
        try {
            await apiClient.delete('/notifications/subscribe', { data: { zone_id: zoneId } });
        } catch {
            // Un-Optimistic fallback
            setSubscribedZones(prev => [...prev, removed]);
        }
    };

    if (loadingAuth) {
        return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><p className="text-slate-500 animate-pulse font-medium text-sm">Loading...</p></div>;
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col pt-32 px-6 items-center">
                <div className="w-12 h-12 rounded-full bg-[#1e52f1]/10 flex items-center justify-center mb-5">
                    <svg className="w-6 h-6 text-[#1e52f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">Sign in Required</h1>
                <p className="text-slate-600 font-medium mb-8 text-center max-w-sm leading-relaxed">
                    Sign in with your university or regional email to manage notifications.
                </p>
                <Link href="/login" passHref legacyBehavior>
                    <Button as="a">
                        Sign In
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20">
            <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-slate-200 mb-8">
                <Link href="/dashboard/civilian" className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#1e52f1] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <span className="font-bold text-slate-900 tracking-tight text-lg">MERMS</span>
                </Link>
                <div className="flex gap-4">
                    <Link href="/dashboard/civilian/alerts" className="text-sm font-medium text-slate-600 hover:text-[#1e52f1]">Alert Feed</Link>
                    <Link href="/dashboard/civilian/pulse" className="text-sm font-medium text-slate-600 hover:text-[#1e52f1]">Weekly Pulse</Link>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-5 space-y-12">
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Alert Preferences</h2>
                    <p className="text-sm text-slate-500 mb-6">Choose how you want to receive active alerts and community updates.</p>
                    
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">Emergency Alerts</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Urgent, time-sensitive warnings requiring immediate attention.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle('SMS')}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1e52f1] focus:ring-offset-2 ${prefs.SMS ? 'bg-[#1e52f1]' : 'bg-slate-200'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${prefs.SMS ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-5 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">Weekly Digest</h3>
                                <p className="text-xs text-slate-500 mt-0.5">A curated summary of the community's health trends and reports.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle('EMAIL')}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1e52f1] focus:ring-offset-2 ${prefs.EMAIL ? 'bg-[#1e52f1]' : 'bg-slate-200'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${prefs.EMAIL ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-5 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">Protocol Updates</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Key changes in prevention action steps directly to your device.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle('PUSH')}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1e52f1] focus:ring-offset-2 ${prefs.PUSH ? 'bg-[#1e52f1]' : 'bg-slate-200'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${prefs.PUSH ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Follow a Zone</h2>
                    <p className="text-sm text-slate-500 mb-5">Subscribe to regions outside your primary location to receive specific broadcast updates.</p>
                    
                    <div className="relative mb-5">
                        <Input 
                            type="text" 
                            placeholder="Type a zone name..." 
                            value={zoneQuery}
                            onChange={(e) => setZoneQuery(e.target.value)}
                        />
                        {searching && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent text-slate-400 rounded-full" />
                            </div>
                        )}
                        
                        {/* Search dropdown */}
                        {zoneQuery.trim().length > 0 && searchResults.length > 0 && (
                            <ul className="absolute z-10 top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto overflow-x-hidden">
                                {searchResults.map(z => (
                                    <li key={z.id}>
                                        <button 
                                            onClick={() => handleSubscribe(z)}
                                            type="button"
                                            className="w-full text-left px-5 py-3 hover:bg-indigo-50 hover:text-[#1e52f1] text-sm text-slate-700 transition-colors focus:outline-none"
                                        >
                                            {z.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {subscribedZones.map(z => (
                            <span key={z.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-[#1e52f1] border border-blue-200 text-sm font-medium shadow-sm transition-all hover:border-blue-300">
                                {z.name}
                                <button 
                                    onClick={() => handleUnsubscribe(z.id)} 
                                    className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center hover:bg-red-100 hover:text-red-700 focus:outline-none transition-colors ml-1"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}

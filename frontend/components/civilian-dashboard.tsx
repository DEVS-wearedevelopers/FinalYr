'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { MapPin, TrendingUp, AlertTriangle } from 'lucide-react';

export default function CivilianDashboard({ activeTab }: { activeTab: string }) {
  const { token } = useAuthStore();
  const [localAlerts, setLocalAlerts] = useState<any[]>([]);
  const [nationalTrends, setNationalTrends] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: '6.5244', lng: '3.3792' });

  useEffect(() => {
    if (activeTab === 'national') {
      loadNationalTrends();
    }
  }, [activeTab]);

  const loadNationalTrends = async () => {
    setLoading(true);
    try {
      const data = await api.getNationalTrends();
      setNationalTrends(data.trends);
    } catch (error) {
      console.error('Failed to load trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocalAlerts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getLocalAlerts(token, parseFloat(coordinates.lat), parseFloat(coordinates.lng));
      setLocalAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to load local alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (activeTab === 'local') {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <MapPin className="w-7 h-7 text-emerald-600" />
          Local Health Alerts
        </h2>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200 mb-6">
          <h3 className="font-medium text-emerald-900 mb-4">Your Location</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
              <input
                type="text"
                value={coordinates.lat}
                onChange={(e) => setCoordinates({ ...coordinates, lat: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
              <input
                type="text"
                value={coordinates.lng}
                onChange={(e) => setCoordinates({ ...coordinates, lng: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <button
            onClick={loadLocalAlerts}
            className="w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Check Nearby Alerts
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : localAlerts.length === 0 ? (
          <div className="text-center py-12 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-green-900">All Clear</h3>
            <p className="text-green-700 mt-2">No health alerts in your area</p>
          </div>
        ) : (
          <div className="space-y-4">
            {localAlerts.map((alert, idx) => (
              <div key={idx} className="border-2 border-red-200 bg-red-50 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-red-900 text-lg">{alert.title}</h3>
                    <p className="text-red-700 mt-2">{alert.message}</p>
                    <p className="text-sm text-red-600 mt-2">Distance: {alert.distance}km</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'national') {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-blue-600" />
          National Health Trends
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : nationalTrends ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-sm font-medium text-blue-700 mb-2">Total Cases</h3>
                <p className="text-4xl font-bold text-blue-900">{nationalTrends.totalCases?.toLocaleString()}</p>
                <p className="text-sm text-blue-600 mt-2">Nationwide monitoring</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
                <h3 className="text-sm font-medium text-orange-700 mb-2">Active Hotspots</h3>
                <p className="text-4xl font-bold text-orange-900">{nationalTrends.hotspots?.length || 0}</p>
                <div className="mt-3 space-y-1">
                  {nationalTrends.hotspots?.map((zone: string, idx: number) => (
                    <div key={idx} className="text-sm text-orange-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      {zone}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-800 mb-4">Health Information</h3>
              <p className="text-gray-600">
                Stay informed about disease outbreaks in your area. Follow health guidelines and report
                any unusual symptoms to your local healthcare provider immediately.
              </p>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h4 className="font-medium text-emerald-900 mb-2">Prevention</h4>
                  <p className="text-sm text-emerald-700">Wash hands regularly and maintain hygiene</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Early Detection</h4>
                  <p className="text-sm text-blue-700">Monitor symptoms and seek early treatment</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-2">Community</h4>
                  <p className="text-sm text-purple-700">Report clusters to local health authorities</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export default function PHODashboard({ activeTab }: { activeTab: string }) {
  const { token } = useAuthStore();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      loadAlerts();
    }
  }, [token]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getAlertInbox(token!);
      setAlerts(data.inbox || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (alertId: string) => {
    try {
      await api.claimAlert(token!, alertId);
      alert('Alert claimed successfully!');
      loadAlerts();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleStatusUpdate = async (alertId: string, status: string) => {
    try {
      await api.updateAlertStatus(token!, alertId, status);
      alert(`Alert marked as ${status}!`);
      loadAlerts();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'probable':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'investigating':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const pendingAlerts = alerts.filter((a) => a.status === 'pending_investigation');
  const myAlerts = alerts.filter((a) => a.status !== 'pending_investigation');

  if (activeTab === 'inbox') {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">AI-Ranked Alert Inbox</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : pendingAlerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No pending alerts in your zone</div>
        ) : (
          <div className="space-y-4">
            {pendingAlerts.map((alert) => (
              <div
                key={alert.id}
                className="border-2 border-orange-200 bg-orange-50 rounded-lg p-5 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">Zone: {alert.zone_id}</h3>
                      <p className="text-sm text-gray-600">Alert ID: {alert.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      <span className="text-2xl font-bold text-orange-600">{alert.cbs_score?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <p className="text-xs text-gray-500">CBS Score</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Related Reports:</p>
                  {alert.sentinel_reports && (
                    <div className="bg-white rounded-lg p-3 border border-orange-200">
                      <div className="flex gap-4 text-sm">
                        <span>Patients: <strong>{alert.sentinel_reports.patient_count}</strong></span>
                        <span>Symptoms: <strong>{alert.sentinel_reports.symptom_matrix?.join(', ')}</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleClaim(alert.id)}
                  className="w-full bg-orange-600 text-white py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                >
                  Claim for Investigation
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'claimed') {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">My Investigations</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : myAlerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No claimed alerts yet</div>
        ) : (
          <div className="space-y-4">
            {myAlerts.map((alert) => (
              <div key={alert.id} className={`border-2 rounded-lg p-5 ${getStatusColor(alert.status)}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">Zone: {alert.zone_id}</h3>
                    <p className="text-sm opacity-80">Alert ID: {alert.id.slice(0, 8)}...</p>
                  </div>
                  <span className="px-3 py-1 bg-white/50 rounded-full text-sm font-medium">
                    {alert.status}
                  </span>
                </div>

                <div className="flex gap-2 mt-4">
                  {alert.status === 'investigating' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(alert.id, 'probable')}
                        className="flex-1 bg-yellow-600 text-white py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                      >
                        Mark as Probable
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(alert.id, 'invalidated')}
                        className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        Invalidate
                      </button>
                    </>
                  )}
                  {alert.status === 'probable' && (
                    <button
                      onClick={() => handleStatusUpdate(alert.id, 'confirmed')}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Confirm Outbreak
                    </button>
                  )}
                  {alert.status === 'confirmed' && (
                    <div className="flex-1 text-center py-2">
                      <CheckCircle className="w-6 h-6 text-red-700 mx-auto" />
                      <p className="text-sm font-medium mt-1">Outbreak Confirmed</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

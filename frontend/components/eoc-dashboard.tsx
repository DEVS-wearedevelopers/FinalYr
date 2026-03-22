'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Shield, UserPlus, AlertCircle } from 'lucide-react';

export default function EOCDashboard({ activeTab }: { activeTab: string }) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const [facilityForm, setFacilityForm] = useState({
    facilityId: '',
    status: 'approved',
  });

  const [phoForm, setPHOForm] = useState({
    userId: '',
    zoneId: '',
  });

  const handleApproveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.approveFacility(token!, facilityForm.facilityId, facilityForm.status);
      alert(`Facility ${facilityForm.status} successfully!`);
      setFacilityForm({ facilityId: '', status: 'approved' });
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointPHO = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.appointPHO(token!, phoForm.userId, phoForm.zoneId);
      alert('PHO appointed successfully!');
      setPHOForm({ userId: '', zoneId: '' });
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (activeTab === 'facilities') {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Shield className="w-7 h-7 text-emerald-600" />
          Facility Management
        </h2>

        <form onSubmit={handleApproveFacility} className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Facility ID</label>
            <input
              type="text"
              value={facilityForm.facilityId}
              onChange={(e) => setFacilityForm({ ...facilityForm, facilityId: e.target.value })}
              placeholder="e.g., facility-uuid-123"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Enter the UUID of the facility to manage</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <select
              value={facilityForm.status}
              onChange={(e) => setFacilityForm({ ...facilityForm, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="approved">Approve</option>
              <option value="rejected">Reject</option>
              <option value="blacklisted">Blacklist</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Update Facility Status'}
          </button>
        </form>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Facility Status Guide
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Approved:</strong> Facility can submit sentinel reports</li>
            <li><strong>Rejected:</strong> Facility onboarding denied</li>
            <li><strong>Blacklisted:</strong> Facility access revoked for violations</li>
          </ul>
        </div>
      </div>
    );
  }

  if (activeTab === 'phos') {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <UserPlus className="w-7 h-7 text-emerald-600" />
          PHO Management
        </h2>

        <form onSubmit={handleAppointPHO} className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
            <input
              type="text"
              value={phoForm.userId}
              onChange={(e) => setPHOForm({ ...phoForm, userId: e.target.value })}
              placeholder="e.g., user-uuid-456"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">User UUID from auth system</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zone ID</label>
            <input
              type="text"
              value={phoForm.zoneId}
              onChange={(e) => setPHOForm({ ...phoForm, zoneId: e.target.value })}
              placeholder="e.g., zone-777"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Geographic zone this PHO will monitor</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Appointing...' : 'Appoint PHO'}
          </button>
        </form>

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            PHO Appointment Info
          </h3>
          <p className="text-sm text-amber-800">
            Appointing a PHO will update their role and assign them to monitor a specific geographic zone.
            They will receive alerts from institutions within their jurisdiction.
          </p>
        </div>
      </div>
    );
  }

  if (activeTab === 'alerts') {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <AlertCircle className="w-7 h-7 text-red-600" />
          Alert Override
        </h2>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl border border-red-200">
          <p className="text-gray-700 mb-4">
            Alert override functionality allows EOC administrators to invalidate AI false-positive alerts.
            This requires dual-authentication co-sign for security.
          </p>

          <div className="bg-white border border-red-300 rounded-lg p-4">
            <h3 className="font-medium text-red-900 mb-2">Implementation Note</h3>
            <p className="text-sm text-red-800">
              The full dual-auth override system is implemented in the backend at <code className="bg-red-100 px-2 py-1 rounded">POST /admin/alerts/:id/override</code>.
              Integrate with TOTP or similar 2FA system in production.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

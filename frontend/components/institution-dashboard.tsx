'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { AlertCircle, CheckCircle, Clock, MapPin } from 'lucide-react';

export default function InstitutionDashboard({ activeTab }: { activeTab: string }) {
  const { token } = useAuthStore();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientCount: '',
    severity: '5',
    lat: '6.5244',
    lng: '3.3792',
    address: 'Lagos Mainland',
    symptoms: ['Fever'],
    notes: '',
  });

  const commonSymptoms = ['Fever', 'Cough', 'Fatigue', 'Headache', 'Nausea', 'Diarrhea', 'Difficulty Breathing'];

  useEffect(() => {
    if (activeTab === 'feed' && token) {
      loadReports();
    }
  }, [activeTab, token]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReportsFeed(token!);
      setReports(data.reports || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.submitReport(token!, {
        patientCount: parseInt(formData.patientCount),
        severity: parseInt(formData.severity),
        originLocation: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
          address: formData.address,
        },
        symptomMatrix: formData.symptoms,
        notes: formData.notes,
      });

      alert('Sentinel Report submitted successfully!');
      setFormData({
        patientCount: '',
        severity: '5',
        lat: '6.5244',
        lng: '3.3792',
        address: 'Lagos Mainland',
        symptoms: ['Fever'],
        notes: '',
      });
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSymptom = (symptom: string) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  };

  if (activeTab === 'submit') {
    return (
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Submit Sentinel Report</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Patient Count</label>
              <input
                type="number"
                value={formData.patientCount}
                onChange={(e) => setFormData({ ...formData, patientCount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity (1-10)</label>
              <input
                type="range"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full"
                min="1"
                max="10"
              />
              <div className="text-center mt-1">
                <span className="text-2xl font-bold text-emerald-600">{formData.severity}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms</label>
            <div className="flex flex-wrap gap-2">
              {commonSymptoms.map((symptom) => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.symptoms.includes(symptom)
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
              <input
                type="text"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
              <input
                type="text"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    );
  }

  if (activeTab === 'feed') {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Report Feed</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No reports submitted yet</div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-gray-800">{report.origin_address}</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      report.status === 'Validated'
                        ? 'bg-green-100 text-green-700'
                        : report.status === 'Under PHO Review'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {report.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Patients:</span>{' '}
                    <span className="font-medium text-gray-800">{report.patient_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Severity:</span>{' '}
                    <span className="font-medium text-gray-800">{report.severity}/10</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>{' '}
                    <span className="font-medium text-gray-800">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {report.symptom_matrix && (
                  <div className="mt-3">
                    <span className="text-sm text-gray-500">Symptoms:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {report.symptom_matrix.map((symptom: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

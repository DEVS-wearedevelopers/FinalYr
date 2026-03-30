/**
 * reportsService — MOCK VERSION (no backend required)
 * All calls are routed to the local mock data store.
 */
import {
  mockGetReports,
  mockSubmitReport,
  INSTITUTION_COORDS,
} from './mockData';

export const reportsService = {
  async submitReport(payload: {
    patientCount: number;
    originLocation: { lat: number; lng: number; address?: string };
    symptomMatrix: string[];
    severity: number;
    notes?: string;
  }) {
    const report = mockSubmitReport({
      source: 'sentinel',
      organization_id: 'usr-institution-001',
      patient_count: payload.patientCount,
      symptom_matrix: payload.symptomMatrix,
      severity: payload.severity,
      origin_address: payload.originLocation.address || 'Lagos General Hospital, Lagos Island',
      origin_lat: payload.originLocation.lat || INSTITUTION_COORDS['usr-institution-001'].lat,
      origin_lng: payload.originLocation.lng || INSTITUTION_COORDS['usr-institution-001'].lng,
      notes: payload.notes,
    });
    return { report };
  },

  async getReportsFeed() {
    return mockGetReports();
  },

  async submitCommunityReport(payload: {
    lga: string;
    symptoms: string[];
    severity: number;
    notes?: string;
  }) {
    const report = mockSubmitReport({
      source: 'community',
      patient_count: 1,
      symptom_matrix: payload.symptoms,
      severity: payload.severity,
      origin_address: `${payload.lga}, Lagos`,
      lga: payload.lga,
    });
    return { report, message: 'Community report submitted' };
  },
};

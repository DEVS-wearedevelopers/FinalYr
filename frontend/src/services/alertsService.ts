/**
 * alertsService — MOCK VERSION (no backend required)
 * All calls are routed to the local mock data store.
 */
import {
  mockGetAlerts,
  mockClaimAlert,
  mockUpdateAlertStatus,
  mockEscalateAlert,
  mockGetNationalTrends,
  mockGetLocalAlerts,
  mockSendBroadcast,
} from './mockData';

export type AlertStatusUpdate = 'probable' | 'confirmed' | 'invalidated';

export const alertsService = {
  async getInbox() {
    return mockGetAlerts();
  },
  async claimAlert(alertId: string) {
    return mockClaimAlert(alertId, 'usr-pho-001');
  },
  async updateStatus(alertId: string, status: AlertStatusUpdate) {
    return mockUpdateAlertStatus(alertId, status as any, '');
  },
  async broadcast(message?: string) {
    mockSendBroadcast({
      type: 'general',
      title: 'PHO Alert',
      message: message || 'Public health advisory issued.',
      issuerName: 'Dr. Amaka Osei (PHO)',
      zone: 'Lagos Island / V.I.',
    });
    return { message: 'Broadcast sent' };
  },
  async escalate(alertId: string) {
    mockEscalateAlert(alertId);
    return { message: 'Escalated to EOC' };
  },
  async getLocalAlerts(_lat: number, _lng: number) {
    return mockGetLocalAlerts();
  },
  async getNationalTrends() {
    return mockGetNationalTrends();
  },
};

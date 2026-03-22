const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

export const api = {
  submitReport: (token: string, report: any) =>
    apiCall('/reports', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(report),
    }),

  getReportsFeed: (token: string) =>
    apiCall('/reports/feed', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAlertInbox: (token: string) =>
    apiCall('/alerts/inbox', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  claimAlert: (token: string, alertId: string) =>
    apiCall(`/alerts/${alertId}/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateAlertStatus: (token: string, alertId: string, status: string) =>
    apiCall(`/alerts/${alertId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }),

  getLocalAlerts: (token: string, lat: number, lng: number) =>
    apiCall(`/alerts/local?lat=${lat}&lng=${lng}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getNationalTrends: () => apiCall('/alerts/national'),

  approveFacility: (token: string, facilityId: string, status: string) =>
    apiCall(`/admin/facilities/${facilityId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }),

  appointPHO: (token: string, userId: string, zoneId: string) =>
    apiCall('/admin/phos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, zoneId }),
    }),
};

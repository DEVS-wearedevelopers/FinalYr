'use client';

import { useAuthStore } from '@/lib/store';
import { LogOut, Shield, Activity, FileText, Users, AlertTriangle } from 'lucide-react';
import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  const { user, logout } = useAuthStore();

  const getRoleTabs = () => {
    switch (user?.role) {
      case 'eoc':
        return [
          { id: 'facilities', label: 'Facilities', icon: Shield },
          { id: 'phos', label: 'PHO Management', icon: Users },
          { id: 'alerts', label: 'Alert Override', icon: AlertTriangle },
        ];
      case 'pho':
        return [
          { id: 'inbox', label: 'Alert Inbox', icon: AlertTriangle },
          { id: 'claimed', label: 'My Investigations', icon: Activity },
        ];
      case 'institution':
        return [
          { id: 'submit', label: 'Submit Report', icon: FileText },
          { id: 'feed', label: 'Report Feed', icon: Activity },
        ];
      case 'civilian':
        return [
          { id: 'local', label: 'Local Alerts', icon: AlertTriangle },
          { id: 'national', label: 'National Trends', icon: Activity },
        ];
      default:
        return [];
    }
  };

  const tabs = getRoleTabs();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">MERMS</h1>
                <p className="text-xs text-gray-500">{user?.role.toUpperCase()} Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{user?.email}</p>
                {user?.organizationId && (
                  <p className="text-xs text-gray-500">{user.organizationId}</p>
                )}
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50">
            <div className="flex gap-1 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-white shadow-sm text-emerald-700 font-medium'
                        : 'text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import AuthForm from '@/components/auth-form';
import DashboardLayout from '@/components/dashboard-layout';
import InstitutionDashboard from '@/components/institution-dashboard';
import PHODashboard from '@/components/pho-dashboard';
import EOCDashboard from '@/components/eoc-dashboard';
import CivilianDashboard from '@/components/civilian-dashboard';

export default function Home() {
  const { user, isLoading, checkAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'eoc':
          setActiveTab('facilities');
          break;
        case 'pho':
          setActiveTab('inbox');
          break;
        case 'institution':
          setActiveTab('submit');
          break;
        case 'civilian':
          setActiveTab('local');
          break;
      }
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {user.role === 'institution' && <InstitutionDashboard activeTab={activeTab} />}
      {user.role === 'pho' && <PHODashboard activeTab={activeTab} />}
      {user.role === 'eoc' && <EOCDashboard activeTab={activeTab} />}
      {user.role === 'civilian' && <CivilianDashboard activeTab={activeTab} />}
    </DashboardLayout>
  );
}

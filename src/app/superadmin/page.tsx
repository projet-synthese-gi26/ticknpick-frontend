'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

import Sidebar, { SuperAdminProfile } from './Sidebar';
import Overview from './Overview';
import UserManagement from './UserManagement';
import OperationsManagement from './OperationManagement';
import FinanceManagement from './FinanceManagement';

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true); // Set to true initially
  const [profile, setProfile] = useState<SuperAdminProfile | null>(null);

  useEffect(() => {
    // Set profile and then set loading to false
    setProfile({
      name: 'Super Admin PicknDrop',
      email: 'superadmin@pickndrop.com',
      avatarUrl: '/avatars/default.png'
    });
    setIsLoading(false);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'users':
        return <UserManagement />;
      case 'operations':
        return <OperationsManagement />;
      case 'finance':
        return <FinanceManagement />;
      default:
        return <Overview />;
    }
  };

  // Show loading spinner while profile is being set
  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
      />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
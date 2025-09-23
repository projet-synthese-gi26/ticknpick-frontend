'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic'; // Importez 'dynamic'

import Sidebar, { SuperAdminProfile } from './Sidebar';
import UserManagement from './UserManagement';

// --- Les 3 composants utilisant des bibliothèques client-side sont maintenant dynamiques ---

// Pour chart.js
const Overview = dynamic(() => import('./Overview'), {
  ssr: false,
  loading: () => <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>,
});

// Pour chart.js
const FinanceManagement = dynamic(() => import('./FinanceManagement'), {
  ssr: false,
  loading: () => <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>,
});

// NOUVELLE CORRECTION : Pour leaflet
const OperationsManagement = dynamic(() => import('./OperationManagement'), {
  ssr: false,
  loading: () => <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>,
});


export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<SuperAdminProfile | null>(null);

  useEffect(() => {
    // Simuler le chargement du profil
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
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

import Sidebar,  { SuperAdminProfile }  from './Sidebar'; // Nous allons créer Sidebar.tsx
import Overview from './Overview'; // Nous allons créer Overview.tsx
import UserManagement from './UserManagement';
import OperationsManagement from './OperationManagement';
import FinanceManagement from './FinanceManagement'; // Le composant que vous avez fourni


export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false); // Pas de loading nécessaire
  const [profile, setProfile] = useState<SuperAdminProfile | null>(null);

  useEffect(() => {
    // Définir directement le profil sans vérification de connexion
    setProfile({
      name: 'Super Admin PicknDrop', // Nom par défaut comme demandé
      email: 'superadmin@pickndrop.com', // Email par défaut
      avatarUrl: '/avatars/default.png' // Avatar par défaut
    });
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'users':
        return <UserManagement />;
      case 'operations':
        return <OperationsManagement />
      case 'finance':
        return <FinanceManagement />;
      default:
        return <Overview />;
    }
  };

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
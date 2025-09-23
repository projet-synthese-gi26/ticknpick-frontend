// src/app/superadmin/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  DollarSign,
  LogOut,
  ShieldCheck,
  Loader2
} from 'lucide-react';

export interface SuperAdminProfile {
  name: string;
  email: string;
  avatarUrl?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const navigationItems: NavItem[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: 'users', label: "Gestion Utilisateurs", icon: Users },
  { id: 'operations', label: "Opérations", icon: Package },
  { id: 'finance', label: "Finances", icon: DollarSign },
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: SuperAdminProfile;
}

export default function Sidebar({ activeTab, setActiveTab, profile }: SidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

    // CORRECTION: Ajout d'une protection. Si le profil n'est pas encore là, on affiche un état de chargement léger.
  if (!profile) {
      return (
        <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-white shadow-xl flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </aside>
      );
  }

  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-white shadow-xl flex flex-col transition-transform -translate-x-full lg:translate-x-0">
      {/* Header Sidebar */}
      <div className="p-4 border-b flex items-center gap-3">
        <Link href="/home" className="flex items-center space-x-2 group">
          <div className="bg-orange-500 p-2 rounded-lg">
              <Package className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800">PicknDrop</span>
        </Link>
      </div>

      <div className="flex flex-col flex-1">
        {/* Navigation */}
        <nav className="flex-1 px-2 py-4">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-semibold transition-colors duration-200 ${
                activeTab === item.id 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>
        
        {/* Footer Sidebar */}
        <div className="p-4 border-t">
            <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center ring-2 ring-white">
                        <ShieldCheck className="h-5 w-5 text-orange-600"/>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">{profile.name}</p>
                        <p className="text-xs text-gray-500">{profile.email}</p>
                    </div>
                </div>
            </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 mt-4 rounded-lg text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Déconnexion
          </button>
        </div>
      </div>
    </aside>
  );
}
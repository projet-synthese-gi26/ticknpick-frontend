// FICHIER: src/app/superadmin/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  DollarSign,
  LogOut,
  ShieldCheck,
  Loader2,
  Activity,
  Menu
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // Import du context d'authentification

// Interface pour les onglets
interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

// Configuration centralisée des onglets
const navigationItems: NavItem[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard, description: "KPIs et graphiques" },
  { id: 'users', label: "Utilisateurs", icon: Users, description: "Gestion comptes & rôles" },
  { id: 'operations', label: "Opérations", icon: Package, description: "Colis et logistique" },
  { id: 'finance', label: "Finances", icon: DollarSign, description: "Revenus et trésorerie" },
    { id: 'system', label: "Système", icon: Activity, description: "Monitoring technique" }, // <-- AJOUT
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // Le profil vient désormais du contexte global ou est passé en props, 
  // ici on le type légèrement pour l'affichage
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (val: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen }: SidebarProps) {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    // Appel à la fonction logout du context (nettoyage localStorage, redirection)
    logout();
  };

  // État de chargement ou utilisateur manquant
  if (isLoading) {
      return (
        <aside className="fixed top-0 left-0 z-50 w-64 h-screen bg-slate-900 dark:bg-black border-r border-slate-800 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </aside>
      );
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen && setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 w-72 h-screen transition-transform duration-300 ease-out
        bg-slate-900 text-white dark:bg-black border-r border-slate-800
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Header Sidebar */}
        <div className="p-6 border-b border-slate-800 flex flex-col gap-1">
          <Link href="/home" className="flex items-center space-x-3 group mb-1">
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-2.5 rounded-xl shadow-lg shadow-orange-900/20 group-hover:scale-105 transition-transform">
                <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Pick<span className="text-orange-500">n</span>Drop
            </span>
          </Link>
          <span className="text-[10px] uppercase font-bold text-slate-500 pl-1 tracking-widest">
            Panneau Administration
          </span>
        </div>

        {/* Navigation */}
        <div className="flex flex-col flex-1 py-6 px-4 overflow-y-auto">
          <div className="mb-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Menu Principal
          </div>
          <nav className="space-y-1">
            {navigationItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (setIsSidebarOpen) setIsSidebarOpen(false);
                  }}
                  className={`group flex items-center w-full px-3 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-orange-600 to-amber-700 text-white shadow-lg shadow-orange-900/40' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                  <div className="flex flex-col items-start">
                    <span>{item.label}</span>
                    {/* Optionnel: petite description pour les écrans larges */}
                    {/* <span className="text-[10px] font-normal opacity-60 hidden xl:block">{item.description}</span> */}
                  </div>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
             <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600">
                         <ShieldCheck className="h-5 w-5 text-green-400"/>
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{user?.name || 'Administrateur'}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-green-500/10 text-green-400 font-bold border border-green-500/20">
                       <Activity className="w-3 h-3" /> En ligne
                    </span>
                </div>
             </div>
          </div>
        </div>
        
        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:text-white hover:bg-red-600 transition-all duration-200 group"
          >
            <LogOut className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
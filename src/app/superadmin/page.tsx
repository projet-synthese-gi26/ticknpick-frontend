// FICHIER: src/app/superadmin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LayoutDashboard, Users, Map, CircleDollarSign, LogOut, PackageCheck, Bell, Search, Settings, Shield, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/userservice'; 
import dynamic from 'next/dynamic';

// Sous-composants - Chargés dynamiquement pour éviter SSR
const Overview = dynamic(() => import('./Overview'), { ssr: false });
const UserManagement = dynamic(() => import('./UserManagement'), { ssr: false });
const OperationsManagement = dynamic(() => import('./OperationManagement'), { ssr: false });
const FinanceManagement = dynamic(() => import('./FinanceManagement'), { ssr: false });
const MonitoringSystem = dynamic(() => import('./Monitoring'), { ssr: false });

const TABS = {
  overview: { label: "Vue d'ensemble", icon: LayoutDashboard, comp: Overview },
  users: { label: 'Gestion Utilisateurs', icon: Users, comp: UserManagement },
  operations: { label: 'Opérations Colis', icon: Map, comp: OperationsManagement },
  finance: { label: 'Finances & Revenus', icon: CircleDollarSign, comp: FinanceManagement},
  system: { label: 'Monitoring Système', icon: Activity, comp: MonitoringSystem },
};

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<keyof typeof TABS>('overview');
  const [isLoadingCheck, setIsLoadingCheck] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmailDisplay, setUserEmailDisplay] = useState('Admin');
  const [isMounted, setIsMounted] = useState(false); // ✅ Nouveau state
  
  const router = useRouter();
  const { user: authUser, isAuthenticated, logout, isLoading: isAuthLoading } = useAuth();

  // ✅ Vérifier que le composant est monté côté client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (isAuthLoading) return;

      if (!isAuthenticated || !authUser || !authUser.id) {
        console.log("SuperAdmin: Non authentifié ou ID manquant -> Login");
        router.push('/login');
        return;
      }

      try {
        let profile = null;
        try {
           console.log("SuperAdmin: Vérification via ID:", authUser.id);
           profile = await userService.getProfileById(authUser.id);
        } catch(e) {
           console.warn("Erreur récupération profil par ID:", e);
        }

        const roleToCheck = (profile?.account_type || authUser.accountType || '').toUpperCase();
        
        console.log("SuperAdmin: Rôle détecté:", roleToCheck);

        if (roleToCheck === 'ADMIN' || roleToCheck === 'SUPERADMIN') {
          setIsAdmin(true);
          setUserEmailDisplay(profile?.email || authUser.email);
        } else {
          alert("⛔ Accès refusé. Cet espace est réservé aux administrateurs.");
          router.push('/home'); 
          return;
        }

      } catch (error) {
        console.error("Erreur critique auth admin:", error);
        router.push('/login');
      } finally {
        setIsLoadingCheck(false);
      }
    };

    verifyAdminAccess();
  }, [isAuthenticated, isAuthLoading, authUser, router]);

  // ✅ Ne rien rendre tant que le composant n'est pas monté côté client
  if (!isMounted) {
    return null;
  }

  if (isAuthLoading || isLoadingCheck) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
         <Loader2 className="animate-spin h-12 w-12 text-orange-500 mb-4" />
         <p className="text-gray-500">Chargement de l'espace Admin...</p>
      </div>
    );
  }

  if (!isAdmin) return null; 

  const ActiveComponent = TABS[activeTab].comp;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out shadow-sm z-30">
        {/* Logo Zone */}
        <div className="h-20 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/home')}>
             <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <PackageCheck className="w-5 h-5"/>
             </div>
             <div>
                 <h1 className="font-bold text-xl text-slate-900 dark:text-white leading-tight">PicknDrop</h1>
                 <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">
                    Admin
                 </span>
             </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
           {Object.entries(TABS).map(([key, tab]) => {
             const isActive = activeTab === key;
             const Icon = tab.icon;
             return (
               <button
                 key={key}
                 onClick={() => setActiveTab(key as any)}
                 className={`relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300
                   ${isActive 
                     ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md' 
                     : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                   }
                 `}
               >
                 <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                 <span>{tab.label}</span>
               </button>
             );
           })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
           <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
               <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                   {userEmailDisplay?.charAt(0).toUpperCase() || 'A'}
               </div>
               <div className="flex-1 min-w-0">
                   <p className="text-sm font-bold truncate">{userEmailDisplay}</p>
                   <p className="text-xs text-slate-500">Super Admin</p>
               </div>
           </div>
           <button 
             onClick={logout} 
             className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 py-2 rounded-xl text-sm font-bold transition-all"
           >
             <LogOut className="w-4 h-4" /> Déconnexion
           </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
         {/* Header Navbar */}
         <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 flex items-center justify-between px-8 shadow-sm">
             <div className="flex items-center gap-2 text-xs text-slate-500">
                 <Shield className="w-4 h-4 text-orange-500" />
                 <span className="font-semibold">Administration</span> / <span>{TABS[activeTab].label}</span>
             </div>
             
             <div className="flex items-center gap-4">
                 {/* Placeholder Search */}
                 <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Recherche rapide..." className="bg-transparent text-sm outline-none w-48" />
                 </div>
                 <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                 <button className="relative p-2 hover:bg-slate-100 rounded-full"><Bell className="w-5 h-5 text-slate-600"/><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span></button>
                 <button className="p-2 hover:bg-slate-100 rounded-full"><Settings className="w-5 h-5 text-slate-600"/></button>
             </div>
         </header>

         {/* Content Scroll */}
         <div className="flex-1 overflow-auto p-8 custom-scrollbar relative bg-slate-50 dark:bg-gray-900">
             <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <ActiveComponent />
             </div>
         </div>
      </main>

    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  LayoutDashboard, 
  Users, 
  Map, 
  CircleDollarSign, 
  LogOut, 
  PackageCheck, 
  Bell, 
  Search, 
  Settings, 
  Shield, 
  Activity 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/userservice'; 
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion'; // Animation pour la navbar mobile

// Sous-composants - Chargés dynamiquement pour éviter SSR
const Overview = dynamic(() => import('./Overview'), { ssr: false });
const UserManagement = dynamic(() => import('./UserManagement'), { ssr: false });
const OperationsManagement = dynamic(() => import('./OperationManagement'), { ssr: false });
const FinanceManagement = dynamic(() => import('./FinanceManagement'), { ssr: false });
const MonitoringSystem = dynamic(() => import('./Monitoring'), { ssr: false });

const TABS = {
  overview: { label: "Vue d'ensemble", icon: LayoutDashboard, comp: Overview },
  users: { label: 'Utilisateurs', icon: Users, comp: UserManagement },
  operations: { label: 'Opérations', icon: Map, comp: OperationsManagement },
  finance: { label: 'Finances', icon: CircleDollarSign, comp: FinanceManagement},
  system: { label: 'Système', icon: Activity, comp: MonitoringSystem },
};

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<keyof typeof TABS>('overview');
  const [isLoadingCheck, setIsLoadingCheck] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmailDisplay, setUserEmailDisplay] = useState('Admin');
  const [isMounted, setIsMounted] = useState(false);
  
  const router = useRouter();
  const { user: authUser, isAuthenticated, logout, isLoading: isAuthLoading } = useAuth();

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
           profile = await userService.getProfileById(authUser.id);
        } catch(e) {
           console.warn("Erreur récupération profil par ID:", e);
        }

        const roleToCheck = (profile?.account_type || authUser.accountType || '').toUpperCase();

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

  if (!isMounted) return null;

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
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16 lg:pb-0">
      
      {/* --- 1. SIDEBAR DESKTOP (Aside) --- */}
      {/* hidden sur mobile/tablette (< 1024px) */}
      <aside className="hidden lg:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col flex-shrink-0 transition-all duration-300 ease-in-out shadow-sm z-30 h-full">
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

        {/* Menu Items Desktop */}
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
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
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
             className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 py-2 rounded-xl text-sm font-bold transition-all"
           >
             <LogOut className="w-4 h-4" /> Déconnexion
           </button>
        </div>
      </aside>

      {/* --- 2. BOTTOM NAV MOBILE (Nav) --- */}
      {/* Visible uniquement en < lg */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-16 px-2">
           {Object.entries(TABS).map(([key, tab]) => {
             const isActive = activeTab === key;
             const Icon = tab.icon;
             return (
                <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 relative 
                    ${isActive ? 'text-orange-600 dark:text-orange-500' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    {isActive && (
                         <motion.div layoutId="admin-nav-active" className="absolute -top-0.5 h-1 w-8 bg-orange-500 rounded-b-lg" />
                    )}
                    <Icon className={`h-6 w-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    <span className="text-[10px] font-medium truncate max-w-[60px] leading-none">
                        {/* Labels raccourcis pour mobile si besoin */}
                        {tab.label === 'Gestion Utilisateurs' ? 'Users' : 
                         tab.label === 'Opérations Colis' ? 'Opés' :
                         tab.label === "Vue d'ensemble" ? 'Overview' : 
                         tab.label === "Monitoring Système" ? 'System' :
                         tab.label}
                    </span>
                </button>
             );
           })}
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative h-full">
         {/* Header Navbar */}
         <header className="h-16 lg:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 flex items-center justify-between px-4 lg:px-8 shadow-sm flex-shrink-0">
             
             {/* Mobile: Titre Court */}
             <div className="flex items-center gap-3 lg:hidden">
                 <div className="bg-orange-500 p-1.5 rounded-lg"><PackageCheck className="w-5 h-5 text-white"/></div>
                 <h2 className="font-bold text-slate-800 dark:text-white text-lg truncate">Admin Panel</h2>
             </div>

             {/* Desktop: Breadcrumb */}
             <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
                 <Shield className="w-4 h-4 text-orange-500" />
                 <span className="font-semibold">Administration</span> / <span>{TABS[activeTab].label}</span>
             </div>
             
             <div className="flex items-center gap-2 lg:gap-4">
                 {/* Mobile Search Button / Desktop Input */}
                 <div className="hidden lg:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Recherche..." className="bg-transparent text-sm outline-none w-48 dark:text-white" />
                 </div>

                 {/* Action Icons */}
                 <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full lg:hidden"><Search className="w-5 h-5 text-slate-600 dark:text-slate-400"/></button>
                 <button className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><Bell className="w-5 h-5 text-slate-600 dark:text-slate-400"/><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span></button>
                 <button 
                    className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-red-500"
                    onClick={logout}
                 >
                     <LogOut className="w-5 h-5" />
                 </button>
             </div>
         </header>

         {/* Content Scroll */}
         <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 bg-slate-50 dark:bg-gray-900">
             <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-4 lg:pb-0">
                <ActiveComponent />
             </div>
         </div>
      </main>

    </div>
  );
}
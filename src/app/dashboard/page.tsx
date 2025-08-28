// FICHIER : src/app/dashboard/page.tsx
'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

// --- Icônes
import {
  Home, Package, User, LogOut, Bell, Menu, X, Users, Settings, Image as ImageIcon, Briefcase, CreditCard
} from 'lucide-react';

// --- Import des composants pour chaque onglet ---
// Nous allons créer/modifier ces fichiers juste après
import OverviewDashboard from './Overview'; // Vue d'ensemble avec KPIs et graphiques
import InventoryPage from './Inventaire'; // Existant, sera juste re-stylé
import PersonnelPage from './Personnel'; // Existant, sera juste re-stylé
import ProfilePage from './Profil'; // NOUVEAU composant pour gérer les profils
import ServiceCardPage from './ServiceCard'; // Existant, sera adapté
import SettingsPage from './Settings'; // NOUVEAU composant

// --- Type du profil utilisateur PRO ---
// --- Type du profil utilisateur PRO ---
export interface ProProfile {
    id: string; // uuid de Supabase auth.users
    created_at: string;
    account_type: 'FREELANCE' | 'AGENCY';

    // Étape 1: Identification Gérant
    manager_name: string | null;
    birth_date: string | null; // les dates sont des chaînes en JSON
    nationality: string | null;
    home_address: string | null;
    phone_number: string | null;
    identity_photo_url: string | null;

    // Étape 2: Infos Admin & Légales
    id_card_number: string | null;
    id_card_url: string | null;
    tax_id: string | null;
    legal_status: string | null;
    company_register: string | null;

    // Étape 3: Infos Professionnelles
    professional_experience: string | null;
    spoken_languages: string[] | null; // text[] devient string[]

    // Étape 4: Infos Point Relais
    relay_point_name: string | null;
    relay_point_address: string | null;
    relay_point_gps: string | null;
    relay_point_type: string | null;
    opening_hours: string | null;
    storage_capacity: string | null;

    // Étape 5: Infos Financières et autres (JSONB)
    payment_info: any | null; // jsonb peut être n'importe quel objet
    
    // Pour permettre un accès dynamique si besoin
    [key: string]: any;
}

// --- Éléments de navigation ---
const baseNavItems = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: Home },
  { id: 'inventory', label: 'Suivi de Colis', icon: Package },
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'service-card', label: 'Carte de Service', icon: Briefcase },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

const agencyNavItem = { id: 'staff', label: 'Personnel', icon: Users };


// --- Composants UI (Sidebar, Header) ---
const Sidebar = ({ navigationItems, activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen }: any) => {
    // Le contenu interne de la Sidebar (SidebarContent)
    const SidebarContent = () => {
        const router = useRouter();
        const handleLogout = async () => {
            await supabase.auth.signOut();
            localStorage.removeItem('pickndrop_currentUser');
            router.push('/');
        };
        
        return (
            <div className="flex flex-col h-full">
                <div className="px-6 py-6 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center">
                        <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-3 rounded-xl mr-3">
                            <Package className="h-8 w-8 text-white"/>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">PicknDrop</h1>
                            <p className="text-gray-500 text-sm">PRO Dashboard</p>
                        </div>
                    </div>
                    {isSidebarOpen && <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-800"><X className="h-6 w-6" /></button>}
                </div>
                
                <nav className="mt-6 flex-1 px-4">
                    <ul className="space-y-2">
                        {navigationItems.map((item: any) => (
                          <li key={item.id}>
                            <button
                              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                                activeTab === item.id
                                  ? 'bg-orange-600 text-white shadow-md'
                                  : 'text-gray-600 hover:bg-orange-50 hover:text-orange-700'
                              }`}
                            >
                              <item.icon className="h-5 w-5" />
                              <span>{item.label}</span>
                            </button>
                          </li>
                        ))}
                    </ul>
                </nav>
                
                <div className="px-4 py-6 border-t border-gray-200">
                    <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200">
                        <LogOut className="h-5 w-5" />
                        <span>Déconnexion</span>
                    </button>
                </div>
            </div>
        );
    };

    return (
      <>
        {/* Sidebar pour grands écrans */}
        <div className="hidden lg:flex w-72 bg-white border-r border-gray-200 flex-col fixed h-full shadow-sm">
            <SidebarContent />
        </div>
        {/* Drawer pour mobile */}
        <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)}></div>
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative z-50 w-72 h-full bg-white shadow-xl">
              <SidebarContent />
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </>
    );
};

const Header = ({ user, setIsSidebarOpen }: any) => (
  <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 p-4 md:p-6 sticky top-0 z-30">
    <div className="flex justify-between items-center">
        <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-600 mr-4">
                <Menu className="h-6 w-6" />
            </button>
            <div>
                <h2 className="text-xl md:text-3xl font-bold text-gray-900">
                    Bonjour, {user?.manager_name || 'PRO'} ! 👋
                </h2>
                <p className="text-gray-500 text-sm md:text-base mt-1 hidden sm:block">
                    {user?.account_type === 'FREELANCE' ? 'Tableau de bord Freelance' : 'Tableau de bord Agence'}
                </p>
            </div>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
            <div className="relative">
                <Bell className="h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"/>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">3</span>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2 rounded-full shadow-md">
                <User className="h-6 w-6 text-white"/>
            </div>
        </div>
    </div>
  </header>
);

// --- COMPOSANT PRINCIPAL ---
export default function ProDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<ProProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [navigationItems, setNavigationItems] = useState(baseNavItems);

  // --- Fetch des données utilisateur au chargement ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true); // <--- Mettre isLoading ici
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles_pro')
        .select('*') // <--- On prend tout pour les pages Profil, Service Card, etc.
        .eq('id', session.user.id)
        .single();
      
      if (error || !data) {
        console.error("Erreur critique: Profil PRO non trouvé pour l'utilisateur authentifié.", error);
        await supabase.auth.signOut();
        router.push('/');
        return;
      }

      setUserProfile(data as ProProfile);

      // Définir la navigation en fonction du type de compte
      if (data.account_type === 'AGENCY') {
          const agencyNav = [...baseNavItems];
          // Insérer 'Personnel' à la 3ème position (index 2)
          agencyNav.splice(2, 0, agencyNavItem);
          setNavigationItems(agencyNav);
      } else {
          setNavigationItems(baseNavItems);
      }

      setIsLoading(false);
    };

    fetchUserProfile();
  }, [router]);
  

  // --- Mettre à jour le profil (passé en props aux enfants) ---
  const updateUserProfile = async () => {
    if(!userProfile) return;
    const { data } = await supabase.from('profiles_pro').select('*').eq('id', userProfile.id).single();
    if (data) setUserProfile(data as ProProfile);
  };

  const renderContent = () => {
    if (!userProfile) return null; // ou un spinner
    
    switch(activeTab) {
        case 'overview': return <OverviewDashboard />;
        case 'inventory': return <InventoryPage />;
        case 'profile': return <ProfilePage profile={userProfile} onUpdate={updateUserProfile} />;
        case 'service-card': return <ServiceCardPage profile={userProfile} />;
        case 'settings': return <SettingsPage profile={userProfile} onUpdate={updateUserProfile} />;
        case 'staff': return userProfile.account_type === 'AGENCY' ? <PersonnelPage /> : null;
        default: return null;
    }
  };

  if (isLoading) {
    return (
     <div className="min-h-screen flex items-center justify-center bg-gray-50">
       <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
       <p className="ml-4 text-lg font-semibold text-gray-700">Chargement de votre espace...</p>
     </div>
   );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex text-gray-800">
      <Sidebar 
        navigationItems={navigationItems}
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />
      <div className="flex-1 flex flex-col lg:ml-72">
        <Header user={userProfile} setIsSidebarOpen={setIsSidebarOpen} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
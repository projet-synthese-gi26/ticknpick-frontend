'use client';

import React, { useState, useEffect, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

// --- Icônes (importations existantes et nouvelles)
import {
  Home, Package, User, LogOut, Menu, X, Users, Settings, Briefcase, Truck,
  ArrowRightLeft, DollarSign, Bell, Search, Sun, Moon
} from 'lucide-react';

// --- Import des composants pour chaque onglet ---
import OverviewDashboard from './Overview';
import ClientPackagesPage from './ClientPackages';
import DeliveryPage from './Deliveries';
import InventoryPage from './Inventaire';
import PersonnelPage from './Personnel';
import ProfilePage from './Profil';
import ServiceCardPage from './ServiceCard';
import SettingsPage from './Settings';
import TrackPackageMin from './TrackMin';

// Pour plus de clarté, unifions les cas (majuscules)
type AccountType = 'CLIENT' | 'LIVREUR' | 'FREELANCE' | 'AGENCY';

// L'interface UserProfile est maintenant unifiée et complète pour être compatible partout
export interface UserProfile {
  id: string;
  account_type: AccountType;
  manager_name: string | null;
  email?: string | null;
  name: string;
  role: string;
  
  // -- NOUVEAUX Champs de base ajoutés depuis Profil.tsx (optionnels) --
  created_at?: string;
  phone_number?: string | null;
  birth_date?: string | null;
  nationality?: string | null;
  home_address?: string | null;
  id_card_number?: string | null;
  
  // -- Champs PRO existants (optionnels) --
  identity_photo_url?: string | null;
  id_card_url?: string | null;
  tax_id?: string | null;
  professional_experience?: string | null;
  relay_point_name?: string | null;
  relay_point_address?: string | null;
  relay_point_gps?: string | null;
  opening_hours?: string | null;
  storage_capacity?: string | null;
  service_card_details?: any;
  business_name?: string;
  business_type?: string;

  // -- Champs LIVREUR existants (optionnels) --
  vehicle_type?: string | null;
  vehicle_brand?: string | null;
  vehicle_registration?: string | null;
  vehicle_color?: string | null;
  trunk_dimensions?: string | null;

  // -- Permet toute autre propriété non explicitement définie --
  [key: string]: any;
}

// Le profil PRO est un UserProfile mais avec un type de compte RESTREINT
export interface ProProfile extends UserProfile {
  account_type: 'FREELANCE' | 'AGENCY';
}

export interface RelayPointInfo {
  id: number;
  name: string;
  address: string;
  quartier: string;
}

export interface Shipment {
  id: number;
  tracking_number: string;
  status: 'EN_ATTENTE_DE_DEPOT' | 'AU_DEPART' | 'EN_TRANSIT' | 'ARRIVE_AU_RELAIS' | 'RECU' | 'ANNULE';
  sender_name: string;
  sender_phone?: string;
  sender_city?: string;
  sender_address?: string;
  recipient_name: string;
  recipient_phone?: string;
  recipient_city?: string;
  recipient_address?: string;
  shipping_cost: number;
  created_at: string;
  created_by_user: string;
  departure_point: RelayPointInfo | null;
  arrival_point: RelayPointInfo | null;
  description: string;
  weight: number;
  is_fragile: boolean;
  service_type?: string; // Type de service (Standard, Express, etc.)
}

// Helper function to normalize profile data
const normalizeProfile = (profile: any): UserProfile => {
  return {
    ...profile,
    name: profile.name || profile.manager_name || 'Utilisateur',
    role: profile.role || profile.account_type || 'user',
  };
};

// Type guard to check if a UserProfile is a ProProfile
const isProProfile = (profile: UserProfile): profile is ProProfile => {
  return profile.account_type === 'FREELANCE' || profile.account_type === 'AGENCY';
};

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

// --- Interfaces pour les props des composants ---
interface SidebarProps {
  navigationItems: NavItem[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  userProfile: UserProfile;
}

interface HeaderProps {
  user: UserProfile;
  setIsSidebarOpen: (open: boolean) => void;
  showTrackingModal: boolean;
  setShowTrackingModal: (show: boolean) => void;
}

// --- Composant Sidebar Moderne ---
const Sidebar: React.FC<SidebarProps> = ({ 
  navigationItems, 
  activeTab, 
  setActiveTab, 
  isSidebarOpen, 
  setIsSidebarOpen, 
  userProfile 
}) => {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const getAccountTypeColor = (type: string) => {
    switch(type.toLowerCase()) {
      case 'client': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'livreur': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'agence': return 'bg-gradient-to-r from-purple-500 to-violet-500';
      case 'freelance': return 'bg-gradient-to-r from-orange-500 to-amber-500';
      default: return 'bg-gradient-to-r from-orange-500 to-amber-500';
    }
  };

  return (
    <>
      {/* Overlay pour mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Fixed sur toute la hauteur */}
      <motion.aside 
        initial={{ x: '-100%' }} 
        animate={{ 
          x: isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024) ? 0 : '-100%' 
        }} 
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed top-0 left-0 z-50 w-72 h-screen bg-white/95 backdrop-blur-xl border-r border-orange-100 shadow-xl lg:shadow-2xl flex flex-col"
      >
        {/* Header Sidebar - Plus compact */}
        <div className="px-5 py-6 border-b border-orange-100/50 relative overflow-hidden flex-shrink-0">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 opacity-50" />
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-orange-200/30 rounded-full blur-2xl" />
          
          <div className="relative flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className={`${getAccountTypeColor(userProfile?.account_type || 'freelance')} p-3 rounded-xl shadow-md transform rotate-2 hover:rotate-0 transition-all duration-300`}>
                <Package className="h-6 w-6 text-white drop-shadow-sm"/>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <div className="flex items-center mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${getAccountTypeColor(userProfile?.account_type || 'freelance')} mr-2`} />
                  <p className="text-orange-600 text-xs font-medium capitalize tracking-wide">
                    {userProfile?.account_type.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="lg:hidden p-2 hover:bg-orange-100 rounded-lg transition-all duration-200 text-orange-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Navigation - Scrollable */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent">
          {navigationItems.map((item: NavItem, index: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() => { 
                  setActiveTab(item.id); 
                  setIsSidebarOpen(false); 
                }}
                className={`w-full group flex items-center justify-between px-3 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 hover:text-orange-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                    activeTab === item.id 
                      ? 'bg-white/20' 
                      : 'bg-orange-100/50 group-hover:bg-orange-200/50'
                  }`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {item.badge && (
                  <div className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </div>
                )}
              </button>
            </motion.div>
          ))}
        </nav>
        
        {/* Footer Sidebar - Plus compact */}
        <div className="px-4 py-4 border-t border-orange-100/50 bg-gradient-to-r from-orange-50/50 to-amber-50/50 flex-shrink-0">
          <div className="space-y-2">
            <button 
              onClick={() => router.push('/home')} 
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 group"
            >
              <Home className="h-4 w-4 group-hover:text-orange-600 transition-colors" />
              <span className="font-medium text-sm">Retour accueil</span>
            </button>
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 group"
            >
              <LogOut className="h-4 w-4 group-hover:text-red-600 transition-colors" />
              <span className="font-medium text-sm">Déconnexion</span>
            </button>
          </div>
          
          {/* User Info - Plus compact */}
          <div className="mt-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-orange-100/50">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {userProfile?.manager_name || 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userProfile?.email || 'email@example.com'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

// --- Header Moderne et Élégant ---
const Header: React.FC<HeaderProps> = ({ user, setIsSidebarOpen }) => {
  const [showTrackingModal, setShowTrackingModal] = useState<boolean>(false);

  return (
    <>
      <header className="fixed top-0 right-0 left-0 lg:left-72 bg-white border-b border-orange-100 z-30 h-20 shadow-sm">
        <div className="px-6 h-full">
          <div className="flex justify-between items-center h-full">
            {/* Left Section - Greeting & Menu */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="lg:hidden p-3 hover:bg-orange-50 rounded-xl transition-all duration-200 text-orange-500 border border-orange-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-4">

                {/* Greeting */}
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 flex items-center space-x-2">
                    <span>Bonjour,</span>
                    <span className="text-orange-600">{user?.manager_name || 'Utilisateur'}</span>
                    <span className="text-4xl">😊</span>
                  </h2>
                  <p className="text-gray-500 text-sm font-medium">
                    {new Date().toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-2">
              {/* Package Tracking Button */}
              <button 
                onClick={() => setShowTrackingModal(true)}
                className="relative bg-orange-50 border border-orange-200 hover:bg-orange-100 px-4 py-3 rounded-xl transition-all duration-200 group flex items-center space-x-2"
                title="Suivi de colis"
              >
                <Search className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-orange-700 font-medium text-sm hidden sm:block">Rechercher un colis</span>
              </button>

              {/* Profile Section */}
              <div className="flex items-center space-x-3 bg-transparent  px-4 py-2 rounded-xl">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold text-gray-900">{user?.manager_name || 'Utilisateur'}</p>
                  <p className="text-xs text-orange-600 font-medium capitalize">{user?.account_type.toLowerCase()}</p>
                </div>
                
                <div className="relative">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
                    <User className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-200"/>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de suivi de colis */}
      <AnimatePresence>
        {showTrackingModal && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowTrackingModal(false)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <TrackPackageMin
                onClose={() => setShowTrackingModal(false)}
                onOpenFullTracker={() => {
                  setShowTrackingModal(false);
                  window.open('/track-package', '_blank');
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Loading Component ---
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
    <div className="text-center">
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-spin" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-t-orange-600 rounded-full animate-spin" />
        <div className="absolute inset-2 w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
          <Package className="h-6 w-6 text-white animate-pulse" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Chargement de votre espace</h3>
      <p className="text-gray-600 text-sm">Préparation de votre dashboard personnalisé...</p>
      <div className="mt-4 flex justify-center space-x-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);

// --- COMPOSANT PRINCIPAL ---
const DashboardSwitcher: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showTrackingModal, setShowTrackingModal] = useState<boolean>(false);
  
  

  // --- Logique de récupération de l'utilisateur ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/');
          return;
        }

        let { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (!profile) {
          let { data: profilePro } = await supabase.from('profiles_pro').select('*').eq('id', session.user.id).single();
          if (!profilePro) {
            console.error("Aucun profil trouvé.");
            await supabase.auth.signOut();
            router.push('/');
            return;
          }
          profile = profilePro;
        }
        
        // Normaliser le profil pour s'assurer que toutes les propriétés requises sont présentes
        const normalizedProfile = normalizeProfile(profile);
        setUserProfile(normalizedProfile);

        
      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [router]);

  // --- Définition dynamique des onglets de navigation ---
  const navigationItems = useMemo((): NavItem[] => {
    if (!userProfile) return [];
    
    const accountType = userProfile.account_type?.toLowerCase();
    
    switch (accountType) {
      case 'client':
        return [
          { id: 'overview', label: "Vue d'ensemble", icon: Home },
          { id: 'packages', label: 'Mes Colis', icon: Package, badge: 3 },
          { id: 'profile', label: 'Mon Profil', icon: User },
          { id: 'settings', label: 'Paramètres', icon: Settings },
        ];
      case 'livreur':
        return [
          { id: 'overview', label: "Vue d'ensemble", icon: Home },
          { id: 'deliveries', label: 'Mes Livraisons', icon: Truck, badge: 7 },
          { id: 'profile', label: 'Mon Profil', icon: User },
          { id: 'settings', label: 'Paramètres', icon: Settings },
        ];
      case 'agence':
        return [
          { id: 'overview', label: "Vue d'ensemble", icon: Home },
          { id: 'inventory', label: 'Inventaire Agence', icon: Package },
          { id: 'staff', label: 'Personnel', icon: Users },
          { id: 'profile', label: 'Profil Agence', icon: Briefcase },
          { id: 'settings', label: 'Paramètres', icon: Settings },
        ];
      case 'freelance':
      default: // Freelance et fallback
        return [
          { id: 'overview', label: "Vue d'ensemble", icon: Home },
          { id: 'inventory', label: 'Inventaire', icon: Package },
          { id: 'profile', label: 'Profil Pro', icon: Briefcase },
          { id: 'service-card', label: 'Carte de Service', icon: User },
          { id: 'settings', label: 'Paramètres', icon: Settings },
        ];
    }
  }, [userProfile]);

  // S'assurer que l'onglet actif est valide
  useEffect(() => {
    if (navigationItems.length > 0 && !navigationItems.find(item => item.id === activeTab)) {
      setActiveTab('overview');
    }
  }, [navigationItems, activeTab]);

  // --- Fonction de mise à jour du profil ---
  const handleProfileUpdate = async () => {
    // Logic to re-fetch profile data
    if (userProfile) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          let { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (!profile) {
            let { data: profilePro } = await supabase.from('profiles_pro').select('*').eq('id', session.user.id).single();
            if (profilePro) {
              profile = profilePro;
            }
          }
          if (profile) {
            const normalizedProfile = normalizeProfile(profile);
            setUserProfile(normalizedProfile);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
      }
    }
  };

  // --- Rendu du contenu de l'onglet actif ---
  const renderContent = (): ReactNode => {
    if (!userProfile) return null;
    const accountType = userProfile.account_type.toLowerCase();
    
    switch(activeTab) {
      case 'overview': 
        return <OverviewDashboard profile={userProfile} />;
      case 'packages': 
        return accountType === 'client' ? <ClientPackagesPage profile={userProfile} /> : null;
      case 'deliveries': 
        return accountType === 'livreur' ? <DeliveryPage profile={userProfile} /> : null;
      case 'inventory': 
        return ['freelance', 'agence'].includes(accountType) ? <InventoryPage /> : null;
      case 'staff': 
        return accountType === 'agence' ? <PersonnelPage /> : null;
      case 'service-card':
        return isProProfile(userProfile) ? <ServiceCardPage profile={userProfile} /> : null;
      case 'profile': 
        return <ProfilePage profile={userProfile} onUpdate={handleProfileUpdate} />;
      case 'settings': 
        return <SettingsPage profile={userProfile} onUpdate={handleProfileUpdate} />;
      default: 
        return <OverviewDashboard profile={userProfile} />;
    }
  };

  if (isLoading || !userProfile) {
    return <LoadingScreen />;
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-orange-50/30 to-amber-50/30 min-h-screen">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} 
        />
      </div>

      {/* Sidebar fixe */}
      <Sidebar 
        navigationItems={navigationItems}
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
        userProfile={userProfile}
      />
      
      {/* Main Content Area */}
      <div className="lg:ml-72 min-h-screen flex flex-col">
        {/* Header fixe */}
        <Header user={userProfile} setIsSidebarOpen={setIsSidebarOpen} showTrackingModal={showTrackingModal} setShowTrackingModal={setShowTrackingModal} />
        
        {/* Main Content avec padding pour le header fixe */}
        <main className="flex-1 pt-16">
          <div className="p-4 md:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-7xl mx-auto"
            >
              {renderContent()}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardSwitcher;
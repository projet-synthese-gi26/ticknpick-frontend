'use client';

import React, { useState, useEffect, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// --- Icônes (importations existantes et nouvelles)
import {
  Home, Package, User, LogOut, Menu, X, Users, Settings, Briefcase, Truck,
  ArrowRightLeft, DollarSign, Bell, Search, Sun, Moon,
  CreditCard,
  HandCoins,
  MapPin,
  Send
} from 'lucide-react';

// --- Import des composants pour chaque onglet ---
import OverviewDashboard from './Overview';
import ClientPackagesPage from './ClientPackages';
import DeliveryPage from './Deliveries';
import InventoryPage from './Inventaire';
import PersonnelPage from './agence/Personnel';
import ProfilePage from './Profil';
import ServiceCardPage from './ServiceCard';
import SettingsPage from './Settings';
import TrackPackageMin from './TrackMin';
import FreelanceOverview from './FreelanceOverview'; 
import CreditPage from './Credit';
import LivreurOverview from './LivreurOverview';
import LivreurServiceCardPage from './LivreurServiceCard'; 
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/userservice';
import AgencyOverview from './agence/AgencyOverview'; // Nouvelle vue
import AgencyRelayPoints from './agence/AgencyRelayPoints'; // Nouvelle vue
import AgencyVehicles from './agence/AgencyVehicles'; // Nouvelle vue
import AgencyInventory from './agence/AgencyInventory';
import FindDelivery from './FindDelivery';

export type UIAccountType = 'CLIENT' | 'LIVREUR' | 'FREELANCE' | 'AGENCY' | 'ADMIN' | 'AGENCE_OWNER';

export interface UserProfile {
  id: string;
  account_type: UIAccountType; // Type unifié pour le frontend
  manager_name: string; 
  email: string;
  name: string; 
  role: string;
  
  // -- Champs Optionnels Unifiés --
  phone_number?: string | null;
  created_at?: string;
  home_address?: string | null;
  id_card_number?: string | null;
  
  // -- Champs Business --
  businessActorType?: 'FREELANCE' | 'AGENCY' | 'DELIVERER' | 'EMPLOYEE' | 'AGENCY_OWNER';
  businessName?: string;
  businessAddress?: string;
  businessLocality?: string;
  credit_balance?: number;  // Peut venir de l'API utilisateur

  // -- Champs PRO/Relais --
  identity_photo_url?: string | null;
  relay_point_name?: string | null;
  relay_point_address?: string | null;
  
  // -- Champs LIVREUR --
  vehicle_type?: string | null;
  vehicle_brand?: string | null;
  vehicle_registration?: string | null;

  [key: string]: any; // Permet d'autres champs API bruts
}

export interface ProProfile extends UserProfile {
  account_type: 'LIVREUR' | 'FREELANCE' | 'AGENCY';
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

// === FONCTION CRUCIALE : NORMALISATION DES DONNÉES ===
const normalizeProfile = (apiData: any): UserProfile => {
  console.log(">>> [Dashboard] Raw API Data:", apiData);

  // 1. STRATÉGIE DE FUSION : 
  // On prend apiData comme base. Si une propriété 'user' existe (cas /users/me), 
  // on fusionne son contenu par-dessus la racine, mais on GARDE les champs racine existants 
  // (comme businessActorType qui est souvent à la racine et pas dans 'user').
  const baseData = apiData || {};
  const nestedUser = apiData.user || {};
  
  // L'ordre est important : nestedUser écrase baseData pour les infos perso (nom, email...), 
  // MAIS on force la ré-application des champs critiques de la racine s'ils manquent dans nestedUser.
  const flatUser = {
      ...baseData,       // 1. Données racine (contient token, userId, businessActorType)
      ...nestedUser,     // 2. Données user (contient id, name, email)
  };

  // Restauration explicite des champs critiques s'ils ont été écrasés par 'undefined'
  if (!flatUser.businessActorType && baseData.businessActorType) {
      flatUser.businessActorType = baseData.businessActorType;
  }
  if (!flatUser.accountType && baseData.accountType) {
      flatUser.accountType = baseData.accountType;
  }
  
  // 3. EXTRACTION ROBUSTE DES CHAMPS (CamelCase ET SnakeCase)
  const rawType = flatUser.accountType || flatUser.account_type || 'CLIENT';
  const rawSubType = flatUser.businessActorType || flatUser.business_actor_type || '';
    // RECUPERATION DU RELAY POINT ID
  const linkedRelayId = flatUser.relayPointId || flatUser.relay_point_id || flatUser.assigned_relay_point_id;
  // Nettoyage pour comparaison
  const typeUpper = String(rawType).toUpperCase().trim();
  const subTypeUpper = String(rawSubType).toUpperCase().trim();

  // Nom d'affichage
  const displayName = flatUser.name || flatUser.businessName || flatUser.business_name || flatUser.email;
  
  // ID : Gérer 'id' (de l'objet user) et 'userId' (de la réponse login)
  const realId = flatUser.id || flatUser.userId;

  console.log(`>>> [Dashboard] Analyzed: Type=[${typeUpper}] SubType=[${subTypeUpper}] ID=[${realId}]`);

  // 4. LOGIQUE D'ATTRIBUTION DU RÔLE UI
  let finalAccountType: UIAccountType = 'CLIENT';

  // SCÉNARIO CLÉ : C'est un EMPLOYÉ connecté avec un RELAIS ID
  if (subTypeUpper === 'EMPLOYEE' && linkedRelayId) {
      console.log(`⚡ Employé avec Point Relais assigné détecté (ID: ${linkedRelayId})`);
      finalAccountType = 'FREELANCE'; // On utilise la vue 'FreelanceOverview' qui gère l'inventaire
  } 

  if (typeUpper === 'ADMIN' || typeUpper === 'SUPERADMIN') {
      finalAccountType = 'ADMIN';
  } 
  else if (typeUpper.includes('BUSINESS')) {
      // Détection spécifique pour AGENCY_OWNER
      if (subTypeUpper === 'AGENCY_OWNER' || subTypeUpper === 'AGENCY') {
          finalAccountType = 'AGENCY';
      } 
      else if (subTypeUpper === 'DELIVERER' || subTypeUpper === 'LIVREUR') {
          finalAccountType = 'LIVREUR';
      } 
      else if (subTypeUpper === 'RELAY_OWNER') {
          finalAccountType = 'FREELANCE';
      }
      else if (subTypeUpper === 'EMPLOYEE') {
          // Un employé d'agence doit voir la vue Agence (souvent)
          finalAccountType = 'FREELANCE'; 
      } 
      else {
          console.warn(`⚠️ Business Type inconnu: ${subTypeUpper}, fallback sur LIVREUR`);
          finalAccountType = 'LIVREUR'; // Choix par défaut pour les business non identifiés
      }
  }

  console.log(`>>> [Dashboard] Rôle détecté : ${finalAccountType}`);

  // 5. OBJET FINAL NORMALISÉ
  return {
    ...flatUser,        // Conserve toutes les props brutes
    id: realId,
    account_type: finalAccountType, // La clé standardisée pour l'UI switch
    relayPointId: linkedRelayId, 
    assigned_relay_point_id: linkedRelayId, 
    role: finalAccountType,         // Redondance utile
    email: flatUser.email,
    manager_name: displayName,
    name: displayName,
    // On conserve le type business original pour référence
    businessActorType: rawSubType,
    phone_number: flatUser.phone_number || flatUser.phoneNumber,
    home_address: flatUser.home_address || flatUser.homeAddress,
    businessName: flatUser.business_name || flatUser.businessName,
    businessAddress: flatUser.business_address || flatUser.businessAddress
  };
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

// ==========================================================================
// COMPOSANT SIDEBAR : Gestion Hybride (Sidebar Gauche Desktop / Bottom Nav Mobile)
// ==========================================================================
const Sidebar: React.FC<SidebarProps> = ({ 
  navigationItems, 
  activeTab, 
  setActiveTab, 
  userProfile 
}: any) => {
  const router = useRouter();

  const handleLogout = async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getAccountTypeColor = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'client': return 'bg-gradient-to-r from-orange-500 to-amber-500';
      case 'livreur': return 'bg-gradient-to-r from-purple-800 to-violet-800';
      case 'agency': return 'bg-gradient-to-r from-blue-800 to-sky-800';
      case 'freelance': return 'bg-gradient-to-r from-red-500 to-red-500';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500';
    }
  };

  return (
    <>
      {/* --- VERSION DESKTOP (Sidebar Verticale à Gauche) --- */}
      {/* hidden sur mobile/tablette (< 1024px), block sur large (> 1024px) */}
      <aside className="hidden lg:flex fixed top-0 left-0 z-50 w-72 h-screen bg-white/95 dark:bg-gray-900 backdrop-blur-xl border-r border-orange-100 dark:border-gray-800 shadow-xl flex-col">
        {/* Header Sidebar Desktop */}
        <div className="px-5 py-6 border-b border-orange-100/50 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`${getAccountTypeColor(userProfile?.account_type || 'freelance')} p-3 rounded-xl shadow-md`}>
              <Package className="h-6 w-6 text-white drop-shadow-sm"/>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent dark:text-white">
                Dashboard
              </h1>
              <div className="flex items-center mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${getAccountTypeColor(userProfile?.account_type || 'freelance')} mr-2`} />
                <p className="text-orange-600 dark:text-orange-400 text-xs font-medium capitalize tracking-wide">
                  {userProfile?.account_type?.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Desktop */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navigationItems.map((item: NavItem) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full group flex items-center justify-between px-3 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-gray-800 hover:text-orange-700 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={`h-5 w-5 ${activeTab === item.id ? 'text-white' : 'text-current'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {item.badge && (
                <div className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge}
                </div>
              )}
            </button>
          ))}
        </nav>
        
        {/* Footer Sidebar Desktop */}
        <div className="px-4 py-4 border-t border-orange-100/50 dark:border-gray-800 bg-orange-50/30 dark:bg-gray-800/30 flex-shrink-0 space-y-2">
          <button 
            onClick={() => router.push('/home')} 
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all group"
          >
            <Home className="h-4 w-4 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" />
            <span className="font-medium text-sm">Retour accueil</span>
          </button>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all group"
          >
            <LogOut className="h-4 w-4 group-hover:text-red-600 transition-colors" />
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* --- VERSION MOBILE (Bottom Navigation Bar) --- */}
      {/* block sur mobile/tablette (< 1024px), hidden sur large (> 1024px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-gray-900 border-t border-orange-100 dark:border-gray-800 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-16 px-2">
          {navigationItems.slice(0, 5).map((item: NavItem) => ( // Limite à 5 items max pour la barre
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 relative ${
                 activeTab === item.id ? 'text-orange-600 dark:text-orange-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {/* Indicateur Actif Mobile */}
              {activeTab === item.id && (
                <motion.div layoutId="mobile-nav-active" className="absolute -top-0.5 h-1 w-10 bg-orange-500 rounded-b-lg shadow-[0_2px_10px_rgba(249,115,22,0.4)]" />
              )}

              <div className="relative">
                  <item.icon className={`h-6 w-6 transition-transform ${activeTab === item.id ? 'scale-110' : ''}`} />
                  {item.badge && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1 rounded-full min-w-[14px] h-4 flex items-center justify-center border border-white dark:border-gray-900">
                        {item.badge}
                    </div>
                  )}
              </div>
              <span className="text-[10px] font-medium truncate max-w-[64px] leading-none">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

// --- Header ---
const Header: React.FC<HeaderProps> = ({ user, setIsSidebarOpen }: any) => {
  const [showTrackingModal, setShowTrackingModal] = useState<boolean>(false);

  return (
    <>
      <header className="fixed top-0 right-0 left-0 lg:left-72 bg-white/95 dark:bg-gray-900/95 border-b border-orange-100 dark:border-gray-800 z-30 h-20 shadow-sm backdrop-blur-md">
        <div className="px-6 h-full">
          <div className="flex justify-between items-center h-full">
            {/* Left Section - Greeting & Menu */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="lg:hidden p-3 hover:bg-orange-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 text-orange-500 border border-orange-100 dark:border-gray-700"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-4">
                {/* Greeting */}
                <div className="hidden sm:block">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                    <span>Bonjour,</span>
                    <span className="text-orange-600 dark:text-orange-500">{user?.manager_name?.split(' ')[0] || 'Utilisateur'}</span>
                    <span className="text-2xl">👋</span>
                  </h2>
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowTrackingModal(true)}
                className="hidden md:flex relative bg-orange-50 dark:bg-gray-800 border border-orange-200 dark:border-gray-700 hover:bg-orange-100 dark:hover:bg-gray-700 px-4 py-2.5 rounded-xl transition-all duration-200 group items-center space-x-2"
                title="Suivi de colis"
              >
                <Search className="h-5 w-5 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-orange-700 dark:text-orange-400 font-medium text-sm">Rechercher</span>
              </button>

              <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-transparent hover:border-orange-200 dark:hover:border-gray-600 transition-all">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.manager_name || 'Utilisateur'}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium capitalize">{user?.account_type?.toLowerCase()}</p>
                </div>
                
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group">
                    <User className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-200"/>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowTrackingModal(false)}
            />
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
                  // Ouvrir la page complete
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
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
    <div className="text-center">
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-spin" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-t-orange-600 rounded-full animate-spin" />
        <div className="absolute inset-2 w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
          <Package className="h-6 w-6 text-white animate-pulse" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-300 mb-2">Chargement de votre espace</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">Préparation de votre dashboard personnalisé...</p>
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
  const { isAuthenticated, isLoading: isAuthLoading, logout, user: authUser } = useAuth();
  const [selectedRelayForInventory, setSelectedRelayForInventory] = useState<string|null>(null);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated || !authUser) {
        console.log("Non authentifié, redirection login.");
        router.push('/login');
        return;
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        console.log(`🔍 Session valide pour l'utilisateur ID: ${authUser.id}`);
        
        // 1. Vérifier d'abord si authUser contient déjà toutes les infos nécessaires (cas du login)
        if (authUser.accountType && authUser.name) {
            console.log('✅ Utilisation des données de session (login)');
            const profile = normalizeProfile(authUser);
            
            if (profile.account_type === 'ADMIN') {
                router.push('/superadmin');
                return;
            }

            setUserProfile(profile);
            setIsLoading(false);
            return;
        }
        
        // 2. Sinon, appel API pour récupérer les infos
        console.log(`Chargement profil pour ID: ${authUser.id} via /api/users/{id}...`);
        const apiProfile = await userService.getProfileById(authUser.id);
        
        if (!apiProfile) {
            throw new Error("Profil vide reçu de l'API");
        }

        const profile = normalizeProfile(apiProfile);
        setUserProfile(profile);

        if (profile.account_type === 'ADMIN') {
            router.push('/superadmin');
        }

      } catch (error: any) {
        console.error("💥 Erreur Dashboard:", error);
        // Si l'erreur est critique (ex: token invalide), on déconnecte
        if (error.message?.includes('401') || error.message?.includes('403')) {
             logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthLoading, isAuthenticated, authUser, router, logout]);

  // --- Définition dynamique des onglets de navigation ---
  const navigationItems = useMemo((): NavItem[] => {
    if (!userProfile) return [];
    
    const accountType = userProfile.account_type?.toLowerCase();
    const type = userProfile.account_type;
    
    switch (accountType) {
      case 'client':
        return [
          { id: 'overview', label: "Vue d'ensemble", icon: Home },
          { id: 'packages', label: 'Mes Colis', icon: Package },
          { id: 'profile', label: 'Mon Profil', icon: User },
          { id: 'settings', label: 'Paramètres', icon: Settings },
        ];
      case 'livreur':
        return [
          { id: 'overview', label: "Vue d'ensemble", icon: Home },
          { id: 'deliveries', label: 'Mes Livraisons', icon: Send, badge: 7 },
          { id: 'credit', label: 'Compte de Crédit', icon: HandCoins },
          { id: 'service-card', label: 'Carte de Service', icon: User },
          { id: 'profile', label: 'Mon Profil', icon: User },
          { id: 'settings', label: 'Paramètres', icon: Settings },
        ];
      case 'agency':
        return [
          { id: 'overview', label: "Vue d'ensemble", icon: Home },
          { id: 'my-relays', label: 'Mes Points Relais', icon: MapPin }, // NOUVEAU
          { id: 'my-vehicles', label: 'Mes Véhicules', icon: Truck },   // NOUVEAU
          { id: 'inventory', label: 'Inventaire Agence', icon: Package },
          { id: 'deliveries', label: 'Mes Livraisons', icon: Send, badge: 7 },
          { id: 'staff', label: 'Personnel', icon: Users },
          { id: 'profile', label: 'Mon Profil', icon: User },
          { id: 'service-card', label: 'Carte de Service', icon: Briefcase },
          { id: 'settings', label: 'Paramètres', icon: Settings },
        ];
      case 'freelance':
      default: // Freelance et fallback
        return [
          { id: 'overview', label: "Vue d'ensemble", icon: Home },
          { id: 'inventory', label: 'Inventaire', icon: Package },
          { id: 'credit', label: 'Compte de Crédit', icon: HandCoins },
          { id: 'profile', label: 'Profil Pro', icon: Briefcase },
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

  // --- NOUVELLE FONCTION de mise à jour (pour l'onglet Profil) ---
  const handleProfileUpdate = async () => {
    // Fonction simple pour recharger les données après une modif dans l'onglet Profil
    try {
        const apiProfile = await userService.getProfileById(authUser.id);
        setUserProfile(normalizeProfile(apiProfile));
    } catch (e) { console.error(e); }
  };

  // --- Rendu du contenu de l'onglet actif ---
  const renderContent = (): ReactNode => {
    if (!userProfile) return null;
    const accountType = userProfile.account_type.toLowerCase();
    
    switch(activeTab) {
      // --- AJOUT 2: LOGIQUE DE ROUTAGE SPÉCIFIQUE ---
      case 'overview':
        // Si l'utilisateur est un freelance, afficher la nouvelle vue
        if (userProfile.account_type === 'FREELANCE') {
          return <FreelanceOverview profile={userProfile} setActiveTab={setActiveTab} />;
        }
        // Ajout condition Agence
        if (userProfile.account_type === 'AGENCY') return <AgencyOverview profile={userProfile} setActiveTab={setActiveTab}/>;

        if (userProfile.account_type === 'LIVREUR') {
          return <LivreurOverview profile={userProfile} setActiveTab={setActiveTab} />;
        }
        // Sinon, afficher la vue générique pour les autres
        return <OverviewDashboard profile={userProfile} />;

      case 'packages': 
        return accountType === 'client' ? <ClientPackagesPage profile={userProfile} /> : null;
      case 'deliveries': 
        return accountType === 'livreur' ? <DeliveryPage profile={userProfile as any} /> : null;
      case 'inventory': 
      if (accountType === 'agency') {
        return <AgencyInventory profile={userProfile} />;
    }
        return ['freelance', 'agency'].includes(accountType) ?  <InventoryPage profile={userProfile} /> : null;
      case 'staff': 
        return accountType === 'agency' ? <PersonnelPage /> : null;
      case 'service-card':
        if (userProfile.account_type === 'LIVREUR') {
          return <LivreurServiceCardPage profile={userProfile} />;
        }
        return (userProfile.account_type === 'FREELANCE' || userProfile.account_type === 'AGENCY')
          ? <ServiceCardPage profile={userProfile as ProProfile} />
          : null;

      case 'my-relays':
              return (
         <AgencyRelayPoints 
            profile={userProfile}
            onNavigateToInventory={(id) => {
               setSelectedRelayForInventory(id); // Set l'ID
               setActiveTab('inventory');        // Change l'onglet
            }}
         />
      );

      case 'my-vehicles':
        return <AgencyVehicles profile={userProfile} />;

      case 'credit':
      return ['freelance', 'agency', 'livreur'].includes(accountType) 
        ? <CreditPage profile={userProfile as any} onUpdate={handleProfileUpdate} /> 
        : null;

      case 'profile': 
        return <ProfilePage profile={userProfile as any} onUpdate={handleProfileUpdate} />;
      case 'settings': return <SettingsPage profile={userProfile} onUpdate={handleProfileUpdate} />;
      default: return <OverviewDashboard profile={userProfile} />;
    }
  };

  if (isLoading || !userProfile) {
    return <LoadingScreen />;
  }
  if (!userProfile) return null;

  return (
    <div className="bg-white dark:bg-gray-800 min-h-screen">
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
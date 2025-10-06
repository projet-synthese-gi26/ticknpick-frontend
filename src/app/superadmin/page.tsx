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
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';

// --- Type pour le profil, réutilisable ---
interface SuperAdminProfile {
  name: string;
  email: string;
  avatarUrl: string;
}

// --- Importations dynamiques pour les composants lourds ---
const Overview = dynamic(() => import('./Overview'), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

const FinanceManagement = dynamic(() => import('./FinanceManagement'), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

const OperationsManagement = dynamic(() => import('./OperationManagement'), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

// Je crée un UserManagement placeholder pour l'exemple
const UserManagement = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold">Gestion des Utilisateurs</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Le composant de gestion des utilisateurs sera affiché ici.</p>
    </div>
);


// --- Composant de chargement réutilisable ---
const LoadingSpinner = () => (
  <div className="flex h-64 w-full items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow-lg">
    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
  </div>
);

// --- Définition des onglets pour éviter la répétition ---
const TABS = {
  overview: { label: 'Vue d\'ensemble', icon: LayoutDashboard },
  users: { label: 'Utilisateurs', icon: Users },
  operations: { label: 'Opérations', icon: Map },
  finance: { label: 'Finances', icon: CircleDollarSign },
};
type TabId = keyof typeof TABS;


// =================================================================
// SIDEBAR COMPONENT
// =================================================================
const Sidebar = ({
  activeTab,
  setActiveTab,
  profile,
  isOpen,
  setIsOpen,
}: {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  profile: SuperAdminProfile;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const router = useRouter();

  const handleLogout = async () => {
    // Logique de déconnexion ici (ex: await supabase.auth.signOut())
    console.log('Déconnexion...');
    router.push('/login');
  };
  
  const NavLink = ({ tabId, children }: { tabId: TabId; children: React.ReactNode }) => {
    const isActive = activeTab === tabId;
    return (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ease-in-out ${
            isActive
                ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
            {children}
        </button>
    );
  };

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        ></div>
      )}
    
      <aside
        className={`fixed top-0 left-0 h-full z-40 w-64 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xl font-bold text-orange-500">PicknDrop</span>
             <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-800 dark:hover:text-white">
                <X size={20}/>
             </button>
        </div>

        <div className="p-4 flex items-center space-x-3 border-b border-gray-200 dark:border-gray-700">
          <img
            src={profile.avatarUrl}
            alt="Avatar"
            className="w-12 h-12 rounded-full border-2 border-orange-500"
          />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{profile.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{profile.email}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {Object.entries(TABS).map(([key, { label, icon: Icon }]) => (
             <NavLink key={key} tabId={key as TabId}>
                <Icon className="w-5 h-5" />
                <span>{label}</span>
             </NavLink>
          ))}
        </nav>
        
        <div className="p-4 mt-auto border-t border-gray-200 dark:border-gray-700">
            <button 
             onClick={handleLogout}
             className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200">
                <LogOut className="w-5 h-5"/>
                <span>Déconnexion</span>
            </button>
        </div>
      </aside>
    </>
  );
};


// =================================================================
// PAGE HEADER COMPONENT
// =================================================================
const PageHeader = ({ title, icon: Icon, onMenuClick }: { title: string; icon: React.ElementType, onMenuClick: () => void; }) => {
  return (
    <div className="flex items-center justify-between mb-8">
       <div className="flex items-center space-x-3">
         <Icon className="w-8 h-8 text-orange-500" />
         <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
           {title}
         </h1>
       </div>
       <button onClick={onMenuClick} className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
           <Menu size={24}/>
       </button>
    </div>
  );
}


// =================================================================
// MAIN DASHBOARD PAGE
// =================================================================
export default function SuperAdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<SuperAdminProfile | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Simuler un appel API pour récupérer le profil
    setTimeout(() => {
        setProfile({
            name: 'Super Admin',
            email: 'admin@pickndrop.com',
            avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${Math.random()}`
        });
        setIsLoading(false);
    }, 500);
  }, []);
  
  // Fonction pour afficher le contenu en fonction de l'onglet actif
  const renderContent = () => {
    const components: Record<TabId, React.ReactNode> = {
      overview: <Overview />,
      users: <UserManagement />,
      operations: <OperationsManagement />,
      finance: <FinanceManagement />,
    };
    return components[activeTab] || <Overview />;
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8">
        <PageHeader 
          title={TABS[activeTab].label}
          icon={TABS[activeTab].icon}
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        {/* AnimatePresence gère les animations d'entrée/sortie */}
        <AnimatePresence mode="wait">
           <motion.div
             key={activeTab} // La clé est essentielle pour qu'AnimatePresence détecte le changement
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
             transition={{ duration: 0.3 }}
           >
             {renderContent()}
           </motion.div>
        </AnimatePresence>

      </main>
    </div>
  );
}
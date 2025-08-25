'use client';

import { useState, useMemo, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Icônes de Lucide React - Ajout de 'Menu' pour la navigation mobile
import {
  Home, Package, BarChart3, Users, Truck, CheckSquare, LogOut, Bell, User,
  TrendingUp, TrendingDown, Archive, Clock, AlertTriangle, CheckCircle,
  Inbox, Plus, Search, Filter, MoreHorizontal, Eye, Edit, Phone, Calendar,
  MapPin, Settings, Menu, X, // Ajout de Menu et X
} from 'lucide-react';

// Chart.js (inchangé)
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, ArcElement, BarElement,
} from 'chart.js';

// Importez vos pages (assurez-vous que les chemins sont corrects)
import InventoryPage from './Inventaire';
import PersonnelPage from './Personnel';
import RelayPointServiceCard from './ServiceCard';


ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement
);

//==============================================================================
// INTERFACES ET DONNÉES DE SIMULATION (Inchangé)
//==============================================================================

interface KpiCardProps {
title: string;
value: string;
icon: ReactNode;
change?: string;
changeType?: 'increase' | 'decrease';
color: string;
}
interface Parcel {
id: string;
status: 'En attente' | 'Reçu' | 'Retiré';
arrivalDate: string;
withdrawalDate?: string;
location: string;
sender: string;
recipient: string;
phone: string;
}
interface Task {
id: number;
description: string;
priority: 'Haute' | 'Moyenne' | 'Basse';
completed: boolean;
}
interface TeamMember {
id: number;
name: string;
role: string;
parcelsProcessed: number;
status: 'En ligne' | 'Hors ligne';
avatar?: string;
}

interface LoggedInUser {
  full_name: string | null;
  email: string | null;
  // Ajoutez d'autres champs de la table 'profiles' si nécessaire
}

// Pour les données brutes de la table Shipment
interface Shipment {
  id: number;
  status: 'EN_ATTENTE_DE_DEPOT' | 'AU_DEPART' | 'EN_TRANSIT' | 'ARRIVE_AU_RELAIS' | 'RECU' | 'ANNULE';
  shippingCost: number;
  created_at: string;
  updated_at: string;
}

// Pour les KPIs calculés
interface KpiValues {
  pending: number;
  received: number; // Au point relais de destination
  withdrawn: number;
  todayRevenue: number;
}



//==============================================================================
// NAVIGATION
//==============================================================================

const navigationItems = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: Home },
  { id: 'inventory', label: 'Suivi de Colis', icon: Package },
  { id: 'staff', label: 'Personnel', icon: Users },
  { id: 'settings', label: 'Paramètres', icon: Settings }
];


//==============================================================================
// COMPOSANTS UI - MIS À JOUR POUR LE RESPONSIVE
//==============================================================================

// Sidebar maintenant gère l'état ouvert/fermé pour mobile
const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  isSidebarOpen, 
  setIsSidebarOpen 
}: { 
  activeTab: string; 
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}) => (
  <>
    {/* ===== Sidebar pour grands écrans (LG et plus) - Fixe ===== */}
    <div className="hidden lg:flex w-72 bg-white border-r border-gray-200 flex-col fixed h-full shadow-sm">
      <SidebarContent activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>

    {/* ===== Drawer pour mobile (en dessous de LG) - Superposé ===== */}
    {isSidebarOpen && (
      <div className="lg:hidden fixed inset-0 z-40">
        {/* Overlay en arrière-plan */}
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)}></div>
        
        {/* Contenu de la sidebar */}
        <div className="relative z-50 w-72 h-full bg-white shadow-xl">
          <SidebarContent 
            activeTab={activeTab} 
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setIsSidebarOpen(false); // Ferme la sidebar après un clic
            }} 
            showCloseButton={true}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        </div>
      </div>
    )}
  </>
);

// Contenu de la sidebar, extrait pour être réutilisable
const SidebarContent = ({ 
  activeTab, 
  setActiveTab, 
  showCloseButton = false,
  setIsSidebarOpen 
}: { 
  activeTab: string; 
  setActiveTab: (tab: string) => void; 
  showCloseButton?: boolean;
  setIsSidebarOpen?: (isOpen: boolean) => void;
}) => {
  const router = useRouter(); // <-- AJOUTER

  const handleLogout = async () => {
    // ---- Modification ici pour Supabase ----
    await supabase.auth.signOut();
    // Plus besoin de localStorage, Supabase gère la session
    router.push('/');
  };
  
  return (
  <div className="flex flex-col h-full">
    <div className="px-6 py-6 border-b border-gray-200 flex justify-between items-center">
      <div className="flex items-center">
        <div className="bg-green-600 p-3 rounded-xl mr-3">
          <Package className="h-8 w-8 text-white"/>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">PicknDrop</h1>
          <p className="text-gray-500 text-sm">Yaoundé Centre</p>
        </div>
      </div>
      {showCloseButton && (
        <button onClick={() => setIsSidebarOpen && setIsSidebarOpen(false)} className="text-gray-500 hover:text-gray-800">
          <X className="h-6 w-6" />
        </button>
      )}
    </div>
    
    <nav className="mt-6 flex-1 px-4">
      <ul className="space-y-2">
        {navigationItems.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
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
      <button 
        onClick={handleLogout} 
        className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
      >
        <LogOut className="h-5 w-5" />
        <span>Déconnexion</span>
      </button>
    </div>
  </div>
  );
};



// Il doit maintenant récupérer les infos utilisateur et les passer en props.
const Header = ({ user, setIsSidebarOpen }: { user: LoggedInUser | null; setIsSidebarOpen: (isOpen: boolean) => void }) => (
  <header className="bg-white shadow-sm border-b border-gray-200 p-4 md:p-6 sticky top-0 z-20">
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-600 mr-4">
          <Menu className="h-6 w-6" />
        </button>
        <div>
          {/* ---- Modification ici ---- */}
          <h2 className="text-xl md:text-3xl font-bold text-gray-900">
            Bonjour, {user?.full_name || 'Proprio'} ! 😄
          </h2>
          <p className="text-gray-500 text-sm md:text-base mt-1 hidden sm:block">
            {user?.email || 'Aperçu de votre point relais'}
          </p>
          {/* ---- Fin de la modification ---- */}
        </div>
      </div>
      {/* Le reste du header est inchangé */}
      <div className="flex items-center space-x-2 md:space-x-4">
        <Link href='/emit-package' className="bg-green-600 hover:bg-green-700 text-white p-3 md:px-6 md:py-3 rounded-full md:rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span className="hidden md:inline">Nouveau Colis</span>
        </Link>
        <div className="relative">
          <Bell className="h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"/>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
        </div>
        <div className="bg-green-600 p-2 rounded-full">
          <User className="h-6 w-6 text-white"/>
        </div>
      </div>
    </div>
  </header>
);

// NOUVEAU COMPOSANT: Barre de navigation inférieure pour mobile
const BottomNavBar = ({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void; }) => {
    const bottomNavItems = [
        { id: 'overview', label: "Accueil", icon: Home },
        { id: 'inventory', label: "Colis", icon: Package },
        { id: 'tasks', label: "Tâches", icon: CheckSquare },
        { id: 'staff', label: "Équipe", icon: Users },
    ];

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-t-md z-30">
            <div className="flex justify-around items-center h-16">
                {bottomNavItems.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors duration-200 ${
                            activeTab === item.id ? 'text-green-600' : 'text-gray-500 hover:text-green-500'
                        }`}
                    >
                        <item.icon className="h-6 w-6"/>
                        <span className="text-xs font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const kpiData: KpiCardProps[] = [
{
title: 'Colis en Attente',
value: '127',
icon: <Clock className="h-6 w-6" />,
change: '+12',
changeType: 'increase',
color: 'bg-amber-500'
},
{
title: 'Colis Reçus',
value: '1,350',
icon: <Archive className="h-6 w-6" />,
change: '+8%',
changeType: 'increase',
color: 'bg-green-600'
},
{
title: 'Colis Retirés',
value: '1,223',
icon: <CheckCircle className="h-6 w-6" />,
change: '+15%',
changeType: 'increase',
color: 'bg-green-700'
},
{
title: 'Taux de Retrait',
value: '91.2%',
icon: <TrendingUp className="h-6 w-6" />,
change: '+2.3%',
changeType: 'increase',
color: 'bg-green-800'
},
{
title: 'Revenus du Jour',
value: '45,700 FCFA',
icon: <BarChart3 className="h-6 w-6" />,
change: '+5.2%',
changeType: 'increase',
color: 'bg-emerald-600'
},
];
const tasks: Task[] = [
{ id: 1, description: 'Contacter Ndongo Jean Pierre pour retrait colis PKD-85743', priority: 'Haute', completed: false },
{ id: 2, description: 'Réceptionner nouveau lot de colis Jumia', priority: 'Haute', completed: false },
{ id: 3, description: 'Ranger les colis dans la zone C04', priority: 'Moyenne', completed: true },
{ id: 4, description: 'Mettre à jour linventaire mensuel', priority: 'Basse', completed: false },
{ id: 5, description: 'Vérifier les colis en attente depuis plus de 7 jours', priority: 'Moyenne', completed: false },
{ id: 6, description: 'Organiser lespace de stockage section B', priority: 'Basse', completed: true },
];
const teamMembers: TeamMember[] = [
{ id: 1, name: 'Nkomo Adrien', role: 'Manutentionnaire', parcelsProcessed: 156, status: 'En ligne' },
{ id: 2, name: 'Owona Béatrice', role: 'Responsable Stock', parcelsProcessed: 89, status: 'En ligne' },
{ id: 3, name: 'Essono Cédric', role: 'Manutentionnaire', parcelsProcessed: 134, status: 'Hors ligne' },
{ id: 4, name: 'Bella Diane', role: 'Accueil Client', parcelsProcessed: 67, status: 'En ligne' },
{ id: 5, name: 'Manga Joseph', role: 'Superviseur', parcelsProcessed: 245, status: 'En ligne' },
];


// Le reste des composants est généralement bon, il suffit de s'assurer
// que les grilles sont bien définies pour le responsive.
// Exemple pour KpiCard, le reste est inchangé.
const KpiCard = ({ title, value, icon, change, changeType, color }: KpiCardProps) => (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
                {change && (
                    <div className={`flex items-center mt-2 text-xs md:text-sm font-semibold ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                        {changeType === 'increase' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                        <span>{change}</span>
                    </div>
                )}
            </div>
            <div className={`${color} p-3 md:p-4 rounded-2xl text-white ml-2`}>
                {icon}
            </div>
        </div>
    </div>
);

const VolumeChart = () => {
const data = {
labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
datasets: [
{
label: 'Colis Reçus',
data: [45, 38, 52, 61, 43, 35, 28],
fill: true,
backgroundColor: 'rgba(34, 197, 94, 0.1)',
borderColor: '#22C55E',
tension: 0.4,
pointBackgroundColor: '#22C55E',
pointRadius: 6,
pointHoverRadius: 8,
borderWidth: 3,
},
{
label: 'Colis Retirés',
data: [35, 42, 48, 55, 41, 32, 25],
fill: true,
backgroundColor: 'rgba(21, 128, 61, 0.1)',
borderColor: '#15803D',
tension: 0.4,
pointBackgroundColor: '#15803D',
pointRadius: 6,
pointHoverRadius: 8,
borderWidth: 3,
},
],
};
const options = {
responsive: true,
plugins: {
legend: {
display: true,
position: 'top' as const,
labels: {
usePointStyle: true,
padding: 20,
font: {
size: 14
}
}
},
},
scales: {
y: {
beginAtZero: true,
grid: {
color: '#f3f4f6'
},
ticks: {
font: {
size: 12
}
}
},
x: {
grid: {
display: false
},
ticks: {
font: {
size: 12
}
}
}
},
};
return (
<div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
<h3 className="font-bold text-xl mb-6 text-gray-900">Évolution Hebdomadaire</h3>
<Line data={data} options={options} />
</div>
);
};

const StatusDistribution = () => {
const data = {
labels: ['En attente', 'Reçu', 'Retiré'],
datasets: [
{
data: [127, 350, 223],
backgroundColor: ['#F59E0B', '#3B82F6', '#22C55E'],
borderWidth: 0,
hoverOffset: 10,
},
],
};
const options = {
responsive: true,
plugins: {
legend: {
position: 'bottom' as const,
labels: {
padding: 20,
usePointStyle: true,
font: {
size: 14
}
}
},
},
cutout: '60%',
};
return (
<div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
<h3 className="font-bold text-xl mb-6 text-gray-900">Répartition des Statuts</h3>
<Doughnut data={data} options={options} />
</div>
);
};

const getPriorityColor = (priority: Task['priority']) => {
switch(priority) {
case 'Haute': return 'bg-red-500';
case 'Moyenne': return 'bg-amber-500';
case 'Basse': return 'bg-green-500';
}
};

const getPriorityBadgeColor = (priority: Task['priority']) => {
switch(priority) {
case 'Haute': return 'bg-red-100 text-red-800';
case 'Moyenne': return 'bg-amber-100 text-amber-800';
case 'Basse': return 'bg-green-100 text-green-800';
}
};

const TaskList = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
    <div className="p-6 border-b border-gray-100">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-xl text-gray-900">Tâches du Jour</h3>
        <button className="text-green-600 hover:text-green-800 text-sm font-medium">
          Voir tout
        </button>
      </div>
    </div>
    <div className="p-6">
      <div className="space-y-4">
        {tasks.slice(0, 5).map(task => (
          <div key={task.id} className={`flex items-center p-4 rounded-xl border transition-all duration-200 ${
            task.completed 
              ? 'bg-green-50 border-green-200' 
              : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-sm'
          }`}>
            <button className={`w-5 h-5 rounded-full mr-4 flex items-center justify-center transition-colors ${
              task.completed ? 'bg-green-500' : getPriorityColor(task.priority)
            }`}>
              {task.completed && <CheckCircle className="h-3 w-3 text-white" />}
            </button>
            <p className={`flex-1 text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
              {task.description}
            </p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TeamManagement = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
    <div className="p-6 border-b border-gray-100">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-xl text-gray-900">Équipe Active</h3>
        <span className="text-sm text-gray-500">{teamMembers.filter(m => m.status === 'En ligne').length}/{teamMembers.length} en ligne</span>
      </div>
    </div>
    <div className="p-6">
      <div className="space-y-4">
        {teamMembers.map(member => (
          <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
            <div className="flex items-center">
              <div className="bg-green-600 p-2 rounded-full mr-4">
                <User className="h-6 w-6 text-white"/>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500">{member.role}</p>
              </div>
            </div>
            <div className="text-right mr-4">
              <p className="font-bold text-gray-900">{member.parcelsProcessed}</p>
              <p className="text-xs text-gray-500">colis traités</p>
            </div>
            <div className="flex items-center">
              <span className={`h-3 w-3 rounded-full mr-2 ${
                member.status === 'En ligne' ? 'bg-green-500' : 'bg-gray-400'
              }`}></span>
              <span className={`text-sm font-medium ${
                member.status === 'En ligne' ? 'text-green-600' : 'text-gray-500'
              }`}>
                {member.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const StatisticsPage = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="text-center">
        <BarChart3 className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Statistiques Avancées</h3>
        <p className="text-gray-600 mb-6">
          Analysez les performances et tendances de votre point relais
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-green-800">Croissance</p>
            <p className="text-2xl font-bold text-green-900">+15%</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="font-semibold text-blue-800">Clients</p>
            <p className="text-2xl font-bold text-blue-900">2,847</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
            <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="font-semibold text-purple-800">Revenus</p>
            <p className="text-2xl font-bold text-purple-900">1.2M FCFA</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
            <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="font-semibold text-orange-800">Temps Moyen</p>
            <p className="text-2xl font-bold text-orange-900">2.3j</p>
          </div>
        </div>
        <p className="text-gray-500">Rapports détaillés et analyses de performance disponibles ici</p>
      </div>
    </div>
  </div>
);
const LogisticsPage = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="text-center">
        <Truck className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestion Logistique</h3>
        <p className="text-gray-600 mb-6">
          Optimisez les flux de transport et la gestion des espaces
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <Truck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="font-semibold text-blue-800">Livraisons</p>
            <p className="text-2xl font-bold text-blue-900">23</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <Archive className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-green-800">Zones Stockage</p>
            <p className="text-2xl font-bold text-green-900">12</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
            <MapPin className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="font-semibold text-orange-800">Capacité</p>
            <p className="text-2xl font-bold text-orange-900">85%</p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="font-semibold text-red-800">Alertes</p>
            <p className="text-2xl font-bold text-red-900">3</p>
          </div>
        </div>
        <p className="text-gray-500">Coordination des transports et optimisation de l'espace</p>
      </div>
    </div>
  </div>
);
const TasksPage = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-xl text-gray-900">Gestion des Tâches</h3>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nouvelle Tâche</span>
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="font-semibold text-red-800">Haute Priorité</p>
            <p className="text-2xl font-bold text-red-900">{tasks.filter(t => t.priority === 'Haute' && !t.completed).length}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
            <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="font-semibold text-yellow-800">Moyenne Priorité</p>
            <p className="text-2xl font-bold text-yellow-900">{tasks.filter(t => t.priority === 'Moyenne' && !t.completed).length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-green-800">Terminées</p>
            <p className="text-2xl font-bold text-green-900">{tasks.filter(t => t.completed).length}</p>
          </div>
        </div>
<div className="space-y-4">
      {tasks.map(task => (
        <div key={task.id} className={`flex items-center p-4 rounded-xl border transition-all duration-200 ${
          task.completed 
            ? 'bg-green-50 border-green-200' 
            : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-sm'
        }`}>
          <button className={`w-6 h-6 rounded-full mr-4 flex items-center justify-center transition-colors ${
            task.completed ? 'bg-green-500' : getPriorityColor(task.priority)
          }`}>
            {task.completed && <CheckCircle className="h-4 w-4 text-white" />}
          </button>
          <p className={`flex-1 ${task.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
            {task.description}
          </p>
          <span className={`px-3 py-1 rounded-full text-xs font-medium mr-4 ${getPriorityBadgeColor(task.priority)}`}>
            {task.priority}
          </span>
          <div className="flex items-center space-x-2">
            <button className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors">
              <Edit className="h-4 w-4" />
            </button>
            <button className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>
  </div>
);

//==============================================================================
// COMPOSANT PRINCIPAL - Refactorisé
//==============================================================================

export default function ModernDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  // Nouvel état pour gérer l'ouverture de la sidebar sur mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const router = useRouter();
    const [kpiValues, setKpiValues] = useState<KpiValues | null>(null);
  const [chartData, setChartData] = useState<any>({ labels: [], datasets: [] });

    const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // --- HOOK POUR CHARGER TOUTES LES DONNÉES UNE SEULE FOIS ---
  useEffect(() => {
    const fetchData = async () => {
      // 1. Authentification
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        router.push('/');
        return;
      }

      // 2. Profil utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', session.user.id)
        .single();
      setUser(profile as LoggedInUser);

      // 3. Données des colis pour les KPIs et graphiques
      const { data: shipments, error: shipmentsError } = await supabase.from('Shipment').select('status, shippingCost, created_at, updated_at');
      if (shipmentsError) {
          console.error("Erreur de chargement des colis:", shipmentsError);
      } else if (shipments) {
        // --- Calculs pour KPIs et Graphiques ---
        const today = new Date().toISOString().slice(0, 10);
        
        const kpis: KpiValues = { pending: 0, received: 0, withdrawn: 0, todayRevenue: 0 };
        const weeklyVolume = Array(7).fill(0).map(() => ({ received: 0, withdrawn: 0 }));
        const labels = Array(7).fill(0).map((_, i) => {
            const d = new Date(); d.setDate(d.getDate() - i);
            return d.toLocaleDateString('fr-FR', { weekday: 'short' });
        }).reverse();
        
        shipments.forEach(shipment => {
          if (shipment.status === 'EN_ATTENTE_DE_DEPOT') kpis.pending++;
          if (shipment.status === 'ARRIVE_AU_RELAIS') kpis.received++;
          if (shipment.status === 'RECU') {
              kpis.withdrawn++;
              if (shipment.updated_at.startsWith(today)) {
                  kpis.todayRevenue += shipment.shippingCost;
              }
          }

          const createdAt = new Date(shipment.created_at);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24));

          if (diffDays < 7) {
              const dayIndex = 6 - diffDays;
              if(shipment.status !== 'EN_ATTENTE_DE_DEPOT'){ weeklyVolume[dayIndex].received++; }
              if(shipment.status === 'RECU'){ weeklyVolume[dayIndex].withdrawn++; }
          }
        });
        
        setKpiValues(kpis);
        setChartData({
            labels,
            datasets: [
                { label: 'Colis Reçus (Point Relais)', data: weeklyVolume.map(d => d.received), borderColor: '#22C55E', backgroundColor: 'rgba(34, 197, 94, 0.1)', fill: true, tension: 0.4 },
                { label: 'Colis Retirés', data: weeklyVolume.map(d => d.withdrawn), borderColor: '#15803D', backgroundColor: 'rgba(21, 128, 61, 0.1)', fill: true, tension: 0.4 },
            ],
        });
      }
      setIsLoading(false);
    };

    fetchData();
  }, [router]);

    // --- AFFICHAGE DE LA "VUE D'ENSEMBLE" DYNAMIQUE ---
  const renderOverviewContent = () => {
      if (isLoading || !kpiValues) {
        return <div className="text-center p-8">Chargement de la vue d'ensemble...</div>;
      }
      
      // La base de données contient le nombre total de colis arrivés, y compris ceux retirés.
      const totalReceivedParcels = kpiValues.received + kpiValues.withdrawn;

      const realKpiData: KpiCardProps[] = [
        { title: 'En Attente de Dépôt', value: kpiValues.pending.toString(), icon: <Clock className="h-6 w-6" />, color: 'bg-amber-500' },
        { title: 'Arrivés au Point Relais', value: totalReceivedParcels.toString(), icon: <Archive className="h-6 w-6" />, color: 'bg-green-600' },
        { title: 'Colis Retirés', value: kpiValues.withdrawn.toString(), icon: <CheckCircle className="h-6 w-6" />, color: 'bg-green-700' },
        { title: 'Revenus du Jour', value: `${kpiValues.todayRevenue.toLocaleString()} FCFA`, icon: <BarChart3 className="h-6 w-6" />, color: 'bg-emerald-600' },
      ];
      
      return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              {realKpiData.map((kpi) => ( <KpiCard key={kpi.title} {...kpi} /> ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-xl mb-6 text-gray-900">Évolution Hebdomadaire</h3>
                    <Line data={chartData} options={{ responsive: true /* autres options... */ }} />
                </div>
              </div>
              <div>{/* Espace pour un futur composant */}</div>
            </div>
          </>
      );
  }


  const renderContent = () => {
    switch(activeTab) {
      case 'overview': return  renderOverviewContent();
      case 'inventory': return <InventoryPage />;
      case 'statistics': return <StatisticsPage />;
      case 'staff': return <PersonnelPage />;
      case 'logistics': return <LogisticsPage />;
      case 'tasks': return <TasksPage />;
      case 'settings': return <RelayPointServiceCard />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
     <div className="min-h-screen flex items-center justify-center bg-gray-50">
       <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
     </div>
   );
 }

  return (
    <div className="bg-gray-50 min-h-screen flex text-gray-800">
      
      {/* Sidebar/Drawer */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />

      {/* Main content area */}
      {/* La marge à gauche n'est appliquée que sur les grands écrans */}
      <div className="flex-1 flex flex-col lg:ml-72">
        <Header user={user} setIsSidebarOpen={setIsSidebarOpen} />
        
        {/* Ajout d'un padding-bottom pour ne pas que la barre de nav inférieure cache le contenu */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 lg:pb-8">
          {renderContent()}
        </main>
      </div>
      
      {/* Barre de Navigation du bas pour mobile */}
      <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />

    </div>
  );
}
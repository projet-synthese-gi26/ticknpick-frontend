'use client';

import { useState, useMemo, ReactNode } from 'react';

// Icônes de Lucide React
import {
  Home,
  Package,
  BarChart3,
  Users,
  Truck,
  CheckSquare,
  LogOut,
  Bell,
  User,
  TrendingUp,
  TrendingDown,
  Archive,
  Clock,
  AlertTriangle,
  CheckCircle,
  Inbox,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Phone,
  Calendar,
  MapPin,
  Settings,
} from 'lucide-react';

// Chart.js pour les graphiques
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import InventoryPage from './Inventaire';
import Link from 'next/link';
import PersonnelPage from './Personnel';
import RelayPointServiceCard from './ServiceCard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

//==============================================================================
// INTERFACES TYPESCRIPT
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

//==============================================================================
// DONNÉES DE SIMULATION AVEC NOMS CAMEROUNAIS
//==============================================================================

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
  { id: 4, description: 'Mettre à jour l\'inventaire mensuel', priority: 'Basse', completed: false },
  { id: 5, description: 'Vérifier les colis en attente depuis plus de 7 jours', priority: 'Moyenne', completed: false },
  { id: 6, description: 'Organiser l\'espace de stockage section B', priority: 'Basse', completed: true },
];

const teamMembers: TeamMember[] = [
  { id: 1, name: 'Nkomo Adrien', role: 'Manutentionnaire', parcelsProcessed: 156, status: 'En ligne' },
  { id: 2, name: 'Owona Béatrice', role: 'Responsable Stock', parcelsProcessed: 89, status: 'En ligne' },
  { id: 3, name: 'Essono Cédric', role: 'Manutentionnaire', parcelsProcessed: 134, status: 'Hors ligne' },
  { id: 4, name: 'Bella Diane', role: 'Accueil Client', parcelsProcessed: 67, status: 'En ligne' },
  { id: 5, name: 'Manga Joseph', role: 'Superviseur', parcelsProcessed: 245, status: 'En ligne' },
];

//==============================================================================
// COMPOSANTS UI
//==============================================================================

const navigationItems = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: Home, active: true },
  { id: 'inventory', label: 'Suivi de Colis', icon: Package, active: false },
  { id: 'statistics', label: 'Statistiques', icon: BarChart3, active: false },
  { id: 'staff', label: 'Personnel', icon: Users, active: false },
  { id: 'tasks', label: 'Tâches', icon: CheckSquare, active: false },
  { id: 'settings', label: 'Paramètres', icon: Settings, active: false }
];

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) => (
  <div className="w-72 bg-white border-r border-gray-200 flex flex-col fixed h-full shadow-sm">
    <div className="px-6 py-6 border-b border-gray-200">
      <div className="flex items-center">
        <div className="bg-green-600 p-3 rounded-xl mr-3">
          <Package className="h-8 w-8 text-white"/>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">PicknDrop Point</h1>
          <p className="text-gray-500 text-sm">Yaoundé Centre</p>
        </div>
      </div>
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
      <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200">
        <LogOut className="h-5 w-5" />
        <span>Déconnexion</span>
      </button>
    </div>
  </div>
);

const Header = () => (
  <header className="bg-white shadow-sm border-b border-gray-200 p-6">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Bonjour Proprio, 😄
        </h2>
        <p className="text-gray-600 mt-1">Voici un aperçu de votre point relais aujourd'hui</p>
      </div>
      <div className="flex items-center space-x-4">
        <Link href='/emit-package' className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Nouveau Colis</span>
        </Link>
        <div className="relative">
          <Bell className="h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"/>
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
        </div>
        <div className="bg-green-600 p-2 rounded-full">
          <User className="h-6 w-6 text-white"/>
        </div>
      </div>
    </div>
  </header>
);

const KpiCard = ({ title, value, icon, change, changeType, color }: KpiCardProps) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {change && (
          <div className={`flex items-center mt-3 text-sm font-semibold ${
            changeType === 'increase' ? 'text-green-600' : 'text-red-600'
          }`}>
            {changeType === 'increase' ? 
              <TrendingUp className="h-4 w-4 mr-1"/> : 
              <TrendingDown className="h-4 w-4 mr-1"/>
            }
            <span>{change} vs hier</span>
          </div>
        )}
      </div>
      <div className={`${color} p-4 rounded-2xl text-white`}>
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
// COMPOSANT PRINCIPAL
//==============================================================================

export default function ModernDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <>
            {/* Section KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
              {kpiData.map((kpi) => (
                <KpiCard key={kpi.title} {...kpi} />
              ))}
            </div>
            {/* Section graphiques et équipe */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <VolumeChart />
              </div>
              <div className="space-y-8">
                <StatusDistribution />
              </div>
            </div>

            {/* Section tâches et équipe */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              <TaskList />
              <TeamManagement />
            </div>
          </>
        );
      case 'inventory':
        return <InventoryPage />;
      case 'statistics':
        return <StatisticsPage />;
      case 'staff':
        return <PersonnelPage />;
      case 'logistics':
        return <LogisticsPage />;
      case 'tasks':
        return <TasksPage />;
      case 'settings':
        return <RelayPointServiceCard />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col ml-72">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
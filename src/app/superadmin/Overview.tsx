// src/app/superadmin/Overview.tsx

'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { DollarSign, Package, Users, UserPlus, TrendingUp, TrendingDown, Clock, User, Loader2, Activity } from 'lucide-react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend
);

// Interfaces pour les données
interface Stats {
  totalShipments: number;
  totalRevenue: number;
  totalUsers: number;
  newSignups: number;
}
interface ActivityItem {
  type: 'shipment' | 'user' | 'withdrawal';
  description: string;
  timestamp: string;
}

// Sous-composant StatCard avec design amélioré
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
        {trend && trendValue && (
          <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            <span className="font-medium">{trendValue}</span>
          </div>
        )}
      </div>
      <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-xl">
        <Icon className="h-7 w-7 text-orange-600 dark:text-orange-400" />
      </div>
    </div>
  </motion.div>
);

export default function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusChartData, setStatusChartData] = useState<ChartData<'pie'> | null>(null);
  const [revenueChartData, setRevenueChartData] = useState<ChartData<'line'> | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  // Détection du thème système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Définir la plage de dates pour les KPIs
        const now = new Date();
        let startDate: Date;

        if (timeframe === 'today') {
            startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (timeframe === 'week') {
            startDate = new Date(now.setDate(now.getDate() - now.getDay()));
            startDate.setHours(0, 0, 0, 0);
        } else { // month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const startDateISO = startDate.toISOString();
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // Requêtes parallèles pour les KPIs
        const [
          shipmentsRes,
          revenueRes,
          profilesCount,
          profilesProCount,
          newProfilesCount,
          newProfilesProCount,
          statusData,
          revenueData,
          latestShipments,
          latestUsers
        ] = await Promise.all([
          supabase.from('shipments').select('shipping_cost', { count: 'exact', head: false }).gte('created_at', startDateISO),
          supabase.rpc('get_daily_revenue_last_30_days'),
          supabase.from('profiles').select('id', { count: 'exact' }),
          supabase.from('profiles_pro').select('id', { count: 'exact' }),
          supabase.from('profiles').select('id', { count: 'exact' }).gte('created_at', twentyFourHoursAgo),
          supabase.from('profiles_pro').select('id', { count: 'exact' }).gte('created_at', twentyFourHoursAgo),
          supabase.rpc('get_shipment_status_counts'),
          supabase.rpc('get_daily_revenue_last_30_days'),
          supabase.from('shipments').select('tracking_number, recipient_name, created_at').order('created_at', { ascending: false }).limit(3),
          supabase.from('profiles_pro').select('manager_name, account_type, created_at').order('created_at', { ascending: false }).limit(2)
        ]);

        // KPIs
        const totalRevenue = shipmentsRes.data?.reduce((sum, item) => sum + (item.shipping_cost || 0), 0) || 0;
        setStats({
          totalShipments: shipmentsRes.count ?? 0,
          totalRevenue: totalRevenue,
          totalUsers: (profilesCount.count ?? 0) + (profilesProCount.count ?? 0),
          newSignups: (newProfilesCount.count ?? 0) + (newProfilesProCount.count ?? 0)
        });

        // Graphique de statut avec couleurs orange
        if (statusData.data) {
          const labels = statusData.data.map((item: any) => item.status);
          const data = statusData.data.map((item: any) => item.count);
          setStatusChartData({
            labels,
            datasets: [{
              label: 'Nombre de colis',
              data,
              backgroundColor: [
                '#FB923C', // orange-400
                '#F97316', // orange-500
                '#EA580C', // orange-600
                '#C2410C', // orange-700
                '#FDBA74'  // orange-300
              ],
              borderWidth: 0,
            }]
          });
        }
        
        // Graphique de revenus
        if (revenueData.data) {
          const labels = revenueData.data.map((d: any) => new Date(d.day).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }));
          const data = revenueData.data.map((d: any) => d.total_revenue);
          setRevenueChartData({
            labels,
            datasets: [{
              label: 'Revenus journaliers (FCFA)',
              data,
              borderColor: '#F97316',
              backgroundColor: 'transparent',
              borderWidth: 3,
              fill: false,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: '#F97316',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointHoverRadius: 6,
            }]
          });
        }

        // Flux d'activité
        const activities: ActivityItem[] = [];
        latestShipments.data?.forEach(s => activities.push({
            type: 'shipment',
            description: `Colis ${s.tracking_number} créé pour ${s.recipient_name}.`,
            timestamp: s.created_at
        }));
        latestUsers.data?.forEach(u => activities.push({
            type: 'user',
            description: `Nouvel utilisateur ${u.account_type}: ${u.manager_name}.`,
            timestamp: u.created_at
        }));
        
        setActivityFeed(activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

      } catch (error) {
        console.error("Erreur de chargement de la vue d'ensemble:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [timeframe]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des données...</p>
        </div>
      </div>
    );
  }

  const chartOptions: ChartOptions<'line' | 'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom' as const,
        labels: {
          color: isDark ? '#D1D5DB' : '#374151',
          padding: 15,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        titleColor: isDark ? '#F3F4F6' : '#111827',
        bodyColor: isDark ? '#D1D5DB' : '#374151',
        borderColor: isDark ? '#374151' : '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        boxPadding: 6
      }
    },
    scales: {
      y: {
        grid: {
          color: isDark ? '#374151' : '#F3F4F6',
        },
        ticks: {
          color: isDark ? '#9CA3AF' : '#6B7280',
        }
      },
      x: {
        grid: {
          color: isDark ? '#374151' : '#F3F4F6',
        },
        ticks: {
          color: isDark ? '#9CA3AF' : '#6B7280',
        }
      }
    }
  };

  const pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom' as const,
        labels: {
          color: isDark ? '#D1D5DB' : '#374151',
          padding: 15,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        titleColor: isDark ? '#F3F4F6' : '#111827',
        bodyColor: isDark ? '#D1D5DB' : '#374151',
        borderColor: isDark ? '#374151' : '#E5E7EB',
        borderWidth: 1,
        padding: 12,
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-8 p-8"
      >
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {(['today', 'week', 'month'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  timeframe === tf 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tf === 'today' ? "Aujourd'hui" : tf === 'week' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>
        </div>
        
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Colis Expédiés" 
            value={stats?.totalShipments ?? 0} 
            icon={Package}
            trend="up"
            trendValue="+12%"
          />
          <StatCard 
            title="Revenus Générés" 
            value={`${(stats?.totalRevenue ?? 0).toLocaleString()} FCFA`} 
            icon={DollarSign}
            trend="up"
            trendValue="+8%"
          />
          <StatCard 
            title="Utilisateurs Totaux" 
            value={stats?.totalUsers ?? 0} 
            icon={Users}
            trend="up"
            trendValue="+5%"
          />
          <StatCard 
            title="Nouveaux Inscrits (24h)" 
            value={stats?.newSignups ?? 0} 
            icon={UserPlus}
          />
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Graphique de revenus */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-xl text-gray-900 dark:text-white">Revenus des 30 derniers jours</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Évolution journalière</p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="h-80">
              {revenueChartData && <Line data={revenueChartData} options={chartOptions as any} />}
            </div>
          </div>

          {/* Graphique de statut */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-xl text-gray-900 dark:text-white">Statut des Colis</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Répartition actuelle</p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
                <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="h-80">
              {statusChartData && <Pie data={statusChartData} options={pieChartOptions as any} />}
            </div>
          </div>
        </div>

        {/* Flux d'activité */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-xl text-gray-900 dark:text-white">Flux d'Activité Récent</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Dernières actions sur la plateforme</p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
              <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="space-y-4">
            {activityFeed.length > 0 ? (
              activityFeed.map((activity, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl flex-shrink-0">
                    {activity.type === 'shipment' && <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
                    {activity.type === 'user' && <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucune activité récente
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
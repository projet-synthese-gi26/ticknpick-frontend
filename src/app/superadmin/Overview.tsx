// src/app/superadmin/Overview.tsx

'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { DollarSign, Package, Users, UserPlus, BarChart, Clock, List, User, Loader2 } from 'lucide-react';
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
interface Activity {
  type: 'shipment' | 'user' | 'withdrawal';
  description: string;
  timestamp: string;
}

// Sous-composant StatCard
const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex items-center space-x-4">
    <div className="bg-orange-100 p-3 rounded-full">
      <Icon className="h-6 w-6 text-orange-600" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export default function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusChartData, setStatusChartData] = useState<ChartData<'pie'> | null>(null);
  const [revenueChartData, setRevenueChartData] = useState<ChartData<'line'> | null>(null);
  const [activityFeed, setActivityFeed] = useState<Activity[]>([]);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [isLoading, setIsLoading] = useState(true);

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

        // Graphique de statut
        if (statusData.data) {
          const labels = statusData.data.map((item: any) => item.status);
          const data = statusData.data.map((item: any) => item.count);
          setStatusChartData({
            labels,
            datasets: [{
              label: 'Nombre de colis',
              data,
              backgroundColor: ['#FDBA74', '#60A5FA', '#818CF8', '#A78BFA', '#34D399'],
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
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              fill: true,
              tension: 0.3
            }]
          });
        }

        // Flux d'activité
        const activities: Activity[] = [];
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
    return <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
  }

  const chartOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
          legend: { position: 'bottom' as const }
      }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Vue d'ensemble</h1>
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
          {(['today', 'week', 'month'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                timeframe === tf ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tf === 'today' ? "Auj." : tf === 'week' ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Colis Expédiés" value={stats?.totalShipments ?? 0} icon={Package} />
        <StatCard title="Revenus Générés" value={`${(stats?.totalRevenue ?? 0).toLocaleString()} FCFA`} icon={DollarSign} />
        <StatCard title="Utilisateurs Totaux" value={stats?.totalUsers ?? 0} icon={Users} />
        <StatCard title="Nouveaux Inscrits (24h)" value={stats?.newSignups ?? 0} icon={UserPlus} />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="font-bold text-lg mb-4">Revenus des 30 derniers jours</h2>
          <div className="h-72">
            {revenueChartData && <Line data={revenueChartData} options={chartOptions as any} />}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="font-bold text-lg mb-4">Répartition des Colis par Statut</h2>
          <div className="h-72">
            {statusChartData && <Pie data={statusChartData} options={chartOptions as any} />}
          </div>
        </div>
      </div>

      {/* Flux d'activité */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="font-bold text-lg mb-4">Flux d'Activité Récent</h2>
          <div className="space-y-4">
              {activityFeed.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 pb-2 border-b last:border-b-0">
                      <div className="bg-gray-100 p-2 rounded-full mt-1">
                          {activity.type === 'shipment' && <Package className="w-4 h-4 text-gray-600" />}
                          {activity.type === 'user' && <User className="w-4 h-4 text-gray-600" />}
                      </div>
                      <div>
                          <p className="text-sm text-gray-800">{activity.description}</p>
                          <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString('fr-FR')}</p>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </motion.div>
  );
}
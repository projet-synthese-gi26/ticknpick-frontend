// FICHIER : src/app/dashboard/Overview.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  Truck, 
  CheckCircle2, 
  Calendar,
  ArrowRight,
  DollarSign,
  Wallet,
  Loader2,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Line, Doughnut } from 'react-chartjs-2';
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
  ChartOptions,
  ScriptableContext
} from 'chart.js';
import apiClient from '@/services/apiClient';
import { UserProfile } from './page'; 

// Enregistrement des composants ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

// --- Interfaces locales ---
interface DashboardStats {
  totalShipments: number;
  activeShipments: number;
  deliveredShipments: number;
  totalAmount: number; // Total dépensé (Client) ou gagné (Pro)
}

interface ActivityLog {
  id: number | string;
  tracking_number: string;
  status: string;
  updated_at: string;
  description: string;
}

interface MyPackage {
    id: string;
    trackingNumber: string;
    status: string; 
    createdAt: string;
    updatedAt: string;
    description?: string;
    shippingCost: number;
    senderName: string;
    recipientName: string;
}

// --- Composant Carte Statistique ---
const StatCard = ({ title, value, icon: Icon, trend, color }: { 
  title: string; value: string; icon: React.ElementType; trend?: string; color: string; 
}) => {
  const colors: Record<string, { bg: string, text: string, iconBg: string }> = {
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/40' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/40' }
  };

  const style = colors[color] || colors.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -5 }}
      className={`relative overflow-hidden p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm ${style.bg}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
          {trend && (
            <div className="flex items-center mt-2 text-xs font-medium text-green-600 dark:text-green-400">
              <TrendingUp className="w-3 h-3 mr-1" /> <span>{trend} vs mois dernier</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${style.iconBg} ${style.text}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};

// --- Composant Principal ---
export default function OverviewDashboard({ profile }: { profile: UserProfile }) {
  const [stats, setStats] = useState<DashboardStats>({
    totalShipments: 0, activeShipments: 0, deliveredShipments: 0, totalAmount: 0,
  });
  
  // États pour les graphiques
  const [lineChartLabels, setLineChartLabels] = useState<string[]>([]);
  const [lineChartDataPoints, setLineChartDataPoints] = useState<number[]>([]);
  
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    checkDarkMode();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', checkDarkMode);
    return () => window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', checkDarkMode);
  }, []);

  // --- FONCTIONS DE CALCULS (Chart Helpers) ---
  
  const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d);
    }
    return dates;
  };

  // CHARGEMENT ET CALCUL DES DONNÉES
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let allPackages: MyPackage[] = [];

        // 1. RÉCUPÉRATION API
        if (profile.account_type === 'CLIENT') {
           allPackages = await apiClient<MyPackage[]>('/api/packages/my-packages');
        } else {
           // Fallback Pro temporaire ou implémentez la logique PRO ici
           console.warn("Overview API Pro non connecté");
        }

        if (!allPackages || !Array.isArray(allPackages)) allPackages = [];

        // 2. CALCUL DES KPIs
        const active = allPackages.filter(s => {
            if (!s.status) return false;
            const st = s.status.toUpperCase();
            return !['RECU', 'LIVRE', 'ANNULE', 'DELIVERED', 'CANCELLED', 'COMPLETED', 'WITHDRAWN'].includes(st);
        }).length;

        const delivered = allPackages.filter(s => {
            if (!s.status) return false;
            const st = s.status.toUpperCase();
            return ['RECU', 'LIVRE', 'DELIVERED', 'COMPLETED', 'WITHDRAWN'].includes(st);
        }).length;
        
        // >> CALCUL DU MONTANT TOTAL <<
        // On s'assure que shippingCost est un nombre
        const totalAmount = allPackages.reduce((acc, curr) => acc + Number(curr.shippingCost || 0), 0);

        setStats({
          totalShipments: allPackages.length,
          activeShipments: active,
          deliveredShipments: delivered,
          totalAmount: totalAmount
        });

        // 3. PRÉPARATION DES DONNÉES GRAPHIQUE (Volume sur 7 jours)
        const last7Days = getLast7Days();
        const chartLabels = last7Days.map(d => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
        
        const chartPoints = last7Days.map(date => {
             // Compte combien de colis créés ce jour là
             const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
             return allPackages.filter(p => {
                 if(!p.createdAt) return false;
                 return p.createdAt.startsWith(dateString);
             }).length;
        });

        setLineChartLabels(chartLabels);
        setLineChartDataPoints(chartPoints);


        // 4. ACTIVITÉ RÉCENTE
        const recent = [...allPackages]
            .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
            .slice(0, 5)
            .map(p => ({
                id: p.id,
                tracking_number: p.trackingNumber,
                status: p.status,
                updated_at: p.updatedAt || p.createdAt,
                description: p.description || `Colis pour ${p.recipientName}`
            }));
        setActivities(recent);

      } catch (err) {
        console.error("Erreur chargement Overview:", err);
      } finally {
        setLoading(false);
      }
    };

    if(profile) loadData();
  }, [profile]);

  // --- CONFIGURATION CHART JS ---

  const lineChartData = {
    labels: lineChartLabels.length > 0 ? lineChartLabels : ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
    datasets: [{
        label: 'Colis envoyés',
        data: lineChartDataPoints.length > 0 ? lineChartDataPoints : [0, 0, 0, 0, 0, 0, 0], 
        fill: true,
        // Dégradé orange moderne
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, isDarkMode ? 'rgba(249, 115, 22, 0.5)' : 'rgba(249, 115, 22, 0.3)');
          gradient.addColorStop(1, 'rgba(249, 115, 22, 0.0)');
          return gradient;
        },
        borderColor: '#f97316', // Orange-500
        borderWidth: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#f97316',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4, // Lisse la courbe
    }],
  };

  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true, 
    maintainAspectRatio: false,
    plugins: { 
        legend: { display: false },
        tooltip: {
            backgroundColor: isDarkMode ? '#1f2937' : '#fff',
            titleColor: isDarkMode ? '#f3f4f6' : '#111827',
            bodyColor: isDarkMode ? '#d1d5db' : '#374151',
            borderColor: isDarkMode ? '#374151' : '#e5e7eb',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            titleFont: { size: 13 },
            bodyFont: { size: 13, weight: 'bold' },
        }
    },
    scales: { 
        x: { 
            grid: { display: false }, 
            ticks: { color: isDarkMode ? '#9ca3af' : '#6b7280', font: { size: 11 } }
        }, 
        y: { 
            display: true, // Afficher l'axe Y pour voir le volume
            beginAtZero: true,
            ticks: { stepSize: 1, color: isDarkMode ? '#9ca3af' : '#6b7280', font: { size: 10 } },
            grid: { color: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
        } 
    } 
  };

  const doughnutData = {
    labels: ['En cours', 'Livrés', 'Autres/Annulés'],
    datasets: [{
      data: [stats.activeShipments, stats.deliveredShipments, stats.totalShipments - (stats.activeShipments + stats.deliveredShipments)],
      backgroundColor: [
        '#f97316', // Orange (Active)
        '#10b981', // Emerald (Delivered)
        isDarkMode ? '#374151' : '#e2e8f0' // Gray (Others)
      ],
      hoverOffset: 8,
      borderWidth: 0,
    }],
  };

  const statusMap: Record<string, { label: string, color: string }> = {
      'EN_ATTENTE_DE_DEPOT': { label: 'En attente', color: 'text-yellow-600 bg-yellow-100' },
      'AU_DEPART': { label: 'Au départ', color: 'text-blue-600 bg-blue-100' },
      'EN_TRANSIT': { label: 'En transit', color: 'text-indigo-600 bg-indigo-100' },
      'ARRIVE_AU_RELAIS': { label: 'Disponible', color: 'text-purple-600 bg-purple-100' },
      'RECU': { label: 'Terminé', color: 'text-emerald-600 bg-emerald-100' },
      'LIVRE': { label: 'Livré', color: 'text-emerald-600 bg-emerald-100' },
      'ANNULE': { label: 'Annulé', color: 'text-red-600 bg-red-100' },
  };

  return (
    <div className="space-y-8 p-4 pb-8">
      
      {/* Header avec Date */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Vue d'ensemble</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Suivez vos colis et vos dépenses en temps réel.</p>
        </div>
        <div className="flex items-center bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
           <Calendar className="w-4 h-4 text-orange-500 mr-2" />
           <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 capitalize">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
           </span>
        </div>
      </div>

      {/* --- CARTES STATS (KPIs) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title={profile.account_type === 'CLIENT' ? "Montant Dépensé" : "Chiffre d'Affaires"} 
            value={`${stats.totalAmount.toLocaleString('fr-FR')} FCFA`} 
            icon={profile.account_type === 'CLIENT' ? Wallet : DollarSign} 
            color="orange" 
        />
        <StatCard title="Total Colis" value={stats.totalShipments.toString()} icon={Package} color="orange" />
        <StatCard title="En cours" value={stats.activeShipments.toString()} icon={Truck} color="orange" />
        <StatCard title="Terminés" value={stats.deliveredShipments.toString()} icon={CheckCircle2} color="orange" />
      </div>

      {/* --- GRAPHIQUES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Graphe Ligne (Volume 7j) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Flux des envois (7 jours)</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                     Semaine
                  </span>
              </div>
              <div className="h-64">
                  <Line data={lineChartData} options={lineChartOptions} />
              </div>
          </motion.div>

          {/* Graphe Donut (Répartition) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">État du Trafic</h3>
              
              <div className="h-48 flex justify-center relative">
                   <Doughnut 
                     data={doughnutData} 
                     options={{ 
                       cutout: '75%', 
                       plugins: { legend: { display: false }, tooltip: { enabled: true } } 
                     }} 
                   />
                   
                   {/* Centre du Donut : Afficher le Total */}
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-black text-gray-800 dark:text-white">{stats.totalShipments}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Total</span>
                   </div>
              </div>

              {/* Légende personnalisée */}
              <div className="mt-auto grid grid-cols-3 gap-2 text-center text-xs pt-4">
                  <div className="p-2 rounded bg-orange-50 dark:bg-orange-900/20">
                    <span className="block font-bold text-orange-600 dark:text-orange-400 text-lg">{stats.activeShipments}</span>
                    <span className="text-gray-500 dark:text-gray-400">Actifs</span>
                  </div>
                  <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-900/20">
                    <span className="block font-bold text-emerald-600 dark:text-emerald-400 text-lg">{stats.deliveredShipments}</span>
                    <span className="text-gray-500 dark:text-gray-400">Livrés</span>
                  </div>
                  <div className="p-2 rounded bg-gray-50 dark:bg-gray-700/30">
                    <span className="block font-bold text-gray-600 dark:text-gray-300 text-lg">
                       {stats.totalShipments - stats.activeShipments - stats.deliveredShipments}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">Autres</span>
                  </div>
              </div>
          </motion.div>
      </div>

      {/* --- ACTIVITÉ RÉCENTE (Tableau stylisé) --- */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Activité Récente</h3>
          </div>
          
          {loading ? (
              <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500"/></div>
          ) : activities.length === 0 ? (
               <div className="p-12 text-center text-gray-400">
                   <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                   <p>Aucune activité enregistrée.</p>
               </div>
          ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {activities.map((activity) => {
                      const normalizedStatus = activity.status ? activity.status.toUpperCase() : 'INCONNU';
                      // Mapping pour gérer la compatibilité Anglais/Français
                      const statusKey = Object.keys(statusMap).find(k => normalizedStatus.includes(k)) 
                                        || 'EN_ATTENTE_DE_DEPOT';
                      
                      const conf = statusMap[statusKey];
                      
                      return (
                        <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm font-mono tracking-tight">
                                        {activity.tracking_number}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px] sm:max-w-xs">
                                        {activity.description}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${conf.color}`}>
                                    {conf.label}
                                </span>
                                <p className="text-[11px] text-gray-400 mt-1 flex items-center justify-end gap-1">
                                    <Clock className="w-3 h-3" /> 
                                    {new Date(activity.updated_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
                                </p>
                            </div>
                        </div>
                      );
                  })}
              </div>
          )}
      </motion.div>
    </div>
  );
}
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import {
  DollarSign,
  Package,
  Users,
  Wallet,
  TrendingUp,
  Download,
  Loader2,
  Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Registrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

interface KpiData {
  revenue_today: number;
  revenue_last_7_days: number;
  revenue_last_30_days: number;
  total_partner_earnings: number;
}

interface PartnerEarning {
  agency_id: string;
  manager_name: string;
  account_type: string;
  credit_balance: number;
  total_earnings: number;
  shipment_count: number;
}

interface LoadingState {
  kpis: boolean;
  revenue: boolean;
  partners: boolean;
}

type TabType = 'revenue' | 'partners';

// ============================================================================
// COMPOSANTS UTILITAIRES
// ============================================================================

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, color }) => {
  const colorClass = color.split('-')[1];
  
  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg border-l-4 ${color}`}>
      <div className="flex items-center space-x-4">
        <div className={`bg-${colorClass}-100 p-3 rounded-full`}>
          <Icon className={`h-6 w-6 text-${colorClass}-600`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-8">
    <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
  </div>
);

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const FinanceManagement: React.FC = () => {
  // États
  const [activeTab, setActiveTab] = useState<TabType>('revenue');
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [revenueChartData, setRevenueChartData] = useState<ChartData<'line'> | null>(null);
  const [partnersData, setPartnersData] = useState<PartnerEarning[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    kpis: true,
    revenue: true,
    partners: true
  });

  // ============================================================================
  // FONCTIONS UTILITAIRES
  // ============================================================================

  const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString()} FCFA`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric'
    });
  };

  // ============================================================================
  // FONCTIONS DE RÉCUPÉRATION DES DONNÉES
  // ============================================================================

  const fetchKpis = useCallback(async (): Promise<void> => {
    try {
      setLoading(prev => ({ ...prev, kpis: true }));
      
      const { data, error } = await supabase.rpc('get_finance_kpis');
      
      if (error) {
        console.error('Erreur lors de la récupération des KPIs:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setKpis(data[0]);
      }
    } catch (error) {
      console.error('Erreur inattendue lors de la récupération des KPIs:', error);
    } finally {
      setLoading(prev => ({ ...prev, kpis: false }));
    }
  }, []);

  const fetchRevenueChart = useCallback(async (): Promise<void> => {
    try {
      setLoading(prev => ({ ...prev, revenue: true }));
      
      const { data, error } = await supabase.rpc('get_daily_revenue_last_30_days');
      
      if (error) {
        console.error('Erreur lors de la récupération des revenus:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const labels = data.map((item: any) => formatDate(item.day));
        const values = data.map((item: any) => item.total_revenue);
        
        setRevenueChartData({
          labels,
          datasets: [{
            label: 'Revenus journaliers (FCFA)',
            data: values,
            borderColor: '#F97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            fill: true,
            tension: 0.3
          }]
        });
      }
    } catch (error) {
      console.error('Erreur inattendue lors de la récupération des revenus:', error);
    } finally {
      setLoading(prev => ({ ...prev, revenue: false }));
    }
  }, []);

  const fetchPartnersEarnings = useCallback(async (): Promise<void> => {
    try {
      setLoading(prev => ({ ...prev, partners: true }));
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase.rpc('get_partners_earnings_report', {
        start_date: thirtyDaysAgo.toISOString(),
        end_date: new Date().toISOString()
      });
      
      if (error) {
        console.error('Erreur lors de la récupération des gains partenaires:', error);
        return;
      }
      
      setPartnersData(data || []);
    } catch (error) {
      console.error('Erreur inattendue lors de la récupération des gains partenaires:', error);
    } finally {
      setLoading(prev => ({ ...prev, partners: false }));
    }
  }, []);

  // ============================================================================
  // HANDLERS D'ÉVÉNEMENTS
  // ============================================================================

  const handleTabChange = (tab: TabType): void => {
    setActiveTab(tab);
  };

  const handleExportData = (): void => {
    // Logique d'exportation à implémenter
    console.log('Export des données partenaires');
  };

  // ============================================================================
  // EFFETS
  // ============================================================================

  useEffect(() => {
    fetchKpis();
    fetchRevenueChart();
    fetchPartnersEarnings();
  }, [fetchKpis, fetchRevenueChart, fetchPartnersEarnings]);

  // ============================================================================
  // CONFIGURATION DU GRAPHIQUE
  // ============================================================================

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(Number(value))
        }
      }
    }
  };

  // ============================================================================
  // DONNÉES DES KPIs
  // ============================================================================

  const kpiCards = [
    {
      title: "Revenus Aujourd'hui",
      value: formatCurrency(kpis?.revenue_today || 0),
      icon: DollarSign,
      color: "border-orange-500"
    },
    {
      title: "Revenus (7 jours)",
      value: formatCurrency(kpis?.revenue_last_7_days || 0),
      icon: TrendingUp,
      color: "border-orange-500"
    },
    {
      title: "Revenus (30 jours)",
      value: formatCurrency(kpis?.revenue_last_30_days || 0),
      icon: Calendar,
      color: "border-orange-500"
    },
    {
      title: "Gains Partenaires Totaux",
      value: formatCurrency(kpis?.total_partner_earnings || 0),
      icon: Wallet,
      color: "border-orange-500"
    }
  ];

  const tableHeaders = [
    "Partenaire",
    "Type",
    "Colis Traités",
    "Gains Générés",
    "Solde de Crédit"
  ];

  // ============================================================================
  // RENDU
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <h1 className="text-3xl font-bold text-gray-800">
        Finances et Rapports
      </h1>

      {/* Section KPIs */}
      <section className="space-y-4">
        {loading.kpis ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiCards.map((kpi, index) => (
              <KpiCard
                key={index}
                title={kpi.title}
                value={kpi.value}
                icon={kpi.icon}
                color={kpi.color}
              />
            ))}
          </div>
        )}
      </section>

      {/* Navigation par onglets */}
      <nav className="flex border-b border-gray-200">
        <button
          onClick={() => handleTabChange('revenue')}
          className={`py-3 px-6 font-semibold transition-colors ${
            activeTab === 'revenue'
              ? 'border-b-2 border-orange-500 text-orange-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Rapport de Revenus
        </button>
        <button
          onClick={() => handleTabChange('partners')}
          className={`py-3 px-6 font-semibold transition-colors ${
            activeTab === 'partners'
              ? 'border-b-2 border-orange-500 text-orange-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Gains des Partenaires
        </button>
      </nav>

      {/* Contenu des onglets */}
      <AnimatePresence mode="wait">
        {activeTab === 'revenue' && (
          <motion.section
            key="revenue"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-xl shadow-lg border"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Évolution des revenus sur les 30 derniers jours
            </h2>
            
            <div className="h-96">
              {loading.revenue ? (
                <LoadingSpinner />
              ) : revenueChartData ? (
                <Line data={revenueChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </motion.section>
        )}

        {activeTab === 'partners' && (
          <motion.section
            key="partners"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-xl shadow-lg border"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Gains des Partenaires (30 derniers jours)
              </h2>
              <button
                onClick={handleExportData}
                className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                <Download size={16} />
                Exporter
              </button>
            </div>
            
            <div className="overflow-x-auto">
              {loading.partners ? (
                <LoadingSpinner />
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {tableHeaders.map((header) => (
                        <th
                          key={header}
                          className="p-4 text-left font-semibold text-gray-600 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {partnersData.length > 0 ? (
                      partnersData.map((partner) => (
                        <tr
                          key={partner.agency_id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-4 font-semibold text-gray-900">
                            {partner.manager_name}
                          </td>
                          <td className="p-4 text-gray-600">
                            {partner.account_type}
                          </td>
                          <td className="p-4 text-gray-600">
                            {partner.shipment_count.toLocaleString()}
                          </td>
                          <td className="p-4 font-semibold text-green-600">
                            {formatCurrency(partner.total_earnings)}
                          </td>
                          <td className="p-4 font-semibold text-blue-600">
                            {formatCurrency(partner.credit_balance)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={tableHeaders.length}
                          className="p-8 text-center text-gray-500"
                        >
                          Aucun partenaire trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinanceManagement;
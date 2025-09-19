// FICHIER : src/app/dashboard/FreelanceOverview.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from './page';
import { motion } from 'framer-motion';
import {
  Package,
  ArrowUpRight,
  Archive,
  Wallet,
  DollarSign,
  Loader2,
  AlertTriangle,
  MapPin,
  Edit,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';

// --- MODIFICATION 1 : Interface mise à jour pour utiliser "totalEarnings" ---
interface FreelanceStats {
  relayPointId: number | null;
  totalPackages: number;
  packagesDeposited: number;
  packagesReceived: number;
  packagesInStock: number;
  packagesDelivered: number;
  creditBalance: number;
  totalEarnings: number; // Remplacement de totalRevenue
  avgPackageValue: number;
  completionRate: number;
}
// Interface pour les props du composant de carte
interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  description: string;
  colorClass: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface RelayPointInfo {
  id: number;
  name: string;
  address: string;
  quartier?: string;
}

// Composant réutilisable pour afficher une statistique
const StatCard: React.FC<StatCardProps> = ({ 
  icon: Icon, 
  title, 
  value, 
  description, 
  colorClass,
  trend 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5, scale: 1.02 }}
    className={`relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-l-4 ${colorClass} transition-all duration-300 hover:shadow-xl`}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
          {trend && (
            <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
              trend.isPositive 
                ? 'text-green-600 bg-green-50' 
                : 'text-red-600 bg-red-50'
            }`}>
              <TrendingUp className={`w-3 h-3 mr-1 ${
                trend.isPositive ? '' : 'rotate-180'
              }`} />
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight mb-1">
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-700 dark:to-gray-600 rounded-xl ml-4">
        <Icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
      </div>
    </div>
  </motion.div>
);

export default function FreelanceOverview({ 
  profile, 
  setActiveTab 
}: { 
  profile: UserProfile; 
  setActiveTab: (tabId: string) => void; 
}) {
  const [stats, setStats] = useState<FreelanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relayPointInfo, setRelayPointInfo] = useState<RelayPointInfo | null>(null);

  useEffect(() => {
    const fetchFreelanceData = async () => {
      if (!profile || !profile.id) {
        setError("Profil utilisateur non disponible.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data: relayPointData, error: relayError } = await supabase
          .from('relay_points')
          .select('id, name, address, quartier')
          .eq('agency_id', profile.id)
          .limit(1)
          .single();

        if (relayError) {
          if (relayError.code === 'PGRST116') {
            throw new Error("Aucun point relais n'est configuré pour ce compte. Veuillez le créer depuis l'onglet Profil.");
          }
          throw relayError;
        }

        setRelayPointInfo(relayPointData);
        const relayPointId = relayPointData.id;

        const { data: withdrawalData, error: withdrawalError } = await supabase
          .from('withdrawal_logs')
          .select('shipment_id');
        if (withdrawalError) throw withdrawalError;
        const deliveredShipmentIds = withdrawalData?.map(log => log.shipment_id) || [];

        // --- MODIFICATION 2 : Appel à la fonction SQL get_agency_total_earnings ---
        const [
          packagesDepositedRes,
          packagesReceivedRes,
          packagesInStockRes,
          profileRes,
          totalEarningsRes // <-- NOUVEL APPEL
        ] = await Promise.all([
          supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('departure_point_id', relayPointId),
          supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('arrival_point_id', relayPointId),
          supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('arrival_point_id', relayPointId).eq('status', 'ARRIVE_AU_RELAIS'),
          supabase.from('profiles_pro').select('credit_balance').eq('id', profile.id).single(),
          supabase.rpc('get_agency_total_earnings', { p_agency_id: profile.id }) // <-- APPEL DE LA FONCTION
        ]);

        if (packagesDepositedRes.error) throw packagesDepositedRes.error;
        if (packagesReceivedRes.error) throw packagesReceivedRes.error;
        if (packagesInStockRes.error) throw packagesInStockRes.error;
        if (profileRes.error) throw profileRes.error;
        if (totalEarningsRes.error) throw totalEarningsRes.error; // <-- VÉRIFICATION DE L'ERREUR

        let packagesDelivered = 0;
        if (deliveredShipmentIds.length > 0) {
          const { count, error } = await supabase.from('shipments').select('id', { count: 'exact', head: true }).eq('arrival_point_id', relayPointId).in('id', deliveredShipmentIds);
          if (error) throw error;
          packagesDelivered = count || 0;
        }

        const totalPackages = (packagesDepositedRes.count || 0) + (packagesReceivedRes.count || 0);
        const totalEarnings = totalEarningsRes.data || 0;
        const avgPackageValue = totalPackages > 0 ? totalEarnings / totalPackages : 0; // Calcul sur les gains
        const packagesReceived = packagesReceivedRes.count || 0;
        const completionRate = packagesReceived > 0 ? (packagesDelivered / packagesReceived) * 100 : 0;
        
        // --- MODIFICATION 3 : Mettre à jour l'état avec les nouvelles données ---
        setStats({
          relayPointId: relayPointId,
          totalPackages: totalPackages,
          packagesDeposited: packagesDepositedRes.count || 0,
          packagesReceived: packagesReceived,
          packagesInStock: packagesInStockRes.count || 0,
          packagesDelivered: packagesDelivered,
          creditBalance: profileRes.data?.credit_balance || 0,
          totalEarnings: totalEarnings, // <-- Utiliser les gains ici
          avgPackageValue: avgPackageValue,
          completionRate: completionRate
        });

      } catch (err: any) {
        console.error("Erreur lors de la récupération des statistiques:", err);
        setError(`Une erreur est survenue : ${err.message || "Une erreur inconnue est survenue"}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFreelanceData();
  }, [profile]);


  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
        <p className="text-gray-600 dark:text-gray-400">Chargement des statistiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-800"
      >
        <AlertTriangle className="h-8 w-8 mx-auto mb-4" />
        <h3 className="font-bold text-lg mb-2">Action requise</h3>
        <p className="text-sm">{error}</p>
        {error.includes("point relais") && (
          <button
            onClick={() => setActiveTab('profile')}
            className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          >
            Configurer mon point relais
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Carte du point relais */}
      {relayPointInfo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-8 rounded-3xl shadow-2xl text-white overflow-hidden"
        >
          <div className="absolute -bottom-10 -right-10 opacity-10">
            <MapPin className="w-40 h-40 transform rotate-12" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-200 mb-2">
                Votre Point Relais
              </p>
              <h3 className="text-3xl font-bold tracking-tight mb-2">
                {relayPointInfo.name}
              </h3>
              <p className="text-orange-100 max-w-lg">
                {relayPointInfo.address}
                {relayPointInfo.quartier && `, ${relayPointInfo.quartier}`}
              </p>
            </div>
            <motion.button
              onClick={() => setActiveTab('profile')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="flex-shrink-0 bg-white/20 backdrop-blur-sm text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 hover:bg-white/30 border border-white/20"
            >
              <Edit className="w-4 h-4" />
              Mettre à jour
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Package}
          title="Total Colis"
          value={stats?.totalPackages ?? 0}
          description="Colis traités (envoyés + reçus)"
          colorClass="border-orange-500"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          icon={ArrowUpRight}
          title="Colis Envoyés"
          value={stats?.packagesDeposited ?? 0}
          description="Déposés depuis votre point relais"
          colorClass="border-blue-500"
        />
        <StatCard
          icon={Archive}
          title="En Stock"
          value={stats?.packagesInStock ?? 0}
          description="En attente de retrait"
          colorClass="border-purple-500"
        />
        <StatCard
          icon={Users}
          title="Livrés"
          value={stats?.packagesDelivered ?? 0}
          description="Colis retirés par les destinataires"
          colorClass="border-green-500"
        />
      </div>

      {/* Statistiques financières et performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatCard
          icon={DollarSign}
          title="Chiffre d'Affaires"
          value={`${(stats?.totalEarnings ?? 0).toLocaleString('fr-FR')} FCFA`}
          description="Revenus générés par les expéditions"
          colorClass="border-green-500"
          trend={{ value: 8.3, isPositive: true }}
        />
        <StatCard
          icon={Wallet}
          title="Solde Crédit"
          value={`${(stats?.creditBalance ?? 0).toLocaleString('fr-FR')} FCFA`}
          description="Disponible pour les opérations"
          colorClass="border-teal-500"
        />
        <StatCard
          icon={Clock}
          title="Taux de Livraison"
          value={`${(stats?.completionRate ?? 0).toFixed(1)}%`}
          description="Colis livrés / Colis reçus"
          colorClass="border-indigo-500"
          trend={{ 
            value: (stats?.completionRate ?? 0) > 80 ? 5.2 : -2.1, 
            isPositive: (stats?.completionRate ?? 0) > 80 
          }}
        />
      </div>

      {/* Métrique supplémentaire */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl shadow-lg border border-orange-200 dark:border-gray-600"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                Valeur Moyenne par Colis
              </h4>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {(stats?.avgPackageValue ?? 0).toLocaleString('fr-FR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })} FCFA
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Revenue moyen par expédition
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl shadow-lg border border-blue-200 dark:border-gray-600"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                Colis Reçus
              </h4>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats?.packagesReceived ?? 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Arrivés à votre point relais
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Archive className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
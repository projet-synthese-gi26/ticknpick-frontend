// FICHIER : src/app/dashboard/LivreurOverview.tsx
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
  Truck,
  CheckCircle,
  Clock
} from 'lucide-react';

interface LivreurStats {
  assigned: number;
  inTransit: number;
  completedToday: number;
  creditBalance: number;
}

const StatCard = ({ icon: Icon, title, value, description, colorClass }: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  description: string;
  colorClass: string;
}) => (
  <motion.div
    whileHover={{ y: -5 }}
    className={`bg-white p-6 rounded-2xl shadow-lg border-l-4 ${colorClass} transition-all duration-300 hover:shadow-xl`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <div className="p-3 bg-gray-100 rounded-xl">
        <Icon className="h-6 w-6 text-gray-600" />
      </div>
    </div>
  </motion.div>
);

export default function LivreurOverview({ profile, setActiveTab }: { profile: UserProfile; setActiveTab: (tabId: string) => void; }) {
  const [stats, setStats] = useState<LivreurStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const today = new Date().toISOString().slice(0, 10);

        const { count: assignedCount } = await supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('livreur_id', profile.id)
          .eq('status', 'AU_DEPART');

        const { count: inTransitCount } = await supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('livreur_id', profile.id)
          .eq('status', 'EN_TRANSIT');
        
        const { count: completedTodayCount } = await supabase
            .from('shipments')
            .select('*', { count: 'exact', head: true })
            .eq('livreur_id', profile.id)
            .in('status', ['ARRIVE_AU_RELAIS', 'RECU'])
            .gte('updated_at', `${today}T00:00:00Z`)
            .lte('updated_at', `${today}T23:59:59Z`);

        setStats({
          assigned: assignedCount || 0,
          inTransit: inTransitCount || 0,
          completedToday: completedTodayCount || 0,
          creditBalance: (profile as any).credit_balance || 0,
        });
      } catch (error) {
        console.error("Erreur de chargement des stats livreur:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [profile.id, (profile as any).credit_balance]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-3xl font-bold text-gray-800">Bienvenue, {profile.name} !</h2>
            <p className="text-gray-500 mt-1">Voici le résumé de votre activité de livraison.</p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Clock} title="À récupérer" value={stats?.assigned ?? 0} description="Colis assignés, prêts pour la collecte" colorClass="border-orange-500" />
            <StatCard icon={Truck} title="En Transit" value={stats?.inTransit ?? 0} description="Colis actuellement en votre possession" colorClass="border-blue-500" />
            <StatCard icon={CheckCircle} title="Terminées (Auj.)" value={stats?.completedToday ?? 0} description="Livraisons effectuées aujourd'hui" colorClass="border-green-500" />
            <StatCard icon={Wallet} title="Solde Crédit" value={`${(stats?.creditBalance ?? 0).toLocaleString()} FCFA`} description="Votre solde actuel" colorClass="border-teal-500" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-2xl shadow-lg border flex flex-col justify-between"
            >
                <div>
                    <h3 className="font-bold text-lg text-gray-800 mb-2">Gérer mes livraisons</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Consultez la liste des colis à récupérer et à livrer. Mettez à jour leur statut en temps réel.
                    </p>
                </div>
                <button
                    onClick={() => setActiveTab('deliveries')}
                    className="w-full bg-orange-500 text-white font-semibold py-3 rounded-lg hover:bg-orange-600 transition-colors"
                >
                    Voir mes Livraisons
                </button>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-2xl shadow-lg border flex flex-col justify-between"
            >
                <div>
                    <h3 className="font-bold text-lg text-gray-800 mb-2">Crédit et Paiements</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Rechargez votre compte de crédit pour pouvoir prendre en charge des livraisons.
                    </p>
                </div>
                <button
                    onClick={() => setActiveTab('credit')}
                    className="w-full bg-teal-500 text-white font-semibold py-3 rounded-lg hover:bg-teal-600 transition-colors"
                >
                    Recharger mon Crédit
                </button>
            </motion.div>
        </div>
    </div>
  );
}
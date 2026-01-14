'use client';

import React, { useState, useEffect } from 'react';
import type { UserProfile } from './page';
import { motion } from 'framer-motion';
import {
  Wallet, Truck, CheckCircle, Clock, MapPin, 
  Power, Loader2, AlertCircle, TrendingUp
} from 'lucide-react';
import { delivererService } from '@/services/delivererService';
import FeedbackAlert from '@/components/ui/FeedbackAlert';

interface Stats {
  completed: number;
  earnings: number;
  inQueue: number;
  rating: number;
}

const KpiCard = ({ title, value, subtitle, icon: Icon, delay }: any) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
    >
        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
        <div className="flex justify-between items-start relative z-10">
           <div>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
               <h3 className="text-3xl font-black text-slate-800 dark:text-white">{value}</h3>
               {subtitle && <p className="text-xs font-medium text-violet-500 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> {subtitle}</p>}
           </div>
           <div className="p-3 bg-violet-50 dark:bg-violet-900/30 rounded-xl text-violet-600 dark:text-violet-300 shadow-sm">
               <Icon className="w-6 h-6"/>
           </div>
        </div>
    </motion.div>
);

export default function LivreurOverview({ profile, setActiveTab }: { profile: UserProfile; setActiveTab: (tabId: string) => void; }) {
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState<Stats>({ completed: 0, earnings: 0, inQueue: 0, rating: 4.8 });
  const [alert, setAlert] = useState<{show: boolean, type: any, msg: string}>({show: false, type: 'info', msg: ''});

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const deliveries = await delivererService.getMyDeliveries();
        
        // Calculs
        const active = deliveries.filter(d => ['ASSIGNED_TO_DELIVERER', 'IN_TRANSIT'].includes(d.currentStatus)).length;
        const done = deliveries.filter(d => d.currentStatus === 'DELIVERED').length;
        // Simulation earnings (deliveryFee)
        const totalEarned = deliveries
            .filter(d => d.currentStatus === 'DELIVERED')
            .reduce((sum, d) => sum + d.deliveryFee, 0);

        setStats(prev => ({
             ...prev,
             completed: done,
             earnings: totalEarned,
             inQueue: active
        }));

      } catch (e: any) {
        setAlert({show: true, type: 'error', msg: "Impossible de charger les statistiques"});
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [profile]);

  const toggleStatus = () => {
      setIsOnline(!isOnline);
      setAlert({show: true, type: isOnline ? 'warning' : 'success', msg: !isOnline ? "Vous êtes EN LIGNE. Prêt à recevoir des courses." : "Mode HORS LIGNE activé."});
  };

  if(loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-violet-500"/></div>;

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
        <FeedbackAlert 
            isVisible={alert.show} onClose={() => setAlert({...alert, show:false})} 
            type={alert.type} message={alert.msg} 
        />

        {/* Header Hero - VIOLET */}
        <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl overflow-hidden">
             {/* Déco */}
             <div className="absolute right-0 top-0 w-64 h-64 bg-violet-500/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/2"></div>
             
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                 <div className="flex items-center gap-4">
                     <div className="p-1 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl shadow-lg">
                        <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center">
                            {profile.photoUrl ? (
                                <img src={profile.photoUrl} className="w-full h-full object-cover rounded-xl"/>
                            ) : (
                                <Truck className="w-8 h-8 text-violet-400"/>
                            )}
                        </div>
                     </div>
                     <div>
                         <h2 className="text-2xl font-black">{profile.manager_name}</h2>
                         <p className="text-slate-400 text-sm flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-violet-400"/> {isOnline ? (stats.inQueue > 0 ? "En Livraison" : "En attente de courses") : "Hors Service"}
                         </p>
                     </div>
                 </div>

                 <button 
                     onClick={toggleStatus}
                     className={`px-6 py-3 rounded-xl font-bold flex items-center gap-3 transition-all shadow-lg active:scale-95 ${
                         isOnline 
                         ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/50 ring-2 ring-violet-500 ring-offset-2 ring-offset-slate-900' 
                         : 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
                     }`}
                 >
                     <Power className="w-5 h-5"/>
                     {isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
                 </button>
             </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard icon={Wallet} title="Portefeuille" value={stats.earnings.toLocaleString() + " F"} subtitle="+12% cette semaine" delay={0.1}/>
            <KpiCard icon={Truck} title="En Cours" value={stats.inQueue} delay={0.2}/>
            <KpiCard icon={CheckCircle} title="Livrées" value={stats.completed} subtitle="Total historique" delay={0.3}/>
            <KpiCard icon={Clock} title="Note Moyenne" value={stats.rating + "/5"} delay={0.4}/>
        </div>

        {/* Actions Rapides */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-violet-500/20 relative overflow-hidden flex flex-col justify-between group cursor-pointer hover:shadow-2xl transition-all"
                 onClick={() => setActiveTab('deliveries')}>
                 <div className="relative z-10">
                     <h3 className="text-2xl font-black mb-2">Carte des Courses</h3>
                     <p className="text-violet-100 mb-6 max-w-sm">Trouvez les colis disponibles autour de vous et commencez une tournée optimisée.</p>
                     <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-xl text-sm font-bold group-hover:bg-white group-hover:text-violet-600 transition-colors">
                        Accéder <Truck className="w-4 h-4"/>
                     </span>
                 </div>
                 <MapPin className="absolute -right-6 -bottom-6 w-48 h-48 text-black/10 group-hover:scale-110 transition-transform duration-500"/>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-violet-300 transition-all flex flex-col justify-between">
                 <div>
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Wallet className="w-5 h-5 text-violet-500"/> Finance & Crédit</h3>
                     <p className="text-slate-500 text-sm">Votre solde doit être positif pour accepter des courses Cash on Delivery.</p>
                 </div>
                 <div className="mt-6 flex gap-3">
                     <button onClick={() => setActiveTab('credit')} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                         Historique
                     </button>
                     <button onClick={() => setActiveTab('credit')} className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg transition">
                         Recharger
                     </button>
                 </div>
            </div>
        </div>

    </div>
  );
}
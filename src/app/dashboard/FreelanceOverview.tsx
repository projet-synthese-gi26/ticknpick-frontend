// FICHIER: src/app/dashboard/FreelanceOverview.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, ArrowUpRight, Archive, Wallet, 
  Loader2, MapPin, ArrowDownLeft, Truck, Building, Clock, TrendingUp, Activity
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

import type { UserProfile } from './page';
import { relayPointService, RelayPoint } from '@/services/relayPointService';

// Composants Enfants (nécessaires pour les modales d'action)
import { DepotColis } from '../depot/depot';
import { WithdrawPackagePage } from '../withdraw-package/retrait';

// Enregistrement des composants ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

// --- Interfaces ---
interface FreelanceStats {
  totalTraffic: number;
  toReceive: number;
  toSend: number;
  inStock: number;
  completed: number;
  earnings: number;
}

interface PackageItem {
    id: string;
    trackingNumber: string;
    status: string;
    createdAt: Date;
    _ui_direction: 'INCOMING' | 'OUTGOING';
}

// --- FONCTIONS UTILITAIRES LOCALES ---

// 1. Extraction sécurisée de tableau (Logique demandée en Frontend)
const safeExtractArray = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.packages && Array.isArray(data.packages)) return data.packages; // Cas backend: { packages: [...] }
    if (data.content && Array.isArray(data.content)) return data.content;    // Cas Spring Data: { content: [...] }
    if (data.data && Array.isArray(data.data)) return data.data;             // Cas standard REST: { data: [...] }
    return [];
};

const getSafeString = (val: any) => val ? String(val) : '';

// --- Carte Statistique ---
const StatCard = ({ icon: Icon, title, value, description, colorClass }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border-l-4 ${colorClass} flex flex-col justify-between h-full hover:shadow-lg transition-all`}
  >
    <div className="flex justify-between items-start mb-2">
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
            <Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </div>
    </div>
    <p className="text-xs text-gray-400 mt-2">{description}</p>
  </motion.div>
);

export default function FreelanceOverview({ profile, setActiveTab }: { profile: UserProfile; setActiveTab: (tab: string) => void; }) {
  // États Données
  const [stats, setStats] = useState<FreelanceStats>({ totalTraffic: 0, toReceive: 0, toSend: 0, inStock: 0, completed: 0, earnings: 0 });
  const [myRelayPoint, setMyRelayPoint] = useState<RelayPoint | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'depot' | 'retrait'>('overview');
  
  // États Graphiques
  const [lineChartData, setLineChartData] = useState<any>(null);
  const [doughnutChartData, setDoughnutChartData] = useState<any>(null);

  // États UI
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CHARGEMENT ET TRAITEMENT
  const loadData = useCallback(async () => {
    if(!profile || !profile.id) return;

    setIsLoading(true);
    setError(null);

    try {
        console.log("📊 [Freelance Dashboard] Initialisation chargement...");

        // 1. Récupérer la liste de tous les points relais pour identifier le mien
        // Utilisation de safeExtractArray sur la réponse du service pour être sûr
        const allPointsRaw = await relayPointService.getAllRelayPoints();
        const allPoints = safeExtractArray(allPointsRaw);
        
        const myPoint = allPoints.find((p: any) => String(p.ownerId) === String(profile.id));

        if (!myPoint) {
            console.warn("⚠️ Aucun point relais trouvé pour user ID:", profile.id);
            setError("NO_RELAY_POINT");
            setIsLoading(false);
            return; 
        }

        setMyRelayPoint(myPoint);
        const relayId = myPoint.id;
        console.log(`✅ Relais trouvé: ${myPoint.relayPointName} (ID: ${relayId})`);

        // 2. Récupération Parallèle des colis
        const [rawExpedition, rawPickup, rawHistory] = await Promise.all([
            relayPointService.getPackagesForExpedition(relayId).catch(err => { console.warn("Expedition fetch err", err); return []; }),
            relayPointService.getPackagesForPickup(relayId).catch(err => { console.warn("Pickup fetch err", err); return []; }),
            relayPointService.getPackagesByRelayPoint(relayId).catch(err => { console.warn("History fetch err", err); return []; })
        ]);

        // 3. Nettoyage des tableaux (Extraction Sûre)
        const expeditionList = safeExtractArray(rawExpedition);
        const pickupList = safeExtractArray(rawPickup);
        const historyList = safeExtractArray(rawHistory);

        console.log(`📦 Stats Brutes Backend : Expedition=${expeditionList.length}, Pickup=${pickupList.length}, History=${historyList.length}`);

        // 4. Aggrégation des données (PackageItem)
        const packagesMap = new Map<string, PackageItem>();

        const normalize = (p: any, directionFallback: 'INCOMING' | 'OUTGOING'): PackageItem => {
             const id = getSafeString(p.id || p.packageId);
             // Logique direction
             const depId = getSafeString(p.departureRelayPointId || p.departurePointId);
             const isOutgoing = depId === String(relayId);

             return {
                 id,
                 trackingNumber: p.trackingNumber || p.tracking_number || "N/A",
                 status: (p.status || p.currentStatus || "UNKNOWN").toUpperCase(),
                 createdAt: new Date(p.createdAt || p.created_at || Date.now()),
                 _ui_direction: isOutgoing ? 'OUTGOING' : directionFallback
             };
        };

        // Priorité aux listes spécifiques
        expeditionList.forEach(p => packagesMap.set(p.trackingNumber||p.id, normalize(p, 'OUTGOING')));
        pickupList.forEach(p => packagesMap.set(p.trackingNumber||p.id, normalize(p, 'INCOMING')));
        // Compléter avec historique (pour les livrés)
        historyList.forEach(p => {
            const key = p.trackingNumber || p.id;
            if(!packagesMap.has(key)) packagesMap.set(key, normalize(p, 'INCOMING'));
        });

        const allPackages = Array.from(packagesMap.values());

        // 5. Calcul KPIs
        const countToSend = allPackages.filter(p => p._ui_direction === 'OUTGOING' && ['PRE_REGISTERED', 'PENDING', 'EN_ATTENTE'].some(s => p.status.includes(s))).length;
        const countIncoming = allPackages.filter(p => p._ui_direction === 'INCOMING' && ['TRANSIT', 'DEPART', 'ROUTE'].some(s => p.status.includes(s))).length;
        const countStock = allPackages.filter(p => p._ui_direction === 'INCOMING' && ['ARRIVE', 'STOCK', 'AT_ARRIVAL'].some(s => p.status.includes(s)) && !['RECU', 'LIVRE'].some(s => p.status.includes(s))).length;
        const countCompleted = allPackages.filter(p => ['RECU', 'LIVRE', 'DELIVERED', 'WITHDRAWN'].some(s => p.status.includes(s))).length;

        setStats({
            totalTraffic: allPackages.length,
            toSend: countToSend,
            toReceive: countIncoming,
            inStock: countStock,
            completed: countCompleted,
            earnings: countCompleted * 150 + countToSend * 100 // Est. 100F dépôt, 150F retrait
        });

        // 6. Génération des Données Graphiques (Dynamique)

        // --- GRAPHIQUE 1 : Volume sur 7 jours (Line Chart) ---
        const daysMap = new Map<string, number>();
        const today = new Date();
        const labels = [];
        // Init des 7 derniers jours
        for(let i=6; i>=0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); // "12 Jan"
            // Clé technique de comparaison
            const keyComp = d.toISOString().slice(0, 10); // "2023-01-12"
            labels.push(dateStr);
            daysMap.set(keyComp, 0);
        }

        // Remplissage avec données réelles
        allPackages.forEach(p => {
            const dateKey = p.createdAt.toISOString().slice(0, 10);
            if (daysMap.has(dateKey)) {
                daysMap.set(dateKey, (daysMap.get(dateKey) || 0) + 1);
            }
        });

        setLineChartData({
            labels,
            datasets: [{
                label: 'Colis traités',
                data: Array.from(daysMap.values()),
                borderColor: 'rgb(249, 115, 22)',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                fill: true,
                tension: 0.4
            }]
        });

        // --- GRAPHIQUE 2 : Répartition (Doughnut) ---
        setDoughnutChartData({
            labels: ['En Stock', 'À Expédier', 'Terminés', 'En Approche'],
            datasets: [{
                data: [countStock, countToSend, countCompleted, countIncoming],
                backgroundColor: [
                    '#10b981', // Green (Stock)
                    '#f59e0b', // Yellow (ToSend)
                    '#6366f1', // Indigo (Completed)
                    '#3b82f6'  // Blue (Incoming)
                ],
                borderWidth: 0
            }]
        });

    } catch (e: any) {
        console.error("❌ Erreur fatale FreelanceOverview:", e);
        setError(e.message || "Une erreur technique est survenue.");
    } finally {
        setIsLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
      loadData();
  }, [loadData]);


  // --- UI ---

  const handleCloseAction = () => { 
      setActiveView('overview'); 
      loadData(); // Rafraichir après un dépôt ou retrait
  };

  // 1. Écran Dépôt / Retrait
  if (activeView !== 'overview') {
      return (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 min-h-screen overflow-hidden animate-in fade-in zoom-in-95">
               <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50">
                    <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                         {activeView === 'depot' ? <Package className="text-orange-500"/> : <Archive className="text-green-500"/>}
                         {activeView === 'depot' ? 'Module de Dépôt' : 'Module de Retrait'}
                    </h2>
                    <button onClick={handleCloseAction} className="text-xs font-bold px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg shadow-sm hover:bg-gray-50 transition">
                        Fermer & Rafraîchir
                    </button>
               </div>
               {activeView === 'depot' ? 
                   <DepotColis onClose={handleCloseAction} onSuccess={handleCloseAction} /> : 
                   <WithdrawPackagePage onClose={handleCloseAction} onSuccess={handleCloseAction} />
               }
          </div>
      );
  }

  // 2. Écran Loading
  if (isLoading) {
      return <div className="flex h-96 items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>;
  }

  // 3. Écran Pas de Point Relais (Bienvenue)
  if (error === 'NO_RELAY_POINT') {
      return (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border-2 border-dashed border-orange-200 dark:border-gray-700 text-center p-6">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-full mb-6 animate-bounce">
                  <Building className="w-20 h-20 text-orange-500" />
              </div>
              <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-3">Bienvenue Partenaire !</h2>
              <p className="text-slate-500 dark:text-gray-400 max-w-lg mb-8 text-lg">
                  Votre compte Freelance est actif, mais vous devez configurer votre <strong>Point Relais</strong> pour commencer l'activité.
              </p>
              <button 
                 onClick={() => setActiveTab('profile')}
                 className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition transform hover:scale-105 flex items-center gap-2"
              >
                  <Building className="w-5 h-5" />
                  Créer mon Point Relais maintenant
              </button>
          </div>
      );
  }

  // 4. Écran Erreur Technique
  if (error) {
       return (
        <div className="p-8 text-center border-2 border-red-200 bg-red-50 rounded-xl">
            <p className="text-red-600 font-bold mb-2">Une erreur est survenue lors du chargement.</p>
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <button onClick={loadData} className="bg-white border border-red-200 px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50">Réessayer</button>
        </div>
       )
  }

  // 5. DASHBOARD PRINCIPAL
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        
        {/* EN-TÊTE (HEADER) */}
        <div className="relative bg-slate-900 dark:bg-black rounded-3xl p-8 text-white shadow-2xl overflow-hidden">
             <div className="absolute right-0 top-0 w-96 h-96 bg-orange-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
             
             <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8 items-start lg:items-end">
                 <div>
                     <div className="flex items-center gap-3 mb-3">
                         <span className="p-2 bg-white/10 backdrop-blur rounded-xl border border-white/10 shadow-inner">
                            <Building className="w-8 h-8 text-orange-400" />
                         </span>
                         <div>
                            <h2 className="text-3xl font-black tracking-tight">{myRelayPoint?.relayPointName || "Mon Point Relais"}</h2>
                            <div className="flex gap-2 mt-1">
                                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 font-bold uppercase">En Ligne</span>
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 font-bold uppercase">Freelance</span>
                            </div>
                         </div>
                     </div>
                     <p className="text-gray-300 flex items-center gap-2 text-sm font-medium bg-black/20 px-3 py-1 rounded-full w-fit">
                        <MapPin className="w-4 h-4 text-orange-500"/> {myRelayPoint?.address || myRelayPoint?.relay_point_address || "Adresse non définie"}
                     </p>
                 </div>

                 <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                     <button onClick={() => setActiveView('depot')} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-orange-900/20 transition active:scale-95">
                         <ArrowUpRight className="w-5 h-5"/> Dépôt Colis
                     </button>
                     <button onClick={() => setActiveView('retrait')} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-2xl backdrop-blur transition active:scale-95">
                         <ArrowDownLeft className="w-5 h-5"/> Retrait Client
                     </button>
                 </div>
             </div>
        </div>

        {/* KPIS (STAT CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard 
                title="À Expédier" value={stats.toSend} description="Départs en attente" 
                icon={Clock} colorClass="border-yellow-500" 
            />
            <StatCard 
                title="En Approche" value={stats.toReceive} description="Arrivent vers vous" 
                icon={Truck} colorClass="border-blue-500" 
            />
            <StatCard 
                title="En Stock" value={stats.inStock} description="Prêts pour retrait" 
                icon={Archive} colorClass="border-green-500" 
            />
            <StatCard 
                title="Revenus (Est.)" value={`${stats.earnings.toLocaleString()} F`} description="Total commissions" 
                icon={Wallet} colorClass="border-indigo-500" 
            />
        </div>

        {/* SECTION GRAPHIQUES (Grid layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Chart 1: Évolution Activité */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                           <Activity className="w-5 h-5 text-orange-500"/> Activité (7 jours)
                        </h3>
                        <p className="text-xs text-gray-500">Nombre de colis traités par jour</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-orange-50 text-orange-700 rounded-full border border-orange-100">
                        Semaine
                    </span>
                </div>
                
                <div className="h-64 w-full">
                    {lineChartData ? (
                        <Line 
                           data={lineChartData} 
                           options={{
                               responsive: true,
                               maintainAspectRatio: false,
                               scales: {
                                   y: { beginAtZero: true, grid: { display: false } },
                                   x: { grid: { display: false } }
                               },
                               plugins: {
                                   legend: { display: false },
                                   tooltip: {
                                       backgroundColor: '#1e293b',
                                       padding: 10,
                                       titleFont: { size: 13 },
                                       bodyFont: { size: 14, weight: 'bold' },
                                       displayColors: false,
                                   }
                               }
                           }} 
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">Pas de données</div>
                    )}
                </div>
            </div>

            {/* Chart 2: Répartition Donut */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                 <div className="mb-6">
                     <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">État du Stock</h3>
                     <p className="text-xs text-gray-500">Répartition actuelle des colis</p>
                 </div>

                 <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
                      <div className="w-48 h-48 relative z-10">
                         {doughnutChartData && <Doughnut data={doughnutChartData} options={{ cutout: '70%', plugins: { legend: { display: false } } }} />}
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
                           <span className="text-3xl font-black text-slate-800 dark:text-white">{stats.inStock + stats.toSend + stats.toReceive}</span>
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actifs</span>
                      </div>
                 </div>

                 {/* Légende Custom */}
                 <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">En Stock ({stats.inStock})</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">Départs ({stats.toSend})</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">Approche ({stats.toReceive})</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">Terminés ({stats.completed})</span>
                      </div>
                 </div>
            </div>
        </div>
    </div>
  );
}
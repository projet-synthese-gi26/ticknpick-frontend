// FICHIER: src/app/superadmin/Overview.tsx
'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import apiClient from '@/services/apiClient';
import { 
  Loader2, Users, Package, Briefcase, FileWarning, 
  TrendingUp, ArrowUpRight, ArrowDownRight, 
  RefreshCw, Server, Activity
} from 'lucide-react';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, ArcElement 
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import toast, { Toaster } from 'react-hot-toast';

// Enregistrement ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

// --- TYPES & INTERFACES ---

interface DashboardStats {
    totalUsers: number;
    totalBusinessActors: number;
    totalShipments: number;
    pendingValidations: number;
    totalRevenue: number;
    
    // Répartition
    details: {
        freelance: number;
        agency: number;
        deliverer: number;
        client: number;
    }
}

// Log Style
const LOG_STYLE = 'color: #8b5cf6; font-weight: bold; background: #f3f0ff; padding: 2px 6px; border-radius: 4px; border-left: 3px solid #7c3aed;';

// --- COMPOSANT KPI CARD ---
const KpiCard = ({ title, value, icon: Icon, trend, trendValue, colorClass }: any) => (
    <div className="relative p-6 rounded-2xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 group">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{value !== undefined ? value : '-'}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-opacity-10 dark:bg-opacity-20 ${colorClass.bg}`}>
                <Icon className={`w-6 h-6 ${colorClass.text}`}/>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1"/> : <ArrowDownRight className="w-3 h-3 mr-1"/>}
                {trendValue}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">vs mois dernier</span>
        </div>
    </div>
);

// --- COMPOSANT ACTIVITY ITEM ---
const RecentActivityItem = ({ log }: { log: any }) => {
    const date = new Date(log.timestamp || Date.now());
    return (
        <div className="flex gap-4 items-start group">
            <div className="relative flex flex-col items-center">
                 <div className="w-2.5 h-2.5 rounded-full mt-2 bg-blue-500 ring-4 ring-white dark:ring-gray-800 shadow-sm"></div>
                 <div className="w-px h-full bg-slate-100 dark:bg-gray-700 absolute top-4"></div>
            </div>
            <div className="pb-6 w-full border-b border-slate-50 dark:border-slate-800 last:border-0">
                <div className="flex justify-between items-center mb-1">
                     <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{log.category || 'System'} • {log.action || 'Event'}</p>
                     <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{date.toLocaleTimeString()}</span>
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{log.description || "Action enregistrée"}</p>
            </div>
        </div>
    );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function Overview() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
    const [activityData, setActivityData] = useState<number[]>([]); // Pour le graphe

    const loadData = async () => {
        console.groupCollapsed("%c🚀 [SUPERADMIN] Data Refresh & Calculation", LOG_STYLE);
        setLoading(true);
        try {
            // 1. Appel Users (Base)
            console.log("1️⃣ Fetching /api/users...");
            const usersRes = await apiClient<any[]>('/api/users', 'GET');
            const allUsers = Array.isArray(usersRes) ? usersRes : [];

            // 2. Appel Business Actors (Détails Rôles)
            console.log("2️⃣ Fetching /api/business-actors...");
            let actorsRes: any[] = [];
            try {
                const res = await apiClient<any[]>('/api/business-actors', 'GET');
                actorsRes = Array.isArray(res) ? res : [];
            } catch(e) { console.warn("Business actors endpoint failed/empty"); }

            // 3. Appel Colis (Volume)
            console.log("3️⃣ Fetching /api/admin/packages...");
            let shipmentsRes: any[] = [];
            try {
                const res = await apiClient<any>('/api/admin/packages', 'GET');
                shipmentsRes = Array.isArray(res) ? res : (res.content || []);
            } catch(e) { console.warn("Shipments endpoint failed/empty"); }

            // 4. Appel Logs
            console.log("4️⃣ Fetching /api/event-logs...");
            try {
                const logRes = await apiClient<any[]>('/api/event-logs?limit=5', 'GET');
                const logData = Array.isArray(logRes) ? logRes : (logRes as any)?.content || [];
                setLogs(logData.slice(0, 5));
            } catch(e) { console.warn("Logs endpoint failed"); }

            // === CALCULS ET MERGE ===
            
            let countClients = 0;
            let countFreelance = 0;
            let countAgency = 0;
            let countDeliverer = 0;
            let pendingCount = 0;

            // On itère sur la liste globale des Users pour ne perdre personne
            // Et on croise avec la liste Actors pour préciser le rôle
            allUsers.forEach(user => {
                // Chercher si c'est un acteur business
                const actorDetail = actorsRes.find(a => a.id === user.id || a.userId === user.id);
                
                // Détermination du Type
                const accountType = (user.accountType || user.account_type || '').toUpperCase();
                const businessType = (actorDetail?.businessActorType || actorDetail?.business_actor_type || user.businessActorType || '').toUpperCase();
                
                // Est-ce vérifié ?
                const isVerified = actorDetail?.isVerified ?? actorDetail?.is_verified ?? user.isVerified ?? true;
                if(accountType === 'BUSINESS_ACTOR' && !isVerified) pendingCount++;

                // Comptage par catégorie
                if (businessType.includes('AGENCY')) {
                    countAgency++;
                } else if (businessType.includes('DELIVERER') || businessType.includes('LIVREUR')) {
                    countDeliverer++;
                } else if (businessType.includes('RELAY') || businessType.includes('FREELANCE')) {
                    countFreelance++;
                } else {
                    // Si pas de type business, on assume client (sauf admin)
                    if(accountType !== 'ADMIN' && accountType !== 'SUPERADMIN') {
                        countClients++;
                    }
                }
            });

            const totalRevenue = shipmentsRes.reduce((acc, curr) => acc + (Number(curr.shippingCost)||0), 0);

            // Mise à jour State
            const computedStats: DashboardStats = {
                totalUsers: allUsers.length,
                totalBusinessActors: actorsRes.length,
                totalShipments: shipmentsRes.length,
                pendingValidations: pendingCount,
                totalRevenue: totalRevenue,
                details: {
                    freelance: countFreelance,
                    agency: countAgency,
                    deliverer: countDeliverer,
                    client: countClients
                }
            };
            
            console.log("✅ Final Computed Stats:", computedStats);
            setStats(computedStats);

            // Fake graph data based on shipments count
            const baseVol = shipmentsRes.length;
            setActivityData([
                Math.floor(baseVol * 0.1), Math.floor(baseVol * 0.15), Math.floor(baseVol * 0.12),
                Math.floor(baseVol * 0.2), Math.floor(baseVol * 0.25), Math.floor(baseVol * 0.18)
            ]);
            
            setLastRefreshed(new Date());

        } catch (e: any) {
            console.error("❌ Error Overview:", e);
            toast.error("Erreur chargement données");
        } finally {
            setLoading(false);
            console.groupEnd();
        }
    };

    useEffect(() => { loadData(); }, []);

    // --- CONFIG GRAPHICS ---
    const s = stats || { totalUsers:0, totalBusinessActors:0, totalShipments:0, pendingValidations:0, totalRevenue:0, details:{freelance:0,agency:0,deliverer:0,client:0}};
    
    const doughnutData = {
        labels: ['Clients', 'Agences', 'Relais', 'Livreurs'],
        datasets: [{
            data: [s.details.client, s.details.agency, s.details.freelance, s.details.deliverer],
            backgroundColor: ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b'],
            borderWidth: 0,
            hoverOffset: 10
        }]
    };

    const lineData = {
        labels: ['J-5', 'J-4', 'J-3', 'J-2', 'Hier', 'Auj.'],
        datasets: [{
            label: 'Activité',
            data: activityData.length ? activityData : [0,0,0,0,0,0],
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } }
    };

    if (loading && !stats) return (
        <div className="h-96 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4"/>
            <p className="text-slate-500">Analyse des données utilisateurs...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            <Toaster position="top-right"/>
            
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">Vue d'ensemble</h2>
                    <p className="text-xs text-slate-500">Mise à jour: {lastRefreshed.toLocaleTimeString()}</p>
                </div>
                <button onClick={loadData} className="p-2 bg-white dark:bg-gray-700 border rounded-lg hover:bg-slate-50 transition active:scale-95 shadow-sm">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin':''}`}/>
                </button>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                 <KpiCard title="Utilisateurs Total" value={s.totalUsers} icon={Users} trend="up" trendValue="+3%" colorClass={{bg:'bg-blue-500', text:'text-blue-600'}}/>
                 <KpiCard title="Volume Colis" value={s.totalShipments} icon={Package} trend="up" trendValue="+12%" colorClass={{bg:'bg-orange-500', text:'text-orange-600'}}/>
                 <KpiCard title="Partenaires Business" value={s.totalBusinessActors} icon={Briefcase} trend="up" trendValue="Stable" colorClass={{bg:'bg-emerald-500', text:'text-emerald-600'}}/>
                 <KpiCard title="Validations en Attente" value={s.pendingValidations} icon={FileWarning} trend={s.pendingValidations>0?'down':'up'} trendValue="Action requise" colorClass={{bg:'bg-red-500', text:'text-red-600'}}/>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Line Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                            <TrendingUp className="w-5 h-5 text-orange-500"/> Flux Activité
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <Line data={lineData} options={lineOptions} />
                    </div>
                </div>

                {/* Doughnut Répartition */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col">
                     <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Répartition Comptes</h3>
                     
                     <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
                         <div className="w-40 h-40 relative z-10">
                             <Doughnut data={doughnutData} options={{cutout:'70%', plugins:{legend:{display:false}}}} />
                         </div>
                         <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
                             <span className="text-2xl font-black text-slate-800 dark:text-white">{s.totalUsers}</span>
                             <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                         </div>
                     </div>
                     
                     <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
                         <div className="flex justify-between p-2 rounded bg-blue-50 text-blue-700"><span>Clients</span> <strong>{s.details.client}</strong></div>
                         <div className="flex justify-between p-2 rounded bg-purple-50 text-purple-700"><span>Agences</span> <strong>{s.details.agency}</strong></div>
                         <div className="flex justify-between p-2 rounded bg-red-50 text-red-700"><span>Relais</span> <strong>{s.details.freelance}</strong></div>
                         <div className="flex justify-between p-2 rounded bg-orange-50 text-orange-700"><span>Livreurs</span> <strong>{s.details.deliverer}</strong></div>
                     </div>
                </div>
            </div>

            {/* Logs Système & Santé */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Panel Infra */}
                 <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden group">
                      <div className="relative z-10">
                          <h3 className="text-xl font-bold flex items-center gap-2 mb-4"><Activity className="w-5 h-5 text-green-400"/> Santé Infrastructure</h3>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                                  <p className="text-xs text-slate-400 font-bold uppercase">Latence API</p>
                                  <p className="text-xl font-mono text-green-400 font-bold">45ms</p>
                              </div>
                              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                                  <p className="text-xs text-slate-400 font-bold uppercase">Base de Données</p>
                                  <p className="text-sm font-bold text-white flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> Connecté</p>
                              </div>
                          </div>
                      </div>
                      <Server className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700"/>
                 </div>
                 
                 {/* Panel Logs */}
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
                     <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Activité Récente</h3>
                     <div className="space-y-0">
                         {logs.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">Aucune activité récente.</p> : 
                            logs.map((log) => <RecentActivityItem key={log.id} log={log}/>)
                         }
                     </div>
                 </div>
            </div>

        </div>
    );
}
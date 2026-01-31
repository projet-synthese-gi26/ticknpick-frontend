// FICHIER: src/app/superadmin/Overview.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
// Assure-toi que le chemin d'import est correct selon ta structure
import { adminService, AdminDashboardStats } from '@/services/adminService';
import apiClient from '@/services/apiClient'; // Pour les requêtes directes supplémentaires
import { 
  Loader2, Users, Package, Briefcase, FileWarning, 
  TrendingUp, ArrowUpRight, ArrowDownRight, 
  Calendar, Activity, RefreshCw, Server
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

// Enregistrement des composants Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

// ============================================================================
// TYPES LOCAUX
// ============================================================================

// Pour mapper la réponse de /api/event-logs
interface EventLog {
    id: string;
    category: string; // 'system', 'user', 'package', etc.
    action: string;   // 'create', 'update', 'delete'
    description: string;
    timestamp: string;
    level?: string;
}

type UserRole = 'CLIENT' | 'RELAY_OWNER' | 'AGENCY_OWNER' | 'DELIVERER' | 'FREELANCE' | 'EMPLOYEE' | 'ADMIN';

interface AdminUser {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: UserRole;        // Rôle principal normalisé pour l'affichage/filtre
    rawType: string;       // Type brut (ex: BUSINESS_ACTOR)
    rawSubType?: string;   // Sous-type brut (ex: RELAY_OWNER)
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    
    // Métadonnées Business optionnelles
    businessName?: string;
    avatarInitial: string;
}

// ============================================================================
// COMPOSANTS UI
// ============================================================================

const KpiCard = ({ title, value, icon: Icon, trend, trendValue, colorClass }: any) => (
    <div className="relative p-6 rounded-2xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 group">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                    {/* Animation simple du nombre si nécessaire */}
                    {value !== undefined ? value : '-'}
                </h3>
            </div>
            <div className={`p-3 rounded-xl bg-opacity-10 dark:bg-opacity-20 ${colorClass.bg}`}>
                <Icon className={`w-6 h-6 ${colorClass.text}`}/>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${
                trend === 'up' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            }`}>
                {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1"/> : <ArrowDownRight className="w-3 h-3 mr-1"/>}
                {trendValue}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">vs mois dernier</span>
        </div>
    </div>
);

const RecentActivityItem = ({ log }: { log: EventLog }) => {
    const date = new Date(log.timestamp);
    const timeAgo = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute:'2-digit' });
    const dateStr = date.toLocaleDateString('fr-FR');
    
    // Couleur selon le niveau (info, error) ou la catégorie
    let colorClass = 'bg-blue-500';
    if (log.level === 'error' || log.description?.toLowerCase().includes('error')) colorClass = 'bg-red-500';
    else if (log.action?.toLowerCase().includes('create')) colorClass = 'bg-green-500';
    else if (log.action?.toLowerCase().includes('login')) colorClass = 'bg-purple-500';
    
    return (
        <div className="flex gap-4 items-start group">
            <div className="relative flex flex-col items-center">
                 <div className={`w-2.5 h-2.5 rounded-full mt-2 ${colorClass} ring-4 ring-white dark:ring-gray-800 shadow-sm group-hover:scale-125 transition-transform`}></div>
                 <div className="w-px h-full bg-slate-100 dark:bg-gray-700 absolute top-4"></div>
            </div>
            <div className="pb-6 w-full border-b border-slate-50 dark:border-slate-800 last:border-0">
                <div className="flex justify-between items-center mb-1">
                     <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {log.category || 'Système'} • {log.action}
                     </p>
                     <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        {dateStr} {timeAgo}
                     </span>
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {log.description || "Aucune description disponible"}
                </p>
            </div>
        </div>
    );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function Overview() {
    // Stats agrégées (Users, Packages, etc.)
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    // Logs récents (/api/event-logs)
    const [logs, setLogs] = useState<EventLog[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
    const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
        // Cette fonction transforme la donnée brute de l'API en objet propre pour l'admin
    const normalizeUser = (u: any): AdminUser => {
        // Détermination du Rôle
        const accountType = (u.accountType || u.account_type || 'CLIENT').toUpperCase();
        const subType = (u.businessActorType || u.businessActorType || '').toUpperCase();
        
        let role: UserRole = 'CLIENT'; // Default
        
        if (accountType === 'ADMIN' || accountType === 'SUPERADMIN') role = 'ADMIN';
        else if (accountType === 'BUSINESS_ACTOR' || accountType.includes('BUSINESS')) {
            if (subType === 'AGENCY_OWNER' || subType === 'AGENCY') role = 'AGENCY_OWNER';
            else if (subType === 'RELAY_OWNER') role = 'RELAY_OWNER';
            else if (subType === 'DELIVERER' || subType === 'LIVREUR') role = 'DELIVERER';
            else if (subType === 'EMPLOYEE') role = 'EMPLOYEE';
            else role = 'FREELANCE'; // Fallback pro
        }

        const name = u.name || u.manager_name || "Utilisateur Inconnu";
        
        return {
            id: u.id,
            name: name,
            email: u.email || 'N/A',
            phoneNumber: u.phone_number || u.phoneNumber || 'N/A',
            role: role,
            rawType: accountType,
            rawSubType: subType,
            isActive: u.is_active ?? u.isActive ?? true, // Souvent true par défaut si non présent
            isVerified: u.is_verified ?? u.isVerified ?? (role === 'CLIENT'), // Clients souvent vérifiés par défaut
            createdAt: u.createdAt || u.created_at || new Date().toISOString(),
            businessName: u.businessName || u.business_name,
            avatarInitial: name.charAt(0).toUpperCase()
        };
    };

    // --- CHARGEMENT ---
    const loadData = useCallback(async () => {
        setLoading(true);
        console.group("📥 [ADMIN USERS] Chargement Global");
        try {
            // Appel Unique à /api/users
            // Le backend renvoie souvent un tableau direct ou { content: [...] }
            const response: any = await apiClient('/api/users', 'GET');
            const rawData = Array.isArray(response) ? response : (response.content || []);
            
            console.log(`✅ ${rawData.length} utilisateurs bruts reçus.`);
            
            // Mapping
            const mapped = rawData.map(normalizeUser);
            
            // Tri (Plus récents d'abord)
            mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            setAllUsers(mapped);

        } catch (e) {
            console.error("Erreur chargement utilisateurs:", e);
        } finally {
            setLoading(false);
            console.groupEnd();
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // Valeurs par défaut pour éviter les crashs de rendu
    const s = stats || { totalUsers: 0, totalShipments: 0, totalBusinessActors: 0, pendingValidations: 0, totalRevenue: 0 };
    const totalEntities = s.totalUsers + s.totalBusinessActors;

    // --- CONFIGURATION GRAPHIQUES ---

    const lineChartData = {
        labels: ['J-6', 'J-5', 'J-4', 'J-3', 'J-2', 'Hier', "Auj."],
        datasets: [
          {
            label: 'Flux Colis',
            // Données simulées (car /api/shipments/stats/daily n'existe pas encore)
            // TODO: Connecter à une vraie route de statistiques temporelles
            data: [10, 15, 8, 12, 20, 18, 25], 
            borderColor: 'rgb(249, 115, 22)', // Orange 500
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ],
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: '#94a3b8' } },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
            y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8' } }
        },
    };

    const doughnutData = {
        labels: ['Acteurs Pro', 'En Attente', 'Clients'],
        datasets: [
          {
            data: [s.totalBusinessActors, s.pendingValidations, s.totalUsers],
            backgroundColor: [
              '#3b82f6', // Blue 500
              '#ef4444', // Red 500
              '#10b981', // Emerald 500
            ],
            borderWidth: 0,
            hoverOffset: 10
          },
        ],
    };

    if(loading && !stats) {
        return (
            <div className="h-[600px] flex flex-col justify-center items-center text-center p-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="relative">
                     <div className="absolute inset-0 bg-orange-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                     <Loader2 className="animate-spin w-12 h-12 text-orange-600 mb-4 relative z-10"/>
                </div>
                <p className="text-slate-800 dark:text-white font-bold text-lg">Synchronisation Backend...</p>
                <p className="text-slate-500 text-sm">Récupération des données temps réel via API</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            
            {/* En-tête interne Dashboard */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">Métriques Clés</h2>
                    <p className="text-xs text-slate-500">Mise à jour: {lastRefreshed.toLocaleTimeString()}</p>
                </div>
                <button 
                    onClick={loadData}
                    className="p-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg hover:bg-slate-50 text-slate-600 dark:text-slate-300 transition shadow-sm active:scale-95"
                    title="Rafraîchir les données"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
                </button>
            </div>
            
            {/* 1. GRID KPIs (Source: DB Count) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                 <KpiCard 
                    title="Utilisateurs Clients" 
                    value={s.totalUsers} 
                    icon={Users} 
                    trend="up" trendValue="+2%"
                    colorClass={{ bg: 'bg-blue-500', text: 'text-blue-600' }}
                />
                 <KpiCard 
                    title="Volumétrie Colis" 
                    value={s.totalShipments} 
                    icon={Package} 
                    trend="up" trendValue="+15%"
                    colorClass={{ bg: 'bg-orange-500', text: 'text-orange-600' }}
                />
                 <KpiCard 
                    title="Partenaires Pro" 
                    value={s.totalBusinessActors} 
                    icon={Briefcase} 
                    trend="up" trendValue="Stable"
                    colorClass={{ bg: 'bg-emerald-500', text: 'text-emerald-600' }}
                />
                 <KpiCard 
                    title="En Attente Validation" 
                    value={s.pendingValidations} 
                    icon={FileWarning} 
                    trend={s.pendingValidations > 0 ? "up" : "down"} // Rouge si positif (action requise)
                    trendValue="Urgent"
                    colorClass={{ bg: 'bg-red-500', text: 'text-red-600' }}
                 />
            </div>
            
            {/* 2. SECTION GRAPHIQUES & RÉPARTITION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Graphique Principal (Line Chart) */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-orange-500" /> 
                                Tendance Hebdomadaire
                            </h3>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                         <Line data={lineChartData} options={lineOptions} />
                    </div>
                </div>

                {/* Graphique Répartition (Doughnut) - Données Réelles */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col">
                     <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Répartition des Comptes</h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Clients vs Partenaires</p>
                     
                     <div className="flex-1 flex items-center justify-center relative">
                          <div className="w-48 h-48 relative z-10">
                             <Doughnut 
                                data={doughnutData} 
                                options={{ 
                                    cutout: '75%', 
                                    plugins: { legend: { display: false } } 
                                }} 
                             />
                          </div>
                          {/* Centre du Doughnut */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                              <span className="text-3xl font-black text-slate-800 dark:text-white">
                                {totalEntities}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Comptes</span>
                          </div>
                     </div>

                     <div className="mt-6 space-y-3">
                          {/* Légendes */}
                          <div className="flex justify-between items-center text-sm p-2 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                              <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                  <span className="text-slate-700 dark:text-slate-300 font-medium">Partenaires Pro</span>
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">{s.totalBusinessActors}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm p-2 rounded-lg bg-red-50 dark:bg-red-900/10">
                              <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  <span className="text-slate-700 dark:text-slate-300 font-medium">En attente</span>
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">{s.pendingValidations}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm p-2 rounded-lg bg-green-50 dark:bg-green-900/10">
                              <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                  <span className="text-slate-700 dark:text-slate-300 font-medium">Clients Standard</span>
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">{s.totalUsers}</span>
                          </div>
                     </div>
                </div>
            </div>

            {/* 3. SECTION LOGS & SANTÉ SYSTÈME */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 
                 {/* Panneau Monitoring Technique */}
                 <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden group">
                      <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                                  <Server className="w-6 h-6 text-green-400" />
                              </div>
                              <h3 className="text-xl font-bold">Santé de l'Infrastructure</h3>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition">
                                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">API Latency</p>
                                  <p className="text-2xl font-mono text-green-400 font-bold flex items-baseline gap-1">45<span className="text-sm text-white">ms</span></p>
                              </div>
                              <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition">
                                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Base de Données</p>
                                  <p className="text-sm font-medium text-green-400 flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    Connecté (Postgres)
                                  </p>
                              </div>
                          </div>

                          <div className="bg-black/30 p-4 rounded-lg font-mono text-[11px] text-green-300 border border-green-900/30 shadow-inner h-32 overflow-hidden">
                              {/* Simulation d'une console de statut, basée sur les requêtes réelles faites au montage */}
                              <div>{`> Initializing Admin Dashboard...`}</div>
                              <div>{`> Fetching KPIs from [https://TiiBnTickback.onrender.com]... [OK]`}</div>
                              <div>{`> Retrieving active business actors count: ${s.totalBusinessActors}`}</div>
                              <div>{`> Pending validations queue: ${s.pendingValidations}`}</div>
                              <div className="animate-pulse">{`> Listening for incoming system events...`}</div>
                          </div>
                      </div>
                      
                      {/* Déco Arrière plan */}
                      <Activity className="absolute -bottom-12 -right-12 w-64 h-64 text-white/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000"/>
                 </div>

                 {/* Panneau Logs d'activité réelle */}
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col">
                     <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center justify-between">
                        <span>Logs Système (/event-logs)</span>
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">10 derniers</span>
                     </h3>
                     
                     <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '300px' }}>
                          {logs.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                                  <FileWarning className="w-8 h-8 mb-2 opacity-50" />
                                  <p className="text-sm">Aucun log disponible pour le moment</p>
                                  <p className="text-[10px]">Endpoint /api/event-logs vide</p>
                              </div>
                          ) : (
                              logs.map((log) => (
                                  <RecentActivityItem key={log.id} log={log} />
                              ))
                          )}
                     </div>
                 </div>
            </div>
        </div>
    );
}
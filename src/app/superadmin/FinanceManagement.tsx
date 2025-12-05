'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartOptions,
} from 'chart.js';
import {
  DollarSign,
  Wallet,
  TrendingUp,
  Download,
  Loader2,
  Calendar,
  Award,
  ArrowUpRight,
  Building,
  Package,
  Users
} from 'lucide-react';
// Importez le service admin que nous avons défini précédemment ou mettez à jour les appels API ici
import { adminService } from '@/services/adminService';

// Initialisation de ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

// ============================================================================
// TYPES
// ============================================================================

// Type pour un colis reçu de l'API admin (pour les calculs)
interface AdminPackage {
    id: string;
    trackingNumber: string; // Adapter si tracking_number
    shippingCost: number; // Montant de la livraison
    createdAt: string;    // Date
    departurePointName?: string;
    arrivalPointName?: string;
    senderName?: string;
    // Pour les stats avancées
    status?: string; 
}

interface KpiData {
    totalRevenue: number;
    todayRevenue: number;
    totalPackages: number;
    averageValue: number;
}

interface TopPerformer {
    name: string;
    count: number;
    revenue: number;
    role?: string; // 'Sender', 'Relay'
}

// ============================================================================
// COMPOSANT KPI CARD
// ============================================================================
const KpiCard = ({ title, value, icon: Icon, trend, colorClass }: any) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className={`p-6 rounded-2xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm transition-all duration-300`}
    >
        <div className="flex justify-between items-start mb-3">
            <div>
                <p className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-opacity-10 dark:bg-opacity-20 ${colorClass}`}>
                <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
        </div>
        {trend && (
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded w-fit">
                <ArrowUpRight className="w-3 h-3" />
                <span>{trend} cette semaine</span>
            </div>
        )}
    </motion.div>
);

// ============================================================================
// COMPOSANT TABLEAU CLASSEMENT
// ============================================================================
const RankingTable = ({ title, data, icon: Icon }: { title: string, data: TopPerformer[], icon: any }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-5 border-b border-slate-100 dark:border-gray-700 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600">
                <Icon className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{title}</h3>
        </div>
        <div className="overflow-y-auto max-h-[320px] custom-scrollbar">
            <table className="w-full text-sm text-left">
                <thead className="bg-white dark:bg-gray-800 text-slate-500 dark:text-gray-400 text-xs uppercase sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="p-4 pl-6 font-bold w-16">#</th>
                        <th className="p-4 font-bold">Nom</th>
                        <th className="p-4 font-bold text-right">Volume</th>
                        <th className="p-4 font-bold text-right pr-6">CA Généré</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                    {data.length === 0 ? (
                         <tr><td colSpan={4} className="p-6 text-center text-gray-400 italic">Aucune donnée disponible</td></tr>
                    ) : data.map((item, index) => (
                        <tr key={index} className="hover:bg-orange-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                            <td className="p-4 pl-6 font-mono text-slate-400 group-hover:text-orange-500 font-bold">
                                {index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : index + 1 === 3 ? '🥉' : index + 1}
                            </td>
                            <td className="p-4">
                                <div className="font-bold text-slate-700 dark:text-slate-200">{item.name}</div>
                                {item.role && <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">{item.role}</span>}
                            </td>
                            <td className="p-4 text-right font-mono text-slate-600 dark:text-gray-400 font-semibold">{item.count}</td>
                            <td className="p-4 text-right pr-6">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
                                    {item.revenue.toLocaleString()} F
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FinanceManagement() {
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState<KpiData>({ totalRevenue: 0, todayRevenue: 0, totalPackages: 0, averageValue: 0 });
    
    // Données calculées pour les classements
    const [topRelays, setTopRelays] = useState<TopPerformer[]>([]);
    const [topSenders, setTopSenders] = useState<TopPerformer[]>([]);

    // Données pour les graphiques
    const [chartLabels, setChartLabels] = useState<string[]>([]);
    const [revenueSeries, setRevenueSeries] = useState<number[]>([]);
    
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

    // Chargement & Calculs
    useEffect(() => {
        const processFinanceData = async () => {
            setLoading(true);
            try {
                console.group("💰 [FINANCE] Starting Data Analysis...");
                console.log("📡 Fetching Global Shipment Data via /api/admin/packages...");
                
                let packages: AdminPackage[] = [];
                try {
                     const response = await adminService.getAllShipmentsGlobal(); 
                     packages = response.map((p: any) => ({
                        id: p.id,
                        trackingNumber: p.trackingNumber || p.tracking_number,
                        shippingCost: Number(p.shippingCost || p.deliveryFee || p.shipping_cost || 0),
                        createdAt: p.createdAt || p.created_at,
                        departurePointName: p.departurePointName || p.pickupAddress,
                        senderName: p.senderName || p.sender_name || "Anonyme"
                     }));
                     console.log(`✅ Loaded ${packages.length} packages for financial analysis.`);
                } catch (err) {
                    console.warn("⚠️ Failed to load global packages, data might be incomplete.", err);
                }

                if (packages.length === 0) {
                    setLoading(false);
                    console.groupEnd();
                    return;
                }

                const now = new Date();
                const todayStart = new Date(now.setHours(0, 0, 0, 0)).getTime();
                
                let totalRev = 0;
                let todayRev = 0;
                
                const relayMap = new Map<string, { count: number, rev: number }>();
                const senderMap = new Map<string, { count: number, rev: number }>();

                const dateMap = new Map<string, number>();
                
                for (let i = viewMode === 'week' ? 6 : 29; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const key = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
                    dateMap.set(key, 0);
                }

                packages.forEach((pkg) => {
                    if (isNaN(pkg.shippingCost)) return;

                    totalRev += pkg.shippingCost;
                    
                    const pkgDate = new Date(pkg.createdAt);
                    const pkgTime = pkgDate.getTime();
                    
                    if (pkgTime >= todayStart) todayRev += pkg.shippingCost;

                    const dateKey = pkgDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
                    if (dateMap.has(dateKey)) {
                        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + pkg.shippingCost);
                    }

                    const relayName = pkg.departurePointName || "Inconnu";
                    if (relayName !== "Inconnu") {
                        const currRelay = relayMap.get(relayName) || { count: 0, rev: 0 };
                        relayMap.set(relayName, { count: currRelay.count + 1, rev: currRelay.rev + pkg.shippingCost });
                    }

                    const sender = pkg.senderName || "Client Inconnu";
                    if (sender !== "Client Inconnu") {
                        const currSender = senderMap.get(sender) || { count: 0, rev: 0 };
                        senderMap.set(sender, { count: currSender.count + 1, rev: currSender.rev + pkg.shippingCost });
                    }
                });

                const sortedRelays = Array.from(relayMap.entries())
                    .map(([name, val]) => ({ name, count: val.count, revenue: val.rev, role: 'Point Relais' }))
                    .sort((a, b) => b.revenue - a.revenue) 
                    .slice(0, 10); 

                const sortedSenders = Array.from(senderMap.entries())
                    .map(([name, val]) => ({ name, count: val.count, revenue: val.rev, role: 'Expéditeur' }))
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 10);

                setKpis({
                    totalRevenue: totalRev,
                    todayRevenue: todayRev,
                    totalPackages: packages.length,
                    averageValue: packages.length > 0 ? Math.round(totalRev / packages.length) : 0
                });

                setTopRelays(sortedRelays);
                setTopSenders(sortedSenders);

                setChartLabels(Array.from(dateMap.keys()));
                setRevenueSeries(Array.from(dateMap.values()));

                console.log("✅ Analysis Complete.");
                console.groupEnd();

            } catch (e) {
                console.error("🚨 Error in Financial Calculation:", e);
            } finally {
                setLoading(false);
            }
        };

        processFinanceData();
    }, [viewMode]);

    // --- CONFIGURATION DES GRAPHIQUES ---
    
    const lineData = {
        labels: chartLabels,
        datasets: [{
            label: 'Revenus (FCFA)',
            data: revenueSeries,
            fill: true,
            borderColor: '#f97316',
            backgroundColor: (context: any) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(249, 115, 22, 0.4)');
                gradient.addColorStop(1, 'rgba(249, 115, 22, 0.0)');
                return gradient;
            },
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#f97316',
            pointBorderWidth: 2,
        }]
    };

    const chartOptions: any = { // Usage de any pour éviter les erreurs de typage pointilleuses sur grid
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                padding: 12,
                titleFont: { size: 13 },
                bodyFont: { size: 14, weight: 'bold' },
                displayColors: false,
                callbacks: {
                    label: (context: any) => `${context.formattedValue} FCFA`
                }
            }
        },
        scales: {
            x: { 
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            },
            y: { 
                // Fix: borderDash est supporté au runtime mais typage parfois manquant sur interface standard
                grid: { color: 'rgba(148, 163, 184, 0.1)', borderDash: [5, 5] },
                ticks: { color: '#94a3b8', callback: (value: any) => `${value} F` } 
            }
        }
    };

    const barData = {
        labels: topRelays.slice(0, 5).map(r => r.name.length > 15 ? r.name.substring(0, 12) + '...' : r.name),
        datasets: [{
            label: 'Volume Colis',
            data: topRelays.slice(0, 5).map(r => r.count),
            backgroundColor: '#3b82f6',
            borderRadius: 4,
            barThickness: 20
        }]
    };
    
    const barOptions: ChartOptions<'bar'> = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false }, ticks: { display: false } },
            y: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } }
        }
    };

    // Génération PDF basique (Placeholder)
    const handleGenerateReport = () => {
        alert("Génération du rapport financier PDF en cours...\n(Intégrez ici jsPDF avec les données 'kpis' et 'topRelays')");
        console.log("DATA EXPORT:", { kpis, topRelays, topSenders });
    };

    if(loading) return (
        <div className="flex flex-col justify-center items-center py-32 animate-in fade-in">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
            <p className="text-slate-500 font-medium">Analyse des transactions financières...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Wallet className="text-orange-500 w-8 h-8" /> Performance Financière
                    </h2>
                    <p className="text-slate-500 dark:text-gray-400 text-sm mt-1 max-w-xl">
                        Analyse en temps réel basée sur {kpis.totalPackages} colis traités via l'API Backend.
                    </p>
                </div>
                
                <button 
                    onClick={handleGenerateReport}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-700 text-white rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 font-bold text-sm"
                >
                    <Download className="w-4 h-4" /> Exporter Rapport
                </button>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <KpiCard 
                    title="Chiffre d'Affaires Global" 
                    value={kpis.totalRevenue.toLocaleString() + " FCFA"} 
                    icon={DollarSign} 
                    colorClass="bg-green-500 text-green-600" 
                    trend="+15%"
                />
                <KpiCard 
                    title="CA Aujourd'hui" 
                    value={kpis.todayRevenue.toLocaleString() + " FCFA"} 
                    icon={TrendingUp} 
                    colorClass="bg-blue-500 text-blue-600" 
                />
                <KpiCard 
                    title="Panier Moyen" 
                    value={kpis.averageValue.toLocaleString() + " FCFA"} 
                    icon={Wallet} 
                    colorClass="bg-purple-500 text-purple-600" 
                />
                <KpiCard 
                    title="Volume Facturé" 
                    value={kpis.totalPackages} 
                    icon={Package} 
                    colorClass="bg-orange-500 text-orange-600" 
                />
            </div>

            {/* GRAPHIQUES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-lg text-slate-700 dark:text-white">Dynamique des Revenus</h3>
                            <p className="text-xs text-slate-400 dark:text-gray-500">Flux financier entrant (Expéditions)</p>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-gray-700 rounded-lg p-1">
                            <button onClick={() => setViewMode('week')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode==='week' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400'}`}>7 Jours</button>
                            <button onClick={() => setViewMode('month')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode==='month' ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400'}`}>30 Jours</button>
                        </div>
                    </div>
                    <div className="h-72 w-full">
                         <Line data={lineData} options={chartOptions} />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col">
                     <div className="mb-6">
                        <h3 className="font-bold text-lg text-slate-700 dark:text-white flex items-center gap-2">
                            <Building className="w-5 h-5 text-blue-500"/> Top Relais
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-gray-500">Les points relais les plus actifs par volume</p>
                     </div>
                     <div className="flex-1">
                         <Bar data={barData} options={barOptions} />
                     </div>
                     <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                         <div className="flex justify-between items-center">
                             <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total Commissions</span>
                             <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                                 {(kpis.totalRevenue * 0.15).toLocaleString(undefined, { maximumFractionDigits: 0 })} F
                             </span>
                         </div>
                         <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                             <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                         </div>
                         <p className="text-[10px] text-gray-400 mt-1 text-right">Basé sur 15% de commission</p>
                     </div>
                </div>
            </div>

            {/* CLASSEMENTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <RankingTable 
                    title="Meilleurs Partenaires (CA)" 
                    data={topRelays} 
                    icon={Award} 
                />
                <RankingTable 
                    title="Top Clients (Fidélité)" 
                    data={topSenders} 
                    icon={Users} 
                />
            </div>
        </div>
    );
}
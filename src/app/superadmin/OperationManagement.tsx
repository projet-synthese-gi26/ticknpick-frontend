'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { 
    Package, Building, Search, Loader2, X, Eye, 
    MoreVertical, CheckCircle, XCircle, PlayCircle, PauseCircle,
    Power, AlertTriangle, Shield, MapPin, Lock, FileText,
    BarChart3, LayoutList, Map as MapIcon, Filter, Layers, List,
    Store
} from 'lucide-react';
import { relayPointService, RelayPoint } from '@/services/relayPointService';
import { adminService, AdminPackage } from '@/services/adminService';
import toast, { Toaster } from 'react-hot-toast';

// IMPORTATION DU NOUVEAU COMPOSANT SIDEBAR
import RelaySidebar from './RelaySidebar'; 

// Chart JS
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, ArcElement, BarElement 
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Enregistrement ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

// Import Leaflet Dynamique
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

import 'leaflet/dist/leaflet.css';

// --- HELPERS UI ---

const translateStatus = (status: string) => {
    const s = (status || 'UNKNOWN').toUpperCase();
    const map: Record<string, string> = {
        'EN_ATTENTE_DE_DEPOT': 'En Attente Dépôt',
        'PRE_REGISTERED': 'Pré-Enregistré',
        'PENDING': 'En Attente',
        'PENDING_VERIFICATION': 'Vérif. Requise',
        'AU_DEPART': 'Au Départ',
        'AT_DEPARTURE_RELAY_POINT': 'Stock Départ',
        'EN_TRANSIT': 'En Transit',
        'IN_TRANSIT': 'En Transit',
        'ARRIVE_AU_RELAIS': 'Arrivé Relais',
        'AT_ARRIVAL_RELAY_POINT': 'Stock Arrivée',
        'READY_FOR_PICKUP': 'Prêt Retrait',
        'LIVRE': 'Livré',
        'DELIVERED': 'Livré',
        'RECU': 'Reçu',
        'WITHDRAWN': 'Retiré',
        'ANNULE': 'Annulé',
        'CANCELLED': 'Annulé',
        'ACTIVE': 'Actif',
        'SUSPENDED': 'Suspendu'
    };
    return map[s] || s.replace(/_/g, ' ');
};

const getStatusColor = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s.includes('PENDING') || s.includes('ATTENTE') || s === 'DRAFT') return "bg-amber-100 text-amber-700 border-amber-200";
    if (s.includes('TRANSIT') || s.includes('DEPART')) return "bg-blue-100 text-blue-700 border-blue-200";
    if (s.includes('ARRIVE') || s.includes('READY')) return "bg-purple-100 text-purple-700 border-purple-200";
    if (s.includes('LIVRE') || s.includes('DELIVERED') || s.includes('ACTIVE')) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (s.includes('ANNULE') || s.includes('SUSPEND') || s.includes('DEACTIVATE')) return "bg-red-100 text-red-700 border-red-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
};

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1 w-fit whitespace-nowrap ${getStatusColor(status)}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(status).split(' ')[1].replace('text-', 'bg-')}`} />
        {translateStatus(status)}
    </span>
);

const StatCard = ({ title, value, icon: Icon, color, sub }: any) => (
    <div className={`p-5 rounded-2xl bg-white dark:bg-slate-800 border-l-4 ${color} shadow-sm hover:shadow-md transition-all group`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase mb-1 tracking-wider">{title}</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white">{value}</h3>
                {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </div>
        </div>
    </div>
);

// ------------------------------------------------------------------
// VUE GESTIONNAIRE DE RELAIS
// ------------------------------------------------------------------

const RelayManager = () => {
    const [viewMode, setViewMode] = useState<'TABLE' | 'MAP' | 'STATS'>('TABLE');
    const [relays, setRelays] = useState<RelayPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [selectedRelay, setSelectedRelay] = useState<RelayPoint | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            let data: RelayPoint[] = [];
            if (filter === 'ALL') data = await relayPointService.getAllRelayPoints();
            else data = await relayPointService.getPointsByStatus(filter);
            
            // Filtre Recherche Local
            if (search) {
                const term = search.toLowerCase();
                data = data.filter(r => 
                    (r.relayPointName || '').toLowerCase().includes(term) ||
                    (r.locality || '').toLowerCase().includes(term)
                );
            }
            
            setRelays(data);
        } catch(e) { console.error(e); } 
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, [filter, search]);

    // Action Handler
    const handleAction = async (action: string, id: string) => {
        const loadingId = toast.loading("Action en cours...");
        try {
            switch(action) {
                case 'APPROVE': await relayPointService.approveRelayPoint(id); toast.success("Validé"); break;
                case 'REJECT': 
                    const r = prompt("Raison ?"); if(r) await relayPointService.rejectRelayPoint(id, r); break;
                case 'ACTIVATE': await relayPointService.activateRelayPoint(id); toast.success("Activé"); break;
                case 'SUSPEND': 
                    const s = prompt("Motif ?"); if(s) await relayPointService.suspendRelayPoint(id, s); break;
                case 'DEACTIVATE': if(confirm("Sûr ?")) await relayPointService.deactivateRelayPoint(id); break;
            }
            loadData();
            if (selectedRelay?.id === id) setSelectedRelay(null); 
        } catch(e) { toast.error("Erreur technique"); }
        finally { toast.dismiss(loadingId); }
    };

    // Calcul Stats
    const stats = useMemo(() => ({
        total: relays.length,
        active: relays.filter(r => r.status === 'ACTIVE').length,
        pending: relays.filter(r => r.status.includes('PENDING')).length,
        capacity: relays.reduce((acc, r) => acc + (r.maxCapacity||0), 0),
        occupied: relays.reduce((acc, r) => acc + (r.current_package_count||0), 0)
    }), [relays]);


    // -- VUES --
    const TableView = () => (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden">
             <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700 text-xs font-bold text-slate-500 uppercase">
                     <tr>
                         <th className="p-4">Relais</th>
                         <th className="p-4">Localisation</th>
                         <th className="p-4 text-center">Occupation</th>
                         <th className="p-4 text-center">Statut</th>
                         <th className="p-4 text-right"></th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                     {relays.map(r => (
                         <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer group" onClick={() => setSelectedRelay(r)}>
                             <td className="p-4 font-bold text-slate-800 dark:text-white">{r.relayPointName || "Inconnu"}</td>
                             <td className="p-4 text-slate-600 dark:text-slate-300 flex items-center gap-2"><MapPin className="w-3 h-3"/> {r.locality || 'N/A'}</td>
                             <td className="p-4 text-center font-mono">{r.current_package_count} / {r.maxCapacity}</td>
                             <td className="p-4 text-center"><StatusBadge status={r.status}/></td>
                             <td className="p-4 text-right"><Eye className="w-4 h-4 text-slate-400 group-hover:text-blue-500"/></td>
                         </tr>
                     ))}
                 </tbody>
             </table>
             {relays.length===0 && <div className="p-10 text-center text-slate-400">Aucun résultat.</div>}
        </div>
    );

    const MapView = () => (
        <div className="h-[600px] w-full rounded-xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl relative z-0 bg-slate-100">
             <MapContainer center={[3.848, 11.502]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
                {relays.map(rp => (
                    <Marker 
                        key={rp.id} 
                        position={[rp.latitude || 3.848, rp.longitude || 11.502]}
                        eventHandlers={{ click: () => setSelectedRelay(rp) }}
                    >
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );

    const StatsView = () => {
        // CORRECTION BUG SUBSTRING : Protection sur le nom
        const chartLabels = relays.slice(0, 10).map(r => (r.relayPointName ? r.relayPointName.substring(0, 12) : "Inconnu") + '...');
        const chartData = relays.slice(0, 10).map(r => Math.round(((r.current_package_count||0)/(r.maxCapacity||1))*100));

        const barData = {
            labels: chartLabels,
            datasets: [{
                label: 'Taux Occupation (%)',
                data: chartData,
                backgroundColor: '#3b82f6',
                borderRadius: 4
            }]
        };

        const doughnutData = {
            labels: ['Actif', 'En Attente', 'Suspendu'],
            datasets: [{
                data: [stats.active, stats.pending, stats.total - stats.active - stats.pending],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0
            }]
        };

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-orange-500"/> État du Réseau</h3>
                    <div className="h-64 flex items-center justify-center">
                        <Doughnut data={doughnutData} options={{plugins: {legend: {position: 'right'}}}} />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2"><LayoutList className="w-5 h-5 text-blue-500"/> Top Occupations</h3>
                    <div className="h-64">
                        <Bar data={barData} options={{ maintainAspectRatio: false, scales: {y: {beginAtZero: true, max: 100}} }} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <StatCard title="Relais Total" value={stats.total} icon={Store} color="border-blue-500"/>
                 <StatCard title="Actifs" value={stats.active} icon={CheckCircle} color="border-green-500" sub={`${Math.round((stats.active/(stats.total||1))*100)}% actifs`}/>
                 <StatCard title="À Valider" value={stats.pending} icon={AlertTriangle} color="border-amber-500"/>
                 <StatCard title="Stock Global" value={stats.occupied} icon={Package} color="border-purple-500"/>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl">
                 <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg shadow-sm border dark:border-slate-700">
                     {['TABLE', 'MAP', 'STATS'].map((mode) => (
                         <button key={mode} onClick={() => setViewMode(mode as any)} className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition ${viewMode===mode ? 'bg-orange-500 text-white shadow' : 'text-slate-500'}`}>
                             {mode === 'TABLE' && <List className="w-4 h-4"/>}
                             {mode === 'MAP' && <MapIcon className="w-4 h-4"/>}
                             {mode === 'STATS' && <BarChart3 className="w-4 h-4"/>}
                             {mode}
                         </button>
                     ))}
                 </div>
                 
                 <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input type="text" placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 rounded-lg text-sm border-none focus:ring-2 focus:ring-orange-500" value={search} onChange={e=>setSearch(e.target.value)}/>
                 </div>

                 {viewMode === 'TABLE' && (
                     <div className="flex gap-2">
                         {['ALL', 'PENDING_VERIFICATION', 'ACTIVE'].map(s => (
                             <button key={s} onClick={()=>setFilter(s)} className={`px-3 py-1 text-xs rounded border font-bold ${filter===s ? 'bg-slate-800 text-white' : 'bg-white text-slate-500'}`}>
                                 {s.includes('PENDING') ? 'En Attente' : s}
                             </button>
                         ))}
                     </div>
                 )}
            </div>
            
            {/* Vues */}
            {viewMode === 'TABLE' && <TableView />}
            {viewMode === 'MAP' && <MapView />}
            {viewMode === 'STATS' && <StatsView />}

            {/* Sidebar Details */}
            <RelaySidebar relay={selectedRelay} onClose={() => setSelectedRelay(null)} onAction={handleAction} />
        </div>
    );
};


// --------------------------------------------------------------------------------------------------
// VUE GESTIONNAIRE DE COLIS (AMELIORÉE)
// --------------------------------------------------------------------------------------------------

const ShipmentManager = () => {
    const [packages, setPackages] = useState<AdminPackage[]>([]);
    const [filtered, setFiltered] = useState<AdminPackage[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filtres
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, EN_COURS, LIVRE, ANNULE

    // Chargement
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await adminService.getAllShipmentsGlobal();
                setPackages(data);
                setFiltered(data);
            } catch(e) { console.error(e); } 
            finally { setLoading(false); }
        };
        load();
    }, []);

    // Logique Filtre (Similaire à userManagement)
    useEffect(() => {
        let res = packages;
        
        // 1. Recherche Texte
        if (search) {
            const t = search.toLowerCase();
            res = res.filter(p => 
                (p.trackingNumber && p.trackingNumber.toLowerCase().includes(t)) ||
                (p.senderName && p.senderName.toLowerCase().includes(t)) ||
                (p.recipientName && p.recipientName.toLowerCase().includes(t))
            );
        }

        // 2. Filtre Statut
        if (statusFilter !== 'ALL') {
            res = res.filter(p => {
                if (!p.status) return false;
                const st = p.status.toUpperCase();
                
                if (statusFilter === 'EN_COURS') 
                    return ['EN_ATTENTE', 'TRANSIT', 'DEPART', 'ARRIVE', 'PENDING'].some(k => st.includes(k));
                
                if (statusFilter === 'LIVRE') 
                    return ['LIVRE', 'RECU', 'DELIVERED', 'WITHDRAWN'].some(k => st.includes(k));
                
                if (statusFilter === 'ANNULE') 
                    return st.includes('ANNULE') || st.includes('CANCEL');
                
                return true;
            });
        }

        setFiltered(res);
    }, [search, statusFilter, packages]);

    return (
        <div className="space-y-6">
            
            {/* Toolbar Colis */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                 {/* Barre recherche */}
                 <div className="relative w-full md:w-96">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                     <input 
                        type="text" placeholder="Recherche par tracking, nom..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition"
                     />
                 </div>
                 
                 {/* Filtres Statut */}
                 <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-x-auto">
                     {['ALL', 'EN_COURS', 'LIVRE', 'ANNULE'].map(st => (
                         <button 
                            key={st} 
                            onClick={() => setStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition whitespace-nowrap ${statusFilter === st ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:bg-white/50'}`}
                         >
                            {st === 'EN_COURS' ? 'En Cours' : st === 'LIVRE' ? 'Livrés' : st === 'ALL' ? 'Tous' : 'Annulés'}
                         </button>
                     ))}
                 </div>
            </div>

            {/* Tableau */}
            <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl overflow-hidden shadow-sm min-h-[300px]">
                <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-700 text-xs font-bold text-slate-500 uppercase">
                         <tr>
                             <th className="p-4">Tracking</th>
                             <th className="p-4">Détails</th>
                             <th className="p-4 text-center">Statut</th>
                             <th className="p-4 text-right">Frais</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                         {loading ? (
                             <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500"/></td></tr>
                         ) : filtered.length === 0 ? (
                             <tr><td colSpan={4} className="p-10 text-center text-slate-400 italic">Aucun colis trouvé.</td></tr>
                         ) : filtered.map(pkg => (
                             <tr key={pkg.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                                 <td className="p-4 font-mono font-bold text-slate-700 dark:text-orange-400">{pkg.trackingNumber}</td>
                                 <td className="p-4">
                                     <div className="font-semibold text-slate-800 dark:text-white">{pkg.description || 'Colis'}</div>
                                     <div className="text-[10px] text-slate-500">Exp: {pkg.senderName} → Dest: {pkg.recipientName}</div>
                                 </td>
                                 <td className="p-4 text-center">
                                     <StatusBadge status={pkg.status} />
                                 </td>
                                 <td className="p-4 text-right font-mono font-bold text-slate-700 dark:text-white">
                                     {pkg.shippingCost.toLocaleString()} F
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                </table>
            </div>
        </div>
    );
};

// --------------------------------------------------------------------------------------------------
// ORCHESTRATION FINALE
// --------------------------------------------------------------------------------------------------

export default function OperationsManagement() {
    const [tab, setTab] = useState<'PACKAGES' | 'RELAYS'>('RELAYS'); 

    return (
        <div className="min-h-[600px] animate-in fade-in duration-500 pb-20 space-y-6">
             <Toaster position="top-center"/>
             
             <div className="flex items-center justify-between">
                 <div>
                     <h2 className="text-2xl font-black text-slate-800 dark:text-white">Opérations</h2>
                     <p className="text-sm text-slate-500">Pilotage du réseau logistique.</p>
                 </div>
                 <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex shadow-inner">
                     <button onClick={()=>setTab('RELAYS')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${tab==='RELAYS'?'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400':'text-gray-500'}`}>
                         <Building className="w-4 h-4"/> Points Relais
                     </button>
                     <button onClick={()=>setTab('PACKAGES')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${tab==='PACKAGES'?'bg-white dark:bg-slate-700 shadow text-orange-600 dark:text-orange-400':'text-gray-500'}`}>
                         <Package className="w-4 h-4"/> Gestion Colis
                     </button>
                 </div>
             </div>

             <AnimatePresence mode="wait">
                 {tab === 'RELAYS' ? (
                     <motion.div key="relays" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                         <RelayManager />
                     </motion.div>
                 ) : (
                     <motion.div key="packages" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                         <ShipmentManager />
                     </motion.div>
                 )}
             </AnimatePresence>
        </div>
    );
}
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

// Chart JS
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, ArcElement, BarElement 
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import RelayBar from './RelaySidebar';

// Enregistrement ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

// Import Leaflet Dynamique
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

import 'leaflet/dist/leaflet.css';

// --------------------------------------------------------------------------------------------------
// COMPOSANTS UI HELPERS
// --------------------------------------------------------------------------------------------------

const translateStatus = (status: string) => {
    const s = status.toUpperCase();
    const map: Record<string, string> = {
        'EN_ATTENTE_DE_DEPOT': 'En Attente de Dépôt',
        'PRE_REGISTERED': 'Pré-Enregistré',
        'PENDING': 'En Attente',
        'AU_DEPART': 'Au Départ',
        'AT_DEPARTURE_RELAY_POINT': 'Stock Départ',
        'EN_TRANSIT': 'En Transit',
        'IN_TRANSIT': 'En Transit',
        'ARRIVE_AU_RELAIS': 'Arrivé au Relais',
        'AT_ARRIVAL_RELAY_POINT': 'Stock Arrivée',
        'READY_FOR_PICKUP': 'Prêt au Retrait',
        'LIVRE': 'Livré',
        'DELIVERED': 'Livré',
        'RECU': 'Reçu',
        'WITHDRAWN': 'Retiré',
        'ANNULE': 'Annulé',
        'CANCELLED': 'Annulé'
    };
    return map[s] || s.replace(/_/g, ' ');
};

const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('PENDING') || s.includes('ATTENTE')) return "bg-amber-100 text-amber-700 border-amber-200";
    if (s.includes('TRANSIT') || s.includes('DEPART')) return "bg-blue-100 text-blue-700 border-blue-200";
    if (s.includes('ARRIVE') || s.includes('READY')) return "bg-purple-100 text-purple-700 border-purple-200";
    if (s.includes('LIVRE') || s.includes('DELIVERED') || s.includes('WITHDRAWN')) return "bg-green-100 text-green-700 border-green-200";
    if (s.includes('ANNULE')) return "bg-red-100 text-red-700 border-red-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
};

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1 w-fit ${getStatusColor(status)}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(status).split(' ')[1].replace('text-', 'bg-')}`} />
        {translateStatus(status)}
    </span>
);

const StatCard = ({ title, value, icon: Icon, color, sub }: any) => (
    <div className={`p-4 rounded-xl bg-white dark:bg-slate-800 border-l-4 ${color} shadow-sm flex items-start justify-between`}>
        <div>
            <p className="text-slate-500 text-xs font-bold uppercase mb-1">{title}</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{value}</h3>
            {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </div>
    </div>
);


// --------------------------------------------------------------------------------------------------
// SOUS-COMPOSANT : GESTION DES RELAIS (3 Vues : Table, Map, Stats)
// --------------------------------------------------------------------------------------------------

const RelayManager = () => {
    const [viewMode, setViewMode] = useState<'TABLE' | 'MAP' | 'STATS'>('TABLE');
    const [relays, setRelays] = useState<RelayPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [selectedRelay, setSelectedRelay] = useState<RelayPoint | null>(null); // Pour le drawer

    // Chargement des données
    const loadData = async () => {
        setLoading(true);
        try {
            let data: RelayPoint[] = [];
            if (filter === 'ALL') data = await relayPointService.getAllRelayPoints();
            else data = await relayPointService.getPointsByStatus(filter);
            setRelays(data);
        } catch(e) { console.error(e); } 
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, [filter]);

    // Calcul Stats Réelles
    const stats = useMemo(() => {
        return {
            total: relays.length,
            active: relays.filter(r => r.status === 'ACTIVE').length,
            pending: relays.filter(r => r.status.includes('PENDING')).length,
            capacity: relays.reduce((acc, r) => acc + r.maxCapacity, 0),
            occupied: relays.reduce((acc, r) => acc + (r.current_package_count || 0), 0)
        };
    }, [relays]);

    // Action Handler
    const handleAction = async (action: string, id: string) => {
        const loadingId = toast.loading("Traitement...");
        try {
            switch(action) {
                case 'APPROVE': await relayPointService.approveRelayPoint(id); toast.success("Approuvé"); break;
                case 'REJECT': 
                    const r = prompt("Raison ?"); 
                    if(r) await relayPointService.rejectRelayPoint(id, r); 
                    break;
                case 'ACTIVATE': await relayPointService.activateRelayPoint(id); toast.success("Activé"); break;
                case 'SUSPEND': 
                    const s = prompt("Raison ?"); 
                    if(s) await relayPointService.suspendRelayPoint(id, s);
                    break;
                case 'DEACTIVATE': if(confirm("Désactiver ?")) await relayPointService.deactivateRelayPoint(id); break;
            }
            loadData(); // Rafraichir la liste
            if (selectedRelay?.id === id) setSelectedRelay(null); // Fermer si action sur selectionné
        } catch(e) { toast.error("Erreur action"); }
        finally { toast.dismiss(loadingId); }
    };

    // -- CONTENU VUES --

    // 1. Vue TABLEAU
    const TableView = () => (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden">
             <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700 text-xs font-bold text-slate-500 uppercase">
                     <tr>
                         <th className="p-4">Nom / ID</th>
                         <th className="p-4">Localisation</th>
                         <th className="p-4 text-center">Occupation</th>
                         <th className="p-4 text-center">Statut</th>
                         <th className="p-4 text-right">Actions</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                     {relays.map(r => (
                         <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 group cursor-pointer" onClick={() => setSelectedRelay(r)}>
                             <td className="p-4">
                                 <div className="font-bold text-slate-800 dark:text-white">{r.relayPointName}</div>
                                 <div className="text-[10px] text-slate-400 font-mono">{r.id.substring(0,8)}...</div>
                             </td>
                             <td className="p-4">
                                 <div className="flex items-center gap-1.5">
                                     <MapPin className="w-3.5 h-3.5 text-slate-400"/> {r.locality || 'N/A'}
                                 </div>
                             </td>
                             <td className="p-4 text-center">
                                 <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden max-w-[80px] mx-auto">
                                     <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, ((r.current_package_count || 0) / r.maxCapacity)*100)}%` }} />
                                 </div>
                                 <span className="text-[10px] text-slate-500 mt-1 block">{r.current_package_count}/{r.maxCapacity}</span>
                             </td>
                             <td className="p-4 text-center"><StatusBadge status={r.status}/></td>
                             <td className="p-4 text-right">
                                 <button className="p-2 hover:bg-slate-200 rounded-full" onClick={(e) => { e.stopPropagation(); setSelectedRelay(r); }}>
                                     <Eye className="w-4 h-4 text-slate-500"/>
                                 </button>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
        </div>
    );

    // 2. Vue CARTE
    const MapView = () => (
        <div className="h-[600px] w-full rounded-xl overflow-hidden border-4 border-white shadow-xl relative z-0">
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
            {/* Legend Flottante */}
            <div className="absolute top-4 right-4 bg-white/90 p-3 rounded-lg shadow-lg z-[1000] text-xs">
                <p className="font-bold mb-1">Légende</p>
                <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 bg-blue-500 rounded-full border border-white"></div> Relais</div>
            </div>
        </div>
    );

    // 3. Vue ANALYTICS
    const StatsView = () => {
        const pieData = {
            labels: ['Actif', 'En Attente', 'Suspendu'],
            datasets: [{
                data: [stats.active, stats.pending, relays.length - stats.active - stats.pending],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0
            }]
        };

        const barData = {
            labels: relays.slice(0,8).map(r => r.relayPointName.substring(0,10)+'...'),
            datasets: [{
                label: 'Taux Occupation (%)',
                data: relays.slice(0,8).map(r => Math.round((r.current_package_count/r.maxCapacity)*100)),
                backgroundColor: '#3b82f6',
                borderRadius: 4
            }]
        };

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-4 text-slate-800">État du Réseau</h3>
                    <div className="h-64 flex items-center justify-center">
                        <Doughnut data={pieData} options={{plugins: {legend: {position: 'right'}}}} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-4 text-slate-800">Top Occupations</h3>
                    <div className="h-64">
                        <Bar data={barData} options={{scales: {y: {beginAtZero: true, max: 100}}}} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* STAT CARDS RÉELLES */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <StatCard title="Total Relais" value={stats.total} icon={Store} color="border-blue-500"/>
                 <StatCard title="En Service" value={stats.active} icon={CheckCircle} color="border-green-500" sub={`${Math.round((stats.active/stats.total)*100)}% actifs`}/>
                 <StatCard title="En Attente" value={stats.pending} icon={AlertTriangle} color="border-amber-500" sub="À valider"/>
                 <StatCard title="Taux Rempl." value={`${Math.round((stats.occupied/stats.capacity)*100)}%`} icon={Package} color="border-purple-500" sub={`${stats.occupied} colis stockés`}/>
            </div>

            {/* BARRE D'OUTILS (Vues & Filtres) */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl">
                 {/* Switcher Vues */}
                 <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg shadow-sm border dark:border-slate-700">
                     <button onClick={() => setViewMode('TABLE')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 ${viewMode==='TABLE' ? 'bg-orange-500 text-white shadow' : 'text-slate-500'}`}><LayoutList className="w-4 h-4"/> Liste</button>
                     <button onClick={() => setViewMode('MAP')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 ${viewMode==='MAP' ? 'bg-orange-500 text-white shadow' : 'text-slate-500'}`}><MapIcon className="w-4 h-4"/> Carte</button>
                     <button onClick={() => setViewMode('STATS')} className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 ${viewMode==='STATS' ? 'bg-orange-500 text-white shadow' : 'text-slate-500'}`}><BarChart3 className="w-4 h-4"/> Stats</button>
                 </div>
                 
                 {/* Filtres Statut (Seulement en Table ou Map) */}
                 {viewMode !== 'STATS' && (
                     <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                         {['ALL', 'PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED'].map(s => (
                             <button key={s} onClick={()=>setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${filter===s ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}`}>
                                 {s.replace('_', ' ')}
                             </button>
                         ))}
                     </div>
                 )}
            </div>
            
            {/* CONTENU VARIABLE */}
            <div className="min-h-[400px]">
                {viewMode === 'TABLE' && <TableView />}
                {viewMode === 'MAP' && <MapView />}
                {viewMode === 'STATS' && <StatsView />}
            </div>

            {/* SIDEBAR DÉTAILS (RelayBar) */}
            <RelayBar 
                relay={selectedRelay} 
                onClose={() => setSelectedRelay(null)}
                onAction={handleAction}
            />
        </div>
    );
};


// --------------------------------------------------------------------------------------------------
// GESTION COLIS AMÉLIORÉE (Filtres + Search + Translate)
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

    // Logique Filtre
    useEffect(() => {
        let res = packages;

        // 1. Search
        if (search) {
            const t = search.toLowerCase();
            res = res.filter(p => 
                p.trackingNumber.toLowerCase().includes(t) ||
                p.senderName.toLowerCase().includes(t) ||
                p.recipientName.toLowerCase().includes(t)
            );
        }

        // 2. Statut
        if (statusFilter !== 'ALL') {
            res = res.filter(p => {
                if (statusFilter === 'EN_COURS') return !['LIVRE','RECU','DELIVERED','ANNULE'].includes(p.status);
                if (statusFilter === 'LIVRE') return ['LIVRE','RECU','DELIVERED'].includes(p.status);
                if (statusFilter === 'ANNULE') return p.status.includes('ANNULE');
                return true;
            });
        }

        setFiltered(res);
    }, [search, statusFilter, packages]);

    return (
        <div className="space-y-6">
            
            {/* Toolbar Colis */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
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
                 <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                     {['ALL', 'EN_COURS', 'LIVRE', 'ANNULE'].map(st => (
                         <button 
                            key={st} 
                            onClick={() => setStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${statusFilter === st ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:bg-white/50'}`}
                         >
                            {st === 'EN_COURS' ? 'En Cours' : st === 'LIVRE' ? 'Livrés' : st === 'ALL' ? 'Tous' : 'Annulés'}
                         </button>
                     ))}
                 </div>
            </div>

            {/* Tableau */}
            <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
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
                             <tr><td colSpan={4} className="p-10 text-center text-slate-400">Aucun colis trouvé.</td></tr>
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
// PAGE PRINCIPALE D'ORCHESTRATION
// --------------------------------------------------------------------------------------------------

export default function OperationsManagement() {
    const [tab, setTab] = useState<'PACKAGES' | 'RELAYS'>('RELAYS'); 

    return (
        <div className="min-h-[600px] animate-in fade-in duration-500 pb-20 space-y-6">
             <Toaster position="top-center"/>
             
             {/* Onglets Principaux */}
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

             {/* Affichage Conditionnel */}
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
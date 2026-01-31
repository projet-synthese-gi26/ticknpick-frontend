'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, Search, RefreshCw, Archive, Zap, MoreVertical,
  MapPin, DollarSign, Calendar, Eye, Ban, Box, User, ArrowRight,
  Package,
  CheckCircle,
  Clock
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { delivererService, DelivererPackage } from '@/services/delivererService';
import FindDelivery from './FindDelivery';
import PackageSidebar from './PackageSidebar'; // Sidebar Details (réutilisé)

// Types de filtre
type FilterType = 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'HISTORY';

// Composant Carte Stat (Interactive)
const DeliveryStatCard = ({ title, value, icon: Icon, active, onClick, color }: any) => (
    <div 
        onClick={onClick}
        className={`cursor-pointer p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group
        ${active 
           ? `bg-${color}-50 border-${color}-500 shadow-md transform scale-[1.02]` 
           : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
        }`}
    >
        <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full bg-${color}-500/10 group-hover:scale-125 transition-transform`}></div>
        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${active ? `text-${color}-700` : 'text-slate-500'}`}>
                    {title}
                </p>
                <h3 className={`text-3xl font-black ${active ? `text-${color}-900` : 'text-slate-800 dark:text-white'}`}>
                    {value}
                </h3>
            </div>
            <div className={`p-2 rounded-xl ${active ? `bg-${color}-500 text-white` : `bg-slate-100 text-slate-500`}`}>
                <Icon className="w-5 h-5"/>
            </div>
        </div>
    </div>
);

// Composant Tableau (Row)
const DeliveryRow = ({ pkg, onAction, onMenuToggle, isMenuOpen }: any) => {
    
    // Détermination Actions Disponibles
    const s = pkg.currentStatus;
    const canCancel = s === 'ASSIGNED_TO_DELIVERER';
    const canPickup = s === 'ASSIGNED_TO_DELIVERER';
    const canDeliver = s === 'IN_TRANSIT';
    
    // Est-ce un dépôt relais ou client ?
    // Simplification : si arrivalRelayPointId existe, c'est relais, sinon client
    const isRelayDelivery = !!pkg.arrivalRelayPointId;

    return (
        <motion.tr 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors"
        >
            {/* Tracking & Type */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shadow-sm">
                        <Box className="w-5 h-5"/>
                    </div>
                    <div>
                        <span className="font-mono font-bold text-sm text-slate-800 dark:text-white block">{pkg.trackingNumber}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{pkg.designation || 'Colis'}</span>
                    </div>
                </div>
            </td>

            {/* Départ */}
            <td className="px-6 py-4">
                <div className="flex flex-col text-sm">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{pkg.senderName || 'Expéditeur'}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3"/> {pkg.pickupAddress}
                    </span>
                </div>
            </td>

            {/* Arrivée */}
            <td className="px-6 py-4">
                <div className="flex flex-col text-sm">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{pkg.recipientName || 'Client'}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                         <MapPin className="w-3 h-3"/> {pkg.deliveryAddress}
                    </span>
                </div>
            </td>

            {/* Prix */}
            <td className="px-6 py-4">
                <span className="font-black text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-3 py-1 rounded-full text-sm">
                    {pkg.deliveryFee.toLocaleString()} F
                </span>
            </td>

            {/* Status (Icone + Texte) */}
            <td className="px-6 py-4">
                <StatusBadge status={pkg.currentStatus} />
            </td>

            {/* Actions Menu */}
            <td className="px-6 py-4 text-right relative">
                <button 
                   onClick={(e) => { e.stopPropagation(); onMenuToggle(pkg.id); }}
                   className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 rounded-full transition"
                >
                    <MoreVertical className="w-5 h-5"/>
                </button>

                {/* Popover Action Menu */}
                <AnimatePresence>
                {isMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10, x: -10 }} 
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-10 top-8 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
                    >
                        <div className="p-1 flex flex-col">
                            {/* Actions Globales */}
                            <button onClick={() => onAction('DETAILS', pkg)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300">
                                <Eye className="w-4 h-4"/> Voir détails
                            </button>

                            {/* Actions Contextuelles */}
                            {canPickup && (
                                <button onClick={() => onAction('PICKUP', pkg)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold bg-green-50 text-green-700 hover:bg-green-100 rounded-lg">
                                    <Box className="w-4 h-4"/> Récupérer au Point
                                </button>
                            )}

                            {canDeliver && (
                                isRelayDelivery ? (
                                    <button onClick={() => onAction('DELIVER_RELAY', pkg)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg">
                                        <ArrowRight className="w-4 h-4"/> Livrer au Relais
                                    </button>
                                ) : (
                                    <button onClick={() => onAction('DELIVER_CLIENT', pkg)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg">
                                        <User className="w-4 h-4"/> Livrer au Client
                                    </button>
                                )
                            )}

                            {canCancel && (
                                <div className="border-t my-1 dark:border-slate-700"></div>
                            )}

                            {canCancel && (
                                <button onClick={() => onAction('CANCEL', pkg)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg">
                                    <Ban className="w-4 h-4"/> Annuler assignation
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </td>
        </motion.tr>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'ASSIGNED_TO_DELIVERER': 
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200"><Clock className="w-3 h-3"/> En attente</span>;
        case 'IN_TRANSIT':
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200"><Truck className="w-3 h-3"/> En transit</span>;
        case 'DELIVERED':
        case 'DELIVERED_TO_CLIENT':
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircle className="w-3 h-3"/> Livré</span>;
        default:
            return <span className="text-xs font-medium text-slate-500">{status}</span>;
    }
};


export default function DeliveriesPage() {
    const [view, setView] = useState<'LIST' | 'FIND'>('LIST');
    const [filterStatus, setFilterStatus] = useState<FilterType>('IN_TRANSIT');
    const [packages, setPackages] = useState<DelivererPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // UI Logic
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<DelivererPackage | null>(null); // Pour le Sidebar

    // 1. CHARGEMENT
    const reloadData = async () => {
        setLoading(true);
        try {
            const data = await delivererService.getMyDeliveries();
            setPackages(data);
        } catch (e) {
            toast.error("Impossible de charger vos courses.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { reloadData(); }, []);

    // 2. LOGIQUE ACTIONS
    const handleMenuAction = async (action: string, pkg: DelivererPackage) => {
        setOpenMenuId(null); // Fermer le menu

        switch (action) {
            case 'DETAILS':
                setSelectedPackage(pkg);
                break;

            case 'CANCEL':
                if(!confirm(`Annuler la course ${pkg.trackingNumber} ?`)) return;
                await delivererService.cancelAssignment(pkg.id, "Annulation Livreur UI");
                toast.success("Assignation annulée.");
                reloadData();
                break;

            case 'PICKUP':
                const loadingP = toast.loading("Validation réception...");
                try {
                    await delivererService.pickupPackage(pkg.id);
                    toast.success("Colis marqué récupéré !", { id: loadingP });
                    reloadData();
                } catch(e:any) {
                    toast.error("Echec Pickup: " + e.message, { id: loadingP });
                }
                break;

            case 'DELIVER_CLIENT':
                // Simulation code
                const code = prompt("Entrez le code de validation client (Optionnel pour démo):");
                const loadingD = toast.loading("Validation livraison...");
                try {
                    await delivererService.deliverToClient(pkg.id, code || 'AUTO');
                    toast.success("Livraison Confirmée !", { id: loadingD });
                    reloadData();
                } catch(e:any) {
                    toast.error("Echec: " + e.message, { id: loadingD });
                }
                break;
            
            case 'DELIVER_RELAY':
                if (!pkg.arrivalRelayPointId) { toast.error("Relais destination introuvable."); return; }
                const loadingR = toast.loading("Dépôt relais...");
                try {
                    await delivererService.deliverToRelay(pkg.id, pkg.arrivalRelayPointId);
                    toast.success("Déposé au Relais avec succès.", { id: loadingR });
                    reloadData();
                } catch(e:any) {
                    toast.error("Echec Dépôt: " + e.message, { id: loadingR });
                }
                break;
        }
    };

    // 3. FILTRAGE
    const filteredPackages = packages.filter(p => {
        // Filtrage texte
        const matchSearch = p.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.recipientName?.toLowerCase().includes(searchTerm.toLowerCase());
        if(!matchSearch) return false;

        // Filtrage StatCard
        const s = p.currentStatus;
        if(filterStatus === 'PENDING') return s === 'ASSIGNED_TO_DELIVERER';
        if(filterStatus === 'IN_TRANSIT') return s === 'IN_TRANSIT' || s === 'FOR_PICKUP'; // FOR_PICKUP = à chercher
        if(filterStatus === 'COMPLETED') return s.includes('DELIVERED');
        // History = tout sauf en cours ? ou tout. Disons tout.
        return true; 
    });

    // Stats pour badges
    const countPending = packages.filter(p => p.currentStatus === 'ASSIGNED_TO_DELIVERER').length;
    const countTransit = packages.filter(p => p.currentStatus === 'IN_TRANSIT').length;
    const countDone = packages.filter(p => p.currentStatus.includes('DELIVERED')).length;


    // --- RENDU PRINCIPAL ---
    
    if (view === 'FIND') {
        return (
             <div className="fixed inset-0 z-50 bg-white">
                 <FindDelivery 
                     onClose={() => setView('LIST')}
                     onSelectPackage={async (pkg) => {
                         const tid = toast.loading("Assignation...");
                         await delivererService.assignPackage(pkg.id);
                         toast.success("Course Ajoutée !", {id: tid});
                         setView('LIST');
                         reloadData();
                     }}
                 />
             </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto p-6 space-y-8 animate-in fade-in" onClick={() => setOpenMenuId(null)}>
             
             {/* 1. EN-TÊTE DASHBOARD */}
             <div className="flex flex-col lg:flex-row justify-between items-end gap-6 bg-violet-900 text-white p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"/>
                 <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-2">
                         <div className="p-2 bg-white/20 backdrop-blur rounded-lg border border-white/20"><Truck className="w-8 h-8"/></div>
                         <h1 className="text-3xl font-black tracking-tight">Gestion de livraisons</h1>
                     </div>
                     <p className="text-violet-200 font-medium ml-1">Gérez votre flotte et vos missions en temps réel.</p>
                 </div>
                 
                 <div className="flex gap-4 relative z-10 w-full lg:w-auto">
                     <button onClick={reloadData} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur transition border border-white/10">
                         <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin':''}`}/>
                     </button>
                     <button onClick={() => setView('FIND')} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white text-violet-900 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 active:scale-95">
                         <Zap className="w-5 h-5"/> Trouver des courses
                     </button>
                 </div>
             </div>

             {/* 2. STATS FILTRES (KPI Cards Clickable) */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DeliveryStatCard 
                     title="En Attente" value={countPending.toString()} icon={Clock} color="orange"
                     active={filterStatus === 'PENDING'} onClick={() => setFilterStatus('PENDING')}
                  />
                  <DeliveryStatCard 
                     title="En Transit" value={countTransit.toString()} icon={Truck} color="blue"
                     active={filterStatus === 'IN_TRANSIT'} onClick={() => setFilterStatus('IN_TRANSIT')}
                  />
                  <DeliveryStatCard 
                     title="Terminés" value={countDone.toString()} icon={CheckCircle} color="green"
                     active={filterStatus === 'COMPLETED'} onClick={() => setFilterStatus('COMPLETED')}
                  />
                  <DeliveryStatCard 
                     title="Historique" value={packages.length.toString()} icon={Archive} color="slate"
                     active={filterStatus === 'HISTORY'} onClick={() => setFilterStatus('HISTORY')}
                  />
             </div>

             {/* 3. TABLEAU DES COLIS */}
             <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                 
                 {/* Toolbar Tableau */}
                 <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-black/20">
                     <div className="relative w-full md:w-96">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"/>
                         <input 
                            type="text" 
                            placeholder="Rechercher tracking, client..."
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-none rounded-xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-violet-500 outline-none transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                         />
                     </div>
                     <p className="text-xs font-bold uppercase text-slate-400">
                         Affichage: {filterStatus.replace('_', ' ')} ({filteredPackages.length})
                     </p>
                 </div>

                 {/* TABLE */}
                 <div className="flex-1 overflow-x-auto">
                     <table className="w-full text-left">
                         <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                             <tr>
                                 <th className="px-6 py-4">Identification</th>
                                 <th className="px-6 py-4">Départ</th>
                                 <th className="px-6 py-4">Arrivée</th>
                                 <th className="px-6 py-4">Revenu</th>
                                 <th className="px-6 py-4">Statut</th>
                                 <th className="px-6 py-4 text-right">Actions</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                             {filteredPackages.length > 0 ? (
                                 filteredPackages.map((pkg) => (
                                     <DeliveryRow 
                                         key={pkg.id} 
                                         pkg={pkg} 
                                         isMenuOpen={openMenuId === pkg.id}
                                         onMenuToggle={(id: string) => setOpenMenuId(id === openMenuId ? null : id)}
                                         onAction={handleMenuAction}
                                     />
                                 ))
                             ) : (
                                 <tr>
                                     <td colSpan={6} className="py-20 text-center">
                                         <div className="flex flex-col items-center opacity-50">
                                             <Package className="w-16 h-16 text-slate-300 mb-4"/>
                                             <p className="text-slate-500 font-medium">Aucune course trouvée dans cette catégorie.</p>
                                             {filterStatus !== 'HISTORY' && (
                                                 <button onClick={() => setView('FIND')} className="mt-4 text-violet-600 font-bold hover:underline">Trouver une course</button>
                                             )}
                                         </div>
                                     </td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                 </div>
             </div>

             {/* SIDEBAR DÉTAILS (Inclus depuis fichier séparé) */}
             <PackageSidebar 
                 isOpen={!!selectedPackage}
                 pkg={selectedPackage!}
                 onClose={() => setSelectedPackage(null)}
                 // Mapping des actions pour réutilisation du bouton Sidebar
                 onAssign={() => {}} // Non utilisé ici
                 onPickup={() => handleMenuAction('PICKUP', selectedPackage!)}
                 onDeliver={() => handleMenuAction('DELIVER_CLIENT', selectedPackage!)}
                 // UI Config
                 showAction={selectedPackage?.currentStatus !== 'DELIVERED'}
                 actionLoading={false} 
             />

        </div>
    );
}
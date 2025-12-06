// FICHIER: src/app/dashboard/Inventaire.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, PlusCircle, Search, Filter, Eye, X, Phone, Send, Archive, 
  Inbox, Loader2, ArrowUpRight, ArrowDownLeft, Building, Clock, Truck, CheckCircle, Sparkles, 
  AlertTriangle, Zap, MoreVertical, ArchiveRestore, Send as SendIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserProfile } from './page';
import { relayPointService, RelayPoint } from '@/services/relayPointService';
import { DepotColis } from '../depot/depot';
import { WithdrawPackagePage } from '../withdraw-package/retrait';

type ParcelStatusUI = 'En attente de dépôt' | 'En stock' | 'Retiré' | 'En transit' | 'Au départ' | 'Annulé'| 'Arrivé au relais';
type ParcelType = 'Standard' | 'Express';

interface Parcel {
  id: string;
  status: ParcelStatusUI;
  type: ParcelType;
  arrivalDate: string;
  location: string;
  designation: string;
  shippingCost: number;
  sender: { name: string; phone: string; originAddress: string; };
  recipient: { name: string; phone: string; deliveryAddress: string; };
  isFromMyRelay: boolean; 
  isToMyRelay: boolean;
  rawStatus: string;
}

interface Stats {
  total: number;
  enAttente: number;
  enStock: number;
  retire: number;
  enTransit: number;
}

// Fonction de sécurité critique
const safeExtractArray = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.packages && Array.isArray(data.packages)) return data.packages;
  if (data.content && Array.isArray(data.content)) return data.content;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.items && Array.isArray(data.items)) return data.items;
  return [];
};

const getSafeId = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object' && val.id) return String(val.id);
  return '';
};

// --- COMPOSANTS UI ---

const StatCard = ({ label, value, icon: Icon, color }: any) => {
    const colorClass = {
        orange: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
        yellow: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
        green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
        blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
        purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20'
    }[color as string] || 'text-gray-600 bg-gray-50';

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
             <div className="flex justify-between items-start">
                 <div>
                     <p className="text-xs text-gray-500 uppercase font-bold mb-1">{label}</p>
                     <p className="text-2xl font-black text-slate-800 dark:text-white">{value}</p>
                 </div>
                 <div className={`p-2 rounded-lg ${colorClass}`}>
                     <Icon className="w-5 h-5"/>
                 </div>
             </div>
        </div>
    );
}

// --- CARTE D'INVENTAIRE REVISITÉE ---

function InventoryCard({ 
    parcel, 
    onClickDetails,
    onActionDepot, 
    onActionRetrait 
}: { 
    parcel: Parcel; 
    onClickDetails: () => void;
    onActionDepot: () => void;
    onActionRetrait: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);

    // Fermer le menu au clic extérieur
    useEffect(() => {
        const handleClickOutside = () => setShowMenu(false);
        if(showMenu) window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [showMenu]);

    // Style Status
    let statusBorder = "bg-gray-300";
    let statusBadge = "bg-gray-100 text-gray-600 border-gray-200";
    const s = parcel.rawStatus.toUpperCase();

    // Logique d'actions
    const canDeposit = s.includes('ATTENTE') || s.includes('PRE') || s.includes('PENDING');
    const canWithdraw = s.includes('ARRIVE') || s.includes('STOCK') || s.includes('AT_ARRIVAL');

    if (canDeposit) {
        statusBorder = "bg-orange-400";
        statusBadge = "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800";
    } else if (s.includes('TRANSIT')) {
        statusBorder = "bg-blue-500";
        statusBadge = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
    } else if (canWithdraw) {
        statusBorder = "bg-emerald-500";
        statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800";
    } else if (s.includes('RECU') || s.includes('LIVRE')) {
        statusBorder = "bg-purple-500";
        statusBadge = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800";
    }

    const DirIcon = parcel.isFromMyRelay ? ArrowUpRight : ArrowDownLeft;
    const dirColor = parcel.isFromMyRelay 
        ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20" 
        : "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20";

    return (
        <div className="relative w-full flex items-center bg-white dark:bg-slate-800 p-0 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group overflow-visible z-0 hover:z-10">
            
            {/* Barre latérale colorée */}
            <div className={`w-1.5 self-stretch rounded-l-xl ${statusBorder} flex-shrink-0`}></div>
            
            {/* Contenu Principal Clickable */}
            <div className="flex-1 flex items-center gap-4 py-3 px-3 cursor-pointer min-w-0" onClick={onClickDetails}>
                
                {/* Icone + ID */}
                <div className="flex items-center gap-3 min-w-[130px]">
                    <div className={`p-2 rounded-lg ${dirColor}`}>
                        <DirIcon className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm block truncate max-w-[90px]">
                            {parcel.id.length > 10 ? parcel.id.substring(0,8)+'..' : parcel.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            {parcel.arrivalDate}
                            {parcel.type === 'Express' && <Zap className="w-3 h-3 text-red-500 fill-current"/>}
                        </span>
                    </div>
                </div>

                {/* Infos Milieu */}
                <div className="flex-1 hidden sm:block min-w-0 border-l border-slate-100 dark:border-slate-700 pl-4">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate" title={parcel.designation}>{parcel.designation}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 truncate">
                         <span>{parcel.sender.name.split(' ')[0]}</span>
                         <span className="text-slate-300">&rarr;</span>
                         <span className="font-medium">{parcel.recipient.name}</span>
                    </div>
                </div>
                
                {/* Statut (Badge) */}
                <div className="hidden md:flex items-center">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusBadge}`}>
                        {parcel.status}
                    </span>
                </div>
            </div>

            {/* Actions Droite */}
            <div className="flex items-center gap-3 pr-3 pl-2 border-l border-slate-100 dark:border-slate-700 h-12 relative">
                <div className="hidden lg:block text-right pr-2">
                     <p className="font-bold text-slate-800 dark:text-white text-sm">{parcel.shippingCost.toLocaleString()} F</p>
                </div>

                {/* MENU CONTEXTUEL */}
                <div className="relative">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${showMenu ? 'bg-slate-100 dark:bg-slate-700 text-orange-600' : 'text-slate-400'}`}
                    >
                        <MoreVertical className="w-5 h-5"/>
                    </button>
                    
                    <AnimatePresence>
                    {showMenu && (
                        <motion.div 
                           initial={{ opacity: 0, scale: 0.95, y: 10 }}
                           animate={{ opacity: 1, scale: 1, y: 0 }}
                           exit={{ opacity: 0, scale: 0.95 }}
                           className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-600 overflow-hidden z-50"
                        >
                            <div className="p-1 flex flex-col gap-1">
                                <button 
                                   onClick={(e) => { e.stopPropagation(); setShowMenu(false); onClickDetails(); }}
                                   className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2"
                                >
                                   <Eye className="w-4 h-4 text-slate-400"/> Voir Détails
                                </button>
                                
                                {canDeposit && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowMenu(false); onActionDepot(); }}
                                        className="w-full text-left px-3 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg flex items-center gap-2"
                                    >
                                       <SendIcon className="w-4 h-4"/> Enregistrer Dépôt
                                    </button>
                                )}
                                
                                {canWithdraw && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowMenu(false); onActionRetrait(); }}
                                        className="w-full text-left px-3 py-2 text-sm font-bold text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg flex items-center gap-2"
                                    >
                                       <ArchiveRestore className="w-4 h-4"/> Valider Retrait
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// Modale de détails stylisée
const DetailsModal = ({ parcel, onClose }: { parcel: Parcel | null; onClose: () => void; }) => {
  if (!parcel) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-6 text-white flex justify-between items-start relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="z-10">
                <div className="flex items-center gap-3 mb-2">
                    <span className="p-2 bg-white/20 rounded-lg backdrop-blur-sm border border-white/20"><Package className="w-6 h-6" /></span>
                    <h2 className="text-2xl font-bold tracking-tight">{parcel.designation}</h2>
                </div>
                <p className="text-orange-100 text-sm font-mono opacity-90 flex items-center gap-2"><span className="bg-black/20 px-2 py-0.5 rounded text-xs">#{parcel.id}</span> {parcel.status}</p>
            </div>
            <button onClick={onClose} className="bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition z-10"><X className="w-5 h-5" /></button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-3 gap-4 text-center">
                 <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700">
                     <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Date</p>
                     <p className="text-sm font-bold text-slate-700 dark:text-white">{parcel.arrivalDate}</p>
                 </div>
                 <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700">
                     <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Type</p>
                     <p className="text-sm font-bold text-slate-700 dark:text-white">{parcel.type}</p>
                 </div>
                 <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700">
                     <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Coût</p>
                     <p className="text-sm font-bold text-green-600">{parcel.shippingCost.toLocaleString()} F</p>
                 </div>
            </div>
            <div className="relative border-l-2 border-dashed border-slate-300 dark:border-slate-600 ml-3 space-y-8 pl-6">
                 <div className="relative">
                     <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border-4 border-blue-500"></div>
                     <h4 className="text-xs font-bold uppercase text-slate-400 mb-1">Expéditeur</h4>
                     <p className="font-bold text-slate-800 dark:text-white">{parcel.sender.name}</p>
                     <p className="text-sm text-slate-500">{parcel.sender.phone}</p>
                     <p className="text-xs text-slate-400 mt-1 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg inline-block border dark:border-slate-700">📍 {parcel.sender.originAddress}</p>
                 </div>
                 <div className="relative">
                     <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border-4 border-green-500"></div>
                     <h4 className="text-xs font-bold uppercase text-slate-400 mb-1">Destinataire</h4>
                     <p className="font-bold text-slate-800 dark:text-white">{parcel.recipient.name}</p>
                     <p className="text-sm text-slate-500">{parcel.recipient.phone}</p>
                     <p className="text-xs text-slate-400 mt-1 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg inline-block border dark:border-slate-700">📍 {parcel.recipient.deliveryAddress}</p>
                 </div>
            </div>
        </div>
        <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
             <button onClick={onClose} className="px-5 py-2 rounded-xl bg-white border dark:bg-slate-700 dark:border-slate-600 dark:text-white text-slate-700 font-bold text-sm shadow-sm hover:bg-slate-50">Fermer</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function InventoryPage({ profile }: { profile: UserProfile }) {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [filteredParcels, setFilteredParcels] = useState<Parcel[]>([]);
  const [myRelay, setMyRelay] = useState<RelayPoint | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, enAttente: 0, enStock: 0, retire: 0, enTransit: 0 });
  const [myRelayId, setMyRelayId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | ParcelStatusUI>('Tous');
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'inventory' | 'depot' | 'retrait'>('inventory');

  const mapStatus = useCallback((rawStatus: string, isFromMe: boolean, isToMe: boolean): ParcelStatusUI => {
    const s = (rawStatus || '').toUpperCase();
    
    if (isFromMe) {
      // Colis partant de chez moi
      if (['PRE_REGISTERED', 'PENDING_DEPOSIT', 'EN_ATTENTE_DE_DEPOT', 'PENDING'].some(k => s.includes(k))) return 'En attente de dépôt';
      if (['AU_DEPART', 'AT_DEPARTURE_RELAY_POINT'].some(k => s.includes(k))) return 'Au départ';
      if (['RECU', 'DELIVERED', 'COMPLETED', 'WITHDRAWN', 'LIVRE'].some(k => s.includes(k))) return 'Retiré';
      return 'En transit';
    }
    
    if (isToMe) {
      // Colis venant vers moi (RELAIS D'ARRIVÉE)
      
      // *** MODIFICATION DEMANDÉE ICI ***
      // Si EN_TRANSIT (vers moi), je l'affiche comme 'Arrivé au relais' 
      // Cela permet au gestionnaire de valider la réception/retrait directement
      if (['ARRIVE_AU_RELAIS', 'AT_ARRIVAL_RELAY_POINT', 'AT_RELAY_POINT', 'ARRIVED', 'EN_TRANSIT', 'IN_TRANSIT', 'DEPART', 'TRANSIT'].some(k => s.includes(k))) {
          return 'Arrivé au relais'; // J'affiche ce statut pour tout ce qui est transit+arrivée
      }

      if (['RECU', 'DELIVERED', 'COMPLETED', 'WITHDRAWN', 'LIVRE'].some(k => s.includes(k))) return 'Retiré';
    }

    if (['ANNULE', 'CANCELLED', 'REJECTED'].some(k => s.includes(k))) return 'Annulé';
    return 'En transit';
  }, []);


  const fetchInventory = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      let targetRelayId = myRelayId;
      if (!targetRelayId) {
        const allPointsRaw = await relayPointService.getAllRelayPoints();
        const safePoints = safeExtractArray(allPointsRaw);
        const found = safePoints.find(p => String(p.ownerId) === String(profile.id));
        if (!found) { setIsLoading(false); return; }
        targetRelayId = found.id;
        setMyRelay(found);
        setMyRelayId(found.id);
      }

      if (targetRelayId) {
        const results = await Promise.allSettled([
          relayPointService.getPackagesByRelayPoint(targetRelayId),
          relayPointService.getPackagesForExpedition(targetRelayId),
          relayPointService.getPackagesForPickup(targetRelayId)
        ]);
        const allPackages = safeExtractArray(results[0].status === 'fulfilled' ? results[0].value : null);
        const forExpedition = safeExtractArray(results[1].status === 'fulfilled' ? results[1].value : null);
        const forPickup = safeExtractArray(results[2].status === 'fulfilled' ? results[2].value : null);
        const processedIds = new Set<string>();
        const uiParcels: Parcel[] = [];

        const convertToUi = (p: any): Parcel => {
          const trackNum = p.trackingNumber || p.tracking_number;
          const rawId = getSafeId(p) || trackNum;
          const isExpeditionList = forExpedition.some((x: any) => getSafeId(x) === rawId || x.trackingNumber === trackNum);
          const isPickupList = forPickup.some((x: any) => getSafeId(x) === rawId || x.trackingNumber === trackNum);
          const depId = String(p.departureRelayPointId || p.departurePointId || '');
          const arrId = String(p.arrivalRelayPointId || p.arrivalPointId || '');
          const myIdStr = String(targetRelayId);
          const isFromMe = isExpeditionList || depId === myIdStr;
          const isToMe = isPickupList || arrId === myIdStr;
          return {
            id: trackNum || "N/A",
            rawStatus: p.status || p.currentStatus || "UNKNOWN",
            status: mapStatus(p.status || p.currentStatus, isFromMe, isToMe),
            type: (Number(p.deliveryFee || p.shippingCost) > 15000) ? 'Express' : 'Standard',
            arrivalDate: new Date(p.createdAt || Date.now()).toLocaleDateString('fr-FR'),
            location: isToMe ? 'Arrivée' : 'Départ',
            designation: p.description || "Colis Standard",
            shippingCost: Number(p.deliveryFee || p.shippingCost || 0),
            sender: { name: p.senderName || 'Inconnu', phone: p.senderPhone || '-', originAddress: p.pickupAddress || '...' },
            recipient: { name: p.recipientName || 'Destinataire', phone: p.recipientPhone || '-', deliveryAddress: p.deliveryAddress || '...' },
            isFromMyRelay: isFromMe,
            isToMyRelay: isToMe
          };
        };
        [...forPickup, ...forExpedition, ...allPackages].forEach(pkg => {
          const id = getSafeId(pkg) || pkg.trackingNumber;
          if (id && !processedIds.has(id)) { processedIds.add(id); uiParcels.push(convertToUi(pkg)); }
        });
        uiParcels.sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime());
        setParcels(uiParcels);
        setFilteredParcels(uiParcels);
        setStats({
          total: uiParcels.length,
          enAttente: uiParcels.filter(p => p.status === 'En attente de dépôt').length,
          enStock: uiParcels.filter(p => p.status === 'En stock').length,
          retire: uiParcels.filter(p => p.status === 'Retiré').length,
          enTransit: uiParcels.filter(p => p.status === 'En transit' || p.status === 'Au départ').length
        });
      }
    } catch (err: any) {
         if (err.message !== 'NO_RELAY_POINT') setError("Erreur sync serveur.");
    } finally {
      setIsLoading(false);
    }
  }, [profile, myRelayId, mapStatus]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  useEffect(() => {
    let results = parcels;
    if (searchQuery) results = results.filter(p => p.id.toLowerCase().includes(searchQuery.toLowerCase()) || p.recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sender.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (statusFilter !== 'Tous') results = results.filter(p => p.status === statusFilter);
    setFilteredParcels(results);
  }, [searchQuery, statusFilter, parcels]);

  // Fonction Action Handler
  const handleTriggerDepot = (tracking: string) => {
      if(typeof window !== 'undefined') localStorage.setItem('prefill_package_id', tracking);
      setActiveView('depot');
  };

  const handleTriggerRetrait = (tracking: string) => {
      if(typeof window !== 'undefined') localStorage.setItem('prefill_package_id', tracking);
      setActiveView('retrait');
  };

  const handleActionClose = () => { setActiveView('inventory'); fetchInventory(); };

  if (isLoading) return <div className="h-96 flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-orange-500 w-12 h-12"/><p className="text-slate-500 animate-pulse">Synchronisation...</p></div>;
  if (error) return <div className="p-8 text-center bg-red-50 border border-red-200 text-red-600 font-bold rounded-xl">{error}</div>;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <AnimatePresence>{isModalOpen && <DetailsModal parcel={selectedParcel} onClose={() => setIsModalOpen(false)} />}</AnimatePresence>
      <AnimatePresence mode="wait">
        {activeView === 'inventory' ? (
          <motion.div key="inventory-main" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            {/* EN-TÊTE */}
            <div className="flex flex-col lg:flex-row justify-between items-end mb-8 gap-6">
                <div>
                     <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-500 rounded-xl shadow-lg shadow-orange-500/30"><Building className="w-6 h-6 text-white" /></div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{myRelay?.relayPointName || "Inventaire"}</h1>
                     </div>
                     <p className="text-slate-500 dark:text-slate-400 font-medium pl-1">{myRelay?.address || "Opérations de colis"}</p>
                </div>
                <div className="flex gap-3">
                     <button onClick={() => setActiveView('depot')} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold shadow-lg transition flex items-center gap-2"><PlusCircle className="w-5 h-5"/> Dépôt</button>
                     <button onClick={() => setActiveView('retrait')} className="bg-white dark:bg-slate-700 border dark:border-slate-600 text-slate-700 dark:text-white px-5 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center gap-2"><ArrowDownLeft className="w-5 h-5"/> Retrait</button>
                </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
               <StatCard label="Flux Total" value={stats.total} icon={Inbox} color="orange" />
               <StatCard label="En Stock" value={stats.enStock} icon={Archive} color="green" />
               <StatCard label="Attente Dépôt" value={stats.enAttente} icon={Clock} color="yellow" />
               <StatCard label="Transit" value={stats.enTransit} icon={Truck} color="blue" />
               <StatCard label="Historique" value={stats.retire} icon={CheckCircle} color="purple" />
            </div>

            {/* FILTRES */}
            <div className="sticky top-2 z-10 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-2 p-2">
                     <div className="relative flex-1">
                         <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                         <input type="text" className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white font-medium" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                     </div>
                     <div className="relative min-w-[200px]">
                         <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                         <select className="w-full pl-11 pr-8 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-orange-500 text-slate-700 dark:text-slate-200 font-bold cursor-pointer appearance-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                            <option value="Tous">Tous les status</option>
                            <option value="En stock">📦 En Stock</option>
                            <option value="En attente de dépôt">⏳ Attente Dépôt</option>
                            <option value="En transit">🚚 En Transit</option>
                            <option value="Retiré">✅ Terminés</option>
                         </select>
                     </div>
                </div>
            </div>

            {/* LISTE */}
            <div className="min-h-[400px]">
                {filteredParcels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center dark:bg-gray-900 dark:border-gray-600 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-3xl"><Inbox className="w-16 h-16 text-gray-300 mb-4" /><h3 className="text-lg font-bold text-gray-500">Aucun colis</h3></div>
                ) : (
                    <div className="space-y-3">
                        {filteredParcels.map((parcel) => (
                            <InventoryCard 
                                key={parcel.id} 
                                parcel={parcel} 
                                onClickDetails={() => { setSelectedParcel(parcel); setIsModalOpen(true); }} 
                                onActionDepot={() => handleTriggerDepot(parcel.id)}
                                onActionRetrait={() => handleTriggerRetrait(parcel.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
          </motion.div>
        ) : (
          // VUE INTERNE (DEPOT/RETRAIT)
          <motion.div key="action-view" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden min-h-screen flex flex-col">
             <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur flex justify-between items-center sticky top-0 z-10">
                 <div className="flex items-center gap-3"><div className={`p-2.5 rounded-xl ${activeView === 'depot' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>{activeView === 'depot' ? <PlusCircle className="w-6 h-6"/> : <ArrowDownLeft className="w-6 h-6"/>}</div><div><h2 className="text-lg font-bold text-slate-800 dark:text-white">{activeView === 'depot' ? 'Dépôt de Colis' : 'Retrait Client'}</h2></div></div>
                 <button onClick={handleActionClose} className="group flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition"><ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" /> <span className="hidden sm:inline">Retour</span></button>
             </div>
             <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-950">
                 {activeView === 'depot' ? <DepotColis onClose={handleActionClose} onSuccess={handleActionClose} /> : <WithdrawPackagePage onClose={handleActionClose} onSuccess={handleActionClose} />}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, CheckCircle, Truck, MoreVertical, MapPin, ListOrdered, Loader2,
  Inbox, Send, Package as PackageIcon, User, Search,
  MessageSquareWarning, AlertTriangle, Plus, ArrowLeft,
  X, Box, Eye, DollarSign, Smartphone, Tag,
  Phone, Package, Wallet, Archive, PlayCircle,
  TrendingUp
} from 'lucide-react'; // Mise à jour des imports Lucide pour avoir les icônes des stats

import { packageService } from '@/services/packageService';
import ShippingPage from '../expedition/page';
import TrackPackagePage from '../track-package/page';

// --- TYPES ET INTERFACES ---

export interface UserProfile {
    id: string;
    account_type: string;
    manager_name: string;
    email: string;
}

export interface Shipment {
    id: string;
    tracking_number: string;
    status: string;
    created_at: string;
    
    // Personnes
    sender_name: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;

    // Details
    description: string;
    shipping_cost: number;
    weight: number;
    package_type: string;
    special_instructions: string;
    dimensions_raw: string;
    payment_status: string;
    
    // Lieux
    pickup_address: string;
    delivery_address: string;
    delivery_option: string;
}

// --- UTILITAIRES ---

const mapBackendToUi = (pkg: any): Shipment => {
    return {
        id: pkg.id,
        tracking_number: pkg.trackingNumber || pkg.tracking_number || 'N/A',
        status: pkg.currentStatus || pkg.status || 'PRE_REGISTERED',
        created_at: pkg.createdAt || new Date().toISOString(),

        sender_name: "Moi",
        recipient_name: pkg.recipientName || 'Inconnu',
        recipient_phone: pkg.recipientPhone || '',
        recipient_address: pkg.recipientAddress || '',

        description: pkg.description || '',
        shipping_cost: Number(pkg.deliveryFee || pkg.shippingCost || 0),
        weight: pkg.weight || 0,
        package_type: pkg.packageType || 'STANDARD',
        special_instructions: pkg.specialInstructions || '',
        dimensions_raw: pkg.dimensions || "{}",
        payment_status: pkg.paymentStatus || 'PENDING',

        pickup_address: pkg.pickupAddress || 'Point Départ Inconnu',
        delivery_address: pkg.deliveryAddress || 'Destination Inconnue',
        delivery_option: pkg.deliveryOption || ''
    };
};

const getStatusConfig = (status: string) => {
  const s = (status || '').toUpperCase();
  
  if (s.includes('ATTENTE') || s.includes('PENDING') || s === 'PRE_REGISTERED') 
      return { label: 'En attente', color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' };
  if (s.includes('DEPART') || s.includes('TRANSIT')) 
      return { label: 'En transit', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' };
  if (s.includes('ARRIVE') || s.includes('RELAY')) 
      return { label: 'Au point relais', color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' };
  if (s.includes('RECU') || s.includes('LIVRE') || s === 'DELIVERED' || s === 'WITHDRAWN') 
      return { label: 'Livré', color: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' };
  if (s.includes('ANNULE')) 
      return { label: 'Annulé', color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' };

  return { label: s.replace(/_/g, ' '), color: 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' };
};

// --- NOUVEAU COMPOSANT : CARTES STATS ---

// --- Composant Carte Statistique ---
const StatCard = ({ title, value, icon: Icon, trend, color }: { 
  title: string; value: string; icon: React.ElementType; trend?: string; color: string; 
}) => {
  const colors: Record<string, { bg: string, text: string, iconBg: string }> = {
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/40' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/40' }
  };

  const style = colors[color] || colors.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -5 }}
      className={`relative overflow-hidden p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm ${style.bg}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
          {trend && (
            <div className="flex items-center mt-2 text-xs font-medium text-green-600 dark:text-green-400">
              <TrendingUp className="w-3 h-3 mr-1" /> <span>{trend} vs mois dernier</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${style.iconBg} ${style.text}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};


// --- COMPOSANTS ENFANTS EXISTANTS (Légèrement optimisés) ---

const ActionMenu = ({ shipment, onClose, onViewDetails }: { shipment: Shipment, onClose: () => void, onViewDetails: () => void }) => (
    <>
    <div className="fixed inset-0 z-10 cursor-default" onClick={onClose} />
    <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute top-10 right-2 z-20 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden origin-top-right"
        onClick={(e) => e.stopPropagation()}
    >
        <div className="p-1 flex flex-col gap-1">
            <button 
                onClick={() => { onViewDetails(); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-700 transition-colors text-left"
            >
                <Eye className="w-4 h-4" /> Voir Détails
            </button>
            
            <button 
                onClick={() => { window.open(`/track-package?ref=${shipment.tracking_number}`, '_blank'); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-700 transition-colors text-left"
            >
                <ListOrdered className="w-4 h-4" /> Suivre le colis
            </button>

            <div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2" />
            
            <button 
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
                <MessageSquareWarning className="w-4 h-4" /> Signaler un problème
            </button>
        </div>
    </motion.div>
    </>
);

const PackageCard = ({ shipment, onMenuClick, activeMenuId, onViewDetails }: any) => {
    const statusConfig = getStatusConfig(shipment.status);
    
    return (
        <div className="relative">
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -3 }}
                className={`group relative overflow-visible rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md border-2 ${statusConfig.color.includes('border') ? '' : 'border-gray-100 '} border-opacity-50 transition-all dark:border-gray-700 duration-200`}
            >
                <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-2.5 rounded-xl shrink-0">
                                <Package className="w-6 h-6 text-orange-600 dark:text-orange-500"/>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate tracking-tight">{shipment.tracking_number}</p>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{shipment.description}</h3>
                            </div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onMenuClick(shipment.id); }}
                            className="p-1.5 -mr-2 -mt-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <MoreVertical className="w-5 h-5"/>
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                         <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border bg-opacity-50 ${statusConfig.color}`}>
                            {statusConfig.label}
                         </span>
                         <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-400 flex items-center gap-1 border border-gray-200 dark:border-gray-700">
                            <Tag className="w-3 h-3"/> {shipment.package_type}
                         </span>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs">
                         <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Destinataire:</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-300 truncate max-w-[140px]">{shipment.recipient_name}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Vers:</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[140px]">{shipment.delivery_address}</span>
                         </div>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {activeMenuId === shipment.id && (
                    <ActionMenu 
                        shipment={shipment} 
                        onClose={() => onMenuClick(null)} 
                        onViewDetails={() => onViewDetails(shipment)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// ... (Le composant DetailsSidebar reste identique à l'original pour économiser l'espace, je le réinclus ici par sécurité) ...
const DetailsSidebar = ({ shipment, onClose }: { shipment: Shipment, onClose: () => void }) => {
    if (!shipment) return null;
    let dimsString = "N/A";
    try { const d = JSON.parse(shipment.dimensions_raw); if(d) dimsString = `${d.length || '?'}x${d.width || '?'}x${d.height || '?'} cm`; } catch (e) {}

    return (
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed inset-y-0 right-0 z-50 w-full md:w-[450px] bg-white dark:bg-gray-900 shadow-2xl border-l dark:border-gray-800 flex flex-col h-full">
            <div className="px-6 py-5 border-b dark:border-gray-800 bg-orange-50 dark:bg-gray-800/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><PackageIcon className="w-5 h-5 text-orange-600"/> Détails complets</h2>
                <button onClick={onClose} className="p-2 rounded-full bg-white dark:bg-gray-700 shadow-sm text-gray-500 hover:text-gray-800"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <section className="text-center space-y-2">
                    <h3 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight break-all">{shipment.tracking_number}</h3>
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-wide mt-2 border border-blue-100 dark:bg-gray-600/20 dark:border-blue-800">{shipment.status}</div>
                </section>
                <section className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <div><p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> Coût</p><p className="font-bold text-lg text-gray-900 dark:text-white">{shipment.shipping_cost.toLocaleString()} FCFA</p></div>
                    <div><p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Smartphone className="w-3 h-3"/> Paiement</p><p className={`font-bold text-sm ${shipment.payment_status === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>{shipment.payment_status || "EN ATTENTE"}</p></div>
                </section>
                <section>
                    <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Box className="w-4 h-4"/> Info Colis</h4>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">"{shipment.description}"</p>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span>Poids:</span><span className="font-semibold">{shipment.weight} kg</span></div>
                        <div className="flex justify-between"><span>Dimensions:</span><span className="font-mono">{dimsString}</span></div>
                        {shipment.special_instructions && <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-xs text-yellow-700 dark:text-yellow-400"><span className="font-bold">Note:</span> {shipment.special_instructions}</div>}
                    </div>
                </section>
                <section className="space-y-4 border-l-2 border-dashed border-gray-200 dark:border-gray-700 pl-4 ml-2">
                    <div>
                        <p className="text-xs font-bold uppercase text-gray-400">Départ</p>
                        <p className="font-bold">{shipment.sender_name}</p>
                        <p className="text-xs text-gray-500">{shipment.pickup_address}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase text-gray-400">Arrivée</p>
                        <p className="font-bold">{shipment.recipient_name}</p>
                        <p className="text-xs text-gray-500">{shipment.delivery_address}</p>
                    </div>
                </section>
            </div>
        </motion.div>
    );
}

// --- COMPOSANT PRINCIPAL ---

export default function ClientPackagesPage({ profile }: { profile: UserProfile }) {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [showShippingForm, setShowShippingForm] = useState(false);
    const [showTrackingPage, setShowTrackingPage] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

    useEffect(() => {
        const loadPackages = async () => {
            setLoading(true);
            try {
                const data = await packageService.getMyPackages();
                if (data && Array.isArray(data)) {
                    const uiData = data.map(mapBackendToUi);
                    // Tri par date décroissante (le plus récent en premier)
                    uiData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    setShipments(uiData);
                } else {
                    setShipments([]);
                }
            } catch (err: any) {
                console.error(err);
                setError("Erreur chargement colis. " + (err.message || ""));
            } finally {
                setLoading(false);
            }
        };
        if(profile) loadPackages();
    }, [profile]);

    // Calcul des Stats pour les cartes en haut
    const stats = useMemo(() => {
        let totalSpent = 0;
        let active = 0;     // En cours
        let completed = 0;  // Terminé
        let pending = 0;    // En attente d'envoi (pré-enregistré)

        shipments.forEach(s => {
            // Somme montant
            totalSpent += s.shipping_cost || 0;

            const st = s.status.toUpperCase();
            
            if (['RECU', 'LIVRE', 'DELIVERED', 'WITHDRAWN', 'COMPLETED'].some(k => st.includes(k))) {
                completed++;
            } else if (['TRANSIT', 'DEPART', 'RELAY', 'ARRIVE'].some(k => st.includes(k))) {
                active++;
            } else if (['ANNULE', 'CANCELLED', 'ARCHIVED'].some(k => st.includes(k))) {
                // Annulé : on ne le compte pas dans "actif" ni "completed", mais juste dans Total
            } else {
                // Tout le reste est "En attente" (Pré-enregistré, En attente de dépôt)
                pending++;
            }
        });

        return { 
            totalCount: shipments.length,
            totalSpent,
            active,
            completed,
            pending
        };
    }, [shipments]);

    const toggleMenu = (id: string) => setActiveMenuId(prev => prev === id ? null : id);

    if (showShippingForm) return <div className="animate-in fade-in"><button onClick={()=>setShowShippingForm(false)} className="mb-4 flex items-center text-orange-600 gap-2"><ArrowLeft className="w-4 h-4"/> Retour</button><ShippingPage /></div>;
    if (showTrackingPage) return <div className="animate-in fade-in"><button onClick={()=>setShowTrackingPage(false)} className="mb-4 flex items-center text-orange-600 gap-2"><ArrowLeft className="w-4 h-4"/> Retour</button><TrackPackagePage /></div>;

    return (
        <div className="p-4 space-y-8 pb-24 relative min-h-screen">
             {/* HEADER */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Colis</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Historique et gestion de vos expéditions</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => setShowTrackingPage(true)} className="flex-1 md:flex-none bg-white dark:bg-gray-800 border dark:border-gray-700 px-5 py-2.5 rounded-xl font-semibold text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                       <Search className="w-4 h-4 inline mr-2"/> Suivre
                    </button>
                    <button onClick={() => setShowShippingForm(true)} className="flex-1 md:flex-none bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold shadow hover:bg-orange-700 flex items-center justify-center gap-2 transition">
                        <Plus className="w-5 h-5"/> Nouvel Envoi
                    </button>
                </div>
            </div>
            
            {/* SECTION STATS CARDS (NOUVEAU) */}
            {!loading && shipments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard 
                        title="Total Colis" 
                        value={stats.totalCount.toString()} 
                        icon={Archive} 
                        color="orange"
                    />
                    <StatCard 
                        title="En cours" 
                        value={stats.active.toString()} 
                        icon={PlayCircle} 
                        color="orange"
                    />
                    <StatCard 
                        title="Terminés" 
                        value={stats.completed.toString()} 
                        icon={CheckCircle} 
                        color="orange"
                    />
                    <StatCard 
                        title="Total Dépensé" 
                        value={stats.totalSpent.toLocaleString() + ' F'} 
                        icon={Wallet} 
                        color="orange"
                    />
                </div>
            )}

            {/* ALERTS & LOADING */}
            {error && <div className="bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> {error}</div>}

            {/* LISTE COLIS */}
            {loading ? (
                <div className="py-32 flex justify-center"><Loader2 className="animate-spin w-10 h-10 text-orange-500"/></div>
            ) : shipments.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <Inbox className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"/>
                    <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300">Aucun historique</h3>
                    <p className="text-gray-500 dark:text-gray-500 mb-6">Commencez par envoyer votre premier paquet !</p>
                    <button onClick={() => setShowShippingForm(true)} className="text-orange-600 dark:text-orange-500 font-bold hover:underline">Envoyer maintenant</button>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Liste des Envois</h3>
                        <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <AnimatePresence>
                        {shipments.map(shipment => (
                            <PackageCard 
                               key={shipment.id} 
                               shipment={shipment} 
                               activeMenuId={activeMenuId} 
                               onMenuClick={toggleMenu} 
                               onViewDetails={setSelectedShipment}
                            />
                        ))}
                        </AnimatePresence>
                    </div>
                </>
            )}
            
            {/* SIDEBAR DETAILS MODALE */}
            <AnimatePresence>
                {selectedShipment && (
                    <>
                       <motion.div 
                          initial={{opacity:0}} animate={{opacity:0.4}} exit={{opacity:0}} 
                          className="fixed inset-0 bg-black z-40 backdrop-blur-sm"
                          onClick={() => setSelectedShipment(null)}
                       />
                       <DetailsSidebar shipment={selectedShipment} onClose={() => setSelectedShipment(null)} />
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
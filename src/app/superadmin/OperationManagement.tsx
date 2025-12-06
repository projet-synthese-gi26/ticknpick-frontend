'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { 
    Package, Building, Search, Filter, Loader2, X, Eye, Edit, Ban, PlusCircle, 
    Map, List, CheckCircle, ArrowLeft, ArrowRight, Calendar, User, Phone, 
    MapPin, DollarSign, MoreVertical, AlertTriangle
} from 'lucide-react';
import { adminService, AdminPackage } from '@/services/adminService';

// --- Services Backend ---
import { relayPointService, RelayPoint } from '@/services/relayPointService';

import apiClient from '@/services/apiClient';

import 'leaflet/dist/leaflet.css';
// LEAFLET HACK POUR ICONES
import L from 'leaflet';
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

type ShipmentStatus = 'EN_ATTENTE_DE_DEPOT' | 'AU_DEPART' | 'EN_TRANSIT' | 'ARRIVE_AU_RELAIS' | 'RECU' | 'ANNULE' | 'LIVRE';

const ITEMS_PER_PAGE = 8;

interface Shipment {
    id: string; // Backend renvoie string UUID pour ID
    trackingNumber: string; // Attention : camelCase venant du backend
    status: ShipmentStatus;
    description: string;
    shippingCost: number;
    createdAt: string;
    
    senderName?: string;
    recipientName?: string;
    departurePointName?: string;
    arrivalPointName?: string;

    // Pour les détails
    weight?: number;
    isFragile?: boolean;
    isInsured?: boolean;
    isPerishable?: boolean;
    declaredValue?: number;
    deliveryFee?: number; // Souvent utilisé pour shipping_cost
}

// =============================================================================
// MAP COMPONENT DYNAMIQUE
// =============================================================================
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// =============================================================================
// UI UTILITIES
// =============================================================================

const StatusBadge = ({ status }: { status: string }) => {
    // Mapping status -> Style
    let color = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    const s = status?.toUpperCase() || 'UNKNOWN';

    if (s.includes('ATTENTE') || s.includes('PENDING')) color = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    else if (s.includes('TRANSIT') || s.includes('DEPART')) color = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    else if (s.includes('ARRIVE') || s.includes('RELAY')) color = "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    else if (s.includes('LIVRE') || s.includes('RECU')) color = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    else if (s.includes('ANNULE')) color = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-transparent ${color}`}>
            {status?.replace(/_/g, ' ')}
        </span>
    );
};

const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-white/80 dark:bg-black/50 z-10 flex items-center justify-center backdrop-blur-sm rounded-xl">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
    </div>
);

// =============================================================================
// MODALE DÉTAILS COLIS
// =============================================================================

const ShipmentDetailsModal = ({ shipment, onClose }: { shipment: Shipment; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                 <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                     <Package className="text-orange-500"/> Détail du Colis
                 </h3>
                 <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"/></button>
             </div>
             
             <div className="p-6 space-y-6">
                 {/* En-tête */}
                 <div className="flex justify-between items-start">
                     <div>
                         <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">N° Tracking</p>
                         <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight font-mono">{shipment.trackingNumber}</p>
                     </div>
                     <div className="text-right">
                         <StatusBadge status={shipment.status} />
                         <p className="text-xs text-gray-400 mt-1">{new Date(shipment.createdAt).toLocaleString()}</p>
                     </div>
                 </div>

                 {/* Infos Trajet */}
                 <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-600">
                     <div>
                         <p className="text-xs text-blue-500 font-bold uppercase mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Expéditeur / Départ</p>
                         <p className="font-bold text-sm dark:text-white">{shipment.senderName || "Nom Inconnu"}</p>
                         <p className="text-xs text-gray-500">{shipment.departurePointName || "Point de Départ"}</p>
                     </div>
                     <div className="border-l border-gray-200 dark:border-gray-600 pl-4">
                         <p className="text-xs text-green-500 font-bold uppercase mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Destinataire / Arrivée</p>
                         <p className="font-bold text-sm dark:text-white">{shipment.recipientName || "Nom Inconnu"}</p>
                         <p className="text-xs text-gray-500">{shipment.arrivalPointName || "Point d'Arrivée"}</p>
                     </div>
                 </div>

                 {/* Caractéristiques */}
                 <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Poids</p>
                          <p className="font-bold text-slate-700 dark:text-slate-200">{shipment.weight || 'N/A'} kg</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Prix</p>
                          <p className="font-bold text-slate-700 dark:text-slate-200">{(shipment.shippingCost || shipment.deliveryFee || 0).toLocaleString()} FCFA</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Type</p>
                          <p className="font-bold text-slate-700 dark:text-slate-200">{shipment.isFragile ? 'Fragile' : 'Standard'}</p>
                      </div>
                 </div>
                 
                 <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg text-sm text-orange-800 dark:text-orange-300 italic">
                     {shipment.description || "Pas de description supplémentaire."}
                 </div>

             </div>
             
             <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-2">
                  <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg shadow-sm text-sm font-semibold hover:bg-gray-50 transition">Fermer</button>
             </div>
        </div>
    </div>
);


// GESTIONNAIRE DE COLIS
const ShipmentsManager = () => {
    const [shipments, setShipments] = useState<AdminPackage[]>([]);
    const [filteredShipments, setFilteredShipments] = useState<AdminPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    
    const [selectedShipment, setSelectedShipment] = useState<AdminPackage | null>(null);

    const loadShipments = async () => {
        setLoading(true);
        try {
            // Utilise maintenant le service normalisé
            const data = await adminService.getAllShipmentsGlobal();
            
            if (Array.isArray(data)) {
                // Tri sécurisé (vérification de la date)
                data.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                });
                setShipments(data);
                setFilteredShipments(data);
            } else {
                // Cas où API renverrait null par erreur
                setShipments([]);
                setFilteredShipments([]);
            }
        } catch (e: any) {
            console.error("Load shipments failed:", e.message);
            // Gérer l'expiration de session
            if (e.message.includes("401")) window.location.href = "/login";
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadShipments(); }, []);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        const filtered = shipments.filter(s => 
             (s.trackingNumber && s.trackingNumber.toLowerCase().includes(term)) || 
             (s.senderName && s.senderName.toLowerCase().includes(term)) ||
             (s.recipientName && s.recipientName.toLowerCase().includes(term))
        );
        setFilteredShipments(filtered);
        setPage(1);
    }, [searchTerm, shipments]);

    const paginatedData = filteredShipments.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredShipments.length / ITEMS_PER_PAGE) || 1;

    return (
        <div className="space-y-6">
             {/* BARRE FILTRE */}
             <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm">
                 <div className="relative w-full md:max-w-md">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                     <input 
                        type="text" 
                        placeholder="Rechercher tracking, expéditeur..." 
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none dark:text-white transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                     />
                 </div>
                 <button onClick={loadShipments} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 hover:bg-slate-200 transition" title="Rafraîchir">
                     {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <div className="flex items-center text-xs font-bold"><Search className="w-4 h-4 mr-1"/> Reload</div>}
                 </button>
             </div>

             {/* LISTE COLIS */}
             <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm relative min-h-[300px]">
                  {loading && <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center"><Loader2 className="w-10 h-10 text-orange-500 animate-spin" /></div>}
                  
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                           <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 uppercase font-bold text-xs">
                                <tr>
                                    <th className="p-4">Tracking</th>
                                    <th className="p-4">Expéditeur &rarr; Dest.</th>
                                    <th className="p-4 text-center">Statut</th>
                                    <th className="p-4 text-right">Prix</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {paginatedData.length === 0 && !loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">Aucun colis trouvé.</td></tr>
                                ) : paginatedData.map(s => (
                                    <tr key={s.id} className="hover:bg-orange-50 dark:hover:bg-slate-700/30 transition">
                                         <td className="p-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                                             {s.trackingNumber}
                                             <div className="text-[10px] text-gray-400 font-sans">{new Date(s.createdAt).toLocaleDateString()}</div>
                                         </td>
                                         <td className="p-4">
                                             <div className="font-bold text-slate-700 dark:text-slate-200">{s.senderName}</div>
                                             <div className="text-xs text-gray-400 flex items-center gap-1"><ArrowRight className="w-3 h-3"/> {s.recipientName}</div>
                                         </td>
                                         <td className="p-4 text-center"><StatusBadge status={s.status}/></td>
                                         <td className="p-4 text-right font-bold">{s.shippingCost.toLocaleString()} F</td>
                                         <td className="p-4 text-center">
                                             <button onClick={() => setSelectedShipment(s)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"><Eye className="w-4 h-4"/></button>
                                         </td>
                                    </tr>
                                ))}
                           </tbody>
                      </table>
                  </div>
             </div>

             {/* PAGINATION */}
             {filteredShipments.length > ITEMS_PER_PAGE && (
                 <div className="flex justify-center gap-4 items-center pt-2">
                     <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50 text-sm">Préc.</button>
                     <span className="text-xs text-gray-500">Page {page} / {totalPages}</span>
                     <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50 text-sm">Suiv.</button>
                 </div>
             )}

             {/* MODAL DETAILS */}
             {selectedShipment && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedShipment(null)}>
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                          <div className="p-6 border-b bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Package className="text-orange-500"/> Détails Colis</h3>
                              <button onClick={() => setSelectedShipment(null)}><X className="text-gray-400 hover:text-red-500"/></button>
                          </div>
                          <div className="p-6 space-y-4 text-sm">
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="bg-gray-50 p-3 rounded-lg border">
                                       <p className="text-xs font-bold uppercase text-gray-400">Départ</p>
                                       <p className="font-bold text-slate-700">{selectedShipment.senderName}</p>
                                       <p className="text-xs text-gray-500 truncate" title={selectedShipment.departurePointName}>{selectedShipment.departurePointName}</p>
                                   </div>
                                   <div className="bg-gray-50 p-3 rounded-lg border">
                                       <p className="text-xs font-bold uppercase text-gray-400">Arrivée</p>
                                       <p className="font-bold text-slate-700">{selectedShipment.recipientName}</p>
                                       <p className="text-xs text-gray-500 truncate" title={selectedShipment.arrivalPointName}>{selectedShipment.arrivalPointName}</p>
                                   </div>
                               </div>
                               <div>
                                   <p className="font-bold mb-1">Description</p>
                                   <p className="p-3 bg-orange-50 text-orange-800 rounded-lg italic border border-orange-100">{selectedShipment.description || "Non spécifié"}</p>
                               </div>
                               <div className="flex justify-between items-center pt-2 border-t">
                                   <span className="font-bold">Poids: {selectedShipment.weight || 'N/A'} kg</span>
                                   <span className="text-xl font-black text-green-600">{selectedShipment.shippingCost.toLocaleString()} FCFA</span>
                               </div>
                          </div>
                      </motion.div>
                 </div>
             )}
        </div>
    );
};



// =============================================================================
// SOUS-COMPOSANT: GESTION DES POINTS RELAIS (RelayPoints)
// =============================================================================

const RelayPointsManager = () => {
    const [relays, setRelays] = useState<RelayPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');
    
    // Chargement direct depuis relayPointService
    const loadRelays = async () => {
        setLoading(true);
        try {
            const data = await relayPointService.getAllRelayPoints();
            setRelays(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadRelays(); }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Building className="w-5 h-5 text-blue-500"/> Points Relais</h3>
                 <div className="flex gap-2">
                      <button onClick={() => setViewMode('LIST')} className={`p-2 rounded-lg text-sm font-bold transition ${viewMode === 'LIST' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-100'}`}><List className="w-4 h-4"/></button>
                      <button onClick={() => setViewMode('MAP')} className={`p-2 rounded-lg text-sm font-bold transition ${viewMode === 'MAP' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-100'}`}><Map className="w-4 h-4"/></button>
                 </div>
            </div>
            
            {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-orange-500"/></div> : (
                viewMode === 'LIST' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                         {relays.map((r: RelayPoint) => (
                             <div key={r.id} className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group">
                                 <div className="flex justify-between items-start mb-2">
                                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg text-lg">
                                         {r.relayPointName.charAt(0)}
                                     </div>
                                     <span className={`text-[10px] font-bold px-2 py-1 rounded bg-green-100 text-green-700 uppercase tracking-wider`}>Actif</span>
                                 </div>
                                 <h4 className="text-base font-bold text-slate-800 dark:text-white line-clamp-1">{r.relayPointName}</h4>
                                 <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1 mb-3">
                                     <MapPin className="w-3 h-3 mr-1"/> {r.relay_point_address || r.address}
                                 </p>
                                 
                                 <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-700">
                                      <Calendar className="w-3 h-3"/> {r.opening_hours || r.openingHours || "08:00 - 18:00"}
                                 </div>
                             </div>
                         ))}
                    </div>
                ) : (
                    <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-lg border-4 border-white dark:border-slate-700">
                        {/* LA CARTE DOIT ETRE DYNAMIQUE CLIENT */}
                        <MapContainer center={[3.848, 11.502]} zoom={12} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            {relays.map(rp => (
                                <Marker key={rp.id} position={[rp.latitude, rp.longitude]}>
                                    <Popup>{rp.relayPointName}</Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                )
            )}
        </div>
    );
};


// =============================================================================
// COMPOSANT RACINE (Wrapper des Onglets)
// =============================================================================

export default function OperationsManagement() {
    const [activeTab, setActiveTab] = useState<'packages' | 'relays'>('packages');

    return (
        <div className="min-h-[600px] space-y-8 pb-20 animate-in fade-in duration-500">
            
            {/* HEADER ONGLETS */}
            <div className="flex items-center justify-between mb-6">
                 <div>
                     <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Opérations Logistiques</h2>
                     <p className="text-slate-500 dark:text-slate-400 text-sm">Supervision en temps réel du réseau</p>
                 </div>
                 <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl inline-flex">
                      <button 
                         onClick={() => setActiveTab('packages')}
                         className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2
                         ${activeTab === 'packages' 
                             ? 'bg-white dark:bg-slate-600 shadow text-orange-600 dark:text-white' 
                             : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}`}
                      >
                          <Package className="w-4 h-4"/> Colis
                      </button>
                      <button 
                         onClick={() => setActiveTab('relays')}
                         className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2
                         ${activeTab === 'relays' 
                             ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' 
                             : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}`}
                      >
                          <Building className="w-4 h-4"/> Points Relais
                      </button>
                 </div>
            </div>

            {/* CONTENU DYNAMIQUE */}
            <AnimatePresence mode="wait">
                 <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                 >
                    {activeTab === 'packages' ? <ShipmentsManager /> : <RelayPointsManager />}
                 </motion.div>
            </AnimatePresence>
            
        </div>
    );
}
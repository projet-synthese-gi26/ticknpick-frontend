// FICHIER : src/app/superadmin/OperationManagement.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { 
    Package, Building, Search, Loader2, X, Eye, 
    Map as MapIcon, List, ArrowRight, MapPin
} from 'lucide-react';
import { adminService, AdminPackage } from '@/services/adminService';
import { relayPointService, RelayPoint } from '@/services/relayPointService';
import 'leaflet/dist/leaflet.css';

// --- CONFIGURATION LEAFLET SÉCURISÉE ---
// On importe les composants Leaflet dynamiquement pour éviter le SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

const ITEMS_PER_PAGE = 8;
type ShipmentStatus = 'EN_ATTENTE_DE_DEPOT' | 'AU_DEPART' | 'EN_TRANSIT' | 'ARRIVE_AU_RELAIS' | 'RECU' | 'ANNULE' | 'LIVRE';

interface Shipment {
    id: string;
    trackingNumber: string;
    status: ShipmentStatus;
    description: string;
    shippingCost: number;
    createdAt: string;
    senderName?: string;
    recipientName?: string;
    departurePointName?: string;
    arrivalPointName?: string;
    weight?: number;
    isFragile?: boolean;
}

// Composant pour l'icone des Status
const StatusBadge = ({ status }: { status: string }) => {
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

// Sous-Composant pour la Map des Relais (Pour isoler la logique Leaflet)
const RelayMap = ({ relays }: { relays: RelayPoint[] }) => {
    useEffect(() => {
        // Correctif pour les icônes Leaflet qui manquent en production
        // On l'exécute uniquement côté client
        const fixLeafletIcons = async () => {
            const L = (await import('leaflet')).default;
            
            // @ts-ignore
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });
        };
        fixLeafletIcons();
    }, []);

    return (
        <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-lg border-4 border-white dark:border-slate-700 relative z-0">
             <MapContainer center={[3.848, 11.502]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                {relays.map(rp => (
                    <Marker key={rp.id} position={[rp.latitude, rp.longitude]}>
                        <Popup>
                            <strong>{rp.relayPointName}</strong><br/>
                            {rp.relay_point_address || rp.address}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

// GESTIONNAIRES DES COLIS ET POINTS RELAIS
const ShipmentsManager = () => {
    const [shipments, setShipments] = useState<AdminPackage[]>([]);
    const [filteredShipments, setFilteredShipments] = useState<AdminPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [selectedShipment, setSelectedShipment] = useState<AdminPackage | null>(null);

    useEffect(() => { 
        const load = async () => {
            setLoading(true);
            try {
                const data = await adminService.getAllShipmentsGlobal();
                const sorted = Array.isArray(data) ? data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
                setShipments(sorted);
                setFilteredShipments(sorted);
            } catch(e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        setFilteredShipments(shipments.filter(s => 
             s.trackingNumber?.toLowerCase().includes(term) || 
             s.senderName?.toLowerCase().includes(term)
        ));
        setPage(1);
    }, [searchTerm, shipments]);

    const paginatedData = filteredShipments.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
             {/* Filtre */}
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm flex gap-4">
                 <div className="relative flex-1">
                     <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>
                     <input 
                        type="text" 
                        placeholder="Rechercher tracking, expéditeur..." 
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                     />
                 </div>
                 <button onClick={() => window.location.reload()} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500"><Loader2 className="w-5 h-5"/></button>
             </div>

             {/* Liste */}
             <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl overflow-hidden shadow-sm relative">
                  {loading && <div className="absolute inset-0 bg-white/60 dark:bg-black/50 z-10 flex justify-center items-center"><Loader2 className="animate-spin text-orange-500 w-8 h-8"/></div>}
                  <table className="w-full text-sm text-left">
                       <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 uppercase font-bold text-xs">
                            <tr><th className="p-4">Tracking</th><th className="p-4">Trajet</th><th className="p-4 text-center">Statut</th><th className="p-4 text-right">Montant</th></tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {paginatedData.map(s => (
                                <tr key={s.id} onClick={() => setSelectedShipment(s)} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                                     <td className="p-4 font-mono font-bold text-orange-600">{s.trackingNumber}</td>
                                     <td className="p-4"><div className="font-bold">{s.senderName}</div><div className="text-xs text-gray-400">{s.recipientName}</div></td>
                                     <td className="p-4 text-center"><StatusBadge status={s.status}/></td>
                                     <td className="p-4 text-right font-bold">{(s.shippingCost || 0).toLocaleString()} F</td>
                                </tr>
                            ))}
                       </tbody>
                  </table>
                  {filteredShipments.length === 0 && !loading && <div className="p-8 text-center text-gray-500">Aucun colis trouvé.</div>}
             </div>

             {/* MODALE DÉTAIL */}
             <AnimatePresence>
                 {selectedShipment && (
                     <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedShipment(null)}>
                          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative" onClick={e => e.stopPropagation()}>
                              <button onClick={() => setSelectedShipment(null)} className="absolute top-4 right-4"><X className="text-gray-400"/></button>
                              <h3 className="text-xl font-bold mb-4 flex gap-2"><Package className="text-orange-500"/> {selectedShipment.trackingNumber}</h3>
                              <div className="space-y-3 text-sm">
                                  <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-gray-50 p-3 rounded">
                                          <p className="text-xs text-gray-400 font-bold uppercase">Expéditeur</p>
                                          <p className="font-bold">{selectedShipment.senderName}</p>
                                          <p className="text-xs">{selectedShipment.departurePointName}</p>
                                      </div>
                                      <div className="bg-gray-50 p-3 rounded">
                                          <p className="text-xs text-gray-400 font-bold uppercase">Destinataire</p>
                                          <p className="font-bold">{selectedShipment.recipientName}</p>
                                          <p className="text-xs">{selectedShipment.arrivalPointName}</p>
                                      </div>
                                  </div>
                                  <div className="p-3 border rounded text-center">
                                      <p className="text-xs uppercase text-gray-400 mb-1">Coût Transport</p>
                                      <p className="text-2xl font-black text-green-600">{(selectedShipment.shippingCost || 0).toLocaleString()} FCFA</p>
                                  </div>
                              </div>
                          </div>
                     </motion.div>
                 )}
             </AnimatePresence>
        </div>
    );
};

const RelayPointsManager = () => {
    const [relays, setRelays] = useState<RelayPoint[]>([]);
    const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');

    useEffect(() => {
        relayPointService.getAllRelayPoints().then(setRelays).catch(console.error);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border dark:border-slate-700">
                 <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white"><Building className="text-blue-500 w-5 h-5"/> Points Relais</h3>
                 <div className="flex gap-2">
                      <button onClick={() => setViewMode('LIST')} className={`p-2 rounded font-bold text-xs ${viewMode==='LIST' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}><List className="w-4 h-4"/></button>
                      <button onClick={() => setViewMode('MAP')} className={`p-2 rounded font-bold text-xs ${viewMode==='MAP' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}><MapIcon className="w-4 h-4"/></button>
                 </div>
            </div>

            {viewMode === 'LIST' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {relays.map(r => (
                         <div key={r.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border dark:border-slate-700 shadow-sm hover:shadow-md transition">
                             <div className="flex justify-between mb-2">
                                 <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex items-center justify-center font-bold text-xs">{r.relayPointName.charAt(0)}</div>
                                 <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold uppercase">Actif</span>
                             </div>
                             <h4 className="font-bold text-slate-900 dark:text-white truncate">{r.relayPointName}</h4>
                             <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3"/> {r.address || r.relay_point_address}</p>
                         </div>
                     ))}
                </div>
            ) : (
                // On utilise ici notre composant wrapper pour la map qui contient le fix
                <RelayMap relays={relays} />
            )}
        </div>
    );
};

export default function OperationsManagement() {
    const [activeTab, setActiveTab] = useState<'packages' | 'relays'>('packages');

    return (
        <div className="min-h-[600px] space-y-8 pb-20 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Opérations Logistiques</h2>
                 <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl inline-flex">
                      <button onClick={() => setActiveTab('packages')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'packages' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}><Package className="w-4 h-4"/> Colis</button>
                      <button onClick={() => setActiveTab('relays')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'relays' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}><Building className="w-4 h-4"/> Relais</button>
                 </div>
            </div>
            <AnimatePresence mode="wait">
                 <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                    {activeTab === 'packages' ? <ShipmentsManager /> : <RelayPointsManager />}
                 </motion.div>
            </AnimatePresence>
        </div>
    );
}
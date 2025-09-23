// src/app/superadmin/OperationsManagement.tsx

'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Package, Building, Search, Filter, Loader2, X, Eye, Edit, Ban, PlusCircle, Map, List, CheckCircle, 
    ArrowLeft, ArrowRight, Calendar, User, Phone, MapPin, Truck
} from 'lucide-react';
import dynamic from 'next/dynamic';

// --- TYPES ---
type ShipmentStatus = 'EN_ATTENTE_DE_DEPOT' | 'AU_DEPART' | 'EN_TRANSIT' | 'ARRIVE_AU_RELAIS' | 'RECU' | 'ANNULE';
const ALL_STATUSES: ShipmentStatus[] = ['EN_ATTENTE_DE_DEPOT', 'AU_DEPART', 'EN_TRANSIT', 'ARRIVE_AU_RELAIS', 'RECU', 'ANNULE'];

interface RelayPoint {
    id: number;
    name: string;
    address: string | null;
    quartier: string | null;
    lat: number;
    lng: number;
    hours: string | null;
    type: 'bureau' | 'commerce' | 'agence';
    status: 'ACTIVE' | 'INACTIVE';
}

interface Shipment {
    id: number;
    tracking_number: string;
    status: ShipmentStatus;
    sender_name: string;
    recipient_name: string;
    departure_point_name: string;
    arrival_point_name: string;
    shipping_cost: number;
    created_at: string;
    total_count: number;
}

interface FullShipmentDetails {
    id: number; tracking_number: string; status: ShipmentStatus; created_at: string;
    sender_name: string; sender_phone: string; recipient_name: string; recipient_phone: string;
    description: string | null; weight: number | null; is_fragile: boolean; is_perishable: boolean; is_insured: boolean;
    declared_value: number | null; shipping_cost: number; is_paid_at_departure: boolean;
    departure_point: { name: string } | null; arrival_point: { name: string } | null;
}

const ITEMS_PER_PAGE = 10;

// Dynamic import for Leaflet map to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// Fix for default Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// >>> COPIEZ ET COLLEZ CE CODE DANS VOTRE FICHIER `OperationsManagement.tsx`
// EN REMPLACEMENT DE const ShipmentsManager = (...) => { ... }

// --- SOUS-COMPOSANT : BADGE DE STATUT ---
const StatusBadge = ({ status }: { status: ShipmentStatus }) => {
    const config = {
        'EN_ATTENTE_DE_DEPOT': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        'AU_DEPART': 'bg-blue-100 text-blue-800 border border-blue-200',
        'EN_TRANSIT': 'bg-indigo-100 text-indigo-800 border border-indigo-200',
        'ARRIVE_AU_RELAIS': 'bg-purple-100 text-purple-800 border border-purple-200',
        'RECU': 'bg-green-100 text-green-800 border border-green-200',
        'ANNULE': 'bg-red-100 text-red-800 border border-red-200'
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config[status]}`}>{status.replace(/_/g, ' ')}</span>
};

// --- SOUS-COMPOSANT : MODALE DE DÉTAILS DU COLIS ---
const ShipmentDetailsModal = ({ shipmentId, onClose }: { shipmentId: number, onClose: () => void }) => {
    const [details, setDetails] = useState<FullShipmentDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            const { data } = await supabase.from('shipments')
              .select('*, departure_point:departure_point_id(name), arrival_point:arrival_point_id(name)')
              .eq('id', shipmentId)
              .single();
            if (data) {
                setDetails(data as FullShipmentDetails);
            }
            setLoading(false);
        };
        fetchDetails();
    }, [shipmentId]);

    const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number | null | undefined}) => (
        <div className="flex items-start gap-3">
            <Icon className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
            <div>
                <p className="text-gray-500 text-xs font-medium">{label}</p>
                <p className="font-semibold text-gray-800">{value || 'N/A'}</p>
            </div>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold">Détails du Colis</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full"><X size={20}/></button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {loading ? <div className="flex justify-center"><Loader2 className="animate-spin"/></div> :
                     !details ? <p className="text-red-500">Impossible de charger les détails.</p> :
                    (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-bold text-orange-600">Informations Générales</h4>
                                <DetailItem icon={Package} label="N° de Suivi" value={details.tracking_number} />
                                <DetailItem icon={Calendar} label="Créé le" value={new Date(details.created_at).toLocaleString('fr-FR')} />
                                <DetailItem icon={CheckCircle} label="Statut Actuel" value={<StatusBadge status={details.status}/> as any} />
                                <DetailItem icon={DollarSign} label="Coût d'expédition" value={`${details.shipping_cost.toLocaleString()} FCFA`} />
                            </div>
                            <div className="space-y-4">
                                <h4 className="font-bold text-orange-600">Détails du Colis</h4>
                                <DetailItem icon={Edit} label="Description" value={details.description} />
                                <DetailItem icon={Package} label="Poids" value={`${details.weight} kg`} />
                                <DetailItem icon={Ban} label="Spécificités" value={
                                    `${details.is_fragile ? 'Fragile ' : ''}${details.is_perishable ? 'Périssable ' : ''}${details.is_insured ? 'Assuré ' : ''}` || 'Aucune'
                                } />
                                {details.is_insured && <DetailItem icon={DollarSign} label="Valeur Déclarée" value={`${details.declared_value?.toLocaleString()} FCFA`} />}
                            </div>
                            <div className="space-y-4">
                                <h4 className="font-bold text-orange-600">Expéditeur</h4>
                                <DetailItem icon={User} label="Nom" value={details.sender_name} />
                                <DetailItem icon={Phone} label="Téléphone" value={details.sender_phone} />
                                <DetailItem icon={MapPin} label="Point de départ" value={details.departure_point?.name} />
                            </div>
                             <div className="space-y-4">
                                <h4 className="font-bold text-orange-600">Destinataire</h4>
                                <DetailItem icon={User} label="Nom" value={details.recipient_name} />
                                <DetailItem icon={Phone} label="Téléphone" value={details.recipient_phone} />
                                <DetailItem icon={MapPin} label="Point d'arrivée" value={details.arrival_point?.name} />
                            </div>
                        </div>
                    )}
                </div>
                 <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300">Fermer</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- GESTIONNAIRE DE COLIS ---
function ShipmentsManager({ allRelayPoints }: { allRelayPoints: RelayPoint[] }) {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ searchTerm: '', status: 'ALL', departure: 'ALL', arrival: 'ALL' });
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
    const [selectedShipmentId, setSelectedShipmentId] = useState<number | null>(null);
    const [statusToUpdate, setStatusToUpdate] = useState<{ id: number; tracking_number: string } | null>(null);
    const [newStatus, setNewStatus] = useState<ShipmentStatus | ''>('');
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

    const fetchShipments = useCallback(async (page = pagination.currentPage) => {
        setLoading(true);
        const { data, error } = await supabase.rpc('search_all_shipments', {
            search_term: filters.searchTerm,
            filter_status: filters.status,
            filter_departure: filters.departure === 'ALL' ? null : parseInt(filters.departure),
            filter_arrival: filters.arrival === 'ALL' ? null : parseInt(filters.arrival),
            start_date: new Date(0).toISOString(),
            end_date: new Date().toISOString(),
            page_limit: ITEMS_PER_PAGE,
            page_offset: (page - 1) * ITEMS_PER_PAGE
        });
        if (!error && data) {
            setShipments(data);
            const totalCount = data.length > 0 ? data[0].total_count : 0;
            setPagination({ currentPage: page, totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE), totalCount });
        }
        setLoading(false);
    }, [filters, pagination.currentPage]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if(pagination.currentPage !== 1) setPagination(p => ({...p, currentPage: 1}));
            else fetchShipments(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [filters.searchTerm, filters.status, filters.departure, filters.arrival]);

    useEffect(() => {
        fetchShipments(pagination.currentPage);
    }, [pagination.currentPage]);

    const handleUpdateStatus = async () => {
        if (!statusToUpdate || !newStatus) return;
        const { error } = await supabase.from('shipments').update({ status: newStatus }).eq('id', statusToUpdate.id);
        if(!error){
            setStatusToUpdate(null);
            setNewStatus('');
            fetchShipments(pagination.currentPage);
        } else {
            alert("Erreur lors de la mise à jour du statut.");
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Gestion des Colis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input type="text" placeholder="Rechercher par N°, nom..." value={filters.searchTerm} onChange={e => setFilters({...filters, searchTerm: e.target.value})} className="p-2 border rounded-lg"/>
                <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="p-2 border rounded-lg">
                    <option value="ALL">Tous les statuts</option>
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
                <select value={filters.departure} onChange={e => setFilters({...filters, departure: e.target.value})} className="p-2 border rounded-lg">
                    <option value="ALL">Tous les départs</option>
                    {allRelayPoints.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={filters.arrival} onChange={e => setFilters({...filters, arrival: e.target.value})} className="p-2 border rounded-lg">
                    <option value="ALL">Toutes les arrivées</option>
                    {allRelayPoints.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>

            <div className="overflow-x-auto">
                {loading && <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-orange-500" /></div>}
                {!loading && shipments.length === 0 && <div className="text-center py-12 text-gray-500">Aucun colis ne correspond à votre recherche.</div>}
                {!loading && shipments.length > 0 &&
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 uppercase">
                            <tr>
                                {["N° Suivi", "Trajet", "Statut", "Coût", "Date", "Actions"].map(h => <th key={h} className="p-3 text-left">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {shipments.map(s => (
                                <tr key={s.id} className="border-b hover:bg-orange-50">
                                    <td className="p-3 font-mono font-semibold">{s.tracking_number}</td>
                                    <td className="p-3"><strong>De:</strong> {s.departure_point_name}<br/><strong>À:</strong> {s.arrival_point_name}</td>
                                    <td className="p-3"><StatusBadge status={s.status} /></td>
                                    <td className="p-3">{s.shipping_cost.toLocaleString()} FCFA</td>
                                    <td className="p-3">{new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
                                    <td className="p-3 flex items-center gap-3">
                                        <button onClick={() => setSelectedShipmentId(s.id)} title="Voir Détails"><Eye className="h-5 w-5 text-blue-600 hover:text-blue-800"/></button>
                                        <button onClick={() => { setStatusToUpdate({id: s.id, tracking_number: s.tracking_number}); setIsStatusModalOpen(true); }} title="Modifier Statut"><Edit className="h-5 w-5 text-green-600 hover:text-green-800"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                }
            </div>

            {pagination.totalPages > 1 && 
            <div className="flex justify-between items-center mt-4 text-sm">
                <button onClick={() => setPagination(p => ({...p, currentPage: p.currentPage-1}))} disabled={pagination.currentPage <= 1} className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 font-semibold flex items-center gap-1"><ArrowLeft size={16}/> Préc.</button>
                <span>Page {pagination.currentPage} / {pagination.totalPages} ({pagination.totalCount} colis)</span>
                <button onClick={() => setPagination(p => ({...p, currentPage: p.currentPage+1}))} disabled={pagination.currentPage >= pagination.totalPages} className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 font-semibold flex items-center gap-1">Suiv. <ArrowRight size={16}/></button>
            </div>
            }

            <AnimatePresence>
                {selectedShipmentId && <ShipmentDetailsModal shipmentId={selectedShipmentId} onClose={() => setSelectedShipmentId(null)} />}
                {isStatusModalOpen && statusToUpdate && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setIsStatusModalOpen(false)}>
                         <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white p-6 rounded-lg w-full max-w-sm" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold text-lg mb-2">Modifier le statut de</h3>
                            <p className="font-mono text-orange-600 mb-4">{statusToUpdate.tracking_number}</p>
                            <select value={newStatus} onChange={e => setNewStatus(e.target.value as ShipmentStatus)} className="w-full p-2 border rounded-lg mb-4">
                                <option value="" disabled>Choisir un nouveau statut...</option>
                                {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                            </select>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setIsStatusModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Annuler</button>
                                <button onClick={handleUpdateStatus} className="bg-orange-500 text-white px-4 py-2 rounded-lg">Sauvegarder</button>
                            </div>
                         </motion.div>
                     </motion.div>
                 )}
            </AnimatePresence>
        </div>
    );
}

// ... Le reste du fichier OperationsManagement.tsx reste inchangé ...

// Remplacez la "coquille" RelayPointsManager par ce code complet

const RelayPointsManager = () => {
    const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPoint, setCurrentPoint] = useState<Partial<RelayPoint> | null>(null);

    const fetchPoints = async () => {
        setLoading(true);
        const { data } = await supabase.from('relay_points').select('*').order('name');
        if (data) setRelayPoints(data as RelayPoint[]);
        setLoading(false);
    };

    useEffect(() => { fetchPoints(); }, []);

    const handleSavePoint = async () => {
        if (!currentPoint?.name || !currentPoint.address || !currentPoint.lat || !currentPoint.lng) {
            alert('Champs requis manquants.');
            return;
        }
        
        const { error } = await supabase.from('relay_points').upsert(currentPoint);
        
        if (error) {
            alert("Erreur de sauvegarde.");
        } else {
            setIsModalOpen(false);
            setCurrentPoint(null);
            fetchPoints(); // Recharger la liste
        }
    };

    return (
        <div className="space-y-4">
             <div className="flex justify-between items-center">
                 <div className="flex gap-1 bg-gray-200 p-1 rounded-lg">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md ${viewMode === 'list' ? 'bg-white shadow' : ''}`}>Liste</button>
                    <button onClick={() => setViewMode('map')} className={`px-3 py-1 rounded-md ${viewMode === 'map' ? 'bg-white shadow' : ''}`}>Carte</button>
                </div>
                <button onClick={() => { setCurrentPoint({}); setIsModalOpen(true); }} className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"><PlusCircle /> Ajouter</button>
            </div>

            {viewMode === 'list' ? (
                 <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                       {/* ... Thead ... */}
                       <tbody>
                          {relayPoints.map(p => (
                             <tr key={p.id}>
                               <td>{p.name}</td>
                               {/* ... etc ... */}
                               <td>
                                 <button onClick={() => { setCurrentPoint(p); setIsModalOpen(true); }}>Modifier</button>
                               </td>
                           </tr>
                          ))}
                       </tbody>
                    </table>
                </div>
            ) : (
                <div className="h-[600px] rounded-lg overflow-hidden shadow-lg">
                    <MapContainer center={[5.7, 10.2]} zoom={6} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {relayPoints.map(p => (
                            <Marker key={p.id} position={[p.lat, p.lng]}>
                                <Popup>{p.name}<br/>{p.address}</Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            )}
            
            {/* Modal for Add/Edit Relay Point */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="font-bold text-lg mb-4">{currentPoint?.id ? 'Modifier' : 'Ajouter'} un point relais</h3>
                         <div className="space-y-3">
                             <input type="text" placeholder="Nom" value={currentPoint?.name || ''} onChange={e => setCurrentPoint({...currentPoint, name: e.target.value})} className="w-full p-2 border rounded"/>
                             {/* ... Other fields for lat, lng, address, etc. ... */}
                        </div>
                         <div className="flex justify-end gap-3 mt-4">
                            <button onClick={() => setIsModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded">Annuler</button>
                            <button onClick={handleSavePoint} className="bg-orange-500 text-white px-4 py-2 rounded">Sauvegarder</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- COMPONENT: OperationsManagement (Main) ---
export default function OperationsManagement() {
    const [activeTab, setActiveTab] = useState<'shipments' | 'relays'>('shipments');
    const [allRelayPoints, setAllRelayPoints] = useState<RelayPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data, error } = await supabase.from('relay_points').select('*');
            if (!error) {
                setAllRelayPoints(data as RelayPoint[]);
            }
            setIsLoading(false);
        };
        fetchInitialData();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Gestion des Opérations</h1>

            <div className="flex border-b">
                <button onClick={() => setActiveTab('shipments')} className={`py-2 px-4 font-semibold ${activeTab === 'shipments' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}>
                    Gestion des Colis
                </button>
                <button onClick={() => setActiveTab('relays')} className={`py-2 px-4 font-semibold ${activeTab === 'relays' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}>
                    Gestion des Points Relais
                </button>
            </div>
            
            {isLoading ? (
                 <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : (
                <AnimatePresence mode="wait">
                    {activeTab === 'shipments' ? (
                        <motion.div key="shipments" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <ShipmentsManager allRelayPoints={allRelayPoints} />
                        </motion.div>
                    ) : (
                        <motion.div key="relays" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <RelayPointsManager />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
}
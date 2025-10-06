'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { 
    Package, Building, Search, Filter, Loader2, X, Eye, Edit, Ban, PlusCircle, 
    Map, List, CheckCircle, ArrowLeft, ArrowRight, Calendar, User, Phone, 
    MapPin, Truck, DollarSign
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

type ShipmentStatus = 'EN_ATTENTE_DE_DEPOT' | 'AU_DEPART' | 'EN_TRANSIT' | 'ARRIVE_AU_RELAIS' | 'RECU' | 'ANNULE';

const ALL_STATUSES: ShipmentStatus[] = [
    'EN_ATTENTE_DE_DEPOT', 
    'AU_DEPART', 
    'EN_TRANSIT', 
    'ARRIVE_AU_RELAIS', 
    'RECU', 
    'ANNULE'
];

const ITEMS_PER_PAGE = 10;

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
    id: number;
    tracking_number: string;
    status: ShipmentStatus;
    created_at: string;
    sender_name: string;
    sender_phone: string;
    recipient_name: string;
    recipient_phone: string;
    description: string | null;
    weight: number | null;
    is_fragile: boolean;
    is_perishable: boolean;
    is_insured: boolean;
    declared_value: number | null;
    shipping_cost: number;
    is_paid_at_departure: boolean;
    departure_point: { name: string } | null;
    arrival_point: { name: string } | null;
}

interface Filters {
    searchTerm: string;
    status: string;
    departure: string;
    arrival: string;
}

interface Pagination {
    currentPage: number;
    totalPages: number;
    totalCount: number;
}

// =============================================================================
// LEAFLET MAP CONFIGURATION
// =============================================================================

// Dynamic imports for Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Fix for default Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

const StatusBadge = ({ status }: { status: ShipmentStatus }) => {
    const statusConfig = {
        'EN_ATTENTE_DE_DEPOT': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        'AU_DEPART': 'bg-blue-100 text-blue-800 border border-blue-200',
        'EN_TRANSIT': 'bg-indigo-100 text-indigo-800 border border-indigo-200',
        'ARRIVE_AU_RELAIS': 'bg-purple-100 text-purple-800 border border-purple-200',
        'RECU': 'bg-green-100 text-green-800 border border-green-200',
        'ANNULE': 'bg-red-100 text-red-800 border border-red-200'
    };

    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusConfig[status]}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
};

const LoadingSpinner = ({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) => {
    const sizeClasses = {
        small: 'h-4 w-4',
        default: 'h-8 w-8',
        large: 'h-12 w-12'
    };

    return (
        <div className="flex justify-center items-center">
            <Loader2 className={`animate-spin text-orange-500 ${sizeClasses[size]}`} />
        </div>
    );
};

// =============================================================================
// SHIPMENT DETAILS MODAL
// =============================================================================

const DetailItem = ({ 
    icon: Icon, 
    label, 
    value 
}: { 
    icon: React.ElementType; 
    label: string; 
    value: string | number | null | undefined | React.ReactNode;
}) => (
    <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
        <div>
            <p className="text-gray-500 text-xs font-medium">{label}</p>
            <p className="font-semibold text-gray-800 dark:text-gray-300">{value || 'N/A'}</p>
        </div>
    </div>
);

const ShipmentDetailsModal = ({ 
    shipmentId, 
    onClose 
}: { 
    shipmentId: number; 
    onClose: () => void;
}) => {
    const [details, setDetails] = useState<FullShipmentDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('shipments')
                    .select('*, departure_point:departure_point_id(name), arrival_point:arrival_point_id(name)')
                    .eq('id', shipmentId)
                    .single();

                if (error) throw error;
                if (data) setDetails(data as FullShipmentDetails);
            } catch (error) {
                console.error('Error fetching shipment details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [shipmentId]);

    const formatSpecificities = (details: FullShipmentDetails) => {
        const specificities = [];
        if (details.is_fragile) specificities.push('Fragile');
        if (details.is_perishable) specificities.push('Périssable');
        if (details.is_insured) specificities.push('Assuré');
        return specificities.length > 0 ? specificities.join(', ') : 'Aucune';
    };
    // --- JSX principal de la modale ---
return (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
    >
        <motion.div 
            initial={{ scale: 0.95, y: 10 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
            onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Détails du Colis
                </h3>
                <button 
                    onClick={onClose} 
                    className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                    aria-label="Fermer la modale"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <LoadingSpinner />
                    </div>
                ) : !details ? (
                    <p className="text-red-500 dark:text-red-400 text-center py-10">
                        Impossible de charger les détails du colis.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                        
                        <div className="space-y-4 ">
                            <h4 className="font-bold text-orange-600 dark:text-orange-400 border-b border-gray-200 dark:border-gray-700 pb-1">
                                Informations Générales
                            </h4>
                            <DetailItem icon={Package} label="N° de Suivi" value={details.tracking_number} />
                            <DetailItem icon={Calendar} label="Créé le" value={new Date(details.created_at).toLocaleString('fr-FR')} />
                            <DetailItem icon={CheckCircle} label="Statut Actuel" value={<StatusBadge status={details.status} />} />
                            <DetailItem icon={DollarSign} label="Coût d'expédition" value={`${details.shipping_cost.toLocaleString()} FCFA`} />
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-orange-600 dark:text-orange-400 border-b border-gray-200 dark:border-gray-700 pb-1">
                                Détails du Colis
                            </h4>
                            <DetailItem icon={Edit} label="Description" value={details.description} />
                            <DetailItem icon={Package} label="Poids" value={details.weight ? `${details.weight} kg` : null} />
                            <DetailItem icon={Ban} label="Spécificités" value={formatSpecificities(details)} />
                            {details.is_insured && (
                                <DetailItem icon={DollarSign} label="Valeur Déclarée" value={`${details.declared_value?.toLocaleString()} FCFA`} />
                            )}
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-orange-600 dark:text-orange-400 border-b border-gray-200 dark:border-gray-700 pb-1">
                                Expéditeur
                            </h4>
                            <DetailItem icon={User} label="Nom" value={details.sender_name} />
                            <DetailItem icon={Phone} label="Téléphone" value={details.sender_phone} />
                            <DetailItem icon={MapPin} label="Point de départ" value={details.departure_point?.name} />
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-orange-600 dark:text-orange-400 border-b border-gray-200 dark:border-gray-700 pb-1">
                                Destinataire
                            </h4>
                            <DetailItem icon={User} label="Nom" value={details.recipient_name} />
                            <DetailItem icon={Phone} label="Téléphone" value={details.recipient_phone} />
                            <DetailItem icon={MapPin} label="Point d'arrivée" value={details.arrival_point?.name} />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end flex-shrink-0">
                <button 
                    onClick={onClose} 
                    className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                    Fermer
                </button>
            </div>
        </motion.div>
    </motion.div>
);
};

// =============================================================================
// STATUS UPDATE MODAL
// =============================================================================

const StatusUpdateModal = ({
    shipment,
    newStatus,
    setNewStatus,
    onUpdate,
    onClose
}: {
    shipment: { id: number; tracking_number: string };
    newStatus: ShipmentStatus | '';
    setNewStatus: (status: ShipmentStatus | '') => void;
    onUpdate: () => void;
    onClose: () => void;
}) => (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
        onClick={onClose}
    >
        <motion.div 
            initial={{ scale: 0.9 }} 
            animate={{ scale: 1 }} 
            exit={{ scale: 0.9 }}
            className="bg-white p-6 rounded-lg w-full max-w-sm"
            onClick={e => e.stopPropagation()}
        >
            <h3 className="font-bold text-lg mb-2">Modifier le statut de</h3>
            <p className="font-mono text-orange-600 mb-4">{shipment.tracking_number}</p>
            
            <select 
                value={newStatus} 
                onChange={e => setNewStatus(e.target.value as ShipmentStatus)}
                className="w-full p-2 border rounded-lg mb-4"
            >
                <option value="" disabled>Choisir un nouveau statut...</option>
                {ALL_STATUSES.map(status => (
                    <option key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                    </option>
                ))}
            </select>
            
            <div className="flex justify-end gap-3">
                <button 
                    onClick={onClose} 
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    Annuler
                </button>
                <button 
                    onClick={onUpdate} 
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                    disabled={!newStatus}
                >
                    Sauvegarder
                </button>
            </div>
        </motion.div>
    </motion.div>
);

// =============================================================================
// SHIPMENTS MANAGER COMPONENT
// =============================================================================

const ShipmentsManager = ({ allRelayPoints }: { allRelayPoints: RelayPoint[] }) => {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Filters>({ 
        searchTerm: '', 
        status: 'ALL', 
        departure: 'ALL', 
        arrival: 'ALL' 
    });
    const [pagination, setPagination] = useState<Pagination>({ 
        currentPage: 1, 
        totalPages: 1, 
        totalCount: 0 
    });
    const [selectedShipmentId, setSelectedShipmentId] = useState<number | null>(null);
    const [statusToUpdate, setStatusToUpdate] = useState<{ id: number; tracking_number: string } | null>(null);
    const [newStatus, setNewStatus] = useState<ShipmentStatus | ''>('');

    const fetchShipments = useCallback(async (page = pagination.currentPage) => {
        setLoading(true);
        try {
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

            if (error) throw error;
            
            if (data) {
                setShipments(data);
                const totalCount = data.length > 0 ? data[0].total_count : 0;
                setPagination({ 
                    currentPage: page, 
                    totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE), 
                    totalCount 
                });
            }
        } catch (error) {
            console.error('Error fetching shipments:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Reset to first page when filters change
    useEffect(() => {
        const handler = setTimeout(() => {
            if (pagination.currentPage !== 1) {
                setPagination(prev => ({ ...prev, currentPage: 1 }));
            } else {
                fetchShipments(1);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [filters.searchTerm, filters.status, filters.departure, filters.arrival]);

    // Fetch when page changes
    useEffect(() => {
        fetchShipments(pagination.currentPage);
    }, [pagination.currentPage]);

    const handleUpdateStatus = async () => {
        if (!statusToUpdate || !newStatus) return;
        
        try {
            const { error } = await supabase
                .from('shipments')
                .update({ status: newStatus })
                .eq('id', statusToUpdate.id);
            
            if (error) throw error;
            
            setStatusToUpdate(null);
            setNewStatus('');
            fetchShipments(pagination.currentPage);
        } catch (error) {
            console.error('Error updating status:', error);
            alert("Erreur lors de la mise à jour du statut.");
        }
    };

    const handleFilterChange = (key: keyof Filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handlePageChange = (direction: 'prev' | 'next') => {
        setPagination(prev => ({
            ...prev,
            currentPage: direction === 'prev' ? prev.currentPage - 1 : prev.currentPage + 1
        }));
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border space-y-4">

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input 
                    type="text" 
                    placeholder="Rechercher par N°, nom..." 
                    value={filters.searchTerm}
                    onChange={e => handleFilterChange('searchTerm', e.target.value)}
                    className="p-2 border dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                
                <select 
                    value={filters.status}
                    onChange={e => handleFilterChange('status', e.target.value)}
                    className="p-2 border dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                    <option value="ALL">Tous les statuts</option>
                    {ALL_STATUSES.map(status => (
                        <option key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                        </option>
                    ))}
                </select>
                
                <select 
                    value={filters.departure}
                    onChange={e => handleFilterChange('departure', e.target.value)}
                    className="p-2 border dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                    <option value="ALL">Tous les départs</option>
                    {allRelayPoints.map(point => (
                        <option key={point.id} value={point.id}>
                            {point.name}
                        </option>
                    ))}
                </select>
                
                <select 
                    value={filters.arrival}
                    onChange={e => handleFilterChange('arrival', e.target.value)}
                    className="p-2 border dark:bg-gray-900 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                    <option value="ALL">Toutes les arrivées</option>
                    {allRelayPoints.map(point => (
                        <option key={point.id} value={point.id}>
                            {point.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="h-96 flex items-center justify-center">
                        <LoadingSpinner size="large" />
                    </div>
                ) : shipments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        Aucun colis ne correspond à votre recherche.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900 dark:text-gray-300 text-gray-600 uppercase">
                            <tr>
                                <th className="p-3 text-left">N° Suivi</th>
                                <th className="p-3 text-left">Trajet</th>
                                <th className="p-3 text-left">Statut</th>
                                <th className="p-3 text-left">Coût</th>
                                <th className="p-3 text-left">Date</th>
                                <th className="p-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shipments.map(shipment => (
                                <tr key={shipment.id} className="border-b hover:bg-orange-50 dark:hover:bg-gray-900 dark:text-gray-400 transition-colors">
                                    <td className="p-3 font-mono font-semibold">
                                        {shipment.tracking_number}
                                    </td>
                                    <td className="p-3">
                                        <div>
                                            <strong>De:</strong> {shipment.departure_point_name}
                                        </div>
                                        <div>
                                            <strong>À:</strong> {shipment.arrival_point_name}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <StatusBadge status={shipment.status} />
                                    </td>
                                    <td className="p-3">
                                        {shipment.shipping_cost.toLocaleString()} FCFA
                                    </td>
                                    <td className="p-3">
                                        {new Date(shipment.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => setSelectedShipmentId(shipment.id)}
                                                title="Voir Détails"
                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                <Eye className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 text-sm">
                    <button 
                        onClick={() => handlePageChange('prev')}
                        disabled={pagination.currentPage <= 1}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-transparent rounded-lg disabled:opacity-50 font-semibold flex items-center gap-1 hover:bg-gray-300 transition-colors disabled:hover:bg-gray-200"
                    >
                        <ArrowLeft size={16} /> Précédente
                    </button>
                    
                    <span className="font-medium">
                        Page {pagination.currentPage} / {pagination.totalPages} 
                        ({pagination.totalCount} colis)
                    </span>
                    
                    <button 
                        onClick={() => handlePageChange('next')}
                        disabled={pagination.currentPage >= pagination.totalPages}
                        className="px-4 py-2 bg-gray-200  dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-transparent rounded-lg disabled:opacity-50 font-semibold flex items-center gap-1 hover:bg-gray-300 transition-colors disabled:hover:bg-gray-200"
                    >
                        Suivante <ArrowRight size={16} />
                    </button>
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {selectedShipmentId && (
                    <ShipmentDetailsModal 
                        shipmentId={selectedShipmentId} 
                        onClose={() => setSelectedShipmentId(null)} 
                    />
                )}
                
                {statusToUpdate && (
                    <StatusUpdateModal
                        shipment={statusToUpdate}
                        newStatus={newStatus}
                        setNewStatus={setNewStatus}
                        onUpdate={handleUpdateStatus}
                        onClose={() => {
                            setStatusToUpdate(null);
                            setNewStatus('');
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// =============================================================================
// RELAY POINTS MANAGER COMPONENT
// =============================================================================

const RelayPointsManager = () => {
    const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPoint, setCurrentPoint] = useState<Partial<RelayPoint> | null>(null);

    const fetchPoints = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('relay_points')
                .select('*')
                .order('name');
            
            if (error) throw error;
            if (data) setRelayPoints(data as RelayPoint[]);
        } catch (error) {
            console.error('Error fetching relay points:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoints();
    }, []);

    const handleSavePoint = async () => {
        if (!currentPoint?.name || !currentPoint.address || !currentPoint.lat || !currentPoint.lng) {
            alert('Champs requis manquants.');
            return;
        }
        
        try {
            const { error } = await supabase.from('relay_points').upsert(currentPoint);
            
            if (error) throw error;
            
            setIsModalOpen(false);
            setCurrentPoint(null);
            fetchPoints();
        } catch (error) {
            console.error('Error saving relay point:', error);
            alert("Erreur de sauvegarde.");
        }
    };

    const handleInputChange = (field: keyof RelayPoint, value: any) => {
        setCurrentPoint(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return <LoadingSpinner size="large" />;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200">Gestion des Points Relais</h2>
                
                {/* View Mode Toggle */}
                <div className="flex items-center gap-4">
                    <div className="flex gap-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1 rounded-md transition-colors ${
                                viewMode === 'list' ? 'bg-white shadow' : 'hover:bg-gray-100'
                            }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('map')}
                            className={`px-3 py-1 rounded-md transition-colors ${
                                viewMode === 'map' ? 'bg-white shadow' : 'hover:bg-gray-100'
                            }`}
                        >
                            <Map className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => { 
                            setCurrentPoint({ 
                                type: 'bureau', 
                                status: 'ACTIVE' 
                            }); 
                            setIsModalOpen(true); 
                        }}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Ajouter
                    </button>
                </div>
            </div>

            {/* Content based on view mode */}
            {viewMode === 'list' ? (
                <div className="overflow-x-auto ">
                    {relayPoints.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            Aucun point relais enregistré.
                        </div>
                    ) : (
                        <table className="w-full  text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900 dark:text-gray-300 text-gray-600 uppercase">
                                <tr>
                                    <th className="p-3 text-left">Nom</th>
                                    <th className="p-3 text-left">Adresse</th>
                                    <th className="p-3 text-left">Quartier</th>
                                    <th className="p-3 text-left">Type</th>
                                    <th className="p-3 text-left">Statut</th>
                                    <th className="p-3 text-left">Horaires</th>
                                    <th className="p-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {relayPoints.map(point => (
                                    <tr key={point.id} className="border-b hover:bg-orange-50 dark:hover:bg-gray-900 dark:text-gray-300 transition-colors">
                                        <td className="p-3 font-semibold">{point.name}</td>
                                        <td className="p-3">{point.address || 'N/A'}</td>
                                        <td className="p-3">{point.quartier || 'N/A'}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                point.type === 'bureau' ? 'bg-blue-100 text-blue-800' :
                                                point.type === 'commerce' ? 'bg-green-100 text-green-800' :
                                                'bg-purple-100 text-purple-800'
                                            }`}>
                                                {point.type.charAt(0).toUpperCase() + point.type.slice(1)}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                point.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {point.status}
                                            </span>
                                        </td>
                                        <td className="p-3">{point.hours || 'N/A'}</td>
                                        <td className="p-3">
                                            <button 
                                                onClick={() => { 
                                                    setCurrentPoint(point); 
                                                    setIsModalOpen(true); 
                                                }}
                                                title="Modifier"
                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                <Edit className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                <div className="h-[600px] rounded-lg overflow-hidden shadow-lg">
                    <MapContainer 
                        center={[5.7, 10.2]} 
                        zoom={6} 
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {relayPoints.map(point => (
                            <Marker key={point.id} position={[point.lat, point.lng]}>
                                <Popup>
                                    <div className="space-y-1">
                                        <h3 className="font-semibold">{point.name}</h3>
                                        <p className="text-sm text-gray-600">{point.address}</p>
                                        {point.quartier && (
                                            <p className="text-sm text-gray-600">Quartier: {point.quartier}</p>
                                        )}
                                        <p className="text-sm">
                                            <span className={`px-2 py-1 text-xs rounded ${
                                                point.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {point.status}
                                            </span>
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            )}
            
            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-lg mb-4">
                            {currentPoint?.id ? 'Modifier' : 'Ajouter'} un point relais
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nom *
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="Nom du point relais" 
                                    value={currentPoint?.name || ''} 
                                    onChange={e => handleInputChange('name', e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Adresse *
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="Adresse complète" 
                                    value={currentPoint?.address || ''} 
                                    onChange={e => handleInputChange('address', e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quartier
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="Quartier" 
                                    value={currentPoint?.quartier || ''} 
                                    onChange={e => handleInputChange('quartier', e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Latitude *
                                    </label>
                                    <input 
                                        type="number" 
                                        step="any"
                                        placeholder="5.123456" 
                                        value={currentPoint?.lat || ''} 
                                        onChange={e => handleInputChange('lat', parseFloat(e.target.value) || 0)}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Longitude *
                                    </label>
                                    <input 
                                        type="number" 
                                        step="any"
                                        placeholder="10.123456" 
                                        value={currentPoint?.lng || ''} 
                                        onChange={e => handleInputChange('lng', parseFloat(e.target.value) || 0)}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type
                                </label>
                                <select 
                                    value={currentPoint?.type || 'bureau'} 
                                    onChange={e => handleInputChange('type', e.target.value as 'bureau' | 'commerce' | 'agence')}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="bureau">Bureau</option>
                                    <option value="commerce">Commerce</option>
                                    <option value="agence">Agence</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Statut
                                </label>
                                <select 
                                    value={currentPoint?.status || 'ACTIVE'} 
                                    onChange={e => handleInputChange('status', e.target.value as 'ACTIVE' | 'INACTIVE')}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="ACTIVE">Actif</option>
                                    <option value="INACTIVE">Inactif</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Horaires
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: Lun-Ven: 8h-17h" 
                                    value={currentPoint?.hours || ''} 
                                    onChange={e => handleInputChange('hours', e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-6">
                            <button 
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setCurrentPoint(null);
                                }}
                                className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleSavePoint}
                                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Sauvegarder
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// =============================================================================
// MAIN OPERATIONS MANAGEMENT COMPONENT
// =============================================================================

export default function OperationsManagement() {
    const [activeTab, setActiveTab] = useState<'shipments' | 'relays'>('shipments');
    const [allRelayPoints, setAllRelayPoints] = useState<RelayPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('relay_points')
                    .select('*')
                    .order('name');
                
                if (error) throw error;
                if (data) setAllRelayPoints(data as RelayPoint[]);
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const tabConfig = {
        shipments: {
            label: 'Gestion des Colis',
            icon: Package,
            component: <ShipmentsManager allRelayPoints={allRelayPoints} />
        },
        relays: {
            label: 'Gestion des Points Relais',
            icon: Building,
            component: <RelayPointsManager />
        }
    };
    // ... (vos imports : AnimatePresence, motion, etc.)
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-colors duration-300">

            {/* Tab Navigation Header */}
            <div className="px-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex -mb-px"> {/* -mb-px pour que la bordure de l'onglet actif fusionne avec la bordure du conteneur */}
                    {Object.entries(tabConfig).map(([key, config]) => {
                        const Icon = config.icon;
                        const isActive = activeTab === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key as 'shipments' | 'relays')}
                                className={`py-3 px-4 font-semibold flex items-center gap-2 border-b-2 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-t-md ${
                                    isActive
                                        ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                {config.label}
                            </button>
                        );
                    })}
                </div>
            </div>
            
            {/* Tab Content */}
            <div className="p-4 sm:p-6">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <LoadingSpinner size="large" />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {tabConfig[activeTab].component}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
'use client';

import React, { useState, useMemo, useEffect, useCallback, MouseEvent } from 'react';
import { Package, PlusCircle, Search, Filter, Eye, CheckCircle, AlertTriangle, X, MapPin, Phone, User, Barcode, Send, Archive, Receipt, Star, Inbox, Loader2, ArchiveRestore } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from './page';
import { motion, AnimatePresence } from 'framer-motion';
import { DepotColis } from '../depot/depot';
import { WithdrawPackagePage } from '../withdraw-package/retrait';

// --- TYPES ---
type ParcelStatus = 'En attente de dépôt' | 'En stock' | 'Retiré' | 'En transit' | 'Au départ';
type ParcelType = 'Standard' | 'Express';
type ShipmentStatusDB = 'EN_ATTENTE_DE_DEPOT' | 'AU_DEPART' | 'EN_TRANSIT' | 'ARRIVE_AU_RELAIS' | 'RECU' | 'ANNULE';

interface Parcel {
  id: string; // trackingNumber
  status: ParcelStatus;
  type: ParcelType;
  arrivalDate: string;
  withdrawalDate?: string;
  location: string;
  designation: string;
  sender: { name: string; phone: string; originAddress: string; };
  recipient: { name: string; phone: string; deliveryAddress: string; };
  isFromMyRelay: boolean; // Nouveau : indique si le colis part de mon relais
  isToMyRelay: boolean;   // Nouveau : indique si le colis arrive à mon relais
}

interface Stats {
  total: number;
  enAttente: number;
  enStock: number;
  retire: number;
  enTransit: number;
}

// --- COMPOSANT MODAL DE DÉTAILS ---
const DetailsModal = ({ parcel, onClose }: { parcel: Parcel | null; onClose: () => void; }) => {
  if (!parcel) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-1"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Détails du Colis</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Code de suivi</label>
                <p className="font-mono text-lg font-bold text-orange-600 dark:text-orange-400">{parcel.id}</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Statut</label>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                  parcel.status === 'En stock' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' :
                  parcel.status === 'En attente de dépôt' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                  parcel.status === 'Retiré' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {parcel.status}
                </span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                  parcel.type === 'Express' 
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {parcel.type}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Désignation</label>
                <p className="text-gray-900 dark:text-white">{parcel.designation}</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Date d'arrivée</label>
                <p className="text-gray-900 dark:text-white">{new Date(parcel.arrivalDate).toLocaleDateString('fr-FR')}</p>
              </div>
              
              {parcel.withdrawalDate && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Date de retrait</label>
                  <p className="text-gray-900 dark:text-white">{new Date(parcel.withdrawalDate).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-slate-700">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-500" />
                Expéditeur
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{parcel.sender.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{parcel.sender.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{parcel.sender.originAddress}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Archive className="w-4 h-4 text-purple-500" />
                Destinataire
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{parcel.recipient.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{parcel.recipient.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{parcel.recipient.deliveryAddress}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- COMPOSANT MENU CONTEXTUEL ---
const ContextMenu = ({ x, y, parcel, onClose, onRegisterArrival, onRegisterWithdrawal, onViewDetails }: {
  x: number; y: number; parcel: Parcel; onClose: () => void; onRegisterArrival: (id: string) => void;
  onRegisterWithdrawal: (id: string) => void; onViewDetails: (parcel: Parcel) => void;
}) => {
  return (
    <div 
      className="fixed inset-0 z-40" 
      onClick={onClose}
    >
      <div 
        style={{ top: y, left: x }} 
        className="absolute bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-2 min-w-48 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onViewDetails(parcel)}
          className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 text-sm"
        >
          <Eye className="w-4 h-4" />
          Voir les détails
        </button>
        
        {parcel.status === 'En attente de dépôt' && (
          <button
            onClick={() => onRegisterArrival(parcel.id)}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 text-sm"
          >
            <CheckCircle className="w-4 h-4 text-green-500" />
            Enregistrer l'arrivée
          </button>
        )}
        
        {parcel.status === 'En stock' && (
          <button
            onClick={() => onRegisterWithdrawal(parcel.id)}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 text-sm"
          >
            <Receipt className="w-4 h-4 text-purple-500" />
            Enregistrer le retrait
          </button>
        )}
      </div>
    </div>
  );
};

// --- COMPOSANT PRINCIPAL DE LA PAGE INVENTAIRE ---
export default function InventoryPage({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, enAttente: 0, enStock: 0, retire: 0, enTransit: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ParcelStatus | 'Tous'>('Tous');
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, parcel: Parcel } | null>(null);
    const [activeView, setActiveView] = useState<'inventory' | 'depot' | 'retrait'>('inventory');

  // Helper pour mapper les statuts de la BDD vers des statuts plus clairs
  const mapStatusForFreelance = (status: ShipmentStatusDB, isFromMyRelay: boolean, isToMyRelay: boolean): ParcelStatus => {
    // Logique pour déterminer le statut selon la position du colis par rapport à mon relais
    if (isFromMyRelay && status === 'ARRIVE_AU_RELAIS') {
      return 'En stock'; // Le colis arrive à mon relais, il est en stock
    }
    if (isFromMyRelay && status === 'EN_ATTENTE_DE_DEPOT') {
      return 'En attente de dépôt'; // Le colis doit partir de mon relais mais n'est pas encore déposé
    }
    if (isToMyRelay && (status === 'EN_ATTENTE_DE_DEPOT' || status === 'AU_DEPART' || status === 'EN_TRANSIT')) {
      return 'En transit'; // Le colis vient vers mon relais
    }
    
    switch (status) {
      case 'EN_ATTENTE_DE_DEPOT': return 'En attente de dépôt';
      case 'AU_DEPART': return 'Au départ';
      case 'EN_TRANSIT': return 'En transit';
      case 'ARRIVE_AU_RELAIS': return 'En stock';
      case 'RECU': return 'Retiré';
      default: return 'En stock';
    }
  };

  const handleDepotSuccess = () => {
    setActiveView('inventory'); // Revenir à l'inventaire
  };

    const handleCloseDepot = () => {
    setActiveView('inventory');
  };

  const handleActionSuccess = () => {
    setActiveView('inventory'); // Revenir à l'inventaire
    // Le useEffect ci-dessus se chargera de rafraîchir les données
  };

  const handleCloseAction = () => {
    setActiveView('inventory');
  };
  

  // --- USEEFFECT CORRIGÉ AVEC LA BONNE TABLE ---
  useEffect(() => {
    const fetchParcelsForFreelance = async () => {
      if (!profile?.id) {
        setError("Profil non identifié.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        // 1. Trouver le point relais du freelance
        const { data: relayPoint, error: relayError } = await supabase
          .from('relay_points')
          .select('id, name')
          .eq('agency_id', profile.id)
          .single();

        if (relayError || !relayPoint) {
          throw new Error(relayError?.code === 'PGRST116' ? "Aucun point relais n'est configuré pour votre compte." : relayError?.message || "Erreur de récupération du point relais");
        }
        
        const relayPointId = relayPoint.id;
        
        // 2. Récupérer les colis avec la VRAIE TABLE 'shipments'
        const { data: shipmentsData, error: dbError } = await supabase
          .from('shipments') // TABLE CORRECTE
          .select(`
            id,
            tracking_number,
            status,
            shipping_cost,
            created_at,
            updated_at,
            description,
            sender_name,
            sender_phone,
            recipient_name,
            recipient_phone,
            departure_point_id,
            arrival_point_id,
            departurePoint:departure_point_id(name),
            arrivalPoint:arrival_point_id(name)
          `)
          .or(`departure_point_id.eq.${relayPointId},arrival_point_id.eq.${relayPointId}`)
          .order('created_at', { ascending: false });

        if (dbError) {
          console.error("Erreur Supabase:", dbError);
          throw dbError;
        }
        
        if (!shipmentsData || shipmentsData.length === 0) {
          setParcels([]);
          setStats({ total: 0, enAttente: 0, enStock: 0, retire: 0, enTransit: 0 });
          setIsLoading(false);
          return;
        }

        // 3. Formatter les données de manière SÉCURISÉE
        const formattedParcels: Parcel[] = shipmentsData.map((shipment: any) => {
          const isFromMyRelay = shipment.departure_point_id === relayPointId;
          const isToMyRelay = shipment.arrival_point_id === relayPointId;
          
          return {
            id: shipment.tracking_number,
            status: mapStatusForFreelance(shipment.status as ShipmentStatusDB, isFromMyRelay, isToMyRelay),
            type: (shipment.shipping_cost || 0) > 2000 ? 'Express' : 'Standard',
            arrivalDate: shipment.created_at,
            withdrawalDate: shipment.status === 'RECU' ? shipment.updated_at : undefined,
            location: relayPoint.name || "Mon Relais",
            designation: shipment.description || "Description non disponible",
            isFromMyRelay,
            isToMyRelay,
            sender: { 
              name: shipment.sender_name || "Expéditeur inconnu", 
              phone: shipment.sender_phone || "Non renseigné",
              originAddress: shipment.departurePoint?.name || 'Origine inconnue'
            },
            recipient: { 
              name: shipment.recipient_name || "Destinataire inconnu", 
              phone: shipment.recipient_phone || "Non renseigné",
              deliveryAddress: shipment.arrivalPoint?.name || 'Destination inconnue' 
            },
          };
        });
        
        setParcels(formattedParcels);

        // 4. Calculer les statistiques
        const newStats: Stats = { 
          total: formattedParcels.length, 
          enAttente: 0, 
          enStock: 0, 
          retire: 0, 
          enTransit: 0 
        };
        
        formattedParcels.forEach(p => {
          switch (p.status) {
            case 'En attente de dépôt': newStats.enAttente++; break;
            case 'En stock': newStats.enStock++; break;
            case 'Retiré': newStats.retire++; break;
            case 'En transit': case 'Au départ': newStats.enTransit++; break;
          }
        });
        
        setStats(newStats);

      } catch (err: any) {
        console.error("Erreur de chargement de l'inventaire:", err);
        setError(`Impossible de charger l'inventaire : ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParcelsForFreelance();
  }, [profile]);

  const filteredParcels = useMemo(() => {
    return parcels.filter(p => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        p.id.toLowerCase().includes(searchLower) || 
        p.sender.name.toLowerCase().includes(searchLower) || 
        p.recipient.name.toLowerCase().includes(searchLower) || 
        p.designation.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === 'Tous' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [parcels, searchQuery, statusFilter]);

  // --- Les handlers ---
  const handleRightClick = (event: MouseEvent<HTMLDivElement>, parcel: Parcel) => {
    event.preventDefault(); 
    setContextMenu({ x: event.pageX, y: event.pageY, parcel });
  };

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleRegisterArrival = useCallback((id: string) => {
    localStorage.setItem('redirect_to_deposit', JSON.stringify({ packageId: id }));
    router.push('/emit-package'); 
    closeContextMenu();
  }, [router, closeContextMenu]);

  const handleRegisterWithdrawal = useCallback((id: string) => {
    localStorage.setItem('redirect_to_withdrawal', JSON.stringify({ packageId: id }));
    router.push('/withdraw-package'); 
    closeContextMenu();
  }, [router, closeContextMenu]);

  const viewDetails = (parcel: Parcel) => { 
    setSelectedParcel(parcel); 
    setIsModalOpen(true); 
    closeContextMenu(); 
  };

  const closeModal = () => { 
    setIsModalOpen(false); 
    setSelectedParcel(null); 
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Chargement de votre inventaire...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4 p-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Erreur de chargement</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (

      <div className="space-y-8">
        {contextMenu && (
          <ContextMenu 
            {...contextMenu} 
            onClose={closeContextMenu} 
            onRegisterArrival={handleRegisterArrival} 
            onRegisterWithdrawal={handleRegisterWithdrawal} 
            onViewDetails={viewDetails} 
          />
        )}
        
        <AnimatePresence>
          {isModalOpen && <DetailsModal parcel={selectedParcel} onClose={closeModal} />}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {activeView === 'inventory' ? (
          // -------- VUE INVENTAIRE --------
            <motion.div
              key="inventory-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Section Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Total Colis" value={stats.total} icon={Package} color="border-orange-500 dark:border-orange-400" />
                <StatCard title="En Attente" value={stats.enAttente} icon={Send} color="border-blue-500 dark:border-blue-400" />
                <StatCard title="En Stock" value={stats.enStock} icon={Archive} color="border-purple-500 dark:border-purple-400" />
                <StatCard title="En Transit" value={stats.enTransit} icon={AlertTriangle} color="border-yellow-500 dark:border-yellow-400" />
                <StatCard title="Retirés" value={stats.retire} icon={CheckCircle} color="border-green-500 dark:border-green-400" />
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700/50"
              >
                <div className="p-6 border-b border-gray-100 dark:border-slate-700/50">
                  <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-2xl text-gray-900 dark:text-gray-50">Mon Inventaire</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                      {/* MODIFICATION: Ajout d'un conteneur pour les boutons d'action */}
                      <div className="flex flex-col sm:flex-row items-center text-sm gap-3">
                        <button
                          onClick={() => setActiveView('depot')}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition-all transform hover:scale-105"
                        >
                          <PlusCircle className="w-4 h-4" />
                          Enregistrer un dépôt
                        </button>
                        {/* NOUVEAU BOUTON DE RETRAIT */}
                        <button
                          onClick={() => setActiveView('retrait')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-all transform hover:scale-105"
                        >
                          <ArchiveRestore className="w-4 h-4" />
                          Enregistrer un retrait
                        </button>
                      </div>
                      <div className="relative w-full text-sm sm:w-80">
                        <Search className="h-3 w-3 font-bold text-gray-400 dark:text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" 
                          placeholder="Rechercher (code, nom...)" 
                          value={searchQuery} 
                          onChange={(e) => setSearchQuery(e.target.value)} 
                          className="pl-8 pr-1 py-2 w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500 focus:border-transparent transition bg-white/50 dark:bg-slate-700/50" 
                        />
                      </div>
                      <div className="relative text-sm w-full sm:w-auto">
                        <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                        <select 
                          value={statusFilter} 
                          onChange={(e) => setStatusFilter(e.target.value as any)} 
                          className="pl-12 pr-8 py-3 w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl appearance-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500 bg-white/50 dark:bg-slate-700/50 cursor-pointer"
                        >
                          <option value="Tous">Tous les statuts</option>
                          <option value="En attente de dépôt">En attente</option>
                          <option value="En stock">En stock</option>
                          <option value="En transit">En transit</option>
                          <option value="Retiré">Retiré</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {filteredParcels.length === 0 ? (
                    <div className="text-center py-20 px-6">
                      <Inbox className="h-20 w-20 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="font-bold text-xl text-gray-700 dark:text-gray-200 mb-2">Aucun colis trouvé</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        {parcels.length === 0 
                          ? "Aucun colis n'est associé à votre point relais pour le moment." 
                          : "Modifiez vos critères de recherche pour affiner les résultats."
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      <AnimatePresence>
                        {filteredParcels.map((parcel) => (
                          <PackageCard 
                            key={parcel.id} 
                            parcel={parcel} 
                            onViewDetails={() => viewDetails(parcel)} 
                            onContextMenu={(e) => handleRightClick(e, parcel)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
                      </motion.div>
        ) : activeView === 'depot' ? (
          // -------- VUE DÉPÔT --------
          <motion.div
            key="depot-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <DepotColis onClose={handleCloseDepot} onSuccess={handleDepotSuccess} />
          </motion.div>
          ) : ( // Le dernier cas est donc 'retrait'
          <motion.div key="retrait-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <WithdrawPackagePage onClose={handleCloseAction} onSuccess={handleActionSuccess} />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
  );
}

// --- SOUS-COMPOSANTS DESIGN ---
const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: React.ElementType, color: string }) => (
  <motion.div
    className={`p-6 bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg border-l-4 ${color} transition hover:shadow-xl hover:-translate-y-1`}
    initial={{ opacity: 0, y: 15 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ duration: 0.4 }}
  >
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">{value}</p>
      </div>
      <div className="p-3 bg-gray-100 dark:bg-slate-700 rounded-full">
        <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
      </div>
    </div>
  </motion.div>
);

const PackageCard = ({ parcel, onViewDetails, onContextMenu }: { parcel: Parcel, onViewDetails: () => void, onContextMenu: (e: MouseEvent<HTMLDivElement>) => void }) => {
  const getStatusConfig = (status: ParcelStatus) => {
    switch (status) {
      case 'En attente de dépôt': return { icon: Send, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50', pulse: true };
      case 'En stock': return { icon: Archive, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50', pulse: false };
      case 'En transit': return { icon: AlertTriangle, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/50', pulse: true };
      case 'Au départ': return { icon: Send, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/50', pulse: true };
      case 'Retiré': return { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/50', pulse: false };
      default: return { icon: Package, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-700', pulse: false };
    }
  };
  
  const statusConfig = getStatusConfig(parcel.status);
  const isMyRelayParcel = parcel.isFromMyRelay || parcel.isToMyRelay;

  return (
    <motion.div
      layout 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }} 
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onContextMenu={onContextMenu}
      className="group relative cursor-pointer bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden hover:border-orange-400 dark:hover:border-orange-500 transition-all duration-300"
    >
      {/* En-tête avec code de suivi et statut */}
      <div className={`p-4 flex items-center justify-between ${statusConfig.bg} border-b border-gray-200 dark:border-slate-700`}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-100">{parcel.id}</span>
          {isMyRelayParcel && (
            <div className="flex items-center gap-1 text-xs">
              {parcel.isFromMyRelay && (
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                  Départ
                </span>
              )}
              {parcel.isToMyRelay && (
                <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                  Arrivée
                </span>
              )}
            </div>
          )}
        </div>
        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${statusConfig.color}`}>
          <statusConfig.icon className={`w-4 h-4 ${statusConfig.pulse && 'animate-pulse'}`} />
          <span>{parcel.status}</span>
        </div>
      </div>

      {/* Corps de la carte */}
      <div className="p-4 space-y-3">
        <p className="font-bold text-gray-900 dark:text-gray-50 truncate" title={parcel.designation}>
          {parcel.designation}
        </p>
        
        <div className="text-xs space-y-2 text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Send className="w-3 h-3 text-blue-500 flex-shrink-0" />
            <span className="truncate">
              <strong className="font-medium text-gray-700 dark:text-gray-300">De:</strong> {parcel.sender.name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{parcel.sender.originAddress}</span>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <Archive className="w-3 h-3 text-purple-500 flex-shrink-0" />
            <span className="truncate">
              <strong className="font-medium text-gray-700 dark:text-gray-300">Pour:</strong> {parcel.recipient.name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{parcel.recipient.deliveryAddress}</span>
          </div>
        </div>

        {/* Footer de la carte */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
              parcel.type === 'Express' 
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' 
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
            }`}>
              {parcel.type}
            </span>
            
            {/* Indicateur de position */}
            <div className="flex items-center gap-1">
              {parcel.isFromMyRelay && (
                <div className="w-2 h-2 bg-blue-400 rounded-full" title="Colis au départ de votre relais"></div>
              )}
              {parcel.isToMyRelay && (
                <div className="w-2 h-2 bg-purple-400 rounded-full" title="Colis à destination de votre relais"></div>
              )}
            </div>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onViewDetails(); }} 
            className="opacity-0 group-hover:opacity-100 text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center text-sm font-semibold gap-1 transition-opacity"
          >
            Détails <Eye className="w-3 h-3" />
          </button>
        </div>

        {/* Date d'arrivée */}
        <div className="text-xs text-gray-500 dark:text-gray-500 pt-1 border-t border-gray-100 dark:border-slate-700/50">
          <span>Créé le {new Date(parcel.arrivalDate).toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </div>
    </motion.div>
  );
};
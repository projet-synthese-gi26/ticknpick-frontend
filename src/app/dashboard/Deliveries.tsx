'use client';
import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Navigation, 
  Play,
  Eye,
  Search,
  RefreshCw,
  User,
  Calendar,
  Weight,
  Target,
  Route,
  ArrowLeft,
  Phone
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Types basés sur votre schéma de base de données
interface RelayPoint {
  id: number;
  name: string;
  address?: string;
  quartier?: string;
  lat: number;
  lng: number;
  hours?: string;
  type?: 'bureau' | 'commerce' | 'agence';
  agency_id?: string;
  manager_name?: string;
}

interface Shipment {
  id: number;
  tracking_number: string;
  created_at: string;
  updated_at?: string;
  status: 'EN_ATTENTE_DE_DEPOT' | 'PRET_POUR_RETRAIT' | 'EN_TRANSIT' | 'LIVRE' | 'ANNULE' | 'RECU';
  sender_name: string;
  sender_phone: string;
  recipient_name: string;
  recipient_phone: string;
  departure_point_id?: number;
  arrival_point_id?: number;
  description?: string;
  weight?: number;
  is_fragile: boolean;
  is_perishable: boolean;
  is_insured: boolean;
  declared_value?: number;
  shipping_cost: number;
  is_paid_at_departure: boolean;
  amount_paid?: number;
  change_amount?: number;
  created_by_user?: string;
  departure_point?: RelayPoint;
  arrival_point?: RelayPoint;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  account_type: 'CLIENT' | 'LIVREUR';
  phone_number?: string;
}

interface CollectPackageProps {
  shipment: Shipment;
  onBack: () => void;
  onCollected: (shipmentId: number) => void;
}

// Composant pour la collecte de colis
const CollectPackagePage: React.FC<CollectPackageProps> = ({ shipment, onBack, onCollected }) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [notes, setNotes] = useState('');

  const handleCollectPackage = async () => {
    setIsCollecting(true);
    try {
      // Ici vous pouvez ajouter la logique pour mettre à jour le statut du colis
      // Par exemple, changer le statut à 'EN_TRANSIT' et assigner le livreur
      
      // Simulation d'une API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onCollected(shipment.id);
    } catch (error) {
      console.error('Erreur lors de la collecte:', error);
    } finally {
      setIsCollecting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-orange-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="bg-orange-100 hover:bg-orange-200 text-orange-700 p-3 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Collecte du Colis</h1>
                <p className="text-gray-600">Code de suivi: {shipment.tracking_number}</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-4 rounded-xl">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Informations du colis */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-orange-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Détails du Colis</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Expéditeur */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-3 rounded-xl">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Expéditeur</h3>
                  <p className="text-gray-600">Informations de récupération</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nom</p>
                  <p className="text-lg text-gray-900">{shipment.sender_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Téléphone</p>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{shipment.sender_phone}</p>
                  </div>
                </div>
                {shipment.departure_point && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Point de départ</p>
                    <p className="text-gray-900">{shipment.departure_point.name}</p>
                    <p className="text-sm text-gray-600">{shipment.departure_point.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Destinataire */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-xl">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Destinataire</h3>
                  <p className="text-gray-600">Informations de livraison</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nom</p>
                  <p className="text-lg text-gray-900">{shipment.recipient_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Téléphone</p>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{shipment.recipient_phone}</p>
                  </div>
                </div>
                {shipment.arrival_point && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Point d'arrivée</p>
                    <p className="text-gray-900">{shipment.arrival_point.name}</p>
                    <p className="text-sm text-gray-600">{shipment.arrival_point.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Détails du colis */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Caractéristiques du Colis</h3>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="bg-blue-100 p-4 rounded-xl mx-auto w-fit mb-3">
                  <Weight className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Poids</p>
                <p className="text-xl font-bold text-gray-900">{shipment.weight || 'N/A'} kg</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 p-4 rounded-xl mx-auto w-fit mb-3">
                  <Package className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Valeur déclarée</p>
                <p className="text-xl font-bold text-gray-900">
                  {shipment.declared_value ? `${shipment.declared_value.toLocaleString()} FCFA` : 'N/A'}
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-xl mx-auto w-fit mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-500">Coût de livraison</p>
                <p className="text-xl font-bold text-gray-900">{shipment.shipping_cost.toLocaleString()} FCFA</p>
              </div>
            </div>

            {/* Indicateurs spéciaux */}
            <div className="flex flex-wrap gap-3 mb-6">
              {shipment.is_fragile && (
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium border border-red-200">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Fragile
                </span>
              )}
              {shipment.is_perishable && (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Périssable
                </span>
              )}
              {shipment.is_insured && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Assuré
                </span>
              )}
            </div>

            {shipment.description && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">{shipment.description}</p>
              </div>
            )}

            <div className="text-center text-sm text-gray-500">
              Créé le {formatDate(shipment.created_at)}
            </div>
          </div>
        </div>

        {/* Notes du livreur */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-orange-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes de collecte (optionnel)</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ajoutez des notes concernant la collecte de ce colis..."
            className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-orange-100">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onBack}
              className="flex-1 max-w-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 px-6 rounded-xl font-medium transition-colors"
            >
              Retour
            </button>
            
            <button
              onClick={handleCollectPackage}
              disabled={isCollecting}
              className="flex-1 max-w-xs bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {isCollecting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Collecte en cours...</span>
                </>
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  <Link href='/collect-package' ><span>Confirmer la Collecte</span></Link>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant principal
export default function DeliveryPage({ profile }: { profile: UserProfile }) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'available' | 'completed'>('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showCollectPage, setShowCollectPage] = useState(false);

  const fetchShipments = async () => {
    setLoading(true);
    
    try {
      // Assurez-vous d'importer votre client Supabase
      // import { supabase } from '@/lib/supabase'
      
      const { data: shipmentsData, error } = await supabase
        .from('shipments')
        .select(`
          *,
          departure_point:relay_points!departure_point_id(*),
          arrival_point:relay_points!arrival_point_id(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setShipments(shipmentsData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des colis:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchShipments();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleAcceptDelivery = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShowCollectPage(true);
  };

  const handleCollected = (shipmentId: number) => {
    // Mettre à jour le statut du colis
    setShipments(prev => 
      prev.map(shipment => 
        shipment.id === shipmentId 
          ? { ...shipment, status: 'EN_TRANSIT' as const }
          : shipment
      )
    );
    
    setShowCollectPage(false);
    setSelectedShipment(null);
  };

  const handleBackFromCollect = () => {
    setShowCollectPage(false);
    setSelectedShipment(null);
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      'EN_ATTENTE_DE_DEPOT': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'En attente de dépôt', icon: Clock },
      'PRET_POUR_RETRAIT': { color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Prêt pour retrait', icon: Package },
      'EN_TRANSIT': { color: 'bg-orange-100 text-orange-800 border-orange-200', text: 'En transit', icon: Truck },
      'LIVRE': { color: 'bg-green-100 text-green-800 border-green-200', text: 'Livré', icon: CheckCircle },
      'ANNULE': { color: 'bg-red-100 text-red-800 border-red-200', text: 'Annulé', icon: AlertCircle },
      'RECU': { color: 'bg-gray-100 text-gray-800 border-gray-200', text: 'Reçu', icon: CheckCircle }
    };
    
    return configs[status as keyof typeof configs] || configs['EN_ATTENTE_DE_DEPOT'];
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = getStatusConfig(status);
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <IconComponent className="w-4 h-4 mr-1" />
        {config.text}
      </span>
    );
  };

  // Filtrer les colis disponibles (tous sauf ceux avec le statut 'RECU')
  const availableShipments = shipments.filter(shipment => shipment.status !== 'RECU');
  const myDeliveries = shipments.filter(shipment => shipment.status === 'EN_TRANSIT');
  const completedDeliveries = shipments.filter(shipment => shipment.status === 'LIVRE' || shipment.status === 'RECU');

  const filteredShipments = (() => {
    let targetShipments: Shipment[] = [];
    switch (activeTab) {
      case 'active':
        targetShipments = myDeliveries;
        break;
      case 'available':
        targetShipments = availableShipments;
        break;
      case 'completed':
        targetShipments = completedDeliveries;
        break;
      default:
        targetShipments = [];
    }
    
    return targetShipments.filter(shipment =>
      shipment.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.sender_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  })();

  if (showCollectPage && selectedShipment) {
    return (
      <CollectPackagePage 
        shipment={selectedShipment}
        onBack={handleBackFromCollect}
        onCollected={handleCollected}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"></div>
          <p className="text-orange-600 font-medium">Chargement des colis...</p>
        </div>
      </div>
    );
  }

  const stats = {
    active: myDeliveries.length,
    delivered: completedDeliveries.length,
    available: availableShipments.length,
    inTransit: myDeliveries.length
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion de livraisons</h1>
              <p className="text-gray-600 text-md">Merci {profile.name}, de nous faire confiance pour gérer vos livraisons en temps réel.</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="bg-orange-100 hover:bg-orange-200 text-orange-700 p-3 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-4 rounded-xl">
                <Truck className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Mes livraisons</p>
                <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Terminées</p>
                <p className="text-3xl font-bold text-gray-900">{stats.delivered}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Disponibles</p>
                <p className="text-3xl font-bold text-gray-900">{stats.available}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">En transit</p>
                <p className="text-3xl font-bold text-gray-900">{stats.inTransit}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <Route className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par code de suivi ou nom..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex bg-orange-50 rounded-xl p-1 border border-orange-200">
              <button
                onClick={() => setActiveTab('available')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'available' 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'text-orange-700 hover:text-orange-800 hover:bg-orange-100'
                }`}
              >
                Disponibles ({stats.available})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'active' 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'text-orange-700 hover:text-orange-800 hover:bg-orange-100'
                }`}
              >
                Mes livraisons ({stats.active})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'completed' 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'text-orange-700 hover:text-orange-800 hover:bg-orange-100'
                }`}
              >
                Terminées ({stats.delivered})
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {filteredShipments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-orange-100">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'available' && 'Aucun colis disponible'}
                {activeTab === 'active' && 'Aucune livraison active'}
                {activeTab === 'completed' && 'Aucune livraison terminée'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'available' && 'Aucun colis n\'est actuellement disponible pour la livraison'}
                {activeTab === 'active' && 'Vous n\'avez aucune livraison en cours. Consultez les colis disponibles.'}
                {activeTab === 'completed' && 'Vous n\'avez encore terminé aucune livraison'}
              </p>
              {activeTab === 'active' && (
                <button
                  onClick={() => setActiveTab('available')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors mt-4"
                >
                  Voir les colis disponibles
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredShipments.map((shipment) => (
                <div key={shipment.id} className="bg-white rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-all">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-orange-100 p-3 rounded-xl">
                          <Package className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">{shipment.tracking_number}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(shipment.created_at).toLocaleDateString('fr-FR')}
                            </span>
                            {shipment.weight && (
                              <span className="flex items-center">
                                <Weight className="w-4 h-4 mr-1" />
                                {shipment.weight} kg
                              </span>
                            )}
                            <span className="font-medium text-orange-600">
                              {shipment.shipping_cost.toLocaleString()} FCFA
                            </span>
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={shipment.status} />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="bg-orange-100 p-2 rounded-lg mt-1">
                            <User className="w-4 h-4 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Expéditeur</p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">{shipment.sender_name}</p>
                            <p className="text-sm text-gray-600">{shipment.sender_phone}</p>
                            {shipment.departure_point && (
                              <p className="text-sm text-gray-500 mt-1">
                                {shipment.departure_point.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="bg-green-100 p-2 rounded-lg mt-1">
                            <MapPin className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Destinataire</p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">{shipment.recipient_name}</p>
                            <p className="text-sm text-gray-600">{shipment.recipient_phone}</p>
                            {shipment.arrival_point && (
                              <p className="text-sm text-gray-500 mt-1">
                                {shipment.arrival_point.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Caractéristiques spéciales */}
                    {(shipment.is_fragile || shipment.is_perishable || shipment.is_insured || shipment.description) && (
                      <div className="mb-6">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {shipment.is_fragile && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                              Fragile
                            </span>
                          )}
                          {shipment.is_perishable && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                              Périssable
                            </span>
                          )}
                          {shipment.is_insured && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              Assuré
                            </span>
                          )}
                        </div>
                        {shipment.description && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            <span className="font-medium">Description:</span> {shipment.description}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        {shipment.declared_value && (
                          <span>Valeur: {shipment.declared_value.toLocaleString()} FCFA</span>
                        )}
                        <span>Paiement: {shipment.is_paid_at_departure ? 'Au départ' : 'À la livraison'}</span>
                      </div>
                      
                      <div className="flex space-x-3">
                        {activeTab === 'available' && shipment.status !== 'RECU' && (
                          <button
                            onClick={() => handleAcceptDelivery(shipment)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Effectuer cette livraison</span>
                          </button>
                        )}
                        
                        {activeTab === 'active' && (
                          <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors">
                            <Navigation className="w-4 h-4" />
                            <span>Suivi GPS</span>
                          </button>
                        )}
                        
                        <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors">
                          <Eye className="w-4 h-4" />
                          <span>Détails</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
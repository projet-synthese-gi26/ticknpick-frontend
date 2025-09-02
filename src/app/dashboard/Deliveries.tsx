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
  Route
} from 'lucide-react';

// Types
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Shipment {
  id: string;
  tracking_code: string;
  sender_name: string;
  sender_phone?: string;
  recipient_name: string;
  recipient_phone?: string;
  pickup_address: string;
  delivery_address: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: string;
  weight?: number;
  price?: number;
  description?: string;
  delivery_person_id?: string;
}

interface Delivery {
  id: string;
  delivery_person_id: string;
  shipment_id: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  current_location?: {
    lat: number;
    lng: number;
  };
  notes?: string;
  shipment?: Shipment;
}

// Simuler la connection Supabase
const supabaseClient = {
  from: (table: string) => ({
    select: (columns = '*') => ({
      eq: (column: string, value: any) => ({
        data: mockData[table] || [],
        error: null
      }),
      data: mockData[table] || [],
      error: null
    }),
    insert: (data: any) => ({
      select: () => ({
        data: [{ ...data, id: Date.now().toString() }],
        error: null
      })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        data: [data],
        error: null
      })
    })
  })
};

// Données simulées pour la démonstration
const mockData: { [key: string]: any[] } = {
  shipments: [
    {
      id: '1',
      tracking_code: 'PKD-2025-001',
      sender_name: 'Boutique Mode Africaine',
      sender_phone: '+237 123 456 789',
      recipient_name: 'Marie Nkomo',
      recipient_phone: '+237 987 654 321',
      pickup_address: 'Marché Central, Yaoundé',
      delivery_address: 'Quartier Bastos, Yaoundé',
      status: 'pending',
      created_at: '2025-01-02T08:00:00Z',
      weight: 1.2,
      price: 2500,
      description: 'Vêtements traditionnels',
      delivery_person_id: null
    },
    {
      id: '2',
      tracking_code: 'PKD-2025-002',
      sender_name: 'Pharmacie du Centre',
      recipient_name: 'Dr. Mballa',
      pickup_address: 'Rue de la Poste, Yaoundé',
      delivery_address: 'Hôpital Central, Yaoundé',
      status: 'pending',
      created_at: '2025-01-02T09:30:00Z',
      weight: 0.5,
      price: 1500,
      description: 'Médicaments',
      delivery_person_id: null
    },
    {
      id: '3',
      tracking_code: 'PKD-2025-003',
      sender_name: 'Electronics Store',
      recipient_name: 'Jean Paul',
      pickup_address: 'Avenue Kennedy, Yaoundé',
      delivery_address: 'Essos, Yaoundé',
      status: 'pending',
      created_at: '2025-01-02T10:15:00Z',
      weight: 2.8,
      price: 3000,
      description: 'Smartphone',
      delivery_person_id: null
    }
  ],
  deliveries: [
    {
      id: '1',
      delivery_person_id: 'user-123',
      shipment_id: '4',
      status: 'in_transit',
      started_at: '2025-01-02T07:00:00Z',
      current_location: { lat: 3.848, lng: 11.502 },
      notes: 'En route vers la destination'
    }
  ]
};

export default function DeliveryPage({ profile = { id: 'user-123', name: 'John Doe', email: 'john@example.com', role: 'driver' } }: { profile?: UserProfile }) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [availableShipments, setAvailableShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'available' | 'completed'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [trackingDelivery, setTrackingDelivery] = useState<string | null>(null);

  // Simulation de la récupération des données
  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Récupérer les livraisons de l'utilisateur
      const { data: deliveriesData } = supabaseClient
        .from('deliveries')
        .select('*')
        .eq('delivery_person_id', profile.id);
      
      // Récupérer les colis disponibles
      const { data: shipmentsData } = supabaseClient
        .from('shipments')
        .select('*');
      
      const availableShipments = shipmentsData.filter(
        (shipment: Shipment) => 
          shipment.status === 'pending' && 
          !shipment.delivery_person_id
      );

      // Enrichir les deliveries avec les shipments
      const enrichedDeliveries = deliveriesData.map((delivery: Delivery) => {
        const shipment = shipmentsData.find((s: Shipment) => s.id === delivery.shipment_id);
        return { ...delivery, shipment };
      });

      setDeliveries(enrichedDeliveries);
      setAvailableShipments(availableShipments);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile.id]);

  const handleAcceptDelivery = async (shipmentId: string) => {
    try {
      // Créer une nouvelle livraison
      const newDelivery = {
        delivery_person_id: profile.id,
        shipment_id: shipmentId,
        status: 'assigned',
        created_at: new Date().toISOString()
      };

      const { data } = supabaseClient
        .from('deliveries')
        .insert(newDelivery)
        .select();

      // Mettre à jour le shipment
      supabaseClient
        .from('shipments')
        .update({ delivery_person_id: profile.id, status: 'in_transit' })
        .eq('id', shipmentId);

      await refreshData();
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de la livraison:', error);
    }
  };

  const handleStartDelivery = async (deliveryId: string) => {
    try {
      if (navigator.geolocation) {
        setTrackingDelivery(deliveryId);
        
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const updateData = {
              status: 'picked_up',
              started_at: new Date().toISOString(),
              current_location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }
            };

            supabaseClient
              .from('deliveries')
              .update(updateData)
              .eq('id', deliveryId);

            await refreshData();
          },
          (error) => {
            console.error('Erreur de géolocalisation:', error);
            setTrackingDelivery(null);
          }
        );
      }
    } catch (error) {
      console.error('Erreur lors du démarrage de la livraison:', error);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      assigned: { color: 'bg-orange-100 text-orange-800 border-orange-200', text: 'Assignée', icon: Clock },
      picked_up: { color: 'bg-orange-200 text-orange-900 border-orange-300', text: 'Récupérée', icon: Package },
      in_transit: { color: 'bg-orange-300 text-orange-900 border-orange-400', text: 'En cours', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800 border-green-200', text: 'Livrée', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-200', text: 'Annulée', icon: AlertCircle },
      pending: { color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Disponible', icon: Package }
    };
    
    return configs[status as keyof typeof configs] || configs.pending;
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

  const filteredDeliveries = deliveries.filter(delivery => 
    delivery.shipment && (
      delivery.shipment.tracking_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.shipment.recipient_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredAvailableShipments = availableShipments.filter(shipment =>
    shipment.tracking_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.recipient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"></div>
          <p className="text-orange-600 font-medium">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = {
    active: deliveries.filter(d => d.status !== 'delivered' && d.status !== 'cancelled').length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
    available: availableShipments.length,
    inTransit: deliveries.filter(d => d.status === 'in_transit' || d.status === 'picked_up').length
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard Livraisons</h1>
              <p className="text-gray-600 text-lg">Bonjour {profile.name}, gérez vos livraisons en temps réel</p>
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
                <p className="text-sm font-medium text-gray-500 mb-1">Livraisons actives</p>
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
                <p className="text-sm font-medium text-gray-500 mb-1">Livrées aujourd'hui</p>
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
                placeholder="Rechercher par code de suivi ou destinataire..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex bg-orange-50 rounded-xl p-1 border border-orange-200">
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
                onClick={() => setActiveTab('available')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'available' 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'text-orange-700 hover:text-orange-800 hover:bg-orange-100'
                }`}
              >
                Disponibles ({stats.available})
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'active' && (
          <div className="space-y-6">
            {filteredDeliveries.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-orange-100">
                <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Truck className="w-10 h-10 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune livraison active</h3>
                <p className="text-gray-500 mb-6">Commencez par accepter des colis à livrer depuis l'onglet "Disponibles"</p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Voir les colis disponibles
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDeliveries.map((delivery) => (
                  <div key={delivery.id} className="bg-white rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-all">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="bg-orange-100 p-3 rounded-xl">
                            <Package className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">{delivery.shipment?.tracking_code}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(delivery.shipment?.created_at || '').toLocaleDateString('fr-FR')}
                              </span>
                              {delivery.shipment?.weight && (
                                <span className="flex items-center">
                                  <Weight className="w-4 h-4 mr-1" />
                                  {delivery.shipment.weight} kg
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={delivery.status} />
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="bg-orange-100 p-2 rounded-lg mt-1">
                              <MapPin className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Récupération</p>
                              <p className="text-lg font-semibold text-gray-900 mt-1">{delivery.shipment?.sender_name}</p>
                              <p className="text-gray-600">{delivery.shipment?.pickup_address}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="bg-green-100 p-2 rounded-lg mt-1">
                              <MapPin className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Livraison</p>
                              <p className="text-lg font-semibold text-gray-900 mt-1">{delivery.shipment?.recipient_name}</p>
                              <p className="text-gray-600">{delivery.shipment?.delivery_address}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          {delivery.shipment?.description && (
                            <span>Contenu: {delivery.shipment.description}</span>
                          )}
                          {delivery.started_at && (
                            <span>Démarrée: {new Date(delivery.started_at).toLocaleTimeString('fr-FR')}</span>
                          )}
                        </div>
                        
                        <div className="flex space-x-3">
                          {delivery.status === 'assigned' && (
                            <button
                              onClick={() => handleStartDelivery(delivery.id)}
                              disabled={trackingDelivery === delivery.id}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors disabled:opacity-50"
                            >
                              <Play className="w-4 h-4" />
                              <span>{trackingDelivery === delivery.id ? 'Démarrage...' : 'Démarrer'}</span>
                            </button>
                          )}
                          
                          {(delivery.status === 'picked_up' || delivery.status === 'in_transit') && (
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
        )}

        {activeTab === 'available' && (
          <div className="space-y-6">
            {filteredAvailableShipments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-orange-100">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun colis disponible</h3>
                <p className="text-gray-500">Aucun colis n'est actuellement disponible pour la livraison</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredAvailableShipments.map((shipment) => (
                  <div key={shipment.id} className="bg-white rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-all">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 p-3 rounded-xl">
                            <Package className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">{shipment.tracking_code}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Créé le {new Date(shipment.created_at).toLocaleDateString('fr-FR')}
                              </span>
                              {shipment.weight && (
                                <span className="flex items-center">
                                  <Weight className="w-4 h-4 mr-1" />
                                  {shipment.weight} kg
                                </span>
                              )}
                              {shipment.price && (
                                <span className="font-medium text-orange-600">
                                  {shipment.price.toLocaleString()} FCFA
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status="pending" />
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="bg-orange-100 p-2 rounded-lg mt-1">
                              <MapPin className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">À récupérer chez</p>
                              <p className="text-lg font-semibold text-gray-900 mt-1">{shipment.sender_name}</p>
                              <p className="text-gray-600">{shipment.pickup_address}</p>
                              {shipment.sender_phone && (
                                <p className="text-sm text-gray-500 flex items-center mt-1">
                                  <User className="w-3 h-3 mr-1" />
                                  {shipment.sender_phone}
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
                              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">À livrer à</p>
                              <p className="text-lg font-semibold text-gray-900 mt-1">{shipment.recipient_name}</p>
                              <p className="text-gray-600">{shipment.delivery_address}</p>
                              {shipment.recipient_phone && (
                                <p className="text-sm text-gray-500 flex items-center mt-1">
                                  <User className="w-3 h-3 mr-1" />
                                  {shipment.recipient_phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {shipment.description && (
                        <div className="mb-6">
                          <p className="text-sm text-gray-500 mb-2">Description du colis</p>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{shipment.description}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-end pt-6 border-t border-gray-100">
                        <button
                          onClick={() => handleAcceptDelivery(shipment.id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-medium flex items-center space-x-2 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                          <span>Effectuer cette livraison</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-orange-100">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Historique des livraisons</h3>
              <p className="text-gray-500">Cette section affichera l'historique de vos livraisons terminées</p>
            </div>
          </div>
        )}

        {/* Tracking Modal */}
        {trackingDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Navigation className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Démarrage du suivi GPS</h3>
                <p className="text-gray-600 mb-6">Initialisation de la géolocalisation en cours...</p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setTrackingDelivery(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => setTrackingDelivery(null)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
                  >
                    Continuer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Floating Action Button for Quick Actions */}
        <div className="fixed bottom-6 right-6">
          <button className="bg-orange-500 hover:bg-orange-600 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
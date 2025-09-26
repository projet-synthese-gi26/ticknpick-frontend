'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, Star, User, Phone, MapPin, Award, Package, Eye, X, Loader2, MessageCircle, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NavbarHome from '@/components/NavbarHome';

// --- TYPE FINAL REPRÉSENTANT UNE LIGNE DE NOTRE VUE SQL ---
interface MarketplaceService {
  id: string;
  tagline: string | null;
  bio: string | null;
  card_photo_url: string | null;
  rating: number;
  years_of_experience: number;
  special_services: string[];
  operating_zones: string[];
  specific_attributes?: any;
  
  // Champs de profil unifiés par la vue
  manager_name: string;
  phone_number: string;
  account_type: 'LIVREUR' | 'AGENCY' | 'FREELANCE';
  email: string;
  home_address: string;

  // Champs spécifiques livreurs (peuvent être null)
  vehicle_type?: string | null;
  vehicle_brand?: string | null;
  vehicle_registration?: string | null;
  vehicle_color?: string | null;
  trunk_dimensions?: string | null;

  // Champs spécifiques pros (peuvent être null)
  relay_point_name?: string | null;
  relay_point_address?: string | null;
}

export default function MarketplacePage() {
  const [serviceCards, setServiceCards] = useState<MarketplaceService[]>([]);
  const [filteredCards, setFilteredCards] = useState<MarketplaceService[]>([]);
  const [selectedCard, setSelectedCard] = useState<MarketplaceService | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    accountType: '',
    minRating: 0,
    zone: '',
    service: ''
  });

  // --- VERSION CORRIGÉE QUI AFFICHE TOUS LES PROFILS ---
  useEffect(() => {
    const fetchMarketplaceData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Étape 1 : Récupérer TOUS les profils (Livreurs + Pros)
        const [
          { data: livreurProfiles, error: livreurError },
          { data: proProfiles, error: proError }
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('account_type', 'LIVREUR'),
          supabase.from('profiles_pro').select('*').in('account_type', ['FREELANCE', 'AGENCY'])
        ]);

        if (livreurError) throw livreurError;
        if (proError) throw proError;
        
        const allProfiles = [...(livreurProfiles || []), ...(proProfiles || [])];

        // Étape 2 : Récupérer TOUTES les cartes de service et les stocker dans une Map
        const { data: cardsData, error: cardsError } = await supabase
          .from('service_cards')
          .select('*');
        if (cardsError) throw cardsError;

        const serviceCardsMap = new Map(cardsData.map(card => [card.id, card]));

        // Étape 3 : Combiner les profils avec les cartes de service (existantes ou par défaut)
        const combinedData: MarketplaceService[] = allProfiles.map(profile => {
          const existingCard = serviceCardsMap.get(profile.id);

          // Si une carte de service existe pour ce profil, on la fusionne
          if (existingCard) {
            return {
              ...existingCard, // Données de la carte
              manager_name: profile.manager_name,
              phone_number: profile.phone_number,
              account_type: profile.account_type,
              email: profile.email,
              home_address: profile.home_address,
              // Champs spécifiques
              vehicle_type: profile.vehicle_type,
              vehicle_brand: profile.vehicle_brand,
              relay_point_name: profile.relay_point_name
              // Ajoutez d'autres champs de profil si nécessaire
            };
          } 
          // Sinon, on crée une carte "virtuelle" avec des valeurs par défaut
          else {
            return {
              id: profile.id,
              tagline: `Service de ${profile.account_type.toLowerCase()}`, // Slogan par défaut
              bio: `Profil en attente de complétion. Contactez pour plus d'informations.`, // Bio par défaut
              card_photo_url: null,
              rating: 4.0, // Note par défaut pour les nouveaux
              years_of_experience: 0,
              special_services: [],
              operating_zones: [],
              specific_attributes: {},
              
              // Données du profil
              manager_name: profile.manager_name,
              phone_number: profile.phone_number,
              account_type: profile.account_type,
              email: profile.email,
              home_address: profile.home_address,
              
              // Champs spécifiques
              vehicle_type: profile.vehicle_type,
              vehicle_brand: profile.vehicle_brand,
              relay_point_name: profile.relay_point_name
            };
          }
        });

        setServiceCards(combinedData);
        setFilteredCards(combinedData);

      } catch (err: any) {
        setError('Erreur lors du chargement des services. Vérifiez votre connexion et les noms des tables.');
        console.error('Erreur Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketplaceData();
  }, []); // Le tableau vide [] assure que la fonction s'exécute une seule fois au chargement.

  useEffect(() => {
    let filtered = serviceCards.filter(card => {
      const matchesSearch =
        card.manager_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (card.tagline && card.tagline.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (card.bio && card.bio.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesAccountType = !filters.accountType || card.account_type === filters.accountType;
      const matchesRating = card.rating >= filters.minRating;
      const matchesZone = !filters.zone || (card.operating_zones && card.operating_zones.some(zone => zone.toLowerCase().includes(filters.zone.toLowerCase())));
      const matchesService = !filters.service || (card.special_services && card.special_services.some(service => service.toLowerCase().includes(filters.service.toLowerCase())));
      
      return matchesSearch && matchesAccountType && matchesRating && matchesZone && matchesService;
    });
    
    setFilteredCards(filtered);
  }, [searchTerm, filters, serviceCards]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < Math.round(rating) ? 'text-orange-500 fill-orange-500' : 'text-gray-300'}`} />
    ));
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'LIVREUR': return 'bg-orange-100 text-orange-700';
      case 'AGENCY': return 'bg-blue-100 text-blue-700';
      case 'FREELANCE': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'LIVREUR': return 'Livreur';
      case 'AGENCY': return 'Agence';
      case 'FREELANCE': return 'Freelance';
      default: return type;
    }
  };

  const clearFilters = () => {
    setFilters({ accountType: '', minRating: 0, zone: '', service: '' });
    setSearchTerm('');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Chargement de la Marketplace...</h2>
          <p className="text-gray-600">Nous rassemblons les meilleurs services pour vous.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Overlay pour mobile */}
      {selectedCard && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSelectedCard(null)}
        />
      )}

      {/* Container principal avec transition */}
      <div className={`min-h-screen transition-all duration-300 ${selectedCard ? 'lg:mr-96' : ''}`}>
        <NavbarHome />
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-8 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Marketplace des services de livraison</h1>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{filteredCards.length} service(s) disponible(s)</p>
                </div>
              </div>
              
              {/* Barre de recherche */}
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, service ou description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200"
                >
                  <Filter className="w-5 h-5" />
                  Filtres
                </button>
              </div>
              
              {/* Filtres */}
              {showFilters && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select
                      value={filters.accountType}
                      onChange={(e) => setFilters(prev => ({ ...prev, accountType: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Type de compte</option>
                      <option value="LIVREUR">Livreur</option>
                      <option value="AGENCY">Agence</option>
                      <option value="FREELANCE">Freelance</option>
                    </select>
                    
                    <select
                      value={filters.minRating}
                      onChange={(e) => setFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value={0}>Note minimum</option>
                      <option value={4}>4+ étoiles</option>
                      <option value={4.5}>4.5+ étoiles</option>
                      <option value={4.8}>4.8+ étoiles</option>
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Zone d'opération"
                      value={filters.zone}
                      onChange={(e) => setFilters(prev => ({ ...prev, zone: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                    
                    <input
                      type="text"
                      placeholder="Service spécial"
                      value={filters.service}
                      onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="text-orange-600 hover:text-orange-700 px-4 py-2 text-sm font-medium"
                    >
                      Effacer les filtres
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1"
              >
                {/* Photo/Avatar */}
                <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center relative">
                  {card.card_photo_url ? (
                    <img
                      src={card.card_photo_url}
                      alt={card.manager_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-white" />
                    </div>
                  )}
                  <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(card.account_type)}`}>
                    {getAccountTypeLabel(card.account_type)}
                  </div>
                </div>

                {/* Contenu de la carte */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
                      {card.manager_name}
                    </h3>
                    <div className="flex items-center gap-1">
                      {renderStars(card.rating)}
                      <span className="ml-1 text-sm font-medium text-gray-700">
                        {card.rating}
                      </span>
                    </div>
                  </div>

                  {card.tagline && (
                    <p className="text-orange-600 font-medium text-sm mb-2 line-clamp-1">
                      {card.tagline}
                    </p>
                  )}

                  {card.bio && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {card.bio}
                    </p>
                  )}

                  {/* Expérience */}
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-700">
                      {card.years_of_experience} ans d'expérience
                    </span>
                  </div>

                  {/* Services spéciaux */}
                  {card.special_services && card.special_services.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {card.special_services.slice(0, 2).map((service, index) => (
                        <span
                          key={index}
                          className="inline-block bg-orange-50 text-orange-700 px-2 py-1 rounded-md text-xs font-medium"
                        >
                          {service}
                        </span>
                      ))}
                      {card.special_services.length > 2 && (
                        <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs">
                          +{card.special_services.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Informations spécifiques selon le type */}
                  {card.account_type === 'LIVREUR' && card.vehicle_type && (
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-700">
                        {card.vehicle_type}
                        {card.vehicle_brand && ` - ${card.vehicle_brand}`}
                      </span>
                    </div>
                  )}

                  {(card.account_type === 'AGENCY' || card.account_type === 'FREELANCE') && card.relay_point_name && (
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-700">
                        {card.relay_point_name}
                      </span>
                    </div>
                  )}

                  {/* Bouton voir plus */}
                  <button
                    onClick={() => setSelectedCard(card)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    Voir plus
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredCards.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun service trouvé</h3>
              <p className="text-gray-500 mb-4">Essayez de modifier vos critères de recherche</p>
              <button
                onClick={clearFilters}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Effacer les filtres
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Panel de détails - Fixe à droite */}
      {selectedCard && (
        <div className="fixed top-0 right-0 w-full lg:w-96 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 lg:translate-x-0">
          <div className="h-full overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Détails du service</h2>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Photo et nom */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  {selectedCard.card_photo_url ? (
                    <img
                      src={selectedCard.card_photo_url}
                      alt={selectedCard.manager_name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedCard.manager_name}
                </h3>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getAccountTypeColor(selectedCard.account_type)}`}>
                  {getAccountTypeLabel(selectedCard.account_type)}
                </div>
              </div>

              {/* Note et expérience */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    {renderStars(selectedCard.rating)}
                  </div>
                  <p className="text-sm text-gray-600">Note: {selectedCard.rating}/5</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Award className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">{selectedCard.years_of_experience} ans d'exp.</p>
                </div>
              </div>

              {/* Description */}
              {selectedCard.bio && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">À propos</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {selectedCard.bio}
                  </p>
                </div>
              )}

              {/* Services spéciaux */}
              {selectedCard.special_services && selectedCard.special_services.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Services spécialisés</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCard.special_services.map((service, index) => (
                      <span
                        key={index}
                        className="inline-block bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Zones d'opération */}
              {selectedCard.operating_zones && selectedCard.operating_zones.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Zones d'opération</h4>
                  <div className="space-y-2">
                    {selectedCard.operating_zones.map((zone, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-700">{zone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informations spécifiques selon le type */}
              {selectedCard.account_type === 'LIVREUR' && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Informations véhicule</h4>
                  <div className="space-y-3">
                    {selectedCard.vehicle_type && (
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-700">Type: {selectedCard.vehicle_type}</span>
                      </div>
                    )}
                    {selectedCard.vehicle_brand && (
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-700">Marque: {selectedCard.vehicle_brand}</span>
                      </div>
                    )}
                    {selectedCard.vehicle_color && (
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-700">Couleur: {selectedCard.vehicle_color}</span>
                      </div>
                    )}
                    {selectedCard.trunk_dimensions && (
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-700">Dimensions coffre: {selectedCard.trunk_dimensions}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(selectedCard.account_type === 'AGENCY' || selectedCard.account_type === 'FREELANCE') && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Point relais</h4>
                  <div className="space-y-3">
                    {selectedCard.relay_point_name && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-700">Nom: {selectedCard.relay_point_name}</span>
                      </div>
                    )}
                    {selectedCard.relay_point_address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-700">Adresse: {selectedCard.relay_point_address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Informations de contact */}
              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-3">Informations de contact</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-700">{selectedCard.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-700">{selectedCard.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-700">{selectedCard.home_address}</span>
                  </div>
                </div>
              </div>

              {/* Bouton contact */}
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors duration-200">
                <MessageCircle className="w-5 h-5" />
                Contacter ce service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
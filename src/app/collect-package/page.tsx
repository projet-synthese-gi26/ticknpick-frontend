'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Search, Play, Loader2, ArrowLeft, User, Phone, MapPin, Package, Weight, CheckCircle, QrCode, Bike } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Types
interface RelayPoint {
  id: number;
  name: string;
  address: string;
  quartier: string;
  lat: number;
  lng: number;
  hours: string;
  type: 'bureau' | 'commerce' | 'agence';
  agency_id?: string;
}

interface Shipment {
  id: number;
  tracking_number: string;
  status: string;
  sender_name: string;
  sender_phone: string;
  recipient_name: string;
  recipient_phone: string;
  departure_point_id: RelayPoint;
  arrival_point_id: RelayPoint;
  description: string;
  weight: number;
  is_fragile: boolean;
  is_perishable: boolean;
  is_insured: boolean;
  declared_value: number;
  shipping_cost: number;
  is_paid_at_departure: boolean;
  amount_paid: number;
  change_amount: number;
}

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// **ÉTAPE 1: Constantes pour la coordination des animations**
const ANIMATION_DURATIONS = {
  TO_PICKUP: 5000,    // 5 secondes pour aller au point de collecte
  TO_DROPOFF: 8000,   // 8 secondes pour aller au point de livraison
  BUFFER: 1000        // 1 seconde de buffer avant changement d'état
};

const CollectPackageApp = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const driverMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [tripStatus, setTripStatus] = useState<'listing' | 'selected' | 'to_pickup' | 'pickup_ready' | 'to_dropoff' | 'finished'>('listing');
  const [driverLocation, setDriverLocation] = useState({ lat: 3.8667, lng: 11.5213 });
  const [pickupCode, setPickupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driverPath, setDriverPath] = useState<Array<{lat: number, lng: number}>>([]);
  
  // **ÉTAPE 2: État pour gérer les animations de manière coordonnée**
  const [animationState, setAnimationState] = useState<{
    isAnimating: boolean;
    progress: number;
    startTime: number | null;
    duration: number;
  }>({
    isAnimating: false,
    progress: 0,
    startTime: null,
    duration: 0
  });

  // Filtrer les colis pour la recherche
  const filteredShipments = useMemo(() => 
    shipments.filter(s => 
      s.tracking_number?.toLowerCase().includes(searchInput.toLowerCase()) ||
      s.recipient_name?.toLowerCase().includes(searchInput.toLowerCase()) ||
      s.sender_name?.toLowerCase().includes(searchInput.toLowerCase())
    ), [shipments, searchInput]);

  // Grouper par point relais
  const groupedByRelayPoint = useMemo(() => 
    shipments.reduce((acc, shipment) => {
      const key = shipment.departure_point_id?.id;
      if (key) {
        if (!acc[key]) acc[key] = [];
        acc[key].push(shipment);
      }
      return acc;
    }, {} as Record<number, Shipment[]>), [shipments]);

  // Récupération des données initiales
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Récupérer les colis avec les points de relais associés
        const { data: shipmentsData, error: shipmentsError } = await supabase
          .from('shipments')
          .select(`
            *,
            departure_point_id:relay_points!departure_point_id(*),
            arrival_point_id:relay_points!arrival_point_id(*)
          `)
          .eq('status', 'EN_ATTENTE_DE_DEPOT');
          
        if (shipmentsError) {
          console.error('Erreur shipments:', shipmentsError);
          throw new Error('Erreur lors du chargement des colis');
        }

        // Récupérer tous les points de relais
        const { data: relayPointsData, error: relayPointsError } = await supabase
          .from('relay_points')
          .select('*');

        if (relayPointsError) {
          console.error('Erreur relay points:', relayPointsError);
          throw new Error('Erreur lors du chargement des points de relais');
        }

        console.log('Données chargées:', { shipments: shipmentsData, relayPoints: relayPointsData });
        
        setShipments(shipmentsData || []);
        setRelayPoints(relayPointsData || []);

      } catch (err: any) {
        console.error('Erreur lors du chargement:', err);
        setError(err.message || "Erreur de chargement des données. Veuillez réessayer.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Initialiser la carte
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    
    try {
      mapRef.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=Lr72DkH8TYyjpP7RNZS9',
        center: [11.5213, 3.8667],
        zoom: 12
      });

      mapRef.current.on('load', () => {
        console.log('Carte initialisée avec succès');
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Fonction pour obtenir un itinéraire
  const fetchRoute = async (origin: {lat: number, lng: number}, destination: {lat: number, lng: number}) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        return data.routes[0].geometry.coordinates;
      }
    } catch (error) {
      console.warn('Erreur lors du calcul de l\'itinéraire:', error);
    }
    return [[origin.lng, origin.lat], [destination.lng, destination.lat]];
  };

  // **ÉTAPE 3: Animation coordonnée et stabilisée**
  const animateDriverMovement = async (
    targetLocation: {lat: number, lng: number}, 
    duration: number,
    onComplete?: () => void
  ) => {
    if (!driverLocation || !targetLocation) {
      onComplete?.();
      return;
    }

    console.log(`Début animation vers ${targetLocation.lat}, ${targetLocation.lng} pendant ${duration}ms`);

    const route = await fetchRoute(driverLocation, targetLocation);
    if (!route || route.length < 2) {
      onComplete?.();
      return;
    }

    const steps = Math.max(route.length, 20); // Minimum 20 étapes pour une animation fluide
    const stepDuration = duration / steps;
    let currentStep = 0;

    // Mettre à jour l'état d'animation
    setAnimationState({
      isAnimating: true,
      progress: 0,
      startTime: Date.now(),
      duration
    });

    const interval = setInterval(() => {
      if (currentStep >= route.length) {
        clearInterval(interval);
        
        // Finaliser l'animation
        setAnimationState(prev => ({
          ...prev,
          isAnimating: false,
          progress: 100
        }));

        console.log('Animation terminée');
        onComplete?.();
        return;
      }

      const [lng, lat] = route[currentStep];
      const newLocation = { lat, lng };
      
      setDriverLocation(newLocation);
      setDriverPath(prev => [...prev, newLocation]);
      
      // Mettre à jour le progrès
      const progress = (currentStep / route.length) * 100;
      setAnimationState(prev => ({
        ...prev,
        progress
      }));

      currentStep++;
    }, stepDuration);
  };

  // Mettre à jour la carte (version stabilisée)
  useEffect(() => {
    const updateMap = () => {
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;

      // Nettoyer les couches existantes
      ['route', 'driver-path'].forEach(layerId => {
        try {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
          if (map.getSource(layerId)) {
            map.removeSource(layerId);
          }
        } catch (e) {
          console.warn('Erreur lors de la suppression de la couche:', e);
        }
      });

      // Ajouter les marqueurs des points relais
      relayPoints.forEach(point => {
        if (!point.lat || !point.lng) return;
        
        const count = groupedByRelayPoint[point.id]?.length || 0;
        const el = document.createElement('div');
        el.className = 'relative flex flex-col items-center';
        el.innerHTML = `
          <div class="w-6 h-6 bg-orange-500 rounded-full border-2 border-white shadow-lg"></div>
          ${count > 0 ? `<div class="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">${count}</div>` : ''}
          <span class="text-xs mt-1 bg-white px-2 py-0.5 rounded shadow-sm max-w-20 truncate">${point.name}</span>
        `;
        
        try {
          new maplibregl.Marker(el)
            .setLngLat([point.lng, point.lat])
            .addTo(map);
        } catch (error) {
          console.warn('Erreur lors de l\'ajout du marqueur:', error);
        }
      });

      // Fonction pour dessiner la route
      const drawRoute = async () => {
        if (!selectedShipment) return;

        let start: {lat: number, lng: number}, end: {lat: number, lng: number};
        
        if (tripStatus === 'to_pickup' && selectedShipment.departure_point_id) {
          start = driverLocation;
          end = selectedShipment.departure_point_id;
        } else if (tripStatus === 'to_dropoff' && selectedShipment.arrival_point_id) {
          start = driverLocation;
          end = selectedShipment.arrival_point_id;
        } else if (selectedShipment.departure_point_id && selectedShipment.arrival_point_id) {
          start = selectedShipment.departure_point_id;
          end = selectedShipment.arrival_point_id;
        } else {
          return;
        }

        if (!start || !end) return;

        try {
          const coordinates = await fetchRoute(start, end);
          
          map.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates }
            }
          });

          map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#f97316', 'line-width': 4, 'line-opacity': 0.8 }
          });

          const bounds = new maplibregl.LngLatBounds();
          coordinates.forEach((coord: any) => bounds.extend(coord));
          map.fitBounds(bounds, { padding: 50 });
        } catch (error) {
          console.warn('Erreur lors du tracé de l\'itinéraire:', error);
        }
      };

      // Dessiner l'itinéraire si un colis est sélectionné
      if (selectedShipment && (tripStatus === 'selected' || tripStatus === 'to_pickup' || tripStatus === 'to_dropoff')) {
        drawRoute();
      }

      // Dessiner le chemin parcouru
      if (driverPath.length > 1) {
        try {
          map.addSource('driver-path', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: driverPath.map(p => [p.lng, p.lat]) }
            }
          });

          map.addLayer({
            id: 'driver-path',
            type: 'line',
            source: 'driver-path',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#10b981', 'line-width': 3, 'line-opacity': 0.9 }
          });
        } catch (error) {
          console.warn('Erreur lors de l\'ajout du chemin:', error);
        }
      }
    };

    const map = mapRef.current;
    if (!map) return;

    if (!map.isStyleLoaded()) {
      map.on('load', updateMap);
    } else {
      updateMap();
    }

    // Cleanup
    return () => {
      if (map && map.isStyleLoaded()) {
        map.off('load', updateMap);
      }
    };
  }, [relayPoints, groupedByRelayPoint, selectedShipment, tripStatus, driverLocation, driverPath]);

  // **ÉTAPE 4: Marqueur du livreur avec icône de bicyclette**
  useEffect(() => {
    if (!mapRef.current) return;

    try {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLngLat([driverLocation.lng, driverLocation.lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'flex flex-col items-center';
        
        // **MODIFICATION: Icône de bicyclette au lieu du camion**
        el.innerHTML = `
          <div class="w-10 h-10 bg-blue-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center ${animationState.isAnimating ? 'animate-pulse' : ''}">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 18c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-3c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zM19 18c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-3c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zM7.82 16h8.36c-.2-.6-.78-1-1.44-1H9.26c-.66 0-1.24.4-1.44 1zm6.28-6h2.4c.22 0 .4-.18.4-.4 0-.22-.18-.4-.4-.4h-2.4c-.22 0-.4.18-.4.4 0 .22.18.4.4.4zm-1.6-1.5L11 7l-1.5 1.5L11 10l1.5-1.5z"/>
              <path d="M12 2c-.55 0-1 .45-1 1v2.17c0 .39.24.74.6.88L13 7l-1.4.95c-.36.14-.6.49-.6.88V11c0 .55.45 1 1 1s1-.45 1-1V8.83L14.4 8.5c.36-.14.6-.49.6-.88V5.17c0-.39-.24-.74-.6-.88L13 3V3c0-.55-.45-1-1-1z"/>
            </svg>
          </div>
          <span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full shadow-sm mt-1 font-medium">
            ${animationState.isAnimating ? `${Math.round(animationState.progress)}%` : 'Livreur'}
          </span>
        `;
        
        driverMarkerRef.current = new maplibregl.Marker(el)
          .setLngLat([driverLocation.lng, driverLocation.lat])
          .addTo(mapRef.current);
      }
    } catch (error) {
      console.warn('Erreur lors de la mise à jour du marqueur livreur:', error);
    }
  }, [driverLocation, animationState]);

  // Gérer la sélection d'un colis
  const handleSelectShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setTripStatus('selected');
    setError(null);
  };

  // **ÉTAPE 5: Commencer la course avec animation coordonnée**
  const handleStartTrip = () => {
    if (!selectedShipment) return;
    
    setTripStatus('to_pickup');
    setDriverPath([driverLocation]);
    
    // Animation coordonnée vers le point de collecte
    animateDriverMovement(
      selectedShipment.departure_point_id, 
      ANIMATION_DURATIONS.TO_PICKUP,
      () => {
        // Callback exécuté à la fin de l'animation
        setTimeout(() => {
          setTripStatus('pickup_ready');
        }, ANIMATION_DURATIONS.BUFFER);
      }
    );
  };

  // **ÉTAPE 6: Récupérer le colis avec transition fluide**
  const handleCollectPackage = async () => {
    if (!selectedShipment) return;

    // Validation du code
    if (pickupCode.toUpperCase() !== selectedShipment.tracking_number.toUpperCase()) {
      setError('Code incorrect. Le code doit correspondre au numéro de suivi du colis.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`Colis récupéré: ${selectedShipment.tracking_number}`);

      setTripStatus('to_dropoff');
      setPickupCode('');
      
      // Animation coordonnée vers le point de livraison
      animateDriverMovement(
        selectedShipment.arrival_point_id, 
        ANIMATION_DURATIONS.TO_DROPOFF,
        () => {
          // Callback exécuté à la fin de l'animation
          setTimeout(() => {
            setTripStatus('finished');
          }, ANIMATION_DURATIONS.BUFFER);
        }
      );

    } catch (err: any) {
      console.error("Erreur dans handleCollectPackage:", err);
      setError("Une erreur inattendue est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  // Générer le PDF
  const generatePDF = async (shipment: Shipment) => {
    try {
      const pdf = new jsPDF();
      const qrDataURL = await QRCode.toDataURL(shipment.tracking_number, { width: 50 });
      
      pdf.setFontSize(18);
      pdf.text('Bordereau de Livraison', 20, 20);
      pdf.addImage(qrDataURL, 'PNG', 150, 10, 50, 50);
      
      pdf.setFontSize(12);
      pdf.text(`N° de suivi: ${shipment.tracking_number}`, 20, 40);
      pdf.text(`Expéditeur: ${shipment.sender_name}`, 20, 50);
      pdf.text(`Tel: ${shipment.sender_phone}`, 20, 60);
      pdf.text(`Destinataire: ${shipment.recipient_name}`, 20, 70);
      pdf.text(`Tel: ${shipment.recipient_phone}`, 20, 80);
      pdf.text(`Départ: ${shipment.departure_point_id.name}`, 20, 90);
      pdf.text(`Arrivée: ${shipment.arrival_point_id.name}`, 20, 100);
      pdf.text(`Description: ${shipment.description || 'N/A'}`, 20, 110);
      pdf.text(`Poids: ${shipment.weight || 0} kg`, 20, 120);
      
      // Espaces de signature
      pdf.setFontSize(10);
      pdf.text('Signature Livreur:', 20, 200);
      pdf.rect(20, 205, 80, 30);
      pdf.text('Signature Destinataire:', 120, 200);
      pdf.rect(120, 205, 80, 30);
      
      pdf.save(`Bordereau_${shipment.tracking_number}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw new Error('Erreur lors de la génération du bordereau');
    }
  };

  // Terminer la course
  const handleFinishTrip = async () => {
    if (!selectedShipment) return;
    setIsLoading(true);
    try {
      await generatePDF(selectedShipment);
      
      setTimeout(() => {
        setSelectedShipment(null);
        setTripStatus('listing');
        setDriverPath([]);
        setError(null);
        setAnimationState({
          isAnimating: false,
          progress: 0,
          startTime: null,
          duration: 0
        });
        
        // Recharger les données
        window.location.reload();
      }, 3000);
    } catch (err: any) {
      console.error('Erreur lors de la finalisation:', err);
      setError(err.message || 'Erreur lors de la finalisation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedShipment(null);
    setTripStatus('listing');
    setPickupCode('');
    setError(null);
    setDriverPath([]);
    setAnimationState({
      isAnimating: false,
      progress: 0,
      startTime: null,
      duration: 0
    });
  };

  // Composant InfoRow
  const InfoRow = ({ icon: Icon, label, value, detail }: {
    icon: React.ComponentType<any>;
    label: string;
    value: string;
    detail?: string;
  }) => (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <Icon className="w-5 h-5 text-orange-500 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-900 break-words">{value}</p>
        {detail && <p className="text-xs text-gray-600 break-words">{detail}</p>}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-96 bg-white shadow-xl border-r border-gray-200 flex flex-col">
        {tripStatus === 'listing' ? (
          <>
            <div className="p-4 border-b bg-white">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Colis à collecter ({filteredShipments.length})</h2>
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher un colis..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : filteredShipments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Aucun colis à collecter</p>
                  {error && <p className="text-sm mt-2">Vérifiez votre connexion à la base de données</p>}
                </div>
              ) : (
                filteredShipments.map(shipment => (
                  <motion.div
                    key={shipment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleSelectShipment(shipment)}
                    className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">{shipment.tracking_number}</span>
                      <Package className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Pour: {shipment.recipient_name}</p>
                    <p className="text-sm text-orange-600 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {shipment.departure_point_id?.name || 'Point non défini'}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </>
        ) : selectedShipment && (
          <div className="p-4 flex flex-col h-full">
            <button
              onClick={handleBackToList}
              className="flex items-center text-orange-600 font-medium mb-4 hover:text-orange-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Retour à la liste
            </button>
            
            <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedShipment.tracking_number}</h2>
            
            {/* **NOUVELLE: Barre de progression** */}
            {animationState.isAnimating && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Trajet en cours</span>
                  <span className="text-sm text-blue-600">{Math.round(animationState.progress)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${animationState.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto space-y-3">
              <InfoRow icon={User} label="Expéditeur" value={selectedShipment.sender_name} detail={selectedShipment.sender_phone} />
              <InfoRow icon={User} label="Destinataire" value={selectedShipment.recipient_name} detail={selectedShipment.recipient_phone} />
              <InfoRow icon={MapPin} label="Point de départ" value={selectedShipment.departure_point_id?.name || 'Non défini'} />
              <InfoRow icon={MapPin} label="Point d'arrivée" value={selectedShipment.arrival_point_id?.name || 'Non défini'} />
              <InfoRow icon={Package} label="Description" value={selectedShipment.description || 'Aucune description'} />
              <InfoRow icon={Weight} label="Poids" value={`${selectedShipment.weight || 0} kg`} />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            
            <div className="pt-4 border-t">
              <AnimatePresence mode="wait">
                {tripStatus === 'selected' && (
                  <motion.button
                    key="start"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    onClick={handleStartTrip}
                    disabled={animationState.isAnimating}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Commencer la course
                  </motion.button>
                )}
                
                {tripStatus === 'to_pickup' && (
                  <motion.div
                    key="to-pickup"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center p-4 bg-blue-50 rounded-lg"
                  >
                    <Bike className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-bounce" />
                    <p className="text-sm font-medium text-blue-700">En route vers le point de collecte...</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Temps estimé: {Math.ceil((ANIMATION_DURATIONS.TO_PICKUP - (Date.now() - (animationState.startTime || 0))) / 1000)}s
                    </p>
                  </motion.div>
                )}
                
                {tripStatus === 'pickup_ready' && (
                  <motion.div
                    key="pickup"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-700">Arrivé au point de collecte !</p>
                    </div>
                    <div className="relative">
                      <QrCode className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Code du colis ou scanner QR"
                        value={pickupCode}
                        onChange={e => setPickupCode(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <button
                      onClick={handleCollectPackage}
                      disabled={isLoading || !pickupCode || animationState.isAnimating}
                      className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5 mr-2" />
                      )}
                      Récupérer le colis
                    </button>
                  </motion.div>
                )}
                
                {tripStatus === 'to_dropoff' && (
                  <motion.div
                    key="to-dropoff"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center p-4 bg-blue-50 rounded-lg"
                  >
                    <Bike className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-bounce" />
                    <p className="text-sm font-medium text-blue-700">Colis récupéré ! En route vers la destination...</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Temps estimé: {Math.ceil((ANIMATION_DURATIONS.TO_DROPOFF - (Date.now() - (animationState.startTime || 0))) / 1000)}s
                    </p>
                  </motion.div>
                )}
                
                {tripStatus === 'finished' && (
                  <motion.div
                    key="finished"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <h3 className="font-bold text-green-800">Livraison terminée !</h3>
                      <p className="text-sm text-green-700">Le bordereau a été généré</p>
                    </div>
                    <button
                      onClick={handleFinishTrip}
                      disabled={isLoading}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5 mr-2" />
                      )}
                      Confirmer la livraison
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Carte */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="h-full w-full" />
        
        {/* **NOUVELLE: Informations de débogage (optionnel, à retirer en production)** */}
        {process.env.NODE_ENV === 'development' && animationState.isAnimating && (
          <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg text-xs">
            <p><strong>Animation:</strong> {animationState.isAnimating ? 'En cours' : 'Arrêtée'}</p>
            <p><strong>Progrès:</strong> {Math.round(animationState.progress)}%</p>
            <p><strong>Durée:</strong> {animationState.duration}ms</p>
            <p><strong>Position:</strong> {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectPackageApp;
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Undo2, 
  Target, 
  CheckCircle, 
  Search,
  X,
  Menu,
  Navigation
} from 'lucide-react';
import dynamic from 'next/dynamic';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '@/lib/supabase';
// IMPORT DU SERVICE (au lieu de supabase directement, pour respecter l'architecture)
import { relayPointService, RelayPoint } from '@/services/relayPointService';

// Réutiliser vos données de points relais
import yaoundePointsRelais, { PointRelais, YAOUNDE_CENTER } from '../emit-package/RelaisData';

const MapComponent = dynamic(() => import('../emit-package/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
        <p className="text-sm text-gray-600">Chargement de la carte...</p>
      </div>
    </div>
  ),
});

interface RouteData {
  // Modification : Les IDs sont maintenant des string (UUID)
  departurePointId: string | null;
  arrivalPointId: string | null;
  departurePointName: string;
  arrivalPointName: string;
  distanceKm: number;
}

interface RouteSelectionStepProps {
  onContinue: (data: RouteData, travelPrice: number) => void;
  onBack: () => void;
}

// Calcul du prix du trajet
const calculateTravelPrice = (distance: number) => {
  if (distance <= 0) return 0;
  const baseFee = 500; // 500 FCFA
  const pricePerKm = 80; // 80 FCFA par km
  return Math.round(baseFee + distance * pricePerKm);
};

// Fonction de calcul de distance (Haversine)
const haversineDistance = ([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]): number => {
  const toRad = (x: number) => x * Math.PI / 180;
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function RouteSelectionStep({ onContinue, onBack }: RouteSelectionStepProps) {
  const [selectionMode, setSelectionMode] = useState<'origin' | 'destination'>('origin');
    const [allRelayPoints, setAllRelayPoints] = useState<RelayPoint[]>([]);
  const [filteredPoints, setFilteredPoints] = useState<RelayPoint[]>([]);
  const [routeData, setRouteData] = useState<RouteData>({
    departurePointId: null,
    arrivalPointId: null,
    departurePointName: '',
    arrivalPointName: '',
    distanceKm: 0
  });
  const [travelPrice, setTravelPrice] = useState(0);
  const [isLoadingPoints, setIsLoadingPoints] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mapRef, setMapRef] = useState<any>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  
  // Ajout d'un flag pour éviter les re-renders multiples
  const [isInitialized, setIsInitialized] = useState(false);

  // YAOUNDE par défaut (si pas de données)
  const DEFAULT_CENTER: [number, number] = [3.8480, 11.5021];

  // --- CHARGEMENT DES DONNÉES RÉELLES VIA L'API ---
  useEffect(() => {
    const fetchPoints = async () => {
      setIsLoadingPoints(true);
      try {
        // Appel au backend pour récupérer les vrais UUIDs
        const points = await relayPointService.getAllRelayPoints();
        setAllRelayPoints(points);
        setFilteredPoints(points);
      } catch (error) {
        console.error("Impossible de charger les points relais:", error);
        // Gestion d'erreur basique : liste vide
      } finally {
        setIsLoadingPoints(false);
      }
    };

    fetchPoints();
  }, []);


  // --- FILTRAGE DE LA LISTE ---
  useEffect(() => {
    if (!searchQuery) {
      setFilteredPoints(allRelayPoints);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = allRelayPoints.filter(p => 
        p.relayPointName.toLowerCase().includes(lowerQuery) ||
        p.relay_point_address.toLowerCase().includes(lowerQuery)
      );
      setFilteredPoints(filtered);
    }
  }, [searchQuery, allRelayPoints]);

  // --- GESTION CARTE & MARQUEURS ---
  useEffect(() => {
    if (!mapRef || !isInitialized) return;

    // Nettoyage
    try {
      if (mapRef.getLayer('points-relais')) mapRef.removeLayer('points-relais');
      if (mapRef.getLayer('points-relais-labels')) mapRef.removeLayer('points-relais-labels');
      if (mapRef.getSource('points-relais')) mapRef.removeSource('points-relais');
    } catch (e) { console.warn('Nettoyage carte', e); }

    // Création GeoJSON avec les vraies données
    const features = allRelayPoints.map(point => {
      // Utilisation des props définies dans RelayPoint (voir le service)
      // latitude/longitude au lieu de lat/lng selon votre définition
      return {
        type: 'Feature',
        properties: {
          id: point.id, // UUID
          name: point.relayPointName,
          status: getPointStatus(point.id)
        },
        geometry: {
          type: 'Point',
          coordinates: [point.longitude, point.latitude]
        }
      };
    });

    try {
      mapRef.addSource('points-relais', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features }
      });

      mapRef.addLayer({
        id: 'points-relais',
        type: 'circle',
        source: 'points-relais',
        paint: {
          'circle-radius': [
            'case',
            ['==', ['get', 'status'], 'origin'], 10,
            ['==', ['get', 'status'], 'destination'], 10,
            6
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'status'], 'origin'], '#f97316',
            ['==', ['get', 'status'], 'destination'], '#10b981',
            '#6b7280'
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Interaction
      const handlePointClick = (e: any) => {
        const features = mapRef.queryRenderedFeatures(e.point, { layers: ['points-relais'] });
        if (features.length > 0) {
            const pointId = features[0].properties.id; // UUID
            const point = allRelayPoints.find(p => p.id === pointId);
            if (point) handlePointSelect(point);
        }
      };

      mapRef.on('click', 'points-relais', handlePointClick);
      mapRef.on('mouseenter', 'points-relais', () => mapRef.getCanvas().style.cursor = 'pointer');
      mapRef.on('mouseleave', 'points-relais', () => mapRef.getCanvas().style.cursor = '');

    } catch (error) {
      console.error('Erreur carte:', error);
    }
  }, [mapRef, isInitialized, allRelayPoints, routeData.departurePointId, routeData.arrivalPointId]);

  // --- GESTION ITINÉRAIRE (inchangée dans la logique mais adaptée aux types) ---
  useEffect(() => {
     if (!mapRef || !routeData.departurePointId || !routeData.arrivalPointId) {
        // Nettoyage route si incomplète
        try {
            if (mapRef.getLayer('route')) mapRef.removeLayer('route');
            if (mapRef.getSource('route')) mapRef.removeSource('route');
        } catch (e) {}
        return;
     }

     const origin = allRelayPoints.find(p => p.id === routeData.departurePointId);
     const dest = allRelayPoints.find(p => p.id === routeData.arrivalPointId);

     if (origin && dest) {
         drawStraightLine(origin, dest); // Utilisation de ligne droite pour simplification
         // Optionnel : appeler OSRM ici si besoin d'itinéraire réel
     }
  }, [mapRef, routeData.departurePointId, routeData.arrivalPointId]);

  // Trace une ligne pointillée simple
  const drawStraightLine = (origin: RelayPoint, destination: RelayPoint) => {
     try {
        if (mapRef.getLayer('route')) mapRef.removeLayer('route');
        if (mapRef.getSource('route')) mapRef.removeSource('route');

        mapRef.addSource('route', {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [origin.longitude, origin.latitude],
                        [destination.longitude, destination.latitude]
                    ]
                }
            }
        });

        mapRef.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
                'line-color': '#10b981',
                'line-width': 4,
                'line-opacity': 0.6,
                'line-dasharray': [2, 4]
            }
        });
        
        // Ajuster la vue
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([origin.longitude, origin.latitude]);
        bounds.extend([destination.longitude, destination.latitude]);
        mapRef.fitBounds(bounds, { padding: 50 });

     } catch (e) { console.error("Erreur tracé route", e); }
  };
  const fetchRoute = async (origin: PointRelais, destination: PointRelais) => {
    try {
      // Exemple avec OSRM (service de routing open source)
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Supprimer l'ancienne route
        try {
          if (mapRef.getLayer('route')) {
            mapRef.removeLayer('route');
          }
          if (mapRef.getSource('route')) {
            mapRef.removeSource('route');
          }

          // Ajouter la nouvelle route
          mapRef.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route.geometry
            }
          });

          mapRef.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#10b981',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });

          // Ajuster la vue pour inclure toute la route
          const coordinates = route.geometry.coordinates;
          // Créer les bounds manuellement au lieu d'utiliser maplibregl.LngLatBounds
          let minLng = coordinates[0][0];
          let maxLng = coordinates[0][0];
          let minLat = coordinates[0][1];
          let maxLat = coordinates[0][1];

          coordinates.forEach((coord: number[]) => {
            minLng = Math.min(minLng, coord[0]);
            maxLng = Math.max(maxLng, coord[0]);
            minLat = Math.min(minLat, coord[1]);
            maxLat = Math.max(maxLat, coord[1]);
          });

          mapRef.fitBounds([
            [minLng, minLat],
            [maxLng, maxLat]
          ], {
            padding: 50
          });
        } catch (error) {
          console.warn('Erreur lors de l\'affichage de la route:', error);
          drawStraightLine(origin, destination);
        }
      }
    } catch (error) {
      console.warn('Erreur lors du calcul de l\'itinéraire:', error);
      // Fallback: dessiner une ligne droite
      drawStraightLine(origin, destination);
    }
  };

  const handleMapReady = (map: any) => {
    setMapRef(map);
    setTimeout(() => setIsInitialized(true), 100);
  };

  const handlePointSelect = (point: RelayPoint) => {
    if (selectionMode === 'origin') {
        setRouteData(prev => ({
            ...prev,
            departurePointId: point.id, // C'est un UUID string maintenant
            departurePointName: point.relayPointName
        }));
        setSelectionMode('destination');
    } else {
        // Mode destination
        if (point.id === routeData.departurePointId) {
            alert("Le point d'arrivée doit être différent du départ.");
            return;
        }
        
        const origin = allRelayPoints.find(p => p.id === routeData.departurePointId);
        if (origin) {
            const dist = haversineDistance(
                [origin.latitude, origin.longitude],
                [point.latitude, point.longitude]
            );
            
            setRouteData(prev => ({
                ...prev,
                arrivalPointId: point.id,
                arrivalPointName: point.relayPointName,
                distanceKm: dist
            }));
            
            setTravelPrice(calculateTravelPrice(dist));
        }
    }
    setIsSidebarOpen(false); // Fermer sur mobile
  };

  const handleSubmit = () => {
    if (routeData.departurePointId && routeData.arrivalPointId) {
        onContinue(routeData, travelPrice);
    }
  };

  const handleReset = () => {
    setRouteData({
        departurePointId: null, arrivalPointId: null,
        departurePointName: '', arrivalPointName: '', distanceKm: 0
    });
    setTravelPrice(0);
    setSelectionMode('origin');
  };

  const getPointStatus = (id: string) => {
      if (routeData.departurePointId === id) return 'origin';
      if (routeData.arrivalPointId === id) return 'destination';
      return 'available';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-screen flex flex-col bg-gray-50 dark:bg-transparent"
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {selectionMode === 'origin' ? "Point de départ" : "Point d'arrivée"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectionMode === 'origin' 
                  ? "Cliquez sur la carte ou sélectionnez dans la liste" 
                  : "Choisissez le point d'arrivée"
                }
              </p>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
            <>
              {/* Mobile overlay */}
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden fixed inset-0 bg-black/20 dark:bg-black/40 z-10"
                />
              )}

              <motion.div
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                className="fixed lg:relative z-20 w-80 bg-white dark:bg-gray-800 shadow-lg lg:shadow-none h-full flex flex-col"
              >
                {/* Sidebar header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">Points relais</h3>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="lg:hidden p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>

                  {/* Search bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Rechercher un point relais..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Points list */}
                <div className="flex-1 overflow-y-auto">
                    {isLoadingPoints ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-orange-500"/></div>
                    ) : filteredPoints.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">Aucun point relais trouvé.</div>
                    ) : (
                        filteredPoints.map(point => {
                            const status = getPointStatus(point.id);
                            return (
                              <div 
                                  key={point.id}
                                  onClick={() => handlePointSelect(point)}
                                  className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors ${status === 'origin' ? 'bg-orange-100 dark:bg-orange-900/40' : status === 'destination' ? 'bg-green-100 dark:bg-green-900/40' : ''}`}
                              >
                                  <div className="flex gap-3">
                                      <MapPin className={`w-5 h-5 flex-shrink-0 mt-0.5 ${status === 'origin' ? 'text-orange-600' : status === 'destination' ? 'text-green-600' : 'text-gray-400'}`} />
                                      <div>
                                          {/* C'EST ICI LA CORRECTION IMPORTANTE DE L'AFFICHAGE */}
                                          <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{point.relayPointName}</h4>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{point.address || "Adresse non spécifiée"}</p>
                                          {point.locality && <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mt-1 inline-block">{point.locality}</span>}
                                      </div>
                                  </div>
                              </div>
                            )
                        })
                    )}
                </div>


                {/* Progress indicator */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        routeData.departurePointId ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`} />
                      <span className={routeData.departurePointId ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
                        Départ
                      </span>
                    </div>
                    
                    <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        routeData.arrivalPointId ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`} />
                      <span className={routeData.arrivalPointId ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
                        Arrivée
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Map */}
        <div className="flex-1 relative">
          <MapComponent
            onMapReady={handleMapReady}
            initialCenter={YAOUNDE_CENTER}
            initialZoom={12}
          />

          {/* Floating route summary */}
          <AnimatePresence>
            {(routeData.departurePointId || routeData.arrivalPointId) && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="absolute top-4 left-4 right-4 lg:left-auto lg:w-80"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">Coût du trajet</h4>
                    <button
                      onClick={handleReset}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Départ</p>
                        <p className="font-medium text-sm truncate text-gray-800 dark:text-gray-100">
                          {routeData.departurePointName || 'À sélectionner'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Arrivée</p>
                        <p className="font-medium text-sm truncate text-gray-800 dark:text-gray-100">
                          {routeData.arrivalPointName || 'À sélectionner'}
                        </p>
                      </div>
                    </div>

                    {travelPrice > 0 && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Distance: {routeData.distanceKm.toFixed(1)} km
                          </span>
                          <span className="font-bold text-orange-600 dark:text-orange-400">
                            {travelPrice.toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span>Point de départ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Point d'arrivée</span>
            </div>
          </div>

          <motion.button
            onClick={handleSubmit}
            disabled={!routeData.arrivalPointId}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Continuer
            <ArrowRight className="w-4 h-4 ml-2" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
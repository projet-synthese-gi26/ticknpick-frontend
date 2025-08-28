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
  departurePointId: number | null;
  arrivalPointId: number | null;
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
  const [routeData, setRouteData] = useState<RouteData>({
    departurePointId: null,
    arrivalPointId: null,
    departurePointName: '',
    arrivalPointName: '',
    distanceKm: 0
  });
  const [travelPrice, setTravelPrice] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filteredPoints, setFilteredPoints] = useState(yaoundePointsRelais);
  const [mapRef, setMapRef] = useState<any>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  
  // Ajout d'un flag pour éviter les re-renders multiples
  const [isInitialized, setIsInitialized] = useState(false);

  // Filtrage des points relais selon la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPoints(yaoundePointsRelais);
    } else {
      const filtered = yaoundePointsRelais.filter(point =>
        point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        point.quartier.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPoints(filtered);
    }
  }, [searchQuery]);

  // Ajouter les marqueurs sur la carte
  useEffect(() => {
    if (!mapRef || !isInitialized) return;

    // Supprimer les anciens marqueurs et sources si ils existent
    try {
      if (mapRef.getLayer('points-relais')) {
        mapRef.removeLayer('points-relais');
      }
      if (mapRef.getLayer('points-relais-labels')) {
        mapRef.removeLayer('points-relais-labels');
      }
      if (mapRef.getSource('points-relais')) {
        mapRef.removeSource('points-relais');
      }
    } catch (error) {
      console.warn('Erreur lors de la suppression des couches:', error);
    }

    // Créer les features GeoJSON pour tous les points
    const features = yaoundePointsRelais.map(point => {
      const status = getPointStatus(point);
      return {
        type: 'Feature',
        properties: {
          id: point.id,
          name: point.name,
          quartier: point.quartier,
          status: status
        },
        geometry: {
          type: 'Point',
          coordinates: [point.lng, point.lat]
        }
      };
    });

    try {
      // Ajouter la source des points
      mapRef.addSource('points-relais', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features
        }
      });

      // Ajouter la couche des marqueurs
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
          'circle-stroke-width': [
            'case',
            ['==', ['get', 'status'], 'origin'], 3,
            ['==', ['get', 'status'], 'destination'], 3,
            2
          ],
          'circle-stroke-color': '#ffffff'
        }
      });

      // Ajouter les labels
      mapRef.addLayer({
        id: 'points-relais-labels',
        type: 'symbol',
        source: 'points-relais',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Regular'],
          'text-offset': [0, 2],
          'text-anchor': 'top',
          'text-size': 12
        },
        paint: {
          'text-color': '#374151',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });

      // Gérer les clics sur les points
      const handlePointClick = (e: any) => {
        const features = mapRef.queryRenderedFeatures(e.point, {
          layers: ['points-relais']
        });

        if (features.length > 0) {
          const pointId = features[0].properties.id;
          const point = yaoundePointsRelais.find(p => p.id === pointId);
          if (point) {
            handlePointSelect(point);
          }
        }
      };

      mapRef.on('click', 'points-relais', handlePointClick);

      // Changer le curseur sur hover
      mapRef.on('mouseenter', 'points-relais', () => {
        mapRef.getCanvas().style.cursor = 'pointer';
      });

      mapRef.on('mouseleave', 'points-relais', () => {
        mapRef.getCanvas().style.cursor = '';
      });

      // Cleanup function
      return () => {
        try {
          mapRef.off('click', 'points-relais', handlePointClick);
          mapRef.off('mouseenter', 'points-relais');
          mapRef.off('mouseleave', 'points-relais');
        } catch (error) {
          console.warn('Erreur lors du nettoyage des événements:', error);
        }
      };
    } catch (error) {
      console.error('Erreur lors de l\'ajout des couches de la carte:', error);
    }
  }, [mapRef, routeData.departurePointId, routeData.arrivalPointId, isInitialized]);

  // Dessiner l'itinéraire
  useEffect(() => {
    if (!mapRef || !routeData.departurePointId || !routeData.arrivalPointId) {
      // Supprimer l'itinéraire existant
      try {
        if (mapRef && mapRef.getLayer('route')) {
          mapRef.removeLayer('route');
        }
        if (mapRef && mapRef.getSource('route')) {
          mapRef.removeSource('route');
        }
      } catch (error) {
        console.warn('Erreur lors de la suppression de la route:', error);
      }
      return;
    }

    const originPoint = yaoundePointsRelais.find(p => p.id === routeData.departurePointId);
    const destinationPoint = yaoundePointsRelais.find(p => p.id === routeData.arrivalPointId);

    if (originPoint && destinationPoint) {
      // Utiliser l'API de routing (exemple avec OSRM ou MapBox)
      fetchRoute(originPoint, destinationPoint);
    }
  }, [mapRef, routeData.departurePointId, routeData.arrivalPointId]);

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

  const drawStraightLine = (origin: PointRelais, destination: PointRelais) => {
    try {
      // Supprimer l'ancienne route
      if (mapRef.getLayer('route')) {
        mapRef.removeLayer('route');
      }
      if (mapRef.getSource('route')) {
        mapRef.removeSource('route');
      }

      // Dessiner une ligne droite
      mapRef.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [origin.lng, origin.lat],
              [destination.lng, destination.lat]
            ]
          }
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
          'line-opacity': 0.6,
          'line-dasharray': [2, 2]
        }
      });
    } catch (error) {
      console.error('Erreur lors du dessin de la ligne droite:', error);
    }
  };

  const handleMapReady = (map: any) => {
    setMapRef(map);
    // Ajouter un délai pour s'assurer que la carte est complètement initialisée
    setTimeout(() => {
      setIsInitialized(true);
    }, 100);
  };

  const handlePointSelect = (point: PointRelais) => {
    if (selectionMode === 'origin') {
      setRouteData(prev => ({
        ...prev,
        departurePointId: point.id,
        departurePointName: point.name
      }));
      setSelectionMode('destination');
    } else {
      if (point.id === routeData.departurePointId) {
        alert("Le point d'arrivée doit être différent du point de départ.");
        return;
      }
      
      const originPoint = yaoundePointsRelais.find(p => p.id === routeData.departurePointId);
      if (originPoint) {
        const distance = haversineDistance(
          [originPoint.lat, originPoint.lng],
          [point.lat, point.lng]
        );
        setRouteData(prev => ({
          ...prev,
          arrivalPointId: point.id,
          arrivalPointName: point.name,
          distanceKm: distance
        }));
        setTravelPrice(calculateTravelPrice(distance));
      }
    }
    
    // Fermer la sidebar sur mobile après sélection
    setIsSidebarOpen(false);
  };

  const handleSubmit = () => {
    if (routeData.departurePointId && routeData.arrivalPointId) {
      onContinue(routeData, travelPrice);
    }
  };

  const handleReset = () => {
    setRouteData({
      departurePointId: null,
      arrivalPointId: null,
      departurePointName: '',
      arrivalPointName: '',
      distanceKm: 0
    });
    setTravelPrice(0);
    setSelectionMode('origin');
    setSearchQuery('');
  };

  const getPointStatus = (point: PointRelais) => {
    if (routeData.departurePointId === point.id) return 'origin';
    if (routeData.arrivalPointId === point.id) return 'destination';
    return 'available';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-screen flex flex-col bg-gray-50"
    >
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {selectionMode === 'origin' ? "Point de départ" : "Point d'arrivée"}
              </h2>
              <p className="text-sm text-gray-500">
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
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
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
                  className="lg:hidden fixed inset-0 bg-black/20 z-10"
                />
              )}

              <motion.div
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                className="fixed lg:relative z-20 w-80 bg-white shadow-lg lg:shadow-none h-full flex flex-col"
              >
                {/* Sidebar header */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">Points relais</h3>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="lg:hidden p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un point relais..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Points list */}
                <div className="flex-1 overflow-y-auto p-2">
                  <div className="space-y-2">
                    {filteredPoints.map(point => {
                      const status = getPointStatus(point);
                      return (
                        <motion.div
                          key={point.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handlePointSelect(point)}
                          className={`p-3 rounded-lg cursor-pointer border transition-all ${
                            status === 'origin' 
                              ? 'border-orange-500 bg-orange-50 shadow-md' :
                            status === 'destination' 
                              ? 'border-green-500 bg-green-50 shadow-md' : 
                              'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {status === 'origin' ? (
                                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                              ) : status === 'destination' ? (
                                <div className="w-3 h-3 bg-green-500 rounded-full" />
                              ) : (
                                <MapPin className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-800 truncate">
                                {point.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {point.quartier}
                              </p>
                              {status !== 'available' && (
                                <p className="text-xs font-medium mt-1 text-orange-600">
                                  {status === 'origin' ? 'Point de départ' : 'Point d\'arrivée'}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        routeData.departurePointId ? 'bg-orange-500' : 'bg-gray-300'
                      }`} />
                      <span className={routeData.departurePointId ? 'text-gray-800' : 'text-gray-400'}>
                        Départ
                      </span>
                    </div>
                    
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        routeData.arrivalPointId ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <span className={routeData.arrivalPointId ? 'text-gray-800' : 'text-gray-400'}>
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
                className="absolute bottom-4 left-4 right-4 lg:left-auto lg:w-80"
              >
                <div className="bg-white rounded-xl shadow-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">Récapitulatif</h4>
                    <button
                      onClick={handleReset}
                      className="p-1 hover:bg-gray-100 rounded text-gray-500"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Départ</p>
                        <p className="font-medium text-sm truncate">
                          {routeData.departurePointName || 'À sélectionner'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Arrivée</p>
                        <p className="font-medium text-sm truncate">
                          {routeData.arrivalPointName || 'À sélectionner'}
                        </p>
                      </div>
                    </div>

                    {travelPrice > 0 && (
                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Distance: {routeData.distanceKm.toFixed(1)} km
                          </span>
                          <span className="font-bold text-orange-600">
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
      <div className="bg-white border-t px-4 py-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500">
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
            className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Continuer
            <ArrowRight className="w-4 h-4 ml-2" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
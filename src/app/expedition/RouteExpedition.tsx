'use client';

import React, { useState, useEffect, useCallback, useRef, MouseEvent, ChangeEvent, FormEvent } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin, User, ArrowRight, Search, Package, Building2,
  Store, ChevronRight, X, Mail, Phone, Loader2, List, Undo2,
  Navigation, Zap, Eye, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import maplibregl, { Marker, Map as MapGL, LngLat } from 'maplibre-gl';
import yaoundePointsRelais, { PointRelais, YAOUNDE_CENTER, YAOUNDE_ZOOM } from '../emit-package/RelaisData';

interface RouteData {
  departurePointId: number | null;
  arrivalPointId: number | null;
  departurePointName: string;
  arrivalPointName: string;
  recipientName: string;
  recipientPhone: string;
}

interface RouteSelectionProps {
  onNext: (data: RouteData) => void;
  onBack: () => void;
}

const MapComponent = dynamic(() => import('../emit-package/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin h-12 w-12 text-orange-500 mx-auto" />
        <p className="text-orange-600 font-medium">Chargement de la carte...</p>
      </div>
    </div>
  ),
});

export default function RouteSelectionExpedition({ onNext, onBack }: RouteSelectionProps) {
  const mapInstanceRef = useRef<MapGL | null>(null);
  const markersRef = useRef<Map<number, Marker>>(new Map());
  const userLocationMarkerRef = useRef<Marker | null>(null);
  const routeLayerRef = useRef<string | null>(null);

  const [allPoints] = useState<PointRelais[]>(yaoundePointsRelais);
  const [displayedPoints, setDisplayedPoints] = useState<PointRelais[]>(allPoints);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  const [selectionMode, setSelectionMode] = useState<'origin' | 'destination' | 'recipient'>('origin');
  
  const [routeData, setRouteData] = useState<RouteData>({
    departurePointId: null,
    arrivalPointId: null,
    departurePointName: '',
    arrivalPointName: '',
    recipientName: '',
    recipientPhone: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Get user location
  const getUserLocation = useCallback(() => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(coords);
          setIsLoadingLocation(false);
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo({
              center: coords,
              zoom: 14,
              duration: 1500
            });
          }
        },
        () => {
          setIsLoadingLocation(false);
        }
      );
    } else {
      setIsLoadingLocation(false);
    }
  }, []);

  // Filter points based on search
  useEffect(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) {
      setDisplayedPoints(allPoints);
    } else {
      setDisplayedPoints(allPoints.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.quartier.toLowerCase().includes(term) ||
        p.address.toLowerCase().includes(term)
      ));
    }
  }, [searchQuery, allPoints]);

  const getPointById = useCallback((id: number | null): PointRelais | null => {
    if (id === null) return null;
    return allPoints.find(p => p.id === id) || null;
  }, [allPoints]);

  // Create marker element
  const createMarkerElement = (point: PointRelais, isSelected: boolean, type: 'origin' | 'destination' | 'normal') => {
    const el = document.createElement('div');
    el.className = 'relative cursor-pointer transition-all duration-300 hover:scale-110';
    
    let bgColor, pulseColor, size;
    if (type === 'origin') {
      bgColor = 'bg-green-500';
      pulseColor = 'bg-green-400';
      size = 'w-10 h-10';
    } else if (type === 'destination') {
      bgColor = 'bg-green-500';
      pulseColor = 'bg-green-400';
      size = 'w-10 h-10';
    } else {
      bgColor = 'bg-red-500';
      pulseColor = 'bg-red-400';
      size = 'w-8 h-8';
    }

    el.innerHTML = `
      <div class="${size} ${bgColor} rounded-full flex items-center justify-center shadow-xl border-3 border-white relative z-10">
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
        </svg>
      </div>
      ${isSelected ? `<div class="absolute inset-0 ${pulseColor} rounded-full animate-ping opacity-75"></div>` : ''}
    `;
    
    return el;
  };

  // Create user location marker
  const createUserLocationMarker = () => {
    const el = document.createElement('div');
    el.className = 'relative';
    el.innerHTML = `
      <div class="w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center relative z-10">
        <div class="w-2 h-2 bg-white rounded-full"></div>
      </div>
      <div class="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-50"></div>
    `;
    return el;
  };

// Draw route between points
const drawRoute = useCallback(async (origin: PointRelais, destination: PointRelais) => {
  const map = mapInstanceRef.current;
  if (!map) return;

  // Remove existing route
  if (routeLayerRef.current) {
    if (map.getLayer(routeLayerRef.current)) map.removeLayer(routeLayerRef.current);
    if (map.getSource(routeLayerRef.current)) map.removeSource(routeLayerRef.current);
  }

  const routeId = 'route-' + Date.now();
  routeLayerRef.current = routeId;

  // Simple straight line route (in real app, use routing API)
  // Remove 'as const' to make coordinates mutable
  const routeGeoJSON = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat]
      ]
    }
  };

  map.addSource(routeId, {
    type: 'geojson',
    data: routeGeoJSON
  });

  map.addLayer({
    id: routeId,
    type: 'line',
    source: routeId,
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#F97316',
      'line-width': 4,
      'line-opacity': 0.8
    }
  });

  // Fit map to show route
  const bounds = new maplibregl.LngLatBounds()
    .extend([origin.lng, origin.lat])
    .extend([destination.lng, destination.lat]);
  
  map.fitBounds(bounds, { padding: 50, duration: 1000 });
}, []);

  // Update map markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
    
    const originPoint = getPointById(routeData.departurePointId);
    const destinationPoint = getPointById(routeData.arrivalPointId);

    // Add point markers
    allPoints.forEach(point => {
      let markerType: 'origin' | 'destination' | 'normal' = 'normal';
      let isSelected = false;

      if (point.id === originPoint?.id) {
        markerType = 'origin';
        isSelected = true;
      } else if (point.id === destinationPoint?.id) {
        markerType = 'destination';
        isSelected = true;
      }

      const el = createMarkerElement(point, isSelected, markerType);
      
      const popup = new maplibregl.Popup({ offset: 25, className: 'custom-popup' }).setHTML(`
        <div class="p-3 font-sans">
          <h3 class="font-bold text-gray-800 mb-1">${point.name}</h3>
          <p class="text-sm text-gray-600 mb-2">${point.quartier}</p>
          <p class="text-xs text-gray-500">${point.address}</p>
        </div>
      `);
      
      const marker = new Marker({ element: el })
        .setLngLat([point.lng, point.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePointSelect(point);
      });

      markersRef.current.set(point.id, marker);
    });

    // Add user location marker
    if (userLocation && !userLocationMarkerRef.current) {
      const userEl = createUserLocationMarker();
      userLocationMarkerRef.current = new Marker({ element: userEl })
        .setLngLat(userLocation)
        .addTo(map);
    }

    // Draw route if both points selected
    if (originPoint && destinationPoint) {
      drawRoute(originPoint, destinationPoint);
    }
  }, [allPoints, routeData.departurePointId, routeData.arrivalPointId, userLocation, drawRoute]);

  // Handle point selection
  const handlePointSelect = (point: PointRelais) => {
    if (selectionMode === 'origin') {
      setRouteData(prev => ({ 
        ...prev, 
        departurePointId: point.id, 
        departurePointName: point.name 
      }));
      setSelectionMode('destination');
      setSearchQuery('');
    } else if (selectionMode === 'destination') {
      if (point.id === routeData.departurePointId) {
        setError("Le point d'arrivée ne peut pas être identique au point de départ.");
        setTimeout(() => setError(null), 3000);
        return;
      }
      setRouteData(prev => ({ 
        ...prev, 
        arrivalPointId: point.id, 
        arrivalPointName: point.name 
      }));
      setSelectionMode('recipient');
    }
  };

  // Zoom to point on list click
  const handlePointZoom = (point: PointRelais) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [point.lng, point.lat],
        zoom: 16,
        duration: 1000
      });
      
      // Trigger popup
      const marker = markersRef.current.get(point.id);
      if (marker) {
        marker.getPopup()?.addTo(mapInstanceRef.current);
      }
    }
  };

  const handleRecipientChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRouteData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmitRecipient = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!routeData.recipientName.trim()) {
      setError("Le nom du destinataire est requis.");
      return;
    }
    
    const phonePattern = /^(6|2)(?:[235-9]\d{7})$/;
    if (!phonePattern.test(routeData.recipientPhone.replace(/\s/g, ''))) {
      setError("Format de téléphone invalide (ex: 6xxxxxxxx ou 2xxxxxxxx).");
      return;
    }
    
    onNext(routeData);
  };
  
  const resetSelection = (mode: 'origin' | 'destination') => {
    if (mode === 'origin') {
      setRouteData(prev => ({
        ...prev, 
        departurePointId: null, 
        departurePointName: '',
        arrivalPointId: null,
        arrivalPointName: ''
      }));
      setSelectionMode('origin');
    } else {
      setRouteData(prev => ({
        ...prev, 
        arrivalPointId: null, 
        arrivalPointName: ''
      }));
      setSelectionMode('destination');
    }
    
    // Clear route
    if (routeLayerRef.current && mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      if (map.getLayer(routeLayerRef.current)) map.removeLayer(routeLayerRef.current);
      if (map.getSource(routeLayerRef.current)) map.removeSource(routeLayerRef.current);
      routeLayerRef.current = null;
    }
  };

  // Render sidebar content
  const renderSidebarContent = () => {
    const pointToRender = (point: PointRelais) => {
      const isOrigin = routeData.departurePointId === point.id;
      const isDestination = routeData.arrivalPointId === point.id;
      const isSelected = isOrigin || isDestination;
      const Icon = point.type === 'bureau' ? Building2 : point.type === 'commerce' ? Store : Package;

      return (
        <motion.div 
          key={point.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
            isSelected 
              ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-400 shadow-lg' 
              : 'bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200 hover:shadow-md'
          }`}
          onClick={() => handlePointSelect(point)}
        >
          <div className="flex items-start gap-3">
            <div className={`p-3 rounded-xl transition-colors ${
              isSelected ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
            }`}>
              <Icon size={20} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-gray-800 truncate text-sm">{point.name}</h4>
                {isOrigin && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Départ</span>}
                {isDestination && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Arrivée</span>}
              </div>
              <p className="text-xs text-orange-600 font-medium mb-1">{point.quartier}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{point.address}</p>
            </div>
            
            <div className="flex flex-col gap-2 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePointZoom(point);
                }}
                className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                title="Voir sur la carte"
              >
                <Eye size={16} />
              </button>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-orange-500 transition-colors"/>
            </div>
          </div>
        </motion.div>
      );
    };
    
    switch(selectionMode) {
      case 'origin':
      case 'destination':
        return (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {displayedPoints.length > 0 ? (
              displayedPoints.map(pointToRender)
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun point trouvé</p>
              </div>
            )}
          </div>
        );
      
      case 'recipient':
        return (
          <form onSubmit={handleSubmitRecipient} className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Nom du destinataire</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    name="recipientName" 
                    required 
                    value={routeData.recipientName} 
                    onChange={handleRecipientChange} 
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    placeholder="Entrez le nom complet"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Téléphone du destinataire</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="tel" 
                    name="recipientPhone" 
                    required 
                    value={routeData.recipientPhone} 
                    onChange={handleRecipientChange} 
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    placeholder="6xxxxxxxx ou 2xxxxxxxx"
                  />
                </div>
              </div>
            </div>
            
            <motion.button 
              type="submit" 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
            >
              Continuer <ArrowRight className="w-5 h-5"/>
            </motion.button>
          </form>
        );
      
      default: return null;
    }
  };

  const getHeaderTitle = () => {
    if (selectionMode === 'origin') return "1. Point de départ";
    if (selectionMode === 'destination') return "2. Point d'arrivée";
    return "3. Informations destinataire";
  };

  const getHeaderSubtitle = () => {
    if (selectionMode === 'origin') return "Sélectionnez votre point de collecte";
    if (selectionMode === 'destination') return "Choisissez la destination finale";
    return "Renseignez les détails du destinataire";
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">{getHeaderTitle()}</h1>
            <p className="text-gray-600">{getHeaderSubtitle()}</p>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
          {/* Sidebar */}
          <motion.aside 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Points relais</h2>
                <button
                  onClick={getUserLocation}
                  disabled={isLoadingLocation}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  {isLoadingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  Ma position
                </button>
              </div>
              
              {(selectionMode === 'origin' || selectionMode === 'destination') && (
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Rechercher par nom, quartier..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
              )}
            </div>
            
            <div className="flex-1 p-6 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={selectionMode} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full overflow-y-auto"
                >
                  {renderSidebarContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.aside>

          {/* Map */}
          <motion.main 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-3 rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative"
          >
            <MapComponent 
              onMapReady={(map) => { mapInstanceRef.current = map; }} 
              initialCenter={YAOUNDE_CENTER} 
              initialZoom={YAOUNDE_ZOOM} 
            />
            
            {/* Route Info Overlay */}
            <AnimatePresence>
              {(routeData.departurePointName || routeData.arrivalPointName) && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="absolute bottom-6 left-6 right-6"
                >
                  <div className="bg-white/95 backdrop-blur-lg p-6 rounded-2xl shadow-2xl border border-white/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 flex-1">
                        {routeData.departurePointName && (
                          <div className="text-center">
                            <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full mb-2">
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Départ</p>
                            <p className="font-bold text-gray-800 truncate max-w-32">{routeData.departurePointName}</p>
                          </div>
                        )}
                        
                        {routeData.departurePointName && routeData.arrivalPointName && (
                          <div className="flex-1 flex justify-center">
                            <ArrowRight className="text-orange-500 w-6 h-6" />
                          </div>
                        )}
                        
                        {routeData.arrivalPointName && (
                          <div className="text-center">
                            <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full mb-2">
                              <Target className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Arrivée</p>
                            <p className="font-bold text-gray-800 truncate max-w-32">{routeData.arrivalPointName}</p>
                          </div>
                        )}
                      </div>
                      
                      {(selectionMode === 'destination' || selectionMode === 'recipient') && (
                        <button 
                          onClick={() => resetSelection(selectionMode === 'recipient' ? 'destination' : 'origin')} 
                          className="ml-4 p-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 hover:text-gray-800 transition-colors"
                          title="Recommencer"
                        >
                          <Undo2 className="w-5 h-5"/>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.main>
        </div>

        {/* Bottom Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center"
        >
          <motion.button 
            onClick={onBack} 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-md"
          >
            Précédent
          </motion.button>
          
          <div className="text-sm text-gray-500">
            Étape {selectionMode === 'origin' ? '1' : selectionMode === 'destination' ? '2' : '3'} sur 3
          </div>
        </motion.div>
      </div>
    </div>
  );
}
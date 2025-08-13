'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin, User, ArrowRight, Search, Package, Building2,
  Store, Clock, ChevronRight, X, LocateFixed, Navigation,
  CheckCircle, CircleDot, Mail, Phone, Loader2, List
} from 'lucide-react';
import maplibregl from 'maplibre-gl';
import ShippingFormDataGlobal from './page';

// 1. IMPORTATION DIRECTE DE VOS DONNÉES LOCALES
import yaoundePointsRelais, { PointRelais, YAOUNDE_CENTER, YAOUNDE_ZOOM } from '../point-de-relais/RelaisData';

// INTERFACES (pour les données du formulaire)
export interface ShippingFormData {
  departurePointName: string;
  arrivalPointName: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  departurePointId?: number | null;
  arrivalPointId?: number | null;
}
interface RouteSelectionProps {
  formData: typeof ShippingFormDataGlobal; // <- CORRIGÉ
  setFormData: React.Dispatch<React.SetStateAction<typeof ShippingFormDataGlobal>>; // <- CORRIGÉ
  onNext: () => void;
  onBack: () => void;
}

// Fonction pour calculer la distance entre deux points (en mètres)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Rayon de la Terre en mètres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Fonction pour obtenir un itinéraire via l'API Mapbox/OpenRouteService
const getRoute = async (start: [number, number], end: [number, number]): Promise<[number, number][]> => {
  try {
    // Utilisation de l'API OpenRouteService (gratuite avec clé API)
    // Vous devrez remplacer 'YOUR_API_KEY' par votre vraie clé API
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-car?api_key=YOUR_API_KEY&start=${start[1]},${start[0]}&end=${end[1]},${end[0]}`
    );
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de l\'itinéraire');
    }
    
    const data = await response.json();
    return data.features[0].geometry.coordinates;
  } catch (error) {
    console.warn('Impossible de récupérer l\'itinéraire réel, utilisation d\'une ligne droite:', error);
    // Fallback: ligne droite
    return [[start[1], start[0]], [end[1], end[0]]];
  }
};

// Import dynamique du composant de carte
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <Loader2 className="animate-spin h-10 w-10 text-green-600" />
    </div>
  ),
});

const RouteSelection: React.FC<RouteSelectionProps> = ({ onNext, onBack, formData, setFormData }) => {
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<number, maplibregl.Marker>>(new Map());
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  
  // 2. UTILISATION DES DONNÉES IMPORTÉES DANS L'ÉTAT LOCAL
  const [allPoints] = useState<PointRelais[]>(yaoundePointsRelais);
  const [isLoadingPoints] = useState(false); // Le chargement est instantané car local
  
  const [displayedPoints, setDisplayedPoints] = useState<PointRelais[]>([]);
  const [selectionMode, setSelectionMode] = useState<'origin' | 'destination'>('origin');

  // 3. FONCTION LOCALE POUR OBTENIR UN POINT PAR SON ID
  const getPointById = useCallback((id: number | null): PointRelais | null => {
    if (id === null) return null;
    return allPoints.find(point => point.id === id) || null;
  }, [allPoints]);

  const fixedOriginPoint = allPoints[1];
  // FIX: Handle undefined by providing null as fallback
  const selectedDestination = getPointById(formData.arrivalPointId ?? null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isRecipientFormValid, setIsRecipientFormValid] = useState(false);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);

  // NOUVEAU : Effet pour définir le point de départ fixe au chargement du composant.
  useEffect(() => {
    if (fixedOriginPoint) {
      setFormData(prev => ({
        ...prev,
        departurePointId: fixedOriginPoint.id,
        departurePointName: fixedOriginPoint.name,
      }));
    }
  }, [fixedOriginPoint, setFormData]);

  // NOUVEAU : Initialiser displayedPoints avec tous les points au chargement
  useEffect(() => {
    setDisplayedPoints(allPoints);
  }, [allPoints]);

  const requestUserLocation = useCallback((map: maplibregl.Map) => {
    if (!navigator.geolocation) {
      console.warn("La géolocalisation n'est pas supportée.");
      map.flyTo({ center: [YAOUNDE_CENTER[1], YAOUNDE_CENTER[0]], zoom: YAOUNDE_ZOOM }); // lng, lat
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserPosition([latitude, longitude]);
        map.flyTo({ center: [longitude, latitude], zoom: 14 });

        if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([longitude, latitude]);
        } else {
          const el = document.createElement('div');
          el.className = 'w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-xl animate-pulse';
          userMarkerRef.current = new maplibregl.Marker(el)
            .setLngLat([longitude, latitude])
            .addTo(map);
        }
      },
      () => {
        console.warn("Impossible d'obtenir la position de l'utilisateur.");
        map.flyTo({ center: [YAOUNDE_CENTER[1], YAOUNDE_CENTER[0]], zoom: YAOUNDE_ZOOM }); // lng, lat
      }
    );
  }, []);

  const handleMapReady = useCallback((map: maplibregl.Map) => {
    mapInstanceRef.current = map;
    // MODIFIÉ : Ne plus géolocaliser automatiquement, on zoome pour voir tous les points.
    // L'utilisateur peut toujours cliquer sur le bouton de géolocalisation s'il le souhaite.
  }, []);

  useEffect(() => {
    const term = searchQuery.toLowerCase().trim();
    setDisplayedPoints(
      allPoints.filter(point =>
        point.name.toLowerCase().includes(term) ||
        point.quartier.toLowerCase().includes(term)
      )
    );
  }, [searchQuery, allPoints]);

  // MODIFIÉ : La logique de sélection est simplifiée pour ne gérer que la destination.
  const handlePointSelect = useCallback((point: PointRelais) => {
    if (!fixedOriginPoint) return;
    
    if (point.id === fixedOriginPoint.id) {
      alert("Le point de destination ne peut pas être le même que le point de départ.");
      return;
    }
    setFormData(prev => ({
      ...prev,
      arrivalPointId: point.id,
      arrivalPointName: point.name
    }));
    
    const map = mapInstanceRef.current;
    if (map) map.flyTo({ center: [point.lng, point.lat], zoom: 15 });

  }, [fixedOriginPoint, setFormData]);

  // MODIFIÉ : Logique principale de mise à jour de la carte avec nouvelles couleurs
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !fixedOriginPoint) return;

    // 1. Nettoyer les marqueurs précédents
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
    
    // 2. Créer un marqueur pour chaque point relais avec nouvelles couleurs
    allPoints.forEach(point => {
      // NOUVEAU : Déterminer la couleur selon les nouvelles règles
      let markerColor = '#3b82f6'; // Bleu par défaut
      let shouldBlink = false;
      
      if (point.id === fixedOriginPoint.id) {
        markerColor = '#ef4444'; // Rouge pour l'origine
        shouldBlink = true; // Clignoter
      } else {
        // Calculer la distance avec le point d'origine
        const distance = calculateDistance(
          fixedOriginPoint.lat, fixedOriginPoint.lng,
          point.lat, point.lng
        );
        
        if (distance <= 200) { // Dans un rayon de 200m
          markerColor = '#8b5cf6'; // Violet
        }
        // Sinon reste bleu (#3b82f6)
      }

      const el = document.createElement('div');
      const blinkClass = shouldBlink ? 'animate-pulse' : '';
      el.innerHTML = `<div class="w-8 h-8 rounded-full flex items-center justify-center shadow-md transform hover:scale-110 transition-transform cursor-pointer ${blinkClass}" style="background-color: ${markerColor}; border: 2px solid white;"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>`;
      
      // NOUVEAU : Contenu enrichi pour le popup avec info sur la distance
      const distance = calculateDistance(
        fixedOriginPoint.lat, fixedOriginPoint.lng,
        point.lat, point.lng
      );
      
      const distanceText = point.id === fixedOriginPoint.id ? 
        '' : 
        `<p class="text-xs text-gray-500"><strong>Distance:</strong> ${Math.round(distance)}m du point de départ</p>`;
        
      const popupContent = `
        <div class="p-1 font-sans" style="min-width: 200px;">
          <h3 class="font-bold text-sm text-gray-800">${point.name}</h3>
          <p class="text-xs text-gray-600">${point.address}</p>
          <p class="text-xs text-gray-500 mt-1"><strong>Horaires:</strong> ${point.hours}</p>
          ${distanceText}
          ${ point.id !== fixedOriginPoint.id ?
            `<button id="select-btn-${point.id}" class="mt-2 w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-2 rounded-lg transition-colors">
              Choisir comme Destination
            </button>` :
            `<div class="mt-2 w-full bg-red-50 text-red-700 text-xs font-bold py-1.5 px-2 rounded-lg text-center">
              Point de Départ (Origine)
            </div>`
          }
        </div>`;

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupContent);
      
      popup.on('open', () => {
        const button = document.getElementById(`select-btn-${point.id}`);
        if (button) {
            button.addEventListener('click', () => handlePointSelect(point));
        }
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([point.lng, point.lat])
        .setPopup(popup)
        .addTo(map);
        
      markersRef.current.set(point.id, marker);
    });

    // 3. Ajuster le zoom pour voir tous les points la première fois que la carte charge
    if (map.loaded()) {
        const bounds = new maplibregl.LngLatBounds();
        allPoints.forEach(point => bounds.extend([point.lng, point.lat]));
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 60, duration: 1000, maxZoom: 15 });
        }
    }

    // 4. NOUVEAU : Tracer l'itinéraire réel si une destination est choisie
    if (map.getSource('route')) {
      map.removeLayer('route');
      map.removeSource('route');
    }

    if (selectedDestination) {
      // Fonction pour tracer l'itinéraire
      const drawRoute = async () => {
        try {
          const routeCoordinates = await getRoute(
            [fixedOriginPoint.lat, fixedOriginPoint.lng],
            [selectedDestination.lat, selectedDestination.lng]
          );
          
          // CORRIGÉ : Ajout de la propriété 'properties' requise pour GeoJSON Feature
          map.addSource('route', { 
            type: 'geojson', 
            data: { 
              type: 'Feature', 
              properties: {}, // Propriété requise pour GeoJSON Feature
              geometry: { 
                type: 'LineString', 
                coordinates: routeCoordinates 
              } 
            } 
          });
          
          map.addLayer({ 
            id: 'route', 
            type: 'line', 
            source: 'route', 
            layout: {}, 
            paint: { 
              'line-color': '#3b82f6', // NOUVEAU : Couleur bleue pour l'itinéraire
              'line-width': 4,
              'line-opacity': 0.8
            } 
          });
          
          // Ajuster la vue pour voir tout l'itinéraire
          const routeBounds = new maplibregl.LngLatBounds();
          routeCoordinates.forEach((coord: [number, number]) => {
            routeBounds.extend(coord);
          });
          
          if (!routeBounds.isEmpty()) {
            map.fitBounds(routeBounds, { padding: 80, duration: 1000 });
          }
        } catch (error) {
          console.error('Erreur lors du tracé de l\'itinéraire:', error);
        }
      };
      
      drawRoute();
    }

  }, [allPoints, selectedDestination, handlePointSelect, fixedOriginPoint]);
  
  useEffect(() => {
    setIsRecipientFormValid(
        formData.recipientName.trim().length > 2 &&
        formData.recipientPhone.trim().length >= 8
    );
  }, [formData.recipientName, formData.recipientPhone]);
  
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecipientFormValid && selectedDestination) {
        onNext();
    } else {
        alert("Veuillez sélectionner un point de destination, puis remplir les informations du destinataire.");
    }
  };

  const handleRecipientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, recipientName: e.target.value });
  };

  const handleRecipientPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, recipientPhone: e.target.value });
  };

  const handleRecipientEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, recipientEmail: e.target.value });
  };

  const renderDestinationPoints = () => {
    if (!fixedOriginPoint) return null;

    // Step 1: Filter the points into a new, clearly-typed variable.
    const destinationPoints: PointRelais[] = displayedPoints.filter(
        (point): point is PointRelais => point.id !== fixedOriginPoint.id
    );

    // Step 2: Check if the new variable is empty.
    if (destinationPoints.length === 0) {
        return <p className="text-center text-gray-500 text-sm py-6">Aucun point relais trouvé.</p>;
    }

    // Step 3: Map over the new variable with an explicit type annotation for 'point'.
    return destinationPoints.map((point: PointRelais) => {
        const isSelectedAsArrival = selectedDestination?.id === point.id;
        const TypeIcon = point.type === 'bureau' ? Building2 : point.type === 'commerce' ? Store : Package;
        
        const distance = calculateDistance(
            fixedOriginPoint.lat, fixedOriginPoint.lng,
            point.lat, point.lng
        );
        const isNearby = distance <= 200;
        
        return (
            <div 
              key={`list-point-${point.id}`} 
              onClick={() => handlePointSelect(point)} 
              className={`p-2.5 rounded-lg border transition-all duration-150 flex items-start gap-2.5 cursor-pointer ${
                isSelectedAsArrival 
                  ? 'bg-red-50 border-red-500' 
                  : isNearby 
                    ? 'bg-purple-50 border-purple-200 hover:bg-purple-100' 
                    : 'hover:bg-gray-100 border-gray-200'
              }`}
            >
                <div className={`mt-0.5 w-8 h-8 shrink-0 rounded-md flex items-center justify-center text-sm ${
                  isNearby ? 'bg-purple-200 text-purple-700' : 'bg-gray-200 text-gray-700'
                }`}>
                  <TypeIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-gray-800 truncate">{point.name}</h4>
                  <p className="text-xs text-gray-600 truncate">{point.address}</p>
                  <p className="text-xs text-gray-500">{Math.round(distance)}m du départ</p>
                </div>
                <ChevronRight size={18} className="text-gray-400 self-center shrink-0"/>
            </div>
        );
    });
  };

  if (!fixedOriginPoint) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-green-600" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm p-3 z-20 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <h2 className="text-md sm:text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
              {!selectedDestination ? "1. Choisissez le point d'arrivée" : "2. Infos du destinataire"}
          </h2>
          <div className="relative w-full sm:w-auto max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher un relais..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsSidebarVisible(!isSidebarVisible)} 
            className="sm:hidden p-2 text-gray-600 hover:text-green-600" 
            title="Afficher la liste"
          >
            {isSidebarVisible ? <X className="w-5 h-5"/> : <List className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 relative">
          <MapComponent
            onMapReady={handleMapReady}
            initialCenter={[YAOUNDE_CENTER[1], YAOUNDE_CENTER[0]]} // CORRIGÉ: [lng, lat]
            initialZoom={YAOUNDE_ZOOM}
          />
        </main>

        <aside className={`
          fixed sm:static top-0 right-0 h-full
          w-full max-w-xs sm:w-80 md:w-96 bg-white shadow-2xl sm:shadow-lg
          transform transition-transform duration-300 ease-in-out z-30
          flex flex-col border-l border-gray-200
          ${isSidebarVisible ? 'translate-x-0' : 'translate-x-full sm:translate-x-0'}
        `}>
          <div className="p-3.5 border-b flex justify-between items-center bg-gray-50">
            <h3 className="text-md font-semibold text-gray-800">
              {selectedDestination ? "Infos Destinataire" : "Points Relais"}
            </h3>
            <button 
              onClick={() => setIsSidebarVisible(false)} 
              className="sm:hidden p-1 text-gray-500 hover:text-gray-700"
            > 
              <X className="w-5 h-5" /> 
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedDestination ? (
              <form onSubmit={handleFormSubmit} className="p-4 space-y-3.5 border-b border-gray-200 overflow-y-auto">
                <p className="text-xs text-gray-500 mb-2">Remplissez ces informations pour finaliser la sélection du trajet.</p>
                <div>
                  <label htmlFor="recipientName" className="block text-xs font-medium text-gray-700 mb-1">
                    Nom complet du destinataire <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input 
                      id="recipientName" 
                      type="text" 
                      placeholder="Ex: Alima C." 
                      value={formData.recipientName} 
                      onChange={handleRecipientNameChange} 
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-200 transition-all" 
                      required 
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="recipientPhone" className="block text-xs font-medium text-gray-700 mb-1">
                    Téléphone du destinataire <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input 
                      id="recipientPhone" 
                      type="tel" 
                      placeholder="Ex: 6XX XXX XXX" 
                      value={formData.recipientPhone} 
                      onChange={handleRecipientPhoneChange} 
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-200 transition-all" 
                      required 
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="recipientEmail" className="block text-xs font-medium text-gray-700 mb-1">
                    E-mail du destinataire (Optionnel)
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input 
                      id="recipientEmail" 
                      type="email" 
                      placeholder="Ex: email@example.com" 
                      value={formData.recipientEmail} 
                      onChange={handleRecipientEmailChange} 
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-200 transition-all" 
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={onBack} 
                    className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-md font-medium text-sm transition-all hover:bg-gray-50"
                  >
                    Précédent
                  </button>
                  <button 
                    type="submit" 
                    disabled={!isRecipientFormValid} 
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-md font-medium text-sm transition-all hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    Suivant <ArrowRight size={16} className="ml-1" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <p className="text-xs text-gray-500 px-1 pb-1 border-b border-dashed border-gray-300">
                    Votre point de départ est : <strong className="text-red-600">{fixedOriginPoint.name}</strong>. Veuillez choisir une destination.
                </p>
                {/* NOUVEAU : Légende des couleurs */}
                <div className="text-xs text-gray-500 px-1 pb-2 border-b border-dashed border-gray-300 space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span>Point de départ (origine)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span>Points à proximité (&lt; 200m)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Autres points relais</span>
                    </div>
                </div>

                {renderDestinationPoints()}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default RouteSelection;
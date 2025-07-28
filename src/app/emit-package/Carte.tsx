'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPinIcon, TruckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

// Déclaration du type global pour maplibregl
declare global {
  interface Window {
    maplibregl: any;
  }
}

// Interface pour les données de points relais
interface RelayPoint {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [longitude, latitude]
  isAvailable: boolean;
}

// Interface pour les props du composant
interface MapRelayPointSelectorProps {
  onOriginSelect: (pointId: string) => void;
  onDestinationSelect: (pointId: string) => void;
  selectedOrigin: string;
  selectedDestination: string;
}

const MapRelayPointSelector: React.FC<MapRelayPointSelectorProps> = ({
  onOriginSelect,
  onDestinationSelect,
  selectedOrigin,
  selectedDestination
}) => {
  // Référence pour l'élément conteneur de la carte
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Référence pour l'objet carte (sera défini après chargement de la bibliothèque)
  const mapRef = useRef<any>(null);
  
  // Référence pour les marqueurs
  const markersRef = useRef<any[]>([]);
  
  // État pour suivre le chargement de la carte
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // État pour le type de sélection en cours (origin ou destination)
  const [selectionMode, setSelectionMode] = useState<'origin' | 'destination'>('origin');
  
  // État pour le suivi du chargement
  const [isLoading, setIsLoading] = useState(true);
  
  // État pour le suivi de l'itinéraire
  const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string} | null>(null);

  // État pour les coordonnées de la route
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  // Données simulées des points relais à Yaoundé
  const relayPoints: RelayPoint[] = [
    {
      id: 'relay1',
      name: 'Supermarché Mahima',
      address: 'Rue 1.839, Yaoundé',
      coordinates: [11.5174, 3.8721], // [longitude, latitude]
      isAvailable: true
    },
    {
      id: 'relay2',
      name: 'Librairie Papyrus',
      address: 'Avenue Kennedy, Yaoundé',
      coordinates: [11.5022, 3.8662],
      isAvailable: true
    },
    {
      id: 'relay3',
      name: 'Boutique Express',
      address: 'Marché Central, Yaoundé',
      coordinates: [11.5208, 3.8583],
      isAvailable: true
    },
    {
      id: 'relay4',
      name: 'Épicerie du Quartier',
      address: 'Quartier Bastos, Yaoundé',
      coordinates: [11.5128, 3.8905],
      isAvailable: true
    },
    {
      id: 'relay5',
      name: 'Kiosque Mobile',
      address: 'Poste Centrale, Yaoundé',
      coordinates: [11.5172, 3.8665],
      isAvailable: true
    }
  ];

  // useEffect pour tracer la route
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.maplibregl) return;

    const routeSource = map.getSource('route');
    if (routeSource) {
      map.removeLayer('route');
      map.removeSource('route');
    }

    if (routeCoordinates && routeCoordinates.length > 1) {
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates,
          },
        },
      });

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.8 },
      });
      
      // Ajuster la vue pour montrer toute la route
      const bounds = routeCoordinates.reduce(
        (bounds, coord) => bounds.extend(coord as [number, number]),
        new window.maplibregl.LngLatBounds(routeCoordinates[0] as [number, number], routeCoordinates[0] as [number, number])
      );
      map.fitBounds(bounds, { padding: 60, duration: 1500 });
    }
  }, [routeCoordinates]); // Se redéclenche quand les coordonnées de la route changent

  // Fonction pour charger la carte MapLibre GL
  useEffect(() => {
    // Simuler le chargement des données et de la carte
    setIsLoading(true);

    // Charger le script MapLibre GL JS
    const loadMapScript = () => {
      // Vérifier si le script est déjà chargé
      if (window.maplibregl) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/3.6.2/maplibre-gl.js';
      script.async = true;
      script.onload = initializeMap;
      document.body.appendChild(script);

      // Charger le CSS de MapLibre
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/3.6.2/maplibre-gl.min.css';
      document.head.appendChild(link);
    };

    loadMapScript();

    return () => {
      // Nettoyer la carte lors du démontage du composant
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Initialiser la carte après le chargement du script
  const initializeMap = () => {
    if (!mapContainerRef.current || !window.maplibregl) return;

    // Créer l'objet carte centré sur Yaoundé
    const map = new window.maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://demotiles.maplibre.org/style.json', // Style de carte par défaut
      center: [11.5174, 3.8721], // Coordonnées de Yaoundé [longitude, latitude]
      zoom: 13
    });

    // Enregistrer la référence à la carte
    mapRef.current = map;

    // Attendre que la carte soit chargée
    map.on('load', () => {
      setMapLoaded(true);
      setIsLoading(false);
      
      // Ajouter les marqueurs des points relais
      addRelayPointMarkers();
    });
  };

  // Fonction pour ajouter les marqueurs des points relais
  const addRelayPointMarkers = () => {
    if (!mapRef.current || !window.maplibregl) return;
    
    // Nettoyer les marqueurs existants
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Ajouter les nouveaux marqueurs
    relayPoints.forEach(point => {
      // Créer un élément DOM pour le marqueur personnalisé
      const el = document.createElement('div');
      el.className = 'relay-point-marker';
      
      // Styliser le marqueur en fonction de son état
      let markerColor = point.isAvailable ? 'bg-green-500' : 'bg-gray-400';
      
      if (point.id === selectedOrigin) {
        markerColor = 'bg-blue-600';
      } else if (point.id === selectedDestination) {
        markerColor = 'bg-red-600';
      }
      
      el.innerHTML = `
        <div class="w-8 h-8 ${markerColor} rounded-full flex items-center justify-center shadow-md transform hover:scale-110 transition-transform cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      `;
      
      // Créer le popup avec les informations du point relais
      const popup = new window.maplibregl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-medium text-sm">${point.name}</h3>
            <p class="text-xs text-gray-600">${point.address}</p>
            <button class="mt-2 bg-green-100 hover:bg-green-200 text-green-700 text-xs py-1 px-2 rounded transition-colors">
              Sélectionner comme ${selectionMode === 'origin' ? 'point de départ' : 'point d\'arrivée'}
            </button>
          </div>
        `);
      
      // Créer et ajouter le marqueur à la carte
      const marker = new window.maplibregl.Marker(el)
        .setLngLat(point.coordinates)
        .setPopup(popup)
        .addTo(mapRef.current);
      
      // Ajouter un événement de clic sur le marqueur
      el.addEventListener('click', () => {
        if (selectionMode === 'origin') {
          onOriginSelect(point.id);
        } else {
          onDestinationSelect(point.id);
        }
      });
      
      // Enregistrer le marqueur dans la référence
      markersRef.current.push(marker);
    });
    
    // Si nous avons un point d'origine et de destination, dessiner l'itinéraire
    if (selectedOrigin && selectedDestination) {
      drawRoute();
    }
  };
  
  // Fonction pour dessiner l'itinéraire entre les points sélectionnés
  const drawRoute = () => {
    if (!mapRef.current) return;
    
    // Trouver les points d'origine et de destination
    const origin = relayPoints.find(p => p.id === selectedOrigin);
    const destination = relayPoints.find(p => p.id === selectedDestination);
    
    if (!origin || !destination) return;
    
    // Supprimer l'itinéraire existant s'il y en a un
    if (mapRef.current.getSource('route')) {
      mapRef.current.removeLayer('route');
      mapRef.current.removeSource('route');
    }
    
    // Points intermédiaires simulés pour créer un itinéraire réaliste
    // Dans une application réelle, ces points proviendraient d'un service d'itinéraire
    const intermediatePoints = generateIntermediatePoints(origin.coordinates, destination.coordinates);
    
    // Créer les coordonnées de la route
    const coordinates: [number, number][] = [
      origin.coordinates,
      ...intermediatePoints,
      destination.coordinates
    ];
    
    // Mettre à jour l'état des coordonnées de la route
    setRouteCoordinates(coordinates);
    
    // Créer un objet LineString GeoJSON pour l'itinéraire
    const routeData = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      }
    };
    
    // Ajouter la source et la couche pour l'itinéraire
    mapRef.current.addSource('route', {
      type: 'geojson',
      data: routeData
    });
    
    mapRef.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#16a34a', // Vert
        'line-width': 4,
        'line-dasharray': [0, 2]  // Animation de ligne pointillée
      }
    });
    
    // Ajuster la vue pour inclure l'origine et la destination
    const bounds = new window.maplibregl.LngLatBounds()
      .extend(origin.coordinates)
      .extend(destination.coordinates);
    
    mapRef.current.fitBounds(bounds, {
      padding: 80,
      duration: 1000
    });
    
    // Mettre à jour les informations d'itinéraire
    // Calcul simulé de la distance et de la durée
    const distance = calculateDistance(origin.coordinates, destination.coordinates);
    const duration = Math.round(distance / 30 * 60); // 30 km/h en moyenne
    
    setRouteInfo({
      distance: `${distance.toFixed(1)} km`,
      duration: `${Math.floor(duration / 60)}h ${duration % 60}min`
    });
  };
  
  // Fonction pour générer des points intermédiaires entre deux coordonnées
  const generateIntermediatePoints = (start: [number, number], end: [number, number]): [number, number][] => {
    const points: [number, number][] = [];
    const numPoints = 3; // Nombre de points intermédiaires
    
    for (let i = 1; i <= numPoints; i++) {
      const ratio = i / (numPoints + 1);
      
      // Ajouter un peu de variation aléatoire pour simuler un vrai itinéraire
      const jitter = 0.003 * (Math.random() - 0.5);
      
      const lng = start[0] + (end[0] - start[0]) * ratio + jitter;
      const lat = start[1] + (end[1] - start[1]) * ratio + jitter;
      
      points.push([lng, lat]);
    }
    
    return points;
  };
  
  // Fonction pour calculer la distance entre deux points (en km)
  const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
    // Formule de Haversine pour calculer la distance entre deux points sur une sphère
    const toRad = (value: number) => (value * Math.PI) / 180;
    
    const R = 6371; // Rayon de la Terre en km
    const dLat = toRad(coord2[1] - coord1[1]);
    const dLon = toRad(coord2[0] - coord1[0]);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(coord1[1])) * Math.cos(toRad(coord2[1])) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  };
  
  // Effet pour mettre à jour les marqueurs lorsque la sélection change
  useEffect(() => {
    if (mapLoaded) {
      addRelayPointMarkers();
    }
  }, [selectedOrigin, selectedDestination, selectionMode, mapLoaded]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full">
      <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center">
        <MapPinIcon className="w-6 h-6 mr-2" />
        Sélection des points relais
      </h2>
      
      {/* Onglets pour choisir entre point de départ et d'arrivée */}
      <div className="flex mb-4 border-b border-gray-200">
        <button
          className={`flex items-center py-2 px-4 font-medium transition-colors ${
            selectionMode === 'origin' 
              ? 'text-green-700 border-b-2 border-green-500' 
              : 'text-gray-500 hover:text-green-600'
          }`}
          onClick={() => setSelectionMode('origin')}
        >
          <TruckIcon className="w-5 h-5 mr-2" />
          Point de départ
        </button>
        <button
          className={`flex items-center py-2 px-4 font-medium transition-colors ${
            selectionMode === 'destination' 
              ? 'text-green-700 border-b-2 border-green-500' 
              : 'text-gray-500 hover:text-green-600'
          }`}
          onClick={() => setSelectionMode('destination')}
        >
          <MapPinIcon className="w-5 h-5 mr-2" />
          Point d'arrivée
        </button>
      </div>
      
      {/* Affichage des points sélectionnés */}
      <div className="mb-4 flex items-center">
        <div className="flex-1 bg-blue-50 p-3 rounded-lg mr-2">
          <p className="text-sm text-gray-500">Point de départ</p>
          {selectedOrigin ? (
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-blue-600 mr-2" />
              <p className="font-medium text-blue-800">
                {relayPoints.find(p => p.id === selectedOrigin)?.name || 'Non sélectionné'}
              </p>
            </div>
          ) : (
            <p className="text-gray-400 italic">Non sélectionné</p>
          )}
        </div>
        
        <ArrowRightIcon className="w-6 h-6 text-gray-400 mx-2" />
        
        <div className="flex-1 bg-red-50 p-3 rounded-lg ml-2">
          <p className="text-sm text-gray-500">Point d'arrivée</p>
          {selectedDestination ? (
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-red-600 mr-2" />
              <p className="font-medium text-red-800">
                {relayPoints.find(p => p.id === selectedDestination)?.name || 'Non sélectionné'}
              </p>
            </div>
          ) : (
            <p className="text-gray-400 italic">Non sélectionné</p>
          )}
        </div>
      </div>
      
      {/* Conteneur de la carte */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-96 rounded-lg overflow-hidden border border-gray-200 relative"
      >
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              <p className="mt-4 text-green-600 font-medium">Chargement de la carte...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Informations sur l'itinéraire */}
      {routeInfo && (
        <div className="mt-4 bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="font-medium text-green-800 mb-2">Information sur l'itinéraire</h3>
          <div className="flex justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
              <span className="text-green-700">Distance: {routeInfo.distance}</span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-700">Durée estimée: {routeInfo.duration}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="mt-4 text-gray-600 text-sm">
        <p>Cliquez sur un marqueur sur la carte pour sélectionner un point relais.</p>
        <p>Utilisez les onglets pour choisir entre le point de départ et d'arrivée.</p>
      </div>
    </div>
  );
};

export default MapRelayPointSelector;
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl, { Map, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Globe2, Pin } from 'lucide-react';

interface MapComponentProps {
  onMapReady: (map: maplibregl.Map) => void;
  initialCenter: [number, number];
  initialZoom: number;
  interactive?: boolean;
  onMapClick?: (coords: { lng: number; lat: number }) => void;
  markers?: CustomMarker[];
  routeCoordinates?: [number, number][];
}

interface CustomMarker {
  id: string | number;
  lng: number;
  lat: number;
  color: string;
  popupHtml?: string;
  onClick?: () => void;
}

const MAPTILER_API_KEY = 'Lr72DkH8TYyjpP7RNZS9';

const MapComponentMapLibre: React.FC<MapComponentProps> = ({
  onMapReady,
  initialCenter,
  initialZoom,
  interactive = true,
  onMapClick,
  markers = [],
  routeCoordinates = [],
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [currentStyle, setCurrentStyle] = useState<'streets' | 'hybrid'>('hybrid');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const blinkingMarkerRef = useRef<Marker | null>(null);

  // Coordonnées de Yaoundé
  const yaundeCenter: [number, number] = [11.5021, 3.8480];
  
  // Utiliser les coordonnées de Yaoundé par défaut si les coordonnées initiales ne sont pas spécifiées
  const mapCenter = initialCenter[0] === 0 && initialCenter[1] === 0 ? yaundeCenter : initialCenter;

// NOUVEAU CODE
  const mapStyles = {
    // Style de rues détaillé, type Google Maps
    streets: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_API_KEY}`,
    
    // Style satellite avec les noms des lieux et des routes par-dessus
    hybrid: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_API_KEY}`,
  };

  // Créer un élément de marqueur clignotant
  const createBlinkingMarker = useCallback(() => {
    const el = document.createElement('div');
    el.className = 'blinking-marker';
    el.style.cssText = `
      width: 20px;
      height: 20px;
      background-color: #ff4444;
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(255, 68, 68, 0.3);
      animation: blink 1s infinite;
      cursor: pointer;
    `;
    
    // Ajouter les styles d'animation au document
    if (!document.querySelector('#blinking-animation-style')) {
      const style = document.createElement('style');
      style.id = 'blinking-animation-style';
      style.textContent = `
        @keyframes blink {
          0%, 50% { opacity: 1; transform: scale(1); }
          25% { opacity: 0.7; transform: scale(1.1); }
          75% { opacity: 0.9; transform: scale(0.95); }
        }
      `;
      document.head.appendChild(style);
    }
    
    return el;
  }, []);

  // Gérer le clic sur la carte
  const handleMapClick = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!mapInstanceRef.current) return;

    const coords = e.lngLat;
    
    // Supprimer l'ancien marqueur clignotant
    if (blinkingMarkerRef.current) {
      blinkingMarkerRef.current.remove();
    }

    // Créer un nouveau marqueur clignotant
    const markerElement = createBlinkingMarker();
    const marker = new maplibregl.Marker(markerElement)
      .setLngLat([coords.lng, coords.lat])
      .addTo(mapInstanceRef.current);

    blinkingMarkerRef.current = marker;

    // Supprimer le marqueur après 5 secondes
    setTimeout(() => {
      if (blinkingMarkerRef.current) {
        blinkingMarkerRef.current.remove();
        blinkingMarkerRef.current = null;
      }
    }, 5000);

    // Appeler le callback si fourni
    if (onMapClick) {
      onMapClick(coords);
    }
  }, [onMapClick, createBlinkingMarker]);

  // Gérer les marqueurs personnalisés
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapLoaded) return;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Ajouter les nouveaux marqueurs
    markers.forEach(markerData => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.cssText = `
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
        cursor: pointer;
        transform: scale(1);
        transition: transform 0.2s ease;
        background-color: ${markerData.color};
      `;
      
      el.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      `;
      
      // Effet hover
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.1)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });
      
      const marker = new maplibregl.Marker(el)
        .setLngLat([markerData.lng, markerData.lat])
        .addTo(map);

      // Ajouter popup si fourni
      if (markerData.popupHtml) {
        const popup = new maplibregl.Popup({ 
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(markerData.popupHtml);
        marker.setPopup(popup);
      }
      
      // Ajouter gestionnaire de clic
      if (markerData.onClick) {
        el.addEventListener('click', markerData.onClick);
      }

      markersRef.current.push(marker);
    });

  }, [markers, isMapLoaded]);

  // Gérer le tracé de route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapLoaded) return;

    // Supprimer la route existante
    if (map.getSource('route')) {
      map.removeLayer('route');
      map.removeSource('route');
    }

    // Ajouter la nouvelle route
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
        layout: { 
          'line-join': 'round', 
          'line-cap': 'round' 
        },
        paint: { 
          'line-color': '#3b82f6', 
          'line-width': 5, 
          'line-opacity': 0.8 
        },
      });
      
      // Ajuster la vue pour montrer toute la route
      const bounds = routeCoordinates.reduce(
        (bounds, coord) => bounds.extend(coord),
        new maplibregl.LngLatBounds(routeCoordinates[0], routeCoordinates[0])
      );
      map.fitBounds(bounds, { padding: 60, duration: 1500 });
    }
  }, [routeCoordinates, isMapLoaded]);

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: mapStyles[currentStyle],
        center: mapCenter,
        zoom: Math.max(initialZoom, 12),
        interactive: interactive,
        attributionControl: false,
        logoControl: false,
      });

      // Ajouter les contrôles si interactif
      if (interactive) {
        map.addControl(new maplibregl.NavigationControl({
          visualizePitch: true,
          showZoom: true,
          showCompass: true
        }), 'top-right');
      }

      // Attendre que la carte soit chargée
      map.on('load', () => {
        mapInstanceRef.current = map;
        setIsMapLoaded(true);
        
        // Centrer sur Yaoundé
        map.flyTo({
          center: yaundeCenter,
          zoom: 13,
          duration: 2000,
          essential: true
        });

        onMapReady(map);
      });

      // Gérer les clics
      if (interactive) {
        map.on('click', handleMapClick);
      }

      // Gérer les erreurs
      map.on('error', (e) => {
        console.warn('Erreur de carte:', e);
      });

    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (blinkingMarkerRef.current) {
        blinkingMarkerRef.current.remove();
        blinkingMarkerRef.current = null;
      }
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      setIsMapLoaded(false);
    };
  }, []);

  // Changer le style de carte
  // NOUVEAU CODE
  const changeMapStyle = useCallback((newStyle: 'streets' | 'hybrid') => {
    if (!mapInstanceRef.current || !isMapLoaded) return;
    
    // On met à jour le style de la carte avec la nouvelle URL
    mapInstanceRef.current.setStyle(mapStyles[newStyle]);

    // On garde en mémoire le style actuel pour l'UI des boutons
    setCurrentStyle(newStyle);

  }, [isMapLoaded, mapStyles]); // mapStyles doit être une dépendance maintenant

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Container de la carte */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      
      {/* Indicateur de chargement */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Chargement de la carte de Yaoundé...</p>
          </div>
        </div>
      )}

      {/* Contrôles de style */}
      {interactive && isMapLoaded && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg flex space-x-2 z-10">
          <button
            onClick={() => changeMapStyle('streets')}
            title="Vue Routes"
            className={`p-2 rounded-md transition-all duration-200 ${
              currentStyle === 'streets' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Layers size={18} />
          </button>
          <button
            onClick={() => changeMapStyle('hybrid')}
            title="Vue Satellite"
            className={`p-2 rounded-md transition-all duration-200 ${
              currentStyle === 'hybrid' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Globe2 size={18} />
          </button>
        </div>
      )}

      {/* Info sur la ville */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md z-10">
        <div className="flex items-center space-x-2">
          <Pin size={16} className="text-red-500" />
          <span className="text-sm font-medium text-gray-800">Yaoundé, Cameroun</span>
        </div>
      </div>
    </div>
  );
};

export default MapComponentMapLibre;
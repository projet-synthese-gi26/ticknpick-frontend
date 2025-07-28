'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { PointRelais } from './RelaisData'; // Assurez-vous que le chemin est correct

interface FitBoundsProps {
  points: PointRelais[];
}

const FitBoundsToMarkers: React.FC<FitBoundsProps> = ({ points }) => {
  const map = useMap(); // Le hook magique pour accéder à l'instance de la carte

  useEffect(() => {
    // Si il n'y a pas de points, on ne fait rien
    if (!points || points.length === 0) {
      return;
    }

    // 1. Crée un tableau de coordonnées [lat, lng] pour Leaflet
    const latLngs = points.map(point => L.latLng(point.lat, point.lng));

    // 2. Calcule les limites (le cadre) qui englobe tous ces points
    const bounds = L.latLngBounds(latLngs);

    // 3. Demande à la carte de s'ajuster à ces limites
    // Le "padding" ajoute un peu d'espace sur les bords pour que les marqueurs ne soient pas collés
    map.fitBounds(bounds, {
      padding: [50, 50], // 50px de marge sur les bords
      maxZoom: 15, // Empêche de trop zoomer si il n'y a qu'un seul point
    });

  }, [points, map]); // Cet effet se redéclenchera si la liste de points change

  // Ce composant ne rend rien de visible, il ne fait qu'agir sur la carte
  return null;
};

export default FitBoundsToMarkers;
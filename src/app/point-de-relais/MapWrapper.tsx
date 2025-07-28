"use client";

import dynamic from 'next/dynamic';

// Chargement dynamique du composant Map sans SSR
const Map = dynamic(() => import('./YaoundeMap'), {
  ssr: false,
  loading: () => <p>Chargement de la carte...</p>
});

export default function MapWrapper(props) {
  return <Map {...props} />;
}
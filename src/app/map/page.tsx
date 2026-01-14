'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  MapPin, 
  Phone, 
  Search, 
  X, 
  Loader2, 
  Navigation, 
  Crosshair, 
  Clock, 
  ArrowRight,
  ShieldCheck 
} from 'lucide-react';

// Note: On n'importe PAS L from 'leaflet' ici pour éviter l'erreur SSR.
// On importe uniquement le CSS.
import 'leaflet/dist/leaflet.css';

// Import du service et des composants
import { relayPointService, RelayPoint } from '@/services/relayPointService';
import NavbarHome from '@/components/NavbarHome';

// --- UTILITAIRES & TYPES ---

// Fonction pour nettoyer le numéro WhatsApp
const getWhatsappUrl = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${clean}`;
};

// Fonction calcul distance à vol d'oiseau pour la proximité (pour faire clignoter les points)
const calculateHaversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

export default function MapPage() {
  // Références Map & Leaflet
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null); // Type 'any' car L n'est pas importé statiquement
  const leafletRef = useRef<any>(null); // Référence au module Leaflet (L)
  const routeLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // États Données
  const [points, setPoints] = useState<RelayPoint[]>([]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [nearbyIds, setNearbyIds] = useState<Set<string>>(new Set());

  // États UI
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<RelayPoint | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string} | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  // 1. GÉOLOCALISATION INITIALE
  useEffect(() => {
    if ("geolocation" in navigator) {
      console.log('📍 [GPS] Recherche position utilisateur...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
           console.log('✅ [GPS] Position trouvée:', pos.coords);
           setUserPos([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
           console.warn('⚠️ [GPS] Géoloc échouée ou refusée, fallback sur Douala', err);
           setUserPos([4.0511, 9.7679]); // Centre Douala par défaut
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
        setUserPos([4.0511, 9.7679]);
    }
  }, []);

  // 2. CHARGEMENT DONNÉES BACKEND
  useEffect(() => {
    const initData = async () => {
        setIsLoading(true);
        console.group('🌐 [API] Chargement Points Relais');
        
        try {
            const data = await relayPointService.getAllRelayPoints();
            console.log(`📦 [API] Payload reçu: ${data.length} points`, data);
            
            // Filtrage basique
            const validPoints = data.filter(p => p.latitude && p.longitude && p.is_active !== false);
            setPoints(validPoints);

        } catch (err) {
            console.error("❌ [API] Erreur:", err);
        } finally {
            setIsLoading(false);
            console.groupEnd();
        }
    };
    initData();
  }, []);

  // 3. INITIALISATION LEAFLET (Dynamique pour éviter window is not defined)
  useEffect(() => {
      // Attendre la position et les données pour charger la map
      if(!userPos || typeof window === 'undefined') return;
      if(mapInstanceRef.current) return; // Déjà init

      const loadMap = async () => {
          console.log('🗺️ [Map] Chargement dynamique de Leaflet...');
          
          // IMPORT DYNAMIQUE QUI FIXE L'ERREUR
          const L = (await import('leaflet')).default;
          leafletRef.current = L;

          if(!mapContainerRef.current) return;

          // Création carte
          const map = L.map(mapContainerRef.current, {
              center: userPos,
              zoom: 14,
              zoomControl: false // On gère les boutons nous-mêmes si besoin
          });

          // Style moderne (CartoDB Voyager - très propre)
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
              attribution: '&copy; OpenStreetMap &copy; CARTO',
              maxZoom: 20
          }).addTo(map);

          // Icone Utilisateur (Pulse Bleu)
          const userIconHtml = `
            <div class="relative flex items-center justify-center w-6 h-6">
                <div class="absolute w-full h-full bg-blue-500/50 rounded-full animate-ping"></div>
                <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-md"></div>
            </div>
          `;
          const userIcon = L.divIcon({
              html: userIconHtml,
              className: 'bg-transparent border-none',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
          });

          L.marker(userPos, { icon: userIcon, zIndexOffset: 1000 }).addTo(map)
             .bindPopup("Votre position actuelle");

          mapInstanceRef.current = map;
      };

      loadMap();
  }, [userPos]);

  // 4. RENDU DES MARQUEURS ET CALCUL PROXIMITÉ
  useEffect(() => {
      if(!mapInstanceRef.current || !leafletRef.current || points.length === 0) return;

      const map = mapInstanceRef.current;
      const L = leafletRef.current;

      console.log('📍 [Map] Mise à jour des marqueurs...');

      // Clean
      markersRef.current.forEach((m:any) => map.removeLayer(m));
      markersRef.current = [];
      if(routeLayerRef.current) map.removeLayer(routeLayerRef.current);

      const newNearby = new Set<string>();

      points.forEach(point => {
          // Check Proximité
          if(userPos) {
              const d = calculateHaversine(userPos[0], userPos[1], point.latitude, point.longitude);
              if(d <= 10) newNearby.add(point.id);
          }

          const isNearby = userPos && calculateHaversine(userPos[0], userPos[1], point.latitude, point.longitude) <= 10;
          const isSelected = selectedPoint?.id === point.id;

          // HTML Icone (Orange House)
          const iconHtml = `
            <div class="relative group transition-all duration-300 transform ${isSelected ? 'scale-125 -translate-y-2' : 'hover:scale-110'}">
                ${isNearby ? `<div class="absolute -inset-3 bg-orange-500/20 rounded-full animate-ping pointer-events-none"></div>` : ''}
                <div class="relative w-10 h-10 bg-white rounded-2xl shadow-xl border-2 ${isSelected ? 'border-orange-600 bg-orange-50' : 'border-white'} flex items-center justify-center text-orange-500 overflow-hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                </div>
                ${isSelected ? '<div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-orange-600"></div>' : ''}
            </div>
          `;

          const icon = L.divIcon({
              html: iconHtml,
              className: 'bg-transparent border-none',
              iconSize: [40, 40],
              iconAnchor: [20, 40]
          });

          const marker = L.marker([point.latitude, point.longitude], { icon })
            .addTo(map)
            .on('click', () => {
                console.log(`🎯 [Click] Relais: ${point.relayPointName}`);
                handleSelectPoint(point);
            });
            
          markersRef.current.push(marker);
      });

      setNearbyIds(newNearby);

  }, [points, userPos, selectedPoint]);

  // Fonction Helper: Sélectionner et centrer
  const handleSelectPoint = (point: RelayPoint) => {
      setSelectedPoint(point);
      setRouteInfo(null);
      // Supprimer route précédente si changement de point
      if(routeLayerRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(routeLayerRef.current);
          routeLayerRef.current = null;
      }
      
      if(mapInstanceRef.current) {
          // Centrage léger pour laisser la place au panneau du bas sur mobile
          const offsetLat = window.innerWidth < 768 ? -0.005 : 0; 
          mapInstanceRef.current.flyTo(
              [point.latitude + offsetLat, point.longitude], 
              16, 
              { duration: 1.2 }
          );
      }
  };

  // --- TRACER ITINÉRAIRE (API OSRM) ---
  const handleDrawRoute = async () => {
      if(!userPos || !selectedPoint || !mapInstanceRef.current || !leafletRef.current) return;
      
      setCalculatingRoute(true);
      const L = leafletRef.current;
      const map = mapInstanceRef.current;

      try {
          const start = `${userPos[1]},${userPos[0]}`; // lng,lat
          const end = `${selectedPoint.longitude},${selectedPoint.latitude}`;
          
          console.log(`🚗 [Route] Calcul itinéraire OSRM: ${start} -> ${end}`);
          
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`);
          const json = await res.json();

          if(json.routes && json.routes.length > 0) {
              const route = json.routes[0];
              const coords = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]); // lat,lng pour Leaflet
              
              // Affichage stats
              const distKm = (route.distance / 1000).toFixed(1);
              const durMin = Math.round(route.duration / 60);
              setRouteInfo({ distance: `${distKm} km`, duration: `${durMin} min` });

              // Dessin Ligne
              if(routeLayerRef.current) map.removeLayer(routeLayerRef.current);
              
              const polyline = L.polyline(coords, {
                  color: '#f97316', // Orange
                  weight: 5,
                  opacity: 0.8,
                  lineJoin: 'round'
              }).addTo(map);

              // Fit bounds pour voir tout le trajet
              map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
              
              routeLayerRef.current = polyline;
              console.log('✅ [Route] Chemin tracé avec succès.');
          } else {
              alert("Impossible de calculer l'itinéraire.");
          }
      } catch (error) {
          console.error("Erreur Route:", error);
      } finally {
          setCalculatingRoute(false);
      }
  };

  // Recentrer sur soi
  const handleRecenter = () => {
      if(userPos && mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(userPos, 15, { animate: true });
      } else {
          alert("Position non disponible");
      }
  };

  const filteredPoints = useMemo(() => {
      if(!searchTerm) return points;
      const lower = searchTerm.toLowerCase();
      return points.filter(p => 
         p.relayPointName.toLowerCase().includes(lower) || 
         (p.locality && p.locality.toLowerCase().includes(lower))
      );
  }, [searchTerm, points]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden flex-col">
        
        {/* Navbar */}
        <div className="relative z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm">
             <NavbarHome />
             {/* Compensateur hauteur pour la navbar fixed */}
             <div className="h-16 lg:hidden" /> 
        </div>

        {/* LAYOUT CONTENU */}
        <div className="flex flex-1 mt-16 relative overflow-hidden">
             
             {/* 1. SIDEBAR LISTE (Visible Desktop) */}
             <div className={`
                 hidden lg:flex w-96 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl z-30
             `}>
                 <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                     <div className="relative">
                         <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                         <input 
                            type="text" 
                            placeholder="Chercher un point relais..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                         />
                     </div>
                 </div>

                 <div className="flex-1 overflow-y-auto p-2 space-y-2">
                     {isLoading ? (
                         <div className="py-10 flex flex-col items-center text-orange-500">
                             <Loader2 className="w-8 h-8 animate-spin"/>
                             <p className="text-xs font-bold mt-2 uppercase">Chargement...</p>
                         </div>
                     ) : (
                         filteredPoints.map(p => {
                             const isActive = selectedPoint?.id === p.id;
                             return (
                                 <div 
                                    key={p.id}
                                    onClick={() => handleSelectPoint(p)}
                                    className={`
                                        p-4 rounded-xl cursor-pointer border transition-all duration-200
                                        ${isActive 
                                           ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-500 shadow-md transform scale-[1.02]' 
                                           : 'bg-white dark:bg-slate-800 border-transparent hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:border-gray-200'
                                        }
                                    `}
                                 >
                                      <div className="flex items-center gap-3">
                                          <div className={`p-2 rounded-lg ${isActive ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500'}`}>
                                              <Home className="w-5 h-5"/>
                                          </div>
                                          <div>
                                              <h4 className={`text-sm font-bold ${isActive ? 'text-orange-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>{p.relayPointName}</h4>
                                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{p.locality || "Ville"} • {p.address}</p>
                                          </div>
                                      </div>
                                 </div>
                             );
                         })
                     )}
                 </div>
             </div>

             {/* 2. MAP AREA */}
             <div className="flex-1 relative z-10 bg-slate-200 dark:bg-black">
                 
                 {/* La carte est attachée ici */}
                 <div ref={mapContainerRef} className="absolute inset-0 z-0 outline-none" />

                 {/* BOUTON GEOLOCALISATION */}
                 <button 
                    onClick={handleRecenter}
                    className="absolute bottom-24 lg:bottom-8 right-4 lg:right-8 bg-white dark:bg-slate-800 text-slate-700 dark:text-white p-3 rounded-full shadow-lg border border-gray-100 dark:border-slate-600 hover:scale-110 active:scale-95 transition z-[400]"
                    title="Ma Position"
                 >
                     <Crosshair className="w-6 h-6"/>
                 </button>

                 {/* 3. MODAL DU BAS (BOTTOM SHEET) */}
                 <AnimatePresence>
                     {selectedPoint && (
                         <motion.div 
                             initial={{ y: "100%", opacity: 0 }} 
                             animate={{ y: 0, opacity: 1 }} 
                             exit={{ y: "100%", opacity: 0 }} 
                             transition={{ type: "spring", damping: 25, stiffness: 200 }}
                             className="absolute bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-[400px] z-[500]"
                         >
                             <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden relative">
                                  {/* Close Btn */}
                                  <button onClick={() => setSelectedPoint(null)} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 z-10">
                                      <X className="w-4 h-4"/>
                                  </button>

                                  {/* Cover Color */}
                                  <div className="h-24 bg-gradient-to-r from-orange-500 to-amber-500 p-6 flex items-end">
                                      <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                          <ShieldCheck className="w-3 h-3"/> Partenaire Certifié
                                      </div>
                                  </div>

                                  {/* Content */}
                                  <div className="p-6 pt-2">
                                       <div className="-mt-10 mb-4 inline-block p-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
                                           <div className="w-16 h-16 bg-orange-50 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-orange-100 dark:border-slate-700">
                                               <Home className="w-8 h-8 text-orange-600"/>
                                           </div>
                                       </div>

                                       <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight mb-1">{selectedPoint.relayPointName}</h2>
                                       <div className="flex items-center text-slate-500 text-xs mb-4 font-medium">
                                           <MapPin className="w-3.5 h-3.5 mr-1"/> {selectedPoint.address || "Adresse inconnue"} • {selectedPoint.locality}
                                       </div>

                                       {/* Bloc Trajet Infos si calculé */}
                                       {routeInfo && (
                                           <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex items-center justify-between text-blue-800 dark:text-blue-300">
                                                <div className="flex items-center gap-2 font-bold text-sm">
                                                    <Clock className="w-4 h-4"/> {routeInfo.duration}
                                                </div>
                                                <div className="flex items-center gap-2 font-bold text-sm">
                                                    <Navigation className="w-4 h-4"/> {routeInfo.distance}
                                                </div>
                                           </motion.div>
                                       )}

                                       {/* Actions Grid */}
                                       <div className="grid grid-cols-2 gap-3 mt-4">
                                            {/* Bouton Itinéraire */}
                                            <button 
                                                onClick={handleDrawRoute}
                                                disabled={calculatingRoute}
                                                className="col-span-2 md:col-span-1 flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-70"
                                            >
                                                {calculatingRoute ? <Loader2 className="w-4 h-4 animate-spin"/> : <Navigation className="w-4 h-4"/>}
                                                {routeInfo ? 'Mettre à jour' : 'Itinéraire'}
                                            </button>

                                            {/* Bouton WhatsApp */}
                                            {selectedPoint.phoneNumber ? (
                                                <a 
                                                    href={getWhatsappUrl(selectedPoint.phoneNumber)} 
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="col-span-2 md:col-span-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
                                                >
                                                    <Phone className="w-4 h-4"/> WhatsApp
                                                </a>
                                            ) : (
                                                <button disabled className="col-span-2 md:col-span-1 py-3 bg-gray-100 text-gray-400 rounded-xl font-bold text-sm cursor-not-allowed border border-gray-200">
                                                    Indisponible
                                                </button>
                                            )}
                                       </div>
                                  </div>
                             </div>
                         </motion.div>
                     )}
                 </AnimatePresence>
             </div>
        </div>

        {/* CSS GLOBAL POUR MARKER SANS BORDER */}
        <style jsx global>{`
            .leaflet-div-icon {
                background: transparent !important;
                border: none !important;
            }
        `}</style>
    </div>
  );
}
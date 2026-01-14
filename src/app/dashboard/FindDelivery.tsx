'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Package, RefreshCw, Loader2, MapPin, X, Navigation, AlertCircle, 
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Imports Services
import { delivererService, DelivererPackage } from '@/services/delivererService';
import { relayPointService, RelayPoint } from '@/services/relayPointService';
import router, { useRouter } from 'next/navigation';

// Styles
import 'leaflet/dist/leaflet.css';
import PackageSidebar from './PackageSidebar';

// Chargement Leaflet dynamique
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const useMap = dynamic(() => import('react-leaflet').then(m => m.useMap), { ssr: false });

// Helper Distance (Haversine)
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

interface PackageWithLocation extends DelivererPackage {
    lat: number;
    lng: number;
    relayName: string;
}

interface FindDeliveryProps {
    onSelectPackage: (pkg: DelivererPackage) => void;
    onClose: () => void;
}
// ----------------------------------------------------------------------------
// MAP CONTROLLER (Itinéraire et Markers) - VERSION CORRIGÉE
// ----------------------------------------------------------------------------
const MapController = ({ 
    userPos, selectedPackage, packages, onSelect 
}: { 
    userPos: [number, number] | null, 
    selectedPackage: PackageWithLocation | null, 
    packages: PackageWithLocation[], 
    onSelect: (p: PackageWithLocation) => void
}) => {
    const map = (useMap as any)();
    const [L, setL] = useState<any>(null);
    const [routeLayer, setRouteLayer] = useState<any>(null);

    // Initialisation Leaflet une seule fois
    useEffect(() => {
        import('leaflet').then(mod => {
            setL(mod.default);
            // Hack pour corriger les chemins d'icônes par défaut
            // @ts-ignore
            delete mod.default.Icon.Default.prototype._getIconUrl;
            mod.default.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            });
        });
    }, []);

    // GESTION DU TRACÉ D'ITINÉRAIRE - VERSION CORRIGÉE
    useEffect(() => {
        // Vérifications complètes incluant map.addLayer
        if (!L || !map || !userPos || !selectedPackage) return;
        
        // ⚠️ CORRECTION PRINCIPALE : Vérifier que map est bien initialisé
        if (typeof map.addLayer !== 'function') {
            console.warn('Map pas encore prête, attente...');
            return;
        }

        // 1. Supprimer l'ancienne ligne
        if (routeLayer) {
            try {
                map.removeLayer(routeLayer);
            } catch (e) {
                console.warn('Erreur suppression ancienne route:', e);
            }
        }

        // 2. Tracer la nouvelle ligne
        try {
            const latlngs = [
                userPos, // Départ (Livreur)
                [selectedPackage.lat, selectedPackage.lng] // Arrivée (Colis)
            ];

            const polyline = L.polyline(latlngs, {
                color: '#8b5cf6',
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 10',
                lineJoin: 'round'
            });

            // ⚠️ UTILISATION SÉCURISÉE de addLayer
            if (map && typeof map.addLayer === 'function') {
                polyline.addTo(map);
                setRouteLayer(polyline);

                // 3. Zoom pour voir le trajet entier
                map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
            }
        } catch (error) {
            console.error('❌ Erreur création itinéraire:', error);
        }

        // Cleanup
        return () => {
            if (routeLayer && map && typeof map.removeLayer === 'function') {
                try {
                    map.removeLayer(routeLayer);
                } catch (e) {
                    console.warn('Cleanup route:', e);
                }
            }
        };
    }, [L, map, userPos, selectedPackage]); // ⚠️ Retirer routeLayer des dépendances


    // RENDU DES MARQUEURS
    if (!L) return null;

    // Icône Livreur
    const userIcon = L.divIcon({
        html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md animate-pulse"></div>',
        className: 'bg-transparent',
        iconSize: [16, 16]
    });

    return (
        <>
            {userPos && (
                <Marker position={userPos} icon={userIcon}>
                    <Popup>Ma Position</Popup>
                </Marker>
            )}
            
            {packages.map(p => {
                const dist = userPos ? getDistanceKm(userPos[0], userPos[1], p.lat, p.lng) : 10;
                const isNear = dist <= 5;
                const isSelected = selectedPackage?.id === p.id;

                const iconHtml = `
                    <div class="relative w-10 h-10 flex items-center justify-center group cursor-pointer">
                        ${isNear ? '<div class="absolute w-full h-full bg-red-500/40 rounded-full animate-ping"></div>' : ''}
                        <div class="relative z-10 w-8 h-8 ${isSelected ? 'bg-orange-500 scale-110 border-orange-200' : 'bg-violet-600 border-white'} hover:bg-violet-700 text-white rounded-xl shadow-lg border-2 flex items-center justify-center transition-all duration-300">
                            📦
                        </div>
                        ${isSelected ? '<div class="absolute -bottom-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-orange-500"></div>' : ''}
                    </div>
                `;

                const pkgIcon = L.divIcon({
                    html: iconHtml,
                    className: 'bg-transparent',
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });

                return (
                    <Marker 
                        key={p.id} 
                        position={[p.lat, p.lng]} 
                        icon={pkgIcon}
                        eventHandlers={{
                            click: () => onSelect(p)
                        }}
                    />
                );
            })}
        </>
    );
};

// -- COMPOSANT PRINCIPAL DE LA PAGE --
export default function FindDelivery({ onSelectPackage, onClose }: FindDeliveryProps) {
    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState<PackageWithLocation[]>([]);
    const [userPos, setUserPos] = useState<[number, number] | null>(null);
    const [statusMsg, setStatusMsg] = useState("Recherche de colis...");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const [activePkg, setActivePkg] = useState<PackageWithLocation | null>(null);

    useEffect(() => {
        // Geolocalisation navigateur
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
                (err) => {
                    console.warn("GPS non disponible, fallback Yaoundé");
                    setUserPos([3.8480, 11.5021]); 
                }
            );
        } else {
            setUserPos([3.8480, 11.5021]);
        }
        
        // Charger les données
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        setStatusMsg("Chargement des disponibilités...");
        
        try {
            // 1. Récupérer les colis
            const availablePkgs = await delivererService.getAvailablePackages();
            console.log("📦 Colis disponibles:", availablePkgs);

            if(availablePkgs.length === 0) {
                setPackages([]);
                setStatusMsg("Aucun colis disponible pour le moment.");
                setLoading(false);
                return;
            }
            
            // 2. Extraire IDs relais uniques
            const relayIds = new Set<string>();
            availablePkgs.forEach(p => {
                const rid = p.currentRelayPointId || p.departureRelayPointId;
                if(rid) relayIds.add(rid);
            });

            console.log(`📍 ${relayIds.size} relais uniques à localiser.`);
            
            // 3. Récupérer détails relais (Nom + GPS) avec tolérance à l'erreur
            const relaysMap = new Map<string, RelayPoint>();
            let failedCount = 0;

            await Promise.allSettled(
                Array.from(relayIds).map(async (rid) => {
                    try {
                        const rp = await relayPointService.getRelayPointById(rid);
                        if(rp && rp.latitude && rp.longitude) {
                            relaysMap.set(rid, rp);
                        } else {
                            console.warn(`⚠️ Relais ${rid} : coordonnées manquantes`);
                            failedCount++;
                        }
                    } catch (e) {
                        console.warn(`⚠️ Relais ${rid} inaccessible (404/Err)`);
                        failedCount++;
                    }
                })
            );

            // 4. Mapper Colis -> Location
            const finalMap: PackageWithLocation[] = [];
            
            availablePkgs.forEach(p => {
                const rid = p.currentRelayPointId || p.departureRelayPointId;
                // Si on a les coordonnées du relais, on l'ajoute
                if(rid && relaysMap.has(rid)) {
                    const rData = relaysMap.get(rid)!;
                    finalMap.push({
                        ...p,
                        lat: rData.latitude,
                        lng: rData.longitude,
                        relayName: rData.relayPointName
                    });
                }
            });

            setPackages(finalMap);
            
            // Gestion affichage si partiel
            if(finalMap.length === 0 && availablePkgs.length > 0) {
                setError("Colis trouvés mais leurs points relais ne sont pas géolocalisés.");
            } else if(failedCount > 0) {
                setStatusMsg(`${finalMap.length} affichés (${failedCount} relais masqués car données inaccessibles)`);
            }

        } catch (e: any) {
            console.error("❌ Erreur Fatale FindDelivery:", e);
            setError(e.message || "Erreur de chargement des données");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 w-full absolute inset-0 z-50">
             
             {/* HEADER */}
             <div className="px-6 py-4 bg-violet-900 text-white flex justify-between items-center shadow-lg z-20 shrink-0">
                 <div>
                     <h2 className="font-bold text-lg flex items-center gap-2">
                         <MapPin className="w-5 h-5"/> Carte des Offres
                     </h2>
                     <p className="text-xs text-violet-200">
                         {loading ? statusMsg : error ? "Erreur de chargement" : `${packages.length} courses trouvées`}
                     </p>
                 </div>
                 <div className="flex gap-2">
                    {/* Nouveau bouton Retour Dashboard */}
                     <button 
                         onClick={onClose}
                         className="flex items-center gap-2 text-violet-200 hover:text-white transition font-semibold text-xs md:text-sm whitespace-nowrap bg-white/10 px-3 py-1.5 rounded-lg border border-white/20"
                     >
                         <ArrowLeft className="w-4 h-4"/> 
                         <span className="hidden sm:inline">Mes Livraisons</span>
                     </button>
                     <button 
                         onClick={fetchData} 
                         disabled={loading}
                         className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition disabled:opacity-50"
                     >
                         <RefreshCw className={`w-5 h-5 ${loading?'animate-spin':''}`}/>
                     </button>
                     <button 
                         onClick={() => router.push('/home')}
                         className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition shadow"
                     >
                         <X className="w-5 h-5"/>
                     </button>
                 </div>
             </div>

             {/* MAP CONTAINER */}
             <div className="flex-1 relative bg-slate-200 dark:bg-slate-800 z-10 overflow-hidden">
                 {/* Overlay de chargement */}
                 {loading && (
                     <div className="absolute inset-0 z-[1000] bg-white/60 dark:bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-violet-700 dark:text-violet-300 font-bold">
                         <Loader2 className="w-12 h-12 mb-3 animate-spin"/>
                         <span>{statusMsg}</span>
                     </div>
                 )}

                 {/* Message d'erreur */}
                 {error && !loading && (
                     <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] max-w-md">
                         <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
                             <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                             <div className="flex-1">
                                 <p className="font-semibold text-sm">Erreur</p>
                                 <p className="text-xs mt-1">{error}</p>
                             </div>
                             <button 
                                 onClick={() => setError(null)}
                                 className="text-white/80 hover:text-white"
                             >
                                 <X className="w-4 h-4"/>
                             </button>
                         </div>
                     </div>
                 )}

                 {/* Message si aucun colis */}
                 {!loading && !error && packages.length === 0 && (
                     <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center text-slate-600 dark:text-slate-400">
                         <Package className="w-16 h-16 mb-4 opacity-50"/>
                         <p className="font-semibold text-lg">Aucun colis disponible</p>
                         <p className="text-sm mt-2">Revenez plus tard ou actualisez</p>
                         <button 
                             onClick={fetchData}
                             className="mt-4 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
                         >
                             Actualiser
                         </button>
                     </div>
                 )}

                 {/* Map Leaflet */}
                 {typeof window !== 'undefined' && (
                     <MapContainer 
                        center={userPos || [3.8480, 11.5021]} 
                        zoom={13} 
                        style={{width:'100%', height:'100%', zIndex: 0}}
                        zoomControl={false}
                     >
                        <TileLayer 
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OSM'
                        />
                        {/* Contrôleur Interne */}
                        <MapController 
                            userPos={userPos} 
                            packages={packages} 
                            selectedPackage={activePkg}
                            onSelect={setActivePkg}
                        />
                     </MapContainer>
                 )}

                 {/* SIDEBAR : Détails du Colis Sélectionné */}
                 <PackageSidebar 
                     isOpen={!!activePkg}
                     pkg={activePkg!}
                     onClose={() => setActivePkg(null)}
                                          onAssign={() => {
                         // --- LA CORRECTION PRINCIPALE EST ICI ---
                         // Vérifie si la prop existe avant de l'appeler
                         if (activePkg && typeof onSelectPackage === 'function') {
                             onSelectPackage(activePkg);
                         } else {
                             console.error("onSelectPackage prop manquante ou invalide");
                         }
                     }}
                     showAction={true}
                     actionLabel="ACCEPTER CETTE COURSE"
                 />
                 
             </div>
        </div>
    );
}
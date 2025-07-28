"use client";

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import DeliveryConfirmationPopup from './DeliveryMessage';
import 'leaflet/dist/leaflet.css';
import Navbar from '@/components/Navbar';
import { MapPin, Clock, Shield, Search, Navigation, Package, Store, Building2, MapPinned, CircleAlert, ChevronRight, Filter, Landmark, ArrowBigRightDash, Plane } from 'lucide-react';
import MapWrapper from './MapWrapper';
import yaoundePointsRelais, { PointRelais, YAOUNDE_CENTER, YAOUNDE_ZOOM, YAOUNDE_BOUNDS, findNearbyPoints, filterPointsBySearch, calculateDistance, NEARBY_RADIUS } from './RelaisData';
import { yaoundeInterestPoints, searchInterestPoints, InterestPoint } from './PointsInteretData';

// Centre par défaut (Yaoundé)
const center = [YAOUNDE_CENTER[0], YAOUNDE_CENTER[1]];

// Type definitions
interface FilterTypes {
  types: { bureau: boolean; commerce: boolean; agence: boolean };
  services: string[];
}

interface RouteData {
  positions: [number, number][];
}

// Création de l'icône Leaflet avec Tailwind classes
const createLeafletIcon = (type: string, isActive = false) => {
  const iconColors = {
    user: '#3b82f6',
    click: '#ef4444',
    bureau: '#f59e0b',
    commerce: '#10b981',
    agence: '#8b5cf6',
    landmark: '#ec4899',
  };

  const color = iconColors[type] || iconColors.bureau;
  const scale = type === 'landmark' ? (isActive ? 2 : 1.8) : (isActive ? 1.5 : 1);
  
  if (type === 'landmark') {
    return L.divIcon({
      className: 'landmark-icon',
      html: `
        <div class="relative" style="width:${36 * scale}px;height:${36 * scale}px">
          <div class="absolute flex items-center justify-center rounded-tl-full rounded-tr-full rounded-bl-0 rounded-br-full border-3 border-white shadow-md" 
               style="width:${36 * scale}px;height:${36 * scale}px;background-color:${color};transform:rotate(-45deg);${isActive ? 'animation:pulse 1.5s infinite' : ''}">
            <div class="rounded-full bg-white" style="width:${10 * scale}px;height:${10 * scale}px;transform:rotate(45deg)"></div>
          </div>
          <div class="landmark-label absolute w-max max-w-[150px] text-center font-bold text-sm whitespace-nowrap overflow-hidden text-ellipsis" 
               style="top:-25px;left:50%;transform:translateX(-50%);color:${color};text-shadow:0px 0px 3px white, 0px 0px 3px white;display:block;opacity:1"></div>
        </div>
        <style>
          @keyframes pulse {
            0% { transform: rotate(-45deg) scale(1); opacity: 1; }
            50% { transform: rotate(-45deg) scale(1.2); opacity: 0.8; }
            100% { transform: rotate(-45deg) scale(1); opacity: 1; }
          }
        </style>
      `,
      iconSize: [36 * scale, 36 * scale],
      iconAnchor: [18 * scale, 36 * scale],
      popupAnchor: [0, -36 * scale]
    });
  }
  
  return L.divIcon({
    className: '',
    html: `
      <div class="flex items-center justify-center rounded-full border-2 border-white shadow-md" 
           style="width:${24 * scale}px;height:${24 * scale}px;background-color:${color};${isActive ? 'animation:pulse 1.5s infinite' : ''}">
        <div class="rounded-full bg-white" style="width:${8 * scale}px;height:${8 * scale}px"></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
    `,
    iconSize: [24 * scale, 24 * scale],
    iconAnchor: [12 * scale, 12 * scale],
    popupAnchor: [0, -12 * scale]
  });
};

// Composant pour centrer la carte
const ChangeMapView = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) map.flyTo(position, 15, { animate: true, duration: 1 });
  }, [map, position]);
  
  return null;
};

// Composant pour la carte des points relais
const PointRelaisCard = ({ 
  point, 
  onSelect, 
  onRoute, 
  userPosition, 
  isActive 
}: { 
  point: PointRelais; 
  onSelect: (lat: number, lng: number, id: string) => void; 
  onRoute: (id: string) => void; 
  userPosition: [number, number] | null; 
  isActive: boolean 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const recipientEmail = "nguetchochlogabrielle@gmail.com";

  const handleDeliveryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userPosition) {
      alert("Veuillez activer votre géolocalisation pour utiliser cette fonctionnalité");
      return;
    }
    setShowConfirmation(true);
    onRoute(point.id);
  };

  const getTypeInfo = (type: string) => {
    switch(type) {
      case 'bureau': 
        return { 
          label: 'Bureau postal', 
          icon: <Building2 className="h-4 w-4 text-amber-500" />,
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-800'
        };
      case 'commerce': 
        return { 
          label: 'Commerce partenaire', 
          icon: <Store className="h-4 w-4 text-emerald-500" />,
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-800'
        };
      case 'agence': 
        return { 
          label: 'Agence', 
          icon: <Package className="h-4 w-4 text-purple-500" />,
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800'
        };
      default: 
        return { 
          label: 'Point relais', 
          icon: <MapPin className="h-4 w-4 text-blue-500" />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800'
        };
    }
  };
  
  const typeInfo = getTypeInfo(point.type);
  const distance = userPosition 
    ? calculateDistance(userPosition[0], userPosition[1], point.lat, point.lng).toFixed(1)
    : null;

  return (
    <div 
      id={`point-${point.id}`}
      ref={cardRef}
      className={`bg-white rounded-xl shadow-md p-4 mb-4 cursor-pointer transition-all duration-200 ${
        isActive 
          ? 'ring-2 ring-indigo-600 transform scale-[1.02] shadow-lg' 
          : 'hover:shadow-lg hover:-translate-y-1 border border-gray-100'
      }`}
      onClick={() => onSelect(point.lat, point.lng, point.id)}
      aria-label={`Point relais ${point.name} à ${point.quartier}`}
    >
      {/* En-tête avec type et proximité */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeInfo.bgColor} ${typeInfo.textColor}`}>
            {typeInfo.icon}
          </div>
          <div className="ml-3">
            <h3 className="font-bold text-gray-800">{point.quartier}</h3>
            <div className="flex items-center text-xs text-gray-500">
              {typeInfo.icon}
              <span className="ml-1">{typeInfo.label}</span>
            </div>
          </div>
        </div>
        
        {point.isNearby && (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
            <Navigation className="h-3 w-3 mr-1" /> Proche
          </span>
        )}
      </div>

      {/* Corps de la carte */}
      <div className="mt-3">
        <h4 className="font-semibold text-gray-800 text-lg">{point.name}</h4>
        
        {/* Adresse */}
        <div className="flex items-start mt-2">
          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
          <p className="text-sm text-gray-600">{point.address}</p>
        </div>
        
        {/* Horaires */}
        <div className="flex items-center mt-1">
          <Clock className="h-4 w-4 text-gray-400 mr-1" />
          <p className="text-xs text-gray-500">{point.hours}</p>
        </div>
        
        {/* Services */}
        {point.services.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {point.services.map((service, idx) => (
              <span 
                key={`${point.id}-service-${idx}`} 
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
              >
                {service}
              </span>
            ))}
          </div>
        )}

        {/* Pied de carte avec distance et bouton */}
        <div className="mt-3 flex justify-between items-center">
          {distance ? (
            <>
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm font-medium text-gray-700">
                  {distance} km
                </span>
              </div>
              {/* Bouton de livraison */}
              <button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm flex items-center shadow-sm hover:shadow-md transition-all"
                onClick={handleDeliveryClick}
              >
                <Plane className="h-4 w-4 mr-1" />
                Me livrer ici
              </button>

              {/* Popup de confirmation */}
              {showConfirmation && (
                <DeliveryConfirmationPopup 
                  onClose={() => setShowConfirmation(false)}
                  email="nguetchochlogabrielle@gmail.com"
                />
              )}
            </>
          ) : (
            <div className="text-sm text-gray-500 w-full text-center py-2">
              Activez la géolocalisation pour voir la distance
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant pour les points d'intérêt
const InterestPointCard = ({ point, onSelect, isActive = false }: InterestPointCardProps) => (
  <div
    id={`interest-${point.id}`}
    className={`bg-white rounded-xl shadow-md p-4 mb-4 cursor-pointer transition-all duration-200 ${
      isActive ? 'ring-2 ring-pink-600 transform scale-[1.02]' : 'hover:shadow-lg hover:-translate-y-1 border border-gray-100'
    }`}
    onClick={() => onSelect(point.lat, point.lng, point.id)}
  >
    <div className="flex text-black justify-between items-start mb-3">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-pink-100 text-pink-800">
          <Landmark className="h-5 w-5" />
        </div>
        <div className="ml-3">
          <h3 className="font-bold text-gray-800">{point.name}</h3>
          <div className="flex items-center text-xs text-gray-500">
            <Landmark className="h-4 w-4 mr-1 text-pink-500" />
            <span>Point d'intérêt</span>
          </div>
        </div>
      </div>
      <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full">
        {point.category === 'landmark' ? 'Monument' :
         point.category === 'cultural' ? 'Culture' : 
         point.category === 'business' ? 'Commerce' : 'Éducation'}
      </span>
    </div>
    <div className="mt-3">
      <div className="flex items-start mt-2">
        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
        <p className="text-sm text-gray-600">{point.description}</p>
      </div>
    </div>
  </div>
);

interface InterestPointCardProps {
  point: InterestPoint;
  onSelect: (lat: number, lng: number, id: string) => void;
  isActive?: boolean;
}

// Panneau de filtres
const FilterPanel = ({ 
  filters, 
  setFilters, 
  allServices, 
  onApply, 
  onClose 
}: { 
  filters: FilterTypes; 
  setFilters: (filters: FilterTypes) => void; 
  allServices: string[]; 
  onApply: () => void; 
  onClose: () => void 
}) => (
  <div className="px-4 py-3 bg-white rounded-lg shadow-lg border border-gray-200 absolute left-4 right-4 top-20 z-10 animate-fadeIn">
    <div className="flex justify-between items-center mb-3 border-b pb-2">
      <h4 className="font-semibold text-gray-800 flex items-center">
        <Filter className="h-4 w-4 mr-2 text-indigo-600" />
        Filtrer les points relais
      </h4>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>

    <div className="mb-4">
      <h5 className="font-medium text-gray-700 mb-2 flex items-center">
        <Building2 className="h-4 w-4 mr-1 text-indigo-600" />
        Type de point
      </h5>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(filters.types).map(([type, isChecked]) => {
          const iconStyle = `w-8 h-8 rounded-full flex items-center justify-center ${
            type === 'bureau' ? 'bg-amber-100 text-amber-800' : 
            type === 'commerce' ? 'bg-emerald-100 text-emerald-800' : 
            'bg-purple-100 text-purple-800'
          }`;
          
          const icon = type === 'bureau' ? <Building2 className="h-4 w-4" /> :
                       type === 'commerce' ? <Store className="h-4 w-4" /> :
                       <Package className="h-4 w-4" />;
          
          const label = type === 'bureau' ? 'Bureaux' : 
                       type === 'commerce' ? 'Commerces' : 'Agences';
          
          return (
            <label 
              key={type} 
              className={`flex flex-col items-center p-2 rounded-lg border cursor-pointer transition-all ${
                isChecked ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={iconStyle}>{icon}</div>
              <span className="text-sm text-gray-700 mt-1">{label}</span>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => setFilters({
                  ...filters,
                  types: { ...filters.types, [type]: !isChecked }
                })}
                className="mt-2 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          );
        })}
      </div>
    </div>

    <div className="mb-4">
      <h5 className="font-medium text-gray-700 mb-2 flex items-center">
        <Shield className="h-4 w-4 mr-1 text-indigo-600" />
        Services disponibles
      </h5>
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-gray-100 rounded-lg">
        {allServices.map(service => (
          <label 
            key={service} 
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm cursor-pointer transition-all ${
              filters.services.includes(service) 
                ? 'bg-indigo-100 text-indigo-800 font-medium' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <input
              type="checkbox"
              checked={filters.services.includes(service)}
              onChange={() => {
                const updatedServices = filters.services.includes(service)
                  ? filters.services.filter(s => s !== service)
                  : [...filters.services, service];
                setFilters({ ...filters, services: updatedServices });
              }}
              className="mr-1.5 rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
            />
            {service}
          </label>
        ))}
      </div>
    </div>

    <div className="flex justify-between mt-4">
      <button
        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        onClick={() => {
          setFilters({
            types: { bureau: true, commerce: true, agence: true },
            services: []
          });
        }}
      >
        Réinitialiser
      </button>
      <button
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors shadow-sm"
        onClick={onApply}
      >
        Appliquer les filtres
      </button>
    </div>
  </div>
);

// Composant principal de la carte
interface YaoundeMapProps {
  points: PointRelais[];
  interestPoints: InterestPoint[];
  userPosition: [number, number] | null;
  clickPosition: [number, number] | null;
  selectedPoint: string | null;
  onMarkerClick: (point: PointRelais) => void;
  onInterestPointClick: (point: InterestPoint) => void;
  onMapClick: (lat: number, lng: number) => void;
  centerPosition: [number, number] | null;
  showRoute: boolean;
  routeData: [number, number][] | null;
  activeMarkerId: string | null;
}

const YaoundeMap = ({ 
  points, 
  interestPoints,
  userPosition, 
  clickPosition, 
  selectedPoint, 
  onMarkerClick, 
  onInterestPointClick,
  onMapClick, 
  centerPosition,
  showRoute,
  routeData,
  activeMarkerId
}: YaoundeMapProps) => (
  <MapContainer  
    center={center} 
    zoom={YAOUNDE_ZOOM} 
    minZoom={12}
    maxZoom={18}
    style={{ height: '100%', width: '100%' }}
    className="z-0"
  >
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
    />
    
    {userPosition && (
      <Marker position={userPosition} icon={createLeafletIcon('user')}>
        <Popup>
          <div className="p-1">
            <p className="font-medium">Votre position</p>
          </div>
        </Popup>
      </Marker>
    )}
    
    {clickPosition && (
      <>
        <Marker position={clickPosition} icon={createLeafletIcon('click')}>
          <Popup>
            <div className="p-1">
              <p className="font-medium">Position sélectionnée</p>
            </div>
          </Popup>
        </Marker>
        <Circle
          center={clickPosition}
          radius={NEARBY_RADIUS * 1000}
          pathOptions={{
            fillColor: 'rgba(59, 130, 246, 0.1)',
            fillOpacity: 0.2,
            color: '#3b82f6',
            opacity: 0.6,
            weight: 1
          }}
        />
      </>
    )}
    
    {points.map((point) => (
      <Marker
        key={point.id}
        position={[point.lat, point.lng]}
        icon={createLeafletIcon(point.type, point.id === activeMarkerId)}
        eventHandlers={{ click: () => onMarkerClick(point) }}
      >
        <Popup autoPan={false}>
          <div className="p-2 max-w-xs">
            <h3 className="font-bold text-gray-800">{point.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{point.address}</p>
            <div className="flex items-center mt-1">
              <Clock className="h-3 w-3 text-gray-400 mr-1" />
              <p className="text-xs text-gray-500">{point.hours}</p>
            </div>
            {userPosition && (
              <p className="text-sm text-gray-700 font-medium mt-2">
                À {calculateDistance(
                  userPosition[0], userPosition[1], point.lat, point.lng
                ).toFixed(1)} km
              </p>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {point.services.map((service, idx) => (
                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-1 py-0.5 rounded-full">
                  {service}
                </span>
              ))}
            </div>
          </div>
        </Popup>
      </Marker>
    ))}

{interestPoints.map((point) => (
  <Marker
    key={point.id}
    position={[point.lat, point.lng]}
    icon={createLeafletIcon('landmark', point.id === activeMarkerId)}
    eventHandlers={{
      click: () => onInterestPointClick(point),
      add: (e) => {
        const marker = e.target;
        const labelElement = marker.getElement().querySelector('.landmark-label');
        if (labelElement) {
          labelElement.textContent = point.name;
          // Rendre le label toujours visible
          labelElement.style.display = 'block';
          labelElement.style.opacity = '1';
        }
      }
    }}
  >
    <Popup>
      <div className="p-2 max-w-xs">
        <h3 className="font-bold text-gray-800">{point.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{point.description}</p>
        <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded-full inline-block mt-2">
          {point.category === 'landmark' ? 'Monument' : 
          point.category === 'cultural' ? 'Culture' : 
          point.category === 'business' ? 'Commerce' : 'Éducation'}
        </span>
      </div>
    </Popup>
  </Marker>
))}
    
    {showRoute && routeData && (
      <Polyline 
        positions={routeData}
        pathOptions={{ 
          color: '#4f46e5', 
          weight: 5, 
          opacity: 0.7,
          dashArray: '10, 10',
          lineCap: 'round'
        }} 
      />
    )}
    
    <ChangeMapView position={centerPosition} />
  </MapContainer>
);

export default function Home() {
  // États principaux - ajoutez l'état activeMarkerId
  const [address, setAddress] = useState("");
  const [userPosition, setUserPosition] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [allPointsRelais, setAllPointsRelais] = useState(yaoundePointsRelais);
  const [pointsRelais, setPointsRelais] = useState(yaoundePointsRelais);
  const [allInterestPoints, setallInterestPoints] = useState<InterestPoint[]>([]);
  const [interestPoints, setInterestPoints] = useState<InterestPoint[]>([]);
  const [showRoute, setShowRoute] = useState(false);
  const [activeRoutePointId, setActiveRoutePointId] = useState(null);
  const [activeMarkerId, setActiveMarkerId] = useState(null); // Nouvel état pour suivre le marqueur actif
  const [clickPosition, setClickPosition] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [centerPosition, setCenterPosition] = useState(center);
  const [routeData, setRouteData] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    pointsRelais: PointRelais[];
    interestPoints: InterestPoint[];
  }>({ pointsRelais: [], interestPoints: [] });
  const [filters, setFilters] = useState({
    types: { bureau: true, commerce: true, agence: true },
    services: []
  });
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    // Ajouter les styles globaux via une balise style
    useEffect(() => {
      const landmarkIcons = document.querySelectorAll('.landmark-icon');
      const landmarkLabels = document.querySelectorAll('.landmark-label');
      
      landmarkIcons.forEach(icon => {
        icon.classList.add('z-[1000]');
      });
      
      landmarkLabels.forEach(label => {
        label.classList.add(
          'z-[1001]',
          'pointer-events-none',
          'font-bold',
          'max-w-[150px]',
          'truncate',
          'block',
          'opacity-100'
        );
        label.style.textShadow = '0 0 3px rgba(255, 255, 255, 0.8)';
      });
    
      return () => {
        landmarkIcons.forEach(icon => {
          icon.classList.remove('z-[1000]');
        });
        landmarkLabels.forEach(label => {
          label.classList.remove(
            'z-[1001]',
            'pointer-events-none',
            'font-bold',
            'max-w-[150px]',
            'truncate',
            'block',
            'opacity-100'
          );
          label.style.textShadow = '';
        });
      };
    }, []);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    
    // Annuler le timeout précédent s'il existe
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Définir un nouveau timeout avec un type correct
    const timeoutId = setTimeout(() => {
      try {
        handleSearch();
      } catch (error) {
        console.error("Erreur lors de la recherche :", error);
        setPointsRelais(allPointsRelais);
        setInterestPoints(allInterestPoints);
        setCenterPosition(center);
      }
    }, 300); // 300ms de délai
    
    setSearchTimeout(timeoutId);
  };
  
  // Search handler amélioré avec typage et gestion d'erreurs
  const handleSearch = () => {
    try {
      // Réinitialiser si la recherche est vide
      if (!address || address.trim() === "") {
        setPointsRelais(allPointsRelais);
        setInterestPoints([]);
        setCenterPosition(center);
        return;
      }
    
      const searchTerm = address.toLowerCase().trim();
      
      // 1. Rechercher dans les points d'intérêt
      const matchingInterestPoints = searchInterestPoints(searchTerm);
      setInterestPoints(matchingInterestPoints);
  
      // 2. Rechercher dans les points relais
      const searchInPoint = (point: PointRelais) => {
        return (
          point.name.toLowerCase().includes(searchTerm) || 
          point.quartier.toLowerCase().includes(searchTerm) ||
          point.address.toLowerCase().includes(searchTerm)
        );
      };
  
      const matchingPointsRelais = allPointsRelais.filter(searchInPoint);
      setPointsRelais(matchingPointsRelais);
  
      // 3. Définir le centre de la carte
      let newCenter = center;
      if (matchingInterestPoints.length > 0) {
        newCenter = [matchingInterestPoints[0].lat, matchingInterestPoints[0].lng];
      } else if (matchingPointsRelais.length > 0) {
        newCenter = [matchingPointsRelais[0].lat, matchingPointsRelais[0].lng];
      }
      setCenterPosition(newCenter);
  
    } catch (error) {
      console.error("Erreur dans handleSearch:", error);
      // Fallback en cas d'erreur
      setPointsRelais(allPointsRelais);
      setInterestPoints([]);
      setCenterPosition(center);
    }
  };

  // Pour simuler le service de directions, nous créons une ligne droite entre les points
  const createSimpleRoute = (start, end) => {
    // Dans une vraie application, utilisez un service comme OSRM, GraphHopper ou Mapbox Directions
    // Ici nous créons juste une route simplifiée
    return [start, end];
  };


  // Geolocation handler
  const handleGeolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const newUserPosition = [userLat, userLng];
          
          // Vérifier si l'utilisateur est dans les limites de Yaoundé
          if (
            userLat < YAOUNDE_BOUNDS.southWest[0] || 
            userLat > YAOUNDE_BOUNDS.northEast[0] || 
            userLng < YAOUNDE_BOUNDS.southWest[1] || 
            userLng > YAOUNDE_BOUNDS.northEast[1]
          ) {
            alert("Vous semblez être en dehors de Yaoundé. L'application est actuellement limitée à Yaoundé.");
            setUserPosition([YAOUNDE_CENTER[0], YAOUNDE_CENTER[1]]);
          } else {
            setUserPosition(newUserPosition);
          }
          
          setCenterPosition(newUserPosition);
          
          // Marquer les points relais à proximité
          const updatedPoints = findNearbyPoints(allPointsRelais, userLat, userLng);
          setAllPointsRelais(updatedPoints);
          
          // Appliquer le filtre de recherche existant
          if (address.trim() !== "") {
            handleSearch(); // Réutiliser la fonction de recherche
          } else {
            // Afficher uniquement les points relais à proximité
            const nearbyPoints = updatedPoints.filter(point => point.isNearby);
            setPointsRelais(nearbyPoints);
          }
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
          alert("Impossible d'obtenir votre position. Utilisation du centre de Yaoundé par défaut.");
          // Position par défaut au centre de Yaoundé
          setUserPosition([YAOUNDE_CENTER[0], YAOUNDE_CENTER[1]]);
        }
      );
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  };

  // Point selection handler
  const handlePointSelect = (lat, lng, id) => {
    setSelectedPoint({ lat, lng });
    setActiveMarkerId(id);
    setActiveRoutePointId(id);
    setCenterPosition([lat, lng]);
  };

  // Map click handler
  const handleMapClick = (event) => {
    const { lat, lng } = event.latlng;
    setClickPosition([lat, lng]);
    
    // Réinitialiser le marqueur actif
    setActiveMarkerId(null);
    
    // Trouver les points relais à proximité du clic
    const updatedPoints = findNearbyPoints(allPointsRelais, lat, lng, NEARBY_RADIUS);
    
    // Mettre à jour tous les points relais
    setAllPointsRelais(updatedPoints);
    
    // Filtrer les points pour n'afficher que ceux à proximité dans la liste
    const nearbyPoints = updatedPoints.filter(point => point.isNearby);
    setPointsRelais(nearbyPoints);
    
    // Réinitialiser les points d'intérêt
    setInterestPoints([]);
    
    // Désactiver la route active
    setShowRoute(false);
    setActiveRoutePointId(null);
    setRouteData(null);
    
    // Fermer la fenêtre d'info ouverte
    setSelectedMarker(null);
  };

    // Modifier handleMarkerClick pour définir le marqueur actif
    const handleMarkerClick = (point) => {
      setSelectedMarker(point);
      setActiveMarkerId(point.id);
      setActiveRoutePointId(point.id);
      setCenterPosition([point.lat, point.lng]);
      
      // Scroll vers la carte correspondante
      const pointElement = document.getElementById(`point-${point.id}`);
      if (pointElement) {
        pointElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    
    const handleInterestPointClick = (point) => {
      setSelectedMarker(point);
      setActiveMarkerId(point.id);
      setCenterPosition([point.lat, point.lng]);
      
      const pointElement = document.getElementById(`interest-${point.id}`);
      if (pointElement) {
        pointElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

  // Route handler
  const handleShowRoute = (pointId) => {
    if (!userPosition) {
      alert("Veuillez vous géolocaliser pour calculer un itinéraire");
      return;
    }
    
    const point = allPointsRelais.find(p => p.id === pointId);
    if (point) {
      setSelectedPoint({ lat: point.lat, lng: point.lng });
      setShowRoute(true);
      setActiveRoutePointId(pointId);
      
      // Créer une route simplifiée entre l'utilisateur et le point
      const route = createSimpleRoute(
        userPosition,
        [point.lat, point.lng]
      );
      setRouteData(route);
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Toggle filtres
  const toggleFilters = () => {
    setFilterOpen(!filterOpen);
  };

  // Appliquer les filtres
  const applyFilters = () => {
    const filteredPoints = allPointsRelais.filter(point => {
      // Filtrer par type
      if (!filters.types[point.type]) {
        return false;
      }
      
      // Filtrer par services (si des services sont sélectionnés)
      if (filters.services.length > 0) {
        return point.services.some(service => filters.services.includes(service));
      }
      
      return true;
    });
    
    setPointsRelais(filteredPoints);
    setFilterOpen(false);
  };

  // Nettoyage des timeouts
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Extraire tous les services uniques
  const allServices = [...new Set(allPointsRelais.flatMap(p => p.services))];

  return (
    <>
      <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />
      
        {/* Interface principale */}
        <div className="flex-1 text-black flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <div 
          className={`border-r border-gray-200 bg-white transition-all duration-300 flex flex-col
                    ${isSidebarCollapsed ? 'w-0 md:w-12 overflow-hidden' : 'w-full md:w-96 lg:w-1/3 xl:w-1/4'}`}
        >
            {/* Bouton pour réduire/agrandir la sidebar (visible seulement sur tablet/desktop) */}
            <button 
              className="hidden md:flex absolute z-10 top-20 left-96 lg:left-1/3 xl:left-1/4 bg-white p-1 rounded-full shadow-md transform translate-x-1/2 border border-gray-200"
              onClick={toggleSidebar}
            >
              <ArrowBigRightDash className={`h-5 w-5 text-gray-500 transition-transform ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
            </button>
            
            {!isSidebarCollapsed && (
              <>
                <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
                  <h2 className="text-xl font-bold mb-2 flex items-center">
                    <MapPinned className="mr-2 h-5 w-5" /> 
                    Rechercher un point relais
                  </h2>
                  <div className="relative">
                    <div className="relative flex items-center">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-white opacity-80" />
                      </div>
                      <input
                        type="text"
                        className="block text-gray-700 w-full pl-10 pr-12 py-3 bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm border border-white border-opacity-30 rounded-lg shadow-sm placeholder-opacity-70 focus:ring-2 focus:ring-white focus:border-transparent sm:text-sm"
                        placeholder="Quartier, adresse..."
                        value={address}
                        onChange={handleSearchInput}
                      />
                      <button
                        className="absolute right-2 bg-white bg-opacity-30 hover:bg-opacity-40 text-white p-1 rounded-full"
                        onClick={handleGeolocate}
                      >
                        <Navigation className="h-5 w-5" />
                      </button>
                    </div>
                    {address && (
                      <div className="text-xs text-white mt-1">
                        Recherche : "{address}" - {pointsRelais.length + interestPoints.length} résultat{pointsRelais.length + interestPoints.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden relative">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      {pointsRelais.length} point{pointsRelais.length !== 1 ? 's' : ''} relais trouvé{pointsRelais.length !== 1 ? 's' : ''}
                      {interestPoints.length > 0 && ` + ${interestPoints.length} point${interestPoints.length !== 1 ? 's' : ''} d'intérêt`}
                    </h3>
                    <button 
                      className={`text-sm flex items-center transition-colors px-3 py-1.5 rounded-lg ${
                        filterOpen ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:text-indigo-800'
                      }`}
                      onClick={toggleFilters}
                    >
                      <Filter className="h-4 w-4 mr-1" />
                      Filtres
                    </button>
                  </div>

                  {/* Panneau de filtres amélioré */}
                  {filterOpen && (
                    <FilterPanel 
                      filters={filters}
                      setFilters={setFilters}
                      allServices={allServices}
                      onApply={applyFilters}
                      onClose={() => setFilterOpen(false)}
                    />
                  )}

                  <div className="flex-1 overflow-y-auto p-4">
                    {/* Affichage des points d'intérêt */}
                    {interestPoints.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <Landmark className="h-4 w-4 mr-2 text-pink-500" />
                          Points d'intérêt
                        </h3>
                        <div className="space-y-4">
                          {interestPoints.map((point) => (
                            <InterestPointCard
                              key={point.id}
                              point={point}
                              onSelect={handlePointSelect}
                              isActive={point.id === activeMarkerId} // Ajout de la prop isActive
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Affichage des points relais */}
                    {pointsRelais.length > 0 ? (
                      <div className="space-y-4">
                        {interestPoints.length > 0 && (
                          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <Package className="h-4 w-4 mr-2" />
                            Points relais
                          </h3>
                        )}
                        {pointsRelais.map((point) => (
                          <PointRelaisCard
                            key={point.id}
                            point={point}
                            onSelect={handlePointSelect}
                            onRoute={handleShowRoute}
                            userPosition={userPosition}
                            isActive={point.id === activeMarkerId}
                          />
                        ))}
                      </div>
                    ) : interestPoints.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                          <CircleAlert className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">
                          Aucun résultat trouvé
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Essayez une autre recherche ou utilisez la géolocalisation
                        </p>
                        <button
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                          onClick={handleGeolocate}
                        >
                          <Navigation className="h-4 w-4 inline-block mr-2" />
                          Me géolocaliser
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Carte */}
          <div className="flex-1 h-full relative">
            {/* Carte de Yaoundé avec Leaflet */}
            <YaoundeMap
              points={allPointsRelais}
              interestPoints={interestPoints || []}
              userPosition={userPosition}
              clickPosition={clickPosition}
              selectedPoint={selectedPoint}
              onMarkerClick={handleMarkerClick}
              onInterestPointClick={handleInterestPointClick}
              onMapClick={handleMapClick}
              centerPosition={centerPosition}
              showRoute={showRoute}
              routeData={routeData}
              activeMarkerId={activeMarkerId} // Passer le nouvel état
            />
            
            {/* Légende de la carte */}
            <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-md z-10">
              <h3 className="text-sm font-semibold mb-2 text-gray-700">Légende</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-xs text-gray-600">Votre position</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-xs text-gray-600">Position sélectionnée</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-amber-500 mr-2"></div>
                  <span className="text-xs text-gray-600">Bureau postal</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 mr-2"></div>
                  <span className="text-xs text-gray-600">Commerce partenaire</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-purple-500 mr-2"></div>
                  <span className="text-xs text-gray-600">Agence</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-pink-500 mr-2"></div>
                  <span className="text-xs text-gray-600">Point d'intérêt</span>
                </div>
              </div>
            </div>
            
            {/* Bouton pour la géolocalisation */}
            <button
              className="absolute top-4 right-4 z-10 bg-white p-3 rounded-full shadow-md hover:shadow-lg transition-shadow"
              onClick={handleGeolocate}
            >
              <Navigation className="h-5 w-5 text-indigo-600" />
            </button>
          </div>
        </div>
      
    </div>
    </>
  );
};
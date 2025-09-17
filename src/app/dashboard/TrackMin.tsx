'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Package,
  Truck,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  QrCode,
  X,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface TrackingInfo {
  trackingNumber: string;
  status: 'Au départ' | 'En transit' | 'Arrivé au relais' | 'Reçu' | 'En cours de livraison' | 'Livré';
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  departurePoint: string;
  arrivalPoint: string;
  description: string;
  weight: string;
  estimatedDelivery: string;
  lastUpdate: string;
  currentLocation?: string;
  trackingHistory: Array<{
    date: string;
    status: string;
    location: string;
    description: string;
  }>;
}

interface TrackPackageMinProps {
  onOpenFullTracker?: () => void;
}

const TrackPackageMin: React.FC<TrackPackageMinProps> = ({ onOpenFullTracker }) => {
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const getStatusColorClasses = (status: TrackingInfo['status']) => {
    switch (status) {
      case 'Au départ': return 'bg-orange-500 text-white';
      case 'En transit': return 'bg-amber-500 text-white';
      case 'Arrivé au relais': return 'bg-yellow-600 text-white';
      case 'En cours de livraison': return 'bg-orange-600 text-white';
      case 'Livré': return 'bg-green-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: TrackingInfo['status']) => {
    switch (status) {
      case 'Au départ': return <Package className="w-4 h-4" />;
      case 'En transit': return <Truck className="w-4 h-4" />;
      case 'Arrivé au relais': return <MapPin className="w-4 h-4" />;
      case 'En cours de livraison': return <Truck className="w-4 h-4" />;
      case 'Livré': return <CheckCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const handleSearch = async (value?: string) => {
    const query = (value || searchInput).trim().toUpperCase();
    if (!query) {
      setError('Veuillez entrer un numéro de suivi.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTrackingInfo(null);

    if (value && searchInput !== value) setSearchInput(value);
    
    try {
      // Étape 1 : Interroger la base de données Supabase
      const { data: shipment, error: dbError } = await supabase
        .from('shipments')
        .select(`
          *,
          departurePoint:departure_point_id(name, quartier),
          arrivalPoint:arrival_point_id(name, quartier)
        `)
        .eq('tracking_number', query)
        .single();

      if (dbError || !shipment) {
        throw new Error("Colis non trouvé ou erreur de communication.");
      }

      // Étape 2 : Transformer les données de la base pour correspondre à l'interface `TrackingInfo`
      const departurePointName = (shipment.departurePoint as any)?.name || 'Inconnu';
      const arrivalPointName = (shipment.arrivalPoint as any)?.name || 'Inconnu';

      const statusMap: Record<string, TrackingInfo['status']> = {
        'EN_ATTENTE_DE_DEPOT': 'Au départ',
        'AU_DEPART': 'Au départ',
        'EN_TRANSIT': 'En transit',
        'ARRIVE_AU_RELAIS': 'Arrivé au relais',
        'RECU': 'Livré',
      };
      const frontendStatus = statusMap[shipment.status] || 'Au départ';

      // Logique pour déterminer la localisation actuelle
      let currentLocation = departurePointName;
      if (frontendStatus === 'En transit') currentLocation = `En transit vers ${arrivalPointName}`;
      if (frontendStatus === 'Arrivé au relais') currentLocation = arrivalPointName;
      if (frontendStatus === 'Livré') currentLocation = "Livré";

      // Générer un historique de suivi plausible à partir des données disponibles
      const generateTrackingHistory = (shipmentData: typeof shipment) => {
        const history = [];
        const depName = (shipmentData.departurePoint as any)?.name || 'Point de départ';
        const arrName = (shipmentData.arrivalPoint as any)?.name || 'Point d\'arrivée';

        // 1. Dépôt (toujours présent)
        history.push({
          date: new Date(shipmentData.created_at).toLocaleString('fr-CM'),
          status: 'Colis déposé',
          location: depName,
          description: 'Colis accepté et enregistré.',
        });

        // 2. Départ (si applicable)
        if (['EN_TRANSIT', 'ARRIVE_AU_RELAIS', 'RECU'].includes(shipmentData.status)) {
            const departureTime = new Date(new Date(shipmentData.created_at).getTime() + 2 * 60 * 60 * 1000);
            history.push({
                date: departureTime.toLocaleString('fr-CM'),
                status: 'Au départ',
                location: depName,
                description: 'Le colis a quitté son point de départ.',
            });
        }
        
        // 3. Arrivé au relais (si applicable)
        if (['ARRIVE_AU_RELAIS', 'RECU'].includes(shipmentData.status)) {
            const arrivalTime = new Date(new Date(shipmentData.updated_at).getTime() - 1 * 60 * 60 * 1000);
            history.push({
                date: arrivalTime.toLocaleString('fr-CM'),
                status: 'Arrivé au relais',
                location: arrName,
                description: 'Colis disponible pour le retrait.',
            });
        }
        
        // 4. Livré (si applicable)
        if (shipmentData.status === 'RECU') {
            history.push({
                date: new Date(shipmentData.updated_at).toLocaleString('fr-CM'),
                status: 'Livré',
                location: arrName,
                description: 'Colis remis au destinataire.',
            });
        }

        // Tri par date pour s'assurer que c'est chronologique
        return history.sort((a, b) => new Date(a.date.split(' ')[0].split('/').reverse().join('-') + ' ' + a.date.split(' ')[1]).getTime() - new Date(b.date.split(' ')[0].split('/').reverse().join('-') + ' ' + b.date.split(' ')[1]).getTime());
      };

      const transformedData: TrackingInfo = {
        trackingNumber: shipment.tracking_number,
        status: frontendStatus,
        senderName: shipment.sender_name,
        senderPhone: shipment.sender_phone,
        recipientName: shipment.recipient_name,
        recipientPhone: shipment.recipient_phone,
        departurePoint: departurePointName,
        arrivalPoint: arrivalPointName,
        description: shipment.description || 'Non spécifié',
        weight: String(shipment.weight || '0'),
        estimatedDelivery: new Date(new Date(shipment.created_at).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastUpdate: new Date(shipment.updated_at).toLocaleString('fr-CM'),
        currentLocation: currentLocation,
        trackingHistory: generateTrackingHistory(shipment),
      };

      setTrackingInfo(transformedData);

    } catch (err: any) {
      setError(`Erreur de recherche pour "${query}": ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startScanner = async () => {
    setShowScanner(true);
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 300 }, height: { ideal: 300 } }
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Simulation de détection QR après 2-3 secondes
        setTimeout(() => {
          const mockCodes = ['TRK001XYZ', 'TRK002ABC', 'TRK003DEF'];
          const detectedCode = mockCodes[Math.floor(Math.random() * mockCodes.length)];
          setSearchInput(detectedCode);
          stopScanner();
          handleSearch(detectedCode);
        }, 2500);
      }
    } catch (err) {
      setError("Erreur d'accès à la caméra.");
      setShowScanner(false);
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    }
    setShowScanner(false);
  };

  const resetWidget = () => {
    setSearchInput('');
    setTrackingInfo(null);
    setError(null);
    stopScanner();
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-100 p-6 hover:shadow-xl transition-all duration-300">
      {/* Header du widget */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
            <Search className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Suivi Colis</h3>
        </div>
        {onOpenFullTracker && (
          <button
            onClick={onOpenFullTracker}
            className="p-1.5 hover:bg-orange-100 rounded-lg transition-colors text-orange-600"
            title="Ouvrir le suivi complet"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!trackingInfo && !showScanner && (
          <motion.div
            key="search-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                placeholder="Ex: TRK001XYZ"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/90"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2">
              <button
                onClick={() => handleSearch()}
                disabled={isLoading || !searchInput.trim()}
                className="flex-1 flex items-center justify-center bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium py-2 px-3 rounded-lg text-sm disabled:opacity-60 transition-all hover:shadow-md"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-1.5" />
                    Rechercher
                  </>
                )}
              </button>
              
              <button
                onClick={startScanner}
                className="flex items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-3 rounded-lg text-sm transition-all"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>

            {/* Exemples rapides */}
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-2">Essayez ces exemples :</p>
              <div className="flex flex-wrap gap-1">
                {['TRK001XYZ', 'TRK002ABC', 'TRK003DEF'].map((code) => (
                  <button
                    key={code}
                    onClick={() => {
                      setSearchInput(code);
                      setTimeout(() => handleSearch(code), 100);
                    }}
                    className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded transition-colors"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {showScanner && (
          <motion.div
            key="scanner"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center space-y-3"
          >
            <div className="relative mx-auto w-48 h-48 bg-slate-800 rounded-lg overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Animation de scan */}
              <div className="absolute inset-2 border border-orange-400/80 rounded">
                <motion.div
                  animate={{ y: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-0 right-0 h-0.5 bg-orange-400 shadow-lg shadow-orange-400/50"
                />
              </div>
            </div>
            
            <p className="text-sm text-slate-600">Positionnez le QR code dans le cadre</p>
            
            <button
              onClick={stopScanner}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all inline-flex items-center"
            >
              <X className="w-4 h-4 mr-1" />
              Annuler
            </button>
          </motion.div>
        )}

        {trackingInfo && (
          <motion.div
            key="tracking-result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Status badge */}
            <div className={`${getStatusColorClasses(trackingInfo.status)} rounded-lg p-3 flex items-center justify-between`}>
              <div className="flex items-center space-x-2">
                {getStatusIcon(trackingInfo.status)}
                <div>
                  <p className="font-semibold text-sm">{trackingInfo.trackingNumber}</p>
                  <p className="text-xs opacity-90">{trackingInfo.status}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-90">Livraison prévue</p>
                <p className="text-xs font-medium">
                  {new Date(trackingInfo.estimatedDelivery).toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </p>
              </div>
            </div>

            {/* Détails compacts */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">De :</span>
                <span className="font-medium text-slate-800 text-right">{trackingInfo.departurePoint}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Vers :</span>
                <span className="font-medium text-slate-800 text-right">{trackingInfo.arrivalPoint}</span>
              </div>
              {trackingInfo.currentLocation && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Position :</span>
                  <span className="font-medium text-orange-700 text-right flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {trackingInfo.currentLocation}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Contenu :</span>
                <span className="font-medium text-slate-800 text-right">{trackingInfo.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Poids :</span>
                <span className="font-medium text-slate-800">{trackingInfo.weight} kg</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={resetWidget}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-3 rounded-lg text-sm transition-all"
              >
                Nouveau suivi
              </button>
              {onOpenFullTracker && (
                <button
                  onClick={onOpenFullTracker}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-3 rounded-lg text-sm transition-all flex items-center"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Détails
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message d'erreur */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700 text-xs"
        >
          <AlertTriangle className="w-3 h-3 mr-1.5 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
        </motion.div>
      )}
    </div>
  );
};

export default TrackPackageMin;
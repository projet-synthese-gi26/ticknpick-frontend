'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Package, Truck, MapPin, CheckCircle, Clock, 
  AlertTriangle, Loader2, QrCode, X, 
  Weight, User, FileText, ExternalLink
} from 'lucide-react';

// Service API
import { packageService } from '@/services/packageService';

// --- TYPES UI & LOGIQUE (Copie locale pour autonomie du composant) ---

interface TimelineStep {
  label: string;
  date?: string;
  status: 'completed' | 'current' | 'upcoming' | 'error';
  icon: React.ElementType;
}

interface TrackedPackageUI {
  trackingNumber: string;
  statusRaw: string;
  statusLabel: string;
  percentage: number;
  
  description: string;
  weight: string;
  lastUpdate: string;
  estimatedDelivery: string;
  
  senderName: string;
  recipientName: string;
  pickupAddress: string; 
  deliveryAddress: string; 
  
  timeline: TimelineStep[];
  isFragile: boolean;
  isInsured: boolean;
}

const mapBackendToUI = (responseData: any): TrackedPackageUI => {
  const pkg = responseData.package || responseData || {};
  const history = Array.isArray(responseData.history) ? responseData.history : [];

  const statusRaw = (pkg.currentStatus || pkg.status || 'PRE_REGISTERED').toUpperCase();
  const createdAt = pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString('fr-FR') : '-';
  const updatedAt = pkg.updatedAt ? new Date(pkg.updatedAt).toLocaleString('fr-FR', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : '-';

  let percentage = 10;
  let label = "Enregistré";

  if (['PRE_REGISTERED', 'PENDING', 'EN_ATTENTE_DE_DEPOT'].some(s => statusRaw.includes(s))) { percentage = 15; label = "En attente de dépôt"; } 
  else if (['AU_DEPART', 'AT_DEPARTURE_RELAY_POINT', 'ARRIVE_AU_RELAIS_DEPART'].some(s => statusRaw.includes(s))) { percentage = 35; label = "Déposé au départ"; } 
  else if (['EN_TRANSIT', 'IN_TRANSIT'].some(s => statusRaw.includes(s))) { percentage = 60; label = "En acheminement"; } 
  else if (['ARRIVE_AU_RELAIS', 'AT_ARRIVAL_RELAY_POINT'].some(s => statusRaw.includes(s))) { percentage = 85; label = "Arrivé au relais"; } 
  else if (['RECU', 'LIVRE', 'DELIVERED', 'WITHDRAWN'].some(s => statusRaw.includes(s))) { percentage = 100; label = "Livré / Retiré"; } 
  else if (['ANNULE', 'CANCELLED'].some(s => statusRaw.includes(s))) { percentage = 0; label = "Annulé"; }

  const timeline: TimelineStep[] = history.length > 0 
    ? history.map((log: any, index: number) => ({
        label: (log.status || 'ÉTAPE').replace(/_/g, ' '),
        status: index === 0 ? 'current' : 'completed',
        date: log.eventDate || log.createdAt ? new Date(log.eventDate || log.createdAt).toLocaleString('fr-FR', {hour:'2-digit', minute:'2-digit'}) : undefined,
        icon: log.status?.includes('LIVRE') ? CheckCircle : Truck
      }))
    : [
        { label: "Création", status: percentage >= 15 ? 'completed' : 'upcoming', date: createdAt, icon: FileText },
        { label: "Dépôt", status: percentage >= 35 ? 'completed' : 'upcoming', icon: Package },
        { label: "Transit", status: percentage >= 60 ? 'completed' : 'upcoming', icon: Truck },
        { label: "Livraison", status: percentage === 100 ? 'completed' : 'upcoming', icon: CheckCircle }
    ];

  return {
    trackingNumber: pkg.trackingNumber || 'N/A',
    statusRaw: statusRaw,
    statusLabel: label,
    percentage,
    description: pkg.description || "Sans description",
    weight: `${pkg.weight || 0} kg`,
    lastUpdate: updatedAt,
    estimatedDelivery: pkg.estimatedDeliveryDate ? new Date(pkg.estimatedDeliveryDate).toLocaleDateString('fr-FR') : "Non estimée",
    senderName: pkg.senderName || "Expéditeur",
    recipientName: pkg.recipientName || "Destinataire",
    pickupAddress: pkg.pickupAddress || pkg.departurePointName || "Départ",
    deliveryAddress: pkg.deliveryAddress || pkg.arrivalPointName || "Arrivée",
    timeline: timeline,
    isFragile: pkg.packageType === 'FRAGILE',
    isInsured: (pkg.value && pkg.value > 0) ? true : false
  };
};

// --- COMPOSANT ---

interface TrackMinProps {
  onClose?: () => void;
  onOpenFullTracker?: () => void;
  initialTrackingNumber?: string;
}

export default function TrackPackageMin({ onClose, onOpenFullTracker, initialTrackingNumber }: TrackMinProps) {
  const [searchInput, setSearchInput] = useState(initialTrackingNumber || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pkg, setPkg] = useState<TrackedPackageUI | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setLoading(true); setError(null); setPkg(null);
    try {
      const response = await packageService.trackPackage(searchInput.trim());
      
      // Fix Type Error: On force le type any ici car l'interface du service ne reflète pas
      // potentiellement la structure "wrappée" { package: ..., history: ... }
      const data = response as any;

      if (!data || (!data.package && !data.trackingNumber)) throw new Error("Introuvable");
      
      const unifiedData = data.package ? data : { package: data, history: [] };
      setPkg(mapBackendToUI(unifiedData));
    } catch (err: any) {
      setError(err.message || "Erreur recherche");
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (raw: string) => {
     if (raw.includes('RECU') || raw.includes('LIVRE')) return 'bg-green-500';
     if (raw.includes('TRANSIT')) return 'bg-blue-500';
     if (raw.includes('ANNULE')) return 'bg-red-500';
     return 'bg-orange-500';
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[85vh] w-full">
      
      {/* Header Modal */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-500"/> Suivi Rapide
        </h3>
        <div className="flex gap-2">
            {onOpenFullTracker && (
              <button onClick={onOpenFullTracker} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition" title="Plein écran">
                <ExternalLink className="w-4 h-4 text-gray-500 dark:text-gray-400"/>
              </button>
            )}
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition">
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
              </button>
            )}
        </div>
      </div>

      <div className="p-6 overflow-y-auto">
          {/* Barre de recherche */}
          <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="N° de suivi..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-orange-500 text-sm font-medium outline-none dark:text-white"
                  />
              </div>
              <button 
                onClick={() => setShowScanner(!showScanner)}
                className={`p-2.5 rounded-xl transition ${showScanner ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
              >
                <QrCode className="w-5 h-5"/>
              </button>
              <button 
                 onClick={handleSearch}
                 disabled={loading}
                 className="bg-orange-600 hover:bg-orange-700 text-white px-4 rounded-xl font-bold text-sm transition disabled:opacity-70"
              >
                 {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Go"}
              </button>
          </div>

          <AnimatePresence mode="wait">
            {error && (
                <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-lg flex items-center text-red-600 dark:text-red-400 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 mr-2"/> {error}
                </motion.div>
            )}

            {pkg && !loading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    
                    {/* Statut Banner */}
                    <div className={`${getStatusColor(pkg.statusRaw)} text-white p-5 rounded-xl mb-6 relative overflow-hidden`}>
                        <div className="relative z-10">
                            <p className="text-[10px] uppercase font-bold opacity-80 tracking-widest">Statut Actuel</p>
                            <div className="flex justify-between items-center mt-1">
                                <h2 className="text-xl font-black">{pkg.statusLabel}</h2>
                                <Package className="w-8 h-8 opacity-20" />
                            </div>
                            <div className="mt-3 h-1.5 bg-black/20 rounded-full overflow-hidden">
                                <motion.div initial={{width:0}} animate={{width: `${pkg.percentage}%`}} className="h-full bg-white/90" transition={{duration: 1}} />
                            </div>
                        </div>
                        {/* Background pattern */}
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                    </div>

                    {/* Détails Clés */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Dernière MàJ</p>
                            <div className="flex items-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                                <Clock className="w-3 h-3 mr-1 text-orange-500"/> {pkg.lastUpdate}
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                             <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Info Poids</p>
                             <div className="flex items-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                                <Weight className="w-3 h-3 mr-1 text-blue-500"/> {pkg.weight}
                             </div>
                        </div>
                    </div>

                    {/* Itinéraire */}
                    <div className="relative pl-4 border-l-2 border-gray-100 dark:border-gray-700 space-y-6 mb-6 ml-2">
                        <div className="relative">
                            <div className="absolute -left-[21px] top-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900 ring-2 ring-blue-100 dark:ring-blue-900/30"></div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Départ</p>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{pkg.pickupAddress}</p>
                            <p className="text-xs text-gray-500">{pkg.senderName}</p>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-[21px] top-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 ring-2 ring-green-100 dark:ring-green-900/30"></div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Arrivée</p>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{pkg.deliveryAddress}</p>
                            <p className="text-xs text-gray-500">{pkg.recipientName}</p>
                        </div>
                    </div>

                    {/* Contenu */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 text-xs text-center text-gray-500 dark:text-gray-400 italic">
                        Contenu : "{pkg.description}"
                    </div>

                </motion.div>
            )}

            {!pkg && !loading && !error && (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 opacity-60">
                    <Package className="w-12 h-12 mb-2" />
                    <p className="text-xs">Entrez un numéro pour commencer</p>
                </div>
            )}
          </AnimatePresence>
      </div>
    </div>
  );
}
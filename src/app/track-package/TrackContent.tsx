'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Search, Package, Truck, MapPin, CheckCircle, Clock, 
  AlertTriangle, ArrowLeft, Loader2, QrCode, X, AlertCircle,
  CalendarDays, Weight, FileText, User, Coins
} from 'lucide-react';

// Service API
import { packageService } from '@/services/packageService';
import Footer from '@/components/FooterHome';
import NavbarHome from '@/components/NavbarHome';

// --- TYPES UI INTERNES ---

interface TimelineStep {
  label: string;
  date?: string;
  status: 'completed' | 'current' | 'upcoming' | 'error';
  icon: React.ElementType;
  location?: string;
  description?: string;
}

interface TrackedPackageUI {
  trackingNumber: string;
  statusRaw: string;
  statusLabel: string;
  percentage: number;
  
  // Infos Détails
  description: string;
  weight: string;
  dimensions: string;
  specialInstructions: string;
  price: string;
  paymentStatus: string;
  
  lastUpdate: string;
  estimatedDelivery: string;
  
  // Acteurs & Lieux
  senderName: string;
  recipientName: string;
  recipientPhone: string;
  
  pickupAddress: string; // Point de Départ
  deliveryAddress: string; // Point d'Arrivée
  
  // Historique réel ou généré
  timeline: TimelineStep[];
  
  isFragile: boolean;
  isInsured: boolean;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
};

// --- MAPPING INTELLIGENT ---
const mapBackendToUI = (responseData: any): TrackedPackageUI => {
  // 1. SÉCURISATION: Extraction de l'objet "package" peu importe la structure
  // Si la réponse est directement le paquet (pas encapsulé), on gère les deux cas.
  const pkg = responseData.package || responseData || {};
  const history = Array.isArray(responseData.history) ? responseData.history : [];

  const statusRaw = (pkg.currentStatus || pkg.status || 'PRE_REGISTERED').toUpperCase();
  
  // Formatage dates
  const createdAt = pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString('fr-FR') : '-';
  const updatedAt = pkg.updatedAt 
      ? new Date(pkg.updatedAt).toLocaleString('fr-FR', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) 
      : '-';

  // 2. LOGIQUE DE PROGRESSION & LABEL
  let percentage = 10;
  let label = "Enregistré";

  if (['PRE_REGISTERED', 'PENDING', 'EN_ATTENTE_DE_DEPOT'].some(s => statusRaw.includes(s))) {
    percentage = 15;
    label = "En attente de dépôt";
  } else if (['AU_DEPART', 'AT_DEPARTURE_RELAY_POINT', 'ARRIVE_AU_RELAIS_DEPART'].some(s => statusRaw.includes(s))) {
    percentage = 35;
    label = "Déposé au point de départ";
  } else if (['EN_TRANSIT', 'IN_TRANSIT'].some(s => statusRaw.includes(s))) {
    percentage = 60;
    label = "En cours d'acheminement";
  } else if (['ARRIVE_AU_RELAIS', 'AT_ARRIVAL_RELAY_POINT'].some(s => statusRaw.includes(s))) {
    percentage = 85;
    label = "Arrivé au point de retrait";
  } else if (['RECU', 'LIVRE', 'DELIVERED', 'WITHDRAWN'].some(s => statusRaw.includes(s))) {
    percentage = 100;
    label = "Livré / Retiré";
  } else if (['ANNULE', 'CANCELLED'].some(s => statusRaw.includes(s))) {
    percentage = 0;
    label = "Annulé";
  }

  // 3. Construction de la TIMELINE
  // Si l'API retourne un historique, on l'utilise. Sinon, on génère une timeline visuelle basée sur le pourcentage.
  const timeline: TimelineStep[] = history.length > 0 
    ? history.map((log: any, index: number) => ({
        label: (log.status || 'ÉTAPE').replace(/_/g, ' '),
        description: log.location || log.description || '',
        status: index === 0 ? 'current' : 'completed',
        date: log.eventDate || log.createdAt ? new Date(log.eventDate || log.createdAt).toLocaleString('fr-FR') : undefined,
        icon: log.status?.includes('LIVRE') ? CheckCircle : Truck
      }))
    : [
        // Fallback visuel si pas d'historique technique
        { label: "Création commande", status: percentage >= 15 ? 'completed' : 'upcoming', date: createdAt, icon: FileText },
        { label: "Prise en charge", status: percentage >= 35 ? 'completed' : 'upcoming', icon: Package },
        { label: "En transit", status: percentage >= 60 ? 'completed' : 'upcoming', icon: Truck },
        { label: "Disponible", status: percentage >= 85 ? 'completed' : 'upcoming', icon: MapPin },
        { label: "Livré", status: percentage === 100 ? 'completed' : 'upcoming', icon: CheckCircle }
    ];

  // 4. Retour de l'objet UI normalisé
  return {
    trackingNumber: pkg.trackingNumber || 'N/A',
    statusRaw: statusRaw,
    statusLabel: label,
    percentage,
    
    description: pkg.description || "Sans description",
    weight: `${pkg.weight || 0} kg`,
    dimensions: pkg.dimensions && pkg.dimensions !== "{}" ? pkg.dimensions : "-",
    specialInstructions: pkg.specialInstructions || "Aucune",
    price: (pkg.deliveryFee || pkg.shippingCost || 0).toLocaleString() + " FCFA",
    paymentStatus: pkg.paymentStatus === 'PAID' ? 'Payé' : 'En attente de paiement',

    lastUpdate: updatedAt,
    estimatedDelivery: pkg.estimatedDeliveryDate 
      ? new Date(pkg.estimatedDeliveryDate).toLocaleDateString('fr-FR') 
      : "Non estimée",
    
    // On privilégie le nom si dispo, sinon on masque l'ID
    senderName: pkg.senderName ? pkg.senderName : (pkg.senderId ? `Client #${pkg.senderId.substring(0,6)}` : "Inconnu"),
    recipientName: pkg.recipientName || "Destinataire",
    recipientPhone: pkg.recipientPhone || "",
    
    // Mapping précis des lieux
    pickupAddress: pkg.pickupAddress || pkg.departureRelayPointId || "Point Départ",
    deliveryAddress: pkg.deliveryAddress || pkg.arrivalRelayPointId || "Point Arrivée",
    
    timeline: timeline,
    
    isFragile: pkg.packageType === 'FRAGILE',
    isInsured: (pkg.value && pkg.value > 0) ? true : false
  };
};


export default function TrackPackageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // États
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pkg, setPkg] = useState<TrackedPackageUI | null>(null);
  
  // États Scanner
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanStream, setScanStream] = useState<MediaStream | null>(null);

  // Init Auto via URL
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setSearchInput(ref);
      handleSearch(ref);
    }
  }, [searchParams]);

  // Nettoyage caméra
  useEffect(() => {
    return () => {
      if (scanStream) scanStream.getTracks().forEach(track => track.stop());
    };
  }, [scanStream]);

  // ⚡ FONCTION DE RECHERCHE PRINCIPALE
  const handleSearch = async (forceInput?: string) => {
    const query = (forceInput || searchInput).trim();
    if (!query) return;

    setLoading(true);
    setError(null);
    setPkg(null);
    setShowScanner(false);

    try {
      console.log(`🔍 Fetching Tracking for: ${query}`);
      
      // Appel au Service et force du typage en any pour vérification souple
      const response = (await packageService.trackPackage(query)) as any;
      
      // VÉRIFICATION DE VALIDITÉ avec support snake_case
      const isDirectPackage = response && (response.trackingNumber || response.tracking_number);
      const isWrappedPackage = response && response.package && (response.package.trackingNumber || response.package.tracking_number);

      if (!isDirectPackage && !isWrappedPackage) {
          throw new Error("Colis introuvable. Vérifiez le numéro de suivi.");
      }

      // Normalisation de la réponse
      const unifiedData = isWrappedPackage 
          ? response 
          : { package: response, history: [] };

      // Mapping UI
      const uiData = mapBackendToUI(unifiedData);
      setPkg(uiData);

    } catch (err: any) {
      console.error("Tracking Error:", err);
      const msg = err.message || "Erreur technique lors de la recherche.";
      setError(msg.includes('404') ? "Numéro de suivi inconnu." : msg);
    } finally {
      setLoading(false);
    }
  };

  // Gestion Couleurs Statuts
  const getStatusColor = (raw: string) => {
     if (raw.includes('RECU') || raw.includes('LIVRE') || raw.includes('DELIVERED')) return 'bg-green-500 text-white';
     if (raw.includes('TRANSIT') || raw.includes('DEPART')) return 'bg-blue-500 text-white';
     if (raw.includes('ANNULE') || raw.includes('CANCELLED')) return 'bg-red-500 text-white';
     return 'bg-orange-500 text-white'; // Par défaut (Attente, Arrivé au relais)
  };

  // Simulation Scanner
  const toggleScanner = async () => {
    if (showScanner) {
      setShowScanner(false);
      if (scanStream) {
        scanStream.getTracks().forEach(track => track.stop());
        setScanStream(null);
      }
    } else {
      setShowScanner(true);
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setScanStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setTimeout(() => {
            // Ici il faudrait utiliser une lib QR (ex: jsQR)
            alert("Ceci est une simulation de scan.\nEn production, le QR code serait décodé ici.");
            setShowScanner(false);
            if(stream) stream.getTracks().forEach(t => t.stop());
        }, 4000);
      } catch (e) {
        setError("Impossible d'accéder à la caméra.");
        setShowScanner(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col font-sans">
      <main className="flex-grow pt-24 px-4 sm:px-6 relative z-10 pb-20">
        
        {/* Decoration BG */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-orange-100/50 to-transparent dark:from-orange-950/20 pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* ZONE RECHERCHE */}
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Suivi de Colis
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Entrez votre numéro de suivi pour localiser votre expédition.
            </p>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative max-w-lg mx-auto"
            >
              <div className="relative group shadow-xl rounded-2xl bg-white dark:bg-slate-800 border-2 border-transparent focus-within:border-orange-500 dark:focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/20 transition-all">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Ex: PND2025..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)} // Ne pas forcer UpperCase ici pour UX, on le fera au submit
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-28 py-4 bg-transparent outline-none text-slate-900 dark:text-white font-mono tracking-wide font-bold placeholder:font-sans placeholder:text-slate-400 placeholder:font-normal"
                />
                
                <div className="absolute right-2 top-2 bottom-2 flex gap-2">
                    <button 
                        onClick={toggleScanner}
                        className="px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
                        title="Scanner QR"
                    >
                        <QrCode className="w-5 h-5"/>
                    </button>
                    <button
                        onClick={() => handleSearch()}
                        disabled={loading || !searchInput.trim()}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Suivre"}
                    </button>
                </div>
              </div>
            </motion.div>

            {/* ERREUR */}
            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, y: -10 }} 
                        animate={{ opacity: 1, height: "auto", y: 0 }} 
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl inline-flex items-center gap-2 max-w-lg mx-auto"
                    >
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-sm font-medium">{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ZONE CAMERA SCANNER */}
            <AnimatePresence>
            {showScanner && (
                <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="mx-auto max-w-sm bg-black rounded-2xl overflow-hidden shadow-2xl relative mt-6 aspect-square">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-56 h-56 border-2 border-orange-500 rounded-lg relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 animate-[scan_2s_infinite]"></div>
                        </div>
                    </div>
                    <button onClick={toggleScanner} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full backdrop-blur-md hover:bg-white/30 transition">
                        <X className="text-white w-6 h-6"/>
                    </button>
                    <p className="absolute bottom-6 left-0 right-0 text-center text-white text-sm font-medium drop-shadow-md">
                        Placez le QR Code dans le cadre
                    </p>
                </motion.div>
            )}
            </AnimatePresence>
          </div>

          {/* CARTE DE RÉSULTATS */}
          <AnimatePresence mode="wait">
            {pkg && !loading && (
              <motion.div 
                variants={cardVariants}
                initial="hidden" 
                animate="visible"
                exit="exit"
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                
                {/* 1. TOP BANNER */}
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                    Colis Standard
                                </span>
                                {pkg.percentage === 100 && (
                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg">
                                        <CheckCircle className="w-3 h-3" /> Terminé
                                    </span>
                                )}
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                                {pkg.trackingNumber}
                            </h2>
                        </div>

                        <div className="text-right">
                             <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm mb-2 ${getStatusColor(pkg.statusRaw)}`}>
                                {pkg.statusLabel}
                             </div>
                             <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1">
                                <Clock className="w-3 h-3" /> Mise à jour : {pkg.lastUpdate}
                             </p>
                        </div>
                    </div>
                </div>
                {/* 2. PROGRESS BAR (VISUAL TIMELINE) - Version Sophistiquée */}
                <div className="p-6 md:p-10 bg-gradient-to-br from-slate-50 via-white to-orange-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-orange-950/20">
                    <div className="relative my-12">
                        {/* Ligne de fond avec dégradé subtil */}
                        <div className="absolute top-1/2 left-0 w-full h-1.5 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded-full -translate-y-1/2 shadow-inner" />
                        
                        {/* Ligne remplie avec effet lumineux animé */}
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pkg.percentage}%` }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            className="absolute top-1/2 left-0 h-1.5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 rounded-full -translate-y-1/2 shadow-[0_0_20px_rgba(249,115,22,0.6)]"
                            style={{
                                boxShadow: '0 0 20px rgba(249,115,22,0.6), 0 0 40px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.3)'
                            }}
                        >
                            {/* Effet de brillance animée */}
                            <motion.div 
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 2 }}
                                className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
                            />
                        </motion.div>

                        {/* Points d'étapes avec icônes */}
                        <div className="flex justify-between relative z-10">
                             {[
                                 { label: 'Enregistré', icon: FileText, percent: 0 },
                                 { label: 'Départ', icon: Package, percent: 25 },
                                 { label: 'Transit', icon: Truck, percent: 50 },
                                 { label: 'Relais', icon: MapPin, percent: 75 },
                                 { label: 'Livré', icon: CheckCircle, percent: 100 }
                             ].map((step, idx) => {
                                 const isPassed = pkg.percentage >= step.percent;
                                 const isCurrent = pkg.percentage >= step.percent && pkg.percentage < (idx < 4 ? [0,25,50,75,100][idx+1] : 100);
                                 const Icon = step.icon;
                                 
                                 return (
                                     <div key={step.label} className="flex flex-col items-center relative group">
                                         {/* Cercle avec icône */}
                                         <motion.div 
                                            initial={{ scale: 0, rotate: -180 }} 
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ 
                                                delay: idx * 0.15, 
                                                duration: 0.6,
                                                type: "spring",
                                                stiffness: 200
                                            }}
                                            className={`
                                                w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 relative
                                                ${isPassed 
                                                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/50 dark:shadow-orange-500/30' 
                                                    : 'bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600'
                                                }
                                                ${isCurrent ? 'ring-4 ring-orange-200 dark:ring-orange-900/50 scale-110' : ''}
                                                hover:scale-110 cursor-pointer
                                            `}
                                         >
                                             {/* Effet de pulse pour l'étape courante */}
                                             {isCurrent && (
                                                 <motion.div 
                                                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="absolute inset-0 rounded-2xl bg-orange-400"
                                                 />
                                             )}
                                             
                                             <Icon className={`
                                                 w-6 h-6 relative z-10 transition-all duration-300
                                                 ${isPassed 
                                                     ? 'text-white' 
                                                     : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'
                                                 }
                                             `} />
                                             
                                             {/* Badge de validation */}
                                             {isPassed && pkg.percentage > step.percent && (
                                                 <motion.div 
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: idx * 0.15 + 0.3 }}
                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                                                 >
                                                     <CheckCircle className="w-3 h-3 text-white" />
                                                 </motion.div>
                                             )}
                                         </motion.div>
                                         
                                         {/* Label avec animation */}
                                         <motion.span 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.15 + 0.2 }}
                                            className={`
                                                text-xs font-bold uppercase mt-3 text-center transition-all duration-300
                                                ${isPassed 
                                                    ? 'text-orange-600 dark:text-orange-400' 
                                                    : 'text-slate-400 dark:text-slate-500'
                                                }
                                                ${isCurrent ? 'text-orange-700 dark:text-orange-300 scale-105' : ''}
                                                hidden sm:block max-w-[60px] leading-tight
                                            `}
                                         >
                                             {step.label}
                                         </motion.span>
                                         
                                         {/* Tooltip au survol */}
                                         <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                                             <div className="bg-slate-900 dark:bg-slate-700 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-xl">
                                                 {step.label}
                                                 <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45"></div>
                                             </div>
                                         </div>
                                     </div>
                                 )
                             })}
                        </div>
                        
                        {/* Pourcentage affiché */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="text-center mt-8"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700">
                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Progression : 
                                </span>
                                <span className="text-lg font-black text-orange-600 dark:text-orange-400">
                                    {pkg.percentage}%
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* 3. GRID D'INFORMATIONS */}
                <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* GAUCHE: ITINÉRAIRE */}
                    <div className="space-y-6">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                           <MapPin className="w-5 h-5 text-orange-500"/> Itinéraire
                        </h3>
                        <div className="relative border-l-2 border-slate-200 dark:border-slate-700 pl-6 ml-2 space-y-8">
                            <div className="relative">
                                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border-4 border-blue-500 shadow-sm"></div>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Expéditeur</p>
                                <p className="font-bold text-slate-800 dark:text-white">{pkg.senderName}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{pkg.pickupAddress}</p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border-4 border-green-500 shadow-sm"></div>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Destinataire</p>
                                <p className="font-bold text-slate-800 dark:text-white">{pkg.recipientName}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{pkg.deliveryAddress}</p>
                            </div>
                        </div>
                    </div>

                    {/* DROITE: INFO COLIS */}
                    <div className="space-y-6">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                           <Package className="w-5 h-5 text-orange-500"/> Détails
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600">
                                 <p className="text-[10px] text-slate-400 uppercase font-bold">Poids</p>
                                 <p className="text-lg font-black text-slate-700 dark:text-white flex items-center gap-1"><Weight className="w-4 h-4"/> {pkg.weight}</p>
                             </div>
                             <div className="p-4 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600">
                                 <p className="text-[10px] text-slate-400 uppercase font-bold">Prix Livraison</p>
                                 <p className="text-lg font-black text-slate-700 dark:text-white"><Coins className="w-4 h-4 inline"/> {pkg.price}</p>
                             </div>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-100 dark:border-slate-600">
                            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Contenu & Instructions</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-white line-clamp-2">
                                "{pkg.description}"
                            </p>
                            <div className="mt-2 flex gap-2">
                                {pkg.isFragile && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800">Fragile</span>}
                                {pkg.isInsured && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">Assuré</span>}
                            </div>
                        </div>
                    </div>

                </div>

                {/* 4. TIMELINE DÉTAILLÉE (Optionnel: Toggle ou toujours affiché) */}
                <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-700">
                     <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2"><FileText className="w-5 h-5 text-orange-500"/> Historique Détaillé</h3>
                     <div className="space-y-4">
                         {pkg.timeline.map((log, i) => (
                             <div key={i} className="flex gap-4 items-start group">
                                 <div className="flex flex-col items-center mt-1">
                                     <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-orange-500 ring-4 ring-orange-100 dark:ring-orange-900/30' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                     {i < pkg.timeline.length - 1 && <div className="w-0.5 h-full bg-slate-100 dark:bg-slate-700 my-1 group-hover:bg-orange-200 dark:group-hover:bg-slate-600 transition-colors"></div>}
                                 </div>
                                 <div>
                                     <div className="flex flex-wrap items-baseline gap-2">
                                        <p className={`text-sm font-bold ${i===0 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {log.label}
                                        </p>
                                        <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{log.date}</span>
                                     </div>
                                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{log.description}</p>
                                 </div>
                             </div>
                         ))}
                     </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
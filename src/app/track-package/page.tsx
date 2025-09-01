import React, { useState, useEffect, useRef } from 'react';
import {
  QrCodeIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ArrowUturnLeftIcon,
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  CubeIcon,
  ClockIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import {
  Package,
  Sparkles,
  AlertTriangle,
  Search,
  Loader2,
  MapPin as LucideMapPin,
  Clock,
  Phone,
  User,
  Building,
  FileText,
  MessageSquare,
  Send,
  CheckCheck,
  AlertCircle,
  Info,
  Route,
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

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

interface ClaimForm {
  type: 'damaged' | 'lost' | 'delay' | 'other';
  description: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  priority: 'low' | 'medium' | 'high';
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
};

const TrackPackagePage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimForm, setClaimForm] = useState<ClaimForm>({
    type: 'other',
    description: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    priority: 'medium'
  });
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mockTrackingData: Record<string, TrackingInfo> = {
    'TRK001XYZ': {
      trackingNumber: 'TRK001XYZ',
      status: 'En transit',
      senderName: 'Marie Dubois',
      senderPhone: '+237 678 901 234',
      recipientName: 'Jean Martin',
      recipientPhone: '+237 690 123 456',
      departurePoint: 'Douala Centre',
      arrivalPoint: 'Yaoundé Mvan',
      description: 'Vêtements et accessoires',
      weight: '2.5',
      estimatedDelivery: '2025-09-03',
      lastUpdate: '2025-09-01 14:30',
      currentLocation: 'Edéa - Point relais intermédiaire',
      trackingHistory: [
        { date: '2025-08-30 09:15', status: 'Colis déposé', location: 'Douala Centre', description: 'Colis accepté et enregistré' },
        { date: '2025-08-30 16:45', status: 'En préparation', location: 'Douala Centre', description: 'Préparation pour expédition' },
        { date: '2025-08-31 08:00', status: 'Au départ', location: 'Douala Centre', description: 'Colis quitté le point de départ' },
        { date: '2025-09-01 14:30', status: 'En transit', location: 'Edéa', description: 'Passage par point relais intermédiaire' }
      ]
    },
    'TRK002ABC': {
      trackingNumber: 'TRK002ABC',
      status: 'Arrivé au relais',
      senderName: 'Paul Nguyen',
      senderPhone: '+237 677 890 123',
      recipientName: 'Sophie Kamga',
      recipientPhone: '+237 694 567 890',
      departurePoint: 'Yaoundé Nlongkak',
      arrivalPoint: 'Bafoussam Centre',
      description: 'Documents et matériel informatique',
      weight: '1.8',
      estimatedDelivery: '2025-09-02',
      lastUpdate: '2025-09-01 11:20',
      currentLocation: 'Bafoussam Centre',
      trackingHistory: [
        { date: '2025-08-29 14:20', status: 'Colis déposé', location: 'Yaoundé Nlongkak', description: 'Colis accepté et enregistré' },
        { date: '2025-08-30 07:30', status: 'Au départ', location: 'Yaoundé Nlongkak', description: 'Colis quitté le point de départ' },
        { date: '2025-08-31 15:45', status: 'En transit', location: 'Bafia', description: 'Passage par point relais intermédiaire' },
        { date: '2025-09-01 11:20', status: 'Arrivé au relais', location: 'Bafoussam Centre', description: 'Colis disponible pour retrait' }
      ]
    },
    'TRK003DEF': {
      trackingNumber: 'TRK003DEF',
      status: 'Livré',
      senderName: 'Ahmed Hassan',
      senderPhone: '+237 675 432 109',
      recipientName: 'Claire Fotso',
      recipientPhone: '+237 698 765 432',
      departurePoint: 'Garoua Marché',
      arrivalPoint: 'Maroua Centre',
      description: 'Produits artisanaux',
      weight: '3.2',
      estimatedDelivery: '2025-08-31',
      lastUpdate: '2025-08-31 16:45',
      currentLocation: 'Livré',
      trackingHistory: [
        { date: '2025-08-28 10:00', status: 'Colis déposé', location: 'Garoua Marché', description: 'Colis accepté et enregistré' },
        { date: '2025-08-29 08:15', status: 'Au départ', location: 'Garoua Marché', description: 'Colis quitté le point de départ' },
        { date: '2025-08-30 12:30', status: 'En transit', location: 'Guider', description: 'Passage par point relais intermédiaire' },
        { date: '2025-08-31 09:20', status: 'Arrivé au relais', location: 'Maroua Centre', description: 'Colis disponible pour retrait' },
        { date: '2025-08-31 16:45', status: 'Livré', location: 'Maroua Centre', description: 'Colis remis au destinataire' }
      ]
    }
  };

  const resetPageState = () => {
    setSearchInput('');
    setIsLoading(false);
    setTrackingInfo(null);
    setError(null);
    setShowClaimForm(false);
    setClaimSubmitted(false);
  };

  const decodeQRFromCanvas = (): string | null => {
    if (!videoRef.current || !canvasRef.current || !videoRef.current.videoWidth || !videoRef.current.videoHeight) return null;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const video = videoRef.current;
    if (!context) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (Math.random() > 0.85) {
        return ['TRK001XYZ', 'TRK002ABC', 'TRK003DEF'][Math.floor(Math.random() * 3)];
      }
    } catch (e) {
      console.error("Canvas draw error:", e);
    }
    return null;
  };

  const startScanInterval = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    scanIntervalRef.current = setInterval(() => {
      if (!isScanning || !streamRef.current) {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        return;
      }
      const detectedCode = decodeQRFromCanvas();
      if (detectedCode) {
        setSearchInput(detectedCode.toUpperCase());
        handleStopScan(true);
        setTimeout(() => handleSearchPackage(detectedCode.toUpperCase()), 100);
      }
    }, 500);
  };

  const handleScanQRCode = async () => {
    setIsScanning(true);
    setError(null);
    setTrackingInfo(null);
    
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 360 }, height: { ideal: 360 } }
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        startScanInterval();
        
        scanTimeoutRef.current = setTimeout(() => {
          if (isScanning && streamRef.current) {
            handleStopScan();
            if (!trackingInfo) setError("Aucun QR code détecté après 15 secondes.");
          }
        }, 15000);
      }
    } catch (err) {
      let msg = "Erreur d'accès à la caméra. ";
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") msg += "Veuillez autoriser l'accès à la caméra.";
        else if (err.name === "NotFoundError") msg += "Aucune caméra compatible n'a été trouvée.";
        else msg += "Détail: " + err.message;
      }
      setError(msg);
      setIsScanning(false);
    }
  };

  const handleStopScan = (codeFound = false) => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    scanIntervalRef.current = null;
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = null;
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    }
    
    if (!codeFound) setIsScanning(false);
  };

  useEffect(() => () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
  }, []);

  const handleSearchPackage = async (value?: string) => {
    const query = (value || searchInput).trim().toUpperCase();
    if (!query) {
      setError('Veuillez entrer un numéro de suivi.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTrackingInfo(null);
    setShowClaimForm(false);
    
    if (value && searchInput !== value) setSearchInput(value);
    
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const data = mockTrackingData[query];
      if (data) {
        setTrackingInfo(data);
      } else {
        throw new Error("Colis non trouvé.");
      }
    } catch (err: any) {
      setError(`Erreur de recherche pour "${query}": ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColorClasses = (status: TrackingInfo['status']) => {
    switch (status) {
      case 'Au départ': return 'bg-gradient-to-r from-orange-400 to-red-500 text-white';
      case 'En transit': return 'bg-gradient-to-r from-orange-500 to-amber-600 text-white';
      case 'Arrivé au relais': return 'bg-gradient-to-r from-orange-600 to-yellow-600 text-white';
      case 'En cours de livraison': return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
      case 'Livré': return 'bg-gradient-to-r from-green-600 to-emerald-700 text-white';
      default: return 'bg-gradient-to-r from-slate-500 to-gray-600 text-white';
    }
  };

  const getStatusIcon = (status: TrackingInfo['status']) => {
    switch (status) {
      case 'Au départ': return <Package className="w-7 h-7" />;
      case 'En transit': return <TruckIcon className="w-7 h-7" />;
      case 'Arrivé au relais': return <MapPinIcon className="w-7 h-7" />;
      case 'En cours de livraison': return <TruckIcon className="w-7 h-7" />;
      case 'Livré': return <CheckCircleIcon className="w-7 h-7" />;
      default: return <Package className="w-7 h-7" />;
    }
  };

  const handleClaimSubmit = async () => {
    if (!claimForm.contactName.trim() || !claimForm.contactPhone.trim() || !claimForm.description.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsSubmittingClaim(true);
    setError(null);

    try {
      // Simulation d'envoi de réclamation
      await new Promise(resolve => setTimeout(resolve, 2000));
      setClaimSubmitted(true);
      setShowClaimForm(false);
    } catch (err) {
      setError("Erreur lors de l'envoi de la réclamation. Veuillez réessayer.");
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 text-slate-800 p-0 font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-orange-200/30 to-amber-300/20 rounded-full blur-3xl"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 3, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="absolute top-1/3 -left-32 w-80 h-80 bg-gradient-to-br from-yellow-200/20 to-orange-300/15 rounded-full blur-3xl"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 2.5, delay: 1, repeat: Infinity, repeatType: "reverse" }}
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-red-200/20 to-orange-300/15 rounded-full blur-3xl"
        />
        
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-20 text-orange-300/30"
        >
          <Package className="w-12 h-12" />
        </motion.div>
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 3.5, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-32 left-32 text-amber-300/30"
        >
          <TruckIcon className="w-10 h-10" />
        </motion.div>
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 right-12 text-orange-300/25"
        >
          <Sparkles className="w-8 h-8" />
        </motion.div>
      </div>

      <motion.main
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16 relative z-20"
      >
        <div className="mb-8 text-center">
          <div className="flex flex-col items-center">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }} 
              animate={{ scale: 1, rotate: 0 }} 
              transition={{ type: 'spring', stiffness: 260, damping: 15, delay: 0.1 }}
              className="relative mb-4"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-2xl shadow-orange-500/25">
                <Search className="w-9 h-9 text-white" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center"
              >
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </motion.div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-orange-900 via-orange-800 to-orange-900 bg-clip-text text-transparent mb-2"
            >
              Retrouver mon Colis
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-slate-600 text-base max-w-2xl leading-relaxed mb-6"
            >
              Suivez votre colis en temps réel et soyez informé de chaque étape de son acheminement.
            </motion.p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!trackingInfo && !isScanning && (
            <motion.section 
              key="search-scan" 
              variants={cardVariants} 
              initial="hidden" 
              animate="visible" 
              exit="exit"
              className="relative bg-white/70 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-white/50 mb-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-amber-50/30 rounded-2xl" />
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-orange-200/20 to-transparent rounded-full -translate-y-12 translate-x-12" />
              
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
                  >
                    <Search className="w-7 h-7 text-white" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">Rechercher votre Colis</h2>
                  <p className="text-slate-500 text-sm">Entrez votre numéro de suivi ou scannez le QR code</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch gap-3">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        value={searchInput} 
                        onChange={(e) => setSearchInput(e.target.value.toUpperCase())} 
                        placeholder="Numéro de suivi (ex: TRK001XYZ)"
                        className="w-full pl-10 pr-3 py-3 border-2 border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base bg-white/80 transition-all hover:border-slate-300"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchPackage()} 
                      />
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -1 }} 
                      whileTap={{ scale: 0.98 }} 
                      onClick={() => handleSearchPackage()} 
                      disabled={isLoading || !searchInput.trim()}
                      className="flex items-center justify-center bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md disabled:opacity-60 transition-all hover:shadow-lg"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                      )} 
                      Rechercher
                    </motion.button>
                  </div>
                  
                  <div className="flex items-center my-4">
                    <hr className="flex-grow border-slate-200" />
                    <span className="px-3 text-xs text-slate-500 font-medium bg-white rounded-full">ou</span>
                    <hr className="flex-grow border-slate-200" />
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -1 }} 
                    whileTap={{ scale: 0.98 }} 
                    onClick={handleScanQRCode} 
                    disabled={isLoading || isScanning}
                    className="w-full flex items-center justify-center bg-white text-slate-700 border-2 border-slate-300 font-medium py-3 px-5 rounded-lg shadow-md disabled:opacity-60 transition-all hover:bg-slate-50 hover:shadow-lg"
                  >
                    <QrCodeIcon className="w-5 h-5 mr-2" /> 
                    Scanner le QR Code
                  </motion.button>

                  <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h3 className="font-semibold text-orange-800 mb-2 flex items-center">
                      <Info className="w-4 h-4 mr-1" />
                      Exemples de numéros de suivi
                    </h3>
                    <div className="text-sm text-orange-700 space-y-1">
                      <p><code className="bg-orange-100 px-2 py-1 rounded">TRK001XYZ</code> - Colis en transit</p>
                      <p><code className="bg-orange-100 px-2 py-1 rounded">TRK002ABC</code> - Colis arrivé au relais</p>
                      <p><code className="bg-orange-100 px-2 py-1 rounded">TRK003DEF</code> - Colis livré</p>
                    </div>
                  </div>
                </div>
                
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="mt-4 p-3 bg-red-50 border-l-4 border-red-400 rounded-lg flex items-start text-red-700 text-sm shadow-sm"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2.5 flex-shrink-0 mt-0.5" />
                    <span className="flex-1">{error}</span>
                  </motion.div>
                )}
              </div>
            </motion.section>
          )}

          {isScanning && (
            <motion.section 
              key="scanning" 
              variants={cardVariants} 
              initial="hidden" 
              animate="visible" 
              exit="exit"
              className="relative bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl border border-white/50 mb-6"
            >
              <div className="relative z-10 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <QrCodeIcon className="w-7 h-7 text-white" />
                </motion.div>
                
                <h2 className="text-xl font-bold text-slate-800 mb-4">Scan du QR Code en cours...</h2>
                
                <div className="relative mx-auto w-64 h-64 sm:w-80 sm:h-80 bg-slate-800 rounded-xl overflow-hidden shadow-lg border-2 border-white/20">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className="absolute inset-2 border-2 border-orange-400/80 rounded-lg">
                    <motion.div
                      animate={{ y: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-lg shadow-orange-400/50"
                    />
                  </div>
                </div>
                
                <p className="text-slate-600 text-sm mt-4 mb-5">Positionnez le QR code du colis dans le cadre.</p>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={() => handleStopScan()}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md transition-all inline-flex items-center text-sm"
                >
                  <XMarkIcon className="w-4 h-4 mr-1.5" /> 
                  Annuler Scan
                </motion.button>
              </div>
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-red-50 border-l-4 border-red-400 rounded-lg flex items-start text-red-700 text-sm"
                >
                  <AlertTriangle className="w-4 h-4 mr-2.5 flex-shrink-0 mt-0.5" /> 
                  <span className="flex-1">{error}</span>
                </motion.div>
              )}
            </motion.section>
          )}

          {trackingInfo && !showClaimForm && (
            <motion.section 
              key="tracking-details" 
              variants={cardVariants} 
              initial="hidden" 
              animate="visible" 
              exit="exit" 
              className="space-y-6"
            >
              {/* Status Header */}
              <div className={`relative p-5 rounded-xl shadow-lg border-l-4 ${getStatusColorClasses(trackingInfo.status)} overflow-hidden`}>
                <div className="absolute top-0 right-0 w-28 h-28 opacity-10">
                  {getStatusIcon(trackingInfo.status)}
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="p-2.5 bg-white/20 rounded-lg"
                    >
                      {getStatusIcon(trackingInfo.status)}
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-bold mb-0.5">Colis {trackingInfo.trackingNumber}</h3>
                      <p className="text-xs opacity-90">Statut : {trackingInfo.status}</p>
                      {trackingInfo.currentLocation && (
                        <p className="text-xs opacity-80 flex items-center mt-1">
                          <LucideMapPin className="w-3 h-3 mr-1" />
                          {trackingInfo.currentLocation}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-left sm:text-right bg-white/10 p-2.5 rounded-md backdrop-blur-sm text-xs">
                    <p className="opacity-90 mb-0.5">Livraison Prévue</p>
                    <p className="font-semibold text-sm">{new Date(trackingInfo.estimatedDelivery).toLocaleDateString('fr-CM')}</p>
                    <p className="opacity-80 text-xs mt-1">Mise à jour : {trackingInfo.lastUpdate}</p>
                  </div>
                </div>
              </div>

              {/* Package Details Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                <motion.div 
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="relative bg-gradient-to-br from-orange-50 to-amber-100/50 p-4 rounded-xl shadow-md border border-orange-200/80 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 opacity-5 text-orange-500">
                    <User className="w-full h-full" />
                  </div>
                  <div className="relative z-10">
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center text-base">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center mr-2.5 shadow-md">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      Expéditeur
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-start py-0.5">
                        <span className="text-slate-600 font-medium">Nom:</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[65%]">{trackingInfo.senderName}</span>
                      </div>
                      <div className="flex justify-between items-start py-0.5">
                        <span className="text-slate-600 font-medium">Tél:</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[65%]">{trackingInfo.senderPhone}</span>
                      </div>
                      <div className="flex justify-between items-start py-0.5">
                        <span className="text-slate-600 font-medium">Départ:</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[65%]">{trackingInfo.departurePoint}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="relative bg-gradient-to-br from-amber-50 to-orange-100/50 p-4 rounded-xl shadow-md border border-amber-200/80 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 opacity-5 text-amber-500">
                    <User className="w-full h-full" />
                  </div>
                  <div className="relative z-10">
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center text-base">
                      <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-2.5 shadow-md">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      Destinataire
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-start py-0.5">
                        <span className="text-slate-600 font-medium">Nom:</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[65%]">{trackingInfo.recipientName}</span>
                      </div>
                      <div className="flex justify-between items-start py-0.5">
                        <span className="text-slate-600 font-medium">Tél:</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[65%]">{trackingInfo.recipientPhone}</span>
                      </div>
                      <div className="flex justify-between items-start py-0.5">
                        <span className="text-slate-600 font-medium">Destination:</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[65%]">{trackingInfo.arrivalPoint}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="relative bg-gradient-to-br from-yellow-50 to-orange-100/50 p-4 rounded-xl shadow-md border border-yellow-200/80 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 opacity-5 text-yellow-500">
                    <Package className="w-full h-full" />
                  </div>
                  <div className="relative z-10">
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center text-base">
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mr-2.5 shadow-md">
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      Détails du Colis
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-start py-0.5">
                        <span className="text-slate-600 font-medium">Description:</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[65%]">{trackingInfo.description}</span>
                      </div>
                      <div className="flex justify-between items-start py-0.5">
                        <span className="text-slate-600 font-medium">Poids:</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[65%]">{trackingInfo.weight} kg</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="relative bg-gradient-to-br from-red-50 to-orange-100/50 p-4 rounded-xl shadow-md border border-red-200/80 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 opacity-5 text-red-500">
                    <Route className="w-full h-full" />
                  </div>
                  <div className="relative z-10">
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center text-base">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-600 rounded-lg flex items-center justify-center mr-2.5 shadow-md">
                        <Route className="w-4 h-4 text-white" />
                      </div>
                      Itinéraire
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-slate-600">{trackingInfo.departurePoint}</span>
                      </div>
                      <div className="flex items-center space-x-2 ml-1">
                        <div className="w-1 h-6 bg-orange-300 border-l-2 border-dashed border-orange-400"></div>
                      </div>
                      {trackingInfo.currentLocation && trackingInfo.currentLocation !== trackingInfo.arrivalPoint && trackingInfo.status !== 'Livré' && (
                        <>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                            <span className="text-slate-800 font-medium">{trackingInfo.currentLocation}</span>
                          </div>
                          <div className="flex items-center space-x-2 ml-1">
                            <div className="w-1 h-6 bg-orange-300 border-l-2 border-dashed border-orange-400"></div>
                          </div>
                        </>
                      )}
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${trackingInfo.status === 'Livré' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                        <span className={`${trackingInfo.status === 'Livré' ? 'text-green-800 font-medium' : 'text-slate-600'}`}>
                          {trackingInfo.arrivalPoint}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Tracking History */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/50"
              >
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-600" />
                  Historique de Suivi
                </h3>
                
                <div className="space-y-4">
                  {trackingInfo.trackingHistory.map((event, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-3"
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-orange-500' : 'bg-orange-300'} shadow-sm`}></div>
                        {index < trackingInfo.trackingHistory.length - 1 && (
                          <div className="w-0.5 h-8 bg-orange-200 mt-1"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{event.status}</p>
                            <p className="text-xs text-slate-600 flex items-center mt-0.5">
                              <LucideMapPin className="w-3 h-3 mr-1" />
                              {event.location}
                            </p>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 sm:mt-0">
                            {new Date(event.date).toLocaleString('fr-CM')}
                          </p>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{event.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }} 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowClaimForm(true)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all flex items-center justify-center text-base group"
                >
                  <MessageSquare className="w-5 h-5 mr-2 group-hover:rotate-6 transition-transform" />
                  Signaler un Problème
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={resetPageState}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center sm:flex-none shadow-md"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Nouveau Suivi
                </motion.button>
              </div>
            </motion.section>
          )}

          {showClaimForm && trackingInfo && (
            <motion.section 
              key="claim-form" 
              variants={cardVariants} 
              initial="hidden" 
              animate="visible" 
              exit="exit"
              className="relative bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-white/50"
            >
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Signaler un Incident</h2>
                    <p className="text-slate-500 text-sm">Colis : {trackingInfo.trackingNumber}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Type d'incident</label>
                    <select 
                      value={claimForm.type}
                      onChange={(e) => setClaimForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-base"
                    >
                      <option value="delay">Retard de livraison</option>
                      <option value="damaged">Colis endommagé</option>
                      <option value="lost">Colis perdu</option>
                      <option value="other">Autre problème</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Description détaillée</label>
                    <textarea 
                      value={claimForm.description}
                      onChange={(e) => setClaimForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Décrivez le problème en détail..."
                      className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-base resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Votre nom</label>
                      <input 
                        type="text"
                        value={claimForm.contactName}
                        onChange={(e) => setClaimForm(prev => ({ ...prev, contactName: e.target.value }))}
                        placeholder="Nom complet"
                        className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Téléphone</label>
                      <input 
                        type="tel"
                        value={claimForm.contactPhone}
                        onChange={(e) => setClaimForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                        placeholder="+237 6XXXXXXXX"
                        className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email (optionnel)</label>
                    <input 
                      type="email"
                      value={claimForm.contactEmail}
                      onChange={(e) => setClaimForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                      placeholder="votre.email@exemple.com"
                      className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Priorité</label>
                    <select 
                      value={claimForm.priority}
                      onChange={(e) => setClaimForm(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-base"
                    >
                      <option value="low">Faible - Information générale</option>
                      <option value="medium">Moyenne - Demande de suivi</option>
                      <option value="high">Élevée - Problème urgent</option>
                    </select>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="p-3 bg-red-50 border-l-4 border-red-400 rounded-lg flex items-start text-red-700 text-sm shadow-sm"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="flex-1">{error}</span>
                    </motion.div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }} 
                      whileTap={{ scale: 0.98 }} 
                      onClick={handleClaimSubmit}
                      disabled={isSubmittingClaim}
                      className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg disabled:opacity-50 flex items-center justify-center"
                    >
                      {isSubmittingClaim ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5 mr-2" />
                      )}
                      Envoyer la Réclamation
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }} 
                      whileTap={{ scale: 0.98 }} 
                      onClick={() => setShowClaimForm(false)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-6 rounded-lg flex items-center justify-center sm:flex-none shadow-md"
                    >
                      <ArrowUturnLeftIcon className="w-4 h-4 mr-2" />
                      Annuler
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {claimSubmitted && (
            <motion.section 
              key="claim-success" 
              variants={cardVariants} 
              initial="hidden" 
              animate="visible" 
              exit="exit" 
              className="text-center"
            >
              <div className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-8 sm:p-10 rounded-2xl shadow-xl border border-green-200">
                <div className="relative z-10">
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }} 
                    animate={{ scale: 1, rotate: 0 }} 
                    transition={{ type: 'spring', stiffness: 260, damping: 15, delay: 0.1 }}
                    className="relative mx-auto mb-6"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-green-500/30">
                      <CheckCheck className="w-10 h-10 text-white" />
                    </div>
                  </motion.div>
                  
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.3 }}
                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent mb-3"
                  >
                    Réclamation Envoyée !
                  </motion.h2>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.4 }}
                    className="text-slate-700 text-base mb-6"
                  >
                    Votre réclamation a été enregistrée. Nous vous contacterons dans les plus brefs délais pour résoudre votre problème.
                  </motion.p>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }} 
                    whileTap={{ scale: 0.95 }} 
                    onClick={resetPageState}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg shadow-xl inline-flex items-center text-base group"
                  >
                    <Search className="w-5 h-5 mr-2 group-hover:rotate-6 transition-transform" />
                    Nouveau Suivi
                  </motion.button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </motion.main>
    </div>
  );
};

export default TrackPackagePage;
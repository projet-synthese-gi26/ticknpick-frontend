'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserIcon as UserOutlineIcon,
  TruckIcon,
  MapPinIcon,
  CreditCardIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as SolidCheckCircleIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
import { ArrowBigUpDash, UserPlus as UserPlusIcon, Printer as PrinterIcon, CheckCircle as CheckCircleIcon, ArrowLeftCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import OriginalQRCode from 'qrcode';
import { useAuth } from '@/context/AuthContext';
import { packageService } from '@/services/packageService';

// Imports des composants enfants
import SenderInfoStep from './SenderInfoStep';
import RecipientInfoStep from './RecipientInfoStep';
import PackageInfoStep from './FormulaireColisExpedition';
import RouteSelectionStep from './RouteExpedition';
import SignatureStep from './SignatureStep';
import PaymentStep from './PaymentStepExpedition';

const EXPEDITION_FORM_STORAGE_KEY = 'expedition_form_in_progress';
const STORAGE_KEY_BACKUP = 'shipping_form_temp_data_v2';

// --- INTERFACES DE DONNÉES GLOBALES ---

interface ExpeditionFormData {
  currentStep: number;
  senderData: SenderData;
  recipientData: RecipientData;
  packageData: PackageData;
  routeData: RouteData;
  signatureData: SignatureData;
  pricing: PricingData;
}

interface SenderData {
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  senderCountry: string;
  senderRegion: string;
  senderCity: string;
  senderAddress: string;
  senderLieuDit: string;
}

interface RecipientData {
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  recipientCountry: string;
  recipientRegion: string;
  recipientCity: string;
  recipientAddress: string;
  recipientLieuDit: string;
}

interface PackageData {
  // Accepte string (Base64/URL) pour la persistance ou File
  photo: File | string | null; 
  designation: string;
  description: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  isFragile: boolean;
  isPerishable: boolean;
  isLiquid: boolean;
  isInsured: boolean;
  declaredValue: string;
  transportMethod: 'truck' | 'tricycle' | 'moto' | 'bike' | 'car' | '';
  logistics: 'standard' | 'express_48h' | 'express_24h';
  pickup: boolean;
  delivery: boolean;
}

interface RouteData {
  departurePointId: string | null; // UUID String pour Backend
  arrivalPointId: string | null;   // UUID String pour Backend
  departurePointName: string;
  arrivalPointName: string;
  distanceKm: number;
}

interface SignatureData {
  signatureUrl: string | null;
}

interface PricingData {
  basePrice: number;
  travelPrice: number;
  operatorFee: number;
  totalPrice: number;
}

interface LoggedInUser {
  id: string;
  full_name: string | null;
  phone: string | null;
  email?: string;
  address?: string | null;
  lieu_dit?: string | null;
}

// --- SOUS-COMPOSANT STEPPER ---

const ShippingSteps = ({ currentStep = 1 }: { currentStep?: number }) => {
  const steps = [
    { number: 1, title: "Expéditeur", icon: <UserOutlineIcon className="w-5 h-5" /> },
    { number: 2, title: "Destinataire", icon: <UserOutlineIcon className="w-5 h-5" /> },
    { number: 3, title: "Colis", icon: <TruckIcon className="w-5 h-5" /> },
    { number: 4, title: "Trajet", icon: <MapPinIcon className="w-5 h-5" /> },
    { number: 5, title: "Signature", icon: <PencilIcon className="w-5 h-5" /> },
    { number: 6, title: "Paiement", icon: <CreditCardIcon className="w-5 h-5" /> },
  ];
  return (
    <div className="flex justify-between items-start mb-6 w-full max-w-5xl mx-auto relative px-2">
      {/* Barre de fond */}
      <div className="absolute top-5 left-4 right-4 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full z-0" />
      {/* Barre de progression */}
      <motion.div 
        className="absolute top-5 left-4 h-0.5 bg-orange-400 dark:bg-orange-500 rounded-full shadow-sm z-0"
        initial={{ width: '0%' }}
        animate={{ width: `${Math.min(100, ((currentStep - 1) / (steps.length - 1)) * 100)}%` }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      
      {steps.map((step) => (
        <div key={step.number} className="flex flex-col items-center group text-center relative z-10">
          <motion.div 
            className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
              step.number <= currentStep 
                ? "bg-orange-500 dark:bg-orange-600 text-white shadow-md shadow-orange-500/20" 
                : "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-400"
            }`}
            whileHover={{ scale: 1.05 }}
          >
            {step.number < currentStep ? (
              <SolidCheckCircleIcon className="w-6 h-6" />
            ) : step.number === currentStep ? (
              step.icon
            ) : (
              <span className="text-xs font-bold">{step.number}</span>
            )}
          </motion.div>
          <p className={`text-[10px] sm:text-xs font-semibold mt-1.5 ${step.number <= currentStep ? "text-orange-600 dark:text-orange-400" : "text-gray-400"}`}>
            {step.title}
          </p>
        </div>
      ))}
    </div>
  );
};

// --- COMPOSANT PRINCIPAL ---

export default function ShippingPage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [userProfile, setUserProfile] = useState<LoggedInUser | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string>(''); // Stocké après création API

  // État Principal du Formulaire
  const [formData, setFormData] = useState<ExpeditionFormData>({
    currentStep: 1,
    senderData: { 
      senderName: '', senderPhone: '', senderEmail: '', 
      senderCountry: 'cameroun', senderRegion: '', senderCity: '', senderAddress: '', senderLieuDit: '' 
    },
    recipientData: { 
      recipientName: '', recipientPhone: '', recipientEmail: '', 
      recipientCountry: 'cameroun', recipientRegion: '', recipientCity: '', recipientAddress: '', recipientLieuDit: '' 
    },
    packageData: { 
      photo: null, designation: '', description: '', weight: '', length: '', width: '', height: '',
      isFragile: false, isPerishable: false, isLiquid: false, isInsured: false, declaredValue: '', 
      transportMethod: '', logistics: 'standard', pickup: false, delivery: false 
    },
    routeData: { 
        departurePointId: null, arrivalPointId: null, departurePointName: '', arrivalPointName: '', distanceKm: 0 
    },
    signatureData: { signatureUrl: null },
    pricing: { basePrice: 0, travelPrice: 0, operatorFee: 0, totalPrice: 0 },
  });

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // 1. Initialisation : Auth & LocalStorage Restore
  useEffect(() => {
    // Évite l'hydratation mismatch ou les doubles loads
    if (authLoading) return;

    const initialize = async () => {
      let recoveredData: Partial<ExpeditionFormData> | null = null;
      
      // A. Récupération Cache Local
      try {
        const cached = localStorage.getItem(EXPEDITION_FORM_STORAGE_KEY);
        if (cached) {
          recoveredData = JSON.parse(cached);
          console.log("📥 Cache Formulaire restauré");
        }
      } catch (e) { console.warn("Cache expédition corrompu, nettoyage.", e); localStorage.removeItem(EXPEDITION_FORM_STORAGE_KEY); }

      // B. Récupération Données User (si connecté)
      let userData: LoggedInUser | null = null;
      if (authUser) {
         try {
             // On utilise Supabase pour avoir les détails (adresse, lieu-dit...) non présents dans authUser basique
             const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
             if (profile) {
                 userData = {
                     id: profile.id, full_name: profile.full_name, phone: profile.phone, email: profile.email,
                     address: profile.address || profile.homeAddress, lieu_dit: profile.lieu_dit
                 };
             } else {
                 // Fallback si pas de profil Supabase (juste auth0)
                 userData = { 
                     id: authUser.id, full_name: authUser.name || '', email: authUser.email, phone: '', address: '', lieu_dit: '' 
                 };
             }
             setUserProfile(userData);
         } catch(err) { console.error("Erreur profile fetch", err); }
      }

      // C. Fusion Intelligente
      setFormData(prev => {
          const newData = recoveredData ? { ...prev, ...recoveredData } : { ...prev };
          
          // Si connecté et que les champs sender sont vides (pas écrasés par cache), on pré-remplit
          if (userData && !newData.senderData.senderName) {
              newData.senderData = {
                  ...newData.senderData,
                  senderName: userData.full_name || '',
                  senderPhone: userData.phone || '',
                  senderEmail: userData.email || '',
                  senderAddress: userData.address || '',
                  senderLieuDit: userData.lieu_dit || ''
              };
          }
          return newData;
      });
      
      setIsDataLoaded(true);
    };

    initialize();
  }, [authLoading, authUser]);

  // 2. Persistance Automatique dans le Cache
  useEffect(() => {
    if (!isDataLoaded || formData.currentStep === 7) return; // Ne pas sauver si écran succès
    
    // Nettoyage Photo (si c'est un objet File, on ne peut pas stringify)
    // On suppose que l'étape packageData transforme le File en Base64 ou URL string pour le state.
    // Si c'est un File, on ne le sauvegarde pas dans localStorage
    const stateToSave = {
        ...formData,
        packageData: {
            ...formData.packageData,
            photo: typeof formData.packageData.photo === 'string' ? formData.packageData.photo : null
        }
    };
    localStorage.setItem(EXPEDITION_FORM_STORAGE_KEY, JSON.stringify(stateToSave));

  }, [formData, isDataLoaded]);


  // 3. Reset (Fin ou Annulation)
  const handleReset = () => {
    localStorage.removeItem(EXPEDITION_FORM_STORAGE_KEY);
    window.location.reload();
  };

  const handleCreateAccountRedirect = () => {
    // Si l'utilisateur non-connecté veut s'inscrire après succès (Etape 7)
    const prefill = {
      manager_name: formData.senderData.senderName,
      email: formData.senderData.senderEmail,
      phone_number: formData.senderData.senderPhone,
    };
    localStorage.setItem('registration_prefill', JSON.stringify(prefill));
    router.push('/register');
  };

  const generatePDF = async () => {
        try {
            const doc = new jsPDF();
            const qrUrl = await OriginalQRCode.toDataURL(trackingNumber || "PENDING");
            
            // Design simple pour l'exemple (Vous pouvez remettre votre code PDF élaboré ici)
            doc.setFontSize(22); doc.setTextColor(255, 87, 34); doc.text("TiiBnTick Link", 15, 20);
            doc.addImage(qrUrl, 'PNG', 160, 10, 35, 35);
            doc.setFontSize(10); doc.setTextColor(0);
            
            doc.text(`Tracking: ${trackingNumber}`, 15, 35);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 40);

            doc.setDrawColor(200); doc.line(15, 50, 195, 50);

            doc.setFontSize(12); doc.text("Expéditeur", 15, 60);
            doc.setFontSize(10); doc.text(`${formData.senderData.senderName}`, 15, 66);
            doc.text(`${formData.senderData.senderAddress}`, 15, 72);
            doc.text(`${formData.senderData.senderPhone}`, 15, 78);

            doc.setFontSize(12); doc.text("Destinataire", 110, 60);
            doc.setFontSize(10); doc.text(`${formData.recipientData.recipientName}`, 110, 66);
            doc.text(`${formData.recipientData.recipientAddress}`, 110, 72);
            doc.text(`${formData.recipientData.recipientPhone}`, 110, 78);

            doc.setDrawColor(200); doc.line(15, 90, 195, 90);
            doc.text(`Colis: ${formData.packageData.designation}`, 15, 100);
            doc.text(`Trajet: ${formData.routeData.departurePointName} -> ${formData.routeData.arrivalPointName}`, 15, 106);
            
            doc.save(`Bordereau_${trackingNumber}.pdf`);
        } catch (e) {
            console.error("Erreur PDF", e);
        }
  };

  // --- RENDU DES ÉTAPES ---

  if (!isDataLoaded) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
             <div className="flex flex-col items-center">
                 <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="mt-4 text-orange-600 font-bold">Restauration de la session...</p>
             </div>
          </div>
      );
  }

  const renderStep = () => {
    switch (formData.currentStep) {
      case 1:
        return <SenderInfoStep
          initialData={formData.senderData}
          onContinue={(data) => setFormData(prev => ({ ...prev, senderData: data, currentStep: 2 }))}
          currentUser={userProfile} // Passe le profil si connecté pour les validations internes
        />;
      case 2:
        return <RecipientInfoStep
          initialData={formData.recipientData}
          onContinue={(data) => setFormData(prev => ({ ...prev, recipientData: data, currentStep: 3 }))}
          onBack={() => setFormData(prev => ({ ...prev, currentStep: 1 }))}
        />;
      case 3:
        return <PackageInfoStep
          initialData={formData.packageData as any}
          onContinue={(data, price) => setFormData(prev => ({ 
            ...prev, 
            packageData: data, 
            pricing: { ...prev.pricing, basePrice: price },
            currentStep: 4 
          }))}
          onBack={() => setFormData(prev => ({ ...prev, currentStep: 2 }))}
        />;
      case 4:
        return <RouteSelectionStep
          onContinue={(routeData, travelPrice) => setFormData(prev => ({ 
             ...prev, routeData, pricing: { ...prev.pricing, travelPrice }, currentStep: 5 
          }))}
          onBack={() => setFormData(prev => ({ ...prev, currentStep: 3 }))}
        />;
      case 5:
        return <SignatureStep
          onSubmit={(signatureUrl) => setFormData(prev => ({ ...prev, signatureData: { signatureUrl }, currentStep: 6 }))}
          onBack={() => setFormData(prev => ({ ...prev, currentStep: 4 }))}
        />;
      case 6:
        // Préparation Payload final pour l'étape Paiement
        const fullDataForPayment = {
            ...formData.senderData,
            ...formData.recipientData,
            ...formData.packageData,
            photo: typeof formData.packageData.photo === 'string' ? formData.packageData.photo : null,
            ...formData.routeData,
            ...formData.signatureData,
            // Cast string -> any car RouteData peut contenir null mais backend attend string ID
            departurePointId: formData.routeData.departurePointId as any,
            arrivalPointId: formData.routeData.arrivalPointId as any,
            basePrice: formData.pricing.basePrice,
            travelPrice: formData.pricing.travelPrice
        };

        return <PaymentStep
          allData={fullDataForPayment}
          onBack={() => setFormData(prev => ({ ...prev, currentStep: 5 }))}
          // IMPORTANT: Reçoit le tracking number final de l'API ici
          onPaymentFinalized={(result) => {
             if(result.trackingNumber) setTrackingNumber(result.trackingNumber);
             // Supprime le cache
             localStorage.removeItem(EXPEDITION_FORM_STORAGE_KEY);
             setFormData(prev => ({ ...prev, currentStep: 7 }));
          }}
          currentUser={userProfile}
        />;
        
      case 7:
        // ECRAN DE SUCCÈS
        return (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="min-h-[60vh] flex items-center justify-center p-4">
             <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl max-w-lg w-full text-center border border-gray-100 dark:border-gray-700">
                 <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, delay: 0.2 }} className="inline-block mb-4">
                     <CheckCircleIcon className="w-24 h-24 text-green-500 mx-auto drop-shadow-lg"/>
                 </motion.div>
                 
                 <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-2">Expédition Validée !</h2>
                 <p className="text-gray-500 dark:text-gray-400 mb-6">Le colis est prêt à être déposé au point relais.</p>

                 <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4 rounded-r-lg mb-8 text-left">
                     <p className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider mb-1">Tracking Number</p>
                     <p className="text-3xl font-mono font-black text-slate-800 dark:text-white tracking-widest">{trackingNumber}</p>
                 </div>

                 <button onClick={generatePDF} className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl mb-4 transition-transform active:scale-95 shadow-lg">
                     <PrinterIcon className="w-5 h-5"/> Télécharger le Bordereau
                 </button>

                 {!userProfile && (
                     <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                         <div className="flex items-center justify-center gap-2 mb-2 text-orange-500">
                             <StarIcon className="w-5 h-5"/>
                             <h4 className="font-bold">Astuce Pro</h4>
                         </div>
                         <p className="text-sm text-gray-500 mb-4">Sauvegardez vos expéditions en créant un compte maintenant. Vos infos sont déjà pré-remplies.</p>
                         <button onClick={handleCreateAccountRedirect} className="w-full py-2 border-2 border-orange-500 text-orange-600 dark:text-orange-400 font-bold rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center justify-center gap-2 transition-colors">
                             <UserPlusIcon className="w-4 h-4"/> Créer un compte Client
                         </button>
                     </div>
                 )}

                 <button onClick={handleReset} className="mt-6 text-sm text-gray-400 hover:text-orange-500 underline decoration-dotted underline-offset-4">Faire une autre expédition</button>
             </div>
          </motion.div>
        );

      default: return null;
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 font-sans pb-12 transition-colors duration-300">
      
      <motion.div
      className="text-center mb-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      >
      <button
      onClick={() => router.push('/home')}
      className="mb-2 group flex items-center mx-auto text-orange-600 dark:text-orange-400 text-sm hover:text-orange-700 dark:hover:text-orange-300 transition-colors duration-200"
      >
      <ArrowLeftCircle className="w-4 h-4 mr-1" /> Retour à l'accueil
      </button>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-gray-100">Processus de Dépôt de Colis</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-gray-300 max-w-xl mx-auto">Suivez les étapes pour expédier votre colis en toute simplicité.</p>
      </motion.div>

      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm  -mx-4 px-4 mb-0  dark:border-orange-800/30">
      <ShippingSteps currentStep={formData.currentStep} />
    </div>

      <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-transparent rounded-2xl md:p-0">
              <AnimatePresence mode="wait">
                  <motion.div
                    key={formData.currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                      {renderStep()}
                  </motion.div>
              </AnimatePresence>
          </div>
      </div>
    </div>
  );
}
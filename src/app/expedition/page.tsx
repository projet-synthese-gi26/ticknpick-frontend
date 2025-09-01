'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserIcon as UserOutlineIcon,
  TruckIcon,
  MapPinIcon,
  CreditCardIcon,
  ArrowUturnLeftIcon,
  PencilIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as SolidCheckCircleIcon,
  StarIcon,
  BoltIcon,
  GiftIcon,
} from '@heroicons/react/24/solid';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import SenderInfoStep from './SenderInfoStep';
import RecipientInfoStep from './RecipientInfoStep';
import PackageInfoStep from './FormulaireColisExpedition';
import RouteSelectionStep from './RouteExpedition';
import SignatureStep from './SignatureStep';
import PaymentStep from './PaymentStepExpedition';

const EXPEDITION_FORM_STORAGE_KEY = 'expedition_form_in_progress';

interface ExpeditionFormData {
  currentStep: number;
  senderData: SenderData;
  recipientData: RecipientData;
  packageData: PackageData;
  routeData: RouteData;
  signatureData: SignatureData;
  pricing: {
    basePrice: number;
    travelPrice: number;
    operatorFee: number;
    totalPrice: number;
  };
}

interface SenderData {
  senderName: string;
  senderPhone: string;
  senderEmail: string;      // Ajouté
  senderCountry: string;    // Ajouté
  senderRegion: string;     // Ajouté
  senderCity: string;       // Ajouté
  senderAddress: string;
  senderLieuDit: string;
}

// 2. Mise à jour de l'interface RecipientData
interface RecipientData {
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  recipientCountry: string; // Ajouté
  recipientRegion: string;  // Ajouté
  recipientCity: string;    // Ajouté
  recipientAddress: string;
  recipientLieuDit: string;
  // Les champs genre et age n'existent pas dans le composant enfant, on les retire pour la cohérence
}
// << CORRIGÉ: Mise à jour de l'interface PackageData >>
interface PackageData {
  photo: string | null;
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
  transportMethod: 'truck' | 'tricycle' | 'moto' | 'bike' | 'car' | ''; // Renommage
  logistics: 'standard' | 'express_48h' | 'express_24h';              // Nouveau champ
  pickup: boolean;
  delivery: boolean;
}
interface RouteData {
  departurePointId: number | null;
  arrivalPointId: number | null;
  departurePointName: string;
  arrivalPointName: string;
  distanceKm: number;
}
interface SignatureData {
  signatureUrl: string | null;
}
interface LoggedInUser {
  id: string;
  full_name: string | null;
  phone: string | null;
  email?: string;
  address?: string | null;
  lieu_dit?: string | null;
}

const STORAGE_KEY = 'shipping_form_temp_data_v2';

const ShippingSteps = ({ currentStep = 1 }: { currentStep?: number }) => {
  const steps = [
    { number: 1, title: "Expéditeur", icon: <UserOutlineIcon className="w-5 h-5" />, color: "from-orange-400 to-orange-500" },
    { number: 2, title: "Destinataire", icon: <UserOutlineIcon className="w-5 h-5" />, color: "from-orange-400 to-orange-600" },
    { number: 3, title: "Colis", icon: <TruckIcon className="w-5 h-5" />, color: "from-orange-500 to-orange-600" },
    { number: 4, title: "Trajet", icon: <MapPinIcon className="w-5 h-5" />, color: "from-orange-500 to-orange-700" },
    { number: 5, title: "Signature", icon: <PencilIcon className="w-5 h-5" />, color: "from-orange-600 to-orange-700" },
    { number: 6, title: "Paiement", icon: <CreditCardIcon className="w-5 h-5" />, color: "from-orange-600 to-orange-800" },
  ];
  return (
    <div className="flex justify-between items-start mb-6 w-full max-w-5xl mx-auto relative">
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <motion.div 
        className="absolute top-5 left-0 h-0.5 bg-orange-400 dark:bg-orange-500 rounded-full shadow-sm"
        initial={{ width: '0%' }}
        animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      {steps.map((step, index) => (
        <div key={step.number} className="flex flex-col items-center group text-center relative z-10">
          <motion.div 
            className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
              step.number <= currentStep 
                ? "bg-orange-500 dark:bg-orange-600 text-white shadow-md shadow-orange-500/20 dark:shadow-orange-600/30" 
                : "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 shadow-sm"
            }`}
            whileHover={{ scale: 1.05 }}
          >
            {step.number < currentStep ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <SolidCheckCircleIcon className="w-6 h-6" />
              </motion.div>
            ) : step.number === currentStep ? (
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {step.icon}
              </motion.div>
            ) : (
              step.icon
            )}
          </motion.div>
          <motion.p 
            className={`text-xs font-semibold mt-1.5 transition-all duration-300 ${
              step.number <= currentStep 
                ? "text-orange-600 dark:text-orange-400" 
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {step.title}
          </motion.p>
        </div>
      ))}
    </div>
  );
};

export default function ShippingPage() {
  const router = useRouter();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [formData, setFormData] = useState<ExpeditionFormData>({
    currentStep: 1,
    senderData: { 
      senderName: '', senderPhone: '', senderAddress: '', senderLieuDit: '',
      senderEmail: '', senderCountry: 'cameroun', senderRegion: 'centre', senderCity: 'Yaoundé'
    },
    recipientData: { 
      recipientName: '', recipientPhone: '', recipientEmail: '', recipientAddress: '', recipientLieuDit: '',
      recipientCountry: 'cameroun', recipientRegion: 'centre', recipientCity: 'Yaoundé'
    },
    packageData: { 
      photo: null, designation: '', description: '', weight: '', length: '', width: '', height: '',
      isFragile: false, isPerishable: false, isLiquid: false, isInsured: false, declaredValue: '', 
      transportMethod: '',
      logistics: 'standard',
      pickup: false, delivery: false 
    },
    routeData: { departurePointId: null, arrivalPointId: null, departurePointName: '', arrivalPointName: '', distanceKm: 0 },
    signatureData: { signatureUrl: null },
    pricing: { basePrice: 0, travelPrice: 0, operatorFee: 0, totalPrice: 0 },
  });

  useEffect(() => {
    if (formData.currentStep > 0 && formData.currentStep < 7) {
      try {
        localStorage.setItem(EXPEDITION_FORM_STORAGE_KEY, JSON.stringify(formData));
      } catch (e) {
        console.error("Erreur de sauvegarde localStorage:", e);
      }
    }
  }, [formData]);

  useEffect(() => {
    if (formData.currentStep < 7 && formData.currentStep > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      } catch (e) {
        console.error("Erreur de sauvegarde localStorage :", e)
      }
    }
  }, [formData]);

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      let restoredData = null;
      let shouldAskToRestore = false;

      try {
        const savedData = localStorage.getItem(EXPEDITION_FORM_STORAGE_KEY);
        if (savedData) {
          restoredData = JSON.parse(savedData);
          shouldAskToRestore = true;
        }
      } catch(e) {
        console.error("Erreur de parsing localStorage:", e);
        localStorage.removeItem(EXPEDITION_FORM_STORAGE_KEY);
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          const connectedUser: LoggedInUser = { id: profile.id, full_name: profile.full_name, phone: profile.phone, email: profile.email, address: profile.address, lieu_dit: profile.lieu_dit };
          setUser(connectedUser);

          if (!restoredData) {
            setFormData(prev => ({
              ...prev,
              senderData: {
                // --- CORRECTION: Préserver les champs par défaut comme le pays tout en remplissant le profil ---
                ...prev.senderData, 
                senderName: connectedUser.full_name || '',
                senderPhone: connectedUser.phone || '',
                senderEmail: connectedUser.email || '', // Email ajouté
                senderAddress: connectedUser.address || '',
                senderLieuDit: connectedUser.lieu_dit || '',
              }
            }));
          }
        }
      }
      setIsLoadingUser(false);
    };

    checkUserAndLoadData();
  }, []);
  
  const resetFormAndStartOver = () => {
    localStorage.removeItem(EXPEDITION_FORM_STORAGE_KEY);
    window.location.reload();
  };

  const renderCurrentStep = () => {
    switch (formData.currentStep) {
      case 1:
        return <SenderInfoStep
          initialData={formData.senderData}
          onContinue={(data) => setFormData(prev => ({ ...prev, senderData: data, currentStep: 2 }))}
        />;
      case 2:
        return <RecipientInfoStep
          initialData={formData.recipientData}
          onContinue={(data) => setFormData(prev => ({ ...prev, recipientData: data, currentStep: 3 }))}
          onBack={() => setFormData(prev => ({ ...prev, currentStep: 1 }))}
        />;
      case 3:
        return <PackageInfoStep
          initialData={formData.packageData}
          onContinue={(data, totalPrice) => setFormData(prev => ({ 
            ...prev, 
            packageData: data, 
            pricing: { ...prev.pricing, basePrice: totalPrice },
            currentStep: 4 
          }))}
          onBack={() => setFormData(prev => ({ ...prev, currentStep: 2 }))}
        />;
      case 4:
        return <RouteSelectionStep
          onContinue={(routeData, travelPrice) => setFormData(prev => ({ ...prev, routeData, pricing: { ...prev.pricing, travelPrice }, currentStep: 5 }))}
          onBack={() => setFormData(prev => ({ ...prev, currentStep: 3 }))}
        />;
      case 5:
        return <SignatureStep
          onSubmit={(signatureUrl) => setFormData(prev => ({...prev, signatureData: { signatureUrl }, currentStep: 6}))}
          onBack={() => setFormData(prev => ({ ...prev, currentStep: 4 }))}
        />;
      case 6:
        const fullDataForPayment = {
          ...formData.senderData,
          ...formData.recipientData,
          ...formData.packageData,
          ...formData.routeData,
          ...formData.signatureData,
          basePrice: formData.pricing.basePrice,
          travelPrice: formData.pricing.travelPrice,
        };
        return <PaymentStep
          allData={fullDataForPayment}
          onPaymentFinalized={(finalPricing) => {
            setFormData(prev => ({ ...prev, pricing: finalPricing, currentStep: 7 })); 
            localStorage.removeItem(EXPEDITION_FORM_STORAGE_KEY);
          }}
          onBack={() => setFormData(prev => ({ ...prev, currentStep: 5 }))}
          currentUser={user}
        />;
      case 7:
        return (
          <motion.div 
            className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-orange-100 dark:border-orange-800/30"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <SolidCheckCircleIcon className="w-20 h-20 text-orange-500 dark:text-orange-400 mx-auto"/>
            </motion.div>
            <h2 className="text-2xl font-bold mt-4 text-gray-800 dark:text-gray-100">
              Expédition Enregistrée !
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-base max-w-md mx-auto">
              Votre colis est maintenant en route. Le bordereau a été généré avec succès.
            </p>
            <div className="flex justify-center mt-6">
              <motion.button 
                onClick={resetFormAndStartOver} 
                className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-all duration-300 flex items-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <DocumentTextIcon className="w-4 h-4" />
                <span>Nouvelle expédition</span>
              </motion.button>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-3 border-orange-200 dark:border-orange-800 border-t-orange-500 dark:border-t-orange-400 rounded-full mx-auto mb-3"
          />
          <p className="text-orange-600 dark:text-orange-400 font-semibold">Chargement de votre session...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="h-12" />
      <main className="container mx-auto px-4 py-4">
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
            <ArrowUturnLeftIcon className="w-4 h-4 mr-1" /> Retour à l'accueil
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-gray-100">Processus de Dépôt de Colis</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-gray-300 max-w-xl mx-auto">Suivez les étapes pour expédier votre colis en toute simplicité.</p>
        </motion.div>

        <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-2 -mx-4 px-4 mb-3 border-b border-orange-100/50 dark:border-orange-800/30">
          <ShippingSteps currentStep={formData.currentStep} />
        </div>

        <div className="bg-transparent rounded-xl p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={formData.currentStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
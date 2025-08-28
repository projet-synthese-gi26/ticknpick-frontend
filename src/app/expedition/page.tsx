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

// --- AJOUT --- : Clé unique et claire pour le stockage de ce formulaire
const EXPEDITION_FORM_STORAGE_KEY = 'expedition_form_in_progress';

// Ajouter cette interface après vos autres imports d'interfaces (vers la ligne 40)
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
  senderAddress: string;
  senderLieuDit: string;
}
interface RecipientData {
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  recipientAddress: string;
  recipientLieuDit: string;
  recipientGenre: 'homme' | 'femme' | '';
  recipientAge: string;
}
interface PackageData {
  designation: string;
  description: string;
  weight: string;
  isFragile: boolean;
  isPerishable: boolean;
  isInsured: boolean;
  declaredValue: string;
  logistics: 'standard' | 'express_24h' | 'express_48h';
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
    { number: 1, title: "Expéditeur", icon: <UserOutlineIcon className="w-6 h-6" />, color: "from-orange-400 to-orange-500" },
    { number: 2, title: "Destinataire", icon: <UserOutlineIcon className="w-6 h-6" />, color: "from-orange-400 to-orange-600" },
    { number: 3, title: "Colis", icon: <TruckIcon className="w-6 h-6" />, color: "from-orange-500 to-orange-600" },
    { number: 4, title: "Trajet", icon: <MapPinIcon className="w-6 h-6" />, color: "from-orange-500 to-orange-700" },
    { number: 5, title: "Signature", icon: <PencilIcon className="w-6 h-6" />, color: "from-orange-600 to-orange-700" },
    { number: 6, title: "Paiement", icon: <CreditCardIcon className="w-6 h-6" />, color: "from-orange-600 to-orange-800" },
  ];
  return (
    <div className="flex justify-between items-start mb-16 w-full max-w-6xl mx-auto relative">
      <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 rounded-full" />
      <motion.div 
        className="absolute top-6 left-0 h-0.5 bg-orange-400 rounded-full shadow-sm"
        initial={{ width: '0%' }}
        animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      {steps.map((step, index) => (
        <div key={step.number} className="flex flex-col items-center group text-center relative z-10">
          <motion.div 
            className={`relative w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-500 transform hover:scale-110 ${
              step.number <= currentStep 
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" 
                : "bg-white border-2 border-gray-200 text-gray-400 shadow-md"
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            {step.number < currentStep ? (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <SolidCheckCircleIcon className="w-8 h-8" />
              </motion.div>
            ) : step.number === currentStep ? (
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    "0 0 0 0px rgba(249, 115, 22, 0.4)",
                    "0 0 0 10px rgba(249, 115, 22, 0)",
                    "0 0 0 0px rgba(249, 115, 22, 0)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="rounded-2xl"
              >
                {step.icon}
              </motion.div>
            ) : (
              step.icon
            )}
            {step.number <= currentStep && (
              <motion.div
                className="absolute -inset-1 rounded-2xl opacity-20"
                style={{ background: `linear-gradient(135deg, ${step.color})` }}
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>
          <motion.p 
            className={`text-sm font-bold mt-3 transition-all duration-300 ${
              step.number <= currentStep 
                ? "text-orange-600" 
                : "text-gray-500"
            }`}
            animate={{ 
              scale: step.number === currentStep ? [1, 1.05, 1] : 1,
            }}
            transition={{ duration: 1.5, repeat: step.number === currentStep ? Infinity : 0 }}
          >
            {step.title}
          </motion.p>
          {step.number === currentStep && (
            <motion.div
              className="absolute -bottom-2 w-2 h-2 bg-orange-500 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
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
    senderData: { senderName: '', senderPhone: '', senderAddress: '', senderLieuDit: '' },
    recipientData: { recipientName: '', recipientPhone: '', recipientEmail: '', recipientAddress: '', recipientLieuDit: '', recipientGenre: '', recipientAge: '' },
    packageData: { designation: '', description: '', weight: '', isFragile: false, isPerishable: false, isInsured: false, declaredValue: '', logistics: 'standard' },
    routeData: { departurePointId: null, arrivalPointId: null, departurePointName: '', arrivalPointName: '', distanceKm: 0 },
    signatureData: { signatureUrl: null },
    pricing: { basePrice: 0, travelPrice: 0, operatorFee: 0, totalPrice: 0 },
});

    // --- AJOUT : Logique de Sauvegarde Automatique ---
  useEffect(() => {
    // On sauvegarde l'état du formulaire tant que le processus n'est pas finalisé (étape < 7)
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

  // --- MODIFIÉ --- : Logique de chargement initiale et restauration
  useEffect(() => {
    // Cette fonction sera appelée une seule fois au montage du composant
    const checkUserAndLoadData = async () => {
      let restoredData = null;
      let shouldAskToRestore = false;

      // 1. Vérifier s'il y a des données sauvegardées
      try {
        const savedData = localStorage.getItem(EXPEDITION_FORM_STORAGE_KEY);
        if (savedData) {
          restoredData = JSON.parse(savedData);
          shouldAskToRestore = true;
        }
      } catch(e) {
        console.error("Erreur de parsing localStorage:", e);
        localStorage.removeItem(EXPEDITION_FORM_STORAGE_KEY); // Nettoyer les données corrompues
      }

      // 2. Proposer de restaurer si des données existent
      if (shouldAskToRestore) {
        if (window.confirm("Des données non terminées ont été trouvées. Voulez-vous continuer où vous vous étiez arrêté ?")) {
          setFormData(restoredData);
        } else {
          // L'utilisateur choisit de commencer à zéro, on nettoie
          localStorage.removeItem(EXPEDITION_FORM_STORAGE_KEY);
        }
      }
      
      // 3. Charger les infos de l'utilisateur (logique existante)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          const connectedUser: LoggedInUser = { id: profile.id, full_name: profile.full_name, phone: profile.phone, email: profile.email, address: profile.address, lieu_dit: profile.lieu_dit };
          setUser(connectedUser);

          // Si aucune donnée n'a été restaurée, on pré-remplit avec les infos de l'utilisateur
          if (!restoredData) {
            setFormData(prev => ({
              ...prev,
              senderData: {
                senderName: connectedUser.full_name || '',
                senderPhone: connectedUser.phone || '',
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
  }, []); // Tableau vide pour n'exécuter qu'une seule fois
  
  // --- AJOUT --- : Nouvelle fonction pour repartir de zéro proprement
  const resetFormAndStartOver = () => {
    // Vider le localStorage est la partie la plus importante
    localStorage.removeItem(EXPEDITION_FORM_STORAGE_KEY);
    // Recharger la page pour garantir un état complètement neuf
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
        const handlePackageContinue = (pkgData: PackageData, price: { basePrice: number }) => {
            setFormData(prev => ({ 
                ...prev, 
                packageData: pkgData, 
                pricing: { ...prev.pricing, basePrice: price.basePrice },
                currentStep: 4 
            }));
        };
        return <div onClick={() => handlePackageContinue(formData.packageData, { basePrice: 1500 })}>
             <p>Composant PackageInfoStep ici. Cliquez pour simuler le passage à l'étape suivante.</p>
         </div>;
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
            // --- MODIFIÉ --- : Nettoyage après la finalisation
            setFormData(prev => ({ ...prev, pricing: finalPricing, currentStep: 7 })); 
            localStorage.removeItem(EXPEDITION_FORM_STORAGE_KEY);
          }}
          onBack={() => setFormData(prev => ({ ...prev, currentStep: 5 }))}
          currentUser={user}
        />;
      case 7:
        return (
          <motion.div 
            className="text-center p-12 bg-white rounded-3xl shadow-xl border border-orange-100"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <SolidCheckCircleIcon className="w-32 h-32 text-orange-500 mx-auto drop-shadow-lg"/>
            </motion.div>
            <motion.h2 
              className="text-4xl font-bold mt-6 text-gray-800"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Expédition Enregistrée !
            </motion.h2>
            <motion.p 
              className="text-gray-600 mt-4 text-lg max-w-md mx-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Votre colis est maintenant en route. Le bordereau a été généré avec succès.
            </motion.p>
            <motion.div
              className="flex justify-center space-x-4 mt-8"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <motion.button 
                onClick={resetFormAndStartOver} 
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all duration-300 flex items-center space-x-2"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px -10px rgba(249, 115, 22, 0.5)" }}
                whileTap={{ scale: 0.95 }}
              >
                <DocumentTextIcon className="w-5 h-5" />
                <span>Nouvelle expédition</span>
              </motion.button>
            </motion.div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full mx-auto mb-4"
          />
          <p className="text-orange-600 font-semibold text-lg">Chargement de votre session...</p>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50">
        <div className="h-16" /> 
        {/* Espace pour la barre de navigation principale si vous en avez une */}
        <main className="container mx-auto px-4 py-8">

            {/* --- MODIFICATION 1 : Le titre de la page (qui défilera) --- */}
            <motion.div 
                className="text-center mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <button onClick={() => router.push('/home')} className="mb-4 group flex items-center mx-auto text-orange-600 text-sm">
                    <ArrowUturnLeftIcon className="w-4 h-4 mr-1.5" /> Retour à l'accueil
                </button>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800">Processus de Dépôt de Colis</h1>
                <p className="mt-2 text-md text-slate-600 max-w-2xl mx-auto">Suivez les étapes pour expédier votre colis en toute simplicité.</p>
            </motion.div>

            {/* --- MODIFICATION 2 : La barre d'évolution devient STICKY --- */}
            <div className="sticky top-0 z-40 bg-transparent backdrop-blur-md py-2 -mx-4 px-4 mb-2">
                <ShippingSteps currentStep={formData.currentStep} />
            </div>

            {/* --- MODIFICATION 3 : Le contenu de l'étape est dans un conteneur principal --- */}
            <div className="bg-transparent rounded-2xl p-6 md:p-8">
                <AnimatePresence mode="wait">
                    <motion.div
                    key={formData.currentStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    >
                        {renderCurrentStep()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </main>
    </div>
  );
}
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation' // Pour App Router
import {
  TruckIcon,
  MapPinIcon,
  PencilIcon as SignatureIcon,
  CreditCardIcon,
  ArrowRightCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { ChatBubbleOvalLeftEllipsisIcon, CheckCircleIcon as SolidCheckCircleIcon } from '@heroicons/react/24/solid';
import { CheckCircleIcon, PackagePlus, ScanSearch } from 'lucide-react';
import Head from 'next/head';
import Navbar from '@/components/Navbar';
import PackageRegistration from './FomulaireColis';
import RouteSelection from './CheminColis';
import DigitalSignature from './Signature';
import PaymentStep from './paymentStep';
import ProcessExistingPackage from './Existing';

// Interface pour les données du colis
interface PackageDataForParent {
  image: string | null;
  designation: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  isFragile: boolean;
  contentType: 'solid' | 'liquid' | '';
  isPerishable: boolean;
  description: string;
  declaredValue: string;
  isInsured: boolean;
}

// Interface pour les données globales du formulaire d'expédition
interface ShippingFormDataGlobal {
  departurePointName: string;
  arrivalPointName: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  departurePointId?: number | null;
  arrivalPointId?: number | null;
  distance?: number;
  compensation: number;
  country: string;
  signatureData?: string | null;
  totalPrice?: number;
}

const ShippingSteps = ({ currentStep = 1 }: { currentStep?: number }) => {
  const steps = [
    { number: 1, title: ["Description", "du colis"], icon: <TruckIcon className="w-7 h-7" /> },
    { number: 2, title: ["Choix", "du trajet"], icon: <MapPinIcon className="w-7 h-7" /> },
    { number: 3, title: ["Votre", "Signature"], icon: <SignatureIcon className="w-7 h-7" /> },
    { number: 4, title: ["Paiement", "& Confirmation"], icon: <CreditCardIcon className="w-7 h-7" /> },
  ];

  return (
    <div className="flex justify-center items-center mb-10 sm:mb-16 w-full px-2">
      <div className="flex justify-between items-start w-full max-w-5xl">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center group relative text-center w-1/4 sm:w-auto">
              <div className={`
                ${step.number <= currentStep ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"}
                rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-all duration-300 mb-2
                group-hover:scale-110 shadow-md
              `}>
                {step.number < currentStep ? <SolidCheckCircleIcon className="w-7 h-7 sm:w-8 sm:h-8" /> : React.cloneElement(step.icon, { className: "w-6 h-6 sm:w-7 sm:h-7"})}
              </div>
              {step.title.map((line, i) => (
                <p key={i} className={`text-xs sm:text-sm font-medium leading-tight ${
                  step.number <= currentStep ? "text-green-700" : "text-gray-600"
                }`}>
                  {line}
                </p>
              ))}
            </div>

            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mt-6 sm:mt-7 ${
                step.number < currentStep ? "bg-green-500" : "bg-gray-300"
              } mx-2 self-start transition-colors duration-300`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Interface pour la notification
interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// Composant de notification
const NotificationComponent = ({ 
  notification, 
  onClose 
}: { 
  notification: Notification; 
  onClose: (id: string) => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, notification.duration || 5000);

    return () => clearTimeout(timer);
  }, [notification.id, notification.duration, onClose]);

  const getNotificationStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'error':
        return <XMarkIcon className="w-6 h-6 text-red-600" />;
      default:
        return <CheckCircleIcon className="w-6 h-6 text-blue-600" />;
    }
  };

  return (
    <div className={`fixed top-20 right-5 z-50 max-w-md w-full mx-auto`}>
      <div className={`rounded-lg border p-4 shadow-lg ${getNotificationStyles()} animate-fadeIn`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">
              {notification.title}
            </p>
            <p className="mt-1 text-sm opacity-90">
              {notification.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onClose(notification.id)}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShippingPage = () => {
  const router = useRouter();
  
  // État pour gérer le type de flux
  const [flowType, setFlowType] = useState<'initial_selection' | 'new_package' | 'existing_package'>('initial_selection');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [packageDataForParent, setPackageDataForParent] = useState<PackageDataForParent | null>(null);
  
  // État pour les notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [formDataGlobal, setFormDataGlobal] = useState<ShippingFormDataGlobal>({
    departurePointName: '',
    arrivalPointName: '',
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    departurePointId: null,
    arrivalPointId: null,
    distance: 0,
    compensation: 0,
    country: 'Cameroun',
    signatureData: null,
    totalPrice: 0,
  });

  // Fonction pour ajouter une notification
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  // Fonction pour supprimer une notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Fonction pour gérer l'envoi réussi du colis
  const handleShippingSuccess = async (trackingNumber?: string) => {
    try {
      // 1. Sauvegarder les informations dans localStorage avant de les effacer
      const shippingData = {
        packageData: packageDataForParent,
        formData: formDataGlobal,
        trackingNumber: trackingNumber || `TRK${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };

      // Récupérer l'historique existant ou créer un nouveau tableau
      const existingHistory = JSON.parse(localStorage.getItem('shippingHistory') || '[]');
      const updatedHistory = [...existingHistory, shippingData];
      
      // Garder seulement les 50 derniers envois pour éviter de surcharger le localStorage
      if (updatedHistory.length > 50) {
        updatedHistory.splice(0, updatedHistory.length - 50);
      }
      
      localStorage.setItem('shippingHistory', JSON.stringify(updatedHistory));

      // 2. Afficher la notification de succès
      addNotification({
        type: 'success',
        title: 'Envoi réussi !',
        message: `Votre colis a été enregistré avec succès. Numéro de suivi: ${shippingData.trackingNumber}`,
        duration: 6000
      });

      // 3. Réinitialiser le formulaire
      resetFlowStates();
      setFlowType('initial_selection');
      setShouldLoadFromStorage(false);

      // 4. Rediriger vers la page d'accueil après un délai
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'envoi:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.',
        duration: 5000
      });
    }
  };

  // Variable pour contrôler si on doit charger depuis localStorage
  const [shouldLoadFromStorage, setShouldLoadFromStorage] = useState(true);

  // Fonction pour réinitialiser les états du flux
  const resetFlowStates = () => {
    setCurrentStep(1);
    setPackageDataForParent(null);
    setFormDataGlobal({
      departurePointName: '',
      arrivalPointName: '',
      recipientName: '',
      recipientPhone: '',
      recipientEmail: '',
      departurePointId: null,
      arrivalPointId: null,
      distance: 0,
      compensation: 0,
      country: 'Cameroun',
      signatureData: null,
      totalPrice: 0,
    });
    
    // Nettoyer le localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('packageData');
      localStorage.removeItem('shippingFormDataGlobal');
      localStorage.removeItem('shippingCurrentStep');
      localStorage.removeItem('expressOption');
      localStorage.removeItem('packageRegistrationData');
      localStorage.removeItem('shippingFlowType');
    }
  };

  // Charger les données depuis localStorage au montage - SEULEMENT si on doit le faire
  useEffect(() => {
    if (!shouldLoadFromStorage || typeof window === 'undefined') return;

    // Vérifier s'il y a une instruction pour enregistrer un dépôt
    const depositInstructionJSON = localStorage.getItem('redirect_to_deposit');
    if (depositInstructionJSON) {
      try {
        const { packageId } = JSON.parse(depositInstructionJSON);
        if (packageId) {
          // 1. Définir le flux pour "Colis Existant"
          setFlowType('existing_package');
          
          // 2. Transmettre l'ID au composant enfant via localStorage (simple et efficace ici)
          localStorage.setItem('prefill_package_id', packageId);
          
          // 3. Nettoyer l'instruction pour ne pas la ré-exécuter
          localStorage.removeItem('redirect_to_deposit');

          // Marquer le chargement comme terminé et arrêter le reste du useEffect
          setShouldLoadFromStorage(false);
          return;
        }
      } catch (e) {
        console.error("Erreur de parsing de l'instruction de dépôt:", e);
        localStorage.removeItem('redirect_to_deposit'); // Nettoyer en cas d'erreur
      }
    }
    const savedFlowType = localStorage.getItem('shippingFlowType');
    const savedPackageDataString = localStorage.getItem('packageData');
    const savedShippingFormDataString = localStorage.getItem('shippingFormDataGlobal');
    const savedCurrentStep = localStorage.getItem('shippingCurrentStep');

    // Si on a un flux sauvegardé et qu'il n'est pas initial_selection, on le restore
    if (savedFlowType && savedFlowType !== 'initial_selection') {
      setFlowType(savedFlowType as 'new_package' | 'existing_package');

      if (savedPackageDataString) {
        try { 
          setPackageDataForParent(JSON.parse(savedPackageDataString)); 
        }
        catch (e) { 
          console.error("Erreur parsing packageData:", e); 
        }
      }

      if (savedShippingFormDataString) {
        try {
          const parsedFormData = JSON.parse(savedShippingFormDataString);
          setFormDataGlobal(prev => ({
            ...prev,
            ...parsedFormData,
            compensation: parsedFormData.compensation || 0,
            signatureData: parsedFormData.signatureData || null,
          }));
        } catch (e) { 
          console.error("Erreur parsing shippingFormDataGlobal:", e); 
        }
      }

      if (savedCurrentStep) {
        const step = parseInt(savedCurrentStep, 10);
        if (step >= 1 && step <= 4) {
          setCurrentStep(step);
        }
      }
    }

    // Marquer que le chargement initial est terminé
    setShouldLoadFromStorage(false);
  }, [shouldLoadFromStorage]);

  // Sauvegarder formDataGlobal, currentStep et flowType dans localStorage
  // SEULEMENT si on n'est pas en train de charger depuis le storage
  useEffect(() => {
    if (shouldLoadFromStorage || typeof window === 'undefined') return;

    if (Object.values(formDataGlobal).some(value => value !== '' && value !== null && value !== 0)) {
      localStorage.setItem('shippingFormDataGlobal', JSON.stringify(formDataGlobal));
    }
    localStorage.setItem('shippingCurrentStep', currentStep.toString());
    localStorage.setItem('shippingFlowType', flowType);
  }, [formDataGlobal, currentStep, flowType, shouldLoadFromStorage]);

  // Sauvegarder packageDataForParent dans localStorage
  useEffect(() => {
    if (shouldLoadFromStorage || typeof window === 'undefined') return;

    if (packageDataForParent) {
      localStorage.setItem('packageData', JSON.stringify(packageDataForParent));
    }
  }, [packageDataForParent, shouldLoadFromStorage]);

  const handlePackageSubmit = (data: PackageDataForParent, totalPrice: number) => {
    setPackageDataForParent(data);
    setFormDataGlobal(prev => ({ 
      ...prev, 
      totalPrice: totalPrice
    }));
    setCurrentStep(2);
  };

  const handleNewTask = () => {
    resetFlowStates();
    setFlowType('initial_selection');
    setShouldLoadFromStorage(false); // Empêcher le rechargement automatique
  };

  const handleRouteSelectionSubmit = () => {
    setCurrentStep(3);
  };

  const handleSignatureSubmit = (signatureData: string) => {
    setFormDataGlobal(prev => ({ ...prev, signatureData }));
    setCurrentStep(4);
  };

  const handleBackStep = () => {
    if (currentStep === 1) {
      // Si on est à l'étape 1, retourner à la sélection initiale
      setFlowType('initial_selection');
      resetFlowStates();
      setShouldLoadFromStorage(false);
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    }
  };

  // Fonction pour retourner à la sélection initiale depuis ExistingPage
  const handleBackToSelection = () => {
    setFlowType('initial_selection');
    resetFlowStates();
    setShouldLoadFromStorage(false);
  };

  // Fonction pour démarrer un nouveau processus de colis
  const handleStartNewPackage = () => {
    resetFlowStates();
    setFlowType('new_package');
    setShouldLoadFromStorage(false);
  };

  // Fonction pour démarrer le processus de colis existant
  const handleStartExistingPackage = () => {
    resetFlowStates();
    setFlowType('existing_package');
    setShouldLoadFromStorage(false);
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // Écran de sélection initiale
  const renderInitialSelection = () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] sm:min-h-[calc(100vh-20rem)] bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 sm:p-6 animate-fadeIn">
        <div className="w-full max-w-xl text-center">
          <div className="mb-6 sm:mb-8 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-xl transform transition-all duration-500 hover:scale-110">
              <TruckIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent mb-3 sm:mb-4 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Gestion des Colis
          </h1>
          <p className="text-md sm:text-lg text-slate-600 mb-8 sm:mb-10 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            Quelle opération souhaitez-vous effectuer sur un colis ?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={handleStartNewPackage}
              className="group relative flex flex-col items-center justify-start p-6 pt-8 sm:p-8 sm:pt-10 text-center bg-white rounded-xl shadow-lg hover:shadow-2xl transform transition-all duration-300 ease-out hover:-translate-y-2 focus:outline-none focus:ring-4 focus:ring-emerald-300 focus:ring-opacity-50 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-x-0 group-hover:scale-x-100 origin-left"></div>
              <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4 sm:mb-5 transform transition-transform duration-300 group-hover:scale-110">
                <PackagePlus className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 transition-colors duration-300 group-hover:text-emerald-700" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-1 sm:mb-1.5 group-hover:text-green-700 transition-colors duration-300">
                Nouveau Colis
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 group-hover:text-slate-600 transition-colors duration-300 leading-relaxed">
                Enregistrer les informations d'un nouveau colis et planifier son expédition.
              </p>
              <ArrowRightCircleIcon className="w-5 h-5 text-green-400 mt-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300" />
            </button>
            <button
              onClick={handleStartExistingPackage}
              className="group relative flex flex-col items-center justify-start p-6 pt-8 sm:p-8 sm:pt-10 text-center bg-white rounded-xl shadow-lg hover:shadow-2xl transform transition-all duration-300 ease-out hover:-translate-y-2 focus:outline-none focus:ring-4 focus:ring-emerald-300 focus:ring-opacity-50 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-x-0 group-hover:scale-x-100 origin-left"></div>
              <div className="p-4 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full mb-4 sm:mb-5 transform transition-transform duration-300 group-hover:scale-110">
                <ScanSearch className="w-10 h-10 sm:w-12 sm:h-12 text-teal-600 transition-colors duration-300 group-hover:text-cyan-700" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-1 sm:mb-1.5 group-hover:text-teal-700 transition-colors duration-300">
                Colis Existant
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 group-hover:text-slate-600 transition-colors duration-300 leading-relaxed">
                Rechercher, vérifier le statut ou traiter le dépôt d'un colis déjà enregistré.
              </p>
              <ArrowRightCircleIcon className="w-5 h-5 text-teal-400 mt-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <PackageRegistration onContinue={handlePackageSubmit} />;
      case 2:
        return (
          <RouteSelection
            formData={formDataGlobal}
            setFormData={setFormDataGlobal}
            onNext={handleRouteSelectionSubmit}
            onBack={handleBackStep}
          />
        );
      case 3:
        const customerNameForSignature = "Cher Client";
        return (
          <DigitalSignature
            onBack={handleBackStep}
            onSubmit={handleSignatureSubmit}
            customerName={customerNameForSignature}
          />
        );
      case 4:
        if (!packageDataForParent) {
          console.warn("Données du colis manquantes pour l'étape de paiement. Retour à l'étape 1.");
          setCurrentStep(1);
          return <p className="text-center text-red-500">Données du colis manquantes. Veuillez recommencer.</p>;
        }
        if (!formDataGlobal.departurePointId || !formDataGlobal.arrivalPointId) {
          console.warn("Points de départ/arrivée manquants pour l'étape de paiement. Retour à l'étape 2.");
          setCurrentStep(2);
          return <p className="text-center text-red-500">Sélection des points relais incomplète. Veuillez recommencer.</p>;
        }
        if (!formDataGlobal.signatureData) {
          console.warn("Signature manquante pour l'étape de paiement. Retour à l'étape 3.");
          setCurrentStep(3);
          return <p className="text-center text-red-500">Signature manquante. Veuillez signer avant de procéder au paiement.</p>;
        }
        return (
          <PaymentStep
            onBack={handleBackStep}
            packageData={packageDataForParent}
            formData={formDataGlobal}
            onNewTask={handleNewTask}
            onShippingSuccess={handleShippingSuccess}
          />
        );
      default:
        return <PackageRegistration onContinue={handlePackageSubmit} />;
    }
  };

  const renderContent = () => {
    switch (flowType) {
      case 'initial_selection':
        return renderInitialSelection();
        
      case 'existing_package':
        return <ProcessExistingPackage onBackToSelection={handleBackToSelection} />;
        
      case 'new_package':
        return (
          <>
            <ShippingSteps currentStep={currentStep} />
            <div className="mt-6 animate-fadeIn">
              {renderCurrentStep()}
            </div>
          </>
        );
        
      default:
        return renderInitialSelection();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Head>
        <title>Expédier un colis - Pick & Drop Link</title>
        <meta name="description" content="Service d'expédition de colis via notre réseau de points relais au Cameroun" />
      </Head>
      <Navbar/>
      
      {/* Notifications */}
      {notifications.map((notification) => (
        <NotificationComponent
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
      
      {/* Espace réservé pour la navbar fixe */}
      <div className="h-16 sm:h-20"></div>
      
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        {flowType === 'new_package' && (
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-800">
              Envoyez vos colis <span className="text-green-600">facilement</span> et en <span className="text-green-600">toute sécurité</span>.
            </h1>
            <p className="mt-2 sm:mt-3 text-md sm:text-lg text-slate-600 max-w-2xl mx-auto">
              Utilisez notre réseau de points relais étendu pour tous vos besoins d'expédition.
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 md:p-8 mb-8 border border-gray-200">
          {renderContent()}
        </div>
      </main>

      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50">
        <button className="bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg flex items-center transition-all duration-200 hover:scale-105 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '1s', animationIterationCount: 3 }}>
          <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />
          <span className="ml-2 hidden sm:inline text-sm font-medium">Support</span>
        </button>
      </div>
    </div>
  );
};

export default ShippingPage;
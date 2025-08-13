'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CreditCard, Banknote, Smartphone, CheckCircle, X,
  Printer, FileText, Shield, Clock, MapPin, User,
  Phone, Scale, Package, Info, Share, Sparkles,
  Lock, Heart, Home, ArrowRight, UserCircle,
  Gift, MessageSquare
} from 'lucide-react';

// Icônes de partage simplifiées
const WhatsAppIcon = () => (
  <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">W</div>
);
const TelegramIcon = () => (
  <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">T</div>
);
const MessengerIcon = () => (
  <div className="w-5 h-5 bg-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">M</div>
);
const SmsIcon = () => <MessageSquare className="w-5 h-5" />;

interface ExtendedFormData {
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  departurePointName?: string;
  arrivalPointName?: string;
  compensation?: number;
  weight?: string;
  distance?: number;
  departurePointId?: number | null;
  arrivalPointId?: number | null;
  originCoords?: { lat: number, lng: number };
  destinationCoords?: { lat: number, lng: number };
  signatureData?: string | null;
  totalPrice?: number;
}

interface PackageData {
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  isFragile?: boolean;
  contentType?: 'solid' | 'liquid' | '';
  isPerishable?: boolean;
  designation?: string;
  image?: string | null;
  declaredValue?: string;
  isInsured?: boolean;
  expressOption?: '24h' | '48h' | '72h' | '';
}

interface PaymentStepProps {
  onBack: () => void;
  formData: ExtendedFormData;
  packageData: PackageData;
  onNewTask: () => void;
  onShippingSuccess?: (trackingNumber?: string) => Promise<void>; 
}

const APP_NAME = "Pick n Drop Link";

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
);

const PaymentStep: React.FC<PaymentStepProps> = ({ 
  onBack, 
  formData, 
  packageData, 
  onNewTask 
}) => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'pending_cash' | 'pending_recipient' | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [currentDate, setCurrentDate] = useState('');

  // Simuler les informations de l'utilisateur connecté
  const currentUser = {
    name: "Gaby Nguetcho",
    phone: "+237 691 743 511",
    email: "gaby.doe@example.com"
  };

  useEffect(() => {
    const generateTrackingNumber = () => {
      const prefix = 'PDL';
      const timestamp = Date.now().toString().slice(-7);
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      return `${prefix}${timestamp}${random}`;
    };
    setTrackingNumber(generateTrackingNumber());

    const today = new Date();
    setCurrentDate(today.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }));
  }, []);

  const paymentMethods = [
    { 
      id: 'card', 
      name: 'Carte bancaire', 
      description: 'Visa, Mastercard', 
      icon: <CreditCard className="w-8 h-8" />, 
      color: 'blue', 
      fees: 0, 
      gradient: 'from-blue-500 to-indigo-600', 
      popular: false 
    },
    { 
      id: 'mobile', 
      name: 'Paiement Mobile', 
      description: 'Orange Money, MTN MoMo', 
      icon: <Smartphone className="w-8 h-8" />, 
      color: 'orange', 
      fees: 100, 
      gradient: 'from-orange-500 to-red-500', 
      popular: true 
    },
    { 
      id: 'cash', 
      name: 'Paiement en espèces', 
      description: 'Au dépôt du colis au point relais', 
      icon: <Banknote className="w-8 h-8" />, 
      color: 'green', 
      fees: 0, 
      gradient: 'from-green-500 to-emerald-600', 
      popular: false 
    },
    { 
      id: 'recipient_pay', 
      name: 'Paiement par le destinataire', 
      description: 'À la réception du colis', 
      icon: <Gift className="w-8 h-8" />, 
      color: 'purple', 
      fees: 0, 
      gradient: 'from-purple-500 to-pink-500', 
      popular: false 
    },
  ];

  const calculateTotalForPayer = useCallback(() => {
    const basePrice = formData.totalPrice || 0;
    const paymentFee = paymentMethods.find(m => m.id === selectedMethod)?.fees || 0;
    if (selectedMethod === 'recipient_pay') return basePrice;
    return basePrice + paymentFee;
  }, [selectedMethod, formData.totalPrice, paymentMethods]);

  // Helper functions for price calculation
  const calculatePackageBasePrice = () => formData.totalPrice || 0;
  const calculateAdditionalFees = () => 0;
  const calculateInsuranceFee = () => 0;
  const calculateTotal = () => calculateTotalForPayer();

  const generatePDF = async (signatureImageDataUrl?: string | null) => {
    try {
      // Simulation de génération PDF
      console.log('Génération du PDF pour:', trackingNumber);
      alert('Fonction PDF simulée - Le bordereau serait téléchargé ici.');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Une erreur est survenue lors de la génération du bordereau. Veuillez réessayer.');
    }
  };

  const InvoiceModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl">
        
        <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-slate-50 rounded-t-xl flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Aperçu du Bordereau - {APP_NAME}</h2>
          <div className="flex items-center space-x-1.5">
            <button 
              onClick={() => generatePDF(formData?.signatureData)}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-200 transition-colors" 
              title="Imprimer / Télécharger en PDF"
            > 
              <Printer className="w-5 h-5" /> 
            </button>
            <button 
              onClick={() => setShowInvoice(false)}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-200 transition-colors" 
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto p-5" id="invoice-content-pdf">
          <div className="flex justify-between items-start pb-3 mb-4 border-b-2 border-green-500">
              <div className="flex items-center">
                  <Home className="h-8 w-8 text-green-600 mr-2"/>
                  <div>
                      <h1 className="text-2xl font-bold text-green-700 m-0">{APP_NAME}</h1>
                      <p className="m-0 text-xs text-gray-500">Votre partenaire logistique fiable.</p>
                  </div>
              </div>
              <div className="text-right">
                  <p className="m-0 text-sm">Bordereau N°: <span className="font-bold">{trackingNumber}</span></p>
                  <p className="m-0 text-xs text-gray-600">Date: {currentDate}</p>
                  {trackingNumber && (
                      <div className="mt-2 hidden print:block">
                          <div className="w-12 h-12 bg-gray-200 flex items-center justify-center text-xs">
                            QR
                          </div>
                      </div>
                  )}
              </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-4">
              <div className="border p-3 rounded">
                  <h3 className="text-sm font-bold text-green-600 border-b pb-1 mb-2">EXPÉDITEUR</h3>
                  <p className="text-sm"><strong>Nom:</strong> {currentUser.name}</p>
                  <p className="text-sm"><strong>Téléphone:</strong> {currentUser.phone}</p>
                  <p className="text-sm"><strong>Point de dépôt:</strong> {formData?.departurePointName || 'N/A'}</p>
              </div>
              <div className="border p-3 rounded">
                  <h3 className="text-sm font-bold text-blue-600 border-b pb-1 mb-2">DESTINATAIRE</h3>
                  <p className="text-sm"><strong>Nom:</strong> {formData?.recipientName || 'N/A'}</p>
                  <p className="text-sm"><strong>Téléphone:</strong> {formData?.recipientPhone || 'N/A'}</p>
                  <p className="text-sm"><strong>Point de retrait:</strong> {formData?.arrivalPointName || 'N/A'}</p>
              </div>
          </div>

          <div className="border p-3 rounded mb-4">
              <h3 className="text-sm font-bold text-orange-600 border-b pb-1 mb-2">DÉTAILS DU COLIS</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                      <p><strong>Désignation:</strong> {packageData?.designation || 'N/A'}</p>
                      <p><strong>Poids:</strong> {packageData?.weight || 'N/A'} kg</p>
                  </div>
                  <div>
                      <p><strong>Dimensions:</strong> {packageData?.length ? `${packageData.length}x${packageData.width}x${packageData.height} cm` : 'N/A'}</p>
                      <p><strong>Contenu:</strong> {packageData?.contentType || 'Solide'}</p>
                  </div>
              </div>
              <div className="mt-2 text-sm">
                  <strong>Options:</strong> 
                  {packageData?.isFragile && <span className="mr-2">Fragile</span>}
                  {packageData?.isPerishable && <span className="mr-2">Périssable</span>}
                  {packageData?.isInsured && <span>Assuré ({Number(packageData.declaredValue || 0).toLocaleString()} FCFA)</span>}
                  {!packageData?.isFragile && !packageData?.isPerishable && !packageData?.isInsured && <span>Aucune</span>}
              </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
              <h3 className="text-sm font-bold text-indigo-600 border-b border-slate-300 pb-1 mb-3">RÉCAPITULATIF FINANCIER</h3>
              
              <div className="text-sm space-y-1 mb-3">
                <div className="flex justify-between">
                  <span>Prix de base de l'expédition:</span>
                  <span className="font-medium">{ (formData.totalPrice || 0).toLocaleString() } FCFA</span>
                </div>
              </div>

              <hr className="my-2 border-dashed" />

              <div className="flex justify-between items-center text-base font-bold mt-2">
                  <span>TOTAL À PAYER {selectedMethod === 'recipient_pay' ? 'PAR LE DESTINATAIRE' : "PAR L'EXPÉDITEUR"}:</span>
                  <span className="text-lg text-green-700">
                    { calculateTotalForPayer().toLocaleString() } FCFA
                  </span>
              </div>

              {paymentStatus === 'success' && selectedMethod !== 'cash' && selectedMethod !== 'recipient_pay' && (
                <p className="text-green-600 font-semibold text-right text-xs mt-1">Colis payé par l'expéditeur.</p>
              )}
          </div>

          <div>
              <p className="text-xs text-gray-500 mb-6">
                  <strong>Conditions:</strong> Le colis sera livré au point relais d'arrivée indiqué. Le destinataire doit présenter une pièce d'identité valide. {APP_NAME} n'est pas responsable des dommages non déclarés ou dus à un emballage inadéquat.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-dashed">
                  <div>
                      <p className="text-sm font-semibold mb-2">Signature Expéditeur:</p>
                      {formData?.signatureData ? (
                          <img src={formData.signatureData} alt="Signature Expéditeur" className="h-12 border-b" />
                      ) : (
                          <div className="h-12 border-b border-gray-400"></div>
                      )}
                  </div>
                  <div>
                      <p className="text-sm font-semibold mb-2">Cachet & Signature Agence:</p>
                      <div className="h-12 border-b border-gray-400"></div>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );

  const shareBordereau = async (platform: 'whatsapp' | 'telegram' | 'sms' | 'messenger' | 'native') => {
    const textToShare = `Bonjour ${formData.recipientName || 'Destinataire'}, votre colis ${APP_NAME} (N° ${trackingNumber}) est en cours d'expédition. Point de départ: ${formData.departurePointName}, Arrivée: ${formData.arrivalPointName}.`;
    const urlToShare = typeof window !== 'undefined' ? window.location.href : '';

    if (platform === 'native' && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Bordereau ${APP_NAME} N° ${trackingNumber}`,
          text: textToShare,
          url: urlToShare,
        });
      } catch (error) {
        console.error('Erreur de partage natif:', error);
        alert("Le partage a échoué. Vous pouvez télécharger le PDF et le partager manuellement.");
      }
    } else if (platform === 'whatsapp') {
      if (typeof window !== 'undefined') {
        window.open(`https://wa.me/?text=${encodeURIComponent(textToShare + "\n" + urlToShare)}`, '_blank');
      }
    } else if (platform === 'telegram') {
      if (typeof window !== 'undefined') {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(urlToShare)}&text=${encodeURIComponent(textToShare)}`, '_blank');
      }
    } else if (platform === 'sms') {
      if (typeof window !== 'undefined') {
        window.open(`sms:?body=${encodeURIComponent(textToShare + "\n" + urlToShare)}`, '_blank');
      }
    } else if (platform === 'messenger') {
        alert("Pour partager sur Messenger, veuillez utiliser la fonction de partage native de votre appareil ou copiez le texte et le lien.");
    }
    setShowShareMenu(false);
  };

  const shareOptions = [
    { name: 'Partage Natif', icon: <Share className="w-5 h-5" />, action: () => shareBordereau('native'), color: 'gray' },
    { name: 'WhatsApp', icon: <WhatsAppIcon />, action: () => shareBordereau('whatsapp'), color: 'green' },
    { name: 'Telegram', icon: <TelegramIcon />, action: () => shareBordereau('telegram'), color: 'blue' },
    { name: 'SMS', icon: <SmsIcon />, action: () => shareBordereau('sms'), color: 'yellow' },
  ];

  const handlePayment = async () => {
    setIsProcessing(true);
    const steps = ['Vérification des informations...', 'Traitement en cours...', 'Validation...', 'Enregistrement...'];
    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(i);
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    }
    setIsProcessing(false);

    if (selectedMethod === 'cash') {
      setPaymentStatus('pending_cash');
    } else if (selectedMethod === 'recipient_pay') {
      setPaymentStatus('pending_recipient');
    } else {
      setPaymentStatus('success');
    }
  };

  const PaymentMethodCard = ({ method }: { method: typeof paymentMethods[0] }) => (
    <div
      onClick={() => {
        setSelectedMethod(method.id);
        setShowPaymentForm(method.id === 'card' || method.id === 'mobile');
      }}
      className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.03] 
        ${ selectedMethod === method.id ? `border-green-500 bg-gradient-to-br ${method.gradient} bg-opacity-10 shadow-lg shadow-green-200/50`
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      {method.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-3 py-0.5 rounded-full text-xs font-semibold flex items-center space-x-1 shadow">
            <Sparkles className="w-3 h-3" />
            <span>POPULAIRE</span>
          </div>
        </div>
      )}
      {selectedMethod === method.id && (
        <div className={`absolute -top-2.5 -right-2.5 w-7 h-7 bg-gradient-to-br ${method.gradient} rounded-full flex items-center justify-center animate-pulse shadow-md`}>
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${method.gradient} text-white transform transition-transform duration-300 ${selectedMethod === method.id ? 'scale-110' : ''}`}>
          {method.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-md">{method.name}</h3>
          <p className="text-xs text-gray-500 mb-0.5">{method.description}</p>
          <p className="text-xs font-medium text-green-600">Frais: {method.fees.toLocaleString()} FCFA</p>
        </div>
      </div>
    </div>
  );

  const CardPaymentForm = () => (
    <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 mt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <Lock className="w-5 h-5 mr-2 text-green-600" />
          Paiement par Carte
        </h3>
        <div className="flex space-x-2 text-xs">
          <span className="px-2 py-1 bg-blue-100 rounded">Visa</span>
          <span className="px-2 py-1 bg-red-100 rounded">MC</span>
        </div>
      </div>
      <div className="space-y-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="XXXX XXXX XXXX XXXX" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" 
            maxLength={19} 
          />
          <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500">Numéro de carte</label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="MM/AA" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" 
              maxLength={5}
            />
            <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500">Expiration</label>
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="CVV" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" 
              maxLength={4}
            />
            <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500">CVV</label>
          </div>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Nom sur la carte" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" 
          />
          <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500">Titulaire</label>
        </div>
      </div>
    </div>
  );

  const MobilePaymentForm = () => (
     <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 mt-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
        <Smartphone className="w-5 h-5 mr-2 text-orange-500" />
        Paiement Mobile
      </h3>
      <div className="space-y-4">
        <div className="relative">
          <select className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none">
            <option>Orange Money</option>
            <option>MTN Mobile Money</option>
          </select>
          <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500">Opérateur</label>
        </div>
        <div className="relative">
          <input 
            type="tel" 
            placeholder="+237 6XX XXX XXX" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" 
          />
          <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500">Numéro de téléphone</label>
        </div>
      </div>
    </div>
  );

  const priceForRecipientIfTheyPay = formData.totalPrice || 0;
   
  if (paymentStatus) {
    const amountToDisplay = calculateTotalForPayer(); 
    let title = "Paiement réussi !";
    let message = `Votre colis ${APP_NAME} (N° ${trackingNumber}) a été enregistré avec succès.`;
    let iconColor = "from-green-400 to-emerald-500";
    let IconComponent = CheckCircle;

    if (paymentStatus === 'pending_cash') {
      title = "Enregistrement en attente";
      message = `Votre colis (N° ${trackingNumber}) est prêt. Veuillez effectuer le paiement de ${amountToDisplay.toLocaleString()} FCFA en espèces lors du dépôt au point relais.`;
      iconColor = "from-yellow-400 to-amber-500";
      IconComponent = Clock;
    } else if (paymentStatus === 'pending_recipient') {
      title = "Enregistrement confirmé !";
      message = `Le colis (N° ${trackingNumber}) est enregistré. Le destinataire paiera ${priceForRecipientIfTheyPay.toLocaleString()} FCFA à la réception.`;
      iconColor = "from-purple-400 to-pink-500";
      IconComponent = UserCircle;
    }

    return (
      <div className="max-w-3xl mx-auto text-center py-8">
        <div className="bg-white p-10 rounded-2xl shadow-2xl border border-gray-100">
          <div className={`w-20 h-20 bg-gradient-to-r ${iconColor} rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse`}>
            <IconComponent className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{title}</h2>
          <p className="text-gray-600 mb-6 text-md">{message}</p>
          
          <div className="bg-slate-50 p-6 rounded-xl mb-6 border border-slate-200">
            <p className="text-sm text-gray-500 mb-1">Numéro de suivi de votre colis</p>
            <p className="text-2xl font-bold text-green-700 font-mono tracking-wide">{trackingNumber}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setShowInvoice(true)}
              className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileText className="w-5 h-5 mr-2" />
              Voir le Bordereau
            </button>
            <button 
              onClick={onNewTask}
              className="flex items-center justify-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Nouvelle tâche
            </button>
          </div>
        </div>
        {showInvoice && <InvoiceModal />}
      </div>
    );
  }

  if (isProcessing) {
    const steps = ['Vérification des informations...', 'Traitement en cours...', 'Validation du paiement...', 'Enregistrement de la commande...'];
    return (
      <div className="max-w-2xl mx-auto text-center py-8">
        <div className="bg-white p-10 rounded-2xl shadow-2xl border border-gray-100">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Traitement en cours...</h2>
          <p className="text-gray-600 mb-5">Veuillez patienter, ceci peut prendre quelques instants.</p>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-green-700 font-medium text-sm">{steps[processingStep]}</p>
            <div className="w-full bg-green-200 rounded-full h-1.5 mt-2">
              <div 
                className="bg-green-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${((processingStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="grid lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Finaliser votre envoi
          </h2>
          <p className="text-gray-600 mb-8 text-md">Veuillez sélectionner une méthode pour régler les frais d'expédition.</p>

          <div className="space-y-5 mb-8">
            {paymentMethods.map((method) => (
              <PaymentMethodCard key={method.id} method={method} />
            ))}
          </div>

          {selectedMethod && !showPaymentForm && (selectedMethod === 'card' || selectedMethod === 'mobile') && (
            <div className="text-center mt-6">
              <button
                onClick={() => setShowPaymentForm(true)}
                className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Continuer avec {paymentMethods.find(m => m.id === selectedMethod)?.name}
              </button>
            </div>
          )}

          {showPaymentForm && selectedMethod === 'card' && <CardPaymentForm />}
          {showPaymentForm && selectedMethod === 'mobile' && <MobilePaymentForm />}

          {(selectedMethod === 'cash' || selectedMethod === 'recipient_pay') && !showPaymentForm && (
             <div className="text-center mt-6">
                <button
                    onClick={handlePayment}
                    className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    Confirmer l'expédition
                    {selectedMethod === 'cash' && " (Paiement au dépôt)"}
                    {selectedMethod === 'recipient_pay' && " (Paiement par destinataire)"}
                </button>
             </div>
          )}
        </div>
      
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 sticky top-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-green-600" />
              Résumé de la Commande
            </h3>

            <div className="space-y-2 mb-4 pb-4 border-b border-gray-200 text-sm">
              <p><User className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>Expéditeur:</strong> {currentUser.name}</p>
              <p><User className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>Destinataire:</strong> {formData?.recipientName || 'N/A'}</p>
              <p><MapPin className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>Départ:</strong> <span className="font-medium">{formData?.departurePointName || 'N/A'}</span></p>
              <p><MapPin className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>Arrivée:</strong> <span className="font-medium">{formData?.arrivalPointName || 'N/A'}</span></p>
              <p><Package className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>Colis:</strong> {packageData?.designation || 'Standard'}</p>
              <p><Scale className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>Poids:</strong> <span className="font-medium">{packageData?.weight || 'N/A'} kg</span></p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border-t-2 border-green-500">
              <div className="flex justify-between items-center">
                <span className="text-md font-bold text-gray-800">
                    {selectedMethod === 'recipient_pay' ? 'Total à payer par le Destinataire:' : 'Total à Payer:'}
                </span>
                
                <span className="text-2xl font-bold text-green-700">
                  { (formData.totalPrice !== undefined && selectedMethod) ? 
                    `${calculateTotalForPayer().toLocaleString()} FCFA` : 
                    <span className='text-sm text-gray-500'>Sélectionnez un mode</span>
                  }
                </span>
              </div>
               { selectedMethod && paymentMethods.find(m => m.id === selectedMethod)?.fees > 0 &&
                  <p className='text-xs text-right text-gray-500 mt-1'>
                    (inclus {paymentMethods.find(m => m.id === selectedMethod)?.fees} FCFA de frais)
                  </p>
                }
            </div>

            <div className="mt-6 space-y-3">
              {(showPaymentForm || selectedMethod === 'cash' || selectedMethod === 'recipient_pay') && (
                <button 
                    onClick={handlePayment} 
                    className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    disabled={!selectedMethod || isProcessing}
                >
                  {isProcessing ? 'Traitement...' : 
                    selectedMethod === 'cash' || selectedMethod === 'recipient_pay' ? 'Confirmer' :
                    `Payer ${calculateTotalForPayer().toLocaleString()} FCFA`
                  }
                </button>
              )}
              <button 
                onClick={onBack} 
                className="w-full flex items-center justify-center px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
            </div>

            <div className="mt-5 p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <Lock className="w-4 h-4 text-green-600 inline mr-1.5 align-middle" />
                <span className="text-xs text-gray-600 align-middle">Transactions sécurisées.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStep;
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CreditCardIcon, BanknotesIcon, DevicePhoneMobileIcon, CheckCircleIcon, XMarkIcon,
  PrinterIcon, DocumentTextIcon, ShieldCheckIcon, ClockIcon, MapPinIcon, UserIcon,
  PhoneIcon, ScaleIcon, CubeIcon, InformationCircleIcon, ShareIcon, SparklesIcon,
  LockClosedIcon, HeartIcon, HomeIcon, ArrowRightIcon, UserCircleIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeCanvas } from 'qrcode.react';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Icônes de partage
const WhatsAppIcon = () => <img src="/whatsapp.png" alt="WhatsApp" className="w-5 h-5" />;
const TelegramIcon = () => <img src="/telegram.jpeg" alt="Telegram" className="w-5 h-5" />;
const MessengerIcon = () => <img src="/messenger.jpeg" alt="Messenger" className="w-5 h-5" />;
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

interface CurrentUser {
    id: string;
    full_name: string | null;
    phone: string | null;
    email?: string;
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
  onShippingSuccess: (trackingNumber?: string) => Promise<void>; 
  currentUser: CurrentUser;
}

const APP_NAME = "Pick n Drop Link";

const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
);

const PaymentStep: React.FC<PaymentStepProps> = ({ onBack, formData, packageData, onNewTask, onShippingSuccess, currentUser }) => {

      if (!currentUser) {
        // Normalement, cela ne devrait jamais se produire grâce à la protection dans la page parente,
        // mais c'est une bonne pratique de s'en assurer.
        return <div>Erreur : informations utilisateur non disponibles.</div>;
    }
  const [selectedMethod, setSelectedMethod] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'pending_cash' | 'pending_recipient' | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [currentDate, setCurrentDate] = useState('');


  useEffect(() => {
    const generateTrackingNumber = () => {
      const prefix = 'PDL';
      const timestamp = Date.now().toString().slice(-7);
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      return `${prefix}${timestamp}${random}`;
    };
    setTrackingNumber(generateTrackingNumber());

    const today = new Date();
    setCurrentDate(today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }));
  }, []);

  const paymentMethods = [
    { id: 'card', name: 'Carte bancaire', description: 'Visa, Mastercard', icon: <CreditCardIcon className="w-8 h-8" />, color: 'blue', fees: 0, gradient: 'from-blue-500 to-indigo-600', popular: false },
    { id: 'mobile', name: 'Paiement Mobile', description: 'Orange Money, MTN MoMo', icon: <DevicePhoneMobileIcon className="w-8 h-8" />, color: 'orange', fees: 100, gradient: 'from-orange-500 to-red-500', popular: true },
    { id: 'cash', name: 'Paiement en espèces', description: 'Au dépôt du colis au point relais', icon: <BanknotesIcon className="w-8 h-8" />, color: 'green', fees: 0, gradient: 'from-green-500 to-emerald-600', popular: false },
    { id: 'recipient_pay', name: 'Paiement par le destinataire', description: 'À la réception du colis', icon: <GiftIcon className="w-8 h-8" />, color: 'purple', fees: 0, gradient: 'from-purple-500 to-pink-500', popular: false },
  ];

  const calculateTotalForPayer = useCallback(() => {
    const basePrice = formData.totalPrice || 0;
    const paymentFee = paymentMethods.find(m => m.id === selectedMethod)?.fees || 0;
    if (selectedMethod === 'recipient_pay') return basePrice;
    return basePrice + paymentFee;
  }, [selectedMethod, formData.totalPrice, paymentMethods]);

  // Helper functions for price calculation
  const calculatePackageBasePrice = () => formData.totalPrice || 0;
  const calculateAdditionalFees = () => 0; // This would normally include fragile, express fees etc
  const calculateInsuranceFee = () => 0; // This would calculate insurance based on declared value
  const calculateTotal = () => calculateTotalForPayer();

  const generatePDF = async (signatureImageDataUrl?: string | null) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 15;

      // --- EN-TÊTE ---
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(APP_NAME, 15, yPosition + 5);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Votre partenaire logistique fiable.', 15, yPosition + 11);

      // QR Code - Use a simpler approach without dynamic import
      const qrCodeWidth = 28;
      const qrCodeX = (pageWidth - qrCodeWidth) / 2;
      
      // Note: For production, you might want to generate QR code on server-side or use a different approach
      pdf.setFontSize(8);
      pdf.text(`QR: ${trackingNumber}`, qrCodeX, yPosition + 10);

      // Bordereau N° et Date (droite)
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Bordereau N°: ${trackingNumber}`, pageWidth - 65, yPosition + 5);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Date: ${currentDate}`, pageWidth - 65, yPosition + 11);

      yPosition += qrCodeWidth + 5;

      // Ligne de séparation sous l'en-tête
      pdf.setLineWidth(0.5);
      pdf.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 10;

      // --- EXPÉDITEUR ET DESTINATAIRE (côte à côte) ---
      const column1X = 15;
      const column2X = pageWidth / 2 + 5;
      let currentYExp = yPosition;
      let currentYDest = yPosition;

      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EXPÉDITEUR', column1X, currentYExp);
      currentYExp += 7;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nom: ${currentUser.full_name}`, column1X, currentYExp);
      currentYExp += 5;
      pdf.text(`Téléphone: ${currentUser.phone}`, column1X, currentYExp);
      currentYExp += 5;
      pdf.text(`Email: ${currentUser.email}`, column1X, currentYExp);
      currentYExp += 5;
      pdf.text(`Point de dépôt: ${formData?.departurePointName || 'N/A'}`, column1X, currentYExp);

      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DESTINATAIRE', column2X, currentYDest);
      currentYDest += 7;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nom: ${formData?.recipientName || 'N/A'}`, column2X, currentYDest);
      currentYDest += 5;
      pdf.text(`Téléphone: ${formData?.recipientPhone || 'N/A'}`, column2X, currentYDest);
      currentYDest += 5;
      if (formData?.recipientEmail) {
        pdf.text(`Email: ${formData.recipientEmail}`, column2X, currentYDest);
        currentYDest += 5;
      }
      pdf.text(`Point de retrait: ${formData?.arrivalPointName || 'N/A'}`, column2X, currentYDest);

      yPosition = Math.max(currentYExp, currentYDest) + 10;

      // --- TRAJET ---
      if (formData.departurePointName && formData.arrivalPointName) {
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TRAJET', 15, yPosition);
        yPosition += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const trajetText = `${formData.departurePointName}  ➔  ${formData.arrivalPointName}`;
        const trajetTextWidth = pdf.getTextWidth(trajetText);
        pdf.text(trajetText, (pageWidth - trajetTextWidth) / 2, yPosition);
        yPosition += 6;
        
        if (formData.distance) {
          pdf.setFontSize(8);
          const distanceText = `Distance estimée: ${formData.distance.toFixed(1)} km`;
          const distanceTextWidth = pdf.getTextWidth(distanceText);
          pdf.text(distanceText, (pageWidth - distanceTextWidth) / 2, yPosition);
          yPosition += 7;
        } else {
          yPosition += 2;
        }
      }

      // --- DÉTAILS DU COLIS ---
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DÉTAILS DU COLIS', 15, yPosition);
      yPosition += 7;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const col1DetailsX = 15;
      const col2DetailsX = pageWidth / 2 + 5;

      pdf.text(`Désignation: ${packageData?.designation || 'Colis divers'}`, col1DetailsX, yPosition);
      pdf.text(`Poids: ${packageData?.weight || formData?.weight || 'N/A'} kg`, col2DetailsX, yPosition);
      yPosition += 5;
      
      if (packageData?.length) {
        pdf.text(`Dimensions: ${packageData.length}x${packageData.width}x${packageData.height} cm`, col1DetailsX, yPosition);
        pdf.text(`Type: ${packageData?.contentType || 'Solide'}`, col2DetailsX, yPosition);
        yPosition += 5;
      }
      
      pdf.text(`Fragile: ${packageData?.isFragile ? 'Oui' : 'Non'}`, col1DetailsX, yPosition);
      pdf.text(`Périssable: ${packageData?.isPerishable ? 'Oui' : 'Non'}`, col2DetailsX, yPosition);
      yPosition += 5;
      
      if (packageData?.isInsured && packageData.declaredValue) {
        pdf.text(`Assuré: Oui (Valeur: ${parseFloat(packageData.declaredValue).toLocaleString()} FCFA)`, col1DetailsX, yPosition);
        yPosition += 5;
      }
      yPosition += 3;

      // --- RÉCAPITULATIF FINANCIER ---
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RÉCAPITULATIF FINANCIER', 15, yPosition);
      yPosition += 7;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const labelX = 15;
      const amountX = pageWidth - 45;
      
      const basePrice = calculatePackageBasePrice();
      const additionalFees = calculateAdditionalFees();
      const insuranceFee = calculateInsuranceFee();
      const paymentFees = selectedMethod !== 'recipient_pay' && paymentMethods.find(m => m.id === selectedMethod)!.fees > 0  
        ? paymentMethods.find(m => m.id === selectedMethod)?.fees || 0 
        : 0;
      
      pdf.text(`Prix de base du colis:`, labelX, yPosition);
      pdf.text(`${basePrice.toLocaleString()} FCFA`, amountX, yPosition, { align: 'right' });
      yPosition += 5;
      
      pdf.text(`Frais additionnels (fragile, etc.):`, labelX, yPosition);
      pdf.text(`${additionalFees.toLocaleString()} FCFA`, amountX, yPosition, { align: 'right' });
      yPosition += 5;
      
      pdf.text(`Assurance:`, labelX, yPosition);
      pdf.text(`${insuranceFee.toLocaleString()} FCFA`, amountX, yPosition, { align: 'right' });
      yPosition += 5;
      
      if (paymentFees > 0) {
        pdf.text(`Frais ${paymentMethods.find(m => m.id === selectedMethod)?.name}:`, labelX, yPosition);
        pdf.text(`${paymentFees.toLocaleString()} FCFA`, amountX, yPosition, { align: 'right' });
        yPosition += 5;
      }
      
      pdf.setLineWidth(0.3);
      pdf.line(15, yPosition + 1, pageWidth - 15, yPosition + 1);
      yPosition += 6;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      const totalText = `TOTAL À PAYER ${selectedMethod === 'recipient_pay' ? 'PAR LE DESTINATAIRE' : 'PAR L\'EXPÉDITEUR'}:`;
      const totalAmount = selectedMethod === 'recipient_pay' ? 
        (basePrice + additionalFees + insuranceFee) : 
        calculateTotal();
      
      pdf.text(totalText, labelX, yPosition);
      pdf.text(`${totalAmount.toLocaleString()} FCFA`, amountX, yPosition, { align: 'right' });
      yPosition += 7;
      
      if (paymentStatus === 'success' && selectedMethod !== 'cash' && selectedMethod !== 'recipient_pay') {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 128, 0);
        pdf.text('Colis payé comptant par l\'expéditeur.', amountX, yPosition, { align: 'right' });
        pdf.setTextColor(0, 0, 0);
        yPosition += 6;
      }

      // --- CONDITIONS ---
      yPosition += 5;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const conditions = `Conditions: Le colis sera livré au point relais d'arrivée indiqué. Le destinataire doit présenter une pièce d'identité valide. ${APP_NAME} n'est pas responsable des dommages non déclarés ou dus à un emballage inadéquat si non fragile.`;
      
      const splitConditions = pdf.splitTextToSize(conditions, pageWidth - 30);
      pdf.text(splitConditions, 15, yPosition);
      yPosition += splitConditions.length * 3.5 + 7;

      // --- SIGNATURES ---
      const signatureY = yPosition;
      const signatureExpX = 15;
      const signatureAgenceX = pageWidth / 2 + 15;

      pdf.setFontSize(9);
      pdf.text('Signature Expéditeur:', signatureExpX, signatureY);
      if (signatureImageDataUrl) {
        try {
          const signatureWidthMm = 35; 
          const signatureHeightMm = 15;
          pdf.addImage(signatureImageDataUrl, 'PNG', signatureExpX, signatureY + 2, signatureWidthMm, signatureHeightMm);
        } catch (e) {
          console.error("Erreur d'ajout de l'image de signature:", e);
          pdf.text('_________________________', signatureExpX, signatureY + 7);
        }
      } else {
        pdf.text('_________________________', signatureExpX, signatureY + 7);
      }

      pdf.text('Cachet & Signature Agence Départ:', signatureAgenceX, signatureY);
      pdf.text('_________________________', signatureAgenceX, signatureY + 15);

      yPosition = signatureY + 25;

      // --- FOOTER ---
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      const footerText = `Merci d'utiliser ${APP_NAME}! - ${new Date().toLocaleString()}`;
      const footerTextWidth = pdf.getTextWidth(footerText);
      pdf.text(footerText, (pageWidth - footerTextWidth) / 2, pdf.internal.pageSize.getHeight() - 10);

      pdf.save(`Bordereau-${trackingNumber}.pdf`);

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Une erreur est survenue lors de la génération du bordereau. Veuillez réessayer.');
    }
  };

  const InvoiceModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl animate-fadeIn">
        
        <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-slate-50 rounded-t-xl flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Aperçu du Bordereau - {APP_NAME}</h2>
          <div className="flex items-center space-x-1.5">
            <button 
              onClick={() => generatePDF(formData?.signatureData)}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-200 transition-colors" 
              title="Imprimer / Télécharger en PDF"
            > 
              <PrinterIcon className="w-5 h-5" /> 
            </button>
            <button 
              onClick={() => setShowInvoice(false)}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-200 transition-colors" 
              title="Fermer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto p-5" id="invoice-content-pdf">
          <div className="flex justify-between items-start pb-3 mb-4 border-b-2 border-green-500">
              <div className="flex items-center">
                  <HomeIcon className="h-8 w-8 text-green-600 mr-2"/>
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
                          <QRCodeCanvas 
                              value={`Suivi ${APP_NAME}: ${trackingNumber}`} 
                              size={50} level="M" />
                      </div>
                  )}
              </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-4">
              <div className="invoice-section">
                  <h3 className="invoice-section-title text-green-600">EXPÉDITEUR</h3>
                  <p><strong>Nom:</strong> {currentUser.full_name}</p>
                  <p><strong>Téléphone:</strong> {currentUser.phone}</p>
                  <p><strong>Point de dépôt:</strong> {formData?.departurePointName || 'N/A'}</p>
              </div>
              <div className="invoice-section">
                  <h3 className="invoice-section-title text-blue-600">DESTINATAIRE</h3>
                  <p><strong>Nom:</strong> {formData?.recipientName || 'N/A'}</p>
                  <p><strong>Téléphone:</strong> {formData?.recipientPhone || 'N/A'}</p>
                  <p><strong>Point de retrait:</strong> {formData?.arrivalPointName || 'N/A'}</p>
              </div>
          </div>

          <div className="invoice-section mb-4">
              <h3 className="invoice-section-title text-orange-600">DÉTAILS DU COLIS</h3>
              <table className="w-full text-sm">
                  <tbody>
                      <tr>
                          <td className="invoice-table-label">Désignation:</td>
                          <td className="invoice-table-value">{packageData?.designation || 'N/A'}</td>
                          <td className="invoice-table-label">Poids:</td>
                          <td className="invoice-table-value">{packageData?.weight || 'N/A'} kg</td>
                      </tr>
                      <tr>
                          <td className="invoice-table-label">Dimensions:</td>
                          <td className="invoice-table-value">{packageData?.length ? `${packageData.length}x${packageData.width}x${packageData.height} cm` : 'N/A'}</td>
                          <td className="invoice-table-label">Contenu:</td>
                          <td className="invoice-table-value capitalize">{packageData?.contentType || 'Solide'}</td>
                      </tr>
                      <tr>
                          <td className="invoice-table-label">Options:</td>
                          <td className="invoice-table-value" colSpan={3}>
                             {packageData?.isFragile && <span className="mr-2">Fragile</span>}
                             {packageData?.isPerishable && <span className="mr-2">Périssable</span>}
                             {packageData?.isInsured && <span>Assuré ({Number(packageData.declaredValue || 0).toLocaleString()} FCFA)</span>}
                             {!packageData?.isFragile && !packageData?.isPerishable && !packageData?.isInsured && <span>Aucune</span>}
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
              <h3 className="invoice-section-title text-indigo-600 !border-slate-300">RÉCAPITULATIF FINANCIER</h3>
              
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
                      <p className="text-sm font-semibold mb-2">Cachet & Signature du propriétaire de point relais:</p>
                      {formData?.signatureData ? (
                          <img src={formData.signatureData} alt="Signature Expéditeur" className="h-12 border-b" />
                      ) : (
                          <div className="h-12 border-b border-gray-400"></div>
                      )}
                  </div>
                  <div>
                      <p className="text-sm font-semibold mb-2"></p>
                      <div className="h-12 border-b border-gray-400">Signature de l'Expéditeur:</div>
                  </div>
              </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .invoice-section { padding-bottom: 0.75rem; }
        .invoice-section-title { font-size: 0.9rem; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3rem; margin-bottom: 0.5rem; }
        .invoice-table-label { font-weight: 600; padding: 4px; text-align: left; color: #4b5563; }
        .invoice-table-value { padding: 4px; text-align: left; }
      `}</style>
    </div>
  );

  const shareBordereau = async (platform: 'whatsapp' | 'telegram' | 'sms' | 'messenger' | 'native') => {
    const textToShare = `Bonjour ${formData.recipientName || 'Destinataire'}, votre colis ${APP_NAME} (N° ${trackingNumber}) est en cours d'expédition. Point de départ: ${formData.departurePointName}, Arrivée: ${formData.arrivalPointName}.`;
    const urlToShare = window.location.href;

    if (platform === 'native' && navigator.share) {
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
      window.open(`https://wa.me/?text=${encodeURIComponent(textToShare + "\n" + urlToShare)}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(urlToShare)}&text=${encodeURIComponent(textToShare)}`, '_blank');
    } else if (platform === 'sms') {
      window.open(`sms:?body=${encodeURIComponent(textToShare + "\n" + urlToShare)}`, '_blank');
    } else if (platform === 'messenger') {
        // Messenger n'a pas d'URL de partage direct simple comme WhatsApp ou Telegram pour du texte arbitraire
        // Le mieux est d'utiliser le partage natif, ou de demander à l'utilisateur de copier/coller
        alert("Pour partager sur Messenger, veuillez utiliser la fonction de partage native de votre appareil ou copiez le texte et le lien.");
    }
    setShowShareMenu(false);
  };


  const shareOptions = [
    { name: 'Partage Natif', icon: <ShareIcon className="w-5 h-5" />, action: () => shareBordereau('native'), color: 'gray' },
    { name: 'WhatsApp', icon: <WhatsAppIcon />, action: () => shareBordereau('whatsapp'), color: 'green' },
    { name: 'Telegram', icon: <TelegramIcon />, action: () => shareBordereau('telegram'), color: 'blue' },
    { name: 'SMS', icon: <SmsIcon />, action: () => shareBordereau('sms'), color: 'yellow' },
    // { name: 'Messenger', icon: <MessengerIcon />, action: () => shareBordereau('messenger'), color: 'purple' }, // Optionnel
  ];

  // --- FONCTION handlePayment ENTIÈREMENT REVUE ET CORRIGÉE ---
const handlePayment = async () => {
        if (!packageData || !formData || !selectedMethod) {
            alert("Veuillez sélectionner une méthode de paiement.");
            return;
        }

        setIsProcessing(true);
        setProcessingStep(0);
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            const newTrackingNumber = `PDL${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
            setProcessingStep(1);
            
            // --- CORRECTION MAJEURE : On complète l'objet à insérer ---
            const shipmentData = {
                trackingNumber: newTrackingNumber,
                status: 'RECU' as const, 
                
                // Données de l'expéditeur
                senderName: currentUser.full_name || 'Non renseigné',
                senderPhone: currentUser.phone || 'Non renseigné',
                
                // Données du destinataire (VIENNENT DE FORMDATA)
                recipientName: formData.recipientName,
                recipientPhone: formData.recipientPhone,
                
                // Détails du colis (VIENNENT DE PACKAGEDATA)
                description: packageData.designation || 'Colis', // Utilisons designation comme description principale
                weight: parseFloat(packageData.weight || '0'),
                isFragile: packageData.isFragile || false,
                isPerishable: packageData.isPerishable || false,
                isInsured: packageData.isInsured || false,
                declaredValue: packageData.isInsured ? parseFloat(packageData.declaredValue || '0') : 0,

                // Informations sur le trajet (VIENNENT DE FORMDATA)
                departurePointId: formData.departurePointId, 
                arrivalPointId: formData.arrivalPointId,
                
                // Détails du paiement
                shippingCost: calculateTotalForPayer(),
                isPaidAtDeparture: selectedMethod !== 'recipient_pay',
                amountPaid: selectedMethod !== 'recipient_pay' ? calculateTotalForPayer() : null, // On suppose paiement complet au dépôt

                // Trace de l'utilisateur
                created_by_user: currentUser.id 
            };

            // Vérification des champs obligatoires
            if (!shipmentData.recipientPhone || !shipmentData.departurePointId || !shipmentData.arrivalPointId) {
                throw new Error("Informations manquantes : téléphone du destinataire ou points de relais invalides.");
            }

            setProcessingStep(2);
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const { error } = await supabase.from('Shipment').insert(shipmentData);
            
            if (error) {
                console.error("Erreur d'insertion Supabase:", error);
                throw new Error(`Erreur base de données : ${error.message}`);
            }

            setProcessingStep(3);
            await new Promise(resolve => setTimeout(resolve, 300));
            
            setTrackingNumber(newTrackingNumber); 
            
            if (selectedMethod === 'cash') setPaymentStatus('pending_cash');
            else if (selectedMethod === 'recipient_pay') setPaymentStatus('pending_recipient');
            else setPaymentStatus('success');
            
            // Appeler la fonction de succès du parent
            await onShippingSuccess(newTrackingNumber);

        } catch (err) {
            console.error("Erreur dans handlePayment:", err);
            // Afficher l'erreur dans la UI est mieux qu'un alert
            alert(`Une erreur est survenue : ${err instanceof Error ? err.message : String(err)}`);
            setPaymentStatus(null);
        } finally {
            setIsProcessing(false);
        }
    };


  const PaymentMethodCard = ({ method }: { method: typeof paymentMethods[0] }) => (
    <div
      onClick={() => {
        setSelectedMethod(method.id);
        // Afficher le formulaire seulement si ce n'est pas cash ou paiement par destinataire
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
            <SparklesIcon className="w-3 h-3" />
            <span>POPULAIRE</span>
          </div>
        </div>
      )}
      {selectedMethod === method.id && (
        <div className={`absolute -top-2.5 -right-2.5 w-7 h-7 bg-gradient-to-br ${method.gradient} rounded-full flex items-center justify-center animate-pulse shadow-md`}>
          <CheckCircleIcon className="w-4 h-4 text-white" />
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
    <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 animate-fadeIn mt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <LockClosedIcon className="w-5 h-5 mr-2 text-green-600" />
          Paiement par Carte
        </h3>
        <div className="flex space-x-2">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/MasterCard_Logo.svg/200px-MasterCard_Logo.svg.png" alt="Mastercard" className="h-6" />
        </div>
      </div>
      {/* ... (champs du formulaire carte) ... */}
       <div className="space-y-4">
        <div className="relative">
          <input type="text" placeholder="XXXX XXXX XXXX XXXX" className="input-form-payment" maxLength={19} />
          <label className="label-form-payment">Numéro de carte</label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <input type="text" placeholder="MM/AA" className="input-form-payment" maxLength={5}/>
            <label className="label-form-payment">Expiration</label>
          </div>
          <div className="relative">
            <input type="text" placeholder="CVV" className="input-form-payment" maxLength={4}/>
            <label className="label-form-payment">CVV</label>
          </div>
        </div>
        <div className="relative">
          <input type="text" placeholder="Nom sur la carte" className="input-form-payment" />
          <label className="label-form-payment">Titulaire</label>
        </div>
      </div>
    </div>
  );

  const MobilePaymentForm = () => (
     <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 animate-fadeIn mt-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
        <DevicePhoneMobileIcon className="w-5 h-5 mr-2 text-orange-500" />
        Paiement Mobile
      </h3>
      <div className="space-y-4">
        <div className="relative">
          <select className="input-form-payment">
            <option>Orange Money</option>
            <option>MTN Mobile Money</option>
            {/* Ajoutez d'autres opérateurs si nécessaire */}
          </select>
          <label className="label-form-payment">Opérateur</label>
        </div>
        <div className="relative">
          <input type="tel" placeholder="+237 6XX XXX XXX" className="input-form-payment" />
          <label className="label-form-payment">Numéro de téléphone</label>
        </div>
      </div>
    </div>
  );

  // ... (Reste du JSX pour affichage principal, succès, traitement)
    // Le prix total est maintenant directement lu depuis l'API
  const priceForRecipientIfTheyPay = formData.totalPrice || 0;
   if (paymentStatus) {
    const amountToDisplay = calculateTotalForPayer(); 
    let title = "Paiement réussi !";
    let message = `Votre colis ${APP_NAME} (N° ${trackingNumber}) a été enregistré avec succès.`;
    let iconColor = "from-green-400 to-emerald-500";
    let IconComponent = CheckCircleIcon;

    if (paymentStatus === 'pending_cash') {
      title = "Enregistrement en attente";
      message = `Votre colis (N° ${trackingNumber}) est prêt. Veuillez effectuer le paiement de ${amountToDisplay.toLocaleString()} FCFA en espèces lors du dépôt au point relais.`;
      iconColor = "from-yellow-400 to-amber-500";
      IconComponent = ClockIcon;
    } else if (paymentStatus === 'pending_recipient') {
      title = "Enregistrement confirmé !";
      message = `Le colis (N° ${trackingNumber}) est enregistré. Le destinataire paiera ${priceForRecipientIfTheyPay.toLocaleString()} FCFA à la réception.`;
      iconColor = "from-purple-400 to-pink-500";
      IconComponent = UserCircleIcon;
    }

    return (
      <div className="max-w-3xl mx-auto text-center py-8">
        <div className="bg-white p-10 rounded-2xl shadow-2xl border border-gray-100 animate-fadeIn">
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
              className="btn-primary flex-1"
            >
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Voir le Bordereau
            </button>
            <button 
              onClick={onNewTask}
              className="btn-secondary flex-1"
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
    // ... (Affichage du traitement identique)
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

  // ... (JSX principal pour la sélection du paiement et le résumé)
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="grid lg:grid-cols-5 gap-8 items-start"> {/* Changé à 5 colonnes, 3 pour paiement, 2 pour résumé */}
        <div className="lg:col-span-3"> {/* Section paiement prend 3 colonnes */}
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
            <div className="text-center animate-fadeIn mt-6">
              <button
                onClick={() => setShowPaymentForm(true)}
                className="btn-primary w-full sm:w-auto"
              >
                Continuer avec {paymentMethods.find(m => m.id === selectedMethod)?.name}
              </button>
            </div>
          )}

          {showPaymentForm && selectedMethod === 'card' && <CardPaymentForm />}
          {showPaymentForm && selectedMethod === 'mobile' && <MobilePaymentForm />}

          {(selectedMethod === 'cash' || selectedMethod === 'recipient_pay') && !showPaymentForm && (
             <div className="text-center animate-fadeIn mt-6">
                <button
                    onClick={handlePayment}
                    className="btn-primary w-full sm:w-auto"
                >
                    Confirmer l'expédition
                    {selectedMethod === 'cash' && " (Paiement au dépôt)"}
                    {selectedMethod === 'recipient_pay' && " (Paiement par destinataire)"}
                </button>
             </div>
          )}
        </div>
      
        {/* --- PARTIE DROITE : RÉSUMÉ DE LA COMMANDE --- */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 sticky top-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
              <DocumentTextIcon className="w-6 h-6 mr-2 text-green-600" />
              Résumé de la Commande
            </h3>

            {/* Section des détails (colis et trajet) */}
            <div className="space-y-2 mb-4 pb-4 border-b border-gray-200 text-sm">
              <p><UserIcon className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>Expéditeur:</strong> {currentUser.full_name}</p>
              <p><UserIcon className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>Destinataire:</strong> {formData?.recipientName || 'N/A'}</p>
              <p><MapPinIcon className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>Départ:</strong> <span className="font-medium">{formData?.departurePointName || 'N/A'}</span></p>
              <p><MapPinIcon className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>Arrivée:</strong> <span className="font-medium">{formData?.arrivalPointName || 'N/A'}</span></p>
              <p><CubeIcon className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>Colis:</strong> {packageData?.designation || 'Standard'}</p>
              <p><ScaleIcon className="inline w-4 h-4 mr-1 text-gray-500" /> <strong>Poids:</strong> <span className="font-medium">{packageData?.weight || 'N/A'} kg</span></p>
            </div>

            {/* Total (simplifié) */}
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
              { selectedMethod && paymentMethods.find(m => m.id === selectedMethod)?.fees && paymentMethods.find(m => m.id === selectedMethod)!.fees > 0 &&
                <p className='text-xs text-right text-gray-500 mt-1'>
                  (inclus {paymentMethods.find(m => m.id === selectedMethod)?.fees} FCFA de frais)
                </p>
              }
            </div>

            {/* Boutons d'action */}
            <div className="mt-6 space-y-3">
              {(showPaymentForm || selectedMethod === 'cash' || selectedMethod === 'recipient_pay') && (
                <button 
                    onClick={handlePayment} 
                    className="btn-primary w-full"
                    disabled={!selectedMethod || isProcessing}
                >
                  {isProcessing ? 'Traitement...' : 
                    selectedMethod === 'cash' || selectedMethod === 'recipient_pay' ? 'Confirmer' :
                    `Payer ${calculateTotalForPayer().toLocaleString()} FCFA`
                  }
                </button>
              )}
              <button onClick={onBack} className="btn-secondary w-full">Retour</button>
            </div>

            <div className="mt-5 p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <LockClosedIcon className="w-4 h-4 text-green-600 inline mr-1.5 align-middle" />
                <span className="text-xs text-gray-600 align-middle">Transactions sécurisées.</span>
            </div>
          </div>
        </div>
        {/* --- FIN DE LA CORRECTION --- */}

      </div>
      {/* Styles CSS pour le formulaire de paiement et la facture/bordereau */}
      <style jsx global>{`
        .input-form-payment {
          width: 100%; padding: 0.8rem 1rem; font-size: 0.9rem;
          border: 1px solid #e5e7eb; border-radius: 0.5rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-form-payment:focus {
          outline: none; border-color: #10b981; /* emerald-500 */
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }
        .label-form-payment { /* Style pour les labels flottants si vous les ajoutez */
          position: absolute; top: -0.6rem; left: 0.75rem;
          background-color: white; padding: 0 0.25rem;
          font-size: 0.75rem; color: #6b7280; /* gray-500 */
          transition: all 0.2s;
        }
        .btn-primary {
            display: flex; align-items: center; justify-content: center;
            padding: 0.75rem 1.25rem; background-color: #10b981; /* emerald-500 */ color: white;
            border-radius: 0.5rem; font-weight: 500; font-size: 0.9rem;
            transition: all 0.2s ease-in-out; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .btn-primary:hover:not(:disabled) { background-color: #059669; /* emerald-600 */ transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        .btn-primary:disabled { background-color: #9ca3af; cursor: not-allowed; }
        
        .btn-secondary {
            display: flex; align-items: center; justify-content: center;
            padding: 0.75rem 1.25rem; background-color: white; color: #374151; /* gray-700 */
            border: 1px solid #d1d5db; /* gray-300 */
            border-radius: 0.5rem; font-weight: 500; font-size: 0.9rem;
            transition: all 0.2s ease-in-out; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .btn-secondary:hover { background-color: #f3f4f6; /* gray-100 */ border-color: #9ca3af; }

        .btn-icon-header {
            padding: 0.5rem; border-radius: 9999px; transition: background-color 0.2s;
            color: #4b5563; /* gray-600 */
        }
        .btn-icon-header:hover { background-color: #e5e7eb; /* gray-200 */ }
        
        /* Styles pour la facture/bordereau PDF */
        .invoice-section { border: 1px solid #e0e0e0; padding: 10px; border-radius: 6px; }
        .invoice-section-title { font-size: 11pt; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 8px; }
        .invoice-table-label { font-weight: bold; padding: 4px; text-align: left; min-width: 90px; }
        .invoice-table-value { padding: 4px; text-align: left; }
        .invoice-financial-row { display: flex; justify-content: space-between; padding: 3px 0; }
      `}</style>
    </div>
    
  );
};

export default PaymentStep;
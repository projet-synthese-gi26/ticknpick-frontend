'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCardIcon, 
  DevicePhoneMobileIcon, 
  BanknotesIcon, 
  GiftIcon,
  ArrowLeftIcon, 
  CheckCircleIcon, 
  ShareIcon, 
  ArrowPathIcon,
  DocumentTextIcon,
  ClockIcon,
  ShieldCheckIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import OriginalQRCode from 'qrcode'; 
import { supabase } from '@/lib/supabase';
import { PhoneIcon } from 'lucide-react';

interface FinalData {
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  designation: string;
  weight: string;
  isFragile: boolean;
  isPerishable: boolean;
  isInsured: boolean;
  declaredValue: string;
  logistics: 'standard' | 'express_24h' | 'express_48h';
  departurePointId: number | null;
  arrivalPointId: number | null;
  departurePointName: string;
  arrivalPointName: string;
  distanceKm: number;
  signatureUrl: string | null;
  basePrice: number;
  travelPrice: number;
}

interface LoggedInUser {
  id: string;
}

interface PaymentStepProps {
  allData: FinalData;
  onBack: () => void;
  onPaymentFinalized: (pricing: {basePrice: number, travelPrice: number, operatorFee: number, totalPrice: number}) => void;
  currentUser: LoggedInUser | null;
}

const PAYMENT_OPERATOR_FEE = 100;
const APP_NAME = "PicknDrop Link";
const DEFAULT_COUNTER_USER = {
  id: '9b0ab148-dbbc-4a54-b952-62f4c736179e',
  email: 'comptoir_pickndrop@gmail.com',
  name: 'Comptoir PicknDrop'
};

export default function PaymentStep({ allData, onBack, onPaymentFinalized, currentUser }: PaymentStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'mobile' | 'recipient'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [mobileOperator, setMobileOperator] = useState<'orange' | 'mtn'>('orange');
  const [mobilePhone, setMobilePhone] = useState('');

  const operatorFee = selectedMethod === 'mobile' ? PAYMENT_OPERATOR_FEE : 0;
  const totalPrice = allData.basePrice + allData.travelPrice + operatorFee;



  // Validation du numéro de téléphone mobile
  const validateMobilePhone = (phone: string) => {
    const cleaned = phone.replace(/\s+/g, '');
    // Format Cameroun : 6XXXXXXXX ou +237 6XXXXXXXX
    return /^(\+237\s?)?6[0-9]{8}$/.test(cleaned);
  };

  const canConfirmPayment = () => {
    if (selectedMethod === 'mobile') {
      return validateMobilePhone(mobilePhone);
    }
    return true;
  };

  const generateBordereauPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let y = 20;

      // FONCTIONS UTILITAIRES
      const addSectionTitle = (title: string) => {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(45, 55, 72); // Couleur sombre (slate-700)
        pdf.text(title, margin, y);
        y += 8;
        pdf.setLineWidth(0.2);
        pdf.line(margin, y - 3, pageWidth - margin, y - 3);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
      };
      
      const addField = (label: string, value: string | undefined | null) => {
        if (!value) return;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(String(value), margin + 45, y);
        y += 6;
      };

      // 1. EN-TÊTE
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(249, 115, 22); // Orange
      pdf.text(APP_NAME, margin, y - 5);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text('Votre solution de livraison de confiance', margin, y);

      const qrDataURL = await OriginalQRCode.toDataURL(trackingNumber, { width: 110, margin: 1 });
      const qrSize = 28;
      pdf.addImage(qrDataURL, 'PNG', pageWidth - margin - qrSize, y - 12, qrSize, qrSize);

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0,0,0);
      pdf.text(`Bordereau d'Expédition`, pageWidth - margin - 35, y - 5, { align: 'right' });
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`N°: ${trackingNumber}`, pageWidth - margin - 35, y, { align: 'right' });
      pdf.text(`Date: ${new Date().toLocaleDateString('fr-CM')}`, pageWidth - margin - 35, y + 5, { align: 'right' });

      y += qrSize - 5;
      
      // 2. EXPÉDITEUR & DESTINATAIRE
      addSectionTitle('Intervenants');
      const startYCols = y;
      addField('Expéditeur:', allData.senderName);
      addField('Téléphone:', allData.senderPhone);
      addField('Point de Dépôt:', allData.departurePointName);
      
      y = startYCols; // Reset y pour la deuxième colonne
      pdf.text('', pageWidth / 2, y); // Placeholder pour aligner
      addField('Destinataire:', allData.recipientName);
      addField('Téléphone:', allData.recipientPhone);
      addField('Point de Retrait:', allData.arrivalPointName);
      y = Math.max(y, startYCols + (3*6)); // S'assurer que 'y' est à la fin de la colonne la plus longue
      y += 5;

      // 3. DÉTAILS DU COLIS
      addSectionTitle('Détails du Colis');
      addField('Désignation:', allData.designation);
      addField('Poids:', `${allData.weight} kg`);
      let caracteristiques = [];
      if (allData.isFragile) caracteristiques.push("Fragile");
      if (allData.isPerishable) caracteristiques.push("Périssable");
      if (allData.isInsured) caracteristiques.push(`Assuré (Valeur: ${Number(allData.declaredValue).toLocaleString('fr-FR')} FCFA)`);
      if (caracteristiques.length > 0) addField('Spécificités:', caracteristiques.join(', '));
      y += 5;
      
      // 4. RÉCAPITULATIF FINANCIER
      addSectionTitle('Récapitulatif Financier');
      addField('Coût de base:', `${allData.basePrice.toLocaleString('fr-FR')} FCFA`);
      addField('Frais de trajet:', `${allData.travelPrice.toLocaleString('fr-FR')} FCFA`);
      if(operatorFee > 0) addField('Frais transaction:', `${operatorFee.toLocaleString('fr-FR')} FCFA`);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, margin + 85, y);
      y += 6;

      pdf.setFont('helvetica', 'bold');
      const paymentStatusText = selectedMethod === 'recipient' 
        ? 'Total à payer par le Destinataire:' 
        : 'Total payé par l\'Expéditeur:';
      addField(paymentStatusText, `${totalPrice.toLocaleString('fr-FR')} FCFA`);
      pdf.setFont('helvetica', 'normal');
      y += 10;
      
      // 5. SIGNATURE
      addSectionTitle('Signature');
      if (allData.signatureUrl) {
        try {
          pdf.addImage(allData.signatureUrl, 'PNG', margin, y, 50, 20);
        } catch(e) { 
          console.error("Erreur d'ajout de signature"); 
        }
      } else {
        pdf.text('Pas de signature numérique.', margin, y);
      }
      pdf.line(margin, y + 25, margin + 60, y + 25);
      pdf.text("Signature de l'agent", margin + 100, y + 28);
      pdf.line(margin + 90, y + 25, margin + 150, y + 25);

      // 6. PIED DE PAGE
      const finalY = pdf.internal.pageSize.getHeight() - 15;
      pdf.setLineWidth(0.5);
      pdf.line(margin, finalY - 5, pageWidth - margin, finalY - 5);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Document généré le ${new Date().toLocaleString('fr-CM')}. ${APP_NAME} vous remercie.`, pageWidth / 2, finalY, { align: 'center' });

      // SAUVEGARDE
      pdf.save(`Bordereau_Expedition_${trackingNumber}.pdf`);
    } catch (error) {
      console.error("Erreur détaillée lors de la génération du PDF:", error);
      alert("Une erreur est survenue lors de la génération du bordereau PDF.");
    }
  };

  const simulateMobilePayment = async () => {
    setProcessingStep(`Demande de paiement ${mobileOperator.toUpperCase()} Money...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setProcessingStep('Confirmation du paiement...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simuler une validation réussie
    return true;
  };

  const handleSubmit = async () => {
    if (!canConfirmPayment()) {
      alert('Veuillez vérifier vos informations de paiement');
      return;
    }

    const userToUse = currentUser || DEFAULT_COUNTER_USER;

    setIsProcessing(true);
    const newTrackingNumber = `PDL${Date.now().toString().slice(-7)}`;
    setTrackingNumber(newTrackingNumber);
    setProcessingStep('Vérification des données...');

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simuler le paiement mobile si nécessaire
      if (selectedMethod === 'mobile') {
        const paymentSuccess = await simulateMobilePayment();
        if (!paymentSuccess) {
          throw new Error('Échec du paiement mobile');
        }
      }

      setProcessingStep('Enregistrement du colis...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // 1. Préparer l'objet de données pour la table 'shipments'
      const shipmentData = {
        tracking_number: newTrackingNumber,
        status: 'AU_DEPART', // Le colis est physiquement déposé
        sender_name: allData.senderName,
        sender_phone: allData.senderPhone,
        recipient_name: allData.recipientName,
        recipient_phone: allData.recipientPhone,
        departure_point_id: allData.departurePointId,
        arrival_point_id: allData.arrivalPointId,
        description: allData.designation,
        weight: parseFloat(allData.weight),
        is_fragile: allData.isFragile,
        is_perishable: allData.isPerishable,
        is_insured: allData.isInsured,
        declared_value: allData.isInsured ? parseFloat(allData.declaredValue) : null,
        shipping_cost: totalPrice,
        is_paid_at_departure: selectedMethod !== 'recipient',
        amount_paid: selectedMethod !== 'recipient' ? totalPrice : null,
        // Associer l'enregistrement à l'utilisateur qui a fait l'opération
        created_by_user: userToUse.id,
      };

      // 2. Insérer les données dans Supabase
      const { error } = await supabase
        .from('shipments') // Assurez-vous que le nom de la table est correct
        .insert(shipmentData);

      // 3. Gérer les erreurs de la base de données
      if (error) {
        console.error("Erreur d'insertion Supabase:", error);
        throw new Error(`Erreur de base de données : ${error.message}`);
      }

      setProcessingStep('Génération du bordereau...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const finalPricing = { 
        basePrice: allData.basePrice, 
        travelPrice: allData.travelPrice, 
        operatorFee, 
        totalPrice 
      };

      setPaymentSuccess(true);
      onPaymentFinalized(finalPricing);
      
    } catch (error: any) {
      console.error("Erreur lors de la finalisation :", error);
      alert(`Échec de l'enregistrement du colis : ${error.message}`);
      // Réinitialiser en cas d'erreur
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // Animation des variantes
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <ArrowPathIcon className="w-10 h-10 text-orange-600" />
            </motion.div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Traitement en cours</h2>
          <p className="text-orange-600 font-medium text-lg">{processingStep}</p>
        </motion.div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex items-center justify-center bg-orange-50 p-4"
      >
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <CheckCircleIcon className="w-24 h-24 text-green-500 mx-auto drop-shadow-lg"/>
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-800 mt-4 mb-2">Expédition confirmée !</h2>
          <p className="text-gray-600 mb-6">
            Votre colis a été enregistré avec le numéro de suivi suivant.
          </p>
          
          <div className="bg-orange-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Numéro de suivi</p>
            <p className="text-2xl font-bold text-orange-600">{trackingNumber}</p>
          </div>

          <div className="space-y-3">
            <motion.button
              onClick={generateBordereauPDF}
              className="w-full flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-2xl transition-colors shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PrinterIcon className="w-5 h-5 mr-2" />
              Télécharger le Bordereau
            </motion.button>
            <motion.button 
              onClick={() => window.location.reload()}
              className="w-full border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 text-orange-600 font-semibold py-3 px-6 rounded-2xl transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Nouvelle expédition
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gray-50 p-4 lg:p-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Finaliser votre expédition
          </h1>
          <p className="text-gray-600">Choisissez votre mode de paiement et confirmez votre envoi</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonne principale - Options de paiement */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            
            {/* Méthodes de paiement */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <CreditCardIcon className="w-6 h-6 text-orange-600" />
                Mode de paiement
              </h2>
              
              <div className="space-y-4">
                <PaymentOption
                  id="cash"
                  label="Paiement en espèces"
                  description="Payez directement à notre agent"
                  icon={BanknotesIcon}
                  fee={0}
                  selected={selectedMethod}
                  setSelected={setSelectedMethod}
                  badge="Recommandé"
                />
                
                <PaymentOption
                  id="mobile"
                  label="Paiement Mobile"
                  description="Orange Money, MTN Mobile Money"
                  icon={DevicePhoneMobileIcon}
                  fee={PAYMENT_OPERATOR_FEE}
                  selected={selectedMethod}
                  setSelected={setSelectedMethod}
                />
                
                <PaymentOption
                  id="recipient"
                  label="Paiement par le destinataire"
                  description="Le destinataire paie à la réception"
                  icon={GiftIcon}
                  fee={0}
                  selected={selectedMethod}
                  setSelected={setSelectedMethod}
                />
              </div>

              {/* Formulaire de paiement mobile */}
              <AnimatePresence>
                {selectedMethod === 'mobile' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 p-6 bg-orange-50 rounded-2xl border-2 border-orange-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <PhoneIcon className="w-5 h-5 text-orange-600" />
                        Informations de paiement mobile
                      </h3>
                      
                      {/* Sélection de l'opérateur */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Opérateur mobile
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setMobileOperator('orange')}
                            className={`p-3 rounded-xl border-2 font-medium transition-all ${
                              mobileOperator === 'orange'
                                ? 'border-orange-500 bg-orange-100 text-orange-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            Orange Money
                          </button>
                          <button
                            type="button"
                            onClick={() => setMobileOperator('mtn')}
                            className={`p-3 rounded-xl border-2 font-medium transition-all ${
                              mobileOperator === 'mtn'
                                ? 'border-yellow-500 bg-yellow-100 text-yellow-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            MTN Mobile Money
                          </button>
                        </div>
                      </div>

                      {/* Numéro de téléphone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Numéro de téléphone
                        </label>
                        <input
                          type="tel"
                          value={mobilePhone}
                          onChange={(e) => setMobilePhone(e.target.value)}
                          placeholder="6XXXXXXXX ou +237 6XXXXXXXX"
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                            mobilePhone && validateMobilePhone(mobilePhone)
                              ? 'border-green-300 focus:border-green-500'
                              : mobilePhone && !validateMobilePhone(mobilePhone)
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-gray-300 focus:border-orange-500'
                          }`}
                        />
                        {mobilePhone && !validateMobilePhone(mobilePhone) && (
                          <p className="text-red-600 text-sm mt-1">
                            Format invalide. Utilisez 6XXXXXXXX ou +237 6XXXXXXXX
                          </p>
                        )}
                      </div>

                      <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                        <p className="text-sm text-blue-700">
                          <strong>Note :</strong> Vous recevrez un SMS de confirmation pour valider le paiement.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Détails de l'expédition */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <DocumentTextIcon className="w-6 h-6 text-orange-600" />
                Détails de l'expédition
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Expéditeur</p>
                    <p className="text-lg font-semibold text-gray-900">{allData.senderName}</p>
                    <p className="text-gray-600">{allData.senderPhone}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Départ</p>
                    <p className="text-lg font-semibold text-gray-900">{allData.departurePointName}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Destinataire</p>
                    <p className="text-lg font-semibold text-gray-900">{allData.recipientName}</p>
                    <p className="text-gray-600">{allData.recipientPhone}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Arrivée</p>
                    <p className="text-lg font-semibold text-gray-900">{allData.arrivalPointName}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-xl">
                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                    <span className="text-sm font-medium text-gray-700">{allData.designation}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
                    <span className="text-sm font-medium text-gray-700">{allData.weight} kg</span>
                  </div>
                  {allData.isFragile && (
                    <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-xl">
                      <span className="text-sm font-medium text-red-700">Fragile</span>
                    </div>
                  )}
                  {allData.isInsured && (
                    <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-xl">
                      <ShieldCheckIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Assuré</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sidebar - Résumé de la commande */}
          <motion.div variants={itemVariants} className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-orange-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Résumé de la commande</h3>
              
              <div className="space-y-4 mb-6">
                <SummaryLine label="Coût de base" value={allData.basePrice} />
                <SummaryLine label="Coût du trajet" value={allData.travelPrice} />
                {operatorFee > 0 && (
                  <SummaryLine label="Frais de transaction" value={operatorFee} />
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">TOTAL</span>
                  <div className="text-right">
                    <span className="text-3xl font-black text-orange-600">{totalPrice.toLocaleString()}</span>
                    <span className="text-lg font-semibold text-gray-600 ml-1">FCFA</span>
                  </div>
                </div>
              </div>

              {/* Informations sur la livraison */}
              <div className="bg-orange-50 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <ClockIcon className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-gray-900">Temps de livraison</span>
                </div>
                <p className="text-sm text-gray-600">
                  {allData.logistics === 'express_24h' && 'Livraison en 24h'}
                  {allData.logistics === 'express_48h' && 'Livraison en 48h'}
                  {allData.logistics === 'standard' && 'Livraison standard (3-5 jours)'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Boutons d'action */}
        <motion.div 
          variants={itemVariants} 
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center"
        >
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold transition-colors order-2 sm:order-1"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Retour
          </button>
          
          <button 
            onClick={handleSubmit}
            disabled={isProcessing || !canConfirmPayment()}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all transform hover:scale-105 disabled:scale-100 order-1 sm:order-2"
          >
            {isProcessing ? 'Traitement...' : 'Confirmer l\'expédition'}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Composant PaymentOption modernisé
const PaymentOption = ({ id, label, description, icon: Icon, fee, selected, setSelected, badge }: any) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => setSelected(id)}
    className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all ${
      selected === id 
        ? 'border-orange-500 bg-orange-50 shadow-lg' 
        : 'border-gray-200 bg-white hover:border-orange-200 hover:shadow-md'
    }`}
  >
    {badge && selected === id && (
      <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full">
        {badge}
      </span>
    )}
    
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${
          selected === id 
            ? 'bg-orange-100 text-orange-600' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 text-lg mb-1">{label}</h4>
          <p className="text-gray-600 text-sm mb-2">{description}</p>
          {fee > 0 && (
            <p className="text-orange-600 text-sm font-semibold">
              Frais: +{fee} FCFA
            </p>
          )}
        </div>
      </div>
      
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
        selected === id 
          ? 'border-orange-500 bg-orange-500' 
          : 'border-gray-300'
      }`}>
        {selected === id && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <CheckCircleIcon className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </div>
    </div>
  </motion.div>
);

// Composant SummaryLine modernisé
const SummaryLine = ({ label, value }: { label: string, value: number }) => (
  <div className="flex justify-between items-center py-2">
    <span className="text-gray-600 font-medium">{label}</span>
    <span className="font-bold text-gray-900">{value.toLocaleString()} FCFA</span>
  </div>
);
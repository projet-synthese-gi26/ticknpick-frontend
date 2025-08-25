// WithdrawPackagePage.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  QrCodeIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ArrowUturnLeftIcon,
  TruckIcon,
  UserCircleIcon,
  MapPinIcon as HeroMapPinIcon,
  PhoneIcon as HeroPhoneIcon,
  CubeIcon,
  ScaleIcon,
  ShieldCheckIcon,
  ClockIcon as HeroClockIcon,
  XMarkIcon,
  BellAlertIcon,
  IdentificationIcon,
  PrinterIcon, // PencilIcon as EditIcon was removed
  CalendarDaysIcon,
  CurrencyDollarIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import {
  Package,
  Sparkles,
  AlertTriangle,
  Home,
  CheckCheck,
  Phone,
  MapPin,
  User,
  Clock,
  Search,
  Loader2,
  ArchiveRestore,
  ClipboardSignature,
  FileText,
  CreditCard,
  DollarSign,
  Building,
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../../components/Navbar';
// import DigitalSignature from '../emit-package/Sign'; // Signature component removed
import jsPDF from 'jspdf';
import OriginalQRCode from 'qrcode'; // Renamed to avoid conflict with HeroIcon
import { supabase } from '@/lib/supabase';  
interface PackageInfo {
  trackingNumber: string;
  senderName: string; 
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  departurePointName: string;
  arrivalPointName: string;
  packageDescription: string;
  packageWeight: string;
  isFragile: boolean;
  isPerishable: boolean;
  isInsured: boolean;
  declaredValue?: string;
  status: 'Au départ' | 'En transit' | 'Arrivé au relais' | 'Reçu' | 'Annulé';
  estimatedArrivalDate?: string;
  pickupDate?: string;
  retirantName?: string;
  retirantCni?: string;
  retirantCniDate?: string;
  retirantPhone?: string;
  retirantSignature?: string; // This will now typically be undefined
  isPaid: boolean;
  shippingCost?: string;
  amountPaid?: string;
  changeAmount?: string;
}

interface RetirantInfo {
  name: string;
  cni: string;
  cniDate: string;
  phone: string;
  // signatureDataUrl?: string; // Removed as digital signature is no longer used
}

interface WithdrawPackagePageProps {}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
};

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Pick & Drop Link";

// --- AJOUT IMPORTANT ---
// Définir à nouveau les types de l'inventaire pour garantir la cohérence des données
type ParcelStatus = 'En attente' | 'Reçu' | 'Retiré';
type ParcelType = 'Standard' | 'Express';

interface Parcel {
  id: string;
  status: ParcelStatus;
  type: ParcelType;
  arrivalDate: string;
  withdrawalDate?: string;
  location: string;
  designation: string;
  sender: { name: string; phone: string; company?: string; originAddress: string; };
  recipient: { name: string; phone: string; deliveryAddress: string; };
}
// Utiliser la même clé que dans la page d'inventaire
const INVENTORY_STORAGE_KEY = 'inventory_parcels';
// --- FIN DE L'AJOUT ---

const WithdrawPackagePage: React.FC<WithdrawPackagePageProps> = ({}) => {
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentWithdrawStep, setCurrentWithdrawStep] = useState<'details' | 'payment' | 'recipient' | 'completed'>('details');
  const [retirantInfo, setRetirantInfo] = useState<RetirantInfo>({ name: '', cni: '', cniDate: '', phone: '' });
  const [isConfirmingWithdrawal, setIsConfirmingWithdrawal] = useState(false);
  const [showWithdrawalSuccess, setShowWithdrawalSuccess] = useState(false);
  
  const [amountPaid, setAmountPaid] = useState('');
  const [changeAmount, setChangeAmount] = useState('0');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetPageState = () => {
    setSearchInput(''); setIsLoading(false); setPackageInfo(null); setError(null);
    setCurrentWithdrawStep('details');
    setRetirantInfo({ name: '', cni: '', cniDate: '', phone: '' });
    setIsConfirmingWithdrawal(false); setShowWithdrawalSuccess(false);
    setAmountPaid(''); setChangeAmount('0');
  };

  const decodeQRFromCanvas = (): string | null => {
    if (!videoRef.current || !canvasRef.current || !videoRef.current.videoWidth || !videoRef.current.videoHeight) return null;
    const canvas = canvasRef.current; const context = canvas.getContext('2d', { willReadFrequently: true });
    const video = videoRef.current; if (!context) return null;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (Math.random() > 0.85) return ['WDR001XYZ', 'WDR002PQR', 'PKGOLDDEP', 'PKGOLDTRN', 'PKGOLDREC'][Math.floor(Math.random() * 5)];
    } catch (e) { console.error("Canvas draw error:", e); } return null;
  };

  const startScanInterval = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    scanIntervalRef.current = setInterval(() => {
      if (!isScanning || !streamRef.current) { if (scanIntervalRef.current) clearInterval(scanIntervalRef.current); return; }
      const detectedCode = decodeQRFromCanvas();
      if (detectedCode) {
        setSearchInput(detectedCode.toUpperCase()); handleStopScan(true);
        setTimeout(() => handleSearchPackage(detectedCode.toUpperCase()), 100);
      }
    }, 500);
  };

  const handleScanQRCode = async () => {
    setIsScanning(true); setError(null); setPackageInfo(null); resetWithdrawState();
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 360 }, height: { ideal: 360 } } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream; await videoRef.current.play(); startScanInterval();
        scanTimeoutRef.current = setTimeout(() => {
          if (isScanning && streamRef.current) { handleStopScan(); if (!packageInfo) setError("Aucun QR code détecté après 15 secondes."); }
        }, 15000);
      }
    } catch (err) {
      let msg = "Erreur d'accès à la caméra. ";
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") msg += "Veuillez autoriser l'accès à la caméra.";
        else if (err.name === "NotFoundError") msg += "Aucune caméra compatible n'a été trouvée."; else msg += "Détail: " + err.message;
      } setError(msg); setIsScanning(false);
    }
  };

  const handleStopScan = (codeFound = false) => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current); scanIntervalRef.current = null;
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current); scanTimeoutRef.current = null;
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; if (videoRef.current) videoRef.current.srcObject = null; }
    if (!codeFound) setIsScanning(false);
  };

  useEffect(() => () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
  }, []);

  const resetWithdrawState = () => {
    setCurrentWithdrawStep('details');
    setRetirantInfo({ name: '', cni: '', cniDate: '', phone: '' });
    setIsConfirmingWithdrawal(false); setShowWithdrawalSuccess(false);
    setAmountPaid(''); setChangeAmount('0');
  };

const handleSearchPackage = async (value?: string) => {
    const query = (value || searchInput).trim().toUpperCase();
    if (!query) {
      setError('Veuillez entrer un numéro de suivi.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPackageInfo(null);
    resetWithdrawState();
    if (value && searchInput !== value) setSearchInput(value);
    
    try {
        // ---- Début de la logique Supabase ----
        const { data: shipment, error: dbError } = await supabase
            .from('Shipment')
            .select(`
                *,
                departurePoint:departurePointId(id, name),
                arrivalPoint:arrivalPointId(id, name),
                WithdrawalLog(*)
            `)
            .eq('trackingNumber', query)
            .single(); // Attendre un seul résultat
            
        if (dbError || !shipment) {
            // Utiliser le message de l'erreur ou un message par défaut
            throw new Error(dbError?.message.includes("0 rows") ? "Colis non trouvé." : dbError?.message);
        }
        // ---- Fin de la logique Supabase ----

        // On transforme les données de Supabase en un format que votre UI comprend (PackageInfo)
        const statusMap: Record<string, PackageInfo['status']> = {
            'EN_ATTENTE_DE_DEPOT': 'Au départ',
            'AU_DEPART': 'Au départ',
            'EN_TRANSIT': 'En transit',
            'ARRIVE_AU_RELAIS': 'Arrivé au relais',
            'RECU': 'Reçu',
            'ANNULE': 'Annulé', // Ajoutez les statuts manquants si nécessaire
        };

        const formattedPackage: PackageInfo = {
            trackingNumber: shipment.trackingNumber,
            senderName: shipment.senderName,
            senderPhone: shipment.senderPhone,
            recipientName: shipment.recipientName,
            recipientPhone: shipment.recipientPhone,
            departurePointName: (shipment.departurePoint as any).name || 'Inconnu', // `as any` est un contournement, un type correct serait mieux
            arrivalPointName: (shipment.arrivalPoint as any).name || 'Inconnu',
            packageDescription: shipment.description,
            packageWeight: String(shipment.weight),
            isFragile: shipment.isFragile,
            isPerishable: shipment.isPerishable,
            isInsured: shipment.isInsured,
            declaredValue: String(shipment.declaredValue || ''),
            status: statusMap[shipment.status],
            isPaid: shipment.isPaidAtDeparture || shipment.status === 'RECU',
            shippingCost: String(shipment.shippingCost),
            // Infos du retrait si déjà fait
            pickupDate: shipment.WithdrawalLog ? new Date(shipment.WithdrawalLog.created_at).toLocaleString('fr-CM') : undefined,
            retirantName: shipment.WithdrawalLog?.retirantName,
        };

        setPackageInfo(formattedPackage);
        
    } catch (err: any) {
        setError(`Erreur de recherche pour "${query}": ${err.message}`);
    } finally {
        setIsLoading(false);
    }
};

    // --- NOUVELLE LOGIQUE AU CHARGEMENT ---
  // Ce useEffect s'exécute une seule fois pour vérifier l'instruction de redirection.
  useEffect(() => {
    const withdrawalInstructionJSON = localStorage.getItem('redirect_to_withdrawal');
    if (withdrawalInstructionJSON) {
      try {
        const { packageId } = JSON.parse(withdrawalInstructionJSON);
        if (packageId) {
          // Remplir la barre de recherche
          setSearchInput(packageId);
          // Lancer la recherche automatiquement
          handleSearchPackage(packageId);
          // Nettoyer l'instruction pour éviter qu'elle ne se ré-exécute
          localStorage.removeItem('redirect_to_withdrawal');
        }
      } catch (e) {
        console.error("Erreur de parsing de l'instruction de retrait:", e);
        localStorage.removeItem('redirect_to_withdrawal'); // Nettoyer en cas d'erreur
      }
    }
  }, []); // Tableau vide pour ne l'exécuter qu'une seule fois au montage


  useEffect(() => {
    if (packageInfo && !packageInfo.isPaid && packageInfo.shippingCost && amountPaid) {
      const cost = parseFloat(packageInfo.shippingCost);
      const paid = parseFloat(amountPaid);
      if (!isNaN(cost) && !isNaN(paid)) {
        const change = paid - cost;
        setChangeAmount(change >= 0 ? change.toFixed(0) : '0');
      } else {
        setChangeAmount('0');
      }
    }
  }, [amountPaid, packageInfo]);

  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setAmountPaid(value);
    }
  };

  const proceedToRecipientInfo = () => {
    if (packageInfo && !packageInfo.isPaid && packageInfo.shippingCost) {
      const cost = parseFloat(packageInfo.shippingCost);
      const paid = parseFloat(amountPaid);
      if (isNaN(paid) || paid < cost) {
        setError(`Le montant payé (${paid || 0} FCFA) est insuffisant. Coût de livraison requis: ${cost} FCFA.`);
        return;
      }
    }
    setError(null);
    setCurrentWithdrawStep('recipient');
  };

  const handleRetirantInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRetirantInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const proceedToConfirmation = () => { // Renamed from proceedToSignature
    if (!retirantInfo.name.trim() || !retirantInfo.cni.trim() || !retirantInfo.cniDate.trim() || !retirantInfo.phone.trim()) {
      setError("Tous les champs d'information du retirant sont obligatoires."); return;
    }
    if (!/^(?:\+237)?(6|2)(?:[235-9]\d{7})$/.test(retirantInfo.phone.replace(/\s/g, ''))) {
        setError("Format du numéro de téléphone invalide pour le Cameroun."); return;
    }
    setError(null);
    handleConfirmWithdrawal(); // Call confirmation directly, no separate signature step
  };

  const generateWithdrawalPDF = async (pkgInfo: PackageInfo, currentRetirantInfo: RetirantInfo) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = 20;
      const greenColor = [34, 139, 34];

      const addSectionTitle = (title: string) => {
        pdf.setFontSize(14); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
        pdf.text(title, margin, yPosition); yPosition += 8;
        pdf.setFont('helvetica', 'normal'); pdf.setTextColor(0, 0, 0);
      };
      const addField = (label: string, value: string | undefined | null, options?: {boldLabel?: boolean, boldValue?: boolean, isCurrency?: boolean, fullWidth?: boolean}) => {
          if (value === undefined || value === null || String(value).trim() === '') return;
          const labelX = margin; const valueX = options?.fullWidth ? margin : margin + 45;
          const maxWidth = options?.fullWidth ? pageWidth - 2 * margin : pageWidth - margin - valueX;
          pdf.setFontSize(9); pdf.setFont('helvetica', options?.boldLabel ? 'bold' : 'normal'); pdf.text(label, labelX, yPosition);
          pdf.setFont('helvetica', options?.boldValue ? 'bold' : 'normal');
          let displayValue = String(value);
          if (options?.isCurrency && pkgInfo.shippingCost) displayValue += ' FCFA';
          const splitValue = pdf.splitTextToSize(displayValue, maxWidth);
          pdf.text(splitValue, valueX, yPosition); yPosition += (splitValue.length * 4) + 2;
      };
      const drawLine = (yOffset = 0) => {
        pdf.setLineWidth(0.3); pdf.setDrawColor(150, 150, 150);
        pdf.line(margin, yPosition + yOffset, pageWidth - margin, yPosition + yOffset);
        yPosition += (yOffset > 0 ? yOffset : 2) + 3;
      };

      pdf.setFontSize(22); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
      pdf.text(APP_NAME, margin, yPosition - 5);
      pdf.setFontSize(9); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(80, 80, 80);
      pdf.text('Votre solution de retrait de colis simplifiée.', margin, yPosition);
      const qrDataURL = await OriginalQRCode.toDataURL(`Retrait Colis ${APP_NAME}: ${pkgInfo.trackingNumber}`, { width: 110, margin: 1, color: { dark: '#000000', light: '#FFFFFF' } });
      const qrCodeWidth = 25; const qrCodeX = (pageWidth - qrCodeWidth) / 2;
      pdf.addImage(qrDataURL, 'PNG', qrCodeX, yPosition - 12, qrCodeWidth, qrCodeWidth);
      pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(0,0,0);
      pdf.text(`Bordereau de Retrait`, pageWidth - margin - 50, yPosition - 5, {align: 'left'});
      pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
      pdf.text(`N°: ${pkgInfo.trackingNumber}`, pageWidth - margin - 50, yPosition, {align: 'left'});
      pdf.text(`Date: ${new Date().toLocaleDateString('fr-CM', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth - margin - 50, yPosition + 5, {align: 'left'});
      yPosition += qrCodeWidth - 5; drawLine(2);

      addSectionTitle('Retiré Par');
      addField('Nom Complet:', currentRetirantInfo.name, {boldValue: true});
      addField('N° CNI/Passeport:', currentRetirantInfo.cni);
      if (currentRetirantInfo.cniDate) {
        try { addField('Délivré(e) le:', new Date(currentRetirantInfo.cniDate).toLocaleDateString('fr-CM', { year: 'numeric', month: 'long', day: 'numeric' }));
        } catch (e) { addField('Délivré(e) le:', currentRetirantInfo.cniDate); }
      }
      addField('Téléphone:', currentRetirantInfo.phone); drawLine();

      addSectionTitle('Destinataire Initial du Colis');
      addField('Nom Complet:', pkgInfo.recipientName);
      addField('Téléphone:', pkgInfo.recipientPhone); drawLine();

      addSectionTitle('Détails du Colis');
      addField('Description:', pkgInfo.packageDescription, {fullWidth: true});
      addField('Point de Retrait:', pkgInfo.arrivalPointName);
      let characteristics = [];
      if (pkgInfo.isFragile) characteristics.push("Fragile");
      if (pkgInfo.isPerishable) characteristics.push("Périssable");
      if (pkgInfo.isInsured) characteristics.push("Assuré" + (pkgInfo.declaredValue ? ` (Valeur déclarée: ${pkgInfo.declaredValue} FCFA)` : ''));
      if (characteristics.length > 0) addField('Caractéristiques:', characteristics.join(', '));
      addField('Poids Estimé:', `${pkgInfo.packageWeight} kg`); drawLine();

      addSectionTitle('Statut du Paiement');
      if (pkgInfo.isPaid && !pkgInfo.amountPaid && pkgInfo.shippingCost) {
        addField('Statut:', 'PAYÉ PAR L\'EXPÉDITEUR', {boldValue: true});
        addField('Coût initial livraison:', pkgInfo.shippingCost, {isCurrency: true});
      } else if (pkgInfo.isPaid && !pkgInfo.shippingCost) {
         addField('Statut:', 'PAYÉ PAR L\'EXPÉDITEUR', {boldValue: true});
      } else if (pkgInfo.isPaid && pkgInfo.amountPaid) {
        addField('Statut:', 'PAYÉ AU RETRAIT', {boldValue: true});
        addField('Coût Livraison:', pkgInfo.shippingCost, {isCurrency: true});
        addField('Montant Perçu:', pkgInfo.amountPaid, {isCurrency: true});
        addField('Monnaie Rendue:', pkgInfo.changeAmount, {isCurrency: true});
      } else {
         addField('Statut:', 'ERREUR - Statut de paiement non clair.', {boldValue: true});
      }
      drawLine();
      
      yPosition += 5; addSectionTitle('Conditions de Retrait');
      pdf.setFontSize(8); pdf.setFont('helvetica', 'italic');
      const conditions = `Le signataire confirme avoir reçu le colis décrit ci-dessus en bon état apparent, après vérification de son identité. Le retrait vaut acceptation du colis en l'état. ${APP_NAME} vous remercie de votre confiance.`;
      const splitConditions = pdf.splitTextToSize(conditions, pageWidth - 2 * margin);
      pdf.text(splitConditions, margin, yPosition); yPosition += splitConditions.length * 3.5 + 10;

      const signatureBlockY = Math.max(yPosition, pageHeight - margin - 55); yPosition = signatureBlockY;
      pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
      const sigRetirantX = margin; const sigAgenceX = pageWidth / 2 + 10;
      pdf.text('Signature du Retirant:', sigRetirantX, yPosition);
      // Since digital signature is removed, always draw a line for manual signature.
      // RetirantInfo type no longer includes signatureDataUrl.
      pdf.line(sigRetirantX, yPosition + 23, sigRetirantX + 60, yPosition + 23);
      
      pdf.text('Cachet & Signature Agence:', sigAgenceX, yPosition);
      pdf.line(sigAgenceX, yPosition + 23, sigAgenceX + 60, yPosition + 23);

      pdf.setFontSize(8); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(100, 100, 100);
      const footerText = `Document généré le ${new Date().toLocaleString('fr-CM')} par ${APP_NAME}.`;
      const footerTextWidth = pdf.getTextWidth(footerText);
      pdf.text(footerText, (pageWidth - footerTextWidth) / 2, pageHeight - margin + 5);

      pdf.save(`Bordereau_Retrait_${pkgInfo.trackingNumber}_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error('Erreur détaillée lors de la génération du PDF de retrait:', error);
      setError("Une erreur est survenue lors de la génération du bordereau PDF. Veuillez réessayer ou contacter le support.");
    }
  };


const handleConfirmWithdrawal = async () => {
    if (!packageInfo) return;
    setIsConfirmingWithdrawal(true);
    setError(null);

    const finalRetirantInfo = { ...retirantInfo };

    try {
        // ---- Début de la logique Supabase ----
        // Supabase gère automatiquement les transactions dans les fonctions RPC
        // C'est pourquoi nous avons créé la fonction `handle_package_withdrawal`
        
        const { error } = await supabase.rpc('handle_package_withdrawal', {
            p_tracking_number: packageInfo.trackingNumber,
            p_retirant_name: finalRetirantInfo.name,
            p_retirant_cni: finalRetirantInfo.cni,
            p_retirant_cni_date: finalRetirantInfo.cniDate, // format "YYYY-MM-DD"
            p_retirant_phone: finalRetirantInfo.phone,
            p_amount_paid: amountPaid ? parseFloat(amountPaid) : null,
            p_change_amount: changeAmount ? parseFloat(changeAmount) : null
        });

        if (error) {
            console.error("Erreur RPC Supabase:", error);
            throw new Error(`Erreur technique : ${error.message}`);
        }
        // ---- Fin de la logique Supabase ----

        const updatedPackageInfo: PackageInfo = {
          ...packageInfo, 
          status: 'Reçu',
          pickupDate: new Date().toLocaleString('fr-CM'),
          retirantName: finalRetirantInfo.name,
          retirantCni: finalRetirantInfo.cni,
          retirantCniDate: finalRetirantInfo.cniDate,
          retirantPhone: finalRetirantInfo.phone,
          isPaid: true,
          amountPaid: amountPaid || packageInfo.amountPaid,
          changeAmount: changeAmount || packageInfo.changeAmount,
        };
        
        setPackageInfo(updatedPackageInfo);
        
        // La logique de génération de PDF et de succès reste la même
        await generateWithdrawalPDF(updatedPackageInfo, finalRetirantInfo);
        setShowWithdrawalSuccess(true);
        setCurrentWithdrawStep('completed');
    } catch (err: any) {
        setError(err.message || "Une erreur inconnue est survenue.");
    } finally {
        setIsConfirmingWithdrawal(false);
    }
};

  const getStatusColorClasses = (status: PackageInfo['status']) => {
    switch (status) {
      case 'Au départ': return 'bg-gradient-to-r from-amber-400 to-orange-500 text-white';
      case 'En transit': return 'bg-gradient-to-r from-sky-500 to-blue-600 text-white';
      case 'Arrivé au relais': return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white';
      case 'Reçu': return 'bg-gradient-to-r from-teal-600 to-green-700 text-white';
      default: return 'bg-gradient-to-r from-slate-500 to-gray-600 text-white';
    }
  };
  
  const getStatusBorderClasses = (status: PackageInfo['status']) => {
    switch (status) {
        case 'Au départ': return 'border-orange-400';
        case 'En transit': return 'border-sky-400';
        case 'Arrivé au relais': return 'border-green-400';
        case 'Reçu': return 'border-teal-400';
        default: return 'border-slate-300';
    }
  };

  const getStatusIcon = (status: PackageInfo['status']) => {
    switch (status) {
      case 'Au départ': return <Package className="w-7 h-7" />;
      case 'En transit': return <TruckIcon className="w-7 h-7" />;
      case 'Arrivé au relais': return <CheckCircleIcon className="w-7 h-7" />;
      case 'Reçu': return <ClipboardSignature className="w-7 h-7" />;
      default: return <Package className="w-7 h-7" />;
    }
  };

return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800 p-0 font-sans relative overflow-hidden">
      <Navbar />
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-green-200/30 to-emerald-300/20 rounded-full blur-3xl"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 3, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="absolute top-1/3 -left-32 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-sky-300/15 rounded-full blur-3xl"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 2.5, delay: 1, repeat: Infinity, repeatType: "reverse" }}
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-purple-200/20 to-pink-300/15 rounded-full blur-3xl"
        />
        
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-20 text-green-300/30"
        >
          <Package className="w-12 h-12" />
        </motion.div>
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 3.5, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-32 left-32 text-blue-300/30"
        >
          <TruckIcon className="w-10 h-10" />
        </motion.div>
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 right-12 text-emerald-300/25"
        >
          <Sparkles className="w-8 h-8" />
        </motion.div>
      </div>

      <div className="fixed top-0 left-0 w-[35%] xl:w-[32%] h-full hidden lg:block z-10 pointer-events-none">
        <div className="relative w-full h-full">
          <Image 
            src="/images/image4.jpg" 
            alt="Illustration service de colis" 
            layout="fill" 
            objectFit="cover" 
            className="opacity-80" 
            priority 
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
            animate={{ opacity: 1, scale: 1, rotate: 360 }}
            transition={{ delay: 0.5, duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="absolute top-[20%] left-[15%] w-16 h-16 bg-green-400/20 rounded-full blur-xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
            className="absolute bottom-[25%] left-[25%] w-20 h-20 bg-emerald-500/15 rounded-full blur-2xl"
          />
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="absolute top-[60%] left-[10%] w-12 h-12 bg-blue-400/25 rounded-full blur-lg"
          />
          
          <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-green-500/80 rounded-full flex items-center justify-center">
                <ClipboardSignature className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-black font-semibold text-sm">Retrait Sécurisé</h3>
                <p className="text-gray-900 text-xs">Processus simplifié et rapide</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                  className="w-2 h-2 bg-green-400 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.main
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-4xl mx-auto lg:ml-[calc(35%+3rem)] xl:ml-[calc(32%+3rem)] lg:mr-8 px-4 sm:px-6 py-12 lg:py-16 relative z-20"
      >
        <div className="mb-8 text-center lg:text-left">
          <Link href="/PickDropPoint/app/home" legacyBehavior>
            <a className="inline-flex items-center text-green-600 hover:text-green-700 transition-all duration-300 text-sm font-medium group mb-4 hover:scale-105">
              <motion.div
                whileHover={{ x: -3 }}
                className="flex items-center"
              >
                <ArrowUturnLeftIcon className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
                Retour à l'accueil
              </motion.div>
            </a>
          </Link>
          
          <div className="flex flex-col items-center lg:items-start">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }} 
              animate={{ scale: 1, rotate: 0 }} 
              transition={{ type: 'spring', stiffness: 260, damping: 15, delay: 0.1 }}
              className="relative mb-4"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-2xl shadow-green-500/25">
                <ClipboardSignature className="w-9 h-9 text-white" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center"
              >
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </motion.div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-2"
            >
              Processus de Retrait
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-slate-600 text-base max-w-md lg:max-w-2xl leading-relaxed"
            >
              Guidez le client pour retirer son colis avec notre système intuitif et sécurisé.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center space-x-2 mt-5"
            >
              {[
                { icon: Search, label: "Recherche", active: !packageInfo },
                { icon: CreditCard, label: "Paiement", active: packageInfo && currentWithdrawStep === 'payment' },
                { icon: User, label: "Identification", active: packageInfo && currentWithdrawStep === 'recipient' },
                { icon: CheckCheck, label: "Finalisation", active: packageInfo && currentWithdrawStep === 'completed' }
              ].map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    step.active 
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    <step.icon className="w-3.5 h-3.5" />
                  </div>
                  {index < 3 && (
                    <div className={`w-6 h-0.5 transition-colors duration-300 ${
                      step.active ? 'bg-green-500' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!packageInfo && !isScanning && (
            <motion.section 
              key="search-scan" 
              variants={cardVariants} 
              initial="hidden" 
              animate="visible" 
              exit="exit"
              className="relative bg-white/70 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-white/50 mb-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-blue-50/30 rounded-2xl" />
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-green-200/20 to-transparent rounded-full -translate-y-12 translate-x-12" />
              
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
                  >
                    <Search className="w-7 h-7 text-white" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">Identifier le Colis</h2>
                  <p className="text-slate-500 text-sm">Utilisez le numéro de suivi ou scannez le QR code</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch gap-3">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        value={searchInput} 
                        onChange={(e) => setSearchInput(e.target.value.toUpperCase())} 
                        placeholder="Numéro de suivi"
                        className="w-full pl-10 pr-3 py-3 border-2 border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base bg-white/80 transition-all hover:border-slate-300"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchPackage()} 
                      />
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -1 }} 
                      whileTap={{ scale: 0.98 }} 
                      onClick={() => handleSearchPackage()} 
                      disabled={isLoading || !searchInput.trim()}
                      className="flex items-center justify-center bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md disabled:opacity-60 transition-all hover:shadow-lg"
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
                  className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <QrCodeIcon className="w-7 h-7 text-white" />
                </motion.div>
                
                <h2 className="text-xl font-bold text-slate-800 mb-4">Scan du QR Code en cours...</h2>
                
                <div className="relative mx-auto w-64 h-64 sm:w-80 sm:h-80 bg-slate-800 rounded-xl overflow-hidden shadow-lg border-2 border-white/20">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className="absolute inset-2 border-2 border-green-400/80 rounded-lg">
                    <motion.div
                      animate={{ y: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-lg shadow-green-400/50"
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

          {packageInfo && currentWithdrawStep === 'details' && (
            <motion.section 
              key="package-details" 
              variants={cardVariants} 
              initial="hidden" 
              animate="visible" 
              exit="exit" 
              className="space-y-6"
            >
              <div className={`relative p-5 rounded-xl shadow-lg border-l-4 ${getStatusColorClasses(packageInfo.status)} ${getStatusBorderClasses(packageInfo.status)} overflow-hidden`}>
                <div className="absolute top-0 right-0 w-28 h-28 opacity-10">
                  {getStatusIcon(packageInfo.status)}
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="p-2.5 bg-white/20 rounded-lg"
                    >
                      {getStatusIcon(packageInfo.status)}
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-bold mb-0.5">Colis {packageInfo.trackingNumber}</h3>
                      <p className="text-xs opacity-90">Statut : {packageInfo.status}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right bg-white/10 p-2.5 rounded-md backdrop-blur-sm text-xs">
                    <p className="opacity-90 mb-0.5">Arrivée Estimée</p>
                    <p className="font-semibold text-sm">{packageInfo.estimatedArrivalDate || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: 'Expéditeur', icon: User, color: 'blue', data: [ { label: 'Nom', value: packageInfo.senderName }, { label: 'Tél', value: packageInfo.senderPhone }, { label: 'Dépôt', value: packageInfo.departurePointName }] },
                  { title: 'Destinataire', icon: UserCircleIcon, color: 'green', data: [ { label: 'Nom', value: packageInfo.recipientName }, { label: 'Tél', value: packageInfo.recipientPhone }, { label: 'Retrait', value: packageInfo.arrivalPointName }] },
                  { 
                    title: 'Détails du Colis', icon: CubeIcon, color: 'purple',
                    data: [ { label: 'Description', value: packageInfo.packageDescription }, { label: 'Poids', value: `${packageInfo.packageWeight} kg` } ], 
                    tags: [ packageInfo.isFragile && { text: 'Fragile', bg: 'bg-orange-100', tc: 'text-orange-800'}, packageInfo.isPerishable && { text: 'Périssable', bg: 'bg-red-100', tc: 'text-red-800'}, packageInfo.isInsured && { text: `Assuré (${packageInfo.declaredValue || 'N/A'} FCFA)`, bg: 'bg-blue-100', tc: 'text-blue-800'}, ].filter(Boolean) 
                  },
                  { 
                    title: 'Infos Paiement', icon: CurrencyDollarIcon, color: 'teal',
                    customRender: () => (
                      <div className="space-y-2 text-xs">
                        {packageInfo.status === 'Reçu' ? ( packageInfo.amountPaid ? <div className="space-y-2"><div className="flex items-center text-green-700 font-medium text-sm"><CheckIcon className="w-4 h-4 mr-1.5" />Payé au retrait</div><div className="bg-white/60 p-2 rounded-md space-y-1 text-xs"><p><span className="text-slate-600">Coût:</span> <span className="font-semibold">{packageInfo.shippingCost || 'N/A'} FCFA</span></p><p><span className="text-slate-600">Payé:</span> <span className="font-semibold">{packageInfo.amountPaid} FCFA</span></p><p><span className="text-slate-600">Monnaie:</span> <span className="font-semibold">{packageInfo.changeAmount || '0'} FCFA</span></p></div></div> : <div className="flex items-center text-green-700 font-medium text-sm"><CheckIcon className="w-4 h-4 mr-1.5" />Payé par l'expéditeur</div> ) 
                        : packageInfo.isPaid ? (<div className="flex items-center text-green-700 font-medium text-sm"><CheckIcon className="w-4 h-4 mr-1.5" />Payé par l'expéditeur {packageInfo.shippingCost && <span className="text-slate-500 ml-1.5 text-xs">({packageInfo.shippingCost} FCFA)</span>}</div> ) 
                        : (<div className="space-y-1.5"><p><span className="text-slate-600">Coût Livraison:</span> <span className="font-bold text-red-600 text-base ml-1">{packageInfo.shippingCost} FCFA</span></p><div className="flex items-center text-orange-600 bg-orange-50 p-1.5 rounded-md"><BellAlertIcon className="w-3.5 h-3.5 mr-1.5" /><span className="text-xs font-medium">Paiement requis au retrait</span></div></div>)
                        }
                      </div>
                    )
                  }
                ].map((section, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ y: -2, scale: 1.01 }}
                    className={`relative bg-gradient-to-br from-${section.color}-50 to-${section.color}-100/50 p-4 rounded-xl shadow-md border border-${section.color}-200/80 transition-all duration-300 overflow-hidden`}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 opacity-5 text-${section.color}-500">
                      <section.icon className="w-full h-full" />
                    </div>
                    
                    <div className="relative z-10">
                      <h4 className={`font-bold text-slate-800 mb-3 flex items-center text-base`}>
                        <div className={`w-8 h-8 bg-gradient-to-r from-${section.color}-500 to-${section.color}-600 rounded-lg flex items-center justify-center mr-2.5 shadow-md`}>
                          <section.icon className="w-4 h-4 text-white" />
                        </div>
                        {section.title}
                      </h4>
                      
                      {section.customRender ? section.customRender() : (
                        <div className="space-y-2 text-xs">
                          {section.data?.map(item => (
                            <div key={item.label} className="flex justify-between items-start py-0.5">
                              <span className="text-slate-600 font-medium">{item.label}:</span>
                              <span className="font-semibold text-slate-800 text-right max-w-[65%]">{item.value}</span>
                            </div>
                          ))}
                          
                          {section.tags && section.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {section.tags.map(tag => tag && (
                                <motion.span key={tag.text} whileHover={{ scale: 1.05 }} className={`px-2.5 py-1 ${tag.bg} ${tag.tc} text-xs rounded-full font-medium shadow-sm border`}>{tag.text}</motion.span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {packageInfo.status === 'Arrivé au relais' ? (
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { const isPaymentRequired = !packageInfo.isPaid && packageInfo.shippingCost; setCurrentWithdrawStep(isPaymentRequired ? 'payment' : 'recipient'); setError(null); }}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all flex items-center justify-center text-base group"
                  >
                    <ClipboardSignature className="w-5 h-5 mr-2 group-hover:rotate-6 transition-transform" />
                    Démarrer le Retrait
                    <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="ml-1.5">→</motion.div>
                  </motion.button>
                ) : (
                  <div className={`flex-1 py-3 px-6 rounded-lg text-center font-bold text-base shadow-md ${ packageInfo.status === 'Reçu' ? 'bg-teal-100 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-500 border border-slate-200' }`}>
                    {packageInfo.status === 'Reçu' ? `✅ Déjà retiré le ${packageInfo.pickupDate}` : '⏳ Non disponible pour retrait'}
                  </div>
                )}
                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} 
                  onClick={resetPageState}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center sm:flex-none shadow-md"
                >
                  <ArrowUturnLeftIcon className="w-4 h-4 mr-2" />
                  Nouvelle Recherche
                </motion.button>
              </div>
            </motion.section>
          )}

          {packageInfo && currentWithdrawStep === 'payment' && !packageInfo.isPaid && packageInfo.shippingCost && (
            <motion.section 
              key="payment" 
              variants={cardVariants} 
              initial="hidden" 
              animate="visible" 
              exit="exit"
              className="relative bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-white/50"
            >
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Étape 1: Paiement</h2>
                    <p className="text-slate-500 text-sm">Collectez le paiement du client</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <motion.div 
                    initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                    className="bg-blue-500 p-4 rounded-xl text-center text-white shadow-md"
                  >
                    <p className="text-blue-100 text-xs mb-1">Montant à payer :</p>
                    <motion.p 
                      animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
                      className="font-bold text-2xl"
                    >
                      {packageInfo.shippingCost} FCFA
                    </motion.p>
                  </motion.div>
                  
                  <div>
                    <label htmlFor="amountPaidInput" className="block text-sm font-semibold text-slate-700 mb-2">
                      Montant payé par le client (FCFA)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        id="amountPaidInput" type="text" inputMode="numeric" value={amountPaid} onChange={handleAmountPaidChange} 
                        placeholder="Ex: 2500"
                        className="w-full pl-10 pr-3 py-3 border-2 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-bold bg-white"
                      />
                    </div>
                  </div>
                  
                  {amountPaid && parseFloat(amountPaid) >= parseFloat(packageInfo.shippingCost || '0') && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-green-500 p-4 rounded-xl text-center text-white shadow-md"
                    >
                      <p className="text-green-100 text-xs mb-1">Monnaie à rendre :</p>
                      <motion.p 
                        animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                        className="font-bold text-xl"
                      >
                        {changeAmount} FCFA
                      </motion.p>
                    </motion.div>
                  )}
                  
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
                      className="p-3 bg-red-50 border-l-4 border-red-400 rounded-lg flex items-start text-red-700 text-sm shadow-sm"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="flex-1">{error}</span>
                    </motion.div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} 
                      onClick={proceedToRecipientInfo}
                      disabled={!amountPaid || parseFloat(amountPaid) < parseFloat(packageInfo.shippingCost || '0')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg disabled:opacity-50 flex items-center justify-center"
                    >
                      <CheckIcon className="w-5 h-5 mr-2" />
                      Valider et Continuer
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} 
                      onClick={() => setCurrentWithdrawStep('details')}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-6 rounded-lg flex items-center justify-center sm:flex-none shadow-md"
                    >
                      <ArrowUturnLeftIcon className="w-4 h-4 mr-2" />
                      Retour
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {packageInfo && currentWithdrawStep === 'recipient' && (
            <motion.section 
              key="recipient-info" 
              variants={cardVariants} 
              initial="hidden" 
              animate="visible" 
              exit="exit"
              className="relative bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-white/50"
            >
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                    <IdentificationIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      Étape {packageInfo.isPaid && !packageInfo.shippingCost ? '1' : '2'}: Infos Retirant
                    </h2>
                    <p className="text-slate-500 text-sm">Vérification d'identité</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { label: "Nom complet du retirant", name: "name", type: "text", placeholder: "Ex: Jean Dupont", icon: User },
                    { label: "Numéro CNI/Passeport", name: "cni", type: "text", placeholder: "Ex: 123456789CE", icon: IdentificationIcon },
                    { label: "Date de délivrance (CNI/Passeport)", name: "cniDate", type: "date", icon: CalendarDaysIcon },
                    { label: "Numéro de téléphone du retirant", name: "phone", type: "tel", placeholder: "Ex: +237 6XXXXXXXX", icon: HeroPhoneIcon },
                  ].map(field => (
                    <motion.div key={field.name} whileHover={{ scale: 1.01 }} className="relative">
                      <label htmlFor={field.name} className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                        <field.icon className="w-4 h-4 mr-1.5 text-blue-600" />
                        {field.label}
                      </label>
                      <input 
                        id={field.name} type={field.type} name={field.name} 
                        value={retirantInfo[field.name as keyof RetirantInfo] || ''}
                        onChange={handleRetirantInfoChange} 
                        placeholder={field.placeholder}
                        className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-base"
                      />
                    </motion.div>
                  ))}
                  
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
                      className="p-3 bg-red-50 border-l-4 border-red-400 rounded-lg flex items-start text-red-700 text-sm shadow-sm"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="flex-1">{error}</span>
                    </motion.div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} 
                      onClick={proceedToConfirmation}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center"
                    >
                      <PrinterIcon className="w-5 h-5 mr-2" />
                      Confirmer et Générer Bordereau
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentWithdrawStep(packageInfo.isPaid && !packageInfo.shippingCost ? 'details' : 'payment')}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-6 rounded-lg flex items-center justify-center sm:flex-none shadow-md"
                    >
                      <ArrowUturnLeftIcon className="w-4 h-4 mr-2" />
                      Retour
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {showWithdrawalSuccess && currentWithdrawStep === 'completed' && packageInfo && (
            <motion.section 
              key="success" variants={cardVariants} initial="hidden" animate="visible" exit="exit" 
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
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent mb-3"
                  >
                    Retrait Finalisé !
                  </motion.h2>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="space-y-2 mb-6"
                  >
                    <p className="text-slate-700 text-base">
                      Le colis <strong className="text-green-700">{packageInfo.trackingNumber}</strong> a été retiré par <strong className="text-green-700">{retirantInfo.name}</strong>.
                    </p>
                    <div className="flex items-center justify-center text-slate-600 text-sm">
                      <Building className="w-4 h-4 mr-1.5 text-slate-500" />
                      Point de retrait: {packageInfo.arrivalPointName}
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                    className="bg-white/80 p-4 rounded-xl border border-green-200 mb-6 shadow-md"
                  >
                    <div className="flex items-center justify-center mb-2">
                      <PrinterIcon className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-bold text-base">Bordereau Téléchargé</span>
                    </div>
                    <p className="text-slate-600 text-sm">Le document PDF a été généré. Veuillez le vérifier dans vos téléchargements.</p>
                  </motion.div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} 
                    onClick={resetPageState}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-xl inline-flex items-center text-base group"
                  >
                    <ArchiveRestore className="w-5 h-5 mr-2 group-hover:rotate-6 transition-transform" />
                    Nouveau Retrait
                    <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="ml-1.5">→</motion.div>
                  </motion.button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {isConfirmingWithdrawal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="relative bg-white p-6 rounded-2xl shadow-xl max-w-xs w-full text-center"
            >
              <div className="relative z-10">
                <motion.div
                  animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md"
                >
                  <Loader2 className="w-7 h-7 text-white" />
                </motion.div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-2">Finalisation...</h3>
                <p className="text-slate-600 text-sm">
                  Génération du bordereau de retrait en cours.
                </p>
                
                <div className="flex justify-center mt-4 space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                      className="w-1.5 h-1.5 bg-green-500 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.main>
    </div>
  );
};

export default WithdrawPackagePage;
'use client';

import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import OriginalQRCode from 'qrcode';
import SignatureCanvas from 'react-signature-canvas';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  IdentificationIcon,
  ArrowLeftIcon,
  BanknotesIcon,
  PencilIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircle as SolidCheckCircleIcon, // Correction probable: CheckCircleIcon -> CheckCircle dans Lucide standard
  AlertTriangle as ExclamationTriangleIcon, // CORRECTION ICI : On utilise AlertTriangle aliasé
  ArchiveRestore as ArchiveIcon,
  Loader2,
  Package,
  // AlertTriangleIcon // Retiré car doublon potentiel
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { relayPointService } from '@/services/relayPointService';
import { packageService } from '@/services/packageService';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "TiiBnTick Link";

// --- INTERFACES ---

interface PackageInfo {
    id: string;
    trackingNumber: string;
    senderName: string; 
    senderPhone: string;
    recipientName: string; 
    recipientPhone: string;
    description: string; 
    weight: string;
    isFragile: boolean; 
    isInsured: boolean;
    status: string;
    is_paid_at_departure: boolean;
    shippingCost: number;
    departurePointName?: string;
    arrivalPointName?: string;
    retirantInfo?: {
      name: string; phone: string; cni: string; date: string;
    };
    packageDescription: string;
}

interface RetirantInfo { 
    name: string; 
    cni: string; 
    cniDate: string; 
    phone: string; 
    signature: string | null; 
}

interface WithdrawPackageProps {
  onClose: () => void;
  onSuccess: () => void;
}

// --- COMPOSANT PRINCIPAL ---

export const WithdrawPackagePage = ({ onClose, onSuccess }: WithdrawPackageProps) => {
  const { user: authUser } = useAuth();

  // --- STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'SEARCH' | 'DETAILS' | 'FORM' | 'SUCCESS'>('SEARCH');
  
  const [retirantInfo, setRetirantInfo] = useState<RetirantInfo>({ name: '', cni: '', cniDate: '', phone: '', signature: null });
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Paiement au guichet (si pas payé)
  const [amountPaid, setAmountPaid] = useState('');
  const [changeAmount, setChangeAmount] = useState('0');
  const [myRelayId, setMyRelayId] = useState<string | null>(null);

  const sigCanvasRef = useRef<SignatureCanvas>(null);


  // 0. FONCTION DE RESET
  const resetState = () => {
    setSearchQuery('');
    setPackageInfo(null);
    setError(null);
    setCurrentStep('SEARCH');
    setRetirantInfo({ name: '', cni: '', cniDate: '', phone: '', signature: null });
    setAmountPaid('');
    setChangeAmount('0');
  };

  // 1. CHARGEMENT POINT RELAIS & AUTO-FILL
  useEffect(() => {
      const init = async () => {
          if (!authUser) return;
          try {
               const points: any[] = await relayPointService.getAllRelayPoints(); 
               const myPoint = points.find((p: any) => String(p.ownerId) === String(authUser.id));

               if (myPoint) {
                   console.log("✅ [Retrait] Relais actif:", myPoint.relayPointName);
                   setMyRelayId(myPoint.id);

                   // Check Auto-load (depuis Inventaire)
                   const prefill = localStorage.getItem('prefill_package_id');
                   if(prefill) {
                       console.log("⚡ Auto-search Retrait:", prefill);
                       localStorage.removeItem('prefill_package_id');
                       setSearchQuery(prefill);
                       handleSearchPackage(prefill);
                   }
               } else {
                   setError("Aucun Point Relais associé. Impossible de procéder au retrait.");
               }
          } catch(e) { console.error(e); }
      };
      init();
  }, [authUser]);


  // 2. CALCUL MONNAIE (Pour paiement sur place)
  useEffect(() => {
    if (!packageInfo || packageInfo.is_paid_at_departure || !amountPaid) return;
    const cost = packageInfo.shippingCost;
    const paid = parseFloat(amountPaid);
    const change = paid > cost ? paid - cost : 0;
    setChangeAmount(change.toFixed(0));
  }, [amountPaid, packageInfo]);


  // 3. RECHERCHE COLIS
  const handleSearchPackage = async (forceQuery?: string) => {
    const query = (forceQuery || searchQuery).trim().toUpperCase();
    if (!query) return;

    setIsLoading(true); setError(null); setPackageInfo(null);
    
    try {
        console.log(`🔍 [Retrait] Recherche: ${query}`);
        const response = await packageService.trackPackage(query);
        const shipment = (response as any).package || response;
        
        if (!shipment || (!shipment.trackingNumber && !shipment.tracking_number)) {
             throw new Error("Colis introuvable.");
        }

        const status = (shipment.status || shipment.currentStatus || '').toUpperCase();
        
        // STATUTS AUTORISÉS POUR RETRAIT
        // ARRIVE_AU_RELAIS, AT_ARRIVAL_RELAY_POINT, STOCK
        const allowed = ['ARRIVE', 'ARRIVAL', 'STOCK', 'RELAY_POINT'];
        const isAvailable = allowed.some(s => status.includes(s));

        // Si déjà retiré -> on affiche juste l'info mais on bloque le processus
        const isWithdrawn = ['RECU', 'WITHDRAWN', 'DELIVERED', 'LIVRE'].some(s => status.includes(s));

        if (!isAvailable && !isWithdrawn) {
             // Colis en transit ou pas encore là
             throw new Error(`Ce colis est statut "${status}". Il n'est pas encore disponible pour retrait.`);
        }

        // Mapping
        const info: PackageInfo = {
            id: String(shipment.id || shipment.packageId),
            trackingNumber: shipment.trackingNumber || shipment.tracking_number,
            senderName: shipment.senderName || "Inconnu",
            senderPhone: shipment.senderPhone || "",
            recipientName: shipment.recipientName || "Inconnu",
            recipientPhone: shipment.recipientPhone || "",
            departurePointName: shipment.pickupAddress || shipment.departurePointName || "",
            arrivalPointName: shipment.deliveryAddress || shipment.arrivalPointName || "",
            packageDescription: shipment.description || "",
            weight: String(shipment.weight || 0),
            description: shipment.description || "", 
            isFragile: shipment.packageType === 'FRAGILE',
            isInsured: (shipment.value && shipment.value > 0),
            status: status as any,
            // Logique Paiement (PAID = true)
            is_paid_at_departure: (shipment.paymentStatus === 'PAID' || shipment.isPaid === true),
            shippingCost: Number(shipment.deliveryFee || shipment.shippingCost || 0),
            retirantInfo: undefined
        };

        setPackageInfo(info);
        
        // Pré-remplir infos retirant (par défaut = destinataire)
        if(isAvailable && !isWithdrawn) {
            setRetirantInfo(prev => ({
                ...prev,
                name: info.recipientName,
                phone: info.recipientPhone
            }));
        }
        
        // Rediriger vers la bonne étape
        if (isWithdrawn) {
             setError("Ce colis a déjà été retiré.");
             // On l'affiche quand même en mode lecture seule
        }
        
        setCurrentStep('DETAILS');

    } catch (err: any) {
        console.error(err);
        setError(err.message || "Erreur lors de la recherche.");
    } finally {
        setIsLoading(false);
    }
  };

  // 4. VALIDATION & ENREGISTREMENT RETRAIT
  const handleConfirmWithdrawal = async () => {
    if (!myRelayId) {
        setError("Erreur système: Point relais non identifié.");
        return;
    }
    if (!packageInfo) return;

    // Validation Formulaire
    if (!retirantInfo.name || !retirantInfo.cni || !retirantInfo.signature) {
         alert("Merci de renseigner le Nom, CNI et Signature du retirant.");
         return;
    }

    // Validation Paiement
    if (!packageInfo.is_paid_at_departure && Number(amountPaid) < packageInfo.shippingCost) {
         alert(`Le paiement est incomplet. Montant dû : ${packageInfo.shippingCost} FCFA.`);
         return;
    }
    
    setIsConfirming(true);
    
    try {
        console.log(`📤 [Retrait] Envoi validation pour ${packageInfo.trackingNumber}...`);
        
        // Endpoint: PUT /api/packages/{id}/deliver
        await packageService.markAsDelivered(packageInfo.id);
        
        // Génération Bordereau PDF
        await generateWithdrawalPDF(packageInfo, retirantInfo);
        
        setCurrentStep('SUCCESS');
        
        // Callback
        setTimeout(() => onSuccess && onSuccess(), 3000);

    } catch (err: any) {
        console.error("Erreur validation:", err);
        setError("Erreur lors de la validation: " + (err.message || "Serveur injoignable"));
    } finally {
        setIsConfirming(false);
    }
  };

  // 5. GÉNÉRATION PDF
  const generateWithdrawalPDF = async (pkgInfo: PackageInfo, retirant: RetirantInfo) => {
    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const margin = 20;
        let y = 20;

        // Header
        pdf.setFontSize(20).setFont('helvetica', 'bold').setTextColor('#D97706').text(APP_NAME, margin, y);
        
        // QR Code
        const qrDataURL = await OriginalQRCode.toDataURL(pkgInfo.trackingNumber, { width: 80, margin: 1 });
        pdf.addImage(qrDataURL, 'PNG', 150, 15, 30, 30);

        y += 10;
        pdf.setFontSize(10).setFont('helvetica', 'normal').setTextColor(0,0,0).text("Bordereau de Retrait Officiel", margin, y);
        
        y += 15;
        pdf.setLineWidth(0.5); pdf.line(margin, y, 190, y);
        y += 10;

        // Détails
        pdf.setFontSize(12).setFont('helvetica', 'bold').text("1. Colis", margin, y);
        y += 7;
        pdf.setFontSize(10).setFont('helvetica', 'normal');
        pdf.text(`N° Suivi : ${pkgInfo.trackingNumber}`, margin, y); y += 6;
        pdf.text(`Contenu : ${pkgInfo.packageDescription}`, margin, y); y += 6;
        pdf.text(`Expéditeur : ${pkgInfo.senderName} (${pkgInfo.senderPhone})`, margin, y); y += 10;

        pdf.setFontSize(12).setFont('helvetica', 'bold').text("2. Retrait", margin, y);
        y += 7;
        pdf.setFontSize(10).setFont('helvetica', 'normal');
        pdf.text(`Nom du Retirant : ${retirant.name}`, margin, y); y += 6;
        pdf.text(`CNI N° : ${retirant.cni} (du ${new Date(retirant.cniDate).toLocaleDateString()})`, margin, y); y += 6;
        pdf.text(`Date Retrait : ${new Date().toLocaleString()}`, margin, y); y += 10;

        // Signature
        if (retirant.signature) {
           pdf.text("Signature du client :", margin, y);
           y += 5;
           pdf.addImage(retirant.signature, 'PNG', margin, y, 60, 25);
        }
        
        pdf.save(`Preuve_Retrait_${pkgInfo.trackingNumber}.pdf`);

    } catch(e) {
        console.error("PDF Error", e);
    }
  };

  // --- RENDER ---

  const renderSearch = () => (
      <div className="max-w-2xl mx-auto mt-10 animate-in slide-in-from-bottom-4">
          <div className="relative group shadow-xl rounded-2xl bg-white dark:bg-slate-800">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-6 w-6 text-gray-400"/>
                </div>
                <input 
                    type="text" 
                    className="w-full pl-14 pr-32 py-4 bg-transparent outline-none text-lg font-bold text-gray-700 dark:text-gray-200 placeholder-gray-400"
                    placeholder="TRACKING NUMBER..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchPackage()}
                    autoFocus
                />
                <button 
                    onClick={() => handleSearchPackage()}
                    disabled={isLoading || !searchQuery.trim()}
                    className="absolute right-2 top-2 bottom-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 rounded-xl transition disabled:opacity-50 flex items-center"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Vérifier"}
                </button>
          </div>
          
          {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded-r-lg flex items-center gap-3">
                   <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0"/>
                   <p className="font-medium">{error}</p>
              </motion.div>
          )}
      </div>
  );

  const renderDetails = () => (
      <div className="grid lg:grid-cols-3 gap-8 mt-6 max-w-6xl mx-auto h-full">
           {/* COLONNE GAUCHE : DETAILS COLIS */}
           <div className="lg:col-span-1 space-y-6">
               <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-lg border-t-8 border-t-orange-500">
                    <div className="mb-6 text-center">
                        <div className="bg-orange-50 dark:bg-orange-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Package className="w-8 h-8 text-orange-600"/>
                        </div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Colis identifié</p>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight font-mono">{packageInfo?.trackingNumber}</h2>
                    </div>
                    
                    <div className="space-y-3 text-sm pb-6 border-b border-gray-100 dark:border-gray-700">
                         <div className="flex justify-between">
                             <span className="text-gray-500">Expéditeur</span>
                             <span className="font-bold text-right text-gray-900 dark:text-white">{packageInfo?.senderName}</span>
                         </div>
                         <div className="flex justify-between">
                             <span className="text-gray-500">Destinataire</span>
                             <span className="font-bold text-right text-gray-900 dark:text-white">{packageInfo?.recipientName}</span>
                         </div>
                         <div className="pt-2">
                             <span className="text-gray-500 block mb-1">Contenu</span>
                             <p className="font-medium italic text-gray-600 bg-gray-50 dark:bg-gray-900 p-2 rounded">{packageInfo?.packageDescription}</p>
                         </div>
                    </div>
                    
                    <div className="pt-6">
                         <div className="flex justify-between items-center">
                             <span className="text-gray-500 font-bold">Montant Dû</span>
                             <span className={`text-xl font-black ${packageInfo?.is_paid_at_departure ? 'text-green-600' : 'text-red-600'}`}>
                                 {packageInfo?.shippingCost.toLocaleString()} FCFA
                             </span>
                         </div>
                         {packageInfo?.is_paid_at_departure ? (
                             <p className="text-xs text-green-600 text-right font-bold mt-1 flex justify-end items-center gap-1">
                                 <SolidCheckCircleIcon className="w-3 h-3"/> Payé en ligne
                             </p>
                         ) : (
                             <p className="text-xs text-red-600 text-right font-bold mt-1 flex justify-end items-center gap-1">
                                 <ExclamationTriangleIcon className="w-3 h-3"/> À encaisser
                             </p>
                         )}
                    </div>
               </div>
           </div>
           
           {/* COLONNE DROITE : FORMULAIRE RETRAIT */}
           <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg">
               <div className="flex justify-between items-center mb-8">
                   <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                       <ArchiveIcon className="w-6 h-6 text-green-600"/> Validation Retrait
                   </h3>
                   <button onClick={resetState} className="text-sm text-gray-400 hover:text-orange-600 underline">Changer de colis</button>
               </div>
               
               <div className="grid md:grid-cols-2 gap-6 mb-6">
                   <div className="space-y-1">
                       <label className="text-xs font-bold uppercase text-gray-500 ml-1">Nom du Retirant *</label>
                       <div className="relative">
                           <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3"/>
                           <input 
                              className="w-full pl-10 p-3 bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-medium focus:border-green-500 outline-none transition"
                              placeholder="Nom complet"
                              value={retirantInfo.name}
                              onChange={e => setRetirantInfo({...retirantInfo, name: e.target.value})}
                           />
                       </div>
                   </div>
                   
                   <div className="space-y-1">
                       <label className="text-xs font-bold uppercase text-gray-500 ml-1">Téléphone</label>
                       <div className="relative">
                           <PhoneIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3"/>
                           <input 
                              className="w-full pl-10 p-3 bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-medium focus:border-green-500 outline-none transition"
                              placeholder="6XX XXX XXX"
                              type="tel"
                              value={retirantInfo.phone}
                              onChange={e => setRetirantInfo({...retirantInfo, phone: e.target.value})}
                           />
                       </div>
                   </div>

                   <div className="space-y-1">
                       <label className="text-xs font-bold uppercase text-gray-500 ml-1">N° CNI / Pièce *</label>
                       <div className="relative">
                           <IdentificationIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3"/>
                           <input 
                              className="w-full pl-10 p-3 bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-medium focus:border-green-500 outline-none transition"
                              placeholder="N° CNI"
                              value={retirantInfo.cni}
                              onChange={e => setRetirantInfo({...retirantInfo, cni: e.target.value})}
                           />
                       </div>
                   </div>

                   <div className="space-y-1">
                       <label className="text-xs font-bold uppercase text-gray-500 ml-1">Date délivrance</label>
                       <input 
                           type="date"
                           className="w-full p-3 bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-medium focus:border-green-500 outline-none transition"
                           value={retirantInfo.cniDate}
                           onChange={e => setRetirantInfo({...retirantInfo, cniDate: e.target.value})}
                       />
                   </div>
               </div>

               {/* PAIEMENT CASH SI NECESSAIRE */}
               {!packageInfo?.is_paid_at_departure && (
                   <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-100 dark:border-red-900/30 dark:bg-red-900/10">
                       <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-red-700 flex items-center gap-2"><BanknotesIcon className="w-5 h-5"/> Paiement requis</h4>
                            <span className="text-lg font-black text-slate-900">{packageInfo?.shippingCost} F</span>
                       </div>
                       <div className="flex gap-2">
                           <input 
                               type="number" 
                               className="flex-1 p-2 rounded border bg-white" 
                               placeholder="Montant Reçu"
                               value={amountPaid}
                               onChange={e => setAmountPaid(e.target.value)}
                           />
                           {Number(changeAmount) > 0 && (
                               <div className="px-4 py-2 bg-green-200 text-green-800 rounded font-bold flex items-center">
                                   Rendre: {changeAmount} F
                               </div>
                           )}
                       </div>
                   </div>
               )}

               {/* SIGNATURE */}
               <div className="space-y-2 mb-8">
                   <div className="flex justify-between">
                       <label className="text-xs font-bold uppercase text-gray-500 ml-1">Signature Client *</label>
                       {retirantInfo.signature && <button onClick={() => sigCanvasRef.current?.clear()} className="text-xs text-red-500 underline">Effacer</button>}
                   </div>
                   <div className="h-40 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 cursor-crosshair relative overflow-hidden touch-none">
                       <SignatureCanvas 
                           ref={sigCanvasRef}
                           penColor="black"
                           canvasProps={{className: "w-full h-full block"}}
                           onEnd={() => {
                               if(sigCanvasRef.current) setRetirantInfo(p => ({...p, signature: sigCanvasRef.current!.toDataURL()}));
                           }}
                       />
                       {!retirantInfo.signature && (
                           <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none font-medium select-none">
                               <PencilIcon className="w-4 h-4 mr-2"/> Signer ici
                           </div>
                       )}
                   </div>
               </div>

               <button 
                   onClick={handleConfirmWithdrawal}
                   disabled={isConfirming || !retirantInfo.signature || (!packageInfo?.is_paid_at_departure && Number(amountPaid) < (packageInfo?.shippingCost || 0))}
                   className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-green-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg transition-transform transform hover:-translate-y-1"
               >
                   {isConfirming ? <Loader2 className="w-6 h-6 animate-spin"/> : <SolidCheckCircleIcon className="w-6 h-6"/>}
                   Valider le Retrait
               </button>

               {error && (
                   <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium text-center animate-pulse">
                       {error}
                   </div>
               )}
           </div>
      </div>
  );

  const renderSuccess = () => (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-in zoom-in duration-300 px-4">
          <div className="w-28 h-28 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shadow-xl mb-6">
              <SolidCheckCircleIcon className="w-16 h-16 text-green-600 dark:text-green-400"/>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3">Retrait Effectué !</h1>
          <p className="text-gray-500 max-w-md mb-8">Le colis a été marqué comme "Retiré" et une preuve de livraison a été générée pour le client.</p>
          
          <div className="flex gap-4">
               <button onClick={resetState} className="px-8 py-3 rounded-xl font-bold border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition">
                   Nouveau Retrait
               </button>
               <button onClick={onSuccess} className="px-8 py-3 rounded-xl font-bold bg-green-600 text-white shadow-lg hover:bg-green-700 hover:shadow-green-200 transition transform hover:-translate-y-1">
                   Terminer
               </button>
          </div>
      </div>
  );

  // --- RENDER MAIN ---

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 pb-24 transition-colors">
        
        {/* TOP BAR INTERNE */}
        <div className="max-w-5xl mx-auto mb-4 flex items-center justify-between">
             {currentStep !== 'SUCCESS' ? (
                 <button onClick={() => currentStep === 'SEARCH' ? onClose() : setCurrentStep('SEARCH')} className="flex items-center text-gray-500 hover:text-orange-600 font-bold transition text-sm gap-1">
                     <ArrowLeftIcon className="w-4 h-4"/> {currentStep === 'SEARCH' ? 'Annuler' : 'Retour Recherche'}
                 </button>
             ) : <div/>}
             
             {currentStep === 'DETAILS' && (
                 <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-3 py-1 rounded-full border border-orange-100">Mode Validation</h3>
             )}
             
             <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow hover:bg-gray-100 transition text-gray-500">
                 <XMarkIcon className="w-5 h-5"/>
             </button>
        </div>

        <AnimatePresence mode="wait">
             {currentStep === 'SEARCH' && <motion.div key="s" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}}>{renderSearch()}</motion.div>}
             {currentStep === 'DETAILS' && <motion.div key="d" initial={{opacity:0, x:50}} animate={{opacity:1, x:0}} exit={{opacity:0}}>{renderDetails()}</motion.div>}
             {currentStep === 'SUCCESS' && <motion.div key="ok" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>{renderSuccess()}</motion.div>}
        </AnimatePresence>

    </div>
  );
}
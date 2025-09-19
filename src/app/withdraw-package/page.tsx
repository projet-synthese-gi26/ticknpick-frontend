'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/context/NotificationContext';
import Link from 'next/link';
import Image from 'next/image';
import jsPDF from 'jspdf';
import OriginalQRCode from 'qrcode';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Icônes (optimisé)
import { QrCodeIcon, MagnifyingGlassIcon, CheckCircleIcon, ArrowUturnLeftIcon, TruckIcon, UserCircleIcon, CubeIcon, ShieldCheckIcon, XMarkIcon, IdentificationIcon, PrinterIcon, CalendarDaysIcon, CurrencyDollarIcon, CheckIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { Package, Sparkles, AlertTriangle, Search, Loader2, ArchiveRestore, ClipboardSignature, User, CreditCard, CheckCheck, PencilIcon } from 'lucide-react';
import Navbar from '../../components/Navbar';
import SignatureCanvas from 'react-signature-canvas';

interface WithdrawPackageProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Types (gardés dans le fichier pour la portabilité)
interface PackageInfo {
    id: number;
    trackingNumber: string;
    senderName: string; senderPhone: string;
    recipientName: string; recipientPhone: string;
    departurePointName: string; arrivalPointName: string;
    packageDescription: string; packageWeight: string;
    isFragile: boolean; isPerishable: boolean; isInsured: boolean;
    declaredValue: string;
    status: 'Au départ' | 'En transit' | 'Arrivé au relais' | 'Reçu' | 'Annulé' | 'En attente';
    is_paid_at_departure: boolean;
    shippingCost: string;
    // Ajouté pour le cas 'déjà retiré'
    retirantInfo?: {
      name: string; phone: string; cni: string; created_at: string;
    };
}
interface RetirantInfo { name: string; cni: string; cniDate: string; phone: string; signature: string | null; }

// --- Configuration ---
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "PicknDrop Link";

export default function WithdrawPackagePage({ onClose, onSuccess }: WithdrawPackageProps) {
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'details' | 'payment' | 'recipient' | 'completed'>('details');
  const [retirantInfo, setRetirantInfo] = useState<RetirantInfo>({ name: '', cni: '', cniDate: '', phone: '', signature: null });
  const [isConfirming, setIsConfirming] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [changeAmount, setChangeAmount] = useState('0');

  const sigCanvasRef = useRef<SignatureCanvas>(null);

  const resetStateAndReturn = () => {
    resetState(); // Votre fonction resetState actuelle
    onSuccess(); // Signale le succès au parent
  };

  const resetState = () => {
    setSearchInput(''); setIsLoading(false); setPackageInfo(null); setError(null);
    setCurrentStep('details'); setRetirantInfo({ name: '', cni: '', cniDate: '', phone: '', signature: null });
    setIsConfirming(false); setAmountPaid(''); setChangeAmount('0');
  };

const handleSearchPackage = async (value?: string) => {
    const query = (value || searchInput).trim().toUpperCase();
    if (!query) return setError('Veuillez entrer un numéro de suivi.');

    setIsLoading(true); setError(null); setPackageInfo(null);
    
    try {
        const { data: shipment, error: dbError } = await supabase
            .from('shipments')
            .select(`*, departurePoint:departure_point_id(name), arrivalPoint:arrival_point_id(name)`)
            .eq('tracking_number', query)
            .single();

        if (dbError || !shipment) throw new Error("Aucun colis trouvé avec ce numéro de suivi.");

        // Logique de statut cruciale
        if (shipment.status === 'RECU') throw new Error("Ce colis a déjà été retiré.");
        if (shipment.status !== 'ARRIVE_AU_RELAIS') throw new Error("Ce colis n'est pas encore disponible pour le retrait.");
        
        const statusMap: Record<string, PackageInfo['status']> = { 'ARRIVE_AU_RELAIS': 'Arrivé au relais' };

        const formattedPackage: PackageInfo = {
            id: shipment.id,
            trackingNumber: shipment.tracking_number,
            senderName: shipment.sender_name,
            senderPhone: shipment.sender_phone,
            recipientName: shipment.recipient_name,
            recipientPhone: shipment.recipient_phone,
            departurePointName: (shipment.departurePoint as any)?.name || 'Inconnu',
            arrivalPointName: (shipment.arrivalPoint as any)?.name || 'Inconnu',
            packageDescription: shipment.description,
            packageWeight: String(shipment.weight),
            isFragile: shipment.is_fragile,
            isPerishable: shipment.is_perishable,
            isInsured: shipment.is_insured,
            declaredValue: String(shipment.declared_value || ''),
            status: statusMap[shipment.status],
            isPaid: shipment.is_paid_at_departure || shipment.amount_paid != null,
            shippingCost: String(shipment.shipping_cost),
        };
        setPackageInfo(formattedPackage);

    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!packageInfo || packageInfo.is_paid_at_departure || !packageInfo.shippingCost) return;
    const cost = parseFloat(packageInfo.shippingCost);
    const paid = parseFloat(amountPaid);
    const change = paid > cost ? paid - cost : 0;
    setChangeAmount(change.toFixed(0));
  }, [amountPaid, packageInfo]);

  const handleConfirmWithdrawal = async () => {
    if (!packageInfo || !retirantInfo.name || !retirantInfo.cni || !retirantInfo.cniDate || !retirantInfo.phone) {
      return setError("Tous les champs (sauf la signature) doivent être remplis.");
    }
    if (sigCanvasRef.current?.isEmpty()) {
        return setError("La signature est obligatoire pour finaliser le retrait.");
    }
    const signatureData = sigCanvasRef.current?.toDataURL('image/png') || null;

    setIsConfirming(true); setError(null);

    try {
        const updatedRetirantInfo = { ...retirantInfo, signature: signatureData };
        // J'ai simplifié ici, votre RPC est toujours une bonne option mais pour l'exemple, j'utilise la logique client-side.
        const { error: updateError } = await supabase.from('shipments').update({ status: 'RECU' }).eq('id', packageInfo.id);
        if (updateError) throw updateError;
        const { error: insertError } = await supabase.from('withdrawal_logs').insert([{
            shipment_id: packageInfo.id,
            retirant_name: updatedRetirantInfo.name,
            retirant_cni: updatedRetirantInfo.cni,
            retirant_cni_date: updatedRetirantInfo.cniDate,
            retirant_phone: updatedRetirantInfo.phone,
        }]);
        if (insertError) throw insertError;
        
        setRetirantInfo(updatedRetirantInfo); // Sauvegarde la signature pour le PDF
        await generateWithdrawalPDF(packageInfo, updatedRetirantInfo);
        setCurrentStep('completed');
    } catch (err: any) {
        setError("Erreur technique: " + err.message);
    } finally {
        setIsConfirming(false);
    }
  };

  const proceedToRecipientInfo = () => {
    if (packageInfo && !packageInfo.is_paid_at_departure) {
      const cost = parseFloat(packageInfo.shippingCost);
      const paid = parseFloat(amountPaid);
      if (isNaN(paid) || paid < cost) return setError(`Le montant payé est insuffisant. Requis : ${cost} FCFA.`);
    }
    setError(null);
    setCurrentStep('recipient');
  };


  const generateWithdrawalPDF = async (pkgInfo: PackageInfo, retirant: RetirantInfo) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    // --- Header ---
    pdf.setFontSize(22).setFont('helvetica', 'bold').setTextColor('#D97706').text(APP_NAME, margin, y);
    const qrDataURL = await OriginalQRCode.toDataURL(pkgInfo.trackingNumber, { width: 100, margin: 1 });
    pdf.addImage(qrDataURL, 'PNG', pageWidth - margin - 30, y - 10, 30, 30);
    pdf.setFontSize(10).setFont('helvetica', 'normal').setTextColor(80,80,80).text(`Bordereau de Retrait - ${pkgInfo.trackingNumber}`, margin, y + 7);
    y += 15;
    pdf.setDrawColor(200).line(margin, y, pageWidth - margin, y); y += 10;
    
    // --- Fonctions d'aide pour le corps du PDF ---
    const addSection = (title: string) => { pdf.setFontSize(14).setFont('helvetica', 'bold').setTextColor('#333').text(title, margin, y); y += 8; };
    const addField = (label: string, value: string | undefined | null) => { if(!value) return; pdf.setFontSize(10).setFont('helvetica', 'bold').text(label, margin, y); pdf.setFont('helvetica', 'normal').text(String(value), margin + 40, y); y += 7;};
    const addLine = () => { y += 3; pdf.setDrawColor(230).line(margin, y, pageWidth - margin, y); y += 8; };

    // --- Informations ---
    addSection("Détails du Colis");
    addField("Description:", pkgInfo.packageDescription);
    addField("Poids:", `${pkgInfo.packageWeight} kg`);
    let tags = [ pkgInfo.isFragile && "Fragile", pkgInfo.isPerishable && "Périssable", pkgInfo.isInsured && `Assuré (${pkgInfo.declaredValue} FCFA)`].filter(Boolean).join(', ');
    if (tags) addField("Attributs:", tags);
    addLine();

    addSection("Expéditeur & Destinataire");
    addField("Expéditeur:", pkgInfo.senderName);
    addField("Tél. Exp.:", pkgInfo.senderPhone);
    addField("Point de départ:", pkgInfo.departurePointName);
    y += 5;
    addField("Destinataire:", pkgInfo.recipientName);
    addField("Tél. Dest.:", pkgInfo.recipientPhone);
    addField("Point de retrait:", pkgInfo.arrivalPointName);
    addLine();
    
    addSection("Informations de Retrait");
    addField("Retiré par:", retirant.name);
    addField("Numéro CNI:", retirant.cni);
    addField("Délivré le:", new Date(retirant.cniDate).toLocaleDateString('fr-FR'));
    addField("Téléphone:", retirant.phone);
    addField("Date du retrait:", new Date().toLocaleString('fr-FR'));
    if (retirant.signature) {
      pdf.setFont('helvetica', 'bold').text("Signature du PicknDrop Point Owner:", margin, y + 5);
      pdf.addImage(retirant.signature, 'PNG', margin, y + 8, 60, 30);
    }

    pdf.setFont('helvetica', 'bold').text("Signature retirant:", margin, y + 5);
    
    // --- Footer ---
    const footerY = pdf.internal.pageSize.getHeight() - 10;
    pdf.setFontSize(8).setTextColor(150).text(`Document généré le ${new Date().toLocaleString('fr-FR')} par ${APP_NAME}. Merci de votre confiance.`, pageWidth / 2, footerY, { align: 'center' });

    pdf.save(`Bordereau_Retrait_${pkgInfo.trackingNumber}.pdf`);
  };

  const getStatusMessageAndAction = () => {
    if (!packageInfo) return null;
    switch(packageInfo.status) {
        case 'Arrivé au relais': return {
            canWithdraw: true,
            message: "Ce colis est prêt à être retiré.",
            buttonText: "Démarrer le Retrait"
        };
        case 'Reçu': return {
            canWithdraw: false,
            message: `Ce colis a déjà été retiré par ${packageInfo.retirantInfo?.name || 'le destinataire'} le ${packageInfo.retirantInfo?.created_at || ''}.`,
            buttonText: null
        };
        case 'En transit':
        case 'Au départ':
            return {
                canWithdraw: false,
                message: `Ce colis est actuellement ${packageInfo.status.toLowerCase()}. Il n'est pas encore disponible au point de retrait.`,
                buttonText: null
            };
        default: return {
            canWithdraw: false,
            message: `Le statut actuel du colis (${packageInfo.status}) ne permet pas son retrait.`,
            buttonText: null
        };
    }
  };


 return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-0 font-sans relative overflow-x-hidden">

          <div className="fixed inset-0 pointer-events-none z-0">
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.08, scale: 1 }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }} className="absolute -top-24 -right-24 w-96 h-96 bg-orange-400 rounded-full blur-3xl"/>
              <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 0.05, scale: 1 }} transition={{ duration: 3, delay: 0.5, repeat: Infinity, repeatType: "reverse" }} className="absolute top-1/3 -left-32 w-80 h-80 bg-amber-400 rounded-full blur-3xl" />
          </div>

          <div className="fixed top-0 left-0 w-[35%] xl:w-[32%] h-full hidden lg:block z-10">
            <Image src="/images/image4.jpg" alt="Service de colis" layout="fill" objectFit="cover" className="opacity-80" priority/>
            <div className="absolute inset-0 bg-orange-900/10"/>
            <div className="absolute bottom-8 left-8 right-8 bg-black/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center space-x-3 mb-2"><div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center"><ClipboardSignature className="w-5 h-5 text-white" /></div><div><h3 className="text-white font-semibold text-sm">Retrait Sécurisé</h3><p className="text-orange-100 text-xs">Processus simplifié et rapide</p></div></div>
            </div>
          </div>
        <motion.main initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-4xl mx-auto  lg:mr-8 px-4 sm:px-6 py-12 lg:py-16 relative z-20">
          <div className="mb-8 text-center lg:text-left space-x-16">
            <Link href="/home" className="inline-flex items-center text-orange-600 hover:text-orange-800 text-sm font-medium group mb-4">
                <ArrowUturnLeftIcon className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />Retour à l'accueil
            </Link>
            <button 
              onClick={onClose} 
              className="inline-flex items-center text-orange-600 hover:text-orange-800 text-sm font-medium group mb-4"
            >
              <ArrowUturnLeftIcon className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
              Retour à l'inventaire
            </button>
            <div className="flex flex-col items-center lg:items-start">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 15 }} className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center shadow-2xl shadow-orange-500/25 mb-4">
                <ClipboardSignature className="w-9 h-9 text-white" />
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">Processus de Retrait</motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-slate-600 max-w-md">Guidez le client pour retirer son colis avec notre système intuitif et sécurisé.</motion.p>
            </div>
          </div>
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <div className="text-center p-8"><Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" /></div>
                ) : !packageInfo ? (
                    <motion.section key="search-view" variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="bg-white/70 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-white/50">
                                        <h2 className="text-xl font-bold text-slate-800 mb-1">Identifier le Colis</h2>
                <p className="text-slate-500 text-sm mb-6">Utilisez le numéro de suivi pour retrouver le colis.</p>
                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value.toUpperCase())} placeholder="Numéro de suivi" className="w-full pl-10 pr-3 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/80" onKeyDown={(e) => e.key === 'Enter' && handleSearchPackage()}/>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleSearchPackage()} disabled={isLoading || !searchInput.trim()} className="flex items-center justify-center bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md disabled:opacity-60 hover:bg-orange-700">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Rechercher'}
                  </motion.button>
                </div>
                    </motion.section>
                ) : (
                    <motion.div key="details-view" variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/50 space-y-4">
                            <h2 className="text-xl font-bold">Détails du colis <span className="text-orange-600 font-mono">{packageInfo.trackingNumber}</span></h2>
                            {/* Affichage des infos expéditeur, destinataire etc... */}
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div><strong className="text-slate-500">Expéditeur:</strong> {packageInfo.senderName}</div>
                                <div><strong className="text-slate-500">Destinataire:</strong> {packageInfo.recipientName}</div>
                                <div><strong className="text-slate-500">De:</strong> {packageInfo.departurePointName}</div>
                                <div><strong className="text-slate-500">Vers:</strong> {packageInfo.arrivalPointName}</div>
                                <div className="md:col-span-2"><strong className="text-slate-500">Description:</strong> {packageInfo.packageDescription}</div>
                            </div>
                            
                            <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg mt-4">
                                <p className="font-semibold text-orange-800">{getStatusMessageAndAction()?.message}</p>
                            </div>
                        </div>

                        {currentStep === 'details' && getStatusMessageAndAction()?.canWithdraw && (
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setCurrentStep(packageInfo.is_paid_at_departure ? 'recipient' : 'payment')} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg">{getStatusMessageAndAction()?.buttonText}</motion.button>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={resetState} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-6 rounded-lg">Nouvelle Recherche</motion.button>
                            </div>
                        )}
                        
                        {currentStep === 'payment' && (
                            <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/70 p-6 rounded-2xl shadow-xl space-y-4">
                              <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/50 space-y-4">
                                <h2 className="text-xl font-bold">Étape 1: Paiement</h2>
                                <p>Montant à payer : <strong className="text-xl text-red-600">{packageInfo.shippingCost} FCFA</strong></p>
                                <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="Montant payé par le client" className="w-full p-3 border-2 border-slate-300 rounded-lg"/>
                                {parseFloat(amountPaid) >= parseFloat(packageInfo.shippingCost) && <p>Monnaie à rendre : <strong className="text-green-600">{changeAmount} FCFA</strong></p>}
                                <div className="flex gap-3 pt-2"><button onClick={proceedToRecipientInfo} className="flex-1 bg-orange-600 text-white font-bold py-3 rounded-lg" disabled={parseFloat(amountPaid) < parseFloat(packageInfo.shippingCost)}>Valider et Continuer</button><button onClick={() => setCurrentStep('details')} className="bg-slate-200 py-3 px-6 rounded-lg">Retour</button></div>
                            </motion.div>
                            </motion.div>
                        )}
                        
                        {currentStep === 'recipient' && (
                           <motion.div key="recipient" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/70 p-6 rounded-2xl shadow-xl space-y-4">
                            <h2 className="text-xl font-bold">Étape {packageInfo.is_paid_at_departure ? '1' : '2'}: Infos Retirant</h2>
                              <input type="text" name="name" value={retirantInfo.name} onChange={e => setRetirantInfo(p=>({...p, name: e.target.value}))} placeholder="Nom complet du retirant" className="w-full p-3 border-2 border-slate-300 rounded-lg"/>
                              <input type="text" name="cni" value={retirantInfo.cni} onChange={e => setRetirantInfo(p=>({...p, cni: e.target.value}))} placeholder="Numéro CNI/Passeport" className="w-full p-3 border-2 border-slate-300 rounded-lg"/>
                              <input type="date" name="cniDate" value={retirantInfo.cniDate} onChange={e => setRetirantInfo(p=>({...p, cniDate: e.target.value}))} className="w-full p-3 border-2 border-slate-300 rounded-lg"/>
                              <input type="tel" name="phone" value={retirantInfo.phone} onChange={e => setRetirantInfo(p=>({...p, phone: e.target.value}))} placeholder="Téléphone du retirant" className="w-full p-3 border-2 border-slate-300 rounded-lg"/>
                                      
                                {/* NOUVEL AJOUT: Signature Canvas */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                                        <PencilIcon className="w-4 h-4 mr-1.5 text-orange-600"/>Signature *
                                    </label>
                                    <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg">
                                        <SignatureCanvas penColor='black' canvasProps={{className: 'w-full h-32 cursor-crosshair'}} ref={sigCanvasRef} />
                                    </div>
                                    <button onClick={() => sigCanvasRef.current?.clear()} className="text-xs text-orange-600 hover:underline mt-1">Effacer</button>
                                </div>

                                {error && <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg text-sm">{error}</div>}
                                
                                <div className="flex gap-3 pt-2">
                                  <button onClick={handleConfirmWithdrawal} className="flex-1 bg-orange-600 text-white font-bold py-3 rounded-lg" disabled={isConfirming}>
                                    {isConfirming ? <Loader2 className="animate-spin mx-auto"/> : 'Confirmer et Générer Bordereau'}
                                  </button>
                                  {/* ... bouton retour ... */}
                                </div>
                           </motion.div>
                        )}
                        
                        {currentStep === 'completed' && (
                            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center bg-white/80 p-8 rounded-2xl shadow-xl">
                                <CheckCheck className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-slate-800">Retrait Finalisé !</h2>
                                <p className="text-slate-600 mt-2 mb-6">Le colis <strong>{packageInfo.trackingNumber}</strong> a été retiré par <strong>{retirantInfo.name}</strong>. Le bordereau a été téléchargé.</p>
                                <button onClick={resetStateAndReturn} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg">Effectuer un autre retrait</button>
                            </motion.div>
                        )}

                    </motion.div>
                )}
            </AnimatePresence>
            {error && !packageInfo && <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg text-sm">{error}</div>}
        </motion.main>
    </div>
  );
}




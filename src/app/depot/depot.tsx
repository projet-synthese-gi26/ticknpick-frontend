// FICHIER : src/app/depot/depot.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon, PlusIcon,
  XMarkIcon, UserIcon, PhoneIcon, PencilIcon, DocumentArrowDownIcon,
  BanknotesIcon, ArrowLeftIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as SolidCheckCircleIcon } from '@heroicons/react/24/solid';
import { Package, Loader2, Clock, CheckCircleIcon, ArrowLeft } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { relayPointService } from '@/services/relayPointService';
import { packageService } from '@/services/packageService';

// Import du module d'expédition existant pour l'intégration "Nouveau Colis"
import ShippingPage from '@/app/expedition/page';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

// --- TYPES & INTERFACES ---

interface Shipment {
  id: string;
  tracking_number: string;
  status: string;
  sender_name: string;
  sender_phone: string;     // Nécessaire pour pré-remplir le déposant
  recipient_name: string;
  description: string;
  shipping_cost: number;
  is_paid_at_departure: boolean;
  created_at: string;
  weight?: number;
  // Infos supplémentaires pour le PDF
  arrival_point_name?: string;
  departure_point_name?: string;
}

interface DepositUserInfo {
  fullName: string;
  phone: string;
  signature: string | null;
}

interface DepotColisProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const DepotColis = ({ onClose, onSuccess }: DepotColisProps) => {
  const { user: authUser } = useAuth();
  
  // --- ETATS DE NAVIGATION ---
  const [viewMode, setViewMode] = useState<'MENU' | 'EXISTING' | 'NEW'>('MENU');
  const [step, setStep] = useState<'DETAILS' | 'USER_FORM' | 'SUCCESS'>('DETAILS');

  // --- ETATS DE DONNÉES ---
  const [myRelayId, setMyRelayId] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  
  // --- ETATS DU FORMULAIRE DE DÉPÔT ---
  const [searchQuery, setSearchQuery] = useState('');
  const [userInfo, setUserInfo] = useState<DepositUserInfo>({ fullName: '', phone: '', signature: null });
  const [paymentAmount, setPaymentAmount] = useState('');
  
  // État pour savoir si le paiement cash a été collecté manuellement par l'agent
  const [isPaymentCollected, setIsPaymentCollected] = useState(false);

  // --- ETATS UI ---
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Canvas Signature
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);


  // ===========================================================================
  // 1. INITIALISATION : CHARGEMENT DU POINT RELAIS
  // ===========================================================================
  useEffect(() => {
      const loadRelay = async () => {
          if (!authUser) return;
          setIsLoading(true);
          try {
              console.log(`🔄 [DEPOT] Init pour user ID: ${authUser.id}`);
              
              // Récupère tous les points relais (Public ou Privé selon l'API, on filtre)
              const points: any[] = await relayPointService.getAllRelayPoints();
              
              // Trouver celui appartenant à l'utilisateur connecté
              // On compare avec == pour gérer string/number
              const myPoint = points.find((p: any) => String(p.ownerId) === String(authUser.id));

              if (myPoint) {
                  console.log(`✅ Point Relais Connecté: ${myPoint.relayPointName} (ID: ${myPoint.id})`);
                  setMyRelayId(myPoint.id);

                  // Check Auto-Remplissage depuis localStorage (ex: venant de l'inventaire)
                  const prefillId = localStorage.getItem('prefill_package_id');
                  if (prefillId) {
                      console.log("⚡ Détection pré-remplissage:", prefillId);
                      localStorage.removeItem('prefill_package_id'); // Nettoyage
                      setSearchQuery(prefillId);
                      setViewMode('EXISTING');
                      // Petit délai pour s'assurer que le state est prêt
                      setTimeout(() => handleSearch(prefillId), 100);
                  }
              } else {
                  console.warn("⚠️ Aucun Point Relais trouvé pour cet utilisateur.");
                  setError("Erreur: Aucun Point Relais n'est associé à votre compte. Vous ne pouvez pas effectuer de dépôt.");
              }
          } catch (e) {
              console.error("❌ Erreur Init Depot:", e);
              setError("Impossible de charger les informations du point relais.");
          } finally {
              setIsLoading(false);
          }
      };
      loadRelay();
  }, [authUser]);


  // ===========================================================================
  // 2. LOGIQUE DE RECHERCHE DE COLIS (API)
  // ===========================================================================
  const handleSearch = async (overrideQuery?: string) => {
      const query = (overrideQuery || searchQuery).trim();
      if (!query) return;

      console.group(`🔍 [DEPOT] Recherche Colis: ${query}`);
      
      setIsSearching(true);
      setError(null);
      setSelectedShipment(null);
      setIsPaymentCollected(false); // Reset paiement manuel
      setUserInfo({ fullName: '', phone: '', signature: null }); // Reset form

      try {
          // A. APPEL BACKEND
          const response = await packageService.trackPackage(query);
          console.log("📥 Réponse Backend:", response);

          // B. NORMALISATION (Gestion { package: ... } vs Direct)
          const pkg = (response as any).package || response;

          if (!pkg || (!pkg.trackingNumber && !pkg.tracking_number)) {
              throw new Error("Réponse invalide ou colis introuvable.");
          }

          // C. ANALYSE DU STATUT
          const rawStatus = (pkg.status || pkg.currentStatus || '').toUpperCase();
          console.log("📊 Statut actuel:", rawStatus);

          // Statuts autorisés pour un premier dépôt au guichet
          const allowedStatuses = [
            'PRE_REGISTERED', 
            'PENDING', 
            'EN_ATTENTE', 
            'WAITING', 
            'CREATED',
            'PENDING_DEPOSIT'
          ];
          
          const isEligible = allowedStatuses.some(k => rawStatus.includes(k));

          if (!isEligible) {
              // Feedback précis
              if (rawStatus.includes('TRANSIT') || rawStatus.includes('DEPART')) {
                   throw new Error(`Ce colis est déjà en cours d'acheminement (Statut: ${rawStatus}).`);
              }
              if (rawStatus.includes('LIVRE') || rawStatus.includes('RECU')) {
                   throw new Error(`Ce colis est déjà terminé (Statut: ${rawStatus}).`);
              }
              // Warning en dev, Bloquant en prod (ici on bloque pour être safe)
              throw new Error(`Statut invalide pour un dépôt: ${rawStatus}. Le colis doit être 'EN ATTENTE'.`);
          }

          // D. MAPPING OBJET SHIPMENT
          const uiShipment: Shipment = {
              id: String(pkg.id || pkg.packageId), // Conversion String UUID
              tracking_number: pkg.trackingNumber || pkg.tracking_number,
              status: rawStatus,
              sender_name: pkg.senderName || "Inconnu",
              sender_phone: pkg.senderPhone || "",
              recipient_name: pkg.recipientName || "Inconnu",
              description: pkg.description || "Sans description",
              
              // Cout : on cherche deliveryFee ou shippingCost
              shipping_cost: Number(pkg.deliveryFee || pkg.shippingCost || 0),
              
              // Paiement : Vérification booléenne ou string 'PAID'
              is_paid_at_departure: (pkg.paymentStatus === 'PAID' || pkg.isPaid === true),
              
              created_at: pkg.createdAt || new Date().toISOString(),
              weight: Number(pkg.weight || 0)
          };

          console.log("✨ Shipment UI Mapped:", uiShipment);
          
          setSelectedShipment(uiShipment);
          
          // Pré-remplir le déposant avec l'expéditeur par défaut (confort UX)
          if (uiShipment.sender_name) {
             setUserInfo(prev => ({
                 ...prev,
                 fullName: uiShipment.sender_name,
                 phone: uiShipment.sender_phone
             }));
          }

          setStep('DETAILS');

      } catch (err: any) {
          console.error("❌ Erreur Search:", err);
          setError(err.message || "Colis introuvable.");
      } finally {
          setIsSearching(false);
          console.groupEnd();
      }
  };

   // ===========================================================================
  // 3. GENERATEUR PDF BORDEREAU DE DÉPÔT
  // ===========================================================================
  const generateDepositPDF = async (
    shipment: Shipment, 
    relay: any, 
    user: DepositUserInfo, 
    paymentStatus: string
  ) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      let y = 20;

      // -- Header Brand --
      pdf.setFontSize(22);
      pdf.setTextColor(255, 102, 0); // TiiBnTick Orange
      pdf.setFont("helvetica", "bold");
      pdf.text("TiiBnTick", 15, y);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.setFont("helvetica", "normal");
      pdf.text("Bordereau de Dépôt Officiel", 15, y + 5);

      y += 20;
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(200);
      pdf.line(15, y, width - 15, y);
      y += 10;

      // -- 1. Informations Point Relais & Agent --
      pdf.setFontSize(11);
      pdf.setTextColor(0);
      pdf.setFont("helvetica", "bold");
      pdf.text("1. Point de Dépôt (Réceptionnaire)", 15, y);
      y += 6;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Relais : ${relay?.relayPointName || "N/A"}`, 20, y);
      pdf.text(`Localisation : ${relay?.relay_point_locality || relay?.locality || ""}, ${relay?.address || relay?.relay_point_address || ""}`, 20, y + 5);

      pdf.text(`Date & Heure : ${new Date().toLocaleString()}`, 20, y + 15);
      
      y += 25;

      // -- 2. Informations Colis --
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("2. Détails du Colis", 15, y);
      y += 6;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Tracking N° : ${shipment.tracking_number}`, 20, y);
      pdf.text(`Destination : ${shipment.arrival_point_name}`, 20, y + 5);
      pdf.text(`Contenu déclaré : ${shipment.description}`, 20, y + 10);
      pdf.text(`Poids : ${shipment.weight} kg`, 20, y + 15);
      pdf.text(`Frais de port : ${shipment.shipping_cost} FCFA (${paymentStatus})`, 20, y + 20);
      
      y += 30;

      // -- 3. Informations Déposant --
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("3. Déposant", 15, y);
      y += 6;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Nom complet : ${user.fullName}`, 20, y);
      pdf.text(`Téléphone : ${user.phone}`, 20, y + 5);

      // Signature Image
      if (user.signature) {
        pdf.text("Signature du client :", 20, y + 15);
        try {
          pdf.addImage(user.signature, 'PNG', 20, y + 18, 50, 20);
        } catch(e) {}
      } else {
        pdf.text("(Signature non fournie)", 20, y + 15);
      }

      // Footer legal
      const footerY = pdf.internal.pageSize.getHeight() - 20;
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text("Document généré automatiquement par TiiBnTick System.", 15, footerY);
      pdf.text("Conservez ce reçu comme preuve de dépôt.", 15, footerY + 4);

      pdf.save(`Bordereau_Depot_${shipment.tracking_number}.pdf`);
      return true;
    } catch (error) {
      console.error("Erreur PDF Generation:", error);
      return false;
    }
  };


  // ===========================================================================
  // 3. GESTION SIGNATURE (CANVAS)
  // ===========================================================================
  // Gestion Souris & Toucher
  const getCoords = (e: any) => {
      const canvas = signatureCanvasRef.current;
      if(!canvas) return {x:0, y:0};
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const ctx = signatureCanvasRef.current?.getContext('2d');
    if (ctx) { 
        ctx.lineWidth = 2; 
        ctx.strokeStyle = "#000"; 
        const {x,y} = getCoords(e);
        ctx.beginPath(); ctx.moveTo(x, y); 
    }
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const ctx = signatureCanvasRef.current?.getContext('2d');
    if (ctx) { 
        const {x,y} = getCoords(e);
        ctx.lineTo(x, y); ctx.stroke(); 
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (signatureCanvasRef.current) {
       // Sauvegarde base64
       setUserInfo(prev => ({ ...prev, signature: signatureCanvasRef.current!.toDataURL() }));
    }
  };
  
  const clearSignature = () => {
      const canvas = signatureCanvasRef.current;
      if(canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          setUserInfo(prev => ({...prev, signature: null}));
      }
  };


  // ===========================================================================
  // 4. LOGIQUE DE SOUMISSION FINAL (ENREGISTREMENT API)
  // ===========================================================================
  const handleSubmitDeposit = async () => {
      console.group("🚀 [DEPOT] Tentative d'enregistrement");

      // 1. Validations de base
      if (!myRelayId) {
          console.error("Relay ID Manquant");
          setError("Point relais non identifié. Relancez la page.");
          console.groupEnd();
          return;
      }
      if (!selectedShipment) return;

      // 2. Validation Formulaire
      if (!userInfo.fullName.trim() || !userInfo.phone.trim()) {
          alert("Le nom et téléphone du déposant sont obligatoires.");
          console.groupEnd();
          return;
      }
      if (!userInfo.signature) {
          alert("La signature du client est obligatoire pour valider le dépôt.");
          console.groupEnd();
          return;
      }

      // 3. Validation Paiement (si nécessaire)
      // Si pas payé en ligne ET que l'agent n'a pas coché 'payé' manuellement
      if (!selectedShipment.is_paid_at_departure && !isPaymentCollected) {
          // Si le coût est > 0, on exige le paiement
          if (selectedShipment.shipping_cost > 0) {
              alert(`Le colis n'est pas payé. Veuillez encaisser ${selectedShipment.shipping_cost.toLocaleString()} FCFA et valider le paiement.`);
              console.groupEnd();
              return;
          }
      }

      setIsSubmitting(true);
      setError(null);

      try {
          console.log("📦 Données à envoyer :", {
              relayId: myRelayId,
              packageId: selectedShipment.id,
              depositor: userInfo
          });

                    // 1. TRAITEMENT DU PAIEMENT
          let payStatusLabel = "DEJA PAYÉ";

          if (!selectedShipment.is_paid_at_departure) {
              // Cas POSTPAID (Paiement comptoir)
              if (!isPaymentCollected && selectedShipment.shipping_cost > 0) {
                  throw new Error("Paiement non validé par l'agent.");
              }
              
              console.log("💸 Traitement paiement API...");
              // Appel Route : POST /api/payments/process/{id}
              await packageService.processPayment(selectedShipment.id, {
                  paymentMethod: "CASH", 
                  paymentType: "POSTPAID" 
              });
              payStatusLabel = "PAYÉ COMPTANT (POSTPAID)";
          } else {
              payStatusLabel = "PREPAID (En Ligne)";
          }

          // 4. Appel API Backend pour réceptionner le colis
          // Route: POST /api/relay-points/{relayId}/packages/{packageId}/receive
          // (Le backend gère le changement de statut -> AT_DEPARTURE_RELAY_POINT)
          const result = await relayPointService.receivePackage(myRelayId, selectedShipment.id);
           // 3. GÉNÉRATION BORDEREAU PDF
          await generateDepositPDF(selectedShipment, myRelayId, userInfo, payStatusLabel);
          toast.success("Colis Réceptionné et Actif au Relais !");
          console.log("✅ API Success:", result);
          
          // Affichage succès
          setSuccessMsg(`Colis ${selectedShipment.tracking_number} enregistré en stock !`);
          setStep('SUCCESS');

          // Callback succès parent
          if (onSuccess) onSuccess();

      } catch (err: any) {
          console.error("❌ API Error:", err);
          // Affichage erreur utilisateur
          let message = err.message || "Erreur lors de l'enregistrement.";
          if (err.message && err.message.includes('404')) message = "Ressource introuvable (Colis ou Relais).";
          setError(message);
      } finally {
          setIsSubmitting(false);
          console.groupEnd();
      }
  };

  // --- HELPERS VISUELS ---
  const getStatusBadge = () => {
      if(!selectedShipment) return null;
      const paid = selectedShipment.is_paid_at_departure || isPaymentCollected;
      if(paid) return <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded border border-green-200 flex items-center gap-1"><SolidCheckCircleIcon className="w-4 h-4"/> PAYÉ</span>
      return <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded border border-red-200 flex items-center gap-1"><ExclamationTriangleIcon className="w-4 h-4"/> NON PAYÉ</span>
  };


  // ===========================================================================
  // 5. VUES (JSX)
  // ===========================================================================

  // A. Menu Principal (Choix New vs Existant)
  const renderMenu = () => (
      <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-in zoom-in-95">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white text-center">Opération de Dépôt</h2>
          
          <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl px-4">
              {/* NOUVEAU COLIS */}
              <button 
                 onClick={() => setViewMode('NEW')}
                 className="flex flex-col items-center p-8 bg-orange-50 dark:bg-slate-800 rounded-3xl border-2 border-orange-200 hover:border-orange-500 transition-all hover:shadow-xl group text-center"
              >
                  <div className="bg-orange-500 text-white p-5 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-md">
                      <PlusIcon className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-orange-800 dark:text-orange-400 mb-2">Créer Nouveau Colis</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                      Le client n'a pas d'étiquette. Enregistrez les détails et générez le tracking ici.
                  </p>
              </button>

              {/* COLIS EXISTANT */}
              <button 
                 onClick={() => { setViewMode('EXISTING'); setStep('DETAILS'); }}
                 className="flex flex-col items-center p-8 bg-blue-50 dark:bg-slate-800 rounded-3xl border-2 border-blue-200 hover:border-blue-500 transition-all hover:shadow-xl group text-center"
              >
                  <div className="bg-blue-500 text-white p-5 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-md">
                      <MagnifyingGlassIcon className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-800 dark:text-blue-400 mb-2">Colis Existant</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                      Le client a un numéro de suivi. Scannez ou entrez le code pour valider la réception.
                  </p>
              </button>
          </div>
      </div>
  );

  // B. Recherche & Affichage Détails (Mode Existant)
  const renderSearchAndDetails = () => (
      <div className="max-w-3xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom-5">
          
          {/* Barre de recherche */}
          <div className="relative mb-8">
              <input 
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="SCANNEZ OU ENTREZ LE SUIVI (Ex: PND...)"
                  className="w-full py-4 pl-12 pr-32 text-lg bg-white dark:bg-slate-900 border-2 border-gray-300 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all outline-none text-gray-800 dark:text-white font-mono shadow-sm uppercase tracking-wide"
                  autoFocus
              />
              <MagnifyingGlassIcon className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"/>
              <button 
                  onClick={() => handleSearch()}
                  disabled={isSearching || !searchQuery.trim()}
                  className="absolute right-2 top-2 bottom-2 bg-slate-900 dark:bg-orange-600 hover:bg-slate-800 text-white px-6 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center"
              >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin"/> : "Rechercher"}
              </button>
          </div>

          {/* Affichage Erreur */}
          {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded-r-xl flex items-center gap-3 shadow-sm animate-shake">
                  <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0"/>
                  <span className="font-medium">{error}</span>
              </div>
          )}

          {/* Carte Détail Colis Trouvé */}
          {selectedShipment && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                   
                   {/* Ticket Header */}
                   <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="bg-white p-2 rounded-lg border shadow-sm"><Package className="w-8 h-8 text-orange-600"/></div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white font-mono tracking-tight">{selectedShipment.tracking_number}</h2>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Colis Standard • {new Date(selectedShipment.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div>{getStatusBadge()}</div>
                   </div>

                   <div className="p-8">
                        {/* Informations Trajet */}
                        <div className="grid md:grid-cols-2 gap-8 mb-8 relative">
                            {/* Ligne de séparation verticale déco */}
                            <div className="hidden md:block absolute top-2 bottom-2 left-1/2 w-px bg-gray-200 dark:bg-slate-700 transform -translate-x-1/2"></div>
                            
                            <div className="space-y-1">
                                <p className="text-xs text-gray-400 uppercase font-bold">De (Expéditeur)</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-white">{selectedShipment.sender_name}</p>
                                <p className="text-sm text-gray-500">{selectedShipment.sender_phone}</p>
                            </div>
                            
                            <div className="space-y-1 md:text-right">
                                <p className="text-xs text-gray-400 uppercase font-bold">Pour (Destinataire)</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-white">{selectedShipment.recipient_name}</p>
                                <p className="text-sm text-gray-500">Tel non affiché</p>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-slate-700/50 rounded-xl border border-blue-100 dark:border-slate-600 mb-8">
                             <div className="flex gap-3">
                                 <Clock className="w-5 h-5 text-blue-500 mt-0.5"/>
                                 <div>
                                     <p className="text-sm text-blue-800 dark:text-blue-300 font-semibold">Contenu & Note</p>
                                     <p className="text-sm text-slate-600 dark:text-slate-300 italic">{selectedShipment.description}</p>
                                 </div>
                             </div>
                        </div>

                        <button 
                           onClick={() => setStep('USER_FORM')}
                           className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-orange-200 dark:shadow-none transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                           Continuer le Dépôt <ArrowLeft className="w-5 h-5 rotate-180"/>
                        </button>
                   </div>
              </div>
          )}
      </div>
  );

  // C. Formulaire Final (Paiement & Signature)
  const renderUserForm = () => {
      const needsPayment = (!selectedShipment?.is_paid_at_departure);
      const amountToPay = selectedShipment?.shipping_cost || 0;
      
      // Validation locale paiement
      const canValidatePayment = amountToPay > 0 ? (Number(paymentAmount) >= amountToPay) : true;

      return (
        <div className="max-w-2xl mx-auto mt-6 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in">
            <div className="p-6 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-3">
                 <DocumentArrowDownIcon className="w-6 h-6 text-orange-500"/>
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white">Validation du Dépôt</h3>
            </div>

            <div className="p-8 space-y-8">
                 
                 {/* MODULE DE PAIEMENT (Si non payé) */}
                 {needsPayment && (
                     <div className={`p-5 rounded-2xl border-2 transition-all ${isPaymentCollected ? 'bg-green-50 border-green-500 dark:bg-green-900/20' : 'bg-red-50 border-red-200 dark:bg-red-900/20'}`}>
                         <div className="flex justify-between items-center mb-4">
                             <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                 <BanknotesIcon className="w-5 h-5"/> Paiement Requis
                             </h4>
                             <span className="text-xl font-black text-slate-900 dark:text-white">{amountToPay.toLocaleString()} F</span>
                         </div>
                         
                         {!isPaymentCollected ? (
                             <div className="flex gap-3">
                                 <div className="relative flex-1">
                                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">FCFA</span>
                                     <input 
                                         type="number" 
                                         className="w-full pl-14 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                                         placeholder="Montant reçu..."
                                         value={paymentAmount}
                                         onChange={e => setPaymentAmount(e.target.value)}
                                     />
                                 </div>
                                 <button 
                                    onClick={() => setIsPaymentCollected(canValidatePayment)}
                                    disabled={!canValidatePayment}
                                    className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-black transition"
                                 >
                                     Valider Paiement
                                 </button>
                             </div>
                         ) : (
                             <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                                 <CheckCircleIcon className="w-5 h-5"/> Montant encaissé avec succès.
                                 <button onClick={() => setIsPaymentCollected(false)} className="text-xs underline ml-2 font-normal">Modifier</button>
                             </div>
                         )}
                     </div>
                 )}

                 {/* FORMULAIRE INFOS DÉPOSANT */}
                 <div className="space-y-5">
                     <h4 className="text-sm font-bold text-gray-500 uppercase border-b pb-2">Informations du Déposant</h4>
                     <div className="grid md:grid-cols-2 gap-5">
                         <div>
                             <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block">Nom Complet</label>
                             <div className="relative">
                                 <UserIcon className="w-4 h-4 absolute left-3 top-3.5 text-gray-400"/>
                                 <input 
                                     type="text" 
                                     className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-600 rounded-xl font-semibold focus:ring-2 focus:ring-orange-500 outline-none transition"
                                     value={userInfo.fullName}
                                     onChange={e => setUserInfo({...userInfo, fullName: e.target.value})}
                                 />
                             </div>
                         </div>
                         <div>
                             <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block">Téléphone</label>
                             <div className="relative">
                                 <PhoneIcon className="w-4 h-4 absolute left-3 top-3.5 text-gray-400"/>
                                 <input 
                                     type="tel" 
                                     className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-600 rounded-xl font-semibold focus:ring-2 focus:ring-orange-500 outline-none transition"
                                     value={userInfo.phone}
                                     onChange={e => setUserInfo({...userInfo, phone: e.target.value})}
                                 />
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* SIGNATURE CANVAS */}
                 <div className="space-y-2">
                      <div className="flex justify-between items-end">
                          <label className="text-xs font-bold text-gray-500 uppercase">Signature Client</label>
                          {userInfo.signature && <button onClick={clearSignature} className="text-xs text-red-500 hover:underline">Effacer</button>}
                      </div>
                      <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl h-40 bg-white relative overflow-hidden cursor-crosshair touch-none">
                          <canvas 
                             ref={signatureCanvasRef}
                             width={600} height={160}
                             className="w-full h-full"
                             onMouseDown={startDrawing} 
                             onMouseMove={draw} 
                             onMouseUp={stopDrawing} 
                             onMouseLeave={stopDrawing}
                             onTouchStart={startDrawing}
                             onTouchMove={draw}
                             onTouchEnd={stopDrawing}
                          />
                          {!isDrawing && !userInfo.signature && (
                              <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none select-none font-bold text-lg">
                                  Signez ici
                              </div>
                          )}
                      </div>
                 </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="p-6 bg-gray-50 dark:bg-slate-900 border-t dark:border-slate-700 flex gap-4">
                 <button 
                     onClick={() => setStep('DETAILS')} 
                     className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                 >
                     Retour
                 </button>
                 <button 
                     onClick={handleSubmitDeposit}
                     disabled={
                         isSubmitting || 
                         !userInfo.fullName || 
                         !userInfo.phone || 
                         !userInfo.signature || 
                         (needsPayment && !isPaymentCollected)
                     }
                     className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2"
                 >
                     {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <DocumentArrowDownIcon className="w-5 h-5"/>}
                     Valider la Réception
                 </button>
            </div>
        </div>
      );
  };

  const renderSuccess = () => (
      <div className="flex flex-col items-center justify-center h-[60vh] px-4 animate-in zoom-in duration-500">
           <div className="bg-green-100 text-green-600 w-24 h-24 rounded-full flex items-center justify-center shadow-xl mb-6 animate-bounce">
               <SolidCheckCircleIcon className="w-14 h-14" />
           </div>
           <h2 className="text-3xl font-black text-slate-800 dark:text-white text-center mb-2">Succès !</h2>
           <p className="text-gray-500 dark:text-gray-300 text-center mb-8 text-lg max-w-md">
               Le colis <strong>{selectedShipment?.tracking_number}</strong> a été marqué comme <span className="text-orange-500 font-bold">Reçu au Dépôt</span>.
               {successMsg && <span className="block text-xs mt-2 text-green-600">{successMsg}</span>}
           </p>
           <div className="flex gap-4">
               <button onClick={() => {
                   setStep('DETAILS');
                   setViewMode('MENU'); 
                   setSearchQuery('');
                   setSelectedShipment(null);
                   if(onSuccess) onSuccess(); 
               }} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-xl hover:bg-slate-300 transition">
                   Menu Principal
               </button>
               
               <button onClick={() => {
                   setStep('DETAILS');
                   setSearchQuery('');
                   setSelectedShipment(null);
                   setIsPaymentCollected(false);
                   setUserInfo({fullName: '', phone: '', signature: null});
                   // Re-focus search si possible
               }} className="px-6 py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700 transition">
                   Traiter un autre colis
               </button>
           </div>
      </div>
  );


  // ===========================================================================
  // 6. RENDER PRINCIPAL (Switch de vues)
  // ===========================================================================
  return (
      <div className="min-h-screen bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-900 dark:to-black text-slate-800 dark:text-gray-100 font-sans transition-colors">
          
          {/* Header de Navigation Interne */}
          <div className="max-w-5xl mx-auto p-6 flex justify-between items-center">
               {/* Bouton Retour Contextuel */}
               {viewMode !== 'MENU' ? (
                   <button 
                       onClick={() => viewMode === 'NEW' ? setViewMode('MENU') : (step === 'DETAILS' ? setViewMode('MENU') : setStep('DETAILS'))} 
                       className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-600 transition-colors"
                   >
                       <ArrowLeftIcon className="w-4 h-4" /> Retour
                   </button>
               ) : (
                   <div className="w-10"></div> // Spacer
               )}
               
               {/* Titre Contextuel */}
               <div className="flex flex-col items-center">
                   <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
                       {viewMode === 'NEW' ? 'Nouveau Dépôt' : viewMode === 'EXISTING' ? 'Réception Colis' : 'Module Dépôt'}
                   </h1>
                   {myRelayId && <span className="text-[10px] text-green-500 uppercase font-bold bg-green-50 dark:bg-green-900/20 px-2 rounded-full mt-1">Relais Connecté</span>}
               </div>
               
               {/* Close Global */}
               <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 shadow-sm rounded-full hover:bg-gray-100 text-gray-500 transition">
                   <XMarkIcon className="w-5 h-5"/>
               </button>
          </div>

          {/* Corps de Page avec Transitions */}
          <AnimatePresence mode="wait">
               {viewMode === 'MENU' && (
                   <motion.div key="menu" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                       {renderMenu()}
                   </motion.div>
               )}

               {viewMode === 'EXISTING' && (
                   <motion.div key="existing" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="px-4 pb-20">
                        {step === 'DETAILS' && renderSearchAndDetails()}
                        {step === 'USER_FORM' && renderUserForm()}
                        {step === 'SUCCESS' && renderSuccess()}
                   </motion.div>
               )}

               {viewMode === 'NEW' && (
                   <motion.div key="new" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="px-4 pb-20 max-w-6xl mx-auto">
                        {/* Integration "iFrame-like" du composant d'expédition */}
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-3xl shadow-xl overflow-hidden relative min-h-[600px]">
                             <div className="absolute inset-0 overflow-auto custom-scrollbar">
                                 <ShippingPage />
                             </div>
                        </div>
                   </motion.div>
               )}
          </AnimatePresence>
      </div>
  );
};
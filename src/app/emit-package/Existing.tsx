// app/envoyer/ProcessExistingPackage.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { QrCodeIcon, MagnifyingGlassIcon, CheckCircleIcon, BanknotesIcon, ArrowUturnLeftIcon, TruckIcon, InformationCircleIcon, UserCircleIcon, MapPinIcon, PhoneIcon, CubeIcon, ScaleIcon, ShieldCheckIcon, ClockIcon, XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';
import { Package, Sparkles, AlertTriangle, Send } from 'lucide-react';

interface ExistingPackageInfo {
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
  status: 'En attente de dépôt' | 'En attente de paiement au dépôt' | 'Paiement par destinataire' | 'Déposé'; // Ajout 'Paiement par destinataire'
  amountDueAtDeposit?: number;
}

interface ProcessExistingPackageProps {
  onBackToSelection: () => void;
}

// Définir à nouveau l'interface Parcel pour type-safety lors de la mise à jour du localStorage
// pour garantir la correspondance des données.
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
const INVENTORY_STORAGE_KEY = 'inventory_parcels'; // Utiliser la même clé que dans InventoryPage

const ProcessExistingPackage: React.FC<ProcessExistingPackageProps> = ({ onBackToSelection }) => {
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [packageInfo, setPackageInfo] = useState<ExistingPackageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amountReceived, setAmountReceived] = useState('');
  const [changeToGive, setChangeToGive] = useState<number | null>(null);
  const [paymentValidated, setPaymentValidated] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanAnimation, setScanAnimation] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Ce useEffect s'exécute une seule fois au montage pour vérifier s'il faut pré-remplir
  useEffect(() => {
    const prefillId = localStorage.getItem('prefill_package_id');
    if (prefillId) {
      setSearchInput(prefillId);
      // Lancer la recherche automatiquement
      handleSearchPackage(prefillId);
      // Nettoyer pour que ça ne se reproduise pas si l'utilisateur navigue ailleurs
      localStorage.removeItem('prefill_package_id');
    }
  }, []); // Le tableau vide [] signifie "exécuter une seule fois après le premier rendu"

  useEffect(() => {
    if (isScanning) {
      const intervalId = setInterval(() => setScanAnimation(prev => (prev + 5) % 100), 50);
      return () => clearInterval(intervalId);
    }
  }, [isScanning]);

  const decodeQRFromCanvas = (): string | null => {
    if (!videoRef.current || !canvasRef.current || !videoRef.current.videoWidth || !videoRef.current.videoHeight) return null;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const video = videoRef.current;
    if (!context) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      // const imageData = context.getImageData(0, 0, canvas.width, canvas.height); // Pour une vraie lib de QR
      const mockDetection = Math.random() > 0.85;
      if (mockDetection) {
        const mockCodes = ['PAY123ABC', 'DEPOT456DEF', 'PDLPAYXYZ', 'CX789PAY', 'PDL169AZE'];
        return mockCodes[Math.floor(Math.random() * mockCodes.length)];
      }
    } catch (e) { console.error("Canvas draw error:", e); return null; }
    return null;
  };

  const startScanInterval = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    scanIntervalRef.current = setInterval(() => {
      if (!isScanning || !streamRef.current) { if(scanIntervalRef.current) clearInterval(scanIntervalRef.current); return; }
      const detectedCode = decodeQRFromCanvas();
      if (detectedCode) {
        setSearchInput(detectedCode.toUpperCase());
        handleStopScan(true);
        if(scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        setTimeout(() => handleSearchPackage(detectedCode.toUpperCase()), 200);
      }
    }, 700);
  };

  const handleScanQRCode = async () => {
    setIsScanning(true); setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 360 }, height: { ideal: 360 } } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        startScanInterval();
        setTimeout(() => {
          if (isScanning && streamRef.current) {
            if(scanIntervalRef.current) clearInterval(scanIntervalRef.current);
            handleStopScan();
            if (!packageInfo) setError("Aucun QR code détecté. Réessayez ou saisissez manuellement.");
          }
        }, 15000); // Réduit à 15s pour un test plus rapide
      }
    } catch (err) { /* ... gestion d'erreur caméra ... */ 
        console.error("Erreur caméra:", err);
        let msg = "Impossible d'accéder à la caméra. ";
        if (err instanceof DOMException) {
            if (err.name === "NotAllowedError") msg += "Veuillez autoriser l'accès.";
            else if (err.name === "NotFoundError") msg += "Aucune caméra trouvée.";
            else msg += "Erreur technique.";
        }
        setError(msg);
        setIsScanning(false);
    }
  };

  const handleStopScan = (codeFound = false) => {
    if (scanIntervalRef.current) { clearInterval(scanIntervalRef.current); scanIntervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; if (videoRef.current) videoRef.current.srcObject = null; }
    setIsScanning(false); setScanAnimation(0);
    if (!codeFound && !packageInfo) { /* Optionnel: setError("Scan arrêté."); */ }
  };

  useEffect(() => { // Nettoyage
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  const handleSearchPackage = async (value?: string) => {
    const query = (value || searchInput).toUpperCase();
    if (!query.trim()) { setError('Numéro de suivi requis.'); return; }
    
    setIsLoading(true); setError(null); setPackageInfo(null); setPaymentValidated(false);
    setAmountReceived(''); setChangeToGive(null); setShowSuccessMessage(null);
    if (value && searchInput !== value) setSearchInput(value);

    await new Promise(resolve => setTimeout(resolve, 1200)); // Simulation API

    if (query === 'PAY123ABC') { // Scénario: Paiement attendu au dépôt
      setPackageInfo({
        trackingNumber: query, senderName: 'Alice Mbarga', senderPhone: '+237 699000001',
        recipientName: 'Bob Nkomo', recipientPhone: '+237 677000002',
        departurePointName: 'Relais Mvan', arrivalPointName: 'Relais Bonamoussadi',
        packageDescription: 'Documents importants', packageWeight: '2.5',
        isFragile: false, isPerishable: false, isInsured: true, declaredValue: '25000',
        status: 'En attente de paiement au dépôt', amountDueAtDeposit: 7500,
      });
    } else if (query === 'PDLPAYXYZ') { // Scénario: Colis déjà payé en ligne
       setPackageInfo({
        trackingNumber: query, senderName: 'Eve Payeur', senderPhone: '+237 650123456',
        recipientName: 'Frank Destin', recipientPhone: '+237 670654321',
        departurePointName: 'Relais Logpom', arrivalPointName: 'Relais Deido',
        packageDescription: 'Électronique fragile', packageWeight: '1.8',
        isFragile: true, isPerishable: false, isInsured: true, declaredValue: '150000',
        status: 'En attente de dépôt', amountDueAtDeposit: 0, // Déjà payé
      });
    } else if (query === 'PKD-92384') { // Scénario: Colis déjà payé en ligne
       setPackageInfo({
        trackingNumber: query, senderName: 'Eve Payeur', senderPhone: '+237 650123456',
        recipientName: 'Frank Destin', recipientPhone: '+237 670654321',
        departurePointName: 'Relais Logpom', arrivalPointName: 'Relais Deido',
        packageDescription: 'Électronique fragile', packageWeight: '1.8',
        isFragile: true, isPerishable: false, isInsured: true, declaredValue: '150000',
        status: 'En attente de dépôt', amountDueAtDeposit: 0, // Déjà payé
      });
    } else if (query === 'PKD-58271') { // Scénario: Colis déjà payé en ligne
       setPackageInfo({
        trackingNumber: query, senderName: 'Eve Payeur', senderPhone: '+237 650123456',
        recipientName: 'Frank Destin', recipientPhone: '+237 670654321',
        departurePointName: 'Relais Logpom', arrivalPointName: 'Relais Deido',
        packageDescription: 'Électronique fragile', packageWeight: '1.8',
        isFragile: true, isPerishable: false, isInsured: true, declaredValue: '150000',
        status: 'En attente de dépôt', amountDueAtDeposit: 0, // Déjà payé
      });
    } else if (query === 'CX789PAY') { // Scénario: Paiement par le destinataire
       setPackageInfo({
        trackingNumber: query, senderName: 'Grace Expéditeur', senderPhone: '+237 660987654',
        recipientName: 'Henri Bénéficiaire', recipientPhone: '+237 680123789',
        departurePointName: 'Relais Biyem-Assi', arrivalPointName: 'Relais Akwa',
        packageDescription: 'Cadeau d\'anniversaire', packageWeight: '0.5',
        isFragile: true, isPerishable: true, isInsured: false,
        status: 'Paiement par destinataire', amountDueAtDeposit: 0, // L'expéditeur ne paie rien ici
      });
    } else if (query.includes('DEPOT')) { // Colis standard à déposer
       setPackageInfo({
        trackingNumber: query, senderName: 'Charles Fotso', senderPhone: '+237 655000003',
        recipientName: 'Diana Kouam', recipientPhone: '+237 688000004',
        departurePointName: 'Relais Omnisport', arrivalPointName: 'Relais Makepe',
        packageDescription: 'Vêtements pour enfants', packageWeight: '1.2',
        isFragile: true, isPerishable: false, isInsured: false,
        status: 'En attente de dépôt', amountDueAtDeposit: 0,
      });
    } else {
      setError(`❌ Aucun colis trouvé pour le N° : ${query}`);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (packageInfo?.amountDueAtDeposit && packageInfo.amountDueAtDeposit > 0) {
      const due = packageInfo.amountDueAtDeposit;
      const received = parseFloat(amountReceived);
      if (!isNaN(received) && received >= due) setChangeToGive(received - due);
      else setChangeToGive(null);
    } else setChangeToGive(null);
  }, [amountReceived, packageInfo]);

  const handleValidatePayment = () => {
    if (packageInfo?.amountDueAtDeposit && parseFloat(amountReceived) >= packageInfo.amountDueAtDeposit) {
      setPaymentValidated(true);
      setShowSuccessMessage(`Paiement de ${packageInfo.amountDueAtDeposit.toLocaleString()} FCFA validé ! Monnaie : ${changeToGive !== null ? changeToGive.toLocaleString() : 0} FCFA.`);
      setTimeout(() => setShowSuccessMessage(null), 3500);
    } else { setError("⚠️ Montant reçu insuffisant."); setTimeout(() => setError(null), 3000); }
  };
  
  // MODIFIÉ : La logique est étendue pour inclure l'ajout de nouveaux colis
  const handleFinalizeDeposit = () => {
    // 1. Vérifier qu'on a bien les informations du colis à traiter
    if (!packageInfo) return;

    // 2. Récupérer l'inventaire actuel depuis le localStorage
    const masterParcelsJSON = localStorage.getItem(INVENTORY_STORAGE_KEY);
    // S'il n'y a rien, on part d'un tableau vide
    let masterParcels: Parcel[] = masterParcelsJSON ? JSON.parse(masterParcelsJSON) : [];

    // 3. Chercher si un colis avec cet ID existe déjà
    const existingPackageIndex = masterParcels.findIndex(p => p.id === packageInfo.trackingNumber);

    if (existingPackageIndex !== -1) {
      // ---- LOGIQUE DE MISE À JOUR (Le colis existe déjà) ----
      // On met à jour le statut du colis existant.
      masterParcels[existingPackageIndex] = {
        ...masterParcels[existingPackageIndex],
        status: 'Reçu',
        // On pourrait aussi mettre à jour la date d'arrivée si ce cas de figure est possible
        arrivalDate: new Date().toISOString(), 
      };
       setShowSuccessMessage(`Statut du colis ${packageInfo.trackingNumber} mis à jour à "Reçu" !`);

    } else {
      // ---- LOGIQUE D'INSERTION (Le colis est nouveau pour l'inventaire) ----
      // Créer un nouvel objet Parcel en mappant les champs de ExistingPackageInfo
      const newParcel: Parcel = {
        id: packageInfo.trackingNumber,
        status: 'Reçu', // Statut final après le dépôt
        type: packageInfo.isInsured || packageInfo.isFragile ? 'Express' : 'Standard', // On peut inférer le type
        arrivalDate: new Date().toISOString(), // La date de dépôt est la date d'arrivée
        withdrawalDate: undefined, // Pas encore retiré
        location: 'RECEPT-01', // Un emplacement par défaut pour les nouveaux dépôts
        designation: packageInfo.packageDescription,
        sender: {
          name: packageInfo.senderName,
          phone: packageInfo.senderPhone,
          originAddress: packageInfo.departurePointName,
        },
        recipient: {
          name: packageInfo.recipientName,
          phone: packageInfo.recipientPhone,
          deliveryAddress: packageInfo.arrivalPointName,
        },
      };

      // Ajouter le nouveau colis à notre inventaire
      masterParcels.push(newParcel);
      setShowSuccessMessage(`Colis ${packageInfo.trackingNumber} ajouté à l'inventaire !`);
    }

    // 4. Sauvegarder la liste mise à jour (soit modifiée, soit augmentée)
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(masterParcels));
    
    // 5. Réinitialiser l'interface utilisateur après un court délai
    setTimeout(() => {
      setPackageInfo(null);
      setSearchInput('');
      setPaymentValidated(false);
      setAmountReceived('');
      setShowSuccessMessage(null);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4">
      <div className="w-full max-w-3xl mx-auto"> {/* Max-width réduit pour compacité */}
        <div className="mb-6">
          <button onClick={onBackToSelection} className="mb-4 group flex items-center text-green-600 hover:text-green-700 transition-colors text-sm">
            <ArrowUturnLeftIcon className="w-4 h-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
            Retour
          </button>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-3 shadow-md">
              <Package className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Traitement Colis Existant</h1>
            <p className="text-sm text-gray-500">Recherchez et gérez les dépôts de colis.</p>
          </div>
        </div>

        {!packageInfo && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6 animate-fadeIn">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                    placeholder="N° de suivi (ex: PDL123ABC)"
                    className="w-full pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm transition-all"
                  />
                  {searchInput && (
                    <button onClick={() => setSearchInput('')} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleSearchPackage()}
                  disabled={isLoading || !searchInput.trim()}
                  className="btn-primary text-sm py-2.5 px-5 w-full sm:w-auto"
                >
                  {isLoading ? <><div className="spinner-sm mr-2"></div>Recherche...</> : <><MagnifyingGlassIcon className="w-4 h-4 mr-1.5" />Vérifier</>}
                </button>
              </div>
              <div className="separator-text text-xs">OU</div>
              <button
                onClick={handleScanQRCode} disabled={isLoading || isScanning}
                className="btn-secondary border-gray-600 text-gray-700 hover:bg-gray-100 w-full text-sm py-2.5"
              >
                {isScanning ? <><div className="spinner-sm mr-2"></div>Scan en cours...</> : <><QrCodeIcon className="w-5 h-5 mr-1.5" />Scanner Bordereau</>}
              </button>
            </div>
          </div>
        )}
        
        {isScanning && (
          <div className="bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4 mb-6 animate-fadeIn">
            <p className="text-center text-gray-300 text-xs mb-2">Positionnez le QR code dans le cadre</p>
            <div className="relative max-w-[280px] mx-auto aspect-square bg-black rounded-md overflow-hidden">
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              <div className="scanner-overlay">
                <div className="scanner-line" style={{ top: `${scanAnimation}%` }}></div>
              </div>
            </div>
            <button onClick={() => handleStopScan()} className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-md font-medium text-xs transition-colors">
              <XMarkIcon className="w-4 h-4 inline mr-1" /> Arrêter Scan
            </button>
          </div>
        )}

        {isLoading && !packageInfo && (
          <div className="loading-state"><div className="spinner-lg"></div><p>Vérification du colis <span className="font-medium text-green-600">{searchInput}</span>...</p></div>
        )}
        {error && <div className="error-message"><AlertTriangle className="w-5 h-5 mr-2" />{error}</div>}
        {showSuccessMessage && <div className="success-message"><CheckCircleIcon className="w-5 h-5 mr-2" />{showSuccessMessage}</div>}

        {packageInfo && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className={`p-4 text-white ${
                packageInfo.status === 'En attente de paiement au dépôt' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : // Vert pour paiement
                packageInfo.status === 'Paiement par destinataire' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : // Violet pour paiement destinataire
                'bg-gradient-to-r from-green-600 to-teal-700' // Vert plus foncé pour autres
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Colis {packageInfo.trackingNumber}</h3>
                    <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full">{packageInfo.status}</span>
                  </div>
                  <Package className="w-8 h-8 opacity-80" />
                </div>
              </div>

              <div className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                  <div><strong className="text-gray-500">Exp:</strong> {packageInfo.senderName} ({packageInfo.senderPhone})</div>
                  <div><strong className="text-gray-500">Dest:</strong> {packageInfo.recipientName} ({packageInfo.recipientPhone})</div>
                  <div><strong className="text-gray-500">Départ:</strong> {packageInfo.departurePointName}</div>
                  <div><strong className="text-gray-500">Arrivée:</strong> {packageInfo.arrivalPointName}</div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p><strong className="text-gray-500">Desc:</strong> {packageInfo.packageDescription}</p>
                  <p><strong className="text-gray-500">Poids:</strong> {packageInfo.packageWeight} kg
                    {packageInfo.isFragile && <span className="tag-package-sm bg-green-100 text-green-700 ml-2">Fragile</span>}
                    {packageInfo.isPerishable && <span className="tag-package-sm bg-green-100 text-green-700 ml-2">Périssable</span>}
                    {packageInfo.isInsured && <span className="tag-package-sm bg-green-100 text-green-700 ml-2">Assuré ({parseFloat(packageInfo.declaredValue || '0').toLocaleString()} FCFA)</span>}
                  </p>
                </div>
              </div>
            </div>

            {packageInfo.status === 'En attente de paiement au dépôt' && packageInfo.amountDueAtDeposit != null && packageInfo.amountDueAtDeposit > 0 && !paymentValidated && (
              <div className="bg-white rounded-xl shadow-lg border-l-4 border-green-500 p-4 space-y-3">
                 <h3 className="text-md font-semibold text-green-700 flex items-center"><BanknotesIcon className="w-5 h-5 mr-1.5" /> Paiement Requis</h3>
                <p className="text-center text-gray-600 text-sm">Montant à payer: <strong className="text-2xl text-green-600 ml-1">{packageInfo.amountDueAtDeposit.toLocaleString()} FCFA</strong></p>
                <div>
                    <label htmlFor="amountReceived" className="block text-xs font-medium text-gray-600 mb-0.5">Montant reçu (FCFA)</label>
                    <input type="number" id="amountReceived" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} placeholder="0"
                           className="w-full py-2 px-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm text-center"/>
                </div>
                {changeToGive !== null && changeToGive >= 0 && (
                    <p className="text-center text-green-700 text-sm">Monnaie: <strong className="text-md">{changeToGive.toLocaleString()} FCFA</strong></p>
                )}
                <button onClick={handleValidatePayment}
                        disabled={!amountReceived || parseFloat(amountReceived) < packageInfo.amountDueAtDeposit}
                        className="w-full btn-primary bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-sm py-2">
                    <CheckCircleIcon className="w-4 h-4 mr-1" /> Valider Paiement
                </button>
              </div>
            )}
            
            {paymentValidated && packageInfo.status === 'En attente de paiement au dépôt' && (
              <div className="success-message text-sm"><CheckCircleIcon className="w-4 h-4 mr-1" />Paiement validé !</div>
            )}

            {/* Cas où le colis est déjà payé en ligne ou paiement par destinataire */}
            {(packageInfo.status === 'En attente de dépôt' || packageInfo.status === 'Paiement par destinataire') && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto mb-1"/>
                    <p className="text-sm font-medium text-green-700">
                        {packageInfo.status === 'Paiement par destinataire' ? 
                            'Ce colis sera payé par le destinataire à la réception.' :
                            'Ce colis est déjà payé  par l expéditeur.'
                        }
                    </p>
                    <p className="text-xs text-green-600">Aucun paiement requis de l'expéditeur au dépôt.</p>
                </div>
            )}


            <button onClick={handleFinalizeDeposit}
                    disabled={ (packageInfo.status === 'En attente de paiement au dépôt' && !paymentValidated) || isLoading }
                    className="w-full btn-primary bg-green-600 hover:bg-green-700 text-md py-2.5 group disabled:opacity-60">
              <Send className="w-5 h-5 mr-1.5 group-hover:animate-pulse" />
              Confirmer Dépôt du Colis
              <Sparkles className="w-5 h-5 ml-1.5 text-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        )}
      </div>
      <style jsx global>{`
        .tag-package-sm { display: inline-flex; align-items: center; padding: 0.15rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; }
        @keyframes bounceIn { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); } }
        .animate-bounceIn { animation: bounceIn 0.5s ease-out forwards; }
        .spinner-sm { width: 1rem; height: 1rem; border-width: 2px; border-style: solid; border-radius: 9999px; animation: spin 1s linear infinite; border-color: white; border-top-color: transparent; }
        .spinner-lg { width: 2rem; height: 2rem; border-width: 3px; border-style: solid; border-radius: 9999px; animation: spin 1s linear infinite; border-color: #a7f3d0; border-top-color: #10b981; } /* emerald-200 et emerald-500 */
        .loading-state { background-color: white; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; padding: 2rem; margin-bottom: 1.5rem; text-align: center; animation: fadeIn 0.3s ease-out; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
        .error-message { background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 0.75rem 1rem; margin-bottom: 1.5rem; animation: fadeIn 0.3s ease-out; display: flex; align-items: flex-start; gap: 0.5rem; color: #b91c1c; font-size: 0.875rem; font-weight: 500; border-radius: 0 0.5rem 0.5rem 0; }
        .success-message { background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 0.75rem 1rem; margin-bottom: 1.5rem; animation: fadeIn 0.3s ease-out; display: flex; align-items: flex-start; gap: 0.5rem; color: #166534; font-size: 0.875rem; font-weight: 500; border-radius: 0 0.5rem 0.5rem 0; }
        .separator-text { position: relative; text-align: center; font-size: 0.75rem; color: #6b7280; }
        .separator-text::before, .separator-text::after { content: ""; position: absolute; top: 50%; width: calc(50% - 2rem); border-top: 1px solid #e5e7eb; }
        .separator-text::before { right: calc(50% + 1.5rem); }
        .separator-text::after { left: calc(50% + 1.5rem); }
        .scanner-overlay { position: absolute; inset: 0; pointer-events: none; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; }
        .scanner-overlay::before, .scanner-overlay::after { content: ''; position: absolute; background-color: rgba(0,0,0,0.4); }
        .scanner-overlay::before { top: 0; bottom: 0; left: 0; width: 10%; } /* Bordures verticales */
        .scanner-overlay::after { top: 0; bottom: 0; right: 0; width: 10%; }
        /* Pour ajouter des bordures horizontales (si besoin) */
        /* .scanner-overlay div::before { top:0; left:10%; right:10%; height:10%;} */
        /* .scanner-overlay div::after { bottom:0; left:10%; right:10%; height:10%;} */
        .scanner-line { position: absolute; left: 5%; right: 5%; height: 2px; background: linear-gradient(to right, transparent, rgba(0, 255, 150, 0.8), transparent); box-shadow: 0 0 8px rgba(0, 255, 150, 0.8); border-radius: 1px; transition: top 0.05s linear; }
        .scanner-line div { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 4px; background-color: rgba(0, 255, 150, 0.9); border-radius: 2px; box-shadow: 0 0 10px rgba(0, 255, 150, 0.9); }
      `}</style>
    </div>
  );
};

export default ProcessExistingPackage;
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TruckIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  BanknotesIcon,
  ArrowLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as SolidCheckCircleIcon,
  CurrencyDollarIcon as SolidCurrencyDollarIcon
} from '@heroicons/react/24/solid';
import { supabase } from '@/lib/supabase';
import { SkipBack } from 'lucide-react';

// MODIFIÉ: Interface Shipment alignée avec votre BDD pour une meilleure cohérence
interface Shipment {
  id: number;
  tracking_number: string;
  status: string;
  sender_name: string;
  recipient_name: string;
  description: string;
  shipping_cost: number;
  is_paid_at_departure: boolean;
  created_at: string;
  weight?: number;
  is_fragile?: boolean;
  is_perishable?: boolean;
  is_insured?: boolean;
  declared_value?: number;
}


interface DepositUserInfo {
  fullName: string;
  phone: string;
  email: string;
  cniNumber: string;
  signature: string | null;
}

interface User {
  id: string;
  account_type: 'FREELANCE' | 'AGENCY';
}

// NOUVEAU: Définir les props que le composant va recevoir
interface DepotColisProps {
  onClose: () => void;
  onSuccess: () => void;
}

const DepotColis = ({ onClose, onSuccess }: DepotColisProps) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchMode, setSearchMode] = useState<'new' | 'existing' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [userInfo, setUserInfo] = useState<DepositUserInfo>({
    fullName: '',
    phone: '',
    email: '',
    cniNumber: '',
    signature: null
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
    const [error, setError] = useState<string | null>(null);

  // Vérification de l'authentification au chargement
  useEffect(() => {
    // Remplacer ceci par votre vraie logique d'authentification Supabase
    const checkAuth = async () => {
      const mockUser = { id: 'some-freelance-id', account_type: 'FREELANCE' as const };
      setUser(mockUser);
      setIsLoading(false);
    };
    checkAuth();
  }, []);
  // MODIFIÉ: Logique de recherche connectée à Supabase
  const searchShipments = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        // Recherche sur plusieurs colonnes : numéro de suivi, nom expéditeur, nom destinataire
        .or(`tracking_number.ilike.%${query}%,sender_name.ilike.%${query}%,recipient_name.ilike.%${query}%`)
        // Condition cruciale : ne trouver que les colis qui attendent d'être déposés
        .eq('status', 'EN_ATTENTE_DE_DEPOT')
        .order('created_at', { ascending: false })
        .limit(10); // Limite les résultats pour de meilleures performances

      if (error) {
        throw error;
      }
      
      setSearchResults(data || []);

    } catch (error: any) {
        console.error("Erreur de recherche Supabase:", error);
        setError("Une erreur est survenue lors de la recherche. Veuillez réessayer.");
        setSearchResults([]);
    } finally {
        setIsSearching(false);
    }
  };


  // Gestion de la signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const signatureData = canvas.toDataURL();
      setUserInfo(prev => ({ ...prev, signature: signatureData }));
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setUserInfo(prev => ({ ...prev, signature: null }));
      }
    }
  };

  // Validation du paiement
  const validatePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!selectedShipment) return false;
    
    if (isNaN(amount) || amount < selectedShipment.shipping_cost) {
      setPaymentError(`Le montant doit être supérieur ou égal à ${selectedShipment.shipping_cost} FCFA`);
      return false;
    }
    setPaymentError('');
    return true;
  };

  // Génération du bordereau PDF (simulation)
  const generateBordereau = async () => {
    // Ici vous implémenteriez la génération du PDF avec jsPDF ou une API
    console.log('Génération du bordereau pour:', selectedShipment);
    console.log('Infos utilisateur:', userInfo);
    
    // Simulation du téléchargement
    const blob = new Blob(['Bordereau PDF simulé'], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bordereau-${selectedShipment?.tracking_number}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

    const handleDepositSubmit = async () => {
    if (!selectedShipment || !userInfo.fullName || !userInfo.phone || !userInfo.signature) {
        setError("Veuillez remplir toutes les informations du déposant et signer.");
        return;
    }

    if (showPaymentForm && !validatePayment()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
        // Mettre à jour le statut du colis en BDD
        const { error: updateError } = await supabase
            .from('shipments')
            .update({ status: 'AU_DEPART' }) // Le colis a été déposé, il est maintenant au départ
            .eq('id', selectedShipment.id);

        if (updateError) throw updateError;
        
        // Insérer les informations du déposant si vous avez une table pour ça (optionnel mais recommandé)
        // Exemple:
        // await supabase.from('deposit_logs').insert({ shipment_id: selectedShipment.id, ...userInfo });

        await generateBordereau();
        onSuccess();
        
        // Réinitialisation après succès
        setSelectedShipment(null);
        setShowUserForm(false);
        setShowPaymentForm(false);
        setUserInfo({ fullName: '', phone: '', email: '', cniNumber: '', signature: null });
        setPaymentAmount('');
        setSearchMode(null);
    } catch (error: any) {
        setError(`Erreur lors de la finalisation: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-3 border-orange-200 dark:border-orange-800 border-t-orange-500 dark:border-t-orange-400 rounded-full mx-auto mb-4"
          />
          <p className="text-orange-600 dark:text-orange-400 font-semibold">Chargement...</p>
        </motion.div>
      </div>
    );
  }

  if (!user || (user.account_type !== 'FREELANCE' && user.account_type !== 'AGENCY')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <motion.div 
          className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-red-100 dark:border-red-800/30"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Accès Refusé</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Cette page est réservée aux comptes Freelance et Agence.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retour à l'accueil
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => router.push('/home')}
            className="mb-4 flex items-center mx-auto text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </button>
          {/* MODIFICATION CLÉ: Ce bouton appelle `onClose` */}
          <button
            onClick={onClose}
            className="mb-4 flex items-center mx-auto text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
          >
            <SkipBack className="w-4 h-4 mr-2" />
            Retour à l'inventaire
          </button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Dépôt de Colis
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Enregistrez un nouveau colis ou gérez un colis existant
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Sélection du mode */}
          {!searchMode && (
            <motion.div
              key="mode-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6"
            >
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-orange-100 dark:border-orange-800/30 p-8 cursor-pointer group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSearchMode('new')}
              >
                <div className="text-center">
                  <div className="bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 dark:group-hover:bg-orange-800/50 transition-colors">
                    <PlusIcon className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    Nouveau Colis
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Créer une nouvelle expédition depuis le début
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-orange-100 dark:border-orange-800/30 p-8 cursor-pointer group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSearchMode('existing')}
              >
                <div className="text-center">
                  <div className="bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 dark:group-hover:bg-orange-800/50 transition-colors">
                    <MagnifyingGlassIcon className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    Colis Existant
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Rechercher et traiter un colis déjà enregistré
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Nouveau colis - redirection */}
          {searchMode === 'new' && (
            <motion.div
              key="new-redirect"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
              onAnimationComplete={() => router.push('/expedition')}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-3 border-orange-200 dark:border-orange-800 border-t-orange-500 dark:border-t-orange-400 rounded-full mx-auto mb-4"
              />
              <p className="text-orange-600 dark:text-orange-400 font-semibold">Redirection vers le formulaire d'expédition...</p>
            </motion.div>
          )}

          {/* Recherche de colis existant */}
          {searchMode === 'existing' && !selectedShipment && (
            <motion.div
              key="existing-search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-orange-100 dark:border-orange-800/30 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Rechercher un Colis
                  </h2>
                  <button
                    onClick={() => setSearchMode(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Numéro de tracking..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchShipments(e.target.value);
                    }}
                    className="w-full px-4 py-3 pl-12 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                  {isSearching && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-orange-200 border-t-orange-500 rounded-full absolute right-4 top-1/2 transform -translate-y-1/2"
                    />
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    {searchResults.map((shipment) => (
                      <motion.div
                        key={shipment.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setSelectedShipment(shipment)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                              {shipment.tracking_number}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {shipment.sender_name} → {shipment.recipient_name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {shipment.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              {shipment.is_paid_at_departure ? (
                                <SolidCheckCircleIcon className="w-5 h-5 text-green-500" />
                              ) : (
                                <SolidCurrencyDollarIcon className="w-5 h-5 text-orange-500" />
                              )}
                              <span className="font-semibold text-gray-800 dark:text-gray-100">
                                {shipment.shipping_cost} FCFA
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Détails du colis sélectionné */}
          {selectedShipment && !showUserForm && (
            <motion.div
              key="shipment-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-orange-100 dark:border-orange-800/30 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Détails du Colis
                  </h2>
                  <button
                    onClick={() => setSelectedShipment(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tracking</label>
                      <p className="text-gray-800 dark:text-gray-100 font-mono">{selectedShipment.tracking_number}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Expéditeur</label>
                      <p className="text-gray-800 dark:text-gray-100">{selectedShipment.sender_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Destinataire</label>
                      <p className="text-gray-800 dark:text-gray-100">{selectedShipment.recipient_name}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                      <p className="text-gray-800 dark:text-gray-100">{selectedShipment.description}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Coût</label>
                      <p className="text-gray-800 dark:text-gray-100 font-semibold">{selectedShipment.shipping_cost} FCFA</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Statut Paiement</label>
                      <div className="flex items-center space-x-2">
                        {selectedShipment.is_paid_at_departure ? (
                          <>
                            <SolidCheckCircleIcon className="w-5 h-5 text-green-500" />
                            <span className="text-green-600 dark:text-green-400">Payé à l'expédition</span>
                          </>
                        ) : (
                          <>
                            <ClockIcon className="w-5 h-5 text-orange-500" />
                            <span className="text-orange-600 dark:text-orange-400">À payer au relais</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  {!selectedShipment.is_paid_at_departure && (
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
                    >
                      <BanknotesIcon className="w-5 h-5" />
                      <span>Encaisser Paiement</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowUserForm(true)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    <span>Générer Bordereau</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Formulaire de paiement */}
          {showPaymentForm && selectedShipment && (
            <motion.div
              key="payment-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-orange-100 dark:border-orange-800/30 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
                  Encaisser le Paiement
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Montant attendu: {selectedShipment.shipping_cost} FCFA
                  </label>
                  <input
                    type="number"
                    placeholder="Montant reçu"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  />
                  {paymentError && (
                    <p className="text-red-500 text-sm mt-2">{paymentError}</p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      if (validatePayment()) {
                        setShowPaymentForm(false);
                        setShowUserForm(true);
                      }
                    }}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg transition-colors"
                  >
                    Valider
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Formulaire utilisateur */}
          {showUserForm && (
            <motion.div
              key="user-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-orange-100 dark:border-orange-800/30 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6">
                  Informations de l'Agent de Dépôt
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <UserIcon className="w-4 h-4 inline mr-1" />
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={userInfo.fullName}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <PhoneIcon className="w-4 h-4 inline mr-1" />
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={userInfo.phone}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <IdentificationIcon className="w-4 h-4 inline mr-1" />
                      Numéro CNI
                    </label>
                    <input
                      type="text"
                      value={userInfo.cniNumber}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, cniNumber: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>

                {/* Signature */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <PencilIcon className="w-4 h-4 inline mr-1" />
                    Signature Numérique *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <canvas
                      ref={signatureCanvasRef}
                      width={400}
                      height={150}
                      className="w-full h-32 border border-gray-200 dark:border-gray-600 rounded cursor-crosshair bg-white dark:bg-gray-700"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Signez dans la zone ci-dessus
                      </p>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                      >
                        Effacer
                      </button>
                    </div>
                  </div>
                </div>

                {/* Récapitulatif du paiement si applicable */}
                {showPaymentForm && paymentAmount && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                      Récapitulatif Paiement
                    </h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-green-700 dark:text-green-400">Montant attendu:</span>
                        <span className="font-medium text-green-800 dark:text-green-300">
                          {selectedShipment?.shipping_cost} FCFA
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700 dark:text-green-400">Montant reçu:</span>
                        <span className="font-medium text-green-800 dark:text-green-300">
                          {paymentAmount} FCFA
                        </span>
                      </div>
                      {parseFloat(paymentAmount) > (selectedShipment?.shipping_cost || 0) && (
                        <div className="flex justify-between border-t border-green-200 dark:border-green-700 pt-1">
                          <span className="text-green-700 dark:text-green-400">Monnaie à rendre:</span>
                          <span className="font-bold text-green-800 dark:text-green-300">
                            {(parseFloat(paymentAmount) - (selectedShipment?.shipping_cost || 0))} FCFA
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowUserForm(false);
                      setShowPaymentForm(false);
                      setUserInfo({ fullName: '', phone: '', email: '', cniNumber: '', signature: null });
                      setPaymentAmount('');
                    }}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDepositSubmit}
                    disabled={!userInfo.fullName || !userInfo.phone || !userInfo.signature}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    <span>Générer Bordereau</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section d'aide */}
        {!searchMode && (
          <motion.div
            className="max-w-4xl mx-auto mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-orange-100 dark:border-orange-800/30 p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-orange-500 mr-2" />
                Comment ça marche ?
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-300">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Nouveau Colis</h4>
                  <ul className="space-y-1">
                    <li>• Créer une nouvelle expédition complète</li>
                    <li>• Remplir toutes les informations du colis</li>
                    <li>• Générer automatiquement le bordereau</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Colis Existant</h4>
                  <ul className="space-y-1">
                    <li>• Rechercher par numéro de tracking</li>
                    <li>• Gérer le paiement si nécessaire</li>
                    <li>• Enregistrer le dépôt et générer le bordereau</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Statistiques rapides */}
        {!searchMode && (
          <motion.div
            className="max-w-4xl mx-auto mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-orange-100 dark:border-orange-800/30 p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">24</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Colis traités aujourd'hui</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-orange-100 dark:border-orange-800/30 p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">156</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Colis traités ce mois</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-orange-100 dark:border-orange-800/30 p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">98%</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Taux de satisfaction</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DepotColis;
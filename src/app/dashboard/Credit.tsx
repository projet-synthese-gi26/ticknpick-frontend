'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  HandCoins, 
  CreditCard, 
  Smartphone, 
  Plus, 
  History, 
  TrendingUp,
  Wallet,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface CreditTransaction {
  id: number;
  amount: number;
  payment_method: 'ORANGE_MONEY' | 'VISA_CARD';
  transaction_date: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  reference_number?: string;
}

interface CreditPageProps {
  profile: {
    id: string;
    credit_balance: number;
    account_type: string;
    manager_name: string;
    email: string;
  };
  onUpdate?: () => void;
}

const CreditPage: React.FC<CreditPageProps> = ({ profile, onUpdate }) => {
  const [currentBalance, setCurrentBalance] = useState<number>(profile.credit_balance || 0);
  const [isRecharging, setIsRecharging] = useState<boolean>(false);
  const [rechargeAmount, setRechargeAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'ORANGE_MONEY' | 'VISA_CARD'>('ORANGE_MONEY');
  const [showPaymentForm, setShowPaymentForm] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showBalance, setShowBalance] = useState<boolean>(true);
  
  // Formulaire Orange Money
  const [orangePhone, setOrangePhone] = useState<string>('');
  const [orangePin, setOrangePin] = useState<string>('');
  
  // Formulaire Carte Visa
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCVC, setCardCVC] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');

  // Messages
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Charger les transactions au montage
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      // Ici vous pourriez avoir une table credit_transactions dans Supabase
      // Pour l'exemple, on simule des données
      const mockTransactions: CreditTransaction[] = [
        {
          id: 1,
          amount: 5000,
          payment_method: 'ORANGE_MONEY',
          transaction_date: '2024-01-15T10:30:00Z',
          status: 'SUCCESS',
          reference_number: 'OM123456789'
        },
        {
          id: 2,
          amount: 10000,
          payment_method: 'VISA_CARD',
          transaction_date: '2024-01-10T14:22:00Z',
          status: 'SUCCESS',
          reference_number: 'VISA987654321'
        }
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    }
  };

  const validateAmount = (amount: string): boolean => {
    const numAmount = parseFloat(amount);
    return numAmount >= 1000 && numAmount % 1000 === 0;
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XAF' 
    }).format(amount);
  };

  const handleRecharge = async () => {
    if (!validateAmount(rechargeAmount)) {
      setErrorMessage('Le montant doit être au moins 1000F et multiple de 1000F');
      return;
    }

    setIsRecharging(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Simulation du processus de paiement
      await new Promise(resolve => setTimeout(resolve, 2000));

      const amount = parseFloat(rechargeAmount);
      const newBalance = currentBalance + amount;

      // Mettre à jour le solde dans Supabase
      const { error } = await supabase
        .from('profiles_pro')
        .update({ credit_balance: newBalance })
        .eq('id', profile.id);

      if (error) throw error;

      // Ajouter la transaction à l'historique (ici vous créeriez un enregistrement dans credit_transactions)
      const newTransaction: CreditTransaction = {
        id: Date.now(),
        amount,
        payment_method: paymentMethod,
        transaction_date: new Date().toISOString(),
        status: 'SUCCESS',
        reference_number: `${paymentMethod === 'ORANGE_MONEY' ? 'OM' : 'VISA'}${Date.now()}`
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setCurrentBalance(newBalance);
      setSuccessMessage(`Votre compte a été rechargé avec succès de ${formatAmount(amount)}`);
      setShowPaymentForm(false);
      resetForm();
      
      if (onUpdate) onUpdate();

    } catch (error) {
      console.error('Erreur lors de la recharge:', error);
      setErrorMessage('Échec de la recharge. Veuillez réessayer.');
    } finally {
      setIsRecharging(false);
    }
  };

  const resetForm = () => {
    setRechargeAmount('');
    setOrangePhone('');
    setOrangePin('');
    setCardNumber('');
    setCardExpiry('');
    setCardCVC('');
    setCardHolder('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'Réussi';
      case 'PENDING': return 'En attente';
      case 'FAILED': return 'Échec';
      default: return 'Inconnu';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl">
              <HandCoins className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Compte de Crédit</h1>
              <p className="text-gray-600">Gérez votre solde et rechargez votre compte</p>
            </div>
          </div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {showBalance ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-orange-100 text-sm font-medium">Solde disponible</p>
                <p className="text-3xl font-bold">
                  {showBalance ? formatAmount(currentBalance) : '••••••'}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-orange-200" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs">Compte {profile.account_type}</p>
                <p className="text-white font-medium">{profile.manager_name}</p>
              </div>
              <button
                onClick={() => setShowPaymentForm(true)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Recharger</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3"
          >
            <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800 font-medium">{successMessage}</p>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3"
          >
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 font-medium">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-100">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Recharges ce mois</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {formatAmount(transactions.reduce((sum, t) => sum + (t.status === 'SUCCESS' ? t.amount : 0), 0))}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-100">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <RefreshCw className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Transactions</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">{transactions.length}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-100">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <History className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Dernière recharge</h3>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {transactions[0] ? formatAmount(transactions[0].amount) : 'Aucune'}
          </p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-orange-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <History className="h-5 w-5 text-orange-600" />
            <span>Historique des transactions</span>
          </h2>
        </div>
        
        <div className="p-6">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <HandCoins className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune transaction trouvée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white rounded-lg">
                      {transaction.payment_method === 'ORANGE_MONEY' ? (
                        <Smartphone className="h-5 w-5 text-orange-600" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Recharge {transaction.payment_method === 'ORANGE_MONEY' ? 'Orange Money' : 'Carte Visa'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.transaction_date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {transaction.reference_number && (
                        <p className="text-xs text-gray-400">Réf: {transaction.reference_number}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+{formatAmount(transaction.amount)}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                      {getStatusText(transaction.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de recharge */}
      <AnimatePresence>
        {showPaymentForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowPaymentForm(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-xl border border-orange-100 max-h-[90vh] overflow-y-auto">
                <div className="p-2 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Recharger mon compte</h2>
                    <button
                      onClick={() => setShowPaymentForm(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Montant */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant de recharge
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                        placeholder="Ex: 5000"
                        min="1000"
                        step="1000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">FCFA</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Montant minimum: 1000 FCFA (multiples de 1000)
                    </p>
                  </div>

                  {/* Méthode de paiement */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Méthode de paiement
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentMethod('ORANGE_MONEY')}
                        className={`p-4 border-2 rounded-xl flex flex-col items-center space-y-2 transition-all ${
                          paymentMethod === 'ORANGE_MONEY'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Smartphone className="h-6 w-6 text-orange-600" />
                        <span className="font-medium text-sm">Orange Money</span>
                      </button>
                      
                      <button
                        onClick={() => setPaymentMethod('VISA_CARD')}
                        className={`p-4 border-2 rounded-xl flex flex-col items-center space-y-2 transition-all ${
                          paymentMethod === 'VISA_CARD'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <CreditCard className="h-6 w-6 text-blue-600" />
                        <span className="font-medium text-sm">Carte Visa</span>
                      </button>
                    </div>
                  </div>

                  {/* Formulaire Orange Money */}
                  {paymentMethod === 'ORANGE_MONEY' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Numéro Orange Money
                        </label>
                        <input
                          type="tel"
                          value={orangePhone}
                          onChange={(e) => setOrangePhone(e.target.value)}
                          placeholder="Ex: 691234567"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Code PIN Orange Money
                        </label>
                        <input
                          type="password"
                          value={orangePin}
                          onChange={(e) => setOrangePin(e.target.value)}
                          placeholder="••••"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  {/* Formulaire Carte Visa */}
                  {paymentMethod === 'VISA_CARD' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Numéro de carte
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date d'expiration
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/AA"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Code CVC
                          </label>
                          <input
                            type="text"
                            value={cardCVC}
                            onChange={(e) => setCardCVC(e.target.value)}
                            placeholder="123"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom du titulaire
                        </label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="Jean Dupont"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  {/* Boutons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowPaymentForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleRecharge}
                      disabled={isRecharging || !validateAmount(rechargeAmount)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center space-x-2"
                    >
                      {isRecharging ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Traitement...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>Recharger {rechargeAmount && formatAmount(parseFloat(rechargeAmount))}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreditPage;
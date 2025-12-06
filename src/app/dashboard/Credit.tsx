'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { walletService, WalletTransactionResponse } from '@/services/walletService'; 
import { 
  Wallet, RefreshCw, Plus, Smartphone, CreditCard, 
  ArrowUpRight, ArrowDownLeft, History, TrendingUp, Check, X, 
  Loader2, AlertCircle 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { UserProfile } from './page'; // Import depuis ton fichier de types central

interface CreditPageProps {
  profile: UserProfile; 
  onUpdate: () => void; // Callback pour rafraichir le profil global
}

// Types locaux pour l'UI
interface Transaction {
    id: number;
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    date: Date;
    method: string;
    status: 'COMPLETED' | 'FAILED';
}

export default function CreditPage({ profile, onUpdate }: CreditPageProps) {
  // State pour le solde (Initialisé avec le profil, puis mis à jour localement)
  // On suppose que profile.credit_balance existe (ajouté aux types plus bas)
  const [balance, setBalance] = useState<number>(Number(profile.credit_balance || 0));
  
  const [showRecharge, setShowRecharge] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'OM' | 'MOMO' | 'CB'>('OM');
  const [phone, setPhone] = useState(profile.phone_number || '');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Logique de Recharge
  const handleRecharge = async () => {
    const val = parseInt(amount);
    if(!val || val < 500) {
        toast.error("Montant minimum : 500 FCFA");
        return;
    }
    if(!phone) {
        toast.error("Numéro de téléphone requis pour le paiement");
        return;
    }

    setIsProcessing(true);
    const loadId = toast.loading("Traitement avec l'opérateur...");

    try {
        // 1. SIMULATION PAIEMENT OPÉRATEUR (Orange/MTN)
        // Dans une vraie app, ici on appellerait l'API de CinetPay, Stripe, etc.
        await new Promise(resolve => setTimeout(resolve, 2000)); // Attente artificielle

        // 2. APPEL API WALLET (Si le paiement opérateur réussit)
        toast.loading("Mise à jour du portefeuille...", { id: loadId });
        
        // Appel du service qu'on a créé
        await walletService.creditWallet(
            profile.id, 
            val, 
            `Recharge via ${method} (${phone})`
        );

        // 3. SUCCÈS
        const newBal = balance + val;
        setBalance(newBal);
        
        // Ajout transaction locale (car pas de GET history distant)
        const newTx: Transaction = {
            id: Date.now(),
            type: 'CREDIT',
            amount: val,
            date: new Date(),
            method: method === 'OM' ? 'Orange Money' : 'MTN MoMo',
            status: 'COMPLETED'
        };
        setTransactions(prev => [newTx, ...prev]);
        
        toast.success("Recharge effectuée !", { id: loadId });
        setShowRecharge(false);
        setAmount('');
        
        // Notifier le parent pour rafraîchir les données globales
        onUpdate();

    } catch (err: any) {
        console.error(err);
        toast.error("Erreur transaction : " + err.message, { id: loadId });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <Toaster position="top-center"/>

      {/* --- 1. CARTE PRINCIPALE SOLDE --- */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-8 shadow-2xl">
           <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
               <div>
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-orange-500"/> ID: <span className="font-mono text-white">{profile.id.substring(0,8)}...</span>
                   </p>
                   <h1 className="text-5xl font-black tracking-tight">
                       {balance.toLocaleString()} <span className="text-2xl font-normal text-slate-400">FCFA</span>
                   </h1>
                   <p className="text-sm text-slate-400 mt-2">Solde disponible pour vos opérations</p>
               </div>

               <div className="flex gap-3">
                   <button 
                      onClick={() => setShowRecharge(true)}
                      className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-900/20 transition transform hover:-translate-y-0.5 active:scale-95"
                   >
                       <Plus className="w-5 h-5"/> Recharger
                   </button>
               </div>
           </div>
      </div>

      {/* --- 2. ACTIONS RAPIDES & KPIS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Carte Info 1 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition">
               <div className="flex items-start justify-between mb-4">
                   <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600">
                       <ArrowDownLeft className="w-6 h-6"/>
                   </div>
                   <span className="text-xs font-bold text-gray-400 uppercase">Revenus J-7</span>
               </div>
               <p className="text-2xl font-bold text-gray-800 dark:text-white">0 FCFA</p>
          </div>
          
          {/* Carte Info 2 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition">
               <div className="flex items-start justify-between mb-4">
                   <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600">
                       <ArrowUpRight className="w-6 h-6"/>
                   </div>
                   <span className="text-xs font-bold text-gray-400 uppercase">Commissions Payées</span>
               </div>
               <p className="text-2xl font-bold text-gray-800 dark:text-white">0 FCFA</p>
          </div>

          {/* Carte Info 3 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition">
               <div className="flex items-start justify-between mb-4">
                   <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
                       <TrendingUp className="w-6 h-6"/>
                   </div>
                   <span className="text-xs font-bold text-gray-400 uppercase">Statut</span>
               </div>
               <p className="text-2xl font-bold text-gray-800 dark:text-white">Actif</p>
          </div>
      </div>

      {/* --- 3. MODAL RECHARGE --- */}
      <AnimatePresence>
          {showRecharge && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
                    onClick={() => setShowRecharge(false)} 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  />
                  <motion.div 
                     initial={{scale: 0.9, y: 20, opacity: 0}} animate={{scale: 1, y: 0, opacity: 1}} exit={{scale: 0.9, y: 20, opacity: 0}}
                     className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
                  >
                      {/* Header Modal */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                           <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                               <RefreshCw className="w-5 h-5 text-orange-500"/> Recharger le Compte
                           </h3>
                           <button onClick={() => setShowRecharge(false)} className="text-gray-400 hover:text-red-500 transition"><X/></button>
                      </div>

                      <div className="p-6 space-y-6">
                           {/* Montant */}
                           <div>
                               <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Montant à recharger</label>
                               <div className="relative">
                                   <input 
                                      type="number" 
                                      autoFocus
                                      placeholder="5000"
                                      className="w-full text-3xl font-black p-4 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-transparent focus:border-orange-500 outline-none text-gray-900 dark:text-white"
                                      value={amount}
                                      onChange={e => setAmount(e.target.value)}
                                   />
                                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">FCFA</span>
                               </div>
                           </div>

                           {/* Méthodes */}
                           <div className="grid grid-cols-3 gap-3">
                               <button 
                                  onClick={() => setMethod('OM')}
                                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition ${method==='OM' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}
                               >
                                  <div className="w-4 h-4 rounded-full bg-orange-500 mb-2"></div>
                                  <span className="text-xs font-bold">Orange</span>
                               </button>
                               <button 
                                  onClick={() => setMethod('MOMO')}
                                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition ${method==='MOMO' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}
                               >
                                  <div className="w-4 h-4 rounded-full bg-yellow-400 mb-2"></div>
                                  <span className="text-xs font-bold">MTN</span>
                               </button>
                               <button 
                                  onClick={() => setMethod('CB')}
                                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition ${method==='CB' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}
                               >
                                  <CreditCard className="w-4 h-4 text-blue-500 mb-2"/>
                                  <span className="text-xs font-bold">Carte</span>
                               </button>
                           </div>

                           {/* Phone input */}
                           {(method === 'OM' || method === 'MOMO') && (
                               <div>
                                   <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Numéro de paiement</label>
                                   <div className="relative">
                                        <Smartphone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                        <input 
                                            type="tel" 
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            placeholder="6XX XX XX XX"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-orange-500 outline-none bg-transparent"
                                        />
                                   </div>
                               </div>
                           )}

                           <button 
                               disabled={isProcessing}
                               onClick={handleRecharge}
                               className="w-full py-4 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold text-lg shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                           >
                               {isProcessing ? <Loader2 className="animate-spin"/> : <Check/>}
                               Valider le paiement
                           </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* --- 4. LISTE HISTORIQUE --- */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
           <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-6 flex items-center gap-2">
               <History className="w-5 h-5 text-gray-400"/> Historique des Transactions
           </h3>
           
           {transactions.length === 0 ? (
               <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                   <p className="text-sm">Aucune transaction récente.</p>
               </div>
           ) : (
               <div className="space-y-4">
                   {transactions.map((tx) => (
                       <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 transition">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${tx.type === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {tx.type === 'CREDIT' ? <ArrowDownLeft className="w-5 h-5"/> : <ArrowUpRight className="w-5 h-5"/>}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white text-sm">{tx.type === 'CREDIT' ? 'Recharge Compte' : 'Paiement Service'}</p>
                                    <p className="text-xs text-gray-500">{tx.date.toLocaleTimeString()} • {tx.method}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold text-lg ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'}`}>
                                    {tx.type === 'CREDIT' ? '+' : '-'} {tx.amount.toLocaleString()} F
                                </p>
                                <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">COMPLÉTÉ</span>
                            </div>
                       </div>
                   ))}
               </div>
           )}
      </div>

    </div>
  );
}
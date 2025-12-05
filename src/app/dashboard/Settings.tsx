// FICHIER : src/app/dashboard/Settings.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    CreditCard, 
    Shield, 
    ArrowRight, 
    Building, 
    Wallet, 
    PlusCircle, 
    AlertCircle, 
    Send, 
    Check, 
    X, 
    Clock,
    Package,
    Eye,
    EyeOff,
    Sparkles,
    ChevronDown,
    TrendingUp,
    Settings
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { UserProfile } from './page';

// Interface pour les réclamations et les colis
interface Claim {
  id: string;
  packageId: string;
  problem: 'Colis perdu' | 'Colis endommagé';
  details: string;
  status: 'En cours' | 'Résolu' | 'Rejeté';
  date: string;
}

interface PackageForClaim {
  id: string;
  tracking_number: string;
  description: string;
  status: string;
  created_at: string;
}

interface SettingsPageProps {
   profile: UserProfile; 
    onUpdate: () => void;
}

// Données de simulation
const mockClaims: Claim[] = [
  { 
    id: 'REC001', 
    packageId: 'PKD-85743', 
    problem: 'Colis endommagé', 
    details: "Le coin de la boîte est écrasé, le produit à l'intérieur semble fragile.", 
    status: 'En cours', 
    date: '2025-07-29' 
  },
];

// Composant pour les devises avec icônes
const CurrencyOption = ({ value, label, symbol }: { value: string; label: string; symbol: string }) => (
    <option value={value}>{symbol} {label}</option>
);

// Composant pour les cartes de section modernisées
const SectionCard = ({ 
    icon: Icon, 
    title, 
    description, 
    children, 
    className = "" 
}: { 
    icon: React.ElementType; 
    title: string; 
    description: string; 
    children: React.ReactNode;
    className?: string;
}) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 ${className}`}
    >
        <div className="flex items-center gap-4 mb-6">
            <motion.div 
                className="p-4 rounded-2xl bg-orange-100 dark:bg-orange-900/30 ring-1 ring-orange-200 dark:ring-orange-800/50"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
            >
                <Icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </motion.div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{title}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            </div>
        </div>
        {children}
    </motion.div>
);

// Composant pour les réclamations
const ClaimCard = ({ claim }: { claim: Claim }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'En cours': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
            case 'Résolu': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
            case 'Rejeté': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'En cours': return <Clock className="h-4 w-4" />;
            case 'Résolu': return <Check className="h-4 w-4" />;
            case 'Rejeté': return <X className="h-4 w-4" />;
            default: return <AlertCircle className="h-4 w-4" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02 }}
            className="group p-6 border border-gray-200 dark:border-gray-600/50 rounded-2xl bg-gray-50/50 dark:bg-gray-700/30 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-all duration-300 hover:border-orange-300 dark:hover:border-orange-600/50"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                        <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-800 dark:text-gray-100">
                            {claim.problem}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Colis <span className="font-mono text-orange-600 dark:text-orange-400">{claim.packageId}</span>
                        </p>
                    </div>
                </div>
                <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full ${getStatusColor(claim.status)}`}
                >
                    {getStatusIcon(claim.status)}
                    {claim.status}
                </motion.div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200/50 dark:border-gray-600/30">
                {claim.details}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(claim.date).toLocaleDateString('fr-FR')}
            </p>
        </motion.div>
    );
};

export default function SettingsPage({ profile, onUpdate }: SettingsPageProps) {
    const [selectedCurrency, setSelectedCurrency] = useState('XAF');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [isLoading, setIsLoading] = useState(false);

    // États pour les litiges
    const [claims, setClaims] = useState<Claim[]>(mockClaims);
    const [userPackages, setUserPackages] = useState<PackageForClaim[]>([]);
    const [isClaimFormVisible, setIsClaimFormVisible] = useState(false);
    const [newClaim, setNewClaim] = useState({ 
        packageId: '', 
        problem: 'Colis endommagé' as 'Colis perdu' | 'Colis endommagé', 
        details: '' 
    });

    // 1. Charger la devise depuis localStorage au montage
    useEffect(() => {
        const savedCurrency = localStorage.getItem('user_currency') || 'XAF';
        setSelectedCurrency(savedCurrency);
    }, []);
    
    // 2. Récupérer les colis de l'utilisateur pour le formulaire de réclamation
    useEffect(() => {
        const fetchUserPackages = async () => {
            if (!profile?.manager_name) return;
            setIsLoading(true);
            
            const { data, error } = await supabase
                .from('shipments')
                .select('tracking_number, description, status, created_at')
                .or(`sender_name.eq.${profile.manager_name},recipient_name.eq.${profile.manager_name}`)
                .order('created_at', { ascending: false });
            
            if (data) {
                const formattedPackages: PackageForClaim[] = data.map(p => ({
                    id: p.tracking_number,
                    tracking_number: p.tracking_number,
                    description: p.description || 'Colis sans description',
                    status: p.status || 'en_cours',
                    created_at: p.created_at
                }));
                setUserPackages(formattedPackages);
            }
            
            setIsLoading(false);
        };

        fetchUserPackages();
    }, [profile?.manager_name]);

    // 3. Sauvegarder la devise dans localStorage
    const handleSaveCurrency = () => {
        setSaveStatus('saving');
        localStorage.setItem('user_currency', selectedCurrency);
        
        setTimeout(() => {
            setSaveStatus('saved');
            // Informer les autres composants (comme Overview) de la mise à jour
            window.dispatchEvent(new Event('currency_updated'));
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 1000);
    };
    
    // 4. Gérer la soumission d'une nouvelle réclamation
    const handleClaimSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClaim.packageId || !newClaim.details.trim()) {
            alert("Veuillez sélectionner un colis et décrire le problème.");
            return;
        }

        const newClaimEntry: Claim = {
            id: `REC${String(Date.now()).slice(-4)}`,
            ...newClaim,
            status: 'En cours',
            date: new Date().toISOString().split('T')[0]
        };

        setClaims(prev => [newClaimEntry, ...prev]);
        setNewClaim({ packageId: '', problem: 'Colis endommagé', details: '' });
        setIsClaimFormVisible(false);
    };

    const currencies = [
        { value: 'XAF', label: 'Francs CFA', symbol: '₣' },
        { value: 'NGN', label: 'Naira Nigerian', symbol: '₦' },
        { value: 'EUR', label: 'Euro', symbol: '€' },
        { value: 'USD', label: 'Dollar Américain', symbol: '$' }
    ];

    return (
        <div className="space-y-8 max-w-6xl p-4 mx-auto">
            {/* En-tête modernisé */}
            <motion.div 
                className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="flex items-center gap-4">
                    <motion.div
                        className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl"
                        whileHover={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.5 }}
                    >
                        <Settings className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    </motion.div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                            Paramètres du Compte
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Gérez vos préférences et réclamations
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Section Informations de Paiement */}
            <SectionCard
                icon={Wallet}
                title="Informations de Paiement"
                description="Gérez vos préférences de devise et méthodes de paiement"
            >
                <div className="max-w-md space-y-6">
                    <div>
                        <label htmlFor="currency-select" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            Devise d'affichage
                        </label>
                        <div className="relative">
                            <select
                                id="currency-select"
                                value={selectedCurrency}
                                onChange={(e) => setSelectedCurrency(e.target.value)}
                                className="w-full p-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 appearance-none cursor-pointer text-gray-900 dark:text-gray-100"
                            >
                                {currencies.map(curr => (
                                    <CurrencyOption key={curr.value} {...curr} />
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    
                    <motion.button 
                        onClick={handleSaveCurrency}
                        disabled={saveStatus !== 'idle'}
                        className="w-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-semibold py-4 px-6 rounded-2xl transition-all duration-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-orange-200 dark:border-orange-800/50"
                        whileHover={{ scale: saveStatus === 'idle' ? 1.02 : 1 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={saveStatus}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-2"
                            >
                                {saveStatus === 'saving' && (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Clock className="h-5 w-5" />
                                        </motion.div>
                                        Enregistrement...
                                    </>
                                )}
                                {saveStatus === 'saved' && (
                                    <>
                                        <Check className="h-5 w-5" />
                                        Enregistré avec succès !
                                    </>
                                )}
                                {saveStatus === 'idle' && (
                                    <>
                                        <CreditCard className="h-5 w-5" />
                                        Enregistrer la devise
                                    </>
                                )}
                            </motion.span>
                        </AnimatePresence>
                    </motion.button>
                </div>
            </SectionCard>
            
            {/* Section Litiges et Réclamations */}
            <SectionCard
                icon={Shield}
                title="Litiges et Réclamations"
                description="Gérez vos réclamations et signalez des problèmes"
            >
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            Réclamations en cours
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                            {claims.length} réclamation{claims.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                   
                   {claims.length > 0 ? (
                       <div className="grid gap-4">
                           {claims.map((claim, index) => (
                               <motion.div
                                   key={claim.id}
                                   initial={{ opacity: 0, y: 20 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   transition={{ delay: index * 0.1 }}
                               >
                                   <ClaimCard claim={claim} />
                               </motion.div>
                           ))}
                       </div>
                   ) : (
                       <motion.div
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           className="text-center py-12 bg-gray-50/50 dark:bg-gray-700/30 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600"
                       >
                           <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                           <p className="text-gray-500 dark:text-gray-400 text-lg">Aucune réclamation en cours</p>
                           <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                               Vos réclamations apparaîtront ici
                           </p>
                       </motion.div>
                   )}

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-600/50">
                        <motion.button 
                            onClick={() => setIsClaimFormVisible(!isClaimFormVisible)} 
                            className="flex items-center gap-3 font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors duration-300 p-3 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                           <motion.div
                               animate={{ rotate: isClaimFormVisible ? 45 : 0 }}
                               transition={{ duration: 0.3 }}
                           >
                               <PlusCircle className="w-5 h-5"/>
                           </motion.div>
                           <span>{isClaimFormVisible ? 'Annuler' : 'Faire une nouvelle réclamation'}</span>
                        </motion.button>

                        <AnimatePresence>
                           {isClaimFormVisible && (
                               <motion.form 
                                   onSubmit={handleClaimSubmit}
                                   initial={{ opacity: 0, height: 0, y: -20 }}
                                   animate={{ opacity: 1, height: 'auto', y: 0 }}
                                   exit={{ opacity: 0, height: 0, y: -20 }}
                                   transition={{ duration: 0.4, ease: "easeInOut" }}
                                   className="mt-6 p-6 border border-orange-200 dark:border-orange-800/50 rounded-2xl bg-orange-50/50 dark:bg-orange-900/10 space-y-6 backdrop-blur-sm"
                               >
                                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        Nouvelle Réclamation
                                    </h4>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Colis concerné
                                            </label>
                                            {isLoading ? (
                                                <div className="flex items-center justify-center p-4 border rounded-2xl bg-gray-100 dark:bg-gray-700">
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                        className="h-5 w-5 border-2 border-orange-600 border-t-transparent rounded-full"
                                                    />
                                                    <span className="ml-2 text-gray-600 dark:text-gray-400">Chargement des colis...</span>
                                                </div>
                                            ) : (
                                                <select 
                                                   value={newClaim.packageId} 
                                                   onChange={e => setNewClaim(p => ({...p, packageId: e.target.value}))}
                                                   className="w-full p-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-gray-900 dark:text-gray-100" 
                                                   required
                                                >
                                                   <option value="">Sélectionnez un colis...</option>
                                                   {userPackages.map(pkg => (
                                                       <option key={pkg.id} value={pkg.tracking_number}>
                                                           {pkg.tracking_number} - {pkg.description}
                                                       </option>
                                                   ))}
                                                </select>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Type de problème
                                            </label>
                                            <select 
                                               value={newClaim.problem}
                                               onChange={e => setNewClaim(p => ({...p, problem: e.target.value as any}))}
                                               className="w-full p-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-gray-900 dark:text-gray-100"
                                            >
                                               <option value="Colis perdu">📦 Colis perdu</option>
                                               <option value="Colis endommagé">💥 Colis endommagé</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Description détaillée du problème
                                            </label>
                                            <textarea 
                                                value={newClaim.details}
                                                onChange={e => setNewClaim(p => ({...p, details: e.target.value}))}
                                                rows={4}
                                                placeholder="Décrivez précisément le problème rencontré avec votre colis..."
                                                className="w-full p-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 resize-none text-gray-900 dark:text-gray-100"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <motion.button 
                                        type="submit" 
                                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Send className="w-5 h-5"/>
                                        Soumettre la réclamation
                                    </motion.button>
                               </motion.form>
                           )}
                       </AnimatePresence>
                    </div>
                </div>
            </SectionCard>
            
            {/* Mise à niveau vers Agence (seulement si Freelance) */}
            {(profile.account_type.toLowerCase() === 'freelance') && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="relative overflow-hidden bg-orange-500 dark:bg-orange-600 p-8 rounded-3xl shadow-xl text-white"
                >
                    {/* Effet de fond subtil */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="w-full h-full bg-white/10 rounded-3xl" />
                    </div>
                    
                    <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <motion.div 
                                className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm"
                                whileHover={{ rotate: [0, -10, 10, 0] }}
                                transition={{ duration: 0.6 }}
                            >
                                <Building className="w-12 h-12"/>
                            </motion.div>
                            <div>
                                <h2 className="text-3xl font-bold mb-2">Passez au niveau supérieur !</h2>
                                <p className="opacity-90 text-lg max-w-lg">
                                    Débloquez la gestion de personnel et de multiples points relais en devenant une Agence.
                                </p>
                                <div className="flex items-center gap-4 mt-4 text-sm">
                                    <span className="flex items-center gap-2">
                                        <Check className="h-4 w-4" />
                                        Gestion d'équipe
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Check className="h-4 w-4" />
                                        Points relais multiples
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Check className="h-4 w-4" />
                                        Tableau de bord avancé
                                    </span>
                                </div>
                            </div>
                        </div>
                        <motion.button 
                            className="bg-white text-orange-600 font-bold py-4 px-8 rounded-2xl flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Devenir une Agence
                            <ArrowRight className="h-5 w-5"/>
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
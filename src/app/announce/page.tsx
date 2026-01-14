'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, Plus, Search, MapPin, Package, Clock, 
  X, ArrowRight, CheckCircle, Leaf, User,
  Filter, Calendar, Bell, Shield, Info, Smartphone, Mail, AlertTriangle,
  Loader2,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Toaster, toast } from 'react-hot-toast';

// --- IMPORTS DES ÉTAPES D'EXPÉDITION (Réutilisation pour le formulaire Nouveau) ---
import SenderInfoStep from '../expedition/SenderInfoStep';
import RecipientInfoStep from '../expedition/RecipientInfoStep';
import PackageRegistration from '../expedition/FormulaireColisExpedition';
import RouteSelectionStep from '../expedition/RouteExpedition';
import SignatureStep from '../expedition/SignatureStep';
import PaymentStep from '../expedition/PaymentStepExpedition';

// --- TYPES & INTERFACES ---
interface ShipmentAd {
    id: string;
    from: string;
    to: string;
    date: string;
    price: number;
    weight: string;
    type: string;
    user: string;
    userPhone: string;
    userRating: number;
    avatar: string;
    description: string;
}[[1](https://www.google.com/url?sa=E&q=https%3A%2F%2Fvertexaisearch.cloud.google.com%2Fgrounding-api-redirect%2FAUZIYQEl9fzv_M5j03aPDHZqpglxPdjZajdC4fELp8eQjQigAE-s68A3zgQmgGegH-pKZTNAhoKS8MwatF83xwkBYgtEL9oVRkWjPj6Bz-QrhOvvVPGrK6R-8cvQ0-mPoCey4n7PObY0dqcxpENinaMLGg%3D%3D)][[2](https://www.google.com/url?sa=E&q=https%3A%2F%2Fvertexaisearch.cloud.google.com%2Fgrounding-api-redirect%2FAUZIYQGoMWH3meNFkAb_4CBkOW9oI3H4XrFG-Bb1YYG0eQGdkbDtr5wVdy5yevqZNJIXQUX0anFH2VVn462gGxG341bhsVpXlcuRV-tAJpftNN5ECuBlHgQPXcV9CAY24JMDk6_L9m6ozF5WZ4wpXjoINHF7Tr55Vu3xWyY-u33_T89qrpQ7Oh09J57Z04YqVWDpq41jiaYPhpALgv6qfjJKu4NBJw%3D%3D)][[3](https://www.google.com/url?sa=E&q=https%3A%2F%2Fvertexaisearch.cloud.google.com%2Fgrounding-api-redirect%2FAUZIYQHTJSxnoIgLsUamoPyi6KHTFOCocqAIOv8AlbOj5mdlwAJU2t9Lv9rUdDmn68SCRJea00fuySs3BUvtiVOKh3cCVDLEBnFKioXdX8_9iSFOIStwI-fRmKdzE7MpdcNuWhxeanM7dx9G-iX9MSqS8kAL8Aqc1-R5p0vaJ_keKT-NQweh0R8D7ARv1gmMF0KwUxmtyBNM9M6dgyLwc_X5f1QbC-5jJQX6D8NK)][[4](https://www.google.com/url?sa=E&q=https%3A%2F%2Fvertexaisearch.cloud.google.com%2Fgrounding-api-redirect%2FAUZIYQEOlXw6fYYdmEz8lemiOciCSIeEggTJwVVlyDM6k3-F_sgWkC6QFdt9eRFkeb1DXP0ATUi-kVRTK_1SToiY8uX8Arh2evnwTO-7vItp5n9bP72bZ9eTeVfrpqAqEFbGDqZH6SXEB9pUYWymS6okiBHEVm_fDtjj1VdOWkY45TnB0c76FryVWyR9wtCVExrXzioXdrjDdmBxWNEPpD_vKeRDtWzkJsE%3D)][[5](https://www.google.com/url?sa=E&q=https%3A%2F%2Fvertexaisearch.cloud.google.com%2Fgrounding-api-redirect%2FAUZIYQH1gpW9BxVIX9sNncxpzVjW_QzJAWXUNMzXVz0vf7YIC1U9TnfKHY6ms4m5lolqw2jWL7-pUXAN1bzhXOcZuULG2Uni2jT0mNttj9_PCeR58bfjmU_hwqG4gYmUpBaHkFzV8ig0gfAd7OrSt0t9spvMWT82JSw4YpOiP3IOSslIH1zMpCg2XCIx8zF9zlWcUc0mHmKMMNqGy9H6Ti_QkMoGiAPyX7AYxkU%3D)]

// Données Mockées (Bourse de Fret)
const MOCK_ADS: ShipmentAd[] = [
    { id: '1', from: 'Yaoundé, Bastos', to: 'Douala, Akwa', date: 'Aujourd\'hui, 14:00', price: 5000, weight: '2 kg', type: 'Colis Standard', user: 'Jean Dupont', userPhone: '699000000', userRating: 4.8, avatar: 'JD', description: "Colis fragile contenant des vêtements. Besoin de livraison urgente." },
    { id: '2', from: 'Mbalmayo', to: 'Yaoundé, Centre', date: 'Demain, 09:00', price: 2500, weight: '5 kg', type: 'Alimentaire', user: 'Marie Ngono', userPhone: '677123456', userRating: 4.5, avatar: 'MN', description: "Sac de vivre frais (tubercules)." },
    { id: '3', from: 'Bafoussam', to: 'Dschang', date: '25 Juin', price: 3000, weight: '1 kg', type: 'Documents', user: 'Paul K.', userPhone: '655888999', userRating: 5.0, avatar: 'PK', description: "Dossier administratif urgent." },
    { id: '4', from: 'Kribi', to: 'Douala', date: 'Ce weekend', price: 10000, weight: '20 kg', type: 'Meuble', user: 'Sarah L.', userPhone: '680001122', userRating: 4.2, avatar: 'SL', description: "Petite table basse démontée." },
];

// --- COMPOSANT MODAL D'ACCEPTATION ---
const AcceptAdModal = ({ ad, onClose, onConfirm }: { ad: ShipmentAd; onClose: () => void; onConfirm: () => void }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleAccept = async () => {
        setIsLoading(true);
        // Simulation Appel API pour matcher l'offre
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        setIsLoading(false);
        onConfirm();
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative"
            >
                <div className="bg-emerald-600 h-32 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 text-white p-2 rounded-full hover:bg-black/40 transition">
                        <X className="w-5 h-5"/>
                    </button>
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                         <div className="w-16 h-16 rounded-full border-4 border-white dark:border-slate-900 bg-white shadow-lg flex items-center justify-center font-black text-2xl text-emerald-600">
                             {ad.avatar}
                         </div>
                    </div>
                </div>

                <div className="pt-10 px-6 pb-6 text-center">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{ad.user}</h2>
                    <div className="flex justify-center items-center gap-1 text-xs font-semibold text-slate-500 mb-6">
                        <CheckCircle className="w-3 h-3 text-blue-500"/> Utilisateur Vérifié • ⭐ {ad.userRating}/5
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-left mb-6 space-y-3 border border-slate-100 dark:border-slate-700">
                         <div className="flex justify-between items-center">
                             <span className="text-xs text-slate-400 font-bold uppercase">Offre</span>
                             <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">{ad.price.toLocaleString()} F</span>
                         </div>
                         <div className="h-px bg-slate-200 dark:bg-slate-700 w-full"/>
                         <div className="grid grid-cols-2 gap-4 text-sm">
                             <div>
                                 <p className="text-xs text-slate-400">De</p>
                                 <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{ad.from}</p>
                             </div>
                             <div>
                                 <p className="text-xs text-slate-400">Vers</p>
                                 <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{ad.to}</p>
                             </div>
                         </div>
                         <div>
                             <p className="text-xs text-slate-400">Contenu</p>
                             <p className="font-medium text-slate-600 dark:text-slate-300 italic text-sm">{ad.description}</p>
                         </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-lg mb-6">
                        <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"/>
                        <p className="text-xs text-left text-amber-700 dark:text-amber-200">
                            En acceptant, <strong>une notification sera envoyée</strong> aux deux parties avec vos coordonnées respectives pour finaliser l'échange.
                        </p>
                    </div>

                    <button 
                        onClick={handleAccept}
                        disabled={isLoading}
                        className="w-full py-4 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Accepter la course"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default function AnnouncePage() {
    const { user } = useAuth();
    
    // --- ÉTATS ---
    const [ads, setAds] = useState<ShipmentAd[]>(MOCK_ADS);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedAd, setSelectedAd] = useState<ShipmentAd | null>(null);

    // États du Formulaire de Création
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<any>({
        senderData: { senderName: '', senderPhone: '', senderEmail: '', senderCountry: 'cameroun', senderRegion: '', senderCity: '', senderAddress: '', senderLieuDit: '' },
        recipientData: { recipientName: '', recipientPhone: '', recipientEmail: '', recipientCountry: 'cameroun', recipientRegion: '', recipientCity: '', recipientAddress: '', recipientLieuDit: '' },
        packageData: { photo: null, designation: '', description: '', weight: '', isFragile: false, isInsured: false, declaredValue: '' },
        routeData: { departurePointId: null, arrivalPointId: null },
        signatureData: { signatureUrl: null },
        pricing: { basePrice: 0, travelPrice: 0, operatorFee: 0, totalPrice: 0 }
    });

    const filteredAds = ads.filter(ad => 
        ad.from.toLowerCase().includes(searchTerm.toLowerCase()) || 
        ad.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const resetForm = () => {
        setCurrentStep(1);
        setIsCreateModalOpen(false);
        // On pourrait reset formData ici si on veut
    };

    const handleAdAccepted = () => {
        // Notification succès
        toast.success(`Succès ! ${selectedAd?.user} a été notifié. Vérifiez vos SMS/Emails.`);
        setSelectedAd(null);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <SenderInfoStep initialData={formData.senderData} onContinue={(d) => { setFormData((p:any) => ({...p, senderData:d})); setCurrentStep(2); }} currentUser={user} />;
            case 2:
                return <RecipientInfoStep initialData={formData.recipientData} onContinue={(d) => { setFormData((p:any) => ({...p, recipientData:d})); setCurrentStep(3); }} onBack={() => setCurrentStep(1)} />;
            case 3:
                return <PackageRegistration initialData={formData.packageData} onContinue={(d, pr) => { setFormData((p:any) => ({...p, packageData:d, pricing:{...p.pricing, basePrice:pr}})); setCurrentStep(4); }} onBack={() => setCurrentStep(2)} />;
            case 4:
                return <RouteSelectionStep onContinue={(r, pr) => { setFormData((p:any) => ({...p, routeData:r, pricing:{...p.pricing, travelPrice:pr, totalPrice:p.pricing.basePrice+pr}})); setCurrentStep(5); }} onBack={() => setCurrentStep(3)} />;
            case 5:
                return <SignatureStep onSubmit={(url) => { setFormData((p:any) => ({...p, signatureData:{signatureUrl:url}})); setCurrentStep(6); }} onBack={() => setCurrentStep(4)} />;
            case 6:
                 const flatData = { ...formData.senderData, ...formData.recipientData, ...formData.packageData, ...formData.routeData, ...formData.signatureData, ...formData.pricing };
                 return <PaymentStep allData={flatData} onBack={() => setCurrentStep(5)} currentUser={user as any} onPaymentFinalized={() => {
                        setAds(prev => [{
                            id: Date.now().toString(),
                            from: formData.senderData.senderCity || "Départ",
                            to: formData.recipientData.recipientCity || "Arrivée",
                            date: "À l'instant",
                            price: formData.pricing.totalPrice,
                            weight: formData.packageData.weight + " kg",
                            type: formData.packageData.designation,
                            user: user?.name || "Moi",
                            // --- FIX: Safely accessing 'phone' using 'as any' since strict 'User' interface doesn't have 'phone' ---
                            userPhone: (user as any)?.phone || (user as any)?.phoneNumber || "",
                            userRating: 5.0, // Nouveau
                            avatar: (user?.name || "M").charAt(0),
                            description: formData.packageData.description || formData.packageData.designation
                        }, ...prev]);
                        resetForm();
                 }} />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 font-sans">
            <Toaster position="top-right"/>
            
            {/* HEADER */}
        {/* Header */}
            <header className="relative bg-emerald-600 text-white pt-20 pb-16 overflow-hidden">
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-400 rounded-full blur-3xl" />
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full mb-6">
                            <Zap className="w-4 h-4 text-emerald-200" />
                            <span className="text-sm font-semibold tracking-wide">Marketplace Collaborative</span>
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight">
                            Annonces <span className="text-emerald-200">Actives</span>
                        </h1>
                        
                        <p className="text-emerald-50 text-lg md:text-xl max-w-2xl mx-auto mb-8 font-medium">
                            Trouvez le transporteur idéal ou proposez vos services de livraison
                        </p>

                        {/* Stats Cards */}
                        <div className="flex justify-center gap-4 mb-10 flex-wrap">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-200" />
                                    <div className="text-left">
                                        <p className="text-2xl font-black">{ads.length}</p>
                                        <p className="text-xs text-emerald-100 font-medium">Annonces actives</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-emerald-200" />
                                    <div className="text-left">
                                        <p className="text-2xl font-black">98%</p>
                                        <p className="text-xs text-emerald-100 font-medium">Livraisons réussies</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                     <motion.button onClick={() => setIsCreateModalOpen(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                         className="mt-10 group bg-white text-emerald-800 px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl flex items-center gap-3 mx-auto"
                     >
                         <Plus className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full p-1 group-hover:rotate-90 transition-transform"/>
                         Publier une Annonce
                     </motion.button>
                    </motion.div>
                </div>
            </header>

            {/* LISTING */}
            <main className="max-w-6xl mx-auto px-4 -mt-10 relative z-20">
                <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex gap-2 mb-8">
                     <div className="relative flex-1">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"/>
                         <input type="text" placeholder="Rechercher trajet, colis..." className="w-full pl-12 pr-4 py-3 bg-transparent outline-none text-slate-700 dark:text-white font-medium"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                     </div>
                     <button className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 p-3 rounded-xl transition"><Filter className="w-5 h-5 text-slate-600 dark:text-slate-300"/></button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {filteredAds.map((ad, i) => (
                            <motion.div key={ad.id} onClick={() => setSelectedAd(ad)}
                               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                               className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-100 dark:border-slate-700 group cursor-pointer hover:border-emerald-300"
                            >
                                <div className="flex justify-between items-start mb-4">
                                     <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md">{ad.avatar}</div>
                                         <div>
                                             <h4 className="font-bold text-slate-900 dark:text-white text-sm">{ad.user}</h4>
                                             <p className="text-xs text-slate-500 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-blue-500"/> Vérifié</p>
                                         </div>
                                     </div>
                                     <div className="text-right">
                                         <span className="block font-black text-xl text-emerald-600 dark:text-emerald-400">{ad.price.toLocaleString()} F</span>
                                         <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">Proposé</span>
                                     </div>
                                </div>
                                <div className="flex items-center gap-4 mb-4 relative pl-3">
                                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-600 -z-10"/>
                                    <div className="space-y-4 w-full">
                                        <div className="relative"><div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-emerald-500 absolute -left-[17px] top-1.5"/>
                                             <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">De</p><p className="font-bold text-slate-800 dark:text-white">{ad.from}</p></div>
                                        <div className="relative"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-emerald-500 absolute -left-[17px] top-1.5"/>
                                             <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">À</p><p className="font-bold text-slate-800 dark:text-white">{ad.to}</p></div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"><Package className="w-3.5 h-3.5"/> {ad.weight}</span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"><Calendar className="w-3.5 h-3.5"/> {ad.date}</span>
                                    <button className="ml-auto p-2 bg-emerald-600 rounded-xl text-white shadow-lg hover:bg-emerald-700 transition"><ArrowRight className="w-4 h-4"/></button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </main>

            {/* MODALE D'ACCEPTATION */}
            <AnimatePresence>
                {selectedAd && (
                    <AcceptAdModal 
                        ad={selectedAd} 
                        onClose={() => setSelectedAd(null)}
                        onConfirm={handleAdAccepted}
                    />
                )}
            </AnimatePresence>

            {/* MODALE DE CRÉATION (Multistep) */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetForm} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                           className="bg-white dark:bg-slate-900 w-full sm:w-[90%] md:w-[800px] h-[90vh] sm:h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-900/10 flex justify-between items-center">
                                 <div><h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-600"/> Nouvelle Annonce</h2><p className="text-xs text-slate-500 dark:text-emerald-400">Étape {currentStep} / 6</p></div>
                                 <button onClick={resetForm} className="p-2 bg-white dark:bg-slate-800 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition shadow-sm"><X className="w-5 h-5"/></button>
                            </div>
                            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800"><motion.div animate={{ width: `${(currentStep / 6) * 100}%` }} className="h-full bg-emerald-500" /></div>
                            <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-black/20 custom-scrollbar"><div className="p-2 md:p-6">{renderStepContent()}</div></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
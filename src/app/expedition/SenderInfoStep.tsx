'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, MapPin, Home, ArrowRight, Send, Sparkles, Circle, UserPlus, X, Globe, Building, Navigation } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Alert from '@/components/ui/Alert'; // Assurez-vous que ce fichier existe

interface SenderData {
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  senderCountry: string;
  senderRegion: string;
  senderCity: string;
  senderAddress: string;
  senderLieuDit: string;
}

interface SenderInfoStepProps {
  initialData: SenderData;
  onContinue: (data: SenderData) => void;
  currentUser?: any;
}

// ======================= DONNÉES GÉOGRAPHIQUES =======================
const countries = {
  cameroun: {
    name: 'Cameroun',
    regions: {
      'centre': { name: 'Centre', cities: ['Yaoundé', 'Mbalmayo', 'Akonolinga', 'Bafia', 'Ntui', 'Mfou', 'Obala', 'Okola', 'Soa'] },
      'littoral': { name: 'Littoral', cities: ['Douala', 'Edéa', 'Nkongsamba', 'Yabassi', 'Loum', 'Manjo', 'Mbanga', 'Mouanko'] },
      'ouest': { name: 'Ouest', cities: ['Bafoussam', 'Dschang', 'Bandjoun', 'Mbouda', 'Bangangté', 'Foumban', 'Kékem'] },
      'nord-ouest': { name: 'Nord-Ouest', cities: ['Bamenda', 'Kumbo', 'Wum', 'Ndop', 'Mbengwi', 'Bali', 'Bafut'] },
      'sud-ouest': { name: 'Sud-Ouest', cities: ['Buéa', 'Limbe', 'Kumba', 'Mamfe', 'Tiko', 'Idenau', 'Fontem'] },
      'adamaoua': { name: 'Adamaoua', cities: ['Ngaoundéré', 'Meiganga', 'Tibati', 'Tignère', 'Banyo', 'Kontcha'] },
      'nord': { name: 'Nord', cities: ['Garoua', 'Maroua', 'Guider', 'Figuil', 'Poli', 'Rey-Bouba', 'Tcholliré'] },
      'extreme-nord': { name: 'Extrême-Nord', cities: ['Maroua', 'Mokolo', 'Kousséri', 'Yagoua', 'Mora', 'Waza', 'Kaélé'] },
      'est': { name: 'Est', cities: ['Bertoua', 'Batouri', 'Abong-Mbang', 'Yokadouma', 'Kenzou', 'Garoua-Boulaï'] },
      'sud': { name: 'Sud', cities: ['Ebolowa', 'Sangmélima', 'Kribi', 'Ambam', 'Lolodorf', 'Campo', 'Mvangane'] }
    }
  },
  nigeria: {
    name: 'Nigeria',
    regions: {
      'lagos': { name: 'Lagos', cities: ['Lagos', 'Ikeja', 'Epe', 'Ikorodu', 'Badagry', 'Mushin', 'Alimosho'] },
      'abuja': { name: 'Abuja FCT', cities: ['Abuja', 'Gwagwalada', 'Kuje', 'Abaji', 'Bwari', 'Kwali'] },
      // ... autres régions
    }
  }
};

// ======================= COMPOSANTS UI =======================

const FloatingIcon = ({ children, delay = 0, styleClass }: { children: React.ReactNode; delay?: number, styleClass?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.8 }}
    animate={{ opacity: 0.3, y: 0, scale: 1 }} // Opacité augmentée pour visibilité
    transition={{ 
      duration: 3, 
      delay, 
      repeat: Infinity, 
      repeatType: "reverse", 
      ease: "easeInOut" 
    }}
    className={`absolute z-0 ${styleClass}`}
  >
    {children}
  </motion.div>
);

const InputField = ({ icon: Icon, id, error, ...props }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="group"
  >
    <label htmlFor={id} className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 tracking-wider uppercase">
      {props.label}
    </label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Icon className={`w-4 h-4 transition-colors duration-300 ${error ? 'text-red-500' : 'text-gray-400 group-focus-within:text-orange-500'}`} />
      </div>
      <input
        id={id}
        {...props}
        className={`w-full pl-10 pr-3 py-3 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border-2 rounded-xl transition-all duration-200 
          bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm outline-none
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
            : 'border-gray-200 dark:border-gray-700 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
          } shadow-sm hover:border-gray-300 dark:hover:border-gray-600`}
      />
    </div>
  </motion.div>
);

const SelectField = ({ icon: Icon, id, error, children, ...props }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="group"
  >
    <label htmlFor={id} className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 tracking-wider uppercase">
      {props.label}
    </label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <Icon className={`w-4 h-4 transition-colors duration-300 ${error ? 'text-red-500' : 'text-gray-400 group-focus-within:text-orange-500'}`} />
      </div>
      <select
        id={id}
        {...props}
        className={`w-full pl-10 pr-8 py-3 text-sm text-gray-800 dark:text-gray-100 border-2 rounded-xl appearance-none transition-all duration-200 
          bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm outline-none cursor-pointer
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
            : 'border-gray-200 dark:border-gray-700 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'
          } shadow-sm hover:border-gray-300 dark:hover:border-gray-600`}
      >
        {children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Navigation className="w-3 h-3 text-gray-400" />
      </div>
    </div>
  </motion.div>
);

const BreakingNewsNotification = ({ isVisible, onClose, onRegister, onContinueWithout }: { isVisible: boolean; onClose: () => void; onRegister: () => void; onContinueWithout: () => void;}) => (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
            initial={{ y: -100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: -100, opacity: 0 }} 
            transition={{ duration: 0.5, ease: "easeOut" }} 
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 shadow-2xl"
        >
          <div className="relative overflow-hidden">
             {/* Background Animation */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <motion.div animate={{ x: ['0%', '100%'] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent" />
            </div>

            <div className="relative px-4 py-3 md:py-4">
              <div className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto gap-3 md:gap-6">
                  
                  {/* Content Left */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
                        className="hidden md:flex items-center bg-white/20 rounded-full px-3 py-1 backdrop-blur-sm flex-shrink-0"
                    >
                      <Sparkles className="w-4 h-4 text-white mr-2" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Info</span>
                    </motion.div>
                    <p className="text-white font-medium text-sm md:text-base text-center md:text-left flex-1">
                        🎉 <span className="font-bold">Créez votre compte</span> gratuitement pour sauvegarder vos adresses et suivre vos envois en temps réel !
                    </p>
                    {/* Close Mobile */}
                    <button onClick={onClose} className="md:hidden text-white/80 hover:text-white p-1"><X className="w-5 h-5" /></button>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                    <button 
                        onClick={onRegister} 
                        className="bg-white text-orange-600 px-5 py-2 rounded-full font-bold text-sm hover:bg-orange-50 transition-colors shadow-lg active:scale-95 flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" /> S'inscrire
                    </button>
                    <button 
                        onClick={onContinueWithout} 
                        className="text-white text-sm font-semibold hover:text-orange-100 underline underline-offset-4 decoration-white/50"
                    >
                        Continuer invité
                    </button>
                    <button onClick={onClose} className="hidden md:block text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                  </div>
              </div>
            </div>
            <div className="h-1 bg-white/20 w-full" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
);


// ======================= COMPOSANT PRINCIPAL =======================

export default function SenderInfoStep({ initialData, onContinue, currentUser }: SenderInfoStepProps) {
  const [formData, setFormData] = useState<SenderData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const router = useRouter();
  const { user: authUser } = useAuth();
  
  // États locaux d'alerte (Validation interne)
  const [alert, setAlert] = useState<{show: boolean, type: 'error'|'info'|'warning', msg: string, title: string}>({ show: false, type: 'info', msg: '', title: '' });

  const isUserLoggedIn = !!(currentUser || authUser);

  // Gestion des Cascades Pays -> Région -> Ville
  useEffect(() => {
    if (formData.senderCountry) {
      const countryData = countries[formData.senderCountry as keyof typeof countries];
      // Si la région n'existe pas dans le nouveau pays, on reset
      if (countryData && !countryData.regions.hasOwnProperty(formData.senderRegion)) {
        setFormData(prev => ({ ...prev, senderRegion: '', senderCity: '' }));
      }
    }
  }, [formData.senderCountry, formData.senderRegion]);

  useEffect(() => {
    if (formData.senderCountry && formData.senderRegion) {
      const countryData = countries[formData.senderCountry as keyof typeof countries];
      const regionData = (countryData.regions as any)[formData.senderRegion];
      // Si la ville n'est pas dans la nouvelle région, on reset
      if (regionData && !regionData.cities.includes(formData.senderCity)) {
        setFormData(prev => ({ ...prev, senderCity: '' }));
      }
    }
  }, [formData.senderCountry, formData.senderRegion, formData.senderCity]);

  // Handler Générique
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Nettoyer l'erreur au changement
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (alert.show) setAlert(prev => ({ ...prev, show: false }));
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAlert({ show: false, type: 'info', msg: '', title: '' });

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.senderName.trim()) newErrors.senderName = "Requis";
    if (!formData.senderPhone.trim()) newErrors.senderPhone = "Requis";
    if (!formData.senderAddress.trim()) newErrors.senderAddress = "Requis";
    if (!formData.senderCity) newErrors.senderCity = "Requis";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setAlert({ show: true, type: 'error', title: "Informations incomplètes", msg: "Veuillez vérifier les champs rouges." });
      return;
    }

    setIsSubmitting(true);
    // Simuler traitement
    await new Promise(resolve => setTimeout(resolve, 500));

    // Si Non Connecté : On déclenche le flux Breaking News ou Alert Warning
    if (!isUserLoggedIn) {
       // Déclenche la Top Notification pour inciter à l'inscription
       setShowNotification(true);
       
       // Fallback local: Si l'utilisateur clique 'Suivant' on affiche aussi une alerte intégrée au cas où il rate la notification top
       setAlert({ 
           show: true, 
           type: 'warning', 
           title: "Mode Invité", 
           msg: "Nous vous recommandons de vous connecter pour sauvegarder vos adresses." 
       });
       
       setIsSubmitting(false);
       
       // Timeout Auto-Continue pour l'UX fluide si pas d'action (optionnel, 10s)
       // setTimeout(() => onContinue(formData), 10000); 

    } else {
       onContinue(formData);
       setIsSubmitting(false);
    }
  };

  // Actions Navigation
  const handleRegister = () => {
    const prefill = {
       name: formData.senderName,
       email: formData.senderEmail,
       phone: formData.senderPhone
    };
    localStorage.setItem('registration_prefill', JSON.stringify(prefill));
    
    // Sauvegarder état courant avant de partir (au cas où on revient)
    onContinue(formData); 
    router.push('/register');
  };

  const handleContinueWithout = () => {
    setShowNotification(false);
    setAlert(prev => ({...prev, show: false}));
    onContinue(formData);
  };

  const availableRegions = formData.senderCountry ? countries[formData.senderCountry as keyof typeof countries]?.regions || {} : {};
  
  const availableCities = (() => {
    if (formData.senderCountry && formData.senderRegion) {
        const countryData = countries[formData.senderCountry as keyof typeof countries];
        if (countryData) {
            const regionData = (countryData.regions as any)[formData.senderRegion];
            return regionData?.cities || [];
        }
    }
    return [];
  })();

  return (
    <>
      {/* 1. TOP BREAKING NEWS NOTIFICATION (Superposition Z-50) */}
      <BreakingNewsNotification 
          isVisible={showNotification} 
          onClose={() => setShowNotification(false)} 
          onRegister={handleRegister} 
          onContinueWithout={handleContinueWithout} 
      />

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden transition-colors duration-300">

        {/* 3. MAIN CONTENT (Devant Z-20) */}
        <div className="relative z-20 flex items-center justify-center min-h-[calc(100vh-80px)] p-4 md:p-8">
          
          <motion.div 
            className="w-full max-w-4xl" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
          >
            {/* CARD FORMULAIRE */}
            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-black/50 border border-white/40 dark:border-white/5 p-6 sm:p-10 relative overflow-hidden">
              
              {/* Effet Brillance Bordure */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-50"></div>

              {/* Titre & Intro */}
              <div className="text-center mb-8 relative">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-slate-800 rounded-2xl mb-4 shadow-inner">
                  <User className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
                  Qui envoie ?
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto font-medium">
                  Renseignez vos informations pour assurer le suivi du colis.
                </p>
              </div>

              {/* ALERT IN-CARD */}
              <div className="mb-6 relative z-30">
                 <Alert
                   isVisible={alert.show} 
                   type={alert.type as any} 
                   title={alert.title} 
                   message={alert.msg} 
                   onClose={() => setAlert(prev => ({ ...prev, show: false }))}
                 />
              </div>

              {/* SPECIAL LOGIN BLOCK (Visible si Alerte Warning + User null) */}
              {!currentUser && alert.show && alert.type === 'warning' && (
                  <motion.div 
                     initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                     className="mb-6 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                       <div className="flex items-center gap-3">
                           <UserPlus className="w-8 h-8 text-orange-600"/>
                           <div className="text-left">
                               <h4 className="font-bold text-orange-800 dark:text-orange-100">Pas encore de compte ?</h4>
                               <p className="text-xs text-orange-600 dark:text-orange-300">Créez-en un pour ne pas perdre vos données.</p>
                           </div>
                       </div>
                       <div className="flex gap-2">
                           <button onClick={handleRegister} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-700 transition shadow">Créer Compte</button>
                           <button onClick={handleContinueWithout} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-white px-4 py-2 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition">Continuer</button>
                       </div>
                  </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. IDENTITÉ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField icon={User} id="senderName" name="senderName" value={formData.senderName} onChange={handleChange} label="Nom & Prénom" placeholder="Ex: Jean Dupont" error={errors.senderName} />
                  <InputField icon={Phone} id="senderPhone" name="senderPhone" value={formData.senderPhone} onChange={handleChange} label="Téléphone Mobile" placeholder="Ex: 699 00 00 00" error={errors.senderPhone} />
                </div>

                <InputField icon={Mail} type="email" id="senderEmail" name="senderEmail" value={formData.senderEmail} onChange={handleChange} label="Email (Recommandé)" placeholder="contact@email.com" />

                {/* 2. ADRESSE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                  <SelectField icon={Globe} id="senderCountry" name="senderCountry" value={formData.senderCountry} onChange={handleChange} label="Pays" error={errors.senderCountry}>
                    <option value="">Choix...</option>
                    {Object.entries(countries).map(([key, country]) => (<option key={key} value={key}>{country.name}</option>))}
                  </SelectField>
                  
                  <SelectField icon={Building} id="senderRegion" name="senderRegion" value={formData.senderRegion} onChange={handleChange} label="Région" error={errors.senderRegion} disabled={!formData.senderCountry}>
                    <option value="">Choix...</option>
                    {Object.entries(availableRegions).map(([key, region]) => (<option key={key} value={key}>{(region as { name: string }).name}</option>))}
                  </SelectField>
                  
                  <SelectField icon={Navigation} id="senderCity" name="senderCity" value={formData.senderCity} onChange={handleChange} label="Ville" error={errors.senderCity} disabled={!formData.senderRegion}>
                    <option value="">Choix...</option>
                    {availableCities.map((city: string) => (<option key={city} value={city}>{city}</option>))}
                  </SelectField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField icon={MapPin} id="senderAddress" name="senderAddress" value={formData.senderAddress} onChange={handleChange} label="Quartier / Adresse" placeholder="Ex: Bastos, Rue 123" error={errors.senderAddress} />
                    <InputField icon={Home} id="senderLieuDit" name="senderLieuDit" value={formData.senderLieuDit} onChange={handleChange} label="Lieu-dit / Repère" placeholder="Ex: Face Boulangerie..." error={errors.senderLieuDit} />
                </div>

                <div className="pt-6 flex justify-end">
                  <motion.button 
                     type="submit" 
                     disabled={isSubmitting} 
                     whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -10px rgba(249,115,22,0.4)" }} 
                     whileTap={{ scale: 0.98 }} 
                     className={`
                        w-full md:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all
                        ${isSubmitting ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-white' : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:to-orange-500'}
                     `}
                  >
                    <AnimatePresence mode="wait">
                      {isSubmitting ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Traitement...
                        </motion.div>
                      ) : (
                        <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
                          SUIVANT <ArrowRight className="w-4 h-4 ml-2" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>

              </form>
            </div>
            
            {/* Info Bas de page */}
            {!currentUser && (
               <p className="text-center text-xs text-slate-500 mt-6 max-w-lg mx-auto opacity-70">
                   En continuant, vous acceptez nos CGU. Créez un compte pour une meilleure expérience.
               </p>
            )}

          </motion.div>
        </div>
      </div>
    </>
  );
}
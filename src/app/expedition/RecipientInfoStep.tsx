'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, MapPin, Home, ArrowRight, ArrowLeft, Target, Sparkles, Circle, Globe, Building, Navigation } from 'lucide-react';

interface RecipientData {
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  recipientCountry: string;
  recipientRegion: string;
  recipientCity: string;
  recipientAddress: string;
  recipientLieuDit: string;
}

interface RecipientInfoStepProps {
  initialData: RecipientData;
  onContinue: (data: RecipientData) => void;
  onBack: () => void;
}

// Données des pays et régions (identiques à SenderInfoStep)
const countries = {
  cameroun: {
    name: 'Cameroun',
    regions: {
      'centre': {
        name: 'Centre',
        cities: ['Yaoundé', 'Mbalmayo', 'Akonolinga', 'Bafia', 'Ntui', 'Mfou', 'Obala', 'Okola', 'Soa']
      },
      'littoral': {
        name: 'Littoral', 
        cities: ['Douala', 'Edéa', 'Nkongsamba', 'Yabassi', 'Loum', 'Manjo', 'Mbanga', 'Mouanko']
      },
      'ouest': {
        name: 'Ouest',
        cities: ['Bafoussam', 'Dschang', 'Bandjoun', 'Mbouda', 'Bangangté', 'Foumban', 'Kékem']
      },
      'nord-ouest': {
        name: 'Nord-Ouest',
        cities: ['Bamenda', 'Kumbo', 'Wum', 'Ndop', 'Mbengwi', 'Bali', 'Bafut']
      },
      'sud-ouest': {
        name: 'Sud-Ouest', 
        cities: ['Buéa', 'Limbe', 'Kumba', 'Mamfe', 'Tiko', 'Idenau', 'Fontem']
      },
      'adamaoua': {
        name: 'Adamaoua',
        cities: ['Ngaoundéré', 'Meiganga', 'Tibati', 'Tignère', 'Banyo', 'Kontcha']
      },
      'nord': {
        name: 'Nord',
        cities: ['Garoua', 'Maroua', 'Guider', 'Figuil', 'Poli', 'Rey-Bouba', 'Tcholliré']
      },
      'extreme-nord': {
        name: 'Extrême-Nord',
        cities: ['Maroua', 'Mokolo', 'Kousséri', 'Yagoua', 'Mora', 'Waza', 'Kaélé']
      },
      'est': {
        name: 'Est',
        cities: ['Bertoua', 'Batouri', 'Abong-Mbang', 'Yokadouma', 'Kenzou', 'Garoua-Boulaï']
      },
      'sud': {
        name: 'Sud',
        cities: ['Ebolowa', 'Sangmélima', 'Kribi', 'Ambam', 'Lolodorf', 'Campo', 'Mvangane']
      }
    }
  },
  nigeria: {
    name: 'Nigeria',
    regions: {
      'lagos': {
        name: 'Lagos',
        cities: ['Lagos', 'Ikeja', 'Epe', 'Ikorodu', 'Badagry', 'Mushin', 'Alimosho']
      },
      'abuja': {
        name: 'Abuja FCT',
        cities: ['Abuja', 'Gwagwalada', 'Kuje', 'Abaji', 'Bwari', 'Kwali']
      },
      'kano': {
        name: 'Kano',
        cities: ['Kano', 'Wudil', 'Gwarzo', 'Rano', 'Karaye', 'Rimin Gado']
      },
      'rivers': {
        name: 'Rivers',
        cities: ['Port Harcourt', 'Obio-Akpor', 'Eleme', 'Ikwerre', 'Oyigbo', 'Okrika']
      },
      'oyo': {
        name: 'Oyo',
        cities: ['Ibadan', 'Ogbomoso', 'Oyo', 'Iseyin', 'Saki', 'Igboho', 'Eruwa']
      },
      'kaduna': {
        name: 'Kaduna', 
        cities: ['Kaduna', 'Zaria', 'Kafanchan', 'Kagoro', 'Zonkwa', 'Makarfi']
      },
      'ogun': {
        name: 'Ogun',
        cities: ['Abeokuta', 'Sagamu', 'Ijebu-Ode', 'Ota', 'Ilaro', 'Ayetoro']
      },
      'anambra': {
        name: 'Anambra',
        cities: ['Awka', 'Onitsha', 'Nnewi', 'Ekwulobia', 'Agulu', 'Ihiala']
      }
    }
  }
} as const;

// Add type definitions for better type safety
type CountryKey = keyof typeof countries;
type RegionData = {
  name: string;
  cities: string[];
};

const FloatingIcon = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 0.4, y: 0 }}
    transition={{ duration: 0.6, delay, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
    className="absolute text-orange-200 dark:text-orange-300/40"
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
    <label htmlFor={id} className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
      {props.label}
    </label>
    <div className="relative">
      <motion.div
        className="absolute left-3 top-1/2 -translate-y-1/2"
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-orange-500 dark:group-focus-within:text-orange-400 transition-colors" />
      </motion.div>
      <input
        id={id}
        {...props}
        className={`w-full pl-10 pr-3 py-2.5 text-sm border-2 rounded-lg transition-all duration-200 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100
          ${error ? 'border-red-300 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400'}
          focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-400/20 focus:bg-white dark:focus:bg-gray-800 shadow-sm hover:shadow-md dark:shadow-gray-900/20 dark:hover:shadow-gray-900/40`}
      />
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <Circle className="w-2 h-2 fill-red-500 dark:fill-red-400 text-red-500 dark:text-red-400" />
          </motion.div>
        )}
      </AnimatePresence>
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
    <label htmlFor={id} className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
      {props.label}
    </label>
    <div className="relative">
      <motion.div
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-orange-500 dark:group-focus-within:text-orange-400 transition-colors" />
      </motion.div>
      <select
        id={id}
        {...props}
        className={`w-full pl-10 pr-8 py-2.5 text-sm border-2 rounded-lg appearance-none transition-all duration-200 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100
          ${error ? 'border-red-300 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400'}
          focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-orange-400/20 focus:bg-white dark:focus:bg-gray-800 shadow-sm hover:shadow-md dark:shadow-gray-900/20 dark:hover:shadow-gray-900/40 cursor-pointer`}
      >
        {children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </motion.div>
);

export default function RecipientInfoStep({ initialData, onContinue, onBack }: RecipientInfoStepProps) {
  const [formData, setFormData] = useState<RecipientData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- CORRECTION START ---
  // Effet pour réinitialiser la région et la ville si le pays change et que la région n'est plus valide.
  useEffect(() => {
    if (formData.recipientCountry) {
      const countryData = countries[formData.recipientCountry as keyof typeof countries];
      if (countryData && !countryData.regions.hasOwnProperty(formData.recipientRegion)) {
        setFormData(prev => ({ ...prev, recipientRegion: '', recipientCity: '' }));
      }
    }
  }, [formData.recipientCountry, formData.recipientRegion]);

  // Effet pour réinitialiser la ville si la région change et que la ville n'est plus valide.
  useEffect(() => {
    if (formData.recipientCountry && formData.recipientRegion) {
      const countryData = countries[formData.recipientCountry as keyof typeof countries];
      const regionData = (countryData.regions as any)[formData.recipientRegion];
      if (regionData && !regionData.cities.includes(formData.recipientCity)) {
        setFormData(prev => ({ ...prev, recipientCity: '' }));
      }
    }
  }, [formData.recipientCountry, formData.recipientRegion, formData.recipientCity]);
  // --- CORRECTION END ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (formData.recipientName.trim().length < 2) {
      newErrors.recipientName = "Nom requis";
    }
    if (!/^(6|2)(?:[235-9]\d{7})$/.test(formData.recipientPhone.replace(/\s/g, ''))) {
      newErrors.recipientPhone = "Format invalide";
    }
    if (!formData.recipientCountry) {
      newErrors.recipientCountry = "Pays requis";
    }
    if (!formData.recipientRegion) {
      newErrors.recipientRegion = "Région requise";
    }
    if (!formData.recipientCity) {
      newErrors.recipientCity = "Ville requise";
    }
    if (!formData.recipientAddress.trim()) {
      newErrors.recipientAddress = "Adresse requise";
    }
    if (!formData.recipientLieuDit.trim()) {
      newErrors.recipientLieuDit = "Lieu-dit requis";
    }
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onContinue(formData);
    setIsSubmitting(false);
  };

  const availableRegions = formData.recipientCountry ? countries[formData.recipientCountry as CountryKey]?.regions || {} : {};
  const availableCities = (() => {
    if (formData.recipientCountry && formData.recipientRegion) {
      const countryData = countries[formData.recipientCountry as CountryKey];
      if (countryData) {
        // Type-safe access to the region with proper typing
        const regionData = countryData.regions[formData.recipientRegion as keyof typeof countryData.regions] as RegionData | undefined;
        return regionData?.cities || [];
      }
    }
    return [];
  })();
  

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent relative overflow-hidden">
      <FloatingIcon delay={0}>
        <Target className="w-16 h-16 absolute top-20 right-20" />
      </FloatingIcon>
      <FloatingIcon delay={0.5}>
        <Circle className="w-12 h-12 absolute top-40 left-10" />
      </FloatingIcon>
      <FloatingIcon delay={1}>
        <Circle className="w-8 h-8 absolute bottom-40 right-40" />
      </FloatingIcon>
      <FloatingIcon delay={1.5}>
        <Sparkles className="w-10 h-10 absolute bottom-20 left-20" />
      </FloatingIcon>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <motion.div
          className="w-full max-w-3xl"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            className="bg-white dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-xl dark:shadow-gray-900/50 border border-white/50 dark:border-gray-700/50 p-6"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-3"
              >
                <Target className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1"
              >
                Informations destinataire
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                À qui souhaitez-vous envoyer ce colis ?
              </motion.p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  icon={User}
                  id="recipientName"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleChange}
                  label="Nom Complet"
                  placeholder="Marie Mbarga"
                  error={errors.recipientName}
                />
                <InputField
                  icon={Phone}
                  id="recipientPhone"
                  name="recipientPhone"
                  value={formData.recipientPhone}
                  onChange={handleChange}
                  label="Téléphone"
                  placeholder="677123456"
                  error={errors.recipientPhone}
                />
              </div>

              <InputField
                icon={Mail}
                type="email"
                id="recipientEmail"
                name="recipientEmail"
                value={formData.recipientEmail}
                onChange={handleChange}
                label="Email (optionnel)"
                placeholder="nom@exemple.com"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SelectField
                  icon={Globe}
                  id="recipientCountry"
                  name="recipientCountry"
                  value={formData.recipientCountry}
                  onChange={handleChange}
                  label="Pays de destination"
                  error={errors.recipientCountry}
                >
                  <option value="">Sélectionner un pays</option>
                  {Object.entries(countries).map(([key, country]) => (
                    <option key={key} value={key}>{country.name}</option>
                  ))}
                </SelectField>

                <SelectField
                  icon={Building}
                  id="recipientRegion"
                  name="recipientRegion"
                  value={formData.recipientRegion}
                  onChange={handleChange}
                  label="Région de destination"
                  error={errors.recipientRegion}
                  disabled={!formData.recipientCountry}
                >
                  <option value="">Sélectionner une région</option>
                  {Object.entries(availableRegions).map(([key, region]) => (
                    <option key={key} value={key}>{(region as RegionData).name}</option>
                  ))}
                </SelectField>

                <SelectField
                  icon={Navigation}
                  id="recipientCity"
                  name="recipientCity"
                  value={formData.recipientCity}
                  onChange={handleChange}
                  label="Ville de destination"
                  error={errors.recipientCity}
                  disabled={!formData.recipientRegion}
                >
                  <option value="">Sélectionner une ville</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </SelectField>
              </div>

              <InputField
                icon={MapPin}
                id="recipientAddress"
                name="recipientAddress"
                value={formData.recipientAddress}
                onChange={handleChange}
                label="Adresse Complète"
                placeholder="Mvan, Yaoundé"
                error={errors.recipientAddress}
              />
              <InputField
                icon={Home}
                id="recipientLieuDit"
                name="recipientLieuDit"
                value={formData.recipientLieuDit}
                onChange={handleChange}
                label="Lieu-dit"
                placeholder="Face Boulangerie Mvan, portail rouge"
                error={errors.recipientLieuDit}
              />

              <AnimatePresence>
                {Object.values(errors).some(error => error) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
                  >
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                      Veuillez corriger les erreurs ci-dessus
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-4 flex justify-between items-center">
                <motion.button
                  type="button"
                  onClick={onBack}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md dark:shadow-gray-900/20 dark:hover:shadow-gray-900/40"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`inline-flex items-center justify-center px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl dark:shadow-gray-900/30 dark:hover:shadow-gray-900/50
                    ${isSubmitting 
                      ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                      : 'bg-orange-600 dark:bg-orange-600 hover:bg-orange-700 dark:hover:bg-orange-500 active:bg-orange-800 dark:active:bg-orange-700'} 
                    text-white transform hover:-translate-y-0.5`}
                >
                  <AnimatePresence mode="wait">
                    {isSubmitting ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center"
                      >
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Traitement...
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center"
                      >
                        Continuer
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
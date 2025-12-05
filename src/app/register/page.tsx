'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Briefcase, Clock, Building, ChevronLeft, Check, Mail, Lock, Phone, MapPin, Calendar, Users, Truck, Camera, Upload, Globe, FileText, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
// ON IMPORTE NOTRE SERVICE ET NOS TYPES
import { authService } from '@/services/authService';
import { UserRegistrationRequest, BusinessActorRegistrationRequest, BusinessActorType } from '@/types/api';
// Types pour améliorer la sécurité des types
interface City {
  name: string;
  cities: string[];
}

interface Country {
  name: string;
  regions: Record<string, City>;
}

// Données des pays et régions
const countries: Record<string, Country> = {
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
      'kano': { name: 'Kano', cities: ['Kano', 'Wudil', 'Gwarzo', 'Rano', 'Karaye', 'Rimin Gado'] },
      'rivers': { name: 'Rivers', cities: ['Port Harcourt', 'Obio-Akpor', 'Eleme', 'Ikwerre', 'Oyigbo', 'Okrika'] },
      'oyo': { name: 'Oyo', cities: ['Ibadan', 'Ogbomoso', 'Oyo', 'Iseyin', 'Saki', 'Igboho', 'Eruwa'] },
      'kaduna': { name: 'Kaduna', cities: ['Kaduna', 'Zaria', 'Kafanchan', 'Kagoro', 'Zonkwa', 'Makarfi'] },
      'ogun': { name: 'Ogun', cities: ['Abeokuta', 'Sagamu', 'Ijebu-Ode', 'Ota', 'Ilaro', 'Ayetoro'] },
      'anambra': { name: 'Anambra', cities: ['Awka', 'Onitsha', 'Nnewi', 'Ekwulobia', 'Agulu', 'Ihiala'] }
    }
  }
};

const Stepper = ({ currentStep, steps }: { currentStep: number, steps: any[] }) => {
  return (
    <div className="flex items-center justify-center mb-8 overflow-x-auto">
      <div className="flex items-center space-x-2 min-w-max">
        {steps.map((step, index) => (
          <React.Fragment key={step.num}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm transition-all duration-300 ${currentStep >= step.num ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                {currentStep > step.num ? <Check className="w-4 h-4" /> : step.num}
              </div>
              <p className={`mt-1 text-xs font-medium text-center ${currentStep >= step.num ? 'text-orange-600' : 'text-gray-500'}`}>{step.title}</p>
            </div>
            {index < steps.length - 1 && <div className={`w-8 h-px transition-all duration-300 ${currentStep > index + 1 ? 'bg-orange-500' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const InputField = ({ id, label, type = 'text', value, onChange, placeholder, required = true, icon: Icon, options = null }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
      {options ? (
        <select {...{ id, name: id, value, onChange, required }} className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-500 transition-all text-sm`}>
          <option value="">{placeholder}</option>
          {options.map((opt: any) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input 
          {...{ id, name: id, type, value, onChange, required, placeholder }} 
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:border-black focus:border-orange-500 transition-all text-sm`} 
        />
      )}
    </div>
  </div>
);

const SelectField = ({ icon: Icon, id, label, children, ...props }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="group space-y-1"
  >
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <div className="relative">
      <motion.div
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className="w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
      </motion.div>
      <select
        id={id}
        {...props}
        className="w-full pl-10 pr-8 py-2.5 text-sm text-gray-800 border-2 rounded-lg appearance-none transition-all duration-200 
          bg-white/80 backdrop-blur-sm border-gray-200 focus:border-orange-500
          focus:ring-2 focus:ring-orange-500/20 focus:bg-white shadow-sm hover:shadow-md cursor-pointer"
      >
        {children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </motion.div>
);



const FileUploadField = ({ id, label, onChange, required = true, accept = "image/*" }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      <div className="flex items-center justify-center w-full">
        <label htmlFor={id} className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-4 text-gray-500" />
            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Cliquez pour télécharger</span></p>
            <p className="text-xs text-gray-500">PNG, JPG ou JPEG</p>
          </div>
          <input id={id} name={id} type="file" accept={accept} onChange={onChange} required={required} className="hidden" />
        </label>
      </div>
    </div>
  </div>
);

// Composant EnhancedImageUploadField amélioré avec design orange et comportement optimisé
const EnhancedImageUploadField = ({ 
  id, 
  label, 
  required = true, 
  onChange, 
  previewUrl, 
  guideType = null,
  onShowGuide = null,
  isGuideViewed = false
}: {
  id: string;
  label: string;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  previewUrl: string | null;
  guideType?: string | null;
  onShowGuide?: ((guideType: string) => void) | null;
  isGuideViewed?: boolean;
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleClick = () => {
    // Toujours ouvrir le sélecteur de fichiers
    fileInputRef.current?.click();
    
    // Afficher le guide seulement s'il n'a pas encore été vu
    if (guideType && onShowGuide && !isGuideViewed) {
      onShowGuide(guideType);
    }
  };
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-800">{label}</label>
      <div className="relative group">
        <div 
          className={`w-full h-36 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden ${
            previewUrl 
              ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50' 
              : 'border-orange-200 bg-gradient-to-br from-orange-25 via-orange-50 to-amber-25 hover:border-orange-400 hover:from-orange-50 hover:to-amber-100 hover:shadow-lg hover:scale-[1.02]'
          }`}
          onClick={handleClick}
        >
          <input 
            id={id}
            name={id}
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={onChange}
            required={required}
            className="hidden"
            ref={fileInputRef}
          />
          
          <AnimatePresence mode="wait">
            {previewUrl ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-full h-full"
              >
                <img src={previewUrl} alt="Prévisualisation" className="w-full h-full object-cover rounded-lg" />
                
                {/* Overlay au survol avec effet orange */}
                <div className="absolute inset-0 bg-gradient-to-t from-orange-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 flex items-end justify-center pb-4 transition-all duration-300 rounded-lg">
                  <div className="flex items-center space-x-2 text-white">
                    <Camera className="w-5 h-5" />
                    <span className="text-sm font-semibold">Modifier la photo</span>
                  </div>
                </div>

                {/* Badge de statut en haut à droite */}
                <div className="absolute top-2 right-2">
                  <div className="bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center text-center p-4"
              >
                {/* Icône principale avec animation */}
                <motion.div 
                  className="flex items-center space-x-3 mb-3"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-3 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full text-white shadow-lg">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  
                  {/* Indicateur de guide */}
                  {guideType && (
                    <motion.div 
                      className={`p-2 rounded-full shadow-md transition-all duration-300 ${
                        isGuideViewed 
                          ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' 
                          : 'bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 animate-pulse'
                      }`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      {isGuideViewed ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <div className="w-5 h-5 flex items-center justify-center">
                          <span className="text-sm font-bold">?</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>

                {/* Texte principal */}
                <motion.div 
                  className="space-y-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-base font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    {guideType && !isGuideViewed ? 'Guide Photo + Sélection' : 'Sélectionner une photo'}
                  </p>
                  
                  <p className="text-sm text-gray-600">
                    {guideType && !isGuideViewed 
                      ? 'Conseils de prise de vue inclus' 
                      : 'PNG, JPG ou JPEG (Max 5MB)'}
                  </p>

                  {/* Statut du guide */}
                  {guideType && isGuideViewed && (
                    <motion.p 
                      className="text-xs text-green-600 font-medium flex items-center justify-center space-x-1"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Guide déjà consulté</span>
                    </motion.p>
                  )}
                </motion.div>

                {/* Effet de brillance animé */}
                {!isGuideViewed && guideType && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-200/30 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      repeatDelay: 3,
                      ease: "easeInOut" 
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bordure animée pour les champs avec guide non vu */}
        {guideType && !isGuideViewed && !previewUrl && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-orange-400/50 pointer-events-none"
            animate={{ 
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.01, 1] 
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>

      {/* Texte d'aide sous le composant */}
      {guideType && (
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-xs text-gray-500">
            {isGuideViewed 
              ? 'Guide photo disponible lors de la première utilisation'
              : 'Un guide s\'affichera pour vous aider avec la prise de vue'}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default function RegisterProPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string | null>>({
    identity_photo: null,
    id_card_front: null,
    id_card_back: null,
    niu_document: null,
    relay_point_photo: null,
    vehicle_photo_front: null,
    vehicle_photo_back: null,
    driving_license_front: null,
    driving_license_back: null,
  });
  const [highlightedRole, setHighlightedRole] = useState<string | null>(null);
  const [pageMode, setPageMode] = useState<'register' | 'upgrade'>('register');
  const [accountType, setAccountType] = useState<'CLIENT' | 'FREELANCE' | 'AGENCY' | 'LIVREUR' | null>(null);
  const [formData, setFormData] = useState({
    // Identification
    manager_name: '', email: '', password: '', confirmPassword: '',
    // Coordonnées
    phone_number: '', birth_date: '', 
    country: '', region: '', city: '', // Remplace nationality
    home_address: '', home_address_locality: '', 
    id_card_number: '', niu: '',
    // Point Relais (Freelance/Agence)
    relay_point_name: '', relay_point_address: '', relay_point_locality: '', opening_hours: '', storage_capacity: 'Petit',
    // Véhicule (Livreur)
    vehicle_type: '', vehicle_brand: '', vehicle_registration: '', vehicle_color: '', trunk_dimensions: '',
    driving_license_front: null, driving_license_back: null, accident_history: '',     // Nouveaux champs pour les fichiers (File | null)
    identity_photo: null as File | null,
    id_card_front: null as File | null,
    id_card_back: null as File | null,
    niu_document: null as File | null, relay_point_photo: null as File | null,     vehicle_photo_front: null as File | null,
    vehicle_photo_back: null as File | null, 
  });

  // Ajouter ces états après les états existants dans ton composant
const [showPhotoGuide, setShowPhotoGuide] = useState<string | null>(null);
const [showScheduleModal, setShowScheduleModal] = useState(false);
const [selectedDays, setSelectedDays] = useState<string[]>([]);
const [daySchedules, setDaySchedules] = useState<Record<string, { start: string; end: string }>>({});
const [viewedGuides, setViewedGuides] = useState<string[]>([]);


const photoGuides = {
  vehicle_front: {
    title: "Photo du véhicule (Face avant)",
    imagePath: "/images/guides/i2.jpg", // Chemin vers votre image
    altText: "Positionnement pour photo véhicule face avant"
  },
  vehicle_back: {
    title: "Photo du véhicule (Face arrière)",  
    imagePath: "/images/guides/i4.jpg", // Chemin vers votre image
    altText: "Positionnement pour photo véhicule face arrière"
  },
  relay_point: {
    title: "Photo du point relais",
    imagePath: "/images/guides/i3.jpg", // Chemin vers votre image
    altText: "Comment photographier votre point relais"
  },
  identity: {
    title: "Photo d'identité",
    imagePath: "/images/guides/i1.jpg", // Chemin vers votre image
    altText: "Positionnement pour photo d'identité"
  }
};

// Données pour les jours de la semaine
const daysOfWeek = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' }
];

  // Fonctions helper pour éviter les erreurs de type
  const getCountryData = (countryKey: string): Country | null => {
    return countries[countryKey] || null;
  };

  const getRegionData = (countryKey: string, regionKey: string): City | null => {
    const country = getCountryData(countryKey);
    return country?.regions[regionKey] || null;
  };

  const getLocationDisplayString = (): string => {
    const { country, region, city } = formData;
    if (!country || !region || !city) return '';

    const countryData = getCountryData(country);
    const regionData = getRegionData(country, region);
    
    if (!countryData || !regionData) return '';

    return `${city}, ${regionData.name}, ${countryData.name}`;
  };

  // Effets pour gérer la réinitialisation des sélecteurs dépendants
  useEffect(() => {
    if (formData.country) {
      const countryData = getCountryData(formData.country);
      if (countryData && !countryData.regions.hasOwnProperty(formData.region)) {
        setFormData(prev => ({ ...prev, region: '', city: '' }));
      }
    }
  }, [formData.country]);

  useEffect(() => {
    if (formData.country && formData.region) {
      const regionData = getRegionData(formData.country, formData.region);
      if (regionData && !regionData.cities.includes(formData.city)) {
        setFormData(prev => ({ ...prev, city: '' }));
      }
    }
  }, [formData.country, formData.region]);

    // NOUVEAU useEffect pour détecter le mode "mise à niveau"
  useEffect(() => {
    const upgradeRequestJSON = localStorage.getItem('upgrade_account_request');
    if (upgradeRequestJSON) {
      try {
        const { targetType, profileData } = JSON.parse(upgradeRequestJSON);
        
        console.log("Mode mise à niveau détecté !", { targetType, profileData });

        setPageMode('upgrade');
        setAccountType(targetType);

        // Pré-remplir le formulaire avec les données existantes
        setFormData(prev => ({
          ...prev,
          // Identification
          manager_name: profileData.manager_name || '',
          email: profileData.email || '',
          // Les mots de passe restent vides pour la sécurité
          password: '', 
          confirmPassword: '',
          // Coordonnées
          phone_number: profileData.phone_number || '',
          birth_date: profileData.birth_date || '',
          // Remplace nationality - à adapter si la logique est différente
          country: profileData.country || 'cameroun',
          region: profileData.region || '',
          city: profileData.city || '',
          home_address: profileData.home_address || '',
          id_card_number: profileData.id_card_number || '',
          niu: profileData.niu || '',
        }));

        // Passer directement à l'étape 2 car le type de compte est déjà choisi
        setCurrentStep(2);
        
        // Supprimer l'instruction pour ne pas la réutiliser
        localStorage.removeItem('upgrade_account_request');

      } catch (e) {
        console.error("Erreur lors de la préparation de la mise à niveau:", e);
        localStorage.removeItem('upgrade_account_request'); // Nettoyer en cas d'erreur
      }
    }
  }, []); // Le tableau vide [] assure que cela ne s'exécute qu'une fois au montage

    // --- NOUVEAU: useEffect pour le pré-remplissage ---
  useEffect(() => {
    // Essayer de lire les données depuis localStorage
    const prefillDataJSON = localStorage.getItem('registration_prefill');
    
    if (prefillDataJSON) {
      try {
        const prefillData = JSON.parse(prefillDataJSON);
        
        // Mettre à jour l'état du formulaire avec les données de l'expéditeur
        setFormData(prev => ({
          ...prev,
          manager_name: prefillData.name || '',
          email: prefillData.email || '',
          phone_number: prefillData.phone || ''
        }));
        
        // --- NOUVEAU ET CRUCIAL: Mettre l'accountType à 'CLIENT' par défaut ---
        // et passer à l'étape 2 directement.
        setAccountType('CLIENT');
        setCurrentStep(2);
        
        // Important: Nettoyer localStorage après utilisation pour éviter les pré-remplissages non désirés
        localStorage.removeItem('registration_prefill');
        
      } catch (error) {
        console.error("Erreur de parsing des données de pré-remplissage :", error);
        // Nettoyer en cas d'erreur de parsing
        localStorage.removeItem('registration_prefill');
      }
    }
  }, []); 

  useEffect(() => {
    // Lire l'intention de l'utilisateur depuis le portail
    if (typeof window !== 'undefined') {
        const preselect = localStorage.getItem('preselect_role_login');
        if (preselect) {
            setHighlightedRole(preselect);
            
            // On nettoie après 3 secondes pour arrêter le clignotement
            setTimeout(() => {
                setHighlightedRole(null);
                localStorage.removeItem('preselect_role_login');
            }, 3000);
        }
    }
}, []);

  // Définir les étapes selon le type de compte
  const getStepsForAccountType = (type: string | null) => {
  if (type === 'CLIENT' && formData.manager_name) {
       return [
          { num: 1, title: 'Type de compte' }, // Cette étape est sautée visuellement
          { num: 2, title: 'Finalisation' }
       ];
    }
    switch(type) {
      case 'CLIENT':
        return [
          { num: 1, title: 'Type de compte' },
          { num: 2, title: 'Identification' },
          { num: 3, title: 'Finalisation' }
        ];
      case 'LIVREUR':
        return [
          { num: 1, title: 'Type de compte' },
          { num: 2, title: 'Identification' },
          { num: 3, title: 'Coordonnées' },
          { num: 4, title: 'Véhicule' },
          { num: 5, title: 'Finalisation' }
        ];
      case 'FREELANCE':
      case 'AGENCY':
        return [
          { num: 1, title: 'Type de compte' },
          { num: 2, title: 'Identification' },
          { num: 3, title: 'Coordonnées' },
          { num: 4, title: 'Point Relais' },
          { num: 5, title: 'Finalisation' }
        ];
      default:
        return [
          { num: 1, title: 'Type de compte' }
        ];
    }
  };

  // Composant pour la gestion des horaires
const ScheduleField = ({ 
  id, 
  label, 
  value, 
  onChange, 
  selectedDays, 
  daySchedules, 
  onShowScheduleModal 
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedDays: string[];
  daySchedules: Record<string, { start: string; end: string }>;
  onShowScheduleModal: () => void;
}) => {
  const generateScheduleText = () => {
    if (selectedDays.length === 0) return '';
    
    const scheduleGroups: Record<string, string[]> = {};
    
    // Grouper les jours par horaire
    selectedDays.forEach(dayKey => {
      const schedule = daySchedules[dayKey];
      const timeRange = `${schedule.start}-${schedule.end}`;
      if (!scheduleGroups[timeRange]) {
        scheduleGroups[timeRange] = [];
      }
      const dayLabel = daysOfWeek.find(d => d.key === dayKey)?.label || dayKey;
      scheduleGroups[timeRange].push(dayLabel);
    });
    
    // Construire le texte final
    const parts = Object.entries(scheduleGroups).map(([timeRange, days]) => {
      const daysList = days.join(', ');
      return `${daysList}: ${timeRange}`;
    });
    
    return parts.join(' | ');
  };

  const displayText = generateScheduleText() || value;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <div 
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer hover:bg-gray-50 transition-colors flex items-center"
          onClick={onShowScheduleModal}
        >
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <span className={`text-sm flex-1 ${displayText ? 'text-gray-800' : 'text-gray-500'}`}>
            {displayText || 'Cliquez pour configurer les horaires'}
          </span>
          <svg 
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        
        {/* Input caché pour maintenir la compatibilité avec le formulaire */}
        <input
          id={id}
          name={id}
          type="hidden"
          value={displayText}
          onChange={onChange}
        />
      </div>
      
      {selectedDays.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg"
        >
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">
              {selectedDays.length} jour{selectedDays.length > 1 ? 's' : ''} configuré{selectedDays.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-xs text-orange-700">
            {displayText}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ÉTAPE 2: Remplacer l'ancien composant PhotoGuideModal par celui-ci
const PhotoGuideModal = ({ 
  guideType, 
  isOpen, 
  onComplete 
}: {
  guideType: string | null;
  isOpen: boolean;
  onComplete: () => void;
}) => {
  useEffect(() => {
    if (isOpen && guideType) {
      // Disparition automatique après 3 secondes
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, guideType, onComplete]);

  if (!isOpen || !guideType) return null;

  const guide = photoGuides[guideType as keyof typeof photoGuides];
  if (!guide) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-20 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="bg-white rounded-2xl p-4 max-w-sm w-full mx-4 shadow-2xl"
      >
        {/* Titre */}
        <div className="text-center mb-3">
          <h3 className="text-lg font-bold text-gray-800">{guide.title}</h3>
        </div>

        {/* Image de démonstration */}
        <div className="relative w-full h-64 mb-3 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={guide.imagePath}
            alt={guide.altText}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback en cas d'erreur de chargement d'image
              const target = e.target as HTMLImageElement;
              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-family='Arial, sans-serif' font-size='14' fill='%236b7280'%3EImage Guide%3C/text%3E%3C/svg%3E%3C/svg%3E";
            }}
          />
          
          {/* Indicateur de temps restant */}
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-black bg-opacity-50 rounded-full h-1">
              <motion.div
                className="bg-orange-500 h-full rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3, ease: "linear" }}
              />
            </div>
          </div>
        </div>

        {/* Bouton pour fermer immédiatement */}
        <div className="text-center">
          <button
            onClick={onComplete}
            className="px-6 py-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Passer ce guide
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ÉTAPE 2: Modifier la fonction handlePhotoGuideShow
const handlePhotoGuideShow = (guideType: string) => {
  // Vérifier si ce guide a déjà été vu
  if (!viewedGuides.includes(guideType)) {
    setShowPhotoGuide(guideType);
    // Marquer ce guide comme vu
    setViewedGuides(prev => [...prev, guideType]);
  } else {
    // Si déjà vu, ouvrir directement le sélecteur de fichiers
    const fileInput = document.getElementById(guideType) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }
};

const handlePhotoGuideComplete = () => {
  const currentGuideType = showPhotoGuide;
  setShowPhotoGuide(null);
  
  // Déclencher automatiquement l'ouverture du sélecteur de fichier
  if (currentGuideType) {
    setTimeout(() => {
      const fileInput = document.getElementById(currentGuideType) as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }, 100); // Petit délai pour permettre à la modal de se fermer
  }
};

// Composant Modal pour la programmation des horaires
const ScheduleModal = ({ 
  isOpen, 
  onClose, 
  selectedDays, 
  setSelectedDays, 
  daySchedules, 
  setDaySchedules,
  onSave 
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedDays: string[];
  setSelectedDays: (days: string[]) => void;
  daySchedules: Record<string, { start: string; end: string }>;
  setDaySchedules: (schedules: Record<string, { start: string; end: string }>) => void;
  onSave: () => void;
}) => {
  const toggleDay = (dayKey: string) => {
    if (selectedDays.includes(dayKey)) {
      setSelectedDays(selectedDays.filter(d => d !== dayKey));
      const newSchedules = { ...daySchedules };
      delete newSchedules[dayKey];
      setDaySchedules(newSchedules);
    } else {
      setSelectedDays([...selectedDays, dayKey]);
      setDaySchedules({
        ...daySchedules,
        [dayKey]: { start: '08:00', end: '18:00' }
      });
    }
  };

  const updateSchedule = (dayKey: string, type: 'start' | 'end', value: string) => {
    setDaySchedules({
      ...daySchedules,
      [dayKey]: {
        ...daySchedules[dayKey],
        [type]: value
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Horaires d'ouverture</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {daysOfWeek.map((day) => (
            <div key={day.key} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day.key)}
                    onChange={() => toggleDay(day.key)}
                    className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="font-medium text-gray-700">{day.label}</span>
                </label>
              </div>

              <AnimatePresence>
                {selectedDays.includes(day.key) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="grid grid-cols-2 gap-3 overflow-hidden"
                  >
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Ouverture</label>
                      <input
                        type="time"
                        value={daySchedules[day.key]?.start || '08:00'}
                        onChange={(e) => updateSchedule(day.key, 'start', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Fermeture</label>
                      <input
                        type="time"
                        value={daySchedules[day.key]?.end || '18:00'}
                        onChange={(e) => updateSchedule(day.key, 'end', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-500"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </motion.div>
    </div>
  );
};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // MODIFIÉ: handleFileChange gère maintenant les prévisualisations
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));
      // Créer une URL temporaire pour la prévisualisation
      const previewUrl = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [name]: previewUrl }));
    }
  };

    // NOUVEAU: Fonction pour uploader un fichier sur Supabase Storage
  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { data, error } = await supabase.storage.from('user-files').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });
    if (error) {
      throw new Error(`Erreur d'upload pour ${path}: ${error.message}`);
    }
    const { data: { publicUrl } } = supabase.storage.from('user-files').getPublicUrl(data.path);
    return publicUrl;
  };

  const handleNextStep = () => setCurrentStep(prev => prev + 1);
  const handlePrevStep = () => setCurrentStep(prev => prev - 1);

  const handleAccountTypeSelection = (type: 'CLIENT' | 'FREELANCE' | 'AGENCY' | 'LIVREUR') => {
    setAccountType(type);
    setCurrentStep(2);
  };

  // --- CORRECTION MAJEURE ICI ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setIsLoading(false);
      return;
    }
    if (!accountType) {
        setError("Veuillez sélectionner un type de compte.");
        setIsLoading(false);
        return;
    }

    try {
        // CAS 1: INSCRIPTION CLIENT SIMPLE
        if (accountType === 'CLIENT') {
            const clientData: UserRegistrationRequest = {
                name: formData.manager_name,
                email: formData.email,
                password: formData.password,
                phoneNumber: formData.phone_number,
                accountType: 'CLIENT',
                // Données d'adresse personnelle
                city: formData.city,
                region: formData.region,
                country: formData.country,
                homeAddress: formData.home_address,
                homeAddressLocality: formData.home_address_locality
            };
            console.log("Envoi payload Client:", clientData);
            await authService.registerClient(clientData);

        } 
// CAS 2: INSCRIPTION BUSINESS (FREELANCE, AGENCY, LIVREUR)
    else { 
        let businessActorType: BusinessActorType;
        let mappedBusinessName = "";
        let mappedAddress = "";
        let mappedLocality = "";
        
        // 1. MAPPING DES TYPES (Frontend -> Backend)
        // C'est ici que nous traduisons le choix visuel en donnée technique API
        switch(accountType) {
            case 'FREELANCE': 
                businessActorType = 'FREELANCE'; 
                break;
            case 'AGENCY': 
                // Important: Le backend attend souvent AGENCY_OWNER lors de l'inscription d'une agence
                businessActorType = 'AGENCY_OWNER'; 
                break;
            case 'LIVREUR': 
                // Le backend attend DELIVERER
                businessActorType = 'DELIVERER'; 
                break;
            default: 
                throw new Error(`Type de compte '${accountType}' non reconnu par le système.`);
        }

        // 2. MAPPING DES NOMS ET ADRESSES BUSINESS
        if (businessActorType === 'DELIVERER') {
            // Pour un livreur, on utilise son nom ou un nom généré s'il n'a pas de nom commercial
            mappedBusinessName = formData.manager_name || `Livreur ${formData.email}`; 
            // Adresse par défaut = Domicile
            mappedAddress = formData.home_address;
            mappedLocality = formData.home_address_locality;
        } else {
            // Pour FREELANCE (Point Relais) et AGENCY (AGENCY_OWNER)
            // Le "Nom Business" est le nom du point relais/agence entré à l'étape 4
            mappedBusinessName = formData.relay_point_name;
            mappedAddress = formData.relay_point_address;
            mappedLocality = formData.relay_point_locality;

            // Vérification de sécurité
            if (!mappedBusinessName) {
                setError("Le nom du Point Relais ou de l'Agence est requis.");
                setIsLoading(false);
                return;
            }
        }

        // 3. SAUVEGARDE TEMPORAIRE (Cache pour création ultérieure du RelayPoint en BDD si besoin)
        if (accountType === 'FREELANCE' || accountType === 'AGENCY') {
             localStorage.setItem('registration_data_cache', JSON.stringify({
                 relay_point_name: formData.relay_point_name,
                 relay_point_address: formData.relay_point_address,
                 relay_point_locality: formData.relay_point_locality,
                 opening_hours: formData.opening_hours,
                 storage_capacity: formData.storage_capacity
             }));
        }

        // 4. CONSTRUCTION DU PAYLOAD API
        // On s'assure que les clés correspondent exactement au DTO du backend Java
        const businessData: BusinessActorRegistrationRequest = {
            // -- Données Utilisateur --
            name: formData.manager_name,
            email: formData.email,
            password: formData.password,
            phoneNumber: formData.phone_number,
            
            city: formData.city,
            region: formData.region,
            country: formData.country,
            homeAddress: formData.home_address,
            
            // -- Configuration Business --
            accountType: 'BUSINESS_ACTOR', // Constante requise par le polymorphisme
            businessActorType: businessActorType, // La valeur mappée (ex: DELIVERER)
            
            // -- Données Entité Business --
            businessName: mappedBusinessName,
            businessAddress: mappedAddress,
            businessLocality: mappedLocality,
            town: formData.city, 
            
            // -- Documents Légaux --
            cniNumber: formData.id_card_number,
            niu: formData.niu
        };
        
        console.log("📤 Envoi Inscription Business :", businessData);
        
        // 5. APPEL DU SERVICE
        await authService.registerBusinessActor(businessData);
    }

        // ... Gestion du succès (inchangé) ...
        setSuccess("Inscription réussie ! Vous allez être redirigé vers la page de connexion.");
        
        // Petit nettoyage si nécessaire
        localStorage.removeItem('registration_prefill');
        localStorage.removeItem('temp_sender_info_for_registration');
        localStorage.removeItem('upgrade_account_request');

        setTimeout(() => {
            router.push('/login');
        }, 2000);

    } catch (err: any) {
        console.error("Erreur d'inscription:", err);
        // Affichage plus détaillé de l'erreur pour le débogage
        setError(err.message || typeof err === 'string' ? err : 'Une erreur est survenue lors de l\'inscription.');
    } finally {
        setIsLoading(false);
    }
  };


  const handleScheduleSave = () => {
    // Générer le texte d'horaires et mettre à jour formData
    if (selectedDays.length > 0) {
      const scheduleGroups: Record<string, string[]> = {};
      
      selectedDays.forEach(dayKey => {
        const schedule = daySchedules[dayKey];
        const timeRange = `${schedule.start}-${schedule.end}`;
        if (!scheduleGroups[timeRange]) {
          scheduleGroups[timeRange] = [];
        }
        const dayLabel = daysOfWeek.find(d => d.key === dayKey)?.label || dayKey;
        scheduleGroups[timeRange].push(dayLabel);
      });
      
      const parts = Object.entries(scheduleGroups).map(([timeRange, days]) => {
        const daysList = days.join(', ');
        return `${daysList}: ${timeRange}`;
      });
      
      const scheduleText = parts.join(' | ');
      
      setFormData(prev => ({ ...prev, opening_hours: scheduleText }));
    }
    setShowScheduleModal(false);
  };

// Fonction renderStep mise à jour
const renderStep = () => {
  switch(currentStep) {
case 1: return (
      <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        <h3 className="text-xl font-bold text-center mb-6">Quel type de compte souhaitez-vous créer ?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { type: 'CLIENT', icon: <Users className="w-8 h-8" />, title: "Client", desc: "Je souhaite envoyer des colis" },
            { type: 'FREELANCE', icon: <User className="w-8 h-8" />, title: "Freelance", desc: "Individu ou petit commerçant" },
            { type: 'AGENCY', icon: <Building className="w-8 h-8" />, title: "Agence", desc: "Entreprise ou structure" },
            { type: 'LIVREUR', icon: <Truck className="w-8 h-8" />, title: "Livreur", desc: "Je souhaite livrer des colis" }
          ].map((item) => {
            const isHighlighted = highlightedRole === item.type;

            // Ajout du RETURN explicite ici
            return (
              <button 
                key={item.type} 
                onClick={() => handleAccountTypeSelection(item.type as any)} 
                className={`p-6 border-2 rounded-xl text-center space-y-3 transition-all duration-300
                  ${isHighlighted 
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 ring-4 ring-orange-500/30 animate-pulse shadow-2xl transform scale-105' 
                      : 'border-gray-200 dark:border-black bg-white dark:bg-transparent hover:border-orange-500 hover:bg-orange-50 dark:hover:border-orange-700 dark:hover:bg-gray-900 hover:shadow-md hover:-translate-y-1'
                   }`}
              >
                <div className="text-orange-500 dark:text-orange-600 inline-block">{item.icon}</div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{item.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </motion.div>
    );

    case 2: return (
      <motion.form 
        initial={{ opacity: 0, x: 50 }} 
        animate={{ opacity: 1, x: 0 }} 
        onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} 
        className="space-y-4"
      >
        <h3 className="text-xl font-bold mb-4">Informations d'identification</h3>
        <InputField id="manager_name" label="Nom et Prénoms" value={formData.manager_name} onChange={handleChange} placeholder="Ex: Mballa Joseph" icon={User} />
        <InputField id="email" label="Adresse Email" type="email" value={formData.email} onChange={handleChange} placeholder="contact@exemple.com" icon={Mail} />
        <InputField id="phone_number" label="Numéro de téléphone" type="tel" value={formData.phone_number} onChange={handleChange} placeholder="Ex: 6XX XXX XXX" icon={Phone} />
        <InputField id="password" label="Mot de passe" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" icon={Lock} />
        <InputField id="confirmPassword" label="Confirmer le mot de passe" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" icon={Lock} />
      </motion.form>
    );

    case 3: 
      if (accountType === 'CLIENT') {
        // Étape de finalisation pour CLIENT
        return (
          <motion.form 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            onSubmit={handleSubmit} 
            className="space-y-4"
          >
            <h3 className="text-xl font-bold text-center mb-4">Vérification et Soumission</h3>
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg space-y-2 text-sm">
              <p><strong>Type de compte :</strong> {accountType}</p>
              <p><strong>Nom :</strong> {formData.manager_name}</p>
              <p><strong>Email :</strong> {formData.email}</p>
            </div>
            <div className="flex items-start space-x-2">
              <input type="checkbox" id="terms" required className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
              <label htmlFor="terms" className="text-xs text-gray-700">J'ai lu et j'accepte les <a href="/terms-of-use" className="font-medium text-orange-600 hover:underline">conditions d'utilisation</a>.</label>
            </div>
          </motion.form>
        );
      }
      // Étape Coordonnées pour autres types
      return (
        <motion.form 
          initial={{ opacity: 0, x: 50 }} 
          animate={{ opacity: 1, x: 0 }} 
          onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} 
          className="space-y-4"
        >
          <h3 className="text-xl font-bold mb-4">Coordonnées et informations</h3>
          
          {/* Sélecteurs Pays/Région/Ville */}
          <SelectField 
            icon={Globe} 
            id="country" 
            name="country"
            label="Pays" 
            value={formData.country} 
            onChange={handleChange}
            required
          >
            <option value="">Sélectionnez un pays</option>
            {Object.entries(countries).map(([key, country]) => (
              <option key={key} value={key}>{country.name}</option>
            ))}
          </SelectField>

          {formData.country && (
            <SelectField 
              icon={MapPin} 
              id="region" 
              name="region"
              label="Région" 
              value={formData.region} 
              onChange={handleChange}
              required
            >
              <option value="">Sélectionnez une région</option>
              {Object.entries(getCountryData(formData.country)?.regions || {}).map(([key, region]) => (
                <option key={key} value={key}>{region.name}</option>
              ))}
            </SelectField>
          )}

          {formData.country && formData.region && (
            <SelectField 
              icon={Building} 
              id="city" 
              name="city"
              label="Ville" 
              value={formData.city} 
              onChange={handleChange}
              required
            >
              <option value="">Sélectionnez une ville</option>
              {(getRegionData(formData.country, formData.region)?.cities || []).map((city: string) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </SelectField>
          )}

          <InputField id="home_address" label="Adresse personnelle" value={formData.home_address} onChange={handleChange} placeholder="Ex: Quartier Bastos, Yaoundé" icon={MapPin} />
          <InputField id="home_address_locality" label="Lieu dit de l'adresse" value={formData.home_address_locality} onChange={handleChange} placeholder="Ex: Face Pharmacie du Rond Point" />
          
          {/* Photo d'identité avec guide */}
          <EnhancedImageUploadField 
            id="identity_photo" 
            label="Photo d'identité" 
            onChange={handleFileChange} 
            previewUrl={previews.identity_photo}
            guideType="identity"
            onShowGuide={handlePhotoGuideShow}
            isGuideViewed={viewedGuides.includes('identity')}
          />
          
          <InputField id="id_card_number" label="Numéro CNI" value={formData.id_card_number} onChange={handleChange} placeholder="Ex: 123456789" />
          
          <div className="grid grid-cols-2 gap-2 mt-2">
            <EnhancedImageUploadField 
              id="id_card_front" 
              label="CNI (Recto)" 
              onChange={handleFileChange} 
              previewUrl={previews.id_card_front} 
            />
            <EnhancedImageUploadField 
              id="id_card_back" 
              label="CNI (Verso)" 
              onChange={handleFileChange} 
              previewUrl={previews.id_card_back} 
            />
          </div>
          
          <div>
            <InputField id="niu" label="NIU" value={formData.niu} onChange={handleChange} placeholder="Ex: M123456789A" icon={FileText} />
            <div className="mt-2">
              <EnhancedImageUploadField 
                id="niu_document" 
                label="Document NIU" 
                onChange={handleFileChange} 
                previewUrl={previews.niu_document} 
                required={false} 
              />
            </div>
          </div>
        </motion.form>
      );

    case 4:
      if (accountType === 'LIVREUR') {
        // Étape Véhicule pour LIVREUR
        return (
          <motion.form 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} 
            className="space-y-4"
          >
            <h3 className="text-xl font-bold mb-4">Informations sur votre véhicule</h3>
            
            <InputField 
              id="vehicle_type" 
              label="Type de véhicule" 
              value={formData.vehicle_type} 
              onChange={handleChange} 
              placeholder="Sélectionnez votre véhicule"
              icon={Truck}
              options={[
                { value: 'velo', label: 'Vélo' },
                { value: 'moto', label: 'Moto' },
                { value: 'tricycle', label: 'Tricycle' },
                { value: 'voiture', label: 'Voiture' },
                { value: 'camion', label: 'Camion' }
              ]}
            />
            
            <InputField 
              id="vehicle_brand" 
              label="Marque du véhicule" 
              value={formData.vehicle_brand} 
              onChange={handleChange} 
              placeholder="Ex: Toyota, Yamaha, etc." 
            />
            
            {/* Photos du véhicule avec guides */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <EnhancedImageUploadField 
                id="vehicle_photo_front" 
                label="Photo du véhicule (Avant)" 
                onChange={handleFileChange} 
                previewUrl={previews.vehicle_photo_front}
                guideType="vehicle_front"
                onShowGuide={handlePhotoGuideShow}
                isGuideViewed={viewedGuides.includes('vehicle_front')}
              />
              <EnhancedImageUploadField 
                id="vehicle_photo_back" 
                label="Photo du véhicule (Arrière)" 
                onChange={handleFileChange} 
                previewUrl={previews.vehicle_photo_back}
                guideType="vehicle_back"
                onShowGuide={handlePhotoGuideShow}
                isGuideViewed={viewedGuides.includes('vehicle_back')}
              />
            </div>
            
            <InputField 
              id="vehicle_registration" 
              label="Numéro d'immatriculation" 
              value={formData.vehicle_registration} 
              onChange={handleChange} 
              placeholder="Ex: LT-123-AA" 
            />
            
            <InputField 
              id="vehicle_color" 
              label="Couleur du véhicule" 
              value={formData.vehicle_color} 
              onChange={handleChange} 
              placeholder="Ex: Blanc, Noir, Rouge" 
            />
            
            <InputField 
              id="trunk_dimensions" 
              label="Dimensions de la malle arrière (optionnel)" 
              value={formData.trunk_dimensions} 
              onChange={handleChange} 
              placeholder="Ex: 50x30x40 cm" 
              required={false} 
            />
            
            {formData.vehicle_type === 'velo' ? (
              <InputField 
                id="accident_history" 
                label="Avez-vous déjà eu un accident ?" 
                value={formData.accident_history} 
                onChange={handleChange} 
                placeholder="Sélectionnez une option"
                options={[
                  { value: 'oui', label: 'Oui' },
                  { value: 'non', label: 'Non' }
                ]}
              />
            ) : (
              ['moto', 'tricycle', 'voiture', 'camion'].includes(formData.vehicle_type) && (
                <div className="space-y-4">
                  <FileUploadField 
                    id="driving_license_front" 
                    label="Photo du permis de conduire (recto)" 
                    onChange={handleFileChange} 
                  />
                  <FileUploadField 
                    id="driving_license_back" 
                    label="Photo du permis de conduire (verso)" 
                    onChange={handleFileChange} 
                  />
                </div>
              )
            )}
          </motion.form>
        );
      }
      
      // Étape Point Relais pour FREELANCE/AGENCY
      return (
        <motion.form 
          initial={{ opacity: 0, x: 50 }} 
          animate={{ opacity: 1, x: 0 }} 
          onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} 
          className="space-y-4"
        >
          <h3 className="text-xl font-bold mb-4">Informations du Point Relais</h3>
          
          <InputField 
            id="relay_point_name" 
            label="Nom commercial du Point Relais" 
            value={formData.relay_point_name} 
            onChange={handleChange} 
            placeholder="Ex: Épicerie Chez Papa" 
            icon={Building} 
          />
          
          <InputField 
            id="relay_point_address" 
            label="Adresse Complète" 
            value={formData.relay_point_address} 
            onChange={handleChange} 
            placeholder="Ex: Quartier Mvan, Yaoundé" 
            icon={MapPin} 
          />
          
          <InputField 
            id="relay_point_locality" 
            label="Lieu dit de l'adresse du Point Relais" 
            value={formData.relay_point_locality} 
            onChange={handleChange} 
            placeholder="Ex: Face Boulangerie Mvan" 
          />
          
          {/* Horaires avec modal intuitif */}
          <ScheduleField
            id="opening_hours"
            label="Horaires d'ouverture"
            value={formData.opening_hours}
            onChange={handleChange}
            selectedDays={selectedDays}
            daySchedules={daySchedules}
            onShowScheduleModal={() => setShowScheduleModal(true)}
          />
          
          {/* Photo du point relais avec guide */}
          <div className="mt-4">
            <EnhancedImageUploadField 
              id="relay_point_photo" 
              label="Photo du point relais" 
              onChange={handleFileChange} 
              previewUrl={previews.relay_point_photo}
              guideType="relay_point"
              onShowGuide={handlePhotoGuideShow}
              isGuideViewed={viewedGuides.includes('relay_point')} 
            />
          </div>
          
          <InputField 
            id="storage_capacity" 
            label="Capacité de stockage" 
            value={formData.storage_capacity} 
            onChange={handleChange}
            options={[
              { value: 'Petit', label: 'Petit (< 50 colis)' },
              { value: 'Moyen', label: 'Moyen (50-200 colis)' },
              { value: 'Grand', label: 'Grand (> 200 colis)' }
            ]}
          />
        </motion.form>
      );

    case 5: return (
      <motion.form 
        initial={{ opacity: 0, x: 50 }} 
        animate={{ opacity: 1, x: 0 }} 
        onSubmit={handleSubmit} 
        className="space-y-4"
      >
        <h3 className="text-xl font-bold text-center mb-4">Vérification et Soumission</h3>
        
        <div className="bg-orange-50 dark:bg-black dark:text-gray-300 dark:border-gray-800 border border-orange-200 p-4 rounded-lg space-y-2 text-sm">
          <p><strong>Type de compte :</strong> {accountType}</p>
          <p><strong>Nom :</strong> {formData.manager_name}</p>
          <p><strong>Email :</strong> {formData.email}</p>
          <p><strong>Téléphone :</strong> {formData.phone_number}</p>
          {getLocationDisplayString() && (
            <p><strong>Localisation :</strong> {getLocationDisplayString()}</p>
          )}
          {accountType === 'LIVREUR' && formData.vehicle_type && (
            <p><strong>Véhicule :</strong> {formData.vehicle_type} - {formData.vehicle_brand}</p>
          )}
          {['FREELANCE', 'AGENCY'].includes(accountType || '') && formData.relay_point_name && (
            <p><strong>Point Relais :</strong> {formData.relay_point_name}</p>
          )}
          {selectedDays.length > 0 && (
            <p><strong>Horaires :</strong> {formData.opening_hours}</p>
          )}
        </div>
        
        <div className="space-y-3 mt-4">
          <div className="flex items-start space-x-3">
            <input 
              type="checkbox" 
              id="terms" 
              required 
              className="mt-1 h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 shrink-0" 
            />
            <label htmlFor="terms" className="text-xs dark:text-gray-300 text-gray-700">
              J'ai lu et j'accepte les{' '}
              <Link href="/policy/terms-of-use" target="_blank" className="font-semibold text-orange-600 hover:underline">
                Conditions Générales d'Utilisation
              </Link>.
            </label>
          </div>
          <div className="flex items-start space-x-3">
            <input 
              type="checkbox" 
              id="privacy" 
              required 
              className="mt-1 h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 shrink-0"
            />
            <label htmlFor="privacy" className="text-xs dark:text-gray-300 text-gray-700">
              Je comprends comment mes données sont utilisées conformément à la{' '}
              <Link href="/policy/privacy-policy" target="_blank" className="font-semibold text-orange-600 hover:underline">
                Politique de Confidentialité
              </Link>.
            </label>
          </div>
        </div>
      </motion.form>
    );

    default: return null;
  }
};

  const steps = getStepsForAccountType(accountType);
  const maxStep = accountType === 'CLIENT' ? 3 : 5;

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white/90 dark:bg-gray-900 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-black dark:border-2 p-6">
          <Stepper currentStep={currentStep} steps={steps} />

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 text-sm rounded-lg text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-800 text-sm rounded-lg text-center">
              {success}
            </div>
          )}

          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          {currentStep > 1 && (
            <div className="flex justify-between items-center pt-6 border-t border-gray-100 mt-6">
              <button type="button" onClick={handlePrevStep} className="inline-flex items-center  dark:bg-black  dark:text-gray-300 dark:border-gray-800 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
              </button>
              {(currentStep === maxStep || (accountType === 'CLIENT' && currentStep === 3)) ? (
                <button type="submit" onClick={handleSubmit} disabled={isLoading} className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:from-orange-600 hover:to-amber-600 focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                  {isLoading ? 'Création...' : 'Créer mon Compte'}
                </button>
              ) : (
                <button type="button" onClick={handleNextStep} className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:from-orange-600 hover:to-amber-600 focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 transition-all transform hover:scale-105">
                  Suivant
                </button>
              )}
            </div>
          )}
        </div>
        
        <p className="text-center text-sm text-gray-600 mt-4">
          Vous avez déjà un compte ?{' '}
          <button onClick={() => router.push('/login')} className="text-orange-600 hover:text-orange-700 font-medium hover:underline">
            Se connecter
          </button>
        </p>
      </div>
          <AnimatePresence>
            {/* Modal guide photo simplifié */}
            {showPhotoGuide && (
              <PhotoGuideModal
                guideType={showPhotoGuide}
                isOpen={!!showPhotoGuide}
                onComplete={handlePhotoGuideComplete}
              />
            )}

            {/* Modal horaires - reste inchangé */}
            {showScheduleModal && (
              <ScheduleModal
                isOpen={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                selectedDays={selectedDays}
                setSelectedDays={setSelectedDays}
                daySchedules={daySchedules}
                setDaySchedules={setDaySchedules}
                onSave={handleScheduleSave}
              />
            )}
          </AnimatePresence>
    </div>
  );
}
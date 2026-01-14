// SharedUI.tsx - Composants et données partagés
'use client';
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Upload, Camera, CheckCircle, Image as ImageIcon, Clock } from 'lucide-react';

// ==================== DONNÉES STATIQUES ====================
export interface City {
  name: string;
  cities: string[];
}

export interface Country {
  name: string;
  regions: Record<string, City>;
}

export const countries: Record<string, Country> = {
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

export const daysOfWeek = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' }
];

export const photoGuides = {
  vehicle_front: {
    title: "Photo du véhicule (Face avant)",
    imagePath: "/images/guides/i2.jpg",
    altText: "Positionnement pour photo véhicule face avant"
  },
  vehicle_back: {
    title: "Photo du véhicule (Face arrière)",
    imagePath: "/images/guides/i4.jpg",
    altText: "Positionnement pour photo véhicule face arrière"
  },
  relay_point: {
    title: "Photo du point relais",
    imagePath: "/images/guides/i3.jpg",
    altText: "Comment photographier votre point relais"
  },
  identity: {
    title: "Photo d'identité",
    imagePath: "/images/guides/i1.jpg",
    altText: "Positionnement pour photo d'identité"
  }
};

// ==================== COMPOSANTS UI ====================

export const Stepper = ({ currentStep, steps }: { currentStep: number, steps: any[] }) => {
  return (
    <div className="flex items-center justify-center mb-8 overflow-x-auto">
      <div className="flex items-center space-x-2 min-w-max">
        {steps.map((step, index) => (
          <React.Fragment key={step.num}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm transition-all duration-300 ${
                currentStep >= step.num 
                  ? 'bg-orange-500 border-orange-500 text-white' 
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
              }`}>
                {currentStep > step.num ? <Check className="w-4 h-4" /> : step.num}
              </div>
              <p className={`mt-1 text-xs font-medium text-center ${
                currentStep >= step.num ? 'text-orange-600' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-8 h-px transition-all duration-300 ${
                currentStep > index + 1 ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export const InputField = ({ 
  id, label, type = 'text', value, onChange, placeholder, required = true, icon: Icon, options = null 
}: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
      {options ? (
        <select 
          {...{ id, name: id, value, onChange, required }} 
          className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-500 transition-all text-sm`}
        >
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
          className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-500 transition-all text-sm`} 
        />
      )}
    </div>
  </div>
);

export const SelectField = ({ icon: Icon, id, label, children, ...props }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="group space-y-1"
  >
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
        className="w-full pl-10 pr-8 py-2.5 text-sm text-gray-800 dark:text-gray-200 border-2 rounded-lg appearance-none transition-all duration-200 
          bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-600 focus:border-orange-500
          focus:ring-2 focus:ring-orange-500/20 focus:bg-white dark:focus:bg-gray-800 shadow-sm hover:shadow-md cursor-pointer"
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

export const EnhancedImageUploadField = ({ 
  id, label, required = true, onChange, previewUrl, guideType = null, onShowGuide = null, isGuideViewed = false
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
    fileInputRef.current?.click();
    if (guideType && onShowGuide && !isGuideViewed) {
      onShowGuide(guideType);
    }
  };
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</label>
      <div className="relative group">
        <div 
          className={`w-full h-36 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden ${
            previewUrl 
              ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20' 
              : 'border-orange-200 dark:border-orange-700 bg-gradient-to-br from-orange-25 via-orange-50 to-amber-25 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700 hover:border-orange-400 hover:from-orange-50 hover:to-amber-100 dark:hover:from-orange-900/30 dark:hover:to-amber-900/30 hover:shadow-lg hover:scale-[1.02]'
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
                
                <div className="absolute inset-0 bg-gradient-to-t from-orange-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 flex items-end justify-center pb-4 transition-all duration-300 rounded-lg">
                  <div className="flex items-center space-x-2 text-white">
                    <Camera className="w-5 h-5" />
                    <span className="text-sm font-semibold">Modifier la photo</span>
                  </div>
                </div>

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
                <motion.div 
                  className="flex items-center space-x-3 mb-3"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-3 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full text-white shadow-lg">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  
                  {guideType && (
                    <motion.div 
                      className={`p-2 rounded-full shadow-md transition-all duration-300 ${
                        isGuideViewed 
                          ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' 
                          : 'bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-800 dark:to-amber-800 text-orange-700 dark:text-orange-200 animate-pulse'
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

                <motion.div 
                  className="space-y-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-base font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    {guideType && !isGuideViewed ? 'Guide Photo + Sélection' : 'Sélectionner une photo'}
                  </p>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {guideType && !isGuideViewed 
                      ? 'Conseils de prise de vue inclus' 
                      : 'PNG, JPG ou JPEG (Max 5MB)'}
                  </p>

                  {guideType && isGuideViewed && (
                    <motion.p 
                      className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center justify-center space-x-1"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Guide déjà consulté</span>
                    </motion.p>
                  )}
                </motion.div>

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

      {guideType && (
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isGuideViewed 
              ? 'Guide photo disponible lors de la première utilisation'
              : 'Un guide s\'affichera pour vous aider avec la prise de vue'}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export const PhotoGuideModal = ({ 
  guideType, isOpen, onComplete 
}: {
  guideType: string | null;
  isOpen: boolean;
  onComplete: () => void;
}) => {
  useEffect(() => {
    if (isOpen && guideType) {
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
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-4 max-w-sm w-full mx-4 shadow-2xl"
      >
        <div className="text-center mb-3">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{guide.title}</h3>
        </div>

        <div className="relative w-full h-64 mb-3 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          <img
            src={guide.imagePath}
            alt={guide.altText}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-family='Arial, sans-serif' font-size='14' fill='%236b7280'%3EImage Guide%3C/text%3E%3C/svg%3E";
            }}
          />
          
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

export const ScheduleModal = ({ 
  isOpen, onClose, selectedDays, setSelectedDays, daySchedules, setDaySchedules, onSave 
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
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Horaires d'ouverture</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {daysOfWeek.map((day) => (
            <div key={day.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day.key)}
                    onChange={() => toggleDay(day.key)}
                    className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="font-medium text-gray-700 dark:text-gray-300">{day.label}</span>
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
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Ouverture</label>
                      <input
                        type="time"
                        value={daySchedules[day.key]?.start || '08:00'}
                        onChange={(e) => updateSchedule(day.key, 'start', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Fermeture</label>
                      <input
                        type="time"
                        value={daySchedules[day.key]?.end || '18:00'}
                        onChange={(e) => updateSchedule(day.key, 'end', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-500"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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

export const ScheduleField = ({ 
  id, label, value, onChange, selectedDays, daySchedules, onShowScheduleModal 
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
    
    return parts.join(' | ');
  };

  const displayText = generateScheduleText() || value;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        <div 
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
          onClick={onShowScheduleModal}
        >
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <span className={`text-sm flex-1 ${displayText ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500'}`}>
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
          className="mt-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg"
        >
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
              {selectedDays.length} jour{selectedDays.length > 1 ? 's' : ''} configuré{selectedDays.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-xs text-orange-700 dark:text-orange-300">
            {displayText}
          </div>
        </motion.div>
      )}
    </div>
  );
};
// FreelanceRegistration.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Phone, MapPin, Globe, Building, FileText, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { 
  InputField, SelectField, EnhancedImageUploadField, PhotoGuideModal, 
  ScheduleModal, ScheduleField, Stepper, countries, daysOfWeek 
} from './SharedUI';
import { authService } from '@/services/authService';
import { BusinessActorRegistrationRequest } from '@/types/api';
import type { Country, City } from './SharedUI';

interface FreelanceRegistrationProps {
  onBack: () => void;
}

export default function FreelanceRegistration({ onBack }: FreelanceRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string | null>>({
    identity_photo: null,
    id_card_front: null,
    id_card_back: null,
    niu_document: null,
    relay_point_photo: null
  });
  const [showPhotoGuide, setShowPhotoGuide] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [daySchedules, setDaySchedules] = useState<Record<string, { start: string; end: string }>>({});
  const [viewedGuides, setViewedGuides] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    manager_name: '', email: '', password: '', confirmPassword: '',
    phone_number: '', birth_date: '',
    country: 'cameroun', region: '', city: '',
    home_address: '', home_address_locality: '',
    id_card_number: '', niu: '',
    relay_point_name: '', relay_point_address: '', relay_point_locality: '',
    opening_hours: '', storage_capacity: 'Petit',
    identity_photo: null as File | null,
    id_card_front: null as File | null,
    id_card_back: null as File | null,
    niu_document: null as File | null,
    relay_point_photo: null as File | null
  });

  const steps = [
    { num: 1, title: 'Identification' },
    { num: 2, title: 'Coordonnées' },
    { num: 3, title: 'Point Relais' },
    { num: 4, title: 'Finalisation' }
  ];

  const getCountryData = (countryKey: string): Country | null => {
    return countries[countryKey] || null;
  };

  const getRegionData = (countryKey: string, regionKey: string): City | null => {
    const country = getCountryData(countryKey);
    return country?.regions[regionKey] || null;
  };

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));
      const previewUrl = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [name]: previewUrl }));
    }
  };

  const handlePhotoGuideShow = (guideType: string) => {
    if (!viewedGuides.includes(guideType)) {
      setShowPhotoGuide(guideType);
      setViewedGuides(prev => [...prev, guideType]);
    }
  };

  const handlePhotoGuideComplete = () => {
    const currentGuideType = showPhotoGuide;
    setShowPhotoGuide(null);
    
    if (currentGuideType) {
      setTimeout(() => {
        const fileInput = document.getElementById(currentGuideType) as HTMLInputElement;
        if (fileInput) {
          fileInput.click();
        }
      }, 100);
    }
  };

  const handleScheduleSave = () => {
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

    if (!formData.relay_point_name) {
      setError("Le nom du Point Relais est requis.");
      setIsLoading(false);
      return;
    }

    try {
      const businessData: BusinessActorRegistrationRequest = {
        name: formData.manager_name,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phone_number,
        city: formData.city,
        region: formData.region,
        country: formData.country,
        homeAddress: formData.home_address,
        accountType: 'BUSINESS_ACTOR',
        businessActorType: 'FREELANCE',
        businessName: formData.relay_point_name,
        businessAddress: formData.relay_point_address,
        businessLocality: formData.relay_point_locality,
        town: formData.city,
        cniNumber: formData.id_card_number,
        niu: formData.niu
      };

      localStorage.setItem('registration_data_cache', JSON.stringify({
        relay_point_name: formData.relay_point_name,
        relay_point_address: formData.relay_point_address,
        relay_point_locality: formData.relay_point_locality,
        opening_hours: formData.opening_hours,
        storage_capacity: formData.storage_capacity
      }));

      await authService.registerBusinessActor(businessData);
      setSuccess("Inscription réussie ! Redirection...");
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);

    } catch (err: any) {
      console.error("Erreur d'inscription:", err);
      setError(err.message || 'Une erreur est survenue lors de l\'inscription.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <motion.form 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            onSubmit={(e) => { e.preventDefault(); setCurrentStep(2); }} 
            className="space-y-4"
          >
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              Informations d'identification
            </h3>
            <InputField id="manager_name" label="Nom et Prénoms" value={formData.manager_name} onChange={handleChange} placeholder="Ex: Mballa Joseph" icon={User} />
            <InputField id="email" label="Adresse Email" type="email" value={formData.email} onChange={handleChange} placeholder="contact@exemple.com" icon={Mail} />
            <InputField id="phone_number" label="Numéro de téléphone" type="tel" value={formData.phone_number} onChange={handleChange} placeholder="Ex: 6XX XXX XXX" icon={Phone} />
            <InputField id="password" label="Mot de passe" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" icon={Lock} />
            <InputField id="confirmPassword" label="Confirmer le mot de passe" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" icon={Lock} />
          </motion.form>
        );

      case 2:
        return (
          <motion.form 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            onSubmit={(e) => { e.preventDefault(); setCurrentStep(3); }} 
            className="space-y-4"
          >
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              Coordonnées et informations
            </h3>
            
            <SelectField icon={Globe} id="country" name="country" label="Pays" value={formData.country} onChange={handleChange} required>
              <option value="">Sélectionnez un pays</option>
              {Object.entries(countries).map(([key, country]) => (
                <option key={key} value={key}>{country.name}</option>
              ))}
            </SelectField>

            {formData.country && (
              <SelectField icon={MapPin} id="region" name="region" label="Région" value={formData.region} onChange={handleChange} required>
                <option value="">Sélectionnez une région</option>
                {Object.entries(getCountryData(formData.country)?.regions || {}).map(([key, region]) => (
                  <option key={key} value={key}>{region.name}</option>
                ))}
              </SelectField>
            )}

            {formData.country && formData.region && (
              <SelectField icon={Building} id="city" name="city" label="Ville" value={formData.city} onChange={handleChange} required>
                <option value="">Sélectionnez une ville</option>
                {(getRegionData(formData.country, formData.region)?.cities || []).map((city: string) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </SelectField>
            )}

            <InputField id="home_address" label="Adresse personnelle" value={formData.home_address} onChange={handleChange} placeholder="Ex: Quartier Bastos, Yaoundé" icon={MapPin} />
            <InputField id="home_address_locality" label="Lieu dit de l'adresse" value={formData.home_address_locality} onChange={handleChange} placeholder="Ex: Face Pharmacie du Rond Point" required={false} />
            
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
              <EnhancedImageUploadField id="id_card_front" label="CNI (Recto)" onChange={handleFileChange} previewUrl={previews.id_card_front} />
              <EnhancedImageUploadField id="id_card_back" label="CNI (Verso)" onChange={handleFileChange} previewUrl={previews.id_card_back} />
            </div>
            
            <InputField id="niu" label="NIU" value={formData.niu} onChange={handleChange} placeholder="Ex: M123456789A" icon={FileText} />
            <EnhancedImageUploadField id="niu_document" label="Document NIU" onChange={handleFileChange} previewUrl={previews.niu_document} required={false} />
          </motion.form>
        );

      case 3:
        return (
          <motion.form 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            onSubmit={(e) => { e.preventDefault(); setCurrentStep(4); }} 
            className="space-y-4"
          >
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              Informations du Point Relais
            </h3>
            
            <InputField id="relay_point_name" label="Nom commercial du Point Relais" value={formData.relay_point_name} onChange={handleChange} placeholder="Ex: Épicerie Chez Papa" icon={Building} />
            <InputField id="relay_point_address" label="Adresse Complète" value={formData.relay_point_address} onChange={handleChange} placeholder="Ex: Quartier Mvan, Yaoundé" icon={MapPin} />
            <InputField id="relay_point_locality" label="Lieu dit de l'adresse du Point Relais" value={formData.relay_point_locality} onChange={handleChange} placeholder="Ex: Face Boulangerie Mvan" required={false} />
            
            <ScheduleField
              id="opening_hours"
              label="Horaires d'ouverture"
              value={formData.opening_hours}
              onChange={handleChange}
              selectedDays={selectedDays}
              daySchedules={daySchedules}
              onShowScheduleModal={() => setShowScheduleModal(true)}
            />
            
            <EnhancedImageUploadField 
              id="relay_point_photo" 
              label="Photo du point relais" 
              onChange={handleFileChange} 
              previewUrl={previews.relay_point_photo}
              guideType="relay_point"
              onShowGuide={handlePhotoGuideShow}
              isGuideViewed={viewedGuides.includes('relay_point')}
            />
            
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

      case 4:
        return (
          <motion.form 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            onSubmit={handleSubmit} 
            className="space-y-4"
          >
            <h3 className="text-xl font-bold text-center mb-4 text-gray-800 dark:text-gray-200">
              Vérification et Soumission
            </h3>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 p-4 rounded-lg space-y-2 text-sm">
              <p className="text-gray-800 dark:text-gray-200"><strong>Type de compte :</strong> Freelance</p>
              <p className="text-gray-800 dark:text-gray-200"><strong>Nom :</strong> {formData.manager_name}</p>
              <p className="text-gray-800 dark:text-gray-200"><strong>Email :</strong> {formData.email}</p>
              <p className="text-gray-800 dark:text-gray-200"><strong>Point Relais :</strong> {formData.relay_point_name}</p>
              {selectedDays.length > 0 && (
                <p className="text-gray-800 dark:text-gray-200"><strong>Horaires :</strong> {formData.opening_hours}</p>
              )}
            </div>
            
            <div className="space-y-3 mt-4">
              <div className="flex items-start space-x-3">
                <input type="checkbox" id="terms" required className="mt-1 h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 shrink-0" />
                <label htmlFor="terms" className="text-xs text-gray-700 dark:text-gray-300">
                  J'ai lu et j'accepte les{' '}
                  <Link href="/policy/terms-of-use" target="_blank" className="font-semibold text-orange-600 hover:underline">
                    Conditions Générales d'Utilisation
                  </Link>.
                </label>
              </div>
              <div className="flex items-start space-x-3">
                <input type="checkbox" id="privacy" required className="mt-1 h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 shrink-0" />
                <label htmlFor="privacy" className="text-xs text-gray-700 dark:text-gray-300">
                  Je comprends comment mes données sont utilisées conformément à la{' '}
                  <Link href="/policy/privacy-policy" target="_blank" className="font-semibold text-orange-600 hover:underline">
                    Politique de Confidentialité
                  </Link>.
                </label>
              </div>
            </div>
          </motion.form>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <Stepper currentStep={currentStep} steps={steps} />

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 text-sm rounded-lg">
          <span className="font-bold">Erreur :</span> {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 text-sm rounded-lg">
          {success}
        </div>
      )}

      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>

      <div className="flex justify-between items-center pt-6 border-t border-gray-100 dark:border-gray-700 mt-6">
        <button 
          type="button" 
          onClick={currentStep === 1 ? onBack : () => setCurrentStep(prev => prev - 1)} 
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> {currentStep === 1 ? 'Retour' : 'Précédent'}
        </button>
        
        {currentStep === 4 ? (
          <button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={isLoading} 
            className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:from-orange-600 hover:to-amber-600 focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {isLoading ? 'Création...' : 'Créer mon Compte'}
          </button>
        ) : (
          <button 
            type="button" 
            onClick={() => setCurrentStep(prev => prev + 1)} 
            className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all transform hover:scale-105"
          >
            Suivant
          </button>
        )}
      </div>

      <AnimatePresence>
        {showPhotoGuide && (
          <PhotoGuideModal
            guideType={showPhotoGuide}
            isOpen={!!showPhotoGuide}
            onComplete={handlePhotoGuideComplete}
          />
        )}

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
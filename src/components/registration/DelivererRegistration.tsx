// DelivererRegistration.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Phone, MapPin, Globe, Building, FileText, ChevronLeft, Truck } from 'lucide-react';
import Link from 'next/link';
import { 
  InputField, SelectField, EnhancedImageUploadField, PhotoGuideModal, 
  Stepper, countries 
} from './SharedUI';
import { authService } from '@/services/authService';
import { BusinessActorRegistrationRequest } from '@/types/api';
import type { Country, City } from './SharedUI';

interface DelivererRegistrationProps {
  onBack: () => void;
}

export default function DelivererRegistration({ onBack }: DelivererRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string | null>>({
    identity_photo: null,
    id_card_front: null,
    id_card_back: null,
    niu_document: null,
    vehicle_photo_front: null,
    vehicle_photo_back: null,
    driving_license_front: null,
    driving_license_back: null
  });
  const [showPhotoGuide, setShowPhotoGuide] = useState<string | null>(null);
  const [viewedGuides, setViewedGuides] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    manager_name: '', email: '', password: '', confirmPassword: '',
    phone_number: '', birth_date: '',
    country: 'cameroun', region: '', city: '',
    home_address: '', home_address_locality: '',
    id_card_number: '', niu: '',
    vehicle_type: '', vehicle_brand: '', vehicle_registration: '',
    vehicle_color: '', trunk_dimensions: '', accident_history: '',
    identity_photo: null as File | null,
    id_card_front: null as File | null,
    id_card_back: null as File | null,
    niu_document: null as File | null,
    vehicle_photo_front: null as File | null,
    vehicle_photo_back: null as File | null,
    driving_license_front: null as File | null,
    driving_license_back: null as File | null
  });

  const steps = [
    { num: 1, title: 'Identification' },
    { num: 2, title: 'Coordonnées' },
    { num: 3, title: 'Véhicule' },
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
        businessActorType: 'DELIVERER',
        businessName: formData.manager_name || `Livreur ${formData.email}`,
        businessAddress: formData.home_address,
        businessLocality: formData.home_address_locality,
        town: formData.city,
        cniNumber: formData.id_card_number,
        niu: formData.niu
      };

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
              Informations sur votre véhicule
            </h3>
            
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
                  <EnhancedImageUploadField 
                    id="driving_license_front" 
                    label="Photo du permis de conduire (recto)" 
                    onChange={handleFileChange} 
                    previewUrl={previews.driving_license_front}
                  />
                  <EnhancedImageUploadField 
                    id="driving_license_back" 
                    label="Photo du permis de conduire (verso)" 
                    onChange={handleFileChange} 
                    previewUrl={previews.driving_license_back}
                  />
                </div>
              )
            )}
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
              <p className="text-gray-800 dark:text-gray-200"><strong>Type de compte :</strong> Livreur</p>
              <p className="text-gray-800 dark:text-gray-200"><strong>Nom :</strong> {formData.manager_name}</p>
              <p className="text-gray-800 dark:text-gray-200"><strong>Email :</strong> {formData.email}</p>
              {formData.vehicle_type && (
                <p className="text-gray-800 dark:text-gray-200">
                  <strong>Véhicule :</strong> {formData.vehicle_type} - {formData.vehicle_brand}
                </p>
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
      </AnimatePresence>
    </div>
  );
}
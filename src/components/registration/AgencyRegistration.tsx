'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Phone, MapPin, Globe, Building, FileText, ChevronLeft, Truck, Clock, Briefcase, Home, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  InputField, SelectField, EnhancedImageUploadField, PhotoGuideModal, 
  ScheduleModal, ScheduleField, Stepper, countries, daysOfWeek 
} from './SharedUI';
import { authService } from '@/services/authService';
import { BusinessActorRegistrationRequest } from '@/types/api';
import type { Country, City } from './SharedUI';

interface AgencyRegistrationProps {
  onBack: () => void;
}

export default function AgencyRegistration({ onBack }: AgencyRegistrationProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // États de Feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // États de Prévisualisation d'Images
  const [previews, setPreviews] = useState<Record<string, string | null>>({
    identity_photo: null,
    cni_recto: null,
    cni_verso: null,
    niu_document: null,
    agency_photo: null
  });
  
  // États des Modales
  const [showPhotoGuide, setShowPhotoGuide] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [viewedGuides, setViewedGuides] = useState<string[]>([]);
  
  // États Horaires
  const [selectedDays, setSelectedDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const [daySchedules, setDaySchedules] = useState<Record<string, { start: string; end: string }>>({
      monday: { start: '08:00', end: '18:00' },
      tuesday: { start: '08:00', end: '18:00' },
      wednesday: { start: '08:00', end: '18:00' },
      thursday: { start: '08:00', end: '18:00' },
      friday: { start: '08:00', end: '18:00' },
  });

  // États Formulaire
  const [formData, setFormData] = useState({
    // Propriétaire
    manager_name: '', email: '', password: '', confirmPassword: '',
    phone_number: '', 
    // Adresse Propriétaire
    country: 'cameroun', region: '', city: '',
    home_address: '',
    id_card_number: '', niu: '',
    // Agence
    agency_name: '', agency_address: '', agency_locality: '',
    opening_hours: 'Lundi-Vendredi: 08:00-18:00',
    employee_count_est: 1,
    storage_capacity: 'Moyen',
    // Fichiers
    identity_photo: null as File | null,
    cni_recto: null as File | null,
    cni_verso: null as File | null,
    niu_document: null as File | null,
    agency_photo: null as File | null
  });

  const steps = [
    { num: 1, title: 'Propriétaire' }, // Infos Admin
    { num: 2, title: 'Coordonnées' }, // Contact Admin
    { num: 3, title: 'Agence' },      // Infos Structure
    { num: 4, title: 'Finalisation' }
  ];

  // --- Gestion de la Géographie (Pays/Ville) ---
  const getCountryData = (countryKey: string) => countries[countryKey] || null;
  const getRegionData = (countryKey: string, regionKey: string) => {
    const country = getCountryData(countryKey);
    return country?.regions[regionKey] || null;
  };

  useEffect(() => {
    // Reset en cascade si changement pays/région
    if (formData.country) {
      const countryData = getCountryData(formData.country);
      if (countryData && !countryData.regions.hasOwnProperty(formData.region)) {
        setFormData(prev => ({ ...prev, region: '', city: '' }));
      }
    }
  }, [formData.country]);

  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));
      setPreviews(prev => ({ ...prev, [name]: URL.createObjectURL(file) }));
    }
  };

  // --- Horaires ---
  const handleScheduleSave = () => {
    if (selectedDays.length > 0) {
      const scheduleGroups: Record<string, string[]> = {};
      selectedDays.forEach(dayKey => {
        const schedule = daySchedules[dayKey];
        const timeRange = `${schedule.start}-${schedule.end}`;
        if (!scheduleGroups[timeRange]) scheduleGroups[timeRange] = [];
        const dayLabel = daysOfWeek.find(d => d.key === dayKey)?.label || dayKey;
        scheduleGroups[timeRange].push(dayLabel);
      });
      
      const parts = Object.entries(scheduleGroups).map(([timeRange, days]) => {
        const daysList = days.join(', ');
        return `${daysList}: ${timeRange}`;
      });
      setFormData(prev => ({ ...prev, opening_hours: parts.join(' | ') }));
    }
    setShowScheduleModal(false);
  };

  // --- SOUMISSION ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setIsLoading(false);
      return;
    }

    if (!formData.agency_name) {
      setError("Le nom de l'agence (Nom Commercial) est requis.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Stockage tampon pour création automatique de l'agence post-login
      // (Car on ne peut pas créer d'entité Agency sans être auth)
      localStorage.setItem('pending_agency_creation', JSON.stringify({
          commercialName: formData.agency_name,
          address: formData.agency_address,
          locality: formData.agency_locality || formData.city,
          openingHours: formData.opening_hours,
          storageCapacity: formData.storage_capacity,
          // Nous stockerons les fichiers plus tard ou les enverrons ici si l'API Auth le supporte (multipart)
      }));

      // 2. Création de l'User + BusinessActor
      const registrationPayload: BusinessActorRegistrationRequest = {
        // Infos User
        name: formData.manager_name,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phone_number,
        
        // Adresse Propriétaire
        city: formData.city,
        region: formData.region,
        country: formData.country,
        homeAddress: formData.home_address,
        
        // Infos Rôle Business
        accountType: 'BUSINESS_ACTOR',
        businessActorType: 'AGENCY_OWNER', // IMPORTANT: AGENCY_OWNER
        
        // Infos Légales Business
        businessName: formData.agency_name,
        businessAddress: formData.agency_address,
        businessLocality: formData.agency_locality,
        town: formData.city, // Ville d'opération principale
        cniNumber: formData.id_card_number,
        niu: formData.niu
      };

      await authService.registerBusinessActor(registrationPayload);
      
      setSuccess("Inscription réussie ! Vous allez être redirigé vers la connexion pour finaliser la configuration de votre agence.");
      
      setTimeout(() => {
        router.push('/login');
      }, 2500);

    } catch (err: any) {
      console.error("Erreur d'inscription Agence:", err);
      // Parsing des erreurs backend communes
      const msg = err.message || 'Une erreur est survenue.';
      setError(msg.includes('exists') ? "Cet email est déjà utilisé." : msg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDU DES ETAPES ---
  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
             <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-4 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-3">
                   <Building className="text-blue-600 dark:text-blue-400 w-8 h-8" />
                   <div>
                       <h3 className="font-bold text-blue-900 dark:text-blue-100">Compte Agence</h3>
                       <p className="text-xs text-blue-700 dark:text-blue-300">Pour les entreprises gérant plusieurs employés ou points de logistique.</p>
                   </div>
                </div>
             </div>
             
             <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Informations Propriétaire</h3>
             <InputField id="manager_name" label="Nom & Prénom (Représentant)" value={formData.manager_name} onChange={handleChange} placeholder="Ex: M. FOPA Henri" icon={User} />
             <InputField id="email" label="Email Professionnel" type="email" value={formData.email} onChange={handleChange} placeholder="contact@agence.com" icon={Mail} />
             <InputField id="phone_number" label="Téléphone Mobile" type="tel" value={formData.phone_number} onChange={handleChange} placeholder="Ex: 6XX XXX XXX" icon={Phone} />
             <div className="grid grid-cols-2 gap-4">
                 <InputField id="password" label="Mot de passe" type="password" value={formData.password} onChange={handleChange} icon={Lock} />
                 <InputField id="confirmPassword" label="Confirmation" type="password" value={formData.confirmPassword} onChange={handleChange} icon={Lock} />
             </div>
          </motion.div>
        );

      case 2:
        return (
           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
               <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Localisation Propriétaire</h3>
               
               <SelectField icon={Globe} id="country" name="country" label="Pays de résidence" value={formData.country} onChange={handleChange}>
                   <option value="">Sélectionnez...</option>
                   {Object.entries(countries).map(([k, c]) => <option key={k} value={k}>{c.name}</option>)}
               </SelectField>

               {formData.country && (
                  <div className="grid grid-cols-2 gap-4">
                      <SelectField icon={MapPin} id="region" name="region" label="Région" value={formData.region} onChange={handleChange}>
                          <option value="">...</option>
                          {Object.entries(getCountryData(formData.country)?.regions || {}).map(([k, r]) => (
                             <option key={k} value={k}>{r.name}</option>
                          ))}
                      </SelectField>
                      
                      <SelectField icon={Building} id="city" name="city" label="Ville" value={formData.city} onChange={handleChange}>
                          <option value="">...</option>
                          {(getRegionData(formData.country, formData.region)?.cities || []).map(city => (
                             <option key={city} value={city}>{city}</option>
                          ))}
                      </SelectField>
                  </div>
               )}
               
               <InputField id="home_address" label="Adresse personnelle / Quartier" value={formData.home_address} onChange={handleChange} icon={Home} />

               <div className="pt-4 border-t dark:border-gray-700 mt-2">
                   <h4 className="text-sm font-bold text-gray-500 mb-3">Identification Légale (Recommandé)</h4>
                   <InputField id="id_card_number" label="N° CNI" value={formData.id_card_number} onChange={handleChange} placeholder="Optionnel" />
                   <div className="grid grid-cols-2 gap-2 mt-2">
                       <EnhancedImageUploadField id="cni_recto" label="CNI (Recto)" onChange={handleFileChange} previewUrl={previews.cni_recto} required={false} />
                       <EnhancedImageUploadField id="cni_verso" label="CNI (Verso)" onChange={handleFileChange} previewUrl={previews.cni_verso} required={false} />
                   </div>
               </div>
           </motion.div>
        );
        
      case 3:
          return (
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                 <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Configuration Agence</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400">Cette information configurera votre agence principale (Siège).</p>
                 
                 <InputField id="agency_name" label="Nom Commercial" value={formData.agency_name} onChange={handleChange} placeholder="Ex: Flash Express Sarl" icon={Briefcase} />
                 <InputField id="niu" label="NIU / Registre Commerce" value={formData.niu} onChange={handleChange} icon={FileText} placeholder="M123..." required={false} />
                 
                 <InputField id="agency_address" label="Adresse Physique Agence" value={formData.agency_address} onChange={handleChange} icon={MapPin} />
                 <InputField id="agency_locality" label="Quartier / Repère" value={formData.agency_locality} onChange={handleChange} placeholder="Ex: Carrefour Biyem-Assi" required={false} />

                 <ScheduleField
                    id="opening_hours"
                    label="Horaires d'ouverture standard"
                    value={formData.opening_hours}
                    onChange={handleChange}
                    selectedDays={selectedDays}
                    daySchedules={daySchedules}
                    onShowScheduleModal={() => setShowScheduleModal(true)}
                 />

                 <SelectField icon={Building} id="storage_capacity" label="Capacité Est. (Volume Colis/mois)" value={formData.storage_capacity} onChange={handleChange}>
                     <option value="Petit">Démarrage (&lt; 100)</option>
                     <option value="Moyen">Moyenne (100 - 500)</option>
                     <option value="Grand">Hub Logistique (&gt; 500)</option>
                 </SelectField>

                 <EnhancedImageUploadField 
                    id="agency_photo" 
                    label="Photo Devanture / Logo" 
                    onChange={handleFileChange} 
                    previewUrl={previews.agency_photo} 
                    required={false}
                    guideType="relay_point"
                 />
             </motion.div>
          );
          
      case 4:
          return (
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center pt-4">
                 <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mb-4 animate-bounce">
                     <Briefcase className="w-10 h-10"/>
                 </div>
                 
                 <div>
                     <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Prêt à créer votre Agence ?</h3>
                     <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                        Vous êtes sur le point de créer un compte <strong>Propriétaire d'Agence</strong>.
                     </p>
                 </div>
                 
                 <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl text-left border border-gray-200 dark:border-gray-700">
                     <h4 className="font-bold text-sm text-gray-500 uppercase mb-3 border-b pb-2">Récapitulatif</h4>
                     <ul className="space-y-2 text-sm text-gray-800 dark:text-gray-200">
                         <li><span className="font-semibold text-gray-500">Nom Gérant:</span> {formData.manager_name}</li>
                         <li><span className="font-semibold text-gray-500">Email:</span> {formData.email}</li>
                         <li><span className="font-semibold text-gray-500">Agence:</span> {formData.agency_name}</li>
                         <li><span className="font-semibold text-gray-500">Capacité:</span> {formData.storage_capacity}</li>
                     </ul>
                 </div>
                 
                 <div className="text-xs text-gray-500 flex gap-2 justify-center bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100">
                     <input type="checkbox" required className="mt-0.5" />
                     <span>Je certifie être le représentant légal de cette entité et accepte les conditions B2B.</span>
                 </div>
             </motion.div>
          );
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
       <Stepper currentStep={currentStep} steps={steps} />

       <div className="flex-1 overflow-y-auto px-1 py-2 custom-scrollbar">
           {error && (
               <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-800 text-sm rounded-lg flex gap-2 items-center">
                   <span className="font-bold">Erreur:</span> {error}
               </div>
           )}
           {success && (
               <div className="mb-4 p-4 bg-green-100 border border-green-200 text-green-800 text-sm rounded-lg flex flex-col items-center justify-center text-center">
                   <CheckCircle className="w-8 h-8 mb-2 text-green-600"/>
                   {success}
               </div>
           )}
           
           <form id="agencyForm" onSubmit={handleSubmit}>
               <AnimatePresence mode="wait">
                   {renderStep()}
               </AnimatePresence>
           </form>
       </div>

       {/* Actions Bottom Bar */}
       {!success && (
           <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center mt-auto">
              <button 
                  type="button" 
                  onClick={currentStep === 1 ? onBack : () => setCurrentStep(c => c - 1)} 
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-sm transition-colors flex items-center gap-2"
              >
                  <ChevronLeft className="w-4 h-4"/> Précédent
              </button>

              {currentStep === 4 ? (
                  <button 
                      form="agencyForm"
                      type="submit" 
                      disabled={isLoading}
                      className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                      Confirmer Création
                  </button>
              ) : (
                  <button 
                      type="button"
                      onClick={(e) => { e.preventDefault(); setCurrentStep(c => c + 1); }}
                      className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
                  >
                      Suivant
                  </button>
              )}
           </div>
       )}

       {/* Modales Annexes */}
       <AnimatePresence>
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
            {showPhotoGuide && (
                <PhotoGuideModal
                    guideType={showPhotoGuide}
                    isOpen={!!showPhotoGuide}
                    onComplete={() => {
                        const inputId = showPhotoGuide === 'relay_point' ? 'agency_photo' : 'identity_photo';
                        document.getElementById(inputId)?.click();
                        setShowPhotoGuide(null);
                    }}
                />
            )}
       </AnimatePresence>
    </div>
  );
}
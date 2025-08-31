'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Briefcase, Clock, Building, ChevronLeft, Check, Mail, Lock, Phone, MapPin, Calendar, Users, Truck, Camera, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

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
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
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
        <input {...{ id, name: id, type, value, onChange, required, placeholder }} className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-500 transition-all text-sm`} />
      )}
    </div>
  </div>
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

export default function RegisterProPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<'CLIENT' | 'FREELANCE' | 'AGENCY' | 'LIVREUR' | null>(null);
  const [formData, setFormData] = useState({
    // Identification
    manager_name: '', email: '', password: '', confirmPassword: '',
    // Coordonnées
    phone_number: '', birth_date: '', nationality: '', home_address: '', home_address_locality: '', 
    id_card_number: '', niu: '',
    // Point Relais (Freelance/Agence)
    relay_point_name: '', relay_point_address: '', relay_point_locality: '', opening_hours: '', storage_capacity: 'Petit',
    // Véhicule (Livreur)
    vehicle_type: '', vehicle_brand: '', vehicle_registration: '', vehicle_color: '', trunk_dimensions: '',
    driving_license_front: null, driving_license_back: null, accident_history: ''
  });

  // Définir les étapes selon le type de compte
  const getStepsForAccountType = (type: string | null) => {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleNextStep = () => setCurrentStep(prev => prev + 1);
  const handlePrevStep = () => setCurrentStep(prev => prev - 1);

  const handleAccountTypeSelection = (type: 'CLIENT' | 'FREELANCE' | 'AGENCY' | 'LIVREUR') => {
    setAccountType(type);
    setCurrentStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validations
    if (formData.password !== formData.confirmPassword) {
      return setError("Les mots de passe ne correspondent pas.");
    }
    if (formData.password.length < 6) {
      return setError("Le mot de passe doit faire au moins 6 caractères.");
    }
    if (!accountType) {
      return setError("Veuillez sélectionner un type de compte.");
    }

    setIsLoading(true);

    try {
      console.log('🔍 Début de l\'inscription...');
      console.log('📧 Email:', formData.email.trim().toLowerCase());
      console.log('🏢 Type compte:', accountType);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            // Correspond à `new.raw_user_meta_data->>'account_type'` dans votre SQL
            account_type: accountType,
            
            // Correspond à `new.raw_user_meta_data->>'manager_name'` dans votre SQL
            manager_name: formData.manager_name,
            
            // Correspond à `new.raw_user_meta_data->>'phone_number'` dans votre SQL
            phone_number: formData.phone_number
          },
          // Redirige l'utilisateur vers la page de connexion après qu'il ait cliqué sur le lien de confirmation
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      // --- FIN DE LA CORRECTION ---

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
            throw new Error('Un utilisateur avec cet email existe déjà.');
        }
        throw signUpError;
      }

      if (!data.user) {
        throw new Error("L'inscription a réussi mais aucune donnée utilisateur n'a été retournée.");
      }
      
      setSuccess("Inscription réussie ! Veuillez vérifier votre boîte mail pour confirmer votre compte et pouvoir vous connecter.");

    } catch (err: any) {
      console.error('💥 Erreur d\'inscription:', err);
      setError(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setIsLoading(false);
    }
};

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
            ].map((item) => (
              <button key={item.type} onClick={() => handleAccountTypeSelection(item.type as any)} className="p-6 border-2 border-gray-200 rounded-xl text-center space-y-3 hover:border-orange-500 hover:bg-orange-50 hover:shadow-md transform hover:-translate-y-1 transition-all duration-200">
                <div className="text-orange-500 inline-block">{item.icon}</div>
                <h4 className="text-lg font-semibold text-gray-800">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </button>
            ))}
          </div>
        </motion.div>
      );

      case 2: return (
        <motion.form initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
          <h3 className="text-xl font-bold mb-4">Informations d'identification</h3>
          <InputField id="manager_name" label="Nom et Prénoms" value={formData.manager_name} onChange={handleChange} placeholder="Ex: Mballa Joseph" icon={User} />
          <InputField id="email" label="Adresse Email" type="email" value={formData.email} onChange={handleChange} placeholder="contact@exemple.com" icon={Mail} />
          <InputField id="password" label="Mot de passe" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" icon={Lock} />
          <InputField id="confirmPassword" label="Confirmer le mot de passe" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" icon={Lock} />
        </motion.form>
      );

      case 3: 
        if (accountType === 'CLIENT') {
          // Étape de finalisation pour CLIENT
          return (
            <motion.form initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-xl font-bold text-center mb-4">Vérification et Soumission</h3>
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg space-y-2 text-sm">
                <p><strong>Type de compte :</strong> {accountType}</p>
                <p><strong>Nom :</strong> {formData.manager_name}</p>
                <p><strong>Email :</strong> {formData.email}</p>
              </div>
              <div className="flex items-start space-x-2">
                <input type="checkbox" id="terms" required className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                <label htmlFor="terms" className="text-xs text-gray-700">J'ai lu et j'accepte les <a href="#" className="font-medium text-orange-600 hover:underline">conditions d'utilisation</a>.</label>
              </div>
            </motion.form>
          );
        }
        // Étape Coordonnées pour autres types
        return (
          <motion.form initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
            <h3 className="text-xl font-bold mb-4">Coordonnées et informations</h3>
            <InputField id="phone_number" label="Numéro de téléphone" type="tel" value={formData.phone_number} onChange={handleChange} placeholder="Ex: 6XX XXX XXX" icon={Phone} />
            <InputField id="birth_date" label="Date de naissance" type="date" value={formData.birth_date} onChange={handleChange} icon={Calendar} />
            <InputField id="nationality" label="Nationalité" value={formData.nationality} onChange={handleChange} placeholder="Ex: Camerounaise" />
            <InputField id="home_address" label="Adresse personnelle" value={formData.home_address} onChange={handleChange} placeholder="Ex: Quartier Bastos, Yaoundé" icon={MapPin} />
            <InputField id="home_address_locality" label="Lieu dit de l'adresse" value={formData.home_address_locality} onChange={handleChange} placeholder="Ex: Face Pharmacie du Rond Point" />
            <InputField id="id_card_number" label="Numéro CNI" value={formData.id_card_number} onChange={handleChange} placeholder="Ex: 123456789" />
            <InputField id="niu" label="NIU (Numéro d'Identification Unique)" value={formData.niu} onChange={handleChange} placeholder="Ex: M123456789A" />
          </motion.form>
        );

      case 4:
        if (accountType === 'LIVREUR') {
          // Étape Véhicule pour LIVREUR
          return (
            <motion.form initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
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
              <InputField id="vehicle_brand" label="Marque du véhicule" value={formData.vehicle_brand} onChange={handleChange} placeholder="Ex: Toyota, Yamaha, etc." />
              <InputField id="vehicle_registration" label="Numéro d'immatriculation" value={formData.vehicle_registration} onChange={handleChange} placeholder="Ex: LT-123-AA" />
              <InputField id="vehicle_color" label="Couleur du véhicule" value={formData.vehicle_color} onChange={handleChange} placeholder="Ex: Blanc, Noir, Rouge" />
              <InputField id="trunk_dimensions" label="Dimensions de la malle arrière (optionnel)" value={formData.trunk_dimensions} onChange={handleChange} placeholder="Ex: 50x30x40 cm" required={false} />
              
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
          <motion.form initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
            <h3 className="text-xl font-bold mb-4">Informations du Point Relais</h3>
            <InputField id="relay_point_name" label="Nom commercial du Point Relais" value={formData.relay_point_name} onChange={handleChange} placeholder="Ex: Épicerie Chez Papa" icon={Building} />
            <InputField id="relay_point_address" label="Adresse Complète" value={formData.relay_point_address} onChange={handleChange} placeholder="Ex: Quartier Mvan, Yaoundé" icon={MapPin} />
            <InputField id="relay_point_locality" label="Lieu dit de l'adresse du Point Relais" value={formData.relay_point_locality} onChange={handleChange} placeholder="Ex: Face Boulangerie Mvan" />
            <InputField id="opening_hours" label="Horaires d'ouverture" value={formData.opening_hours} onChange={handleChange} placeholder="Ex: Lun-Sam: 8h-20h" icon={Clock} />
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
        <motion.form initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-xl font-bold text-center mb-4">Vérification et Soumission</h3>
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg space-y-2 text-sm">
            <p><strong>Type de compte :</strong> {accountType}</p>
            <p><strong>Nom :</strong> {formData.manager_name}</p>
            <p><strong>Email :</strong> {formData.email}</p>
            <p><strong>Téléphone :</strong> {formData.phone_number}</p>
            {accountType === 'LIVREUR' && formData.vehicle_type && (
              <p><strong>Véhicule :</strong> {formData.vehicle_type} - {formData.vehicle_brand}</p>
            )}
            {['FREELANCE', 'AGENCY'].includes(accountType || '') && formData.relay_point_name && (
              <p><strong>Point Relais :</strong> {formData.relay_point_name}</p>
            )}
          </div>
          <div className="flex items-start space-x-2">
            <input type="checkbox" id="terms" required className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
            <label htmlFor="terms" className="text-xs text-gray-700">J'ai lu et j'accepte les <a href="#" className="font-medium text-orange-600 hover:underline">conditions d'utilisation</a>.</label>
          </div>
        </motion.form>
      );

      default: return null;
    }
  };

  const steps = getStepsForAccountType(accountType);
  const maxStep = accountType === 'CLIENT' ? 3 : 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
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
              <button type="button" onClick={handlePrevStep} className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors">
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
    </div>
  );
}
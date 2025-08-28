'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Briefcase, Clock, Building, ChevronLeft, Check, Mail, Lock, Phone, MapPin, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const Stepper = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { num: 1, title: 'Type de compte' },
    { num: 2, title: 'Identification' },
    { num: 3, title: 'Coordonnées' },
    { num: 4, title: 'Point Relais' },
    { num: 5, title: 'Finalisation' }
  ];

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.num}>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm transition-all duration-300 ${currentStep >= step.num ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
              {currentStep > step.num ? <Check className="w-4 h-4" /> : step.num}
            </div>
            <p className={`mt-1 text-xs font-medium ${currentStep >= step.num ? 'text-orange-600' : 'text-gray-500'}`}>{step.title}</p>
          </div>
          {index < steps.length - 1 && <div className={`flex-1 h-px mx-3 transition-all duration-300 ${currentStep > index + 1 ? 'bg-orange-500' : 'bg-gray-200'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
};

const InputField = ({ id, label, type = 'text', value, onChange, placeholder, required = true, icon: Icon }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
      <input {...{ id, name: id, type, value, onChange, required, placeholder }} className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-500 transition-all text-sm`} />
    </div>
  </div>
);


export default function RegisterProPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<'FREELANCE' | 'AGENCY' | null>(null);
  const [formData, setFormData] = useState({
    manager_name: '', email: '', password: '', confirmPassword: '', phone_number: '',
    birth_date: '', nationality: '', home_address: '', id_card_number: '',
    relay_point_name: '', relay_point_address: '', opening_hours: '', storage_capacity: 'Petit'
  });


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = () => setCurrentStep(prev => prev + 1);
  const handlePrevStep = () => setCurrentStep(prev => prev - 1);

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
    if (!formData.manager_name.trim()) {
      return setError("Le nom du gérant est obligatoire.");
    }
    if (!formData.phone_number.trim()) {
      return setError("Le numéro de téléphone est obligatoire.");
    }

    setIsLoading(true);

    try {
      console.log('🔍 Début de l\'inscription...');
      console.log('📧 Email:', formData.email.trim().toLowerCase());
      console.log('🏢 Type compte:', accountType);

      // Vérifiez d'abord la session actuelle
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('📱 Session actuelle:', sessionData.session?.user?.email || 'Aucune session');

      // Si une session existe déjà, la fermer
      if (sessionData.session) {
        await supabase.auth.signOut();
        console.log('🚪 Session précédente fermée');
      }

      // Préparer les métadonnées pour le trigger
      const userMetadata = {
        account_type: accountType,
        manager_name: formData.manager_name.trim(),
        phone_number: formData.phone_number.trim(),
        birth_date: formData.birth_date || null,
        nationality: formData.nationality?.trim() || null,
        home_address: formData.home_address?.trim() || null,
        id_card_number: formData.id_card_number?.trim() || null,
        relay_point_name: formData.relay_point_name?.trim() || null,
        relay_point_address: formData.relay_point_address?.trim() || null,
        opening_hours: formData.opening_hours?.trim() || null,
        storage_capacity: formData.storage_capacity || 'Petit'
      };

      console.log('📦 Métadonnées pour le trigger:', userMetadata);

      // Inscription avec métadonnées - le trigger s'occupera automatiquement de créer le profil
      console.log('🚀 Inscription avec trigger automatique...');
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: userMetadata
        }
      });

      console.log('✅ Réponse inscription:', { data, error: signUpError });

      if (signUpError) {
        console.error('❌ Erreur signUp:', signUpError);
        
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
          throw new Error("Cette adresse email est déjà utilisée.");
        }
        if (signUpError.message.includes('Invalid email')) {
          throw new Error("Format d'email invalide.");
        }
        if (signUpError.message.includes('Password should be at least 6 characters')) {
          throw new Error("Le mot de passe doit faire au moins 6 caractères.");
        }
        
        throw new Error(signUpError.message);
      }

      if (!data.user) {
        throw new Error("Aucun utilisateur créé.");
      }

      console.log('🎉 Utilisateur créé:', data.user.email, 'ID:', data.user.id);
      console.log('🔧 Le trigger Supabase va créer le profil automatiquement avec les métadonnées');

      setSuccess("Inscription réussie ! Vérifiez votre boîte mail pour confirmer votre compte.");
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err: any) {
      console.error('💥 Erreur inscription:', err);
      setError(err.message || 'Une erreur inattendue est survenue lors de l\'inscription.');
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
              { type: 'FREELANCE', icon: <User className="w-8 h-8" />, title: "Freelance", desc: "Individu ou petit commerçant" },
              { type: 'AGENCY', icon: <Building className="w-8 h-8" />, title: "Agence", desc: "Entreprise ou structure" }
            ].map((item) => (
              <button key={item.type} onClick={() => { setAccountType(item.type as any); handleNextStep(); }} className="p-6 border-2 border-gray-200 rounded-xl text-center space-y-3 hover:border-orange-500 hover:bg-orange-50 hover:shadow-md transform hover:-translate-y-1 transition-all duration-200">
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
          <h3 className="text-xl font-bold mb-4">Informations personnelles</h3>
          <InputField id="manager_name" label="Nom et Prénoms" value={formData.manager_name} onChange={handleChange} placeholder="Ex: Mballa Joseph" icon={User} />
          <InputField id="email" label="Adresse Email" type="email" value={formData.email} onChange={handleChange} placeholder="contact@votreentreprise.com" icon={Mail} />
          <InputField id="password" label="Mot de passe" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" icon={Lock} />
          <InputField id="confirmPassword" label="Confirmer le mot de passe" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" icon={Lock} />
        </motion.form>
      );

      case 3: return (
        <motion.form initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
          <h3 className="text-xl font-bold mb-4">Coordonnées et informations</h3>
          <InputField id="phone_number" label="Numéro de téléphone" type="tel" value={formData.phone_number} onChange={handleChange} placeholder="Ex: 6XX XXX XXX" icon={Phone} />
          <InputField id="birth_date" label="Date de naissance" type="date" value={formData.birth_date} onChange={handleChange} required={false} icon={Calendar} />
          <InputField id="nationality" label="Nationalité" value={formData.nationality} onChange={handleChange} placeholder="Ex: Camerounaise" required={false} />
          <InputField id="home_address" label="Adresse personnelle" value={formData.home_address} onChange={handleChange} placeholder="Ex: Quartier Bastos, Yaoundé" required={false} icon={MapPin} />
          <InputField id="id_card_number" label="Numéro CNI" value={formData.id_card_number} onChange={handleChange} placeholder="Ex: 123456789" required={false} />
        </motion.form>
      );

      case 4: return (
        <motion.form initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
          <h3 className="text-xl font-bold mb-4">Informations du Point Relais</h3>
          <InputField id="relay_point_name" label="Nom commercial du Point Relais" value={formData.relay_point_name} onChange={handleChange} placeholder="Ex: Épicerie Chez Papa" icon={Building} required={false} />
          <InputField id="relay_point_address" label="Adresse Complète" value={formData.relay_point_address} onChange={handleChange} placeholder="Ex: Face Boulangerie Mvan, Yaoundé" icon={MapPin} required={false} />
          <InputField id="opening_hours" label="Horaires d'ouverture" value={formData.opening_hours} onChange={handleChange} placeholder="Ex: Lun-Sam: 8h-20h" icon={Clock} required={false} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Capacité de stockage</label>
            <select id="storage_capacity" name="storage_capacity" value={formData.storage_capacity} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-500 transition-all text-sm">
              <option value="Petit">Petit (&lt; 50 colis)</option>
              <option value="Moyen">Moyen (50-200 colis)</option>
              <option value="Grand">Grand (&gt; 200 colis)</option>
            </select>
          </div>
        </motion.form>
      );

      case 5: return (
        <motion.form initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-xl font-bold text-center mb-4">Vérification et Soumission</h3>
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg space-y-2 text-sm">
            <p><strong>Type de compte :</strong> {accountType}</p>
            <p><strong>Gérant :</strong> {formData.manager_name}</p>
            <p><strong>Email :</strong> {formData.email}</p>
            <p><strong>Téléphone :</strong> {formData.phone_number}</p>
            {formData.relay_point_name && <p><strong>Point Relais :</strong> {formData.relay_point_name}</p>}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
          <Stepper currentStep={currentStep} />

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
              {currentStep === 5 ? (
                <button type="submit" onClick={handleSubmit} disabled={isLoading} className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:from-orange-600 hover:to-amber-600 focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                  {isLoading ? 'Création...' : 'Créer mon Compte PRO'}
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
          Vous êtes déjà un propriétaire de Point Relais ?{' '}
          <button onClick={() => router.push('/login')} className="text-orange-600 hover:text-orange-700 font-medium hover:underline">
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}
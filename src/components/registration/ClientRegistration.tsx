// ClientRegistration.tsx
'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone } from 'lucide-react';
import Link from 'next/link';
import { InputField, Stepper } from './SharedUI';
import { authService } from '@/services/authService';
import { UserRegistrationRequest } from '@/types/api';

interface ClientRegistrationProps {
  onBack: () => void;
  prefillData?: {
    manager_name?: string;
    email?: string;
    phone_number?: string;
  };
}

export default function ClientRegistration({ onBack, prefillData }: ClientRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(prefillData ? 2 : 1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    manager_name: prefillData?.manager_name || '',
    email: prefillData?.email || '',
    phone_number: prefillData?.phone_number || '',
    password: '',
    confirmPassword: ''
  });

  const steps = prefillData 
    ? [{ num: 1, title: 'Finalisation' }]
    : [
        { num: 1, title: 'Identification' },
        { num: 2, title: 'Finalisation' }
      ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      const clientData: UserRegistrationRequest = {
        name: formData.manager_name,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phone_number,
        accountType: 'CLIENT'
      };

      await authService.registerClient(clientData);
      setSuccess("Inscription réussie ! Redirection...");
      
      localStorage.removeItem('registration_prefill');
      
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

      {currentStep === 1 && !prefillData && (
        <motion.form 
          initial={{ opacity: 0, x: 50 }} 
          animate={{ opacity: 1, x: 0 }} 
          onSubmit={(e) => { e.preventDefault(); setCurrentStep(2); }} 
          className="space-y-4"
        >
          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
            Informations d'identification
          </h3>
          <InputField 
            id="manager_name" 
            label="Nom et Prénoms" 
            value={formData.manager_name} 
            onChange={handleChange} 
            placeholder="Ex: Mballa Joseph" 
            icon={User} 
          />
          <InputField 
            id="email" 
            label="Adresse Email" 
            type="email" 
            value={formData.email} 
            onChange={handleChange} 
            placeholder="contact@exemple.com" 
            icon={Mail} 
          />
          <InputField 
            id="phone_number" 
            label="Numéro de téléphone" 
            type="tel" 
            value={formData.phone_number} 
            onChange={handleChange} 
            placeholder="Ex: 6XX XXX XXX" 
            icon={Phone} 
          />
          <InputField 
            id="password" 
            label="Mot de passe" 
            type="password" 
            value={formData.password} 
            onChange={handleChange} 
            placeholder="••••••••" 
            icon={Lock} 
          />
          <InputField 
            id="confirmPassword" 
            label="Confirmer le mot de passe" 
            type="password" 
            value={formData.confirmPassword} 
            onChange={handleChange} 
            placeholder="••••••••" 
            icon={Lock} 
          />

          <div className="flex justify-between items-center pt-6 border-t border-gray-100 dark:border-gray-700 mt-6">
            <button 
              type="button" 
              onClick={onBack} 
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Retour
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all transform hover:scale-105"
            >
              Suivant
            </button>
          </div>
        </motion.form>
      )}

      {(currentStep === 2 || prefillData) && (
        <motion.form 
          initial={{ opacity: 0, x: 50 }} 
          animate={{ opacity: 1, x: 0 }} 
          onSubmit={handleSubmit} 
          className="space-y-4"
        >
          <h3 className="text-xl font-bold text-center mb-4 text-gray-800 dark:text-gray-200">
            Vérification et Soumission
          </h3>

          {prefillData && (
            <div className="space-y-4 mb-4">
              <InputField 
                id="password" 
                label="Mot de passe" 
                type="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="••••••••" 
                icon={Lock} 
              />
              <InputField 
                id="confirmPassword" 
                label="Confirmer le mot de passe" 
                type="password" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                placeholder="••••••••" 
                icon={Lock} 
              />
            </div>
          )}
          
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 p-4 rounded-lg space-y-2 text-sm">
            <p className="text-gray-800 dark:text-gray-200">
              <strong>Type de compte :</strong> Client
            </p>
            <p className="text-gray-800 dark:text-gray-200">
              <strong>Nom :</strong> {formData.manager_name}
            </p>
            <p className="text-gray-800 dark:text-gray-200">
              <strong>Email :</strong> {formData.email}
            </p>
            <p className="text-gray-800 dark:text-gray-200">
              <strong>Téléphone :</strong> {formData.phone_number}
            </p>
          </div>

          <div className="flex items-start space-x-2">
            <input 
              type="checkbox" 
              id="terms" 
              required 
              className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" 
            />
            <label htmlFor="terms" className="text-xs text-gray-700 dark:text-gray-300">
              J'ai lu et j'accepte les{' '}
              <Link href="/policy/terms-of-use" target="_blank" className="font-medium text-orange-600 hover:underline">
                conditions d'utilisation
              </Link>.
            </label>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-100 dark:border-gray-700 mt-6">
            {!prefillData && (
              <button 
                type="button" 
                onClick={() => setCurrentStep(1)} 
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Précédent
              </button>
            )}
            <button 
              type="submit" 
              disabled={isLoading} 
              className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg hover:from-orange-600 hover:to-amber-600 focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {isLoading ? 'Création...' : 'Créer mon Compte'}
            </button>
          </div>
        </motion.form>
      )}
    </div>
  );
}
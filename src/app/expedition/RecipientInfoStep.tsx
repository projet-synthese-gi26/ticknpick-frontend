'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, MapPin, Home, ArrowRight, ArrowLeft, Users, Calendar, Package, Sparkles, Circle, Target } from 'lucide-react';

interface RecipientData {
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  recipientAddress: string;
  recipientLieuDit: string;
  recipientGenre: 'homme' | 'femme' | '';
  recipientAge: string;
}

interface RecipientInfoStepProps {
  initialData: RecipientData;
  onContinue: (data: RecipientData) => void;
  onBack: () => void;
}

const FloatingIcon = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 0.4, y: 0 }}
    transition={{ duration: 0.6, delay, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
    className="absolute text-orange-200"
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
    <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
      {props.label}
    </label>
    <div className="relative">
      <motion.div
        className="absolute left-3 top-1/2 -translate-y-1/2"
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className="w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
      </motion.div>
      <input
        id={id}
        {...props}
        className={`w-full pl-10 pr-3 py-2.5 text-sm border-2 rounded-lg transition-all duration-200 bg-white/80 backdrop-blur-sm
          ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}
          focus:ring-2 focus:ring-orange-500/20 focus:bg-white shadow-sm hover:shadow-md`}
      />
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <Circle className="w-2 h-2 fill-red-500 text-red-500" />
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
    <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
      {props.label}
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
        className={`w-full pl-10 pr-8 py-2.5 text-sm border-2 rounded-lg appearance-none transition-all duration-200 bg-white/80 backdrop-blur-sm
          ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-orange-500'}
          focus:ring-2 focus:ring-orange-500/20 focus:bg-white shadow-sm hover:shadow-md cursor-pointer`}
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

export default function RecipientInfoStep({ initialData, onContinue, onBack }: RecipientInfoStepProps) {
  const [formData, setFormData] = useState<RecipientData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!formData.recipientAddress.trim()) {
      newErrors.recipientAddress = "Adresse requise";
    }
    if (!formData.recipientLieuDit.trim()) {
      newErrors.recipientLieuDit = "Lieu-dit requis";
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      <FloatingIcon delay={0}>
        <Target className="w-16 h-16 absolute top-20 right-20" />
      </FloatingIcon>
      <FloatingIcon delay={0.5}>
        <Package className="w-12 h-12 absolute top-40 left-10" />
      </FloatingIcon>
      <FloatingIcon delay={1}>
        <Circle className="w-8 h-8 absolute bottom-40 right-40" />
      </FloatingIcon>
      <FloatingIcon delay={1.5}>
        <Sparkles className="w-10 h-10 absolute bottom-20 left-20" />
      </FloatingIcon>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <motion.div
          className="w-full max-w-2xl"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            className="bg-white backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-10"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-3"
              >
                <Target className="w-8 h-8 text-orange-600" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="text-2xl font-bold text-gray-800 mb-1"
              >
                Informations destinataire
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-sm text-gray-500"
              >
                À qui souhaitez-vous envoyer ce colis ?
              </motion.p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  icon={Users}
                  id="recipientGenre"
                  name="recipientGenre"
                  value={formData.recipientGenre}
                  onChange={handleChange}
                  label="Genre (optionnel)"
                >
                  <option value="">Non spécifié</option>
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                </SelectField>
                <InputField
                  icon={Calendar}
                  id="recipientAge"
                  name="recipientAge"
                  type="number"
                  value={formData.recipientAge}
                  onChange={handleChange}
                  label="Âge (optionnel)"
                  placeholder="28"
                />
              </div>

              <AnimatePresence>
                {Object.values(errors).some(error => error) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-3"
                  >
                    <div className="text-xs text-red-600 font-medium">
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
                  className="inline-flex items-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`inline-flex items-center justify-center px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl
                    ${isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800'} 
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
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
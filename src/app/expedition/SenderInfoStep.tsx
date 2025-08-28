'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MapPin, Home, ArrowRight, Send, Sparkles, Circle, UserPlus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SenderData {
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderLieuDit: string;
}

interface SenderInfoStepProps {
  initialData: SenderData;
  onContinue: (data: SenderData) => void;
  currentUser?: any;
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

const BreakingNewsNotification = ({ 
  isVisible, 
  onClose, 
  onRegister, 
  onContinueWithout 
}: {
  isVisible: boolean;
  onClose: () => void;
  onRegister: () => void;
  onContinueWithout: () => void;
}) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 shadow-2xl"
      >
        <div className="relative overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <motion.div
              animate={{ x: ['0%', '100%'] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent"
            />
          </div>
          
          <div className="relative px-4 py-3">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center space-x-4 flex-1">
                {/* Breaking News Label */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="flex items-center bg-white/20 rounded-full px-3 py-1 backdrop-blur-sm"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-4 h-4 text-white mr-2" />
                  </motion.div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Notification
                  </span>
                </motion.div>

                {/* Scrolling Message */}
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex-1 overflow-hidden"
                >
                  <motion.p
                    animate={{ x: [0, -20, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="text-white font-medium text-sm md:text-base whitespace-nowrap"
                  >
                    🎉 Créez votre compte gratuitement pour un suivi optimal de vos envois et une expérience personnalisée !
                  </motion.p>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 ml-4">
                <motion.button
                  onClick={onRegister}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center bg-white text-orange-600 px-4 py-2 rounded-full font-semibold text-sm hover:bg-orange-50 transition-colors shadow-lg"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  S'inscrire
                </motion.button>
                
                <motion.button
                  onClick={onContinueWithout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-white text-sm hover:text-orange-200 transition-colors underline"
                >
                  Continuer sans compte
                </motion.button>

                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-white/80 hover:text-white transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 8, ease: "linear" }}
            className="h-1 bg-white/30"
          />
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function SenderInfoStep({ initialData, onContinue, currentUser }: SenderInfoStepProps) {
  const [formData, setFormData] = useState<SenderData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (formData.senderName.trim().length < 2) {
      newErrors.senderName = "Nom requis";
    }
    if (!/^(6|2)(?:[235-9]\d{7})$/.test(formData.senderPhone.replace(/\s/g, ''))) {
      newErrors.senderPhone = "Format invalide";
    }
    if (!formData.senderAddress.trim()) {
      newErrors.senderAddress = "Adresse requise";
    }
    if (!formData.senderLieuDit.trim()) {
      newErrors.senderLieuDit = "Lieu-dit requis";
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
    
    if (!currentUser) {
      setShowNotification(true);
      setIsSubmitting(false);
      // Auto-hide notification after 10 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 10000);
    } else {
      onContinue(formData);
      setIsSubmitting(false);
    }
  };

  const handleRegister = () => {
    localStorage.setItem('temp_sender_info_for_registration', JSON.stringify(formData));
    router.push('/register');
  };

  const handleContinueWithout = () => {
    setShowNotification(false);
    onContinue(formData);
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  return (
    <>
      <BreakingNewsNotification
        isVisible={showNotification}
        onClose={handleCloseNotification}
        onRegister={handleRegister}
        onContinueWithout={handleContinueWithout}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 relative overflow-hidden">
        <FloatingIcon delay={0}>
          <Send className="w-16 h-16 absolute top-20 right-20" />
        </FloatingIcon>
        <FloatingIcon delay={0.5}>
          <Sparkles className="w-12 h-12 absolute top-40 left-10" />
        </FloatingIcon>
        <FloatingIcon delay={1}>
          <Circle className="w-8 h-8 absolute bottom-40 right-40" />
        </FloatingIcon>
        <FloatingIcon delay={1.5}>
          <Sparkles className="w-10 h-10 absolute bottom-20 left-20" />
        </FloatingIcon>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <motion.div
            className="w-full max-w-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <motion.div
              className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-6"
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
                  <Send className="w-8 h-8 text-orange-600" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="text-2xl font-bold text-gray-800 mb-1"
                >
                  Informations expéditeur
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="text-sm text-gray-500"
                >
                  Renseignez vos coordonnées pour l'envoi
                </motion.p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    icon={User}
                    id="senderName"
                    name="senderName"
                    value={formData.senderName}
                    onChange={handleChange}
                    label="Nom et Prénoms"
                    placeholder="Joseph Mballa"
                    error={errors.senderName}
                  />
                  <InputField
                    icon={Phone}
                    id="senderPhone"
                    name="senderPhone"
                    value={formData.senderPhone}
                    onChange={handleChange}
                    label="Téléphone"
                    placeholder="699123456"
                    error={errors.senderPhone}
                  />
                </div>
                <InputField
                  icon={MapPin}
                  id="senderAddress"
                  name="senderAddress"
                  value={formData.senderAddress}
                  onChange={handleChange}
                  label="Adresse Complète"
                  placeholder="Mvan, Yaoundé"
                  error={errors.senderAddress}
                />
                <InputField
                  icon={Home}
                  id="senderLieuDit"
                  name="senderLieuDit"
                  value={formData.senderLieuDit}
                  onChange={handleChange}
                  label="Lieu-dit"
                  placeholder="Face Boulangerie Mvan, portail rouge"
                  error={errors.senderLieuDit}
                />

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

                <div className="pt-4 flex justify-end">
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
    </>
  );
}
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, ArrowRight } from 'lucide-react';

interface SenderData {
  senderName: string;
  senderPhone: string;
}

interface SenderInfoStepProps {
  initialData: SenderData;
  onContinue: (data: SenderData) => void;
}

export default function SenderInfoStep({ initialData, onContinue }: SenderInfoStepProps) {
  const [formData, setFormData] = useState<SenderData>(initialData);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.senderName.trim().length < 2) {
      setError("Veuillez saisir un nom valide.");
      return;
    }
    // Simple validation pour le numéro de téléphone
    if (!/^(6|2)(?:[235-9]\d{7})$/.test(formData.senderPhone.replace(/\s/g, ''))) {
        setError("Format du numéro de téléphone invalide. Ex: 699... ou 233...");
        return;
    }
    setError(null);
    onContinue(formData);
  };

  return (
    <motion.div 
      className="max-w-2xl mx-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Qui envoie le colis ?</h2>
        <p className="text-gray-500">Veuillez renseigner vos informations.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="senderName" className="block text-sm font-semibold text-gray-700 mb-2">Nom complet</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              id="senderName"
              name="senderName"
              value={formData.senderName}
              onChange={handleChange}
              placeholder="Ex: Jean Dupont"
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
              required
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="senderPhone" className="block text-sm font-semibold text-gray-700 mb-2">Numéro de téléphone</label>
           <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              id="senderPhone"
              name="senderPhone"
              value={formData.senderPhone}
              onChange={handleChange}
              placeholder="Ex: 699123456"
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
              required
            />
          </div>
        </div>
        
        {error && (
            <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
                {error}
            </div>
        )}

        <div className="pt-4">
          <button type="submit" className="w-full flex items-center justify-center bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
            Continuer vers les détails du colis
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
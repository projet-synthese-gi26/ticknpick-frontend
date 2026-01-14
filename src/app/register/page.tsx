'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Briefcase, Building, Truck, Users } from 'lucide-react';

// Imports des modules factorisés
import ClientRegistration from '@/components/registration/ClientRegistration';
import DelivererRegistration from '@/components/registration/DelivererRegistration';
import FreelanceRegistration from '@/components/registration/FreelanceRegistration';
import AgencyRegistration from '@/components/registration/AgencyRegistration'; // Tu créeras ce fichier sur le modèle Freelance
// page.tsx
type AccountType = 'CLIENT' | 'FREELANCE' | 'AGENCY' | 'LIVREUR' | null;

export default function RegisterProPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [highlightedRole, setHighlightedRole] = useState<string | null>(null);
  const [prefillData, setPrefillData] = useState<any>(null);

  useEffect(() => {
    // Gestion du pré-remplissage depuis localStorage
    const prefillDataJSON = localStorage.getItem('registration_prefill');
    if (prefillDataJSON) {
      try {
        const data = JSON.parse(prefillDataJSON);
        setPrefillData({
          manager_name: data.name || '',
          email: data.email || '',
          phone_number: data.phone || ''
        });
        // Pour les clients pré-remplis, aller directement à l'inscription
        setAccountType('CLIENT');
      } catch (error) {
        console.error("Erreur de parsing des données de pré-remplissage:", error);
        localStorage.removeItem('registration_prefill');
      }
    }

    // Gestion de la mise en évidence d'un rôle spécifique
    const preselect = localStorage.getItem('preselect_role_login');
    if (preselect) {
      setHighlightedRole(preselect);
      setTimeout(() => {
        setHighlightedRole(null);
        localStorage.removeItem('preselect_role_login');
      }, 3000);
    }
  }, []);

  const handleAccountTypeSelection = (type: AccountType) => {
    setAccountType(type);
  };

  const handleBackToSelection = () => {
    setAccountType(null);
    setPrefillData(null);
  };

  // Affichage du portail de sélection
  if (!accountType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700 p-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="space-y-4"
            >
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">
                Quel type de compte souhaitez-vous créer ?
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { 
                    type: 'CLIENT', 
                    icon: <Users className="w-8 h-8" />, 
                    title: "Client", 
                    desc: "Je souhaite envoyer des colis" 
                  },
                  { 
                    type: 'FREELANCE', 
                    icon: <User className="w-8 h-8" />, 
                    title: "Freelance", 
                    desc: "Individu ou petit commerçant" 
                  },
                  { 
                    type: 'AGENCY', 
                    icon: <Building className="w-8 h-8" />, 
                    title: "Agence", 
                    desc: "Entreprise ou structure" 
                  },
                  { 
                    type: 'LIVREUR', 
                    icon: <Truck className="w-8 h-8" />, 
                    title: "Livreur", 
                    desc: "Je souhaite livrer des colis" 
                  }
                ].map((item) => {
                  const isHighlighted = highlightedRole === item.type;

                  return (
                    <button 
                      key={item.type} 
                      onClick={() => handleAccountTypeSelection(item.type as AccountType)} 
                      className={`p-6 border-2 rounded-xl text-center space-y-3 transition-all duration-300
                        ${isHighlighted 
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 ring-4 ring-orange-500/30 animate-pulse shadow-2xl transform scale-105' 
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:shadow-md hover:-translate-y-1'
                        }`}
                    >
                      <div className="text-orange-500 dark:text-orange-400 inline-block">
                        {item.icon}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
          
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            Vous avez déjà un compte ?{' '}
            <button 
              onClick={() => router.push('/login')} 
              className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Affichage du composant d'inscription correspondant
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700 p-6">
          {accountType === 'CLIENT' && (
            <ClientRegistration 
              onBack={handleBackToSelection} 
              prefillData={prefillData}
            />
          )}
          
          {accountType === 'FREELANCE' && (
            <FreelanceRegistration onBack={handleBackToSelection} />
          )}
          
          {accountType === 'AGENCY' && (
            <AgencyRegistration onBack={handleBackToSelection} />
          )}
          
          {accountType === 'LIVREUR' && (
            <DelivererRegistration onBack={handleBackToSelection} />
          )}
        </div>
        
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          Vous avez déjà un compte ?{' '}
          <button 
            onClick={() => router.push('/login')} 
            className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}
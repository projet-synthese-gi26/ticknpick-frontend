'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Vérifier si le consentement a déjà été donné
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Afficher la bannière après un court délai pour ne pas être trop agressif
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
  };
  
  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }}
          className="fixed bottom-0 left-0 right-0 z-50 p-3 md:p-4"
        >
          <div className="max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-700/60">
            {/* Header avec icône et bouton fermer */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-50 dark:bg-orange-950/50 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-orange-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Paramètres de confidentialité
                </h3>
              </div>
              <button
                onClick={handleDecline}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Contenu principal */}
            <div className="px-5 py-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Nous utilisons des cookies essentiels pour le fonctionnement de notre plateforme logistique 
                et améliorer votre expérience utilisateur. Consultez notre{' '}
                <Link 
                  href="/cookies-policy" 
                  className="text-orange-500 hover:text-orange-600 font-medium underline decoration-1 underline-offset-2"
                >
                  politique de cookies
                </Link>{' '}
                pour plus de détails.
              </p>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDecline}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-150 dark:hover:bg-slate-700 transition-all duration-200"
                >
                  Refuser
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-all duration-200 shadow-sm"
                >
                  Accepter tous les cookies
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
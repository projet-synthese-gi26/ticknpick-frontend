'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Sparkles, HelpCircle, ChevronDown } from 'lucide-react';
import Navbar from '../../components/NavbarHome'; // Assurez-vous que le chemin est correct
import Footer from '../../components/FooterHome';   // Assurez-vous que le chemin est correct

// Interface pour la structure des données d'un plan tarifaire
interface Plan {
  name: string;
  price: string;
  currency: string;
  frequency: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  isPopular: boolean;
  highlightClass: string;
}

// Données des plans, basées sur votre tableau blanc.
// Cette structure est facile à modifier et à maintenir.
const plansData: Plan[] = [
  {
    name: 'Free',
    price: '0',
    currency: 'F',
    frequency: 'À vie',
    description: "Parfait pour commencer à envoyer et recevoir des colis occasionnellement.",
    features: [
      '5 envois de colis par mois',
      'Suivi de base des colis',
      'Accès aux points relais publics',
      'Notifications SMS de base',
      'Support par e-mail (72h)',
      'Application mobile de base',
      'Historique des envois (30 jours)',
      'Assurance de base incluse'
    ],
    ctaText: 'Commencer gratuitement',
    ctaLink: '/register?plan=free',
    isPopular: false,
    highlightClass: 'ring-slate-200'
  },
  {
    name: 'Standard',
    price: '8000',
    currency: 'F',
    frequency: '/ mois',
    description: "Pour les livreurs indépendants et gérants de points relais.",
    features: [
      '50 livraisons par mois',
      'Tableau de bord livreur',
      'Gestion des stocks de colis',
      'Notifications temps réel',
      'Commission réduite (5%)',
      'Formation livreur incluse',
      'Support prioritaire',
      'Outils de gestion client'
    ],
    ctaText: 'Devenir livreur Standard',
    ctaLink: '/subscribe?plan=standard',
    isPopular: false,
    highlightClass: 'ring-slate-200'
  },
  {
    name: 'Pro',
    price: '15000',
    currency: 'F',
    frequency: '/ mois',
    description: "Pour les livreurs professionnels et gérants de points relais établis.",
    features: [
      'Livraisons illimitées',
      'Tableau de bord avancé',
      'Gestion multi-points relais',
      'API d\'intégration',
      'Commission préférentielle (3%)',
      'Assurance pro incluse',
      'Formation continue',
      'Badge partenaire de confiance',
      'Support téléphonique 24/7'
    ],
    ctaText: 'Passer Pro',
    ctaLink: '/subscribe?plan=pro',
    isPopular: true,
    highlightClass: 'ring-orange-500'
  },
  {
    name: 'Enterprise',
    price: 'Devis',
    currency: '',
    frequency: 'Sur mesure',
    description: "Solution complète pour les agences de livraison et grandes entreprises.",
    features: [
      'Réseau de points relais dédié',
      'Interface de gestion centralisée',
      'Intégration ERP personnalisée',
      'Tarifs négociés sur volume',
      'SLA garanti et prioritaire',
      'Formation équipe complète',
      'Gestionnaire de compte dédié',
      'Assurance tous risques',
      'Reporting avancé personnalisé'
    ],
    ctaText: 'Nous contacter',
    ctaLink: '/contact?reason=enterprise',
    isPopular: false,
    highlightClass: 'ring-slate-200'
  }
];

// Sous-composant pour la carte d'un plan
const PlanCard = ({ plan, index }: { plan: Plan; index: number }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
      }}
      className={`relative flex flex-col h-full bg-white rounded-2xl shadow-lg ring-2 ${plan.highlightClass} p-8`}
    >
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md">
          <Sparkles className="w-4 h-4" />
          POPULAIRE
        </div>
      )}

      <div className="flex-grow">
        <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
        <p className="text-slate-500 mt-2 text-sm">{plan.description}</p>

        <div className="mt-6">
          <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
          {plan.currency && <span className="text-xl font-semibold text-slate-700 ml-1">{plan.currency}</span>}
          <span className="text-sm text-slate-500 ml-1">{plan.frequency}</span>
        </div>

        <ul className="mt-8 space-y-4 text-sm">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start">
              <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5 mr-3" />
              <span className="text-slate-600">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <motion.a
        href={plan.ctaLink}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`mt-10 block w-full text-center px-6 py-3 rounded-lg font-semibold transition-all duration-300
          ${plan.isPopular 
            ? 'bg-orange-500 text-white shadow-lg hover:bg-orange-600' 
            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}
        `}
      >
        {plan.ctaText}
      </motion.a>
    </motion.div>
  );
};


export default function PricingPage() {

  return (
    <div className="min-h-screen bg-orange-50 font-sans text-slate-800">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section d'en-tête */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Un plan pour chaque ambition
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
              Choisissez l'offre qui correspond à la taille de votre activité et à vos objectifs de croissance.
            </p>
          </motion.div>

          {/* Grille des plans tarifaires */}
          <motion.div
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {plansData.map((plan, index) => (
              <PlanCard key={plan.name} plan={plan} index={index} />
            ))}
          </motion.div>
          
        </div>
      </main>

      <Footer />
    </div>
  );
}
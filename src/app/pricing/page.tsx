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
    description: "Idéal pour tester le service et pour les tout débutants.",
    features: [
      '10 produits dans le catalogue',
      '7 publications par jour',
      'Durée de publication de 24h',
      'Catalogue disponible 3 jours / semaine',
      'Chat & Chatbot inclus',
      'Tableau de bord de base',
      '3 tickets support par e-mail',
      'Mise en avant des produits limitée'
    ],
    ctaText: 'Commencer gratuitement',
    ctaLink: '/register?plan=free',
    isPopular: false,
    highlightClass: 'ring-slate-200'
  },
  {
    name: 'Standard',
    price: '5000',
    currency: 'F',
    frequency: '/ mois',
    description: "Pour les vendeurs ayant besoin de plus de visibilité.",
    features: [
      '50 produits dans le catalogue',
      '20 publications par jour',
      'Durée de publication de 48h',
      'Catalogue disponible 7j/7',
      'Statistiques de ventes de base',
      'Accès complet à la mise en avant',
      '10 tickets support par e-mail'
    ],
    ctaText: 'Choisir Standard',
    ctaLink: '/subscribe?plan=standard',
    isPopular: false,
    highlightClass: 'ring-slate-200'
  },
  {
    name: 'Pro',
    price: '10000',
    currency: 'F',
    frequency: '/ mois',
    description: "Pour les entreprises établies avec des outils professionnels.",
    features: [
      '200 produits dans le catalogue',
      '50 publications par jour',
      'Durée de publication de 72h',
      'Statistiques de ventes avancées',
      'API de Paiement intégrée',
      'Support à la livraison',
      'Badge Premium de confiance',
      'Support d\'assurance sur demande',
      '50 tickets support par e-mail'
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
    description: "Une solution entièrement personnalisée pour les grandes entreprises.",
    features: [
      'Catalogue et publications illimités',
      'Durée de publication personnalisée',
      'Frais de transaction négociés',
      'Tableau de bord et stats avancées',
      'Badge Premium amélioré',
      'Support d\'assurance et formation inclus',
      'Gestionnaire de compte dédié'
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
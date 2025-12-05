'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Store,
  Truck,
  Building2,
  PackageCheck,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

// --- COMPOSANTS VISUELS ---

// 1. Fond animé minimaliste
const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-white dark:bg-[#202124]">
    <motion.div 
      animate={{ 
        rotate: [0, 90, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-br from-orange-400/5 to-amber-400/5 rounded-full blur-3xl"
    />
    <motion.div 
      animate={{ 
        rotate: [0, -90, 0],
        scale: [1, 1.15, 1],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-tr from-orange-500/5 to-red-400/5 rounded-full blur-3xl"
    />
  </div>
);

// 2. Carte Service
interface ServiceCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  href: string;
  imageUrl: string;
}

const ServiceCard = ({ title, subtitle, description, icon: Icon, features, href, imageUrl }: ServiceCardProps) => {
  return (
    <Link 
      href={href} 
      className="group relative block overflow-hidden rounded-3xl h-full bg-white dark:bg-[#292a2d] border border-gray-200/60 dark:border-gray-700/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1"
    >
      {/* Image de fond */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
          style={{ 
            backgroundImage: `url(${imageUrl})`,
            filter: 'brightness(1.1) contrast(1.05)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white/90 dark:via-[#292a2d]/20 dark:to-[#292a2d]/90" />
        
        {/* Icône */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="rounded-2xl p-3 backdrop-blur-md bg-white/90 dark:bg-[#292a2d]/90 shadow-lg border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 group-hover:bg-orange-500 group-hover:border-orange-500">
            <Icon className="h-6 w-6 text-orange-600 dark:text-orange-400 group-hover:text-white transition-colors" strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-5 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-500 mb-1.5">
            {subtitle}
          </p>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2 leading-tight">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>
        
        {/* Features */}
        <div className="space-y-1.5 pt-2">
          {features.slice(0, 3).map((feat, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" /> 
              <span>{feat}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-sm font-medium text-orange-600 dark:text-orange-500 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          Découvrir <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
};

// --- PAGE PRINCIPALE ---

export default function PortalPage() {
    return (
      <div className="min-h-screen text-gray-900 dark:text-gray-100">
        <AnimatedBackground />

        <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             className="mb-12 text-center"
           >
              <h1 className="mb-4 text-5xl font-normal tracking-tight text-gray-900 dark:text-gray-50">
                 Bienvenue sur{' '}
                 <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500">
                   PicknDrop
                 </span>
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                 Votre plateforme logistique unifiée au Cameroun. Choisissez votre espace :
              </p>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8"
           >
               {/* --- ICI SONT LES CHANGEMENTS : URL DYNAMIQUES --- */}
               
               <ServiceCard
                  title="PicknDrop Link"
                  subtitle="Particuliers"
                  description="Envoyez vos colis simplement. Déposez en relais, suivez en temps réel."
                  icon={PackageCheck}
                  imageUrl="/images/land.jpeg"
                  features={["Envoi express", "Suivi GPS live", "Réseau national", "Paiement sécurisé"]}
                  href="/landing?role=CLIENT" // Lien vers la landing dynamique
               />

                <ServiceCard
                  title="PicknDrop Delivery"
                  subtitle="Livreurs"
                  description="Contrôlez vos revenus. Livrez selon votre emploi du temps."
                  icon={Truck}
                  imageUrl="/images/livrer.jpeg"
                  features={["Flexibilité totale", "Paiement hebdo", "Optimisation trajets", "Support 24/7"]}
                  href="/landing?role=LIVREUR" // Lien vers la landing dynamique
               />

               <ServiceCard
                  title="PicknDrop Point"
                  subtitle="Partenaires Relais"
                  description="Monétisez votre espace en devenant point de relais stratégique."
                  icon={Store}
                  imageUrl="/images/image2.jpg"
                  features={["Revenus passifs", "App mobile pro", "Gestion simple", "Support inclus"]}
                  href="/landing?role=FREELANCE" // Lien vers la landing dynamique
               />

               <ServiceCard
                  title="PicknDrop Market"
                  subtitle="Marketplace"
                  description="Trouvez le transporteur idéal ou proposez vos services sur le marché."
                  icon={ShoppingBag}
                  imageUrl="/images/expedition.avif"
                  features={["Profils vérifiés", "Avis clients", "Devis instantanés", "Transactions sécurisées"]}
                  href="/landing?role=MARKET" // Lien vers la landing dynamique
               />

                <ServiceCard
                  title="PicknDrop Agency"
                  subtitle="Agences Transport"
                  description="Solutions complètes pour entreprises de transport établies."
                  icon={Building2}
                  imageUrl="/images/image4.jpg"
                  features={["Dashboard complet", "Gestion flotte", "Analytics avancés", "API dédiée"]}
                  href="/landing?role=AGENCY" // Lien vers la landing dynamique
               />
           </motion.div>

           <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center pt-8"
           >
              <p className="text-xs text-gray-500 dark:text-gray-500">
                © 2024 PicknDrop. Révolutionner la logistique au Cameroun.
              </p>
           </motion.div>
        </main>
      </div>
    );
}
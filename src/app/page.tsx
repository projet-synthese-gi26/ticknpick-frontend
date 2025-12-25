'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Package, MapPin, Truck, Search, 
  Layers, ArrowRight, UserPlus, Globe, Building 
} from 'lucide-react';
import FooterHome from '@/components/FooterHome';
import { Snowfall } from '@/components/ChristmasTheme';


// === CONFIGURATION DES DONNÉES ===

const SANTA_BG_IMAGE = "/images/image7.png";

const COLOR_THEMES = {
  orange: { badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300", button: "bg-orange-600 hover:bg-orange-700 text-white", border: "border-orange-500" },
  green: { badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", button: "bg-emerald-600 hover:bg-emerald-700 text-white", border: "border-emerald-500" },
  blue: { badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", button: "bg-blue-600 hover:bg-blue-700 text-white", border: "border-blue-500" },
  purple: { badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300", button: "bg-purple-600 hover:bg-purple-700 text-white", border: "border-purple-500" },
  red: { badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", button: "bg-red-600 hover:bg-red-700 text-white", border: "border-red-500" },
};

const FEATURES_DATA = [
  {
    id: "link",
    role: "CLIENT",
    title: "PicknDrop Link",
    subtitle: "Particuliers & E-Commerce",
    description: "Pré-enregistrez vos colis, trouvez un point de dépôt et suivez l'acheminement en temps réel. La solution idéale pour envoyer des colis sans adresse formelle.",
    image: "/images/land.jpeg",
    icon: MapPin,
    theme: "orange",
    details: ["Pré-enregistrement Rapide", "QR Code de suivi unique", "Notifications SMS", "Historique complet"]
  },
  {
    id: "market",
    role: "MARKET",
    title: "PicknDrop Market",
    subtitle: "La Marketplace Logistique",
    description: "Trouvez un livreur indépendant, une agence ou publiez votre annonce d'expédition. Comparez les prix et les disponibilités instantanément.",
    image: "/images/expedition.avif",
    icon: Globe,
    theme: "green",
    details: ["Mise en relation directe", "Comparaison de prix", "Notation des prestataires", "Paiement sécurisé"]
  },
  {
    id: "agency",
    role: "AGENCY",
    title: "PicknDrop Agency",
    subtitle: "Gestion Pro",
    description: "Un ERP léger et puissant pour les agences de transport. Gérez votre flotte, vos bordereaux et vos opérations multi-sites.",
    image: "/images/image4.jpg",
    icon: Layers,
    theme: "blue",
    details: ["Gestion de flotte", "Multi-agences", "Bordereaux électroniques", "Comptabilité intégrée"]
  },
  {
    id: "point",
    role: "FREELANCE",
    title: "PicknDrop Point",
    subtitle: "Réseau de Partenaires",
    description: "Transformez votre commerce en hub logistique. Gérez les entrées et sorties de colis et gagnez des commissions.",
    image: "/images/image2.jpg",
    icon: Building,
    theme: "red",
    details: ["Scan rapide", "Gestion des stocks", "Commissions automatiques", "Visibilité accrue"]
  },
  {
    id: "freelancer",
    role: "LIVREUR",
    title: "PicknDrop Freelancer",
    subtitle: "Pour les Livreurs Indépendants",
    description: "Gérez vos courses, optimisez vos trajets et structurez vos revenus. Idéal pour les 'Benskinneurs' et coursiers.",
    image: "/images/livrer.jpeg",
    icon: Truck,
    theme: "purple",
    details: ["Disponibilité en temps réel", "Optimisation trajets", "Historique des courses", "Profil certifié"]
  }
];

// === SOUS COMPOSANT : FEATURE SECTION ===

const FeatureSection = ({ item, index }) => {
  const isEven = index % 2 === 0;
  const theme = COLOR_THEMES[item.theme];
  const Icon = item.icon;

  return (
    <section className="py-12 md:py-20 lg:py-24 overflow-hidden border-b border-gray-100 dark:border-slate-800 last:border-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16`}>
          
          {/* VISUEL */}
          <motion.div 
            initial={{ opacity: 0, x: isEven ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex-1 w-full"
          >
            <div className="relative group rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl bg-gray-900 aspect-[4/3] border-2 lg:border-4 border-white dark:border-slate-700">
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
              
              {/* Badge Flottant */}
              <div className="absolute bottom-4 left-4 right-4 p-3 lg:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-xl lg:rounded-2xl shadow-lg border border-white/20">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className={`p-1.5 lg:p-2 rounded-lg ${theme.badge}`}>
                    <Icon className="w-4 h-4 lg:w-5 lg:h-5"/>
                  </div>
                  <div>
                    <p className="text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-wide">{item.subtitle}</p>
                    <p className="text-sm lg:text-lg font-bold text-gray-900 dark:text-white leading-tight">{item.title}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* DESCRIPTION */}
          <motion.div 
            initial={{ opacity: 0, x: isEven ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 space-y-4 lg:space-y-6"
          >
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit ${theme.badge}`}>
              <Icon className="w-3 h-3 lg:w-4 lg:h-4"/> Module {index + 1}
            </div>
            
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight">
              {item.title}.
            </h2>
            
            <p className="text-base lg:text-lg text-slate-600 dark:text-gray-300 leading-relaxed">
              {item.description}
            </p>
            
            {/* Liste des points forts */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3 pt-2">
              {item.details.map((detail, i) => (
                <li key={i} className="flex items-center gap-2 text-xs lg:text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <div className={`w-1.5 h-1.5 rounded-full ${theme.button.split(' ')[0]}`}></div>
                  {detail}
                </li>
              ))}
            </ul>

            <div className="pt-4 lg:pt-6">
              <a 
                href={`/landing?role=${item.role}`}
                className={`inline-flex items-center gap-2 px-6 lg:px-8 py-3 lg:py-3.5 rounded-xl font-bold text-sm lg:text-base text-white shadow-lg transition-transform transform active:scale-95 ${theme.button}`}
              >
                Découvrir <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5"/>
              </a>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

// === PAGE PRINCIPALE ===

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0c15] text-slate-900 dark:text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Ambiance de Noël */}
      <Snowfall />

      {/* Hero Section */}
      <section className="relative min-h-[500px] sm:min-h-[600px] lg:min-h-[95vh] flex flex-col justify-start overflow-hidden">
        
        {/* HEADER */}
        <header className="absolute top-0 left-0 w-full z-40 p-4 sm:p-6 md:p-8 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 group">
            <div className="bg-orange-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-white shadow-lg group-hover:rotate-12 transition-transform">
              <Package className="w-5 h-5 sm:w-6 sm:h-6"/>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
              Pick<span className="text-orange-500">n</span>Drop
            </h1>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="/login" className="hidden sm:flex text-xs sm:text-sm font-bold text-white hover:text-orange-300 transition-colors">
              Se connecter
            </a>
            <a 
              href="#modules"
              className="px-3 sm:px-6 py-2 sm:py-2.5 bg-white text-orange-700 font-bold rounded-full text-xs sm:text-sm shadow-xl hover:bg-orange-50 transition-all flex items-center gap-1 sm:gap-2"
            >
              <UserPlus className="w-3 h-3 sm:w-4 sm:h-4"/> Découvrir
            </a>
          </div>
        </header>

        {/* Background Hero - Image complètement visible */}
        <div className="absolute inset-0 z-0">
          {/* Overlay léger pour contraste texte */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent z-10" />
          
          {/* Image Santa - Positionnement optimisé */}
          <div className="absolute inset-0 w-full h-full">
            <img 
              src={SANTA_BG_IMAGE} 
              alt="Noël Logistique Afrique"
              className="w-full h-full object-cover object-center"
              style={{ objectPosition: 'center 30%' }}
            />
          </div>
          
          {/* Dégradé bas vers vague */}
          <div className="absolute bottom-0 w-full h-32 sm:h-48 bg-gradient-to-t from-slate-50 dark:from-[#0b0c15] to-transparent z-10" />
        </div>

        {/* Contenu Hero */}
        <div className="relative z-20 flex-1 flex flex-col justify-center items-center text-center px-4 pt-24 sm:pt-32 pb-32 sm:pb-40">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 backdrop-blur-md px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-4 sm:mb-6 animate-pulse">
              <span>🎁</span> Offre Spéciale Fêtes
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-4 sm:mb-6 drop-shadow-2xl px-4">
              Envoyez. Recevez. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-200 to-orange-400">
                Célébrez sans limite.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-100 font-medium mb-6 sm:mb-10 max-w-2xl mx-auto drop-shadow-lg leading-relaxed px-4">
              Une plateforme logistique unifiée pour l'Afrique. <br className="hidden sm:block"/>
              Du quartier au village, nous connectons tout le monde.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <a href="/expedition" className="px-6 sm:px-8 py-3 sm:py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base lg:text-lg shadow-[0_10px_40px_-10px_rgba(234,88,12,0.6)] hover:shadow-orange-600/60 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 sm:gap-3">
                <Package className="w-4 h-4 sm:w-5 sm:h-5"/> Envoyer maintenant
              </a>
              <a href="/track-package" className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base lg:text-lg backdrop-blur-sm transition-all flex items-center justify-center gap-2 sm:gap-3">
                <Search className="w-4 h-4 sm:w-5 sm:h-5"/> Suivre un colis
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MODULES */}
      <div id="modules" className="bg-slate-50 dark:bg-[#0b0c15] pb-12 sm:pb-16 lg:pb-24">
        
        <div className="container mx-auto text-center pt-6 sm:pt-10 pb-8 sm:pb-12 lg:pb-16 px-4">
          <h2 className="text-xs sm:text-sm font-black text-orange-600 dark:text-orange-500 uppercase tracking-[0.2em] mb-2 sm:mb-3">La Suite PicknDrop</h2>
          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white">Découvrez nos solutions</h3>
        </div>

        {FEATURES_DATA.map((item, index) => (
          <FeatureSection key={item.id} item={item} index={index} />
        ))}

        {/* CTA Final */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="max-w-5xl mx-auto rounded-2xl sm:rounded-3xl lg:rounded-[3rem] p-8 sm:p-12 lg:p-20 relative overflow-hidden bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 shadow-2xl text-center"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <Snowfall />
            
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black text-white mb-4 sm:mb-6">Prêt à connecter l'Afrique ?</h2>
              <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-6 sm:mb-10 max-w-2xl mx-auto">Rejoignez une communauté de milliers d'utilisateurs et transformez la façon dont nous échangons des biens.</p>
              
              <a href="/register" className="inline-flex items-center gap-2 sm:gap-3 bg-white text-orange-700 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 rounded-full font-bold text-base sm:text-lg lg:text-xl shadow-xl hover:bg-orange-50 hover:scale-105 transition-all">
                Commencer maintenant <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6"/>
              </a>
            </div>
          </motion.div>
        </section>

      </div>

      <FooterHome />
    </div>
  );
}
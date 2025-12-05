'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation'; // Nécessaire pour la dynamique
import { motion, AnimatePresence } from 'framer-motion';
import NavbarHome from '@/components/NavbarHome';
import Footer from '@/components/FooterHome';
// Imports de toutes les icônes nécessaires pour les différents scénarios
import { 
    Shield, Truck, MapPin, Search, ClipboardPenLine, Box, Map, Smile, 
    Bike, Coins, Users, Store, BarChart3, UserCheck, BadgeCheck, 
    Smartphone, HandCoins, Briefcase, Layers, Key,
    Star,
    MessageCircle,
    Building
} from 'lucide-react';

// --- DATA : Dictionnaire de Contenu par Rôle ---
// Cette structure permet de changer le texte/icones sans toucher au JSX

type ContentData = {
    title: React.ReactNode;
    description: string;
    heroImage: string;
    ctaPrimary: { text: string; link: string };
    ctaSecondary: { text: string; link: string };
    featuresTitle: string;
    features: Array<{ icon: React.ElementType, title: string, desc: string }>;
    stepsTitle: string;
    steps: Array<{ icon: React.ElementType, title: string, desc: string }>;
    bottomCtaTitle: string;
    bottomCtaDesc: string;
};

// Contenu par défaut (CLIENT / Expéditeur)
const DEFAULT_DATA: ContentData = {
    title: <>L'envoi de colis au Cameroun,<br /><span className="text-amber-300 dark:text-amber-200">simplifié.</span></>,
    description: "Déposez, suivez et recevez vos paquets dans notre réseau national de points relais. Rapide, fiable et abordable.",
    heroImage: "/images/land.jpeg",
    ctaPrimary: { text: "Envoyer un Colis", link: "/expedition" },
    ctaSecondary: { text: "Devenir Point Relais", link: "/register" },
    featuresTitle: "Nos services exceptionnels",
    features: [
        { icon: MapPin, title: "Réseau National", desc: "Des centaines de points relais accessibles partout au Cameroun." },
        { icon: Search, title: "Suivi en Temps Réel", desc: "Sachez toujours où se trouve votre colis, du dépôt à la fin." },
        { icon: Shield, title: "Sécurité Garantie", desc: "Vos colis sont traités avec soin et assurés contre les imprévus." },
        { icon: Truck, title: "Livraison Rapide", desc: "Options express pour vos envois urgents à travers le pays." }
    ],
    stepsTitle: "Comment ça marche ?",
    steps: [
        { icon: ClipboardPenLine, title: "Décrivez votre colis", desc: "Remplissez un formulaire simple en ligne." },
        { icon: Box, title: "Déposez au point", desc: "Choisissez le relais le plus proche et déposez-y le colis." },
        { icon: Map, title: "Suivez son voyage", desc: "Notifications et suivi en direct de l'acheminement." },
        { icon: Smile, title: "Retrait simple", desc: "Le destinataire reçoit un code sécurisé pour le retrait." }
    ],
    bottomCtaTitle: "Prêt à expédier ?",
    bottomCtaDesc: "Pas besoin de compte ! Démarrez votre expédition en quelques clics."
};

const FREELANCE_DATA: ContentData = {
    title: <>Monétisez votre espace,<br /><span className="text-amber-300 dark:text-amber-200">devenez partenaire.</span></>,
    description: "Transformez votre boutique ou votre domicile en Point Relais PicknDrop. Gagnez une commission sur chaque colis déposé ou retiré.",
    heroImage: "/images/image2.jpg",
    ctaPrimary: { text: "Créer mon Point Relais", link: "/register" },
    ctaSecondary: { text: "Connexion Espace Pro", link: "/login" },
    featuresTitle: "Pourquoi devenir partenaire ?",
    features: [
        { icon: Coins, title: "Revenus Passifs", desc: "Gagnez de l'argent sur chaque flux de colis sans effort commercial." },
        { icon: Users, title: "Flux Client", desc: "Attirez de nouveaux clients potentiels dans votre commerce." },
        { icon: Smartphone, title: "Gestion Mobile", desc: "Une app simple pour scanner les colis et gérer votre stock." },
        { icon: Shield, title: "Zéro Risque", desc: "Aucun investissement de départ requis. On vous fournit le kit." }
    ],
    stepsTitle: "Lancez-vous en 4 étapes",
    steps: [
        { icon: UserCheck, title: "Inscription", desc: "Créez votre compte partenaire Freelance gratuitement." },
        { icon: Store, title: "Configuration", desc: "Renseignez vos horaires et votre capacité de stockage." },
        { icon: BadgeCheck, title: "Validation", desc: "Nous vérifions votre identité et activons votre point." },
        { icon: HandCoins, title: "Encaissez", desc: "Scannez des colis et recevez vos paiements chaque semaine." }
    ],
    bottomCtaTitle: "Rejoignez le réseau",
    bottomCtaDesc: "Plus de 500 partenaires nous font déjà confiance."
};

const LIVREUR_DATA: ContentData = {
    title: <>Livrez et gagnez,<br /><span className="text-amber-300 dark:text-amber-200">à votre rythme.</span></>,
    description: "Moto, vélo ou voiture ? Devenez votre propre patron avec PicknDrop Delivery. Acceptez des courses, livrez, encaissez.",
    heroImage: "/images/livrer.jpeg",
    ctaPrimary: { text: "Devenir Livreur", link: "/register" },
    ctaSecondary: { text: "Connexion Livreur", link: "/login" },
    featuresTitle: "Avantages Livreur",
    features: [
        { icon: Key, title: "Liberté Totale", desc: "Connectez-vous quand vous voulez. Aucune heure imposée." },
        { icon: BarChart3, title: "Gains Transparents", desc: "Prix fixés à l'avance. Vous gardez 100% des pourboires." },
        { icon: Map, title: "App Intelligente", desc: "Navigation optimisée et attribution automatique des courses." },
        { icon: Shield, title: "Assurance", desc: "Couverture incluse pendant vos courses pour votre sérénité." }
    ],
    stepsTitle: "La route est à vous",
    steps: [
        { icon: ClipboardPenLine, title: "Enregistrement", desc: "Fournissez vos documents (Permis, CNI, photo véhicule)." },
        { icon: Smartphone, title: "Réception", desc: "Acceptez une demande de livraison proche de vous." },
        { icon: Box, title: "Collecte", desc: "Récupérez le colis au point de départ (Relais ou Client)." },
        { icon: HandCoins, title: "Paiement", desc: "Livrez et recevez votre paiement immédiatement." }
    ],
    bottomCtaTitle: "Prenez la route",
    bottomCtaDesc: "Votre prochaine course est peut-être à 500 mètres."
};

const AGENCY_DATA: ContentData = {
    title: <>Passez au niveau supérieur,<br /><span className="text-amber-300 dark:text-amber-200">Digitalisez votre agence.</span></>,
    description: "Une suite logicielle complète pour les agences de transport et logistique. Gestion de flotte, tracking avancé et comptabilité intégrée.",
    heroImage: "/images/image4.jpg",
    ctaPrimary: { text: "Inscrire mon Agence", link: "/register" },
    ctaSecondary: { text: "Portail Agence", link: "/login" },
    featuresTitle: "Solution Enterprise",
    features: [
        { icon: Layers, title: "Dashboard 360", desc: "Vue globale sur tous vos véhicules, chauffeurs et colis en temps réel." },
        { icon: Users, title: "Gestion Équipe", desc: "Créez des accès pour vos employés (guichetiers, chauffeurs)." },
        { icon: BarChart3, title: "Analytics", desc: "Rapports détaillés sur vos performances et votre chiffre d'affaires." },
        { icon: Briefcase, title: "API Ouverte", desc: "Intégrez PicknDrop directement à vos systèmes existants." }
    ],
    stepsTitle: "Intégration fluide",
    steps: [
        { icon: Building, title: "Compte Pro", desc: "Créez votre profil Agence certifiée." },
        { icon: Users, title: "Onboarding", desc: "Invitez vos collaborateurs et enregistrez votre flotte." },
        { icon: MapPin, title: "Déploiement", desc: "Configurez vos agences physiques comme points relais officiels." },
        { icon: BarChart3, title: "Pilotage", desc: "Suivez la croissance de votre activité logistique." }
    ],
    bottomCtaTitle: "Modernisez votre logistique",
    bottomCtaDesc: "Rejoignez les leaders du transport au Cameroun."
};

const MARKET_DATA: ContentData = {
    title: <>Le marché ouvert de<br /><span className="text-amber-300 dark:text-amber-200">la logistique.</span></>,
    description: "Trouvez le meilleur transporteur au meilleur prix, ou proposez vos services sur la plus grande place de marché logistique du Cameroun.",
    heroImage: "/images/expedition.avif",
    ctaPrimary: { text: "Voir les Offres", link: "/marketplace" },
    ctaSecondary: { text: "Publier une annonce", link: "/expedition" },
    featuresTitle: "La Marketplace PicknDrop",
    features: [
        { icon: Search, title: "Transparence", desc: "Comparez les profils, les avis et les tarifs avant de choisir." },
        { icon: Shield, title: "Sécurité", desc: "Paiements bloqués jusqu'à confirmation de la livraison." },
        { icon: Users, title: "Communauté", desc: "Des milliers d'acteurs connectés en temps réel." },
        { icon: Star, title: "Qualité", desc: "Système de notation pour garantir l'excellence de service." }
    ],
    stepsTitle: "Simple et Efficace",
    steps: [
        { icon: Search, title: "Recherche", desc: "Parcourez les profils ou publiez votre besoin d'expédition." },
        { icon: MessageCircle, title: "Discussion", desc: "Échangez directement avec les transporteurs via la plateforme." }, // Correction: import manquait, supposé Lucide
        { icon: HandCoins, title: "Accord", desc: "Validez le devis et bloquez le paiement." },
        { icon: Truck, title: "Réalisation", desc: "Suivez la prestation jusqu'à la validation finale." }
    ],
    bottomCtaTitle: "Connectez-vous au marché",
    bottomCtaDesc: "L'offre et la demande n'ont jamais été aussi proches."
};

// Mapping des données
const CONTENT_MAP: Record<string, ContentData> = {
    'CLIENT': DEFAULT_DATA,
    'FREELANCE': FREELANCE_DATA,
    'LIVREUR': LIVREUR_DATA,
    'AGENCY': AGENCY_DATA,
    'MARKET': MARKET_DATA
};


// --- COMPOSANTS INTERNES (Mises à jour pour être purement présentation) ---

// 1. BANNIÈRE MISE À JOUR (Design Requested)
const DynamicBanniere = ({ data }: { data: ContentData }) => (
  <section className="relative h-[80vh] min-h-[500px] flex items-center justify-center text-white text-center overflow-hidden">
    
    {/* Couche 1: Image de fond dynamique */}
    <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000" 
        style={{ backgroundImage: `url('${data.heroImage}')` }}
    />

    {/* Couche 2: Blur + Filtre Orangé (DEMANDE SPÉCIALE) */}
    {/* On utilise bg-orange-600 avec une opacité mix-blend pour tinter l'image + backdrop-blur */}
    <div className="absolute inset-0 bg-orange-600/40 mix-blend-multiply backdrop-blur-[2px]" />
    <div className="absolute inset-0 bg-black/30" /> {/* Légère couche sombre pour contraste texte */}

    {/* Couche 3: Contenu */}
    <div className="relative z-10 p-6 max-w-4xl mx-auto pt-20">
      <motion.div 
        key={`title-${data.ctaPrimary.link}`} // Key change trigger animation on route change
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
      >
          <h1 className="text-4xl md:text-6xl font-black tracking-tight drop-shadow-md">
            {data.title}
          </h1>
      </motion.div>

      <motion.p 
        key={`desc-${data.ctaPrimary.link}`}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-6 max-w-2xl mx-auto text-lg md:text-2xl opacity-95 font-medium text-slate-50 drop-shadow"
      >
        {data.description}
      </motion.p>

      <motion.div 
        key={`cta-${data.ctaPrimary.link}`}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
        className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Link 
          href={data.ctaPrimary.link} 
          className="bg-white text-orange-600 px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:bg-orange-50 transition-transform transform hover:scale-105"
        >
          {data.ctaPrimary.text}
        </Link>
        <Link 
          href={data.ctaSecondary.link} 
          className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all"
        >
          {data.ctaSecondary.text}
        </Link>
      </motion.div>
    </div>
  </section>
);

const DynamicFeatures = ({ data }: { data: ContentData }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatePresence mode='wait'>
            {data.features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                    <motion.div 
                      key={feature.title + index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl dark:shadow-gray-900/20 dark:hover:shadow-gray-900/30 hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-gray-700"
                    >
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full inline-block mb-4 text-orange-600 dark:text-orange-500">
                            <Icon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{feature.desc}</p>
                    </motion.div>
                )
            })}
            </AnimatePresence>
        </div>
    );
};

const DynamicSteps = ({ data }: { data: ContentData }) => {
    return (
        <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-orange-200 dark:bg-orange-800 -translate-y-1/2 -mt-16"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
                {data.steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                        <motion.div 
                           key={step.title} 
                           initial={{opacity:0, scale:0.9}} 
                           whileInView={{opacity:1, scale:1}}
                           transition={{delay: index * 0.15}}
                           className="text-center"
                        >
                            <div className="relative mb-6">
                               <div className="bg-gradient-to-br from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg dark:shadow-gray-900/20 relative z-10 text-white">
                                  <Icon className="w-10 h-10" />
                               </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Étape {index + 1}: {step.title}</h3>
                            <p className="text-gray-600 dark:text-gray-300">{step.desc}</p>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    );
};


// --- COMPOSANT PRINCIPAL LANDING PAGE ---

export default function LandingPage() {
  // Hooks
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role')?.toUpperCase() || 'CLIENT';
  
  const [content, setContent] = useState<ContentData>(DEFAULT_DATA);

  // Theme System (copié de l'existant pour la cohérence)
  useEffect(() => {
      const applyTheme = () => {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
              document.documentElement.classList.add('dark');
          } else {
              document.documentElement.classList.remove('dark');
          }
      };
      applyTheme();
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', applyTheme);
      return () => mq.removeEventListener('change', applyTheme);
  }, []);

  // Data Switch
  useEffect(() => {
      // On bascule les données si le rôle existe, sinon fallback CLIENT
      if (roleParam && CONTENT_MAP[roleParam]) {
          setContent(CONTENT_MAP[roleParam]);
      } else {
          setContent(DEFAULT_DATA);
      }
      
      // Petit scroll top pour UX lors du switch
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [roleParam]);


  return (
    <div className="w-full bg-white dark:bg-gray-900 transition-colors duration-300">
      <NavbarHome />
      
      <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)]">
        <main className="flex-grow">
          
          {/* Bannière Dynamique */}
          <DynamicBanniere data={content} />
          
          {/* Section Features Dynamique */}
          <section className="py-16 md:py-24 bg-orange-50/50 dark:bg-gray-800/50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                    {content.featuresTitle}
                </h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 transition-colors duration-300">
                    Découvrez comment PicknDrop répond spécifiquement à vos besoins
                </p>
              </div>
              <DynamicFeatures data={content} />
            </div>
          </section>

          {/* Section Manuel Dynamique */}
          <section id="how-it-works" className="py-16 md:py-24 bg-white dark:bg-gray-900 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                    {content.stepsTitle}
                </h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 transition-colors duration-300">
                    Processus simplifié pour un démarrage immédiat
                </p>
              </div>
              <DynamicSteps data={content} />
            </div>
          </section>
          
          {/* Bottom CTA Dynamique */}
          <section className="py-16 bg-orange-600 dark:bg-orange-700 text-white transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold">{content.bottomCtaTitle}</h2>
              <p className="mt-4 text-xl max-w-3xl mx-auto opacity-90 dark:opacity-95">
                {content.bottomCtaDesc}
              </p>
              <div className="mt-8">
                <Link 
                  href={content.ctaPrimary.link}
                  className="bg-white dark:bg-gray-100 text-orange-600 dark:text-orange-700 px-10 py-5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-200 transition-all duration-300 font-bold text-lg shadow-2xl dark:shadow-gray-900/40 transform hover:-translate-y-1"
                >
                  {content.ctaPrimary.text}
                </Link>
              </div>
            </div>
          </section>

        </main>
        <Footer />
      </div>
    </div>
  );
}
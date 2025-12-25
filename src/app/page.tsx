'use client';

import React from 'react';
import Link from 'next/link';
// Utilisation de <img> standard pour éviter les erreurs de configuration de domaine Next.js
import { motion } from 'framer-motion';
import { 
  Package, ShoppingBag, Truck, MapPin, Search, 
  Layers, ShieldCheck, Globe, Users, ArrowRight 
} from 'lucide-react';
import { Snowfall, FairyLights } from '@/components/ChristmasTheme';
import NavbarHome from '@/components/NavbarHome';
import FooterHome from '@/components/FooterHome';

// URL de l'image du Père Noël
const SANTA_BG_IMAGE = "/images/image7.png";

// --- SOUS-COMPOSANTS STYLE "CHROME" ---

const ModuleCard = ({ 
  title, subtitle, description, icon: Icon, href, color = "orange", badge, delay = 0 
}: {
  title: string, subtitle?: string, description: string, icon: any, href: string, color?: "orange"|"red"|"green"|"blue"|"purple", badge?: string, delay?: number
}) => {
  // Mapping des couleurs pour le thème de Noël + PicknDrop
  const theme = {
    orange: { bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-700 dark:text-orange-400', border: 'hover:border-orange-500', badge: 'bg-orange-200 text-orange-900' },
    red:    { bg: 'bg-red-50 dark:bg-red-950/20',       text: 'text-red-700 dark:text-red-400',       border: 'hover:border-red-500',    badge: 'bg-red-200 text-red-900' },
    green:  { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'hover:border-emerald-500', badge: 'bg-emerald-200 text-emerald-900' },
    blue:   { bg: 'bg-blue-50 dark:bg-blue-950/20',     text: 'text-blue-700 dark:text-blue-400',     border: 'hover:border-blue-500',   badge: 'bg-blue-200 text-blue-900' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-700 dark:text-purple-400', border: 'hover:border-purple-500', badge: 'bg-purple-200 text-purple-900' },
  }[color];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: delay, duration: 0.5 }}
      className={`group relative flex flex-col p-8 rounded-[2rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 ${theme.border} transition-all duration-300 shadow-sm hover:shadow-xl`}
    >
       {/* Badge décoratif Noël */}
      {badge && (
        <span className={`absolute top-6 right-6 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${theme.badge}`}>
          {badge}
        </span>
      )}
      
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${theme.bg}`}>
        <Icon className={`w-7 h-7 ${theme.text}`} />
      </div>

      <div className="flex-1">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          {title}
        </h3>
        {subtitle && <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">{subtitle}</p>}
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
          {description}
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
         <span className={`text-sm font-bold flex items-center gap-2 group-hover:gap-4 transition-all ${theme.text}`}>
           Explorer <ArrowRight className="w-4 h-4"/>
         </span>
         {/* Décoration subtile : Petit sapin au survol */}
         <span className="text-xl opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">🎄</span>
      </div>

      <Link href={href} className="absolute inset-0 z-10" aria-label={`Aller vers ${title}`} />
    </motion.div>
  );
};

const Badge = ({ children }: { children: React.ReactNode }) => (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-red-300 dark:border-red-700 shadow-lg mb-6">
        <span className="text-xl animate-spin" style={{ animationDuration: '3s' }}>⭐</span>
        <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping"/>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">{children}</span>
    </div>
);

const SectionWrapper = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`max-w-6xl mx-auto px-6 py-20 ${className}`}>
        {children}
    </div>
);


// ============================================================================
// PAGE PRINCIPALE PORTAIL
// ============================================================================

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0c15] text-slate-900 dark:text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* 1. Ambiance de Noël */}
      <Snowfall />

      {/* 2. Hero Section Tropicalisée */}
      <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden">
         {/* Background avec <img> pour compatibilité rapide */}
         <div className="absolute inset-0 z-0">
             <img 
                src={SANTA_BG_IMAGE} 
                alt="PicknDrop Christmas Africa"
                className="absolute inset-0 w-full h-full object-cover object-center"
             />
             {/* Dégradé pour lisibilité : Noir transparent -> Transparent */}
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-slate-900/40" />
             {/* Filtre de bruit subtil pour texture moderne */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
         </div>

         {/* Contenu Hero */}
         <div className="relative z-10 container mx-auto px-6 pt-20">
             <FairyLights />
             
             <motion.div 
               initial={{ opacity: 0, y: 40 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, ease: "easeOut" }}
               className="max-w-4xl"
             >
                {/* Badge Saisonnier */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold uppercase tracking-wider mb-6">
                    <span className="animate-pulse">🎁</span> Spécial Fêtes 2024
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6 drop-shadow-lg">
                  La Logistique Réinventée <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">
                     avec PicknDrop
                  </span>
                </h1>
                
                <p className="text-xl text-slate-100 max-w-2xl leading-relaxed mb-10 font-medium drop-shadow-md">
                  Une plateforme complète pour envoyer, recevoir, livrer et suivre chaque colis, 
                  du quartier au continent. 
                  <span className="block mt-2 text-emerald-300 font-bold">Pas d'adresse ? Pas de problème. 🎅🏿</span>
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    {/* LIEN HERO 1: vers Landing Client */}
                    <Link href="/landing?role=CLIENT" className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-lg transition-transform hover:scale-105 shadow-xl shadow-orange-900/50 flex items-center justify-center gap-3 border-b-4 border-orange-800">
                       <Package className="w-6 h-6"/> Envoyer un colis
                    </Link>
                    {/* LIEN HERO 2: vers Section Modules */}
                    <Link href="#ecosystem" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold text-lg backdrop-blur-md transition-transform hover:scale-105 flex items-center justify-center">
                       Découvrir l'univers
                    </Link>
                </div>
             </motion.div>
         </div>

         {/* Bandeau Décoratif Bas de Hero */}
         <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-slate-50 dark:from-[#0b0c15] to-transparent z-10" />
      </section>

      {/* 3. Section Écosystème (Grid Bento Style) */}
      <section id="ecosystem" className="py-24 px-6 relative">
          <div className="container mx-auto">
              
              <div className="text-center mb-16 space-y-4">
                  <h2 className="text-sm font-black text-orange-500 uppercase tracking-[0.2em]">🎄 L'Écosystème PicknDrop 🎄</h2>
                  <h3 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white">Modulaire, Scalable, Unifié.</h3>
                  <div className="flex justify-center gap-2 text-3xl">🎅 🤶 🎁 ⭐</div>
              </div>

              {/* Grille Style "Chrome What's New" */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Carte 1 : LINK -> Landing CLIENT */}
                  <ModuleCard 
                      title="PicknDrop Link"
                      subtitle="Pour Particuliers"
                      description="Pré-enregistrement et circulation simplifiée. Idéal pour e-commerce informel et commerçants de proximité."
                      icon={MapPin}
                      color="orange"
                      badge="Populaire"
                      href="/landing?role=CLIENT" 
                      delay={0.1}
                  />

                  {/* Carte 2 : MARKET -> Landing MARKET */}
                  <ModuleCard 
                      title="PicknDrop Market"
                      subtitle="Place de Marché"
                      description="Trouvez un livreur ou un service logistique fiable. Le moteur de découverte des colis et services publiés."
                      icon={ShoppingBag}
                      color="green"
                      badge="Nouveau"
                      href="/landing?role=MARKET" 
                      delay={0.2}
                  />

                  {/* Carte 3 : AGENCY -> Landing AGENCY */}
                  <ModuleCard 
                      title="PicknDrop Agency"
                      subtitle="Gestion Pro"
                      description="Suite complète pour les agences de transport. Gestion de flotte, bordereaux électroniques et pilotage multi-sites."
                      icon={Layers}
                      color="blue"
                      href="/landing?role=AGENCY" 
                      delay={0.3}
                  />

                  {/* Carte 4 : POINT (Relais) -> Landing FREELANCE (Points relais) */}
                  <motion.div 
                     initial={{ opacity: 0, y: 30 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: 0.4, duration: 0.5 }}
                     className="lg:col-span-2 group relative p-10 rounded-[2.5rem] bg-slate-900 text-white overflow-hidden shadow-2xl flex flex-col md:flex-row items-center gap-8 border-4 border-slate-800 hover:border-slate-700 transition-colors"
                  >
                      {/* Background decor */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 blur-[80px] rounded-full" />
                      
                      <div className="flex-1 relative z-10 space-y-6">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 text-orange-300 rounded-lg text-xs font-bold uppercase tracking-wider border border-orange-500/30">
                             <Search className="w-3 h-3"/> Infrastructure
                          </div>
                          <h3 className="text-3xl md:text-4xl font-black leading-tight">PicknDrop Point & <br/> Search</h3>
                          <p className="text-slate-300 text-lg leading-relaxed">
                             Convertissez votre boutique en micro-hub logistique ou suivez n'importe quel colis via notre tracking universel (QR Code, ID, Localisation).
                          </p>
                          {/* Lien vers Landing FREELANCE */}
                          <Link href="/landing?role=FREELANCE" className="inline-flex items-center gap-3 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-orange-50 transition-colors">
                              Devenir Point Relais <ArrowRight className="w-5 h-5"/>
                          </Link>
                      </div>
                      
                      {/* Illustration stylisée */}
                      <div className="flex-1 w-full flex justify-center relative">
                           <div className="relative w-64 h-48 bg-slate-800 rounded-2xl border border-slate-700 p-4 shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                               <div className="flex items-center gap-3 mb-4 border-b border-slate-700 pb-3">
                                   <div className="w-3 h-3 rounded-full bg-red-500"/>
                                   <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                                   <div className="w-3 h-3 rounded-full bg-green-500"/>
                               </div>
                               <div className="space-y-3">
                                   <div className="h-2 w-3/4 bg-slate-700 rounded animate-pulse"/>
                                   <div className="h-2 w-1/2 bg-slate-700 rounded animate-pulse delay-75"/>
                                   <div className="h-20 w-full bg-orange-500/10 rounded border border-orange-500/20 flex items-center justify-center">
                                       <span className="text-4xl">📍📦</span>
                                   </div>
                               </div>
                           </div>
                      </div>
                  </motion.div>

                  {/* Carte 5 : FREELANCER (LIVREUR) -> Landing LIVREUR */}
                  <ModuleCard 
                      title="Freelancer"
                      subtitle="Pour les Pros"
                      description="Solution dédiée aux livreurs indépendants (Benskinneurs). Gestion de courses, réputation et revenus structurés."
                      icon={Truck}
                      color="purple"
                      href="/landing?role=LIVREUR"
                      delay={0.5}
                  />

              </div>
          </div>
      </section>

      {/* 4. Section Technologique */}
      <section className="py-24 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 relative">
          <div className="container mx-auto px-6">
               <div className="max-w-4xl mx-auto mb-16 text-center">
                   <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-6">
                       PicknDrop <span className="text-orange-600">Core</span> & <span className="text-emerald-600">Confidence</span>
                   </h2>
                   <p className="text-lg text-slate-600 dark:text-slate-300">
                       Le noyau partagé qui orchestre tout. Une colonne vertébrale technologique robuste doublée d'une couche de confiance Blockchain pour une traçabilité totale en Afrique.
                   </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { 
                          icon: Globe, color: "text-blue-500", 
                          title: "Scalable & API First", 
                          desc: "Une architecture microservices unifiée prête à l'échelle continentale."
                        },
                        { 
                          icon: ShieldCheck, color: "text-emerald-500", 
                          title: "Blockchain Trust", 
                          desc: "Validation immuable des opérations. Preuve de dépôt et de livraison sécurisée." 
                        },
                        { 
                          icon: Users, color: "text-purple-500", 
                          title: "Inclusivité Numérique", 
                          desc: "Interfaces optimisées pour les téléphones basiques et les réseaux à faible débit." 
                        }
                    ].map((feat, i) => (
                        <div key={i} className="flex flex-col items-center text-center p-6">
                            <div className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 mb-4 ${feat.color}`}>
                                <feat.icon className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{feat.title}</h4>
                            <p className="text-slate-500 dark:text-slate-400">{feat.desc}</p>
                        </div>
                    ))}
               </div>
          </div>
          
          <div className="absolute bottom-0 left-10 text-6xl opacity-20 pointer-events-none translate-y-1/2">🎄</div>
          <div className="absolute top-10 right-10 text-5xl opacity-20 pointer-events-none -translate-y-1/2">🎁</div>
      </section>

      {/* 5. Impact & Vision */}
      <section className="py-20 px-6">
          <SectionWrapper className="text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-red-50 via-orange-50 to-green-50 dark:from-red-950/20 dark:via-orange-950/20 dark:to-green-950/20 py-20 px-6 rounded-[3rem] border-4 border-red-200 dark:border-red-800 relative overflow-hidden"
            >
              <div className="absolute top-4 left-4 text-6xl opacity-30 animate-pulse">⭐</div>
              <div className="absolute bottom-4 right-4 text-6xl opacity-30 animate-bounce">🎄</div>
              
              <div className="relative z-10">
                <div className="flex justify-center gap-3 text-4xl mb-6">
                  <span>🎁</span><span>🎄</span><span>⭐</span>
                </div>
                
                <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">Conçu pour l'Afrique, Pensé pour le Monde. 🌍</h3>
                <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
                   De Douala à Lagos, nous transformons l'informel en une logistique structurée, traçable et créatrice d'emplois.
                   Rejoignez la révolution dès aujourd'hui.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link href="/register" className="bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 text-white font-bold py-4 px-10 rounded-2xl shadow-xl transition-all active:scale-95 border-2 border-yellow-300">
                    🎁 Créer mon compte gratuitement
                  </Link>
                  <Link href="/landing?role=MARKET" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-red-300 dark:border-red-700 font-bold py-4 px-10 rounded-2xl shadow-sm hover:bg-slate-50 transition-all">
                    🎄 Voir le Marketplace
                  </Link>
                </div>
              </div>
            </motion.div>
          </SectionWrapper>
      </section>

      <FooterHome />
    </div>
  );
}
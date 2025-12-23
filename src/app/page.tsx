'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Package,
  Truck,
  Store,
  ShoppingBag,
  Building2,
  Users,
  Search,
  ShieldCheck,
  Globe,
  Database,
  Cpu,
  BarChart3
} from 'lucide-react';
import NavbarHome from '@/components/NavbarHome';
import FooterHome from '@/components/FooterHome';

// --- EFFET DE NEIGE ---
const Snowflake = ({ delay }: { delay: number }) => {
  const [left] = useState(Math.random() * 100);
  const duration = 10 + Math.random() * 20;
  
  return (
    <motion.div
      initial={{ y: -10, x: `${left}vw`, opacity: 0 }}
      animate={{ 
        y: '100vh', 
        x: `${left + (Math.random() - 0.5) * 20}vw`,
        opacity: [0, 1, 1, 0]
      }}
      transition={{ 
        duration, 
        delay,
        repeat: Infinity,
        ease: 'linear'
      }}
      className="absolute text-white text-opacity-70 pointer-events-none"
      style={{ fontSize: `${8 + Math.random() * 12}px` }}
    >
      ❄
    </motion.div>
  );
};

const ChristmasLights = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-16 pointer-events-none z-30">
      <div className="flex justify-around items-start">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ 
              duration: 2,
              delay: i * 0.1,
              repeat: Infinity
            }}
            className={`w-3 h-3 rounded-full ${
              i % 4 === 0 ? 'bg-red-500' : 
              i % 4 === 1 ? 'bg-green-500' : 
              i % 4 === 2 ? 'bg-blue-500' : 
              'bg-yellow-500'
            }`}
            style={{ 
              boxShadow: `0 0 10px ${
                i % 4 === 0 ? '#ef4444' : 
                i % 4 === 1 ? '#22c55e' : 
                i % 4 === 2 ? '#3b82f6' : 
                '#eab308'
              }`
            }}
          />
        ))}
      </div>
    </div>
  );
};

// --- COMPOSANTS DE STYLE CHROME WHAT'S NEW ---

const Badge = ({ children, color = "blue" }: { children: React.ReactNode, color?: string }) => {
  const colors: any = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${colors[color]}`}>
      {children}
    </span>
  );
};

const SectionWrapper = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <motion.section
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8 }}
    className={`max-w-6xl mx-auto px-6 py-16 md:py-24 ${className}`}
  >
    {children}
  </motion.section>
);

// --- COMPOSANT MODULE (CARTE LARGE) ---
const ModuleRow = ({ title, subtitle, badge, description, icon: Icon, image, href, reverse = false, color = "orange" }: any) => (
  <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 mb-24 relative`}>
    {/* Décorations de Noël autour des modules */}
    <div className="absolute -top-4 -left-4 text-4xl animate-bounce" style={{ animationDuration: '3s' }}>
      🎄
    </div>
    <div className="absolute -bottom-4 -right-4 text-3xl animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
      🎁
    </div>
    
    <div className="flex-1 space-y-6">
      <Badge color={color}>{badge}</Badge>
      <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
        {title} <br/><span className="text-slate-400 font-medium text-2xl">{subtitle}</span>
      </h2>
      <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
      <Link href={href} className="inline-flex items-center gap-2 font-bold text-orange-600 dark:text-orange-500 hover:gap-4 transition-all group">
        Découvrir le module <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
      </Link>
    </div>
    <div className="flex-1 w-full">
      <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-red-200 dark:border-red-900/50 bg-slate-100 dark:bg-slate-900 group">
        {/* Guirlande décorative sur l'image */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r from-red-500 via-green-500 to-red-500 opacity-20 z-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity z-10"/>
        <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute top-6 left-6 p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl z-20 border-2 border-red-300 dark:border-red-700">
           <Icon className="w-8 h-8 text-orange-600" />
        </div>
        {/* Étoiles scintillantes */}
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3], rotate: [0, 180, 360] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-4 right-4 text-3xl z-20"
        >
          ⭐
        </motion.div>
      </div>
    </div>
  </div>
);

// ============================================================================
// PAGE PRINCIPALE PORTAIL
// ============================================================================

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0f172a] transition-colors duration-500 selection:bg-orange-100 relative overflow-hidden">
      {/* Effet de neige */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <Snowflake key={i} delay={i * 0.2} />
        ))}
      </div>

      {/* Guirlandes lumineuses en haut */}
      <ChristmasLights />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-15 pb-20 overflow-hidden">
        {/* Background blobs (Style Chrome) */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-orange-100/40 dark:bg-orange-900/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Sapins décoratifs */}
        <div className="absolute bottom-10 left-10 text-6xl opacity-30 dark:opacity-20 animate-pulse">
          🎄
        </div>
        <div className="absolute bottom-20 right-20 text-5xl opacity-30 dark:opacity-20 animate-pulse" style={{ animationDelay: '1s' }}>
          🎄
        </div>
        
        {/* Traîneau du Père Noël */}
        <motion.div
          animate={{ x: ['100vw', '-20vw'] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute top-25 text-6xl z-20 pointer-events-none"
        >
          🛷🎅
        </motion.div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-red-300 dark:border-red-700 shadow-lg">
              <span className="text-2xl animate-spin" style={{ animationDuration: '3s' }}>⭐</span>
              <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping"/>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">🎄 Spécial Fêtes 2025 🎄</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight relative">
              La logistique réinventée <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600">pour l'Afrique.</span>
              <span className="absolute -top-6 -right-6 text-4xl animate-bounce">🎁</span>
            </h1>
            
            <p className="max-w-3xl mx-auto text-xl md:text-2xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Une plateforme complète pour envoyer, recevoir, livrer et suivre chaque colis, du quartier au continent.
            </p>

            {/* Décoration confettis */}
            <div className="flex justify-center gap-4 text-3xl">
              <motion.span animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>🎊</motion.span>
              <motion.span animate={{ y: [0, -15, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}>🎉</motion.span>
              <motion.span animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}>🎊</motion.span>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
              <Link href="/landing?role=CLIENT" className="px-8 py-4 bg-gradient-to-r from-red-600 to-green-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform transition hover:-translate-y-1 border-2 border-yellow-300">
                🎁 Découvrir PicknDrop
              </Link>
              <Link href="/register" className="px-8 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold text-lg hover:opacity-90 transform transition hover:-translate-y-1 border-2 border-red-400">
                ⭐ Devenir Point Relais
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- MODULES CORE (PAGE 1-5 PDF) --- */}
      <SectionWrapper>
        <div className="text-center mb-20 space-y-4 relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-5xl animate-bounce">
            🌟
          </div>
          <h2 className="text-sm font-black text-orange-500 uppercase tracking-[0.2em]">🎄 L'Écosystème 🎄</h2>
          <h3 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">Modules Unifiés</h3>
          <div className="flex justify-center gap-3 text-2xl pt-2">
            <span>🎅</span>
            <span>🤶</span>
            <span>🎄</span>
            <span>🎁</span>
            <span>⭐</span>
          </div>
        </div>

        {/* 1. LINK */}
        <ModuleRow 
          badge="🎁 Logistique Informelle"
          title="PicknDrop Link"
          subtitle="Circulation simplifiée"
          description="L'entrée principale pour les particuliers et le e-commerce informel. Pré-enregistrement sécurisé, dépôts et retraits en point relais même sans adressage complet."
          icon={Package}
          image="/images/land.jpeg"
          href="/landing?role=CLIENT"
          color="orange"
        />

        {/* 2. MARKET */}
        <ModuleRow 
          badge="🎄 Marketplace"
          title="PicknDrop Market"
          subtitle="Découverte de services"
          description="Le moteur de recherche des freelances et des agences. Comparez les prix, les délais et les disponibilités en temps réel sur une plateforme de services ouverte."
          icon={ShoppingBag}
          image="/images/expedition.avif"
          href="/landing?role=MARKET"
          reverse={true}
          color="green"
        />

        {/* 3. AGENCY */}
        <ModuleRow 
          badge="⭐ Entreprise (ERP)"
          title="PicknDrop Agency"
          subtitle="Gestion professionnelle"
          description="Une solution ERP ultra-légère pour les agences de transport. Pilotage de flotte, bordereaux électroniques et gestion multi-sites en mode déconnecté (offline-first)."
          icon={Building2}
          image="/images/image4.jpg"
          href="/landing?role=AGENCY"
          color="blue"
        />
        
        {/* 4. FREELANCER & GO */}
        <ModuleRow 
          badge="🎅 Gains Mobiles"
          title="PicknDrop Freelancer"
          subtitle="Professionnalisation"
          description="L'outil dédié aux coursiers indépendants et motos-taximen. Gestion de profil, réputation, et matching intelligent basé sur la géolocalisation pour maximiser vos courses."
          icon={Truck}
          image="/images/livrer.jpeg"
          href="/landing?role=LIVREUR"
          reverse={true}
          color="purple"
        />
      </SectionWrapper>

      {/* --- FONCTIONNALITÉS TRANSVERSALES (STYLE TUILES CHROME) --- */}
      <section className="bg-slate-50 dark:bg-[#111827] py-24 transition-colors relative">
        {/* Décorations de Noël en arrière-plan */}
        <div className="absolute top-10 left-10 text-6xl opacity-10 animate-pulse">🎄</div>
        <div className="absolute top-20 right-10 text-5xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}>🎁</div>
        <div className="absolute bottom-10 left-1/4 text-4xl opacity-10 animate-pulse" style={{ animationDelay: '0.5s' }}>⭐</div>
        <div className="absolute bottom-20 right-1/3 text-5xl opacity-10 animate-pulse" style={{ animationDelay: '1.5s' }}>🎄</div>
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="mb-16 text-center">
            <Badge>🎄 Fonctionnalités transversales 🎄</Badge>
            <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-4 italic">La technologie PicknDrop Core.</h3>
            <div className="flex justify-center gap-3 text-2xl mt-4">
              <span className="animate-bounce">🍬</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🍭</span>
              <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>🍬</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Universal Tracking", icon: Search, desc: "Un moteur multi-critères (QR, Nom, Code) pour suivre tout l'écosystème.", label: "PicknDrop Search", emoji: "🎁" },
              { title: "API Unified Core", icon: Database, desc: "La colonne vertébrale micro-services garantissant la scalabilité internationale.", label: "PicknDrop Core", emoji: "🎄" },
              { title: "Trust Blockchain", icon: ShieldCheck, desc: "Traçabilité immuable et réduction des litiges pour une confiance totale.", label: "PicknDrop Confidence", emoji: "⭐" }
            ].map((feat, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.05, rotate: [0, -1, 1, 0] }}
                className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border-4 border-red-200 dark:border-red-900/50 shadow-xl flex flex-col justify-between relative overflow-hidden"
              >
                {/* Déco en coin */}
                <div className="absolute top-2 right-2 text-3xl opacity-50">
                  {feat.emoji}
                </div>
                
                <div className="p-4 bg-gradient-to-br from-red-100 to-green-100 dark:from-red-900/20 dark:to-green-900/20 rounded-2xl w-fit mb-6">
                  <feat.icon className="w-8 h-8 text-orange-600" />
                </div>
                <h4 className="text-xs font-bold text-orange-500 mb-2 uppercase tracking-widest">{feat.label}</h4>
                <h5 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{feat.title}</h5>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- IMPACT ET VISION --- */}
      <SectionWrapper>
        <div className="grid md:grid-cols-2 gap-16 items-center bg-gradient-to-br from-slate-900 via-red-950 to-green-950 rounded-[3rem] p-8 md:p-16 text-white overflow-hidden relative shadow-3xl border-4 border-yellow-300">
          <div className="absolute top-0 right-0 w-full h-full opacity-10">
            <div className="w-full h-full border-[20px] border-orange-500 rounded-full scale-150 translate-x-1/2" />
          </div>
          
          {/* Décorations flottantes */}
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-8 left-8 text-5xl"
          >
            🎄
          </motion.div>
          <motion.div 
            animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute top-8 right-8 text-4xl"
          >
            ⭐
          </motion.div>
          
          <div className="space-y-8 relative z-10">
            <h3 className="text-4xl md:text-5xl font-black leading-tight">Née en Afrique,<br/>pensée pour le monde. 🌍</h3>
            <p className="text-lg opacity-80 leading-relaxed">
              PicknDrop se positionne comme une technologie exportable, capable de résoudre les défis de l'absence d'adresse et de l'informalité dans les économies émergentes.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border-2 border-red-300">
                <p className="text-4xl font-bold text-orange-400">500+</p>
                <p className="text-sm opacity-60">Points relais actifs 🎁</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border-2 border-green-300">
                <p className="text-4xl font-bold text-orange-400">10k+</p>
                <p className="text-sm opacity-60">PME digitalisées ⭐</p>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 grid grid-cols-2 gap-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border-2 border-blue-300 aspect-square flex flex-col justify-center text-center items-center"
            >
              <Globe className="w-10 h-10 text-blue-400 mb-2" />
              <span className="text-xs font-bold">Scalabilité Mondiale 🌐</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border-2 border-emerald-300 aspect-square translate-y-8 flex flex-col justify-center text-center items-center"
            >
              <Users className="text-emerald-400 w-10 h-10 mb-2" />
              <span className="text-xs font-bold">Inclusivité Sociale 🤝</span>
            </motion.div>
          </div>
        </div>
      </SectionWrapper>

      {/* --- CALL TO ACTION FINAL --- */}
      <SectionWrapper className="text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-red-50 via-orange-50 to-green-50 dark:from-red-950/20 dark:via-orange-950/20 dark:to-green-950/20 py-20 px-6 rounded-[3rem] border-4 border-red-200 dark:border-red-800 relative overflow-hidden"
        >
          {/* Décorations finales */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute top-4 left-4 text-6xl opacity-30"
          >
            ⭐
          </motion.div>
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-4 right-4 text-6xl opacity-30"
          >
            🎄
          </motion.div>
          
          <div className="relative z-10">
            <div className="flex justify-center gap-3 text-4xl mb-6">
              <motion.span animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>🎁</motion.span>
              <motion.span animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}>🎄</motion.span>
              <motion.span animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}>⭐</motion.span>
            </div>
            
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">Prêt à connecter vos flux ? 🚀</h3>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
              Rejoignez la révolution logistique et commencez à expédier partout au Cameroun et au-delà.
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

      <FooterHome />
    </div>
  );
}
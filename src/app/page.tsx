'use client';

import React from 'react';
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
  <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 mb-24`}>
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
      <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 group">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity z-10"/>
        <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute top-6 left-6 p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl z-20">
           <Icon className="w-8 h-8 text-orange-600" />
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// PAGE PRINCIPALE PORTAIL
// ============================================================================

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0f172a] transition-colors duration-500 selection:bg-orange-100">
      {/* --- HERO SECTION --- */}
      <section className="relative pt-15 pb-20 overflow-hidden">
        {/* Background blobs (Style Chrome) */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-orange-100/40 dark:bg-orange-900/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping"/>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Nouvelle Ère Logistique</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">
              La logistique réinventée <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600">pour l’Afrique.</span>
            </h1>
            
            <p className="max-w-3xl mx-auto text-xl md:text-2xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Une plateforme complète pour envoyer, recevoir, livrer et suivre chaque colis, du quartier au continent.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
              <Link href="/landing?role=CLIENT" className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/20 hover:bg-orange-700 transform transition hover:-translate-y-1">
                Découvrir PicknDrop
              </Link>
              <Link href="/register" className="px-8 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold text-lg hover:opacity-90 transform transition hover:-translate-y-1">
                Devenir Point Relais
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- MODULES CORE (PAGE 1-5 PDF) --- */}
      <SectionWrapper>
        <div className="text-center mb-20 space-y-4">
           <h2 className="text-sm font-black text-orange-500 uppercase tracking-[0.2em]">L'Écosystème</h2>
           <h3 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">Modules Unifiés</h3>
        </div>

        {/* 1. LINK */}
        <ModuleRow 
          badge="Logistique Informelle"
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
          badge="Marketplace"
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
          badge="Entreprise (ERP)"
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
            badge="Gains Mobiles"
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
      <section className="bg-slate-50 dark:bg-[#111827] py-24 transition-colors">
        <div className="max-w-6xl mx-auto px-6">
            <div className="mb-16">
                 <Badge>Fonctionnalités transversales</Badge>
                 <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-4 italic">La technologie PicknDrop Core.</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: "Universal Tracking", icon: Search, desc: "Un moteur multi-critères (QR, Nom, Code) pour suivre tout l'écosystème.", label: "PicknDrop Search" },
                    { title: "API Unified Core", icon: Database, desc: "La colonne vertébrale micro-services garantissant la scalabilité internationale.", label: "PicknDrop Core" },
                    { title: "Trust Blockchain", icon: ShieldCheck, desc: "Traçabilité immuable et réduction des litiges pour une confiance totale.", label: "PicknDrop Confidence" }
                ].map((feat, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
                    >
                        <div className="p-4 bg-orange-100/50 dark:bg-orange-900/20 rounded-2xl w-fit mb-6">
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
           <div className="grid md:grid-cols-2 gap-16 items-center bg-gradient-to-br from-slate-900 to-black rounded-[3rem] p-8 md:p-16 text-white overflow-hidden relative shadow-3xl">
                <div className="absolute top-0 right-0 w-full h-full opacity-10">
                     <div className="w-full h-full border-[20px] border-orange-500 rounded-full scale-150 translate-x-1/2" />
                </div>
                
                <div className="space-y-8 relative z-10">
                    <h3 className="text-4xl md:text-5xl font-black leading-tight">Née en Afrique,<br/>pensée pour le monde.</h3>
                    <p className="text-lg opacity-80 leading-relaxed">
                        PicknDrop se positionne comme une technologie exportable, capable de résoudre les défis de l'absence d'adresse et de l'informalité dans les économies émergentes.
                    </p>
                    <div className="grid grid-cols-2 gap-8 pt-4">
                        <div>
                            <p className="text-4xl font-bold text-orange-400">500+</p>
                            <p className="text-sm opacity-60">Points relais actifs</p>
                        </div>
                        <div>
                            <p className="text-4xl font-bold text-orange-400">10k+</p>
                            <p className="text-sm opacity-60">PME digitalisées</p>
                        </div>
                    </div>
                </div>
                
                <div className="relative z-10 grid grid-cols-2 gap-4">
                     <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 aspect-square flex flex-col justify-center text-center items-center">
                        <Globe className="w-10 h-10 text-blue-400 mb-2" />
                        <span className="text-xs font-bold">Scalabilité Mondiale</span>
                     </div>
                     <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 aspect-square translate-y-8 flex flex-col justify-center text-center items-center">
                        <Users className="text-emerald-400 w-10 h-10 mb-2" />
                        <span className="text-xs font-bold">Inclusivité Sociale</span>
                     </div>
                </div>
           </div>
      </SectionWrapper>

      {/* --- CALL TO ACTION FINAL --- */}
      <SectionWrapper className="text-center">
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           className="bg-orange-50 dark:bg-orange-950/20 py-20 px-6 rounded-[3rem] border border-orange-100 dark:border-orange-800"
         >
           <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">Prêt à connecter vos flux ?</h3>
           <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
              Rejoignez la révolution logistique et commencez à expédier partout au Cameroun et au-delà.
           </p>
           <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register" className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-10 rounded-2xl shadow-xl transition-all active:scale-95">
                Créer mon compte gratuitement
              </Link>
              <Link href="/landing?role=MARKET" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-bold py-4 px-10 rounded-2xl shadow-sm hover:bg-slate-50 transition-all">
                Voir le Marketplace
              </Link>
           </div>
         </motion.div>
      </SectionWrapper>

      <FooterHome />
    </div>
  );
}
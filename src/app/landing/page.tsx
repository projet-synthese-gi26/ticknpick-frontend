'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import NavbarHome from '@/components/NavbarHome';
import Footer from '@/components/FooterHome';
import { 
    Shield, Truck, MapPin, Search, ClipboardPenLine, Box, Map, Smile, 
    Coins, Users, Store, BarChart3, UserCheck, BadgeCheck, 
    Smartphone, HandCoins, Briefcase, Layers, Key,
    Star, MessageCircle, Building, Loader2, ArrowRight, Zap, Globe, CheckCircle,
    Sparkles, Radio, PackageOpen, ScanLine, Wallet, Share2, Workflow, Database, Link as LinkIcon, Bus
} from 'lucide-react';

// --- TYPES DE DONNÉES ---
type Step = { icon: React.ElementType; title: string; desc: string };
type Feature = { icon: React.ElementType; title: string; desc: string; tag?: string };
type Stat = { value: string; label: string };

type ContentData = {
    themeColor: string;
    heroTitle: React.ReactNode;
    heroSubtitle: string;
    heroImage: string;
    benefits: Stat[];
    featuresTitle: string;
    featuresDescription: string;
    features: Feature[];
    stepsTitle: string;
    steps: Step[];
    ctaPrimary: { text: string; link: string };
    ctaSecondary: { text: string; link: string };
};

// ==================================================================================
// --- DONNÉES EXHAUSTIVES BASÉES SUR LE PDF (PicknDrop System) ---
// ==================================================================================

// 1. PicknDrop Link -> CLIENT / GRAND PUBLIC
const LINK_DATA: ContentData = {
    themeColor: "orange",
    heroImage: "/images/link.jpeg",
    heroTitle: <>La logistique unifiée,<br /><span className="text-orange-600">Sans adresse formelle.</span></>,
    heroSubtitle: "La réponse aux défis du dernier kilomètre africain. Pré-enregistrement, dépôt en micro-hubs et transit sécurisé pour digitaliser la chaîne logistique urbaine.",
    benefits: [
        { value: "QR Code", label: "Sécurité" },
        { value: "24/7", label: "Disponibilité" },
        { value: "Decentralisé", label: "Prise en charge rapide" }
    ],
    featuresTitle: "Expédition Simplifiée",
    featuresDescription: "Conçu pour surmonter l'absence d'adresses et la fragmentation des services.",
    features: [
        { icon: MapPin, title: "Zones Sans Adresse", desc: "Technologie de géolocalisation relative permettant de livrer là où le système d'adressage est incomplet ou absent.", tag: "Innovation" },
        { icon: Store, title: "Réseau de Points relais", desc: "Transformation des petites boutiques et call-box en points de relais logistiques officiels pour le dépôt et retrait.", tag: "Proximité" },
        { icon: Smartphone, title: "Optimisé Android", desc: "Architecture légère conçue pour fonctionner fluide sur les smartphones d'entrée de gamme largement utilisés.", tag: "Tech" },
        { icon: Search, title: "Tracking Hybride", desc: "Historique complet et retransmission des données même lors de transits complexes (multi-legs, multi-transporteurs).", tag: "Trace" }
    ],
    stepsTitle: "Circuit du Colis",
    steps: [
        { icon: ClipboardPenLine, title: "1. Pré-enregistrement", desc: "L'utilisateur génère une demande et obtient un QR code unique avant même de se déplacer." },
        { icon: Store, title: "2. Dépôt Sécurisé", desc: "Remise au Point Relais. Le responsable scanne et valide l'entrée physique dans le réseau." },
        { icon: Workflow, title: "3. Transit & Hops", desc: "Acheminement via la chaîne logistique (inter-hubs) avec traçabilité à chaque point de rupture." },
        { icon: Smile, title: "4. Retrait Client", desc: "Notification SMS/Push. Le destinataire présente son code sécurisé pour retirer le paquet." }
    ],
    ctaPrimary: { text: "Envoyer un Colis", link: "/expedition" },
    ctaSecondary: { text: "Trouver un Point Relais", link: "/map" }
};

// 2. PicknDrop Go -> MARKETPLACE / FREELANCE JOBS
const GO_DATA: ContentData = {
    themeColor: "green",
    heroImage: "/images/go.png",
    heroTitle: <>Rentabilisez les trajets,<br /><span className="text-emerald-600">Connectez les flux.</span></>,
    heroSubtitle: "La marketplace ouverte (PiiBnTick) qui matche les besoins d'expédition avec les disponibilités de transport en temps réel.",
    benefits: [
        { value: "Live", label: "Matching" },
        { value: "Eco", label: "Collaboratif" },
        { value: "B2B/C", label: "Universel" }
    ],
    featuresTitle: "Opportunités Logistiques",
    featuresDescription: "Professionnaliser l'informel (Benskinneurs) en structurant les revenus.",
    features: [
        { icon: Zap, title: "Matching Intelligent", desc: "Algorithme de correspondance basé sur la géolocalisation temps réel et les créneaux horaires disponibles.", tag: "IA" },
        { icon: Users, title: "Inclusion Totale", desc: "Permet aux étudiants, particuliers, et moto-taximen (benskinneurs) de monétiser leurs déplacements.", tag: "Social" },
        { icon: Share2, title: "Annonces Colis", desc: "Publication simple d'annonces de colis à collecter. Les transporteurs postulent instantanément.", tag: "Market" },
        { icon: Globe, title: "Impact Afrique", desc: "Structure progressivement le secteur informel en créant des profils vérifiables et notés.", tag: "Impact" }
    ],
    stepsTitle: "Comment matcher ?",
    steps: [
        { icon: Search, title: "1. Publication", desc: "Un client publie une annonce de colis OU un freelance publie un trajet prévu." },
        { icon: LinkIcon, title: "2. Connexion", desc: "La plateforme propose les meilleures correspondances (coûts, distance, temps)." },
        { icon: MessageCircle, title: "3. Négociation", desc: "Validation des termes via messagerie intégrée et blocage des fonds (Escrow)." },
        { icon: Star, title: "4. Exécution", desc: "Transport suivi par GPS, preuve de livraison et notation mutuelle." }
    ],
    ctaPrimary: { text: "Voir les annonces", link: "/announce" },
    ctaSecondary: { text: "Marketplace", link: "/marketplace" }
};

// 3. PicknDrop Agency -> AGENCES DE TRANSPORT (ERP)
const AGENCY_DATA: ContentData = {
    themeColor: "blue",
    heroImage: "/images/image10.jpeg",
    heroTitle: <>L'ERP Logistique<br /><span className="text-blue-600">pour l'Afrique moderne.</span></>,
    heroSubtitle: "Pilotez votre flotte, vos hubs et vos flux financiers avec une suite 'Offline-First' conçue pour les infrastructures locales.",
    benefits: [
        { value: "ERP", label: "Tout-en-un" },
        { value: "Offline", label: "Resilient" },
        { value: "IoT", label: "Connecté" }
    ],
    featuresTitle: "Gestion Agence 360°",
    featuresDescription: "Des opérations au sol jusqu'à la comptabilité, tout est centralisé.",
    features: [
        { icon: Layers, title: "Pilotage Multi-Sites", desc: "Vision centralisée de toutes vos agences, dépôts et hubs urbains depuis un seul dashboard admin.", tag: "Admin" },
        { icon: Database, title: "Mode Offline-First", desc: "Continuité de service garantie même en cas de coupure internet, avec synchronisation automatique.", tag: "Tech" },
        { icon: BarChart3, title: "Bordereaux Numériques", desc: "Automatisation de la facturation, génération de feuilles de route et rapports de performance.", tag: "Finance" },
        { icon: Bus, title: "Gestion de Flotte", desc: "Suivi des véhicules, affectation des chauffeurs et intégration IoT (Traceurs GPS).", tag: "Fleet" }
    ],
    stepsTitle: "Digitalisation Agence",
    steps: [
        { icon: Building, title: "1. Onboarding", desc: "Création de la structure mère et de ses succursales (points de vente)." },
        { icon: Users, title: "2. Staffing", desc: "Création des comptes agents avec rôles précis (guichetier, logistique, chauffeur)." },
        { icon: PackageOpen, title: "3. Opérations", desc: "Traitement des colis : Enregistrement, Etiquetage, Groupage, Expédition." },
        { icon: Workflow, title: "4. Monitoring", desc: "Suivi en temps réel des camions et notification clients à l'arrivée." }
    ],
    ctaPrimary: { text: "Digitaliser mon Agence", link: "/agency/register" },
    ctaSecondary: { text: "Demander une Démo", link: "/contact" }
};

// 4. PicknDrop Point -> POINTS RELAIS (SHOPS)
const POINT_DATA: ContentData = {
    themeColor: "red",
    heroImage: "/images/point.jpeg",
    heroTitle: <>Convertissez votre espace<br /><span className="text-red-600">en Point Relais Rentable.</span></>,
    heroSubtitle: "Solution clé-en-main pour boutiques, stations et cybercafés. Devenez un micro-hub logistique et augmentez vos revenus.",
    benefits: [
        { value: "+10 000 FCFA", label: "Commissions" },
        { value: "Trafic", label: "Visibilité" },
        { value: "Auto", label: "Gestion" }
    ],
    featuresTitle: "Gestion de Relais",
    featuresDescription: "Faites de votre commerce le cœur du quartier.",
    features: [
        { icon: Store, title: "Setup Instantané", desc: "Convertit un petit commerce en acteur logistique légitime sans investissement matériel lourd.", tag: "Easy" },
        { icon: ScanLine, title: "Scan & Check", desc: "Processus rapide d'entrée/sortie de colis par scan de QR Code pour réduire les files d'attente.", tag: "Ops" },
        { icon: Wallet, title: "Commissions Auto", desc: "Calcul automatique et transparent des revenus générés par chaque paquet manipulé.", tag: "Revenue" },
        { icon: Briefcase, title: "Multi-Operateur", desc: "Peut évoluer pour gérer plusieurs agents au sein du même point relais.", tag: "Scale" }
    ],
    stepsTitle: "Devenir Partenaire",
    steps: [
        { icon: UserCheck, title: "1. Validation", desc: "Inscription et vérification sommaire de l'emplacement et du stock." },
        { icon: Smartphone, title: "2. Activation", desc: "Téléchargement de l'application 'Point' et configuration des horaires." },
        { icon: Box, title: "3. Réception", desc: "Accueil des livreurs et clients pour dépôt/retrait. Scan obligatoire." },
        { icon: HandCoins, title: "4. Paiement", desc: "Reversement périodique des commissions sur votre mobile money/compte." }
    ],
    ctaPrimary: { text: "Devenir Point Relais", link: "/register?type=point" },
    ctaSecondary: { text: "Conditions & Gains", link: "/pricing" }
};

// 5. PicknDrop Freelancer -> LIVREURS INDÉPENDANTS
const FREELANCE_DATA: ContentData = {
    themeColor: "purple",
    heroImage: "/images/free.jpeg",
    heroTitle: <>L'App des Livreurs<br /><span className="text-purple-600">Professionnels.</span></>,
    heroSubtitle: "Sécurisez vos missions, optimisez vos revenus et construisez votre réputation numérique.",
    benefits: [
        { value: "Pro", label: "Statut" },
        { value: "Secure", label: "Gains" },
        { value: "Maps", label: "Navigation" }
    ],
    featuresTitle: "La Boîte à Outils Pro",
    featuresDescription: "Donner de la crédibilité internationale aux acteurs locaux.",
    features: [
        { icon: Star, title: "Réputation Vérifiée", desc: "Système de notation et d'historique permettant de gagner la confiance des clients.", tag: "Trust" },
        { icon: Map, title: "Route Optimizer", desc: "Calcul des meilleurs itinéraires prenant en compte la complexité urbaine.", tag: "Nav" },
        { icon: Shield, title: "Blockchain Trust", desc: "Toutes les preuves de livraison sont sécurisées pour éviter les litiges (Confidence).", tag: "Secu" },
        { icon: Wallet, title: "Revenu Structuré", desc: "Historique clair des courses et paiements sécurisés via la plateforme.", tag: "Fin" }
    ],
    stepsTitle: "Cycle de Mission",
    steps: [
        { icon: CheckCircle, title: "1. Profiling", desc: "Enregistrement CNI/Permis et véhicule. Validation du statut 'Vérifié'." },
        { icon: Search, title: "2. Matching", desc: "Réception de notification pour des colis proches de votre position." },
        { icon: Truck, title: "3. Livraison", desc: "Navigation assistée jusqu'au client. Preuve de livraison numérique." },
        { icon: Coins, title: "4. Cash-out", desc: "Accès immédiat à votre portefeuille virtuel." }
    ],
    ctaPrimary: { text: "Télécharger l'App", link: "/download" },
    ctaSecondary: { text: "Inscription Chauffeur", link: "/register" }
};

// 6. PicknDrop Market -> RECHERCHE & DÉCOUVERTE
const MARKET_DATA: ContentData = {
    themeColor: "orange",
    heroImage: "/images/market.png",
    heroTitle: <>Le moteur de recherche<br /><span className="text-orange-600">logistique universel.</span></>,
    heroSubtitle: "La vitrine publique pour trouver, comparer et suivre n'importe quel service logistique de l'écosystème.",
    benefits: [
        { value: "100%", label: "Visibilité" },
        { value: "Unified", label: "Tracking" },
        { value: "Smart", label: "Search" }
    ],
    featuresTitle: "Agrégateur de Services",
    featuresDescription: "Tout l'écosystème PicknDrop accessible en un clic.",
    features: [
        { icon: Search, title: "Recherche Unifiée", desc: "Moteur multicritères : trouvez colis, freelances, agences ou points relais.", tag: "Search" },
        { icon: Globe, title: "Tracking Global", desc: "Suivi de bout en bout quel que soit le transporteur, via Code ou QR.", tag: "Track" },
        { icon: Star, title: "Comparateur", desc: "Transparence totale sur les prix, délais et la réputation des prestataires.", tag: "Compare" },
        { icon: Building, title: "Annuaire Pro", desc: "Cartographie interactive des milliers de points de services disponibles.", tag: "Maps" }
    ],
    stepsTitle: "Expérience Utilisateur",
    steps: [
        { icon: Search, title: "1. Besoin", desc: "L'utilisateur cherche 'Livraison Douala' ou un numéro de suivi." },
        { icon: Layers, title: "2. Résultats", desc: "Affichage des meilleures options triées par prix/fiabilité." },
        { icon: CheckCircle, title: "3. Action", desc: "Réservation directe ou tracking en temps réel." },
        { icon: MessageCircle, title: "4. Feedback", desc: "L'utilisateur laisse un avis certifié sur le prestataire." }
    ],
    ctaPrimary: { text: "Explorer le Marché", link: "/marketplace" },
    ctaSecondary: { text: "Suivre un Colis", link: "/tracking" }
};

const CONTENT_MAP: Record<string, ContentData> = {
    'LINK': LINK_DATA, 'GO': GO_DATA, 'AGENCY': AGENCY_DATA,
    'FREELANCE': POINT_DATA, 'LIVREUR': FREELANCE_DATA, 'MARKET': MARKET_DATA
};

// --- HELPERS STYLES ---
const getTheme = (color: string) => {
    const maps: Record<string, any> = {
        orange: { 
            text: 'text-orange-600', 
            bg: 'bg-orange-600', 
            bgLight: 'bg-orange-50 dark:bg-orange-900/20', 
            border: 'border-orange-200 dark:border-orange-800', 
            gradient: 'from-orange-500 to-amber-600',
            shadow: 'shadow-orange-500/30'
        },
        green: { 
            text: 'text-emerald-600', 
            bg: 'bg-emerald-600', 
            bgLight: 'bg-emerald-50 dark:bg-emerald-900/20', 
            border: 'border-emerald-200 dark:border-emerald-800', 
            gradient: 'from-emerald-500 to-green-600',
            shadow: 'shadow-emerald-500/30'
        },
        blue: { 
            text: 'text-blue-600', 
            bg: 'bg-blue-600', 
            bgLight: 'bg-blue-50 dark:bg-blue-900/20', 
            border: 'border-blue-200 dark:border-blue-800', 
            gradient: 'from-blue-500 to-cyan-600',
            shadow: 'shadow-blue-500/30'
        },
        purple: { 
            text: 'text-purple-600', 
            bg: 'bg-purple-600', 
            bgLight: 'bg-purple-50 dark:bg-purple-900/20', 
            border: 'border-purple-200 dark:border-purple-800', 
            gradient: 'from-purple-500 to-indigo-600',
            shadow: 'shadow-purple-500/30'
        },
        red: { 
            text: 'text-red-600', 
            bg: 'bg-red-600', 
            bgLight: 'bg-red-50 dark:bg-red-900/20', 
            border: 'border-red-200 dark:border-red-800', 
            gradient: 'from-red-500 to-rose-600',
            shadow: 'shadow-red-500/30'
        },
    };
    return maps[color] || maps.orange;
};

// --- SOUS-COMPOSANT : CARTE BENTO ---
const BentoCard = ({ feature, theme, idx }: { feature: Feature, theme: any, idx: number }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: idx * 0.1 }}
        whileHover={{ y: -5 }}
        className={`group relative p-6 bg-white dark:bg-slate-900/80 rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all h-full flex flex-col`}
    >
        {/* Decorative Gradient Background */}
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 bg-gradient-to-br ${theme.gradient} transition-opacity blur-2xl`}></div>
        
        {/* Icon Header */}
        <div className="flex justify-between items-start mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.bgLight} group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 ${theme.text}`}/>
            </div>
            {feature.tag && (
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-500 group-hover:${theme.text} transition-colors`}>
                    {feature.tag}
                </span>
            )}
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-600 dark:group-hover:from-white dark:group-hover:to-gray-400">
            {feature.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            {feature.desc}
        </p>
    </motion.div>
);

// --- COMPOSANT PRINCIPAL ---
const LandingContent = () => {
    const searchParams = useSearchParams();
    const roleParam = searchParams.get('role')?.toUpperCase() || 'LINK';
    const [data, setData] = useState<ContentData>(LINK_DATA);

    useEffect(() => {
        if (roleParam && CONTENT_MAP[roleParam]) setData(CONTENT_MAP[roleParam]);
        window.scrollTo({top:0, behavior:'smooth'});
    }, [roleParam]);

    const theme = getTheme(data.themeColor);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020202] text-slate-900 dark:text-slate-200 font-sans selection:bg-gray-800 selection:text-white overflow-hidden">
            <NavbarHome />

            {/* --- HERO SECTION : Compact & Split --- */}
            <section className="relative pt-4 pb-16 lg:pt-20 lg:pb-24 px-4 overflow-visible">
                {/* Background Ambient Lights */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none opacity-40 dark:opacity-20">
                    <motion.div 
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                        className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-b ${theme.gradient} blur-[120px]`}
                    />
                    <div className="absolute top-20 left-20 w-[300px] h-[300px] bg-purple-500/30 rounded-full blur-[80px]" />
                </div>

                <div className="container mx-auto max-w-7xl relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        
                        {/* TEXTE (Left) */}
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
                            className="text-left flex flex-col items-start"
                        >

                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-6 text-slate-900 dark:text-white">
                                {data.heroTitle}
                            </h1>
                            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-lg mb-8">
                                {data.heroSubtitle}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                <Link 
                                    href={data.ctaPrimary.link} 
                                    className={`relative group overflow-hidden px-8 py-4 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-bold shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1`}
                                >
                                    <span className="relative z-10 flex items-center gap-2">{data.ctaPrimary.text} <ArrowRight size={20}/></span>
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                </Link>
                                <Link 
                                    href={data.ctaSecondary.link} 
                                    className="px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-white/5 font-bold hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 transition-all backdrop-blur-md"
                                >
                                    {data.ctaSecondary.text}
                                </Link>
                            </div>

                            {/* Stats Inline */}
                            <div className="mt-12 flex gap-8 border-t border-slate-200 dark:border-slate-800 pt-8 w-full">
                                {data.benefits.map((b, i) => (
                                    <div key={i}>
                                        <p className={`text-2xl font-black ${theme.text}`}>{b.value}</p>
                                        <p className="text-xs font-bold uppercase tracking-wider opacity-60">{b.label}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* VISUEL (Right) - Carte Flottante 3D */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8, rotateY: -15 }} 
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }} 
                            transition={{ duration: 0.8 }}
                            className="relative perspective-1000 group"
                        >
                             <div className="relative aspect-[4/3] rounded-[2.5rem] bg-gray-100 dark:bg-gray-800 overflow-hidden shadow-2xl ring-1 ring-white/10 ring-offset-1 dark:ring-offset-gray-900">
                                <img src={data.heroImage} alt="Hero" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                                
                                {/* Overlay Gradient */}
                                <div className={`absolute inset-0 bg-gradient-to-t ${theme.gradient} mix-blend-color opacity-20 group-hover:opacity-30 transition-opacity`}/>
                                
                                {/* UI Floating Element simulates Dashboard */}
                                <motion.div 
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute bottom-6 left-6 right-6 p-4 bg-white/95 dark:bg-black/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${theme.bg}`}>
                                            <PackageOpen className="text-white w-6 h-6"/>
                                        </div>
                                        <span className="font-bold text-slate-900 dark:text-white text-2xl">Bienvenue sur TiiBnTick 🤗</span>
                                    </div>
                                </motion.div>
                             </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- FEATURES GRID : Bento Style --- */}
            <section className="py-20 relative">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <motion.h2 
                             initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                             className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-slate-900 dark:text-white"
                        >
                            {data.featuresTitle}
                        </motion.h2>
                        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                            {data.featuresDescription}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {data.features.map((feat, idx) => (
                            <BentoCard key={idx} feature={feat} theme={theme} idx={idx} />
                        ))}
                    </div>
                </div>
            </section>

            {/* --- WORKFLOW STEPS : Timeline --- */}
            <section className="py-20 bg-slate-100 dark:bg-slate-900/50">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="mb-12 md:flex justify-between items-end">
                         <div>
                             <span className={`text-xs font-black uppercase tracking-[0.2em] ${theme.text}`}>Workflow</span>
                             <h2 className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{data.stepsTitle}</h2>
                         </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -z-10"></div>
                        
                        {data.steps.map((step, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.15 }}
                                className="relative bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
                            >
                                <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center text-white shadow-lg ${theme.bg}`}>
                                    <span className="font-black text-lg">{idx + 1}</span>
                                </div>
                                <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">{step.title}</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FOOTER CTA : Compact --- */}
            <section className="py-24 px-4">
                <div className="container mx-auto max-w-5xl">
                    <motion.div 
                        whileHover={{ scale: 1.01 }}
                        className={`rounded-[3rem] p-12 text-center text-white bg-gradient-to-br ${theme.gradient} relative overflow-hidden shadow-2xl shadow-${theme.themeColor}-900/20`}
                    >
                         {/* Abstract BG */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white blur-[100px] opacity-20"></div>

                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">Prêt à transformer votre logistique ?</h2>
                            <p className="text-lg opacity-90 mb-8 font-medium">Rejoignez la plateforme business et accédez immédiatement aux outils pour rémunerer votre local, votre personnel ou mieux : votre disponibilité.</p>
                            
                            <div className="flex justify-center gap-4">
                                <Link 
                                   href={data.ctaPrimary.link}
                                   className="px-8 py-4 bg-white text-slate-900 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
                                >
                                    Commencer
                                </Link>
                                <Link 
                                    href="/contact"
                                    className="px-8 py-4 bg-black/20 text-white border border-white/20 rounded-xl font-bold hover:bg-black/30 transition-colors"
                                >
                                    Contact
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
            
            <Footer />
        </div>
    );
};

// Fallback Suspense
const Loader = () => (
    <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="animate-spin text-slate-400 w-8 h-8"/>
    </div>
);

export default function LandingPage() {
    return (
        <Suspense fallback={<Loader />}>
            <LandingContent />
        </Suspense>
    );
}
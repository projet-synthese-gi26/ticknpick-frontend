'use client';

import React from 'react';
import Link from 'next/link';
import NavbarHome from '@/components/NavbarHome'; // Composant réutilisable
import Footer from '@/components/FooterHome'; // Composant réutilisable
import { Shield, Truck, MapPin, Search, ClipboardPenLine, Box, Map, Smile, Star } from 'lucide-react';
import { motion } from 'framer-motion';

// --- COMPOSANTS INTÉGRÉS DANS LA PAGE ---

const Banniere = () => (
  <section className="relative h-[80vh] min-h-[500px] flex items-center justify-center text-white text-center pt-20 bg-orange-500">
    <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{backgroundImage: "url('/images/cameroon_map.svg')"}}></div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent"></div>
    <div className="relative z-10 p-6">
      <motion.h1 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
        className="text-4xl md:text-6xl font-black tracking-tight"
      >
        L'envoi de colis au Cameroun,
        <span className="block text-amber-300 mt-2">simplifié.</span>
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-6 max-w-2xl mx-auto text-lg md:text-xl opacity-90"
      >
        Déposez, suivez et recevez vos paquets dans notre réseau national de points relais. Rapide, fiable et abordable.
      </motion.p>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
        className="mt-10"
      >
        <Link 
          href="/expedition" 
          className="bg-white text-orange-600 px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:bg-gray-100 transition-transform transform hover:scale-105"
        >
          Envoyer un Colis
        </Link>
      </motion.div>
    </div>
  </section>
);

const Features = () => {
    const featuresList = [
      { icon: <MapPin className="w-8 h-8 text-orange-600"/>, title: "Réseau National", description: "Des centaines de points relais accessibles partout au Cameroun, même dans votre quartier." },
      { icon: <Search className="w-8 h-8 text-orange-600"/>, title: "Suivi en Temps Réel", description: "Sachez toujours où se trouve votre colis, de l'expédition à la livraison finale." },
      { icon: <Shield className="w-8 h-8 text-orange-600"/>, title: "Sécurité Garantie", description: "Vos colis sont traités avec le plus grand soin et assurés contre les imprévus." },
      { icon: <Truck className="w-8 h-8 text-orange-600"/>, title: "Livraison Rapide", description: "Des options de livraison express pour vos envois les plus urgents à travers le pays." }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuresList.map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-gray-100"
                >
                    <div className="bg-orange-100 p-4 rounded-full inline-block mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                </motion.div>
            ))}
        </div>
    );
};

const Manual = () => {
    const steps = [
        { num: 1, icon: <ClipboardPenLine className="w-8 h-8 text-white"/>, title: "Décrivez votre colis", description: "Remplissez un formulaire simple en ligne pour nous dire ce que vous envoyez." },
        { num: 2, icon: <Box className="w-8 h-8 text-white"/>, title: "Déposez au point relais", description: "Choisissez le point relais le plus proche et déposez-y votre colis bien emballé." },
        { num: 3, icon: <Map className="w-8 h-8 text-white"/>, title: "Suivez son voyage", description: "Recevez des notifications et suivez en direct l'acheminement de votre colis." },
        { num: 4, icon: <Smile className="w-8 h-8 text-white"/>, title: "Le destinataire est notifié", description: "Votre destinataire reçoit un SMS dès que le colis est disponible pour le retrait." }
    ];

    return (
        <div className="relative">
            {/* Ligne de connexion pour le desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-orange-200 -translate-y-1/2 -mt-16"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
                {steps.map((step, index) => (
                    <div key={index} className="text-center">
                        <div className="relative mb-6">
                           <div className="bg-gradient-to-br from-orange-500 to-amber-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg relative z-10">
                              {step.icon}
                           </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Étape {step.num}: {step.title}</h3>
                        <p className="text-gray-600">{step.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- LE COMPOSANT DE LA PAGE PRINCIPALE ---

export default function Home() {
  return (
    <div className="w-full">
      <NavbarHome />
      <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)]">
        <main className="flex-grow">
          <Banniere />
          
          <section className="py-12 md:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                Vos colis en de bonnes mains, <br />
                <span className="text-orange-600">partout au Cameroun</span> 📦
              </h1>
              <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                PicknDrop révolutionne l'acheminement de colis avec un vaste réseau de points relais,
                une logistique simplifiée et des tarifs compétitifs.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/expedition" 
                  className="bg-orange-600 text-white px-8 py-4 rounded-full hover:bg-orange-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Envoyer un colis
                </Link>
                <Link 
                  href="/register" 
                  className="bg-white border-2 border-orange-600 text-orange-600 px-8 py-4 rounded-full hover:bg-orange-50 transition-colors font-semibold text-lg"
                >
                  Devenir Point Relais
                </Link>
              </div>
            </div>
          </section>

          <section className="py-16 md:py-24 bg-orange-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">🌟 Nos services exceptionnels 🌟</h2>
                <p className="mt-4 text-lg text-gray-600">Découvrez comment PicknDrop transforme l'expérience d'envoi et de réception de colis</p>
              </div>
              <Features />
            </div>
          </section>

          <section id="how-it-works" className="py-16 md:py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">🚚 Comment ça marche ? 🚚</h2>
                <p className="mt-4 text-lg text-gray-600">Envoyez vos colis partout au Cameroun en 4 étapes simples et rapides</p>
              </div>
              <Manual />
            </div>
          </section>
          
          <section className="py-16 bg-orange-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold">Prêt à expédier votre premier colis ?</h2>
              <p className="mt-4 text-xl max-w-3xl mx-auto opacity-90">
                Pas besoin de compte ! Démarrez votre expédition en quelques clics et déposez votre colis dans le point relais le plus proche.
              </p>
              <div className="mt-8">
                <Link 
                  href="/expedition" 
                  className="bg-white text-orange-600 px-10 py-5 rounded-full hover:bg-gray-100 transition-all duration-300 font-bold text-lg shadow-2xl transform hover:-translate-y-1"
                >
                  Commencer une Expédition
                </Link>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};
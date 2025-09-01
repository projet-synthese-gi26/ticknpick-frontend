'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NavbarHome() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Détection du mode sombre du système
    const checkDarkMode = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
      // Applique la classe dark au document
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Vérification initiale
    checkDarkMode();

    // Écoute les changements de préférence système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);

    return () => {
      mediaQuery.removeEventListener('change', checkDarkMode);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled || isOpen 
        ? 'bg-white/95 dark:bg-gray-900/95 shadow-lg backdrop-blur-md' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-orange-500 dark:bg-orange-600 p-2 rounded-lg shadow-md">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">PicknDrop</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/expedition" 
              className="text-gray-600 dark:text-gray-300 font-semibold hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Envoyer un colis
            </Link>
            <Link 
              href="/track-package" 
              className="text-gray-600 dark:text-gray-300 font-semibold hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Retrouver mon colis
            </Link>
            <Link 
              href="#how-it-works" 
              className="text-gray-600 dark:text-gray-300 font-semibold hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Comment ça marche
            </Link>
            <Link 
              href="/login" 
              className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 font-bold px-5 py-2 rounded-full hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
            >
              Espace PRO
            </Link>
          </nav>

          <div className="md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>
           
      {/* Menu mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white dark:bg-gray-900 shadow-lg absolute top-full left-0 right-0 border-t dark:border-gray-700"
          >
            <div className="flex flex-col items-center gap-6 p-6">
              <Link 
                href="/expedition" 
                onClick={() => setIsOpen(false)} 
                className="text-gray-700 dark:text-gray-300 font-semibold text-lg hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                Envoyer un colis
              </Link>
              <Link 
                href="/track-package" 
                onClick={() => setIsOpen(false)} 
                className="text-gray-700 dark:text-gray-300 font-semibold text-lg hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                Retrouver mon colis
              </Link>
              <Link 
                href="#how-it-works" 
                onClick={() => setIsOpen(false)} 
                className="text-gray-700 dark:text-gray-300 font-semibold text-lg hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                Comment ça marche
              </Link>
              <Link 
                href="/login" 
                onClick={() => setIsOpen(false)} 
                className="bg-orange-500 dark:bg-orange-600 hover:bg-orange-600 dark:hover:bg-orange-700 text-white font-bold w-full text-center py-3 rounded-full mt-2 transition-colors"
              >
                Devenir PRO
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
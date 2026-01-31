'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation'; // Ajout pour lire l'URL
import { 
  Package, 
  Send, 
  Search, 
  DollarSign, 
  ShoppingCart, 
  HelpCircle, 
  User,
  Home,
  Menu,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationCenter from './ui/NotificationCenter';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  id: string;
}

// Configuration des Thèmes de couleurs
// Cela permet de changer dynamiquement les classes Tailwind
type ThemeColors = {
  logoBg: string;           // Fond du logo
  text: string;             // Texte coloré principal
  textHoverNav: string;     // Hover des liens nav desktop (sur fond sombre/transparent)
  bgLight: string;          // Fonds légers (boutons secondaires)
  textDark: string;         // Texte foncé sur fonds légers
  btnHover: string;         // Hover boutons secondaires
  border: string;           // Bordures (si utilisées)
  mobileActiveIcon: string; // Couleur icône active mobile
  mobileActiveText: string; // Texte actif mobile
};

const THEMES: Record<string, ThemeColors> = {
  ORANGE: {
    logoBg: 'bg-orange-500 dark:bg-orange-600',
    text: 'text-orange-500',
    textHoverNav: 'hover:text-orange-200 dark:hover:text-orange-400',
    bgLight: 'bg-orange-100 dark:bg-orange-900',
    textDark: 'text-orange-700 dark:text-orange-300',
    btnHover: 'hover:bg-orange-200 dark:hover:bg-orange-800',
    border: 'border-orange-500',
    mobileActiveIcon: 'text-orange-500 dark:text-orange-400',
    mobileActiveText: 'text-orange-500 dark:text-orange-400'
  },
  VIOLET: {
    logoBg: 'bg-violet-600',
    text: 'text-violet-600',
    textHoverNav: 'hover:text-violet-300 dark:hover:text-violet-400',
    bgLight: 'bg-violet-100 dark:bg-violet-900',
    textDark: 'text-violet-700 dark:text-violet-300',
    btnHover: 'hover:bg-violet-200 dark:hover:bg-violet-800',
    border: 'border-violet-600',
    mobileActiveIcon: 'text-violet-600 dark:text-violet-400',
    mobileActiveText: 'text-violet-600 dark:text-violet-400'
  },
  BLUE: {
    logoBg: 'bg-blue-600',
    text: 'text-blue-600',
    textHoverNav: 'hover:text-blue-300 dark:hover:text-blue-400',
    bgLight: 'bg-blue-100 dark:bg-blue-900',
    textDark: 'text-blue-700 dark:text-blue-300',
    btnHover: 'hover:bg-blue-200 dark:hover:bg-blue-800',
    border: 'border-blue-600',
    mobileActiveIcon: 'text-blue-600 dark:text-blue-400',
    mobileActiveText: 'text-blue-600 dark:text-blue-400'
  },
  EMERALD: { // Pour Go
    logoBg: 'bg-emerald-600',
    text: 'text-emerald-600',
    textHoverNav: 'hover:text-emerald-300 dark:hover:text-emerald-400',
    bgLight: 'bg-emerald-100 dark:bg-emerald-900',
    textDark: 'text-emerald-700 dark:text-emerald-300',
    btnHover: 'hover:bg-emerald-200 dark:hover:bg-emerald-800',
    border: 'border-emerald-600',
    mobileActiveIcon: 'text-emerald-600 dark:text-emerald-400',
    mobileActiveText: 'text-emerald-600 dark:text-emerald-400'
  },
  RED: { // Pour Point Relais
    logoBg: 'bg-red-600',
    text: 'text-red-600',
    textHoverNav: 'hover:text-red-300 dark:hover:text-red-400',
    bgLight: 'bg-red-100 dark:bg-red-900',
    textDark: 'text-red-700 dark:text-red-300',
    btnHover: 'hover:bg-red-200 dark:hover:bg-red-800',
    border: 'border-red-600',
    mobileActiveIcon: 'text-red-600 dark:text-red-400',
    mobileActiveText: 'text-red-600 dark:text-red-400'
  }
};

export default function NavbarHome() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const searchParams = useSearchParams();

  // --- LOGIQUE DE DÉTECTION DU THÈME ---
  const currentTheme = useMemo(() => {
    // On lit le paramètre ?role=... de l'URL
    const roleParam = searchParams.get('role')?.toUpperCase();
    
    switch (roleParam) {
      case 'LIVREUR':
      case 'FREELANCER':
        return THEMES.VIOLET;
      case 'AGENCY':
        return THEMES.BLUE;
      case 'GO':
        return THEMES.EMERALD;
      case 'POINT':
      case 'FREELANCE':
        return THEMES.RED;
      case 'LINK':
      case 'MARKET':
      default:
        return THEMES.ORANGE; // Défaut
    }
  }, [searchParams]);

  // Gestion Scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems: NavigationItem[] = [
    { href: '/', label: 'Accueil', icon: Home, id: 'home' },
    { href: '/expedition', label: 'Envoyer un colis', icon: Send, id: 'send' },
    { href: '/track-package', label: 'Retrouver mon colis', icon: Search, id: 'track' },
    { href: '/pricing', label: 'Grille tarifaire', icon: DollarSign, id: 'pricing' },
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingCart, id: 'marketplace' },
    { href: '#how-it-works', label: 'Aide', icon: HelpCircle, id: 'help' },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Desktop Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isOpen 
          ? 'bg-white/95 dark:bg-gray-900/95 shadow-lg backdrop-blur-md' 
          : 'bg-transparent backdrop-blur-xl'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            
            {/* Logo Dynamique */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className={`${currentTheme.logoBg} p-2 rounded-lg shadow-md transition-colors duration-300`}>
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-300 dark:text-gray-100">
                TiiBnTick
              </span>
            </Link>

            {/* Desktop Navigation Dynamique */}
            <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
              <NotificationCenter />
              {navigationItems.slice(1, -1).map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link 
                    key={item.id}
                    href={item.href} 
                    className={`flex items-center gap-2 text-gray-300 dark:text-gray-300 font-semibold ${currentTheme.textHoverNav} transition-colors group`}
                  >
                    <IconComponent className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Help Link */}
              <Link 
                href="#how-it-works" 
                className={`flex items-center gap-2 text-gray-300 dark:text-gray-300 font-semibold ${currentTheme.textHoverNav} transition-colors group`}
              >
                <HelpCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden xl:inline">Aide</span>
              </Link>

              {/* Account Button Dynamique */}
              <Link 
                href="/login" 
                className={`flex items-center gap-2 ${currentTheme.bgLight} ${currentTheme.textDark} ${currentTheme.btnHover} font-bold px-3 py-2 xl:px-5 xl:py-2 rounded-full transition-colors group`}
              >
                <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden xl:inline">Mon compte</span>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-2">
              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors p-2"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
             
        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden bg-white dark:bg-gray-900 shadow-lg absolute top-full left-0 right-0 border-t dark:border-gray-700"
            >
              <div className="flex flex-col gap-1 p-4 pb-20"> 
                {navigationItems.slice(1).map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link 
                      key={item.id}
                      href={item.href} 
                      onClick={() => setIsOpen(false)} 
                      className={`flex items-center gap-3 text-gray-700 dark:text-gray-300 font-semibold text-base hover:${currentTheme.text} ${currentTheme.btnHover} p-3 rounded-lg transition-colors`}
                    >
                      <IconComponent className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
                <Link 
                  href="/login" 
                  onClick={() => setIsOpen(false)} 
                  className={`flex items-center justify-center gap-3 ${currentTheme.logoBg} hover:opacity-90 text-white font-bold py-3 rounded-lg mt-2 transition-colors`}
                >
                  <User className="w-5 h-5" />
                  Mon compte TiiBnTick
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Bottom Navigation Dynamique */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex justify-around items-center py-2">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => handleTabClick(item.id)}
                className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 transition-colors ${
                  isActive 
                    ? currentTheme.mobileActiveText 
                    : `text-gray-500 dark:text-gray-400 hover:${currentTheme.text}`
                }`}
              >
                <div className={`p-1 rounded-lg transition-all ${
                  isActive ? currentTheme.bgLight : ''
                }`}>
                  <IconComponent className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                </div>
                <span className="text-xs mt-1 font-medium truncate max-w-full">
                  {item.label === 'Retrouver mon colis' ? 'Suivi' : 
                   item.label === 'Grille tarifaire' ? 'Tarifs' :
                   item.label === 'Envoyer un colis' ? 'Envoi' :
                   item.label}
                </span>
              </Link>
            );
          })}
          
          {/* Account Tab */}
          <Link
            href="/login"
            onClick={() => handleTabClick('account')}
            className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 transition-colors ${
              activeTab === 'account' 
                ? currentTheme.mobileActiveText
                : `text-gray-500 dark:text-gray-400 hover:${currentTheme.text}`
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${
              activeTab === 'account' ? currentTheme.bgLight : ''
            }`}>
              <User className={`w-5 h-5 ${activeTab === 'account' ? 'scale-110' : ''} transition-transform`} />
            </div>
            <span className="text-xs mt-1 font-medium">Compte</span>
          </Link>
        </div>
      </nav>

      <div className="lg:hidden h-20"></div>
    </>
  );
}
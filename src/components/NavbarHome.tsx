'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Globe,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types pour TypeScript
type LanguageCode = 'FR' | 'EN' | 'DE' | 'ES' | 'AR' | 'MORE';

interface Language {
  code: LanguageCode;
  name: string;
  flag: string;
}

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  id: string;
}

export default function NavbarHome() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('FR');

  // Langues disponibles
  const languages: Language[] = [
    { code: 'FR', name: 'Français', flag: '🇫🇷' },
    { code: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ES', name: 'Español', flag: '🇪🇸' },
    { code: 'AR', name: 'العربية', flag: '🇸🇦' },
    { code: 'MORE', name: 'Plus...', flag: '🌍' }
  ];

  // Navigation items avec icônes
  const navigationItems: NavigationItem[] = [
    { href: '/', label: 'Accueil', icon: Home, id: 'home' },
    { href: '/expedition', label: 'Envoyer un colis', icon: Send, id: 'send' },
    { href: '/track-package', label: 'Retrouver mon colis', icon: Search, id: 'track' },
    { href: '/pricing', label: 'Grille tarifaire', icon: DollarSign, id: 'pricing' },
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingCart, id: 'marketplace' },
    { href: '#how-it-works', label: 'Aide', icon: HelpCircle, id: 'help' },
  ];

  // Fonction de traduction automatique
  const translatePage = (langCode: LanguageCode) => { 
    if (langCode === 'MORE') {
      // Ouvrir Google Translate pour plus d'options
      window.open('https://translate.google.com/translate?sl=auto&tl=auto&u=' + encodeURIComponent(window.location.href), '_blank');
      return;
    }

    const langMap: Record<Exclude<LanguageCode, 'MORE'>, string> = {
      'FR': 'fr',
      'EN': 'en',
      'DE': 'de',
      'ES': 'es',
      'AR': 'ar'
    };

    const targetLang = langMap[langCode as Exclude<LanguageCode, 'MORE'>];
    
    if (targetLang && targetLang !== 'fr') {
      // Utilise Google Translate pour traduire la page
      const googleTranslateUrl = `https://translate.google.com/translate?sl=fr&tl=${targetLang}&u=${encodeURIComponent(window.location.href)}`;
      window.location.href = googleTranslateUrl;
    } else if (targetLang === 'fr') {
      // Retour à la version française originale
      window.location.reload();
    }
  };

  const handleLanguageChange = (langCode: LanguageCode, langName: string) => {
    setCurrentLanguage(langCode);
    setIsLanguageOpen(false);
    translatePage(langCode);
    
    // Sauvegarde la préférence
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', langCode);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Récupération de la langue préférée
    const savedLang = localStorage.getItem('preferredLanguage') as LanguageCode | null;
    if (savedLang && languages.some(lang => lang.code === savedLang)) {
      setCurrentLanguage(savedLang);
    }

    // Détection du mode sombre du système
    const checkDarkMode = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    checkDarkMode();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);

    // Fermer le menu langue si on clique ailleurs
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element)?.closest('.language-dropdown')) {
        setIsLanguageOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);

    return () => {
      mediaQuery.removeEventListener('change', checkDarkMode);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  const getCurrentLanguageData = (): Language => {
    return languages.find(lang => lang.code === currentLanguage) || languages[0];
  };

  return (
    <>
      {/* Desktop Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isOpen 
          ? 'bg-white/95 dark:bg-gray-900/95 shadow-lg backdrop-blur-md' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="bg-orange-500 dark:bg-orange-600 p-2 rounded-lg shadow-md">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                PicknDrop
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
              {navigationItems.slice(1, -1).map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link 
                    key={item.id}
                    href={item.href} 
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-semibold hover:text-orange-200 dark:hover:text-orange-400 transition-colors group"
                  >
                    <IconComponent className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Help Link */}
              <Link 
                href="#how-it-works" 
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-semibold hover:text-orange-200 dark:hover:text-orange-400 transition-colors group"
              >
                <HelpCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden xl:inline">Aide</span>
              </Link>

              {/* Language Selector */}
              <div className="relative language-dropdown">
                <button
                  onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-semibold hover:text-orange-200 dark:hover:text-orange-400 transition-colors group"
                >
                  <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="hidden xl:inline">{getCurrentLanguageData().flag} {getCurrentLanguageData().code}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isLanguageOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-2"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code, lang.name)}
                          className={`w-full text-left px-4 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-3 ${
                            currentLanguage === lang.code ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className="text-lg">{lang.flag}</span>
                          <span className="font-medium">{lang.name}</span>
                          {currentLanguage === lang.code && <span className="ml-auto text-orange-500">✓</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Account Button */}
              <Link 
                href="/login" 
                className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 font-bold px-3 py-2 xl:px-5 xl:py-2 rounded-full hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors group"
              >
                <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden xl:inline">Mon compte</span>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-2">
              {/* Mobile Language Selector */}
              <div className="relative language-dropdown">
                <button
                  onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                  className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-orange-200 dark:hover:text-orange-400 transition-colors p-2"
                >
                  <Globe className="w-5 h-5" />
                  <span className="text-sm">{getCurrentLanguageData().flag}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isLanguageOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-2"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code, lang.name)}
                          className={`w-full text-left px-3 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-2 text-sm ${
                            currentLanguage === lang.code ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span className="font-medium">{lang.name}</span>
                          {currentLanguage === lang.code && <span className="ml-auto text-orange-500 text-xs">✓</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Menu Button */}
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
              <div className="flex flex-col gap-1 p-4 pb-20"> {/* Ajout de padding-bottom pour l'espace de navigation */}
                {navigationItems.slice(1).map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link 
                      key={item.id}
                      href={item.href} 
                      onClick={() => setIsOpen(false)} 
                      className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-semibold text-base hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 p-3 rounded-lg transition-colors"
                    >
                      <IconComponent className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
                <Link 
                  href="/login" 
                  onClick={() => setIsOpen(false)} 
                  className="flex items-center justify-center gap-3 bg-orange-500 dark:bg-orange-600 hover:bg-orange-600 dark:hover:bg-orange-700 text-white font-bold py-3 rounded-lg mt-2 transition-colors"
                >
                  <User className="w-5 h-5" />
                  Mon compte PicknDrop
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Bottom Navigation */}
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
                    ? 'text-orange-500 dark:text-orange-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400'
                }`}
              >
                <div className={`p-1 rounded-lg transition-all ${
                  isActive ? 'bg-orange-100 dark:bg-orange-900/30' : ''
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
                ? 'text-orange-500 dark:text-orange-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${
              activeTab === 'account' ? 'bg-orange-100 dark:bg-orange-900/30' : ''
            }`}>
              <User className={`w-5 h-5 ${activeTab === 'account' ? 'scale-110' : ''} transition-transform`} />
            </div>
            <span className="text-xs mt-1 font-medium">Compte</span>
          </Link>
        </div>
      </nav>

      {/* Spacer pour éviter que le contenu soit caché par la navigation mobile */}
      <div className="lg:hidden h-20"></div>
    </>
  );
}
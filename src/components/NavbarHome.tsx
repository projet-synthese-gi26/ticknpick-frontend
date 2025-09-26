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


  // Navigation items avec icônes
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
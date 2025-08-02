// components/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Home,
  PackagePlus,
  MapPin,
  PackageCheck,
  PackageOpen,
  CloudLightning,
  Menu,
  X,
  Box,
  Settings,
  Truck,
  Send,
  MapPinHouse,
  Warehouse,
  User, // Icône pour le logo
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/home', label: 'Accueil', icon: Home },
  { href: '/emit-package', label: 'Dépôt', icon: PackagePlus },
  { href: '/withdraw-package', label: 'Retrait', icon: PackageOpen },
  { href: '/dashboard', label: 'Mon Compte', icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Ferme le menu quand on clique sur un lien (pour mobile)
  const handleLinkClick = () => {
    if (isOpen) {
      setIsOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out 
                  ${isScrolled || isOpen ? 'bg-white/95 shadow-2xl backdrop-blur-md ' : 'bg-white border-b border-gray-300 border-2 shadow-xl'}`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/PickDropPoint/app/home" className="flex items-center space-x-2 group">
            <MapPinHouse className={`h-8 w-8 transition-colors duration-300 ${isScrolled || isOpen ? 'text-green-600' : 'text-gray-700 group-hover:text-green-600'}`} />
            <span
              className={`text-3xl font-bold transition-colors duration-300 
                         ${isScrolled || isOpen ? 'text-green-700' : 'text-gray-800 group-hover:text-green-700'}`}
            >
              PicknDrop Point
            </span>
          </Link>

          {/* Navigation pour grands écrans */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out group
                              ${isActive
                                ? 'bg-green-100 text-green-700 shadow-sm'
                                : `${isScrolled || isOpen ? 'text-gray-700 hover:text-green-600 hover:bg-green-50' : 'text-gray-600 hover:text-green-700 hover:bg-white/20'}`
                              }`}
                >
                  <div className="flex items-center space-x-2">
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-green-600' : 'text-gray-500 group-hover:text-green-500'}`} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Bouton Menu Burger pour petits écrans */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className={`inline-flex items-center justify-center p-2 rounded-md transition-colors duration-300
                          ${isScrolled || isOpen ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-600 hover:text-gray-700 hover:bg-white/30'}`}
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Ouvrir le menu principal</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-screen opacity-100 shadow-xl border-t border-gray-200' : 'max-h-0 opacity-0'
          }`}
        id="mobile-menu"
        style={{ backgroundColor: isOpen && isScrolled ? 'rgba(255,255,255,0.95)' : isOpen ? 'rgba(255,255,255,0.98)' : 'transparent' }} // Assure un fond solide si ouvert
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/PickDropPoint/app' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={handleLinkClick} // Ferme le menu au clic
                className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors duration-200
                            ${isActive ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                  }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className={`h-6 w-6 ${isActive ? 'text-green-600' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
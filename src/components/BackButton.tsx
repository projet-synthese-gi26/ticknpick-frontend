'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftCircle, Home } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function FloatingBackButton() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Éviter l'hydratation mismatch en ne rendant pas côté serveur
  if (!mounted) {
    return null;
  }
  
  // Ne pas afficher le bouton si nous sommes déjà sur la page d'accueil
  if (pathname === '/') {
    return null;
  }
  
  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50">
      <Link
        href="/"
        className="group flex items-center bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white rounded-full shadow-2xl hover:shadow-emerald-500/25 focus:outline-none focus:ring-4 focus:ring-emerald-300/50 transition-all duration-300 ease-out transform hover:scale-105 hover:-translate-x-1 active:scale-95 backdrop-blur-sm border border-white/20"
        aria-label="Retour à l'accueil Pick & Drop"
      >
        {/* Partie icône - toujours visible */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-white/20 to-transparent">
          <Home 
            size={24} 
            className="text-white group-hover:rotate-12 transition-all duration-300 ease-out drop-shadow-sm" 
          />
        </div>
        
        {/* Partie texte - se déploie au hover */}
        <div className="overflow-hidden max-w-0 group-hover:max-w-xs transition-all duration-300 ease-out">
          <span className="inline-block px-4 py-2 text-sm font-semibold tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
            Retour à Pick&Drop
          </span>
        </div>
        
        {/* Effet de brillance au hover */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300"></div>
        
        {/* Petite flèche indicatrice */}
        <ArrowLeftCircle 
          size={16} 
          className="absolute -right-2 top-1/2 -translate-y-1/2 text-emerald-400 opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-300 delay-100" 
        />
      </Link>
      
      {/* Effet d'ombre animée */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 -z-10 scale-110"></div>
    </div>
  );
}
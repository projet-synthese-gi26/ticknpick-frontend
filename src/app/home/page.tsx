// FICHIER : src/app/home/page.tsx
'use client';

import { PackagePlus, PackageOpen, User, MapPinHouse, Truck, Search, Archive, Package, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/userservice';

// --- TYPES ET INTERFACES ---

type UIAccountType = 'CLIENT' | 'LIVREUR' | 'FREELANCE' | 'AGENCY' | 'ADMIN';

// Interface utilisée pour l'état local de la page Home
interface CurrentUser {
  name: string;
  email?: string;
  role: UIAccountType;
}

interface Service {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  color: string;
}

interface PageConfig {
  title: string;
  services: Service[];
  welcomeMessage: string;
  mainIcon: ReactNode;
}

// === FONCTION CRUCIALE : NORMALISATION DES DONNÉES ===
const normalizeProfile = (apiData: any) => {
  console.log(">>> Données Reçues pour Normalisation :", apiData); 

  let finalAccountType: UIAccountType = 'CLIENT';
  const rawType = apiData.account_type || apiData.accountType || 'CLIENT';

  // Recherche du sous-type dans toutes les orthographes possibles
  const rawSubType = apiData.businessActorType || apiData.business_actor_type || '';
  const subType = rawSubType.toUpperCase();

  console.log(`>>> Analyse Type: ${rawType}, Sous-Type: ${subType}`);

  // LOGIQUE INTELLIGENTE POUR DÉTECTER LE RÔLE RÉEL
  if (rawType === 'BUSINESS_ACTOR') {
      if (subType === 'DELIVERER') finalAccountType = 'LIVREUR';
      else if (subType === 'AGENCY_OWNER') finalAccountType = 'AGENCY'; // Le propriétaire devient "AGENCY" pour le dashboard
      else if (subType === 'AGENCY') finalAccountType = 'AGENCY'; 
      else if (subType === 'FREELANCE') finalAccountType = 'FREELANCE';
      else if (subType === 'EMPLOYEE') finalAccountType = 'AGENCY'; // Employé d'agence voit le dashboard Agence
      else {
          console.warn("⚠️ Business Actor sans sous-type reconnu. Valeur reçue:", rawSubType);
          // Fallback : Si le nom sonne comme une entreprise, c'est peut-être une Agence
          if (apiData.businessName || apiData.business_name) finalAccountType = 'AGENCY'; 
          else finalAccountType = 'FREELANCE';
      }
  } else if (rawType === 'ADMIN' || rawType === 'SUPERADMIN') {
      finalAccountType = 'ADMIN';
  } else {
      finalAccountType = 'CLIENT';
  }

  return {
    ...apiData,
    id: apiData.id,
    account_type: finalAccountType, 
    email: apiData.email,
    // Priorité au nom commercial, sinon nom personnel, sinon partie email
    manager_name: apiData.businessName || apiData.business_name || apiData.name || apiData.email?.split('@')[0],
    name: apiData.name || apiData.manager_name || 'Utilisateur',
  };
};

// --- COMPOSANT PRINCIPAL ---
export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, logout, user: authUser } = useAuth();

  const [isVisible, setIsVisible] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated || !authUser) {
      // Optionnel: rediriger si pas connecté, mais ici on laisse le template gérer
      return;
    }

    const fetchUserData = async () => {
        try {
            console.log(`🔍 Session valide pour l'utilisateur ID: ${authUser.id}`);
            
            // 1. Appel API
            const rawProfile = await userService.getProfileById(authUser.id);
            
            // 2. Normalisation des données
            const profile = normalizeProfile(rawProfile);

            const userRole = profile.account_type;
            
            // Redirection Admin
            if (userRole === 'ADMIN') {
                console.log('👑 Admin détecté, redirection vers /superadmin...');
                router.push('/superadmin');
                return;
            }

            console.log('✅ Profil chargé et normalisé:', profile.manager_name);
            
            setUser({ 
                // On utilise manager_name qui contient le "Business Name" pour les Pros, ou le Nom pour les Clients
                name: profile.manager_name, 
                email: profile.email, 
                role: userRole 
            });
            
            setIsVisible(true);
            
        } catch (error: any) {
            console.error('💥 Erreur lors de la récupération du profil via le backend:', error);
            // En cas d'erreur API, on évite de logout brutalement pour l'UX, on peut laisser l'utilisateur réessayer ou voir un état d'erreur
            // logout(); 
        } finally {
            setIsLoading(false);
        }
    };

    fetchUserData();
  }, [isAuthLoading, isAuthenticated, authUser, router, logout]);
  
  
  // --- CONFIGURATION DYNAMIQUE DU CONTENU ---
  const pageConfig: PageConfig | null = useMemo(() => {
    if (!user) return null;

    console.log('🎯 Configuration de la page pour le rôle:', user.role);

    let config: PageConfig;

    switch (user.role) {
      case 'CLIENT':
        config = {
          title: "TiiBnTick Link",
          welcomeMessage: "votre espace personnel pour gérer vos envois.",
          mainIcon: <Package className='text-white h-12 w-12' />,
          services: [
            { title: "Envoyer un colis", description: "Initiez une nouvelle expédition rapidement.", href: "/expedition", icon: <PackagePlus className="h-8 w-8 text-white" />, color: "from-orange-400 to-orange-500" },
            { title: "Retrouver un colis", description: "Suivez votre colis en temps réel.", href: "/track-package", icon: <Search className="h-8 w-8 text-white" />, color: "from-amber-400 to-amber-500" },
            { title: "Mon compte", description: "Gérez votre profil et vos informations.", href: "/dashboard", icon: <User className="h-8 w-8 text-white" />, color: "from-orange-500 to-amber-600" },
          ]
        };
        break;
      
      case 'LIVREUR':
        config = {
          title: "TiiBnTick Deliver",
          welcomeMessage: "dans votre espace de gestion des livraisons.",
          mainIcon: <Truck className='text-white h-12 w-12' />,
          services: [
            { title: "Récupérer un colis", description: "Consultez les colis à récupérer aux points relais.", href: "/collect-package", icon: <Archive className="h-8 w-8 text-white" />, color: "from-orange-400 to-orange-500" },
            { title: "Déposer un colis", description: "Validez la livraison d'un colis à destination.", href: "/drop-package", icon: <PackageOpen className="h-8 w-8 text-white" />, color: "from-amber-400 to-amber-500" },
            { title: "Mon compte", description: "Suivez vos courses et vos performances.", href: "/dashboard", icon: <User className="h-8 w-8 text-white" />, color: "from-orange-500 to-amber-600" },
          ]
        };
        break;

      case 'AGENCY':
        config = {
          title: "TiiBnTick Agency", // Titre spécifique Agence
          welcomeMessage: "dans votre centre de gestion logistique.",
          mainIcon: <Building2 className='text-white h-12 w-12' />,
          services: [
            { title: "Gestion Flotte", description: "Gérez vos véhicules et livreurs.", href: "/dashboard", icon: <Truck className="h-8 w-8 text-white" />, color: "from-orange-400 to-orange-600" },
            { title: "Opérations", description: "Supervisez les flux de colis de votre agence.", href: "/dashboard", icon: <MapPinHouse className="h-8 w-8 text-white" />, color: "from-amber-500 to-red-500" },
            { title: "Administration", description: "Paramètres et gestion du personnel.", href: "/dashboard", icon: <User className="h-8 w-8 text-white" />, color: "from-orange-500 to-amber-600" },
          ]
        };
        break;

      // Cas par défaut : FREELANCE (Point Relais Indépendant)
      case 'FREELANCE':
      default:
        config = {
          title: "TiiBnTick Point", // Titre spécifique Freelance
          welcomeMessage: "dans le système de gestion de votre point relais.",
          mainIcon: <MapPinHouse className='text-white h-12 w-12' />,
          services: [
            { title: "Dépôt de colis", description: "Enregistrez un nouveau colis à expédier.", href: "/depot", icon: <PackagePlus className="h-8 w-8 text-white" />, color: "from-orange-400 to-orange-500" },
            { title: "Retrait de colis", description: "Finalisez le retrait d'un colis arrivé.", href: "/withdraw-package", icon: <PackageOpen className="h-8 w-8 text-white" />, color: "from-amber-400 to-amber-500" },
            { title: "Mon Compte", description: "Consultez les statistiques de votre point relais.", href: "/dashboard", icon: <User className="h-8 w-8 text-white" />, color: "from-orange-500 to-amber-600" },
          ]
        };
        break;
    }
    
    return config;
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600  dark:text-gray-300 ">Chargement de votre espace...</p>
      </div>
    );
  }

  if (!isVisible || !user || !pageConfig) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Non connecté</h2>
              <p className="text-gray-600 mb-4">Veuillez vous connecter pour accéder à votre espace.</p>
              <button 
                  onClick={() => router.push('/login')}
                  className="px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-lg"
              >
                  Aller à la connexion
              </button>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-orange-900">
      <div className="relative overflow-hidden">
        {/* Décorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-orange-200 to-amber-200 rounded-full opacity-20"></div>
          <div className="absolute -bottom-32 -left-40 w-96 h-96 bg-gradient-to-r from-orange-100 to-amber-200 rounded-full opacity-20"></div>
        </div>

        <div className="relative container mx-auto px-4 py-16 sm:px-6">
          <div className={`text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-gray-800 via-orange-600 to-amber-700 bg-clip-text text-transparent mb-4 pb-2">
              {pageConfig.title}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6 leading-relaxed">
              Bienvenue, <span className="font-bold text-orange-700">{user.name}</span>, {pageConfig.welcomeMessage}
            </p>
            <div className="flex justify-center mb-0">
                <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white shadow-xl ring-4 ring-white dark:ring-gray-800">
                  {pageConfig.mainIcon}
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 pb-16">
        <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-gray-200 mb-3">Nos Services</h2>
          <div className="w-20 h-1.5 bg-gradient-to-r from-orange-400 to-amber-500 mx-auto mb-10 rounded-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {pageConfig.services.map((service, index) => (
              <Link key={index} href={service.href}
                className="group transform transition-all duration-300 hover:scale-105"
                style={{ transitionDelay: `${300 + index * 100}ms` }}>
                <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-sm rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-800 h-full">
                  <div className="p-6">
                    <div className={`w-16 h-16 bg-gradient-to-r ${service.color} rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-all duration-300 shadow-md`}>
                      {service.icon}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-300 mb-2 group-hover:text-orange-600 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed text-sm sm:text-base">
                      {service.description}
                    </p>
                    <div className="flex items-center text-orange-600 font-semibold group-hover:text-orange-700 text-sm sm:text-base">
                      <span>Accéder</span>
                      <svg className="w-4 h-4 ml-1.5 group-hover:translate-x-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// FICHIER : src/app/home/page.tsx
'use client';

import { PackagePlus, PackageOpen, User, MapPinHouse, Truck, Search, Archive, Package, Building2, TruckElectric } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/userservice';

// --- TYPES ET INTERFACES ---

type UIAccountType = 'CLIENT' | 'RELAY_OWNER' |'LIVREUR'| 'DELIVERER' | 'FREELANCE' | 'AGENCY' | 'ADMIN';

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

interface ThemeColors {
  gradient: string;
  gradientDark: string;
  decorations: string;
  decorationsDark: string;
  buttonBase: string;
  buttonHover: string;
  serviceGradient: string;
  textAccent: string;
  textAccentHover: string;
  iconBg: string;
  divider: string;
}

// === FONCTION CRUCIALE : NORMALISATION DES DONNÉES ===
const normalizeProfile = (apiData: any) => {
  console.log(">>> [Home] Raw API Data:", apiData);

  // 1. STRATÉGIE DE FUSION : 
  // On prend apiData comme base. Si une propriété 'user' existe (cas /users/me), 
  // on fusionne son contenu par-dessus la racine, mais on GARDE les champs racine existants 
  // (comme businessActorType qui est souvent à la racine et pas dans 'user').
  const baseData = apiData || {};
  const nestedUser = apiData.user || {};
  
  // L'ordre est important : nestedUser écrase baseData pour les infos perso (nom, email...), 
  // MAIS on force la ré-application des champs critiques de la racine s'ils manquent dans nestedUser.
  const flatUser = {
      ...baseData,       // 1. Données racine (contient token, userId, businessActorType)
      ...nestedUser,     // 2. Données user (contient id, name, email)
  };

  // Restauration explicite des champs critiques s'ils ont été écrasés par 'undefined'
  if (!flatUser.businessActorType && baseData.businessActorType) {
      flatUser.businessActorType = baseData.businessActorType;
  }
  if (!flatUser.accountType && baseData.accountType) {
      flatUser.accountType = baseData.accountType;
  }
  
  // 3. EXTRACTION ROBUSTE DES CHAMPS (CamelCase ET SnakeCase)
  const rawType = flatUser.accountType || flatUser.account_type || 'CLIENT';
  const rawSubType = flatUser.businessActorType || flatUser.business_actor_type || '';
  
  // Nettoyage pour comparaison
  const typeUpper = String(rawType).toUpperCase().trim();
  const subTypeUpper = String(rawSubType).toUpperCase().trim();

  // Nom d'affichage
  const displayName = flatUser.name || flatUser.businessName || flatUser.business_name || flatUser.email;
  
  // ID : Gérer 'id' (de l'objet user) et 'userId' (de la réponse login)
  const realId = flatUser.id || flatUser.userId;

  console.log(`>>> [Home] Analyzed: Type=[${typeUpper}] SubType=[${subTypeUpper}] ID=[${realId}]`);

  // 4. LOGIQUE D'ATTRIBUTION DU RÔLE UI
  let finalAccountType: UIAccountType = 'CLIENT';

  if (typeUpper === 'ADMIN' || typeUpper === 'SUPERADMIN') {
      finalAccountType = 'ADMIN';
  } 
  else if (typeUpper.includes('BUSINESS')) {
      // Détection spécifique pour AGENCY_OWNER
      if (subTypeUpper === 'AGENCY_OWNER' || subTypeUpper === 'AGENCY') {
          finalAccountType = 'AGENCY';
      } 
      else if (subTypeUpper === 'DELIVERER' || subTypeUpper === 'LIVREUR') {
          finalAccountType = 'LIVREUR';
      } 
      else if (subTypeUpper === 'RELAY_OWNER' ) {
          finalAccountType = 'FREELANCE';
      }
      else if (subTypeUpper === 'EMPLOYEE') {
          // Un employé d'agence doit voir la vue Agence (souvent)
          finalAccountType = 'FREELANCE'; 
      } 
      else {
          console.warn(`⚠️ Business Type inconnu: ${subTypeUpper}, fallback sur FREELANCE`);
          finalAccountType = 'LIVREUR';
      }
  }

  // 5. OBJET FINAL NORMALISÉ
  return {
    ...flatUser,        // Conserve toutes les props brutes
    id: realId,
    account_type: finalAccountType, // La clé standardisée pour l'UI switch
    role: finalAccountType,         // Redondance utile
    email: flatUser.email,
    manager_name: displayName,
    name: displayName,
    // On conserve le type business original pour référence
    businessActorType: rawSubType
  };
};

// === FONCTION : RÉCUPÉRATION DES COULEURS PAR RÔLE ===
const getThemeColors = (role: UIAccountType): ThemeColors => {
  switch (role) {
    case 'AGENCY':
      return {
        gradient: 'from-gray-50 via-white to-blue-50',
        gradientDark: 'dark:from-gray-900 dark:via-gray-800 dark:to-blue-900',
        decorations: 'from-blue-200 to-sky-200',
        decorationsDark: 'from-blue-800 to-sky-800',
        buttonBase: 'bg-blue-500',
        buttonHover: 'hover:bg-blue-600',
        serviceGradient: 'from-blue-400 to-sky-500',
        textAccent: 'text-blue-700',
        textAccentHover: 'group-hover:text-blue-600',
        iconBg: 'from-blue-400 to-sky-500',
        divider: 'from-blue-400 to-sky-500',
      };
    
    case 'EMPLOYEE':
      return {
        gradient: 'from-gray-50 via-white to-green-50',
        gradientDark: 'dark:from-gray-900 dark:via-gray-800 dark:to-green-900',
        decorations: 'from-green-200 to-emerald-200',
        decorationsDark: 'from-green-800 to-emerald-800',
        buttonBase: 'bg-green-500',
        buttonHover: 'hover:bg-green-600',
        serviceGradient: 'from-green-400 to-emerald-500',
        textAccent: 'text-green-700',
        textAccentHover: 'group-hover:text-green-600',
        iconBg: 'from-green-400 to-emerald-500',
        divider: 'from-green-400 to-emerald-500',
      };
    
    case 'RELAY_OWNER':
      return {
        gradient: 'from-gray-50 via-white to-red-50',
        gradientDark: 'dark:from-gray-900 dark:via-gray-800 dark:to-red-900',
        decorations: 'from-red-200 to-red-200',
        decorationsDark: 'from-red-800 to-red-800',
        buttonBase: 'bg-red-500',
        buttonHover: 'hover:bg-red-600',
        serviceGradient: 'from-red-400 to-red-500',
        textAccent: 'text-red-700',
        textAccentHover: 'group-hover:text-red-600',
        iconBg: 'from-red-400 to-red-500',
        divider: 'from-red-400 to-red-500',
      };

    case 'LIVREUR':
      return {
        gradient: 'from-gray-50 via-white to-purple-50',
        gradientDark: 'dark:from-gray-900 dark:via-gray-800 dark:to-purple-900',
        decorations: 'from-purple-200 to-violet-200',
        decorationsDark: 'from-purple-800 to-violet-800',
        buttonBase: 'bg-purple-500',
        buttonHover: 'hover:bg-purple-600',
        serviceGradient: 'from-purple-400 to-violet-500',
        textAccent: 'text-purple-700',
        textAccentHover: 'group-hover:text-purple-600',
        iconBg: 'from-purple-400 to-violet-500',
        divider: 'from-purple-400 to-violet-500',
      };
    
    case 'CLIENT':
    default:
      return {
        gradient: 'from-gray-50 via-white to-orange-50',
        gradientDark: 'dark:from-gray-900 dark:via-gray-800 dark:to-orange-900',
        decorations: 'from-orange-200 to-amber-200',
        decorationsDark: 'from-orange-800 to-amber-800',
        buttonBase: 'bg-orange-500',
        buttonHover: 'hover:bg-orange-600',
        serviceGradient: 'from-orange-400 to-amber-500',
        textAccent: 'text-orange-700',
        textAccentHover: 'group-hover:text-orange-600',
        iconBg: 'from-orange-400 to-amber-500',
        divider: 'from-orange-400 to-amber-500',
      };
  }
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
            
            // 1. Vérifier d'abord si authUser contient déjà toutes les infos nécessaires (cas du login)
            if (authUser.accountType && authUser.name) {
                console.log('✅ Utilisation des données de session (login)');
                const profile = normalizeProfile(authUser);
                
                const userRole = profile.account_type;
                
                // Redirection Admin
                if (userRole === 'ADMIN') {
                    console.log('👑 Admin détecté, redirection vers /superadmin...');
                    router.push('/superadmin');
                    return;
                }

                setUser({ 
                    name: profile.manager_name, 
                    email: profile.email, 
                    role: userRole 
                });
                
                setIsVisible(true);
                setIsLoading(false);
                return;
            }
            
            // 2. Sinon, appel API pour récupérer les infos
            const rawProfile = await userService.getProfileById(authUser.id);
            
            // 3. Normalisation des données
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
                name: profile.manager_name, 
                email: profile.email, 
                role: userRole 
            });
            
            setIsVisible(true);
            
        } catch (error: any) {
            console.error('💥 Erreur lors de la récupération du profil via le backend:', error);
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

    const colors = getThemeColors(user.role);
    let config: PageConfig;

    switch (user.role) {
      case 'CLIENT':
        config = {
          title: "TiiBnTick Link",
          welcomeMessage: "votre espace personnel pour gérer vos envois.",
          mainIcon: <Package className='text-white h-12 w-12' />,
          services: [
            { title: "Envoyer un colis", description: "Initiez une nouvelle expédition rapidement.", href: "/expedition", icon: <PackagePlus className="h-8 w-8 text-white" />, color: colors.serviceGradient },
            { title: "Retrouver un colis", description: "Suivez votre colis en temps réel.", href: "/track-package", icon: <Search className="h-8 w-8 text-white" />, color: colors.serviceGradient },
            { title: "Mon compte", description: "Gérez votre profil et vos informations.", href: "/dashboard", icon: <User className="h-8 w-8 text-white" />, color: colors.serviceGradient },
          ]
        };
        break;
      
      case 'LIVREUR':
        config = {
          title: "TiiBnTick Deliver",
          welcomeMessage: "dans votre espace de gestion des livraisons.",
          mainIcon: <Truck className='text-white h-12 w-12' />,
          services: [
            { title: "Trouver une annonce", description: "Consultez les colis à récupérer aux points relais.", href: "/collect-package", icon: <Search className="h-8 w-8 text-white" />, color: colors.serviceGradient },
            { title: "Gérer mes annonces", description: "Validez la prise et/ou livraison d'un colis.", href: "/my-deliveries", icon: <TruckElectric className="h-8 w-8 text-white" />, color: colors.serviceGradient },
            { title: "Mon compte", description: "Suivez vos courses et vos performances.", href: "/dashboard", icon: <User className="h-8 w-8 text-white" />, color: colors.serviceGradient },
          ]
        };
        break;

      case 'AGENCY':
        config = {
          title: "TiiBnTick Agency",
          welcomeMessage: "dans votre centre de gestion logistique.",
          mainIcon: <Building2 className='text-white h-12 w-12' />,
          services: [
            { title: "Gestion Flotte", description: "Gérez vos véhicules et votre personnel.", href: "/agency/staff", icon: <Truck className="h-8 w-8 text-white" />, color: colors.serviceGradient },
            { title: "Opérations", description: "Supervisez les flux de colis de votre agence.", href: "/agency/operations", icon: <MapPinHouse className="h-8 w-8 text-white" />, color: colors.serviceGradient },
            { title: "Administration", description: "Paramètres et gestion du personnel.", href: "/dashboard", icon: <User className="h-8 w-8 text-white" />, color: colors.serviceGradient },
          ]
        };
        break;

      case 'FREELANCE':
      default:
        config = {
          title: "TiiBnTick Point",
          welcomeMessage: "dans le système de gestion de votre point relais.",
          mainIcon: <MapPinHouse className='text-white h-12 w-12' />,
          services: [
            { title: "Dépôt de colis", description: "Enregistrez un nouveau colis à expédier.", href: "/depot", icon: <PackagePlus className="h-8 w-8 text-white" />, color: colors.serviceGradient },
            { title: "Retrait de colis", description: "Finalisez le retrait d'un colis arrivé.", href: "/withdraw-package", icon: <PackageOpen className="h-8 w-8 text-white" />, color: colors.serviceGradient },
            { title: "Mon Compte", description: "Consultez les statistiques de votre point relais.", href: "/dashboard", icon: <User className="h-8 w-8 text-white" />, color: colors.serviceGradient },
          ]
        };
        break;
    }
    
    return config;
  }, [user]);

  // Récupération des couleurs du thème
  const themeColors = user ? getThemeColors(user.role) : getThemeColors('CLIENT');

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className={`w-16 h-16 border-4 ${themeColors.buttonBase.replace('bg-', 'border-t-')} border-gray-200 dark:border-gray-700 rounded-full animate-spin mb-4`}></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement de votre espace...</p>
      </div>
    );
  }

  if (!isVisible || !user || !pageConfig) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Non connecté</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Veuillez vous connecter pour accéder à votre espace.</p>
              <button 
                  onClick={() => router.push('/login')}
                  className={`px-6 py-3 ${themeColors.buttonBase} text-white font-bold rounded-xl ${themeColors.buttonHover} transition-colors shadow-lg`}
              >
                  Aller à la connexion
              </button>
          </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white dark:bg-black`}>
      <div className="relative overflow-hidden">
        {/* Décorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r ${themeColors.decorations} dark:bg-gradient-to-r ${themeColors.decorationsDark} rounded-full opacity-70`}></div>
          <div className={`absolute -bottom-32 -left-40 w-96 h-96 bg-gradient-to-r ${themeColors.decorations} dark:bg-gradient-to-r ${themeColors.decorationsDark} rounded-full opacity-70`}></div>
        </div>

        <div className="relative container mx-auto px-4 py-8 sm:px-6">
          <div className={`text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h1 className={`text-5xl sm:text-6xl font-bold bg-gradient-to-r from-gray-900 dark:from-gray-300 via-${themeColors.buttonBase.replace('bg-', '')}-600 to-${themeColors.buttonBase.replace('bg-', '')}-700 bg-clip-text text-transparent mb-4 pb-2`}>
              {pageConfig.title}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6 leading-relaxed">
              Bienvenue, <span className={`font-bold ${themeColors.textAccent}`}>{user.name}</span>, {pageConfig.welcomeMessage}
            </p>
            <div className="flex justify-center mb-0">
                <div className={`w-24 h-24 bg-gradient-to-r ${themeColors.iconBg} rounded-full flex items-center justify-center text-white shadow-xl ring-4 ring-white dark:ring-gray-800`}>
                  {pageConfig.mainIcon}
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 pb-16">
        <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-gray-200 mb-3">Nos Services</h2>
          <div className={`w-20 h-1.5 bg-gradient-to-r ${themeColors.divider} mx-auto mb-10 rounded-full`}></div>
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
                    <h3 className={`text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-300 mb-2 ${themeColors.textAccentHover} transition-colors`}>
                      {service.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed text-sm sm:text-base">
                      {service.description}
                    </p>
                    <div className={`flex items-center ${themeColors.textAccent} font-semibold ${themeColors.textAccentHover.replace('group-hover:', 'group-hover:')} text-sm sm:text-base`}>
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
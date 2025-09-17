// FICHIER : src/app/home/page.tsx
'use client';

// --- MODIFIÉ : Import des icônes supplémentaires nécessaires pour les nouveaux services ---
import { PackagePlus, PackageOpen, User, MapPinHouse, Truck, Search, Archive, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

// --- MODIFIÉ : Définition des types pour plus de clarté ---
type UserRole = 'client' | 'livreur' | 'freelance' | 'agence';

interface CurrentUser {
  name: string;
  email?: string;
  role: UserRole;
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

// --- MODIFIÉ : Le composant principal de la page ---
export default function HomePage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- FIX : Hook useEffect pour récupérer les informations avec la même logique que login ---
  useEffect(() => {
    const fetchUserData = async () => {
        try {
            console.log('🔍 Vérification de la session...');
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                console.log('❌ Pas de session, redirection vers login');
                router.push('/');
                return;
            }

            console.log('✅ Session trouvée, ID utilisateur:', session.user.id);
            console.log('📧 Email utilisateur:', session.user.email);

            // --- FIX : Même logique que dans page.tsx - essayer 'profiles' d'abord ---
            console.log('👤 Récupération du profil depuis profiles...');
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('manager_name, account_type, email')
                .eq('id', session.user.id)
                .single();

            console.log('📋 Résultat profiles:', { profile, error: profileError });

            let finalProfile = profile;
            
            // Si pas trouvé dans 'profiles', essayer 'profiles_pro'
            if (profileError && profileError.code === 'PGRST116') {
                console.log('🔄 Profil non trouvé dans profiles, tentative profiles_pro...');
                const { data: profilePro, error: profileProError } = await supabase
                    .from('profiles_pro')
                    .select('manager_name, account_type, email')
                    .eq('id', session.user.id)
                    .single();
                
                console.log('📋 Résultat profiles_pro:', { profilePro, error: profileProError });
                
                if (profileProError || !profilePro) {
                    console.error("❌ Aucun profil trouvé dans les deux tables");
                    throw new Error("Aucun profil trouvé pour ce compte. Veuillez vous reconnecter.");
                }
                
                finalProfile = profilePro;
                console.log('✅ Profil trouvé dans profiles_pro');
            } else if (profileError) {
                console.error("❌ Erreur lors de la récupération du profil:", profileError);
                throw new Error(`Erreur profil: ${profileError.message}`);
            }

            if (!finalProfile) {
                throw new Error("Profil introuvable.");
            }

            console.log('✅ Profil final chargé:', finalProfile.manager_name);
            console.log('🎭 Type de compte:', finalProfile.account_type);
            
            // --- Stockage des informations complètes ---
            setUser({ 
                name: finalProfile.manager_name, 
                email: session.user.email!, 
                role: finalProfile.account_type.toLowerCase() as UserRole 
            });
            
            setIsVisible(true);
            
        } catch (error: any) {
            console.error('💥 Erreur complète lors du chargement:', error);
            // En cas d'erreur, déconnecter et rediriger
            await supabase.auth.signOut();
            router.push('/');
        } finally {
            setIsLoading(false);
        }
    };

    fetchUserData();
  }, [router]);
  
  // --- NOUVEAU : Logique pour définir dynamiquement le contenu de la page ---
  const pageConfig: PageConfig | null = useMemo(() => {
    if (!user) return null;

    console.log('🎯 Configuration de la page pour le rôle:', user.role);

    // Configuration par défaut (Freelance & Agence)
    let config: PageConfig = {
      title: "PicknDrop Point",
      welcomeMessage: "dans le système de gestion de votre point relais.",
      mainIcon: <MapPinHouse className='text-white h-12 w-12' />,
      services: [
        { title: "Dépôt de colis", description: "Enregistrez un nouveau colis à expédier.", href: "/emit-package", icon: <PackagePlus className="h-8 w-8 text-white" />, color: "from-orange-400 to-orange-500" },
        { title: "Retrait de colis", description: "Finalisez le retrait d'un colis arrivé.", href: "/withdraw-package", icon: <PackageOpen className="h-8 w-8 text-white" />, color: "from-amber-400 to-amber-500" },
        { title: "Mon Compte", description: "Consultez les statistiques de votre point relais.", href: "/dashboard", icon: <User className="h-8 w-8 text-white" />, color: "from-orange-500 to-amber-600" },
      ]
    };
    
    // Surcharge de la configuration en fonction du rôle
    switch (user.role) {
      case 'client':
        config = {
          title: "PicknDrop Link",
          welcomeMessage: "votre espace personnel pour gérer vos envois.",
          mainIcon: <Package className='text-white h-12 w-12' />,
          services: [
            { title: "Envoyer un colis", description: "Initiez une nouvelle expédition rapidement.", href: "/expedition", icon: <PackagePlus className="h-8 w-8 text-white" />, color: "from-orange-400 to-orange-500" },
            { title: "Retrouver un colis", description: "Suivez votre colis en temps réel.", href: "/track-package", icon: <Search className="h-8 w-8 text-white" />, color: "from-amber-400 to-amber-500" },
            { title: "Mon compte", description: "Gérez votre profil et vos informations.", href: "/dashboard", icon: <User className="h-8 w-8 text-white" />, color: "from-orange-500 to-amber-600" },
          ]
        };
        break;
      
      case 'livreur':
        config = {
          title: "PicknDrop Deliver",
          welcomeMessage: "dans votre espace de gestion des livraisons.",
          mainIcon: <Truck className='text-white h-12 w-12' />,
          services: [
            { title: "Récupérer un colis", description: "Consultez les colis à récupérer aux points relais.", href: "/collect-package", icon: <Archive className="h-8 w-8 text-white" />, color: "from-orange-400 to-orange-500" },
            { title: "Déposer un colis", description: "Validez la livraison d'un colis à destination.", href: "/drop-package", icon: <PackageOpen className="h-8 w-8 text-white" />, color: "from-amber-400 to-amber-500" },
            { title: "Mon compte", description: "Suivez vos courses et vos performances.", href: "/dashboard", icon: <User className="h-8 w-8 text-white" />, color: "from-orange-500 to-amber-600" },
          ]
        };
        break;
    }
    
    return config;
  }, [user]);

  // Affiche un écran de chargement tant que les données ne sont pas prêtes
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Chargement de votre espace...</p>
      </div>
    );
  }

  if (!isVisible || !user || !pageConfig) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Erreur de chargement</h2>
              <p className="text-gray-600 mb-4">Impossible de charger votre profil.</p>
              <button 
                  onClick={() => router.push('/')}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                  Retour à la connexion
              </button>
          </div>
      </div>
    );
  }

  // --- Le JSX utilise maintenant `pageConfig` pour afficher les bonnes informations ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      <div className="relative overflow-hidden">
        {/* Décorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-orange-200 to-amber-200 rounded-full opacity-20"></div>
          <div className="absolute -bottom-32 -left-40 w-96 h-96 bg-gradient-to-r from-orange-100 to-amber-200 rounded-full opacity-20"></div>
        </div>

        <div className="relative container mx-auto px-4 py-16 sm:px-6">
          <div className={`text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-gray-800 via-orange-600 to-amber-700 bg-clip-text text-transparent mb-4">
              {pageConfig.title}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-6 leading-relaxed">
              Bienvenue, <span className="font-bold text-orange-700">{user.name}</span>, {pageConfig.welcomeMessage}
            </p>
            <div className="flex justify-center mb-0">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white shadow-lg">
                  {pageConfig.mainIcon}
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 pb-16">
        <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-3">Nos Services</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-orange-400 to-amber-500 mx-auto mb-8 rounded-full"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {pageConfig.services.map((service, index) => (
              <Link key={index} href={service.href}
                className="group transform transition-all duration-300 hover:scale-105"
                style={{ transitionDelay: `${300 + index * 100}ms` }}>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-full">
                  <div className="p-6">
                    <div className={`w-16 h-16 bg-gradient-to-r ${service.color} rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-all duration-300 shadow-md`}>
                      {service.icon}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed text-sm sm:text-base">
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
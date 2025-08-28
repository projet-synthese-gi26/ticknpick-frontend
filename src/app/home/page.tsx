// FICHIER : src/app/home/page.tsx
'use client';
import { PackagePlus, PackageOpen, User, MapPinHouse } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; 

interface CurrentUser {
  name: string;
  email?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);

useEffect(() => {
    const fetchUserData = async () => {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!session) {
            router.push('/'); // Si pas de session, retour à la connexion
            return;
        }

        // On fetch le profil PRO complet.
        const { data: profile, error: profileError } = await supabase
            .from('profiles_pro')
            .select('manager_name') // On ne sélectionne que ce dont on a besoin ici
            .eq('id', session.user.id)
            .single();

        if (profileError || !profile) {
            console.error("Profil PRO introuvable, déconnexion.", profileError);
            await supabase.auth.signOut();
            router.push('/');
            return;
        }

        // Met à jour l'état local avec le nom de l'utilisateur
        setUser({ name: profile.manager_name, email: session.user.email! });
        setIsVisible(true);
    };

    fetchUserData();
}, [router]);

  if (!isVisible || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const services = [
    { title: "Dépôt de colis", description: "Enregistrez un nouveau colis à expédier.", href: "/emit-package", icon: <PackagePlus className="h-8 w-8 text-white" />, color: "from-orange-400 to-orange-500" },
    { title: "Retrait de colis", description: "Finalisez le retrait d'un colis arrivé.", href: "/withdraw-package", icon: <PackageOpen className="h-8 w-8 text-white" />, color: "from-amber-400 to-amber-500" },
    { title: "Mon Compte & Dashboard", description: "Consultez les statistiques de votre point relais.", href: "/dashboard", icon: <User className="h-8 w-8 text-white" />, color: "from-orange-500 to-amber-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      <div className="relative overflow-hidden">
        {/* Décorations (thème orange) */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-orange-200 to-amber-200 rounded-full opacity-20"></div>
          <div className="absolute -bottom-32 -left-40 w-96 h-96 bg-gradient-to-r from-orange-100 to-amber-200 rounded-full opacity-20"></div>
        </div>

        <div className="relative container mx-auto px-4 py-16 sm:px-6">
          <div className={`text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-gray-800 via-orange-600 to-amber-700 bg-clip-text text-transparent mb-4">
              PicknDrop Point
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-6 leading-relaxed">
              Bienvenue, <span className="font-bold text-orange-700">{user.name}</span>, dans le système de gestion de votre point relais.
            </p>
            <div className="flex justify-center mb-0">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white shadow-lg">
                  <MapPinHouse className='text-white h-12 w-12' />
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
            {services.map((service, index) => (
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
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Utiliser useRouter de next/navigation
import { Eye, EyeOff, Package, Shield, Star, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // <--- Importez Supabase !

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // 1. Connexion avec Supabase
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (signInError || !user) {
      setError("Email ou mot de passe incorrect.");
      setIsLoading(false);
      return;
    }

    // 2. Si la connexion réussit, récupérer le profil public
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name:full_name, email') // On renomme full_name en name pour la cohérence
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      setError("Connexion réussie, mais impossible de charger votre profil. Veuillez contacter le support.");
      // Déconnecter pour éviter d'être dans un état invalide
      await supabase.auth.signOut(); 
      setIsLoading(false);
      return;
    }
    
    // 3. Sauvegarder les infos du profil dans localStorage
    // C'est ce que votre page d'accueil utilise.
    localStorage.setItem('pickndrop_currentUser', JSON.stringify(profile));

    // 4. Rediriger vers la page d'accueil
    router.push('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      {/* Conservez la section gauche existante (illustration, informations, etc.) */}
      <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Section gauche - Illustration et informations améliorées */}
        <div className="hidden lg:flex flex-col justify-center space-y-12 p-12 relative">
          {/* Éléments décoratifs animés */}
          <div className="absolute top-8 left-8 w-20 h-20 bg-green-200/30 rounded-full animate-pulse"></div>
          <div className="absolute bottom-12 right-8 w-16 h-16 bg-blue-200/30 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-4 w-12 h-12 bg-purple-200/30 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
          
          {/* Header principal */}
          <div className="text-center space-y-8 relative z-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl mb-8 shadow-2xl transform hover:scale-110 transition-all duration-500 hover:rotate-3">
              <Package className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-gray-800 leading-tight">
                <span className="bg-gradient-to-r from-green-600 to-teal-800 bg-clip-text text-transparent animate-pulse">
                  Pick & Drop
                </span>
                <span className="block text-4xl font-bold text-green-600 mt-2">
                  Point
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
                Révolutionnez votre gestion de colis avec notre plateforme intelligente. 
                <span className="block mt-2 text-green-600 font-semibold">
                  Simple • Sécurisé • Efficace
                </span>
              </p>
            </div>
          </div>

          {/* Statistiques animées */}
          <div className="grid grid-cols-3 gap-6 relative z-10">
            <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800">500+</div>
              <div className="text-sm text-gray-600">Points actifs</div>
            </div>
            
            <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2" style={{animationDelay: '0.2s'}}>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800">10k+</div>
              <div className="text-sm text-gray-600">Colis traités</div>
            </div>
            
            <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2" style={{animationDelay: '0.4s'}}>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800">4.8/5</div>
              <div className="text-sm text-gray-600">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Section droite - Formulaire de connexion MODIFIÉ */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Connexion</h2>
              <p className="text-gray-600">Accédez à votre espace de gestion</p>
            </div>
            
            {error && <div className="p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-xl text-center">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Adresse email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 transition-all bg-gray-50 hover:shadow-md"/>
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 transition-all bg-gray-50 hover:shadow-md"/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 disabled:from-green-400 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl">
                {isLoading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500">Pas encore de compte ?</span></div>
            </div>

            <button
              onClick={() => router.push('/register')}
              className="w-full flex items-center justify-center py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all hover:shadow-md"
            >
              <span className="text-sm font-medium text-gray-700">Créer un compte</span>
            </button>
            
            <p className="text-center text-xs text-gray-500 flex items-center justify-center space-x-1">
              <Shield className="w-4 h-4" />
              <span>Connexion sécurisée</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
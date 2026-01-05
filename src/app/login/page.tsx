// FICHIER : src/app/page.tsx
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Package, Shield, Star, Users } from 'lucide-react';
import { authService } from '@/services/authService'; // Importez le service
import { useAuth } from '@/context/AuthContext';       // Importez le hook du contexte d'auth

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth(); // Récupérez la fonction login du contexte
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('Tentative de connexion pour:', email);
      // On type la réponse en 'any' ici pour accéder aux champs dynamiques sans erreur TS bloquante
      // si votre interface AuthResponse n'est pas encore mise à jour
      const authResponse: any = await authService.login({ email: email.trim().toLowerCase(), password });
      
      console.log('Réponse complète du backend:', authResponse);

      if (authResponse && authResponse.token) {
        
        // --- CORRECTION ICI ---
        // Récupération des données spécifiques Business
        const businessType = authResponse.businessActorType || null; 
        const userName = authResponse.name || authResponse.businessName || 'Utilisateur';

        // On passe l'objet complet au contexte
        // Le contexte stockera : { id, email, accountType, businessActorType, name }
        login(authResponse.token, {
          id: authResponse.userId,
          email: authResponse.email,
          accountType: authResponse.accountType,
          // @ts-ignore : On ignore l'erreur si l'interface User du contexte n'a pas encore ce champ
          businessActorType: businessType, 
          name: userName
        });
        
        console.log(`Connexion réussie ! Rôle: ${authResponse.accountType} (${businessType || 'N/A'})`);

        // --- LOGIQUE DE REDIRECTION ---
        const userRole = authResponse.accountType.toLowerCase();

        if (userRole === 'admin' || userRole === 'superadmin') {
          console.log('Redirection vers /superadmin...');
          router.push('/superadmin');
        } else {
          // Le dashboard '/home' lira businessActorType pour afficher la bonne UI (Agency vs Point)
          console.log('Redirection vers /home...');
          router.push('/home');
        }

      } else {
        throw new Error("La réponse du serveur est invalide.");
      }

    } catch (err: any) {
      console.error('Erreur de connexion:', err);
      setError(err.message || 'Email ou mot de passe incorrect.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-amber-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Section gauche - Illustration */}
        <div className="hidden lg:flex flex-col justify-center space-y-12 p-12 relative">
          <div className="absolute top-8 left-8 w-20 h-20 bg-orange-200/30 dark:bg-orange-500/20 rounded-full animate-pulse"></div>
          <div className="absolute bottom-12 right-8 w-16 h-16 bg-amber-200/30 dark:bg-amber-500/20 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
          
          <div className="text-center space-y-8 relative z-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-amber-600 dark:bg-orange-600 rounded-3xl mb-8 shadow-2xl transform hover:scale-110 transition-all duration-500 hover:rotate-3">
              <Package className="w-12 h-12 text-gray-800 dark:text-white" />
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-gray-800 dark:text-slate-50 leading-tight">
                <span className="bg-gradient-to-r from-orange-600 to-amber-800 dark:from-orange-500 dark:to-amber-500 bg-clip-text text-transparent animate-pulse">
                  TiiBnTick
                </span>
                <span className="block text-4xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                  Link
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                Gérez votre point relais avec notre plateforme intuitive. 
                <span className="block mt-2 text-orange-600 dark:text-orange-400 font-semibold">
                  Simple • Sécurisé • Efficace
                </span>
              </p>
            </div>
          </div>

          {/* Statistiques animées */}
          <div className="grid grid-cols-3 gap-6 relative z-10">
            <div className="text-center p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-600/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-slate-100">500+</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Points actifs</div>
            </div>
            
            <div className="text-center p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2" style={{animationDelay: '0.2s'}}>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-600/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-slate-100">10k+</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Colis traités</div>
            </div>
            
            <div className="text-center p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2" style={{animationDelay: '0.4s'}}>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-600/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-slate-100">4.8/5</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Section droite - Formulaire de connexion */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-slate-50">Connexion PRO</h2>
              <p className="text-gray-600 dark:text-slate-300">Accédez à votre espace de gestion</p>
            </div>
            
            {error && <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 text-red-700 dark:text-red-300 text-sm rounded-xl text-center">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Adresse email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all bg-gray-50 dark:bg-slate-700 hover:shadow-md border-0 dark:placeholder:text-slate-400"/>
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Mot de passe</label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="w-full px-4 py-3 pr-12 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all bg-gray-50 dark:bg-slate-700 hover:shadow-md border-0 dark:placeholder:text-slate-400"/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-300">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-amber-600 disabled:from-orange-400 dark:from-orange-600 dark:to-amber-600 dark:hover:from-amber-500 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
                {isLoading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-slate-700"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400">Pas encore de compte ?</span></div>
            </div>

            <button
              onClick={() => router.push('/register')}
              className="w-full flex items-center justify-center py-3 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all hover:shadow-md"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Créer un compte</span>
            </button>
            
            <p className="text-center text-xs text-gray-500 dark:text-slate-400 flex items-center justify-center space-x-1">
              <Shield className="w-4 h-4" />
              <span>Connexion sécurisée</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
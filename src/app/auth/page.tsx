'use client';
import React, { useState } from 'react';
import { Eye, EyeOff, Package, MapPin, Truck, Shield } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    // Simulation d'une requête de connexion
    setTimeout(() => {
      setIsLoading(false);
      alert('Connexion simulée réussie !');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Section gauche - Illustration et informations */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-8">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <Package className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 leading-tight">
              Point de Livraison
              <span className="block text-green-600">Moderne</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-md mx-auto">
              Gérez vos livraisons et expéditions en toute simplicité avec notre interface intuitive
            </p>
          </div>

          {/* Fonctionnalités */}
          <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
            <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Suivi en temps réel</h3>
                <p className="text-sm text-gray-600">Suivez tous vos colis instantanément</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Localisation précise</h3>
                <p className="text-sm text-gray-600">Géolocalisation automatique</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Sécurisé</h3>
                <p className="text-sm text-gray-600">Protection maximale de vos données</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section droite - Formulaire de connexion */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 space-y-8">
            
            {/* Header du mobile */}
            <div className="lg:hidden text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <Package className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Connexion</h2>
              <p className="text-gray-600">Accédez à votre espace de livraison</p>
            </div>

            <div className="hidden lg:block text-center space-y-2">
              <h2 className="text-3xl font-bold text-gray-800">Connexion</h2>
              <p className="text-gray-600">Accédez à votre espace de gestion</p>
            </div>

            {/* Formulaire */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="vous@exemple.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-600">Se souvenir de moi</span>
                </label>
                <a href="#" className="text-sm text-green-600 hover:text-green-700 transition-colors">
                  Mot de passe oublié ?
                </a>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connexion...</span>
                  </div>
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Ou continuer avec</span>
              </div>
            </div>

            {/* Boutons sociaux */}
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="ml-2 text-sm font-medium text-gray-700">Google</span>
              </button>
              
              <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z"/>
                </svg>
                <span className="ml-2 text-sm font-medium text-gray-700">Facebook</span>
              </button>
            </div>

            {/* Footer */}
            <p className="text-center text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <a href="#" className="text-green-600 hover:text-green-700 font-medium transition-colors">
                Créer un compte
              </a>
            </p>
          </div>

          {/* Note de sécurité */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center space-x-1">
              <Shield className="w-4 h-4" />
              <span>Connexion sécurisée SSL</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
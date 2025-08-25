'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // <--- Importez votre client Supabase

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Remplacez votre fonction handleSubmit par celle-ci
// DANS : src/app/register/page.tsx

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // --- Validation Côté Client ---
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
        setIsLoading(false);
        return;
    }

    // --- Inscription avec Supabase ---
    // La magie opère ici : `options.data` envoie les métadonnées
    // que notre trigger SQL va utiliser pour créer le profil.
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    setIsLoading(false);

    if (signUpError) {
      if (signUpError.message.includes("User already registered")) {
        setError("Un utilisateur avec cet email existe déjà.");
      } else {
        setError(`Erreur d'inscription: ${signUpError.message}`);
      }
      return;
    }

    // Si on arrive ici, l'utilisateur a été créé dans auth.users
    // ET le trigger SQL a normalement créé le profil.
    if (user) {
        setSuccess("Compte créé avec succès ! Un email de confirmation a été envoyé. Vous pouvez maintenant vous connecter.");
        // Vider les champs du formulaire
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');

        setTimeout(() => {
          router.push('/'); // Redirige vers la page de connexion après 3 secondes
        }, 3000);
    } else {
        setError("Une erreur inattendue est survenue. Veuillez réessayer.")
    }
  };
  // --- FIN MODIFICATION ---


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 space-y-8">
          
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-lg">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Créer un Compte
            </h2>
            <p className="text-gray-600">Rejoignez la révolution de la livraison.</p>
          </div>

          {error && <div className="p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-xl text-center">{error}</div>}
          {success && <div className="p-3 bg-green-100 border border-green-300 text-green-700 text-sm rounded-xl text-center">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom complet</label>
              <input
                id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 transition-all bg-gray-50 hover:shadow-md"
                placeholder="Ex: Jean Dupont"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Adresse email</label>
              <input
                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 transition-all bg-gray-50 hover:shadow-md"
                placeholder="vous@exemple.com"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <input
                id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 transition-all bg-gray-50 hover:shadow-md"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
              <input
                id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 transition-all bg-gray-50 hover:shadow-md"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit" disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 disabled:from-green-400 text-white font-semibold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              {isLoading ? 'Création en cours...' : 'S\'inscrire'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Déjà un compte ?{' '}
            <button onClick={() => router.push('/')} className="text-green-600 hover:text-green-700 font-medium hover:underline">
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
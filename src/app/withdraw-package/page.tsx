// src/app/retrait/page.tsx

'use client'; // Requis pour utiliser le hook useRouter

import React from 'react';
import { useRouter } from 'next/navigation';
// On importe le composant que vous venez de fournir
import { WithdrawPackagePage } from './retrait'; // Assurez-vous que le chemin est correct

// Le nom de la fonction correspond au nom de la page
export default function RetraitPage() {
  // 1. On initialise le router de Next.js pour pouvoir naviguer
  const router = useRouter();

  // 2. On définit la fonction à exécuter lorsque le composant demande à être "fermé".
  // Ici, "fermer" signifie revenir au tableau de bord ou à l'accueil.
  const handleClose = () => {
    console.log("Action 'onClose' déclenchée : retour à la page d'accueil.");
    router.push('/home'); // Modifiez '/home' par la page de votre choix (ex: '/dashboard')
  };

  // 3. On définit la fonction à exécuter lorsque le retrait est un succès.
  // En général, on redirige l'utilisateur après un succès.
  const handleSuccess = () => {
    console.log("Action 'onSuccess' déclenchée : le retrait est terminé.");
    // Vous pourriez afficher une notification ici avant de rediriger
    router.push('/home'); // On le ramène à la page principale après le succès
  };

  // 4. On retourne directement le composant, en lui passant les fonctions de gestion
  // en tant que props.
  return (
    // La balise <main> est une bonne pratique sémantique
    <main>
      <WithdrawPackagePage
        onClose={handleClose} 
        onSuccess={handleSuccess} 
      />
    </main>
  );
}
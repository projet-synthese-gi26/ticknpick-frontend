// src/app/depot/page.tsx (ou là où vous voulez que cette page se trouve)

'use client'; // Requis car nous utilisons le hook useRouter pour la navigation

import React from 'react';
import { useRouter } from 'next/navigation';
import { DepotColis } from './depot';

export default function DepotPage() {
  const router = useRouter();

  // Cette fonction gère ce qui se passe quand le composant DepotColis veut "se fermer".
  // Au lieu de cacher le composant, nous naviguons vers une autre page.
  const handleClose = () => {
    console.log("Navigation vers la page d'accueil...");
    // Redirige l'utilisateur vers la page d'accueil ou le tableau de bord
    router.push('/home'); 
  };

  // Cette fonction gère ce qui se passe après un dépôt réussi.
  const handleSuccess = () => {
    console.log("Dépôt réussi ! Navigation vers la page d'accueil...");
    // Affiche une alerte (optionnel) puis redirige.
    alert("Colis déposé et bordereau généré avec succès !");
    router.push('/home'); // Vous pouvez rediriger vers une page d'inventaire par exemple
  };

  // On affiche directement le composant DepotColis et on lui passe les fonctions
  // de navigation en tant que props `onClose` et `onSuccess`.
  return (
    <main>
      <DepotColis 
        onClose={handleClose} 
        onSuccess={handleSuccess} 
      />
    </main>
  );
}
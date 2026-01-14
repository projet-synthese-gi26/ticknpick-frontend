'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Imports des composants et services existants
import FindDelivery from '@/app/dashboard/FindDelivery';
import { useAuth } from '@/context/AuthContext';
import { delivererService, DelivererPackage } from '@/services/delivererService';
import NavbarHome from '@/components/NavbarHome'; // Optionnel, pour avoir le menu si on ferme

export default function CollectPackagePage() {
    const router = useRouter();
    const { isAuthenticated, isLoading, user } = useAuth();
    const [isAssigning, setIsAssigning] = useState(false);

    // 1. Protection de la route (Livreur uniquement)
    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (user?.accountType !== 'BUSINESS_ACTOR' && user?.businessActorType !== 'DELIVERER') {
                // Si ce n'est pas un livreur, on redirige vers le home classique
                toast.error("Accès réservé aux livreurs.");
                router.push('/home');
            }
        }
    }, [isAuthenticated, isLoading, user, router]);

    // 2. Gestion de l'action "ACCEPTER" venant de FindDelivery
    const handleSelectPackage = async (pkg: DelivererPackage) => {
        if (isAssigning) return;
        setIsAssigning(true);
        const tId = toast.loading('Acceptation de la course...');
        
        console.log(`🟣 [PAGE] Tentative d'assignation colis ${pkg.trackingNumber}`);

        try {
            await delivererService.assignPackage(pkg.id);
            toast.success("Course acceptée avec succès !", { id: tId });
            
            // Redirection vers la page "Mes Livraisons" pour commencer le travail
            setTimeout(() => {
                router.push('/my-deliveries'); 
            }, 1000);
        } catch (error: any) {
            console.error("❌ Erreur Page:", error);
            toast.error(error.message || "Impossible d'accepter la course", { id: tId });
            setIsAssigning(false);
        }
    };

    // 3. Gestion de la fermeture (Retour Dashboard ou Home)
    const handleClose = () => {
        // Si l'utilisateur clique sur la croix, on le renvoie à ses livraisons ou au dashboard
        router.push('/dashboard'); 
    };

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
                <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
            </div>
        );
    }

    if (!isAuthenticated) return null; // Évite le flash avant redirect

    return (
        <main className="h-screen w-screen relative bg-slate-50 dark:bg-slate-900 overflow-hidden">
            <Toaster position="top-center" />
            
            {/* FindDelivery gère déjà son propre layout plein écran (z-50) */}
            <FindDelivery 
                onSelectPackage={handleSelectPackage} 
                onClose={handleClose} 
            />
            
            {/* Overlay de chargement pendant l'assignation */}
            {isAssigning && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                    <Loader2 className="w-16 h-16 animate-spin text-violet-500 mb-4" />
                    <h2 className="text-xl font-bold">Assignation en cours...</h2>
                    <p className="text-violet-200">Ajout à votre feuille de route</p>
                </div>
            )}
        </main>
    );
}
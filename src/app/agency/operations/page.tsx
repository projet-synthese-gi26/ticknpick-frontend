'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

// Imports des services et contexte
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/userservice';
import AgencyInventory from '@/app/dashboard/agence/AgencyInventory'; // Ajuste le chemin selon ta structure
import { UserProfile } from '@/app/dashboard/page'; // On réutilise l'interface définie

export default function AgencyOperationsZoomPage() {
    const router = useRouter();
    const { user: authUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    // --- LOGIQUE DE RÉCUPÉRATION DU PROFIL (Copie simplifiée de Dashboard) ---
    useEffect(() => {
        if (isAuthLoading) return;

        if (!isAuthenticated || !authUser) {
            router.push('/login');
            return;
        }

        const fetchProfile = async () => {
            setLoadingProfile(true);
            try {
                // On récupère le profil complet car AgencyInventory a besoin de l'ID propriétaire
                const apiProfile = await userService.getProfileById(authUser.id);
                
                // Normalisation minimale pour l'affichage
                const normalizedProfile = {
                    ...apiProfile,
                    account_type: (apiProfile.account_type || authUser.accountType || 'AGENCY').toUpperCase(),
                    // S'assurer qu'on a les IDs
                    id: apiProfile.id || authUser.id
                };

                // Vérification de sécurité
                if (normalizedProfile.account_type !== 'AGENCY' && normalizedProfile.account_type !== 'AGENCY_OWNER') {
                    // Redirection si ce n'est pas une agence
                    router.push('/home'); 
                    return;
                }

                setUserProfile(normalizedProfile);
            } catch (error) {
                console.error("Erreur chargement profil", error);
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchProfile();
    }, [isAuthLoading, isAuthenticated, authUser, router]);

    // --- RENDER ---

    if (isAuthLoading || loadingProfile || !userProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500"/>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black font-sans pb-20">
            {/* Header Flottant pour retour */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link 
                            href="/dashboard" // Retour au dashboard
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
                        >
                            <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-300"/>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <LayoutGrid className="w-6 h-6 text-orange-600"/>
                                Gestion Opérations & Stocks
                            </h1>
                            <p className="text-xs text-slate-500">Vue focus • {userProfile.manager_name}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu Principal */}
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                {/* On passe le profil chargé au composant AgencyInventory */}
                <AgencyInventory profile={userProfile} />
            </main>
        </div>
    );
}
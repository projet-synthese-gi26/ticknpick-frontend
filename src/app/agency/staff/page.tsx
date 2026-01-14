'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Users } from 'lucide-react';
import Link from 'next/link';

// Imports
import { useAuth } from '@/context/AuthContext';
import PersonnelPage from '@/app/dashboard/agence/Personnel'; // Ajuste le chemin selon ta structure

export default function AgencyStaffZoomPage() {
    const router = useRouter();
    const { user: authUser, isAuthenticated, isLoading } = useAuth();
    
    // Protection basique de route
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500"/>
            </div>
        );
    }

    if (!authUser) return null; // Sécurité le temps que le useEffect redirige

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black font-sans pb-20">
            {/* Header Flottant pour retour */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link 
                            href="/home" // Retour au dashboard
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
                        >
                            <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-300"/>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Users className="w-6 h-6 text-blue-600"/>
                                Gestion du Staff (RH)
                            </h1>
                            <p className="text-xs text-slate-500">Vue focus • Équipe Agence</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu Principal */}
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                {/* Le composant Personnel se charge de fetcher les données avec le contexte Auth */}
                <PersonnelPage />
            </main>
        </div>
    );
}
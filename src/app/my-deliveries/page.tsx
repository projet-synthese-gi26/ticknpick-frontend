'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// Imports
import DeliveriesDashboard from '@/app/dashboard/Deliveries'; // Le composant dashboard existant
import { useAuth } from '@/context/AuthContext';

export default function MyDeliveriesPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading, user } = useAuth();

    // Protection Route
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black pb-20">
            <Toaster position="top-right" />
            
            {/* Header Flottant spécifique à la page standalone */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm flex items-center gap-4">
                <button 
                    onClick={() => router.push('/dashboard')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-600 dark:text-slate-300"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="font-bold text-lg text-slate-900 dark:text-white">
                    Mon Espace Livreur
                </h1>
            </div>

            {/* Injection du module Deliveries existant */}
            {/* Note : Le composant DeliveriesPage gère lui-même son affichage et le switch List/Find. 
               Il s'affichera parfaitement ici comme contenu principal. */}
            <main>
                <DeliveriesDashboard />
            </main>
        </div>
    );
}
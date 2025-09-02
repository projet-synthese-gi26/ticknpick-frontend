// FICHIER : src/app/dashboard/Settings.tsx
'use client';
import React from 'react';
import { supabase } from '@/lib/supabase';
import ProProfile  from './page';
import { CreditCard, Lock, Shield, ArrowRight, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage({ profile, onUpdate }: { profile: ProProfile, onUpdate: () => void }) {
    const router = useRouter();

    const handleUpgradeToAgency = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir passer à un compte Agence ? Cette action est irréversible.")) {
            return;
        }

        const { error } = await supabase
            .from('profiles_pro')
            .update({ account_type: 'AGENCY' })
            .eq('id', profile.id);

        if (error) {
            alert("Erreur lors de la mise à niveau : " + error.message);
        } else {
            alert("Votre compte a été mis à niveau avec succès !");
            onUpdate(); // Re-fetch le profil dans le composant parent
            // Pas besoin de recharger, le parent mettra à jour l'UI
        }
    };
    
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">Paramètres du Compte</h1>

            {/* Informations de Paiement */}
            <div className="bg-white p-6 rounded-2xl shadow-md border">
                <h2 className="text-xl font-bold flex items-center gap-3 mb-4"><CreditCard className="text-orange-500"/> Informations de Paiement</h2>
                <p className="text-gray-500 mb-4">Gérez les informations pour recevoir vos commissions.</p>
                {/* Formulaire pour les infos bancaires/MoMo ici */}
                 <button className="font-semibold bg-orange-100 text-orange-700 px-4 py-2 rounded-lg">Mettre à jour</button>
            </div>

             {/* Sécurité */}
            <div className="bg-white p-6 rounded-2xl shadow-md border">
                <h2 className="text-xl font-bold flex items-center gap-3 mb-4"><Lock className="text-orange-500"/> Sécurité</h2>
                <p className="text-gray-500 mb-4">Changez votre mot de passe et activez l'authentification à deux facteurs.</p>
                 <button className="font-semibold bg-orange-100 text-orange-700 px-4 py-2 rounded-lg">Modifier le mot de passe</button>
            </div>
            
             {/* GESTION DES CONFLITS (placeholder) */}
            <div className="bg-white p-6 rounded-2xl shadow-md border">
                <h2 className="text-xl font-bold flex items-center gap-3 mb-4"><Shield className="text-orange-500"/> Litiges et Conflits</h2>
                <p className="text-gray-500 mb-4">Consultez et répondez aux litiges ou réclamations concernant vos colis.</p>
                 <button className="font-semibold bg-orange-100 text-orange-700 px-4 py-2 rounded-lg">Voir les litiges</button>
            </div>
            
            {/* MISE À NIVEAU VERS AGENCE */}
            {profile.account_type === 'FREELANCE' && (
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-8 rounded-2xl shadow-lg text-white">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                             <Building className="w-12 h-12"/>
                            <div>
                                <h2 className="text-2xl font-bold">Passez au niveau supérieur !</h2>
                                <p className="opacity-80">Débloquez la gestion de personnel et de multiples points relais en devenant une Agence.</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleUpgradeToAgency}
                            className="bg-white text-orange-600 font-bold py-3 px-6 rounded-full flex items-center gap-2 transform transition-transform hover:scale-105"
                        >
                            Devenir une Agence <ArrowRight/>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
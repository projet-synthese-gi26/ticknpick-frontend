// FICHIER : src/app/dashboard/Overview.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from './page'; // Importer le type
import { DollarSign, Package, TrendingUp, Users, Truck } from 'lucide-react';

interface KpiData {
    value: string;
    label: string;
    details: string;
    icon: React.ElementType;
    color: string;
}

const KpiCard = ({ kpi }: { kpi: KpiData }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-semibold text-gray-500">{kpi.label}</p>
                <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-xs text-gray-400 mt-2">{kpi.details}</p>
            </div>
            <div className={`bg-gradient-to-br from-${kpi.color}-400 to-${kpi.color}-500 p-4 rounded-2xl text-white shadow-lg`}>
                <kpi.icon className="h-6 w-6" />
            </div>
        </div>
    </div>
);


export default function OverviewDashboard({ profile }: { profile: UserProfile }) {
    const [kpis, setKpis] = useState<KpiData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchKpis = async () => {
            setIsLoading(true);
            const accountType = profile.account_type.toLowerCase();

            let fetchedKpis: KpiData[] = [];
            
            // --- Logique Client ---
            if (accountType === 'client') {
                const { count, error } = await supabase.from('shipments').select('*', { count: 'exact' }).eq('created_by_user', profile.id);
                const { data: shipments, error: costError } = await supabase.from('shipments').select('shipping_cost, created_at').eq('created_by_user', profile.id);

                const totalSpent = shipments?.reduce((acc, s) => acc + s.shipping_cost, 0) || 0;

                fetchedKpis = [
                    { value: (count ?? 0).toString(), label: "Colis Envoyés", details: "Nombre total de colis expédiés", icon: Package, color: 'orange' },
                    { value: `${totalSpent.toLocaleString()} FCFA`, label: "Dépenses Totales", details: "Coût total de vos envois", icon: DollarSign, color: 'green' }
                ];
            } 
            // --- Logique Livreur (données statiques pour l'exemple) ---
            else if (accountType === 'livreur') {
                fetchedKpis = [
                    { value: "5", label: "Livraisons du jour", details: "Colis livrés aujourd'hui", icon: Truck, color: 'blue' },
                    { value: "12", label: "Colis à récupérer", details: "Dans les points relais", icon: Package, color: 'amber' }
                ];
            } 
            // --- Logique Freelance / Agence (business stats) ---
            else {
                const { count, error } = await supabase.from('shipments').select('*', { count: 'exact' });
                const { data: shipments, error: revenueError } = await supabase.from('shipments').select('shipping_cost, created_at');

                const totalRevenue = shipments?.reduce((acc, s) => acc + s.shipping_cost, 0) || 0;
                const today = new Date().toISOString().slice(0, 10);
                const dailyRevenue = shipments?.filter(s => s.created_at.startsWith(today)).reduce((acc, s) => acc + s.shipping_cost, 0) || 0;

                fetchedKpis = [
                    { value: (count ?? 0).toString(), label: "Colis Total", details: "Traité par le réseau", icon: Package, color: 'orange' },
                    { value: `${dailyRevenue.toLocaleString()} FCFA`, label: "Revenu du Jour", details: "Basé sur les nouveaux envois", icon: DollarSign, color: 'green' },
                    { value: `${totalRevenue.toLocaleString()} FCFA`, label: "Revenu Total", details: "Depuis le début", icon: TrendingUp, color: 'blue' },
                ];
            }

            setKpis(fetchedKpis);
            setIsLoading(false);
        };

        fetchKpis();
    }, [profile]);
    
    if (isLoading) {
        return <p>Chargement des statistiques...</p>
    }

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-800">Vue d'ensemble</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kpis.map(kpi => <KpiCard key={kpi.label} kpi={kpi} />)}
            </div>
            {/* Vous pouvez ajouter des graphiques ici en fonction du rôle */}
        </div>
    );
}
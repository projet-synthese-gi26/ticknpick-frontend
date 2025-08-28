// FICHIER : src/app/dashboard/Overview.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Clock,
  Archive,
  CheckCircle,
  BarChart3, User,
  TrendingUp,
  Package,
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler
);

// --- Interfaces & Types ---
interface KpiCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string; // ex: 'orange', 'amber', etc.
    details: string;
}

interface KpiData {
    enAttente: number;
    recus: number;
    retires: number;
    revenuJour: number;
}

interface ChartData {
    labels: string[];
    datasets: any[];
}


// --- SOUS-COMPOSANTS UI ---
const KpiCard = ({ title, value, icon, color, details }: KpiCardProps) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className="text-sm font-semibold text-gray-500 mb-1">{title}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-2">{details}</p>
            </div>
            <div className={`bg-gradient-to-br from-${color}-400 to-${color}-500 p-4 rounded-2xl text-white ml-2 shadow-lg`}>
                {icon}
            </div>
        </div>
    </div>
);

const ChartContainer = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
        <h3 className="font-bold text-xl mb-6 text-gray-900">{title}</h3>
        <div className="h-72"> {/* Hauteur fixe pour le conteneur du graphique */}
             {children}
        </div>
    </div>
);

// --- COMPOSANT PRINCIPAL ---
export default function OverviewDashboard() {
    const [kpiData, setKpiData] = useState<KpiData | null>(null);
    const [weeklyChartData, setWeeklyChartData] = useState<ChartData | null>(null);
    const [statusChartData, setStatusChartData] = useState<ChartData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Récupérer tous les colis pour les calculs
                const { data: shipments, error: shipmentsError } = await supabase
                    .from('Shipment')
                    .select('status, shippingCost, created_at, updated_at');

                if (shipmentsError) throw shipmentsError;

                // --- 1. Calcul des KPIs ---
                const today = new Date().toISOString().slice(0, 10);
                const kpis: KpiData = { enAttente: 0, recus: 0, retires: 0, revenuJour: 0 };

                shipments.forEach(shipment => {
                    // Les statuts sont mappés pour une meilleure lisibilité
                    if (shipment.status === 'EN_ATTENTE_DE_DEPOT') kpis.enAttente++;
                    if (['AU_DEPART', 'EN_TRANSIT', 'ARRIVE_AU_RELAIS'].includes(shipment.status)) kpis.recus++;
                    if (shipment.status === 'RECU') {
                        kpis.retires++;
                        // Si le colis a été mis à jour (retiré) aujourd'hui
                        if (shipment.updated_at.startsWith(today)) {
                            kpis.revenuJour += shipment.shippingCost;
                        }
                    }
                });
                setKpiData(kpis);

                // --- 2. Préparation des données du graphique hebdomadaire ---
                const weeklyVolume = Array(7).fill(0).map(() => ({ recus: 0, retires: 0 }));
                const labels = Array(7).fill(0).map((_, i) => {
                    const d = new Date(); d.setDate(d.getDate() - i);
                    return d.toLocaleDateString('fr-FR', { weekday: 'short' });
                }).reverse();

                shipments.forEach(shipment => {
                    const eventDate = new Date(shipment.updated_at);
                    const now = new Date();
                    const diffDays = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 3600 * 24));
                    
                    if (diffDays < 7) {
                        const dayIndex = 6 - diffDays;
                        if (dayIndex >= 0) {
                            if (shipment.status !== 'EN_ATTENTE_DE_DEPOT') weeklyVolume[dayIndex].recus++;
                            if (shipment.status === 'RECU') weeklyVolume[dayIndex].retires++;
                        }
                    }
                });
                
                setWeeklyChartData({
                    labels,
                    datasets: [{
                        label: 'Colis Reçus/Transités',
                        data: weeklyVolume.map(d => d.recus),
                        fill: true,
                        backgroundColor: 'rgba(251, 146, 60, 0.1)', // orange-400
                        borderColor: '#fb923c',
                        tension: 0.4,
                    }, {
                        label: 'Colis Retirés',
                        data: weeklyVolume.map(d => d.retires),
                        fill: true,
                        backgroundColor: 'rgba(245, 158, 11, 0.1)', // amber-500
                        borderColor: '#f59e0b',
                        tension: 0.4,
                    }]
                });

                 // --- 3. Préparation des données du graphique de répartition ---
                const totalNonRetires = kpis.enAttente + kpis.recus;
                setStatusChartData({
                    labels: ['En attente de Dépôt', 'Reçu / En Transit', 'Retirés'],
                    datasets: [{
                        data: [kpis.enAttente, kpis.recus, kpis.retires],
                        backgroundColor: ['#f97316', '#3b82f6', '#16a34a' ], // Orange, Bleu (pour le contraste), Vert
                        borderColor: '#fff',
                        borderWidth: 4,
                        hoverOffset: 10
                    }]
                });


            } catch (err: any) {
                console.error("Erreur Dashboard:", err);
                setError("Impossible de charger les données du tableau de bord.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    }

  return (
    <div className="space-y-8">
        {/* Cartes KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard 
                title="En Attente de Dépôt" 
                value={kpiData?.enAttente.toString() || '0'} 
                icon={<Clock className="h-6 w-6" />}
                color="orange"
                details="Colis pré-enregistrés"
            />
            <KpiCard 
                title="En Stock / Transit" 
                value={kpiData?.recus.toString() || '0'} 
                icon={<Archive className="h-6 w-6" />}
                color="blue" // Utiliser une couleur contrastante
                details="Présents dans le réseau"
            />
             <KpiCard 
                title="Colis Retirés" 
                value={kpiData?.retires.toString() || '0'} 
                icon={<CheckCircle className="h-6 w-6" />}
                color="green"
                details="Finalisés ce mois-ci"
            />
            <KpiCard 
                title="Revenus du Jour" 
                value={`${(kpiData?.revenuJour || 0).toLocaleString()} FCFA`}
                icon={<BarChart3 className="h-6 w-6" />}
                color="amber"
                details="Basé sur les retraits"
            />
        </div>
        
        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                 <ChartContainer title="Activité Hebdomadaire">
                     {weeklyChartData && <Line data={weeklyChartData} options={{ maintainAspectRatio: false, responsive: true }} />}
                </ChartContainer>
            </div>
            <div>
                 <ChartContainer title="Répartition des Colis">
                    {statusChartData && <Doughnut data={statusChartData} options={{ maintainAspectRatio: false, responsive: true, cutout: '70%' }} />}
                </ChartContainer>
            </div>
        </div>

        {/* Section Accès Rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <ActionCard title="Enregistrer un nouveau colis" icon={Package} href="/emit-package" />
             <ActionCard title="Gérer l'inventaire" icon={ClipboardList} href="#" isInventory={true} />
             <ActionCard title="Voir le profil du relais" icon={User} href="#" isProfile={true} />
        </div>
    </div>
  );
}

const ActionCard = ({ title, icon: Icon, href, isInventory = false, isProfile = false }: any) => {
    // Dans le futur, ces boutons pourraient appeler setActiveTab('inventory') par exemple
    const handleClick = () => {
        if(href === '#') {
             alert(`Navigation vers '${title}' à implémenter.`);
        } else {
             // Redirection via Next Router si nécessaire
        }
    }
    
    return(
        <a href={href} className="group block">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:bg-orange-50 hover:border-orange-200 transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className="bg-orange-100 p-3 rounded-lg">
                        <Icon className="w-6 h-6 text-orange-600"/>
                    </div>
                    <p className="font-bold text-gray-800">{title}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-transform" />
            </div>
        </a>
    )
}
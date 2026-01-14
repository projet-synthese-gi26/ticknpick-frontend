'use client';
import React, { useState, useEffect } from 'react';
import { Building, Package, Users, Truck, Wallet, TrendingUp, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { agencyService, Agency } from '@/services/agencyService';

const KpiCard = ({ title, value, icon: Icon, color, subText }: any) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">{title}</p>
            <h3 className="text-3xl font-black text-gray-800 dark:text-white mt-1">{value}</h3>
            {subText && <p className="text-xs text-gray-400 mt-1">{subText}</p>}
        </div>
        <div className={`p-4 rounded-xl bg-${color}-50 text-${color}-600 dark:bg-${color}-900/20`}>
            <Icon className="w-8 h-8"/>
        </div>
    </div>
);

export default function AgencyOverview({ profile, setActiveTab }: { profile: any, setActiveTab: any }) {
    const [loading, setLoading] = useState(true);
    const [agency, setAgency] = useState<Agency | null>(null);
    const [stats, setStats] = useState({ 
        employees: 0, 
        relays: 0, 
        activePackages: 0,
        totalPackages: 0 
    });

    const fetchData = async () => {
        // Sécurité : ne pas lancer si pas d'ID
        if (!profile?.id) return;
        
        console.group('🏭 [DASHBOARD AGENCY] Chargement des données');
        setLoading(true);

        try {
            // Etape 1 : Récupérer l'agence
            // L'ID utilisé ici est celui de l'USER (qui est owner), c'est correct
            const ag = await agencyService.getAgencyByOwnerId(profile.id);

            // Vérification stricte que l'objet récupéré a un ID
            if (ag && ag.id) {
                console.log('✅ Agence validée (ID détecté):', ag.id);
                setAgency(ag); // On met à jour l'état UI

                // Etape 2 : Récupérer les détails avec L'ID DE L'AGENCE
                // Note : C'est ici que l'erreur "undefined" se produisait
                const [relaysData, employeesData, packagesData] = await Promise.all([
                    agencyService.getAgencyRelayPoints(ag.id),
                    agencyService.getAgencyEmployees(ag.id),
                    agencyService.getAllAgencyPackages(ag.id)
                ]);

                // Etape 3 : Calculs
                const relayCount = Array.isArray(relaysData) ? relaysData.length : 0;
                const employeeCount = Array.isArray(employeesData) ? employeesData.length : 0;
                const allPkgs = Array.isArray(packagesData) ? packagesData : [];
                
                // Exemple simple : les colis "actifs" sont ceux qui ne sont pas finis
                const activePkgs = allPkgs.filter((p: any) => {
                    const s = (p.status || p.currentStatus || '').toUpperCase();
                    return !['LIVRE', 'RECU', 'DELIVERED', 'COMPLETED', 'WITHDRAWN'].includes(s);
                }).length;

                console.log(`📊 Données reçues : ${relayCount} relais, ${employeeCount} employés, ${allPkgs.length} colis.`);

                setStats({
                    relays: relayCount,
                    employees: employeeCount,
                    totalPackages: allPkgs.length,
                    activePackages: activePkgs
                });

            } else {
                console.warn("⚠️ Aucune agence trouvée ou format ID incorrect.");
            }
        } catch (e: any) {
            console.error("❌ Erreur Fetch Dashboard Agency:", e);
            // Evite d'afficher l'erreur technique java à l'utilisateur
            if (!e.message.includes('400')) { 
                 toast.error("Problème de connexion aux données de l'agence");
            }
        } finally {
            setLoading(false);
            console.groupEnd();
        }
    };

    useEffect(() => {
        if(profile) fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile]); // On ne déclenche que si le profil change (éviter boucles infinies)

    useEffect(() => {
        fetchData();
    }, [profile]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin"/>
                <p className="text-slate-500 font-medium animate-pulse">Synchronisation des données agence...</p>
            </div>
        );
    }

    if (!agency) {
        return (
            <div className="p-8 text-center bg-red-50 border border-red-100 rounded-2xl">
                <Building className="w-12 h-12 mx-auto mb-3 text-red-400 opacity-50"/> 
                <h3 className="text-red-700 font-bold text-lg">Aucune agence trouvée</h3>
                <p className="text-red-600 text-sm mt-1">Veuillez configurer votre agence dans les paramètres.</p>
                <button 
                    onClick={() => setActiveTab('settings')}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow hover:bg-red-700 transition"
                >
                    Configurer Agence
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Carte */}
            <div className="flex flex-col md:flex-row justify-between items-end bg-gradient-to-r from-slate-900 to-blue-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                {/* Décoration de fond */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 text-[10px] font-bold uppercase border border-blue-400/30">Agence Principale</span>
                        {agency.is_enabled && <span className="px-2 py-0.5 rounded bg-green-500/30 text-green-200 text-[10px] font-bold uppercase border border-green-400/30">Vérifiée</span>}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black mb-2">{agency.commercialName || agency.commercial_name}</h1>
                    <p className="text-blue-200 flex items-center gap-2 text-sm font-medium opacity-90">
                        <Building className="w-4 h-4"/> 
                        Siège : {agency.address_locality || 'Ville inconnue'}, {agency.address}
                    </p>
                </div>
                <div className="text-right mt-6 md:mt-0 relative z-10">
                    <button 
                        onClick={fetchData}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition mb-2 inline-flex"
                        title="Actualiser les données"
                    >
                        <RefreshCw className="w-4 h-4 text-white"/>
                    </button>
                    <div>
                        <p className="text-[10px] text-blue-300 uppercase font-bold tracking-wider">Chiffre d'Affaires (Mois)</p>
                        <h2 className="text-3xl font-black mt-1 tracking-tight">1 250 000 <span className="text-lg font-medium text-blue-300">FCFA</span></h2>
                        <p className="text-[10px] text-green-400 mt-1">+12% vs mois dernier</p>
                    </div>
                </div>
            </div>

            {/* Grid KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    title="Personnel Total" 
                    value={stats.employees} 
                    icon={Users} 
                    color="blue"
                    subText={`${stats.employees > 0 ? 'Equipe active' : 'Recrutez !'}`}
                />
                <KpiCard 
                    title="Points Relais" 
                    value={stats.relays} 
                    icon={Building} 
                    color="purple" 
                    subText="Hubs connectés"
                />
                <KpiCard 
                    title="Colis en Transit" 
                    value={stats.activePackages} 
                    icon={Package} 
                    color="emerald" 
                    subText={`Sur ${stats.totalPackages} total`}
                />
                <KpiCard 
                    title="Incidents" 
                    value="0" 
                    icon={AlertTriangle} 
                    color="orange" 
                    subText="Requiert attention"
                />
            </div>

            {/* Zone d'Actions ou Liste Rapide */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Ex: Derniers mouvements */}
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                     <h3 className="font-bold text-slate-800 dark:text-white mb-4">Activité Récente</h3>
                     {stats.totalPackages === 0 ? (
                         <p className="text-sm text-slate-500 italic">Aucune activité colis détectée pour le moment.</p>
                     ) : (
                         <ul className="space-y-3">
                             <li className="flex justify-between text-sm p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                 <span>Synchronisation colis terminée</span>
                                 <span className="text-slate-400 text-xs">{new Date().toLocaleTimeString()}</span>
                             </li>
                             <li className="flex justify-between text-sm p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                 <span>Données agence chargées</span>
                                 <span className="text-slate-400 text-xs">...</span>
                             </li>
                         </ul>
                     )}
                 </div>
                 
                 {/* Ex: Raccourcis */}
                 <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-2xl border border-orange-100 dark:border-orange-800">
                     <h3 className="font-bold text-orange-900 dark:text-orange-200 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5"/> Performances
                     </h3>
                     <p className="text-sm text-orange-800 dark:text-orange-300 mb-4">
                         Votre réseau opère à {stats.relays > 0 ? '100%' : '0%'} de sa capacité structurelle. 
                         Pensez à ajouter plus de points relais pour augmenter votre couverture.
                     </p>
                     <button 
                        onClick={() => setActiveTab('my-relays')}
                        className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold text-sm shadow-sm border border-orange-200 hover:bg-orange-50 transition"
                     >
                        Gérer mon Réseau
                     </button>
                 </div>
            </div>
        </div>
    );
}
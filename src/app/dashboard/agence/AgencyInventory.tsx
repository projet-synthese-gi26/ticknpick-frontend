// FICHIER: src/app/dashboard/agence/AgencyInventory.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, ArrowLeftRight, Search, LayoutGrid, Loader2, Package, Inbox, Archive, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

import InventoryPage from '../Inventaire';
import { relayPointService, RelayPoint } from '@/services/relayPointService';
import { agencyService } from '@/services/agencyService';

interface AgencyInventoryProps {
    profile: any;
    selectedRelayId?: string | null; // <--- Nouvelle Prop pour l'auto-selection depuis l'extérieur
}

// Widget Stat pour l'en-tête Agence
const GlobalStat = ({ icon: Icon, value, label }: any) => (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-orange-600"><Icon className="w-4 h-4"/></div>
        <div>
            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{value}</p>
            <p className="text-[10px] uppercase font-bold text-slate-400">{label}</p>
        </div>
    </div>
);

export default function AgencyInventory({ profile, selectedRelayId }: AgencyInventoryProps) {
    const [isLoadingPoints, setIsLoadingPoints] = useState(true);
    const [points, setPoints] = useState<RelayPoint[]>([]);
    
    // Si selectedRelayId est passé en props, on l'utilise, sinon null (attente choix user)
    const [activeRelayId, setActiveRelayId] = useState<string | null>(selectedRelayId || null);
    
    // Stats Globales Agence (Tous relais confondus)
    const [globalStats, setGlobalStats] = useState({ total: 0, stock: 0, transit: 0 });

    useEffect(() => {
        // Mise à jour si la prop change (navigation externe)
        if (selectedRelayId) setActiveRelayId(selectedRelayId);
    }, [selectedRelayId]);

    // CHARGEMENT DONNÉES & STATS GLOBALES
    useEffect(() => {
        const loadRelaysAndStats = async () => {
            setIsLoadingPoints(true);
            try {
                // 1. Identification Agence
                const ag = await agencyService.getAgencyByOwnerId(profile.id);
                if (!ag) throw new Error("Agence introuvable");

                // 2. Chargement Points Relais
                const myPoints = await agencyService.getAgencyRelayPoints(ag.id);
                setPoints(myPoints);
                
                // Si rien n'est sélectionné et qu'il y a des points, auto-select le premier (UX choice)
                // OU garder vide pour forcer le choix. Ici, auto-select premier si liste non vide.
                if (!activeRelayId && myPoints.length > 0) {
                     setActiveRelayId(myPoints[0].id);
                }

                // 3. CHARGEMENT STATS GLOBALES (Tous les colis de l'agence)
                console.log("📊 Calcul des statistiques globales de l'agence...");
                const allPkgs = await agencyService.getAllAgencyPackages(ag.id);
                
                // Calcul
                const total = allPkgs.length;
                const stock = allPkgs.filter((p: any) => 
                    ['ARRIVE_AU_RELAIS', 'AT_ARRIVAL_RELAY_POINT', 'AT_DEPARTURE_RELAY_POINT', 'STOCK'].includes(p.status)
                ).length;
                const transit = allPkgs.filter((p: any) => 
                    ['EN_TRANSIT', 'DEPART'].includes(p.status)
                ).length;

                setGlobalStats({ total, stock, transit });

            } catch (err: any) {
                console.error("Erreur Inventory Agency", err);
                toast.error("Impossible de charger les données");
            } finally {
                setIsLoadingPoints(false);
            }
        };

        loadRelaysAndStats();
    }, [profile, selectedRelayId]); // Trigger re-load si profile change (ou forced refresh)


    // Transformation Profile pour le composant enfant Inventaire
    const injectedProfile = useMemo(() => {
        if (!activeRelayId) return null;
        return {
            ...profile,
            assigned_relay_point_id: activeRelayId,
            _context_source: 'AGENCY_OVERRIDE'
        };
    }, [profile, activeRelayId]);

    const selectedPoint = points.find(p => p.id === activeRelayId);

    if (isLoadingPoints) return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
             <Loader2 className="w-10 h-10 animate-spin text-orange-500"/>
             <p className="text-slate-500 font-medium">Chargement du réseau d'agence...</p>
        </div>
    );

    return (
        <div className="min-h-screen space-y-6">
            
            {/* HEADER : Sélecteur + Stats Globales Agence */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-3 shadow-sm flex flex-col xl:flex-row gap-4 items-center sticky top-2 z-40 transition-all duration-300">
                
                {/* Selecteur Hub */}
                <div className="flex-1 w-full xl:w-auto relative group min-w-[300px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className={`w-5 h-5 transition-colors ${selectedPoint ? 'text-orange-600' : 'text-slate-400'}`}/>
                    </div>
                    <select 
                        value={activeRelayId || ''}
                        onChange={(e) => setActiveRelayId(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-slate-800 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-orange-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition appearance-none text-sm sm:text-base"
                    >
                        <option value="" disabled>-- Sélectionner un Hub --</option>
                        {points.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.relayPointName}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ArrowLeftRight className="w-4 h-4"/>
                    </div>
                </div>

                {/* Barre Stats Globales Agence (Visible sur Desktop) */}
                <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1 px-2 border-l border-slate-200 dark:border-slate-700">
                     <span className="text-[10px] font-bold text-slate-400 uppercase mr-2 shrink-0">Agence Global :</span>
                     <GlobalStat icon={Package} value={globalStats.total} label="Total Flux"/>
                     <GlobalStat icon={Inbox} value={globalStats.stock} label="En Stock"/>
                     <GlobalStat icon={Truck} value={globalStats.transit} label="En Transit"/>
                </div>
            </div>

            {/* CORPS : INVENTAIRE */}
            <div className="min-h-[600px] relative">
                <AnimatePresence mode="wait">
                    
                    {!activeRelayId ? (
                        <motion.div 
                           key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} 
                           className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30"
                        >
                            <div className="bg-orange-100 dark:bg-orange-900/20 p-6 rounded-full mb-6">
                                <LayoutGrid className="w-12 h-12 text-orange-500"/>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Sélectionnez un Hub</h2>
                            <p className="text-slate-500 max-w-md mx-auto mb-6">
                                Choisissez un point relais pour voir son inventaire spécifique.
                            </p>
                            {points.length === 0 && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold border border-red-200">
                                    Aucun point relais trouvé pour votre agence.
                                </div>
                            )}
                        </motion.div>
                    
                    ) : (
                        <motion.div 
                           key={activeRelayId} // Force remount du composant enfant quand ID change
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -10 }}
                           transition={{ duration: 0.2 }}
                        >
                            {injectedProfile && (
                                <>
                                    <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-blue-800 animate-in fade-in">
                                        <Building className="w-3 h-3"/> 
                                        Vue Superviseur : {selectedPoint?.relayPointName}
                                    </div>

                                    {/* L'INVENTAIRE RÉUTILISÉ */}
                                    <InventoryPage profile={injectedProfile} />
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
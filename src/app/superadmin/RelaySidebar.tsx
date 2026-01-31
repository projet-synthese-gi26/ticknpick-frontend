// FICHIER : src/app/superadmin/components/RelaySidebar.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, MapPin, Phone, Mail, Clock, ShieldCheck, 
    AlertTriangle, Package, CheckCircle, Store, Power 
} from 'lucide-react';
import { RelayPoint } from '@/services/relayPointService';

interface RelaySidebarProps {
    relay: RelayPoint | null;
    onClose: () => void;
    onAction: (action: string, id: string) => void;
}

export default function RelaySidebar({ relay, onClose, onAction }: RelaySidebarProps) {
    if (!relay) return null;

    // Détermine le statut pour le badge et l'affichage conditionnel
    const isPending = relay.status.includes('PENDING');
    const isActive = relay.status === 'ACTIVE';
    const isSuspended = relay.status === 'SUSPENDED';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
                {/* Backdrop Clickable */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                />

                {/* Sidebar Panel */}
                <motion.div 
                    initial={{ x: '100%' }} 
                    animate={{ x: '0%' }} 
                    exit={{ x: '100%' }} 
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl pointer-events-auto border-l border-slate-200 dark:border-slate-800 flex flex-col z-50"
                >
                    {/* HEADER AVEC PHOTO COVER */}
                    <div className="relative h-56 bg-slate-100 dark:bg-slate-800 group">
                        {relay.photoUrl ? (
                            <img src={relay.photoUrl} alt={relay.relayPointName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500">
                                <Store className="w-20 h-20 text-white/50" />
                            </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10"></div>

                        {/* Actions Rapides en haut */}
                        <div className="absolute top-4 right-4 flex gap-2">
                             <button onClick={onClose} className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition">
                                 <X className="w-5 h-5"/>
                             </button>
                        </div>

                        {/* Titre Overlay */}
                        <div className="absolute bottom-0 left-0 w-full p-6">
                             <h2 className="text-2xl font-bold text-white mb-2 shadow-sm">{relay.relayPointName}</h2>
                             <div className="flex flex-wrap items-center gap-2 text-white/90 text-xs">
                                 <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                                     isActive ? 'bg-green-500' : isSuspended ? 'bg-red-500' : 'bg-yellow-500'
                                 } text-white`}>
                                     {relay.status.replace('_',' ')}
                                 </span>
                                 <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm"><MapPin className="w-3 h-3"/> {relay.locality || 'Ville inconnue'}</span>
                             </div>
                        </div>
                    </div>

                    {/* CORPS SCROLLABLE */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50 dark:bg-slate-900">
                        
                        {/* Section Alertes (Action Requise) */}
                        {isPending && (
                            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl shadow-sm">
                                <h4 className="font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-5 h-5"/> Validation Requise
                                </h4>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mb-4 leading-relaxed">
                                    Ce point relais attend votre approbation pour commencer ses activités. Vérifiez la conformité avant de valider.
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => onAction('APPROVE', relay.id)} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-green-500/20">Valider</button>
                                    <button onClick={() => onAction('REJECT', relay.id)} className="flex-1 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 dark:bg-slate-800 dark:border-red-900 text-sm font-bold rounded-xl transition">Rejeter</button>
                                </div>
                            </div>
                        )}

                        {/* Informations Détail Grid */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-wider border-b pb-2 dark:border-slate-800 flex items-center gap-2">
                                <Store className="w-4 h-4"/> Détails Opérationnels
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Occupation</span>
                                    <span className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        {relay.current_package_count || 0} <span className="text-sm text-slate-400 font-medium">/ {relay.maxCapacity}</span>
                                    </span>
                                    <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, ((relay.current_package_count||0)/relay.maxCapacity)*100)}%` }}/>
                                    </div>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Horaires</span>
                                    <span className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-orange-500"/> {relay.openingHours || "Non défini"}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-3">
                                <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <MapPin className="w-5 h-5 text-blue-500 mt-0.5 shrink-0"/>
                                    <div>
                                        <p className="font-bold text-xs uppercase text-slate-400 mb-0.5">Adresse Physique</p>
                                        <p>{relay.address || relay.relay_point_address || "Non renseignée"}</p>
                                    </div>
                                </div>
                                <div className="w-full h-px bg-slate-100 dark:bg-slate-700"></div>
                                <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <Phone className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/>
                                    <div>
                                        <p className="font-bold text-xs uppercase text-slate-400 mb-0.5">Contact</p>
                                        <p>{relay.contactPhone || "Non renseigné"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Documents & Conformité */}
                        <div>
                             <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-wider border-b pb-2 mb-4 dark:border-slate-800 flex items-center gap-2">
                                 <ShieldCheck className="w-4 h-4"/> Conformité
                             </h3>
                             <div className="flex gap-3">
                                 {relay.documents ? (
                                     <span className="text-green-700 bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 w-full justify-center">
                                         <CheckCircle className="w-4 h-4"/> Dossier Validé
                                     </span>
                                 ) : (
                                     <span className="text-slate-500 bg-slate-200 dark:bg-slate-800 px-3 py-2 rounded-lg text-xs font-medium w-full text-center italic">
                                         Documents manquants
                                     </span>
                                 )}
                             </div>
                        </div>
                    </div>
                    
                    {/* FOOTER ACTIONS DANGER */}
                    {(isActive || isSuspended) && (
                        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                             <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-3 tracking-wider">Administration Avancée</h4>
                             <div className="grid grid-cols-2 gap-4">
                                 {isSuspended ? (
                                     <button onClick={() => onAction('LIFT_SUSPENSION', relay.id)} className="w-full py-3 bg-green-100 text-green-700 hover:bg-green-200 font-bold rounded-xl text-sm transition border border-green-200">Lever Suspension</button>
                                 ) : (
                                     <button onClick={() => onAction('SUSPEND', relay.id)} className="w-full py-3 bg-orange-100 text-orange-700 hover:bg-orange-200 font-bold rounded-xl text-sm transition border border-orange-200">Suspendre</button>
                                 )}
                                 
                                 <button onClick={() => onAction('DEACTIVATE', relay.id)} className="w-full py-3 bg-red-100 text-red-700 hover:bg-red-200 font-bold rounded-xl text-sm transition border border-red-200 flex items-center justify-center gap-2">
                                     <Power className="w-4 h-4"/> Désactiver
                                 </button>
                             </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
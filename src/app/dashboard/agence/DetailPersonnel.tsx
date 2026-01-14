'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, Mail, MapPin, Building, Calendar, Activity, ShieldCheck, Truck, Briefcase, Clock } from 'lucide-react';
import { RelayPoint } from '@/services/relayPointService';

interface DetailPersonnelProps {
    employee: any;
    onClose: () => void;
    relayPoint?: RelayPoint | null; // Le point relais géré par cet employé (si applicable)
}

export default function DetailPersonnel({ employee, onClose, relayPoint }: DetailPersonnelProps) {
    if (!employee) return null;

    const isRelayManager = employee.role === 'RELAY_MANAGER';
    
    // Déterminer la couleur du rôle
    const getRoleBadge = (role: string) => {
        switch(role) {
            case 'AGENCY_MANAGER': return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-200">Manager Agence</span>;
            case 'RELAY_MANAGER': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">Gérant Relais</span>;
            case 'DELIVERER': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">Livreur</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">Employé</span>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
            {/* Backdrop transparent qui permet de cliquer pour fermer */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity pointer-events-auto" onClick={onClose} />

            {/* Sidebar Slide Over */}
            <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="absolute inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl pointer-events-auto border-l dark:border-slate-800 flex flex-col"
            >
                {/* Header */}
                <div className="h-32 bg-gradient-to-r from-orange-500 to-amber-600 relative p-6 flex justify-between items-start shrink-0">
                    <button 
                        onClick={onClose}
                        className="p-2 bg-black/20 text-white rounded-full hover:bg-black/30 transition backdrop-blur-sm"
                    >
                        <X className="w-5 h-5"/>
                    </button>
                    <div className="absolute -bottom-10 left-6">
                        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-2xl p-1 shadow-lg">
                            <div className="w-full h-full bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center overflow-hidden">
                                {employee.photoUrl ? (
                                    <img src={employee.photoUrl} alt={employee.name} className="w-full h-full object-cover"/>
                                ) : (
                                    <User className="w-10 h-10 text-slate-400"/>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto px-6 pt-12 pb-6 space-y-8 custom-scrollbar">
                    
                    {/* 1. Identité */}
                    <div>
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-1">{employee.name}</h2>
                                <p className="text-slate-500 dark:text-gray-400 font-mono text-xs">{employee.id}</p>
                            </div>
                            {getRoleBadge(employee.role)}
                        </div>
                        
                        <div className="mt-6 space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                <Mail className="w-5 h-5 text-orange-500"/>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Email (Identifiant)</p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{employee.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                <Phone className="w-5 h-5 text-orange-500"/>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Téléphone</p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{employee.phone}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Infos Professionnelles & Relais */}
                    <div>
                        <h3 className="text-sm font-black uppercase text-gray-400 mb-4 tracking-wider flex items-center gap-2">
                            <Briefcase/> Activité & Affectation
                        </h3>

                        {isRelayManager ? (
                            relayPoint ? (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-lg text-blue-600 dark:text-blue-300">
                                            <Building className="w-6 h-6"/>
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-600 dark:text-blue-300 font-bold uppercase">Point Relais Géré</p>
                                            <p className="text-lg font-bold text-slate-800 dark:text-white">{relayPoint.relayPointName}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pl-1 text-sm text-slate-600 dark:text-slate-300">
                                        <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-400"/> {relayPoint.address || relayPoint.relay_point_address}</p>
                                        <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400"/> {relayPoint.openingHours || "Horaires non définis"}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-900/30 grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-blue-400 uppercase">Capacité</span>
                                            <p className="text-xl font-black text-slate-700 dark:text-gray-200">{relayPoint.maxCapacity}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-blue-400 uppercase">Colis Actuels</span>
                                            <p className="text-xl font-black text-slate-700 dark:text-gray-200">{relayPoint.current_package_count}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5"/> Rôle Gérant mais aucun relais assigné !
                                </div>
                            )
                        ) : (
                            <div className="p-5 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-center text-slate-500">
                                <Truck className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                                <p className="text-sm">Cet employé est membre du siège / Flotte</p>
                            </div>
                        )}
                    </div>

                    {/* 3. Métriques / Stats (Fictif pour l'instant) */}
                    <div>
                        <h3 className="text-sm font-black uppercase text-gray-400 mb-4 tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4"/> Performance (30j)
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                                <p className="text-2xl font-black text-green-600 dark:text-green-400">98%</p>
                                <p className="text-[10px] font-bold uppercase text-green-700/60 dark:text-green-300/60">Taux de présence</p>
                            </div>
                            <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30">
                                <p className="text-2xl font-black text-orange-600 dark:text-orange-400">145</p>
                                <p className="text-[10px] font-bold uppercase text-orange-700/60 dark:text-orange-300/60">Colis Traités</p>
                            </div>
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}


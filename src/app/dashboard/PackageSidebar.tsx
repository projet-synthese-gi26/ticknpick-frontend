'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Box, User, Phone, DollarSign, Calendar, Info, Navigation, ArrowRight, Check } from 'lucide-react';
import { DelivererPackage } from '@/services/delivererService';

interface PackageSidebarProps {
    pkg: DelivererPackage;
    isOpen: boolean;
    onClose: () => void;
    // Actions callbacks
    onAssign?: () => void;
    onPickup?: () => void;
    onDeliver?: () => void;
    onDeliverRelay?: () => void;
    
    // Config boutons
    actionLoading?: boolean;
    actionLabel?: string;
    showAction?: boolean;
}

export default function PackageSidebar({ 
    pkg, isOpen, onClose, 
    onAssign, onPickup, onDeliver, onDeliverRelay,
    actionLoading, actionLabel, showAction 
}: PackageSidebarProps) {
    
    if(!isOpen || !pkg) return null;

    // Détermination de l'action par défaut
    const isAvailable = pkg.currentStatus === 'FOR_PICKUP';
    const isAssigned = pkg.currentStatus === 'ASSIGNED_TO_DELIVERER';
        // Status Logic
    const isReadyToPickup = pkg.currentStatus === 'ASSIGNED_TO_DELIVERER' || pkg.currentStatus === 'FOR_PICKUP';
    const isTransit = pkg.currentStatus === 'IN_TRANSIT';

    return (
        <div className="fixed inset-0 z-[150] overflow-hidden pointer-events-none">
            {/* Backdrop click to close */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose}/>
            
            <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: '0%' }}
                exit={{ x: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute inset-y-0 right-0 max-w-md w-full bg-white dark:bg-slate-900 shadow-2xl pointer-events-auto flex flex-col border-l border-violet-100 dark:border-slate-700"
            >
                {/* Header */}
                <div className="h-32 bg-gradient-to-br from-violet-600 to-indigo-800 p-6 flex justify-between items-start text-white relative overflow-hidden">
                    {/* Abstract Circle */}
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl"/>
                    
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-white/20 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-white/30">
                                {pkg.currentStatus.replace(/_/g, ' ')}
                            </span>
                        </div>
                        <h2 className="text-2xl font-black font-mono tracking-tight">{pkg.trackingNumber}</h2>
                        <p className="text-violet-200 text-xs opacity-80 mt-1">{new Date(pkg.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                    
                    <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/30 rounded-full transition backdrop-blur-md">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Financial Block */}
                    <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50 rounded-2xl flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase">Commission Livreur</p>
                            <h3 className="text-2xl font-black text-green-800 dark:text-green-300">{pkg.deliveryFee.toLocaleString()} F</h3>
                        </div>
                        <div className="p-3 bg-green-200 dark:bg-green-800/40 rounded-full text-green-800 dark:text-green-200">
                            <DollarSign className="w-6 h-6"/>
                        </div>
                    </div>

                    {/* Route Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2 border-b pb-2">
                           <Navigation className="w-4 h-4"/> Itinéraire
                        </h3>
                        
                        {/* Pickup */}
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-600 flex items-center justify-center font-bold text-xs border border-violet-200">A</div>
                                <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 my-1"/>
                            </div>
                            <div className="pb-4">
                                <p className="text-xs text-gray-400 font-bold uppercase">Point de Ramassage</p>
                                <p className="font-bold text-gray-800 dark:text-gray-100">{pkg.pickupAddress}</p>
                                {/* Relais Specific */}
                                <p className="text-xs text-violet-600 mt-1 italic flex items-center gap-1"><MapPin className="w-3 h-3"/> Localisé au Relais</p>
                            </div>
                        </div>

                        {/* Delivery */}
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 flex items-center justify-center font-bold text-xs border border-orange-200">B</div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Destination Client</p>
                                <p className="font-bold text-gray-800 dark:text-gray-100">{pkg.deliveryAddress}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1"><User className="w-3 h-3"/> {pkg.recipientName}</span>
                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {pkg.recipientPhone || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details Info */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl space-y-3 text-sm">
                        <div className="flex justify-between border-b dark:border-gray-700 pb-2">
                             <span className="text-gray-500">Poids / Dimensions</span>
                             <span className="font-bold">{pkg.weight} kg • {pkg.dimensions || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b dark:border-gray-700 pb-2">
                             <span className="text-gray-500">Type de Colis</span>
                             <span className="font-bold">{pkg.packageType || 'Standard'}</span>
                        </div>
                        <div>
                             <span className="block text-gray-500 mb-1">Instructions</span>
                             <p className="font-medium text-gray-800 dark:text-gray-200 italic">"{pkg.description || 'Pas de note particulière.'}"</p>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
                     {showAction && (
                         <button
                            onClick={isAvailable ? onAssign : (isAssigned ? onPickup : onDeliverRelay)}
                            disabled={actionLoading}
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 ${
                                isAvailable ? 'bg-violet-600 hover:bg-violet-700' :
                                isAssigned ? 'bg-orange-600 hover:bg-orange-700' :
                                'bg-green-600 hover:bg-green-700'
                            }`}
                         >
                            {actionLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : (
                                <>
                                   {isAvailable && <span className="flex items-center gap-2">ACCEPTER LA COURSE <ArrowRight className="w-5 h-5"/></span>}
                                   {isAssigned && <span className="flex items-center gap-2">Récupérer le colis <Box className="w-5 h-5"/></span>}
                                   {isTransit && <span className="flex items-center gap-2">Déposer le colis <Check className="w-5 h-5"/></span>}
                                </>
                            )}
                         </button>
                     )}
                     
                     {!showAction && pkg.currentStatus === 'DELIVERED' && (
                         <div className="text-center p-3 bg-green-100 text-green-700 font-bold rounded-xl border border-green-200">
                             LIVRAISON TERMINÉE
                         </div>
                     )}
                </div>

            </motion.div>
        </div>
    );
}
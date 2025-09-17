// FICHIER : src/app/dashboard/ClientPackages.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile, Shipment } from './page'; // Import des types depuis la page principale
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  Truck,
  MoreVertical,
  MessageSquareWarning,
  MapPin,
  ListOrdered,
  Loader2,
  Inbox,
  Send,
  Package2,
  Calendar,
  User,
  Star,
  Eye,
  Bell,
  Plus,
  ArrowLeft
} from 'lucide-react';

// Import du composant d'expédition
import ShippingPage from '../expedition/page';
// Import du composant de suivi
import TrackPackagePage from '../track-package/page';

// Configuration des statuts pour un affichage dynamique (couleur, icône, texte)
const getStatusConfig = (status: Shipment['status']) => {
  switch (status) {
    case 'EN_ATTENTE_DE_DEPOT':
      return { 
        label: 'En attente de dépôt', 
        icon: Clock, 
        color: 'text-amber-700 dark:text-amber-400', 
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        pulse: true
      };
    case 'AU_DEPART':
      return { 
        label: 'Au point de départ', 
        icon: Send, 
        color: 'text-blue-700 dark:text-blue-400', 
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800',
        pulse: false
      };
    case 'EN_TRANSIT':
      return { 
        label: 'En transit', 
        icon: Truck, 
        color: 'text-cyan-700 dark:text-cyan-400', 
        bg: 'bg-cyan-50 dark:bg-cyan-950/30',
        border: 'border-cyan-200 dark:border-cyan-800',
        pulse: false
      };
    case 'ARRIVE_AU_RELAIS':
      return { 
        label: 'Arrivé à destination', 
        icon: Bell, 
        color: 'text-orange-700 dark:text-orange-400', 
        bg: 'bg-orange-50 dark:bg-orange-950/30',
        border: 'border-orange-200 dark:border-orange-800',
        pulse: true
      };
    case 'RECU':
      return { 
        label: 'Colis retiré', 
        icon: CheckCircle, 
        color: 'text-emerald-700 dark:text-emerald-400', 
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        pulse: false
      };
    case 'ANNULE':
      return { 
        label: 'Annulé', 
        icon: AlertTriangle, 
        color: 'text-red-700 dark:text-red-400', 
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-800',
        pulse: false
      };
    default:
      return { 
        label: status, 
        icon: Package2, 
        color: 'text-slate-700 dark:text-slate-400', 
        bg: 'bg-slate-50 dark:bg-slate-950/30',
        border: 'border-slate-200 dark:border-slate-800',
        pulse: false
      };
  }
};

// Composant pour afficher une carte de colis
const PackageCard = ({ shipment, onMenuClick }: { shipment: Shipment, onMenuClick: (id: number) => void }) => {
    const status = getStatusConfig(shipment.status);
    const isReadyForWithdrawal = shipment.status === 'ARRIVE_AU_RELAIS';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`group relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 ${status.border} shadow-sm hover:shadow-xl transition-all duration-500 ${isReadyForWithdrawal ? 'ring-2 ring-orange-400 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
        >
            {/* Effet de brillance au survol */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
            
            <div className="relative p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <motion.div 
                            className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl text-sm font-semibold ${status.bg} ${status.color} ${status.border} border ${status.pulse ? 'animate-pulse' : ''}`}
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                        >
                            <motion.div
                                animate={{ rotate: status.pulse ? [0, 10, -10, 0] : 0 }}
                                transition={{ duration: 2, repeat: status.pulse ? Infinity : 0 }}
                            >
                                <status.icon className="h-4 w-4" />
                            </motion.div>
                            <span>{status.label}</span>
                        </motion.div>
                        
                        <motion.h3 
                            className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            {shipment.description || "Colis sans description"}
                        </motion.h3>
                        
                        <motion.p 
                            className="text-sm font-mono text-orange-600 dark:text-orange-400 mt-1 tracking-wider"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {shipment.tracking_number}
                        </motion.p>
                    </div>
                    
                    <motion.button 
                        onClick={() => onMenuClick(shipment.id)} 
                        className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all duration-200 hover:text-orange-600 dark:hover:text-orange-400 hover:shadow-md"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <MoreVertical className="h-5 w-5" />
                    </motion.button>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <motion.div 
                        className="flex items-center gap-3 text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800">
                            <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <span className="text-slate-500 dark:text-slate-400 text-xs">Expéditeur</span>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{shipment.sender_name}</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="flex items-center gap-3 text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800">
                            <Package2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <span className="text-slate-500 dark:text-slate-400 text-xs">Destinataire</span>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{shipment.recipient_name}</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="flex items-center gap-3 text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800">
                            <MapPin className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <span className="text-slate-500 dark:text-slate-400 text-xs">Point d'arrivée</span>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{shipment.arrival_point?.name || 'Non spécifié'}</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="flex items-center gap-3 text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800">
                            <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <span className="text-slate-500 dark:text-slate-400 text-xs">Date d'envoi</span>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{new Date(shipment.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                    </motion.div>
                </div>
            </div>
            
            {isReadyForWithdrawal && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-orange-500 text-white text-center text-sm font-bold py-3 flex items-center justify-center gap-2"
                >
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <Star className="h-4 w-4" />
                    </motion.div>
                    À retirer maintenant
                </motion.div>
            )}
        </motion.div>
    );
};

// Menu d'actions contextuel
const ActionMenu = ({ shipment, onClose }: { shipment: Shipment, onClose: () => void }) => {
    const menuItems = [
        { label: "Parcours du colis", icon: ListOrdered, color: "text-blue-600 hover:text-blue-700" },
        { label: "Localiser le colis", icon: MapPin, color: "text-green-600 hover:text-green-700" },
        { label: "Faire une réclamation", icon: MessageSquareWarning, color: "text-orange-600 hover:text-orange-700" }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-8 top-14 z-30 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-2">
                {menuItems.map((item, index) => (
                    <motion.button 
                        key={item.label} 
                        className={`w-full text-left flex items-center gap-4 px-4 py-3 text-sm rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 ${item.color}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ x: 4 }}
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800">
                            <item.icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{item.label}</span>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}

export default function ClientPackagesPage({ profile }: { profile: UserProfile }) {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const [showShippingForm, setShowShippingForm] = useState(false);
    const [showTrackingPage, setShowTrackingPage] = useState(false);

    // Récupération de TOUS les colis (envoyés OU reçus)
    useEffect(() => {
        const fetchShipments = async () => {
            if (!profile.manager_name) return;
            setIsLoading(true);
            setError(null);
            
            // On récupère les colis où l'utilisateur est soit expéditeur, soit destinataire
            const { data, error } = await supabase
                .from('shipments')
                .select(`
                    *,
                    departure_point:relay_points!shipments_departure_point_id_fkey(*),
                    arrival_point:relay_points!shipments_arrival_point_id_fkey(*)
                `)
                .or(`sender_name.eq.${profile.manager_name},recipient_name.eq.${profile.manager_name}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Erreur de chargement des colis:", error);
                setError("Impossible de charger vos colis. Veuillez réessayer.");
            } else {
                setShipments(data as Shipment[]);
            }
            setIsLoading(false);
        };
        fetchShipments();
    }, [profile.manager_name]);
    
    // Ferme le menu si on clique n'importe où sur la page
    useEffect(() => {
        const closeMenu = () => setActiveMenuId(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    // Tri des colis : d'abord ceux à retirer, puis le reste par date
    const sortedShipments = useMemo(() => {
        const toWithdraw = shipments.filter(s => s.status === 'ARRIVE_AU_RELAIS');
        const others = shipments.filter(s => s.status !== 'ARRIVE_AU_RELAIS');
        return [...toWithdraw, ...others];
    }, [shipments]);

    // Si le formulaire d'expédition est affiché
    if (showShippingForm) {
        return (
            <div className="space-y-6">
                {/* Bouton de retour */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-4"
                >
                    <motion.button
                        onClick={() => setShowShippingForm(false)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-200 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50"
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="font-medium">Retour à mes colis</span>
                    </motion.button>
                    <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Nouvelle expédition
                    </h2>
                </motion.div>
                
                {/* Formulaire d'expédition intégré */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl p-6 border border-slate-200/50 dark:border-slate-700/50"
                >
                    <ShippingPage />
                </motion.div>
            </div>
        );
    }

    // Si la page de suivi est affichée
    if (showTrackingPage) {
        return (
            <div className="space-y-6">
                {/* Bouton de retour */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-4"
                >
                    <motion.button
                        onClick={() => setShowTrackingPage(false)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-200 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50"
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="font-medium">Retour à mes colis</span>
                    </motion.button>
                    <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Suivre un colis
                    </h2>
                </motion.div>
                
                {/* Page de suivi intégrée */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50"
                >
                    <TrackPackagePage />
                </motion.div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <motion.div 
                className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 className="h-12 w-12 text-orange-500" />
                </motion.div>
                <motion.p 
                    className="mt-6 text-lg font-medium"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    Chargement de vos colis...
                </motion.p>
            </motion.div>
        );
    }

    if (error) {
        return (
            <motion.div 
                className="text-center p-8 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-800"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <AlertTriangle className="h-8 w-8 mx-auto mb-4" />
                {error}
            </motion.div>
        );
    }

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        Mes Colis
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                        Suivez vos envois et réceptions en temps réel
                    </p>
                </div>
                
                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Bouton Retrouver un colis */}
                    <motion.button
                        onClick={() => setShowTrackingPage(true)}
                        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <motion.div
                            animate={{ rotate: [0, -15, 15, 0] }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                        >
                            <Search className="h-5 w-5" />
                        </motion.div>
                        <span>Retrouver un colis</span>
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Eye className="h-4 w-4" />
                        </motion.div>
                    </motion.button>

                    {/* Bouton Envoyer un colis */}
                    <motion.button
                        onClick={() => setShowShippingForm(true)}
                        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.6, ease: "easeInOut" }}
                        >
                            <Plus className="h-5 w-5" />
                        </motion.div>
                        <span>Envoyer un colis</span>
                        <motion.div
                            animate={{ x: [0, 3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Send className="h-4 w-4" />
                        </motion.div>
                    </motion.button>
                </div>
            </motion.div>
             
            <AnimatePresence>
                {sortedShipments.length > 0 ? (
                    <motion.div 
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 relative"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {sortedShipments.map((shipment, index) => (
                            <motion.div 
                                className="relative" 
                                key={shipment.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                            >
                                <PackageCard 
                                    shipment={shipment}
                                    onMenuClick={(id) => {
                                        event?.stopPropagation(); 
                                        setActiveMenuId(activeMenuId === id ? null : id);
                                    }}
                                />
                                <AnimatePresence>
                                    {activeMenuId === shipment.id && (
                                        <ActionMenu shipment={shipment} onClose={() => setActiveMenuId(null)} />
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center justify-center h-80 text-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-12 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700"
                    >
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Inbox className="h-20 w-20 text-orange-400 mb-6" />
                        </motion.div>
                        <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                            Aucun colis pour le moment
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6">
                            Les colis que vous envoyez ou que vous recevez apparaîtront ici. 
                            Commencez par envoyer votre premier colis !
                        </p>
                        
                        {/* Boutons d'action dans l'état vide */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <motion.button
                                onClick={() => setShowTrackingPage(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Search className="h-4 w-4" />
                                <span>Retrouver un colis</span>
                            </motion.button>
                            
                            <motion.button
                                onClick={() => setShowShippingForm(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Plus className="h-4 w-4" />
                                <span>Envoyer mon premier colis</span>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
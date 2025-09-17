// FICHIER : src/app/dashboard/Overview.tsx
'use client';

import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile, Shipment } from './page';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Award,
  ChevronDown,
  Loader2,
  MapPin,
  MessageSquareWarning,
  TrendingUp,
  Sparkles,
  Clock,
  CheckCircle2,
  PackageCheck,
  PlaneTakeoff,
  User,
  Calendar,
  Hash,
  Weight,
  Truck,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';

// Carte de statistique cliquable avec design moderne
interface StatCardProps {
    icon: React.ElementType;
    title: string;
    value: string | number;
    color: string;
    onClick: () => void;
    isOpen: boolean;
    subtitle?: string;
}

const StatCard = ({ icon: Icon, title, value, color, onClick, isOpen, subtitle }: StatCardProps) => (
    <motion.div
        layout
        onClick={onClick}
        className="group relative p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-orange-300 dark:hover:border-orange-600/50"
        whileHover={{ y: -8 }}
        whileTap={{ scale: 0.98 }}
    >
        {/* Effet de brillance subtil */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-50/50 via-transparent to-transparent dark:from-orange-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative flex justify-between items-start">
            <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                    <motion.div 
                        className="relative p-4 rounded-2xl bg-orange-100 dark:bg-orange-900/30 ring-1 ring-orange-200 dark:ring-orange-800/50"
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                    >
                        <Icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        {/* Petit effet de brillance sur l'icône */}
                        <motion.div
                            className="absolute inset-0 rounded-2xl bg-orange-200/50 dark:bg-orange-400/10"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.2, 0.8] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        />
                    </motion.div>
                    
                    <div className="flex-1 min-w-0">
                        <motion.p 
                            className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            {title}
                        </motion.p>
                        <motion.p 
                            className="text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            {value}
                        </motion.p>
                        {subtitle && (
                            <motion.p 
                                className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1 flex items-center gap-1"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <TrendingUp className="h-3 w-3" />
                                {subtitle}
                            </motion.p>
                        )}
                    </div>
                </div>
            </div>
            
            <motion.div 
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex-shrink-0"
            >
                <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-700/50 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/30 transition-colors duration-300">
                    <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-orange-600 dark:group-hover:text-orange-400" />
                </div>
            </motion.div>
        </div>
    </motion.div>
);

// Nouvelle carte de colis détaillée et moderne
const DetailedPackageCard = ({ shipment }: { shipment: Shipment }) => {
    const isSender = shipment.sender_name === shipment.recipient_name;
    const [isExpanded, setIsExpanded] = useState(false);
    
    const getStatusConfig = () => {
        switch (shipment.status) {
            case 'RECU':
                return {
                    icon: <CheckCircle className="h-5 w-5" />,
                    color: 'text-green-600 dark:text-green-400',
                    bgColor: 'bg-green-100 dark:bg-green-900/30',
                    borderColor: 'border-green-200 dark:border-green-800/50',
                    label: 'Reçu'
                };
            case 'EN_TRANSIT':
                return {
                    icon: <Truck className="h-5 w-5" />,
                    color: 'text-blue-600 dark:text-blue-400',
                    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
                    borderColor: 'border-blue-200 dark:border-blue-800/50',
                    label: 'En transit'
                };
            case 'AU_DEPART':
                return {
                    icon: <PlaneTakeoff className="h-5 w-5" />,
                    color: 'text-purple-600 dark:text-purple-400',
                    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
                    borderColor: 'border-purple-200 dark:border-purple-800/50',
                    label: 'Au départ'
                };
            case 'EN_ATTENTE_DE_DEPOT':
                return {
                    icon: <Clock className="h-5 w-5" />,
                    color: 'text-orange-600 dark:text-orange-400',
                    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
                    borderColor: 'border-orange-200 dark:border-orange-800/50',
                    label: 'En attente de dépôt'
                };
            case 'ARRIVE_AU_RELAIS':
                return {
                    icon: <MapPin className="h-5 w-5" />,
                    color: 'text-teal-600 dark:text-teal-400',
                    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
                    borderColor: 'border-teal-200 dark:border-teal-800/50',
                    label: 'Arrivé au relais'
                };
            case 'ANNULE':
                return {
                    icon: <XCircle className="h-5 w-5" />,
                    color: 'text-red-600 dark:text-red-400',
                    bgColor: 'bg-red-100 dark:bg-red-900/30',
                    borderColor: 'border-red-200 dark:border-red-800/50',
                    label: 'Annulé'
                };
            default:
                return {
                    icon: <AlertCircle className="h-5 w-5" />,
                    color: 'text-gray-600 dark:text-gray-400',
                    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
                    borderColor: 'border-gray-200 dark:border-gray-800/50',
                    label: 'Statut inconnu'
                };
        }
    };
    
    const statusConfig = getStatusConfig();
    
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden"
        >
            {/* Gradient de fond subtil */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/20 via-transparent to-transparent dark:from-orange-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative p-6">
                {/* En-tête du colis */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <motion.div 
                            className="flex-shrink-0 p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 ring-1 ring-orange-200 dark:ring-orange-800/50"
                            whileHover={{ rotate: 5, scale: 1.05 }}
                        >
                            <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </motion.div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-50 truncate">
                                    {shipment.description || "Colis sans description"}
                                </h3>
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                                    {statusConfig.icon}
                                    <span>{statusConfig.label}</span>
                                </div>
                            </div>
                            
                            {/* Numéro de suivi prominement affiché */}
                            <div className="flex items-center gap-2 mb-2">
                                <Hash className="h-4 w-4 text-gray-400" />
                                <code className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg text-gray-700 dark:text-gray-300 font-bold">
                                    {shipment.tracking_number}
                                </code>
                            </div>
                        </div>
                    </div>
                    
                    {/* Bouton d'expansion */}
                    <motion.button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex-shrink-0 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors group"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400" />
                        </motion.div>
                    </motion.button>
                </div>
                
                {/* Informations principales toujours visibles */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                {isSender ? 'Expédition personnelle' : 'Expéditeur'}
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {shipment.sender_name}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Destinataire</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {shipment.recipient_name}
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Section extensible avec plus de détails */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="overflow-hidden border-t border-gray-100 dark:border-gray-700 pt-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Adresses */}
                                <div className="col-span-full">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-orange-600" />
                                        Adresses
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Origine
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {shipment.sender_address || 'Adresse non renseignée'}
                                            </p>
                                        </div>
                                        
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Destination
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {shipment.recipient_address || 'Adresse non renseignée'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Détails techniques */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Weight className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Poids
                                        </p>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        {shipment.weight ? `${shipment.weight} kg` : 'Non renseigné'}
                                    </p>
                                </div>
                                
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Coût
                                        </p>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        {shipment.shipping_cost ? 
                                            `${shipment.shipping_cost.toLocaleString('fr-FR')} FCFA` : 
                                            'Gratuit'
                                        }
                                    </p>
                                </div>
                                
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Date de création
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                                        {shipment.created_at ? 
                                            new Date(shipment.created_at).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            }) :
                                            'Date inconnue'
                                        }
                                    </p>
                                </div>
                            </div>
                            
                            {/* Actions rapides */}
                            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <motion.button
                                    className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-xl hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors text-sm font-medium"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Eye className="h-4 w-4" />
                                    Suivre le colis
                                </motion.button>
                                
                                {shipment.status !== 'RECU' && shipment.status !== 'ANNULE' && (
                                    <motion.button
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <MessageSquareWarning className="h-4 w-4" />
                                        Signaler un problème
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default function OverviewDashboard({ profile }: { profile: UserProfile }) {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openStat, setOpenStat] = useState<string | null>(null);

    // Même logique de récupération que dans "Mes Colis"
    useEffect(() => {
        const fetchShipments = async () => {
            if (!profile.manager_name) return;
            setIsLoading(true);
            const { data, error } = await supabase
                .from('shipments')
                .select('*')
                .or(`sender_name.eq.${profile.manager_name},recipient_name.eq.${profile.manager_name}`);

            if (data) {
                setShipments(data as Shipment[]);
            }
            setIsLoading(false);
        };
        fetchShipments();
    }, [profile.manager_name]);

    // Calcul des statistiques avec useMemo pour la performance
    const stats = useMemo(() => {
        const sent = shipments.filter(s => s.sender_name === profile.manager_name);
        const received = shipments.filter(s => s.recipient_name === profile.manager_name && s.sender_name !== profile.manager_name);
        const totalSpent = sent.reduce((acc, curr) => acc + (curr.shipping_cost || 0), 0);
        const loyaltyPoints = Math.floor(shipments.length / 80);
        const loyaltyProgress = ((shipments.length % 80) / 80 * 100).toFixed(0);

        return {
            total: shipments.length,
            totalSent: sent.length,
            totalReceived: received.length,
            totalSpent: totalSpent.toLocaleString('fr-FR') + ' FCFA',
            loyaltyPoints,
            loyaltyProgress,
            sentShipments: sent,
            receivedShipments: received,
        };
    }, [shipments, profile.manager_name]);

    const handleStatClick = (statName: string) => {
        setOpenStat(openStat === statName ? null : statName);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="relative"
                >
                    <div className="h-16 w-16 rounded-full border-4 border-orange-200 dark:border-orange-800"></div>
                    <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-orange-600 border-t-transparent animate-spin"></div>
                </motion.div>
            </div>
        );
    }
    
    // Contenu à afficher dans la liste déroulante
    const listContent = {
        total: shipments,
        sent: stats.sentShipments,
        received: stats.receivedShipments
    };
    
    const renderList = (key: 'total' | 'sent' | 'received') => (
        <AnimatePresence>
            {openStat === key && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="overflow-hidden mt-6"
                >
                    <div className="space-y-4">
                        {listContent[key].length > 0 ? (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {key === 'total' && 'Tous les colis'}
                                        {key === 'sent' && 'Colis envoyés'}
                                        {key === 'received' && 'Colis reçus'}
                                    </h3>
                                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-sm font-medium">
                                        {listContent[key].length} colis
                                    </span>
                                </div>
                                
                                <div className="grid gap-4">
                                    {listContent[key].map((shipment, index) => (
                                        <motion.div
                                            key={shipment.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <DetailedPackageCard shipment={shipment} />
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700"
                            >
                                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                    Aucun colis trouvé
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                                    Il n'y a pas encore de colis dans cette catégorie. Commencez par envoyer votre premier colis !
                                </p>
                                <motion.button
                                    className="mt-4 inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors font-medium"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <PlaneTakeoff className="h-4 w-4" />
                                    <Link href="/expedition">Envoyer un colis</Link>
                                </motion.button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* En-tête modernisé */}
            <motion.div 
                className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="flex items-center gap-4">
                    <motion.div
                        className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl"
                        whileHover={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.5 }}
                    >
                        <PackageCheck className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    </motion.div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                            Vue d'ensemble
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Gérez vos expéditions en un coup d'œil
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <motion.button 
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-3 px-6 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <PlaneTakeoff size={18} /> <Link href='/expedition'> Envoyer un colis</Link>
                    </motion.button>
                    <motion.button 
                        className="flex items-center gap-2 bg-orange-600 text-white font-semibold py-3 px-6 rounded-2xl hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl"
                        whileHover={{ y: -2, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <MessageSquareWarning size={18} /> <Link href='/dashboard/Settings'> Réclamation</Link>
                    </motion.button>
                </div>
            </motion.div>
            
            {/* Grille de statistiques modernisée */}
            <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <StatCard 
                        icon={Package}
                        title="Total Colis"
                        value={stats.total}
                        subtitle={`${stats.total} expéditions`}
                        color="orange"
                        isOpen={openStat === 'total'}
                        onClick={() => handleStatClick('total')}
                    />
                    {renderList('total')}
                </motion.div>
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <StatCard 
                        icon={ArrowUp}
                        title="Colis Envoyés"
                        value={stats.totalSent}
                        subtitle="Expéditions sortantes"
                        color="blue"
                        isOpen={openStat === 'sent'}
                        onClick={() => handleStatClick('sent')}
                    />
                    {renderList('sent')}
                </motion.div>
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <StatCard 
                        icon={ArrowDown}
                        title="Colis Reçus"
                        value={stats.totalReceived}
                        subtitle="Réceptions"
                        color="green"
                        isOpen={openStat === 'received'}
                        onClick={() => handleStatClick('received')}
                    />
                    {renderList('received')}
                </motion.div>
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 xl:col-span-1"
                >
                    <StatCard 
                        icon={DollarSign}
                        title="Montant Dépensé"
                        value={stats.totalSpent}
                        subtitle="Frais d'expédition"
                        color="teal"
                        isOpen={false}
                        onClick={() => {}}
                    />
                </motion.div>
                
                <motion.div 
                    className="lg:col-span-2"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="relative">
                        <StatCard 
                            icon={Award}
                            title="Points Fidélité"
                            value={`${shipments.length} / 80`}
                            subtitle={`${stats.loyaltyProgress}% vers le prochain niveau`}
                            color="purple"
                            isOpen={false}
                            onClick={() => {}}
                        />
                        {/* Barre de progression pour les points de fidélité */}
                        <div className="mt-4 mx-6">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <motion.div
                                    className="h-full bg-orange-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats.loyaltyProgress}%` }}
                                    transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                                Encore {80 - (shipments.length % 80)} colis pour débloquer des avantages
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
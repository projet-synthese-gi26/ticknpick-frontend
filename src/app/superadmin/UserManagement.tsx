// FICHIER: src/app/superadmin/UserManagement.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import apiClient from '@/services/apiClient'; 

import { 
    CheckCircle, UserX, Eye, Loader2, ShieldAlert, 
    UserCheck, Search, RefreshCw, ShieldCheck, Trash2,
    Briefcase, User, Zap,
    Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES LOCAUX ---

interface BaseUser {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    createdAt?: string;
    isActive: boolean;
    roleDisplay: string;
    avatarInitial: string; // Pour l'UI
}

interface ClientUser extends BaseUser {
    type: 'CLIENT';
}

interface BusinessUser extends BaseUser {
    type: 'BUSINESS';
    businessName: string;
    businessActorType: string;
    isVerified: boolean;
    cniNumber?: string;
    niu?: string;
}

// --- COMPOSANT PRINCIPAL ---
export default function UserManagement() {
    const [clients, setClients] = useState<ClientUser[]>([]);
    const [businessActors, setBusinessActors] = useState<BusinessUser[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Tab actif : 'all' | 'business' | 'clients'
    const [activeFilter, setActiveFilter] = useState<'all' | 'business' | 'clients'>('business');
    const [searchTerm, setSearchTerm] = useState('');
    const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);

    // --- CHARGEMENT ---
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Business Actors
            const actorsData = await adminService.getAllBusinessActors();
            const mappedActors: BusinessUser[] = actorsData.map((a: any) => ({
                id: a.id,
                name: a.name || a.manager_name || "Nom inconnu",
                email: a.email || "N/A",
                phoneNumber: a.phoneNumber || a.phone_number || "N/A",
                createdAt: a.createdAt,
                isActive: a.isEnabled ?? a.is_enabled ?? true,
                roleDisplay: (a.businessActorType || a.business_actor_type || 'PRO').toUpperCase(),
                avatarInitial: (a.businessName || a.name || 'P')[0].toUpperCase(),
                type: 'BUSINESS',
                
                businessName: a.businessName || a.business_name || a.name || "Business Inconnu",
                businessActorType: a.businessActorType || a.business_actor_type,
                isVerified: a.isVerified ?? a.is_verified ?? false,
                cniNumber: a.cniNumber || a.cni_number,
                niu: a.niu
            }));
            
            // 2. Clients
            let usersData: any[] = [];
            try {
                const response = await apiClient<any[]>('/api/users', 'GET');
                usersData = response.filter((u: any) => (u.account_type || u.accountType) === 'CLIENT');
            } catch(e) { console.warn("Clients introuvables"); }

            const mappedClients: ClientUser[] = usersData.map((u: any) => ({
                id: u.id,
                name: u.name || "Nom Inconnu",
                email: u.email || "N/A",
                phoneNumber: u.phoneNumber || u.phone_number || "N/A",
                createdAt: u.createdAt,
                isActive: u.isActive ?? u.is_active ?? true,
                roleDisplay: 'CLIENT',
                avatarInitial: (u.name || 'C')[0].toUpperCase(),
                type: 'CLIENT'
            }));

            setBusinessActors(mappedActors);
            setClients(mappedClients);

        } catch (err) {
            console.error("Erreur Chargement", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);


    // --- ACTIONS ---

    const handleValidation = async (actor: BusinessUser) => {
        if (!confirm(`Valider le compte ${actor.businessName} ?`)) return;
        setActionProcessingId(actor.id);
        try {
            await adminService.validateBusinessActor(actor.id, true);
            setBusinessActors(prev => prev.map(p => p.id === actor.id ? { ...p, isVerified: true, isActive: true } : p));
        } catch (e) { alert("Erreur validation"); } 
        finally { setActionProcessingId(null); }
    };

    const handleToggleStatus = async (user: BaseUser) => {
        const newStatus = !user.isActive;
        setActionProcessingId(user.id);
        try {
            const endpoint = user.roleDisplay === 'CLIENT' ? `/api/users/${user.id}` : `/api/business-actors/${user.id}`;
            const currentObj = await apiClient<any>(endpoint, 'GET');
            await apiClient(endpoint, 'PUT', { ...currentObj, isActive: newStatus, isEnabled: newStatus });
            
            if (user.roleDisplay !== 'CLIENT') {
                setBusinessActors(prev => prev.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
            } else {
                setClients(prev => prev.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
            }
        } catch (e) { alert("Erreur statut"); }
        finally { setActionProcessingId(null); }
    };

    const handleDelete = async (user: BaseUser) => {
        if (!confirm("Suppression définitive. Confirmer ?")) return;
        setActionProcessingId(user.id);
        try {
             const endpoint = user.roleDisplay === 'CLIENT' ? `/api/users/${user.id}` : `/api/business-actors/${user.id}`;
             await apiClient(endpoint, 'DELETE');
             if (user.roleDisplay !== 'CLIENT') setBusinessActors(prev => prev.filter(u => u.id !== user.id));
             else setClients(prev => prev.filter(u => u.id !== user.id));
        } catch (e) { alert("Erreur suppression"); }
        finally { setActionProcessingId(null); }
    }

    // --- UI & RENDER ---

    const getFilteredData = () => {
        let data: (BusinessUser | ClientUser)[] = [];
        if (activeFilter === 'all') data = [...businessActors, ...clients];
        else if (activeFilter === 'business') data = businessActors;
        else data = clients;

        if (!searchTerm) return data;
        
        const term = searchTerm.toLowerCase();
        return data.filter(u => 
            u.name.toLowerCase().includes(term) || 
            u.email.toLowerCase().includes(term) ||
            (u as BusinessUser).businessName?.toLowerCase().includes(term)
        );
    };

    const displayData = getFilteredData();
    const pendingCount = businessActors.filter(b => !b.isVerified).length;

    return (
        <div className="space-y-6 pb-12">
            
            {/* HEADER AVEC FILTRES VISUELS */}
            <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        <Users className="w-6 h-6 text-orange-500"/>
                        Comptes Utilisateurs
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                        {businessActors.length} Pros • {clients.length} Clients • {pendingCount} en attente
                    </p>
                </div>

                <div className="flex p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    {[
                        { id: 'business', label: 'Partenaires Pro', icon: Briefcase, count: businessActors.length },
                        { id: 'clients', label: 'Clients', icon: User, count: clients.length },
                        { id: 'all', label: 'Tout afficher', icon: Zap, count: null }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveFilter(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300
                                ${isActive 
                                    ? 'bg-slate-900 dark:bg-orange-600 text-white shadow-lg shadow-slate-900/20' 
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400 dark:text-white' : ''}`} />
                                {tab.label}
                                {tab.count !== null && (
                                    <span className={`text-[10px] py-0.5 px-1.5 rounded-md ml-1 ${isActive ? 'bg-slate-700 dark:bg-orange-700' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* BARRE DE RECHERCHE */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Rechercher un nom, une société ou un email..."
                    className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm text-sm font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button 
                    onClick={loadData} 
                    className="absolute right-3 top-3 p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition text-slate-500 dark:text-slate-300"
                    title="Actualiser"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
                </button>
            </div>

            {/* LISTE (GRID POUR RESPONSIVE, TABLEAU POUR LARGE) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {displayData.length === 0 && !loading ? (
                    <div className="p-16 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                             <Search className="w-8 h-8 text-slate-300"/>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun résultat ne correspond à votre recherche.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Utilisateur / Société</th>
                                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Type de Compte</th>
                                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">État</th>
                                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-orange-500">
                                            <Loader2 className="w-8 h-8 animate-spin"/>
                                            <span className="text-sm font-medium">Chargement...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayData.map((user) => {
                                    const isBiz = user.type === 'BUSINESS';
                                    const biz = isBiz ? (user as BusinessUser) : null;
                                    const isProcessing = actionProcessingId === user.id;
                                    
                                    return (
                                        <tr key={user.id} className={`group transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 ${isProcessing ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm
                                                        ${isBiz ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-slate-400 to-slate-600'}
                                                    `}>
                                                        {user.avatarInitial}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                                                            {isBiz ? biz?.businessName : user.name}
                                                        </p>
                                                        {isBiz && (
                                                            <p className="text-[11px] text-slate-500 font-medium">Gérant: {user.name}</p>
                                                        )}
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-mono mt-0.5">
                                                            {user.id.substring(0, 8)}...
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user.email}</span>
                                                    <span className="text-xs text-slate-500">{user.phoneNumber}</span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-center">
                                                 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                                    ${user.roleDisplay === 'CLIENT' 
                                                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                                        : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800'}
                                                 `}>
                                                    {user.roleDisplay}
                                                 </span>
                                            </td>
                                            <td className="p-5 text-center">
                                                <div className="flex justify-center">
                                                    {user.isActive ? (
                                                        <div className="flex flex-col items-center gap-1">
                                                            {isBiz && !biz?.isVerified ? (
                                                                 <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-md text-[10px] font-bold">
                                                                     <Loader2 className="w-3 h-3 animate-spin"/> Vérification...
                                                                 </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-md text-[10px] font-bold">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                                    Actif
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-200 text-red-600 rounded-md text-[10px] font-bold">
                                                            Suspendu
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                                                    
                                                    {/* Bouton Valider (si Pro en attente) */}
                                                    {isBiz && !biz?.isVerified && (
                                                        <button onClick={() => handleValidation(biz!)}
                                                            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md shadow-emerald-200 hover:scale-105 transition-transform" title="Valider">
                                                            <ShieldCheck className="w-4 h-4"/>
                                                        </button>
                                                    )}

                                                    {/* Voir Détails (Fake action pour l'instant) */}
                                                    <button className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-slate-300 text-slate-500 dark:text-slate-300 rounded-lg transition hover:bg-slate-50" title="Détails">
                                                        <Eye className="w-4 h-4"/>
                                                    </button>

                                                    {/* Activer / Suspendre */}
                                                    <button 
                                                        onClick={() => handleToggleStatus(user)}
                                                        className={`p-2 rounded-lg border transition hover:shadow-sm
                                                        ${user.isActive 
                                                            ? 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 hover:text-red-600 hover:border-red-200' 
                                                            : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'}`}
                                                        title={user.isActive ? 'Suspendre' : 'Réactiver'}
                                                    >
                                                        {user.isActive ? <UserX className="w-4 h-4"/> : <UserCheck className="w-4 h-4"/>}
                                                    </button>
                                                    
                                                    {/* Supprimer */}
                                                    <button 
                                                        onClick={() => handleDelete(user)}
                                                        className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition"
                                                        title="Supprimer définitivement"
                                                    >
                                                        <Trash2 className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
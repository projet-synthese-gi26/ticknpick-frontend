// FICHIER: src/app/superadmin/UserManagement.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/services/apiClient'; 
import { adminService } from '@/services/adminService'; // Toujours nécessaire pour actions validate/suspend si spécifiques

import { 
    CheckCircle, UserX, Eye, Loader2, ShieldAlert, 
    UserCheck, Search, RefreshCw, ShieldCheck, Trash2,
    Briefcase, User, Zap, Truck, Store, Building,
    Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES DE DONNÉES UNIFIÉS ---

type UserRole = 'CLIENT' | 'RELAY_OWNER' | 'AGENCY_OWNER' | 'DELIVERER' | 'FREELANCE' | 'EMPLOYEE' | 'ADMIN';

interface AdminUser {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: UserRole;        // Rôle principal normalisé pour l'affichage/filtre
    rawType: string;       // Type brut (ex: BUSINESS_ACTOR)
    rawSubType?: string;   // Sous-type brut (ex: RELAY_OWNER)
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    
    // Métadonnées Business optionnelles
    businessName?: string;
    avatarInitial: string;
}

// --- CONFIGURATION FILTRES ---
const FILTER_TABS = [
    { id: 'ALL', label: 'Tous', icon: Zap, color: 'slate' },
    { id: 'CLIENT', label: 'Clients', icon: User, color: 'blue' },
    { id: 'RELAY_OWNER', label: 'Relais', icon: Store, color: 'red' }, // Rouge comme dans Dashboard
    { id: 'AGENCY_OWNER', label: 'Agences', icon: Building, color: 'purple' },
    { id: 'DELIVERER', label: 'Livreurs', icon: Truck, color: 'orange' } // ou Freelance
];


// --- COMPOSANT PRINCIPAL ---
export default function UserManagement() {
    const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState<string|null>(null);

    // --- NORMALISATION DES DONNÉES USER ---
    // Cette fonction transforme la donnée brute de l'API en objet propre pour l'admin
    const normalizeUser = (u: any): AdminUser => {
        // Détermination du Rôle
        const accountType = (u.accountType || u.account_type || 'CLIENT').toUpperCase();
        const subType = (u.businessActorType || u.businessActorType || '').toUpperCase();
        
        let role: UserRole = 'CLIENT'; // Default
        
        if (accountType === 'ADMIN' || accountType === 'SUPERADMIN') role = 'ADMIN';
        else if (accountType === 'BUSINESS_ACTOR' || accountType.includes('BUSINESS')) {
            if (subType === 'AGENCY_OWNER' || subType === 'AGENCY') role = 'AGENCY_OWNER';
            else if (subType === 'RELAY_OWNER') role = 'RELAY_OWNER';
            else if (subType === 'DELIVERER' || subType === 'LIVREUR') role = 'DELIVERER';
            else if (subType === 'EMPLOYEE') role = 'EMPLOYEE';
            else role = 'FREELANCE'; // Fallback pro
        }

        const name = u.name || u.manager_name || "Utilisateur Inconnu";
        
        return {
            id: u.id,
            name: name,
            email: u.email || 'N/A',
            phoneNumber: u.phone_number || u.phoneNumber || 'N/A',
            role: role,
            rawType: accountType,
            rawSubType: subType,
            isActive: u.is_active ?? u.isActive ?? true, // Souvent true par défaut si non présent
            isVerified: u.is_verified ?? u.isVerified ?? (role === 'CLIENT'), // Clients souvent vérifiés par défaut
            createdAt: u.createdAt || u.created_at || new Date().toISOString(),
            businessName: u.businessName || u.business_name,
            avatarInitial: name.charAt(0).toUpperCase()
        };
    };

    // --- CHARGEMENT ---
    const loadData = useCallback(async () => {
        setLoading(true);
        console.group("📥 [ADMIN USERS] Chargement Global");
        try {
            // Appel Unique à /api/users
            // Le backend renvoie souvent un tableau direct ou { content: [...] }
            const response: any = await apiClient('/api/users', 'GET');
            const rawData = Array.isArray(response) ? response : (response.content || []);
            
            console.log(`✅ ${rawData.length} utilisateurs bruts reçus.`);
            
            // Mapping
            const mapped = rawData.map(normalizeUser);
            
            // Tri (Plus récents d'abord)
            mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            setAllUsers(mapped);

        } catch (e) {
            console.error("Erreur chargement utilisateurs:", e);
        } finally {
            setLoading(false);
            console.groupEnd();
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);


    // --- FILTRAGE DYNAMIQUE ---
    const displayData = useMemo(() => {
        return allUsers.filter(u => {
            // 1. Filtre Onglet
            const roleMatch = filter === 'ALL' || u.role === filter || (filter === 'DELIVERER' && u.role === 'FREELANCE');
            
            // 2. Filtre Recherche
            const searchLower = searchTerm.toLowerCase();
            const textMatch = 
                u.name.toLowerCase().includes(searchLower) ||
                u.email.toLowerCase().includes(searchLower) ||
                (u.businessName && u.businessName.toLowerCase().includes(searchLower));

            return roleMatch && textMatch;
        });
    }, [allUsers, filter, searchTerm]);


    // --- ACTIONS ---
    // Note: On utilise apiClient direct ou les services admin spécifiques

    const toggleStatus = async (user: AdminUser) => {
        if (!confirm(`Changer le statut de ${user.name} ?`)) return;
        setProcessingId(user.id);
        
        try {
            // Déterminer la route selon le type (Certaines API séparent business/clients)
            // On tente une route générique Admin si elle existe : /api/admin/users/{id}/status
            // Sinon on route vers les contrôleurs spécifiques
            
            let endpoint = '';
            // Si l'API unifiée existe:
            endpoint = `/api/admin/users/${user.id}/status`; 
            
            // Payload (bool ou objet)
            await apiClient(endpoint, 'PUT', { isActive: !user.isActive });
            
            // Optimistic Update
            setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
        
        } catch (e: any) {
            // Fallback: Si route admin status 404, essayer route spécifique update
            try {
               // Re-tenter avec route d'update standard si le toggle n'existe pas
               const base = user.role === 'CLIENT' ? '/api/users' : '/api/business-actors';
               await apiClient(`${base}/${user.id}`, 'PUT', { isActive: !user.isActive, is_active: !user.isActive });
               
               // Si ça marche
               setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
            } catch(e2) {
               alert("Impossible de changer le statut.");
               console.error(e2);
            }
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if(!confirm("⚠️ ATTENTION : Suppression définitive. Confirmer ?")) return;
        setProcessingId(id);
        try {
            await apiClient(`/api/users/${id}`, 'DELETE'); // Route souvent commune cascade
            setAllUsers(prev => prev.filter(u => u.id !== id));
        } catch(e) { console.error(e); }
        finally { setProcessingId(null); }
    };
    
    // Fonction spécifique pour valider les comptes Business (s'ils ne sont pas auto-vérifiés)
    const handleVerify = async (user: AdminUser) => {
        if(user.isVerified) return;
        setProcessingId(user.id);
        try {
            await adminService.validateBusinessActor(user.id, true);
            setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, isVerified: true, isActive: true } : u));
        } catch(e) { alert("Erreur validation"); }
        finally { setProcessingId(null); }
    }


    // --- RENDER ---
    return (
        <div className="space-y-6 pb-20">
            
            {/* Header & Stats Rapides */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                 <div>
                     <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                         <Users className="text-orange-500 w-8 h-8"/> Gestion Utilisateurs
                     </h2>
                     <p className="text-slate-500 text-sm font-medium mt-1">
                        {allUsers.length} comptes total • {allUsers.filter(u => u.role === 'CLIENT').length} Clients
                     </p>
                 </div>
                 
                 {/* Barre de Filtres (Onglets) */}
                 <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full">
                     {FILTER_TABS.map(t => (
                         <button 
                            key={t.id}
                            onClick={() => setFilter(t.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all
                            ${filter === t.id 
                                ? `bg-slate-900 text-white shadow` 
                                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                         >
                             <t.icon className="w-4 h-4" /> {t.label}
                         </button>
                     ))}
                 </div>
            </div>

            {/* Barre Recherche */}
            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <Search className="w-5 h-5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Rechercher par nom, email ou entreprise..." 
                    className="flex-1 bg-transparent outline-none text-slate-800 dark:text-white font-medium placeholder-slate-400"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <button onClick={loadData} title="Rafraîchir" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Liste */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase font-bold text-slate-500">
                        <tr>
                            <th className="p-4">Utilisateur</th>
                            <th className="p-4">Type Compte</th>
                            <th className="p-4 text-center">État</th>
                            <th className="p-4">Contact</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                         {loading ? (
                             <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500"/></td></tr>
                         ) : displayData.length === 0 ? (
                             <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">Aucun utilisateur trouvé.</td></tr>
                         ) : (
                             displayData.map(u => (
                                 <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 group">
                                     <td className="p-4">
                                         <div className="flex items-center gap-3">
                                             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${
                                                 u.role === 'CLIENT' ? 'from-blue-400 to-blue-600' :
                                                 u.role === 'AGENCY_OWNER' ? 'from-purple-500 to-indigo-600' :
                                                 u.role === 'RELAY_OWNER' ? 'from-red-400 to-red-600' :
                                                 'from-orange-400 to-orange-600'
                                             }`}>
                                                 {u.avatarInitial}
                                             </div>
                                             <div>
                                                 <p className="font-bold text-slate-900 dark:text-white">{u.businessName || u.name}</p>
                                                 {/* Si c'est un business et qu'il y a un nom de gérant distinct */}
                                                 {u.businessName && u.name !== u.businessName && (
                                                     <p className="text-[10px] text-slate-500">Gérant: {u.name}</p>
                                                 )}
                                             </div>
                                         </div>
                                     </td>
                                     <td className="p-4">
                                         <div className="flex flex-col gap-1">
                                             <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                                 ${u.role === 'CLIENT' ? 'bg-slate-100 text-slate-600' : 
                                                   u.role === 'RELAY_OWNER' ? 'bg-red-100 text-red-700' :
                                                   u.role === 'AGENCY_OWNER' ? 'bg-purple-100 text-purple-700' :
                                                   'bg-orange-100 text-orange-700'}
                                             `}>
                                                 {u.role.replace('_', ' ')}
                                             </span>
                                             {!u.isVerified && u.role !== 'CLIENT' && (
                                                 <span className="text-[10px] text-amber-600 flex items-center gap-1 font-bold">
                                                     <ShieldAlert className="w-3 h-3"/> Non Vérifié
                                                 </span>
                                             )}
                                         </div>
                                     </td>
                                     <td className="p-4 text-center">
                                         {u.isActive ? (
                                             <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                                                 <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/> Actif
                                             </span>
                                         ) : (
                                             <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold border border-gray-200">
                                                 Suspendu
                                             </span>
                                         )}
                                     </td>
                                     <td className="p-4 text-slate-500 text-xs">
                                         <p>{u.email}</p>
                                         <p>{u.phoneNumber}</p>
                                     </td>
                                     <td className="p-4 text-right">
                                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                             
                                             {/* Bouton de Validation pour les Pros en attente */}
                                             {!u.isVerified && u.role !== 'CLIENT' && (
                                                 <button onClick={() => handleVerify(u)} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition" title="Valider compte">
                                                     <ShieldCheck className="w-4 h-4"/>
                                                 </button>
                                             )}

                                             <button 
                                                onClick={() => toggleStatus(u)} 
                                                className={`p-2 rounded-lg transition ${u.isActive ? 'bg-slate-100 text-slate-500 hover:text-orange-600 hover:bg-orange-50' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                                                title={u.isActive ? "Désactiver" : "Activer"}
                                             >
                                                {u.isActive ? <UserX className="w-4 h-4"/> : <CheckCircle className="w-4 h-4"/>}
                                             </button>

                                             <button onClick={() => handleDelete(u.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition" title="Supprimer">
                                                 <Trash2 className="w-4 h-4"/>
                                             </button>
                                         </div>
                                     </td>
                                 </tr>
                             ))
                         )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
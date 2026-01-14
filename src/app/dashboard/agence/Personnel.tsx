// FICHIER: src/app/dashboard/Personnel.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Plus, Eye, Loader2, RefreshCw, 
  MapPin, AlertTriangle, Power, 
  CheckCircle, Store, X, ArrowLeftRight
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';
import { agencyService } from '@/services/agencyService';
import { relayPointService, RelayPoint } from '@/services/relayPointService';
import { employeeService, Employee, EmployeeRole } from '@/services/employeeService';
import apiClient from '@/services/apiClient';

// Sous-composants
import DetailPersonnel from './DetailPersonnel';
import CreateEmployee from './CreateEmploye'; // <-- IMPORT DU NOUVEAU COMPOSANT

interface AssignmentForm { employee: Employee; relayId: string; }

export default function PersonnelPage() {
    const { user: authUser } = useAuth();
    
    // --- ÉTATS DE DONNÉES ---
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
    const [agencyId, setAgencyId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Filters & UI
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'ALL' | EmployeeRole>('ALL');

    // Modales & Panels
    const [showDetailPanel, setShowDetailPanel] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    
    // --- MODALES D'ACTION ---
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    
    const [assignForm, setAssignForm] = useState<AssignmentForm | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

// ==================================================================================
    // 1. CHARGEMENT ROBUSTE ET LOGGÉ
    // ==================================================================================
    const refreshData = async () => {
        if (!authUser?.id) return;
        
        console.group('🔄 [PERSONNEL PAGE] Chargement Initial');
        setLoading(true);

        try {
            // ETAPE A: Récupérer l'agence avec l'ID du User connecté
            // Route : GET /api/agencies/owner/{ownerId}
            console.log(`1️⃣ Récupération Agence pour OwnerID: ${authUser.id}`);
            const ag = await agencyService.getAgencyByOwnerId(authUser.id);

            // VERIFICATION CRITIQUE
            if (!ag || !ag.id) {
                console.warn("❌ CRITIQUE: Aucune agence ou ID invalide retourné.");
                toast.error("Veuillez d'abord configurer votre agence.");
                setLoading(false);
                console.groupEnd();
                return;
            }

            const validAgencyId = ag.id;
            console.log(`✅ Agence Validée: "${ag.commercial_name}" (ID: ${validAgencyId})`);
            setAgencyId(validAgencyId);

            // ETAPE B: Lancer les requêtes dépendantes en parallèle
            // Routes : /api/agencies/{id}/employees et /api/agencies/{id}/relay-points
            console.log(`2️⃣ Lancement des requêtes enfants avec ID Agence : ${validAgencyId}`);
            
            const [empsData, relaysData] = await Promise.all([
                agencyService.getAgencyEmployees(validAgencyId),
                agencyService.getAgencyRelayPoints(validAgencyId)
            ]);

            // ETAPE C: Traitement des données
            console.log(`📥 Reçu: ${empsData.length} employés, ${relaysData.length} points relais.`);

            // Mapping UI Employés
            const uiEmployees = empsData.map((e: any) => ({
                id: e.id, 
                userId: e.userId || e.user_id,
                agencyId: e.agency_id || e.agencyId,
                name: e.name || e.manager_name || "Nom Inconnu", // Fallback si name n'est pas populated
                email: e.email,
                phone: e.phone || e.phone_number,
                // Gestion Rôle (String ou Array)
                role: (Array.isArray(e.role) ? e.role[0] : e.role) || 'GENERAL', 
                photoUrl: e.photo_url || e.photoUrl,
                status: e.status || 'ACTIF',
                relayPointId: e.assigned_relay_point_id || e.relayPointId || null, 
                createdAt: e.created_at || e.createdAt
            } as unknown as Employee));

            setEmployees(uiEmployees);
            setRelayPoints(relaysData);

        } catch (e: any) {
            console.error("❌ Erreur Globale Chargement:", e);
            // On ne montre le toast que si ce n'est pas une 404 (agence inexistante)
            if (!e.message?.includes('404')) {
                toast.error("Erreur de connexion aux données.");
            }
        } finally {
            setLoading(false);
            console.groupEnd();
        }
    };

    useEffect(() => { refreshData(); }, [authUser]);
    // ==================================================================================
    // 2. ACTIONS
    // ==================================================================================

    // A. Ouverture Assignation
    const handleOpenAssign = (employee: Employee) => {
        setAssignForm({ employee, relayId: employee.relayPointId || '' });
        setShowAssignModal(true);
    };

    // --- ASSIGNATION ---
    const handleAssignSubmit = async () => {
        if (!assignForm || !assignForm.relayId || !agencyId) {
             toast.error("Données manquantes (Agence ou Relais).");
             return;
        }

        setIsActionLoading(true);
        
        // Données pour la route
        const targetRelayId = assignForm.relayId;
        const targetEmployeeUserId = assignForm.employee.userId; 

        // LOG DE LA REQUÊTE POUR VÉRIF CONSOLE
        console.group("🚀 [ACTION] Soumission Assignation");
        console.log(`📍 Route: /api/agencies/${agencyId}/relay-points/${targetRelayId}/manager/${targetEmployeeUserId}`);

        try {
            // Appel via agencyService (fonction assignManagerToRelay corrigée ci-dessus)
            await agencyService.assignManagerToRelay(
                agencyId, 
                targetRelayId, 
                targetEmployeeUserId
            );
            
            toast.success(`Succès ! ${assignForm.employee.name} a été assigné.`);
            setShowAssignModal(false);
            setAssignForm(null);
            
            // Rafraîchissement pour mettre à jour la liste
            await refreshData();

        } catch (error: any) {
            console.error("❌ Erreur lors de l'assignation:", error);
            // Extraction du message d'erreur API
            const msg = error.message || "Erreur serveur lors de l'assignation";
            toast.error(`Échec: ${msg}`);
        } finally {
            setIsActionLoading(false);
            console.groupEnd();
        }
    };


    // C. Toggle Status
    const handleToggleStatus = async (employee: Employee) => {
        if(!confirm("Changer le statut de cet employé ?")) return;
        // Ici on suppose un appel API user update classique
        toast.success("Fonctionnalité simulée (statut changé)");
    };

    const handleReportProblem = () => toast('Signalement envoyé aux admins.', { icon: '🚨' });


    const filteredEmployees = useMemo(() => {
        return employees.filter(e => {
            const matchesSearch = (e.name||'').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (e.email||'').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = filterRole === 'ALL' || e.role === filterRole;
            return matchesSearch && matchesRole;
        });
    }, [employees, searchTerm, filterRole]);

    const getRelayName = (id?: string) => {
        if(!id) return null;
        const r = relayPoints.find(rp => String(rp.id) === String(id));
        return r ? r.relayPointName : <span className="text-gray-400 italic font-mono text-[10px]">{id.slice(0,5)}...</span>;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-transparent pb-10 font-sans">
            <Toaster position="top-right"/>

            {/* Sidebar Slide-over Details */}
            <AnimatePresence>
                {showDetailPanel && selectedEmployee && (
                    <DetailPersonnel 
                        employee={selectedEmployee} 
                        relayPoint={relayPoints.find(rp => String(rp.id) === String(selectedEmployee.relayPointId))}
                        onClose={() => { setShowDetailPanel(false); setSelectedEmployee(null); }}
                    />
                )}
            </AnimatePresence>

            {/* Modal de Création (Le nouveau fichier) */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateEmployee 
                        isOpen={showCreateModal}
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={refreshData}
                        agencyId={agencyId}
                    />
                )}
            </AnimatePresence>


            {/* HEADER */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div>
                     <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                         <Users className="w-8 h-8 text-orange-500"/> Personnel
                     </h1>
                     <p className="text-slate-500 font-medium mt-1">{employees.length} collaborateurs actifs</p>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                     <div className="relative flex-1 md:w-64">
                         <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                         <input 
                            type="text" placeholder="Rechercher nom, email..." 
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                         />
                     </div>
                     <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition flex items-center gap-2 font-bold text-sm">
                         <Plus className="w-4 h-4"/> Nouveau
                     </button>
                     <button onClick={refreshData} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition text-gray-500">
                         <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin':''}`}/>
                     </button>
                </div>
            </div>

            {/* FILTRES ROLE */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {[
                   {k: 'ALL', l: 'Tous'}, 
                   {k: 'RELAY_MANAGER', l: 'Gérants'}, 
                   {k: 'DELIVERER', l: 'Livreurs'}, 
                   {k: 'GENERAL', l: 'Staff'}
                ].map((tab) => (
                    <button 
                        key={tab.k} onClick={() => setFilterRole(tab.k as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap border
                        ${filterRole === tab.k 
                           ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' 
                           : 'bg-white border-transparent text-slate-500 hover:bg-slate-100 hover:border-slate-200'}`}
                    >
                        {tab.l}
                    </button>
                ))}
            </div>

            {/* TABLEAU */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                             <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Employé</th>
                             <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Contact</th>
                             <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Rôle & Relais</th>
                             <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Statut</th>
                             <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredEmployees.length === 0 ? (
                            <tr><td colSpan={5} className="p-10 text-center text-gray-400 italic">Aucun résultat.</td></tr>
                        ) : (
                            filteredEmployees.map((emp) => {
                                const relayName = getRelayName(emp.relayPointId || undefined);
                                return (
                                <tr key={emp.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 font-bold flex items-center justify-center border border-orange-200 dark:border-orange-800">
                                                {emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">{emp.name}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">ID: {emp.id.substring(0,8)}</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                        <p>{emp.email}</p>
                                        <p className="text-xs">{emp.phone}</p>
                                    </td>
                                    
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                                ${emp.role === 'RELAY_MANAGER' ? 'bg-blue-100 text-blue-700' : 
                                                  emp.role === 'DELIVERER' ? 'bg-orange-100 text-orange-700' :
                                                  'bg-gray-100 text-gray-700'}
                                            `}>
                                                {emp.role?.replace('_', ' ')}
                                            </span>
                                            {/* Si Relay Point assigné, on l'affiche TOUJOURS */}
                                            {relayName ? (
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    <Store className="w-3.5 h-3.5 text-green-500"/> {relayName}
                                                </div>
                                            ) : (
                                                emp.role === 'RELAY_MANAGER' && (
                                                    <div className="flex items-center gap-1.5 text-xs text-red-500 italic">
                                                        <AlertTriangle className="w-3.5 h-3.5"/> Non Assigné
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        {emp.status === 'ACTIF' ? (
                                            <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Actif
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-gray-400 font-bold text-xs">
                                                <Power className="w-3 h-3"/> Désactivé
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                         <div className="flex justify-end items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                             
                                             <button 
                                                onClick={() => { setSelectedEmployee(emp); setShowDetailPanel(true); }}
                                                className="p-2 rounded-lg bg-white border hover:bg-slate-50 text-slate-500 hover:text-blue-600 shadow-sm"
                                                title="Détails"
                                             >
                                                <Eye className="w-4 h-4"/>
                                             </button>

                                             {/* Bouton Assigner DISPONIBLE POUR TOUS selon consigne */}
                                             <button 
                                                onClick={() => handleOpenAssign(emp)}
                                                className={`p-2 rounded-lg bg-white border shadow-sm transition ${emp.relayPointId ? 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100' : 'text-slate-500 hover:text-orange-600 hover:border-orange-300'}`}
                                                title={emp.relayPointId ? "Changer l'affectation" : "Assigner à un point"}
                                             >
                                                <Store className="w-4 h-4"/>
                                             </button>

                                             <div className="h-4 w-px bg-slate-200 mx-1"></div>

                                             <button onClick={() => handleReportProblem()} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                                <AlertTriangle className="w-4 h-4"/>
                                             </button>

                                             <button onClick={() => handleToggleStatus(emp)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                                                <Power className="w-4 h-4"/>
                                             </button>
                                         </div>
                                    </td>
                                </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODALE D'ASSIGNATION (Reusable) --- */}
            <AnimatePresence>
            {showAssignModal && assignForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                         
                         {/* Header Modal */}
                         <div className="p-5 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                             <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                <ArrowLeftRight className="w-5 h-5 text-blue-600"/> Assigner Point Relais
                             </h3>
                             <button onClick={() => setShowAssignModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-red-500"/></button>
                         </div>
                         
                         {/* Content Modal */}
                         <div className="p-6 flex-1 overflow-y-auto">
                             <div className="flex items-center gap-4 mb-6 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900">
                                 <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                     {assignForm.employee.name.charAt(0)}
                                 </div>
                                 <div>
                                     <p className="text-sm font-bold text-slate-900 dark:text-white">{assignForm.employee.name}</p>
                                     <p className="text-xs text-blue-600 font-medium">{assignForm.employee.role}</p>
                                 </div>
                             </div>

                             <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Points Relais Disponibles</label>
                             <div className="space-y-2">
                                 {relayPoints.length === 0 ? (
                                     <p className="text-sm italic text-gray-500 text-center py-4">Aucun point relais trouvé. Créez-en un d'abord.</p>
                                 ) : relayPoints.map(rp => (
                                     <label key={rp.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${assignForm.relayId === rp.id ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-100 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'}`}>
                                         <input 
                                            type="radio" name="relaySelect"
                                            checked={String(assignForm.relayId) === String(rp.id)} // Conversion String sure
                                            onChange={() => setAssignForm({ ...assignForm, relayId: rp.id })}
                                            className="mt-1 w-4 h-4 text-orange-600 accent-orange-600"
                                         />
                                         <div>
                                             <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{rp.relayPointName}</p>
                                             <p className="text-xs text-slate-500">{rp.locality || rp.address || "Adresse inconnue"}</p>
                                         </div>
                                     </label>
                                 ))}
                             </div>
                         </div>

                         {/* Footer Modal */}
                         <div className="p-5 border-t dark:border-slate-800 bg-gray-50 dark:bg-black/20">
                             <button 
                                onClick={handleAssignSubmit}
                                disabled={isActionLoading || !assignForm.relayId}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                             >
                                 {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle className="w-5 h-5"/>}
                                 Confirmer l'assignation
                             </button>
                         </div>
                    </motion.div>
                </div>
            )}
            </AnimatePresence>
        </div>
    );
}
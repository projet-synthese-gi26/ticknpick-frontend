'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    User, Mail, Phone, Lock, Briefcase, 
    X, CheckCircle, Loader2, UserPlus, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

import { authService } from '@/services/authService';
import { agencyService } from '@/services/agencyService';
import { employeeService, EmployeeRole } from '@/services/employeeService';
import apiClient from '@/services/apiClient';
import { BusinessActorRegistrationRequest } from '@/types/api';

interface CreateEmployeeProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void; // Pour rafraichir la liste
    agencyId: string | null;
}

export default function CreateEmployee({ isOpen, onClose, onSuccess, agencyId }: CreateEmployeeProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'GENERAL' as EmployeeRole,
        position: '' // Titre du poste (ex: "Chauffeur Nuit")
    });

    // Reset du formulaire à l'ouverture
    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', password: '', role: 'GENERAL', position: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!agencyId) {
            toast.error("Identifiant de l'agence manquant.");
            return;
        }

        console.group("🚀 [CREATE EMPLOYEE] Début du processus de création");
        setLoading(true);

        try {
            // --- ETAPE 1 : CRÉATION DU COMPTE UTILISATEUR ---
            console.log("1️⃣ Préparation payload Inscription (Auth)");
            const registrationPayload: BusinessActorRegistrationRequest = {
                accountType: 'BUSINESS_ACTOR',
                businessActorType: 'EMPLOYEE',
                email: formData.email,
                password: formData.password,
                name: formData.name,
                phoneNumber: formData.phone,
                // On met le nom comme BusinessName par défaut pour les employés
                businessName: formData.name, 
                // Valeurs par défaut pour éviter erreurs validation
                city: 'Non spécifié', 
                country: 'cameroun'
            };
            console.log("📤 Payload envoyé à authService.registerBusinessActor:", registrationPayload);

            const userRes = await authService.registerBusinessActor(registrationPayload);
            
            // Récupération sécurisée de l'ID
            const newUserId = userRes.userId || userRes.id;
            console.log("✅ Réponse Auth (User Created) - ID:", newUserId, userRes);

            if (!newUserId) throw new Error("ID utilisateur non reçu de l'API d'authentification.");

            // --- ETAPE 2 : LIAISON AVEC L'AGENCE ---
            console.log(`2️⃣ Liaison de l'utilisateur ${newUserId} avec l'agence ${agencyId}...`);
            await agencyService.addEmployeeToAgency(agencyId, newUserId);
            console.log("✅ Liaison Agence effectuée (Table Employee créée)");

            // --- ETAPE 3 : RÉCUPÉRATION FICHE EMPLOYE ---
            // On doit récupérer l'ID de la ligne 'Employee' pour changer le rôle, 
            // car l'étape 2 ne le renvoie pas forcément selon l'API.
            console.log("3️⃣ Recherche de la nouvelle fiche employé pour mise à jour du rôle...");
            
            // On fetch la liste à jour
            const employeesList = await apiClient<any[]>(`/api/v1/employees/agency/${agencyId}`, 'GET');
            
            // On cherche notre nouveau gars
            const employeeRecord = employeesList.find((e: any) => e.userId === newUserId || e.user_id === newUserId);
            
            if (!employeeRecord) {
                console.warn("⚠️ Attention: Fiche employé introuvable immédiatement. Le rôle restera par défaut 'GENERAL'.");
            } else {
                console.log("📋 Fiche Employé trouvée, ID:", employeeRecord.id);

                // --- ETAPE 4 : APPLICATION DU RÔLE (Si différent de GENERAL) ---
                if (formData.role !== 'GENERAL') {
                    console.log(`4️⃣ Appel PATCH change-role -> ${formData.role} sur Employee ${employeeRecord.id}`);
                    await employeeService.changeRole(employeeRecord.id, formData.role);
                    console.log("✅ Rôle mis à jour.");
                } else {
                    console.log("ℹ️ Rôle 'GENERAL' par défaut conservé.");
                }
            }

            toast.success("Employé créé avec succès !");
            console.log("🎉 Processus terminé.");
            resetForm();
            onSuccess(); // Refresh parent
            onClose();

        } catch (err: any) {
            console.error("❌ ERREUR CRÉATION:", err);
            const msg = err.message || "Une erreur est survenue.";
            if (msg.includes('exist')) toast.error("Cet email ou téléphone est déjà utilisé.");
            else toast.error("Echec création: " + msg);
        } finally {
            setLoading(false);
            console.groupEnd();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-1 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            {/* Click outside to close handled manually by button to prevent accidental closes during form fill */}
            <div className="absolute inset-0" onClick={() => !loading && onClose()} />

            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <UserPlus className="w-6 h-6 text-orange-600"/> Nouvel Employé
                        </h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">Créez le compte d'accès. Vous pourrez assigner un relais ensuite.</p>
                    </div>
                    <button onClick={onClose} disabled={loading} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                        <X className="w-5 h-5 text-slate-500"/>
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                    
                    {/* Identité */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-1 mb-3">Identité & Accès</h3>
                        
                        <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Nom Complet</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 w-5 h-5 text-slate-400"/>
                                <input 
                                    required autoFocus
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition"
                                    placeholder="Ex: Jean Dupont"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Téléphone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400"/>
                                    <input 
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition"
                                        placeholder="6XX XXX XXX"
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                             </div>
                             <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Poste (Optionnel)</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-3 w-5 h-5 text-slate-400"/>
                                    <input 
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition"
                                        placeholder="Ex: Agent logistique"
                                        value={formData.position}
                                        onChange={e => setFormData({...formData, position: e.target.value})}
                                    />
                                </div>
                             </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Email (Login)</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400"/>
                                <input 
                                    required type="email"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition"
                                    placeholder="employe@agence.com"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Mot de passe provisoire</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400"/>
                                <input 
                                    required type="text" // Text pour visibilité facile à la création
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition font-mono"
                                    placeholder="password123"
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rôles */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 pb-1 mb-3">Permissions</h3>
                        
                        <div className="grid grid-cols-2 gap-3">
                             <div 
                                onClick={() => setFormData({...formData, role: 'GENERAL'})}
                                className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-center gap-3 ${formData.role === 'GENERAL' ? 'border-gray-500 bg-gray-50 dark:bg-gray-800' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50'}`}
                             >
                                 <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.role === 'GENERAL' ? 'bg-gray-500 border-gray-500' : 'border-gray-400'}`}>
                                     {formData.role === 'GENERAL' && <div className="w-2 h-2 bg-white rounded-full"/>}
                                 </div>
                                 <span className="text-xs font-bold">Employé Standard</span>
                             </div>

                             <div 
                                onClick={() => setFormData({...formData, role: 'DELIVERER'})}
                                className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-center gap-3 ${formData.role === 'DELIVERER' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50'}`}
                             >
                                 <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.role === 'DELIVERER' ? 'bg-orange-500 border-orange-500' : 'border-gray-400'}`}>
                                     {formData.role === 'DELIVERER' && <div className="w-2 h-2 bg-white rounded-full"/>}
                                 </div>
                                 <span className="text-xs font-bold">Livreur</span>
                             </div>
                             
                             <div 
                                onClick={() => setFormData({...formData, role: 'RELAY_MANAGER'})}
                                className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-center gap-3 ${formData.role === 'RELAY_MANAGER' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50'}`}
                             >
                                 <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.role === 'RELAY_MANAGER' ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                                     {formData.role === 'RELAY_MANAGER' && <div className="w-2 h-2 bg-white rounded-full"/>}
                                 </div>
                                 <span className="text-xs font-bold">Gérant Relais</span>
                             </div>

                             <div 
                                onClick={() => setFormData({...formData, role: 'AGENCY_MANAGER'})}
                                className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-center gap-3 ${formData.role === 'AGENCY_MANAGER' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50'}`}
                             >
                                 <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.role === 'AGENCY_MANAGER' ? 'bg-purple-500 border-purple-500' : 'border-gray-400'}`}>
                                     {formData.role === 'AGENCY_MANAGER' && <div className="w-2 h-2 bg-white rounded-full"/>}
                                 </div>
                                 <span className="text-xs font-bold">Manager Agence</span>
                             </div>
                        </div>

                        {formData.role === 'RELAY_MANAGER' && (
                             <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 text-blue-700 dark:text-blue-300 text-xs flex items-start gap-2">
                                 <Shield className="w-4 h-4 mt-0.5"/>
                                 <p>Une fois créé, vous pourrez assigner cet employé à un Point Relais spécifique depuis la liste principale.</p>
                             </div>
                        )}
                    </div>

                </form>

                {/* Footer */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex gap-4">
                     <button 
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-500 hover:bg-white dark:hover:bg-slate-700 transition"
                     >
                        Annuler
                     </button>
                     <button 
                        onClick={handleSubmit}
                        disabled={loading || !formData.name || !formData.email || !formData.password}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold shadow-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                     >
                         {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle className="w-5 h-5"/>}
                         Créer le compte
                     </button>
                </div>

            </motion.div>
        </div>
    );
}
// src/app/superadmin/UserManagement.tsx

'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Filter, Loader2, MoreVertical, X, Eye, Edit, UserX, UserCheck, AlertCircle, Inbox, CheckCircle, ShieldQuestion } from 'lucide-react';

// Interfaces pour typer nos données
interface User {
    id: string;
    manager_name: string;
    email: string;
    account_type: 'CLIENT' | 'LIVREUR' | 'FREELANCE' | 'AGENCY';
    phone_number: string;
    created_at: string;
    status: 'ACTIVE' | 'SUSPENDED';
    validation_status?: 'PENDING' | 'APPROVED' | 'REJECTED'; // Ajouté
    // Inclure les champs de documents pour la validation
    id_card_urls?: { front: string; back: string } | null;
    niu_document_url?: string | null;
    driving_license_front_url?: string | null;
}

const ITEMS_PER_PAGE = 10;

// Sous-composant : UserDetailsModal
const UserDetailsModal = ({ user, onClose }: { user: User; onClose: () => void }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">{user.manager_name}</h3>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Téléphone:</strong> {user.phone_number}</p>
            <p><strong>Type:</strong> {user.account_type}</p>
            <p><strong>Statut:</strong> {user.status}</p>
            <p><strong>Inscrit le:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
            {/* Ici on pourrait afficher les autres détails de profil */}
            <button onClick={onClose} className="mt-4 bg-gray-200 px-4 py-2 rounded">Fermer</button>
        </motion.div>
    </motion.div>
);

// --- COMPOSANT PRINCIPAL ---
export default function UserManagement() {
    const [activeView, setActiveView] = useState<'all' | 'pending'>('all');
    const [users, setUsers] = useState<User[]>([]);
    const [pendingUsers, setPendingUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Fonction pour récupérer les utilisateurs en attente de validation
    const fetchPendingUsers = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('profiles_pro')
            .select('*')
            .eq('validation_status', 'PENDING');
        if (error) setError("Erreur lors de la récupération des validations.");
        else setPendingUsers(data as User[]);
        setIsLoading(false);
    }, []);

    // Fonction pour récupérer les utilisateurs paginés via la fonction RPC
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const { data: countData, error: countError } = await supabase
            .from('profiles')
            .select('id', { count: 'exact' }); // Simplification pour le total
        const { data: countProData, error: countProError } = await supabase
            .from('profiles_pro')
            .select('id', { count: 'exact' });
        
        if (countError || countProError) {
             setError("Erreur de comptage des utilisateurs");
        } else {
             setTotalUsers((countData?.length || 0) + (countProData?.length || 0));
        }

        const { data, error } = await supabase.rpc('search_all_users', {
            search_term: searchTerm,
            filter_type: filterType,
            page_limit: ITEMS_PER_PAGE,
            page_offset: (currentPage - 1) * ITEMS_PER_PAGE
        });

        if (error) {
            setError("Impossible de charger les utilisateurs.");
            console.error(error);
        } else {
            setUsers(data as User[]);
        }
        setIsLoading(false);
    }, [searchTerm, filterType, currentPage]);

    useEffect(() => {
        if (activeView === 'all') {
            fetchUsers();
        } else {
            fetchPendingUsers();
        }
    }, [activeView, fetchUsers, fetchPendingUsers]);
    
    // Déclencher une nouvelle recherche avec un délai pour ne pas surcharger la DB
    useEffect(() => {
        const handler = setTimeout(() => {
            setCurrentPage(1); // Revenir à la première page lors d'une nouvelle recherche
            if (activeView === 'all') fetchUsers();
        }, 500); // 500ms de délai
        return () => clearTimeout(handler);
    }, [searchTerm, filterType, fetchUsers, activeView]);

    const handleUpdateUserStatus = async (user: User, newStatus: 'ACTIVE' | 'SUSPENDED') => {
        const table = ['CLIENT', 'LIVREUR'].includes(user.account_type) ? 'profiles' : 'profiles_pro';
        const { error } = await supabase.from(table).update({ status: newStatus }).eq('id', user.id);
        if (error) alert("Erreur lors de la mise à jour du statut.");
        else fetchUsers(); // Recharger les données
    };

    const handleValidation = async (userId: string, decision: 'APPROVED' | 'REJECTED') => {
        const { error } = await supabase.from('profiles_pro').update({ validation_status: decision }).eq('id', userId);
        if(error) alert(`Erreur lors de la ${decision === 'APPROVED' ? 'validation' : 'rejet'}.`);
        else fetchPendingUsers();
    };

    const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Gestion des Utilisateurs</h1>

            <div className="flex border-b">
                <button onClick={() => setActiveView('all')} className={`py-2 px-4 font-semibold ${activeView === 'all' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}>Tous les utilisateurs</button>
                <button onClick={() => setActiveView('pending')} className={`py-2 px-4 font-semibold relative ${activeView === 'pending' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}>
                    File de validation
                    {pendingUsers.length > 0 && <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{pendingUsers.length}</span>}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeView === 'all' ? (
                    <motion.div key="all-users" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <input type="text" placeholder="Rechercher (nom, email...)" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow p-2 border rounded"/>
                            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="p-2 border rounded">
                                <option value="ALL">Tous les types</option>
                                <option value="CLIENT">Client</option>
                                <option value="LIVREUR">Livreur</option>
                                <option value="FREELANCE">Freelance</option>
                                <option value="AGENCY">Agence</option>
                            </select>
                        </div>
                        {isLoading && <Loader2 className="animate-spin mx-auto" />}
                        {error && <p className="text-red-500">{error}</p>}
                        
                        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                           {/* Tableau des utilisateurs */}
                           {/* (code du tableau ci-dessous) */}
                           <table className="w-full text-sm text-left text-gray-500">
                              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                  <tr>
                                      <th className="px-6 py-3">Nom</th>
                                      <th className="px-6 py-3">Type</th>
                                      <th className="px-6 py-3">Inscription</th>
                                      <th className="px-6 py-3">Statut</th>
                                      <th className="px-6 py-3">Actions</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {users.map(user => (
                                      <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                          <td className="px-6 py-4 font-medium text-gray-900">
                                              {user.manager_name}<br/>
                                              <span className="text-gray-400 font-normal">{user.email}</span>
                                          </td>
                                          <td className="px-6 py-4">{user.account_type}</td>
                                          <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                                          <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.status}</span>
                                          </td>
                                          <td className="px-6 py-4 flex gap-2">
                                              <button onClick={() => setSelectedUser(user)} className="text-blue-500"><Eye size={16} /></button>
                                              <button className="text-green-500"><Edit size={16} /></button>
                                              {user.status === 'ACTIVE' 
                                                ? <button onClick={() => handleUpdateUserStatus(user, 'SUSPENDED')} className="text-red-500"><UserX size={16} /></button> 
                                                : <button onClick={() => handleUpdateUserStatus(user, 'ACTIVE')} className="text-yellow-500"><UserCheck size={16} /></button>}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                        </div>
                        {/* Pagination */}
                        <div className="flex justify-between items-center mt-4">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>Précédent</button>
                            <span>Page {currentPage} sur {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>Suivant</button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="pending-users" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {/* Section pour la file de validation */}
                         {isLoading && <Loader2 className="animate-spin mx-auto" />}
                         {error && <p className="text-red-500">{error}</p>}
                         {!isLoading && pendingUsers.length === 0 ? (
                           <div className="text-center p-8 bg-white rounded-lg shadow">
                             <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                             <h3 className="mt-2 text-sm font-medium text-gray-900">Tout est à jour !</h3>
                             <p className="mt-1 text-sm text-gray-500">Aucun nouveau compte PRO n'est en attente de validation.</p>
                           </div>
                         ) : (
                           <div className="space-y-4">
                              {pendingUsers.map(user => (
                                 <div key={user.id} className="bg-white shadow-md rounded-lg p-4 flex justify-between items-center">
                                      <div>
                                          <p className="font-bold">{user.manager_name} ({user.account_type})</p>
                                          <p className="text-sm text-gray-500">{user.email}</p>
                                          <div className="flex gap-4 mt-2">
                                            {user.id_card_urls && <a href="#" className="text-blue-500 text-sm">Voir CNI</a>}
                                            {user.niu_document_url && <a href={user.niu_document_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm">Voir NIU</a>}
                                            {user.driving_license_front_url && <a href={user.driving_license_front_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm">Voir Permis</a>}
                                          </div>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => handleValidation(user.id, 'APPROVED')} className="bg-green-500 text-white px-3 py-1 rounded">Approuver</button>
                                          <button onClick={() => handleValidation(user.id, 'REJECTED')} className="bg-red-500 text-white px-3 py-1 rounded">Rejeter</button>
                                      </div>
                                 </div>
                              ))}
                           </div>
                         )}
                    </motion.div>
                )}
            </AnimatePresence>
            
            <AnimatePresence>
              {selectedUser && <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
            </AnimatePresence>
        </div>
    );
}
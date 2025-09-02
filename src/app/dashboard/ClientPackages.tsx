// FICHIER : src/app/dashboard/ClientPackages.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { UserProfile } from './page';
import { Package, Search, PlusCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

// Simplification du type pour cette vue
interface ClientPackage {
  id: string; // trackingNumber
  status: string;
  designation: string;
  recipientName: string;
  arrivalPoint: string;
  created_at: string;
}

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'EN_ATTENTE_DE_DEPOT': return { label: 'En attente', icon: Clock, color: 'text-orange-600' };
        case 'AU_DEPART': return { label: 'Au départ', icon: Package, color: 'text-blue-600' };
        case 'EN_TRANSIT': return { label: 'En transit', icon: Package, color: 'text-sky-600' };
        case 'ARRIVE_AU_RELAIS': return { label: 'Arrivé', icon: CheckCircle, color: 'text-teal-600' };
        case 'RECU': return { label: 'Retiré', icon: CheckCircle, color: 'text-green-600' };
        default: return { label: status, icon: AlertTriangle, color: 'text-gray-500' };
    }
};

export default function ClientPackagesPage({ profile }: { profile: UserProfile }) {
    const [packages, setPackages] = useState<ClientPackage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchPackages = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('shipments')
                .select(`
                    id:tracking_number,
                    status,
                    designation:description,
                    recipientName:recipient_name,
                    arrivalPoint:arrival_point_id(name),
                    created_at
                `)
                .eq('created_by_user', profile.id)
                .order('created_at', { ascending: false });

            if (data) {
                // Le typage `any` est utilisé ici pour simplifier car la jointure retourne un objet
                const formattedData = data.map((p: any) => ({
                    ...p,
                    arrivalPoint: p.arrivalPoint?.name || 'N/A'
                }));
                setPackages(formattedData);
            }
            setIsLoading(false);
        };
        fetchPackages();
    }, [profile.id]);
    
    const filteredPackages = useMemo(() => 
        packages.filter(p => p.designation.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()))
    , [packages, search]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-gray-800">Mes Colis Envoyés</h2>
                 <Link href="/expedition">
                    <button className="flex items-center gap-2 bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-700 transition-all shadow-md">
                        <PlusCircle size={18} />
                        Envoyer un nouveau colis
                    </button>
                 </Link>
            </div>
             <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Rechercher par code ou désignation..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-lg" />
             </div>
             <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
                 <table className="w-full">
                     <thead className="bg-gray-50">
                         <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">CODE</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">DÉSIGNATION</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">DESTINATAIRE</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">STATUT</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">DATE</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600"></th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {filteredPackages.map(p => {
                             const status = getStatusConfig(p.status);
                             return (
                                 <tr key={p.id} className="hover:bg-orange-50">
                                     <td className="px-6 py-4 font-mono font-medium text-gray-800">{p.id}</td>
                                     <td className="px-6 py-4 text-gray-700">{p.designation}</td>
                                     <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold text-gray-800">{p.recipientName}</p>
                                            <p className="text-xs text-gray-500">{p.arrivalPoint}</p>
                                        </div>
                                     </td>
                                     <td className="px-6 py-4">
                                         <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-semibold ${status.color.replace('text-', 'bg-').replace('600', '100')} ${status.color}`}>
                                             <status.icon size={14}/> {status.label}
                                         </div>
                                     </td>
                                     <td className="px-6 py-4 text-sm text-gray-600">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                                     <td className="px-6 py-4">
                                         <Link href={`/track-package?id=${p.id}`}>
                                            <button className="text-orange-600 font-semibold hover:underline text-sm">
                                                Suivre
                                            </button>
                                         </Link>
                                     </td>
                                 </tr>
                             );
                         })}
                     </tbody>
                 </table>
                 {isLoading && <p className="p-4 text-center">Chargement...</p>}
                 {!isLoading && filteredPackages.length === 0 && <p className="p-4 text-center text-gray-500">Aucun colis trouvé.</p>}
             </div>
        </div>
    );
}
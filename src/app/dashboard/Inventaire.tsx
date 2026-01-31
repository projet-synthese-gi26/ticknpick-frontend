'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Inbox, ArrowUpRight, ArrowDownLeft, Truck, CheckCircle, 
  Search, RefreshCw, ArchiveRestore, Building,
  Clock, Loader2, ArrowRight, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { relayPointService, RelayPackage } from '@/services/relayPointService';

// -- TYPES & ENUMS DU FLOW --
type FlowTab = 'DEPOSIT' | 'OUTBOUND' | 'INCOMING' | 'INBOUND' | 'DELIVERY' | 'HISTORY';

const TABS: { id: FlowTab; label: string; icon: any; countKey?: string }[] = [
    { id: 'DEPOSIT', label: 'Dépôts Clients', icon: Inbox },
    { id: 'OUTBOUND', label: 'Stock Départ', icon: ArrowUpRight }, // Vers Livreur
    { id: 'INCOMING', label: 'En Transit', icon: Truck },          // Viennent vers nous
    { id: 'INBOUND', label: 'Stock Arrivée', icon: ArrowDownLeft }, // Reçu du livreur
    { id: 'DELIVERY', label: 'Retrait Client', icon: ArchiveRestore }, // Prêt pour client
    { id: 'HISTORY', label: 'Historique', icon: Clock }
];

export default function InventoryPage({ profile }: { profile: any }) {
    // Data States
    const [allPackages, setAllPackages] = useState<RelayPackage[]>([]);
    const [incomingPackages, setIncomingPackages] = useState<RelayPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<FlowTab>('DEPOSIT');
    const [search, setSearch] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Initialisation : on suppose que le token contient l'identité du point relais (Auth Context)
    // Mais on a aussi besoin de l'ID du relais pour handover
    const relayPointId = profile.assigned_relay_point_id || profile.relayPointId;

    const loadData = async () => {
        setLoading(true);
        try {
            console.log("📦 Synchronisation Inventaire Flow...");
            // 1. Charger tout l'inventaire physique présent au relais
            const stock = await relayPointService.getMyRelayInventory();
            setAllPackages(stock);

            // 2. Charger les colis qui arrivent (Virtual stock en transit)
            const incoming = await relayPointService.getPackagesIncoming();
            setIncomingPackages(incoming);

        } catch (e) {
            toast.error("Erreur chargement inventaire");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // --- FILTRAGE LOGIQUE SELON FLOW ---
    const filteredList = useMemo(() => {
        let list: RelayPackage[] = [];
        const s = search.toLowerCase();

        switch (activeTab) {
            case 'DEPOSIT': 
                // Colis pré-enregistrés par clients, en attente de dépôt physique
                // status = 'PRE_REGISTERED' ou 'PENDING_DEPOSIT' (visible via getMyRelayInventory si endpoint retourne tout le scope)
                // *Si l'endpoint global ne retourne que le stock physique*, il faudra ajouter un endpoint '/to-deposit'
                // Ici, on filtre sur ce que 'getMyRelayInventory' renvoie (souvent : tout ce qui concerne le relais)
                list = allPackages.filter(p => ['PRE_REGISTERED', 'PENDING'].includes(p.status));
                break;
            
            case 'OUTBOUND':
                // Colis reçus du client, à envoyer au hub/destinataire
                // status = 'AT_DEPARTURE_RELAY_POINT' -> Action: Prêt pour envoi
                list = allPackages.filter(p => ['AT_DEPARTURE_RELAY_POINT'].includes(p.status));
                break;
                
            case 'INCOMING':
                // Colis en route vers nous
                // list provenant de l'appel spécifique 'awaiting-arrival'
                list = incomingPackages; 
                break;
                
            case 'INBOUND':
                // Colis reçus du livreur, en attente de tri/traitement
                // status = 'AT_ARRIVAL_RELAY_POINT' (Juste après scan livreur) -> Action: Prêt pour retrait
                list = allPackages.filter(p => ['AT_ARRIVAL_RELAY_POINT'].includes(p.status));
                break;

            case 'DELIVERY':
                // Colis prêts pour le client final
                // status = 'READY_FOR_PICKUP' -> Action: Remise Client
                list = allPackages.filter(p => ['READY_FOR_PICKUP'].includes(p.status));
                break;

            case 'HISTORY':
                // Colis sortis ou livrés
                list = allPackages.filter(p => 
                    ['DELIVERED', 'WITHDRAWN', 'LIVRE', 'RECU', 'DISPATCHED', 'EN_TRANSIT', 'IN_TRANSIT'].includes(p.status) && 
                    !['AT_DEPARTURE_RELAY_POINT', 'AT_ARRIVAL_RELAY_POINT', 'READY_FOR_PICKUP'].includes(p.status)
                );
                // On exclut ce qui est encore physiquement "en travail" chez nous
                break;
        }

        // Search Filter
        if(search) {
            list = list.filter(p => 
                p.trackingNumber.toLowerCase().includes(s) || 
                p.recipientName?.toLowerCase().includes(s)
            );
        }
        return list;
    }, [activeTab, allPackages, incomingPackages, search]);


    // --- HANDLERS ACTIONS ---

    const executeAction = async (action: () => Promise<any>, successMsg: string) => {
        const toastId = toast.loading("Traitement...");
        try {
            await action();
            toast.success(successMsg, { id: toastId });
            loadData(); // Rafraichir les listes pour bouger le colis dans l'onglet suivant
        } catch (e: any) {
            toast.error(e.message || "Erreur action", { id: toastId });
        } finally {
            setProcessingId(null);
        }
    };

    const handleAction = (pkg: RelayPackage) => {
        if (!relayPointId && activeTab === 'DELIVERY') {
             toast.error("Configuration Relais manquante pour la remise"); 
             return;
        }

        setProcessingId(pkg.id);

        switch (activeTab) {
            case 'DEPOSIT':
                // 1. Client dépose -> Receive
                executeAction(
                    () => relayPointService.receiveFromClient(pkg.id), 
                    `Dépôt confirmé ! Colis ${pkg.trackingNumber} en stock départ.`
                );
                break;
            
            case 'OUTBOUND':
                // 2. Prépa Envoi -> Ready Dispatch
                executeAction(
                    () => relayPointService.markReadyForDispatch(pkg.id), 
                    "Marqué prêt pour le livreur !"
                );
                break;
            
            case 'INBOUND':
                 // 3. Arrivée Livreur (déjà fait par lui) -> Traitement Interne -> Ready Pickup
                 executeAction(
                    () => relayPointService.markReadyForPickup(pkg.id),
                    "Le client va recevoir la notification de retrait !"
                 );
                 break;

            case 'DELIVERY':
                // 4. Remise Client Final
                const pickupCode = prompt("Code de retrait client (optionnel en dev):") || "FORCE_MANUAL";
                executeAction(
                    () => relayPointService.handoverToRecipient(relayPointId, pkg.id, pickupCode),
                    "Colis livré au client. Félicitations !"
                );
                break;

            case 'INCOMING':
                // Action Livreur : Nous (Relais Arrivée) on reçoit du livreur
                // Souvent c'est le livreur qui scanne "Livré au Relais", mais si le relais doit valider :
                executeAction(
                    () => relayPointService.receiveFromDeliverer(pkg.id),
                    "Réception du livreur validée. Colis en stock arrivée."
                );
                break;
        }
    };

    const getActionButton = (pkg: RelayPackage) => {
        if(processingId === pkg.id) return <Loader2 className="w-5 h-5 animate-spin text-orange-500"/>;

        const btnClass = "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95";

        switch (activeTab) {
            case 'DEPOSIT':
                return (
                    <button onClick={() => handleAction(pkg)} className={`${btnClass} bg-blue-600 hover:bg-blue-700 text-white`}>
                        <Inbox className="w-4 h-4"/> Valider Dépôt
                    </button>
                );
            case 'OUTBOUND':
                 // Status : AT_DEPARTURE_RELAY_POINT
                 return (
                    <button onClick={() => handleAction(pkg)} className={`${btnClass} bg-orange-600 hover:bg-orange-700 text-white`}>
                        <ArrowUpRight className="w-4 h-4"/> Prêt pour Livreur
                    </button>
                 );
            case 'INCOMING':
                // Status : IN_TRANSIT (Vers nous)
                // C'est théoriquement le livreur qui scanne, mais bouton de secours pour forcer réception
                return (
                    <button onClick={() => handleAction(pkg)} className={`${btnClass} bg-slate-200 hover:bg-slate-300 text-slate-700`}>
                        <Truck className="w-4 h-4"/> Forcer Réception
                    </button>
                );
            case 'INBOUND':
                // Status : AT_ARRIVAL_RELAY_POINT (reçu du livreur, à traiter)
                return (
                    <button onClick={() => handleAction(pkg)} className={`${btnClass} bg-purple-600 hover:bg-purple-700 text-white`}>
                        <CheckCircle className="w-4 h-4"/> Notifier Client
                    </button>
                );
            case 'DELIVERY':
                // Status : READY_FOR_PICKUP
                return (
                    <button onClick={() => handleAction(pkg)} className={`${btnClass} bg-green-600 hover:bg-green-700 text-white`}>
                        <User className="w-4 h-4"/> Remettre au Client
                    </button>
                );
            default: return null;
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <Toaster position="top-right"/>
            
            {/* SEARCH */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                    <input 
                       type="text" placeholder="Scanner ou chercher un tracking..." 
                       value={search} onChange={e => setSearch(e.target.value)}
                       className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>
                <button onClick={loadData} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin':''}`}/>
                </button>
            </div>

            {/* TABS DE NAVIGATION (FLOW) */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all border
                            ${activeTab === tab.id 
                               ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg' 
                               : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'}
                        `}
                    >
                        <tab.icon className="w-4 h-4"/> {tab.label}
                        {/* Petit badge compteur optionnel */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                           {/* Exemple simple de compteur : calcul dynamique couteux, ici simplifié */}
                           {tab.id === 'INCOMING' ? incomingPackages.length : '-'}
                        </span>
                    </button>
                ))}
            </div>

            {/* LISTING COLIS */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold text-slate-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">Colis / Tracking</th>
                                <th className="px-6 py-4">De / Vers</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Action Requise</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center opacity-40">
                                            <Package className="w-16 h-16 mb-4"/>
                                            <p className="text-lg font-bold">Aucun colis dans cette section.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map(pkg => (
                                    <tr key={pkg.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800 dark:text-white font-mono">{pkg.trackingNumber}</p>
                                            <p className="text-xs text-slate-500 truncate max-w-[150px]">{pkg.description || 'Colis Standard'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <div className="mb-1"><span className="text-slate-400">EXP:</span> <span className="font-semibold">{pkg.senderName}</span></div>
                                            <div><span className="text-slate-400">DEST:</span> <span className="font-semibold text-orange-600 dark:text-orange-400">{pkg.recipientName}</span></div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {new Date(pkg.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase border border-slate-200 dark:border-slate-600">
                                                {pkg.status?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end">
                                                {getActionButton(pkg)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Note Info */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 flex gap-3 text-sm text-blue-700 dark:text-blue-300">
                <Clock className="w-5 h-5 shrink-0"/>
                <p>
                    <strong>Cycle de Vie :</strong> Les colis avancent d'onglet en onglet automatiquement après chaque action. 
                    <ArrowRight className="inline w-3 h-3 mx-1"/> Déposé
                    <ArrowRight className="inline w-3 h-3 mx-1"/> Stock Départ (Prêt)
                    <ArrowRight className="inline w-3 h-3 mx-1"/> Transit
                    <ArrowRight className="inline w-3 h-3 mx-1"/> Stock Arrivée (Tri)
                    <ArrowRight className="inline w-3 h-3 mx-1"/> Remise Client.
                </p>
            </div>
        </div>
    );
}
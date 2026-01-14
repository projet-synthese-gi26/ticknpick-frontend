// FICHIER: src/app/dashboard/AgencyVehicles.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
    Truck, Plus, Settings, CheckCircle, Car, Bike, 
    Container, Trash2, Fuel, Gauge, AlertTriangle, Loader2, Search, Filter 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

import { agencyService, Agency } from '@/services/agencyService';

// --- TYPES ---
type VehicleType = 'Van' | 'Truck' | 'Moto' | 'Car';

interface Vehicle {
    id: string | number;
    name: string;
    type: VehicleType;
    plate: string;
    capacity: string;
    status: 'AVAILABLE' | 'MAINTENANCE' | 'BUSY';
    fuelType?: string;
    lastService?: string;
}

// Stats Calculées
interface FleetStats {
    total: number;
    available: number;
    capacityTotal: number;
}

// --- SOUS-COMPOSANTS UI (Style Agence) ---
const KpiCard = ({ title, value, icon: Icon, sub, color }: any) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-start justify-between hover:shadow-md transition-all group">
        <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1">{value}</h3>
            {sub && <p className="text-xs text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded w-fit">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6"/>
        </div>
    </div>
);

const VehicleIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'Moto': return <Bike className="w-6 h-6 text-orange-600"/>;
        case 'Truck': return <Container className="w-6 h-6 text-orange-600"/>;
        case 'Car': return <Car className="w-6 h-6 text-orange-600"/>;
        default: return <Truck className="w-6 h-6 text-orange-600"/>;
    }
};

// --- COMPOSANT PRINCIPAL ---
export default function AgencyVehicles({ profile }: { profile: any }) {
    // DATA STATES
    const [agency, setAgency] = useState<Agency | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    
    // UI STATES
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [search, setSearch] = useState('');
    
    // FORM STATE
    const [form, setForm] = useState({ 
        name: '', type: 'Van', plate: '', capacity: '', 
        status: 'AVAILABLE', fuelType: 'Diesel' 
    });

    // 1. CHARGEMENT
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            console.group("🚛 [LOGISTIQUE] Chargement Données Flotte");
            try {
                // 1. Récupérer l'agence pour avoir accès à ses métadonnées/documents où on stocke la flotte
                console.log(`📡 Fetching Agency for Owner ID: ${profile.id}`);
                const ag = await agencyService.getMyAgency(profile.id);
                
                if (ag) {
                    setAgency(ag);
                    
                    // Extraction des véhicules stockés (on utilise la logique ServiceCard ou un champ custom JSON 'vehicles')
                    // Note: Dans une architecture Microservices stricte, cela serait GET /api/vehicles?agencyId=...
                    // Ici nous simulons cette persistance dans l'objet Agency pour correspondre au backend actuel
                    let fleet: Vehicle[] = [];
                    
                    if (typeof ag.documents === 'string') {
                         try {
                             const docs = JSON.parse(ag.documents);
                             if (docs.logistics_fleet) fleet = docs.logistics_fleet;
                             else if (docs.serviceCard?.vehicules) fleet = docs.serviceCard.vehicules; // Fallback compatibilité
                         } catch (e) { console.warn("Erreur parsing documents JSON"); }
                    } else if ((ag.documents as any)?.logistics_fleet) {
                         fleet = (ag.documents as any).logistics_fleet;
                    }

                    console.log(`✅ ${fleet.length} véhicules trouvés en base.`);
                    console.log("Données Flotte :", fleet);
                    
                    setVehicles(fleet);
                }
            } catch (e) {
                console.error("❌ Erreur Chargement:", e);
                toast.error("Erreur sync logistique");
            } finally {
                setLoading(false);
                console.groupEnd();
            }
        };

        if (profile) loadData();
    }, [profile]);

    // 2. SAUVEGARDE (AJOUT / SUPPRESSION)
    const syncToBackend = async (newFleet: Vehicle[]) => {
        if (!agency) return;
        setIsSaving(true);

        console.group("🚀 [LOGISTIQUE] Synchronisation Backend");
        
        try {
            // On préserve les autres données documents/serviceCard
            const currentDocs = typeof agency.documents === 'string' 
                ? JSON.parse(agency.documents) 
                : (agency.documents || {});

            const updatedDocs = {
                ...currentDocs,
                logistics_fleet: newFleet, // Sauvegarde dédiée
                // On met à jour aussi la carte de service pour cohérence si nécessaire
                serviceCard: {
                    ...(currentDocs.serviceCard || {}),
                    vehicules: newFleet // Synchro double pour affichage public
                }
            };

            const payload = {
                // On ne renvoie que les documents (ou d'autres champs si l'API PUT le requiert)
                // Le backend Agency Update prend des DTO partiels normalement
                documents: JSON.stringify(updatedDocs) 
            };

            console.log(`📡 Sending PUT /api/agencies/management/${agency.id}`);
            console.log("📤 Payload Véhicules:", newFleet);

            await agencyService.updateAgency(agency.id, payload as any);

            // Mise à jour state local
            setVehicles(newFleet);
            // Mettre à jour l'objet agency local pour le prochain tour
            setAgency(prev => prev ? ({ ...prev, documents: JSON.stringify(updatedDocs) }) : null);

            console.log("✅ Synchro réussie (200 OK)");
            toast.success("Flotte mise à jour !");
            setIsFormOpen(false);
            setForm({ name: '', type: 'Van', plate: '', capacity: '', status: 'AVAILABLE', fuelType: 'Diesel' });

        } catch (e: any) {
            console.error("❌ Erreur Synchro:", e);
            toast.error("Echec sauvegarde: " + (e.message || "Erreur serveur"));
        } finally {
            setIsSaving(false);
            console.groupEnd();
        }
    };

    // HANDLERS
    const handleAdd = () => {
        if (!form.name || !form.plate) return toast.error("Nom et Immatriculation requis");
        
        const newVehicle: Vehicle = {
            id: Date.now(), // Temp ID
            name: form.name,
            type: form.type as VehicleType,
            plate: form.plate.toUpperCase(),
            capacity: form.capacity,
            status: 'AVAILABLE',
            fuelType: form.fuelType
        };
        
        const newFleet = [...vehicles, newVehicle];
        syncToBackend(newFleet);
    };

    const handleDelete = (id: string | number) => {
        if (!confirm("Retirer ce véhicule de la flotte ?")) return;
        const newFleet = vehicles.filter(v => v.id !== id);
        syncToBackend(newFleet);
    };

    // STATS
    const stats: FleetStats = {
        total: vehicles.length,
        available: vehicles.filter(v => v.status === 'AVAILABLE').length,
        capacityTotal: vehicles.length * 1 // Simplifié, à remplacer par somme capacities
    };

    // FILTRE
    const displayVehicles = vehicles.filter(v => 
        v.name.toLowerCase().includes(search.toLowerCase()) || 
        v.plate.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500"/>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <Toaster position="top-right"/>

            {/* HEADER HERO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <Truck className="w-8 h-8 text-orange-500"/> Ma Logistique
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
                        Optimisez la gestion de votre flotte et suivez vos moyens de transport.
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <button onClick={()=>setIsFormOpen(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition">
                        <Plus className="w-5 h-5"/> Nouveau Véhicule
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Flotte Totale" value={stats.total} icon={Truck} color="blue" sub="Véhicules enregistrés" />
                <KpiCard title="Disponibles" value={stats.available} icon={CheckCircle} color="emerald" sub="Prêts à partir" />
                <KpiCard title="État Flotte" value="100%" icon={Gauge} color="purple" sub="Opérationnel" />
            </div>

            {/* SEARCH & FILTERS */}
            <div className="flex flex-col sm:flex-row gap-4 p-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="relative flex-1">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                     <input 
                        placeholder="Rechercher par nom, plaque..." 
                        value={search} onChange={e=>setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-transparent outline-none text-sm text-slate-700 dark:text-white font-medium placeholder-slate-400"
                     />
                </div>
                <div className="flex items-center gap-2 px-3">
                     <Filter className="w-4 h-4 text-slate-400"/>
                     <span className="text-xs font-bold text-slate-500 uppercase">Filtres Actifs : 0</span>
                </div>
            </div>

            {/* MODALE AJOUT (Overlay Style) */}
            <AnimatePresence>
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-700">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-6 flex justify-between items-center text-white">
                             <div>
                                 <h3 className="font-black text-xl flex items-center gap-2"><Car className="w-6 h-6"/> Enregistrement</h3>
                                 <p className="text-white/80 text-xs mt-1">Ajouter un moyen de transport</p>
                             </div>
                             <button onClick={()=>setIsFormOpen(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition backdrop-blur"><Settings className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-8 space-y-5">
                             {/* Champs */}
                             <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-500">Type</label>
                                    <select className="input-modern" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
                                        <option value="Van">Fourgon / Van</option>
                                        <option value="Truck">Camion</option>
                                        <option value="Moto">Moto</option>
                                        <option value="Car">Voiture</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-500">Nom Interne</label>
                                    <input placeholder="ex: Van Nord #01" className="input-modern" value={form.name} onChange={e=>setForm({...form, name: e.target.value})}/>
                                </div>
                             </div>

                             <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500">Immatriculation</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-5 bg-blue-700 rounded-sm flex items-center justify-center text-[8px] text-white font-bold">CMR</div>
                                    <input placeholder="LT 000 XX" className="input-modern pl-14 font-mono uppercase" value={form.plate} onChange={e=>setForm({...form, plate: e.target.value})}/>
                                </div>
                             </div>

                             <div className="grid md:grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                     <label className="text-xs font-bold uppercase text-slate-500">Capacité (kg/m3)</label>
                                     <input placeholder="ex: 800kg" className="input-modern" value={form.capacity} onChange={e=>setForm({...form, capacity: e.target.value})}/>
                                 </div>
                                 <div className="space-y-1">
                                     <label className="text-xs font-bold uppercase text-slate-500">Carburant</label>
                                     <select className="input-modern" value={form.fuelType} onChange={e=>setForm({...form, fuelType: e.target.value})}>
                                         <option value="Diesel">Gasoil</option>
                                         <option value="Essence">Super</option>
                                         <option value="Electric">Électrique</option>
                                     </select>
                                 </div>
                             </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 flex justify-end gap-3 border-t dark:border-slate-800">
                             <button onClick={()=>setIsFormOpen(false)} disabled={isSaving} className="px-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-500 font-bold hover:bg-white dark:hover:bg-slate-700 transition">Annuler</button>
                             <button onClick={handleAdd} disabled={isSaving} className="px-8 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 font-bold shadow-lg transition flex items-center gap-2">
                                 {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                                 Enregistrer
                             </button>
                        </div>
                    </motion.div>
                </div>
            )}
            </AnimatePresence>

            {/* GRILLE VÉHICULES */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayVehicles.length === 0 ? (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-slate-900/50">
                        <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4"/>
                        <p className="text-slate-500 font-medium">Aucun véhicule ne correspond à vos critères.</p>
                        <button onClick={()=>setIsFormOpen(true)} className="text-orange-600 font-bold hover:underline mt-2">Ajouter le premier</button>
                    </div>
                ) : (
                    displayVehicles.map((v) => (
                        <div key={v.id} className="group relative bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-orange-200 dark:hover:border-orange-900 transition-all duration-300 overflow-hidden">
                             {/* Badge Type Top-Left */}
                             <div className="absolute top-0 left-0 px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-br-2xl border-b border-r border-slate-100 dark:border-slate-600 text-xs font-bold text-slate-500 uppercase tracking-wider z-10">
                                 {v.type}
                             </div>

                             {/* Options Top-Right */}
                             <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={()=>handleDelete(v.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition shadow-sm" title="Supprimer">
                                     <Trash2 className="w-4 h-4"/>
                                 </button>
                             </div>
                             
                             <div className="p-8 pb-4 text-center mt-4">
                                 <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                     <VehicleIcon type={v.type} />
                                 </div>
                                 
                                 <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1">{v.name}</h3>
                                 <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                                     <span className="w-2 h-2 rounded-full bg-blue-800"></span>
                                     <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300 tracking-wider uppercase">{v.plate}</span>
                                 </div>
                             </div>

                             <div className="px-6 py-4 mt-2">
                                 <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 py-2 border-b dark:border-slate-700">
                                     <span>Carburant</span>
                                     <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1"><Fuel className="w-3 h-3"/> {v.fuelType}</span>
                                 </div>
                                 <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 py-2">
                                     <span>Charge Max</span>
                                     <span className="font-bold text-slate-700 dark:text-slate-200">{v.capacity}</span>
                                 </div>
                             </div>

                             <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                 <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/30">
                                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                     Disponible
                                 </div>
                                 <span className="text-[10px] text-slate-400 font-medium">MAJ: Aujourd'hui</span>
                             </div>
                        </div>
                    ))
                )}
            </div>

            <style jsx global>{`
                .input-modern {
                    @apply w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition text-sm font-bold text-slate-800 dark:text-white placeholder:font-normal placeholder:text-slate-400;
                }
            `}</style>
        </div>
    );
}
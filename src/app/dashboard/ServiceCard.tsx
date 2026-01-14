"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase'; // Pour Supabase (Optionnel si tu migres tout en Spring)
import { agencyService, Agency } from '@/services/agencyService'; 
import { relayPointService } from '@/services/relayPointService';
import type { ProProfile } from './page';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Car, Package, Edit, Save, Loader2, MapPin, Eye, Sprout, PlusCircle, Trash2, X, Star, Ruler, Sparkles, Award, User, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

// Types locaux pour l'UI de la Carte Service
interface Vehicle { nom: string; marque: string; couleur: string; dimensions: { l: any; w: any; h: any; }; immatriculation?: string; }
interface Tarif { service: string; prix: string; }
interface StaffMember { id: string; name: string; role: string; avatar?: string; }

export default function ServiceCardPage({ profile }: { profile: any }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    
    // Données (initialisées par défaut)
    const [cardData, setCardData] = useState({
        tagline: "Logistique de confiance",
        description: "",
        services: ["Livraison Express", "Colis Fragile"],
        vehicules: [] as Vehicle[],
        tarifs: [] as Tarif[],
        promo: "",
        devise: 'XAF',
        rating: 4.8
    });

    // Données Entity
    const [agencyId, setAgencyId] = useState<string|null>(null);
    const [personnel, setPersonnel] = useState<StaffMember[]>([]);
    
    // Temp Inputs
    const [newVehicule, setNewVehicule] = useState<Vehicle>({ nom: '', marque: '', couleur: '#F97316', dimensions: {l:'',w:'',h:''} });
    const [newService, setNewService] = useState('');
    const [newTarif, setNewTarif] = useState<Tarif>({ service:'', prix:'' });

    // 1. Chargement Données Backend
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                // A. Agence
                if (profile.account_type === 'AGENCY') {
                    const ag = await agencyService.getMyAgency(profile.id);
                    if (ag) {
                        setAgencyId(ag.id);
                        
                        // Parse JSON stocké (ex: dans documents) ou use default
                        let parsedDetails = {};
                        if (typeof ag.documents === 'string') {
                            try { parsedDetails = JSON.parse(ag.documents).serviceCard || {}; } catch(e){}
                        } else if (ag.documents && ag.documents.serviceCard) {
                             parsedDetails = ag.documents.serviceCard;
                        }
                        
                        // Merge avec défauts
                        setCardData(prev => ({
                             ...prev,
                             description: (parsedDetails as any).description || `Agence située à ${ag.address_locality}`,
                             vehicules: (parsedDetails as any).vehicules || [],
                             tarifs: (parsedDetails as any).tarifs || [],
                             services: (parsedDetails as any).services || ["Standard"],
                             promo: (parsedDetails as any).promo || ""
                        }));
                        
                        // Personnel
                        const employees = await agencyService.getAgencyEmployees(ag.id);
                        setPersonnel(employees.map(e => ({
                             id: e.id,
                             name: e.name,
                             role: e.role[0] || 'Staff',
                             avatar: e.photo_url || undefined
                        })));
                    }
                } 
                // B. Freelance (Point Relais)
                else {
                    const points = await relayPointService.getAllRelayPoints();
                    const myPoint = points.find((p: any) => String(p.ownerId) === String(profile.id));
                    if (myPoint) {
                        setCardData(prev => ({
                             ...prev,
                             tagline: "Point Relais Certifié",
                             description: `Ouvert ${myPoint.openingHours}`,
                             // Récup data custom stockée (simulation)
                             promo: "1er dépôt gratuit" 
                        }));
                    }
                }

            } catch (e) {
                console.error(e);
                toast.error("Erreur chargement données");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [profile]);


    // 2. Sauvegarde Backend
    const handleSave = async () => {
        if (!agencyId && profile.account_type === 'AGENCY') return;
        setIsLoading(true);
        try {
            if (profile.account_type === 'AGENCY' && agencyId) {
                // On met à jour l'agence en injectant nos données JSON dans "documents" (astuce NoSQL-like)
                // Idéalement, demander une colonne 'metadata' ou 'service_card' au backend dev
                const ag = await agencyService.getMyAgency(profile.id);
                const currentDocs = typeof ag?.documents === 'string' ? JSON.parse(ag.documents) : (ag?.documents || {});
                
                const newDocs = {
                    ...currentDocs,
                    serviceCard: cardData // On store tout l'objet JSON
                };

                await agencyService.updateAgency(agencyId, {
                     // On renvoie les champs obligatoires inchangés s'il le faut
                     documents: JSON.stringify(newDocs) // Le backend attend probablement un string JSON
                } as any);

                toast.success("Carte de Service mise à jour !");
                setIsEditing(false);
            }
        } catch (e: any) {
            console.error(e);
            toast.error("Erreur sauvegarde : " + e.message);
        } finally {
            setIsLoading(false);
        }
    };


    // Handlers UI (Identiques à avant, simplifiés)
    const addItem = <T,>(list: T[], setList: any, item: T, reset: any) => { 
        if((item as any).service || (item as any).nom || item) {
             setList([...list, item]); reset(); 
        } 
    };
    const removeItem = (list: any[], setList: any, idx: number) => setList(list.filter((_,i)=>i!==idx));


    if (isLoading && !cardData.description) return <div className="p-20 text-center"><Loader2 className="animate-spin w-8 h-8 text-orange-500 mx-auto"/> Chargement de votre carte...</div>;

    return (
        <div className="space-y-6">
            
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div>
                     <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Truck className="text-orange-500 w-8 h-8"/> Carte de Services
                     </h2>
                     <p className="text-slate-500 text-sm">Configurez les véhicules et offres visibles par vos clients.</p>
                </div>
                
                <div className="flex gap-2">
                     <button onClick={()=>setShowPreview(!showPreview)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition">
                         <Eye className="w-5 h-5 text-gray-600"/>
                     </button>
                     {isEditing ? (
                         <button onClick={handleSave} disabled={isLoading} className="px-6 py-2 bg-green-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2">
                             {isLoading ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>} Sauvegarder
                         </button>
                     ) : (
                         <button onClick={()=>setIsEditing(true)} className="px-6 py-2 bg-slate-900 dark:bg-white dark:text-black text-white font-bold rounded-xl shadow flex items-center gap-2">
                             <Edit className="w-4 h-4"/> Modifier
                         </button>
                     )}
                </div>
            </div>

            {/* PREVIEW RAPIDE */}
            {showPreview && (
                <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="bg-gradient-to-r from-orange-500 to-amber-600 p-8 rounded-3xl shadow-2xl text-white">
                     <div className="flex items-center gap-4 mb-6">
                         <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm"><Star className="w-8 h-8 text-white"/></div>
                         <div>
                             <h1 className="text-3xl font-black">{profile.businessName || "Nom Agence"}</h1>
                             <p className="text-white/80">{cardData.description || "Description non définie."}</p>
                         </div>
                     </div>
                     <div className="grid md:grid-cols-3 gap-4">
                         {cardData.vehicules.map((v, i) => (
                             <div key={i} className="bg-white/10 p-4 rounded-xl backdrop-blur flex items-center gap-3">
                                 <Car className="w-6 h-6"/> <div><p className="font-bold">{v.nom}</p><p className="text-xs">{v.marque}</p></div>
                             </div>
                         ))}
                     </div>
                </motion.div>
            )}

            {/* EDITEUR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 
                 {/* COL 1: Véhicules & Offres */}
                 <div className="space-y-6">
                      
                      {/* VÉHICULES */}
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                           <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Car className="text-blue-500 w-5 h-5"/> Flotte Disponible</h3>
                           
                           {/* Liste */}
                           <div className="space-y-3 mb-4">
                                {cardData.vehicules.map((v,i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                                         <div><p className="font-bold">{v.nom}</p><p className="text-xs text-slate-500">{v.marque} - {v.immatriculation}</p></div>
                                         {isEditing && <button onClick={()=>removeItem(cardData.vehicules, (l:any)=>setCardData({...cardData, vehicules:l}), i)} className="text-red-500"><Trash2 className="w-4 h-4"/></button>}
                                    </div>
                                ))}
                           </div>

                           {/* Ajout */}
                           {isEditing && (
                               <div className="p-4 bg-blue-50 dark:bg-slate-900 rounded-xl space-y-3 border-dashed border-2 border-blue-200">
                                   <input placeholder="Nom (Van, Camion)" className="w-full p-2 text-sm border rounded" value={newVehicule.nom} onChange={e=>setNewVehicule({...newVehicule, nom:e.target.value})}/>
                                   <div className="grid grid-cols-2 gap-2">
                                       <input placeholder="Marque" className="p-2 text-sm border rounded" value={newVehicule.marque} onChange={e=>setNewVehicule({...newVehicule, marque:e.target.value})}/>
                                       <input placeholder="Plaque" className="p-2 text-sm border rounded" value={newVehicule.immatriculation} onChange={e=>setNewVehicule({...newVehicule, immatriculation:e.target.value})}/>
                                   </div>
                                   <button onClick={()=>addItem(cardData.vehicules, (l:any)=>setCardData({...cardData, vehicules:l}), newVehicule, ()=>setNewVehicule({nom:'',marque:'', couleur:'#fff',dimensions:{l:'',w:'',h:''}}))} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">Ajouter Véhicule</button>
                               </div>
                           )}
                      </div>

                      {/* PROMO */}
                      <div className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 p-6 rounded-2xl border border-orange-200">
                          <h3 className="font-bold text-orange-800 dark:text-orange-200 flex gap-2 mb-3"><Sparkles className="w-5 h-5"/> Promo Actuelle</h3>
                          <textarea 
                              disabled={!isEditing}
                              className="w-full p-3 bg-white/50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 text-orange-900"
                              value={cardData.promo}
                              onChange={e => setCardData({...cardData, promo: e.target.value})}
                              placeholder="Message promotionnel..."
                          />
                      </div>
                 </div>

                 {/* COL 2: Services & Tarifs */}
                 <div className="space-y-6">
                      
                      {/* SERVICES */}
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                           <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Sprout className="text-green-500 w-5 h-5"/> Services</h3>
                           <div className="flex flex-wrap gap-2 mb-4">
                                {cardData.services.map((s, i) => (
                                    <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                                        {s} {isEditing && <X onClick={()=>removeItem(cardData.services, (l:any)=>setCardData({...cardData, services:l}), i)} className="w-3 h-3 cursor-pointer hover:text-red-600"/>}
                                    </span>
                                ))}
                           </div>
                           {isEditing && (
                               <div className="flex gap-2">
                                   <input value={newService} onChange={e=>setNewService(e.target.value)} placeholder="Nouveau service..." className="flex-1 p-2 text-sm border rounded-lg"/>
                                   <button onClick={()=>addItem(cardData.services, (l:any)=>setCardData({...cardData, services:l}), newService, ()=>setNewService(''))} className="p-2 bg-green-600 text-white rounded-lg"><PlusCircle className="w-5 h-5"/></button>
                               </div>
                           )}
                      </div>

                      {/* PERSONNEL (Lecture Seule, car géré dans l'onglet Personnel) */}
                      {personnel.length > 0 && (
                          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><User className="text-purple-500 w-5 h-5"/> Équipe Affichée</h3>
                              <div className="grid grid-cols-3 gap-3">
                                   {personnel.map(p => (
                                       <div key={p.id} className="text-center p-2 bg-gray-50 dark:bg-slate-900 rounded-lg">
                                           <div className="w-10 h-10 mx-auto rounded-full bg-slate-300 overflow-hidden mb-1">
                                               {p.avatar && <img src={p.avatar} className="w-full h-full object-cover"/>}
                                           </div>
                                           <p className="text-xs font-bold truncate">{p.name.split(' ')[0]}</p>
                                           <p className="text-[10px] text-gray-500">{p.role}</p>
                                       </div>
                                   ))}
                              </div>
                          </div>
                      )}
                 </div>
            </div>
        </div>
    );
}
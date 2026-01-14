'use client';
import React, { useState, useEffect } from 'react';
import { 
  Truck, Search, RefreshCw, Archive, Zap, History 
} from 'lucide-react';
import { delivererService, DelivererPackage } from '@/services/delivererService';
import FeedbackAlert, { AlertType } from '@/components/ui/FeedbackAlert';

// Sous-Composants
import FindDelivery from './FindDelivery';
import PackageSidebar from './PackageSidebar';
import { motion } from 'framer-motion';

// Vue: Tableau des courses
const MyDeliveriesList = ({ list, onDetails }: { list: DelivererPackage[], onDetails: (p: DelivererPackage) => void }) => {
    // Trier : Assigne, Transit, Terminé
    const sorted = [...list].sort((a,b) => {
        const order = { 'ASSIGNED_TO_DELIVERER': 1, 'IN_TRANSIT': 2, 'DELIVERED': 3 };
        return (order[a.currentStatus as keyof typeof order] || 9) - (order[b.currentStatus as keyof typeof order] || 9);
    });

    if(sorted.length === 0) return (
        <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
            <Archive className="w-16 h-16 mb-4 opacity-50"/>
            <p>Vous n'avez aucune course active.</p>
            <p className="text-sm mt-1">Utilisez "Trouver une Course" pour commencer.</p>
        </div>
    );

    return (
        <div className="grid gap-4">
             {sorted.map(pkg => (
                 <div key={pkg.id} onClick={() => onDetails(pkg)} className="group bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 transition-all cursor-pointer relative overflow-hidden">
                      {/* Statut Line */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 
                          ${pkg.currentStatus === 'ASSIGNED_TO_DELIVERER' ? 'bg-orange-500' : 
                            pkg.currentStatus === 'IN_TRANSIT' ? 'bg-blue-500' : 'bg-green-500'}`} 
                      />

                      <div className="pl-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                              <div className="flex gap-2 items-center mb-1">
                                  <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-bold uppercase text-slate-500 tracking-wider">
                                      {pkg.currentStatus.replace(/_/g, ' ')}
                                  </span>
                                  <span className="font-mono font-black text-sm text-slate-800 dark:text-white">{pkg.trackingNumber}</span>
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                  <span className="font-semibold">{pkg.pickupAddress}</span> 
                                  <span className="text-xs">➔</span> 
                                  <span className="font-semibold">{pkg.deliveryAddress}</span>
                              </div>
                          </div>

                          <div className="text-right">
                              <span className="block font-black text-lg text-violet-600 dark:text-violet-400">{pkg.deliveryFee.toLocaleString()} F</span>
                              {pkg.currentStatus !== 'DELIVERED' && (
                                  <span className="text-xs text-violet-500 font-bold bg-violet-50 dark:bg-violet-900/30 px-2 py-1 rounded">ACTION REQUISE</span>
                              )}
                          </div>
                      </div>
                 </div>
             ))}
        </div>
    );
};


export default function DeliveriesPage() {
    const [view, setView] = useState<'LIST' | 'FIND'>('LIST');
    const [packages, setPackages] = useState<DelivererPackage[]>([]);
    
    // UI Logic
    const [selectedPkg, setSelectedPkg] = useState<DelivererPackage|null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [feedback, setFeedback] = useState<{show:boolean, type:AlertType, msg:string}>({ show:false, type:'info', msg:'' });
    const [loadingData, setLoadingData] = useState(false);

    // Initial Load
    useEffect(() => { reloadData(); }, []);

    const reloadData = async () => {
        setLoadingData(true);
        const res = await delivererService.getMyDeliveries();
        setPackages(res);
        setLoadingData(false);
    };

    // ACTION : ASSIGN (Depuis la Carte)
    const handleAssign = async (pkg: DelivererPackage) => {
        setActionLoading(true);
        try {
            await delivererService.assignPackage(pkg.id);
            setFeedback({ show: true, type: 'success', msg: "Course acceptée avec succès !" });
            setView('LIST'); // Retour liste
            setSelectedPkg(null);
            reloadData();
        } catch (e) {
            setFeedback({ show: true, type: 'error', msg: "Erreur lors de l'acceptation" });
        } finally {
            setActionLoading(false);
        }
    };

    // ACTION : PICKUP (Liste)
    const handlePickup = async () => {
        if(!selectedPkg) return;
        setActionLoading(true);
        try {
            await delivererService.pickupPackage(selectedPkg.id);
            setFeedback({ show: true, type: 'success', msg: "Colis marqué comme récupéré." });
            setSelectedPkg(null);
            reloadData();
        } catch (e) {
            setFeedback({ show: true, type: 'error', msg: "Erreur serveur Pickup" });
        } finally {
            setActionLoading(false);
        }
    };

    // ACTION : DELIVER (Liste)
    // Ici version simplifiée sans code pour la démo, ou ajouter modal code si besoin
    const handleDeliver = async () => {
        if(!selectedPkg) return;
        // On demande un code manuel rapide pour la sécurité (simulation)
        const code = prompt("Code de confirmation du client (Optionnel simulation) :");
        
        setActionLoading(true);
        try {
            await delivererService.deliverPackage(selectedPkg.id, code || "AUTO");
            setFeedback({ show: true, type: 'success', msg: "Bravo ! Livraison terminée." });
            setSelectedPkg(null);
            reloadData();
        } catch (e) {
            setFeedback({ show: true, type: 'error', msg: "Erreur validation livraison" });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="relative h-full font-sans bg-transparent min-h-screen">
             
             {/* ALERT SYSTEM */}
             <FeedbackAlert 
                 type={feedback.type} 
                 message={feedback.msg} 
                 isVisible={feedback.show} 
                 onClose={() => setFeedback(p => ({...p, show:false}))} 
             />

             {/* --- CONTENU --- */}
             {view === 'FIND' ? (
                 <div className="fixed inset-0 z-50 bg-white">
                      {/* VUE CARTE RECHERCHE (Full Screen) */}
                      <FindDelivery 
                          onClose={() => setView('LIST')} 
                                                // IL FAUT QUE CETTE PROP EXISTE
                          onSelectPackage={(pkg) => {
                              // On déclenche l'assignation ici (dans le parent)
                              handleAssign(pkg);
                              // Pour l'UX, vous pouvez soit fermer direct, soit laisser handleAssign gérer
                          }} 
                      />
                 </div>
             ) : (
                 <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
                      
                      {/* Header Dashboard */}
                      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                           <div>
                               <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                   <Truck className="w-8 h-8 text-violet-600"/> Gestion des Courses
                               </h1>
                               <p className="text-slate-500 font-medium">Gérez vos livraisons actives ou trouvez-en de nouvelles.</p>
                           </div>

                           <div className="flex gap-3 w-full md:w-auto">
                                <button onClick={reloadData} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition">
                                    <RefreshCw className={`w-5 h-5 ${loadingData?'animate-spin':''}`}/>
                                </button>
                                <button 
                                   onClick={() => setView('FIND')}
                                   className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/20 transition-transform active:scale-95"
                                >
                                    <Zap className="w-5 h-5 fill-white"/> Trouver une course
                                </button>
                           </div>
                      </div>

                      {/* STATS RAPIDES */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                               <p className="text-xs font-bold text-blue-600 uppercase">En Attente</p>
                               <p className="text-2xl font-black text-slate-800 dark:text-white">{packages.filter(p=>p.currentStatus==='ASSIGNED_TO_DELIVERER').length}</p>
                           </div>
                           <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-800">
                               <p className="text-xs font-bold text-orange-600 uppercase">En Transit</p>
                               <p className="text-2xl font-black text-slate-800 dark:text-white">{packages.filter(p=>p.currentStatus==='IN_TRANSIT').length}</p>
                           </div>
                           <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800">
                               <p className="text-xs font-bold text-green-600 uppercase">Terminées</p>
                               <p className="text-2xl font-black text-slate-800 dark:text-white">{packages.filter(p=>p.currentStatus==='DELIVERED').length}</p>
                           </div>
                           <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center justify-center text-slate-400 font-bold gap-2 cursor-pointer hover:bg-gray-100">
                               <History className="w-5 h-5"/> Historique
                           </div>
                      </div>

                      {/* TABLEAU / LISTE */}
                      <div>
                          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4 ml-1">Liste des tâches ({packages.length})</h3>
                          <MyDeliveriesList list={packages} onDetails={(p) => setSelectedPkg(p)}/>
                      </div>
                 </div>
             )}

             {/* SIDEBAR DETAILS (Shared between Find & List views) */}
             <PackageSidebar 
                 isOpen={!!selectedPkg} 
                 pkg={selectedPkg!} 
                 onClose={() => setSelectedPkg(null)}
                 // Actions : on map le bon handler selon le contexte ou on peut laisser le sidebar gérer si la logique est interne (comme j'ai fait avant). 
                 // Ici je les passe en props pour la flexibilité (ex: mode FIND = assigner, mode LIST = pickup/deliver)
                 showAction={selectedPkg?.currentStatus !== 'DELIVERED'}
                 actionLoading={actionLoading}
                 // Logic Route switch
                 onAssign={() => handleAssign(selectedPkg!)}
                 onPickup={handlePickup}
                 onDeliver={handleDeliver}
             />
        </div>
    );
}
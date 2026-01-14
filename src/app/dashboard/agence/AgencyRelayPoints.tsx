'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Plus, MapPin, Search, Building, Clock, Check, 
  User, BarChart3, Globe, Locate, Loader2, List, Map as MapIcon, X,
  Layers, TrendingUp, Package, Zap, Eye
} from 'lucide-react';
import { relayPointService, RelayPoint } from '@/services/relayPointService';
import { agencyService, DetailedEmployee } from '@/services/agencyService';
import toast from 'react-hot-toast';

// --- CONFIGURATION LEAFLET (Dynamique pour Next.js) ---
import 'leaflet/dist/leaflet.css';
import { AnimatePresence, motion } from 'framer-motion';
import { InputField } from '@/components/registration/SharedUI';
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// --- TYPES ET INTERFACES ---
interface NewPointForm {
    relayPointName: string;
    address: string;
    locality: string;
    openingHours: string;
    maxCapacity: string;
    storage_capacity: string;
    latitude: string;
    longitude: string;
    managerId: string; // ID de l'employé gérant
}

// COMPOSANT KPI CARD MODERNE
const ModernKpiCard = ({ title, value, subtitle, icon: Icon, gradient, trend }: any) => (
  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-white/20 backdrop-blur-sm`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-sm font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <h3 className="text-4xl font-black mb-1">{value}</h3>
      <p className="text-sm font-medium opacity-90">{title}</p>
      {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
    </div>
  </div>
);

// COMPOSANT CARTE POINT RELAIS MODERNISÉE
const RelayPointCard = ({ point, onManage, managerName }: { point: any, onManage: (id: string) => void, managerName?: string }) => {
  const fillPercentage = (point.current_package_count / point.maxCapacity) * 100;
  const isHighLoad = fillPercentage > 80;
  const isMediumLoad = fillPercentage > 50 && fillPercentage <= 80;

  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-500 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden">
      {/* Badge de statut flottant */}
      <div className="absolute top-24 right-4 z-10">
        {point.is_active ? (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Opérationnel
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            En pause
          </span>
        )}
      </div>

      {/* En-tête avec icône */}
      <div className="relative p-6 pb-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0">
            {point.relayPointName ? point.relayPointName.substring(0, 2).toUpperCase() : 'RP'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-xl text-slate-800 dark:text-white truncate mb-1" title={point.relayPointName}>
              {point.relayPointName}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {point.relay_point_locality || point.locality || 'Non défini'}
            </p>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6 space-y-4">
        {/* Barre de capacité */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Capacité</span>
            <span className="text-sm font-black text-slate-800 dark:text-white">
              {point.current_package_count || 0}/{point.maxCapacity}
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                isHighLoad ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                isMediumLoad ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
                'bg-gradient-to-r from-emerald-500 to-green-600'
              }`}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="space-y-2.5">
          {/* Gérant (AJOUT ICI) */}
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex flex-col">
                 <span className="text-[10px] font-bold uppercase text-slate-400">Gérant Responsable</span>
                 <span className="font-bold text-slate-800 dark:text-white truncate max-w-[150px]">
                    {managerName || "Non assigné"}
                 </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 pl-2">
            <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <span>{point.openingHours || point.opening_hours}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 pl-2">
            <div className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="font-medium text-xs">
              {point.storage_capacity === 'LARGE' ? 'Grand Entrepôt' :
               point.storage_capacity === 'MEDIUM' ? 'Capacité Moyenne' : 'Petit Stockage'}
            </span>
          </div>
        </div>

        {/* Footer Actions Modifié : Un seul bouton pleine largeur */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
          <button 
            onClick={() => onManage(point.id)}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            <Eye className="w-4 h-4" />
            Gérer l'inventaire
          </button>
        </div>
      </div>
    </div>
  );
};
export default function AgencyRelayPoints({ 
  profile, 
  onNavigateToInventory // Prop pour naviguer vers l'inventaire (reçue du parent Dashboard)
}: { 
  profile: any;
  onNavigateToInventory: (relayId: string) => void;
}) {
    // États Données
    const [agencyId, setAgencyId] = useState<string | null>(null);
    const [points, setPoints] = useState<RelayPoint[]>([]);
    const [employees, setEmployees] = useState<DetailedEmployee[]>([]);
    
    // UI STATES
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');
    const [isLocating, setIsLocating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // FORM STATE
    const [newPoint, setNewPoint] = useState<NewPointForm>({
        relayPointName: '', 
        address: '', 
        locality: '', 
        openingHours: '08:00-18:00', 
        maxCapacity: '100',
        storage_capacity: 'MEDIUM',
        latitude: '',
        longitude: '',
        managerId: ''
    });

     // 1. CHARGEMENT EN CASCADE : USER -> AGENCY -> RELAY POINTS
    useEffect(() => {
        const loadData = async () => {
            console.group('🚀 [AGENCY PAGE] Init');
            setLoading(true);

            try {
                // A. Récupérer l'agence via ownerId
                console.log(`1. Recherche agence pour Owner: ${profile.id}`);
                const ag = await agencyService.getAgencyByOwnerId(profile.id);

                if (!ag || !ag.id) {
                    console.error("❌ Aucune agence trouvée pour ce propriétaire");
                    toast.error("Agence non configurée");
                    setLoading(false);
                    console.groupEnd();
                    return;
                }

                console.log(`✅ Agence trouvée: ${ag.commercial_name || 'Sans Nom'} (${ag.id})`);
                setAgencyId(ag.id);

                // B. Récupérer les points relais via AgencyId
                console.log(`2. GET /api/agencies/${ag.id}/relay-points`);
                const agencyPoints = await agencyService.getAgencyRelayPoints(ag.id);
                
                // Mapper et s'assurer que c'est un tableau valide
                const cleanPoints = Array.isArray(agencyPoints) ? agencyPoints : [];
                console.log(`✅ ${cleanPoints.length} Points chargés`);
                
                setPoints(cleanPoints);

            } catch (e: any) {
                console.error("❌ Erreur Chargement:", e);
                toast.error("Erreur de chargement des points relais");
            } finally {
                setLoading(false);
                console.groupEnd();
            }
        };

        // Correctif icônes Leaflet (Client side only)
        if (typeof window !== 'undefined') {
            (async () => {
                 const L = (await import('leaflet')).default;
                 // @ts-ignore
                 delete L.Icon.Default.prototype._getIconUrl;
                 L.Icon.Default.mergeOptions({
                     iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                     iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                     shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                 });
            })();
        }

        loadData();
    }, [profile]);

    // Stats calculées
    const totalCapacity = points.reduce((acc, p) => acc + p.maxCapacity, 0);
    const totalPackages = points.reduce((acc, p) => acc + (p.current_package_count || 0), 0);
    const activePoints = points.filter(p => p.is_active).length;
    // Si la capacité totale est 0, on met l'occupation à 0 pour éviter la division par zéro.
    const avgOccupancy = totalCapacity > 0 ? ((totalPackages / totalCapacity) * 100).toFixed(1) : "0";

    // 2. GÉOLOCALISATION NAVIGATEUR
    const handleLocateMe = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setNewPoint(prev => ({
                        ...prev,
                        latitude: pos.coords.latitude.toString(),
                        longitude: pos.coords.longitude.toString()
                    }));
                    toast.success("Position capturée !");
                    setIsLocating(false);
                },
                (err) => {
                    console.error(err);
                    toast.error("Géolocalisation refusée ou impossible");
                    setIsLocating(false);
                }
            );
        } else {
            toast.error("Navigateur incompatible GPS");
            setIsLocating(false);
        }
    };

    const filteredPoints = points.filter(p => 
        (p.relayPointName && p.relayPointName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.locality && p.locality.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.relay_point_locality && p.relay_point_locality.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // 3. ACTION CREATE
    const handleCreate = async () => {
        if(!agencyId) {
            toast.error("Impossible de créer: Agence ID manquant.");
            return;
        }
        if(!newPoint.relayPointName || !newPoint.address) return toast.error("Nom et Adresse requis");

        const tId = toast.loading("Création du Point Relais...");

        try {
            // Mapping UI Form -> Backend Payload Struct
            // Attention: 'address' devient 'relay_point_address', etc.
            const payload: any = {
                relayPointName: newPoint.relayPointName,
                relay_point_address: newPoint.address,  // MAP CORRECT
                relay_point_locality: newPoint.locality, // MAP CORRECT
                
                opening_hours: newPoint.openingHours,   // MAP CORRECT
                storage_capacity: newPoint.storage_capacity,
                
                max_capacity: parseInt(newPoint.maxCapacity), // Int backend
                current_package_count: 0,
                
                latitude: parseFloat(newPoint.latitude) || 0,
                longitude: parseFloat(newPoint.longitude) || 0,
                
                is_active: true,
                day_schedules: JSON.stringify({ default: newPoint.openingHours })
                // createdAt / updatedAt sont gérés par le backend
            };

            // APPEL AVEC AGENCY ID
            console.log(`📤 Envoi Création pour Agency ${agencyId}`, payload);
            await relayPointService.createRelayPointForAgency(agencyId, payload);
            
            toast.success("Point Relais ajouté !", { id: tId });
            setShowForm(false);
            
            // Reload simple
            const updatedList = await agencyService.getAgencyRelayPoints(agencyId);
            setPoints(updatedList);
            
            // Reset
            setNewPoint({ 
                relayPointName: '', address: '', locality: '', 
                openingHours: '08:00-18:00', maxCapacity: '100', 
                storage_capacity: 'MEDIUM', latitude: '', longitude: '', managerId: '' 
            });

        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "Erreur lors de la création", { id: tId });
        }
    };


    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
        </div>
    );

    return (
        <div className="min-h-screen bg-transparent pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                
                {/* En-tête Hero */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 rounded-3xl p-8 md:p-12 shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl">
                                        <MapPin className="w-8 h-8 text-orange-400" />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                                            Mon réseau de point relais
                                        </h1>
                                        <p className="text-slate-300 mt-2 text-lg">
                                            Gérez et optimisez vos points relais en temps réel
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {/* Toggle Vue */}
                                <div className="bg-white/10 backdrop-blur-sm p-1.5 gap-8 rounded-2xl flex border border-white/20">
                                    <button 
                                        onClick={() => setViewMode('LIST')}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                                            viewMode === 'LIST' 
                                                ? 'bg-white text-slate-900 shadow-lg' 
                                                : 'text-white/70 hover:text-white'
                                        }`}
                                    >
                                        <List className="w-4 h-4" /> Liste
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('MAP')}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                                            viewMode === 'MAP' 
                                                ? 'bg-white text-slate-900 shadow-lg' 
                                                : 'text-white/70 hover:text-white'
                                        }`}
                                    >
                                        <MapIcon className="w-4 h-4" /> Carte
                                    </button>
                                </div>

                                <button 
                                    onClick={() => setShowForm(true)}
                                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-2.5 rounded-2xl flex items-center gap-2 font-bold shadow-xl hover:shadow-2xl transition-all active:scale-95"
                                >
                                    <Plus className="w-5 h-5" /> Ajouter un point relais
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPIs Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ModernKpiCard 
                        title="Points Actifs"
                        value={activePoints}
                        subtitle={`sur ${points.length} total`}
                        icon={Building}
                        gradient="from-gray-800 to-orange-800"
                        trend="+2 ce mois"
                    />
                    <ModernKpiCard 
                        title="Capacité Totale"
                        value={totalCapacity}
                        subtitle="colis maximum"
                        icon={Package}
                        gradient="from-gray-800 to-gray-500"
                        trend="Optimale"
                    />
                    <ModernKpiCard 
                        title="Taux d'Occupation"
                        value={`${avgOccupancy}%`}
                        subtitle={`${totalPackages} colis actuels`}
                        icon={BarChart3}
                        gradient="from-gray-800 to-gray-500"
                        trend={parseFloat(avgOccupancy) > 75 ? 'Élevé' : 'Normal'}
                    />
                    <ModernKpiCard 
                        title="Zones Couvertes"
                        value={[...new Set(points.map(p => p.relay_point_locality || p.locality || 'Unknown'))].length}
                        subtitle="quartiers desservis"
                        icon={Globe}
                        gradient="from-gray-800 to-gray-500"
                        trend="Expansion"
                    />
                </div>

                {/* Barre de recherche (Seulement en mode liste) */}
                {viewMode === 'LIST' && (
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Rechercher un point relais par nom ou localité..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition text-sm font-medium shadow-sm"
                        />
                    </div>
                )}

                                {/* MODAL CRÉATION */}
                <AnimatePresence>
                    {showForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                                
                                {/* Header Modal */}
                                <div className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white flex justify-between items-center">
                                    <div><h3 className="font-black text-2xl flex gap-2 items-center"><Zap className="fill-white"/> Nouveau Point Relais</h3><p className="text-white/80 text-xs">Configurez un nouvel emplacement logistique pour votre agence.</p></div>
                                    <button onClick={()=>setShowForm(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/30"><X className="w-6 h-6"/></button>
                                </div>
                                
                                {/* Formulaire */}
                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                         
                                         {/* Info Gauche */}
                                         <div className="space-y-6">
                                              <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg text-xs text-blue-600 dark:text-blue-300 font-bold border border-blue-100">
                                                  Note: Le point sera automatiquement lié à l'agence : {agencyId?.split('-')[0]}...
                                              </div>
                                              <InputField label="Nom Commercial du Point" icon={Building} placeholder="Ex: Relais Akwa Central" value={newPoint.relayPointName} onChange={(e: any) => setNewPoint({...newPoint, relayPointName: e.target.value})} />
                                              <InputField label="Adresse Physique" icon={MapPin} placeholder="Rue de la liberté" value={newPoint.address} onChange={(e: any) => setNewPoint({...newPoint, address: e.target.value})} />
                                              <div className="grid grid-cols-2 gap-4">
                                                   <InputField label="Quartier / Ville" placeholder="Douala" value={newPoint.locality} onChange={(e: any) => setNewPoint({...newPoint, locality: e.target.value})} />
                                                   <InputField label="Horaires" icon={Clock} value={newPoint.openingHours} onChange={(e: any) => setNewPoint({...newPoint, openingHours: e.target.value})} />
                                              </div>
                                         </div>

                                         {/* Info Droite (Technique) */}
                                         <div className="space-y-6">
                                              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                                   <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><MapIcon className="w-4 h-4"/> Géolocalisation</h4>
                                                   <button onClick={handleLocateMe} disabled={isLocating} className="w-full mb-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-xs font-bold rounded-lg hover:bg-blue-200 transition flex items-center justify-center gap-2">
                                                       {isLocating ? <Loader2 className="animate-spin w-3 h-3"/> : <Locate className="w-3 h-3"/>} Position Actuelle
                                                   </button>
                                                   <div className="grid grid-cols-2 gap-2">
                                                       <input type="number" placeholder="Lat" className="p-2 text-xs border rounded bg-white dark:bg-slate-900" value={newPoint.latitude} onChange={e=>setNewPoint({...newPoint, latitude: e.target.value})}/>
                                                       <input type="number" placeholder="Lng" className="p-2 text-xs border rounded bg-white dark:bg-slate-900" value={newPoint.longitude} onChange={e=>setNewPoint({...newPoint, longitude: e.target.value})}/>
                                                   </div>
                                              </div>

                                              <div className="p-5 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-200 dark:border-orange-800">
                                                   <h4 className="font-bold text-sm mb-3 text-orange-800 dark:text-orange-200">Capacité de Stockage</h4>
                                                   <div className="space-y-3">
                                                       <div className="flex gap-2">
                                                            {['SMALL','MEDIUM','LARGE'].map(sz => (
                                                                <button key={sz} onClick={()=>setNewPoint({...newPoint, storage_capacity: sz})} className={`flex-1 py-1 text-[10px] font-bold rounded border ${newPoint.storage_capacity === sz ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200'}`}>
                                                                    {sz}
                                                                </button>
                                                            ))}
                                                       </div>
                                                       <div>
                                                           <label className="text-[10px] font-bold text-gray-400 uppercase">Capacité Numérique</label>
                                                           <input type="number" className="w-full p-2 mt-1 border rounded text-sm bg-white dark:bg-slate-900 font-bold" value={newPoint.maxCapacity} onChange={e=>setNewPoint({...newPoint, maxCapacity: e.target.value})}/>
                                                       </div>
                                                   </div>
                                              </div>
                                         </div>
                                    </div>
                                </div>
                                
                                <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t dark:border-slate-800 flex justify-end gap-3">
                                    <button onClick={()=>setShowForm(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-white border transition">Annuler</button>
                                    <button onClick={handleCreate} className="px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2"><Check className="w-5 h-5"/> Créer le Point Relais</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Contenu principal : LIST ou MAP */}
                {viewMode === 'LIST' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPoints.length === 0 ? (
                            <div className="col-span-full py-20 text-center">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-12">
                                    <MapPin className="w-20 h-20 mx-auto mb-6 text-slate-300 dark:text-slate-600" />
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                        Aucun point relais trouvé
                                    </h3>
                                    <p className="text-slate-500 mb-6">
                                        Utilisez le bouton ci-dessus pour ajouter un nouveau hub ou vérifiez votre recherche.
                                    </p>
                                    <button 
                                        onClick={() => setShowForm(true)}
                                        className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
                                    >
                                        Créer maintenant
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // ====== MODIFICATION ICI POUR L'AFFICHAGE DU MANAGER AVEC LOGS ======
                            filteredPoints.map(point => {
                                console.log(`🔍 Vérification Manager pour le point: ${point.relayPointName} (ID: ${point.id})`);
                                
                                // Recherche du manager associé dans la liste des employés de l'agence
                                // La logique suppose que employee.assigned_relay_point_id CORRESPOND à point.id
                                // et que son rôle est bien RELAY_MANAGER (ou GERANT selon votre config backend)
                                const manager = employees.find(e => {
                                    // Utilisation de String() pour s'assurer que la comparaison (UUID vs string) passe toujours
                                    const idMatch = String(e.assigned_relay_point_id) === String(point.id);
                                    // Extraction sûre du rôle (car parfois tableau ['ROLE'])
                                    const roleStr = Array.isArray(e.role) ? String(e.role[0]) : String(e.role);
                                    const roleMatch = roleStr.includes('RELAY_MANAGER') || roleStr.includes('GERANT');
                                    
                                    // LOG pour debugger
                                    // if(idMatch) console.log(`   --> Potentiel match trouvé : ${e.name} (${roleStr})`);

                                    return idMatch && roleMatch;
                                });

                                if (manager) {
                                    console.log(`   ✅ Manager Trouvé : ${manager.name}`);
                                } else {
                                    console.log(`   ❌ Aucun manager RELAY_MANAGER assigné à cet ID.`);
                                }

                                return (
                                    <RelayPointCard 
                                        key={point.id} 
                                        point={point}
                                        managerName={manager?.name} 
                                        onManage={(id) => onNavigateToInventory && onNavigateToInventory(id)} 
                                    />
                                );
                            })
                            // ==========================================
                        )}
                    </div>
                ) : (
                    // VUE CARTE (MAP)
                    <div className="h-[700px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-700 bg-slate-200 relative">
                        <MapContainer 
                            center={[3.8480, 11.5021]}
                            zoom={12}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            {points.map(pt => (
                                <Marker key={pt.id} position={[pt.latitude || 3.848, pt.longitude || 11.502]}>
                                    <Popup className="custom-popup">
                                        <div className="p-2 min-w-[200px]">
                                            <h4 className="font-bold text-slate-800 mb-2">{pt.relayPointName}</h4>
                                            <div className="space-y-1 text-xs text-slate-600">
                                                <p className="flex items-center gap-2">
                                                    <MapPin className="w-3 h-3" />
                                                    {pt.relay_point_locality || pt.locality || 'Loc. inconnue'}
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3" />
                                                    {pt.openingHours || 'Non spécifié'}
                                                </p>
                                                <p className="font-semibold mt-2 text-orange-600">
                                                    Occupation: {pt.current_package_count}/{pt.maxCapacity}
                                                </p>
                                            </div>
                                            <div className="mt-3 pt-2 border-t flex justify-between items-center">
                                                {pt.is_active ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Actif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                                                        Inactif
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>

                        {/* Titre Flottant sur Carte */}
                        <div className="absolute top-6 left-6 right-6 z-[400] pointer-events-none">
                            <div className="bg-white/95 backdrop-blur-xl dark:bg-slate-900/95 rounded-2xl shadow-2xl border-2 border-white/50 dark:border-slate-700/50 p-4 pointer-events-auto flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Vue Cartographique</p>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                        Mon Réseau ({points.length})
                                    </h3>
                                </div>
                                <div className="flex gap-2">
                                    <div className="text-center px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-700">
                                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{activePoints}</div>
                                        <div className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Actifs</div>
                                    </div>
                                    <div className="text-center px-4 py-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-xl border border-orange-200 dark:border-orange-700">
                                        <div className="text-xl font-black text-orange-600 dark:text-orange-400">{avgOccupancy}%</div>
                                        <div className="text-[9px] font-bold text-orange-700 dark:text-orange-300 uppercase">Load</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .input-modern {
                    @apply w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 
                           bg-white dark:bg-slate-900 
                           focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 
                           outline-none transition-all duration-200
                           text-sm font-medium text-slate-800 dark:text-white
                           placeholder:text-slate-400;
                }
                
                .animate-in { animation: slideIn 0.3s ease-out; }
                
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .leaflet-popup-content-wrapper {
                    border-radius: 16px;
                    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
                    border: 2px solid white;
                    padding: 0;
                    overflow: hidden;
                }
                
                .leaflet-popup-content { margin: 0; }
                .leaflet-popup-tip { display: none; } /* Enlever la pointe si désiré pour look plus moderne */
            `}</style>
        </div>
    );
}
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Building, MapPin, Globe, Calendar, Package, Loader2, Save, Edit, Truck, Car,
  Crosshair, Camera, FileText, Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';

// Imports Services & Types
import { agencyService, Agency } from '@/services/agencyService';
import { relayPointService, RelayPoint } from '@/services/relayPointService';
import { UserProfile } from './page';

// ----------------------------------------------------------------------
// HELPER : UPLOAD PHOTO
// ----------------------------------------------------------------------
const uploadFileToApi = async (file: File, url: string) => {
    console.log(`🚀 [UPLOAD] ${url}`);
    const fd = new FormData();
    fd.append('file', file);
    
    // Nettoyage du token (parfois stocké avec des guillemets doubles en JSON)
    let token = localStorage.getItem('authToken');
    if (token) token = token.replace(/"/g, '');

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}` 
                // Note: Ne pas mettre Content-Type pour FormData, le navigateur le gère avec le boundary
            },
            body: fd
        });

        if(!res.ok) throw new Error(`Upload Failed: ${res.statusText}`);
        const data = await res.json();
        console.log(`✅ Upload OK:`, data);
        return data; // Retourne l'objet complet (peut contenir url, fileUrl, etc.)
    } catch (e: any) {
        console.error("Upload error", e);
        throw e;
    }
};

// ----------------------------------------------------------------------
// COMPOSANT INPUT ANIMÉ (Réutilisable)
// ----------------------------------------------------------------------
const AnimatedInputField = ({ 
    label, name, value, onChange, readOnly, icon: Icon, type = "text", placeholder, step 
}: any) => (
  <div className="relative group">
    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 tracking-wider flex items-center gap-2 transition-colors">
      {Icon && <Icon className="w-3.5 h-3.5 text-orange-500" />} {label}
    </label>
    <input 
      type={type} 
      name={name} 
      value={value || ''} 
      onChange={onChange} 
      readOnly={readOnly} 
      step={step} 
      placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium text-sm
      ${readOnly 
        ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10'}`} 
    />
  </div>
);

// ----------------------------------------------------------------------
// COMPOSANT PRINCIPAL
// ----------------------------------------------------------------------

interface Props {
    profile: UserProfile;
    onUpdate: () => void;
    overrideRole?: string; // NOUVEAU PARAMÈTRE OPTIONNEL
}

export default function ProfileBusinessInfo({ profile, onUpdate, overrideRole }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);
        // Etats Relais
    const [form, setForm] = useState({
        relayPointName: '', address: '', locality: '', 
        openingHours: '08:00-18:00', maxCapacity: 100, 
        latitude: 0, longitude: 0
    });

    // -- DATA STATES --
    const role = profile.businessActorType || profile.business_actor_type || 'FREELANCE' || overrideRole;
    
    // A. Etat Agence (pour AGENCY_OWNER)
    const [agency, setAgency] = useState<Agency | null>(null);
    const [agencyForm, setAgencyForm] = useState({
        commercialName: '',
        address: '',
        addressLocality: '',
        registration: '', // SIRET/RC
        openingHours: '08:00-18:00'
    });

    // B. Etat Relay Point (pour FREELANCE ou AGENCY_OWNER gestionnaire direct)
    const [relayPoint, setRelayPoint] = useState<RelayPoint | null>(null);
    const [relayForm, setRelayForm] = useState({
        relayPointName: '',
        address: '',
        locality: '',
        openingHours: '08:00-18:00',
        maxCapacity: 100,
        latitude: 0,
        longitude: 0
    });

    const [photo, setPhoto] = useState<{file: File, preview: string} | null>(null);

    // C. Photo Temporaire
    const [pendingPhoto, setPendingPhoto] = useState<{file: File, preview: string} | null>(null);
        useEffect(() => {
        const load = async () => {
             console.log("📥 Chargement Module Business pour rôle :", role);
             
             // A. Si c'est une Agence (Propriétaire)
             if (role === 'AGENCY_OWNER') {
                 // Code de chargement agence existant...
                 const ag = await agencyService.getMyAgency(profile.id);
                 if(ag) setAgencyForm(ag); // Mapper les champs correctememnt
             }
             
             // B. Si c'est un Freelance (Propriétaire Point Relais)
             if (role === 'RELAY_OWNER') {
                 // Note: Pour freelance, l'ownerId EST l'id du profil
                 const points = await relayPointService.getRelayPointsByOwner(profile.id);
                 if(points && points.length > 0) {
                     // On charge le premier (logiciel mono-point pour freelance actuellement)
                     const pt = points[0];
                     setRelayForm(pt); // Mapper
                 }
             }
        };
        load();
    }, [profile, role]);

    
    // 1. CHARGEMENT
    useEffect(() => {
        const init = async () => {
             if (role !== 'RELAY_OWNER' && role !== 'FREELANCE') return;
             setIsLoading(true);

             try {
                 // A. Essayer de charger depuis l'API (Mode EDITION d'un existant)
                 const points = await relayPointService.getAllRelayPoints();
                 // Note: L'ownerId dans les objets BDD est parfois un string, on compare de manière sûre
                 const myPoint = points.find(p => String(p.ownerId) === String(profile.id));

                 if (myPoint) {
                     console.log("✅ Point Relais trouvé en base.");
                     setRelayPoint(myPoint);
                     setForm({
                         relayPointName: myPoint.relayPointName,
                         address: myPoint.address || myPoint.relay_point_address || '',
                         locality: myPoint.locality || myPoint.relay_point_locality || '',
                         openingHours: myPoint.openingHours || '08:00-18:00',
                         maxCapacity: myPoint.maxCapacity,
                         latitude: myPoint.latitude,
                         longitude: myPoint.longitude
                     });
                     // Ne PAS mettre en mode édition automatiquement si données BDD trouvées
                     setIsEditing(false);
                 } 
                 else {
                     // B. Si rien en base, chercher le cache (Mode CREATION à partir des données d'inscription)
                     const cached = localStorage.getItem('registration_data_cache');
                     if (cached) {
                         const c = JSON.parse(cached);
                         console.log("📥 Pré-remplissage depuis LocalStorage :", c);
                         setForm({
                             relayPointName: c.relay_point_name || '',
                             address: c.relay_point_address || '',
                             locality: c.relay_point_locality || '',
                             openingHours: c.opening_hours || '08:00-18:00',
                             maxCapacity: c.storage_capacity === 'Grand' ? 500 : (c.storage_capacity === 'Moyen' ? 200 : 50),
                             latitude: 0, longitude: 0
                         });
                         // Activer l'édition pour que l'utilisateur valide/sauvegarde
                         setIsEditing(true);
                     }
                 }
             } catch(e) { console.error(e); } 
             finally { setIsLoading(false); }
        };
        init();
    }, [profile, role]);

    const handleSave = async () => {
        setIsLoading(true);
        const tId = toast.loading("Traitement en cours...");

        try {
            // Payload
            const payload = {
                relayPointName: form.relayPointName, // Nom correspondant au DTO Java
                address: form.address,
                locality: form.locality,
                openingHours: form.openingHours,
                maxCapacity: form.maxCapacity,
                latitude: form.latitude, 
                longitude: form.longitude
            };

            let currentId = relayPoint?.id;

            // A. MISE À JOUR OU CRÉATION
            if (currentId) {
                // PUT (Mise à jour)
                await relayPointService.updateRelayPoint(currentId, payload);
                toast.success("Mise à jour réussie", { id: tId });
            } else {
                // POST (Création) - C'est ici qu'on utilise le pre-remplissage
                console.log("🚀 Création nouveau point relais...", payload);
                const newRp = await relayPointService.createRelayPoint(payload, profile.id);
                
                if (newRp && newRp.id) {
                    currentId = newRp.id;
                    setRelayPoint(newRp); // Mise à jour de l'état local pour passer en mode 'existant'
                    toast.success("Point Relais créé !", { id: tId });
                    localStorage.removeItem('registration_data_cache'); // Nettoyage cache
                } else {
                    throw new Error("Erreur création : ID manquant");
                }
            }

            // B. PHOTO
            if (photo && currentId) {
                toast.loading("Upload photo...", { id: tId });
                await relayPointService.uploadRelayPhoto(currentId, photo.file);
            }

            // C. SOUMISSION ADMIN AUTOMATIQUE
            // Si le point vient d'être créé ou est encore en brouillon
            if (currentId && (!relayPoint || ['DRAFT', 'PENDING_DOCUMENTS'].includes(relayPoint.status))) {
                toast.loading("Soumission admin...", { id: tId });
                await relayPointService.submitForVerification(currentId);
                toast.success("Dossier soumis !", { id: tId });
                
                // Rafraichir les données pour avoir le nouveau statut (PENDING_VERIFICATION)
                const updated = await relayPointService.getRelayPointById(currentId);
                setRelayPoint(updated);
            }

            setIsEditing(false);
            setPhoto(null);
            onUpdate();

        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "Erreur sauvegarde", { id: tId });
        } finally {
            setIsLoading(false);
        }
    };



    // 2. GESTION FICHIERS
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPendingPhoto({
                file,
                preview: URL.createObjectURL(file)
            });
            toast.success("Photo prête à l'envoi");
        }
    };

    // 4. LOGIQUE GPS (Pour Freelance/Relais)
    const handleLocateMe = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setRelayForm(prev => ({
                        ...prev,
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    }));
                    toast.success("Position GPS actualisée !");
                    setIsLocating(false);
                },
                (err) => {
                    console.error(err);
                    toast.error("Impossible d'obtenir la position.");
                    setIsLocating(false);
                }
            );
        } else {
            toast.error("Géolocalisation non supportée.");
            setIsLocating(false);
        }
    };


    // -- UI RENDER CONDITIONNELLE --

    // Image à afficher
    const displayImage = pendingPhoto?.preview || (agency?.photo_url || (profile as any).photoUrl || relayPoint?.relay_point_photo_url || null);

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700">
            
            {/* Header Section */}
            <div className="flex justify-between items-start mb-8">
                 <div className="flex items-center gap-4">
                     <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-slate-600 relative overflow-hidden group shadow-inner">
                         {displayImage ? (
                             <img src={displayImage} alt="Etablissement" className="w-full h-full object-cover"/>
                         ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-400">
                                 <Building className="w-10 h-10"/>
                             </div>
                         )}

                         {/* Overlay Camera pour Edit Mode */}
                         {isEditing && (
                             <div 
                                onClick={() => photoInputRef.current?.click()}
                                className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                             >
                                 <Camera className="w-8 h-8 text-white drop-shadow-md"/>
                             </div>
                         )}
                         <input ref={photoInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange}/>
                     </div>
                     
                     <div>
                         <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                             {role === 'AGENCY_OWNER' ? 'Ma Structure' : 'Mon Point Relais'}
                         </h2>
                         <p className="text-sm text-gray-500 font-medium">
                            {agency ? "Agence active" : (relayPoint ? "Point relais actif" : "Non configuré")}
                         </p>
                         <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                             {role}
                         </span>
                     </div>
                 </div>

                 <button 
                    onClick={isEditing ? handleSave : () => setIsEditing(true)} 
                    disabled={isLoading}
                    className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                    ${isEditing 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-white dark:bg-slate-700 border text-slate-700 dark:text-white hover:bg-gray-50'}`}
                 >
                     {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : (isEditing ? <Save className="w-4 h-4"/> : <Edit className="w-4 h-4"/>)}
                     {isEditing ? "Enregistrer" : "Modifier"}
                 </button>
            </div>

            {/* FORMULAIRES SPÉCIFIQUES SELON ROLE */}
            
            {/* -- SCENARIO A : AGENCE -- */}
            {(role === 'AGENCY_OWNER' || role === 'AGENCY') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                    <AnimatedInputField 
                        label="Nom Commercial" 
                        name="commercialName" 
                        icon={Briefcase} 
                        value={agencyForm.commercialName} 
                        onChange={(e:any) => setAgencyForm({...agencyForm, commercialName: e.target.value})} 
                        readOnly={!isEditing} 
                    />
                    <AnimatedInputField 
                        label="Immatriculation (RC / NIU)" 
                        name="registration" 
                        icon={FileText} 
                        value={agencyForm.registration} 
                        onChange={(e:any) => setAgencyForm({...agencyForm, registration: e.target.value})} 
                        readOnly={!isEditing} 
                    />
                    <AnimatedInputField 
                        label="Adresse Siège" 
                        name="address" 
                        icon={MapPin} 
                        value={agencyForm.address} 
                        onChange={(e:any) => setAgencyForm({...agencyForm, address: e.target.value})} 
                        readOnly={!isEditing} 
                    />
                    <AnimatedInputField 
                        label="Lieu-dit de l'adresse" 
                        name="addressLocality" 
                        icon={Globe} 
                        value={agencyForm.addressLocality} 
                        onChange={(e:any) => setAgencyForm({...agencyForm, addressLocality: e.target.value})} 
                        readOnly={!isEditing} 
                    />
                     <AnimatedInputField 
                        label="Horaires" 
                        name="openingHours" 
                        icon={Calendar} 
                        value={agencyForm.openingHours} 
                        onChange={(e:any) => setAgencyForm({...agencyForm, openingHours: e.target.value})} 
                        readOnly={!isEditing} 
                    />
                </div>
            )}

            {/* -- SCENARIO B : FREELANCE / POINT RELAIS -- */}
            {role === 'RELAY_OWNER' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                    <AnimatedInputField 
                        label="Nom du Point" 
                        name="relayPointName" 
                        icon={Building} 
                        value={relayForm.relayPointName} 
                        onChange={(e:any) => setRelayForm({...relayForm, relayPointName: e.target.value})} 
                        readOnly={!isEditing} 
                    />
                    <AnimatedInputField 
                        label="Capacité Max" 
                        name="maxCapacity" 
                        type="number"
                        icon={Package} 
                        value={relayForm.maxCapacity} 
                        onChange={(e:any) => setRelayForm({...relayForm, maxCapacity: e.target.value})} 
                        readOnly={!isEditing} 
                    />
                    <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
                        <AnimatedInputField 
                            label="Adresse" 
                            name="address" 
                            icon={MapPin} 
                            value={relayForm.address} 
                            onChange={(e:any) => setRelayForm({...relayForm, address: e.target.value})} 
                            readOnly={!isEditing} 
                        />
                         <AnimatedInputField 
                            label="Lieu-dit de l'adresse" 
                            name="locality" 
                            icon={Globe} 
                            value={relayForm.locality} 
                            onChange={(e:any) => setRelayForm({...relayForm, locality: e.target.value})} 
                            readOnly={!isEditing} 
                        />
                    </div>
                    
                    <AnimatedInputField 
                        label="Horaires" 
                        name="openingHours" 
                        icon={Calendar} 
                        value={relayForm.openingHours} 
                        onChange={(e:any) => setRelayForm({...relayForm, openingHours: e.target.value})} 
                        readOnly={!isEditing} 
                    />

                    {/* SECTION GPS */}
                    <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/40">
                         <div className="flex justify-between items-center mb-2">
                             <label className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase flex gap-1">
                                <Crosshair className="w-3.5 h-3.5"/> Coordonnées GPS
                             </label>
                             {isEditing && (
                                 <button onClick={handleLocateMe} disabled={isLocating} className="text-[10px] bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded shadow-sm flex items-center gap-1 transition">
                                     {isLocating ? <Loader2 className="w-3 h-3 animate-spin"/> : <Globe className="w-3 h-3"/>}
                                     Localiser
                                 </button>
                             )}
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                              <input 
                                  type="number" step="any" placeholder="Lat" 
                                  value={relayForm.latitude} 
                                  onChange={e => setRelayForm({...relayForm, latitude: parseFloat(e.target.value)})}
                                  readOnly={!isEditing}
                                  className="w-full bg-white dark:bg-slate-900 border px-2 py-1.5 rounded text-sm outline-none focus:border-orange-500"
                              />
                              <input 
                                  type="number" step="any" placeholder="Long" 
                                  value={relayForm.longitude} 
                                  onChange={e => setRelayForm({...relayForm, longitude: parseFloat(e.target.value)})}
                                  readOnly={!isEditing}
                                  className="w-full bg-white dark:bg-slate-900 border px-2 py-1.5 rounded text-sm outline-none focus:border-orange-500"
                              />
                         </div>
                    </div>
                 </div>
            )}
        </div>
    );
}
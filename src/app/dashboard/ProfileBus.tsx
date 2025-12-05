'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Building, MapPin, Globe, Calendar, Package, Loader2, Save, Edit, Truck, Car,
  Crosshair, Camera
} from 'lucide-react';
import toast from 'react-hot-toast';

import { relayPointService, RelayPoint } from '@/services/relayPointService';
import { UserProfile } from './page';

// Utilitaires Upload (dupliqué ou à externaliser dans un hook usePhotoUpload)
const uploadFileToApi = async (file: File, url: string) => {
    console.log(`🚀 [UPLOAD] ${url}`);
    const fd = new FormData();
    fd.append('file', file);
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${token}` },
         body: fd
    });
    if(!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    console.log(`✅ Upload OK:`, data);
    return data.url;
};


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

interface Props {
    profile: UserProfile;
    onUpdate: () => void;
}

export default function ProfileBusinessInfo({ profile, onUpdate }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);
    
    const role = profile.account_type;
    
    // Gestion des photos locales en attente
    const [pendingPhoto, setPendingPhoto] = useState<{file: File, preview: string} | null>(null);

    // State Relay
    const [relayData, setRelayData] = useState<Partial<RelayPoint>>({
        relayPointName: '',
        address: '',
        latitude: 0,
        longitude: 0,
        openingHours: '08:00-18:00',
        maxCapacity: 50,
        locality: ''
    });
    
    // State Livreur (Permis)
    // Note: Simplification pour cet exemple, en réalité faudrait gérer recto/verso
    const [vehicleData, setVehicleData] = useState({
        type: '', brand: '', plate: ''
    });

    const [existingRelayId, setExistingRelayId] = useState<string | null>(null);
    // Pour l'agence
    const [agencyId, setAgencyId] = useState<string | null>(profile.agencyId || null);

    // CHARGEMENT
    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            if (role === 'FREELANCE' || role === 'AGENCY') {
                try {
                    const allPoints = await relayPointService.getAllRelayPoints();
                    if (isMounted) {
                        const myPoint = allPoints ? allPoints.find(p => String(p.ownerId) === String(profile.id)) : null;
                        if (myPoint) {
                            setExistingRelayId(myPoint.id);
                            setRelayData({
                                relayPointName: myPoint.relayPointName,
                                address: myPoint.address || myPoint.relay_point_address || '',
                                latitude: myPoint.latitude,
                                longitude: myPoint.longitude,
                                openingHours: myPoint.openingHours || '08:00-18:00',
                                maxCapacity: myPoint.maxCapacity,
                                locality: myPoint.locality
                            });
                            // Pour photo, on check myPoint.photoUrl ou myPoint.relay_point_photo_url
                        }
                    }
                } catch (e) {}
            }
        };
        loadData();
        return () => { isMounted = false; };
    }, [role, profile]);

    // GESTION FICHIER PHOTO
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setPendingPhoto({
                file: file,
                preview: URL.createObjectURL(file)
            });
            toast.success("Photo sélectionnée. Sauvegardez pour appliquer.");
        }
    };

    // LOGIQUE SAUVEGARDE (INCLUANT PHOTOS)
    const handleSaveRelay = async () => {
        setIsLoading(true);
        const toastId = toast.loading("Enregistrement en cours...");

        try {
             let relayId = existingRelayId;
             let relayResp: RelayPoint | null = null;

             // 1. Sauvegarde Données Texte (Création ou Update)
             if (existingRelayId) {
                 relayResp = await relayPointService.updateRelayPoint(existingRelayId, relayData);
             } else {
                 // Creation
                 relayResp = await relayPointService.createRelayPoint(relayData, profile.id);
                 relayId = relayResp?.id || null;
                 setExistingRelayId(relayId);
             }
             
             // 2. Sauvegarde Photo (Si nouvelle)
             // Routes: 
             // - Relay: POST /api/photos/relay-point/{id}/photo
             // - Agency: POST /api/photos/agency/{id}/photo
             // - Freelance: POST /api/photos/business-actor/photo (Pour l'acteur lui-même)
             
             if (pendingPhoto && pendingPhoto.file) {
                 if (role === 'FREELANCE' && relayId) {
                     // Upload Photo Point Relais
                     await uploadFileToApi(pendingPhoto.file, `/api/photos/relay-point/${relayId}/photo`);
                     
                 } else if (role === 'AGENCY' && agencyId) {
                     await uploadFileToApi(pendingPhoto.file, `/api/photos/agency/${agencyId}/photo`);
                     
                 } else {
                     // Fallback business actor generic photo
                     await uploadFileToApi(pendingPhoto.file, `/api/photos/business-actor/photo`);
                 }
                 setPendingPhoto(null);
             }

             toast.dismiss(toastId);
             toast.success("Mises à jour enregistrées !");
             setIsEditing(false);
             onUpdate(); // Refresh parent

        } catch (e: any) {
            console.error(e);
            toast.dismiss(toastId);
            toast.error(`Erreur : ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangeRelay = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRelayData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleLocateMe = () => {
        navigator.geolocation.getCurrentPosition((pos) => {
            setRelayData(prev => ({...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude}));
            toast.success("Position mise à jour via GPS");
        });
    }

    if (role === 'FREELANCE' || role === 'AGENCY') {
        // Photo actuelle (venant des props ou de l'upload temporaire)
        const displayPhoto = pendingPhoto?.preview || (profile as any).photoUrl || (profile as any).relay_point_photo_url || null;

        return (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-orange-100 dark:border-gray-700 relative overflow-hidden transition-colors duration-300">
                
                {/* Photo Cover / Building */}
                <div className="flex items-start justify-between mb-6">
                     <div className="flex items-center gap-4">
                         <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-700 overflow-hidden relative border border-gray-200 dark:border-gray-600 group">
                             {displayPhoto ? (
                                 <img src={displayPhoto} className="w-full h-full object-cover" alt="Etablissement"/>
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center text-gray-400"><Building className="w-8 h-8"/></div>
                             )}
                             
                             {/* Overlay Upload (Visible en edit mode) */}
                             {isEditing && (
                                 <div onClick={() => photoInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                                     <Camera className="text-white w-6 h-6"/>
                                 </div>
                             )}
                         </div>
                         <input ref={photoInputRef} type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" />

                         <div>
                             <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                                 {existingRelayId ? "Gérer mon Point" : "Créer Point Relais"}
                             </h3>
                             <p className="text-gray-500 dark:text-gray-400 text-sm">{role === 'AGENCY' ? 'Agence' : 'Freelance Independent'}</p>
                         </div>
                     </div>
                     
                     <button 
                        onClick={isEditing ? handleSaveRelay : () => setIsEditing(true)} 
                        disabled={isLoading}
                        className={`flex items-center justify-center gap-2 font-bold py-2 px-6 rounded-xl shadow-md transition-all active:scale-95
                        ${isEditing 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-white dark:bg-gray-700 border text-orange-600 dark:text-orange-400'}`}
                     >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : (isEditing ? <Save className="w-4 h-4"/> : <Edit className="w-4 h-4"/>)}
                        {isEditing ? 'Enregistrer' : 'Modifier'}
                     </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <AnimatedInputField 
                        label="Nom Commercial" 
                        name="relayPointName" 
                        value={relayData.relayPointName} 
                        onChange={handleChangeRelay} 
                        readOnly={!isEditing} 
                        icon={Building}
                        placeholder="Ex: Relais Market Mvan"
                     />
                     
                     <AnimatedInputField 
                        label="Capacité (Colis)" 
                        name="maxCapacity" 
                        type="number"
                        value={relayData.maxCapacity} 
                        onChange={handleChangeRelay} 
                        readOnly={!isEditing} 
                        icon={Package}
                     />

                     <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatedInputField label="Adresse Physique" name="address" value={relayData.address} onChange={handleChangeRelay} readOnly={!isEditing} icon={MapPin} />
                        <AnimatedInputField label="Ville / Quartier" name="locality" value={relayData.locality} onChange={handleChangeRelay} readOnly={!isEditing} icon={Globe} />
                     </div>
                     
                     <div className="md:col-span-2 bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/50">
                         <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-orange-800 dark:text-orange-300 flex items-center gap-2">
                                <Globe className="w-4 h-4"/> Position GPS
                            </h4>
                            {isEditing && (
                                <button onClick={handleLocateMe} disabled={isLocating} className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2">
                                    {isLocating ? <Loader2 className="w-3 h-3 animate-spin"/> : <Crosshair className="w-3 h-3"/>} GPS
                                </button>
                            )}
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <AnimatedInputField label="Latitude" name="latitude" type="number" step="any" value={relayData.latitude} onChange={handleChangeRelay} readOnly={!isEditing} />
                            <AnimatedInputField label="Longitude" name="longitude" type="number" step="any" value={relayData.longitude} onChange={handleChangeRelay} readOnly={!isEditing} />
                         </div>
                     </div>
                </div>
            </div>
        );
    }

    // TODO: Si LIVREUR, on peut ajouter un formulaire pour `api/photos/deliverer/license-front` ici.
    return null;
}
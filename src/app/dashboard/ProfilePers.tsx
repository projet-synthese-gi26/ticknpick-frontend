// FICHIER: src/app/dashboard/ProfilePers.tsx
'use client';

import React, { useState, useRef, useEffect, Dispatch, SetStateAction  } from 'react';
import { 
  User, Mail, Phone, Home, CreditCard, FileText, IdCard, Save, Loader2, Camera, Upload, CheckCircle, Edit, X, CheckSquare
} from 'lucide-react';
import { UserProfile } from './page';
import toast from 'react-hot-toast'; 
import { userService } from '@/services/userservice'; 

// --- Styles communs ---
// Note : Utilisation des classes Tailwind pour Light/Dark mode
const baseCardStyles = "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300";

// --- Composant UI Upload avec prévisualisation et états ---
const DocumentUploadField = ({ label, icon: Icon, currentUrl, onFileSelect, isEditing, isLoading }: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Logique de détection image vs autre (pdf, doc...)
    // currentUrl peut être un Blob URL (local) ou une URL distante
    const isFile = !!currentUrl;
    const isImage = isFile && (
        currentUrl.startsWith('blob:') || 
        /\.(jpeg|jpg|gif|png|webp)$/i.test(currentUrl) ||
        !/\.pdf$/i.test(currentUrl) // Par défaut, on suppose image si pas PDF
    );

    return (
        <div className={`p-5 rounded-2xl group ${baseCardStyles}`}>
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                    <Icon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                {label}
            </h4>
            
            <div className="h-40 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center overflow-hidden relative transition-colors hover:border-orange-300">
                 {isFile ? (
                     isImage ? (
                         <div className="relative w-full h-full">
                             <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" />
                             {/* Overlay pour l'effet "uploadé" si blob */}
                             {currentUrl.startsWith('blob:') && (
                                 <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow">En attente</div>
                             )}
                         </div>
                     ) : (
                         <div className="text-center text-green-600 dark:text-green-400 p-2">
                             <FileText className="w-10 h-10 mb-2 mx-auto"/>
                             <span className="text-xs font-bold">Fichier PDF</span>
                             <a href={currentUrl} target="_blank" rel="noreferrer" className="block text-[10px] underline mt-1 text-gray-500 hover:text-gray-700">Ouvrir le document</a>
                         </div>
                     )
                 ) : (
                     <div className="text-center p-4 opacity-50">
                         <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500"/>
                         <span className="text-xs text-gray-400 dark:text-gray-500">Aucun document</span>
                     </div>
                 )}
                 
                 {/* Loader Overlay lors de l'upload global */}
                 {isLoading && (
                     <div className="absolute inset-0 bg-white/80 dark:bg-black/60 flex flex-col items-center justify-center z-10">
                         <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2"/>
                         <span className="text-xs font-bold text-orange-600 dark:text-orange-400">Traitement...</span>
                     </div>
                 )}
            </div>
            
            {isEditing && (
                <>
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()} 
                        className="w-full mt-3 py-2.5 text-xs font-bold uppercase bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-xl flex justify-center gap-2 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                    >
                        <Camera className="w-3.5 h-3.5"/> {isFile ? 'Modifier' : 'Ajouter'}
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={onFileSelect} 
                        className="hidden" 
                        accept="image/jpeg,image/png,image/webp,application/pdf" 
                    />
                </>
            )}
        </div>
    );
};

// --- Champ Texte Animé ---
const AnimatedInputField = ({ label, name, value, onChange, readOnly, icon: Icon }: any) => (
    <div className="group">
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-2 transition-colors group-focus-within:text-orange-600">
            {Icon && <Icon className="w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />} {label}
        </label>
        <div className="relative">
            <input 
                type="text" 
                name={name} 
                value={value || ''} 
                onChange={onChange} 
                readOnly={readOnly}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 outline-none text-sm font-medium 
                ${readOnly 
                    ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/20'}`} 
            />
            {readOnly && <div className="absolute inset-0 bg-transparent cursor-not-allowed z-10"></div>}
        </div>
    </div>
);

interface Props {
    formData: UserProfile;
    setFormData: Dispatch<SetStateAction<UserProfile>>; // Correction ICI: Utiliser le bon type pour le setState
    onUpdate: () => void;
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
}

export default function ProfilePersonalInfo({ formData, setFormData, onUpdate, isEditing, setIsEditing }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    
    // Stockage temporaire des fichiers (File objects) avant envoi. 
    // La clé correspond à un identifiant logique qu'on mappera vers l'URL de l'API.
    const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});

    // --- 1. Gestion des champs Texte ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- 2. Sélection Fichier Local + Prévisualisation ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fileKey: string) => {
        const file = e.target.files?.[0];
        if(file) {
            // Vérif taille (ex: max 5Mo)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Fichier trop volumineux (Max 5Mo)");
                return;
            }

            setPendingFiles(prev => ({...prev, [fileKey]: file}));

            // Création URL locale pour affichage immédiat
            const previewUrl = URL.createObjectURL(file);
            
            // Mapping vers les champs d'affichage du formData
            // On utilise ces clés dans le JSX plus bas
            let stateField = "";
            switch(fileKey) {
                case 'user_identity': stateField = 'identity_photo_url'; break;
                case 'niu_document': stateField = 'niu_document_url'; break;
                // Pour les CNI, on gère souvent des champs snake_case venant du backend ou camelCase
                case 'cni_recto': stateField = 'cni_recto_url'; break; 
                case 'cni_verso': stateField = 'cni_verso_url'; break;
                default: stateField = `${fileKey}_url`;
            }

            // Mise à jour Visuelle immédiate (sans toucher à la BDD)
            // On supporte les variantes de nommage (camelCase/snake_case) pour l'affichage
            // Correction ICI : Typer explicitement 'prev'
            setFormData((prev: UserProfile) => ({ 
                ...prev, 
                [stateField]: previewUrl,
                ...(stateField.includes('_') ? {[stateField.replace(/_([a-z])/g, g => g[1].toUpperCase())]: previewUrl} : {})
            }));

            toast.success("Image sélectionnée", { icon: '👍', duration: 2000 });
        }
    };

    // --- 3. Upload vers API (Fonction Helper) ---
    const uploadFile = async (file: File, endpoint: string): Promise<string | null> => {
        const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
        const fd = new FormData();
        fd.append('file', file);
        
        // Récupération token
        let token = localStorage.getItem('authToken');
        if (token) token = token.replace(/"/g, '');

        console.log(`📤 Uploading ${file.name} to ${endpoint}`);

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }, // Pas de Content-Type, fetch le gère
                body: fd
            });

            if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
            
            // Parse de la réponse pour récupérer l'URL finale
            // On gère les formats : {url: "..."}, {fileUrl: "..."}, ou string directe
            const data = await res.json().catch(() => null); 
            
            // Logique d'extraction URL
            const finalUrl = data?.url || data?.fileUrl || (typeof data === 'string' ? data : null);
            
            if(finalUrl) {
                 console.log(`✅ Upload success: ${finalUrl}`);
                 return finalUrl;
            } else {
                 console.warn("⚠️ Upload réussi mais pas d'URL retournée", data);
                 return null;
            }
        } catch (err: any) {
            console.error("❌ Upload Error:", err);
            toast.error(`Echec upload ${file.name}`);
            return null;
        }
    };

    // --- 4. SAUVEGARDE GLOBALE ---
    const handleSave = async () => {
        setIsLoading(true);
        const loadingId = toast.loading("Enregistrement...");

        try {
            const newUrls: Record<string, string> = {};

            // A. TRAITEMENT DES UPLOADS EN SÉRIE
            const uploadConfigs = [
                { key: 'user_identity', endpoint: '/api/photos/user/identity', prop: 'identity_photo_url' },
                { key: 'niu_document', endpoint: '/api/photos/user/niu-document', prop: 'niu_document_url' },
                { key: 'cni_recto', endpoint: '/api/photos/business-actor/cni-recto', prop: 'cni_recto_url' }, // ou 'cniRectoUrl'
                { key: 'cni_verso', endpoint: '/api/photos/business-actor/cni-verso', prop: 'cni_verso_url' } // ou 'cniVersoUrl'
            ];

            for (const config of uploadConfigs) {
                if (pendingFiles[config.key]) {
                    const url = await uploadFile(pendingFiles[config.key], config.endpoint);
                    if (url) newUrls[config.prop] = url;
                }
            }

            // B. MISE À JOUR DES DONNÉES TEXTUELLES
            // Note: Les endpoints d'upload mettent souvent à jour le user directement.
            // Mais pour name, phone, address, etc., il faut le PUT user.
            
            // Construction payload propre
            const updatePayload: any = {
                name: formData.manager_name || formData.name,
                phoneNumber: formData.phone_number,
                homeAddress: formData.home_address,
                idCardNumber: formData.id_card_number,
                niu: formData.niu,
                ...newUrls // Si le backend attend les URLs dans le PUT
            };

            console.log("💾 Saving User Profile:", updatePayload);
            
            // Appel Update User
            // Note : Utilise l'ID direct au lieu de 'me' pour plus de robustesse si l'ID est dispo
            const targetId = formData.id || 'me'; 
            await userService.updateUser(targetId, updatePayload);

            toast.success("Profil mis à jour !", { id: loadingId });
            
            // C. NETTOYAGE
            setPendingFiles({});
            setIsEditing(false);
            onUpdate(); // Remonte au parent pour rafraîchir

        } catch (err: any) {
            console.error(err);
            toast.error(`Erreur: ${err.message || "Sauvegarde échouée"}`, { id: loadingId });
        } finally {
            setIsLoading(false);
        }
    };

    // Helper pour l'affichage
    // Utilise la clé camelCase ou snake_case
    const getVal = (keySnake: string, keyCamel: string) => (formData as any)[keySnake] || (formData as any)[keyCamel] || null;
    const isPro = ['FREELANCE', 'AGENCY', 'LIVREUR', 'BUSINESS'].includes(formData.account_type);

    return (
        <div className="bg-white/90 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 dark:border-gray-700 overflow-hidden transition-colors duration-300">
             
             {/* Header Coloré avec Avatar Flottant */}
             <div className="h-40 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 relative">
                 {/* Motif déco */}
                 <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,white_2px,transparent_2px)] [background-size:20px_20px]"></div>
                 
                 {/* Avatar Container */}
                 <div className="absolute -bottom-12 left-8">
                      <div className="relative w-36 h-36 rounded-3xl bg-white dark:bg-gray-800 p-2 shadow-xl group hover:scale-[1.02] transition-transform">
                           <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-100 relative border border-gray-200 dark:border-gray-600">
                               <img 
                                   src={getVal('identity_photo_url', 'identityPhotoUrl') || `https://ui-avatars.com/api/?name=${formData.name}&background=f97316&color=fff&bold=true`}
                                   alt="Profile"
                                   className="w-full h-full object-cover"
                               />
                               
                               {/* Overlay Edit Avatar */}
                               {isEditing && (
                                   <label 
                                      htmlFor="avatar-upload" 
                                      className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"
                                   >
                                        <Camera className="w-8 h-8 text-white drop-shadow-md" />
                                        <span className="text-xs text-white font-bold mt-1 shadow-sm">Modifier</span>
                                   </label>
                               )}
                               <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={e => handleFileSelect(e, 'user_identity')} disabled={!isEditing}/>
                           </div>
                           
                           {/* Badge Statut (Déco) */}
                           <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-md" title="Compte Actif">
                               <CheckCircle className="w-4 h-4"/>
                           </div>
                      </div>
                 </div>
             </div>

             <div className="pt-16 px-8 pb-8">
                  {/* Barre d'action supérieure */}
                  <div className="flex justify-end mb-6">
                       {isEditing ? (
                           <div className="flex gap-3 animate-in fade-in slide-in-from-right-5">
                               <button onClick={() => {setIsEditing(false); onUpdate(); setPendingFiles({})}} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Annuler</button>
                               <button onClick={handleSave} disabled={isLoading} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-500/30 transition-transform active:scale-95 disabled:opacity-70">
                                   {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Sauvegarder
                               </button>
                           </div>
                       ) : (
                           <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:opacity-90 shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0">
                               <Edit className="w-4 h-4"/> Modifier le profil
                           </button>
                       )}
                  </div>

                  {/* Grille du Formulaire */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-10">
                       {/* COLONNE 1: INFOS TEXTE */}
                       <div className="space-y-8">
                           <div>
                               <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 mb-5">
                                   <User className="w-5 h-5 text-orange-500"/>
                                   <h3 className="text-lg font-bold text-gray-800 dark:text-white uppercase tracking-wide text-sm">Identité</h3>
                               </div>
                               <div className="space-y-4">
                                   <AnimatedInputField 
                                       label="Nom Complet" name="manager_name" icon={User} 
                                       value={formData.manager_name || formData.name} onChange={handleChange} readOnly={!isEditing} 
                                   />
                                   <AnimatedInputField 
                                       label="Email" name="email" icon={Mail} 
                                       value={formData.email} onChange={handleChange} readOnly={true} 
                                   />
                               </div>
                           </div>

                           <div>
                               <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 mb-5">
                                   <Phone className="w-5 h-5 text-orange-500"/>
                                   <h3 className="text-lg font-bold text-gray-800 dark:text-white uppercase tracking-wide text-sm">Coordonnées</h3>
                               </div>
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   <AnimatedInputField 
                                       label="Téléphone" name="phone_number" icon={Phone}
                                       value={formData.phone_number} onChange={handleChange} readOnly={!isEditing} 
                                   />
                                   <AnimatedInputField 
                                       label="Adresse" name="home_address" icon={Home}
                                       value={formData.home_address} onChange={handleChange} readOnly={!isEditing} 
                                   />
                               </div>
                               
                           </div>
                            <div className="grid grid-cols-2 gap-4">
                                   <AnimatedInputField 
                                       label="Numéro CNI" name="id_card_number" icon={CreditCard}
                                       value={formData.id_card_number} onChange={handleChange} readOnly={!isEditing} 
                                   />
                                   {isPro && (
                                       <AnimatedInputField 
                                           label="Numéro NIU" name="niu" icon={FileText}
                                           value={formData.niu} onChange={handleChange} readOnly={!isEditing} 
                                       />
                                   )}
                               </div>
                       </div>

                       {/* COLONNE 2: DOCUMENTS */}
                       <div>
                           <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 mb-5">
                               <IdCard className="w-5 h-5 text-orange-500"/>
                               <h3 className="text-lg font-bold text-gray-800 dark:text-white uppercase tracking-wide text-sm">Documents & Identification</h3>
                           </div>
                           
                           <div className="space-y-4">

                               <h4 className="text-xs font-bold text-gray-400 uppercase mt-6 mb-2">Pièces Justificatives</h4>
                               
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   {/* CNI RECTO */}
                                   <DocumentUploadField 
                                      label="CNI (Recto)" icon={IdCard} 
                                      currentUrl={getVal('cni_recto_url', 'cniRectoUrl')} 
                                      onFileSelect={(e: any) => handleFileSelect(e, 'cni_recto')}
                                      isEditing={isEditing} isLoading={isLoading}
                                   />
                                   
                                   {/* CNI VERSO */}
                                   <DocumentUploadField 
                                      label="CNI (Verso)" icon={IdCard} 
                                      currentUrl={getVal('cni_verso_url', 'cniVersoUrl')} 
                                      onFileSelect={(e: any) => handleFileSelect(e, 'cni_verso')}
                                      isEditing={isEditing} isLoading={isLoading}
                                   />

                                   {/* NIU DOC (si Pro) */}
                                   {isPro && (
                                       <div className="sm:col-span-2">
                                            <DocumentUploadField 
                                                label="Document NIU (Scan/PDF)" icon={FileText} 
                                                currentUrl={getVal('niu_document_url', 'niuDocumentUrl')} 
                                                onFileSelect={(e: any) => handleFileSelect(e, 'niu_document')}
                                                isEditing={isEditing} isLoading={isLoading}
                                            />
                                       </div>
                                   )}
                               </div>
                           </div>
                       </div>
                  </div>
             </div>
        </div>
    );
}
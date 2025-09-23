'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { 
  Edit, Save, Upload, MapPin, User, Building, Phone, Mail, Globe, 
  Loader2, Camera, Plus, Eye, EyeOff, Calendar, CreditCard, Settings, 
  AlertCircle, Car, Users, Star, Truck, Package, Shield, X, Check, 
  Home,
  CheckCircle,
  FileText,
  IdCard
} from 'lucide-react';
import router from 'next/navigation';
import { useRouter } from 'next/navigation';


// Interfaces corrigées et unifiées
interface BaseProfile {
  id: string;
  email: string;
  created_at: string;
  account_type: 'CLIENT' | 'LIVREUR' | 'FREELANCE' | 'AGENCY';
  manager_name: string | null;
  phone_number: string | null;
  birth_date: string | null;
  nationality: string | null;
  home_address: string | null;
  home_address_locality?: string | null;
  id_card_number: string | null;
  niu?: string | null;
}

interface ClientProfile extends BaseProfile {
  account_type: 'CLIENT';
  // Pas de champs spécifiques pour les clients
}

interface DeliveryProfile extends BaseProfile {
  account_type: 'LIVREUR';
  vehicle_type: string | null;
  vehicle_brand: string | null;
  vehicle_registration: string | null;
  vehicle_color: string | null;
  trunk_dimensions: string | null;
  driving_license_front_url: string | null;
  driving_license_back_url: string | null;
  accident_history: string | null;
}

interface ProProfile extends BaseProfile {
  account_type: 'FREELANCE' | 'AGENCY';
  identity_photo_url: string | null;
  id_card_url: string | null;
  tax_id: string | null;
  professional_experience: string | null;
  relay_point_name: string | null;
  relay_point_address: string | null;
  relay_point_gps: string | null;
  opening_hours: string | null;
  storage_capacity: string | null;
  service_card_details: any;
  id_card_front_url: string | null; id_card_back_url: string | null; niu_document_url: string | null;
}

type UserProfile = ClientProfile | DeliveryProfile | ProProfile;

interface RelayPoint {
  id: number;
  name: string;
  address: string;
  quartier?: string;
  lat: number;
  lng: number;
  hours?: string;
  type: 'bureau' | 'commerce' | 'agence';
  agency_id: string;
  created_at: string;
}

// Dynamic imports pour Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer), 
  { 
    ssr: false, 
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="ml-2 text-orange-600">Chargement de la carte...</p>
      </div>
    ) 
  }
);

// --- NOUVEAU: Composant pour les documents ---
const DocumentUploadField = ({ label, icon: Icon, currentUrl, newFilePreview, onFileSelect, isEditing, isLoading }: {
    label: string;
    icon: React.ElementType;
    currentUrl: string | null | undefined;
    newFilePreview: string | null;
    onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isEditing: boolean;
    isLoading: boolean;
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm space-y-3">
            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Icon className="w-5 h-5 text-orange-500" />
                {label}
            </h4>
            <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                {newFilePreview ? (
                    <img src={newFilePreview} alt="Aperçu" className="max-h-full max-w-full object-contain rounded" />
                ) : currentUrl ? (
                    <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 font-medium hover:underline text-center">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        Document vérifié<br/>(Cliquez pour voir)
                    </a>
                ) : (
                    <p className="text-sm text-gray-500">Aucun document</p>
                )}
            </div>
            {isEditing && (
                <>
                    <input type="file" ref={fileInputRef} onChange={onFileSelect} className="hidden" accept="image/png, image/jpeg, image/jpg" />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="w-full bg-orange-100 hover:bg-orange-200 text-orange-700 text-sm font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4" />}
                        {currentUrl ? 'Changer' : 'Télécharger'}
                    </button>
                </>
            )}
        </div>
    );
};

const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });

// Composant Map avec gestion d'erreurs améliorée
const ProfileMap = ({ position }: { position: [number, number] }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !position) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-orange-50 to-amber-50">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={position} />
    </MapContainer>
  );
};

// --- AMÉLIORATION 1 : Composant de prévisualisation d'image amélioré ---
const ProfileImagePreview = ({ src, alt }: { src: string; alt: string; }) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
    setImageState('loading');
  }, [src]);

  return (
    <div className="relative w-full h-full">
      {imageState === 'loading' && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-full">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${imageState === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        onError={() => {
          setImageState('error');
          setCurrentSrc('/avatars/default.png');
        }}
        onLoad={() => setImageState('loaded')}
      />
    </div>
  );
};


// Composant de notification Toast
const Toast = ({ message, type, onClose }: { 
  message: string; 
  type: 'success' | 'error' | 'warning'; 
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, type === 'success' ? 3000 : 5000);
    return () => clearTimeout(timer);
  }, [type, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500'
  }[type];

  const icon = {
    success: <Check className="w-5 h-5" />,
    error: <X className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />
  }[type];

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in`}>
      {icon}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-75">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

interface ProfilePageProps {
  profile: UserProfile;
  onUpdate: () => void;
}

export default function ProfilePage({ profile, onUpdate }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingRelayPoint, setIsEditingRelayPoint] = useState(false); 
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
  const [showAddRelay, setShowAddRelay] = useState(false);
    // --- NOUVEAUX ÉTATS POUR LES FICHIERS ---
  const [filesToUpload, setFilesToUpload] = useState<Record<string, File | null>>({});
  const [filePreviews, setFilePreviews] = useState<Record<string, string | null>>({});
   const router = useRouter();
  const [newRelayData, setNewRelayData] = useState({ 
    name: '', 
    address: '', 
    quartier: '',
    type: 'bureau' as 'bureau' | 'commerce' | 'agence'
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mise à jour du formData quand le profil change
  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  // Obtenir la géolocalisation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { 
          setCurrentLocation([pos.coords.latitude, pos.coords.longitude]); 
        }, 
        (err) => { 
          console.warn("Impossible d'obtenir la localisation:", err.message); 
          // Coordonnées par défaut (Yaoundé)
          setCurrentLocation([3.8480, 11.5021]); 
        }, 
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
      );
    } else {
      setCurrentLocation([3.8480, 11.5021]);
    }
  }, []);

  // Charger les points relais pour les agences
  useEffect(() => {
    if (profile.account_type === 'AGENCY') {
      fetchRelayPoints();
    }
  }, [profile.account_type, profile.id]);

    // NOUVELLE LOGIQUE : Pré-remplir les coordonnées GPS à l'initialisation et à chaque fois qu'on entre en mode édition
  useEffect(() => {
    // 1. Logique de géolocalisation initiale
    if (!currentLocation) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                    setCurrentLocation(coords);
                    // Si le champ GPS est vide, on le met à jour
                    if (!(formData as ProProfile).relay_point_gps) {
                        setFormData(prev => ({...prev, relay_point_gps: `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`}));
                    }
                },
                () => setCurrentLocation([3.8480, 11.5021]) // Yaoundé
            );
        } else {
            setCurrentLocation([3.8480, 11.5021]); // Yaoundé
        }
    }

    // 2. Pré-remplir à chaque activation de l'édition si le champ est vide
    if (isEditingRelayPoint && !(formData as ProProfile).relay_point_gps && currentLocation) {
      setFormData(prev => ({...prev, relay_point_gps: `${currentLocation[0].toFixed(6)}, ${currentLocation[1].toFixed(6)}`}));
    }
  }, [isEditingRelayPoint, currentLocation, formData]);

  const fetchRelayPoints = async () => {
    try {
      const { data, error } = await supabase
        .from('relay_points')
        .select('*')
        .eq('agency_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRelayPoints(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des points relais:', error);
      showToast('Erreur lors du chargement des points relais', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Gestion du téléchargement de photos améliorée
    const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { showToast('Format de fichier non supporté.', 'error'); return; }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) { showToast('Le fichier est trop volumineux (max 5MB).', 'error'); return; }
    
    setUploadingPhoto(true);
    
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const timestamp = Date.now();
      const fileName = `${profile.id}/profile_${timestamp}.${fileExt}`;
      
      if ('identity_photo_url' in formData && formData.identity_photo_url && !formData.identity_photo_url.includes('default.png')) {
        try {
          const urlParts = formData.identity_photo_url.split('/');
          const existingFileName = urlParts.pop();
          const existingPath = urlParts.slice(urlParts.indexOf(profile.id)).join('/');
          if (existingPath && existingFileName) {
              await supabase.storage.from('profile-photos').remove([`${existingPath}/${existingFileName}`]);
          }
        } catch (deleteError) { 
          console.warn('Erreur de suppression ancienne photo:', deleteError); 
        }
      }
      
      const { data: uploadData, error: uploadError } = await supabase.storage.from('profile-photos').upload(fileName, file, { upsert: true });
      if (uploadError) throw new Error(`Erreur d'upload: ${uploadError.message}`);
      
      const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(fileName);
      if (!publicUrl) throw new Error("URL publique non obtenue");
      
      if ('identity_photo_url' in formData) {
        const newUrlWithCacheBust = `${publicUrl}?t=${timestamp}`;
        setFormData(prev => ({ ...prev, identity_photo_url: newUrlWithCacheBust }));
        // Mettre à jour aussi dans la BDD
        await supabase.from('profiles_pro').update({ identity_photo_url: newUrlWithCacheBust }).eq('id', profile.id);
        onUpdate();
      }
      showToast('Photo mise à jour !', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- NOUVEAU: Gère la sélection de TOUS les fichiers ---
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = event.target.files?.[0];
    if (file) {
      // Mettre à jour l'état du fichier à uploader
      setFilesToUpload(prev => ({ ...prev, [fieldName]: file }));
      
      // Créer et stocker un aperçu
      const previewUrl = URL.createObjectURL(file);
      setFilePreviews(prev => ({ ...prev, [fieldName]: previewUrl }));

      // Nettoyer l'URL de l'aperçu précédent pour libérer la mémoire
      return () => URL.revokeObjectURL(previewUrl);
    }
  };



  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handlePhotoUpload(file);
  };

    const handleSaveChanges = async () => {
        setIsLoading(true);
        try {
            const uploadedFileUrls: Record<string, any> = {};

            // Étape 1: Uploader tous les nouveaux fichiers sélectionnés
            for (const [fieldName, file] of Object.entries(filesToUpload)) {
                if (file) {
                    const filePath = `${profile.id}/${fieldName}_${Date.now()}.${file.name.split('.').pop()}`;
                    const { data, error: uploadError } = await supabase.storage.from('user-files').upload(filePath, file, { upsert: true });
                    if (uploadError) throw new Error(`Échec de l'upload pour ${fieldName}: ${uploadError.message}`);

                    const { data: { publicUrl } } = supabase.storage.from('user-files').getPublicUrl(filePath);
                    if (!publicUrl) throw new Error(`Impossible d'obtenir l'URL pour ${fieldName}`);

                    // Structure pour les URL de CNI et permis de conduire
                    if (fieldName === 'id_card_front') {
                        if (!uploadedFileUrls.id_card_urls) uploadedFileUrls.id_card_urls = {};
                        uploadedFileUrls.id_card_urls.front = publicUrl;
                    } else if (fieldName === 'id_card_back') {
                        if (!uploadedFileUrls.id_card_urls) uploadedFileUrls.id_card_urls = {};
                        uploadedFileUrls.id_card_urls.back = publicUrl;
                    } else if (fieldName === 'driving_license_front') {
                        if (!uploadedFileUrls.driving_license_urls) uploadedFileUrls.driving_license_urls = {};
                        uploadedFileUrls.driving_license_urls.front = publicUrl;
                    } else if (fieldName === 'driving_license_back') {
                        if (!uploadedFileUrls.driving_license_urls) uploadedFileUrls.driving_license_urls = {};
                        uploadedFileUrls.driving_license_urls.back = publicUrl;
                    } else {
                        uploadedFileUrls[`${fieldName}_url`] = publicUrl;
                    }
                }
            }

            // Étape 2: Préparer les données textuelles à mettre à jour
            let updateData: Partial<UserProfile> = {
                manager_name: formData.manager_name,
                phone_number: formData.phone_number,
                // ... (tous les autres champs de texte de formData)
            };
            
            // Étape 3: Fusionner les URLs des fichiers uploadés avec les données à mettre à jour
            const finalUpdateData = { ...updateData, ...uploadedFileUrls };

            let tableName = profile.account_type === 'CLIENT' || profile.account_type === 'LIVREUR' ? 'profiles' : 'profiles_pro';

            const { error } = await supabase
                .from(tableName)
                .update(finalUpdateData)
                .eq('id', profile.id);

            if (error) throw error;
            
            // Réinitialisation après succès
            setIsEditing(false);
            setFilesToUpload({});
            setFilePreviews({});
            onUpdate(); // Rafraîchit les données de la page parente
            showToast('Profil mis à jour avec succès !', 'success');

        } catch (error: any) {
            console.error('Erreur lors de la sauvegarde:', error);
            showToast('Erreur lors de la sauvegarde : ' + error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };


  // Ajouter un point relais
  const addRelayPoint = async () => {
    if (!newRelayData.name || !newRelayData.address) {
      showToast('Veuillez remplir tous les champs obligatoires', 'warning');
      return;
    }
    
    if (!currentLocation) {
      showToast('Position géographique non disponible', 'error');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('relay_points')
        .insert({ 
          agency_id: profile.id, 
          name: newRelayData.name, 
          address: newRelayData.address,
          quartier: newRelayData.quartier || null,
          lat: currentLocation[0],
          lng: currentLocation[1],
          type: newRelayData.type,
          hours: '08:00-18:00' // Valeur par défaut
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setRelayPoints(prev => [data, ...prev]);
      setNewRelayData({ name: '', address: '', quartier: '', type: 'bureau' });
      setShowAddRelay(false);
      showToast('Point relais ajouté avec succès !', 'success');
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du point relais:', error);
      showToast('Erreur lors de l\'ajout du point relais : ' + error.message, 'error');
    }
  };


    // Fonction handleSaveRelayPoint MISE À JOUR ET SÉCURISÉE
  const handleSaveRelayPoint = async () => {
    // CORRECTION : On caste une seule fois au début pour la clarté
    const proData = formData as ProProfile;
    if (!(proData.account_type === 'FREELANCE' || proData.account_type === 'AGENCY')) return;

    setIsLoading(true);
    showToast('Sauvegarde en cours...', 'warning');

    try {
      const { relay_point_name, relay_point_address, relay_point_gps, opening_hours, storage_capacity } = proData;

      // CORRECTION : Validation sur les données de `formData` et non d'une variable locale
      if (!relay_point_name || !relay_point_address || !relay_point_gps) {
        throw new Error("Le nom, l'adresse et les coordonnées GPS sont requis.");
      }
      
      const gpsParts = relay_point_gps.split(',');
      if (gpsParts.length !== 2 || isNaN(parseFloat(gpsParts[0])) || isNaN(parseFloat(gpsParts[1]))) {
        throw new Error("Format GPS invalide. Utilisez 'latitude,longitude'.");
      }
      
      const lat = parseFloat(gpsParts[0].trim());
      const lng = parseFloat(gpsParts[1].trim());

      const relayPointPayload = {
        name: relay_point_name,
        address: relay_point_address,
        quartier: relay_point_address, 
        lat,
        lng,
        hours: opening_hours,
        type: 'agence' as const, 
        agency_id: profile.id
      };

      const { data: existingRelay, error: checkError } = await supabase
        .from('relay_points')
        .select('id')
        .eq('agency_id', profile.id)
        .maybeSingle();
      
      if (checkError) throw checkError;

      if (existingRelay) {
        const { error: updateError } = await supabase.from('relay_points').update(relayPointPayload).eq('agency_id', profile.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('relay_points').insert(relayPointPayload);
        if (insertError) throw insertError;
      }

      // NOUVELLE LOGIQUE : Mettre à jour `profiles_pro` APRÈS avoir géré `relay_points`
      const { error: profileUpdateError } = await supabase
        .from('profiles_pro')
        .update({
          relay_point_name,
          relay_point_address,
          relay_point_gps,
          opening_hours,
          storage_capacity
        })
        .eq('id', profile.id);
        
      if (profileUpdateError) throw profileUpdateError;

      showToast('Point relais mis à jour avec succès !', 'success');
      setIsEditingRelayPoint(false);
      onUpdate();

    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Mise à niveau de compte
  const upgradeAccount = async (newType: 'FREELANCE' | 'AGENCY' | 'LIVREUR') => {
    const typeNames = {
      'FREELANCE': 'Freelance PRO',
      'LIVREUR': 'Livreur',
      'AGENCY': 'Agence'
    };
    
    if (confirm(`Êtes-vous sûr de vouloir passer à un compte ${typeNames[newType]} ?`)) {
      try {
        setIsLoading(true);
        
        // Préparer les données pour la migration
        const migrationData = {
          id: profile.id,
          email: profile.email,
          account_type: newType,
          manager_name: formData.manager_name,
          phone_number: formData.phone_number,
          birth_date: formData.birth_date,
          nationality: formData.nationality,
          home_address: formData.home_address,
          id_card_number: formData.id_card_number,
          created_at: new Date().toISOString()
        };

        // Si migration vers PRO (FREELANCE ou AGENCY)
        if (newType === 'FREELANCE' || newType === 'AGENCY') {
          // Insérer dans profiles_pro
          const { error: insertError } = await supabase
            .from('profiles_pro')
            .insert(migrationData);
          
          if (insertError) throw insertError;
          
          // Supprimer de profiles si c'était un client/livreur
          if (profile.account_type === 'CLIENT' || profile.account_type === 'LIVREUR') {
            const { error: deleteError } = await supabase
              .from('profiles')
              .delete()
              .eq('id', profile.id);
            
            if (deleteError) throw deleteError;
          }
        } else if (newType === 'LIVREUR') {
          // Migration vers livreur
          const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
              ...migrationData,
              account_type: newType,
              home_address_locality: null,
              niu: null,
              vehicle_type: null,
              vehicle_brand: null,
              vehicle_registration: null,
              vehicle_color: null,
              trunk_dimensions: null,
              driving_license_front_url: null,
              driving_license_back_url: null,
              accident_history: null
            });
          
          if (updateError) throw updateError;
          
          // Supprimer de profiles_pro si c'était un PRO
          if (profile.account_type === 'FREELANCE' || profile.account_type === 'AGENCY') {
            const { error: deleteError } = await supabase
              .from('profiles_pro')
              .delete()
              .eq('id', profile.id);
            
            if (deleteError) throw deleteError;
          }
        }
        
        showToast('Compte mis à niveau avec succès !', 'success');
        onUpdate();
      } catch (error: any) {
        console.error('Erreur lors de la mise à niveau:', error);
        showToast('Erreur lors de la mise à niveau : ' + error.message, 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getAccountTitle = () => {
    switch (profile.account_type) {
      case 'CLIENT': return 'Client';
      case 'LIVREUR': return 'Livreur';
      case 'FREELANCE': return 'Freelance PRO';
      case 'AGENCY': return 'Agence';
      default: return 'Profil';
    }
  };

  const handleStartUpgrade = (newType: 'FREELANCE' | 'AGENCY' | 'LIVREUR') => {
    // Avertir l'utilisateur qu'il va être redirigé
    if (!confirm(`Vous allez être redirigé vers le formulaire pour finaliser votre passage au compte ${newType}. Continuer ?`)) {
      return;
    }
    
    // 1. Préparer les données à pré-remplir
    const upgradeRequest = {
      targetType: newType,
      profileData: formData // `formData` contient déjà l'état actuel du profil
    };

    // 2. Stocker dans localStorage
    localStorage.setItem('upgrade_account_request', JSON.stringify(upgradeRequest));

    // 3. Rediriger vers la page d'inscription
    router.push('/register');
  };

  // Composant de champ d'entrée animé
  const AnimatedInputField = ({ 
    label, 
    name, 
    value, 
    onChange, 
    readOnly, 
    icon: Icon, 
    focused, 
    onFocus, 
    onBlur, 
    fullWidth = false, 
    type = 'text', 
    isSelect = false, 
    options = [] 
  }: {
    label: string;
    name: string;
    value: string | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    readOnly: boolean;
    icon?: React.ComponentType<{ className?: string }>;
    focused: boolean;
    onFocus: () => void;
    onBlur: () => void;
    fullWidth?: boolean;
    type?: string;
    isSelect?: boolean;
    options?: Array<{ value: string; label: string }>;
  }) => (
    <div className={fullWidth ? 'md:col-span-2' : ''}>
      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-orange-500" />}
        {label}
      </label>
      <div className="relative group">
        {isSelect ? (
          <select 
            name={name} 
            value={value || ''} 
            onChange={onChange} 
            onFocus={onFocus} 
            onBlur={onBlur} 
            disabled={readOnly} 
            className={`w-full pl-4 pr-4 py-3 border-2 rounded-xl transition-all duration-300 font-medium ${
              readOnly 
                ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed' 
                : 'bg-white border-orange-200 text-gray-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 hover:border-orange-300'
            } ${focused ? 'transform scale-105 shadow-lg' : 'shadow-sm'} group-hover:shadow-md`}
          >
            <option value="">Sélectionner...</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input 
            type={type} 
            name={name} 
            value={value || ''} 
            onChange={onChange} 
            onFocus={onFocus} 
            onBlur={onBlur} 
            readOnly={readOnly} 
            className={`w-full pl-4 pr-4 py-3 border-2 rounded-xl transition-all duration-300 font-medium ${
              readOnly 
                ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed' 
                : 'bg-white border-orange-200 text-gray-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 hover:border-orange-300'
            } ${focused ? 'transform scale-105 shadow-lg' : 'shadow-sm'} group-hover:shadow-md`}
            placeholder={readOnly ? '' : `Saisissez votre ${label.toLowerCase()}`} 
          />
        )}
        {!readOnly && (
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <Edit className="w-4 h-4 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
    </div>
  );

  // --- AMÉLIORATION 2 : Rendu de la section photo repensé ---
  const renderPhotoSection = () => {
    if (profile.account_type === 'CLIENT' || profile.account_type === 'LIVREUR') {
      return (
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center border-4 border-orange-200">
          <User className="w-24 h-24 text-orange-400" />
        </div>
      );
    }
    const proData = formData as ProProfile;
    return (
      <div className="relative group w-48 h-48">
        <div className="w-full h-full rounded-full overflow-hidden border-4 border-orange-200 shadow-xl group-hover:border-orange-400 transition-all duration-300">
          <ProfileImagePreview 
            src={proData.identity_photo_url || '/avatars/default.png'}
            alt="Photo de profil"
          />
        </div>
        
        {/* État de chargement de l'upload */}
        {uploadingPhoto && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-full text-white">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm font-medium">Envoi...</p>
            </div>
          </div>
        )}
        
        {/* Bouton de modification qui apparaît au survol */}
        {isEditing && !uploadingPhoto && (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            title="Changer la photo de profil"
          >
            <div className="text-center">
                <Camera className="w-8 h-8 mx-auto" />
                <p className="text-sm font-semibold mt-1">Modifier</p>
            </div>
          </button>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/jpeg,image/jpg,image/png,image/webp" 
          onChange={handleFileInputChange} 
          disabled={uploadingPhoto} 
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
      {/* Toast notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="max-w-7xl mx-auto space-y-8 relative">
        {/* Header */}
        <div className="relative">
          <div className="absolute top-0 right-0 z-20">
            <button 
              onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)} 
              disabled={isLoading} 
              className={`group flex items-center gap-2 font-bold py-3 px-6 rounded-full text-white shadow-xl transform transition-all duration-500 hover:scale-110 hover:rotate-3 active:scale-95 ${
                isEditing 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse shadow-green-500/25' 
                  : 'bg-gradient-to-r from-orange-500 to-amber-600 animate-bounce shadow-orange-500/25'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin"/>
                  Sauvegarde...
                </>
              ) : isEditing ? (
                <>
                  <Save className="w-5 h-5 group-hover:rotate-12 transition-transform"/>
                  Sauvegarder
                </>
              ) : (
                <>
                  <Edit className="w-5 h-5 group-hover:rotate-12 transition-transform"/>
                  Modifier
                </>
              )}
            </button>
          </div>
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
              Mon Profil {getAccountTitle()}
            </h1>
            <p className="text-gray-600 text-lg">Gérez vos informations personnelles et professionnelles</p>
          </div>
        </div>

        {/* Section Informations Profil */}
        <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-orange-100 hover:shadow-2xl transition-all duration-300">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className="text-center flex-shrink-0">
              {renderPhotoSection()}
              <div className="mt-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {formData.manager_name || 'Nom non renseigné'}
                </h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-full text-sm shadow-lg">
                  <Building className="w-4 h-4" />
                  {getAccountTitle()}
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  {formData.email}
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-orange-500" />
                Informations Personnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatedInputField 
                  label="Nom Complet" 
                  name="manager_name" 
                  value={formData.manager_name} 
                  onChange={handleChange} 
                  readOnly={!isEditing} 
                  icon={User} 
                  focused={focusedField === 'manager_name'} 
                  onFocus={() => setFocusedField('manager_name')} 
                  onBlur={() => setFocusedField(null)} 
                />
                <AnimatedInputField 
                  label="Téléphone" 
                  name="phone_number" 
                  value={formData.phone_number} 
                  onChange={handleChange} 
                  readOnly={!isEditing} 
                  icon={Phone} 
                  focused={focusedField === 'phone_number'} 
                  onFocus={() => setFocusedField('phone_number')} 
                  onBlur={() => setFocusedField(null)} 
                />
                <AnimatedInputField 
                  label="Email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  readOnly={true} 
                  icon={Mail} 
                  focused={false} 
                  onFocus={() => {}} 
                  onBlur={() => {}} 
                />
                <AnimatedInputField 
                  label="Date de Naissance" 
                  name="birth_date" 
                  value={formData.birth_date} 
                  onChange={handleChange} 
                  readOnly={!isEditing} 
                  icon={Calendar} 
                  focused={focusedField === 'birth_date'} 
                  onFocus={() => setFocusedField('birth_date')} 
                  onBlur={() => setFocusedField(null)}
                  type="date" 
                />
                <AnimatedInputField 
                  label="Adresse Domicile" 
                  name="home_address" 
                  value={formData.home_address} 
                  onChange={handleChange} 
                  readOnly={!isEditing} 
                  icon={MapPin} 
                  focused={focusedField === 'home_address'} 
                  onFocus={() => setFocusedField('home_address')} 
                  onBlur={() => setFocusedField(null)} 
                  fullWidth 
                />
                <AnimatedInputField 
                  label="Nationalité" 
                  name="nationality" 
                  value={formData.nationality} 
                  onChange={handleChange} 
                  readOnly={!isEditing} 
                  icon={Globe} 
                  focused={focusedField === 'nationality'} 
                  onFocus={() => setFocusedField('nationality')} 
                  onBlur={() => setFocusedField(null)} 
                />
                <AnimatedInputField 
                  label="Numéro CNI" 
                  name="id_card_number" 
                  value={formData.id_card_number} 
                  onChange={handleChange} 
                  readOnly={!isEditing} 
                  icon={CreditCard} 
                  focused={focusedField === 'id_card_number'} 
                  onFocus={() => setFocusedField('id_card_number')} 
                  onBlur={() => setFocusedField(null)} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* NOUVEAU : Section pour les documents */}
        {(profile.account_type === 'FREELANCE' || profile.account_type === 'AGENCY') && (
            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-orange-100 mt-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-orange-500" />
                        Documents et Vérifications
                    </h3>
                    {/* Le bouton d'édition global gère cette section */}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DocumentUploadField
                        label="CNI (Recto)"
                        icon={IdCard}
                        currentUrl={(formData as ProProfile).id_card_front_url}
                        newFilePreview={filePreviews.id_card_front}
                        onFileSelect={(e) => handleFileSelect(e, 'id_card_front')}
                        isEditing={isEditing}
                        isLoading={uploadingPhoto}
                    />
                    <DocumentUploadField
                        label="CNI (Verso)"
                        icon={CreditCard}
                        currentUrl={(formData as ProProfile).id_card_back_url}
                        newFilePreview={filePreviews.id_card_back}
                        onFileSelect={(e) => handleFileSelect(e, 'id_card_back')}
                        isEditing={isEditing}
                        isLoading={uploadingPhoto}
                    />
                    <DocumentUploadField
                        label="Document NIU"
                        icon={FileText}
                        currentUrl={(formData as ProProfile).niu_document_url}
                        newFilePreview={filePreviews.niu_document}
                        onFileSelect={(e) => handleFileSelect(e, 'niu_document')}
                        isEditing={isEditing}
                        isLoading={uploadingPhoto}
                    />
                </div>
            </div>
        )}

        {/* Section spécifique aux Livreurs */}
        {profile.account_type === 'LIVREUR' && (
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-orange-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Car className="w-6 h-6 text-orange-500" />
                Informations Véhicule & Livraison
              </h3>
              <button 
                onClick={() => upgradeAccount('AGENCY')} 
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-2 px-4 rounded-xl hover:scale-105 transform transition-all duration-300 shadow-lg"
              >
                <Star className="w-5 h-5" />
                Devenir Agence
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                const deliveryData = formData as DeliveryProfile;
                return (
                  <>
                    <AnimatedInputField 
                      label="Type de Véhicule" 
                      name="vehicle_type" 
                      value={deliveryData.vehicle_type} 
                      onChange={handleChange} 
                      readOnly={!isEditing} 
                      icon={Truck} 
                      focused={focusedField === 'vehicle_type'} 
                      onFocus={() => setFocusedField('vehicle_type')} 
                      onBlur={() => setFocusedField(null)}
                      isSelect 
                      options={[
                        { value: 'moto', label: 'Moto' }, 
                        { value: 'voiture', label: 'Voiture' }, 
                        { value: 'camionnette', label: 'Camionnette' }, 
                        { value: 'camion', label: 'Camion' }
                      ]} 
                    />
                    <AnimatedInputField 
                      label="Marque du Véhicule" 
                      name="vehicle_brand" 
                      value={deliveryData.vehicle_brand} 
                      onChange={handleChange} 
                      readOnly={!isEditing} 
                      icon={Car} 
                      focused={focusedField === 'vehicle_brand'} 
                      onFocus={() => setFocusedField('vehicle_brand')} 
                      onBlur={() => setFocusedField(null)}
                    />
                    <AnimatedInputField 
                      label="Plaque d'Immatriculation" 
                      name="vehicle_registration" 
                      value={deliveryData.vehicle_registration} 
                      onChange={handleChange} 
                      readOnly={!isEditing} 
                      icon={CreditCard} 
                      focused={focusedField === 'vehicle_registration'} 
                      onFocus={() => setFocusedField('vehicle_registration')} 
                      onBlur={() => setFocusedField(null)}
                    />
                    <AnimatedInputField 
                      label="Couleur du Véhicule" 
                      name="vehicle_color" 
                      value={deliveryData.vehicle_color} 
                      onChange={handleChange} 
                      readOnly={!isEditing} 
                      icon={Car} 
                      focused={focusedField === 'vehicle_color'} 
                      onFocus={() => setFocusedField('vehicle_color')} 
                      onBlur={() => setFocusedField(null)}
                    />
                    <AnimatedInputField 
                      label="Dimensions du Coffre" 
                      name="trunk_dimensions" 
                      value={deliveryData.trunk_dimensions} 
                      onChange={handleChange} 
                      readOnly={!isEditing} 
                      icon={Package} 
                      focused={focusedField === 'trunk_dimensions'} 
                      onFocus={() => setFocusedField('trunk_dimensions')} 
                      onBlur={() => setFocusedField(null)}
                    />
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Section Point Relais pour PRO - VERSION CORRIGÉE */}
        {(profile.account_type === 'FREELANCE' || profile.account_type === 'AGENCY') && (
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-orange-100">
            <div className="flex items-center justify-between mb-6">
              {/* Titre et boutons d'édition */}
               <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Building className="w-6 h-6 text-orange-500" />
                    {profile.account_type === 'AGENCY' ? 'Point Relais Principal' : 'Mon Point Relais'}
                </h3>
                {/* Les boutons d'édition sont maintenant ici */}
                <div>
                  {!isEditingRelayPoint ? (
                      <button
                          onClick={() => setIsEditingRelayPoint(true)}
                          className="flex items-center gap-2 font-semibold py-2 px-4 rounded-lg text-orange-600 bg-orange-100 hover:bg-orange-200 transition-all text-sm"
                      >
                          <Edit className="w-4 h-4" />
                          Modifier
                      </button>
                  ) : (
                      <div className="flex gap-2">
                          <button
                              onClick={handleSaveRelayPoint}
                              disabled={isLoading}
                              className="flex items-center gap-2 font-semibold py-2 px-4 rounded-lg text-white bg-green-500 hover:bg-green-600 transition-all text-sm"
                          >
                              {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                              Sauvegarder
                          </button>
                          <button
                              onClick={() => {
                                  setIsEditingRelayPoint(false);
                                  setFormData(profile); // Annuler les changements
                              }}
                              className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                          >
                              <X className="w-4 h-4" />
                          </button>
                      </div>
                  )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                {(() => {
                  const proData = formData as ProProfile;
                  return (
                    <>
                      <AnimatedInputField 
                        label="Nom du Point Relais" 
                        name="relay_point_name" 
                        value={proData.relay_point_name} 
                        onChange={handleChange} 
                        readOnly={!isEditingRelayPoint} // CORRECTION FINALE ICI
                        icon={Building} 
                        focused={focusedField === 'relay_point_name'} 
                        onFocus={() => setFocusedField('relay_point_name')} 
                        onBlur={() => setFocusedField(null)} 
                      />
                      <AnimatedInputField 
                        label="Adresse du Point Relais" 
                        name="relay_point_address" 
                        value={proData.relay_point_address} 
                        onChange={handleChange} 
                        readOnly={!isEditingRelayPoint} // CORRECTION FINALE ICI
                        icon={MapPin} 
                        focused={focusedField === 'relay_point_address'} 
                        onFocus={() => setFocusedField('relay_point_address')} 
                        onBlur={() => setFocusedField(null)} 
                      />
                       <AnimatedInputField
                        label="Coordonnées GPS (lat,lng)"
                        name="relay_point_gps"
                        value={proData.relay_point_gps}
                        onChange={handleChange}
                        readOnly={!isEditingRelayPoint} // CORRECTION FINALE ICI
                        icon={Globe}
                        focused={focusedField === 'relay_point_gps'}
                        onFocus={() => setFocusedField('relay_point_gps')}
                        onBlur={() => setFocusedField(null)} 
                      />
                      <AnimatedInputField 
                        label="Heures d'Ouverture" 
                        name="opening_hours" 
                        value={proData.opening_hours} 
                        onChange={handleChange} 
                        readOnly={!isEditingRelayPoint} // CORRECTION FINALE ICI
                        icon={Calendar} 
                        focused={focusedField === 'opening_hours'} 
                        onFocus={() => setFocusedField('opening_hours')} 
                        onBlur={() => setFocusedField(null)} 
                      />
                       <AnimatedInputField
                          label="Capacité de Stockage"
                          name="storage_capacity"
                          value={proData.storage_capacity}
                          onChange={handleChange}
                          readOnly={!isEditingRelayPoint} // CORRECTION FINALE ICI
                          icon={Package}
                          focused={focusedField === 'storage_capacity'}
                          onFocus={() => setFocusedField('storage_capacity')}
                          onBlur={() => setFocusedField(null)} 
                          isSelect
                          options={[
                              {value: "Petit", label: "Petit (< 50 colis)"},
                              {value: "Moyen", label: "Moyen (50-200 colis)"},
                              {value: "Grand", label: "Grand (> 200 colis)"}
                          ]}
                        />
                    </>
                  );
                })()}
        {currentLocation && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span>Position: {currentLocation[0].toFixed(4)}, {currentLocation[1].toFixed(4)}</span>
          </div>
        )}
      </div>
      <div className="h-80 rounded-2xl overflow-hidden shadow-lg border-2 border-orange-100 hover:border-orange-300 transition-all duration-300">
        {currentLocation ? (
          <ProfileMap position={currentLocation} />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-orange-50 to-amber-50">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-orange-400 mx-auto mb-2" />
              <p className="text-gray-500">Localisation en cours...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}

        {/* Section Points Relais Multiples pour Agences */}
        {profile.account_type === 'AGENCY' && (
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-orange-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Building className="w-6 h-6 text-orange-500" />
                Points Relais de l'Agence ({relayPoints.length})
              </h3>
              <button 
                onClick={() => setShowAddRelay(!showAddRelay)} 
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-2 px-4 rounded-xl hover:scale-105 transform transition-all duration-300 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Ajouter un Point Relais
              </button>
            </div>
            
            {showAddRelay && (
              <div className="mb-6 p-6 bg-orange-50 rounded-2xl border border-orange-200">
                <h4 className="font-semibold text-gray-800 mb-4">Nouveau Point Relais</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <input 
                    type="text" 
                    placeholder="Nom du point relais" 
                    value={newRelayData.name} 
                    onChange={(e) => setNewRelayData(prev => ({ ...prev, name: e.target.value }))} 
                    className="p-3 border border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all" 
                  />
                  <input 
                    type="text" 
                    placeholder="Adresse" 
                    value={newRelayData.address} 
                    onChange={(e) => setNewRelayData(prev => ({ ...prev, address: e.target.value }))} 
                    className="p-3 border border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all" 
                  />
                  <input 
                    type="text" 
                    placeholder="Quartier (optionnel)" 
                    value={newRelayData.quartier} 
                    onChange={(e) => setNewRelayData(prev => ({ ...prev, quartier: e.target.value }))} 
                    className="p-3 border border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all" 
                  />
                  <select 
                    value={newRelayData.type} 
                    onChange={(e) => setNewRelayData(prev => ({ ...prev, type: e.target.value as 'bureau' | 'commerce' | 'agence' }))} 
                    className="p-3 border border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  >
                    <option value="bureau">Bureau</option>
                    <option value="commerce">Commerce</option>
                    <option value="agence">Agence</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={addRelayPoint} 
                    className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                  <button 
                    onClick={() => {
                      setShowAddRelay(false);
                      setNewRelayData({ name: '', address: '', quartier: '', type: 'bureau' });
                    }} 
                    className="bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {relayPoints.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Aucun point relais configuré</p>
                  <p className="text-gray-400">Ajoutez votre premier point relais pour commencer</p>
                </div>
              ) : (
                relayPoints.map((relay) => (
                  <div key={relay.id} className="bg-white p-6 rounded-2xl shadow-md border hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                          <Building className="w-5 h-5 text-orange-500" />
                          {relay.name}
                        </h4>
                        <p className="text-gray-600 flex items-center gap-2 mt-2">
                          <MapPin className="w-4 h-4" />
                          {relay.address}
                          {relay.quartier && <span className="text-orange-500">• {relay.quartier}</span>}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                            <Package className="w-4 h-4" />
                            {relay.type}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Créé le {new Date(relay.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {relay.hours && (
                          <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Horaires: {relay.hours}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          GPS: {relay.lat.toFixed(4)}, {relay.lng.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Section Évolution de Compte pour Clients */}
        {profile.account_type === 'CLIENT' && (
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-orange-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-orange-500" />
              Évolution de Compte
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 hover:border-blue-400 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <Package className="w-8 h-8 text-blue-500" />
                  <h4 className="text-xl font-bold text-blue-800">Freelance PRO</h4>
                </div>
                <ul className="space-y-2 mb-6 text-blue-700">
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Gestion indépendante
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Commission avantageuse
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Support prioritaire
                  </li>
                </ul>
                <button 
                  onClick={() => handleStartUpgrade('FREELANCE')}  
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl hover:scale-105 transform transition-all duration-300 shadow-lg"
                >
                  Devenir Freelance PRO
                </button>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200 hover:border-green-400 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <Truck className="w-8 h-8 text-green-500" />
                  <h4 className="text-xl font-bold text-green-800">Livreur</h4>
                </div>
                <ul className="space-y-2 mb-6 text-green-700">
                  <li className="flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Flexible & mobile
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Zones étendues
                  </li>
                  <li className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Revenus quotidiens
                  </li>
                </ul>
                <button 
                  onClick={() => upgradeAccount('LIVREUR')} 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 px-4 rounded-xl hover:scale-105 transform transition-all duration-300 shadow-lg"
                >
                  Devenir Livreur
                </button>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200 hover:border-purple-400 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <Building className="w-8 h-8 text-purple-500" />
                  <h4 className="text-xl font-bold text-purple-800">Agence</h4>
                </div>
                <ul className="space-y-2 mb-6 text-purple-700">
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Gestion d'équipe
                  </li>
                  <li className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Points relais multiples
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Commissions maximales
                  </li>
                </ul>
                <button 
                  onClick={() => upgradeAccount('AGENCY')} 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-4 rounded-xl hover:scale-105 transform transition-all duration-300 shadow-lg"
                >
                  Devenir Agence
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Styles CSS personnalisés */}
        <style jsx global>{`
          .leaflet-container {
            height: 100%;
            width: 100%;
            border-radius: 1rem;
          }
          
          .leaflet-control-zoom {
            border: none !important;
          }
          
          .leaflet-control-zoom a {
            background: rgba(249, 115, 22, 0.9) !important;
            color: white !important;
            border: none !important;
          }
          
          .leaflet-control-zoom a:hover {
            background: rgba(249, 115, 22, 1) !important;
          }

          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}
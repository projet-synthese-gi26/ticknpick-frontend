'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Edit, Save, Upload, MapPin, User, Building, Phone, Mail, Globe, Loader2, Camera, Plus, Eye, EyeOff, Calendar, CreditCard, Settings, AlertCircle, Car, Users, Star, Truck, Package, Shield } from 'lucide-react';

// Define the ProProfile interface once with all possible account types
interface ProProfile {
  id: string;
  manager_name: string | null;
  home_address: string | null;
  phone_number: string | null;
  nationality: string | null;
  identity_photo_url: string | null;
  relay_point_name: string | null;
  relay_point_address: string | null;
  account_type: 'CLIENT' | 'DELIVERY' | 'FREELANCE' | 'AGENCY' | 'client' | 'livreur' | 'freelance' | 'agence';
  current_latitude: number | null;
  current_longitude: number | null;
  created_at: string;
  updated_at: string;
  email?: string | null;
  name: string;
  role: string;
  [key: string]: any;
}

// Dynamic imports with proper loading states
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

const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });

// Map hook component with error handling
const ProfileMap = ({ position }: { position: [number, number] }) => {
  const [mapInstance, setMapInstance] = useState<any>(null);
  
  const MapUpdater = () => {
    const [map, setMap] = useState<any>(null);
    
    useEffect(() => {
      // Only use useMap hook on client side and when map libraries are loaded
      if (typeof window !== 'undefined') {
        try {
          const { useMap } = require('react-leaflet');
          const mapInstance = useMap();
          setMap(mapInstance);
        } catch (error) {
          console.warn('Erreur avec le hook useMap:', error);
        }
      }
    }, []);

    useEffect(() => {
      if (map && position && typeof map.setView === 'function') {
        map.setView(position, 15);
        setMapInstance(map);
      }
    }, [map, position]);
    
    return null;
  };

  return (
    <>
      <MapUpdater />
      {position && <Marker position={position} />}
    </>
  );
};

interface RelayPoint {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive';
  deactivation_reason?: string;
  created_at: string;
}

interface DeliveryInfo {
  vehicle_type: string;
  license_plate: string;
  vehicle_model: string;
  affiliated_agency_id?: string;
  affiliated_agency_name?: string;
}

interface ProfilePageProps {
  profile: ProProfile;
  onUpdate: () => void;
}

export default function ProfilePage({ profile, onUpdate }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProProfile>(profile);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
  const [showAddRelay, setShowAddRelay] = useState(false);
  const [newRelayData, setNewRelayData] = useState({ name: '', address: '' });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({ 
    vehicle_type: '', 
    license_plate: '', 
    vehicle_model: '' 
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update formData when profile changes
  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { 
          setCurrentLocation([pos.coords.latitude, pos.coords.longitude]); 
        }, 
        (err) => { 
          console.warn("Impossible d'obtenir la localisation:", err.message); 
          setCurrentLocation([10.5911, 14.3155]); // Default to Maroua coordinates
        }, 
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
      );
    } else {
      setCurrentLocation([10.5911, 14.3155]);
    }
  }, []);

  useEffect(() => {
    const accountType = profile.account_type.toUpperCase();
    if (accountType === 'AGENCY' || accountType === 'AGENCE') fetchRelayPoints();
    if (accountType === 'DELIVERY' || accountType === 'LIVREUR') fetchDeliveryInfo();
  }, [profile.account_type]);

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
    }
  };

  const fetchDeliveryInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_info')
        .select('*, agencies(name)')
        .eq('user_id', profile.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setDeliveryInfo({
          vehicle_type: data.vehicle_type || '',
          license_plate: data.license_plate || '',
          vehicle_model: data.vehicle_model || '',
          affiliated_agency_id: data.affiliated_agency_id,
          affiliated_agency_name: data.agencies?.name
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des infos livreur:', error);
    }
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleDeliveryInfoChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDeliveryInfo(prev => ({ ...prev, [name]: value }));
  }, []);

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { 
      alert('Format de fichier non supporté. Veuillez choisir une image JPG, PNG ou WebP.'); 
      return; 
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) { 
      alert('Le fichier est trop volumineux. Taille maximum autorisée : 5MB.'); 
      return; 
    }
    
    setUploadingPhoto(true);
    
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const timestamp = Date.now();
      const fileName = `${profile.id}/profile_${timestamp}.${fileExt}`;
      
      // Remove old photo if exists
      if (formData.identity_photo_url && !formData.identity_photo_url.includes('default.png')) {
        try {
          const urlParts = formData.identity_photo_url.split('/');
          const existingFileName = urlParts[urlParts.length - 1];
          if (existingFileName) {
            await supabase.storage
              .from('profile-photos')
              .remove([`${profile.id}/${existingFileName}`]);
          }
        } catch (deleteError) { 
          console.warn('Erreur lors de la suppression de l\'ancienne photo:', deleteError); 
        }
      }
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { upsert: true, cacheControl: '3600' });
      
      if (uploadError) throw new Error(`Erreur de téléchargement: ${uploadError.message}`);
      
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);
      
      if (!publicUrl) throw new Error('Impossible d\'obtenir l\'URL de la photo');
      
      setFormData(prev => ({ ...prev, identity_photo_url: publicUrl }));
      showToast('Photo téléchargée avec succès !', 'success');
    } catch (error: any) {
      console.error('Erreur lors du téléchargement:', error);
      showToast(`Erreur: ${error.message || 'Erreur lors du téléchargement'}`, 'error');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${type === 'success' 
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>' 
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>'
          }
        </svg>
        ${message}
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => { 
      if (toast.parentNode) toast.remove(); 
    }, type === 'success' ? 3000 : 5000);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handlePhotoUpload(file);
  };

  const ProfileImagePreview = ({ src, alt, className }: { src: string; alt: string; className: string; }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    
    return (
      <div className="relative w-full h-full">
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}
        <img 
          src={imageError ? '/avatars/default.png' : src} 
          alt={alt} 
          className={`${className} ${imageLoading ? 'invisible' : 'visible'}`} 
          onError={() => { setImageError(true); setImageLoading(false); }} 
          onLoad={() => { setImageLoading(false); setImageError(false); }} 
        />
      </div>
    );
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const updateData: any = {
        manager_name: formData.manager_name,
        home_address: formData.home_address,
        phone_number: formData.phone_number,
        nationality: formData.nationality,
        identity_photo_url: formData.identity_photo_url,
        current_latitude: currentLocation?.[0],
        current_longitude: currentLocation?.[1],
      };
      
      const accountType = profile.account_type.toUpperCase();
      if (accountType !== 'CLIENT') {
        updateData.relay_point_name = formData.relay_point_name;
        updateData.relay_point_address = formData.relay_point_address;
      }
      
      const { error } = await supabase
        .from('profiles_pro')
        .update(updateData)
        .eq('id', profile.id);
      
      if (error) throw error;
      
      if (accountType === 'DELIVERY' || accountType === 'LIVREUR') {
        const { error: deliveryError } = await supabase
          .from('delivery_info')
          .upsert({
            user_id: profile.id,
            vehicle_type: deliveryInfo.vehicle_type,
            license_plate: deliveryInfo.license_plate,
            vehicle_model: deliveryInfo.vehicle_model,
            affiliated_agency_id: deliveryInfo.affiliated_agency_id
          });
        
        if (deliveryError) throw deliveryError;
      }
      
      setIsEditing(false);
      onUpdate();
      showToast('Profil mis à jour avec succès !', 'success');
    } catch (error: any) {
      alert("Erreur lors de la sauvegarde : " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      handleSaveChanges();
    } else {
      setIsEditing(true);
    }
  };

  const addRelayPoint = async () => {
    if (!newRelayData.name || !newRelayData.address) return;
    
    try {
      const { data, error } = await supabase
        .from('relay_points')
        .insert({ 
          agency_id: profile.id, 
          name: newRelayData.name, 
          address: newRelayData.address, 
          status: 'active' 
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setRelayPoints(prev => [data, ...prev]);
      setNewRelayData({ name: '', address: '' });
      setShowAddRelay(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du point relais:', error);
    }
  };

  const toggleRelayPointStatus = async (relayId: string, currentStatus: string) => {
    const reason = currentStatus === 'active' 
      ? prompt('Raison de la désactivation:') 
      : prompt('Raison de la réactivation:');
    
    if (reason === null) return;
    
    try {
      const { error } = await supabase
        .from('relay_points')
        .update({ 
          status: currentStatus === 'active' ? 'inactive' : 'active', 
          deactivation_reason: reason 
        })
        .eq('id', relayId);
      
      if (error) throw error;
      
      fetchRelayPoints();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const upgradeAccount = async (newType: string) => {
    const typeNames = {
      'FREELANCE': 'Freelance PRO',
      'DELIVERY': 'Livreur',
      'AGENCY': 'Agence'
    };
    
    if (confirm(`Êtes-vous sûr de vouloir passer à un compte ${typeNames[newType as keyof typeof typeNames]} ?`)) {
      try {
        const { error } = await supabase
          .from('profiles_pro')
          .update({ account_type: newType })
          .eq('id', profile.id);
        
        if (error) throw error;
        
        showToast('Compte mis à niveau avec succès !', 'success');
        onUpdate();
      } catch (error: any) {
        alert('Erreur lors de la mise à niveau : ' + error.message);
      }
    }
  };

  const getAccountTitle = () => {
    const accountType = profile.account_type.toUpperCase();
    switch (accountType) {
      case 'CLIENT': return 'Client';
      case 'DELIVERY':
      case 'LIVREUR': return 'Livreur';
      case 'FREELANCE': return 'Freelance PRO';
      case 'AGENCY':
      case 'AGENCE': return 'Agence';
      default: return 'Profil';
    }
  };

  interface AnimatedInputFieldProps {
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
  }

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
  }: AnimatedInputFieldProps) => (
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

  // Helper function to check account type (handles both uppercase and lowercase)
  const isAccountType = (type: string) => {
    return profile.account_type.toUpperCase() === type.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8 relative">
        <div className="relative">
          <div className="absolute top-0 right-0 z-20">
            <button 
              onClick={toggleEdit} 
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

        {/* Profile Info Section */}
        <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-orange-100 hover:shadow-2xl transition-all duration-300">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className="text-center flex-shrink-0">
              <div className="relative group">
                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-orange-200 shadow-xl group-hover:border-orange-400 transition-all duration-300">
                  <ProfileImagePreview 
                    src={formData.identity_photo_url || '/avatars/default.png'} 
                    alt="Photo de profil" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                        <p className="text-white text-sm font-medium">Téléchargement...</p>
                      </div>
                    </div>
                  )}
                </div>
                {isEditing && (
                  <>
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      disabled={uploadingPhoto} 
                      className="absolute -bottom-2 -right-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transform transition-all duration-300 hover:rotate-12 disabled:opacity-50 disabled:cursor-not-allowed" 
                      title="Changer la photo de profil"
                    >
                      {uploadingPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/jpeg,image/jpg,image/png,image/webp" 
                      onChange={handleFileInputChange} 
                      disabled={uploadingPhoto} 
                    />
                  </>
                )}
                {isEditing && !uploadingPhoto && (
                  <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="bg-black/80 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
                      Formats: JPG, PNG, WebP (max 5MB)
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {formData.manager_name || 'Nom non renseigné'}
                </h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-full text-sm shadow-lg">
                  <Building className="w-4 h-4" />
                  {getAccountTitle()}
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
              </div>
            </div>
          </div>
        </div>

        {/* Relay Point Section */}
        {!isAccountType('CLIENT') && (
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-orange-100 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Building className="w-6 h-6 text-orange-500" />
              {isAccountType('AGENCY') ? 'Point Relais Principal' : 'Mon Point Relais'}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <AnimatedInputField 
                  label="Nom du Point Relais" 
                  name="relay_point_name" 
                  value={formData.relay_point_name} 
                  onChange={handleChange} 
                  readOnly={!isEditing} 
                  icon={Building} 
                  focused={focusedField === 'relay_point_name'} 
                  onFocus={() => setFocusedField('relay_point_name')} 
                  onBlur={() => setFocusedField(null)} 
                />
                <AnimatedInputField 
                  label="Adresse du Point Relais" 
                  name="relay_point_address" 
                  value={formData.relay_point_address} 
                  onChange={handleChange} 
                  readOnly={!isEditing} 
                  icon={MapPin} 
                  focused={focusedField === 'relay_point_address'} 
                  onFocus={() => setFocusedField('relay_point_address')} 
                  onBlur={() => setFocusedField(null)} 
                />
                {currentLocation && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span>Localisation actuelle: {currentLocation[0].toFixed(4)}, {currentLocation[1].toFixed(4)}</span>
                  </div>
                )}
              </div>
              <div className="h-80 rounded-2xl overflow-hidden shadow-lg border-2 border-orange-100 hover:border-orange-300 transition-all duration-300">
                {currentLocation ? (
                  <MapContainer center={currentLocation} zoom={13} style={{ height: '100%', width: '100%' }} className="z-0">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <ProfileMap position={currentLocation} />
                  </MapContainer>
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

        {/* Delivery Info Section */}
        {isAccountType('DELIVERY') && (
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-orange-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Car className="w-6 h-6 text-orange-500" />
                Informations Véhicule & Affiliation
              </h3>
              <button 
                onClick={() => upgradeAccount('AGENCY')} 
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-2 px-4 rounded-xl hover:scale-105 transform transition-all duration-300 shadow-lg"
              >
                <Star className="w-5 h-5" />
                Devenir Agence
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatedInputField 
                label="Type de Véhicule" 
                name="vehicle_type" 
                value={deliveryInfo.vehicle_type} 
                onChange={handleDeliveryInfoChange} 
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
                label="Plaque d'Immatriculation" 
                name="license_plate" 
                value={deliveryInfo.license_plate} 
                onChange={handleDeliveryInfoChange} 
                readOnly={!isEditing} 
                icon={CreditCard} 
                focused={focusedField === 'license_plate'} 
                onFocus={() => setFocusedField('license_plate')} 
                onBlur={() => setFocusedField(null)}
              />
              <AnimatedInputField 
                label="Modèle du Véhicule" 
                name="vehicle_model" 
                value={deliveryInfo.vehicle_model} 
                onChange={handleDeliveryInfoChange} 
                readOnly={!isEditing} 
                icon={Car} 
                focused={focusedField === 'vehicle_model'} 
                onFocus={() => setFocusedField('vehicle_model')} 
                onBlur={() => setFocusedField(null)}
              />
              {deliveryInfo.affiliated_agency_name && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Agence d'Affiliation
                  </h4>
                  <p className="text-blue-700">{deliveryInfo.affiliated_agency_name}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Client Upgrade Section */}
        {isAccountType('CLIENT') && (
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-orange-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-orange-500" />
              Évolution de Compte
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  onClick={() => upgradeAccount('FREELANCE')} 
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
                  onClick={() => upgradeAccount('DELIVERY')} 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 px-4 rounded-xl hover:scale-105 transform transition-all duration-300 shadow-lg"
                >
                  Devenir Livreur
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Freelance Stats Section */}
        {isAccountType('FREELANCE') && (
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-orange-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Package className="w-6 h-6 text-orange-500" />
                Activité Freelance
              </h3>
              <button 
                onClick={() => upgradeAccount('AGENCY')} 
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-2 px-4 rounded-xl hover:scale-105 transform transition-all duration-300 shadow-lg"
              >
                <Building className="w-5 h-5" />
                Devenir Agence
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center">
                <Package className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <h4 className="font-bold text-blue-800 mb-2">Commissions</h4>
                <p className="text-blue-700 text-2xl font-bold">8%</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center">
                <Star className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h4 className="font-bold text-green-800 mb-2">Évaluations</h4>
                <p className="text-green-700 text-2xl font-bold">4.8/5</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-center">
                <Users className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                <h4 className="font-bold text-purple-800 mb-2">Clients</h4>
                <p className="text-purple-700 text-2xl font-bold">24</p>
              </div>
            </div>
          </div>
        )}

        {/* Agency Relay Points Section */}
        {isAccountType('AGENCY') && (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={addRelayPoint} 
                    className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Ajouter
                  </button>
                  <button 
                    onClick={() => setShowAddRelay(false)} 
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
                        <h4 className="font-bold text-lg text-gray-800">{relay.name}</h4>
                        <p className="text-gray-600 flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4" />
                          {relay.address}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                            relay.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {relay.status === 'active' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            {relay.status === 'active' ? 'Actif' : 'Désactivé'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Créé le {new Date(relay.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {relay.deactivation_reason && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              Raison: {relay.deactivation_reason}
                            </p>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => toggleRelayPointStatus(relay.id, relay.status)} 
                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 ${
                          relay.status === 'active' 
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {relay.status === 'active' ? 'Désactiver' : 'Réactiver'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Custom CSS for Leaflet */}
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
        `}</style>
      </div>
    </div>
  );
}
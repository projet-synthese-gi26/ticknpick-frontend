'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ProProfile } from './page';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { 
  Edit, 
  Save, 
  Upload, 
  MapPin, 
  User, 
  Building, 
  Phone, 
  Mail, 
  Globe, 
  Loader2,
  Camera,
  Plus,
  Eye,
  EyeOff,
  Calendar,
  CreditCard,
  Settings,
  AlertCircle
} from 'lucide-react';
import { useMap } from 'react-leaflet'; 

// Import dynamique de Leaflet pour éviter les erreurs SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="ml-2 text-orange-600">Chargement de la carte...</p>
      </div>
    ),
  }
);

const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });

// Composant ProfileMap avec correction d'erreur
const ProfileMap = ({ position }: { position: [number, number] }) => {
  const [mapInstance, setMapInstance] = useState<any>(null);
  
  const MapUpdater = () => {
    try {
      const map = useMap();
      
      useEffect(() => {
        if (map && position && typeof map.setView === 'function') {
          map.setView(position, 15);
          setMapInstance(map);
        }
      }, [map, position]);
      
      return null;
    } catch (error) {
      console.warn('Erreur avec le hook useMap:', error);
      return null;
    }
  };

  return (
    <>
      <MapUpdater />
      {position && <Marker position={position} />}
    </>
  );
};

// Interface pour les points relais
interface RelayPoint {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive';
  deactivation_reason?: string;
  created_at: string;
}

export default function ProfilePage({ 
  profile, 
  onUpdate 
}: { 
  profile: ProProfile; 
  onUpdate: () => void; 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([]);
  const [showAddRelay, setShowAddRelay] = useState(false);
  const [newRelayData, setNewRelayData] = useState({ name: '', address: '' });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Animation des champs au focus
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Géolocalisation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn("Impossible d'obtenir la localisation:", err.message);
          // Position par défaut (Maroua, Cameroun)
          setCurrentLocation([10.5911, 14.3155]);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000
        }
      );
    } else {
      setCurrentLocation([10.5911, 14.3155]);
    }
  }, []);

  // Charger les points relais pour les agences
  useEffect(() => {
    if (profile.account_type === 'AGENCY') {
      fetchRelayPoints();
    }
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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    
    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/profile.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, identity_photo_url: publicUrl }));
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement de la photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles_pro')
        .update({
          manager_name: formData.manager_name,
          home_address: formData.home_address,
          phone_number: formData.phone_number,
          nationality: formData.nationality,
          relay_point_name: formData.relay_point_name,
          relay_point_address: formData.relay_point_address,
          identity_photo_url: formData.identity_photo_url,
          current_latitude: currentLocation?.[0],
          current_longitude: currentLocation?.[1],
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      setIsEditing(false);
      onUpdate();
      
      // Animation de succès
      const successToast = document.createElement('div');
      successToast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
      successToast.textContent = 'Profil mis à jour avec succès !';
      document.body.appendChild(successToast);
      
      setTimeout(() => {
        successToast.remove();
      }, 3000);
      
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
    const reason = currentStatus === 'active' ? 
      prompt('Raison de la désactivation:') : 
      prompt('Raison de la réactivation:');
    
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8 relative">
        {/* Header avec bouton d'édition flottant */}
        <div className="relative">
          <div className="absolute top-0 right-0 z-20">
            <button 
              onClick={toggleEdit}
              disabled={isLoading}
              className={`group flex items-center gap-2 font-bold py-3 px-6 rounded-full text-white shadow-xl transform transition-all duration-500 hover:scale-110 hover:rotate-3 active:scale-95
              ${isEditing 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse shadow-green-500/25' 
                : 'bg-gradient-to-r from-orange-500 to-amber-600 animate-bounce shadow-orange-500/25'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin"/> Sauvegarde...</>
              ) : isEditing ? (
                <><Save className="w-5 h-5 group-hover:rotate-12 transition-transform"/> Sauvegarder</>
              ) : (
                <><Edit className="w-5 h-5 group-hover:rotate-12 transition-transform"/> Modifier</>
              )}
            </button>
          </div>

          {/* Titre principal avec animation */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2 animate-fadeIn">
              Mon Profil {profile.account_type === 'AGENCY' ? 'Agence' : 'Freelance'}
            </h1>
            <p className="text-gray-600 text-lg">
              Gérez vos informations personnelles et professionnelles
            </p>
          </div>
        </div>

        {/* Section principale du profil */}
        <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-orange-100 hover:shadow-2xl transition-all duration-300">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Photo de profil */}
            <div className="text-center flex-shrink-0">
              <div className="relative group">
                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-orange-200 shadow-xl group-hover:border-orange-400 transition-all duration-300">
                  <img 
                    src={formData.identity_photo_url || '/avatars/default.png'} 
                    alt="Photo de profil" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transform transition-all duration-300 hover:rotate-12"
                  >
                    <Camera className="w-5 h-5"/>
                  </button>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                />
              </div>
              <div className="mt-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {formData.manager_name || 'Nom non renseigné'}
                </h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-full text-sm shadow-lg">
                  <Building className="w-4 h-4" />
                  {profile.account_type === 'AGENCY' ? 'Agence' : 'Freelance'}
                </div>
              </div>
            </div>
            
            {/* Informations personnelles */}
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

        {/* Section Point Relais Principal */}
        <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-orange-100 hover:shadow-2xl transition-all duration-300">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Building className="w-6 h-6 text-orange-500" />
            {profile.account_type === 'AGENCY' ? 'Point Relais Principal' : 'Mon Point Relais'}
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
            
            {/* Carte interactive */}
            <div className="h-80 rounded-2xl overflow-hidden shadow-lg border-2 border-orange-100 hover:border-orange-300 transition-all duration-300">
              {currentLocation ? (
                <MapContainer 
                  center={currentLocation} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
                >
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

        {/* Section Points Relais (Agence uniquement) */}
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

            {/* Formulaire d'ajout */}
            {showAddRelay && (
              <div className="mb-6 p-6 bg-orange-50 rounded-2xl border border-orange-200 animate-slideDown">
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

            {/* Liste des points relais */}
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
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold
                            ${relay.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                            }`}
                          >
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
                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105
                          ${relay.status === 'active'
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

        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.8s ease-out;
          }
          
          .animate-slideDown {
            animation: slideDown 0.5s ease-out;
          }
          
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

// Composant InputField animé
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
  fullWidth = false
}: any) => (
  <div className={fullWidth ? 'md:col-span-2' : ''}>
    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-orange-500" />}
      {label}
    </label>
    <div className="relative group">
      <input 
        type="text" 
        name={name} 
        value={value || ''} 
        onChange={onChange} 
        onFocus={onFocus}
        onBlur={onBlur}
        readOnly={readOnly}
        className={`w-full pl-4 pr-4 py-3 border-2 rounded-xl transition-all duration-300 font-medium
          ${readOnly 
            ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed' 
            : 'bg-white border-orange-200 text-gray-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 hover:border-orange-300'
          }
          ${focused ? 'transform scale-105 shadow-lg' : 'shadow-sm'}
          group-hover:shadow-md`}
        placeholder={readOnly ? '' : `Saisissez votre ${label.toLowerCase()}`}
      />
      {!readOnly && (
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <Edit className="w-4 h-4 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  </div>
);
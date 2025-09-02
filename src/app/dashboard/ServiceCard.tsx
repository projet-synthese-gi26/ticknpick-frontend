"use client";

import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Camera, User, Package, Tag, PlusCircle, Trash2, Car, Palette, Fingerprint, Ruler, Edit, Save, X, Eye, Users, ShieldCheck, Clock, Sprout, Sparkles, Star, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';

// INTERFACES
interface ProProfile {
  id: string;
  nom?: string;
  adresse_gps?: string;
  adresse_informelle?: string;
  description?: string;
  photo?: string;
  account_type: 'AGENCY' | 'FREELANCE';
  service_card_details?: ServiceCardDetails;
}

interface StaffMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

interface Vehicle {
  nom: string;
  marque: string;
  couleur: string;
  immatriculation: string;
  dimensions: {
    l: string | number;
    w: string | number;
    h: string | number;
  };
}

interface Tarif {
  service: string;
  prix: string;
}

interface ServiceCardDetails {
    promo?: string;
    vehicules?: Vehicle[];
    tarifs?: Tarif[];
    devise?: string;
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon?: React.ElementType;
  readOnly: boolean;
}

interface ColorPaletteProps {
  selectedColor: string;
  onSelect: (color: string) => void;
  readOnly?: boolean;
}

// Simule le chargement et la sauvegarde des données spécifiques à la carte de service
const useServiceCardData = (profileId: string) => {
    // ... Dans une vraie app, ces données seraient chargées depuis Supabase
    // ... en utilisant `profileId` comme clé.
    // ... Pour la démo, on utilise useState avec des valeurs initiales.
    
    const [vehicules, setVehicules] = useState<Vehicle[]>([{ nom: 'Van Utilitaire', marque: 'Toyota Hiace', couleur: '#10B981', immatriculation: 'LT 589-AI', dimensions: { l: 450, w: 180, h: 190 } }]);
    const [tarifs, setTarifs] = useState<Tarif[]>([ { service: 'Réception Colis Standard (< 5kg)', prix: '1500' }, { service: 'Gardiennage / jour (après 7j)', prix: '500' } ]);
    const [devise, setDevise] = useState('XAF');

    return { vehicules, setVehicules, tarifs, setTarifs, devise, setDevise };
};

const initialStaffMembers = [
  { id: 'emp-001', name: 'Essono Cédric', avatar: '/avatars/essono.png', role: 'Manutentionnaire' },
  { id: 'emp-002', name: 'Mballa Alice', avatar: '/avatars/mballa.png', role: 'Responsable Stock' },
  { id: 'emp-003', name: 'Fouda Martin', avatar: '/avatars/fouda.png', role: 'Préparateur Commandes' },
  { id: 'emp-004', name: 'Ngono Sandrine', avatar: '/avatars/ngono.png', role: 'Accueil Client' }
];

// STORAGE SIMULATION (remplace localStorage)
let memoryStorage: Record<string, string> = {};

const saveToMemory = (key: string, data: any) => { 
  memoryStorage[key] = JSON.stringify(data); 
};

const loadFromMemory = (key: string, defaultValue: any) => { 
  try { 
    return memoryStorage[key] ? JSON.parse(memoryStorage[key]) : defaultValue; 
  } 
  catch { 
    return defaultValue; 
  }
};

// SOUS-COMPOSANTS
const InputField = ({ label, value, onChange, placeholder, icon: Icon, readOnly }: InputFieldProps) => (
  <div className="group">
    <label className="block text-sm font-bold text-slate-700 mb-2 transition-colors group-focus-within:text-emerald-600">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        {Icon && <Icon className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-emerald-500" />}
      </div>
      <input 
        type="text" 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        readOnly={readOnly} 
        className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm ${readOnly ? 'bg-slate-50/80 border-slate-200 cursor-not-allowed' : 'bg-white/80 border-slate-200 hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20'} shadow-sm`} 
      />
    </div>
  </div>
);

const ColorPalette = ({ selectedColor, onSelect, readOnly = false }: ColorPaletteProps) => {
  const colors = ['#FFFFFF', '#1F2937', '#EF4444', '#F97316', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">Couleur</label>
      <div className="flex flex-wrap gap-2">
        {colors.map(color => (
          <button 
            key={color} 
            type="button" 
            onClick={() => !readOnly && onSelect(color)} 
            className={`h-10 w-10 rounded-full border-4 transition-all duration-200 shadow-lg ${selectedColor === color ? 'border-emerald-500 scale-110 shadow-emerald-500/30' : 'border-white hover:scale-105'} ${!readOnly ? 'cursor-pointer' : 'cursor-not-allowed'}`} 
            style={{ backgroundColor: color }} 
            disabled={readOnly} 
          />
        ))}
      </div>
    </div>
  );
};

export default function ServiceCardPage({ profile }: { profile: ProProfile }) {
  // ÉTATS PERSISTANTS
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backupData, setBackupData] = useState<ServiceCardDetails | null>(null);

  const { vehicules, setVehicules, tarifs, setTarifs, devise, setDevise } = useServiceCardData(profile.id);

  const [nom, setNom] = useState(() => loadFromMemory('nom', "Pick & Drop - Agence du Lac"));
  const [adresseGps, setAdresseGps] = useState(() => loadFromMemory('adresseGps', ""));
  const [adresseInformelle, setAdresseInformelle] = useState(() => loadFromMemory('adresseInformelle', "Face à l'hôtel de ville, grand portail vert"));
  const [description, setDescription] = useState(() => loadFromMemory('description', "Votre point relais de confiance au coeur de la ville. Nous combinons sécurité, rapidité et un service client exceptionnel pour tous vos besoins logistiques."));
  const [photoPreview, setPhotoPreview] = useState(() => loadFromMemory('photoPreview', "/images/relay-point-placeholder.jpg"));
  const [services, setServices] = useState<string[]>(() => loadFromMemory('services', ['Aide au chargement sur demande', 'Emballages éco-responsables', 'Stockage sécurisé 24/7']));
  const [newService, setNewService] = useState(''); 
  const [personnel, setPersonnel] = useState<StaffMember[]>([]);
  const [newVehicule, setNewVehicule] = useState<Vehicle>({ nom: '', marque: '', couleur: '#F97316', immatriculation: '', dimensions: { l: '', w: '', h: '' } });
  const [newTarif, setNewTarif] = useState<Tarif>({ service: '', prix: '' });
  const [promo, setPromo] = useState(() => loadFromMemory('promo', "BIENVENUE ! Votre première réception de colis direct est GRATUITE !"));

  useEffect(() => { 
    setPersonnel(initialStaffMembers.map(m => ({ id: m.id, name: m.name, role: m.role, avatar: m.avatar }))); 
  }, []);

  // SAUVEGARDE AUTOMATIQUE
  useEffect(() => { saveToMemory('nom', nom); }, [nom]);
  useEffect(() => { saveToMemory('adresseGps', adresseGps); }, [adresseGps]);
  useEffect(() => { saveToMemory('adresseInformelle', adresseInformelle); }, [adresseInformelle]);
  useEffect(() => { saveToMemory('description', description); }, [description]);
  useEffect(() => { saveToMemory('photoPreview', photoPreview); }, [photoPreview]);
  useEffect(() => { saveToMemory('vehicules', vehicules); }, [vehicules]);
  useEffect(() => { saveToMemory('services', services); }, [services]);
  useEffect(() => { saveToMemory('devise', devise); }, [devise]);
  useEffect(() => { saveToMemory('tarifs', tarifs); }, [tarifs]);
  useEffect(() => { saveToMemory('promo', promo); }, [promo]);

  useEffect(() => {
        const details: ServiceCardDetails = profile.service_card_details || {};
        setPromo(details.promo || "BIENVENUE ! Votre première réception de colis direct est GRATUITE !");
        setVehicules(details.vehicules || [{ nom: 'Van Utilitaire', marque: 'Toyota Hiace', couleur: '#F97316', immatriculation: 'LT 589-AI', dimensions: { l: 450, w: 180, h: 190 } }]);
        setTarifs(details.tarifs || [{ service: 'Réception Colis Standard (< 5kg)', prix: '1500' }, { service: 'Gardiennage / jour (après 7j)', prix: '500' }]);
        setDevise(details.devise || 'XAF');
    }, [profile]);

  // GESTIONNAIRES
  const handleEditToggle = () => {
        if (!isEditing) {
            // Créer une sauvegarde des états actuels
            setBackupData({ promo, vehicules, tarifs, devise });
            setIsEditing(true);
        }
    };

    const handleSaveChanges = async () => {
        setIsLoading(true);
        const newServiceCardDetails: ServiceCardDetails = { promo, vehicules, tarifs, devise };
        
        const { error } = await supabase
            .from('profiles_pro')
            .update({ service_card_details: newServiceCardDetails })
            .eq('id', profile.id);

        setIsLoading(false);
        if (error) {
            alert("Erreur lors de la sauvegarde : " + error.message);
        } else {
            alert("Modifications sauvegardées avec succès !");
            setIsEditing(false);
            setBackupData(null);
        }
    };

    const handleCancelChanges = () => {
        if (backupData) {
            setPromo(backupData.promo || '');
            setVehicules(backupData.vehicules || []);
            setTarifs(backupData.tarifs || []);
            setDevise(backupData.devise || 'XAF');
        }
        setIsEditing(false);
        setBackupData(null);
    };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setAdresseGps(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        },
        () => alert("Impossible d'accéder à votre position. Veuillez l'entrer manuellement.")
      );
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) { 
      setPhotoPreview(URL.createObjectURL(e.target.files[0])); 
    }
  };

  const handleAddItem = <T,>(list: T[], setList: (items: T[]) => void, newItem: T, setNewItem: (item: T) => void) => {
    if (typeof newItem === 'string' && (newItem as string).trim() !== '') { 
      setList([...list, (newItem as string).trim() as T]); 
      setNewItem('' as T); 
    }
    else if (typeof newItem === 'object' && newItem) {
      setList([...list, newItem]);
      if ('marque' in newItem) setNewVehicule({ nom: '', marque: '', couleur: '#10B981', immatriculation: '', dimensions: { l: '', w: '', h: '' } });
      if ('prix' in newItem) setNewTarif({ service: '', prix: '' });
    }
  };

  const handleRemoveItem = <T,>(list: T[], setList: (items: T[]) => void, index: number) => { 
    setList(list.filter((_, i) => i !== index)); 
  };

  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>, dim: string) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setNewVehicule(prev => ({ 
      ...prev, 
      dimensions: { 
        ...prev.dimensions, 
        [dim]: value 
      } 
    }));
  };

  // APERÇU MODERNE
  const renderPreviewCard = () => (
    <div className="font-sans bg-gradient-to-br from-white via-emerald-50/30 to-green-50/50 p-8 max-w-5xl mx-auto rounded-3xl shadow-2xl backdrop-blur-sm border border-white/20 overflow-hidden">
      <div className="relative h-64 rounded-2xl overflow-hidden mb-8 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10"></div>
        <div className="h-full bg-cover bg-center transform hover:scale-105 transition-transform duration-700" style={{backgroundImage: `url(${photoPreview})`}}></div>
        <div className="absolute bottom-4 left-6 z-20 text-white">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium">Point Relais Certifié</span>
          </div>
        </div>
      </div>
      
      <div className="relative">
        <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
          <Star className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent mb-2">{nom}</h1>
        <p className="text-slate-500 text-lg mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-500" />{adresseInformelle}</p>
        <p className="text-slate-700 text-lg leading-relaxed mb-8">{description}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-6"><Sprout className="text-emerald-500 h-7 w-7"/>Services Premium</h2>
            <div className="space-y-3">
              {services.map((s,i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-slate-700 font-medium">{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-6"><Truck className="text-emerald-500 h-7 w-7"/>Flotte Moderne</h2>
            <div className="space-y-4">
              {vehicules.map((v, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 hover:shadow-md transition-all duration-300">
                  <div className="relative">
                    <Car style={{color: v.couleur}} className="h-10 w-10 drop-shadow-lg"/>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-slate-800">{v.nom} <span className="text-slate-500 font-normal text-sm">{v.marque}</span></p>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Ruler className="h-3 w-3"/>{`L:${v.dimensions.l}cm × l:${v.dimensions.w}cm × H:${v.dimensions.h}cm`}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-6"><Users className="text-emerald-500 h-7 w-7"/>Équipe Experte</h2>
            <div className="grid grid-cols-2 gap-4">
              {personnel.map(p => (
                <div key={p.id} className="text-center group cursor-pointer">
                  <div className="relative mx-auto w-16 h-16 mb-3">
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                      <User className="h-8 w-8 text-white"/>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{p.name.split(' ')[0]}</p>
                  <p className="text-xs text-slate-500">{p.role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-6"><Package className="text-emerald-500 h-7 w-7"/>Tarifs ({devise})</h2>
            <div className="space-y-3">
              {tarifs.map((t,i) => (
                <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
                  <span className="text-slate-700 font-medium text-sm">{t.service}</span>
                  <span className="font-black text-emerald-600 text-lg">{new Intl.NumberFormat().format(parseInt(t.prix))}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]"></div>
            <div className="relative p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Sparkles className="h-6 w-6"/>
                </div>
                <h3 className="text-xl font-black">Offre Exceptionnelle</h3>
              </div>
              <p className="text-lg font-medium leading-relaxed">{promo}</p>
              <div className="absolute top-4 right-4 opacity-20">
                <Award className="h-16 w-16"/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
        <div className="relative space-y-8">
        {/* --- Bouton d'édition flottant et animé --- */}
        <div className="fixed top-24 right-4 md:right-8 z-40">
             <div className="relative flex flex-col items-center gap-3">
                <button
                    onClick={isEditing ? handleSaveChanges : handleEditToggle}
                    disabled={isLoading}
                    className={`flex items-center gap-2 font-bold py-4 px-5 rounded-full text-white shadow-xl transform transition-all duration-300 hover:scale-105
                    ${isEditing 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-r from-orange-500 to-amber-500'
                    }`}
                >
                    <AnimatePresence mode="wait">
                        <motion.div key={isEditing ? 'save' : 'edit'} initial={{opacity: 0, rotate: -30}} animate={{opacity: 1, rotate: 0}} exit={{opacity: 0, rotate: 30}}>
                            {isEditing ? <Save className="w-6 h-6"/> : <Edit className="w-6 h-6"/>}
                        </motion.div>
                    </AnimatePresence>
                     <AnimatePresence>
                        {isEditing && (
                            <motion.span initial={{width: 0, opacity: 0}} animate={{width: 'auto', opacity: 1}} exit={{width: 0, opacity: 0}}>
                                {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>

                <AnimatePresence>
                {isEditing && (
                    <motion.button 
                        initial={{y: -10, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: -10, opacity: 0}}
                        onClick={handleCancelChanges} 
                        className="bg-white text-gray-600 font-bold p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all">
                        <X className="w-5 h-5"/>
                    </motion.button>
                )}
                </AnimatePresence>
            </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
             {/* --- Flotte de véhicules & Tarifs (côte gauche) --- */}
            <div className="space-y-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border p-8">
                    <h4 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-6"><Truck className="text-orange-500 h-7 w-7"/>Flotte de Véhicules</h4>    
                              {/* VÉHICULES & SERVICES */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/40 p-8 space-y-8">
            <div>
              <h4 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-6"><Truck className="text-emerald-500 h-7 w-7"/>Flotte de Véhicules</h4>
              <div className="space-y-4">
                {vehicules.map((v, index) => (
                  <div key={index} className="group flex justify-between items-center bg-gradient-to-r from-slate-50 to-slate-100 hover:from-emerald-50 hover:to-green-50 p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Car style={{color: v.couleur}} className="h-10 w-10 drop-shadow-lg"/>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{v.nom} <span className="text-slate-500 font-medium">{v.marque}</span></p>
                        <p className="text-sm text-slate-500 flex items-center gap-1"><Ruler className="h-4 w-4"/>{`${v.dimensions.l}×${v.dimensions.w}×${v.dimensions.h}cm`}</p>
                      </div>
                    </div>
                    {isEditing && (
                      <button onClick={() => handleRemoveItem(vehicules, setVehicules, index)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all duration-300 p-2 hover:bg-red-50 rounded-xl">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {isEditing && (
                <div className="mt-6 p-6 border-2 border-dashed border-emerald-300 rounded-2xl bg-emerald-50/30 space-y-4 transition-all duration-500">
                  <h5 className="font-bold text-emerald-800 flex items-center gap-2"><PlusCircle className="h-5 w-5"/>Nouveau Véhicule</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input value={newVehicule.nom} onChange={(e) => setNewVehicule({...newVehicule, nom: e.target.value})} placeholder="Nom du véhicule" className="p-3 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"/>
                    <input value={newVehicule.marque} onChange={(e) => setNewVehicule({...newVehicule, marque: e.target.value})} placeholder="Marque" className="p-3 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"/>
                    <input value={newVehicule.immatriculation} onChange={(e) => setNewVehicule({...newVehicule, immatriculation: e.target.value})} placeholder="Immatriculation" className="p-3 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"/>
                    <ColorPalette selectedColor={newVehicule.couleur} onSelect={(color) => setNewVehicule({...newVehicule, couleur: color})} />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-3 block flex items-center gap-2"><Ruler className="h-4 w-4"/>Dimensions (cm)</label>
                    <div className="grid grid-cols-3 gap-3">
                      <input type="number" value={newVehicule.dimensions.l} onChange={(e) => handleDimensionChange(e, 'l')} placeholder="Longueur" className="p-3 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"/>
                      <input type="number" value={newVehicule.dimensions.w} onChange={(e) => handleDimensionChange(e, 'w')} placeholder="Largeur" className="p-3 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"/>
                      <input type="number" value={newVehicule.dimensions.h} onChange={(e) => handleDimensionChange(e, 'h')} placeholder="Hauteur" className="p-3 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"/>
                    </div>
                  </div>
                  <button onClick={() => handleAddItem(vehicules, setVehicules, newVehicule, setNewVehicule)} className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-2xl p-4 font-bold flex items-center justify-center gap-3 shadow-lg transition-all duration-300 transform hover:scale-105">
                    <PlusCircle className="h-6 w-6" />Ajouter le Véhicule
                  </button>
                </div>
              )}
            </div>

            {/* SERVICES */}
            <div>
              <h4 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-6"><Sprout className="text-emerald-500 h-7 w-7"/>Services Complémentaires</h4>
              <div className="space-y-3">
                {services.map((s, index) => (
                  <div key={index} className="group flex justify-between items-center bg-gradient-to-r from-slate-50 to-slate-100 hover:from-emerald-50 hover:to-green-50 p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="font-medium text-slate-700">{s}</span>
                    </div>
                    {isEditing && (
                      <button onClick={() => handleRemoveItem(services, setServices, index)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all duration-300 p-2 hover:bg-red-50 rounded-xl">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {isEditing && (
                <div className="mt-4 flex gap-3">
                  <input value={newService} onChange={(e) => setNewService(e.target.value)} placeholder="Nouveau service premium..." className="flex-grow p-3 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"/>
                  <button onClick={() => handleAddItem(services, setServices, newService, setNewService)} className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-6 rounded-xl transition-all duration-300 flex items-center shadow-lg transform hover:scale-105">
                    <PlusCircle className="h-6 w-6"/>
                  </button>
                </div>
              )}
            </div>
          </div>

          <h4 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-6"><Package className="text-orange-500 h-7 w-7"/>Grille Tarifaire</h4>
                     <select disabled={!isEditing} value={devise} onChange={e => setDevise(e.target.value)}
                        className={`font-bold border-2 rounded-lg p-2 mb-4 ${!isEditing ? 'bg-gray-100' : 'border-orange-300'}`}>
                         <option>XAF</option>
                         <option>EUR</option>
                     </select>
            <div className="space-y-3">
              {tarifs.map((t, index) => (
                <div key={index} className="group flex justify-between items-center p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 hover:from-emerald-50 hover:to-green-50 border border-slate-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-lg">
                  <span className="text-slate-700 font-medium group-hover:text-slate-800 transition-colors">{t.service}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-xl text-emerald-600 group-hover:text-emerald-700 transition-colors">{new Intl.NumberFormat().format(parseInt(t.prix))}</span>
                    {isEditing && (
                      <button onClick={() => handleRemoveItem(tarifs, setTarifs, index)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all duration-300 p-2 hover:bg-red-50 rounded-xl">
                        <X className="w-5 h-5"/>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {isEditing && (
              <div className="mt-6 pt-6 border-t-2 border-dashed border-emerald-300 space-y-4">
                <h5 className="font-bold text-emerald-800">Nouveau Tarif</h5>
                <div className="flex gap-3">
                  <input value={newTarif.service} onChange={(e) => setNewTarif({...newTarif, service: e.target.value})} placeholder="Description du service..." className="flex-grow p-3 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"/>
                  <input value={newTarif.prix} type="number" onChange={(e) => setNewTarif({...newTarif, prix: e.target.value})} placeholder="Prix" className="w-32 p-3 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"/>
                  <button onClick={() => handleAddItem(tarifs, setTarifs, newTarif, setNewTarif)} className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-6 rounded-xl transition-all duration-300 flex items-center shadow-lg transform hover:scale-105">
                    <PlusCircle className="h-6 w-6"/>
                  </button>
                </div>
              </div>
            )}

                </div>
            </div>
            
            {/* --- Personnel ou Message Freelance & Promo (côte droite) --- */}
            <div className="space-y-8">
                {profile.account_type === 'AGENCY' && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border p-8">
                         <h4 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-6"><Users className="text-orange-500 h-7 w-7"/>Notre Équipe</h4>
                         <div className="grid grid-cols-2 gap-4">
                           {personnel.map(p => (
                             <div key={p.id} className="text-center group cursor-pointer">
                               <div className="relative mx-auto w-16 h-16 mb-3">
                                 <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                                   <User className="h-8 w-8 text-white"/>
                                 </div>
                                 <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                                   <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                 </div>
                               </div>
                               <p className="font-bold text-slate-800 text-sm">{p.name.split(' ')[0]}</p>
                               <p className="text-xs text-slate-500">{p.role}</p>
                             </div>
                           ))}
                         </div>
                    </div>
                )}
                {profile.account_type === 'FREELANCE' && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border p-8 text-center">
                         <User className="w-12 h-12 mx-auto text-orange-400 mb-4"/>
                         <h4 className="text-xl font-bold text-slate-800">Gestionnaire Unique</h4>
                         <p className="text-slate-500 mt-2">En tant que Freelance, vous êtes le seul gestionnaire. Pour ajouter du personnel, passez à un compte Agence.</p>
                    </div>
                )}
                 <div className="relative overflow-hidden rounded-3xl shadow-xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-8 text-white min-h-[250px] flex flex-col">
                     <h3 className="text-2xl font-black flex items-center gap-3 mb-4"><Award className="w-7 h-7"/>Offres Spéciales</h3>
                     <textarea 
                       value={promo} 
                       onChange={(e) => setPromo(e.target.value)} 
                       readOnly={!isEditing} 
                       className={`flex-grow w-full p-4 rounded-xl resize-none font-medium placeholder-white/70 transition-all ${
                         isEditing 
                           ? 'bg-white/20 border-2 border-white/30 focus:border-white/50' 
                           : 'bg-white/10 border-none cursor-not-allowed'
                       }`}
                       placeholder="Décrivez vos offres spéciales..."
                     />
                 </div>
            </div>
        </div>

        {/* Bouton d'aperçu */}
        <div className="text-center">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto"
          >
            <Eye className="h-6 w-6" />
            {showPreview ? 'Masquer l\'Aperçu' : 'Voir l\'Aperçu Final'}
          </button>
        </div>

        {/* Aperçu conditionnel */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="mt-12"
            >
              {renderPreviewCard()}
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
};
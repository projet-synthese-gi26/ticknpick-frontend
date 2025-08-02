"use client";

import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Camera, User, Package, Tag, PlusCircle, Trash2, Car, Palette, Fingerprint, Ruler, Edit, Save, X, Eye, Users, ShieldCheck, Clock, Sprout, Sparkles, Star, Award } from 'lucide-react';

// INTERFACES
interface StaffMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

const initialStaffMembers = [
  { id: 'emp-001', name: 'Essono Cédric', avatar: '/avatars/essono.png', role: 'Manutentionnaire' },
  { id: 'emp-002', name: 'Mballa Alice', avatar: '/avatars/mballa.png', role: 'Responsable Stock' },
  { id: 'emp-003', name: 'Fouda Martin', avatar: '/avatars/fouda.png', role: 'Préparateur Commandes' },
  { id: 'emp-004', name: 'Ngono Sandrine', avatar: '/avatars/ngono.png', role: 'Accueil Client' }
];

// STORAGE SIMULATION (remplace localStorage)
let memoryStorage = {};

const saveToMemory = (key, data) => { memoryStorage[key] = JSON.stringify(data); };
const loadFromMemory = (key, defaultValue) => { 
  try { return memoryStorage[key] ? JSON.parse(memoryStorage[key]) : defaultValue; } 
  catch { return defaultValue; }
};

// SOUS-COMPOSANTS
const InputField = ({ label, value, onChange, placeholder, icon: Icon, readOnly }) => (
  <div className="group">
    <label className="block text-sm font-bold text-slate-700 mb-2 transition-colors group-focus-within:text-emerald-600">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        {Icon && <Icon className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-emerald-500" />}
      </div>
      <input type="text" value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly} className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm ${readOnly ? 'bg-slate-50/80 border-slate-200 cursor-not-allowed' : 'bg-white/80 border-slate-200 hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20'} shadow-sm`} />
    </div>
  </div>
);

const ColorPalette = ({ selectedColor, onSelect, readOnly }) => {
  const colors = ['#FFFFFF', '#1F2937', '#EF4444', '#F97316', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">Couleur</label>
      <div className="flex flex-wrap gap-2">
        {colors.map(color => (
          <button key={color} type="button" onClick={() => !readOnly && onSelect(color)} className={`h-10 w-10 rounded-full border-4 transition-all duration-200 shadow-lg ${selectedColor === color ? 'border-emerald-500 scale-110 shadow-emerald-500/30' : 'border-white hover:scale-105'} ${!readOnly ? 'cursor-pointer' : 'cursor-not-allowed'}`} style={{ backgroundColor: color }} disabled={readOnly} />
        ))}
      </div>
    </div>
  );
};

const RelayPointServiceCard = () => {
  // ÉTATS PERSISTANTS
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [backupData, setBackupData] = useState(null);

  const [nom, setNom] = useState(() => loadFromMemory('nom', "Pick & Drop - Agence du Lac"));
  const [adresseGps, setAdresseGps] = useState(() => loadFromMemory('adresseGps', ""));
  const [adresseInformelle, setAdresseInformelle] = useState(() => loadFromMemory('adresseInformelle', "Face à l'hôtel de ville, grand portail vert"));
  const [description, setDescription] = useState(() => loadFromMemory('description', "Votre point relais de confiance au coeur de la ville. Nous combinons sécurité, rapidité et un service client exceptionnel pour tous vos besoins logistiques."));
  const [photoPreview, setPhotoPreview] = useState(() => loadFromMemory('photoPreview', "/images/relay-point-placeholder.jpg"));

  const [vehicules, setVehicules] = useState(() => loadFromMemory('vehicules', [{ nom: 'Van Utilitaire', marque: 'Toyota Hiace', couleur: '#10B981', immatriculation: 'LT 589-AI', dimensions: { l: 450, w: 180, h: 190 } }]));
  const [newVehicule, setNewVehicule] = useState({ nom: '', marque: '', couleur: '#10B981', immatriculation: '', dimensions: { l: '', w: '', h: '' } });
  
  const [services, setServices] = useState(() => loadFromMemory('services', ['Aide au chargement sur demande', 'Emballages éco-responsables', 'Stockage sécurisé 24/7']));
  const [newService, setNewService] = useState('');
  
  const [personnel, setPersonnel] = useState([]);
  const [devise, setDevise] = useState(() => loadFromMemory('devise', 'XAF'));
  const [tarifs, setTarifs] = useState(() => loadFromMemory('tarifs', [{ service: 'Réception Colis Standard (< 5kg)', prix: '1500' }, { service: 'Réception Colis Large (5-15kg)', prix: '3000' }, { service: 'Gardiennage / jour (après 7 jours)', prix: '500' }]));
  const [newTarif, setNewTarif] = useState({ service: '', prix: '' });
  const [promo, setPromo] = useState(() => loadFromMemory('promo', "BIENVENUE ! Votre première réception de colis direct est GRATUITE !"));

  useEffect(() => { setPersonnel(initialStaffMembers.map(m => ({ id: m.id, name: m.name, role: m.role }))); }, []);

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

  // GESTIONNAIRES
  const handleEditToggle = () => {
    if (!isEditing) { setBackupData({ nom, adresseGps, adresseInformelle, description, vehicules, services, tarifs, promo, devise }); }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => { setIsEditing(false); setBackupData(null); };

  const handleCancelChanges = () => {
    if (backupData) {
      setNom(backupData.nom); setAdresseGps(backupData.adresseGps); setAdresseInformelle(backupData.adresseInformelle);
      setDescription(backupData.description); setVehicules(backupData.vehicules); setServices(backupData.services);
      setTarifs(backupData.tarifs); setPromo(backupData.promo); setDevise(backupData.devise);
    }
    setIsEditing(false); setBackupData(null);
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

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) { setPhotoPreview(URL.createObjectURL(e.target.files[0])); }
  };

  const handleAddItem = (list, setList, newItem, setNewItem) => {
    if (typeof newItem === 'string' && newItem.trim() !== '') { setList([...list, newItem.trim()]); setNewItem(''); }
    else if (typeof newItem === 'object' && newItem) {
      setList([...list, newItem]);
      if ('marque' in newItem) setNewVehicule({ nom: '', marque: '', couleur: '#10B981', immatriculation: '', dimensions: { l: '', w: '', h: '' } });
      if ('prix' in newItem) setNewTarif({ service: '', prix: '' });
    }
  };

  const handleRemoveItem = (list, setList, index) => { setList(list.filter((_, i) => i !== index)); };

  const handleDimensionChange = (e, dim) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setNewVehicule(prev => ({ ...prev, dimensions: { ...prev.dimensions, [dim]: value } }));
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
                  <span className="font-black text-emerald-600 text-lg">{new Intl.NumberFormat().format(t.prix)}</span>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50/20 p-4 sm:p-8">
      {/* HEADER MODERNE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-white/40">
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Carte de Service</h2>
          <p className="text-slate-600 font-medium">Interface de gestion de votre point relais</p>
        </div>
        <div className="flex gap-3">
          {!isEditing && (
            <button onClick={() => setShowPreview(true)} className="group flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 px-6 rounded-2xl hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
              <Eye className="h-5 w-5 group-hover:text-emerald-500 transition-colors"/> Aperçu
            </button>
          )}
          
          {isEditing ? (
            <>
              <button onClick={handleCancelChanges} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-2xl shadow-lg transition-all duration-300">
                <X className="h-5 w-5"/> Annuler
              </button>
              <button onClick={handleSaveChanges} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105">
                <Save className="h-5 w-5"/> Sauvegarder
              </button>
            </>
          ) : (
            <button onClick={handleEditToggle} className="flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-green-100 hover:from-emerald-200 hover:to-green-200 text-emerald-800 font-bold py-3 px-6 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105">
              <Edit className="h-5 w-5"/> Modifier
            </button>
          )}
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="space-y-8">
        {/* SECTION HERO */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/40 overflow-hidden">
          <div className="relative h-80 bg-cover bg-center group" style={{ backgroundImage: `url(${photoPreview})` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
            {isEditing && (
              <label htmlFor="photo-upload" className="absolute bottom-6 right-6 cursor-pointer bg-emerald-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl shadow-xl hover:bg-emerald-600 transition-all duration-300 flex items-center gap-3 transform hover:scale-105">
                <Camera className="h-5 w-5" /> Changer la photo
                <input id="photo-upload" type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" />
              </label>
            )}
            <div className="absolute bottom-6 left-6 text-white">
              <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md px-4 py-2 rounded-full">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Ouvert 24/7</span>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} readOnly={!isEditing} className={`text-4xl font-black w-full border-b-4 bg-transparent outline-none transition-all duration-300 ${isEditing ? 'border-emerald-300 focus:border-emerald-500 text-slate-800' : 'border-transparent text-slate-800'}`} placeholder="Nom du point relais" />
            
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} readOnly={!isEditing} className={`mt-6 text-slate-600 text-lg w-full h-32 border-2 rounded-2xl p-4 transition-all duration-300 resize-none ${isEditing ? 'bg-white/80 border-emerald-200 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500' : 'bg-slate-50/50 border-transparent cursor-not-allowed'}`} placeholder="Décrivez votre point relais..." />
            
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Adresse GPS</label>
                <div className="flex gap-3">
                  <input type="text" value={adresseGps} onChange={(e) => setAdresseGps(e.target.value)} readOnly={!isEditing} placeholder="Lat, Long" className={`flex-grow px-4 py-3 rounded-xl border-2 transition-all duration-300 ${!isEditing ? 'bg-slate-50/50 border-slate-200 cursor-not-allowed' : 'bg-white/80 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20'}`}/>
                  {isEditing && (
                    <button onClick={handleGetLocation} className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-300 shadow-lg transform hover:scale-105">
                      <MapPin className="h-6 w-6"/>
                    </button>
                  )}
                </div>
              </div>
              <InputField label="Adresse Descriptive" value={adresseInformelle} onChange={(e) => setAdresseInformelle(e.target.value)} readOnly={!isEditing} placeholder="Ex: En face de la mairie" icon={MapPin} />
            </div>
          </div>
        </div>

        {/* SECTIONS FONCTIONNALITÉS */}
        <div className="grid lg:grid-cols-3 gap-8">
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

          {/* ÉQUIPE */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/40 p-8">
            <h4 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3"><Users className="text-emerald-500 h-7 w-7"/>Notre Équipe</h4>
            <p className="text-xs text-slate-500 mb-6 bg-slate-100 px-3 py-2 rounded-lg">Synchronisé depuis le module Personnel</p>
            <div className="space-y-4">
              {personnel.map(p => (
                <div key={p.id} className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-300 hover:shadow-lg cursor-pointer">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                      <User className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white">
                      <div className="w-1 h-1 bg-white rounded-full mx-auto mt-1 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{p.name}</p>
                    <p className="text-sm text-slate-500 group-hover:text-slate-600 transition-colors">{p.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TARIFS & PROMOTIONS */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* GRILLE TARIFAIRE */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/40 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><Package className="text-emerald-500 h-7 w-7"/>Grille Tarifaire</h3>
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-slate-700">Devise:</label>
                <select id="devise" value={devise} onChange={(e) => setDevise(e.target.value)} disabled={!isEditing} className={`px-4 py-2 rounded-xl border-2 font-bold transition-all duration-300 ${!isEditing ? 'bg-slate-100 border-slate-200 cursor-not-allowed' : 'bg-white border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20'}`}>
                  <option>XAF</option><option>EUR</option><option>USD</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-3">
              {tarifs.map((t, index) => (
                <div key={index} className="group flex justify-between items-center p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 hover:from-emerald-50 hover:to-green-50 border border-slate-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-lg">
                  <span className="text-slate-700 font-medium group-hover:text-slate-800 transition-colors">{t.service}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-xl text-emerald-600 group-hover:text-emerald-700 transition-colors">{new Intl.NumberFormat().format(t.prix)}</span>
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

          {/* PROMOTIONS */}
          <div className="relative overflow-hidden rounded-3xl shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_60%)]"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative p-8 text-white min-h-[300px] flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                  <Sparkles className="h-7 w-7 animate-pulse"/>
                </div>
                <h3 className="text-2xl font-black">Offres Spéciales</h3>
              </div>
              
              <textarea value={promo} onChange={(e) => setPromo(e.target.value)} readOnly={!isEditing} className={`flex-grow w-full bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-2xl p-6 text-lg font-medium leading-relaxed placeholder-white/70 resize-none transition-all duration-300 ${isEditing ? 'focus:ring-4 focus:ring-white/50 focus:border-white/50' : 'cursor-not-allowed'}`} placeholder="Décrivez votre offre spéciale..." rows={6} />
              
              <div className="absolute bottom-4 right-6 opacity-20">
                <Award className="h-20 w-20 animate-bounce"/>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL APERÇU */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowPreview(false)}>
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex justify-end p-4">
              <button onClick={() => setShowPreview(false)} className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-3 rounded-2xl transition-all duration-300 transform hover:scale-110">
                <X className="h-6 w-6"/>
              </button>
            </div>
            <div className="px-4 pb-4">
              {renderPreviewCard()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelayPointServiceCard;
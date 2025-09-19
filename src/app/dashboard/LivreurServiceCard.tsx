// FICHIER: src/app/dashboard/LivreurServiceCard.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from './page';
import { motion } from 'framer-motion';
import { Award, Edit, Save, X, Sparkles, User, MapPin, Loader2, Star, Truck, Plus, CheckCircle } from 'lucide-react';

// Interfaces pour les données de la carte
interface ServiceCardData {
  id?: string;
  tagline: string | null;
  bio: string | null;
  card_photo_url: string | null;
  years_of_experience: number | null;
  special_services: string[];
  operating_zones: string[];
  rating: number | null;
  specific_attributes: {} | null;
}

// Sous-composant pour les "tags" éditables (Services, Zones)
const TagInput = ({ tags, setTags, placeholder, readOnly }: { tags: string[]; setTags: (tags: string[]) => void; placeholder: string; readOnly: boolean; }) => {
    const [inputValue, setInputValue] = useState('');

    const handleAddTag = () => {
      if (inputValue.trim() && !tags.includes(inputValue.trim())) {
        setTags([...tags, inputValue.trim()]);
        setInputValue('');
      }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    if (readOnly) {
        return (
            <div className="flex flex-wrap gap-2">
                {tags.length > 0 ? tags.map(tag => (
                    <span key={tag} className="bg-orange-100 text-orange-800 text-xs font-semibold px-3 py-1.5 rounded-full">{tag}</span>
                )) : <p className="text-sm text-gray-500 italic">Non spécifié</p>}
            </div>
        );
    }

    return (
        <div>
            <div className="flex gap-2">
                <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder={placeholder} onKeyDown={e => {if (e.key === 'Enter') {e.preventDefault(); handleAddTag();}}} className="flex-grow p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-500" />
                <button type="button" onClick={handleAddTag} className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-colors"><Plus className="w-5 h-5"/></button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                    <div key={tag} className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="text-orange-600 hover:text-orange-800"><X className="w-3 h-3" /></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function LivreurServiceCardPage({ profile }: { profile: UserProfile }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [cardData, setCardData] = useState<ServiceCardData | null>(null);

    const fetchCardData = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('service_cards').select('*').eq('id', profile.id).single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = row not found, ce qui est normal la première fois
          console.error("Erreur de chargement de la carte de service:", error);
        }
        
        if (data) {
            setCardData(data);
        } else {
            // Initialise une carte vide si aucune n'est trouvée dans la BDD
            setCardData({ 
              tagline: '', bio: '', card_photo_url: '', years_of_experience: 0, 
              special_services: [], operating_zones: [], rating: 4.5, specific_attributes: {} 
            });
        }
        setIsLoading(false);
    }, [profile.id]);

    useEffect(() => { fetchCardData(); }, [fetchCardData]);

    const handleSave = async () => {
      if (!cardData) return;
      setIsSaving(true);
      
      try {
        const { error } = await supabase.from('service_cards').upsert({
          id: profile.id, // La clé primaire est essentielle pour `upsert`
          tagline: cardData.tagline,
          bio: cardData.bio,
          card_photo_url: cardData.card_photo_url,
          years_of_experience: cardData.years_of_experience,
          special_services: cardData.special_services,
          operating_zones: cardData.operating_zones,
          specific_attributes: cardData.specific_attributes,
          updated_at: new Date().toISOString(), // Met à jour la date de modification
        });

        if (error) throw error;

        setIsEditing(false); // Repasse en mode vue
        alert("Carte de service sauvegardée avec succès !");

      } catch (error: any) {
        console.error("Erreur lors de la sauvegarde :", error);
        alert("Une erreur est survenue lors de la sauvegarde : " + error.message);
      } finally {
        setIsSaving(false); // Termine l'état de sauvegarde
      }
    };

const handleInputChange = (field: keyof ServiceCardData, value: any) => {
    setCardData(prev => prev ? { ...prev, [field]: value } : null);
};
    
    if (isLoading || !cardData) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>;
    }
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Ma Carte de Service</h1>
                    <p className="text-gray-500 mt-1">Mettez en valeur vos points forts pour attirer plus de clients.</p>
                </div>
                {isEditing ? (
                    <div className="flex gap-2 self-end">
                        <button onClick={() => { setIsEditing(false); fetchCardData(); }} className="flex items-center gap-1.5 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300"><X className="w-4 h-4"/> Annuler</button>
                        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-1.5 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 min-w-[120px] justify-center">{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}{isSaving ? '' : 'Sauvegarder'}</button>
                    </div>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="flex items-center self-end gap-1.5 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 shadow-md"><Edit className="w-4 h-4"/> Modifier la carte</button>
                )}
            </div>
            
            <motion.div
                key={isEditing ? 'edit-livreur' : 'view-livreur'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-8 grid grid-cols-1 md:grid-cols-3 gap-8 border-t-4 border-orange-500"
            >
                <div className="md:col-span-1 text-center flex flex-col items-center">
                    <Truck className="w-24 h-24 text-white bg-orange-500 p-4 rounded-full border-4 border-white shadow-md mb-4"/>
                    <h2 className="text-2xl font-bold text-gray-900">{profile.manager_name}</h2>
                    
                    {isEditing ? (
                      <input type="text" value={cardData.tagline || ''} onChange={(e) => handleInputChange('tagline', e.target.value)} placeholder="Ex: Livreur express, Yaoundé" className="w-full text-center mt-1 p-2 bg-orange-50 rounded-lg text-orange-700 focus:ring-2 focus:ring-orange-300"/>
                    ) : (
                      <p className="text-orange-600 font-semibold mt-1 h-8 flex items-center justify-center">{cardData.tagline || "Votre slogan ici"}</p>
                    )}

                    <div className="flex items-center justify-center gap-1 text-yellow-500 mt-3">
                        {[...Array(5)].map((_, i) => <Star key={i} className={`w-5 h-5 ${i < Math.round(cardData.rating || 0) ? 'fill-current' : ''}`}/>)}
                        <span className="text-gray-600 font-bold ml-1">{cardData.rating}</span>
                    </div>

                    <div className="mt-6 pt-6 border-t w-full">
                        <h4 className="font-semibold mb-2 text-gray-700">Mon Véhicule</h4>
                        <p className="text-sm text-gray-600">{profile.vehicle_type} - {profile.vehicle_brand}</p>
                        <p className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">{profile.vehicle_registration}</p>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <div>
                        <h3 className="font-bold flex items-center gap-2 mb-2 text-gray-800"><User className="w-5 h-5 text-orange-500"/> À Propos de moi</h3>
                        {isEditing ? (
                          <textarea value={cardData.bio || ''} onChange={(e) => handleInputChange('bio', e.target.value)} placeholder="Parlez de votre ponctualité, de votre soin des colis..." className="w-full h-24 p-2 text-sm border rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-300"/>
                        ) : (
                          <p className="text-gray-600 text-sm leading-relaxed min-h-[5rem]">{cardData.bio || "Aucune biographie."}</p>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold flex items-center gap-2 mb-2 text-gray-800"><Sparkles className="w-5 h-5 text-orange-500"/> Mes Atouts</h3>
                        <TagInput tags={cardData.special_services} setTags={(tags) => handleInputChange('special_services', tags)} placeholder="Ajouter un atout (ex: Colis fragiles)" readOnly={!isEditing}/>
                    </div>
                    <div>
                        <h3 className="font-bold flex items-center gap-2 mb-2 text-gray-800"><MapPin className="w-5 h-5 text-orange-500"/> Zones d'Opération</h3>
                        <TagInput tags={cardData.operating_zones} setTags={(tags) => handleInputChange('operating_zones', tags)} placeholder="Ajouter une zone (ex: Mvan)" readOnly={!isEditing}/>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                            <h4 className="font-semibold text-sm text-gray-700">Années d'expérience</h4>
                            {isEditing ? (
                              <input type="number" min="0" value={cardData.years_of_experience || 0} onChange={(e) => handleInputChange('years_of_experience', parseInt(e.target.value))} className="w-full text-lg font-bold p-2 bg-gray-50 rounded-lg focus:ring-2 focus:ring-orange-300"/>
                            ) : (
                              <p className="text-lg font-bold text-gray-900">{cardData.years_of_experience || 0} ans</p>
                            )}
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-gray-700">Statut</h4>
                            <div className="flex items-center gap-2 text-green-600 mt-2">
                                <CheckCircle className="w-5 h-5"/>
                                <span className="font-semibold text-sm">Vérifié & Actif</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
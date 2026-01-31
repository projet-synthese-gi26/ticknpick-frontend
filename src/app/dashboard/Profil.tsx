'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from './page';
import ProfilePersonalInfo from './ProfilePers';
import ProfileBusinessInfo from './ProfileBus';
import ProfileRelayManager from './ProfileRelay';
import { Toaster } from 'react-hot-toast';
import apiClient from '@/services/apiClient'; // Nécessaire pour fetch les infos Owner/Agence custom
import { agencyService } from '@/services/agencyService';

interface ProfilePageProps {
  profile: UserProfile;
  onUpdate: () => void;
}

export interface EmployerInfo {
  agencyName: string;
  agencyAddress: string;
  ownerName: string;
  ownerPhone: string;
}

export default function ProfilePage({ profile, onUpdate }: ProfilePageProps) {
  const [formData, setFormData] = useState<UserProfile>(profile);
  
  // États spécifiques pour la logique métier demandée
  const [employerInfo, setEmployerInfo] = useState<EmployerInfo | null>(null);
  const [loadingExtras, setLoadingExtras] = useState(false);

  // Synchronisation du profil
  useEffect(() => {
     setFormData(profile);
  }, [profile]);

  // Détermination précise du Rôle (Logique Centrale)
  const roleType = useMemo(() => {
    // Si c'est un EMPLOYEE explicitement
    if (profile.businessActorType === 'EMPLOYEE' || profile.role?.includes('EMPLOYEE')) {
        return 'EMPLOYEE';
    }
    
    // Si c'est une Agence (Propriétaire)
    if (profile.account_type === 'AGENCY' || profile.businessActorType === 'AGENCY_OWNER') {
        return 'AGENCY_OWNER';
    }

    // Si c'est un Freelance / Propriétaire de Relais
    if (profile.account_type === 'FREELANCE' || profile.businessActorType === 'RELAY_OWNER') {
        return 'RELAY_OWNER';
    }

    // Par défaut
    return 'CLIENT';
  }, [profile]);


  // Effet pour charger les infos de l'Agence et du Propriétaire SI c'est un employé
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
        if (roleType === 'EMPLOYEE' && profile.agency_id) {
            setLoadingExtras(true);
            try {
                // 1. Récupérer l'Agence
                const agencyData = await apiClient<any>(`/api/agencies/${profile.agency_id}`, 'GET');
                
                // 2. Récupérer le Propriétaire (User) de l'agence
                let ownerName = "Inconnu";
                let ownerPhone = "";
                
                if (agencyData.owner_id || agencyData.ownerId) {
                    const oid = agencyData.owner_id || agencyData.ownerId;
                    try {
                        const ownerUser = await apiClient<any>(`/api/users/${oid}`, 'GET');
                        ownerName = ownerUser.name || ownerUser.manager_name;
                        ownerPhone = ownerUser.phoneNumber || ownerUser.phone_number;
                    } catch (err) {
                        console.warn("Impossible de charger les infos propriétaire", err);
                    }
                }

                setEmployerInfo({
                    agencyName: agencyData.commercial_name || agencyData.commercialName || "Agence",
                    agencyAddress: agencyData.address || "Adresse non spécifiée",
                    ownerName: ownerName,
                    ownerPhone: ownerPhone
                });

            } catch (e) {
                console.error("Erreur chargement détails employé", e);
            } finally {
                setLoadingExtras(false);
            }
        }
    };

    fetchEmployeeDetails();
  }, [roleType, profile.agency_id]);


  // Label pour l'affichage du titre
  const getRoleLabel = () => {
      switch(roleType) {
          case 'RELAY_OWNER': return 'Freelance (Propriétaire Point)';
          case 'AGENCY_OWNER': return 'Propriétaire Agence';
          case 'EMPLOYEE': return 'Employé / Staff';
          case 'CLIENT': return 'Client';
          default: return 'Utilisateur';
      }
  };

  return (
    <div className="min-h-screen bg-transparent p-6 transition-colors duration-300">
        <Toaster position="top-right" reverseOrder={false} />
        
        <div className="max-w-7xl mx-auto space-y-8 relative animate-fadeIn">
            
            {/* Header Global */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-500 bg-clip-text text-transparent mb-2">
                  Mon Profil {getRoleLabel()}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">Gérez vos informations personnelles et votre activité</p>
            </div>

            {/* BLOC 1 : Infos Personnelles */}
            {/* Si c'est un employé, on passe employerInfo pour affichage en lecture seule */}
            <ProfilePersonalInfo 
                formData={formData} 
                setFormData={setFormData} 
                onUpdate={onUpdate}
                isEditing={false} // État initial géré en interne, mais prop requise
                setIsEditing={() => {}}
                employerInfo={employerInfo} 
                isLoadingExtras={loadingExtras}
            />

            {/* BLOC 2 : Infos Business (Point Relais ou Agence) */}
            {/* Condition stricte: SEULEMENT si Propriétaire Agence ou Freelance. */}
            {/* Les employés NE VOIENT PAS ce bloc, même s'ils ont un point relais assigné */}
            {(roleType === 'RELAY_OWNER' || roleType === 'AGENCY_OWNER') && (
                <div className="mt-8 animate-in slide-in-from-bottom-5 duration-500">
                    <ProfileBusinessInfo 
                        profile={profile} 
                        onUpdate={onUpdate} 
                        // On passe le rôle exact calculé ici pour aider le composant enfant
                        overrideRole={roleType}
                    />
                </div>
            )}

            {/* BLOC 3 : Gestion Réseau Agence (Spécifique Agence Owner) */}
            {(roleType === 'AGENCY_OWNER') && (
                <div className="mt-8 animate-in slide-in-from-bottom-5 duration-700">
                    <ProfileRelayManager />
                </div>
            )}
        </div>
    </div>
  );
}
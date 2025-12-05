'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from './page';
import ProfilePersonalInfo from './ProfilePers';
import ProfileBusinessInfo from './ProfileBus';
import ProfileRelayManager from './ProfileRelay';
import { Toaster } from 'react-hot-toast'; // Import du Toaster

interface ProfilePageProps {
  profile: UserProfile;
  onUpdate: () => void;
}

export default function ProfilePage({ profile, onUpdate }: ProfilePageProps) {
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(profile);

  useEffect(() => {
     setFormData(profile);
  }, [profile]);

  const userRole = useMemo(() => {
    if (profile.account_type !== 'CLIENT' && profile.businessActorType) {
        return profile.businessActorType; 
    }
    if (['FREELANCE', 'AGENCY', 'LIVREUR'].includes(profile.account_type)) {
        return profile.account_type; 
    }
    return 'CLIENT';
  }, [profile]);

  const getRoleLabel = (role: string) => {
      switch(role) {
          case 'FREELANCE': return 'Freelance';
          case 'AGENCY': return 'Agence';
          case 'DELIVERER': 
          case 'LIVREUR': return 'Livreur';
          default: return 'Client';
      }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-black p-6 transition-colors duration-300">
        <Toaster position="top-right" reverseOrder={false} />
        
        <div className="max-w-7xl mx-auto space-y-8 relative animate-fadeIn">
            
            {/* Header Global */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-500 bg-clip-text text-transparent mb-2">
                  Mon Profil {getRoleLabel(userRole)}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">Gérez vos informations personnelles et votre activité</p>
            </div>

            {/* BLOC 1 : Infos Personnelles */}
            <ProfilePersonalInfo 
                formData={formData} 
                setFormData={setFormData} 
                onUpdate={onUpdate}
                isEditing={isEditingPersonal}
                setIsEditing={setIsEditingPersonal}
            />

            {/* BLOC 2 : Infos Business */}
            <div className="mt-8">
                <ProfileBusinessInfo 
                    profile={profile as any} 
                    onUpdate={onUpdate} 
                />
            </div>

            {/* BLOC 3 : Gestion Points Relais (Agence) */}
            {(userRole === 'AGENCY') && (
                <div className="mt-8">
                    <ProfileRelayManager />
                </div>
            )}
        </div>
    </div>
  );
}
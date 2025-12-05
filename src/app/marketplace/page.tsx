// FICHIER: src/app/marketplace/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Filter, Star, User, Phone, MapPin, Award, Package, Eye, 
    X, Loader2, MessageCircle, Mail, Truck, Store, Briefcase
} from 'lucide-react';
import NavbarHome from '@/components/NavbarHome';
import { marketplaceService, MarketplaceProfile } from '@/services/marketplaceService';

// --- COMPOSANTS UI ---

const RatingStars = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star 
                key={star} 
                className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} 
            />
        ))}
    </div>
);

const ProfileCard = ({ profile, onClick }: { profile: MarketplaceProfile; onClick: () => void }) => {
    // Couleur Badge Type
    const typeStyles = {
        'LIVREUR': "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
        'FREELANCE': "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
        'AGENCE': "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
    };

    return (
        <motion.div 
            layoutId={profile.id}
            className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
            onClick={onClick}
            whileHover={{ y: -5 }}
        >
            {/* Header / Cover */}
            <div className="h-24 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 relative">
                <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold border ${typeStyles[profile.type] || typeStyles['FREELANCE']} uppercase tracking-wider shadow-sm`}>
                    {profile.type}
                </div>
            </div>

            {/* Avatar & Info Principales */}
            <div className="px-5 -mt-12 flex flex-col flex-grow">
                 <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden bg-slate-50 flex-shrink-0 relative">
                      {profile.photoUrl ? (
                          <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover"/>
                      ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                              <User className="w-10 h-10 text-slate-400"/>
                          </div>
                      )}
                 </div>
                 
                 <div className="mt-3 mb-1 flex justify-between items-start">
                     <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg line-clamp-1">{profile.name}</h3>
                        <p className="text-xs font-medium text-orange-600 dark:text-orange-400 line-clamp-1">{profile.tagline}</p>
                     </div>
                     <div className="text-right">
                        <div className="font-bold text-slate-800 dark:text-white text-lg">{profile.rating}</div>
                        <RatingStars rating={profile.rating}/>
                     </div>
                 </div>

                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 mb-4 min-h-[2.5em]">
                    {profile.bio}
                 </p>

                 {/* Mini Tags */}
                 <div className="flex flex-wrap gap-2 mb-4 mt-auto">
                     {profile.location && (
                         <span className="inline-flex items-center text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                             <MapPin className="w-3 h-3 mr-1"/> {profile.location}
                         </span>
                     )}
                     {profile.vehicleInfo && (
                         <span className="inline-flex items-center text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                             <Truck className="w-3 h-3 mr-1"/> {profile.vehicleInfo}
                         </span>
                     )}
                     {profile.relayName && (
                         <span className="inline-flex items-center text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                             <Store className="w-3 h-3 mr-1"/> {profile.relayName}
                         </span>
                     )}
                 </div>
            </div>
            
            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 mt-auto">
                <button className="w-full flex items-center justify-center gap-2 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:border-orange-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors shadow-sm">
                    <Eye className="w-4 h-4"/> Voir Profil
                </button>
            </div>
        </motion.div>
    );
}

// --- COMPOSANT PAGE ---

export default function MarketplacePage() {
  const [profiles, setProfiles] = useState<MarketplaceProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<MarketplaceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<MarketplaceProfile | null>(null);
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
      const loadData = async () => {
          setLoading(true);
          try {
              const data = await marketplaceService.getMarketplaceProfiles();
              setProfiles(data);
              setFilteredProfiles(data);
          } catch(e) { console.error(e); }
          finally { setLoading(false); }
      };
      loadData();
  }, []);

  // Filtres en temps réel
  useEffect(() => {
      let result = profiles;

      if(searchTerm) {
          const term = searchTerm.toLowerCase();
          result = result.filter(p => 
              p.name.toLowerCase().includes(term) || 
              p.services.some(s => s.toLowerCase().includes(term)) ||
              p.location?.toLowerCase().includes(term)
          );
      }

      if(typeFilter !== 'ALL') {
          result = result.filter(p => p.type === typeFilter);
      }

      setFilteredProfiles(result);
  }, [searchTerm, typeFilter, profiles]);


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 font-sans">
        <NavbarHome />
        
        {/* Header Héro avec Search Bar */}
        <div className="pt-28 pb-12 px-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-5xl mx-auto text-center space-y-6">
                 <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                     Trouvez le partenaire idéal <br/>
                     <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-600">pour vos expéditions</span>
                 </h1>
                 
                 <div className="relative max-w-2xl mx-auto mt-8">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Search className="w-6 h-6 text-slate-400"/>
                      </div>
                      <input 
                         type="text" 
                         placeholder="Rechercher un livreur, une agence, une ville..." 
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                         className="w-full pl-14 pr-4 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-black/20 text-lg font-medium focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                      />
                      
                      <div className="absolute inset-y-2 right-2">
                          <button 
                             onClick={() => setShowFilters(!showFilters)}
                             className={`h-full px-4 rounded-xl font-bold text-sm transition-colors flex items-center gap-2
                             ${showFilters ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                          >
                             <Filter className="w-4 h-4"/> Filtres
                          </button>
                      </div>
                 </div>

                 {/* Tags Filters Rapid */}
                 <AnimatePresence>
                 {showFilters && (
                     <motion.div 
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="flex justify-center gap-2 flex-wrap"
                     >
                         {['ALL', 'LIVREUR', 'FREELANCE', 'AGENCE'].map(type => (
                             <button 
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border-2 transition-all
                                ${typeFilter === type 
                                   ? 'bg-slate-800 border-slate-800 text-white dark:bg-white dark:text-slate-900' 
                                   : 'border-slate-200 text-slate-500 bg-white hover:border-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                             >
                                 {type === 'ALL' ? 'Tous' : type}
                             </button>
                         ))}
                     </motion.div>
                 )}
                 </AnimatePresence>
            </div>
        </div>

        {/* Grid Content */}
        <main className="max-w-7xl mx-auto px-4 md:px-8 pt-12">
            
            {loading ? (
                <div className="flex flex-col justify-center items-center py-20 text-center">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4"/>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Recherche des meilleurs prestataires...</p>
                </div>
            ) : filteredProfiles.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
                     <Search className="w-16 h-16 text-slate-300 mx-auto mb-4"/>
                     <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Aucun résultat trouvé</h3>
                     <p className="text-slate-500 dark:text-slate-400 mt-2">Essayez d'élargir votre recherche.</p>
                     <button onClick={() => {setSearchTerm(''); setTypeFilter('ALL');}} className="mt-6 px-6 py-2 bg-orange-100 text-orange-700 font-bold rounded-xl hover:bg-orange-200 transition">Tout afficher</button>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-6 px-2">
                        <p className="font-bold text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wide">
                           {filteredProfiles.length} Résultat(s) trouvé(s)
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProfiles.map(profile => (
                            <ProfileCard 
                                key={profile.id} 
                                profile={profile} 
                                onClick={() => setSelectedProfile(profile)}
                            />
                        ))}
                    </div>
                </>
            )}
        </main>

        {/* MODAL DETAIL */}
        <AnimatePresence>
            {selectedProfile && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedProfile(null)}
                >
                    <motion.div 
                        layoutId={selectedProfile.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 dark:border-slate-700 max-h-[90vh] overflow-y-auto relative"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header Modal */}
                        <div className="h-40 bg-gradient-to-r from-orange-400 to-amber-600 relative p-6 flex items-start justify-between">
                             <button 
                                onClick={() => setSelectedProfile(null)}
                                className="bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition ml-auto"
                             >
                                <X className="w-5 h-5"/>
                             </button>
                        </div>
                        
                        <div className="px-8 -mt-16 pb-8">
                            <div className="flex flex-col sm:flex-row sm:items-end gap-6 mb-6">
                                <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-3xl border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden flex-shrink-0 relative z-10">
                                     {selectedProfile.photoUrl ? (
                                        <img src={selectedProfile.photoUrl} alt="Avatar" className="w-full h-full object-cover"/>
                                     ) : (
                                        <div className="flex items-center justify-center h-full w-full bg-slate-200 text-slate-400"><User className="w-12 h-12"/></div>
                                     )}
                                </div>
                                <div className="flex-1 mb-2">
                                     <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{selectedProfile.name}</h2>
                                     <p className="text-lg text-orange-600 font-medium">{selectedProfile.tagline}</p>
                                </div>
                                <div className="flex gap-3 mb-3">
                                    <a href={`tel:${selectedProfile.phone}`} className="p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-2xl hover:scale-110 transition-transform"><Phone className="w-6 h-6"/></a>
                                    <a href={`mailto:${selectedProfile.email}`} className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-2xl hover:scale-110 transition-transform"><Mail className="w-6 h-6"/></a>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                                {/* Gauche: Details */}
                                <div className="lg:col-span-2 space-y-8">
                                     <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                         <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                                            <MessageCircle className="w-5 h-5 text-orange-500"/> Bio & Présentation
                                         </h4>
                                         <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base">
                                             {selectedProfile.bio || "Aucune description fournie."}
                                         </p>
                                     </div>

                                     <div>
                                         <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Services Proposés</h4>
                                         <div className="flex flex-wrap gap-3">
                                              {selectedProfile.services.map((serv, idx) => (
                                                  <div key={idx} className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                      <Package className="w-4 h-4 text-orange-500"/> {serv}
                                                  </div>
                                              ))}
                                         </div>
                                     </div>
                                </div>

                                {/* Droite: Sidebar info */}
                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-slate-900 text-white">
                                         <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-700">
                                             <span className="text-slate-400 font-medium">Note Client</span>
                                             <span className="text-xl font-bold flex items-center gap-1"><Star className="w-5 h-5 fill-yellow-400 text-yellow-400"/> {selectedProfile.rating}</span>
                                         </div>
                                         <div className="space-y-4 text-sm">
                                             <div className="flex items-center justify-between">
                                                <span className="text-slate-400 flex items-center gap-2"><MapPin className="w-4 h-4"/> Localisation</span>
                                                <span className="font-semibold">{selectedProfile.location || "N/A"}</span>
                                             </div>
                                             <div className="flex items-center justify-between">
                                                <span className="text-slate-400 flex items-center gap-2"><Award className="w-4 h-4"/> Expérience</span>
                                                <span className="font-semibold">{selectedProfile.experienceYears} ans</span>
                                             </div>
                                             {selectedProfile.vehicleInfo && (
                                                 <div className="flex items-center justify-between">
                                                    <span className="text-slate-400 flex items-center gap-2"><Truck className="w-4 h-4"/> Véhicule</span>
                                                    <span className="font-semibold text-right">{selectedProfile.vehicleInfo}</span>
                                                 </div>
                                             )}
                                             {selectedProfile.relayName && (
                                                 <div className="flex items-center justify-between">
                                                    <span className="text-slate-400 flex items-center gap-2"><Store className="w-4 h-4"/> Relais</span>
                                                    <span className="font-semibold text-right">{selectedProfile.relayName}</span>
                                                 </div>
                                             )}
                                         </div>
                                    </div>
                                    <button className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg hover:shadow-orange-500/25 transition-all">
                                        Engager maintenant
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}
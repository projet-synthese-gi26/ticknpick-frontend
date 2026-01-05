// FICHIER: src/services/marketplaceService.ts
import apiClient from './apiClient';

// Type complet pour l'affichage marketplace
export interface MarketplaceProfile {
    id: string;
    // Infos de base (User)
    name: string; // businessName ou name
    type: 'LIVREUR' | 'FREELANCE' | 'AGENCE';
    
    // Carte Service (si dispo)
    tagline: string;
    bio: string;
    photoUrl: string | null;
    rating: number;
    experienceYears: number;
    
    // Infos métier
    zones: string[];
    services: string[];
    
    // Spécifique
    vehicleInfo?: string; // "Moto - Yamaha"
    relayName?: string;   // "Relais Mvan"
    location?: string;    // "Yaoundé, Cameroun"
    
    // Contact (si public)
    phone: string;
    email: string;
}

const getMarketplaceProfiles = async (): Promise<MarketplaceProfile[]> => {
    try {
        console.log("🛒 [MarketplaceService] Chargement des profils...");

        // 1. Récupérer les acteurs business (endpoint public idéalement)
        // Fallback: Utiliser /api/business-actors si accessible (nécessite auth souvent)
        // Ou utiliser l'endpoint public pour les points relais si c'est tout ce qu'on a.
        const [actors, relayPoints] = await Promise.all([
             apiClient<any[]>('/api/business-actors', 'GET').catch(() => []),
             apiClient<any[]>('/api/public/relay-points', 'GET').catch(() => []) // Celle-ci est sûre
        ]);

        // 2. Récupérer les cartes de services (supposons un endpoint global ou simulation)
        // S'il n'y a pas d'endpoint global pour service-cards, on simule pour l'instant
        // En prod Java: Il faut créer GET /api/public/marketplace
        const profiles: MarketplaceProfile[] = [];

        // Traitement des Business Actors (Livreurs, Agences...)
        actors.forEach((a: any) => {
            profiles.push({
                id: a.id,
                name: a.businessName || a.name,
                type: mapType(a.businessActorType),
                tagline: "Service Pro Rapide",
                bio: `Acteur logistique professionnel (${a.businessActorType}) prêt à vous servir.`,
                photoUrl: a.photoUrl,
                rating: 4.5, // Valeur par défaut en attendant la table rating
                experienceYears: 2,
                zones: [a.businessLocality || a.town || 'Cameroun'],
                services: ["Livraison Standard", "Paiement Cash"],
                vehicleInfo: a.businessActorType === 'DELIVERER' ? "Moto Standard" : undefined,
                location: a.businessAddress || a.town,
                phone: a.phoneNumber,
                email: a.email
            });
        });
        
        // Ajout des Points Relais publics (Freelance/Agences qui ont un point)
        // Cela permet d'avoir du contenu même si /api/business-actors est bloqué
        relayPoints.forEach((rp: any) => {
             // On évite les doublons si l'acteur a déjà été ajouté
             if(!profiles.find(p => p.id === rp.ownerId)) {
                 profiles.push({
                     id: rp.id, // Attention ici on prend ID du point relais pour l'affichage
                     name: rp.relayPointName,
                     type: rp.type === 'agence' ? 'AGENCE' : 'FREELANCE',
                     tagline: "Point Relais de Confiance",
                     bio: `Point relais situé à ${rp.locality}. Ouvert ${rp.openingHours || 'toute la journée'}.`,
                     photoUrl: rp.photoUrl || rp.relay_point_photo_url,
                     rating: 4.8,
                     experienceYears: 1,
                     zones: [rp.locality || 'Ville'],
                     services: ["Retrait Colis", "Dépôt"],
                     relayName: rp.relayPointName,
                     location: rp.address || rp.relay_point_address,
                     phone: "+237 ...", // Souvent masqué dans public/relay-points
                     email: "contact@TiiBnTick.cm"
                 });
             }
        });

        return profiles;

    } catch (error) {
        console.error("❌ Erreur marketplace:", error);
        return [];
    }
};

// Helper
const mapType = (apiType: string): 'LIVREUR'|'FREELANCE'|'AGENCE' => {
    if (apiType === 'DELIVERER') return 'LIVREUR';
    if (apiType === 'AGENCY_OWNER' || apiType === 'AGENCY') return 'AGENCE';
    return 'FREELANCE';
}

export const marketplaceService = {
    getMarketplaceProfiles
};
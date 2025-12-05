// FICHIER: src/services/adminService.ts
import apiClient from './apiClient';

// --- INTERFACES POUR LE TYPAGE INTERNE ---

// Représente un colis extrait d'un point relais
export interface MergedPackage {
    id: string;
    trackingNumber: string;
    shippingCost: number;
    createdAt: string;
    status: string;
    
    senderName?: string;
    senderPhone?: string;
    recipientName?: string;
    
    // Clé pour le pivot
    relayPointId?: string;
    relayPointName?: string; 
}

export interface AdminDashboardStats {
    totalUsers: number;
    totalShipments: number;
    totalBusinessActors: number;
    pendingValidations: number;
    totalRevenue: number; // Calculé côté client
}

// --- FONCTION PUISSANTE DE RÉCUPÉRATION GLOBALE (CASCADE) ---

const getAllShipmentsGlobal = async (): Promise<MergedPackage[]> => {
    console.group("🔄 [AdminService] Deep Fetch Strategy : Scraping Relay Points");
    let allPackages: MergedPackage[] = [];
    const processedPackageIds = new Set<string>(); // Pour éviter les doublons si un colis est à la fois au départ et à l'arrivée dans nos résultats

    try {
        // 1. Récupérer TOUS les points relais
        console.log("1️⃣ Fetching Relay Points List...");
        const relayPoints = await apiClient<any[]>('/api/relay-points', 'GET'); // ou /api/public/relay-points
        console.log(`✅ Found ${relayPoints.length} Relay Points.`);

        if (relayPoints.length === 0) {
             console.warn("⚠️ No relay points found. Aborting deep fetch.");
             return [];
        }

        // 2. Pour chaque point relais, lancer une requête parallèle pour ses colis
        // Attention à la charge : On le fait avec Promise.allSettled pour ne pas tout casser si un relais échoue
        console.log("2️⃣ Fetching packages for each relay point (Parallel)...");
        
        const promises = relayPoints.map(rp => 
             apiClient<any[]>(`/api/relay-points/${rp.id}/packages`, 'GET')
                 .then(response => {
                     // SECURISATION CRITIQUE
                     let pkgs: any[] = [];
                     if (Array.isArray(response)) {
                         pkgs = response;
                     } else if (response && typeof response === 'object') {
                         // Gérer la pagination ou réponse { content: [...] }
                         pkgs = (response as any).content || (response as any).data || [];
                     }
                     return { relayPoint: rp, packages: pkgs };
                 })
                 .catch(err => {
                     console.warn(`❌ Failed fetching for Relay ${rp.relayPointName}:`, err.message);
                     // On renvoie un tableau vide en cas d'échec pour ne pas casser le Promise.all
                     return { relayPoint: rp, packages: [] };
                 })
        );

        const results = await Promise.allSettled(promises);



        // 3. Agréger les résultats
        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                const { relayPoint, packages } = result.value;
                
                packages.forEach((pkg: any) => {
                     // Détection d'unicité
                     // ID colis est souvent 'id' ou 'packageId' ou 'trackingNumber'
                     const pkgId = pkg.id || pkg.trackingNumber;
                     
                     if (!processedPackageIds.has(pkgId)) {
                         processedPackageIds.add(pkgId);
                         
                         // Normalisation
                         allPackages.push({
                             id: pkgId,
                             trackingNumber: pkg.trackingNumber || pkg.tracking_number || "N/A",
                             shippingCost: Number(pkg.shippingCost || pkg.deliveryFee || pkg.cost || 0),
                             createdAt: pkg.createdAt || pkg.created_at || new Date().toISOString(),
                             status: pkg.status || pkg.currentStatus,
                             
                             senderName: pkg.senderName || pkg.sender_name,
                             senderPhone: pkg.senderPhone,
                             recipientName: pkg.recipientName,

                             relayPointId: relayPoint.id,
                             relayPointName: relayPoint.relayPointName
                         });
                     }
                });
            }
        });

        console.log(`🎉 Deep Fetch Complete. Total unique packages collected: ${allPackages.length}`);
        
        // Log échantillon pour vérification
        if (allPackages.length > 0) console.log("sample package:", allPackages[0]);

        return allPackages;

    } catch (error) {
        console.error("🚨 CRITICAL: Deep Fetch failed", error);
        return []; // Renvoie un tableau vide pour éviter crash UI
    } finally {
        console.groupEnd();
    }
};

// --- AUTRES MÉTHODES DU SERVICE ADMIN ---

const getDashboardStats = async (): Promise<AdminDashboardStats> => {
    // On va maintenant calculer nous-même les stats en agrégeant
    // car l'endpoint /admin/statistics ne marche pas ou renvoie 500.
    
    const [users, businessActors, shipments] = await Promise.all([
        // Essai route publique ou protégée Users (si admin peut)
        // Sinon adminService devra scraper aussi (ce qui est lourd). Supposons que /api/users passe.
        apiClient<any[]>('/api/users', 'GET').catch(() => []), 
        apiClient<any[]>('/api/business-actors', 'GET').catch(() => []),
        getAllShipmentsGlobal() // Notre nouvelle méthode Deep Fetch
    ]);

    const revenue = shipments.reduce((sum, p) => sum + p.shippingCost, 0);
    const pending = businessActors.filter((a: any) => !a.isVerified && !a.is_verified).length;

    return {
        totalUsers: users.length,
        totalBusinessActors: businessActors.length,
        totalShipments: shipments.length,
        pendingValidations: pending,
        totalRevenue: revenue
    };
};

// Pour la liste Users (onglet utilisateurs)
const getAllBusinessActors = async () => {
    return apiClient<any[]>('/api/business-actors', 'GET').catch(() => []);
};

const validateBusinessActor = async (id: string, isValid: boolean) => {
    const actor = await apiClient<any>(`/api/business-actors/${id}`, 'GET');
    const updated = { ...actor, isVerified: isValid, isEnabled: isValid };
    return apiClient(`/api/business-actors/${id}`, 'PUT', updated);
};

const deleteBusinessActor = async (id: string) => apiClient(`/api/business-actors/${id}`, 'DELETE');


export const adminService = {
    getDashboardStats,
    getAllShipmentsGlobal, // Notre star ici
    getAllBusinessActors,
    validateBusinessActor,
    deleteBusinessActor
};
// RelaisData.tsx
// Données des points relais dans la ville de Yaoundé

export interface PointRelais {
    id: number;
    name: string;
    address: string;
    hours: string;
    lat: number;
    lng: number;
    isNearby?: boolean;
    quartier: string; // Ajout du quartier pour faciliter la recherche
    type: 'bureau' | 'commerce' | 'agence'; // Type de point relais
    services: string[]; // Services disponibles dans ce point relais
    photo?: string;
    contact?: string;
    capacity?: number;
  }
  
  // Coordonnées approximatives du centre de Yaoundé
  export const YAOUNDE_CENTER: [number, number] = [3.848, 11.502];
  // Coordonnées du centre de Yaoundé (à utiliser comme fallback)
export const YAOUNDE_CENTER_FALLBACK: [number, number] = [3.866667, 11.516667];
  // Zoom par défaut pour la carte de Yaoundé
  export const YAOUNDE_ZOOM = 13;
  // Rayon de recherche des points proches en MÈTRES
export const NEARBY_RADIUS_METERS: number = 3000;
  // Limites approximatives de la ville pour restreindre la vue de la carte
  export const YAOUNDE_BOUNDS = {
    northEast: [3.935, 11.585], // Nord-Est
    southWest: [3.760, 11.420], // Sud-Ouest
  };
  // Zoom initial de la carte en cas de fallback (si la géolocalisation échoue)
export const INITIAL_MAP_ZOOM_FALLBACK: number = 12;
  // Rayon de recherche en km pour les points proches
  export const NEARBY_RADIUS = 3;
  
  // Données des points relais à Yaoundé
  const yaoundePointsRelais: PointRelais[] = [
    //Arrondissement de Yaoundé I
    
    // QUARTIER BASTOS
    {
      id: 1,
      name: "Relais MarketCm Bastos",
      address: "Rue 1756, face Immeuble SCB, Bastos",
      hours: "Lun-Ven: 8h-19h | Sam: 9h-15h",
      lat: 3.8686,
      lng: 11.5184,
      isNearby: true,
      quartier: "Bastos",
      type: "bureau",
      services: ["retrait", "paiement", "emballage", "assistance client"]
    },
    {
      id: 2,
      name: "Boutique Connectée Bastos",
      address: "Carrefour Bastos, à côté de Total",
      hours: "Tous les jours: 7h30-20h30",
      lat: 3.8672,
      lng: 11.5178,
      quartier: "Bastos",
      type: "commerce",
      services: ["retrait", "vente produits tech", "recharge mobile"]
    },
    {
      id: 3,
      name: "Agence Express Bastos",
      address: "Avenue Kennedy, Immeuble Les Diplomates",
      hours: "Lun-Sam: 7h-21h",
      lat: 3.8691,
      lng: 11.5193,
      quartier: "Bastos",
      type: "agence",
      services: ["retrait", "livraison express", "colis volumineux"]
    },
  
    // QUARTIER HIPPODROME
    {
      id: 4,
      name: "Point MarketCm Hippodrome",
      address: "Boulevard du 20 Mai, face stade",
      hours: "Lun-Sam: 8h-18h",
      lat: 3.8612,
      lng: 11.5107,
      quartier: "Hippodrome",
      type: "bureau",
      services: ["retrait", "paiement", "envoi colis"]
    },
    {
      id: 5,
      name: "Superette Relais Hippodrome",
      address: "Rue de l'Hippodrome, près du marché",
      hours: "Tous les jours: 6h30-21h",
      lat: 3.8605,
      lng: 11.5119,
      quartier: "Hippodrome",
      type: "commerce",
      services: ["retrait", "vente produits", "service après-vente"]
    },
    {
      id: 6,
      name: "Agence Colis Express",
      address: "Carrefour Hippodrome, Immeuble Le Général",
      hours: "Lun-Ven: 7h30-19h | Sam: 8h-13h",
      lat: 3.8621,
      lng: 11.5123,
      quartier: "Hippodrome",
      type: "agence",
      services: ["retrait", "livraison 24h", "stockage temporaire"]
    },
  
    // QUARTIER TSINGA
    {
      id: 7,
      name: "Relais Principal Tsinga",
      address: "Avenue Winston Churchill",
      hours: "Lun-Sam: 7h30-20h",
      lat: 3.8724,
      lng: 11.5068,
      isNearby: true,
      quartier: "Tsinga",
      type: "bureau",
      services: ["retrait", "paiement", "assurance colis", "emballage"]
    },
    {
      id: 8,
      name: "Librairie-Papeterie Relais Tsinga",
      address: "Rue Joseph Mballa Eloumden",
      hours: "Lun-Sam: 8h-19h",
      lat: 3.8731,
      lng: 11.5075,
      quartier: "Tsinga",
      type: "commerce",
      services: ["retrait", "vente fournitures", "photocopie"]
    },
    {
      id: 9,
      name: "Dépôt Express Tsinga",
      address: "Carrefour Tsinga, face station Oryx",
      hours: "24h/24 - 7j/7",
      lat: 3.8718,
      lng: 11.5059,
      quartier: "Tsinga",
      type: "agence",
      services: ["retrait", "livraison express", "colis réfrigérés"]
    },
  
    // QUARTIER NKOLNDONGO
    {
      id: 10,
      name: "Bureau MarketCm Nkolndongo",
      address: "Avenue de la Liberté",
      hours: "Lun-Ven: 8h-17h | Sam: 9h-13h",
      lat: 3.8782,
      lng: 11.4927,
      quartier: "Nkolndongo",
      type: "bureau",
      services: ["retrait", "envoi", "assistance client"]
    },
    {
      id: 11,
      name: "Epicerie Relais Nkolndongo",
      address: "Marché Central Nkolndongo",
      hours: "Tous les jours: 6h-22h",
      lat: 3.8791,
      lng: 11.4935,
      quartier: "Nkolndongo",
      type: "commerce",
      services: ["retrait", "vente produits", "recharge mobile"]
    },
    {
      id: 12,
      name: "Agence Logistique Nkolndongo",
      address: "Rue des Banques, Immeuble Financier",
      hours: "Lun-Sam: 7h-20h",
      lat: 3.8776,
      lng: 11.4919,
      quartier: "Nkolndongo",
      type: "agence",
      services: ["retrait", "livraison lourde", "stockage"]
    },
      // CENTRE-VILLE (3 points)
      {
        id: 91,
        name: "Bureau Principal MarketCm",
        address: "Avenue Kennedy, Immeuble CNPS, 2ème étage",
        hours: "Lun-Ven: 7h30-17h30 | Sam: 8h-13h",
        lat: 3.8667,
        lng: 11.5167,
        isNearby: true,
        quartier: "Centre-ville",
        type: "bureau",
        services: ["retrait", "paiement", "assurance", "emballage", "colis volumineux"]
      },
      {
        id: 92,
        name: "Relais Poste Centrale",
        address: "Place de l'Indépendance",
        hours: "Lun-Sam: 8h-18h",
        lat: 3.8658,
        lng: 11.5153,
        quartier: "Centre-ville",
        type: "agence",
        services: ["retrait", "envoi", "mandats"]
      },
      {
        id: 93,
        name: "Librairie des Nations",
        address: "Rue Joseph Charles",
        hours: "Lun-Sam: 7h30-19h",
        lat: 3.8672,
        lng: 11.5171,
        quartier: "Centre-ville",
        type: "commerce",
        services: ["retrait", "vente fournitures"]
      },
    
      // BASTOS (3 points)
      {
        id: 22,
        name: "Relais MarketCm Bastos",
        address: "Rue 1756, face Immeuble SCB",
        hours: "Lun-Ven: 8h-19h | Sam: 9h-15h",
        lat: 3.8686,
        lng: 11.5184,
        quartier: "Bastos",
        type: "bureau",
        services: ["retrait", "paiement", "assistance client"]
      },
      {
        id: 23,
        name: "Boutique Connectée Bastos",
        address: "Carrefour Bastos, à côté de Total",
        hours: "Tous les jours: 7h30-20h30",
        lat: 3.8672,
        lng: 11.5178,
        quartier: "Bastos",
        type: "commerce",
        services: ["retrait", "vente produits tech"]
      },
      {
        id: 24,
        name: "Agence Express Bastos",
        address: "Avenue Kennedy, Immeuble Les Diplomates",
        hours: "Lun-Sam: 7h-21h",
        lat: 3.8691,
        lng: 11.5193,
        quartier: "Bastos",
        type: "agence",
        services: ["retrait", "livraison express"]
      },
    
      // HIPPODROME (3 points)
      {
        id: 25,
        name: "Point MarketCm Hippodrome",
        address: "Boulevard du 20 Mai, face stade",
        hours: "Lun-Sam: 8h-18h",
        lat: 3.8612,
        lng: 11.5107,
        quartier: "Hippodrome",
        type: "bureau",
        services: ["retrait", "paiement"]
      },
      {
        id: 26,
        name: "Superette Relais Hippodrome",
        address: "Rue de l'Hippodrome, près du marché",
        hours: "Tous les jours: 6h30-21h",
        lat: 3.8605,
        lng: 11.5119,
        quartier: "Hippodrome",
        type: "commerce",
        services: ["retrait", "vente produits"]
      },
      {
        id: 27,
        name: "Agence Colis Express",
        address: "Carrefour Hippodrome, Immeuble Le Général",
        hours: "Lun-Ven: 7h30-19h | Sam: 8h-13h",
        lat: 3.8621,
        lng: 11.5123,
        quartier: "Hippodrome",
        type: "agence",
        services: ["retrait", "livraison 24h"]
      },
    
      // TSINGA (3 points)
      {
        id: 28,
        name: "Relais Principal Tsinga",
        address: "Avenue Winston Churchill",
        hours: "Lun-Sam: 7h30-20h",
        lat: 3.8724,
        lng: 11.5068,
        quartier: "Tsinga",
        type: "bureau",
        services: ["retrait", "paiement", "assurance"]
      },
      {
        id: 29,
        name: "Librairie-Papeterie Relais Tsinga",
        address: "Rue Joseph Mballa Eloumden",
        hours: "Lun-Sam: 8h-19h",
        lat: 3.8731,
        lng: 11.5075,
        quartier: "Tsinga",
        type: "commerce",
        services: ["retrait", "vente fournitures"]
      },
      {
        id: 30,
        name: "Dépôt Express Tsinga",
        address: "Carrefour Tsinga, face station Oryx",
        hours: "24h/24 - 7j/7",
        lat: 3.8718,
        lng: 11.5059,
        quartier: "Tsinga",
        type: "agence",
        services: ["retrait", "livraison express"]
      },
    
      // NKOLNDONGO (3 points)
      {
        id: 13,
        name: "Bureau MarketCm Nkolndongo",
        address: "Avenue de la Liberté",
        hours: "Lun-Ven: 8h-17h | Sam: 9h-13h",
        lat: 3.8782,
        lng: 11.4927,
        quartier: "Nkolndongo",
        type: "bureau",
        services: ["retrait", "envoi"]
      },
      {
        id: 14,
        name: "Epicerie Relais Nkolndongo",
        address: "Marché Central Nkolndongo",
        hours: "Tous les jours: 6h-22h",
        lat: 3.8791,
        lng: 11.4935,
        quartier: "Nkolndongo",
        type: "commerce",
        services: ["retrait", "vente produits"]
      },
      {
        id: 15,
        name: "Agence Logistique Nkolndongo",
        address: "Rue des Banques, Immeuble Financier",
        hours: "Lun-Sam: 7h-20h",
        lat: 3.8776,
        lng: 11.4919,
        quartier: "Nkolndongo",
        type: "agence",
        services: ["retrait", "livraison lourde"]
      },
    
      // MESSA (3 points)
      {
        id: 16,
        name: "Point Relais Université",
        address: "Carrefour Messa, près de l'Université",
        hours: "Lun-Sam: 7h30-20h",
        lat: 3.8689,
        lng: 11.5032,
        quartier: "Messa",
        type: "bureau",
        services: ["retrait", "photocopie"]
      },
      {
        id: 17,
        name: "Relais Pharmacie Messa",
        address: "Rue de la Poste, face hôpital",
        hours: "7j/7: 7h-22h",
        lat: 3.8675,
        lng: 11.5028,
        quartier: "Messa",
        type: "commerce",
        services: ["retrait", "pharmacie"]
      },
      {
        id: 18,
        name: "Dépôt Messa",
        address: "Avenue Ngoa-Ekellé",
        hours: "Lun-Ven: 8h-18h",
        lat: 3.8693,
        lng: 11.5041,
        quartier: "Messa",
        type: "agence",
        services: ["retrait", "stockage"]
      },
    
      // MVOG-ADA (3 points)
      {
        id: 19,
        name: "Relais MarketCm Mvog-Ada",
        address: "Carrefour Mvog-Ada",
        hours: "Lun-Sam: 8h-19h",
        lat: 3.8832,
        lng: 11.4976,
        quartier: "Mvog-Ada",
        type: "bureau",
        services: ["retrait", "paiement"]
      },
      {
        id: 20,
        name: "Superette Ada",
        address: "Marché Mvog-Ada",
        hours: "Tous les jours: 6h-21h",
        lat: 3.8827,
        lng: 11.4983,
        quartier: "Mvog-Ada",
        type: "commerce",
        services: ["retrait", "alimentation"]
      },
      {
        id: 21,
        name: "Agence Mvog-Ada",
        address: "Route d'Efoulan",
        hours: "Lun-Ven: 7h30-17h",
        lat: 3.8841,
        lng: 11.4969,
        quartier: "Mvog-Ada",
        type: "agence",
        services: ["retrait", "colis fragiles"]
      },
      //Arrondissement de Yaoundé II
      
        // Mvolyé (30-32)
        {
          id: 90,
          name: "Relais Principal Mvolyé",
          address: "Carrefour Mvolyé, près de l'église",
          hours: "Lun-Sam: 7h30-19h",
          lat: 3.8723,
          lng: 11.4987,
          quartier: "Mvolyé",
          type: "bureau",
          services: ["retrait", "paiement", "emballage"]
        },
        {
          id: 31,
          name: "Boutique Tech Mvolyé",
          address: "Rue de l'Université Catholique",
          hours: "Lun-Sam: 8h-20h",
          lat: 3.8735,
          lng: 11.4979,
          quartier: "Mvolyé",
          type: "commerce",
          services: ["retrait", "vente appareils", "service après-vente"]
        },
        {
          id: 32,
          name: "Dépôt Express Mvolyé",
          address: "Avenue Jean Paul II",
          hours: "Lun-Ven: 7h-21h | Sam: 8h-18h",
          lat: 3.8718,
          lng: 11.4992,
          quartier: "Mvolyé",
          type: "agence",
          services: ["retrait", "livraison express", "colis volumineux"]
        },
      
        // Mvog-Atangana Mballa (33-35)
        {
          id: 33,
          name: "Point Relais Mvog-Atangana",
          address: "Marché Mvog-Atangana",
          hours: "Tous les jours: 7h-20h",
          lat: 3.8856,
          lng: 11.5034,
          quartier: "Mvog-Atangana Mballa",
          type: "commerce",
          services: ["retrait", "vente produits locaux"]
        },
        {
          id: 34,
          name: "Bureau MarketCm Mvog-Atangana",
          address: "Rue principale",
          hours: "Lun-Ven: 8h-17h",
          lat: 3.8849,
          lng: 11.5027,
          quartier: "Mvog-Atangana Mballa",
          type: "bureau",
          services: ["retrait", "paiement", "envoi"]
        },
        {
          id: 35,
          name: "Agence Colis Mvog-Atangana",
          address: "Carrefour école publique",
          hours: "Lun-Sam: 7h30-19h",
          lat: 3.8862,
          lng: 11.5041,
          quartier: "Mvog-Atangana Mballa",
          type: "agence",
          services: ["retrait", "stockage", "livraison"]
        },
      
        // Etoudi (36-38)
        {
          id: 36,
          name: "Relais Sécurisé Etoudi",
          address: "Avenue du Palais, Zone protégée",
          hours: "Lun-Ven: 8h-18h | Sam: 9h-13h",
          lat: 3.8589,
          lng: 11.5287,
          quartier: "Etoudi",
          type: "bureau",
          services: ["retrait", "colis sécurisés", "emballage premium"]
        },
        {
          id: 37,
          name: "Boutique Diplomat Etoudi",
          address: "Résidence des Ambassadeurs",
          hours: "Lun-Sam: 9h-19h",
          lat: 3.8578,
          lng: 11.5279,
          quartier: "Etoudi",
          type: "commerce",
          services: ["retrait", "vente produits importés"]
        },
        {
          id: 38,
          name: "Agence VIP Etoudi",
          address: "Complexe présidentiel, accès nord",
          hours: "Lun-Ven: 7h30-17h",
          lat: 3.8595,
          lng: 11.5293,
          quartier: "Etoudi",
          type: "agence",
          services: ["retrait", "livraison prioritaire", "service conciergerie"]
        },
      
        // Nsimeyong (39-41)
        {
          id: 39,
          name: "Relais MarketCm Nsimeyong",
          address: "Carrefour Nsimeyong",
          hours: "Lun-Sam: 7h-20h",
          lat: 3.8754,
          lng: 11.5123,
          quartier: "Nsimeyong",
          type: "bureau",
          services: ["retrait", "paiement"]
        },
        {
          id: 40,
          name: "Epicerie Relais Nsimeyong",
          address: "Rue du marché",
          hours: "6h-22h tous les jours",
          lat: 3.8761,
          lng: 11.5135,
          quartier: "Nsimeyong",
          type: "commerce",
          services: ["retrait", "vente produits"]
        },
        {
          id: 41,
          name: "Dépôt Nsimeyong",
          address: "Avenue des écoles",
          hours: "Lun-Ven: 8h-17h",
          lat: 3.8748,
          lng: 11.5117,
          quartier: "Nsimeyong",
          type: "agence",
          services: ["retrait", "stockage"]
        },
      
        // Essos (42-44)
        {
          id: 42,
          name: "Relais Principal Essos",
          address: "Carrefour Essos, près hôpital",
          hours: "Lun-Sam: 7h30-20h",
          lat: 3.8825,
          lng: 11.5198,
          quartier: "Essos",
          type: "bureau",
          services: ["retrait", "paiement", "assurance"]
        },
        {
          id: 43,
          name: "Boutique High-Tech Essos",
          address: "Centre commercial Essos",
          hours: "Lun-Sam: 8h-19h",
          lat: 3.8832,
          lng: 11.5204,
          quartier: "Essos",
          type: "commerce",
          services: ["retrait", "vente appareils"]
        },
        {
          id: 44,
          name: "Agence Express Essos",
          address: "Route du Palais des Congrès",
          hours: "24h/24 - 7j/7",
          lat: 3.8819,
          lng: 11.5191,
          quartier: "Essos",
          type: "agence",
          services: ["retrait", "livraison express"]
        },
      
        // Briqueterie (45-47)
        {
          id: 45,
          name: "Point Relais Briqueterie",
          address: "Marché Central Briqueterie",
          hours: "Tous les jours: 6h-21h",
          lat: 3.8789,
          lng: 11.5056,
          quartier: "Briqueterie",
          type: "commerce",
          services: ["retrait", "vente produits"]
        },
        {
          id: 46,
          name: "Bureau MarketCm Briqueterie",
          address: "Avenue des Briqueteries",
          hours: "Lun-Ven: 8h-17h",
          lat: 3.8796,
          lng: 11.5063,
          quartier: "Briqueterie",
          type: "bureau",
          services: ["retrait", "envoi"]
        },
        {
          id: 47,
          name: "Agence Logistique Briqueterie",
          address: "Zone industrielle",
          hours: "Lun-Sam: 7h-19h",
          lat: 3.8783,
          lng: 11.5049,
          quartier: "Briqueterie",
          type: "agence",
          services: ["retrait", "livraison lourde"]
        },
      
        // Ekounou (48-50)
        {
          id: 48,
          name: "Relais MarketCm Ekounou",
          address: "Carrefour Ekounou",
          hours: "Lun-Sam: 7h30-19h",
          lat: 3.8912,
          lng: 11.4978,
          quartier: "Ekounou",
          type: "bureau",
          services: ["retrait", "paiement"]
        },
        {
          id: 49,
          name: "Superette Ekounou",
          address: "Rue du marché",
          hours: "6h-22h tous les jours",
          lat: 3.8905,
          lng: 11.4985,
          quartier: "Ekounou",
          type: "commerce",
          services: ["retrait", "vente produits"]
        },
        {
          id: 50,
          name: "Dépôt Ekounou",
          address: "Route de l'aéroport",
          hours: "Lun-Ven: 8h-17h",
          lat: 3.8918,
          lng: 11.4971,
          quartier: "Ekounou",
          type: "agence",
          services: ["retrait", "stockage"]
        },
      
        // Elig-Essono (51-53)
        {
          id: 51,
          name: "Point Relais Universitaire",
          address: "Cité U Elig-Essono",
          hours: "Lun-Sam: 8h-20h",
          lat: 3.8662,
          lng: 11.4923,
          quartier: "Elig-Essono",
          type: "bureau",
          services: ["retrait", "photocopie", "services étudiants"]
        },
        {
          id: 52,
          name: "Librairie Académique",
          address: "Rue des Résidences",
          hours: "Lun-Sam: 7h30-19h",
          lat: 3.8657,
          lng: 11.4931,
          quartier: "Elig-Essono",
          type: "commerce",
          services: ["retrait", "vente livres"]
        },
        {
          id: 53,
          name: "Agence Express Etudiant",
          address: "Face restaurant universitaire",
          hours: "Lun-Ven: 7h30-21h | Sam: 9h-17h",
          lat: 3.8668,
          lng: 11.4917,
          quartier: "Elig-Essono",
          type: "agence",
          services: ["retrait", "livraison rapide"]
        },
      
        // Elig-Edzoa (54-56)
        {
          id: 54,
          name: "Relais MarketCm Elig-Edzoa",
          address: "Carrefour Elig-Edzoa",
          hours: "Lun-Sam: 7h-19h",
          lat: 3.8843,
          lng: 11.4876,
          quartier: "Elig-Edzoa",
          type: "bureau",
          services: ["retrait", "paiement"]
        },
        {
          id: 55,
          name: "Boutique Elig-Edzoa",
          address: "Marché secondaire",
          hours: "Tous les jours: 6h30-21h",
          lat: 3.8837,
          lng: 11.4883,
          quartier: "Elig-Edzoa",
          type: "commerce",
          services: ["retrait", "vente produits"]
        },
        {
          id: 56,
          name: "Dépôt Elig-Edzoa",
          address: "Route de Nkolbisson",
          hours: "Lun-Ven: 8h-17h",
          lat: 3.8849,
          lng: 11.4871,
          quartier: "Elig-Edzoa",
          type: "agence",
          services: ["retrait", "stockage"]
        },
      
        // Mimboman (57-59)
        {
          id: 57,
          name: "Relais Principal Mimboman",
          address: "Carrefour Mimboman",
          hours: "Lun-Sam: 7h30-20h",
          lat: 3.8965,
          lng: 11.4812,
          quartier: "Mimboman",
          type: "bureau",
          services: ["retrait", "paiement", "assurance"]
        },
        {
          id: 58,
          name: "Boutique High-Tech Mimboman",
          address: "Centre commercial Mimboman",
          hours: "Lun-Sam: 8h-19h",
          lat: 3.8971,
          lng: 11.4819,
          quartier: "Mimboman",
          type: "commerce",
          services: ["retrait", "vente appareils"]
        },
        {
          id: 59,
          name: "Agence Express Mimboman",
          address: "Route de l'hôpital",
          hours: "24h/24 - 7j/7",
          lat: 3.8960,
          lng: 11.4806,
          quartier: "Mimboman",
          type: "agence",
          services: ["retrait", "livraison express"]
        },
      
        // Nkolbikok (60-62)
        {
          id: 60,
          name: "Point Relais Nkolbikok",
          address: "Marché Nkolbikok",
          hours: "Tous les jours: 6h-21h",
          lat: 3.8923,
          lng: 11.4765,
          quartier: "Nkolbikok",
          type: "commerce",
          services: ["retrait", "vente produits"]
        },
        {
          id: 61,
          name: "Bureau MarketCm Nkolbikok",
          address: "Avenue principale",
          hours: "Lun-Ven: 8h-17h",
          lat: 3.8930,
          lng: 11.4772,
          quartier: "Nkolbikok",
          type: "bureau",
          services: ["retrait", "envoi"]
        },
        {
          id: 62,
          name: "Agence Logistique Nkolbikok",
          address: "Zone artisanale",
          hours: "Lun-Sam: 7h-19h",
          lat: 3.8917,
          lng: 11.4759,
          quartier: "Nkolbikok",
          type: "agence",
          services: ["retrait", "livraison lourde"]
        },
      
        // Nkolbogo (63-65)
        {
          id: 63,
          name: "Relais MarketCm Nkolbogo",
          address: "Carrefour Nkolbogo",
          hours: "Lun-Sam: 7h30-19h",
          lat: 3.8876,
          lng: 11.4723,
          quartier: "Nkolbogo",
          type: "bureau",
          services: ["retrait", "paiement"]
        },
        {
          id: 64,
          name: "Superette Nkolbogo",
          address: "Rue du marché",
          hours: "6h-22h tous les jours",
          lat: 3.8869,
          lng: 11.4730,
          quartier: "Nkolbogo",
          type: "commerce",
          services: ["retrait", "vente produits"]
        },
        {
          id: 65,
          name: "Dépôt Nkolbogo",
          address: "Route de Nkolmesseng",
          hours: "Lun-Ven: 8h-17h",
          lat: 3.8882,
          lng: 11.4716,
          quartier: "Nkolbogo",
          type: "agence",
          services: ["retrait", "stockage"]
        },
      
        // Nkolmengong (66-68)
        {
          id: 66,
          name: "Point Relais Nkolmengong",
          address: "Carrefour Nkolmengong",
          hours: "Lun-Sam: 8h-20h",
          lat: 3.8834,
          lng: 11.4687,
          quartier: "Nkolmengong",
          type: "bureau",
          services: ["retrait", "photocopie"]
        },
        {
          id: 67,
          name: "Librairie Nkolmengong",
          address: "Rue des écoles",
          hours: "Lun-Sam: 7h30-19h",
          lat: 3.8829,
          lng: 11.4694,
          quartier: "Nkolmengong",
          type: "commerce",
          services: ["retrait", "vente livres"]
        },
        {
          id: 68,
          name: "Agence Express Nkolmengong",
          address: "Face au centre de santé",
          hours: "Lun-Ven: 7h30-21h | Sam: 9h-17h",
          lat: 3.8839,
          lng: 11.4681,
          quartier: "Nkolmengong",
          type: "agence",
          services: ["retrait", "livraison rapide"]
        },
      
        // Nkolmesseng (69-71)
        {
          id: 69,
          name: "Relais MarketCm Nkolmesseng",
          address: "Carrefour Nkolmesseng",
          hours: "Lun-Sam: 7h-19h",
          lat: 3.8795,
          lng: 11.4652,
          quartier: "Nkolmesseng",
          type: "bureau",
          services: ["retrait", "paiement"]
        },
        {
          id: 70,
          name: "Boutique Nkolmesseng",
          address: "Marché secondaire",
          hours: "Tous les jours: 6h30-21h",
          lat: 3.8789,
          lng: 11.4659,
          quartier: "Nkolmesseng",
          type: "commerce",
          services: ["retrait", "vente produits"]
        },
        {
          id: 71,
          name: "Dépôt Nkolmesseng",
          address: "Route de Nkolfoulou",
          hours: "Lun-Ven: 8h-17h",
          lat: 3.8801,
          lng: 11.4646,
          quartier: "Nkolmesseng",
          type: "agence",
          services: ["retrait", "stockage"]
        },
      
        // Nkolmeyos (72-74)
        {
          id: 72,
          name: "Relais Principal Nkolmeyos",
          address: "Carrefour Nkolmeyos",
          hours: "Lun-Sam: 7h30-20h",
          lat: 3.8763,
          lng: 11.4621,
          quartier: "Nkolmeyos",
          type: "bureau",
          services: ["retrait", "paiement", "assurance"]
        },
        {
          id: 73,
          name: "Boutique High-Tech Nkolmeyos",
          address: "Centre commercial",
          hours: "Lun-Sam: 8h-19h",
          lat: 3.8769,
          lng: 11.4628,
          quartier: "Nkolmeyos",
          type: "commerce",
          services: ["retrait", "vente appareils"]
        },
        {
          id: 74,
          name: "Agence Express Nkolmeyos",
          address: "Route de l'hôpital",
          hours: "24h/24 - 7j/7",
          lat: 3.8758,
          lng: 11.4615,
          quartier: "Nkolmeyos",
          type: "agence",
          services: ["retrait", "livraison express"]
        },
      
        // Nkolnkoumou (75-77)
        {
          id: 75,
          name: "Point Relais Nkolnkoumou",
          address: "Marché Nkolnkoumou",
          hours: "Tous les jours: 6h-21h",
          lat: 3.8725,
          lng: 11.4593,
          quartier: "Nkolnkoumou",
          type: "commerce",
          services: ["retrait", "vente produits"]
        },
        {
          id: 76,
          name: "Bureau MarketCm Nkolnkoumou",
          address: "Avenue principale",
          hours: "Lun-Ven: 8h-17h",
          lat: 3.8732,
          lng: 11.4600,
          quartier: "Nkolnkoumou",
          type: "bureau",
          services: ["retrait", "envoi"]
        },
        {
          id: 77,
          name: "Agence Logistique Nkolnkoumou",
          address: "Zone artisanale",
          hours: "Lun-Sam: 7h-19h",
          lat: 3.8719,
          lng: 11.4587,
          quartier: "Nkolnkoumou",
          type: "agence",
          services: ["retrait", "livraison lourde"]
        },
      
        // Nkolnyada (78-80)
        {
          id: 78,
          name: "Relais MarketCm Nkolnyada",
          address: "Carrefour Nkolnyada",
          hours: "Lun-Sam: 7h30-19h",
          lat: 3.8687,
          lng: 11.4564,
          quartier: "Nkolnyada",
          type: "bureau",
          services: ["retrait", "paiement"]
        },
        {
          id: 79,
          name: "Superette Nkolnyada",
          address: "Rue du marché",
          hours: "6h-22h tous les jours",
          lat: 3.8680,
          lng: 11.4571,
          quartier: "Nkolnyada",
          type: "commerce",
          services: ["retrait", "vente produits"]
        },
        {
          id: 80,
          name: "Dépôt Nkolnyada",
          address: "Route de Nkolo",
          hours: "Lun-Ven: 8h-17h",
          lat: 3.8693,
          lng: 11.4558,
          quartier: "Nkolnyada",
          type: "agence",
          services: ["retrait", "stockage"]
        },
      
        // Nkolo (81-83)
        {
          id: 81,
          name: "Point Relais Nkolo",
          address: "Carrefour Nkolo",
          hours: "Lun-Sam: 8h-20h",
          lat: 3.8652,
          lng: 11.4536,
          quartier: "Nkolo",
          type: "bureau",
          services: ["retrait", "photocopie"]
        },
        {
          id: 82,
          name: "Librairie Nkolo",
          address: "Rue des écoles",
          hours: "Lun-Sam: 7h30-19h",
          lat: 3.8647,
          lng: 11.4543,
          quartier: "Nkolo",
          type: "commerce",
          services: ["retrait", "vente livres"]
        },
        {
          id: 83,
          name: "Agence Express Nkolo",
          address: "Face au centre de santé",
          hours: "Lun-Ven: 7h30-21h | Sam: 9h-17h",
          lat: 3.8657,
          lng: 11.4530,
          quartier: "Nkolo",
          type: "agence",
          services: ["retrait", "livraison rapide"]
        },
      
        // Nkolfoulou (84-86)
        {
          id: 84,
          name: "Relais MarketCm Nkolfoulou",
          address: "Carrefour Nkolfoulou",
          hours: "Lun-Sam: 7h-19h",
          lat: 3.8618,
          lng: 11.4507,
          quartier: "Nkolfoulou",
          type: "bureau",
          services: ["retrait", "paiement"]
        },
        {
          id: 85,
          name: "Boutique Nkolfoulou",
          address: "Marché secondaire",
          hours: "Tous les jours: 6h30-21h",
          lat: 3.8612,
          lng: 11.4514,
          quartier: "Nkolfoulou",
          type: "commerce",
          services: ["retrait", "vente produits"]
        },
        {
          id: 86,
          name: "Dépôt Nkolfoulou",
          address: "Route de Nkolso'o",
          hours: "Lun-Ven: 8h-17h",
          lat: 3.8624,
          lng: 11.4501,
          quartier: "Nkolfoulou",
          type: "agence",
          services: ["retrait", "stockage"]
        },
      
        // Nkolso'o (87-89)
        {
          id: 87,
          name: "Relais Principal Nkolso'o",
          address: "Carrefour Nkolso'o",
          hours: "Lun-Sam: 7h30-20h",
          lat: 3.8584,
          lng: 11.4482,
          quartier: "Nkolso'o",
          type: "bureau",
          services: ["retrait", "paiement", "assurance"]
        },
        {
          id: 88,
          name: "Boutique High-Tech Nkolso'o",
          address: "Centre commercial",
          hours: "Lun-Sam: 8h-19h",
          lat: 3.8590,
          lng: 11.4489,
          quartier: "Nkolso'o",
          type: "commerce",
          services: ["retrait", "vente appareils"]
        },
        {
          id: 89,
          name: "Agence Express Nkolso'o",
          address: "Route principale",
          hours: "24h/24 - 7j/7",
          lat: 3.8579,
          lng: 11.4476,
          quartier: "Nkolso'o",
          type: "agence",
          services: ["retrait", "livraison express"]
        }
    ];
  
  export default yaoundePointsRelais;
  
  // Fonction utilitaire pour calculer la distance entre deux points (en km)
  export const calculateDistance = (
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  // Fonction pour trouver les points relais à proximité d'une position donnée
  export const findNearbyPoints = (
    points: PointRelais[],
    lat: number,
    lng: number,
    radius: number = NEARBY_RADIUS
  ): PointRelais[] => {
    return points.map(point => {
      const distance = calculateDistance(lat, lng, point.lat, point.lng);
      return {
        ...point,
        isNearby: distance <= radius
      };
    });
  };
  
  // Fonction pour filtrer les points relais par quartier ou adresse
  export function filterPointsBySearch(points: PointRelais[], searchTerm: string): PointRelais[] {
    if (!searchTerm.trim()) return points;
  
    const term = searchTerm.toLowerCase();
    
    return points.filter(point => 
      point.name.toLowerCase().includes(term) ||
      point.quartier.toLowerCase().includes(term) ||
      point.address.toLowerCase().includes(term) ||
      point.services.some(service => service.toLowerCase().includes(term))
    );
  }
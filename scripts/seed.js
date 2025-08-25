// FICHIER: scripts/seed.js (créez le dossier et le fichier)
const { createClient } = require('@supabase/supabase-js');

  // Données des points relais à Yaoundé
  const yaoundePointsRelais = [
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
        },
          {
    id: 94,
    name: "Bureau Principal MarketCm Akwa",
    address: "Boulevard de la Liberté, face Direction Générale SABC",
    hours: "Lun-Ven: 7h30-18h | Sam: 8h-14h",
    lat: 4.0452,
    lng: 9.6922,
    quartier: "Akwa",
    type: "bureau",
    services: ["retrait", "paiement", "colis volumineux", "assistance client"]
  },
  {
    id: 95,
    name: "Relais Boutique Le Kajo",
    address: "Rue Joss, à côté de l'Hôtel Akwa Palace",
    hours: "Lun-Sam: 9h-20h",
    lat: 4.0481,
    lng: 9.6895,
    quartier: "Akwa",
    type: "commerce",
    services: ["retrait", "vente de souvenirs", "recharge mobile"]
  },

  // QUARTIER BONAPRISO (Résidentiel et commercial)
  {
    id: 96,
    name: "Agence Express Bonapriso",
    address: "Rue Njo-Njo, près de la Pâtisserie Le Flaubert",
    hours: "Lun-Sam: 7h-21h",
    lat: 4.0325,
    lng: 9.6987,
    quartier: "Bonapriso",
    type: "agence",
    services: ["retrait", "livraison express", "emballage"]
  },
  {
    id: 97,
    name: "Point Relais Super U",
    address: "Centre Commercial L'Atrium, Bonapriso",
    hours: "Tous les jours: 8h-21h",
    lat: 4.0355,
    lng: 9.7011,
    quartier: "Bonapriso",
    type: "commerce",
    services: ["retrait", "paiement"]
  },

  // QUARTIER BONABERI 
  {
    id: 98,
    name: "Dépôt Logistique Bonaberi",
    address: "Ancienne Route, après le Pont sur le Wouri",
    hours: "Lun-Ven: 8h-17h",
    lat: 4.0938,
    lng: 9.6641,
    quartier: "Bonaberi",
    type: "agence",
    services: ["retrait", "colis lourds", "stockage"]
  },

  // QUARTIER MAKEPE 
  {
    id: 99,
    name: "Relais Pharmacie Makepe",
    address: "Carrefour St-Tropez, Makepe",
    hours: "7j/7: 8h-22h",
    lat: 4.0792,
    lng: 9.7423,
    quartier: "Makepe",
    type: "commerce",
    services: ["retrait"]
  },

  // =====================
  // BAFOUSSAM
  // =====================
  
  {
    id: 100,
    name: "Agence Centrale Bafoussam",
    address: "Rue du Marché A, face au Commissariat Central",
    hours: "Lun-Sam: 7h30-18h",
    lat: 5.4695,
    lng: 10.4190,
    quartier: "Marché A",
    type: "bureau",
    services: ["retrait", "envoi", "paiement"]
  },
  {
    id: 101,
    name: "Quincaillerie Relais Djemoun",
    address: "Quartier Djemoun, route de Bamenda",
    hours: "Lun-Sam: 7h-19h",
    lat: 5.4788,
    lng: 10.4215,
    quartier: "Djemoun",
    type: "commerce",
    services: ["retrait", "vente produits"]
  },
  {
    id: 102,
    name: "Point Relais Kouogouo",
    address: "Carrefour Total Ndiangdam",
    hours: "Lun-Ven: 8h-18h | Sam: 9h-13h",
    lat: 5.4842,
    lng: 10.3998,
    quartier: "Kouogouo",
    type: "agence",
    services: ["retrait", "assistance client"]
  },
  
  // =====================
  // BAMENDA
  // =====================

  {
    id: 103,
    name: "Bureau Principal Bamenda",
    address: "Commercial Avenue, près du rond-point City Chemist",
    hours: "Lun-Ven: 8h-17h | Sam: 8h-13h",
    lat: 5.9634,
    lng: 10.1587,
    quartier: "Commercial Avenue",
    type: "bureau",
    services: ["retrait", "paiement", "envoi colis"]
  },
  {
    id: 104,
    name: "Librairie Relais Nkwen",
    address: "Cow Street, à côté de Food Market",
    hours: "Lun-Sam: 7h30-19h",
    lat: 5.9602,
    lng: 10.1601,
    quartier: "Nkwen",
    type: "commerce",
    services: ["retrait", "photocopie"]
  },
  
  // =====================
  // LIMBE
  // =====================

  {
    id: 105,
    name: "Relais Côtier Limbe",
    address: "Down Beach, face au Seme Beach Hotel",
    hours: "Lun-Dim: 9h-18h",
    lat: 4.0152,
    lng: 9.2081,
    quartier: "Down Beach",
    type: "bureau",
    services: ["retrait", "paiement"]
  },
  {
    id: 106,
    name: "Boutique Relais Bota",
    address: "Près du Jardin Botanique de Limbe",
    hours: "Lun-Sam: 8h-19h",
    lat: 4.0105,
    lng: 9.1869,
    quartier: "Bota",
    type: "commerce",
    services: ["retrait", "vente souvenirs"]
  },

  // =====================
  // KRIBI
  // =====================

  {
    id: 107,
    name: "Agence Océan Kribi",
    address: "Centre-ville, près du débarcadère",
    hours: "Lun-Sam: 8h-18h",
    lat: 2.9461,
    lng: 9.9079,
    quartier: "Centre-ville",
    type: "bureau",
    services: ["retrait", "paiement", "envoi"]
  },
  {
    id: 108,
    name: "Point Relais Chutes de la Lobé",
    address: "Route des Chutes de la Lobé",
    hours: "Tous les jours: 9h-17h",
    lat: 2.8804,
    lng: 9.8973,
    quartier: "Lobé",
    type: "commerce",
    services: ["retrait"]
  },

  // =====================
  // GAROUA
  // =====================

  {
    id: 109,
    name: "Bureau Central Garoua",
    address: "Avenue des Banques, quartier Yelwa",
    hours: "Lun-Ven: 8h-17h | Sam: 9h-13h",
    lat: 9.3005,
    lng: 13.4021,
    quartier: "Yelwa",
    type: "bureau",
    services: ["retrait", "paiement", "assistance client"]
  },
  {
    id: 110,
    name: "Agence Roumdé Adjia",
    address: "Près du Stade Omnisport de Roumdé Adjia",
    hours: "Lun-Sam: 8h-18h",
    lat: 9.3248,
    lng: 13.3854,
    quartier: "Roumdé Adjia",
    type: "agence",
    services: ["retrait", "envoi"]
  },

  // =====================
  // MAROUA
  // =====================
  {
    id: 111,
    name: "Relais Sahel Maroua",
    address: "Quartier DOUGGOI, près du marché central",
    hours: "Lun-Sam: 7h30-18h",
    lat: 10.5902,
    lng: 14.3218,
    quartier: "Douggoi",
    type: "bureau",
    services: ["retrait", "paiement"]
  },
  {
    id: 112,
    name: "Boutique Relais Pont Vert",
    address: "Carrefour Pont Vert, sur la Nationale N1",
    hours: "Tous les jours: 7h-20h",
    lat: 10.5835,
    lng: 14.3160,
    quartier: "Pitoare",
    type: "commerce",
    services: ["retrait", "recharge mobile"]
  },
  
  // =====================
  // NGAOUNDÉRÉ
  // =====================
  {
    id: 113,
    name: "Agence du Château Ngaoundéré",
    address: "Montée du Lamidat, quartier Résidentiel",
    hours: "Lun-Ven: 8h-17h",
    lat: 7.3320,
    lng: 13.5834,
    quartier: "Résidentiel",
    type: "agence",
    services: ["retrait", "envoi"]
  },
  {
    id: 114,
    name: "Point Relais Université de Dang",
    address: "Carrefour de l'Université de Ngaoundéré, Dang",
    hours: "Lun-Sam: 8h-19h",
    lat: 7.4253,
    lng: 13.5678,
    quartier: "Dang",
    type: "commerce",
    services: ["retrait", "photocopie", "services étudiants"]
  },
  
  // =====================
  // EBOLOWA
  // =====================
  {
    id: 115,
    name: "Bureau Régional Sud Ebolowa",
    address: "Place de l'indépendance, centre administratif",
    hours: "Lun-Ven: 8h-17h",
    lat: 2.9144,
    lng: 11.1560,
    quartier: "Centre administratif",
    type: "bureau",
    services: ["retrait", "paiement"]
  },
  {
    id: 116,
    name: "Relais Marché Anacardier",
    address: "Marché Anacardier, quartier New-Bell",
    hours: "Lun-Sam: 7h-18h",
    lat: 2.9098,
    lng: 11.1492,
    quartier: "New-Bell",
    type: "commerce",
    services: ["retrait"]
  },
  
  // =====================
  // BERTOUA
  // =====================
  {
    id: 117,
    name: "Agence de l'Est Bertoua",
    address: "Avenue Ahidjo, près de la grande mosquée",
    hours: "Lun-Ven: 7h30-17h30 | Sam: 8h-13h",
    lat: 4.5776,
    lng: 13.6821,
    quartier: "Mokolo",
    type: "agence",
    services: ["retrait", "envoi", "paiement"]
  },

  // =====================
  // DSCHANG
  // =====================
  {
    id: 118,
    name: "Point Relais Université Dschang",
    address: "Cité universitaire, campus principal",
    hours: "Lun-Sam: 8h-20h",
    lat: 5.4523,
    lng: 10.0631,
    quartier: "Campus",
    type: "bureau",
    services: ["retrait", "photocopie", "paiement droits universitaires"]
  }
    ];

const SUPABASE_URL = "https://outcwvcyttnjwaryrsmv.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91dGN3dmN5dHRuandhcnlyc212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1OTk2MSwiZXhwIjoyMDcxNjM1OTYxfQ.X0Qvam-e1P9EbYu8Ei-i3EQ2jl_awjlPKnegRaXg2Mc";

/**
 * Fonction principale qui exécute le seeding.
 */
async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || SUPABASE_URL.includes("VOTRE")) {
    throw new Error("Script arrêté. Veuillez renseigner votre URL Supabase et votre clé SERVICE_ROLE.");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('✅ Client Supabase initialisé.');
  console.log('--- Début du seeding ---');

  console.log('\n🔵 Étape 1: Insertion des points relais...');
  
  const relayPointsToInsert = yaoundePointsRelais.map(point => ({
    name: point.name,
    address: point.address,
    hours: point.hours,
    lat: point.lat,
    lng: point.lng,
    quartier: point.quartier,
    type: point.type.toUpperCase(),
  }));

  console.log('   - Suppression des points relais existants...');
  const { error: deleteError } = await supabase.from('RelayPoint').delete().neq('id', 0);
  if (deleteError) {
    console.error('❌ Erreur lors de la suppression des points relais:', deleteError.message);
    return;
  }
  
  const { data: insertedRelayPoints, error: insertError } = await supabase
    .from('RelayPoint')
    .insert(relayPointsToInsert)
    .select();

  if (insertError) {
    console.error('❌ Erreur lors de l´insertion des points relais:', insertError.message);
  } else {
    console.log(`✅ ${insertedRelayPoints.length} points relais ont été insérés avec succès.`);
  }
  
  console.log('\n--- Seeding terminé avec succès ! ---');
}

// Exécution du script
main().catch(e => console.error('\n❌ Une erreur critique est survenue :', e.message));
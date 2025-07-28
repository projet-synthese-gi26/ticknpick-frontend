// Définition du type pour les points d'intérêt
export interface InterestPoint {
    id: string;
    name: string;
    description: string;
    lat: number;
    lng: number;
    category: 'landmark' | 'cultural' | 'business' | 'education';
    keywords: string[]; // Mots-clés pour la recherche
  }
  
  // Points d'intérêt majeurs de Yaoundé
  export const yaoundeInterestPoints: InterestPoint[] = [
    {
      id: 'poi-1',
      name: 'Monument de la Réunification',
      description: 'Monument symbolisant la réunification du Cameroun anglophone et francophone',
      lat: 3.862,
      lng: 11.527,
      category: 'landmark',
      keywords: ['monument', 'réunification', 'tourisme', 'centre-ville', 'ngoa-ekelle']
    },
    {
      id: 'poi-2',
      name: 'Université de Yaoundé I',
      description: 'La plus ancienne université du Cameroun',
      lat: 3.848,
      lng: 11.504,
      category: 'education',
      keywords: ['université', 'éducation', 'campus', 'ngoa-ekelle', 'enseignement']
    },
    {
      id: 'poi-3',
      name: 'Marché Central de Yaoundé',
      description: 'Grand marché commercial au cœur de la ville',
      lat: 3.865,
      lng: 11.516,
      category: 'business',
      keywords: ['marché', 'commerce', 'centre-ville', 'shopping', 'achats']
    },
    {
      id: 'poi-4',
      name: 'Palais des Sports de Yaoundé',
      description: 'Complexe sportif polyvalent situé à Warda',
      lat: 3.8575,
      lng: 11.523,
      category: 'cultural',
      keywords: ['sport', 'événement', 'warda', 'stade', 'basketball']
    },
    {
      id: '5',
      name: 'Poste Centrale de Yaoundé',
      description: 'Complexe sportif polyvalent situé à Warda',
      lat: 3.8606987,
      lng: 11.5204988,
      category: 'marché',
      keywords: ['centre-ville', 'shopping', 'achats']
    },
    {
      id: '6',
      name: 'Awae escalier',
      description: 'Lieu non spécifié à Awae',
      lat: 3.8687,
      lng: 11.5145,
      category: 'autre',
      keywords: ['Awae', 'escalier']
    },
    {
      id: '7',
      name: 'Maetur Mimboman',
      description: 'Terminus de transport à Mimboman',
      lat: 3.8556,
      lng: 11.5278,
      category: 'transport',
      keywords: ['terminus', 'bus', 'Mimboman']
    },
    {
      id: '8',
      name: 'Terminus Odza',
      description: 'Terminus de transport à Odza',
      lat: 3.8833,
      lng: 11.5167,
      category: 'transport',
      keywords: ['terminus', 'bus', 'Odza']
    },
    {
      id: '9',
      name: 'Commissariat Odza',
      description: 'Poste de police à Odza',
      lat: 3.8964,
      lng: 11.4816,
      category: 'administration',
      keywords: ['police', 'sécurité', 'Odza']
    },
    {
      id: '10',
      name: 'Boulevard du 20 mai',
      description: 'Artère principale de Yaoundé',
      lat: 3.8667,
      lng: 11.5167,
      category: 'route',
      keywords: ['centre-ville', 'principale', 'Yaoundé']
    },
    {
      id: '11',
      name: 'Acropole Poste',
      description: 'Bureau de poste à Acropole',
      lat: 3.8687,
      lng: 11.5145,
      category: 'poste',
      keywords: ['poste', 'courrier', 'Acropole']
    },
    {
      id: '12',
      name: 'Santa Lucia Mvan',
      description: 'Restaurant italien à Mvan',
      lat: 3.8556,
      lng: 11.5278,
      category: 'restaurant',
      keywords: ['pizza', 'italien', 'Mvan']
    },
    {
      id: '13',
      name: 'Mobile Omnisport',
      description: 'Station-service Mobile à Omnisport',
      lat: 3.8833,
      lng: 11.5000,
      category: 'station-service',
      keywords: ['essence', 'carburant', 'centre-ville']
    },
    {
      id: '14',
      name: 'Mobile Essos',
      description: 'Station-service Mobile à Essos',
      lat: 3.8833,
      lng: 11.5167,
      category: 'station-service',
      keywords: ['essence', 'carburant', 'Essos']
    },
    {
      id: '15',
      name: 'Nouvelle route Bastos',
      description: 'Nouvelle voie routière vers Bastos',
      lat: 3.9000,
      lng: 11.5167,
      category: 'route',
      keywords: ['Bastos', 'nouvelle', 'voie']
    },
    {
      id: '16',
      name: 'Nkoabang',
      description: 'Quartier résidentiel à Yaoundé',
      lat: 3.8700,
      lng: 11.5100,
      category: 'quartier',
      keywords: ['résidentiel', 'calme', 'Nkoabang']
    },
    {
      id: '17',
      name: 'Terminus Mimboman',
      description: 'Terminus de transport à Mimboman',
      lat: 3.8400,
      lng: 11.5200,
      category: 'transport',
      keywords: ['terminus', 'bus', 'Mimboman']
    },
    {
      id: '18',
      name: 'Dovv Mokolo',
      description: 'Dépôt officiel des véhicules volés à Mokolo',
      lat: 3.8667,
      lng: 11.5167,
      category: 'administration',
      keywords: ['police', 'véhicules', 'Mokolo']
    }

  ];
  
  // Fonction pour rechercher des points d'intérêt par mots-clés
  export const searchInterestPoints = (query: string): InterestPoint[] => {
    if (!query || query.trim() === '') return [];
    
    const searchTerms = query.toLowerCase().split(' ');
    
    return yaoundeInterestPoints.filter(point => {
      // Chercher dans le nom
      if (point.name.toLowerCase().includes(query.toLowerCase())) {
        return true;
      }
      
      // Chercher dans les mots-clés
      return searchTerms.some(term => 
        point.keywords.some(keyword => keyword.toLowerCase().includes(term))
      );
    });
  };
  
  // Obtenir un point d'intérêt par son ID
  export const getInterestPointById = (id: string): InterestPoint | undefined => {
    return yaoundeInterestPoints.find(point => point.id === id);
  };
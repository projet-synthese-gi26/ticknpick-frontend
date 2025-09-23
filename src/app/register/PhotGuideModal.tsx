// Composant Modal de Guide Photo Simplifié
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Structure des guides photo avec chemins d'images
const photoGuides = {
  vehicle_front: {
    title: "Photo du véhicule (Face avant)",
    imagePath: "/images/guides/vehicle-front-guide.jpg", // À remplacer par votre image
    altText: "Positionnement pour photo véhicule face avant"
  },
  vehicle_back: {
    title: "Photo du véhicule (Face arrière)",  
    imagePath: "/images/guides/vehicle-back-guide.jpg", // À remplacer par votre image
    altText: "Positionnement pour photo véhicule face arrière"
  },
  relay_point: {
    title: "Photo du point relais",
    imagePath: "/images/guides/relay-point-guide.jpg", // À remplacer par votre image
    altText: "Comment photographier votre point relais"
  },
  identity: {
    title: "Photo d'identité",
    imagePath: "/images/guides/identity-photo-guide.jpg", // À remplacer par votre image
    altText: "Positionnement pour photo d'identité"
  }
};

// Composant Modal simplifié avec disparition automatique
const PhotoGuideModal = ({ 
  guideType, 
  isOpen, 
  onComplete 
}: {
  guideType: string | null;
  isOpen: boolean;
  onComplete: () => void;
}) => {
  useEffect(() => {
    if (isOpen && guideType) {
      // Disparition automatique après 3 secondes
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, guideType, onComplete]);

  if (!isOpen || !guideType) return null;

  const guide = photoGuides[guideType as keyof typeof photoGuides];
  if (!guide) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-20 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="bg-white rounded-2xl p-4 max-w-sm w-full mx-4 shadow-2xl"
      >
        {/* Titre */}
        <div className="text-center mb-3">
          <h3 className="text-lg font-bold text-gray-800">{guide.title}</h3>
        </div>

        {/* Image de démonstration */}
        <div className="relative w-full h-64 mb-3 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={guide.imagePath}
            alt={guide.altText}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback en cas d'erreur de chargement d'image
              const target = e.target as HTMLImageElement;
              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-family='Arial, sans-serif' font-size='14' fill='%236b7280'%3EImage Guide%3C/text%3E%3C/svg%3E";
            }}
          />
          
          {/* Indicateur de temps restant */}
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-black bg-opacity-50 rounded-full h-1">
              <motion.div
                className="bg-orange-500 h-full rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3, ease: "linear" }}
              />
            </div>
          </div>
        </div>

        {/* Bouton pour fermer immédiatement */}
        <div className="text-center">
          <button
            onClick={onComplete}
            className="px-6 py-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Passer ce guide
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PhotoGuideModal;
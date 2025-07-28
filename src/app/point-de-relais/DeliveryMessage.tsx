// components/DeliveryConfirmationPopup.tsx
import { CircleX, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface DeliveryConfirmationPopupProps {
  onClose: () => void;
  email: string;
}

const DeliveryConfirmationPopup = ({ 
  onClose, 
  email
}: DeliveryConfirmationPopupProps) => {
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    // Générer un numéro alphanumérique unique de 8 caractères
    const generateTrackingNumber = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    
    const newTrackingNumber = generateTrackingNumber();
    setTrackingNumber(newTrackingNumber);
    sendConfirmationEmail(email, newTrackingNumber);
  }, [email]);

  const sendConfirmationEmail = (email: string, trackingNumber: string) => {
    console.log(`Email envoyé à ${email} avec le numéro ${trackingNumber}`);
    // Implémentez l'envoi réel d'email ici
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Overlay semi-transparent */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      ></div>
      
      {/* Popup positionnée au centre */}
      <div 
        className="relative bg-white rounded-xl shadow-2xl p-6 fixed w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()} // Empêche la fermeture quand on clique dans la popup
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Merci d'avoir utilisé CamAdress
          </h3>
          
          <div className="my-4">
            <p className="text-gray-700 mb-2">
              Votre numéro de suivi :
            </p>
            <p className="font-mono font-bold text-indigo-600 text-xl tracking-wider">
              {trackingNumber}
            </p>
          </div>
          
          <p className="text-gray-600 text-sm mb-6">
            Ce numéro a été envoyé à <span className="font-semibold">{email}</span> et vous identifiera comme destinataire officiel.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Fermer
            </button>
            <Link href="/test">
              <button className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-center">
                Marketplace
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryConfirmationPopup;
'use client';
import React, { useState, useEffect } from 'react';
import { 
  ShoppingBagIcon, 
  CreditCardIcon, 
  ArrowRightIcon,
  ArrowLeftIcon,
  TruckIcon,
  MapPinIcon,
  UserIcon,
  TrashIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ShippingSteps from './ShippingSteps';

interface CartProps {
  formData: any;
  onProceedToPayment: () => void;
  onReturnToShipping: () => void;
}

const CartValidationPage: React.FC<CartProps> = ({ 
  formData, 
  onProceedToPayment,
  onReturnToShipping
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [price, setPrice] = useState(0);
  const [insuranceFee, setInsuranceFee] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [total, setTotal] = useState(0);
  const [relayPointSender, setRelayPointSender] = useState<any>(null);
  const [relayPointRecipient, setRelayPointRecipient] = useState<any>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const relayPoints = [
    { id: 'relay1', name: 'Supermarché Mahima', address: 'Rue 1.839, Yaoundé', distance: '0.5 km'},
    { id: 'relay2', name: 'Librairie Papyrus', address: 'Avenue Kennedy, Douala', distance: '0.8 km'},
    { id: 'relay3', name: 'Boutique Express', address: 'Marché Central, Bafoussam', distance: '1.2 km'}
  ];

  const recipientPoints = [
    { id: 'dest1', name: 'Supermarché Central', address: 'Avenue de l\'Indépendance, Yaoundé', region: 'Yaoundé' },
    { id: 'dest2', name: 'Boutique Akwa', address: 'Boulevard de la Liberté, Douala', region: 'Douala' },
    { id: 'dest3', name: 'Kiosque Express', address: 'Route de Foumban, Bafoussam', region: 'Bafoussam' }
  ];

  useEffect(() => {
    setIsLoading(true);
    // Simulate API call to get shipping costs
    setTimeout(() => {
      const weight = parseFloat(formData.weight);
      const basePrice = 3000 + weight * 1000;
      const insuranceCost = (formData.compensation > 15000) ? (formData.compensation - 15000) * 0.005 : 0;
      
      setPrice(basePrice);
      setInsuranceFee(insuranceCost);
      setDeliveryFee(1500);
      setTotal(basePrice + insuranceCost + 1500);
      
      // Find relay points
      setRelayPointSender(relayPoints.find(point => point.id === formData.relayPoint));
      setRelayPointRecipient(recipientPoints.find(point => point.id === formData.recipientRelayPoint));
      
      setIsLoading(false);
    }, 1000);
  }, [formData]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center justify-center mb-8">
        <h1 className="text-4xl font-bold text-green-700 text-center">Validation de votre panier</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-gray-100">
        <ShippingSteps currentStep={2} />
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left column - Order details */}
          <div className="flex-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
              <div className="flex items-center mb-4">
                <ShoppingBagIcon className="w-6 h-6 text-green-600 mr-2" />
                <h2 className="text-2xl text-black font-medium">Résumé de votre commande</h2>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="flex space-x-1 items-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <div className="flex bg-green-50 p-4 rounded-lg mb-4">
                      <div className="bg-green-100 p-3 rounded-lg mr-4">
                        <TruckIcon className="w-10 h-10 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-black">Envoi de colis</p>
                        <p className="text-sm text-gray-600">Livraison en point relais • {formData.country}</p>
                        <p className="text-sm text-gray-600">Poids: {formData.weight} kg</p>
                      </div>
                      <div className="ml-auto">
                        <button 
                          onClick={onReturnToShipping}
                          className="text-green-600 hover:text-green-800 flex items-center"
                        >
                          <ArrowLeftIcon className="w-4 h-4 mr-1" />
                          Modifier
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <MapPinIcon className="w-5 h-5 text-green-600 mr-2" />
                        <h3 className="font-medium">Point relais expéditeur</h3>
                      </div>
                      {relayPointSender && (
                        <div className="text-gray-600">
                          <p className="font-medium">{relayPointSender.name}</p>
                          <p className="text-sm">{relayPointSender.address}</p>
                          <p className="text-sm text-green-600 mt-1">{relayPointSender.distance}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <UserIcon className="w-5 h-5 text-green-600 mr-2" />
                        <h3 className="font-medium">Destinataire</h3>
                      </div>
                      <div className="text-gray-600">
                        <p className="font-medium">{formData.recipientName}</p>
                        <p className="text-sm">Tél: {formData.recipientPhone}</p>
                        {relayPointRecipient && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Point relais:</p>
                            <p className="text-sm">{relayPointRecipient.name}</p>
                            <p className="text-sm">{relayPointRecipient.address}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="mb-3 flex items-center">
                      <input 
                        type="checkbox" 
                        id="terms" 
                        checked={agreedToTerms}
                        onChange={() => setAgreedToTerms(!agreedToTerms)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                        J'accepte les <span className="text-green-600 underline cursor-pointer">conditions générales</span> et la <span className="text-green-600 underline cursor-pointer">politique de confidentialité</span>
                      </label>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mt-3 group">
                      <InformationCircleIcon className="w-5 h-5 mr-2 text-green-600" />
                      <span className="text-sm">
                        Les articles interdits ou dangereux ne peuvent pas être expédiés via notre service. 
                        <span className="text-green-600 underline cursor-pointer ml-1">Voir la liste complète</span>
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Right column - Price summary */}
          <div className="w-full md:w-96 bg-gray-100 p-6 rounded-lg shadow-lg border border-gray-100 h-fit sticky top-4">
            <h3 className="text-lg font-bold mb-6 text-green-700 flex items-center">
              <ShoppingBagIcon className="w-5 h-5 mr-2" />
              RÉCAPITULATIF
            </h3>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="flex space-x-1 items-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-gray-300 pb-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Prix de l'envoi :</span>
                    <span className="font-medium text-black">{price.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Frais d'assurance :</span>
                    <span className="font-medium text-black">{insuranceFee.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Frais de livraison :</span>
                    <span className="font-medium text-black">{deliveryFee.toLocaleString()} FCFA</span>
                  </div>
                </div>
                
                <div className="flex justify-between mb-8">
                  <span className="font-bold text-black">Prix final</span>
                  <span className="font-bold text-xl text-green-700">{total.toLocaleString()} FCFA</span>
                </div>
                
                <button 
                  className={`w-full py-3 px-6 rounded-lg font-medium text-white flex items-center justify-center transition-all ${
                    agreedToTerms ? 
                    'bg-green-600 hover:bg-green-700 animate-pulse' : 
                    'bg-gray-400 cursor-not-allowed'
                  }`} 
                  style={{ animationDuration: '2s' }}
                  disabled={!agreedToTerms}
                  onClick={onProceedToPayment}
                >
                  Procéder au paiement
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>
                
                {!agreedToTerms && (
                  <p className="text-sm text-center mt-2 text-orange-500">
                    Veuillez accepter les conditions générales
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartValidationPage;
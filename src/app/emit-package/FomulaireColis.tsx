'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  TruckIcon,
  ShoppingBagIcon,
  ArrowRightIcon,
  PhotoIcon,
  XCircleIcon,
  ScaleIcon,
  CubeIcon, // Already present, can be used
  ExclamationTriangleIcon,
  BeakerIcon,
  ClockIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  BoltIcon,
  CurrencyDollarIcon,
  HomeModernIcon, // Pour la prise en charge à domicile
  MapPinIcon,     // Pour la livraison à la destination finale
  UsersIcon,      // Pour la section livreur
} from '@heroicons/react/24/outline';
import { FullShippingData } from './page';

// --- Interfaces et Types ---
interface PackageData {
  image: string | null;
  designation: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  isFragile: boolean;
  contentType: 'solid' | 'liquid' | '';
  isPerishable: boolean;
  description: string;
  declaredValue: string;
  isInsured: boolean;
  deliveryAtOrigin: boolean;
  deliveryAtDestination: boolean;
}

interface PackageRegistrationProps {
  initialData: Partial<FullShippingData>;
    onContinue: (data: PackageData & { expressOption: ExpressOption }, totalPrice: number) => void;
}

type ExpressOption = '' | '24h' | '48h' | '72h';

const DELIVERY_AT_ORIGIN_COST = 1200; // Coût pour prise en charge à domicile
const DELIVERY_AT_DESTINATION_COST = 1800; // Coût pour livraison au destinataire

const LoadingDots = () => (
  <div className="flex space-x-1 items-center justify-center">
    <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
    <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
  </div>
);

const OptionCard = ({
  title,
  description,
  icon,
  isSelected,
  onClick,
  isToggle = false,
  cost
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  isToggle?: boolean;
  cost?: number;
}) => (
  <div
    className={`border rounded-lg p-3 cursor-pointer transition-all duration-300 hover:shadow-lg flex flex-col items-center justify-center h-full text-center relative
      ${isSelected ? 'border-green-500 bg-green-50 shadow-green-200/50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
    onClick={onClick}
  >
    <div className={`p-2 rounded-full mb-2 ${isSelected ? 'bg-green-100' : 'bg-gray-100'}`}>
      {React.cloneElement(icon as React.ReactElement, { className: `w-6 h-6 ${isSelected ? 'text-green-600' : 'text-gray-500'}` })}
    </div>
    <span className={`text-sm font-semibold ${isSelected ? 'text-green-700' : 'text-gray-800'}`}>
      {title}
    </span>
    {description && (
      <span className={`text-xs mt-1 ${isSelected ? 'text-green-600' : 'text-gray-500'}`}>
        {description}
      </span>
    )}
    {cost !== undefined && (
      <span className={`text-xs mt-1 font-medium ${isSelected ? 'text-green-600' : 'text-gray-500'}`}>
        (+ {cost.toLocaleString()} FCFA)
      </span>
    )}
    {isSelected && isToggle && (
      <div className="absolute top-2 right-2">
        <CheckCircleIcon className="w-4 h-4 text-green-500" />
      </div>
    )}
  </div>
);

const PackageRegistration: React.FC<PackageRegistrationProps> = ({ onContinue }) => {
  const [packageData, setPackageData] = useState<PackageData>({
    image: null,
    designation: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    isFragile: false,
    contentType: '',
    isPerishable: false,
    description: '',
    declaredValue: '',
    isInsured: false,
    deliveryAtOrigin: false,
    deliveryAtDestination: false,
  });

  const [expressOption, setExpressOption] = useState<ExpressOption>('');
  const [priceLoading, setPriceLoading] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [basePriceForCalc, setBasePriceForCalc] = useState<number | null>(null);
  const [volume, setVolume] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // --- LOCALSTORAGE LOGIC ---

  // 1. CHARGEMENT : S'exécute une seule fois au montage du composant
  useEffect(() => {
    const savedData = localStorage.getItem('packageData');
    const savedExpressOption = localStorage.getItem('expressOption') as ExpressOption;
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // ----- AMÉLIORATION APPLIQUÉE ICI -----
        // Restaure l'objet complet pour inclure toutes les options
        setPackageData(parsedData); 
        
        if (savedExpressOption) {
          setExpressOption(savedExpressOption);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données depuis localStorage:', error);
        // En cas d'erreur, on peut vider le localStorage pour éviter des problèmes futurs
        localStorage.removeItem('packageData');
        localStorage.removeItem('expressOption');
      }
    }
  }, []);

  // 2. SAUVEGARDE : S'exécute à chaque modification de `packageData` ou `expressOption`
  useEffect(() => {
    try {
      localStorage.setItem('packageData', JSON.stringify(packageData));
      localStorage.setItem('expressOption', expressOption);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données dans localStorage:', error);
    }
  }, [packageData, expressOption]);

  // --- FIN DE LA LOGIQUE LOCALSTORAGE ---

  useEffect(() => {
    const { image, designation, weight } = packageData;
    const requiredFields = [image, designation, weight];

    if (requiredFields.every(field => field !== '' && field !== null)) {
      setIsFormValid(true);
      setValidationError(null);
    } else {
      setIsFormValid(false);
      setValidationError('Veuillez remplir les champs obligatoires (photo, désignation et poids)');
    }
  }, [packageData]);

  // Unique useEffect pour le calcul du prix
  useEffect(() => {
    const updatePrice = () => {
      const { weight, isFragile, contentType, isPerishable, length, width, height, declaredValue, isInsured, deliveryAtOrigin, deliveryAtDestination } = packageData;

      const weightNum = parseFloat(weight);
      if (isNaN(weightNum) || weightNum <= 0) {
        setPrice(null);
        setBasePriceForCalc(null);
        setVolume(null);
        return;
      }
      
      setPriceLoading(true);

      const lengthNum = parseFloat(length) || 0;
      const widthNum = parseFloat(width) || 0;
      const heightNum = parseFloat(height) || 0;
      const declaredValueNum = parseFloat(declaredValue) || 0;
      
      const vol = lengthNum * widthNum * heightNum;
      setVolume(vol > 0 ? vol : null);

      setTimeout(() => {
        let basePrice = 1500 + weightNum * 300;
        const volumetricWeight = vol / 5000;
        if (volumetricWeight > weightNum) {
          basePrice = 1500 + volumetricWeight * 300;
        }
        setBasePriceForCalc(basePrice);

        let totalAdditionalFees = 0;
        if (isFragile) totalAdditionalFees += basePrice * 0.15;
        if (contentType === 'liquid') totalAdditionalFees += basePrice * 0.10;
        if (isPerishable) totalAdditionalFees += basePrice * 0.20;
        if (isInsured && declaredValueNum > 0) totalAdditionalFees += declaredValueNum * 0.05;
        if (deliveryAtOrigin) totalAdditionalFees += DELIVERY_AT_ORIGIN_COST;
        if (deliveryAtDestination) totalAdditionalFees += DELIVERY_AT_DESTINATION_COST;

        let expressFee = 0;
        if (expressOption === '24h') expressFee = basePrice * 0.30;
        else if (expressOption === '48h') expressFee = basePrice * 0.20;
        else if (expressOption === '72h') expressFee = basePrice * 0.10;
        
        setPrice(basePrice + totalAdditionalFees + expressFee);
        setPriceLoading(false);
      }, 500);
    };
    updatePrice();
  }, [packageData, expressOption]);

  const handleContinue = () => {
    // Vérifier si le prix a bien été calculé
    if (isFormValid && price !== null) { // <<< AJOUT de la condition `price !== null`
      try {
        const dataToSave = { ...packageData, expressOption };
        // Sauvegarder dans localStorage est ok, mais on passe aussi les données directement au parent
        onContinue(dataToSave, price); // <<< MODIFIÉ : On passe le prix ici
      } catch (error) {
        console.error('Erreur lors de la continuation:', error);
        onContinue({ ...packageData, expressOption }, price || 0); // fallback
      }
    } else {
        // Optionnel: informer l'utilisateur si le prix n'a pas pu être calculé
        console.warn("Tentative de continuer sans que le prix soit calculé.");
        alert("Le calcul du prix est en cours ou a échoué. Veuillez vérifier les informations du colis.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPackageData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ***** CORRECTION APPLIQUÉE ICI *****
  useEffect(() => {
    const style = document.createElement('style');
    // Le contenu CSS est maintenant dans une chaîne de caractères (template literal)
    style.innerHTML = `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }`;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const validateNumberInput = (value: string, field: keyof PackageData | 'declaredValue') => {
    const regex = /^(\d+)?(\.\d{0,2})?$/;
    if (value === '' || regex.test(value)) {
      if (field === 'declaredValue') {
        setPackageData(prev => ({ ...prev, declaredValue: value }));
      } else {
        setPackageData(prev => ({ ...prev, [field as keyof Omit<PackageData, 'deliveryAtOrigin' | 'deliveryAtDestination'>]: value }));
      }
    }
  };

  return (
    <div className="mx-auto px-3 py-4 max-w-5xl">
      <h1 className="text-2xl font-bold text-center text-green-700 mb-4">Enregistrement de Votre Colis</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Formulaire d'enregistrement de colis */}
        <div className="flex-1">
          {/* Section photo du colis */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center mb-2">
              <PhotoIcon className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg text-black font-medium">Photo du colis <span className="text-red-500">*</span></h2>
            </div>
            <div className="flex justify-center">
              {packageData.image ? (
                <div className="relative w-48 h-48 rounded-md overflow-hidden border border-gray-200">
                  <Image
                    src={packageData.image}
                    alt="Photo du colis"
                    layout="fill"
                    objectFit="cover"
                  />
                  <button
                    onClick={() => setPackageData(prev => ({ ...prev, image: null }))}
                    className="absolute top-2 right-2 bg-red-100 hover:bg-red-200 rounded-full p-1 transition-colors"
                  >
                    <XCircleIcon className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors p-3"
                >
                  <PhotoIcon className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-gray-500 text-sm text-center">Cliquez pour ajouter une photo</p>
                  <p className="text-gray-400 text-xs text-center mt-1">Format: JPG, PNG (max 5MB)</p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          {/* Section information du colis */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center mb-2">
              <ShoppingBagIcon className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg text-black font-medium">Information du colis</h2>
            </div>
            <div className="mb-3">
              <label htmlFor="designation" className="block text-gray-500 mb-1 text-sm font-medium">
                Désignation <span className="text-red-500">*</span>
              </label>
              <input
                id="designation"
                type="text"
                className="w-full text-black border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                placeholder="Ex: Vêtements, Livres, Électroniques..."
                value={packageData.designation}
                onChange={(e) => setPackageData(prev => ({ ...prev, designation: e.target.value }))}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="description" className="block text-gray-500 mb-1 text-sm font-medium">
                Description (optionnel)
              </label>
              <textarea
                id="description"
                rows={2}
                className="w-full text-black border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                placeholder="Détails supplémentaires sur le contenu..."
                value={packageData.description}
                onChange={(e) => setPackageData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          {/* Section poids et dimensions */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center mb-2">
              <ScaleIcon className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg text-black font-medium">Poids et Dimensions</h2>
            </div>
            <div className="mb-3">
              <label htmlFor="weight" className="block text-gray-500 mb-1 text-sm font-medium">
                Poids <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="weight"
                  type="text"
                  className="w-full text-black border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                  placeholder="Ex: 1.5"
                  value={packageData.weight}
                  onChange={(e) => validateNumberInput(e.target.value, 'weight')}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm">Kg</span>
                </div>
              </div>
            </div>
            <div className="mb-2">
              <label className="block text-gray-500 mb-1 text-sm font-medium">
                Dimensions (optionnel)
              </label>
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full text-black border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                      placeholder="Longueur"
                      value={packageData.length}
                      onChange={(e) => validateNumberInput(e.target.value, 'length')}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 text-sm">cm</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full text-black border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                      placeholder="Largeur"
                      value={packageData.width}
                      onChange={(e) => validateNumberInput(e.target.value, 'width')}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 text-sm">cm</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full text-black border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                      placeholder="Hauteur"
                      value={packageData.height}
                      onChange={(e) => validateNumberInput(e.target.value, 'height')}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 text-sm">cm</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section caractéristiques spéciales */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center mb-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg text-black font-medium">Caractéristiques spéciales (optionnel)</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <OptionCard
                title="Fragile"
                icon={<ExclamationTriangleIcon />}
                isSelected={packageData.isFragile}
                onClick={() => setPackageData(prev => ({ ...prev, isFragile: !prev.isFragile }))}
                isToggle={true}
              />
              <OptionCard
                title="Liquide"
                icon={<BeakerIcon />}
                isSelected={packageData.contentType === 'liquid'}
                onClick={() => setPackageData(prev => ({ ...prev, contentType: prev.contentType === 'liquid' ? '' : 'liquid' }))}
                isToggle={true}
              />
              <OptionCard
                title="Périssable"
                icon={<ClockIcon />}
                isSelected={packageData.isPerishable}
                onClick={() => setPackageData(prev => ({ ...prev, isPerishable: !prev.isPerishable }))}
                isToggle={true}
              />
              <OptionCard
                title="Assurer"
                icon={<ShieldCheckIcon />}
                isSelected={packageData.isInsured}
                onClick={() => setPackageData(prev => ({ ...prev, isInsured: !prev.isInsured }))}
                isToggle={true}
              />
            </div>
            {packageData.isInsured && (
              <div className="mt-3">
                <label htmlFor="declaredValue" className="block text-gray-500 mb-1 text-sm font-medium">
                  Valeur déclarée du colis pour assurance
                </label>
                <div className="relative">
                  <input
                    id="declaredValue"
                    type="text"
                    className="w-full text-black border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                    placeholder="Ex: 50000"
                    value={packageData.declaredValue}
                    onChange={(e) => validateNumberInput(e.target.value, 'declaredValue')}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 text-sm">FCFA</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section Options d'envoi Express */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center mb-3">
              <BoltIcon className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg text-black font-medium">Options d'envoi (optionnel)</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <OptionCard
                title="Standard"
                icon={<TruckIcon />}
                isSelected={expressOption === ''}
                onClick={() => setExpressOption('')}
              />
              <OptionCard
                title="Express 72h"
                icon={<ClockIcon />}
                isSelected={expressOption === '72h'}
                onClick={() => setExpressOption('72h')}
              />
              <OptionCard
                title="Express 48h"
                icon={<ClockIcon />}
                isSelected={expressOption === '48h'}
                onClick={() => setExpressOption('48h')}
              />
              <OptionCard
                title="Express 24h"
                icon={<ClockIcon />}
                isSelected={expressOption === '24h'}
                onClick={() => setExpressOption('24h')}
              />
            </div>
          </div>

          {/* Section Options de Livreur */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center mb-3">
              <UsersIcon className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg text-black font-medium">Options de Livreur (optionnel)</h2>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Facilitez-vous la vie ! Nos livreurs peuvent s'occuper de la prise en charge et/ou de la livraison finale.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <OptionCard
                title="Prise en charge à domicile"
                description="Le livreur récupère le colis chez vous et le dépose au point relais."
                icon={<HomeModernIcon />}
                isSelected={packageData.deliveryAtOrigin}
                onClick={() => setPackageData(prev => ({ ...prev, deliveryAtOrigin: !prev.deliveryAtOrigin }))}
                isToggle={true}
                cost={DELIVERY_AT_ORIGIN_COST}
              />
              <OptionCard
                title="Livraison au destinataire"
                description="Le livreur récupère le colis au point relais d'arrivée et le livre à l'adresse du destinataire."
                icon={<MapPinIcon />}
                isSelected={packageData.deliveryAtDestination}
                onClick={() => setPackageData(prev => ({ ...prev, deliveryAtDestination: !prev.deliveryAtDestination }))}
                isToggle={true}
                cost={DELIVERY_AT_DESTINATION_COST}
              />
            </div>
            {!packageData.deliveryAtOrigin && !packageData.deliveryAtDestination && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                <InformationCircleIcon className="w-3 h-3 inline mr-1" />
                Par défaut, vous déposez et récupérez vous-même le colis aux points relais.
              </p>
            )}
          </div>
        </div>

        {/* Résumé et prix du colis */}
        <div className="w-full lg:w-96 bg-gray-50 p-4 rounded-lg shadow-md border border-gray-200 h-fit sticky top-24 animate-fadeIn" style={{ animationDelay: '0.7s' }}>
          <h3 className="text-xl font-bold mb-4 text-green-700 flex items-center">
            <TruckIcon className="w-6 h-6 mr-2" />
            RÉSUMÉ DU COLIS
          </h3>
          <div className="flex items-start mb-4">
            {packageData.image ? (
              <div className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-200 mr-3">
                <Image
                  src={packageData.image}
                  alt="Photo du colis"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            ) : (
              <div className="bg-green-100 p-3 rounded-md mr-3 flex items-center justify-center w-20 h-20">
                <ShoppingBagIcon className="w-10 h-10 text-green-600" />
              </div>
            )}
            <div>
              <p className="font-semibold text-black text-base break-words">
                {packageData.designation ? packageData.designation : 'Colis en cours...'}
              </p>
              <p className="text-sm text-gray-500">
                {expressOption ? `Livraison Express ${expressOption}` : 'Livraison Standard'}
              </p>
            </div>
          </div>
          <div className="border-b border-gray-300 pb-3 mb-3 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Poids :</span>
              <span className="font-medium text-black">{packageData.weight ? `${packageData.weight} kg` : "..."}</span>
            </div>
            {volume !== null && volume > 0 && (
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Volume :</span>
                <span className="font-medium text-black">
                  {volume.toLocaleString()} cm³
                </span>
              </div>
            )}
            {(packageData.isFragile || packageData.isPerishable || packageData.isInsured) && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="text-gray-600 block mb-1">Spécificités :</span>
                {packageData.isFragile && <span className="font-medium text-orange-500 block text-xs ml-2">- Fragile</span>}
                {packageData.isPerishable && <span className="font-medium text-red-500 block text-xs ml-2">- Périssable</span>}
                {packageData.isInsured && <span className="font-medium text-blue-500 block text-xs ml-2">- Assuré (val. {parseFloat(packageData.declaredValue) > 0 ? `${parseFloat(packageData.declaredValue).toLocaleString()} FCFA` : 'N/A'})</span>}
              </div>
            )}
          </div>
          <div className="border-b border-gray-300 pb-3 mb-3 text-sm">
            <h4 className="text-gray-700 font-semibold mb-1">Détail du coût :</h4>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Prix de base :</span>
              <span className="font-medium text-black">
                {priceLoading ? <LoadingDots /> : basePriceForCalc !== null ? `${Math.round(basePriceForCalc).toLocaleString()} FCFA` : "..."}
              </span>
            </div>
            {packageData.isFragile && basePriceForCalc !== null && (
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Suppl. fragile :</span>
                <span className="font-medium text-orange-500">
                  {priceLoading ? <LoadingDots /> : `+${Math.round(basePriceForCalc * 0.15).toLocaleString()} FCFA`}
                </span>
              </div>
            )}
            {packageData.isPerishable && basePriceForCalc !== null && (
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Suppl. périssable :</span>
                <span className="font-medium text-red-500">
                  {priceLoading ? <LoadingDots /> : `+${Math.round(basePriceForCalc * 0.20).toLocaleString()} FCFA`}
                </span>
              </div>
            )}
            {packageData.isInsured && parseFloat(packageData.declaredValue) > 0 && (
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Assurance :</span>
                <span className="font-medium text-blue-500">
                  {priceLoading ? <LoadingDots /> : `+${Math.round(parseFloat(packageData.declaredValue) * 0.05).toLocaleString()} FCFA`}
                </span>
              </div>
            )}
            {expressOption && basePriceForCalc !== null && (
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Suppl. Express {expressOption} :</span>
                <span className="font-medium text-purple-500">
                  {priceLoading ? <LoadingDots /> :
                    expressOption === '24h' ? `+${Math.round(basePriceForCalc * 0.30).toLocaleString()} FCFA` :
                    expressOption === '48h' ? `+${Math.round(basePriceForCalc * 0.20).toLocaleString()} FCFA` :
                    expressOption === '72h' ? `+${Math.round(basePriceForCalc * 0.10).toLocaleString()} FCFA` : '...'
                  }
                </span>
              </div>
            )}
            {packageData.deliveryAtOrigin && (
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Prise en charge domicile :</span>
                <span className="font-medium text-teal-500">
                  {priceLoading ? <LoadingDots /> : `+${DELIVERY_AT_ORIGIN_COST.toLocaleString()} FCFA`}
                </span>
              </div>
            )}
            {packageData.deliveryAtDestination && (
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Livraison destinataire :</span>
                <span className="font-medium text-teal-500">
                  {priceLoading ? <LoadingDots /> : `+${DELIVERY_AT_DESTINATION_COST.toLocaleString()} FCFA`}
                </span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mb-4 mt-4">
            <span className="font-bold text-black text-lg">TOTAL ESTIMÉ</span>
            <span className="font-bold text-2xl text-green-700">
              {priceLoading ? <LoadingDots /> : price !== null ? `${Math.round(price).toLocaleString()} FCFA` : "..."}
            </span>
          </div>
          <button
            onClick={handleContinue}
            className={`w-full py-3 px-4 rounded-md font-bold text-white flex items-center justify-center transition-all text-base ${
              isFormValid ?
              'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg' :
              'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={!isFormValid}
          >
            Continuer vers la destination
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </button>
          {validationError && (
            <p className="text-xs text-center mt-3 text-orange-500">
              <InformationCircleIcon className="w-4 h-4 inline mr-1" />
              {validationError}
            </p>
          )}
          {isFormValid && !validationError && (
            <p className="text-xs text-center mt-3 text-green-600">
              <CheckCircleIcon className="w-4 h-4 inline mr-1" />
              Prêt à continuer.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackageRegistration;
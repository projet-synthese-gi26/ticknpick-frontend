'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  TruckIcon, ShoppingBagIcon, ArrowRightIcon, ArrowLeftIcon, PhotoIcon,
  XCircleIcon, ScaleIcon, ExclamationTriangleIcon, BeakerIcon, ClockIcon,
  CheckCircleIcon, InformationCircleIcon, ShieldCheckIcon, BoltIcon,
  UsersIcon, HomeModernIcon, MapPinIcon, CameraIcon
} from '@heroicons/react/24/outline';

interface PackageData {
  image: string | null; designation: string; weight: string; length: string;
  width: string; height: string; isFragile: boolean; contentType: 'solid' | 'liquid' | '';
  isPerishable: boolean; description: string; declaredValue: string;
  isInsured: boolean; deliveryAtOrigin: boolean; deliveryAtDestination: boolean;
}

type ExpressOption = '' | '24h' | '48h' | '72h';

interface PackageRegistrationProps {
  initialData?: Partial<PackageData & { expressOption: ExpressOption }>;
  onContinue: (data: PackageData & { expressOption: ExpressOption }, totalPrice: number) => void;
  onBack: () => void;
}

const DELIVERY_AT_ORIGIN_COST = 1200; const DELIVERY_AT_DESTINATION_COST = 1800;

const LoadingDots = () => (
  <div className="flex space-x-1"><div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce"></div><div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div><div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div></div>
);

const OptionCard = ({ title, description, icon, isSelected, onClick, cost }: {
  title: string; description?: string; icon: ReactNode; isSelected: boolean;
  onClick: () => void; cost?: number;
}) => (
  <div className={`border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md flex flex-col items-center text-center text-xs relative ${isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'}`} onClick={onClick}>
    <div className={`p-1.5 rounded-full mb-1 ${isSelected ? 'bg-orange-100' : 'bg-gray-100'}`}>
      {React.cloneElement(icon as React.ReactElement, { className: `w-4 h-4 ${isSelected ? 'text-orange-600' : 'text-gray-500'}` })}
    </div>
    <span className={`font-medium ${isSelected ? 'text-orange-700' : 'text-gray-800'}`}>{title}</span>
    {description && <span className={`text-xs ${isSelected ? 'text-orange-600' : 'text-gray-500'}`}>{description}</span>}
    {cost !== undefined && <span className={`text-xs ${isSelected ? 'text-orange-600' : 'text-gray-500'}`}>+{cost.toLocaleString()}</span>}
    {isSelected && <CheckCircleIcon className="absolute -top-1 -right-1 w-4 h-4 text-orange-500" />}
  </div>
);

export default function FomulaireColisExpedition({ onContinue, initialData = {}, onBack }: PackageRegistrationProps) {
  const [packageData, setPackageData] = useState<PackageData>({
    image: null, designation: '', weight: '', length: '', width: '', height: '',
    isFragile: false, contentType: '', isPerishable: false, description: '',
    declaredValue: '', isInsured: false, deliveryAtOrigin: false, deliveryAtDestination: false,
    ...initialData,
  });

  const [expressOption, setExpressOption] = useState<ExpressOption>(initialData.expressOption || '');
  const [priceLoading, setPriceLoading] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [basePriceForCalc, setBasePriceForCalc] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const { image, designation, weight } = packageData;
    setIsFormValid(image && designation.trim() && parseFloat(weight) > 0);
  }, [packageData]);

  useEffect(() => {
    const { weight, isFragile, contentType, isPerishable, length, width, height, declaredValue, isInsured, deliveryAtOrigin, deliveryAtDestination } = packageData;
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) { setPrice(null); setBasePriceForCalc(null); return; }
    
    setPriceLoading(true);
    const lengthNum = parseFloat(length) || 0, widthNum = parseFloat(width) || 0, heightNum = parseFloat(height) || 0, declaredValueNum = parseFloat(declaredValue) || 0;
    const vol = lengthNum * widthNum * heightNum, volumetricWeight = vol / 5000;

    setTimeout(() => {
      let basePrice = 1500 + (volumetricWeight > weightNum ? volumetricWeight : weightNum) * 300;
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
    }, 300);
  }, [packageData, expressOption]);

  const handleContinue = () => {
    if (isFormValid && price !== null) onContinue({ ...packageData, expressOption }, price);
    else alert("Veuillez remplir tous les champs obligatoires.");
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size < 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => setPackageData(prev => ({ ...prev, image: reader.result as string }));
      reader.readAsDataURL(file);
    } else if (file) alert("Image trop lourde (max 5MB).");
  };
  
  const validateNumberInput = (value: string) => value === '' || /^(\d+)?(\.\d{0,2})?$/.test(value);

  const sections = [
    {
      id: 'photo',
      title: 'Photo du colis',
      icon: <PhotoIcon className="w-5 h-5" />,
      content: (
        <div onClick={() => fileInputRef.current?.click()} className="relative w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-500 transition-colors group">
          {packageData.image ? (
            <>
              <img src={packageData.image} alt="Aperçu" className="w-full h-full object-cover rounded-lg"/>
              <button onClick={(e) => { e.stopPropagation(); setPackageData(prev => ({ ...prev, image: null })); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">
                <XCircleIcon className="w-4 h-4"/>
              </button>
            </>
          ) : (
            <div className="text-center text-gray-500 group-hover:text-orange-500 transition-colors">
              <CameraIcon className="w-8 h-8 mx-auto mb-1"/>
              <p className="text-sm">Ajouter une photo</p>
            </div>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleImageUpload}/>
        </div>
      )
    },
    {
      id: 'info',
      title: 'Informations',
      icon: <ShoppingBagIcon className="w-5 h-5" />,
      content: (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Désignation <span className="text-red-500">*</span></label>
            <input type="text" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm" value={packageData.designation} onChange={e => setPackageData(prev => ({ ...prev, designation: e.target.value }))} placeholder="Ex: Vêtements, Livres..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={2} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm" value={packageData.description} onChange={e => setPackageData(prev => ({ ...prev, description: e.target.value }))} placeholder="Détails sur le contenu..."/>
          </div>
        </div>
      )
    },
    {
      id: 'dimensions',
      title: 'Poids & Dimensions',
      icon: <ScaleIcon className="w-5 h-5" />,
      content: (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poids (kg) <span className="text-red-500">*</span></label>
            <input type="text" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm" value={packageData.weight} onChange={e => validateNumberInput(e.target.value) && setPackageData(prev => ({ ...prev, weight: e.target.value }))} placeholder="0.5"/>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input type="text" placeholder="L (cm)" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm" value={packageData.length} onChange={e => validateNumberInput(e.target.value) && setPackageData(prev => ({ ...prev, length: e.target.value }))}/>
            <input type="text" placeholder="l (cm)" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm" value={packageData.width} onChange={e => validateNumberInput(e.target.value) && setPackageData(prev => ({ ...prev, width: e.target.value }))}/>
            <input type="text" placeholder="H (cm)" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm" value={packageData.height} onChange={e => validateNumberInput(e.target.value) && setPackageData(prev => ({ ...prev, height: e.target.value }))}/>
          </div>
        </div>
      )
    },
    {
      id: 'special',
      title: 'Options spéciales',
      icon: <ExclamationTriangleIcon className="w-5 h-5" />,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <OptionCard title="Fragile" icon={<ExclamationTriangleIcon />} isSelected={packageData.isFragile} onClick={() => setPackageData(p => ({ ...p, isFragile: !p.isFragile }))} />
            <OptionCard title="Liquide" icon={<BeakerIcon />} isSelected={packageData.contentType === 'liquid'} onClick={() => setPackageData(p => ({ ...p, contentType: p.contentType === 'liquid' ? '' : 'liquid' }))} />
            <OptionCard title="Périssable" icon={<ClockIcon />} isSelected={packageData.isPerishable} onClick={() => setPackageData(p => ({ ...p, isPerishable: !p.isPerishable }))} />
            <OptionCard title="Assurer" icon={<ShieldCheckIcon />} isSelected={packageData.isInsured} onClick={() => setPackageData(p => ({ ...p, isInsured: !p.isInsured }))} />
          </div>
          {packageData.isInsured && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valeur déclarée (FCFA)</label>
              <input type="text" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm" value={packageData.declaredValue} onChange={e => validateNumberInput(e.target.value) && setPackageData(p => ({ ...p, declaredValue: e.target.value }))} placeholder="10000"/>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'express',
      title: 'Options d\'envoi',
      icon: <BoltIcon className="w-5 h-5" />,
      content: (
        <div className="grid grid-cols-4 gap-2">
          <OptionCard title="Standard" icon={<TruckIcon />} isSelected={expressOption === ''} onClick={() => setExpressOption('')}/>
          <OptionCard title="72h" icon={<ClockIcon />} isSelected={expressOption === '72h'} onClick={() => setExpressOption('72h')}/>
          <OptionCard title="48h" icon={<ClockIcon />} isSelected={expressOption === '48h'} onClick={() => setExpressOption('48h')}/>
          <OptionCard title="24h" icon={<ClockIcon />} isSelected={expressOption === '24h'} onClick={() => setExpressOption('24h')}/>
        </div>
      )
    },
    {
      id: 'delivery',
      title: 'Services de livraison',
      icon: <UsersIcon className="w-5 h-5" />,
      content: (
        <div className="grid grid-cols-2 gap-2">
          <OptionCard title="Prise en charge à domicile" icon={<HomeModernIcon />} isSelected={packageData.deliveryAtOrigin} onClick={() => setPackageData(p => ({ ...p, deliveryAtOrigin: !p.deliveryAtOrigin }))} cost={DELIVERY_AT_ORIGIN_COST}/>
          <OptionCard title="Livraison au destinataire" icon={<MapPinIcon />} isSelected={packageData.deliveryAtDestination} onClick={() => setPackageData(p => ({ ...p, deliveryAtDestination: !p.deliveryAtDestination }))} cost={DELIVERY_AT_DESTINATION_COST}/>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {sections.map((section, index) => (
            <motion.div key={section.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
              <h3 className="flex items-center text-base font-semibold text-gray-800 mb-3 gap-2">
                <div className="text-orange-500">{section.icon}</div>
                {section.title}
                {(section.id === 'photo' || section.id === 'info' || section.id === 'dimensions') && <span className="text-red-500">*</span>}
              </h3>
              {section.content}
            </motion.div>
          ))}
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-orange-50 p-4 rounded-lg shadow-sm border border-orange-100 sticky top-4">
            <h3 className="text-lg font-bold mb-3 text-orange-800 flex items-center gap-2">
              <TruckIcon className="w-5 h-5" />
              Résumé du colis
            </h3>
            
            {packageData.image && (
              <div className="mb-3">
                <img src={packageData.image} alt="Colis" className="w-16 h-16 object-cover rounded-lg border-2 border-orange-200"/>
              </div>
            )}
            
            <div className="space-y-2 text-sm border-t border-orange-200 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Prix de base:</span>
                <span className="font-medium">{priceLoading ? <LoadingDots/> : (basePriceForCalc?.toLocaleString() ?? '...') + ' FCFA'}</span>
              </div>
              {packageData.isFragile && basePriceForCalc && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fragile:</span>
                  <span className="font-medium text-orange-600">+{(basePriceForCalc * 0.15).toLocaleString()} FCFA</span>
                </div>
              )}
              {packageData.contentType === 'liquid' && basePriceForCalc && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Liquide:</span>
                  <span className="font-medium text-orange-600">+{(basePriceForCalc * 0.10).toLocaleString()} FCFA</span>
                </div>
              )}
              {packageData.isPerishable && basePriceForCalc && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Périssable:</span>
                  <span className="font-medium text-orange-600">+{(basePriceForCalc * 0.20).toLocaleString()} FCFA</span>
                </div>
              )}
              {expressOption && basePriceForCalc && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Express {expressOption}:</span>
                  <span className="font-medium text-orange-600">+{(basePriceForCalc * (expressOption === '24h' ? 0.3 : expressOption === '48h' ? 0.2 : 0.1)).toLocaleString()} FCFA</span>
                </div>
              )}
              {packageData.deliveryAtOrigin && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Prise domicile:</span>
                  <span className="font-medium text-orange-600">+{DELIVERY_AT_ORIGIN_COST.toLocaleString()} FCFA</span>
                </div>
              )}
              {packageData.deliveryAtDestination && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Livraison finale:</span>
                  <span className="font-medium text-orange-600">+{DELIVERY_AT_DESTINATION_COST.toLocaleString()} FCFA</span>
                </div>
              )}
            </div>
            
            <div className="border-t-2 border-dashed border-orange-300 mt-3 pt-3 flex justify-between items-center">
              <span className="font-bold text-gray-800">TOTAL</span>
              <span className="font-black text-xl text-orange-600">{priceLoading ? <LoadingDots/> : (price !== null ? `${Math.round(price).toLocaleString()} FCFA` : '...')}</span>
            </div>
            
            {!isFormValid && (
              <div className="text-xs text-center mt-3 text-red-600 p-2 bg-red-50 rounded-md flex items-center gap-1">
                <InformationCircleIcon className="w-4 h-4" />
                Photo, désignation et poids requis
              </div>
            )}
            
            {isFormValid && (
              <div className="text-xs text-center mt-3 text-green-700 p-2 bg-green-50 rounded-md flex items-center gap-1">
                <CheckCircleIcon className="w-4 h-4" />
                Prêt à continuer
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t flex justify-between items-center">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors">
          <ArrowLeftIcon className="w-4 h-4"/>
          Précédent
        </button>
        <button onClick={handleContinue} disabled={!isFormValid || price === null} className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg font-bold shadow-md hover:shadow-lg hover:bg-orange-600 transition-all disabled:bg-gray-400 disabled:shadow-none">
          Continuer
          <ArrowRightIcon className="w-4 h-4"/>
        </button>
      </div>
    </div>
  );
}
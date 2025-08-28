'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/context/NotificationContext';
import { notifyOnPackageDeposit } from '@/lib/notification';
import { CreditCardIcon, DevicePhoneMobileIcon, BanknotesIcon, GiftIcon, ArrowLeftIcon, CheckCircleIcon, LockClosedIcon, ShareIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';

// Interfaces définies une seule fois et correctement typées
interface SenderData {
    senderName: string;
    senderPhone: string;
}

interface PackageData {
    weight: string;
    length: string;
    width: string;
    height: string;
    designation: string;
    isFragile: boolean;
    isPerishable: boolean;
    isInsured: boolean;
    declaredValue: string;
}

interface RouteData {
    departurePointName: string;
    arrivalPointName: string;
    recipientName: string;
    recipientPhone: string;
    departurePointId?: number | null;
    arrivalPointId?: number | null;
}

interface CurrentUser {
    id: string;
    full_name: string | null;
    phone: string | null;
    email?: string;
}

// Interface pour FormData (reconstruite à partir du contexte)
interface FormData {
    senderName: string;
    senderPhone: string;
    senderAddress: string;
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;
    departurePoint: string;
    arrivalPoint: string;
    departurePointId: number;
    arrivalPointId: number;
}

type PaymentStatusType = 'success' | 'pending_cash' | 'pending_recipient' | 'error' | '';

interface PaymentStepProps {
    senderData: SenderData;
    packageData: PackageData;
    routeData: RouteData;
    totalPrice: number;
    currentUser: CurrentUser;
    onBack: () => void;
    onSuccess: () => void;
    onNewTask: () => void;
}

export default function PaymentStepExpedition({ 
    senderData, 
    packageData, 
    routeData, 
    totalPrice,
    currentUser, 
    onBack, 
    onSuccess, 
    onNewTask 
}: PaymentStepProps) {
    const { addNotification } = useNotification();
    const [selectedMethod, setSelectedMethod] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState(0);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatusType>('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', holder: '' });
    const [mobileData, setMobileData] = useState({ operator: '', number: '' });

    // Reconstruction de formData à partir des props
    const formData: FormData = {
        senderName: senderData.senderName,
        senderPhone: senderData.senderPhone,
        senderAddress: '', // Valeur par défaut si non fournie
        recipientName: routeData.recipientName,
        recipientPhone: routeData.recipientPhone,
        recipientAddress: '', // Valeur par défaut si non fournie
        departurePoint: routeData.departurePointName,
        arrivalPoint: routeData.arrivalPointName,
        departurePointId: routeData.departurePointId || 0,
        arrivalPointId: routeData.arrivalPointId || 0,
    };

    const paymentMethods = [
        { id: 'card', name: 'Carte bancaire', icon: CreditCardIcon, fee: 0, gradient: 'from-blue-500 to-blue-600', popular: false },
        { id: 'mobile', name: 'Paiement Mobile', icon: DevicePhoneMobileIcon, fee: 100, gradient: 'from-orange-500 to-orange-600', popular: true },
        { id: 'cash', name: 'Paiement en espèces', icon: BanknotesIcon, fee: 0, gradient: 'from-gray-500 to-gray-600', popular: false },
        { id: 'recipient', name: 'Paiement par destinataire', icon: GiftIcon, fee: 0, gradient: 'from-purple-500 to-purple-600', popular: false }
    ];

    const calculatePackageBasePrice = (): number => {
        const weight = parseFloat(packageData.weight) || 0;
        const volume = (parseFloat(packageData.length) || 0) * (parseFloat(packageData.width) || 0) * (parseFloat(packageData.height) || 0);
        return Math.max(2000, weight * 500 + volume * 0.1);
    };

    const calculateAdditionalFees = (): number => {
        let fees = 0;
        if (packageData.isFragile) fees += 500;
        if (packageData.isPerishable) fees += 300;
        if (packageData.isInsured) fees += parseFloat(packageData.declaredValue) * 0.02;
        return fees;
    };

    // Helper function to get selected payment method
    const getSelectedPaymentMethod = () => {
        return paymentMethods.find(m => m.id === selectedMethod);
    };

    const calculateTotalForPayer = (): number => {
        const basePrice = calculatePackageBasePrice();
        const additionalFees = calculateAdditionalFees();
        const selectedPaymentMethod = getSelectedPaymentMethod();
        const methodFee = selectedPaymentMethod?.fee || 0;
        return basePrice + additionalFees + methodFee;
    };

    const generateReceipt = () => {
        const doc = new jsPDF();
        const trackingNum = `PDL-${Date.now().toString().slice(-8)}`;
        
        doc.setFontSize(20);
        doc.text('BORDEREAU D\'EXPÉDITION', 105, 30, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`N° de suivi: ${trackingNum}`, 20, 50);
        doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 150, 50);
        
        doc.text('EXPÉDITEUR', 20, 70);
        doc.text(`${formData.senderName}`, 20, 80);
        doc.text(`${formData.senderPhone}`, 20, 90);
        doc.text(`${formData.senderAddress}`, 20, 100);
        
        doc.text('DESTINATAIRE', 120, 70);
        doc.text(`${formData.recipientName}`, 120, 80);
        doc.text(`${formData.recipientPhone}`, 120, 90);
        doc.text(`${formData.recipientAddress}`, 120, 100);
        
        doc.text('TRAJET', 20, 120);
        doc.text(`De: ${formData.departurePoint}`, 20, 130);
        doc.text(`Vers: ${formData.arrivalPoint}`, 20, 140);
        
        doc.text('DÉTAILS DU COLIS', 20, 160);
        doc.text(`Désignation: ${packageData.designation}`, 20, 170);
        doc.text(`Poids: ${packageData.weight} kg`, 20, 180);
        doc.text(`Dimensions: ${packageData.length}×${packageData.width}×${packageData.height} cm`, 20, 190);
        
        doc.text('RÉCAPITULATIF FINANCIER', 20, 210);
        doc.text(`Prix de base: ${calculatePackageBasePrice().toLocaleString()} FCFA`, 20, 220);
        doc.text(`Frais additionnels: ${calculateAdditionalFees().toLocaleString()} FCFA`, 20, 230);
        doc.text(`TOTAL: ${calculateTotalForPayer().toLocaleString()} FCFA`, 20, 240);
        
        doc.save(`bordereau-${trackingNum}.pdf`);
    };

    const handlePayment = async () => {
        if (!selectedMethod) { 
            addNotification("Sélectionnez une méthode de paiement", 'error'); 
            return; 
        }
        
        setIsProcessing(true);
        const steps = ['Validation des données', 'Traitement du paiement', 'Enregistrement', 'Finalisation'];
        
        for (let i = 0; i < steps.length; i++) {
            setProcessingStep(i);
            await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        try {
            const newTrackingNumber = `PDL-${Date.now().toString().slice(-8)}`;
            const shipmentData = {
                trackingNumber: newTrackingNumber,
                status: 'ARRIVE_AU_RELAIS',
                senderName: formData.senderName,
                senderPhone: formData.senderPhone,
                recipientName: formData.recipientName,
                recipientPhone: formData.recipientPhone,
                description: packageData.designation,
                weight: parseFloat(packageData.weight),
                isFragile: packageData.isFragile,
                isPerishable: packageData.isPerishable,
                isInsured: packageData.isInsured,
                declaredValue: packageData.isInsured ? parseFloat(packageData.declaredValue) : 0,
                departurePointId: formData.departurePointId,
                arrivalPointId: formData.arrivalPointId,
                shippingCost: calculateTotalForPayer(),
                isPaidAtDeparture: selectedMethod !== 'recipient',
                amountPaid: selectedMethod !== 'recipient' ? calculateTotalForPayer() : null,
                paymentMethod: selectedMethod,
                created_by_user: currentUser.id
            };

            const { error } = await supabase.from('Shipment').insert(shipmentData);
            if (error) throw new Error(error.message);
            
            setTrackingNumber(newTrackingNumber);
            setPaymentStatus(selectedMethod === 'cash' ? 'pending_cash' : selectedMethod === 'recipient' ? 'pending_recipient' : 'success');
            
            await notifyOnPackageDeposit({
                trackingNumber: newTrackingNumber,
                recipientName: formData.recipientName,
                recipientPhone: formData.recipientPhone,
                senderName: formData.senderName,
                senderPhone: formData.senderPhone,
                arrivalPointName: formData.arrivalPoint
            });

            addNotification(`Colis ${newTrackingNumber} enregistré avec succès !`, 'success');
        } catch (err: any) {
            addNotification(`Erreur: ${err.message}`, 'error');
            setPaymentStatus('error');
        }
        
        setIsProcessing(false);
    };

    const shareTracking = async () => {
        const text = `🚚 Suivi de colis PDL\n\n📦 Numéro: ${trackingNumber}\n📍 ${formData.departurePoint} → ${formData.arrivalPoint}\n👤 Pour: ${formData.recipientName}\n\n🔗 Suivez votre colis sur notre site`;
        
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Suivi de colis PDL', text });
            } catch (err) {
                navigator.clipboard.writeText(text);
                addNotification('Informations copiées !', 'success');
            }
        } else {
            navigator.clipboard.writeText(text);
            addNotification('Informations copiées !', 'success');
        }
    };

    if (paymentStatus && paymentStatus !== 'error') {
        const statusConfig: Record<Exclude<PaymentStatusType, 'error' | ''>, { color: string, icon: React.ComponentType<any>, title: string, message: string }> = {
            success: { color: 'orange', icon: CheckCircleIcon, title: 'Paiement réussi !', message: 'Votre colis est enregistré et sera traité rapidement.' },
            pending_cash: { color: 'yellow', icon: BanknotesIcon, title: 'En attente de paiement', message: 'Effectuez le paiement au point relais pour finaliser.' },
            pending_recipient: { color: 'purple', icon: GiftIcon, title: 'Paiement par destinataire', message: 'Le destinataire paiera à la réception du colis.' }
        };
        
        const config = statusConfig[paymentStatus];
        const IconComponent = config.icon;
        
        return (
            <div className="max-w-2xl mx-auto text-center space-y-6">
                <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-${config.color}-400 to-${config.color}-600 flex items-center justify-center animate-pulse`}>
                    <IconComponent className="w-12 h-12 text-white" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{config.title}</h2>
                    <p className="text-gray-600 mb-4">{config.message}</p>
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-600 mb-1">Numéro de suivi</p>
                        <p className="text-2xl font-bold text-orange-600">{trackingNumber}</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={generateReceipt} className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors">
                        Télécharger le bordereau
                    </button>
                    <button onClick={shareTracking} className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                        <ShareIcon className="w-5 h-5" /> Partager
                    </button>
                    <button onClick={onNewTask} className="bg-orange-100 text-orange-700 px-6 py-3 rounded-lg font-semibold hover:bg-orange-200 transition-colors">
                        Nouvelle expédition
                    </button>
                </div>
            </div>
        );
    }

    if (isProcessing) {
        const steps = ['Validation des données', 'Traitement du paiement', 'Enregistrement', 'Finalisation'];
        return (
            <div className="max-w-2xl mx-auto text-center space-y-8">
                <div className="w-16 h-16 mx-auto border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Traitement en cours...</h2>
                    <div className="bg-gray-200 rounded-full h-2 mb-4">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500" style={{ width: `${((processingStep + 1) / steps.length) * 100}%` }}></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {steps.map((step, index) => (
                            <div key={index} className={`p-3 rounded-lg text-sm ${index <= processingStep ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                                <div className={`w-6 h-6 mx-auto mb-2 rounded-full flex items-center justify-center ${index <= processingStep ? 'bg-orange-600' : 'bg-gray-300'}`}>
                                    <span className="text-white text-xs font-bold">{index + 1}</span>
                                </div>
                                {step}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Get the selected payment method for the summary
    const selectedPaymentMethod = getSelectedPaymentMethod();

    return (
        <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Choisissez votre méthode de paiement</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {paymentMethods.map((method) => {
                                const IconComponent = method.icon;
                                return (
                                    <div key={method.id} className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${selectedMethod === method.id ? `border-orange-500 shadow-lg` : 'border-gray-200'} bg-gradient-to-br ${method.gradient}`}
                                        onClick={() => setSelectedMethod(method.id)}>
                                        {method.popular && (
                                            <div className="absolute -top-2 -right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">POPULAIRE</div>
                                        )}
                                        <div className="flex items-center justify-between mb-4">
                                            <IconComponent className="w-8 h-8 text-white" />
                                            {selectedMethod === method.id && (
                                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                                    <CheckCircleIcon className="w-6 h-6 text-orange-600" />
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-white mb-2">{method.name}</h3>
                                        <p className="text-white/80 text-sm">{method.fee === 0 ? 'Gratuit' : `${method.fee} FCFA de frais`}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {selectedMethod === 'card' && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
                            <h3 className="font-semibold text-lg">Informations de la carte</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <input 
                                    placeholder="Numéro de carte" 
                                    value={cardData.number} 
                                    onChange={(e) => setCardData({...cardData, number: e.target.value})} 
                                    className="col-span-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                                />
                                <input 
                                    placeholder="MM/AA" 
                                    value={cardData.expiry} 
                                    onChange={(e) => setCardData({...cardData, expiry: e.target.value})} 
                                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                                />
                                <input 
                                    placeholder="CVV" 
                                    value={cardData.cvv} 
                                    onChange={(e) => setCardData({...cardData, cvv: e.target.value})} 
                                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                                />
                                <input 
                                    placeholder="Nom du titulaire" 
                                    value={cardData.holder} 
                                    onChange={(e) => setCardData({...cardData, holder: e.target.value})} 
                                    className="col-span-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                                />
                            </div>
                        </div>
                    )}

                    {selectedMethod === 'mobile' && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
                            <h3 className="font-semibold text-lg">Paiement mobile</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <select 
                                    value={mobileData.operator} 
                                    onChange={(e) => setMobileData({...mobileData, operator: e.target.value})} 
                                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="">Opérateur</option>
                                    <option value="orange">Orange Money</option>
                                    <option value="mtn">MTN MoMo</option>
                                </select>
                                <input 
                                    placeholder="Numéro" 
                                    value={mobileData.number} 
                                    onChange={(e) => setMobileData({...mobileData, number: e.target.value})} 
                                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2">
                    <div className="sticky top-4 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <LockClosedIcon className="w-5 h-5 text-orange-600" />
                            <span className="text-sm text-gray-600">Paiement sécurisé</span>
                        </div>
                        
                        <h3 className="font-semibold text-lg">Résumé de la commande</h3>
                        
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">📦 {packageData.designation}</span>
                                <span>{calculatePackageBasePrice().toLocaleString()} FCFA</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">📍 {formData.departurePoint} → {formData.arrivalPoint}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">📞 {currentUser.full_name || 'Utilisateur'}</span>
                            </div>
                            
                            {calculateAdditionalFees() > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Frais additionnels</span>
                                    <span>{calculateAdditionalFees().toLocaleString()} FCFA</span>
                                </div>
                            )}
                                                        
                            {selectedPaymentMethod && selectedPaymentMethod.fee > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Frais de paiement</span>
                                    <span>{selectedPaymentMethod.fee.toLocaleString()} FCFA</span>
                                </div>
                            )}
                            
                            <div className="border-t pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Total</span>
                                    <span className="text-2xl font-bold text-orange-600">{calculateTotalForPayer().toLocaleString()} FCFA</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-3 pt-4">
                            <button onClick={onBack} className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                                <ArrowLeftIcon className="w-5 h-5" /> Retour
                            </button>
                            <button onClick={handlePayment} disabled={!selectedMethod} className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-400 transition-colors">
                                Confirmer le paiement
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
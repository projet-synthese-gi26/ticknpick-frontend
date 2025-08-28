'use client';
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import SenderInfoStep from './SenderInfoStep'; // Étape 1: Infos expéditeur
import FomulaireColisExpedition from './FormulaireColisExpedition'; // Réutilisé et adapté
import RouteSelectionExpedition from './RouteExpedition'; // Étape 3: Choix du trajet
import PaymentStepExpedition from './PaymentStepExpedition'; // Étape 4: Paiement
import { User, Truck, MapPin, CreditCard, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
interface SenderData {
    senderName: string;
    senderPhone: string;
}

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
  expressOption?: '' | '24h' | '48h' | '72h';
}

interface RouteData {
    departurePointName: string;
    arrivalPointName:string;
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


const Stepper = ({ currentStep }: { currentStep: number }) => {
    const steps = [
        { num: 1, title: "Expéditeur", icon: <User className="w-6 h-6"/> },
        { num: 2, title: "Colis", icon: <Truck className="w-6 h-6"/> },
        { num: 3, title: "Trajet", icon: <MapPin className="w-6 h-6"/> },
        { num: 4, title: "Paiement", icon: <CreditCard className="w-6 h-6"/> }
    ];
    return (
      <div className="flex justify-center items-center mb-10 w-full px-2">
         {steps.map((step, index) => (
          <React.Fragment key={step.num}>
            <div className="flex flex-col items-center text-center w-1/4">
               <div className={`rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 shadow-md ${step.num <= currentStep ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                  {step.num < currentStep ? <Check className="w-7 h-7" /> : step.icon}
               </div>
               <p className={`text-xs sm:text-sm font-semibold mt-2 ${step.num <= currentStep ? "text-orange-600" : "text-gray-600"}`}>{step.title}</p>
            </div>
            {index < steps.length - 1 && (
               <div className={`flex-1 h-1 self-start mt-6 transition-colors duration-300 ${step.num < currentStep ? "bg-orange-500" : "bg-gray-300"}`} />
            )}
         </React.Fragment>
        ))}
      </div>
    );
};

export default function ExpeditionPage() {
    const router = useRouter(); // AJOUT
    const [user, setUser] = useState<CurrentUser | null>(null); // AJOUT
    const [isLoadingUser, setIsLoadingUser] = useState(true); // AJOUT
    
    
    const [currentStep, setCurrentStep] = useState(1);
    const [senderData, setSenderData] = useState<SenderData>({ senderName: '', senderPhone: '' });
    const [packageData, setPackageData] = useState<PackageData | null>(null);
    const [routeData, setRouteData] = useState<RouteData | null>(null);
    const [totalPrice, setTotalPrice] = useState(0);


        // --- AJOUT : Hook pour charger l'utilisateur ---
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser({
                    id: session.user.id,
                    full_name: session.user.user_metadata.full_name || null,
                    phone: session.user.user_metadata.phone || null,
                    email: session.user.email
                });
                setSenderData({
                    senderName: session.user.user_metadata.full_name || '',
                    senderPhone: session.user.user_metadata.phone || ''
                });
            }
            setIsLoadingUser(false);
        };
        fetchUser();
    }, []);


    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <SenderInfoStep
                    initialData={senderData}
                    onContinue={(data) => {
                        setSenderData(data);
                        setCurrentStep(2);
                    }}
                />;
            case 2:
                return <FomulaireColisExpedition
                    // Si on a déjà des données, on peut les passer pour pré-remplir
                    initialData={packageData || {}} 
                    
                    // Fonction pour revenir en arrière
                    onBack={() => setCurrentStep(1)} 

                    // Fonction à exécuter quand le formulaire du colis est validé
                    onContinue={(data, price) => {
                        console.log("Données du colis reçues :", data);
                        console.log("Prix calculé :", price);
                        setPackageData(data); // On sauvegarde les données du colis
                        setTotalPrice(price); // On sauvegarde le prix
                        setCurrentStep(3);    // On passe à l'étape suivante
                    }}
                />;
            case 3:
                 return <RouteSelectionExpedition
                    onBack={() => setCurrentStep(2)}
                    // Quand RouteSelectionExpedition a fini, il appelle cette fonction
                    onNext={(data) => {
                        console.log("Données du trajet reçues :", data);
                        setRouteData(data); // On sauvegarde les données du trajet
                        setCurrentStep(4);  // On passe à l'étape du paiement
                    }}
                 />
            case 4:
                // --- MODIFICATION : S'assurer que les données et l'utilisateur sont prêts ---
                if (!packageData || !routeData || !user) {
                  return <div className="text-center text-red-500 p-8">Erreur de données. Veuillez revenir en arrière.</div>
                }
                return <PaymentStepExpedition
                    senderData={senderData}
                    packageData={packageData}
                    routeData={routeData}
                    totalPrice={totalPrice}
                    currentUser={user} // <-- On passe l'utilisateur
                    onBack={() => setCurrentStep(3)}
                    onSuccess={() => { /* ... */ }}
                    onNewTask={() => setCurrentStep(1) /* Ou une autre logique */}
                />;
            default:
                return null;
        }
    };
    
    return (
        <div className="min-h-screen bg-slate-100">
            <Navbar />
            <div className="h-20" /> {/* Spacer for fixed navbar */}
            <main className="container mx-auto px-4 py-8">
                <div className="text-center mb-10">
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-800">
                      Envoyez votre colis <span className="text-orange-600">simplement</span> et <span className="text-orange-600">rapidement</span>.
                    </h1>
                </div>
                 <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8 border border-gray-200">
                    <Stepper currentStep={currentStep} />
                    <AnimatePresence mode="wait">
                       <motion.div
                         key={currentStep}
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -20 }}
                         transition={{ duration: 0.3 }}
                       >
                         {renderStep()}
                       </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowPathIcon, 
  PrinterIcon, 
  ArchiveBoxIcon, 
  DocumentTextIcon, 
  BuildingOfficeIcon 
} from '@heroicons/react/24/outline';

export const ProcessingAnimation = () => {
  const [processingStep, setProcessingStep] = React.useState('Vérification des données...');
  
  const processingSteps = [
    'Vérification des données...',
    'Traitement du paiement...',
    'Enregistrement du colis...',
    'Génération du bordereau...'
  ];

  React.useEffect(() => {
    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % processingSteps.length;
      setProcessingStep(processingSteps[stepIndex]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);
  const steps = [
    {
      id: 1,
      icon: PrinterIcon,
      title: "Imprimer le bordereau",
      description: "Téléchargez et imprimez le bordereau d'expédition",
      color: "blue"
    },
    {
      id: 2,
      icon: ArchiveBoxIcon,
      title: "Emballer le colis",
      description: "Placez votre article dans un carton adapté",
      color: "green"
    },
    {
      id: 3,
      icon: DocumentTextIcon,
      title: "Coller le bordereau",
      description: "Fixez solidement le bordereau sur le colis",
      color: "purple"
    },
    {
      id: 4,
      icon: BuildingOfficeIcon,
      title: "Déposer en agence",
      description: "Apportez votre colis à l'agence de départ",
      color: "orange"
    }
  ];

  const getStepColor = (color) => {
    const colors = {
      blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
      purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800"
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 dark:bg-gray-900 px-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-12"
      >
        {/* Icône de chargement principal */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 dark:bg-orange-900/50 rounded-full mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <ArrowPathIcon className="w-10 h-10 text-orange-600 dark:text-orange-400" />
          </motion.div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Traitement en cours
        </h2>
        <p className="text-orange-600 dark:text-orange-400 font-medium text-lg mb-8">
          {processingStep}
        </p>
      </motion.div>

      {/* Étapes de l'expédition */}
      <div className="max-w-4xl w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-8"
        >
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Prochaines étapes après confirmation
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Suivez ces étapes simples pour finaliser votre expédition
          </p>
        </motion.div>

        {/* Grille des étapes - responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: 0.7 + (index * 0.2),
                duration: 0.5,
                ease: "easeOut"
              }}
              className="relative"
            >
              {/* Connecteur entre les étapes (masqué sur mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-3 w-6 h-0.5 bg-gray-300 dark:bg-gray-600 z-0">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ 
                      delay: 1.2 + (index * 0.2), 
                      duration: 0.8 
                    }}
                    className="h-full bg-orange-400 dark:bg-orange-500"
                  />
                </div>
              )}

              {/* Carte de l'étape */}
              <div className={`relative z-10 p-6 rounded-2xl border-2 ${getStepColor(step.color)} bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105`}>
                {/* Numéro de l'étape */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 rounded-full flex items-center justify-center font-bold text-sm">
                  {step.id}
                </div>

                {/* Icône avec animation */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.5
                  }}
                  className="mb-4"
                >
                  <step.icon className="w-12 h-12 mx-auto" />
                </motion.div>

                {/* Contenu */}
                <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">
                  {step.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Message d'encouragement */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="text-center mt-8 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            ✨ Votre colis sera prêt pour l'expédition une fois ces étapes terminées !
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Notre équipe vous accompagne à chaque étape du processus
          </p>
        </motion.div>
      </div>

      {/* Animation des points de chargement */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex justify-center items-center mt-8"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
            className="w-2 h-2 bg-orange-500 dark:bg-orange-400 rounded-full mx-1"
          />
        ))}
      </motion.div>
    </div>
  );
};

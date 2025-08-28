// FICHIER : src/components/NotificationBanner.tsx
// VERSION CORRIGÉE

'use client';

import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import { useNotification } from '../context/NotificationContext';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

// --- CORRECTION 1 : Définir un type clair pour les types de notification ---
type NotificationType = 'success' | 'error' | 'info';

// --- CORRECTION 2 : Définir une interface pour une notification (basée sur le contexte) ---
interface Notification {
  id: string | number;
  message: string;
  type: NotificationType;
  duration?: number;
  title?: string;
}

// --- CONFIGURATION DU DESIGN ---
// On type l'objet pour qu'il ne puisse être indexé que par NotificationType
const notificationStyles: Record<NotificationType, {
  icon: JSX.Element;
  bg: string;
  progressBar: string;
  titleColor: string;
  textColor: string;
}> = {
  success: {
    icon: <CheckCircle className="h-6 w-6 text-emerald-500" />,
    bg: 'bg-emerald-50/80 border-emerald-200 backdrop-blur-lg',
    progressBar: 'bg-emerald-500/70',
    titleColor: 'text-emerald-900',
    textColor: 'text-emerald-700'
  },
  error: {
    icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
    bg: 'bg-red-50/80 border-red-200 backdrop-blur-lg',
    progressBar: 'bg-red-500/70',
    titleColor: 'text-red-900',
    textColor: 'text-red-700'
  },
  info: {
    icon: <Info className="h-6 w-6 text-sky-500" />,
    bg: 'bg-sky-50/80 border-sky-200 backdrop-blur-lg',
    progressBar: 'bg-sky-500/70',
    titleColor: 'text-sky-900',
    textColor: 'text-sky-700'
  },
};


// --- LE SOUS-COMPOSANT NOTIFICATION ---
// On l'isole pour mieux gérer l'état individuel (timer, animations)
const NotificationItem = ({ notif, onRemove }: { notif: Notification; onRemove: (id: string | number) => void; }) => {
  const controls = useAnimation();
  
  // --- CORRECTION 3 : La ligne ci-dessous est maintenant sécurisée grâce au typage ---
  const styles = notificationStyles[notif.type] || notificationStyles.info;

  useEffect(() => {
    // Animation de la barre de progression
    controls.start({
      width: "0%",
      transition: { duration: (notif.duration || 5000) / 1000, ease: 'linear' },
    });

    // Timer pour la suppression automatique
    const timer = setTimeout(() => {
      onRemove(notif.id);
    }, notif.duration || 5000);

    return () => clearTimeout(timer);
  }, [notif, onRemove, controls]);
  
  return (
    <motion.div
        layout // Important pour animer le réagencement
        initial={{ opacity: 0, y: 50, scale: 0.5 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.7, transition: { duration: 0.3 } }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className={`pointer-events-auto mt-4 max-w-sm w-full rounded-2xl shadow-2xl border ${styles.bg} overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
                {styles.icon}
            </div>
            <div className="ml-4 w-0 flex-1">
                <p className={`text-base font-bold ${styles.titleColor}`}>{notif.title || notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}</p>
                <p className={`mt-1 text-sm ${styles.textColor}`}>{notif.message}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
            <button
                onClick={() => onRemove(notif.id)}
                className="inline-flex rounded-full p-2 bg-transparent text-gray-400 hover:bg-gray-200/50 hover:text-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <X className="h-5 w-5" />
            </button>
            </div>
        </div>
      </div>
      {/* Barre de progression animée */}
      <motion.div 
        className={`h-1 w-full ${styles.progressBar}`} 
        initial={{ width: "100%" }}
        animate={controls}
      />
    </motion.div>
  )
}


// --- LE COMPOSANT PRINCIPAL ---
const NotificationBanner = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed bottom-0 sm:bottom-6 sm:left-6 w-full sm:w-auto p-4 sm:p-0 z-[100] flex flex-col items-center sm:items-start pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          // On s'assure que notif est bien du bon type
          <NotificationItem key={notif.id} notif={notif as Notification} onRemove={removeNotification} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBanner;
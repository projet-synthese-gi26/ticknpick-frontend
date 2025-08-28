// FICHIER : src/components/NotificationBanner.tsx
// VERSION CORRIGÉE POUR VERCEL BUILD

'use client';

import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import { useNotification } from '../context/NotificationContext';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useEffect, ReactElement } from 'react';

// --- TYPES STRICTS ---
type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string | number;
  message: string;
  type: NotificationType;
  duration?: number;
  title?: string;
}

// --- INTERFACES POUR LE TYPAGE STRICT ---
interface NotificationItemProps {
  notif: Notification;
  onRemove: (id: string | number) => void;
}

interface NotificationStyles {
  icon: ReactElement;
  bg: string;
  progressBar: string;
  titleColor: string;
  textColor: string;
}

// --- CONFIGURATION DU DESIGN ---
const notificationStyles: Record<NotificationType, NotificationStyles> = {
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

// --- FONCTION UTILITAIRE POUR LA CAPITALISATION ---
const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// --- LE SOUS-COMPOSANT NOTIFICATION ---
const NotificationItem: React.FC<NotificationItemProps> = ({ notif, onRemove }) => {
  const controls = useAnimation();
  
  // Styles avec fallback sécurisé
  const styles = notificationStyles[notif.type] ?? notificationStyles.info;
  
  // Durée avec valeur par défaut
  const duration = notif.duration ?? 5000;

  useEffect(() => {
    // Animation de la barre de progression
    const startAnimation = async () => {
      try {
        await controls.start({
          width: "0%",
          transition: { duration: duration / 1000, ease: 'linear' },
        });
      } catch (error) {
        console.warn('Animation error:', error);
      }
    };

    startAnimation();

    // Timer pour la suppression automatique
    const timer = setTimeout(() => {
      onRemove(notif.id);
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [notif.id, onRemove, controls, duration]);
  
  // Title avec fallback
  const displayTitle = notif.title ?? capitalizeFirstLetter(notif.type);
  
  return (
    <motion.div
      layout
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
            <p className={`text-base font-bold ${styles.titleColor}`}>
              {displayTitle}
            </p>
            <p className={`mt-1 text-sm ${styles.textColor}`}>
              {notif.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              type="button"
              onClick={() => onRemove(notif.id)}
              className="inline-flex rounded-full p-2 bg-transparent text-gray-400 hover:bg-gray-200/50 hover:text-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Fermer la notification"
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
  );
};

// --- LE COMPOSANT PRINCIPAL ---
const NotificationBanner: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  // Validation des notifications
  const validNotifications = notifications.filter((notif): notif is Notification => {
    return (
      notif &&
      typeof notif.id !== 'undefined' &&
      typeof notif.message === 'string' &&
      typeof notif.type === 'string' &&
      ['success', 'error', 'info'].includes(notif.type)
    );
  });

  return (
    <div className="fixed bottom-0 sm:bottom-6 sm:left-6 w-full sm:w-auto p-4 sm:p-0 z-[100] flex flex-col items-center sm:items-start pointer-events-none">
      <AnimatePresence mode="popLayout">
        {validNotifications.map((notif) => (
          <NotificationItem 
            key={`notification-${notif.id}`} 
            notif={notif} 
            onRemove={removeNotification} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBanner;
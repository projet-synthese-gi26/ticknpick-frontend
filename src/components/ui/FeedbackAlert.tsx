'use client';
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AlertCircle, 
    CheckCircle2, 
    X, 
    Info, 
    XCircle,
    Copy 
} from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface FeedbackAlertProps {
    type: AlertType;
    message: string;
    details?: string; // Pour les logs techniques d'erreur
    isVisible: boolean;
    onClose: () => void;
    autoClose?: boolean;
}

const styles = {
    success: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-800 dark:text-emerald-200', icon: CheckCircle2, iconColor: 'text-emerald-500' },
    error: { bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-800 dark:text-red-200', icon: XCircle, iconColor: 'text-red-500' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-800 dark:text-amber-200', icon: AlertCircle, iconColor: 'text-amber-500' },
    info: { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-200', icon: Info, iconColor: 'text-blue-500' },
};

export default function FeedbackAlert({ type, message, details, isVisible, onClose, autoClose = true }: FeedbackAlertProps) {
    const config = styles[type];
    const Icon = config.icon;

    useEffect(() => {
        if (isVisible && autoClose) {
            const timer = setTimeout(onClose, type === 'error' ? 8000 : 5000); // Erreurs restent plus longtemps
            return () => clearTimeout(timer);
        }
    }, [isVisible, autoClose, onClose, type]);

    const copyError = () => {
        if (details) navigator.clipboard.writeText(details);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className={`fixed top-24 right-4 z-[100] w-full max-w-md p-4 rounded-xl border ${config.bg} ${config.border} shadow-lg backdrop-blur-md`}
                >
                    <div className="flex gap-3">
                        <div className={`mt-0.5 ${config.iconColor}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className={`text-sm font-bold ${config.text} mb-0.5`}>
                                {type === 'error' ? 'Attention' : type === 'success' ? 'Succès' : 'Information'}
                            </h4>
                            <p className={`text-xs opacity-90 ${config.text} font-medium`}>{message}</p>
                            
                            {/* Zone technique pour développeurs/debug */}
                            {details && type === 'error' && (
                                <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] uppercase font-bold opacity-50">Détails Techniques</span>
                                        <button onClick={copyError} className="p-1 hover:bg-black/5 rounded"><Copy className="w-3 h-3 opacity-50"/></button>
                                    </div>
                                    <code className="block text-[10px] p-2 bg-black/5 dark:bg-black/20 rounded font-mono break-all whitespace-pre-wrap max-h-20 overflow-auto">
                                        {details}
                                    </code>
                                </div>
                            )}
                        </div>
                        <button onClick={onClose} className={`p-1 -mt-1 h-fit hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition ${config.text}`}>
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title: string;
  message?: string;
  isVisible: boolean;
  onClose?: () => void;
}

const alertConfig = {
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-800 dark:text-emerald-200',
    iconColor: 'text-emerald-500'
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-500'
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-200',
    iconColor: 'text-amber-500'
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    iconColor: 'text-blue-500'
  }
};

export default function Alert({ type, title, message, isVisible, onClose }: AlertProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={`relative w-full p-4 rounded-xl border ${config.bg} ${config.border} shadow-sm mb-6`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-full bg-white dark:bg-slate-900 shadow-sm shrink-0 ${config.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 pt-1">
              <h4 className={`font-bold text-sm ${config.text}`}>{title}</h4>
              {message && (
                <p className={`mt-1 text-xs opacity-90 ${config.text} leading-relaxed`}>
                  {message}
                </p>
              )}
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className={`p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${config.text}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
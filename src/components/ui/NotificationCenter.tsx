// FICHIER : src/components/ui/NotificationCenter.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Loader2, Info, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationCenter() {
  const { inbox, unreadCount, markAsRead, markAllAsRead, refreshInbox, isLoadingInbox } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer si clic dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
      switch(type) {
          case 'ERROR': case 'ALERT': return <AlertTriangle className="w-5 h-5 text-red-500" />;
          case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-green-500" />;
          case 'PACKAGE_STATUS_UPDATE': return <Package className="w-5 h-5 text-blue-500" />;
          default: return <Info className="w-5 h-5 text-gray-500" />;
      }
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      {/* Bouton Cloche */}
      <button 
        onClick={() => { setIsOpen(!isOpen); if(!isOpen) refreshInbox(); }}
        className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Notifications {unreadCount > 0 && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
                </h3>
                <div className="flex gap-2">
                    {isLoadingInbox && <Loader2 className="w-4 h-4 animate-spin text-orange-500"/>}
                    <button onClick={markAllAsRead} className="text-xs text-blue-600 font-medium hover:underline" title="Tout marquer lu">
                        Tout lire
                    </button>
                </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {inbox.length === 0 ? (
                    <div className="py-10 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20"/>
                        <p className="text-sm">Aucune notification</p>
                    </div>
                ) : (
                    inbox.map((notif) => (
                        <div 
                           key={notif.id} 
                           onClick={() => markAsRead(notif.id)}
                           className={`p-4 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition flex gap-3 ${!notif.isRead ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}
                        >
                            <div className="shrink-0 mt-1">{getIcon(notif.type)}</div>
                            <div className="flex-1">
                                <p className={`text-sm ${!notif.isRead ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {notif.title || "Nouvelle notification"}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 leading-snug">
                                    {notif.message}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-2 text-right">
                                    {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                            {!notif.isRead && (
                                <div className="self-center">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
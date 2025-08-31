'use client';
import React, { useRef, useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface SignatureStepProps {
  onBack: () => void;
  onSubmit: (signatureData: string) => void;
}

export default function SignatureStep({ onBack, onSubmit }: SignatureStepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Détecter le mode sombre initial
    const checkDarkMode = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Écouter les changements de mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Adapter la couleur du trait selon le mode
    ctx.strokeStyle = isDarkMode ? '#fb923c' : '#ea580c'; // orange-400 en dark, orange-600 en light
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
  }, [isDarkMode]);

  const getEventPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getEventPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      setIsDrawing(true);
      setHasSignature(true);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getEventPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const handleSubmit = () => {
    if (hasSignature && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSubmit(dataUrl);
    }
  };

  return (
    <motion.div 
      className="max-w-2xl mx-auto px-4" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* En-tête compact */}
      <div className="text-center mb-4">
        <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
          Signature Numérique
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Signez pour valider vos informations</p>
      </div>
      
      {/* Zone de signature */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-orange-100 dark:border-orange-800 p-3 mb-4">
        <div className="relative w-full h-32 md:h-40 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-700 dark:to-gray-600 border-2 border-dashed border-orange-200 dark:border-orange-600 overflow-hidden">
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-orange-400 dark:text-orange-300">
                <PencilIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Signez ici</p>
              </div>
            </div>
          )}
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
      </div>

      {/* Boutons d'action - Layout mobile optimisé */}
      <div className="space-y-3">
        {/* Boutons signature sur mobile */}
        <div className="flex gap-3 md:hidden">
          <motion.button 
            onClick={clear} 
            disabled={!hasSignature}
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white rounded-xl font-semibold shadow-lg disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:shadow-none transition-all duration-200"
          >
            <TrashIcon className="w-5 h-5" />
            <span>Effacer</span>
          </motion.button>
          
          <motion.button 
            onClick={handleSubmit} 
            disabled={!hasSignature}
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-600 text-white rounded-xl font-semibold shadow-lg disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:shadow-none transition-all duration-200"
          >
            <CheckCircleIcon className="w-5 h-5" />
            <span>Valider</span>
          </motion.button>
        </div>

        {/* Layout desktop */}
        <div className="hidden md:flex justify-between items-center">
          <motion.button 
            onClick={onBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Précédent
          </motion.button>
          
          <div className="flex gap-3">
            <motion.button 
              onClick={clear} 
              disabled={!hasSignature}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white rounded-xl font-semibold shadow-lg disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:shadow-none transition-all duration-200"
            >
              <TrashIcon className="w-5 h-5" />
              Effacer
            </motion.button>
            
            <motion.button 
              onClick={handleSubmit} 
              disabled={!hasSignature}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-600 text-white rounded-xl font-semibold shadow-lg disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:shadow-none transition-all duration-200"
            >
              Confirmer et Payer
              <CheckCircleIcon className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Bouton retour mobile */}
        <motion.button 
          onClick={onBack}
          whileTap={{ scale: 0.98 }}
          className="w-full md:hidden flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold transition-all duration-200"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Retour
        </motion.button>
      </div>
    </motion.div>
  );
}
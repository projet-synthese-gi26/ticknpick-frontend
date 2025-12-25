'use client';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';

// --- Neige Tropicale (Flocons légers) ---
export const Snowfall = () => {
  // On ne rend rien côté serveur pour éviter les mismatchs d'hydratation
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden h-screen w-screen" aria-hidden="true">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, x: Math.random() * 100 + "vw", opacity: 0 }}
          animate={{ 
            y: '110vh', 
            opacity: [0, 0.6, 0.6, 0],
            // Petit mouvement latéral pour simuler le vent
            x: `calc(${Math.random() * 100}vw + ${(Math.random() - 0.5) * 50}px)`
          }}
          transition={{ 
            duration: Math.random() * 15 + 10, 
            repeat: Infinity, 
            ease: "linear",
            delay: Math.random() * 5 
          }}
          className="absolute text-white/60 text-lg md:text-xl"
        >
          ❄
        </motion.div>
      ))}
    </div>
  );
};

// --- Guirlande Lumineuse ---
export const FairyLights = () => (
  <div className="absolute top-0 left-0 w-full z-[10] flex justify-around pointer-events-none overflow-hidden px-4">
    {[...Array(15)].map((_, i) => (
      <div key={i} className="flex flex-col items-center">
        {/* Le fil */}
        <div className="w-[1px] h-8 md:h-12 bg-slate-800 dark:bg-slate-400 opacity-30" />
        {/* L'ampoule */}
        <motion.div 
          animate={{ 
            boxShadow: [
              "0 0 10px 2px rgba(239,68,68,0.5)", // Red glow
              "0 0 15px 4px rgba(251,191,36,0.5)", // Amber glow
              "0 0 10px 2px rgba(239,68,68,0.5)" 
            ],
            backgroundColor: [
               "#ef4444", // Red
               "#fbbf24", // Amber
               "#ef4444" 
            ],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
          className="w-3 h-3 md:w-4 md:h-4 rounded-full" 
        />
      </div>
    ))}
  </div>
);
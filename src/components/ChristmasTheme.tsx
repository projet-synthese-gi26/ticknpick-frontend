'use client';
import { motion } from 'framer-motion';
import { Snowflake, Gift, Star } from 'lucide-react';
import React from 'react';

// --- Neige qui tombe ---
export const Snowfall = () => (
  <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden" aria-hidden="true">
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: -20, x: Math.random() * 100 + "%", opacity: 0 }}
        animate={{ 
          y: '110vh', 
          opacity: [0, 0.8, 0.8, 0],
          x: (Math.random() * 100 - 10) + "%" 
        }}
        transition={{ 
          duration: Math.random() * 10 + 5, 
          repeat: Infinity, 
          ease: "linear",
          delay: Math.random() * 5 
        }}
        className="absolute text-white/40 dark:text-white/20"
      >
        <Snowflake size={Math.random() * 15 + 10} />
      </motion.div>
    ))}
  </div>
);

// --- Guirlande Lumineuse ---
export const FairyLights = () => (
  <div className="fixed top-0 left-0 w-full z-[70] flex justify-around pointer-events-none">
    {[...Array(15)].map((_, i) => (
      <div key={i} className="flex flex-col items-center -mt-1">
        <div className="w-1 h-6 bg-slate-800" />
        <motion.div 
          animate={{ 
            boxShadow: [
              "0 0 10px 2px #ef4444", 
              "0 0 15px 4px #fbbf24", 
              "0 0 10px 2px #ef4444"
            ],
            backgroundColor: ["#ef4444", "#fbbf24", "#ef4444"]
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          className="w-4 h-4 rounded-full border border-white/20" 
        />
      </div>
    ))}
  </div>
);

// --- Décorations de coins (Sapins & Sucres d'orge) ---
export const CornerDecorations = () => (
  <>
    {/* Sapin Gauche */}
    <div className="fixed bottom-0 left-4 z-[55] pointer-events-none hidden xl:block">
        <span className="text-8xl drop-shadow-2xl opacity-90">🎄</span>
    </div>
    {/* Sucre d'orge Droit */}
    <div className="fixed top-24 -right-2 z-[55] pointer-events-none rotate-12">
        <span className="text-7xl drop-shadow-lg">inline-block 🍭</span>
    </div>
  </>
);

// --- Le Traîneau de PicknDrop ---
export const Sleigh = () => (
    <motion.div 
        initial={{ x: '-100%', y: '10vh' }}
        animate={{ 
            x: '110vw',
            y: ['10vh', '15vh', '10vh'] 
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="fixed top-20 z-[65] pointer-events-none flex items-center gap-2 drop-shadow-2xl"
    >
        <span className="text-6xl scale-x-[-1]">🛷</span>
        <div className="flex gap-1 ml-[-15px]">
            <span className="text-4xl">🦌</span>
            <span className="text-4xl">🦌</span>
        </div>
    </motion.div>
);
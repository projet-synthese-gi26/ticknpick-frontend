'use client';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';

// --- Neige (Flocons) ---
export const Snowfall = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden h-screen w-screen" aria-hidden="true">
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, x: `${Math.random() * 100}vw`, opacity: 0 }}
          animate={{ 
            y: '110vh', 
            opacity: [0, 0.7, 0.7, 0],
            x: `${Math.random() * 100}vw` 
          }}
          transition={{ 
            duration: Math.random() * 20 + 10, 
            repeat: Infinity, 
            ease: "linear",
            delay: Math.random() * 10 
          }}
          className="absolute text-white/70 text-lg md:text-xl select-none"
        >
          ❄
        </motion.div>
      ))}
    </div>
  );
};

// --- Guirlande Drapée (Style Vague en bas de section) ---
export const DrapedLights = () => {
    // Calcul de points pour simuler une courbe drapée
    const count = 30; // Nombre d'ampoules
    
    return (
        <div className="absolute bottom-[35px] left-0 w-full h-24 pointer-events-none z-30 flex justify-between items-start overflow-hidden px-[2%]">
            {[...Array(count)].map((_, i) => {
                // Simule une courbe sinusoïdale inversée pour matcher grossièrement la vague
                const yOffset = Math.sin((i / count) * Math.PI) * 20; 
                
                return (
                    <div key={i} className="flex flex-col items-center relative" style={{ transform: `translateY(${yOffset}px)` }}>
                        {/* Fil */}
                        <div className="w-[1px] h-6 bg-slate-900/60 dark:bg-white/40" />
                        {/* Ampoule */}
                        <motion.div 
                            animate={{ 
                                backgroundColor: ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"],
                                boxShadow: [
                                    "0 0 5px 2px rgba(239,68,68,0.5)",
                                    "0 0 5px 2px rgba(245,158,11,0.5)", 
                                    "0 0 5px 2px rgba(16,185,129,0.5)",
                                    "0 0 5px 2px rgba(59,130,246,0.5)"
                                ]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2, repeatType: "mirror" }}
                            className="w-3 h-3 rounded-full"
                        />
                    </div>
                );
            })}
        </div>
    );
};
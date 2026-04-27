import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { RoosterSVG } from './RoosterLogo';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'intro' | 'loading' | 'exit'>('intro');

  useEffect(() => {
    const introTimer = setTimeout(() => setPhase('loading'), 1000);
    const exitTimer = setTimeout(() => setPhase('exit'), 3500);
    const completeTimer = setTimeout(onComplete, 4500);

    return () => {
      clearTimeout(introTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'exit' && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "circIn" }}
          className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center overflow-hidden"
        >
          {/* Blueprint Pattern Background */}
          <div className="absolute inset-0 bg-[#050505] bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] z-0" />
          
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.15 }}
            transition={{ duration: 4, ease: "easeOut" }}
            className="absolute -right-20 -top-20 z-0 pointer-events-none"
          >
            <RoosterSVG className="w-[800px] h-[800px] text-emerald-500 opacity-20 transform -rotate-12" />
          </motion.div>

          <div className="relative z-10 flex flex-col items-center max-w-lg w-full px-8 text-center">
            {/* Logo Mark */}
            <motion.div
              initial={{ y: 20, opacity: 0, rotate: -20 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="w-24 h-24 bg-emerald-600 rounded-sm flex items-center justify-center text-white mb-8 shadow-[0_0_50px_rgba(5,150,105,0.3)] relative overflow-hidden group"
            >
              <RoosterSVG className="w-16 h-16 text-white z-10 drop-shadow-xl" />
              <div className="absolute inset-0 bg-white/20 origin-bottom-left scale-0 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
            </motion.div>

            {/* Title */}
            <div className="overflow-hidden mb-2">
              <motion.h1
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.8, duration: 0.6, ease: "circOut" }}
                className="text-4xl font-black uppercase tracking-[0.2em] text-white leading-none"
              >
                Poultry <span className="text-emerald-500">Logistics</span>
              </motion.h1>
            </div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.8 }}
              className="flex items-center gap-4 w-full justify-center"
            >
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-emerald-500/30" />
              <span className="text-[10px] uppercase tracking-[0.5em] text-emerald-500/60 font-bold whitespace-nowrap">
                Biological Logistics
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-emerald-500/30" />
            </motion.div>

            {/* Loading Indicator */}
            <div className="h-20 flex items-center justify-center mt-12">
              <AnimatePresence>
                {phase === 'loading' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <Loader2 className="text-emerald-500 animate-spin" size={24} />
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-500/60 animate-pulse">
                      Synchronizing Units...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Static Motto */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ delay: 2, duration: 1.5 }}
              className="absolute bottom-[-100px] text-[8px] font-black uppercase tracking-[0.8em] text-white italic"
            >
              "Yield To The Flock"
            </motion.p>
          </div>

          {/* Scanning Line Effect */}
          <motion.div 
            initial={{ top: "-100%" }}
            animate={{ top: "200%" }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-emerald-600/5 to-transparent pointer-events-none z-20"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

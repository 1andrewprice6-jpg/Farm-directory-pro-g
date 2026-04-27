import React, { useState, useMemo } from 'react';
import { Delete, Hash, Truck, Calculator, Activity, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

type Mode = 'standard' | 'logistics';

export function CalculatorView() {
  const [mode, setMode] = useState<Mode>('standard');
  const [display, setDisplay] = useState('0');

  // Logistics State
  const [cages, setCages] = useState<number>(72);
  const [birdsPerCage, setBirdsPerCage] = useState<number>(50);
  
  // Distribution Ratios (Front, Mid, Rear)
  const [distFront, setDistFront] = useState<number>(33);
  const [distMid, setDistMid] = useState<number>(34);
  const [distRear, setDistRear] = useState<number>(33);

  const handleNum = (n: string) => {
    if (display === '0' && n !== '.') {
      setDisplay(n);
    } else {
      if (n === '.' && display.includes('.')) return;
      setDisplay(display + n);
    }
  };

  const calculate = () => {
    try {
      // eslint-disable-next-line no-eval
      const result = eval(display.replace('×', '*').replace('÷', '/'));
      setDisplay(String(Number(result.toFixed(8))));
    } catch {
      setDisplay('ERROR');
      setTimeout(() => setDisplay('0'), 1500);
    }
  };

  const handleOp = (op: string) => {
    if (['+', '-', '×', '÷'].includes(display.slice(-1))) {
      setDisplay(display.slice(0, -1) + op);
    } else {
      setDisplay(display + op);
    }
  };

  // Logistics Calculations
  const logisticsResults = useMemo(() => {
    const totalBirds = cages * birdsPerCage;
    
    // Weighted COG (Front=0, Mid=0.5, Rear=1)
    const totalDist = distFront + distMid + distRear;
    const cogIndex = ((distMid * 0.5) + (distRear * 1.0)) / (totalDist / 100 || 1);
    
    return {
      totalBirds: Math.round(totalBirds),
      crates: cages,
      cogIndex: Math.round(cogIndex),
      cogStatus: cogIndex < 40 ? 'FRONT HEAVY' : cogIndex > 60 ? 'REAR HEAVY' : 'BALANCED'
    };
  }, [cages, birdsPerCage, distFront, distMid, distRear]);

  return (
    <div className="flex flex-col h-full bg-[#050505] p-6 space-y-6 overflow-y-auto pb-20 scrollbar-hide">
      {/* Mode Switcher */}
      <div className="flex bg-white/2 border border-white/10 p-1 rounded-sm gap-1 self-start">
        <button 
          onClick={() => setMode('standard')}
          className={cn(
            "flex items-center gap-2 px-6 py-2 text-[9px] font-black uppercase tracking-[0.3em] transition-all rounded-sm",
            mode === 'standard' ? "bg-emerald-600 text-white shadow-lg" : "text-white/30 hover:text-white/60"
          )}
        >
          <Calculator size={12} /> Standard Compute
        </button>
        <button 
          onClick={() => setMode('logistics')}
          className={cn(
            "flex items-center gap-2 px-6 py-2 text-[9px] font-black uppercase tracking-[0.3em] transition-all rounded-sm",
            mode === 'logistics' ? "bg-emerald-600 text-white shadow-lg" : "text-white/30 hover:text-white/60"
          )}
        >
          <Truck size={12} /> Logistics Analysis
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'standard' ? (
          <motion.div 
            key="std"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-8"
          >
            {/* Tactical Display */}
            <div className="relative group">
              <div className="absolute -top-6 left-1 text-[9px] font-black uppercase tracking-[0.5em] text-emerald-600/60 flex items-center gap-2">
                <Hash size={10} /> Quantum Compute Overlay
              </div>
              <div className="bg-white/2 border border-white/10 p-6 text-right rounded-sm shadow-inner relative overflow-hidden group">
                <div className="absolute inset-0 bg-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <motion.div 
                  key={display}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-5xl font-black text-white italic font-serif tracking-tighter truncate leading-none"
                >
                  {display}
                </motion.div>
              </div>
            </div>

            {/* Control Grid */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'C', action: () => setDisplay('0'), type: 'reset' },
                { label: 'DEL', action: () => setDisplay(display.length > 1 ? display.slice(0, -1) : '0'), type: 'delete', icon: Delete },
                { label: '÷', action: () => handleOp('÷'), type: 'op' },
                { label: '×', action: () => handleOp('×'), type: 'op' },
                { label: '7', action: () => handleNum('7'), type: 'num' },
                { label: '8', action: () => handleNum('8'), type: 'num' },
                { label: '9', action: () => handleNum('9'), type: 'num' },
                { label: '-', action: () => handleOp('-'), type: 'op' },
                { label: '4', action: () => handleNum('4'), type: 'num' },
                { label: '5', action: () => handleNum('5'), type: 'num' },
                { label: '6', action: () => handleNum('6'), type: 'num' },
                { label: '+', action: () => handleOp('+'), type: 'op' },
                { label: '1', action: () => handleNum('1'), type: 'num' },
                { label: '2', action: () => handleNum('2'), type: 'num' },
                { label: '3', action: () => handleNum('3'), type: 'num' },
                { label: '=', action: calculate, type: 'equals', rowSpan: 2 },
                { label: '0', action: () => handleNum('0'), type: 'num', colSpan: 2 },
                { label: '.', action: () => handleNum('.'), type: 'num' },
              ].map((btn, idx) => (
                <button
                  key={idx}
                  onClick={btn.action}
                  className={cn(
                    "py-3 rounded-sm font-black text-xl uppercase tracking-widest transition-all flex items-center justify-center relative group overflow-hidden border",
                    btn.type === 'reset' && "bg-emerald-600/10 border-emerald-600/30 text-emerald-600 hover:bg-emerald-600 hover:text-white",
                    btn.type === 'delete' && "bg-orange-600/10 border-orange-600/30 text-orange-500 hover:bg-orange-600 hover:text-white",
                    btn.type === 'op' && "bg-blue-600/10 border-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white hover:border-blue-600",
                    btn.type === 'num' && "bg-white/2 border-white/10 text-white hover:bg-white hover:text-black",
                    btn.type === 'equals' && "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98]",
                    btn.colSpan === 2 && "col-span-2",
                    btn.rowSpan === 2 && "row-span-2"
                  )}
                >
                  {btn.icon ? <btn.icon size={24} /> : btn.label}
                  <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="log"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-8"
          >
            {/* Header Result */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-600 p-6 rounded-sm relative overflow-hidden group">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-2">Aggregate Population</p>
                <div className="text-3xl font-black italic font-serif text-white">{logisticsResults.totalBirds.toLocaleString()} <span className="text-[12px] not-italic opacity-40 uppercase">Birds</span></div>
                <div className="absolute top-0 right-0 p-4 font-serif italic text-white/5 text-5xl font-black">UNITS</div>
              </div>
              <div className="bg-white/2 border border-white/10 p-6 rounded-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-3">Dist. Focal Point</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 bg-white/5 rounded-full relative overflow-hidden">
                    <motion.div 
                      key={logisticsResults.cogIndex}
                      initial={{ left: 0 }}
                      animate={{ left: `${logisticsResults.cogIndex}%` }}
                      className="absolute top-0 w-2 h-full bg-emerald-600 shadow-[0_0_10px_rgba(5,150,105,1)]" 
                    />
                  </div>
                  <span className="text-xl font-black italic font-serif text-accent min-w-[120px] text-right">{logisticsResults.cogStatus}</span>
                </div>
              </div>
            </div>

            {/* Parameter Entry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 pb-3 border-b border-white/5 flex items-center gap-2">
                  <Zap size={12} className="text-emerald-600" /> Primary Mass Nodes
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Total Cages / Crates</label>
                    <input 
                      type="number" 
                      value={cages} 
                      onChange={(e) => setCages(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 p-3 text-white font-black italic font-serif text-xl outline-none focus:border-emerald-600 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Birds per Cage (Avg 46-60)</label>
                    <input 
                      type="number" 
                      value={birdsPerCage} 
                      onChange={(e) => setBirdsPerCage(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 p-3 text-white font-black italic font-serif text-xl outline-none focus:border-emerald-600 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 pb-3 border-b border-white/5 flex items-center gap-2">
                  <Activity size={12} className="text-emerald-600" /> Strategic Distribution
                </h3>
                <div className="space-y-5">
                  {[
                    { label: 'Zone 01 (Front)', val: distFront, set: setDistFront },
                    { label: 'Zone 02 (Middle)', val: distMid, set: setDistMid },
                    { label: 'Zone 03 (Rear)', val: distRear, set: setDistRear }
                  ].map((z, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30">{z.label}</label>
                        <span className="text-[10px] font-black text-white">{z.val}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={z.val} 
                        onChange={(e) => z.set(Number(e.target.value))}
                        className="w-full h-1 bg-white/10 appearance-none cursor-pointer accent-emerald-600 rounded-full"
                      />
                    </div>
                  ))}
                  
                  <div className="bg-white/2 p-6 border border-white/5 rounded-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        (distFront + distMid + distRear) === 100 ? "bg-green-500" : "bg-emerald-500"
                      )} />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Vector Summation</span>
                    </div>
                    <span className={cn(
                      "text-xl font-black italic font-serif",
                      (distFront + distMid + distRear) === 100 ? "text-green-500" : "text-emerald-500"
                    )}>
                      {distFront + distMid + distRear}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Readout */}
            <div className="bg-white/2 border border-white/10 p-10 grid grid-cols-2 md:grid-cols-4 gap-8 rounded-sm">
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Cages Loaded</p>
                <div className="text-2xl font-black italic font-serif text-white truncate">{logisticsResults.crates} <span className="text-[10px] uppercase opacity-30">Units</span></div>
              </div>
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Total Headcount</p>
                <div className="text-2xl font-black italic font-serif text-white truncate">{logisticsResults.totalBirds.toLocaleString()} <span className="text-[10px] uppercase opacity-30">Birds</span></div>
              </div>
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/20">COG Offset (%)</p>
                <div className="text-2xl font-black italic font-serif text-accent truncate">+{logisticsResults.cogIndex}% <span className="text-[10px] uppercase opacity-30">Vector</span></div>
              </div>
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Status</p>
                <div className="text-2xl font-black italic font-serif text-white flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Optimal
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

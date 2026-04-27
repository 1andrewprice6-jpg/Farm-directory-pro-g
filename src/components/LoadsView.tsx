import React, { useState, useMemo } from 'react';
import { Plus, X, Truck, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Load {
  id: string;
  vehicle: string;
  birds: string;
  count: number;
  dist: string;
  timestamp: Date;
}

export function LoadsView() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loadForm, setLoadForm] = useState({ vehicle: '', birds: '', count: '', dist: 'EVEN' });
  
  const totalBirds = useMemo(() => loads.reduce((sum, l) => sum + l.count, 0), [loads]);

  const handleAddLoad = () => {
    if (!loadForm.vehicle || !loadForm.birds || !loadForm.count) return;
    
    const newLoad: Load = {
      id: Math.random().toString(36).substr(2, 9),
      vehicle: loadForm.vehicle,
      birds: loadForm.birds,
      count: parseInt(loadForm.count),
      dist: loadForm.dist,
      timestamp: new Date()
    };
    
    setLoads([newLoad, ...loads]);
    setLoadForm({ vehicle: '', birds: '', count: '', dist: 'EVEN' });
  };

  const removeLoad = (id: string) => {
    setLoads(loads.filter(l => l.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] p-8 space-y-8">
      {/* Header Stats */}
      <div className="bg-emerald-600 p-8 rounded-sm shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Truck size={120} />
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-2">Aggregate Cargo Volume</p>
          <h2 className="text-6xl font-black italic font-serif text-white tracking-tighter">
            {totalBirds.toLocaleString()}
          </h2>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mt-4">Active Distribution Across {loads.length} Tactical Nodes</p>
        </div>
      </div>

      {/* Configurator */}
      <div className="bg-white/2 border border-white/10 p-8 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600/50" />
        
        <div className="space-y-4">
          <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] pl-1">Strategic Selection</label>
          <div className="grid grid-cols-2 gap-4">
            {[
              {v:'Trailer', b:'Roosters', l:'🚚 Trailer\nRoosters'},
              {v:'Trailer', b:'Hens', l:'🚚 Trailer\nHens'},
              {v:'Dodge', b:'Roosters', l:'🚗 Dodge\nRoosters'},
              {v:'Dodge', b:'Hens', l:'🚗 Dodge\nHens'}
            ].map((i, idx) => (
              <button 
                key={idx} 
                onClick={() => setLoadForm({...loadForm, vehicle: i.v, birds: i.b})}
                className={cn(
                  "p-6 rounded-sm font-black whitespace-pre-line text-[10px] uppercase tracking-[0.2em] border transition-all text-left relative",
                  loadForm.vehicle === i.v && loadForm.birds === i.b 
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-[0_0_20px_rgba(5,150,105,0.3)]" 
                    : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                )}
              >
                {i.l}
                {loadForm.vehicle === i.v && loadForm.birds === i.b && (
                  <Check size={12} className="absolute top-4 right-4" />
                )}
              </button>
            ))}
          </div>
        </div>

        {loadForm.vehicle && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pt-4 border-t border-white/5"
          >
            <div className="space-y-4">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] pl-1">Weight Distribution</label>
              <div className="grid grid-cols-2 gap-4">
                {['FRONT HEAVY', 'EVEN', 'MAX LOAD', 'AVG 200/PIN'].map(d => (
                  <button 
                    key={d} 
                    onClick={() => setLoadForm({...loadForm, dist: d})}
                    className={cn(
                      "p-4 border rounded-sm font-black text-[9px] uppercase tracking-[0.2em] transition-all",
                      loadForm.dist === d 
                        ? "bg-white text-black border-white" 
                        : "bg-transparent border-white/10 text-white/40 hover:text-white"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] pl-1">Unit Quantifier</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={loadForm.count} 
                  onChange={(e) => setLoadForm({...loadForm, count: e.target.value})} 
                  placeholder="E.G. 4032" 
                  className="w-full bg-white/5 text-white py-6 px-8 rounded-sm border border-white/10 focus:border-emerald-600 outline-none transition-all font-black text-2xl font-serif italic placeholder-white/5"
                />
              </div>
            </div>

            <button 
              onClick={handleAddLoad}
              className="w-full bg-emerald-600 hover:bg-neutral-100 hover:text-black text-white font-black py-6 rounded-sm uppercase tracking-[0.4em] text-[11px] transition-all flex items-center justify-center gap-4"
            >
              Commit Strategic Load
            </button>
          </motion.div>
        )}
      </div>

      {/* Load List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Logistics manifested</h3>
          <button 
            onClick={() => setLoads([])}
            className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/60 hover:text-red-500 transition-colors"
          >
            Purge All
          </button>
        </div>

        <AnimatePresence mode="popLayout">
          {loads.map(l => (
            <motion.div 
              key={l.id} 
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/2 border border-white/10 p-6 rounded-sm group flex justify-between items-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600/30 group-hover:bg-emerald-600 transition-colors" />
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em]">{l.vehicle} / {l.birds}</span>
                  <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">{l.dist}</span>
                </div>
                <div className="text-2xl font-black text-white italic font-serif leading-none">
                  {l.count.toLocaleString()} <span className="text-[10px] not-italic text-white/20 uppercase tracking-widest ml-1">Units</span>
                </div>
              </div>
              <button 
                onClick={() => removeLoad(l.id)}
                className="p-4 bg-white/5 border border-white/5 text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-sm"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {loads.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <Info size={40} className="mx-auto text-white/5" />
            <p className="text-sm font-serif italic text-white/20">No active cargo nodes detected in local storage.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Send, ChevronDown, Bird, AlertCircle, Info, TrendingUp, PenTool } from 'lucide-react';
import { db, collection, onSnapshot, query, orderBy, handleFirestoreError, OperationType, addDoc, serverTimestamp } from '../lib/firebase';
import { Vehicle, Farm } from '../types';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import SignatureCanvas from 'react-signature-canvas';

export function CatchView() {
  const { user } = useAppContext();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [birdType, setBirdType] = useState<'Rooster' | 'Hen'>('Rooster');
  const [placement, setPlacement] = useState('Even');
  const [quantity, setQuantity] = useState<number>(120);
  const [loads, setLoads] = useState<Array<{ id: string, type: string, birds: number, placement: string }>>([]);
  const sigCanvas = useRef<SignatureCanvas>(null);

  const placementOptions = ["Front Heavy", "Even", "Rear Heavy", "Pin"];

  useEffect(() => {
    setQuantity(birdType === 'Rooster' ? 120 : 180);
  }, [birdType]);

  useEffect(() => {
    const vQ = query(collection(db, 'vehicles'), orderBy('name', 'asc'));
    const unsubscribeV = onSnapshot(vQ, (snapshot) => {
      const v = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
      setVehicles(v);
      if (v.length > 0 && !selectedVehicleId) setSelectedVehicleId(v[0].id);
    });

    const fQ = query(collection(db, 'farms'), orderBy('name', 'asc'));
    const unsubscribeF = onSnapshot(fQ, (snapshot) => {
      const f = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Farm));
      setFarms(f);
      if (f.length > 0 && !selectedFarmId) setSelectedFarmId(f[0].id);
    });

    return () => { unsubscribeV(); unsubscribeF(); };
  }, []);

  const totalBirds = loads.reduce((acc, l) => acc + l.birds, 0);
  const activeVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const maxCapacity = activeVehicle?.maxCapacity || 4500; // Default if not set

  // Real-time Load Calculations
  const metrics = useMemo(() => {
    let frontLoad = 0;
    let rearLoad = 0;

    loads.forEach(load => {
      if (load.placement === 'Front Heavy') {
        frontLoad += load.birds * 0.7;
        rearLoad += load.birds * 0.3;
      } else if (load.placement === 'Rear Heavy' || load.placement === 'Pin') {
        frontLoad += load.birds * 0.3;
        rearLoad += load.birds * 0.7;
      } else {
        frontLoad += load.birds * 0.5;
        rearLoad += load.birds * 0.5;
      }
    });

    const totalWeight = totalBirds; // Assuming weight is proportional to count for simplicity
    const skew = totalWeight > 0 ? (frontLoad - rearLoad) / totalWeight : 0;
    
    // Prediction based on current selection
    let predFront = frontLoad;
    let predRear = rearLoad;
    if (placement === 'Front Heavy') {
      predFront += quantity * 0.7;
      predRear += quantity * 0.3;
    } else if (placement === 'Rear Heavy' || placement === 'Pin') {
      predFront += quantity * 0.3;
      predRear += quantity * 0.7;
    } else {
      predFront += quantity * 0.5;
      predRear += quantity * 0.5;
    }
    const predTotal = totalWeight + quantity;
    const predSkew = predTotal > 0 ? (predFront - predRear) / predTotal : 0;

    let suggestion = "Ready for Load Initiation";
    if (totalWeight === 0) suggestion = "Ready for Load Initiation";
    else if (totalWeight + quantity > maxCapacity) suggestion = "Capacity Critical - Reduce Quantity";
    else if (totalWeight > maxCapacity * 0.9) suggestion = "Approach Limit - Finalize Session";
    else if (skew > 0.1) suggestion = "Front Bias Detected - Use Rear Placement";
    else if (skew < -0.1) suggestion = "Rear Bias Detected - Use Front Placement";
    else suggestion = "Load Balanced - Proceed with Even Placement";

    return { 
      frontLoad, 
      rearLoad, 
      skew, 
      suggestion, 
      percent: (totalWeight / maxCapacity) * 100,
      predSkew,
      predFront,
      predRear
    };
  }, [loads, totalBirds, maxCapacity, placement, quantity]);

  const addLoad = () => {
    if (totalBirds + quantity > maxCapacity) {
      alert("Capacity Exceeded. Cannot add more units.");
      return;
    }

    const newLoad = {
      id: Math.random().toString(36).substr(2, 9),
      type: birdType,
      birds: quantity,
      placement: placement
    };
    setLoads([...loads, newLoad]);
  };

  const removeLoad = (id: string) => {
    setLoads(loads.filter(l => l.id !== id));
  };

  const saveLog = async () => {
    if (!user || !selectedVehicleId || !selectedFarmId) return;
    
    const vehicleName = activeVehicle?.name || 'Unknown';
    const farmName = farms.find(f => f.id === selectedFarmId)?.name || 'Unknown';
    
    let signatureUrl = '';
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      signatureUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    }

    try {
      await addDoc(collection(db, 'catchLogs'), {
        vehicleId: selectedVehicleId,
        farmId: selectedFarmId,
        vehicleName,
        farmName,
        birdType,
        loads,
        totalBirds,
        metrics,
        signatureUrl,
        userId: user.uid,
        timestamp: serverTimestamp()
      });
      setLoads([]);
      sigCanvas.current?.clear();
      alert("Operational Data Synced.");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'catchLogs');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] p-8 space-y-10 overflow-x-hidden">
      {/* Dynamic Health & Suggestion Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-accent flex items-center gap-2">
              <TrendingUp size={10} />
              System Advisor
            </div>
            <div className="text-xl font-black text-white italic font-serif tracking-tighter uppercase">
              {metrics.suggestion}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Capacity Usage</div>
            <div className="text-2xl font-black text-white italic font-serif">
               {Math.round(metrics.percent)}%
            </div>
          </div>
        </div>
        <div className="h-1 bg-white/5 w-full relative overflow-hidden rounded-full">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(metrics.percent, 100)}%` }}
            className={cn(
              "h-full transition-colors duration-500",
              metrics.percent > 90 ? "bg-emerald-500" : metrics.percent > 70 ? "bg-yellow-500" : "bg-accent"
            )}
          />
        </div>
      </div>

      {/* Load Balancing Visual */}
      <div className="bg-white/2 border border-white/10 p-6 flex flex-col gap-6">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.4em] text-white/40">
          <span>Axle 1 Distribution</span>
          <span>Axle 2 Distribution</span>
        </div>
        <div className="flex items-center gap-4 h-12">
          <div className="flex-1 bg-white/5 rounded-sm relative overflow-hidden h-full">
             {/* Base Load */}
             <motion.div 
               animate={{ width: `${Math.max(0, Math.min(100, (metrics.frontLoad / (metrics.frontLoad + metrics.rearLoad || 1)) * 100))}%` }}
               className="h-full bg-accent/20 border-r border-accent transition-all absolute left-0"
             />
             {/* Predicted Addition */}
             <motion.div 
               animate={{ 
                 x: `${(metrics.frontLoad / (metrics.frontLoad + metrics.rearLoad || 1)) * 100}%`,
                 width: `${((metrics.predFront - metrics.frontLoad) / (metrics.predFront + metrics.predRear || 1)) * 100}%` 
               }}
               className="h-full bg-accent/40 border-r border-accent/60 transition-all absolute left-0 opacity-40"
             />
             <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white pointer-events-none z-10">
              {Math.round(metrics.frontLoad)} <span className="opacity-40 ml-1">→ {Math.round(metrics.predFront)}</span>
             </div>
          </div>
          <div className="flex-1 bg-white/5 rounded-sm relative overflow-hidden h-full">
             {/* Base Load */}
             <motion.div 
               animate={{ width: `${Math.max(0, Math.min(100, (metrics.rearLoad / (metrics.frontLoad + metrics.rearLoad || 1)) * 100))}%` }}
               className="h-full bg-blue-500/20 border-l border-blue-500 transition-all absolute right-0"
             />
             {/* Predicted Addition */}
             <motion.div 
               animate={{ 
                 width: `${((metrics.predRear - metrics.rearLoad) / (metrics.predFront + metrics.predRear || 1)) * 100}%` 
               }}
               style={{ right: `${(metrics.rearLoad / (metrics.frontLoad + metrics.rearLoad || 1)) * 100}%` }}
               className="h-full bg-blue-500/40 border-l border-blue-500/60 transition-all absolute opacity-40"
             />
             <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white pointer-events-none z-10">
              <span className="opacity-40 mr-1">{Math.round(metrics.predRear)} ←</span> {Math.round(metrics.rearLoad)}
             </div>
          </div>
        </div>
      </div>

      {/* Header Selectors */}
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] pl-1">Target / Unit</label>
          <div className="relative">
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full bg-[#080808] text-white border border-white/10 rounded-sm py-4 px-5 appearance-none focus:border-accent outline-none text-xs font-bold tracking-wider"
            >
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-accent pointer-events-none" size={14} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] pl-1">Species / Bio</label>
          <div className="flex bg-[#080808] rounded-sm p-1 border border-white/10 h-[58px]">
            <button 
              onClick={() => setBirdType('Rooster')}
              className={cn(
                "flex-1 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                birdType === 'Rooster' ? "bg-accent text-black" : "text-white/20 hover:text-white/40"
              )}
            >
              Rooster
            </button>
            <button 
              onClick={() => setBirdType('Hen')}
              className={cn(
                "flex-1 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                birdType === 'Hen' ? "bg-accent text-black" : "text-white/20 hover:text-white/40"
              )}
            >
              Hen
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] pl-1">Load Quantity</label>
          <input 
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full bg-[#080808] text-white border border-white/10 rounded-sm py-4 px-5 focus:border-accent outline-none text-xs font-bold tracking-wider"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] pl-1">Origin / Farm Node</label>
          <div className="relative">
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="w-full bg-[#080808] text-white border border-white/10 rounded-sm py-4 px-5 appearance-none focus:border-accent outline-none text-xs font-bold tracking-wider uppercase"
            >
              {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-accent pointer-events-none" size={14} />
          </div>
        </div>
      </div>

      {/* Placement Options */}
      <div className="space-y-3">
        <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] pl-1">Load Architecture</label>
        <div className="flex flex-wrap gap-2">
          {placementOptions.map(opt => (
            <button
              key={opt}
              onClick={() => setPlacement(opt)}
              className={cn(
                "px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.3em] border transition-all",
                placement === opt 
                  ? "bg-white border-white text-black" 
                  : "bg-transparent border-white/10 text-white/30 hover:border-white/30"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Load List */}
      <div className="flex-1 bg-[#080808] border border-white/10 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] flex items-center gap-3">
            <Bird size={16} className="text-accent" />
            Artifacts List
          </h3>
          <span className="text-[10px] font-black uppercase tracking-widest text-accent">
            Aggregate: {totalBirds}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-10 space-y-6">
          <AnimatePresence initial={false}>
            {loads.map((load) => (
              <motion.div
                key={load.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="bg-white/2 p-6 border border-white/5 flex items-center justify-between group transition-colors hover:border-white/20"
              >
                <div>
                  <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em] mb-2">{load.placement} / System Load</div>
                  <div className="flex items-end gap-3 leading-none">
                    <span className="text-4xl font-black text-white tracking-tighter italic font-serif leading-none">{load.birds}</span>
                    <span className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">{load.type} UNIT</span>
                  </div>
                </div>
                <button 
                  onClick={() => removeLoad(load.id)}
                  className="p-3 text-white/10 hover:text-accent transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {loads.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-white/10 py-10">
              <Bird size={64} className="opacity-10 mb-6" />
              <p className="font-serif italic text-lg opacity-40">No units documented in current cycle.</p>
            </div>
          )}
        </div>

        {/* Signature Authorization */}
        <div className="px-10 pb-8 space-y-4">
          <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] pl-1">Operational Authorization</label>
          <div className="relative bg-white h-40 rounded-sm overflow-hidden shadow-inner border border-accent/20">
            {/* Design accents */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
              <Bird size={80} className="text-black" />
            </div>
            <div className="absolute bottom-8 left-10 right-10 h-px bg-black/10 pointer-events-none" />
            <div className="absolute bottom-3 left-10 text-[7px] font-black text-black/20 uppercase tracking-widest pointer-events-none">
              Authorized Signature Required Below
            </div>
            
            <SignatureCanvas 
              ref={sigCanvas}
              penColor='#000000'
              canvasProps={{
                className: 'w-full h-full cursor-crosshair'
              }}
            />
          </div>
          <div className="flex justify-between items-center px-1">
            <div className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none">NODE {user?.uid.slice(0, 8)} // SECURE PROTOCOL</div>
            <button 
              onClick={() => sigCanvas.current?.clear()}
              className="text-[9px] font-black text-red-500 hover:text-white uppercase tracking-[0.2em] transition-colors"
            >
              [ RESET ]
            </button>
          </div>
        </div>

        <div className="p-8 bg-[#050505] grid grid-cols-2 gap-6 border-t border-white/5">
          <button 
            onClick={addLoad}
            className="flex items-center justify-center gap-3 py-5 border border-white/10 hover:bg-white hover:text-black text-white font-black uppercase text-[10px] tracking-[0.4em] transition-all"
          >
            <Plus size={16} />
            Append Unit
          </button>
          <button 
            onClick={saveLog}
            disabled={loads.length === 0}
            className="flex items-center justify-center gap-3 py-5 bg-accent hover:bg-blue-300 disabled:opacity-20 text-black font-black uppercase text-[10px] tracking-[0.4em] transition-all shadow-2xl shadow-accent/20"
          >
            <Send size={16} />
            Finalize
          </button>
        </div>
      </div>
    </div>
  );
}


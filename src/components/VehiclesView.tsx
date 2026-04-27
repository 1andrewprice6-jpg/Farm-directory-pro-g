import React, { useState, useEffect, useRef } from 'react';
import { Plus, Fuel, Info, Camera, PenTool, Check, X, ChevronRight, Navigation, Zap, Truck } from 'lucide-react';
import { db, collection, onSnapshot, query, orderBy, handleFirestoreError, OperationType, addDoc, serverTimestamp, doc, updateDoc } from '../lib/firebase';
import { Vehicle, FuelLog } from '../types';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import SignatureCanvas from 'react-signature-canvas';

export function VehiclesView() {
  const { user } = useAppContext();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isAddingLog, setIsAddingLog] = useState<string | null>(null); // vehicleId
  const [isQuickLog, setIsQuickLog] = useState(false);
  
  // Form State
  const [truckNo, setTruckNo] = useState('');
  const [trailerNo, setTrailerNo] = useState('');
  const [color, setColor] = useState('');
  const [gallons, setGallons] = useState('');
  const [odometer, setOdometer] = useState('');
  const [meter, setMeter] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'vehicles'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVehicles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'vehicles'));
    return () => unsubscribe();
  }, []);

  const handleQuickLogStart = (v: Vehicle) => {
    resetForm();
    setIsAddingLog(v.id);
    setIsQuickLog(true);
    setOdometer(v.lastOdometer ? String(v.lastOdometer) : '');
    setGallons(v.lastFuelGallons ? String(v.lastFuelGallons) : '');
    setTruckNo('FLEET-Q');
    setTrailerNo('VAR-Q');
    setNotes('Quick log entry.');
  };

  const handleFullLogStart = (v: Vehicle) => {
    resetForm();
    setIsAddingLog(v.id);
    setIsQuickLog(false);
    setOdometer(v.lastOdometer ? String(v.lastOdometer) : '');
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveFuelLog = async () => {
    if (!user || !isAddingLog) return;
    
    let signatureUrl = '';
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      signatureUrl = sigCanvas.current.getCanvas().toDataURL('image/png');
    }

    // Try to get location
    let location: { lat?: number, lng?: number } = {};
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      location = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
    } catch (err) {
      console.warn("Location capture failed:", err);
    }

    try {
      await addDoc(collection(db, 'fuelLogs'), {
        vehicleId: isAddingLog,
        truckNumber: truckNo,
        trailerNumber: trailerNo,
        color,
        gallonsPumped: Number(gallons),
        odometerReading: Number(odometer),
        meterReading: meter,
        notes,
        signatureUrl,
        photoUrl: photoUrl || '',
        ...location,
        userId: user.uid,
        timestamp: serverTimestamp()
      });

      // Update vehicle with latest stats
      await updateDoc(doc(db, 'vehicles', isAddingLog), {
        lastOdometer: Number(odometer),
        lastFuelGallons: Number(gallons),
        updatedAt: serverTimestamp()
      });

      setIsAddingLog(null);
      resetForm();
      alert("Fuel log saved!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'fuelLogs');
    }
  };

  const resetForm = () => {
    setTruckNo('');
    setTrailerNo('');
    setColor('');
    setGallons('');
    setOdometer('');
    setMeter('');
    setNotes('');
    setPhotoUrl(null);
  };

  const Input = ({ label, value, onChange, placeholder, type = 'text' }: { label: string, value: string, onChange: (v: string) => void, placeholder: string, type?: string }) => (
    <div className="space-y-2">
      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] pl-1">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 text-white border border-white/10 rounded-sm py-4 px-5 focus:border-accent outline-none transition-all placeholder-white/10 text-xs font-bold tracking-wider"
      />
    </div>
  );

  const closeDetails = () => setSelectedVehicle(null);

  return (
    <div className="flex flex-col h-full bg-[#050505] p-8 relative">
      <div className="space-y-6">
        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/2 border border-white/5 rounded-sm">
            <Truck size={48} className="text-white/10 mb-6" />
            <p className="text-xl font-black text-white/40 italic font-serif">Awaiting Fleet Provisioning</p>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mt-2">No active transports detected in current sector</p>
          </div>
        ) : (
          vehicles.map((v) => (
            <div 
              key={v.id} 
              onClick={() => setSelectedVehicle(v)}
              className="bg-white/2 border border-white/10 p-8 relative group overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600 opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/5 border border-white/10 flex items-center justify-center text-emerald-600">
                     <Navigation size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white italic font-serif tracking-tighter uppercase">{v.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">{v.status || 'Active'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-8">
                  {v.lastOdometer !== undefined && (
                    <div className="text-right">
                      <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Odometer</div>
                      <div className="text-sm font-black text-white/80 tabular-nums">
                        {v.lastOdometer.toLocaleString()} <span className="text-[9px] opacity-30 ml-0.5">km</span>
                      </div>
                    </div>
                  )}
                  {v.lastFuelGallons !== undefined && (
                    <div className="text-right">
                      <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Last Fuel</div>
                      <div className="text-sm font-black text-white/80 tabular-nums">
                        {v.lastFuelGallons} <span className="text-[9px] opacity-30 ml-0.5">gal</span>
                      </div>
                    </div>
                  )}
                  <ChevronRight size={24} className="text-white/5" />
                </div>
              </div>
              
              <div className="mt-8 flex gap-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickLogStart(v);
                  }}
                  className="flex-1 flex items-center justify-center gap-3 py-4 bg-accent text-black rounded-sm font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-white"
                >
                  <Zap size={14} />
                  Quick Fuel
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFullLogStart(v);
                  }}
                  className="flex-1 flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 hover:bg-neutral-100 hover:text-black text-white rounded-sm font-black text-[10px] uppercase tracking-[0.3em] transition-all"
                >
                  <Fuel size={14} className="text-emerald-500 group-hover:text-current" />
                  Log Fuel
                </button>
                <button 
                  className="hidden md:flex items-center justify-center gap-3 py-4 px-6 bg-white/5 border border-white/10 hover:bg-white hover:text-black text-white rounded-sm font-black text-[10px] uppercase tracking-[0.3em] transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVehicle(v);
                  }}
                >
                  <Info size={14} className="text-emerald-500 group-hover:text-current" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button className="fixed bottom-28 right-8 bg-white text-black p-6 rounded-sm shadow-2xl active:scale-95 transition-all">
        <Plus size={32} />
      </button>

      <AnimatePresence>
        {selectedVehicle && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDetails}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#050505] border border-white/10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600" />
              
              <div className="p-10">
                <div className="flex justify-between items-start mb-12">
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.6em] text-emerald-500">Technical Specifications</div>
                    <h2 className="text-5xl font-black tracking-tighter uppercase italic font-serif text-white">{selectedVehicle.name}</h2>
                  </div>
                  <button 
                    onClick={closeDetails}
                    className="p-3 bg-white/5 border border-white/10 text-white/30 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-10 mb-12">
                  <div className="space-y-1">
                    <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Registration</div>
                    <div className="text-xl font-black text-white italic font-serif">{selectedVehicle.plate}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Capacity</div>
                    <div className="text-xl font-black text-white italic font-serif">{selectedVehicle.maxCapacity || '4500'} <span className="text-[10px] not-italic text-emerald-500 ml-1 uppercase">Units</span></div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Condition</div>
                    <div className="text-xl font-black text-white italic font-serif uppercase tracking-tighter">{selectedVehicle.status}</div>
                  </div>
                  {selectedVehicle.lastOdometer !== undefined && (
                    <div className="space-y-1">
                      <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Last Odometer</div>
                      <div className="text-xl font-black text-white italic font-serif">{selectedVehicle.lastOdometer.toLocaleString()} <span className="text-[10px] not-italic text-emerald-500 ml-1 uppercase">km</span></div>
                    </div>
                  )}
                  {selectedVehicle.lastFuelGallons !== undefined && (
                    <div className="space-y-1">
                      <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Last Fueling</div>
                      <div className="text-xl font-black text-white italic font-serif">{selectedVehicle.lastFuelGallons} <span className="text-[10px] not-italic text-emerald-500 ml-1 uppercase">gal</span></div>
                    </div>
                  )}
                </div>

                <div className="space-y-6 bg-white/2 border border-white/10 p-8 mb-10">
                  <div className="flex items-center gap-4 text-white/60">
                    <Info size={16} className="text-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">Operational Narrative</span>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed uppercase tracking-wider">
                    {selectedVehicle.notes || "No additional technical documentation available for this asset. Operating at standard fleet parameters."}
                  </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                        setIsAddingLog(selectedVehicle.id);
                        closeDetails();
                    }}
                    className="flex-1 py-5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3"
                  >
                    <PenTool size={16} />
                    Initiate Log
                  </button>
                  <button 
                    onClick={closeDetails}
                    className="px-10 py-5 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white/10 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isAddingLog && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-50 bg-[#050505] flex flex-col pt-12"
          >
            {/* Spectral backdrop */}
            <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-accent/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="px-10 flex items-center justify-between mb-10 z-10">
              <button onClick={() => setIsAddingLog(null)} className="text-white/30 hover:text-white transition-colors"><X size={32} /></button>
              <div className="text-center">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic font-serif text-white leading-none">Fuel Narrative</h2>
                <p className="text-[9px] uppercase tracking-[0.5em] text-accent font-bold mt-1">Operational Protocol</p>
              </div>
              <button onClick={saveFuelLog} className="text-accent hover:scale-110 transition-transform"><Check size={32} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-16 space-y-10 z-10">
              <div className={cn("grid gap-8", isQuickLog ? "grid-cols-1" : "grid-cols-2")}>
                {!isQuickLog ? (
                  <>
                    <Input label="System ID / Truck" value={truckNo} onChange={setTruckNo} placeholder="101" />
                    <Input label="Artifact ID / Trailer" value={trailerNo} onChange={setTrailerNo} placeholder="T42" />
                  </>
                ) : (
                  <div className="bg-white/2 border border-white/10 p-6 rounded-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-2">Targeting System</p>
                    <p className="text-sm font-black text-white italic font-serif">QUICK LOG PROTOCOL ACTIVE</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8">
                <Input label="Liquid Volume (G)" value={gallons} onChange={setGallons} placeholder="0.00" type="number" />
                <Input label="Temporal Distance" value={odometer} onChange={setOdometer} placeholder="Reading" type="number" />
              </div>

              {!isQuickLog && (
                <>
                  <div className="grid grid-cols-2 gap-8">
                    <Input label="Chromatic Tone" value={color} onChange={setColor} placeholder="Truck color" />
                    <Input label="Meter Variance" value={meter} onChange={setMeter} placeholder="Pump meter" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] pl-1">Visual Documentation / Memo</label>
                    <div className="flex gap-6 h-40">
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleCapture}
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-1/3 flex flex-col items-center justify-center border border-white/10 bg-white/2 hover:bg-white/5 text-white/20 hover:text-accent transition-all group overflow-hidden relative"
                      >
                        {photoUrl ? (
                          <>
                            <img src={photoUrl} alt="Preview" className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                              <Camera size={24} className="mb-2 text-accent" />
                              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white">Retake</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Camera size={32} className="mb-3" />
                            <span className="text-[8px] font-black uppercase tracking-[0.3em]">Capture</span>
                          </>
                        )}
                      </button>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Document exceptionalities..."
                        className="flex-1 bg-white/2 border border-white/10 p-6 text-white text-xs font-medium placeholder-white/10 focus:border-accent outline-none resize-none transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-3">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] pl-1">Operational Authorization</label>
                <div className="relative bg-white h-48 rounded-sm overflow-hidden shadow-inner border border-white/10 group">
                  {/* Decorative background for the signature pad */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                    <PenTool size={80} className="text-black" />
                  </div>
                  <div className="absolute bottom-8 left-10 right-10 h-px bg-black/10 pointer-events-none" />
                  <div className="absolute bottom-3 left-10 text-[7px] font-black text-black/20 uppercase tracking-widest pointer-events-none">
                    Digital Signature Required Below
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
                  <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">Node Auth ID: {user?.uid.slice(0, 12)}</div>
                  <button 
                    onClick={() => sigCanvas.current?.clear()}
                    className="text-[9px] font-black text-red-500 hover:text-white uppercase tracking-[0.2em] transition-colors"
                  >
                    [ RESET SIGNATURE ]
                  </button>
                </div>
              </div>
            </div>

            <div className="p-10 bg-[#080808] border-t border-white/5 z-10">
              <button 
                onClick={saveFuelLog}
                className="w-full py-6 bg-emerald-600 text-white font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl shadow-emerald-600/20 active:scale-[0.98] transition-all"
              >
                Submit Data Artifact
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

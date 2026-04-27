import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Fuel, Trash2, TrendingUp, Map as MapIcon, List, Calendar, Truck, Filter, Plus, X, Camera, Zap, Loader2 } from 'lucide-react';
import { db, collection, onSnapshot, query, orderBy, handleFirestoreError, OperationType, deleteDoc, doc, where, addDoc, serverTimestamp, updateDoc } from '../lib/firebase';
import { FuelLog, Vehicle } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAppContext } from '../context/AppContext';
import SignatureCanvas from 'react-signature-canvas';
import { GoogleGenAI } from '@google/genai';

// Fix Leaflet marker icons
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export function FuelLogView() {
  const { user } = useAppContext();
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Filters
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Quick Add State
  const [isAdding, setIsAdding] = useState(false);
  const [isQuickLog, setIsQuickLog] = useState(false);
  const [formVehicleId, setFormVehicleId] = useState('');
  const [truckNumber, setTruckNumber] = useState('');
  const [trailerNumber, setTrailerNumber] = useState('');
  const [gallons, setGallons] = useState('');
  const [odometer, setOdometer] = useState('');
  const [meter, setMeter] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);

  const startLog = (quick: boolean) => {
    setIsAdding(true);
    setIsQuickLog(quick);
    setFormVehicleId('');
    setTruckNumber('');
    setTrailerNumber('');
    setGallons('');
    setOdometer('');
    setMeter('');
  };

  useEffect(() => {
    if (isQuickLog && formVehicleId) {
      const vehicle = vehicles.find(v => v.id === formVehicleId);
      if (vehicle) {
        setTruckNumber(vehicle.name);
        setTrailerNumber(vehicle.plate || '');
        setOdometer(vehicle.lastOdometer ? String(vehicle.lastOdometer) : '');
        setGallons(vehicle.lastFuelGallons ? String(vehicle.lastFuelGallons) : '');
      }
    }
  }, [formVehicleId, isQuickLog, vehicles]);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
         await extractWithAI(reader.result as string);
         if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const extractWithAI = async (base64Image: string) => {
    setIsProcessingImage(true);
    try {
      let apiKey = "";
      try { apiKey = process.env.GEMINI_API_KEY as string; } catch { }
      if (!apiKey) apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY as string;
      
      const ai = new GoogleGenAI({ apiKey });
      
      const base64Data = base64Image.split(',')[1];
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: "Extract the exact odometer value, pump meter reading, and the number of gallons pumped (volume) from this image. Please output JSON format with keys 'odometer', 'meter', and 'gallons'. Do not include markdown codeblocks or any other text. if none is found leave empty." },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }
        ]
      });
      
      let text = response.text || '{}';
      if (text.includes("```json")) {
         text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      }
      const result = JSON.parse(text);
      if (result.odometer) setOdometer(String(result.odometer));
      if (result.gallons) setGallons(String(result.gallons));
      if (result.meter) setMeter(String(result.meter));
    } catch (e) {
      console.error(e);
      alert("Failed to extract data via AI.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleCreateLog = async () => {
    if (!user || !formVehicleId || !gallons || !odometer) return;

    let signatureUrl = '';
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      signatureUrl = sigCanvas.current.getCanvas().toDataURL('image/png');
    }

    let location: { lat?: number, lng?: number } = {};
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      location = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
    } catch (err) {
      console.warn("Location capture failed:", err);
    }

    const vehicle = vehicles.find(v => v.id === formVehicleId);

    try {
      await addDoc(collection(db, 'fuelLogs'), {
        vehicleId: formVehicleId,
        truckNumber: truckNumber || vehicle?.name || '',
        trailerNumber: trailerNumber || '',
        color: 'white',
        gallonsPumped: Number(gallons),
        odometerReading: Number(odometer),
        meterReading: meter,
        notes: '',
        signatureUrl,
        photoUrl: '',
        ...location,
        userId: user.uid,
        timestamp: serverTimestamp()
      });

      await updateDoc(doc(db, 'vehicles', formVehicleId), {
        lastOdometer: Number(odometer),
        lastFuelGallons: Number(gallons)
      });

      setIsAdding(false);
      setFormVehicleId('');
      setGallons('');
      setOdometer('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'fuelLogs');
    }
  };

  useEffect(() => {
    if (!user) return;

    // Fetch Logs
    const q = query(
      collection(db, 'fuelLogs'), 
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    const unsubscribeLogs = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          // Handle potential legacy field names or align to types
          gallonsPumped: data.gallonsPumped || data.gallons || 0,
          odometerReading: data.odometerReading || data.odometer || 0,
          truckNumber: data.truckNumber || data.truckNo || 'N/A'
        } as FuelLog;
      });
      setLogs(logsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'fuelLogs');
    });

    // Fetch Vehicles for filtering
    const vq = query(collection(db, 'vehicles'), orderBy('name', 'asc'));
    const unsubscribeVehicles = onSnapshot(vq, (snapshot) => {
      setVehicles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle)));
    });

    return () => {
      unsubscribeLogs();
      unsubscribeVehicles();
    };
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesVehicle = selectedVehicleId === 'ALL' || log.vehicleId === selectedVehicleId;
      const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date();
      
      let matchesStartDate = true;
      if (startDate) {
        matchesStartDate = logDate >= new Date(startDate);
      }

      let matchesEndDate = true;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesEndDate = logDate <= end;
      }

      return matchesVehicle && matchesStartDate && matchesEndDate;
    });
  }, [logs, selectedVehicleId, startDate, endDate]);

  const stats = useMemo(() => {
    const total = filteredLogs.reduce((sum, log) => sum + Number(log.gallonsPumped), 0);
    const count = filteredLogs.length;
    const avg = count > 0 ? total / count : 0;
    return {
      total: total.toFixed(1),
      avg: avg.toFixed(1),
      count
    };
  }, [filteredLogs]);

  const handleDelete = async (id: string) => {
    if (!confirm('Permanent deletion of fuel artifact?')) return;
    try {
      await deleteDoc(doc(db, 'fuelLogs', id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] p-8 space-y-8 overflow-y-auto scrollbar-hide">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-white italic font-serif tracking-tighter uppercase leading-none">Fuel Intelligence</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-accent mt-2">Operational Analytics & Mapping</p>
        </div>
        
        <div className="flex gap-4 items-center self-stretch md:self-auto">
          <button
            onClick={() => startLog(true)}
            className="flex items-center gap-2 px-6 py-2 bg-accent text-black text-[9px] font-black uppercase tracking-[0.3em] transition-all rounded-sm shadow-lg hover:bg-white"
          >
            <Zap size={12} /> Quick Log
          </button>
          <button
            onClick={() => startLog(false)}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-[0.3em] transition-all rounded-sm shadow-lg"
          >
            <Plus size={12} /> Log Fuel
          </button>
          <div className="flex bg-white/2 border border-white/10 p-1 rounded-sm gap-1 flex-1 md:flex-none">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 text-[9px] font-black uppercase tracking-[0.3em] transition-all rounded-sm",
                viewMode === 'list' ? "bg-white/10 text-white shadow-lg" : "text-white/30 hover:text-white/60"
              )}
            >
              <List size={12} /> List View
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 text-[9px] font-black uppercase tracking-[0.3em] transition-all rounded-sm",
                viewMode === 'map' ? "bg-accent/20 text-accent shadow-lg" : "text-white/30 hover:text-white/60"
              )}
            >
              <MapIcon size={12} /> Spatial Map
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#050505] border border-white/10 w-full max-w-2xl rounded-sm p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute top-6 right-6 text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>

              <h3 className="text-2xl font-black italic font-serif text-white uppercase mb-8 flex items-center gap-3">
                <Fuel className="text-emerald-500" /> Authorized Fuel Logging
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Target Vehicle</label>
                  <select 
                    value={formVehicleId}
                    onChange={(e) => setFormVehicleId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-4 text-white font-black italic font-serif text-xl outline-none focus:border-emerald-600 transition-colors"
                  >
                    <option value="">-- SELECT VEHICLE --</option>
                    {vehicles.filter(v => v.isActive).map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Truck Number</label>
                    <input 
                      type="text"
                      value={truckNumber}
                      onChange={(e) => setTruckNumber(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-4 text-white font-black italic font-serif text-xl outline-none focus:border-emerald-600 transition-colors"
                      placeholder="Truck #/Name"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Trailer Number</label>
                    <input 
                      type="text"
                      value={trailerNumber}
                      onChange={(e) => setTrailerNumber(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-4 text-white font-black italic font-serif text-xl outline-none focus:border-emerald-600 transition-colors"
                      placeholder="Trailer #"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 flex justify-between items-center">
                      <span>Volume (Gallons)</span>
                    </label>
                    <input 
                      type="number"
                      value={gallons}
                      onChange={(e) => setGallons(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-4 text-white font-black italic font-serif text-xl outline-none focus:border-emerald-600 transition-colors"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 flex justify-between items-center">
                      <span>Odometer (Current)</span>
                      <div className="relative">
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
                          disabled={isProcessingImage}
                          className="flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white rounded-sm px-2 py-1 transition-colors"
                        >
                          {isProcessingImage ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                          <span className="text-[7px]">Extract AI</span>
                        </button>
                      </div>
                    </label>
                    <input 
                      type="number"
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-4 text-white font-black italic font-serif text-xl outline-none focus:border-emerald-600 transition-colors"
                      placeholder="0"
                    />
                  </div>
                </div>

                {!isQuickLog && (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Pump Meter Reading</label>
                    <input 
                      type="text"
                      value={meter}
                      onChange={(e) => setMeter(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-4 text-white font-black italic font-serif text-xl outline-none focus:border-emerald-600 transition-colors"
                      placeholder="Meter Reading"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest">Digital Signature Authorization</label>
                  <div className="bg-white rounded-sm border-2 border-white/10 overflow-hidden relative h-32">
                    <div className="absolute bottom-3 left-10 text-[7px] font-black text-black/20 uppercase tracking-widest pointer-events-none">
                      Sign Here
                    </div>
                    <SignatureCanvas 
                      ref={sigCanvas}
                      penColor='#000000'
                      canvasProps={{
                        className: 'w-full h-full cursor-crosshair'
                      }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={() => sigCanvas.current?.clear()}
                      className="text-[9px] font-black text-red-500 hover:text-white uppercase tracking-[0.2em] transition-colors mt-2"
                    >
                      [ CLEAR SIGNATURE ]
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleCreateLog}
                  disabled={!formVehicleId || !gallons || !odometer}
                  className="w-full py-6 mt-8 bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/5 disabled:text-white/20 text-white text-[12px] font-black uppercase tracking-[0.4em] transition-all rounded-sm"
                >
                  Confirm & Capture Telemetry
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Volume Aggreg.', value: stats.total, unit: 'GAL', color: 'text-white' },
          { label: 'Mean Efficiency', value: stats.avg, unit: 'AVG', color: 'text-accent' },
          { label: 'Artifact Count', value: stats.count, unit: 'LOGS', color: 'text-white/60' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white/2 border border-white/10 p-6 rounded-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-white/5" />
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 mb-3">{s.label}</p>
            <div className={cn("text-2xl font-black italic font-serif leading-none", s.color)}>
              {s.value} <span className="text-[9px] not-italic opacity-30 ml-1">{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white/2 border border-white/10 p-6 grid grid-cols-1 md:grid-cols-4 gap-6 rounded-sm">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white/20">
            <Truck size={10} className="text-emerald-500" /> Vehicle Filter
          </label>
          <select 
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="w-full bg-white/5 border border-white/10 p-3 text-white text-[10px] font-black uppercase tracking-widest outline-none focus:border-emerald-600 transition-colors"
          >
            <option value="ALL">ALL ASSETS</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white/20">
            <Calendar size={10} className="text-emerald-500" /> Start Epoch
          </label>
          <input 
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 p-3 text-white text-[10px] font-black uppercase tracking-widest outline-none focus:border-emerald-600 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-white/20">
            <Calendar size={10} className="text-emerald-500" /> End Epoch
          </label>
          <input 
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 p-3 text-white text-[10px] font-black uppercase tracking-widest outline-none focus:border-emerald-600 transition-colors"
          />
        </div>

        <div className="flex items-end">
          <button 
            onClick={() => {
              setSelectedVehicleId('ALL');
              setStartDate('');
              setEndDate('');
            }}
            className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-[0.3em] transition-all"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-[600px] pb-24">
        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredLogs.map((log) => {
                const vehicle = vehicles.find(v => v.id === log.vehicleId || v.name === log.truckNumber);
                return (
                <motion.div
                  layout
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/2 border border-white/10 p-8 rounded-sm group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600 opacity-30 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-2">Truck ID: {log.truckNumber}</div>
                      <h4 className="text-xl font-black text-white italic font-serif uppercase tracking-tight">
                         {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                      </h4>
                    </div>
                    <button 
                      onClick={() => handleDelete(log.id)}
                      className="p-3 text-red-500/20 hover:text-red-500 hover:bg-red-500/5 transition-all rounded-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/5 p-4 rounded-sm">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Volume</p>
                      <p className="text-lg font-black text-white italic font-serif leading-none">
                        {log.gallonsPumped} <span className="text-[9px] not-italic opacity-30 ml-1 uppercase font-sans">Gallons</span>
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-4 rounded-sm">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Odometer</p>
                      <p className="text-lg font-black text-white italic font-serif leading-none">
                        {Number(log.odometerReading).toLocaleString()} <span className="text-[9px] not-italic opacity-30 ml-1 uppercase font-sans">KM</span>
                      </p>
                    </div>
                    {log.meterReading && (
                      <div className="bg-white/5 border border-white/5 p-4 rounded-sm col-span-2">
                        <p className="text-[8px] font-black text-emerald-500/50 uppercase tracking-[0.3em] mb-1">Pump Meter Reading</p>
                        <p className="text-lg font-black text-emerald-400 italic font-serif leading-none">
                          {log.meterReading}
                        </p>
                      </div>
                    )}
                  </div>

                  {vehicle && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-white/2 border border-white/5 p-3 rounded-sm">
                         <p className="text-[7px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Max Capacity</p>
                         <p className="text-md font-black text-emerald-500 italic font-serif leading-none">
                           {vehicle.maxCapacity ? vehicle.maxCapacity.toLocaleString() : 'N/A'} <span className="text-[8px] not-italic opacity-30 ml-1 uppercase font-sans">Units</span>
                         </p>
                      </div>
                      <div className="bg-white/2 border border-white/5 p-3 rounded-sm">
                         <p className="text-[7px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Last Recorded Odometer</p>
                         <p className="text-md font-black text-white/80 italic font-serif leading-none">
                           {vehicle.lastOdometer ? vehicle.lastOdometer.toLocaleString() : 'N/A'} <span className="text-[8px] not-italic opacity-30 ml-1 uppercase font-sans">KM</span>
                         </p>
                      </div>
                    </div>
                  )}

                  {log.signatureUrl && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Authorized Digitally</span>
                      <div className="h-6 opacity-40 invert grayscale">
                        <img src={log.signatureUrl} alt="Sign" className="h-full object-contain" />
                      </div>
                    </div>
                  )}
                  
                  {log.lat && (
                    <div className="mt-4 flex items-center gap-2">
                       <MapIcon size={10} className="text-accent" />
                       <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Location Encoded: {log.lat.toFixed(4)}, {log.lng?.toFixed(4)}</span>
                    </div>
                  )}
                </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredLogs.length === 0 && (
              <div className="col-span-full py-40 text-center space-y-6">
                <Fuel size={64} className="mx-auto text-white/5" />
                <div className="space-y-2">
                  <p className="text-xl font-black text-white/20 italic font-serif">No Fuel Artifacts Detected</p>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/10">Initialize operational logging to populate</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[600px] border border-white/10 rounded-sm overflow-hidden bg-white/2 relative">
            <MapContainer 
              center={[33.7490, -84.3880]} 
              zoom={8} 
              style={{ height: '100%', width: '100%', filter: 'invert(1) hue-rotate(180deg) brightness(0.6)' }}
              zoomControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {filteredLogs.filter(log => log.lat && log.lng).map(log => (
                <Marker key={log.id} position={[log.lat!, log.lng!]}>
                  <Popup className="agrifleet-popup">
                    <div className="p-4 min-w-[200px] bg-[#0A0A0A] text-white border border-white/10 shadow-2xl">
                      <div className="text-[9px] font-black text-accent uppercase tracking-[0.4em] mb-2">Fuel Point Artifact</div>
                      <h4 className="text-sm font-black uppercase italic font-serif text-white leading-tight mb-2">Truck {log.truckNumber}</h4>
                      <div className="space-y-3 mb-4">
                         <div className="flex justify-between items-center bg-white/5 p-2 rounded-sm">
                            <span className="text-[8px] font-black text-white/20 uppercase">Volume</span>
                            <span className="text-xs font-black italic font-serif text-white">{log.gallonsPumped} G</span>
                         </div>
                         <div className="flex justify-between items-center bg-white/5 p-2 rounded-sm">
                            <span className="text-[8px] font-black text-white/20 uppercase">Epoch</span>
                            <span className="text-[9px] font-black text-white/60">
                               {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleDateString() : 'N/A'}
                            </span>
                         </div>
                      </div>
                      <button 
                        onClick={() => setViewMode('list')}
                        className="w-full py-2 bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all"
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            
            <div className="absolute bottom-6 right-6 z-[1000] bg-black/80 backdrop-blur-md p-4 border border-white/10 rounded-sm">
               <div className="text-[9px] font-black uppercase tracking-[0.4em] text-accent mb-2">Spatial Distribution</div>
               <div className="text-xl font-black text-white italic font-serif">
                 {filteredLogs.filter(log => log.lat && log.lng).length} <span className="text-[10px] not-italic opacity-40 uppercase">Vectors</span>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

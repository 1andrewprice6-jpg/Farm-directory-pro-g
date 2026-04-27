import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, where, orderBy, handleFirestoreError, OperationType } from '../lib/firebase';
import { FuelLog, CatchLog } from '../types';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import { Fuel, Bird, Calendar, Search, Filter, Share2, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function HistoryView() {
  const { user } = useAppContext();
  const [activeTab, setActiveTab] = useState<'Catch' | 'Fuel'>('Catch');
  const [catchLogs, setCatchLogs] = useState<CatchLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
 
  useEffect(() => {
    if (!user) return;

    const cQ = query(collection(db, 'catchLogs'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'));
    const unsubscribeC = onSnapshot(cQ, (snapshot) => {
      setCatchLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CatchLog)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'catchLogs'));

    const fQ = query(collection(db, 'fuelLogs'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'));
    const unsubscribeF = onSnapshot(fQ, (snapshot) => {
      setFuelLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FuelLog)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'fuelLogs'));

    return () => { unsubscribeC(); unsubscribeF(); };
  }, [user]);

  const formatDate = (ts: any) => {
    if (!ts) return 'Unknown Date';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return format(date, 'MMM dd, yyyy • hh:mm a');
  };

  const filteredCatchLogs = catchLogs.filter(log => 
    log.farmName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    log.vehicleName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFuelLogs = fuelLogs.filter(log => 
    log.vehicleName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    log.truckNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.trailerNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#050505] p-8 space-y-10">
      {/* Tabs */}
      <div className="flex bg-[#080808] border border-white/10 p-1 rounded-sm overflow-hidden h-14 shrink-0">
        <button
          onClick={() => setActiveTab('Catch')}
          className={cn(
            "flex-1 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all",
            activeTab === 'Catch' ? "bg-accent text-black shadow-lg shadow-accent/10" : "text-white/20 hover:text-white/40"
          )}
        >
          <Bird size={14} />
          Biologicals
        </button>
        <button
          onClick={() => setActiveTab('Fuel')}
          className={cn(
            "flex-1 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all",
            activeTab === 'Fuel' ? "bg-accent text-black shadow-lg shadow-accent/10" : "text-white/20 hover:text-white/40"
          )}
        >
          <Fuel size={14} />
          Energy Logs
        </button>
      </div>

      {/* Search */}
      <div className="relative group shrink-0">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-accent transition-colors" size={18} />
        <input
          type="text"
          placeholder="Query archives..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/2 border border-white/10 rounded-sm py-5 pl-14 pr-6 text-xs font-bold text-white placeholder-white/5 focus:border-accent outline-none transition-all tracking-[0.2em] uppercase"
        />
      </div>

      {/* List */}
      <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-hide pb-20">
        <AnimatePresence mode="popLayout">
          {activeTab === 'Catch' ? (
            filteredCatchLogs.map((log) => (
              <motion.div
                layout
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-white/2 border border-white/5 p-8 relative group hover:border-white/20 transition-colors"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                  <Bird size={64} />
                </div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-[8px] font-black text-accent uppercase tracking-[0.5em] mb-2">Operational Node</div>
                    <h4 className="text-xl font-black text-white italic font-serif tracking-tighter uppercase">{log.farmName}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em] mb-2">Temporal Marker</div>
                    <div className="text-[10px] font-black text-white/60 tracking-widest">{formatDate(log.timestamp)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-6">
                  <div>
                    <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em] mb-1">Payload Aggregate</div>
                    <div className="text-2xl font-black text-white italic font-serif">{log.totalBirds} <span className="text-[10px] not-italic text-accent ml-1 tracking-widest uppercase">Units</span></div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em] mb-1">Vehicle Unit</div>
                    <div className="text-xs font-black text-white tracking-widest uppercase">{log.vehicleName}</div>
                  </div>
                  {log.signatureUrl && (
                    <div className="col-span-2 mt-4 pt-4 border-t border-white/5 flex justify-end">
                      <div className="bg-white px-4 py-1 rounded-sm opacity-60 hover:opacity-100 transition-opacity">
                        <img src={log.signatureUrl} alt="Signature" className="h-8 w-auto grayscale" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            filteredFuelLogs.map((log) => (
              <motion.div
                layout
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-white/2 border border-white/5 p-8 relative group hover:border-white/20 transition-colors"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                  <Fuel size={64} />
                </div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-[8px] font-black text-accent uppercase tracking-[0.5em] mb-2">Energy Narrative</div>
                    <h4 className="text-xl font-black text-white italic font-serif tracking-tighter uppercase">{log.vehicleName || 'Legacy Unit'}</h4>
                    <div className="text-[9px] font-black text-white/30 tracking-widest uppercase mt-1">Truck: {log.truckNumber} / Trailer: {log.trailerNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em] mb-2">Marker</div>
                    <div className="text-[10px] font-black text-white/60 tracking-widest">{formatDate(log.timestamp)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 border-t border-white/5 pt-6">
                  <div>
                    <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em] mb-1">Volume</div>
                    <div className="text-lg font-black text-white italic font-serif">{log.gallonsPumped} <span className="text-[9px] not-italic text-accent uppercase tracking-widest">G</span></div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em] mb-1">Distance</div>
                    <div className="text-lg font-black text-white italic font-serif">{log.odometerReading} <span className="text-[9px] not-italic text-accent uppercase tracking-widest">M</span></div>
                  </div>
                  <div className="flex justify-end items-end gap-3">
                    {log.photoUrl && (
                      <div className="bg-white/5 p-1 rounded-sm border border-white/10 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                        <img src={log.photoUrl} alt="Receipt" className="h-8 w-auto object-cover" />
                      </div>
                    )}
                    {log.signatureUrl && (
                      <div className="bg-white px-3 py-1 rounded-sm opacity-60 hover:opacity-100 transition-opacity">
                        <img src={log.signatureUrl} alt="Signature" className="h-6 w-auto grayscale" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        {(activeTab === 'Catch' ? filteredCatchLogs : filteredFuelLogs).length === 0 && (
          <div className="text-center py-40">
            <div className="text-white/10 font-serif italic text-2xl mb-4">No archives matching criteria.</div>
            <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.6em]">System Standby</div>
          </div>
        )}
      </div>
    </div>
  );
}

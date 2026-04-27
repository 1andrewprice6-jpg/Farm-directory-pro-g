import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Phone, Navigation as NavIcon, Mic, ChevronDown, Menu, Map as MapIcon, List } from 'lucide-react';
import { db, collection, onSnapshot, query, orderBy, handleFirestoreError, OperationType } from '../lib/firebase';
import { Farm, Vehicle } from '../types';
import { useAppContext } from '../context/AppContext';
import { cn, calculateDistance } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Vite
const markerIcon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const markerShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export function FarmsView() {
  const { settings } = useAppContext();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [filterLetter, setFilterLetter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');
  const [selectedForRoute, setSelectedForRoute] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleFarmSelection = (id: string) => {
    setSelectedForRoute(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const optimizedRoute = useMemo(() => {
    if (selectedForRoute.length < 2) return [];
    
    const selectedFarms = farms.filter(f => selectedForRoute.includes(f.id) && f.lat && f.lng);
    if (selectedFarms.length < 2) return [];

    // Simple Nearest Neighbor TSP Heuristic
    const route = [selectedFarms[0]];
    const unvisited = selectedFarms.slice(1);

    while (unvisited.length > 0) {
      const current = route[route.length - 1];
      let nearestIdx = 0;
      let minDist = Infinity;

      unvisited.forEach((target, idx) => {
        const dist = Math.sqrt(
          Math.pow(target.lat! - current.lat!, 2) + Math.pow(target.lng! - current.lng!, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = idx;
        }
      });

      route.push(unvisited.splice(nearestIdx, 1)[0]);
    }
    return route;
  }, [selectedForRoute, farms]);

  const { totalDistance, routeSegments } = useMemo(() => {
    if (optimizedRoute.length < 2) return { totalDistance: 0, routeSegments: [] };
    
    let dist = 0;
    const segments: number[] = [];
    
    for (let i = 0; i < optimizedRoute.length - 1; i++) {
      const d = calculateDistance(
        optimizedRoute[i].lat!, optimizedRoute[i].lng!,
        optimizedRoute[i + 1].lat!, optimizedRoute[i + 1].lng!
      );
      dist += d;
      segments.push(d);
    }
    
    return { totalDistance: dist, routeSegments: segments };
  }, [optimizedRoute]);

  const alphabet = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  useEffect(() => {
    const q = query(collection(db, 'farms'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFarms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Farm)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'farms'));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'vehicles'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const v = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
      setVehicles(v);
      if (v.length > 0 && !selectedVehicleId) setSelectedVehicleId(v[0].id);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'vehicles'));
    return () => unsubscribe();
  }, []);

  const filteredFarms = farms.filter(farm => {
    const matchesSearch = farm.name.toLowerCase().includes(search.toLowerCase()) || 
                          farm.address.toLowerCase().includes(search.toLowerCase());
    const matchesLetter = filterLetter === 'ALL' || farm.name.toUpperCase().startsWith(filterLetter);
    return matchesSearch && matchesLetter;
  });

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      {/* Vehicle Selector top bar */}
      <div className="bg-[#080808] px-8 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className="relative inline-flex items-center group">
            <span className="text-white/30 text-[9px] font-bold tracking-[0.4em] uppercase mr-3">Unit:</span>
            <select 
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="appearance-none bg-transparent text-white text-xs font-bold tracking-wider pr-8 focus:outline-none cursor-pointer uppercase"
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id} className="bg-[#080808]">{v.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-0 pointer-events-none text-accent" size={12} />
          </div>

          <div className="flex border border-white/10 rounded-sm overflow-hidden">
            <button 
              onClick={() => setViewMode('LIST')}
              className={cn("p-2 transition-colors", viewMode === 'LIST' ? "bg-accent text-black" : "bg-transparent text-white/40 hover:text-white")}
            >
              <List size={14} />
            </button>
            <button 
              onClick={() => setViewMode('MAP')}
              className={cn("p-2 transition-colors", viewMode === 'MAP' ? "bg-accent text-black" : "bg-transparent text-white/40 hover:text-white")}
            >
              <MapIcon size={14} />
            </button>
          </div>

          <button 
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className={cn(
              "px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] border transition-all",
              isSelectionMode ? "bg-white text-black border-white" : "border-white/10 text-white/40 hover:text-white"
            )}
          >
            {isSelectionMode ? 'Exit Tactical Mode' : 'Tactical Mode'}
          </button>
        </div>

        {selectedForRoute.length > 0 && (
          <button 
            onClick={() => setSelectedForRoute([])}
            className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 hover:text-red-400 transition-colors"
          >
            Clear ({selectedForRoute.length})
          </button>
        )}

        <button className="text-white/20 hover:text-accent transition-colors">
          <Mic size={20} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'LIST' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto"
          >
            {/* Search & Filter */}
            <div className="p-8 space-y-6">
              {/* Search Interface */}
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" size={18} />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="SEARCH NODES BY ID OR VECTOR"
                  className="w-full bg-white/2 border border-white/10 py-5 pl-16 pr-8 rounded-sm text-white font-black uppercase tracking-[0.3em] text-[10px] focus:outline-none focus:border-accent transition-all placeholder:text-white/5"
                />
              </div>

              {/* Alphabet Scroller */}
              <div className="flex bg-white/2 border border-white/10 p-2 rounded-sm overflow-x-auto scrollbar-hide gap-1">
                {alphabet.map((letter) => (
                  <button
                    key={letter}
                    onClick={() => setFilterLetter(letter)}
                    className={cn(
                      "px-4 py-3 text-[10px] font-black transition-all shrink-0 min-w-[42px] rounded-sm uppercase tracking-widest",
                      filterLetter === letter 
                        ? "bg-accent text-black shadow-[0_0_20px_rgba(255,230,0,0.3)]" 
                        : "bg-transparent text-white/40 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {letter}
                  </button>
                ))}
              </div>

              {/* List of Farms */}
              <div className="space-y-6">
                {filteredFarms.map((farm) => (
                  <motion.div
                    layout
                    key={farm.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/2 border border-white/10 p-8 relative group overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-50 group-hover:opacity-100 transition-opacity" />
                    
                    {isSelectionMode && (
                      <button 
                        onClick={() => toggleFarmSelection(farm.id)}
                        className={cn(
                          "absolute top-6 right-6 w-8 h-8 border flex items-center justify-center transition-all",
                          selectedForRoute.includes(farm.id) ? "bg-accent border-accent text-black" : "border-white/10 text-white/20 hover:border-white/30"
                        )}
                      >
                        {selectedForRoute.includes(farm.id) ? '✓' : ''}
                      </button>
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-black tracking-tighter uppercase italic font-serif text-white/90">{farm.name}</h3>
                      {!isSelectionMode && <div className="text-[10px] uppercase tracking-widest text-accent font-bold opacity-0 group-hover:opacity-100 transition-opacity">Active Node</div>}
                    </div>
                    <p className="text-xs text-white/40 font-medium tracking-wide uppercase mb-8 max-w-[80%]">{farm.address}</p>
                    
                    <div className="flex gap-4">
                      {settings?.showNavigateButtons && (
                        <button 
                          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(farm.address)}`)}
                          className="flex-1 flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all"
                        >
                          <NavIcon size={14} className="text-accent group-hover:text-current" />
                          Navigate
                        </button>
                      )}
                      {settings?.showPhoneButtons && farm.phone && (
                        <button 
                          onClick={() => window.location.href = `tel:${farm.phone}`}
                          className="flex-1 flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all"
                        >
                          <Phone size={14} className="text-accent group-hover:text-current" />
                          Call
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
                {filteredFarms.length === 0 && (
                  <div className="text-center py-20 text-white/20 font-serif italic text-lg">
                    No agricultural nodes detected.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 relative"
          >
            <div className="absolute inset-0 z-0">
              <MapContainer 
                center={[33.7490, -84.3880]} // Default to Atlanta, GA area
                zoom={10} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <MarkerClusterGroup>
                  {filteredFarms.filter(f => f.lat && f.lng).map(farm => (
                    <Marker 
                      key={farm.id} 
                      position={[farm.lat!, farm.lng!]}
                      eventHandlers={{
                        click: () => {
                          if (isSelectionMode) toggleFarmSelection(farm.id);
                        }
                      }}
                    >
                      <Popup className="agrifleet-popup">
                        <div className="p-4 min-w-[220px] bg-[#0A0A0A] text-white rounded-none border border-white/10 shadow-2xl">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="text-sm font-black uppercase italic font-serif text-accent leading-tight">{farm.name}</h4>
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mt-1">Farm Node</p>
                            </div>
                            {isSelectionMode && (
                              <button 
                                onClick={() => toggleFarmSelection(farm.id)}
                                className={cn(
                                  "px-3 py-1 text-[8px] font-black uppercase transition-all",
                                  selectedForRoute.includes(farm.id) ? "bg-emerald-600 text-white" : "bg-accent text-black"
                                )}
                              >
                                {selectedForRoute.includes(farm.id) ? 'Remove' : 'Select'}
                              </button>
                            )}
                          </div>
                          
                          <p className="text-[10px] text-white/50 mb-4 font-medium leading-relaxed italic">{farm.address}</p>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(farm.address)}`)}
                              className="flex-1 py-3 bg-white/5 border border-white/10 text-white text-[8px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                            >
                              <NavIcon size={10} />
                              Navigate
                            </button>
                            {farm.phone && (
                              <button 
                                onClick={() => window.location.href = `tel:${farm.phone}`}
                                className="flex-1 py-3 bg-white/5 border border-white/10 text-white text-[8px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                              >
                                <Phone size={10} />
                                Call
                              </button>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MarkerClusterGroup>
                
                {optimizedRoute.length > 1 && (
                  <>
                    <Polyline 
                      positions={optimizedRoute.map(f => [f.lat!, f.lng!])} 
                      pathOptions={{ 
                        color: '#FFE600', 
                        weight: 4, 
                        opacity: 0.8,
                        lineJoin: 'round',
                        lineCap: 'round',
                        dashArray: '1, 10'
                      }}
                    />
                    {/* Secondary line for "glow" effect */}
                    <Polyline 
                      positions={optimizedRoute.map(f => [f.lat!, f.lng!])} 
                      pathOptions={{ 
                        color: '#FFE600', 
                        weight: 8, 
                        opacity: 0.2,
                        lineJoin: 'round',
                        lineCap: 'round'
                      }}
                    />
                    {optimizedRoute.map((node, idx) => (
                      <CircleMarker 
                        key={`waypoint-${node.id}`}
                        center={[node.lat!, node.lng!]}
                        radius={10}
                        pathOptions={{
                          fillColor: '#FFE600',
                          fillOpacity: 1,
                          color: '#000',
                          weight: 2,
                          stroke: true
                        }}
                      >
                        <Tooltip permanent direction="center" className="route-tooltip bg-transparent border-none shadow-none text-[8px] font-black text-black">
                          {idx + 1}
                        </Tooltip>
                      </CircleMarker>
                    ))}
                  </>
                )}
                <RecenterMap farms={filteredFarms} />
              </MapContainer>
            </div>
            
            {/* Map UI Overlay */}
            <div className="absolute right-6 top-6 z-[1000] flex flex-col gap-4">
              {optimizedRoute.length > 0 && (
                <div className="bg-black/90 backdrop-blur-xl border border-white/10 p-6 rounded-sm shadow-2xl min-w-[240px] max-h-[60vh] overflow-y-auto scrollbar-hide">
                  <div className="text-[9px] font-black uppercase tracking-[0.4em] text-accent mb-4 border-b border-white/5 pb-2 flex justify-between items-center">
                    Tactical Sequence
                    <div className="flex gap-2">
                       <span className="text-white/20">{optimizedRoute.length} Nodes</span>
                       <span className="text-accent underline decoration-accent/30 underline-offset-4 decoration-dotted">Optimized</span>
                    </div>
                  </div>
                  <div className="mb-6 p-4 bg-accent/5 border border-accent/20 rounded-sm">
                    <div className="text-[8px] font-black uppercase tracking-[0.3em] text-accent/60 mb-1">Estimated Operational Distance</div>
                    <div className="text-xl font-black text-white italic font-serif">
                      {totalDistance.toFixed(1)} <span className="text-[10px] not-italic opacity-40 uppercase">miles</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {optimizedRoute.map((node, idx) => (
                      <div key={node.id} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                          <div className="w-5 h-5 rounded-full border border-accent flex items-center justify-center text-[10px] font-black text-accent bg-accent/10">
                            {idx + 1}
                          </div>
                          {idx < optimizedRoute.length - 1 && (
                            <div className="w-px h-full bg-white/10 my-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex justify-between items-start">
                            <h5 className="text-[11px] font-black text-white/90 uppercase italic font-serif leading-none group-hover:text-accent transition-colors">{node.name}</h5>
                            {idx > 0 && (
                              <span className="text-[7px] font-black text-white/20 uppercase">+{routeSegments[idx-1].toFixed(1)}mi</span>
                            )}
                          </div>
                          <button 
                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(node.address)}`)}
                            className="text-[8px] font-black uppercase tracking-widest text-white/30 mt-2 hover:text-white transition-colors"
                          >
                            Nav →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-black/90 backdrop-blur-xl border border-white/10 p-6 rounded-sm shadow-2xl min-w-[200px]">
                <div className="text-[9px] font-black uppercase tracking-[0.4em] text-accent mb-4 border-b border-white/5 pb-2">Fleet Logistics</div>
                <div className="space-y-4">
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Detected Nodes</div>
                    <div className="text-2xl font-black text-white italic font-serif leading-none">
                      {filteredFarms.filter(f => f.lat && f.lng).length} 
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setViewMode('LIST')}
                className="bg-accent text-black p-4 rounded-sm shadow-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-[0.3em] hover:scale-105 transition-all"
              >
                <List size={14} />
                Return to Index
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 left-8 right-8 flex justify-between items-end pointer-events-none">
        <button className="pointer-events-auto bg-accent text-black flex items-center gap-2 px-8 py-5 rounded-sm font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all">
          <Menu size={16} />
          Refine Route
        </button>
        <button className="pointer-events-auto bg-white text-black p-6 rounded-sm shadow-2xl active:scale-95 transition-all">
          <Plus size={32} />
        </button>
      </div>
    </div>
  );
}

function RecenterMap({ farms }: { farms: Farm[] }) {
  const map = useMap();
  
  useEffect(() => {
    const validFarms = farms.filter(f => f.lat && f.lng);
    if (validFarms.length > 0) {
      const bounds = L.latLngBounds(validFarms.map(f => [f.lat!, f.lng!]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [farms, map]);

  return null;
}

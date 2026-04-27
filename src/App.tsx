import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Layout } from './components/Layout';
import { FarmsView } from './components/FarmsView';
import { CatchView } from './components/CatchView';
import { VehiclesView } from './components/VehiclesView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { LoadsView } from './components/LoadsView';
import { CalculatorView } from './components/CalculatorView';
import { FuelLogView } from './components/FuelLogView';
import { SplashScreen } from './components/SplashScreen';
import { Loader2 } from 'lucide-react';

import { RoosterSVG } from './components/RoosterLogo';

function AppContent() {
  const { user, loading } = useAppContext();
  const [activeTab, setActiveTab] = useState('vehicles');
  const [showSplash, setShowSplash] = useState(true);

  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
        <h2 className="text-white font-black uppercase tracking-widest text-sm italic">Loading Logistics...</h2>
      </div>
    );
  }

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'vehicles' && <VehiclesView />}
      {activeTab === 'fuel' && <FuelLogView />}
      {activeTab === 'farms' && <FarmsView />}
      {activeTab === 'loads' && <LoadsView />}
      {activeTab === 'calculator' && <CalculatorView />}
      {activeTab === 'history' && <HistoryView />}
      {activeTab === 'settings' && <SettingsView />}
    </Layout>
  );
}

function AuthScreen() {
  const { signIn } = useAppContext();
  
  return (
    <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-8 overflow-hidden relative border border-white/10">
      {/* Blueprint Pattern Background */}
      <div className="absolute inset-0 bg-[#050505] bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] z-0" />
      
      {/* Huge Background Blueprint Rooster */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none z-0">
        <RoosterSVG className="w-[120vw] h-[120vw] max-w-[1500px] max-h-[1500px] text-emerald-500" />
      </div>

      {/* Structural side elements from the reference theme */}
      <div className="absolute left-0 top-0 bottom-0 w-16 border-r border-white/5 flex flex-col items-center justify-center pointer-events-none z-10">
        <div className="origin-center -rotate-90 whitespace-nowrap text-[8px] uppercase tracking-[0.6em] text-white/20 font-black">
          Logistics Operational Division
        </div>
      </div>

      {/* Decorative blobs - more subtle spectral style */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full z-0" />
      <div className="absolute bottom-12 right-12 opacity-5 pointer-events-none z-10">
         <div className="text-[180px] font-black leading-none tracking-tighter uppercase">PNL.PRO</div>
      </div>

      <div className="z-10 w-full max-w-lg flex flex-col items-center">
        <div className="mb-20 text-center relative flex flex-col items-center">
          
          <div className="w-20 h-20 bg-emerald-600 rounded-sm flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden group">
             <RoosterSVG className="w-12 h-12 text-white z-10 drop-shadow-lg" />
             <div className="absolute inset-0 bg-white/20 origin-bottom-left scale-0 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          </div>

          <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.4em] text-accent font-bold whitespace-nowrap">
            Defining Logistics Aesthetics
          </div>
          
          <h1 className="text-[80px] md:text-[100px] font-black leading-[0.85] tracking-tighter uppercase mb-6 flex flex-col items-center">
            Poultry<br />
            <span className="text-transparent text-stroke opacity-80">Logistics</span>
          </h1>

          <p className="text-white/40 text-lg md:text-xl font-serif italic max-w-sm mx-auto leading-relaxed">
            Technical systems for modern agriculture, merging structural precision with atmospheric efficiency.
          </p>
        </div>

        <div className="w-full max-w-xs space-y-10">
          <button 
            onClick={signIn}
            className="w-full bg-white text-black py-6 rounded-sm font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-accent hover:text-black transition-all active:scale-95 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 z-10" />
            <span className="z-10">Authorize Session</span>
          </button>
          
          <div className="flex flex-col items-center gap-4">
            <div className="h-px bg-white/10 w-24" />
            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 italic">V.24-08 Artifact</span>
          </div>
        </div>

        <div className="mt-24 flex gap-12 text-[8px] uppercase tracking-[0.3em] text-white/30 font-bold">
          <div className="hover:text-accent cursor-pointer transition-colors">Documentation</div>
          <div className="hover:text-accent cursor-pointer transition-colors">Interface</div>
          <div className="hover:text-accent cursor-pointer transition-colors">Protocol</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

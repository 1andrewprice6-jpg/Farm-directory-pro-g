import React from 'react';
import { Menu, Truck, Fuel, History, MapPin, Calculator, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';

interface NavItemProps {
  key?: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function NavItem({ icon: Icon, label, isActive, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-full py-2 transition-all relative group",
        isActive ? "text-emerald-500" : "text-white/30 hover:text-white/60"
      )}
    >
      <Icon size={18} className={cn("mb-1.5 transition-transform", isActive ? "scale-110" : "scale-100")} />
      <span className="text-[7px] font-black uppercase tracking-[0.2em]">{label}</span>
      {isActive && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -top-1 w-8 h-0.5 bg-emerald-600 shadow-[0_0_10px_rgba(5,150,105,0.5)]"
        />
      )}
    </button>
  );
}

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export function Layout({ activeTab, setActiveTab, children }: LayoutProps) {
  const { settings } = useAppContext();

  const tabs = [
    { id: 'vehicles', label: 'Vehicles', icon: Truck },
    { id: 'fuel', label: 'Fuel', icon: Fuel },
    { id: 'farms', label: 'Farms', icon: MapPin },
    { id: 'loads', label: 'Loads', icon: Truck }, // Using Truck for loads too, or Clipboard
    { id: 'calculator', label: 'Calc', icon: Calculator },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#050505] text-white">
      {/* Header */}
      <header className="h-20 bg-[#080808] border-b border-white/5 flex items-center justify-between px-6 z-50 shrink-0 relative overflow-hidden">
        {/* Subtle grid pattern for header */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-10 h-10 bg-emerald-600 rounded-sm flex items-center justify-center font-black italic font-serif text-white text-xl shadow-lg shadow-emerald-900/20">P</div>
          <div className="flex flex-col">
            <h1 className="text-base font-black uppercase tracking-widest text-white leading-none">Poultry<span className="text-emerald-500 ml-1">Logistics</span></h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[8px] uppercase tracking-[0.4em] text-white/40 font-bold bg-white/5 px-2 py-0.5 rounded-sm">Module // {activeTab}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-sm hidden md:flex border border-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">
              System Active
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-accent border-l border-white/10 pl-6 border-h">
            V.24-08
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.15, ease: "circOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#080808]/95 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around px-2 z-50 shrink-0 relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-600/30 to-transparent" />
        {tabs.map((tab) => (
          <NavItem
            key={tab.id}
            icon={tab.icon}
            label={tab.label}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </nav>
    </div>
  );
}

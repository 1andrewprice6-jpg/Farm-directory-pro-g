import React from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  LogOut, Moon, Bell, Navigation, Share2, Trash2, User
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function SettingsView() {
  const { user, settings, updateSettings, logout } = useAppContext();

  if (!settings) return null;

  return (
    <div className="flex flex-col h-full bg-[#050505] p-8 space-y-12 overflow-y-auto pb-24 scrollbar-hide">
      {/* Profile Section */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-black text-accent uppercase tracking-[0.5em] pb-3 border-b border-white/5">Session Identity</h2>
        <div className="flex items-center gap-6 p-6 bg-white/2 border border-white/5 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-30 group-hover:opacity-100 transition-opacity" />
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-sm flex items-center justify-center overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={32} className="text-white/20" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-black text-white italic font-serif tracking-tighter uppercase">{user?.displayName || 'Anonymous Analyst'}</h3>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mt-1">{user?.email || 'N/A'}</p>
          </div>
        </div>

        <div className="p-6 bg-white/2 border border-white/5 space-y-4">
          <div className="space-y-4">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 mb-1">Authenticated Node</p>
              <p className="text-[11px] font-black font-mono text-white/60">{user?.email || 'tandrew.price6@gmail.com'}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 mb-1">Operational Base</p>
              <p className="text-[11px] font-black font-mono text-white/60">742 Hill River Rd</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interface Configuration */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-black text-accent uppercase tracking-[0.5em] pb-3 border-b border-white/5">System Interface</h2>
        <div className="space-y-3">
          <div className="p-6 bg-white/2 border border-white/5 space-y-4">
            <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] pl-1">Prime Core Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {['RED', 'BLUE', 'EMERALD'].map(theme => (
                <button 
                  key={theme}
                  onClick={() => updateSettings({ theme: theme.toLowerCase() })}
                  className={cn(
                    "py-3 rounded-sm font-black text-[9px] uppercase tracking-widest transition-all border",
                    (settings?.theme || 'red').toUpperCase() === theme 
                      ? "bg-white text-black border-white" 
                      : "bg-transparent border-white/10 text-white/40 hover:border-white/30"
                  )}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          <ToggleItem 
            label="Visual Dominance" 
            subLabel="Dark mode configuration" 
            isActive={settings?.darkMode} 
            onToggle={() => updateSettings({ darkMode: !settings?.darkMode })} 
            icon={Moon} 
          />
          <ToggleItem 
            label="Push Notifications" 
            subLabel="Real-time biological status" 
            isActive={settings?.notifications} 
            onToggle={() => updateSettings({ notifications: !settings?.notifications })} 
            icon={Bell} 
          />
          <ToggleItem 
            label="Operational Guidance" 
            subLabel="Persistence of navigation UI" 
            isActive={settings?.showNavigateButtons} 
            onToggle={() => updateSettings({ showNavigateButtons: !settings?.showNavigateButtons })} 
            icon={Navigation} 
          />
        </div>
      </section>

      {/* Data Sovereignty */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-black text-accent uppercase tracking-[0.5em] pb-3 border-b border-white/5">Data Sovereignty</h2>
        <div className="grid grid-cols-2 gap-4">
          <button className="flex flex-col items-center justify-center gap-4 py-8 bg-white/2 border border-white/5 hover:border-accent transition-all group">
            <Share2 size={24} className="text-white/20 group-hover:text-accent transition-colors" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">Export Archives</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-4 py-8 bg-white/2 border border-white/5 hover:border-emerald-500 transition-all group">
            <Trash2 size={24} className="text-white/20 group-hover:text-red-500 transition-colors" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">Purge Memory</span>
          </button>
        </div>
      </section>

      {/* Termination */}
      <div className="pt-10 pb-20">
        <button 
          onClick={logout}
          className="w-full py-6 border border-white/10 text-white/40 hover:bg-white hover:text-black font-black uppercase text-[10px] tracking-[0.5em] transition-all flex items-center justify-center gap-4 group"
        >
          <LogOut size={16} className="text-accent group-hover:text-black" />
          Terminate Session
        </button>
        <p className="text-center mt-6 text-[8px] font-black uppercase tracking-[0.6em] text-white/10">Poultry Logistics Pro V.24 Artifact</p>
      </div>
    </div>
  );
}

function ToggleItem({ label, subLabel, isActive, onToggle, icon: Icon }: { label: string, subLabel: string, isActive: boolean, onToggle: () => void, icon: any }) {
  return (
    <button 
      onClick={onToggle}
      className="w-full flex items-center justify-between p-6 bg-white/2 border border-white/5 hover:border-white/20 transition-all group text-left"
    >
      <div className="flex items-center gap-6">
        <div className={cn("p-3 rounded-sm border transition-all", isActive ? "border-accent text-accent bg-accent/5" : "border-white/10 text-white/20")}>
          <Icon size={20} />
        </div>
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">{label}</h4>
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">{subLabel}</p>
        </div>
      </div>
      <div className={cn(
        "w-12 h-6 rounded-full relative transition-all duration-300",
        isActive ? "bg-accent" : "bg-white/10"
      )}>
        <motion.div 
          animate={{ x: isActive ? 24 : 0 }}
          className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-lg"
        />
      </div>
    </button>
  );
}


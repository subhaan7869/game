import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, Zap, Sparkles, Navigation, Layers, Info, CheckCircle2 } from 'lucide-react';

interface AppLauncherScreenProps {
  activeBrand: 'uber' | 'bolt' | 'both';
  onSelect: (brand: 'uber' | 'bolt' | 'both') => void;
  uberOnline: boolean;
  setUberOnline: React.Dispatch<React.SetStateAction<boolean>>;
  boltOnline: boolean;
  setBoltOnline: React.Dispatch<React.SetStateAction<boolean>>;
  isOnline: boolean;
  startShift: () => void;
  endShift: () => void;
}

export const AppLauncherScreen: React.FC<AppLauncherScreenProps> = ({
  activeBrand,
  onSelect,
  uberOnline,
  setUberOnline,
  boltOnline,
  setBoltOnline,
  isOnline,
  startShift,
  endShift,
}) => {

  const handleToggleUber = () => {
    const nextVal = !uberOnline;
    setUberOnline(nextVal);
    
    // Sync with global shift status
    if (nextVal && !isOnline) {
      startShift();
    } else if (!nextVal && !boltOnline && isOnline) {
      endShift();
    }
  };

  const handleToggleBolt = () => {
    const nextVal = !boltOnline;
    setBoltOnline(nextVal);
    
    // Sync with global shift status
    if (nextVal && !isOnline) {
      startShift();
    } else if (!nextVal && !uberOnline && isOnline) {
      endShift();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-[#020304] text-white flex flex-col justify-between p-6 overflow-y-auto select-none font-sans">
      {/* Dynamic Ambient Blur Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute -bottom-20 -left-20 w-[350px] h-[350px] blur-[130px] rounded-full transition-colors duration-1000 ${
          boltOnline ? 'bg-[#00ff88]/15 animate-pulse' : 'bg-[#00ff88]/5'
        }`} />
        <div className={`absolute -top-10 -right-10 w-[300px] h-[300px] blur-[130px] rounded-full transition-colors duration-1000 ${
          uberOnline ? 'bg-sky-500/15' : 'bg-sky-500/5'
        }`} />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Top Header Block */}
      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center text-center mt-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4"
        >
          <Sparkles size={12} className="text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 font-mono">
            System Workspace Router
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-3xl font-black tracking-tight leading-none uppercase text-white"
        >
          Hyper Dispatch Hub
        </motion.h1>
        
        <p className="text-xs text-gray-400 font-bold max-w-sm mt-1.5 leading-snug">
          Configure independent carrier connections manually and launch into your preferred Workspace client.
        </p>
      </div>

      {/* Central Selection & Toggling Cards */}
      <div className="relative z-10 w-full max-w-lg mx-auto py-6 flex flex-col gap-6">
        
        {/* Step 1: Manual Network Switchboard */}
        <div className="rounded-[32px] border border-white/5 bg-[#090b0e]/70 p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-black tracking-[0.15em] uppercase text-gray-400 font-mono">
              Network Online Switchboard
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Uber App Offline/Online Trigger */}
            <div 
              onClick={handleToggleUber}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-[105px] select-none ${
                uberOnline 
                  ? 'bg-sky-550/10 border-sky-450/40 shadow-[0_4px_20px_rgba(56,189,248,0.1)]' 
                  : 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`w-8 h-8 rounded-xl font-sans font-black flex items-center justify-center text-sm ${
                  uberOnline ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20' : 'bg-white/5 text-gray-400'
                }`}>
                  U
                </span>
                {/* Beautiful tactile indicator switch */}
                <div className={`w-9 h-5 rounded-full p-0.5 transition-all relative ${uberOnline ? 'bg-sky-500' : 'bg-neutral-800'}`}>
                  <motion.div 
                    layout
                    className="w-4 h-4 bg-white rounded-full shadow-md"
                    animate={{ x: uberOnline ? 16 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </div>
              </div>
              <div className="text-left mt-1">
                <span className="text-xs font-black uppercase text-white block">Uber Network</span>
                <span className={`text-[10px] font-mono font-black uppercase tracking-wider block ${uberOnline ? 'text-sky-400' : 'text-gray-500'}`}>
                  {uberOnline ? '● Online & Matching' : '○ Offline standby'}
                </span>
              </div>
            </div>

            {/* Bolt App Offline/Online Trigger */}
            <div 
              onClick={handleToggleBolt}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-[105px] select-none ${
                boltOnline 
                  ? 'bg-emerald-550/10 border-[#00ea72]/45 shadow-[0_4px_20px_rgba(0,252,114,0.08)]' 
                  : 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`w-8 h-8 rounded-xl font-sans font-black flex items-center justify-center text-sm ${
                  boltOnline ? 'bg-[#00ea72] text-black shadow-sm shadow-emerald-500/20' : 'bg-white/5 text-gray-400'
                }`}>
                  B
                </span>
                {/* Beautiful tactile indicator switch */}
                <div className={`w-9 h-5 rounded-full p-0.5 transition-all relative ${boltOnline ? 'bg-[#00ea72]' : 'bg-neutral-800'}`}>
                  <motion.div 
                    layout
                    className="w-4 h-4 bg-white rounded-full shadow-md"
                    animate={{ x: boltOnline ? 16 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </div>
              </div>
              <div className="text-left mt-1">
                <span className="text-xs font-black uppercase text-white block">Bolt Network</span>
                <span className={`text-[10px] font-mono font-black uppercase tracking-wider block ${boltOnline ? 'text-[#00ff88]' : 'text-gray-500'}`}>
                  {boltOnline ? '● Online & Matching' : '○ Offline standby'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Target Client App Workspaces */}
        <div className="space-y-3">
          <div className="px-4 text-left">
            <span className="text-[9px] font-mono font-black tracking-[0.2em] uppercase text-gray-500">
              Select Client Interface Layout
            </span>
          </div>

          {/* Card A: Launch Uber Client app */}
          <motion.div
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect('uber')}
            className={`cursor-pointer overflow-hidden rounded-[24px] border p-4.5 flex items-center justify-between transition-all ${
              activeBrand === 'uber' 
                ? 'bg-[#0b0e12] border-sky-500/30 shadow-[0_4px_25px_rgba(0,0,0,0.5)]' 
                : 'bg-[#06080a] hover:bg-[#090c0f] border-white/5'
            }`}
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-sans font-black text-lg transition-colors ${
                uberOnline 
                  ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400' 
                  : 'bg-white/5 border border-white/10 text-gray-500'
              }`}>
                U
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-tight uppercase text-white">Uber Driver Client</span>
                  {activeBrand === 'uber' && <span className="bg-sky-500/10 text-sky-400 font-mono text-[7px] font-black px-1.5 py-0.5 rounded uppercase">Active View</span>}
                </div>
                <p className="text-[10px] font-bold text-gray-500 mt-0.5 leading-snug">
                  Monochrome clean Slate HUD template.
                </p>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              activeBrand === 'uber' ? 'bg-sky-500/15 text-sky-400' : 'bg-white/5 text-gray-500'
            }`}>
              <Navigation size={13} className="transform rotate-45" />
            </div>
          </motion.div>

          {/* Card B: Launch Bolt Client app */}
          <motion.div
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect('bolt')}
            className={`cursor-pointer overflow-hidden rounded-[24px] border p-4.5 flex items-center justify-between transition-all ${
              activeBrand === 'bolt' 
                ? 'bg-[#02180d] border-[#00ea72]/30 shadow-[0_4px_25px_rgba(0,252,114,0.06)]' 
                : 'bg-[#06080a] hover:bg-[#090c0f] border-white/5'
            }`}
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-sans font-black text-lg transition-colors ${
                boltOnline 
                  ? 'bg-[#00ea72]/10 border border-[#00ea72]/20 text-[#00ff88]' 
                  : 'bg-white/5 border border-white/10 text-gray-500'
              }`}>
                B
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-tight uppercase text-white font-display">Bolt Driver Client</span>
                  {activeBrand === 'bolt' && <span className="bg-[#00ea72]/15 text-[#00ff88] font-mono text-[7px] font-black px-1.5 py-0.5 rounded uppercase font-sans">Active View</span>}
                </div>
                <p className="text-[10px] font-bold text-gray-500 mt-0.5 leading-snug">
                  Neon emerald aesthetic, organic rounded curves & menus.
                </p>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              activeBrand === 'bolt' ? 'bg-[#00ea72]/15 text-[#00ff88]' : 'bg-white/5 text-gray-500'
            }`}>
              <Navigation size={13} className="transform rotate-45" />
            </div>
          </motion.div>

          {/* Card C: Combined Dual-App Layout */}
          <motion.div
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect('both')}
            className={`cursor-pointer overflow-hidden rounded-[24px] border p-4.5 flex items-center justify-between transition-all relative ${
              activeBrand === 'both' 
                ? 'bg-gradient-to-r from-[#0d071c] to-[#12002b]/50 border-purple-500/35 shadow-[0_4px_25px_rgba(168,85,247,0.08)]' 
                : 'bg-[#06080a] hover:bg-[#090c0f] border-white/5'
            }`}
          >
            {/* Visual splitter accent strip */}
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-500 via-purple-500 to-[#00ea72]" />

            <div className="flex items-center gap-3.5 text-left">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
                uberOnline && boltOnline
                  ? 'bg-purple-600/10 border border-purple-500/20 text-purple-400' 
                  : 'bg-white/5 border border-white/10 text-gray-500'
              }`}>
                <Layers size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-tight uppercase text-white">Dual-Dispatch HUD</span>
                  {activeBrand === 'both' && <span className="bg-purple-500/10 text-purple-400 font-mono text-[7px] font-black px-1.5 py-0.5 rounded uppercase">Active View</span>}
                </div>
                <p className="text-[10px] font-bold text-gray-550 mt-0.5 leading-snug">
                  Display both networks side-by-side with split UI.
                </p>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              activeBrand === 'both' ? 'bg-purple-500/15 text-purple-400 mr-2' : 'bg-white/5 text-gray-500'
            }`}>
              <Zap size={13} className={uberOnline && boltOnline ? 'animate-pulse text-purple-400' : ''} />
            </div>
          </motion.div>
        </div>

      </div>

      {/* Footer Block */}
      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center mt-6 text-center select-none shrink-0">
        <span className="font-mono text-[8px] font-black tracking-wider uppercase text-gray-600">
          HYPER DRIVER COGNITIVE INTEGRAL DISPATCH LAYERS • VERSION 5.0
        </span>
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-700 mt-0.5">
          <span>Simulation Layer online</span>
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

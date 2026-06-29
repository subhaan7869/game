import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Navigation, Layers, ShieldCheck } from 'lucide-react';

interface AppLauncherScreenProps {
  activeBrand: 'uber' | 'hyper' | 'both';
  onSelect: (brand: 'uber' | 'hyper' | 'both') => void;
  uberOnline: boolean;
  setUberOnline: React.Dispatch<React.SetStateAction<boolean>>;
  hyperOnline: boolean;
  setHyperOnline: React.Dispatch<React.SetStateAction<boolean>>;
  isOnline: boolean;
  startShift: () => void;
  endShift: () => void;
}

export const AppLauncherScreen: React.FC<AppLauncherScreenProps> = ({
  activeBrand,
  onSelect,
  uberOnline,
  setUberOnline,
  hyperOnline,
  setHyperOnline,
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
    } else if (!nextVal && isOnline && !hyperOnline) {
      endShift();
    }
  };

  const handleToggleHyper = () => {
    const nextVal = !hyperOnline;
    setHyperOnline(nextVal);
    
    // Sync with global shift status
    if (nextVal && !isOnline) {
      startShift();
    } else if (!nextVal && isOnline && !uberOnline) {
      endShift();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-[#020304] text-white flex flex-col justify-between p-6 overflow-y-auto select-none font-sans">
      {/* Dynamic Ambient Blur Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute -top-10 -right-10 w-[300px] h-[300px] blur-[130px] rounded-full transition-colors duration-1000 ${
          uberOnline ? 'bg-sky-500/15' : 'bg-sky-500/5'
        }`} />
        <div className={`absolute bottom-10 left-10 w-[300px] h-[300px] blur-[130px] rounded-full transition-colors duration-1000 ${
          hyperOnline ? 'bg-[#00ea72]/15' : 'bg-[#00ea72]/5'
        }`} />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-indigo-600/5 blur-[120px] rounded-full" />
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
          Bolt Dispatch Hub
        </motion.h1>
        
        <p className="text-xs text-gray-400 font-bold max-w-sm mt-1.5 leading-snug">
          Activate your driver connections and launch into your premium ridesharing workspaces.
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                {/* Switch indicator */}
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
                  {uberOnline ? '● Online' : '○ Offline'}
                </span>
              </div>
            </div>

            {/* Bolt Rideshare Offline/Online Trigger */}
            <div 
              onClick={handleToggleHyper}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-[105px] select-none ${
                hyperOnline 
                  ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_4px_20px_rgba(16,185,129,0.1)]' 
                  : 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`w-8 h-8 rounded-xl font-sans font-black flex items-center justify-center text-sm ${
                  hyperOnline ? 'bg-[#00ca72] text-white shadow-sm shadow-[#00ca72]/20' : 'bg-white/5 text-gray-400'
                }`}>
                  B
                </span>
                {/* Switch indicator */}
                <div className={`w-9 h-5 rounded-full p-0.5 transition-all relative ${hyperOnline ? 'bg-[#00ca72]' : 'bg-neutral-800'}`}>
                  <motion.div 
                    layout
                    className="w-4 h-4 bg-white rounded-full shadow-md"
                    animate={{ x: hyperOnline ? 16 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </div>
              </div>
              <div className="text-left mt-1">
                <span className="text-xs font-black uppercase text-white block">Bolt Rideshare</span>
                <span className={`text-[10px] font-mono font-black uppercase tracking-wider block ${hyperOnline ? 'text-[#00ff88]' : 'text-gray-500'}`}>
                  {hyperOnline ? '● Active' : '○ Standby'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Target Client App Workspace */}
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
            className={`cursor-pointer overflow-hidden rounded-[24px] border p-4.5 flex items-center justify-between transition-all bg-[#0b0e12] ${
              activeBrand === 'uber' ? 'border-sky-500 shadow-[0_4px_25px_rgba(56,189,248,0.15)]' : 'border-white/5 hover:border-white/10 shadow-lg'
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
                  {activeBrand === 'uber' && (
                    <span className="bg-sky-500/10 text-sky-400 font-mono text-[7px] font-black px-1.5 py-0.5 rounded uppercase">Active View</span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-gray-500 mt-0.5 leading-snug">
                  Monochrome clean Slate HUD template.
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-sky-500/15 text-sky-400">
              <Navigation size={13} className="transform rotate-45" />
            </div>
          </motion.div>

          {/* Card B: Launch Bolt Rideshare Client */}
          <motion.div
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect('hyper')}
            className={`cursor-pointer overflow-hidden rounded-[24px] border p-4.5 flex items-center justify-between transition-all bg-[#090e0c] ${
              activeBrand === 'hyper' ? 'border-[#00ca72] shadow-[0_4px_25px_rgba(0,234,114,0.15)]' : 'border-white/5 hover:border-white/10 shadow-lg'
            }`}
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-sans font-black text-lg transition-colors ${
                hyperOnline 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-[#00ff88]' 
                  : 'bg-white/5 border border-white/10 text-gray-500'
              }`}>
                B
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-tight uppercase text-white">Bolt Driver Client</span>
                  {activeBrand === 'hyper' && (
                    <span className="bg-emerald-500/10 text-[#00ff88] font-mono text-[7px] font-black px-1.5 py-0.5 rounded uppercase">Active View</span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-gray-500 mt-0.5 leading-snug">
                  Vivid Mint Green premium interface.
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/15 text-[#00ff88]">
              <ShieldCheck size={13} />
            </div>
          </motion.div>

          {/* Card C: Launch Dual-Dispatch Hub */}
          <motion.div
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect('both')}
            className={`cursor-pointer overflow-hidden rounded-[24px] border p-4.5 flex items-center justify-between transition-all bg-[#0f0e13] ${
              activeBrand === 'both' ? 'border-indigo-500 shadow-[0_4px_25px_rgba(99,102,241,0.15)]' : 'border-white/5 hover:border-white/10 shadow-lg'
            }`}
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-sans font-black text-lg transition-colors bg-gradient-to-tr from-sky-500 to-purple-600 text-white`}>
                <Layers size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-tight uppercase text-white">Dual-Dispatch HUD</span>
                  {activeBrand === 'both' && (
                    <span className="bg-indigo-500/10 text-indigo-400 font-mono text-[7px] font-black px-1.5 py-0.5 rounded uppercase">Active View</span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-gray-500 mt-0.5 leading-snug">
                  Unified multi-network split tracker.
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-500/15 text-indigo-400">
              <Layers size={13} />
            </div>
          </motion.div>
        </div>

      </div>

      {/* Footer Block */}
      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center mt-6 text-center select-none shrink-0">
        <span className="font-mono text-[8px] font-black tracking-wider uppercase text-gray-600">
          BOLT DRIVER COGNITIVE INTEGRAL DISPATCH LAYERS • VERSION 5.0
        </span>
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-700 mt-0.5">
          <span>Simulation Layer online</span>
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

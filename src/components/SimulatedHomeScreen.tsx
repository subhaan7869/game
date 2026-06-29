import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, 
  Battery, 
  Signal, 
  Navigation as NavIcon, 
  Settings, 
  MessageSquare, 
  Mail, 
  Bell, 
  Play, 
  X, 
  Check, 
  AlertCircle,
  Clock,
  Smartphone,
  Compass,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { Order, NavSimulation } from '../types';

interface SimulatedHomeScreenProps {
  pendingOrder: Order | null;
  isOnline: boolean;
  onOpenApp: () => void;
  activeOrders: Order[];
  navSimulation: NavSimulation;
  onAcceptOrder: () => void;
  onRejectOrder: () => void;
  orderExpiryTimer: number;
  addToast: (title: string, message: string, type?: 'info' | 'success' | 'alert' | 'message') => void;
  addDebugLog: (type: 'info' | 'warn' | 'error' | 'success', message: string) => void;
}

export default function SimulatedHomeScreen({
  pendingOrder,
  isOnline,
  onOpenApp,
  activeOrders,
  navSimulation,
  onAcceptOrder,
  onRejectOrder,
  orderExpiryTimer,
  addToast,
  addDebugLog
}: SimulatedHomeScreenProps) {
  const [timeStr, setTimeStr] = useState('12:00');
  const [dateStr, setDateStr] = useState('Sunday, 24 May');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      setDateStr(now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 15);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = () => {
    addDebugLog('info', 'Tapped notification banner, restoring driver application.');
    onOpenApp();
  };

  const handleAcceptFromWidget = () => {
    addDebugLog('success', 'Accepted incoming offer directly from simulated Home Screen card!');
    onAcceptOrder();
    onOpenApp();
    addToast("Job Accepted!", "Trip assigned. Restoring map navigation routing guide.", "success");
  };

  const handleDeclineFromWidget = () => {
    addDebugLog('warn', 'Declined offer directly from simulated Home Screen.');
    onRejectOrder();
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-black text-white flex flex-col justify-between overflow-hidden relative font-sans select-none">
      
      {/* Phone Wallpaper Accent Lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-blue-600/10 blur-[80px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-purple-600/10 blur-[80px]" />

      {/* Top Status Bar Simulator */}
      <div className="w-full px-5 pt-3 pb-2 flex items-center justify-between z-50 bg-black/30 backdrop-blur-sm shrink-0 border-b border-white/5">
        <div className="flex items-center gap-1">
          <span className="text-xs font-black tracking-tight font-mono text-slate-100">{timeStr}</span>
          <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded ml-1 tracking-wider uppercase">EE 5G</span>
          {isOnline && (
            <motion.div 
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex items-center gap-1.5 text-[8px] font-black text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 rounded"
            >
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
              ONLINE WIDGET ACTIVE
            </motion.div>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-slate-300">
          <NavIcon size={11} className="text-blue-400 animate-pulse fill-blue-400" />
          <Signal size={12} />
          <Wifi size={12} />
          <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-[9px] font-black">
            <span>84%</span>
            <Battery size={14} className="text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Main Home Grid Area */}
      <div className="flex-1 px-6 pt-10 pb-4 flex flex-col relative z-20">
        
        {/* Large Aesthetic Widget clock */}
        <div className="text-center mb-10 mt-2">
          <h2 className="text-5xl font-extrabold tracking-tighter text-white drop-shadow-md">{timeStr}</h2>
          <p className="text-xs tracking-[0.2em] font-black text-blue-400 mt-1 uppercase">{dateStr}</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-slate-900/60 border border-white/5 backdrop-blur-md px-4 py-1.5 rounded-full drop-shadow">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-[9px] font-mono tracking-wider font-extrabold text-slate-300 uppercase">
              {isOnline ? 'GPS LINK: STABLE' : 'DRIVER SERVICE: SLEEPING'}
            </span>
          </div>
        </div>

        {/* Dynamic Interactive Slide-Down Notification Banner */}
        <AnimatePresence>
          {pendingOrder && (
            <motion.div 
              key="slide-down-notif"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              onClick={handleNotificationClick}
              className="absolute left-4 right-4 top-4 z-[100] bg-slate-950/95 border border-white/10 backdrop-blur-xl p-4 rounded-[24px] shadow-2xl flex items-start gap-3.5 cursor-pointer hover:border-blue-500/40 active:scale-98 transition-all duration-300"
            >
              <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-700 text-white rounded-xl shadow-lg flex items-center justify-center shrink-0">
                <Smartphone size={22} className="text-white animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">⚡ Dispatch Notification</span>
                  <span className="text-[9px] font-medium text-slate-500 font-mono">Just now</span>
                </div>
                <h3 className="text-xs font-black text-slate-100 mt-0.5 truncate uppercase">
                  NEW {pendingOrder.type === 'ride' ? 'PASSENGER REQUEST' : 'DELIVERY JOB'} AVAILABLE
                </h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                  Stack details: <span className="text-emerald-400 font-bold">£{pendingOrder.estimatedPay.toFixed(2)}</span> • {pendingOrder.estimatedDistance.toFixed(1)} miles. Tap to overlay or accept.
                </p>
              </div>
              <ChevronRight size={14} className="text-slate-500 self-center shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Simulated iOS Style App Icons Grid */}
        <div className="grid grid-cols-4 gap-y-7 gap-x-3 mt-4 max-w-sm mx-auto">
          
          {/* Dual Dispatch - Our App! */}
          <div className="flex flex-col items-center">
            <button 
              onClick={onOpenApp}
              className="w-14 h-14 bg-gradient-to-tr from-slate-950 to-neutral-900 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.35)] hover:shadow-[0_0_25px_rgba(59,130,246,0.65)] hover:border-blue-400 rounded-2xl flex items-center justify-center text-blue-400 hover:text-white relative active:scale-90 transition-all cursor-pointer before:absolute before:inset-0 before:bg-blue-500/10 before:rounded-2xl"
            >
              <Compass size={28} className="text-blue-400 animate-spin-slow shadow-sm" />
              
              {/* Notifications Badge */}
              {pendingOrder && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-600 border-2 border-slate-950 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg animate-pulse"
                >
                  1
                </motion.div>
              )}
            </button>
            <span className="text-[10px] text-slate-200 mt-1.5 font-bold tracking-tight text-center truncate w-full">Dual Dispatch</span>
          </div>

          {[
            { label: "Safari", icon: <Compass size={24} className="text-sky-400" />, bg: "bg-slate-900/40 border border-white/5" },
            { label: "Phone", icon: <Smartphone size={24} className="text-emerald-400 animate-pulse" />, bg: "bg-emerald-950/20 border border-emerald-500/10" },
            { label: "Maps", icon: <MapPin size={24} className="text-red-400" />, bg: "bg-red-950/10 border border-red-500/10" },
            { label: "Messages", icon: <MessageSquare size={24} className="text-blue-400" />, bg: "bg-slate-900/40 border border-white/5" },
            { label: "Mail", icon: <Mail size={24} className="text-orange-400" />, bg: "bg-orange-950/15 border border-orange-500/10" },
            { label: "Settings", icon: <Settings size={21} className="text-slate-400" />, bg: "bg-slate-900/40 border border-white/5" },
            { label: "Files", icon: <Clock size={22} className="text-indigo-400" />, bg: "bg-slate-900/40 border border-white/5" },
          ].map((app, i) => (
            <div key={`mock-app-${i}`} className="flex flex-col items-center">
              <button 
                onClick={() => addToast(`Mock Launch: ${app.label}`, "Simulated iOS device application placeholder. Open 'Dual Dispatch' to return.", "info")}
                className={`w-14 h-14 ${app.bg} backdrop-blur shadow rounded-2xl flex items-center justify-center text-slate-300 active:scale-90 transition-all cursor-pointer hover:border-white/20`}
              >
                {app.icon}
              </button>
              <span className="text-[10px] text-slate-400 mt-1.5 font-medium tracking-tight truncate w-full text-center">{app.label}</span>
            </div>
          ))}

        </div>

      </div>

      {/* Floating Uber-style Drag Dot Trigger Widget Button */}
      {isOnline && (
        <motion.div 
          drag
          dragElastic={0.15}
          dragMomentum={false}
          className="absolute z-[200] cursor-grab active:cursor-grabbing pointer-events-auto"
          style={{ bottom: '110px', right: '24px' }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.95 }}
        >
          <div 
            onClick={onOpenApp}
            className="w-16 h-16 bg-slate-950 border-2 border-blue-500 rounded-full flex flex-col items-center justify-center shadow-[0_4px_25px_rgba(37,99,235,0.8)] relative"
          >
            {/* Pulsing Dot Halo */}
            <span className="absolute inset-0 bg-blue-600/20 rounded-full animate-ping" />
            
            <Compass size={22} className="text-blue-400 animate-spin-slow relative z-10" />
            
            {/* Small Green LED status indicator */}
            <span className="absolute top-1 right-1 w-3 h-3 bg-emerald-400 rounded-full border border-slate-950 flex items-center justify-center text-[7px] text-slate-950 font-black">
              <span className="w-1.5 h-1.5 bg-slate-950 rounded-full animate-pulse" />
            </span>

            {/* Micro details speed limit tag */}
            <span className="text-[7.5px] font-black tracking-widest font-mono text-slate-300 relative z-10 uppercase mt-0.5">
              {navSimulation.active ? `${navSimulation.speed.toFixed(0)}mph` : 'ONLINE'}
            </span>

            {/* Glowing red alert badge if trip pending */}
            {pendingOrder && (
              <span className="absolute -top-1 -left-1 w-4 h-4 bg-orange-500 rounded-full animate-bounce text-white font-sans font-black flex items-center justify-center text-[8px] z-50">
                ⚡
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Pop Up Job Offer Overlay Dialog on Home Screen */}
      <AnimatePresence>
        {pendingOrder && (
          <motion.div 
            key="home-screen-trip-overlay"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute left-0 right-0 bottom-0 z-[250] bg-slate-950 border-t-2 border-amber-500 rounded-t-[36px] overflow-hidden p-6 shadow-2xl flex flex-col gap-4 text-left border-b-8 border-slate-950"
          >
            {/* Header offer bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest">🚨 HOME SCREEN HIGH PRIORITY ALLOCATION</p>
              </div>
              <div className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-xl text-[9px] font-mono text-amber-500 font-black uppercase">
                {orderExpiryTimer}s remaining
              </div>
            </div>

            {/* Main price/earnings showcase */}
            <div className="flex justify-between items-baseline bg-white/5 border border-white/5 rounded-3xl p-5">
              <div>
                <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase font-mono block">ESTIMATED COMPOSITE PAYOUT</span>
                <span className="text-4xl font-extrabold tracking-tighter text-white">£{pendingOrder.estimatedPay.toFixed(2)}</span>
                {pendingOrder.surge ? (
                  <span className="bg-orange-600 font-sans text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ml-2 animate-pulse inline-block">
                    {pendingOrder.surge}x SURGE INCLUDED
                  </span>
                ) : null}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase font-mono block">RUN TRIP RANGE</span>
                <span className="text-lg font-mono font-black text-blue-400">{pendingOrder.estimatedDistance.toFixed(1)} mi</span>
              </div>
            </div>

            {/* Ride details list */}
            <div className="space-y-3 p-4 bg-slate-900 border border-white/5 rounded-2xl text-xs font-bold text-slate-300">
              <div className="flex justify-between">
                <span>Category Stack:</span>
                <span className="text-slate-100 uppercase">{pendingOrder.type === 'ride' ? '👪 Passenger Ride' : '🍔 Food Delivery'}</span>
              </div>
              <div className="flex justify-between">
                <span>Merchant / Pickup:</span>
                <span className="text-blue-400 font-extrabold truncate max-w-[180px]">{pendingOrder.restaurantName || "High Priority Booking"}</span>
              </div>
              <div className="flex justify-between">
                <span>Transit Duration estimation:</span>
                <span className="text-slate-100">{pendingOrder.estimatedTime} minutes</span>
              </div>
            </div>

            {/* Progress countdown timeline bar */}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden shrink-0 mt-1">
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: `${(orderExpiryTimer / 18) * 100}%` }}
                transition={{ duration: 1, ease: 'linear' }}
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
              />
            </div>

            {/* Tactile Accept / Decline trigger actions */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button 
                onClick={handleDeclineFromWidget}
                className="py-4 bg-slate-900 hover:bg-slate-850 border border-white/5 hover:border-white/10 text-slate-300 font-black text-xs tracking-widest rounded-2xl uppercase transition-all duration-200 active:scale-95"
              >
                PASS OFFER
              </button>
              <button 
                onClick={handleAcceptFromWidget}
                className="py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs tracking-widest rounded-2xl uppercase shadow-xl shadow-blue-500/10 transition-all duration-200 active:scale-95"
              >
                ACCEPT OFFER
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Home Navigation Indicator Swiper Swipe Bar */}
      <div className="w-full py-2.5 flex justify-center z-50 shrink-0 select-none bg-black/10">
        <button 
          onClick={onOpenApp}
          className="w-36 h-1.5 bg-slate-700/60 hover:bg-slate-500 rounded-full active:scale-90 transition-all"
          title="Return to application"
        />
      </div>

    </div>
  );
}

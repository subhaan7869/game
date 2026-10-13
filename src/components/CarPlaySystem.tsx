import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  X, 
  Check, 
  Star, 
  Utensils, 
  Car as CarIcon, 
  Flame, 
  Bell, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Compass, 
  Radio, 
  Music, 
  Phone, 
  Home, 
  Layers, 
  Info, 
  Maximize2, 
  Minimize2, 
  Columns, 
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, UserProfile, Location } from '../types';
import { MediaControls } from './MediaControls';
import { calculatePayRate } from '../utils/payRate';

export interface CarPlaySystemProps {
  activeOrders: Order[];
  user: UserProfile;
  onClose: () => void;
  isCarPlaySynced: boolean;
  setIsCarPlaySynced: (val: boolean) => void;
  mapNode?: React.ReactNode;
  isNavigating?: boolean;
  setIsNavigating?: (val: boolean) => void;
  distanceToTarget?: (order: Order) => string;
  handleNextStep?: (id: string) => void;
  busyAreaTarget?: { id: string; name: string; location: Location } | null;
  carPlayRoomCode?: string;
  setCarPlayRoomCode?: (code: string) => void;
  isCarPlayRemoteMode?: boolean;
  setIsCarPlayRemoteMode?: (val: boolean) => void;
  lastSyncedDestination?: {
    label: string;
    subtitle?: string;
    miles?: string;
    minutes?: number;
    latitude?: number;
    longitude?: number;
    stage?: string;
  } | null;
  onTriggerNavigateSync?: () => void;
  pendingOrder?: Order | null;
  orderExpiryTimer?: number;
  onAcceptOrder?: () => void;
  onDeclineOrder?: () => void;
  onTriggerTestJob?: () => void;
  todayEarningsTotal?: number;
  activeBrand?: 'uber' | 'hyper' | 'both';
  isMatchingLoading?: boolean;
  isMatchFailed?: boolean;
  onToggleOnline?: () => void;
  location?: Location | null;
}

export const CarPlaySystem: React.FC<CarPlaySystemProps> = ({
  activeOrders,
  user,
  onClose,
  isCarPlaySynced,
  setIsCarPlaySynced,
  mapNode,
  isNavigating = false,
  setIsNavigating,
  distanceToTarget,
  handleNextStep,
  busyAreaTarget,
  carPlayRoomCode = 'HYPER1',
  setCarPlayRoomCode,
  isCarPlayRemoteMode = false,
  setIsCarPlayRemoteMode,
  lastSyncedDestination,
  onTriggerNavigateSync,
  pendingOrder,
  orderExpiryTimer = 18,
  onAcceptOrder,
  onDeclineOrder,
  onTriggerTestJob,
  todayEarningsTotal = 0,
  activeBrand = 'uber',
  isMatchingLoading = false,
  isMatchFailed = false,
  onToggleOnline,
  location
}) => {
  // CarPlay view layout: 'infotainment' (realistic automotive unit), 'dual_studio' (phone + carplay side-by-side), or 'fullscreen' (edge-to-edge)
  const [frameMode, setFrameMode] = useState<'infotainment' | 'dual_studio' | 'fullscreen'>('infotainment');
  const [carPlayView, setCarPlayView] = useState<'map' | 'split' | 'apps'>('map');
  const [activeDockApp, setActiveDockApp] = useState<'hyper' | 'maps' | 'music' | 'phone'>('hyper');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [showServiceLimitsModal, setShowServiceLimitsModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(carPlayRoomCode);
  const [currentTimeStr, setCurrentTimeStr] = useState(() => 
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  );

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeOrder = activeOrders[0];

  const milesStr = activeOrder && distanceToTarget
    ? distanceToTarget(activeOrder)
    : lastSyncedDestination?.miles || (activeOrder ? activeOrder.estimatedDistance.toFixed(1) : '0.8');
  const milesNum = parseFloat(milesStr) || 0.8;
  const minsVal = activeOrder
    ? Math.max(1, Math.ceil(milesNum * 3))
    : lastSyncedDestination?.minutes || 3;

  const isPickupStage = !activeOrder || activeOrder.status === 'accepted' || activeOrder.status === 'en_route_to_pickup' || activeOrder.status === 'arriving' || activeOrder.status === 'arrived' || activeOrder.status === 'scanning_receipt';
  
  const targetTitle = activeOrder
    ? (isPickupStage ? `Pickup: ${activeOrder.restaurantName || 'Pickup Point'}` : `Dropoff: ${activeOrder.customerName || 'Customer'}`)
    : busyAreaTarget
    ? `Surge Area: ${busyAreaTarget.name}`
    : lastSyncedDestination?.label || (user.isOnline ? 'Online • Finding Trips' : 'CarPlay Connected • Offline');

  const targetSubtitle = activeOrder
    ? (isPickupStage ? (activeOrder.type === 'delivery' ? '12 Kingsway, Holborn, London' : 'Passenger Pickup Point') : '48 High Holborn, London WC1V')
    : lastSyncedDestination?.subtitle || (user.isOnline ? 'Leaflet & OpenStreetMap Live Engine Active' : 'Go online on mobile or CarPlay to scan trips');

  // Pay rate calculation for pending job
  const pendingPayRate = pendingOrder
    ? calculatePayRate(pendingOrder.estimatedPay, pendingOrder.estimatedDistance)
    : null;
  const isPendingDouble = !!(pendingOrder?.isStacked || (pendingOrder?.batchCount && pendingOrder.batchCount > 1));
  const isPendingDelivery = pendingOrder?.type === 'delivery';
  const pendingPickupDistance = pendingOrder ? (pendingOrder.estimatedDistance * 0.35).toFixed(1) : '0.6';
  const pendingPickupMinutes = pendingOrder ? Math.max(1, Math.ceil(parseFloat(pendingPickupDistance) * 3)) : 2;

  // Turn maneuver details
  const maneuverText = isNavigating
    ? (isPickupStage ? `Turn right toward ${activeOrder?.restaurantName || 'Pickup'}` : `Continue straight toward ${activeOrder?.customerName || 'Destination'}`)
    : 'In 300 ft, merge onto Main Ave';

  const maneuverDist = isNavigating
    ? (milesNum < 0.2 ? `${Math.round(milesNum * 5280)} ft` : `${(milesNum * 0.3).toFixed(1)} mi`)
    : '500 ft';

  return (
    <div className="fixed inset-0 z-[5000] bg-[#07090e] text-white flex flex-col font-sans select-none overflow-hidden items-center justify-center p-0 md:p-3">
      
      {/* Top Universal Control Strip */}
      <div className="w-full max-w-[1360px] h-10 px-4 flex items-center justify-between text-xs text-gray-400 shrink-0 z-40 bg-black/60 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-b md:border-b-0 border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono font-black text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="uppercase tracking-wider text-[11px]">Apple CarPlay Live Sync</span>
          </div>
          <span className="text-gray-600">|</span>
          <span className="text-[10px] font-bold text-gray-300">
            Room: <span className="text-emerald-400 font-mono">{carPlayRoomCode}</span>
          </span>
          <span className="text-[10px] text-gray-400 hidden sm:inline">
            • Leaflet & OpenStreetMap (Attribution Visible)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Test Job Trigger Button */}
          {onTriggerTestJob && (
            <button
              onClick={onTriggerTestJob}
              className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Dispatch a realistic incoming trip request to CarPlay (matches RideShare Guy video)"
            >
              <Bell size={12} className="text-purple-300 animate-bounce" />
              <span>Test Trip Offer 🔔</span>
            </button>
          )}

          {/* Service Limits Info Button */}
          <button
            onClick={() => setShowServiceLimitsModal(true)}
            className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
            title="OpenStreetMap & Free Routing Limits"
          >
            <Info size={12} className="text-blue-400" />
            <span className="hidden sm:inline">Free Service Limits</span>
          </button>

          {/* Layout Mode Switcher */}
          <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => setFrameMode('infotainment')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                frameMode === 'infotainment' ? 'bg-emerald-600 text-black font-black shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
              title="CarPlay Automotive Screen"
            >
              🚗 In-Car Screen
            </button>
            <button
              onClick={() => setFrameMode('dual_studio')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                frameMode === 'dual_studio' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
              title="Phone + CarPlay Side-by-Side Dual Studio"
            >
              ⚡ Dual Studio (Phone + CarPlay)
            </button>
            <button
              onClick={() => setFrameMode('fullscreen')}
              className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                frameMode === 'fullscreen' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Edge-to-Edge Tablet Screen"
            >
              <Maximize2 size={12} />
            </button>
          </div>

          {/* Exit Button */}
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Main CarPlay Screen Container (Fits realistically like an in-car screen) */}
      <div className={`w-full flex-1 min-h-0 flex items-center justify-center relative overflow-hidden ${
        frameMode === 'fullscreen' ? 'p-0 max-w-full max-h-full' : 'p-1 md:p-3 max-w-[1480px] max-h-[860px]'
      }`}>
        
        {/* If in Dual Studio Mode, show Phone on Left */}
        {frameMode === 'dual_studio' && (
          <div className="hidden lg:flex w-[340px] xl:w-[370px] h-full flex-col p-2 mr-3 shrink-0 select-none">
            {/* Phone Bezel */}
            <div className="w-full h-full bg-[#0a0a0f] border-[8px] border-[#222530] rounded-[42px] shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden relative ring-1 ring-white/10">
              
              {/* Dynamic Island */}
              <div className="w-full flex justify-center pt-2 pb-1 bg-black z-30">
                <div className="w-24 h-5 bg-black rounded-full border border-white/10 flex items-center justify-between px-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[8px] font-black text-gray-300 uppercase">Hyper</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                </div>
              </div>

              {/* Phone Header Strip */}
              <div className="px-4 py-2 bg-gradient-to-b from-black to-slate-950 flex items-center justify-between border-b border-white/10 shrink-0">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Driver Phone</span>
                  <h4 className="text-xs font-black text-white">Hyper Driver App</h4>
                </div>
                <button
                  onClick={onToggleOnline}
                  className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    user.isOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/10 text-gray-400'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
                  <span>{user.isOnline ? "Online" : "Offline"}</span>
                </button>
              </div>

              {/* Phone Content Scrollable Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-[#0d0f17]">
                
                {/* Earnings Card */}
                <div className="bg-black/60 rounded-2xl p-3 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Today's Earnings</span>
                    <p className="text-xl font-black text-emerald-400">£{todayEarningsTotal.toFixed(2)}</p>
                  </div>
                  <div className="px-2 py-1 bg-white/5 border border-white/10 rounded-xl text-[9px] font-bold text-gray-300">
                    {user.tier} Tier
                  </div>
                </div>

                {/* Test Job Trigger on Phone */}
                {onTriggerTestJob && (
                  <button
                    onClick={onTriggerTestJob}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Bell size={13} className="animate-bounce" />
                    <span>Dispatch Test Job to Phone 🔔</span>
                  </button>
                )}

                {/* Phone Job Offer Alert Card (if pending) */}
                {pendingOrder && (
                  <div className="bg-emerald-950/80 border-2 border-emerald-500/60 rounded-2xl p-3 shadow-xl space-y-2 animate-pulse">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-lg bg-black text-white text-[9px] font-black uppercase">
                        {pendingOrder.type === 'delivery' ? '🍔 Hyper Eats' : '🚗 Hyper Ride'}
                      </span>
                      <span className="text-sm font-black text-emerald-400">£{pendingOrder.estimatedPay.toFixed(2)}</span>
                    </div>

                    <div className="text-[10px] text-gray-300 font-bold space-y-0.5">
                      <p className="truncate text-white">📍 Pickup: {pendingOrder.restaurantName || "Pickup Point"}</p>
                      <p className="truncate text-gray-400">🏁 Dropoff: {pendingOrder.customerName || "Customer Destination"}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-emerald-500/30">
                      <button
                        onClick={onDeclineOrder}
                        className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[9px] font-black uppercase text-gray-300 cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        onClick={onAcceptOrder}
                        className="flex-[1.5] py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[9px] uppercase tracking-wider rounded-lg shadow-md cursor-pointer"
                      >
                        Accept ({orderExpiryTimer}s)
                      </button>
                    </div>
                  </div>
                )}

                {/* Active Order Card on Phone with the Prominent NAVIGATE Button */}
                {activeOrder ? (
                  <div className="bg-black/60 rounded-2xl p-3.5 border border-white/15 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">
                        {isPickupStage ? 'Stage 1: Pickup' : 'Stage 2: Dropoff'}
                      </span>
                      <span className="text-xs font-black text-emerald-400">£{activeOrder.estimatedPay.toFixed(2)}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white truncate">
                        {isPickupStage ? activeOrder.restaurantName : activeOrder.customerName}
                      </h4>
                      <p className="text-[10px] text-gray-400 truncate">
                        {isPickupStage ? "12 Kingsway, Holborn, London" : "48 High Holborn, London WC1V"}
                      </p>
                    </div>

                    {/* THE NAVIGATE BUTTON CONNECTED TO JOB DESTINATION */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => {
                          if (!isNavigating) {
                            if (onTriggerNavigateSync) onTriggerNavigateSync();
                            if (setIsNavigating) setIsNavigating(true);
                          } else {
                            if (setIsNavigating) setIsNavigating(false);
                          }
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                          isNavigating
                            ? 'bg-amber-500 text-black'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-black font-black shadow-emerald-600/30'
                        }`}
                        title="Click to Navigate & Route to Job Destination on CarPlay"
                      >
                        <Navigation size={13} className={isNavigating ? "animate-pulse" : ""} />
                        <span>{isNavigating ? 'Nav Active (On CarPlay)' : 'Navigate on CarPlay'}</span>
                      </button>

                      {handleNextStep && (
                        <button
                          onClick={() => handleNextStep(activeOrder.id)}
                          className="py-2 px-3 rounded-xl font-black text-[9px] uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                        >
                          {isPickupStage ? 'Picked Up' : 'Delivered'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white/[0.03] rounded-2xl border border-white/5 text-center text-gray-400 text-[10px]">
                    <p className="font-bold text-white mb-1">No Active Trip</p>
                    <p>Click "Dispatch Test Job to Phone" above to see the offer appear simultaneously on this phone and on the CarPlay unit.</p>
                  </div>
                )}

              </div>

              {/* Phone Bottom Home Bar */}
              <div className="w-full flex justify-center py-2 bg-black shrink-0">
                <div className="w-28 h-1 bg-white/40 rounded-full" />
              </div>
            </div>
          </div>
        )}

        {/* Realistic Automotive Dashboard Bezel */}
        <div className={`flex-1 h-full min-h-0 relative flex flex-col overflow-hidden transition-all duration-300 ${
          frameMode === 'fullscreen'
            ? 'rounded-none bg-[#0a0c12] border-0'
            : 'rounded-[26px] md:rounded-[36px] bg-[#0d0f16] border-[8px] md:border-[14px] border-[#181a24] shadow-[0_25px_80px_rgba(0,0,0,0.95)] ring-1 ring-white/10'
        }`}>

          {/* Subtle Car Infotainment Glass Reflection Effect */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none z-50" />

          {/* The Apple CarPlay Interface Grid: Dock on the Left, Screen Area on the Right */}
          <div className="w-full h-full flex min-h-0 relative overflow-hidden bg-[#0a0b10]">
            
            {/* 1. Authentic Apple CarPlay Dock (Left Side) */}
            <div className="w-18 md:w-20 bg-black/90 backdrop-blur-2xl border-r border-white/10 flex flex-col items-center py-4 justify-between shrink-0 z-30 select-none">
              
              {/* Top: Apple Status Cluster (Clock, Signal, 5G, Battery) */}
              <div className="flex flex-col items-center gap-1.5 w-full px-1">
                <span className="font-sans font-black text-sm md:text-base tracking-tight text-white">
                  {currentTimeStr}
                </span>

                <div className="flex items-center gap-1 mt-0.5">
                  {/* 4-Bar Cellular Signal */}
                  <div className="flex items-end gap-[1.5px] h-3">
                    <div className="w-[2.5px] h-1 bg-emerald-400 rounded-full" />
                    <div className="w-[2.5px] h-1.5 bg-emerald-400 rounded-full" />
                    <div className="w-[2.5px] h-2.5 bg-emerald-400 rounded-full" />
                    <div className="w-[2.5px] h-3 bg-emerald-400 rounded-full" />
                  </div>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">5G</span>
                </div>

                {/* Battery icon */}
                <div className="w-5 h-2.5 border border-white/40 rounded-sm p-[1px] flex items-center mt-0.5">
                  <div className="h-full w-4/5 bg-emerald-400 rounded-[1px]" />
                </div>
              </div>

              {/* Middle: Apple CarPlay App Switcher Icons */}
              <div className="flex flex-col items-center gap-3 w-full my-auto">
                {/* Hyper Driver App Icon */}
                <button
                  onClick={() => { setActiveDockApp('hyper'); setCarPlayView('map'); }}
                  className={`w-12 h-12 md:w-13 md:h-13 rounded-2xl flex items-center justify-center relative transition-all duration-200 cursor-pointer ${
                    activeDockApp === 'hyper' && carPlayView === 'map'
                      ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-black shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-400 scale-105'
                      : 'bg-[#151824] text-white hover:bg-[#1e2233] border border-white/10'
                  }`}
                  title="Hyper Driver App"
                >
                  <img src="/icon.svg" alt="Hyper Driver" className="w-8 h-8 rounded-xl object-contain drop-shadow" />
                  
                  {/* Online green indicator */}
                  <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${
                    user.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                  }`} />

                  {/* Incoming Job Notification Alert Badge */}
                  {pendingOrder && (
                    <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-red-500 text-white font-black text-[9px] flex items-center justify-center animate-bounce shadow-md">
                      !
                    </span>
                  )}
                </button>

                {/* Navigation Maps App Icon */}
                <button
                  onClick={() => { setActiveDockApp('maps'); setCarPlayView('map'); }}
                  className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    activeDockApp === 'maps'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 ring-2 ring-blue-400'
                      : 'bg-[#151824] text-gray-300 hover:bg-[#1e2233] border border-white/10'
                  }`}
                  title="Leaflet & OpenStreetMap Navigation"
                >
                  <Navigation size={22} className="rotate-45 text-white" />
                </button>

                {/* Now Playing / Music App Icon */}
                <button
                  onClick={() => { setActiveDockApp('music'); setCarPlayView('split'); }}
                  className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center relative transition-all cursor-pointer ${
                    activeDockApp === 'music'
                      ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg ring-2 ring-pink-400'
                      : 'bg-[#151824] text-gray-300 hover:bg-[#1e2233] border border-white/10'
                  }`}
                  title="Now Playing Media"
                >
                  <Music size={20} className="text-white" />
                  {/* Equalizer mini wave animation */}
                  <div className="absolute bottom-1.5 flex items-end gap-[1.5px] h-2">
                    <span className="w-[1.5px] h-2 bg-white rounded-full animate-pulse" />
                    <span className="w-[1.5px] h-1.5 bg-white rounded-full animate-pulse delay-75" />
                    <span className="w-[1.5px] h-2.5 bg-white rounded-full animate-pulse delay-150" />
                  </div>
                </button>

                {/* Phone / Messages Icon */}
                <button
                  onClick={() => { setActiveDockApp('phone'); }}
                  className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-[#151824] text-emerald-400 hover:bg-[#1e2233] border border-white/10 flex items-center justify-center transition-all cursor-pointer"
                  title="Hands-Free Phone & Dispatch Voice"
                >
                  <Phone size={19} />
                </button>
              </div>

              {/* Bottom: The Iconic Apple CarPlay Home Button (Squircle / App Launcher) */}
              <button
                onClick={() => setCarPlayView(prev => prev === 'map' ? 'split' : 'map')}
                className="w-12 h-12 rounded-2xl border-2 border-white/60 bg-white/10 hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center cursor-pointer shadow-lg mt-auto"
                title="Apple CarPlay Home / Toggle Split View"
              >
                <div className="w-5 h-5 rounded-[6px] border-[2.5px] border-white" />
              </button>
            </div>

            {/* 2. Main CarPlay Screen Content Area */}
            <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden bg-[#0a0c14]">
              
              {/* Inner Display Area: Map or Split View */}
              <div className="flex-1 flex min-h-0 relative">
                
                {/* Primary Map Viewport (Takes full CarPlay screen or left split) */}
                <div className="flex-1 h-full w-full relative min-h-0 overflow-hidden bg-[#08090e]">
                  
                  {/* The Leaflet & OpenStreetMap Live Node */}
                  <div className="absolute inset-0 w-full h-full">
                    {mapNode}
                  </div>

                  {/* CarPlay Top HUD Bar: Driver Online Pill, Today's Earnings, and Mute */}
                  <div className="absolute top-3.5 right-3.5 z-[3500] flex items-center gap-2 pointer-events-auto">
                    {/* Driver Online Toggle Pill */}
                    <button
                      onClick={onToggleOnline}
                      className={`h-9 px-3.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-xl backdrop-blur-xl border cursor-pointer ${
                        user.isOnline 
                          ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/50 shadow-emerald-950/40' 
                          : 'bg-black/80 text-gray-400 border-white/15 hover:bg-black/90'
                      }`}
                      title="Toggle Driver Status"
                    >
                      <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
                      <span>{user.isOnline ? "Online • Finding Trips" : "Offline"}</span>
                    </button>

                    {/* Today Earnings Pill */}
                    <div className="h-9 px-3.5 bg-black/80 backdrop-blur-xl border border-white/15 rounded-full text-xs font-black text-emerald-400 font-mono flex items-center gap-1 shadow-xl">
                      <span>Today:</span>
                      <span className="text-white">£{todayEarningsTotal.toFixed(2)}</span>
                    </div>

                    {/* Audio Mute Toggle */}
                    <button
                      onClick={() => setIsAudioMuted(!isAudioMuted)}
                      className="w-9 h-9 bg-black/80 backdrop-blur-xl border border-white/15 rounded-full text-gray-300 hover:text-white flex items-center justify-center transition-all shadow-xl cursor-pointer"
                      title={isAudioMuted ? "Unmute Navigation Audio" : "Mute Navigation Audio"}
                    >
                      {isAudioMuted ? <VolumeX size={15} className="text-red-400" /> : <Volume2 size={15} className="text-emerald-400" />}
                    </button>
                  </div>

                  {/* Authentic CarPlay Turn-by-Turn Maneuver Overlay Card (Top Left) */}
                  <div className="absolute top-3.5 left-3.5 w-[calc(100%-28px)] sm:w-[360px] max-w-full z-[3500] pointer-events-auto">
                    <div className={`rounded-2xl p-3.5 shadow-2xl border backdrop-blur-2xl transition-all ${
                      isNavigating || activeOrder || lastSyncedDestination
                        ? 'bg-[#11131c]/95 border-emerald-500/40 text-white ring-1 ring-emerald-500/20'
                        : 'bg-[#12141d]/95 border-white/15 text-white'
                    }`}>
                      <div className="flex items-start gap-3">
                        {/* Maneuver Arrow Badge */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                          isNavigating 
                            ? 'bg-emerald-500 text-black' 
                            : 'bg-blue-600 text-white'
                        }`}>
                          <Navigation size={26} className={isNavigating ? 'rotate-45' : 'rotate-45'} />
                        </div>

                        {/* Maneuver Text & Destination */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black tracking-tight text-white font-mono">
                              {maneuverDist}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {isNavigating ? (isPickupStage ? 'To Pickup' : 'To Dropoff') : 'CarPlay Ready'}
                            </span>
                          </div>

                          <h3 className="text-sm font-black text-white truncate mt-0.5 leading-tight">
                            {maneuverText}
                          </h3>

                          <p className="text-[11px] text-gray-300 font-bold truncate mt-0.5">
                            {targetTitle}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Route Action Controls inside Maneuver Card */}
                      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/10">
                        <button
                          onClick={() => {
                            if (setIsNavigating) setIsNavigating(!isNavigating);
                            if (!isNavigating && onTriggerNavigateSync) onTriggerNavigateSync();
                          }}
                          className={`flex-1 py-2 px-3 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isNavigating
                              ? 'bg-amber-500 text-black shadow-md'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-md shadow-emerald-600/30'
                          }`}
                        >
                          <Navigation size={12} />
                          <span>{isNavigating ? 'End Navigation' : 'Start Guidance'}</span>
                        </button>

                        {activeOrder && handleNextStep && (
                          <button
                            onClick={() => handleNextStep(activeOrder.id)}
                            className="py-2 px-3.5 rounded-xl font-black text-[10px] uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer shadow-md"
                          >
                            {isPickupStage ? 'Confirm Pickup' : 'Complete Trip'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Authentic Speed Limit Sign on CarPlay Map */}
                  <div className="absolute bottom-20 left-4 z-[3200] pointer-events-none">
                    <div className="w-12 h-14 bg-white border-2 border-black rounded-lg shadow-2xl flex flex-col items-center justify-center p-1 text-black font-sans leading-none">
                      <span className="text-[7.5px] font-black uppercase tracking-tight text-neutral-800">SPEED</span>
                      <span className="text-[7px] font-black uppercase tracking-tight text-neutral-800">LIMIT</span>
                      <span className="text-xl font-black tracking-tighter mt-0.5">30</span>
                    </div>
                  </div>

                  {/* Bottom CarPlay Trip Telemetry Bar */}
                  <div className="absolute bottom-3 left-3 right-3 z-[3400] flex items-center justify-between pointer-events-none">
                    <div className="px-4 py-2.5 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/15 flex items-center gap-4 pointer-events-auto shadow-2xl">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${user.isOnline ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono">
                          {isNavigating ? `${milesStr} mi • ${minsVal} min` : (user.isOnline ? "Scanning Demand" : "Offline")}
                        </span>
                      </div>

                      <div className="h-4 w-[1px] bg-white/20 hidden sm:block" />

                      <span className="text-xs font-bold text-gray-200 hidden sm:block truncate max-w-[260px]">
                        {targetSubtitle}
                      </span>
                    </div>

                    {/* Exit Route Button */}
                    {isNavigating && (
                      <button
                        onClick={() => setIsNavigating && setIsNavigating(false)}
                        className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-2xl pointer-events-auto cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <X size={14} />
                        <span>End Route</span>
                      </button>
                    )}
                  </div>

                  {/* ========================================================================= */}
                  {/* INCOMING TRIP REQUEST CARD OVERLAY (Real Apple CarPlay Uber/Hyper Experience) */}
                  {/* This directly matches The RideShare Guy YouTube video demonstration! */}
                  {/* ========================================================================= */}
                  <AnimatePresence>
                    {pendingOrder && (
                      <motion.div
                        key={`carplay-job-request-${pendingOrder.id}`}
                        initial={{ opacity: 0, scale: 0.92, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                        className="absolute inset-y-3 right-3 w-[calc(100%-24px)] sm:w-[440px] max-w-full z-[4500] flex flex-col pointer-events-auto"
                      >
                        <div className="flex-1 bg-[#090b12]/95 backdrop-blur-2xl border-2 border-emerald-500/50 rounded-[28px] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col justify-between text-white overflow-hidden relative ring-1 ring-emerald-400/30">
                          
                          {/* Ambient glow header */}
                          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-green-400 to-teal-500 animate-pulse" />

                          <div>
                            {/* Top Badges & Dismiss Button */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Service Pill */}
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-xs uppercase tracking-wider bg-black text-white border border-white/20 shadow-md">
                                  {isPendingDelivery ? (
                                    <>
                                      <Utensils size={13} className="text-emerald-400" />
                                      <span>{pendingOrder.brand === 'hyper' ? 'Hyper Eats' : 'Uber Eats'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <CarIcon size={13} className="text-blue-400" fill="currentColor" />
                                      <span>{pendingOrder.restaurantName || (pendingOrder.brand === 'hyper' ? 'Hyper Ride' : 'UberX')}</span>
                                    </>
                                  )}
                                </div>

                                {/* Passenger/Client Rating */}
                                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-xl text-xs font-black text-amber-300 border border-white/10">
                                  <Star size={12} fill="#eab308" className="text-yellow-500" />
                                  <span>4.96</span>
                                </div>

                                {/* Surge Pill */}
                                {pendingOrder.surge ? (
                                  <span className="px-2 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                                    <Flame size={11} className="text-amber-400" />
                                    <span>+{((pendingOrder.surge * 2.2) || 2.50).toFixed(2)} Surge</span>
                                  </span>
                                ) : null}

                                {/* Double Stack Pill */}
                                {isPendingDouble && (
                                  <span className="px-2 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                    Double Trip
                                  </span>
                                )}
                              </div>

                              {/* Decline X Button */}
                              <button
                                onClick={onDeclineOrder}
                                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center cursor-pointer active:scale-90 transition-all border border-white/15"
                                title="Decline Job Request"
                              >
                                <X size={18} />
                              </button>
                            </div>

                            {/* Large Fare Display */}
                            <div className="flex items-baseline justify-between mb-3">
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Total Guaranteed Payout</span>
                                <h2 className="text-5xl font-black tracking-tight text-white font-sans leading-none mt-1">
                                  £{pendingOrder.estimatedPay.toFixed(2)}
                                </h2>
                              </div>

                              {pendingPayRate && (
                                <div className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${pendingPayRate.color}`}>
                                  <span>{pendingPayRate.icon}</span> <span>{pendingPayRate.label}</span>
                                </div>
                              )}
                            </div>

                            {/* Trip Timing & Distance Telemetry Summary */}
                            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-2xl mb-3 text-xs font-bold text-gray-200">
                              <span className="text-emerald-400 font-black">Pickup in {pendingPickupMinutes} min ({pendingPickupDistance} mi)</span>
                              <span className="text-gray-500">•</span>
                              <span>Total: {pendingOrder.estimatedTime} min ({pendingOrder.estimatedDistance.toFixed(1)} mi)</span>
                            </div>

                            {/* Visual Waypoint Stops Chain */}
                            <div className="relative pl-6 space-y-3.5 my-2 border-l-2 border-dashed border-white/20 ml-3">
                              {/* Pickup Stop */}
                              <div className="relative">
                                <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/30 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                                  {isPendingDelivery ? 'Pickup Restaurant' : 'Rider Pickup Point'}
                                </p>
                                <h4 className="text-sm font-black text-white truncate">
                                  {pendingOrder.restaurantName || "High St Pickup Point"}
                                </h4>
                                <p className="text-[11px] text-gray-400 truncate">
                                  {isPendingDelivery ? "12 Kingsway, Holborn, London" : "Passenger Pickup Location"}
                                </p>
                              </div>

                              {/* Dropoff Stop */}
                              <div className="relative">
                                <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-sm bg-blue-500 ring-4 ring-blue-500/30 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">
                                  {isPendingDelivery ? 'Customer Dropoff' : 'Passenger Destination'}
                                </p>
                                <h4 className="text-sm font-black text-white truncate">
                                  {pendingOrder.customerName || "Customer Destination"}
                                </h4>
                                <p className="text-[11px] text-gray-400 truncate">
                                  {isPendingDelivery ? "48 High Holborn, London WC1V" : "Final Dropoff Location"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Countdown Timer Bar & Match / Accept Button */}
                          <div className="space-y-3 pt-3 border-t border-white/10 shrink-0">
                            {/* Dynamic depleting countdown bar */}
                            <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                key={`carplay-timer-${pendingOrder.id}`}
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: orderExpiryTimer, ease: 'linear' }}
                                className={`h-full rounded-full ${
                                  orderExpiryTimer <= 5 ? 'bg-red-500' : 'bg-emerald-400'
                                }`}
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                onClick={onDeclineOrder}
                                className="h-14 px-5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                              >
                                <X size={16} />
                                <span>Decline</span>
                              </button>

                              <button
                                onClick={onAcceptOrder}
                                disabled={isMatchingLoading || isMatchFailed}
                                className={`h-14 flex-1 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all cursor-pointer ${
                                  isMatchingLoading
                                    ? 'bg-emerald-600/50 text-white'
                                    : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black shadow-emerald-500/40'
                                }`}
                              >
                                {isMatchingLoading ? (
                                  <>
                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    <span>Matching...</span>
                                  </>
                                ) : isMatchFailed ? (
                                  <span>Another Driver Accepted</span>
                                ) : (
                                  <>
                                    <Check size={20} className="stroke-[3]" />
                                    <span>Match ({orderExpiryTimer}s)</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

                {/* Right Column: Split View (Now Playing, Cross-Device Sync & Route Details) */}
                {carPlayView === 'split' && (
                  <div className="w-[360px] max-w-[40%] bg-[#0e1017] border-l border-white/10 flex flex-col p-4 gap-4 overflow-y-auto custom-scrollbar shrink-0">
                    
                    {/* Cross-Device Bridge & Room Pairing Card */}
                    <div className="bg-white/[0.04] rounded-2xl p-4 border border-white/10 space-y-3 shrink-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Phone ⇄ CarPlay Bridge</span>
                          <h4 className="text-sm font-black text-white">Live Route & Job Sync</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase">
                          Connected
                        </span>
                      </div>

                      {/* Device Role Toggle */}
                      <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                        <button
                          onClick={() => setIsCarPlayRemoteMode && setIsCarPlayRemoteMode(false)}
                          className={`py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            !isCarPlayRemoteMode ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400'
                          }`}
                        >
                          📱 Phone Controller
                        </button>
                        <button
                          onClick={() => setIsCarPlayRemoteMode && setIsCarPlayRemoteMode(true)}
                          className={`py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            isCarPlayRemoteMode ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400'
                          }`}
                        >
                          🚗 Car Display (PC)
                        </button>
                      </div>

                      {/* Room Code */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Room:</span>
                          <input
                            value={editingRoom}
                            onChange={(e) => setEditingRoom(e.target.value.toUpperCase())}
                            className="w-16 bg-transparent text-right font-mono font-black text-xs text-amber-400 outline-none uppercase"
                            maxLength={8}
                          />
                        </div>
                        <button
                          onClick={() => setCarPlayRoomCode && setCarPlayRoomCode(editingRoom.trim() || 'HYPER1')}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-wider text-white cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>

                      <button
                        onClick={onTriggerNavigateSync}
                        className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Navigation size={12} />
                        <span>Force Sync Route to CarPlay</span>
                      </button>
                    </div>

                    {/* Active Order / Trip Details */}
                    {activeOrder ? (
                      <div className="bg-white/[0.04] rounded-2xl p-4 border border-white/10 flex flex-col justify-between gap-2.5 shrink-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                              {isPickupStage ? 'Pickup Phase' : 'Dropoff Phase'}
                            </p>
                            <h4 className="text-base font-black truncate">
                              {isPickupStage ? activeOrder.restaurantName : activeOrder.customerName}
                            </h4>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-emerald-400">£{activeOrder.estimatedPay.toFixed(2)}</p>
                            <p className="text-[9px] font-bold text-gray-400">{milesStr} mi • {minsVal} min</p>
                          </div>
                        </div>

                        {activeOrder.items && activeOrder.items.length > 0 && (
                          <div className="bg-black/40 rounded-xl p-2.5 border border-white/5 space-y-0.5">
                            {activeOrder.items.slice(0, 2).map((item, i) => (
                              <p key={i} className="text-[11px] font-bold text-gray-300 truncate">• {item}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white/[0.04] rounded-2xl p-4 border border-white/10 text-center shrink-0">
                        <p className="text-xs font-black text-white">CarPlay Standby</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Accept a job on phone to stream live route navigation here.
                        </p>
                      </div>
                    )}

                    {/* Integrated Media Player Controls */}
                    <div className="flex-1 min-h-[170px]">
                      <MediaControls isCarPlay={true} theme="dark" />
                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Free Services & Service Limits Explanation Modal */}
      {showServiceLimitsModal && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[#0e111a] border border-white/20 rounded-3xl p-6 shadow-2xl text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Compass className="text-emerald-400" size={22} />
                <h3 className="text-base font-black uppercase tracking-wider">Free Services & API Limits</h3>
              </div>
              <button
                onClick={() => setShowServiceLimitsModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                <h4 className="font-black text-emerald-400 uppercase text-[11px] mb-1">Leaflet & OpenStreetMap</h4>
                <p>
                  Map tiles are rendered via Leaflet using Carto Voyager and Dark basemaps, powered by OpenStreetMap contributors. 
                  Attribution is permanently displayed in the bottom-right corner as required by Open Data Commons Open Database License (ODbL).
                </p>
              </div>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                <h4 className="font-black text-blue-400 uppercase text-[11px] mb-1">OSRM Turn-by-Turn Routing Engine</h4>
                <p>
                  Navigation coordinates and street geometry use the free public Project-OSRM service (<code className="text-blue-300">router.project-osrm.org</code>).
                  <strong> Service Limits:</strong> The public demo server has a fair-use limit of ~1 request per second. Hyper Driver incorporates smart route caching and local waypoint interpolation to preserve smooth navigation during rate limits or transient network delays.
                </p>
              </div>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                <h4 className="font-black text-purple-400 uppercase text-[11px] mb-1">Real-Time Cross-Device Sync</h4>
                <p>
                  CarPlay synchronizes via low-latency local <code className="text-purple-300">BroadcastChannel</code> across tabs and free Server-Sent Events (SSE) stream endpoints (<code className="text-purple-300">/api/carplay/sync</code>) for multi-device setups without requiring paid third-party socket infrastructure.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowServiceLimitsModal(false)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Understood
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
};

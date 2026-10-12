import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Search, 
  Layers, 
  ChevronRight, 
  Play, 
  Navigation, 
  Zap, 
  Award, 
  Flame, 
  Plane, 
  Clock, 
  MapPin, 
  SlidersHorizontal,
  ChevronUp,
  List,
  ShieldAlert,
  Home,
  CircleDollarSign,
  User,
  Crosshair,
  Menu,
  Phone,
  Wifi,
  Headphones,
  Battery,
  X,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types';

export interface OfflineHomeScreenProps {
  user: UserProfile;
  activeCityKey: string;
  onGoOnline: () => void;
  onOpenPreferences: () => void;
  onOpenOpportunities: () => void;
  onOpenSafetyToolkit: () => void;
  onOpenSearch: () => void;
  onOpenLayers?: () => void;
  onOpenMap?: () => void;
  onOpenRankPro?: () => void;
  onOpenLeague?: () => void;
  onOpenCarPlay?: () => void;
  activeSurgeAreas?: any[];
  theme?: 'light' | 'dark';
  mapNode?: React.ReactNode;
  onRecenterMap?: () => void;
  onOpenMenu?: () => void;
  onOpenTrips?: () => void;
  onOpenEarnings?: () => void;
  onOpenAccount?: () => void;
}

export const OfflineHomeScreen: React.FC<OfflineHomeScreenProps> = ({
  user,
  activeCityKey,
  onGoOnline,
  onOpenPreferences,
  onOpenOpportunities,
  onOpenSafetyToolkit,
  onOpenSearch,
  onOpenLayers,
  onOpenMap,
  onOpenRankPro,
  onOpenLeague,
  onOpenCarPlay,
  activeSurgeAreas = [],
  theme = 'dark',
  mapNode,
  onRecenterMap,
  onOpenMenu,
  onOpenTrips,
  onOpenEarnings,
  onOpenAccount
}) => {
  const [isOpportunitiesDrawerOpen, setIsOpportunitiesDrawerOpen] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'trips' | 'earnings' | 'account'>('home');

  const insuranceExpiry = user.documentExpiries?.["Vehicle Insurance"];
  const insuranceDaysLeft = React.useMemo(() => {
    if (!insuranceExpiry) return null;
    const expiryDate = new Date(insuranceExpiry);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [insuranceExpiry]);

  // Formatted date & time for authentic top status bar
  const [currentTimeStr, setCurrentTimeStr] = useState('20:26 Mon Oct 12');
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setCurrentTimeStr(`${hours}:${mins} ${days[now.getDay()]} ${months[now.getMonth()]} ${now.getDate()}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#070b14] text-white flex flex-col overflow-hidden select-none font-sans">
      
      {/* =========================================================================
          1. FULL-SCREEN BACKGROUND MAP CANVAS (Leaflet OpenStreetMap Dark)
          ========================================================================= */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        {mapNode ? (
          mapNode
        ) : (
          /* High-Fidelity Vector Road Map Visual Fallback matching screenshot */
          <div className="w-full h-full bg-[#0b121e] relative overflow-hidden">
            {/* Water canal / river styling */}
            <svg className="absolute inset-0 w-full h-full opacity-60 pointer-events-none" viewBox="0 0 800 1200">
              <path d="M 650 0 Q 610 200 680 400 T 780 800 T 800 1200" fill="none" stroke="#0f3460" strokeWidth="60" strokeLinecap="round" />
              <path d="M 0 350 Q 200 450 350 420 T 550 520 T 700 490" fill="none" stroke="#132743" strokeWidth="18" strokeLinecap="round" />
              
              {/* City street network paths */}
              <g stroke="#1a355e" strokeWidth="4" fill="none" opacity="0.8">
                <path d="M 120 0 L 150 400 L 220 800 L 300 1200" />
                <path d="M 280 0 L 300 350 L 410 700 L 450 1200" />
                <path d="M 450 0 L 430 320 L 520 650 L 600 1200" />
                <path d="M 0 180 L 800 220" />
                <path d="M 0 380 L 800 420" />
                <path d="M 0 580 L 800 640" />
                <path d="M 0 780 L 800 820" />
                <path d="M 0 980 L 800 1020" />
              </g>
              <g stroke="#1d4ed8" strokeWidth="6" fill="none" opacity="0.9">
                <circle cx="320" cy="110" r="28" />
                <circle cx="530" cy="580" r="32" />
                <path d="M 0 280 Q 300 200 600 350 T 800 500" />
                <path d="M 200 0 Q 350 500 500 1200" />
              </g>
            </svg>
          </div>
        )}
      </div>

      {/* Subtle vignette for map depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none z-10" />

      {/* =========================================================================
          2. TOP STATUS BAR (Authentic iOS System Header)
          ========================================================================= */}
      <div className="relative z-20 pt-2 px-5 pb-1 flex justify-between items-center text-xs font-semibold text-white pointer-events-none">
        {/* Left: Clock & Day */}
        <div className="tracking-tight font-medium text-white/90">
          {currentTimeStr}
        </div>

        {/* Right: Phone, Headphone, Wi-Fi, 100% Battery indicator */}
        <div className="flex items-center gap-2">
          {/* Active Call / Live Pill */}
          <div className="h-5 px-2 bg-emerald-500 rounded-full flex items-center gap-1 shadow-sm">
            <Phone size={10} className="fill-white text-white" />
          </div>
          {/* Headphone Audio Badge */}
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-amber-900 rounded-full" />
          </div>
          <Headphones size={13} className="text-white/90" />
          <Wifi size={13} className="text-white/90" />
          {/* Battery 100 Badge */}
          <div className="flex items-center gap-1 bg-amber-400 text-black px-1.5 py-0.5 rounded-full font-black text-[9px] shadow-sm">
            <span>100</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. TOP NAVIGATION FLOATING BUTTONS (Hamburger Menu & Crosshair)
          ========================================================================= */}
      <div className="relative z-20 px-4 pt-3 flex justify-between items-center pointer-events-none">
        {/* Left: Hamburger Menu Circle Button */}
        <button
          onClick={() => {
            if (onOpenMenu) onOpenMenu();
            else onOpenPreferences();
          }}
          className="w-12 h-12 rounded-full bg-[#121927]/85 hover:bg-[#1c273c] border border-white/10 backdrop-blur-xl flex items-center justify-center text-white shadow-2xl active:scale-95 transition-all cursor-pointer pointer-events-auto"
          title="Menu / Settings"
        >
          <Menu size={22} strokeWidth={2.5} />
        </button>

        {/* Right: GPS Target Reticle Circle Button */}
        <button
          onClick={() => {
            if (onRecenterMap) onRecenterMap();
            else if (onOpenMap) onOpenMap();
          }}
          className="w-12 h-12 rounded-full bg-[#121927]/85 hover:bg-[#1c273c] border border-white/10 backdrop-blur-xl flex items-center justify-center text-white shadow-2xl active:scale-95 transition-all cursor-pointer pointer-events-auto"
          title="Center on Vehicle GPS"
        >
          <Crosshair size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* Spacer to push controls to bottom */}
      <div className="flex-1 min-h-[140px]" />

      {/* =========================================================================
          4. CENTER-BOTTOM FLOATING "GO" BUTTON
          ========================================================================= */}
      <div className="relative z-20 flex flex-col items-center justify-center mb-6 pointer-events-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.93 }}
          className="relative group cursor-pointer"
          onClick={onGoOnline}
        >
          {/* Neon outer glowing pulse aura */}
          <div className="absolute -inset-5 rounded-full bg-blue-600/35 blur-2xl pointer-events-none animate-pulse" style={{ animationDuration: '2.5s' }} />
          <div className="absolute -inset-2 rounded-full border border-blue-400/30 pointer-events-none" />

          {/* Glowing Concentric White Ring & Royal Blue Button */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-[3.5px] border-white bg-gradient-to-b from-[#2575fc] via-[#1a66ff] to-[#0052e0] shadow-[0_0_45px_rgba(26,102,255,0.7)] flex items-center justify-center transition-all duration-300 group-hover:scale-105 active:scale-95">
            <span className="font-sans font-black text-3xl sm:text-4xl uppercase tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              GO
            </span>
          </div>
        </motion.div>
      </div>

      {/* =========================================================================
          5. BOTTOM CARD: "You're offline" SHEET
          ========================================================================= */}
      <div className="relative z-20 w-full px-3 sm:px-4 pb-1 pointer-events-auto">
        <div 
          onClick={() => setIsOpportunitiesDrawerOpen(true)}
          className="w-full bg-[#0f172a]/95 hover:bg-[#131d35] backdrop-blur-2xl border border-white/10 rounded-t-[28px] sm:rounded-t-[32px] p-4 sm:p-5 shadow-2xl flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Circle with Offline slate dot */}
            <div className="w-11 h-11 rounded-full bg-[#1e293b] flex items-center justify-center shrink-0 border border-white/5">
              <div className="w-3.5 h-3.5 rounded-full bg-[#64748b]" />
            </div>

            {/* Offline Label Stack */}
            <div className="min-w-0">
              <h3 className="font-sans font-black text-lg sm:text-xl text-white tracking-tight leading-tight">
                You're offline
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5 truncate">
                Go online to start receiving trips
              </p>
            </div>
          </div>

          <div className="p-1 rounded-full text-slate-400 hover:text-white transition-colors shrink-0">
            <ChevronRight size={22} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* =========================================================================
          6. BOTTOM NAVIGATION BAR (Home, Trips, Earnings, Account)
          ========================================================================= */}
      <div className="relative z-30 w-full bg-[#080d1a] border-t border-white/5 py-2.5 px-4 sm:px-8 flex items-center justify-around pointer-events-auto shrink-0 shadow-2xl">
        {/* TAB 1: HOME (Active with Blue styling and Underline) */}
        <button
          onClick={() => setActiveBottomTab('home')}
          className="flex flex-col items-center justify-center flex-1 py-1 cursor-pointer group"
        >
          <div className="text-[#2575fc]">
            <Home size={22} className="fill-[#2575fc]" />
          </div>
          <span className="text-[11px] font-bold text-[#2575fc] mt-1 leading-none">
            Home
          </span>
          {/* Active indicator underline pill */}
          <div className="w-6 h-0.5 bg-[#2575fc] rounded-full mt-1.5 shadow-[0_0_8px_#2575fc]" />
        </button>

        {/* TAB 2: TRIPS */}
        <button
          onClick={() => {
            setActiveBottomTab('trips');
            if (onOpenTrips) onOpenTrips();
            else setIsOpportunitiesDrawerOpen(true);
          }}
          className="flex flex-col items-center justify-center flex-1 py-1 cursor-pointer text-slate-400 hover:text-white transition-colors group"
        >
          <List size={22} strokeWidth={2} />
          <span className="text-[11px] font-medium text-slate-400 group-hover:text-white mt-1 leading-none">
            Trips
          </span>
          <div className="w-6 h-0.5 bg-transparent mt-1.5" />
        </button>

        {/* TAB 3: EARNINGS */}
        <button
          onClick={() => {
            setActiveBottomTab('earnings');
            if (onOpenEarnings) onOpenEarnings();
            else onOpenOpportunities();
          }}
          className="flex flex-col items-center justify-center flex-1 py-1 cursor-pointer text-slate-400 hover:text-white transition-colors group"
        >
          <CircleDollarSign size={22} strokeWidth={2} />
          <span className="text-[11px] font-medium text-slate-400 group-hover:text-white mt-1 leading-none">
            Earnings
          </span>
          <div className="w-6 h-0.5 bg-transparent mt-1.5" />
        </button>

        {/* TAB 4: ACCOUNT */}
        <button
          onClick={() => {
            setActiveBottomTab('account');
            if (onOpenAccount) onOpenAccount();
            else if (onOpenMenu) onOpenMenu();
            else onOpenPreferences();
          }}
          className="flex flex-col items-center justify-center flex-1 py-1 cursor-pointer text-slate-400 hover:text-white transition-colors group"
        >
          <User size={22} strokeWidth={2} />
          <span className="text-[11px] font-medium text-slate-400 group-hover:text-white mt-1 leading-none">
            Account
          </span>
          <div className="w-6 h-0.5 bg-transparent mt-1.5" />
        </button>
      </div>

      {/* =========================================================================
          7. SLIDE-UP OPPORTUNITIES & SHIFT DRAWER (Preserves all existing features)
          ========================================================================= */}
      <AnimatePresence>
        {isOpportunitiesDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-md flex flex-col justify-end pointer-events-auto"
            onClick={() => setIsOpportunitiesDrawerOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-[#0f172a] border-t border-white/10 rounded-t-[36px] p-6 max-h-[82vh] overflow-y-auto custom-scrollbar space-y-6 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Drag Pill */}
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto -mt-2 mb-3" />

              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">Driver Shift Hub</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{activeCityKey} Region Opportunities</p>
                </div>
                <button
                  onClick={() => setIsOpportunitiesDrawerOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Action Required: Insurance Warning if needed */}
              {insuranceDaysLeft !== null && insuranceDaysLeft <= 30 && (
                <div className="bg-orange-500/15 border border-orange-500/30 p-4 rounded-3xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-orange-200 text-sm">Action Required</h3>
                    <p className="text-xs text-orange-300 font-bold mt-0.5">
                      Your vehicle insurance expires in {insuranceDaysLeft} days ({insuranceExpiry}).
                    </p>
                    <p className="text-[10px] text-orange-400 mt-1">
                      Please update your documents in Settings to stay online.
                    </p>
                  </div>
                </div>
              )}

              {/* Featured Hourly Promotion Card */}
              <div className="bg-gradient-to-br from-[#121f3d] to-[#0a1224] text-white rounded-3xl p-5 shadow-xl space-y-4 border border-blue-500/30 relative overflow-hidden">
                <div className="flex items-center gap-2 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest">Active Promotion</span>
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-white">
                    Extra £8.50 per active hour from 3 PM – 4 PM
                  </h3>
                  <p className="text-xs text-slate-300 font-medium mt-1">
                    Active trip boost valid in {activeCityKey}. Earnings automatically credited upon delivery.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setIsOpportunitiesDrawerOpen(false);
                    onGoOnline();
                  }}
                  className="w-full py-3.5 bg-[#2575fc] hover:bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Navigation size={16} className="fill-white rotate-45" />
                  <span>Go Online Now</span>
                </button>
              </div>

              {/* Driver Rank & XP League Card */}
              {(() => {
                const pts = user.points ?? 350;
                const computedTier = pts >= 1200 ? 'Diamond' : pts >= 600 ? 'Platinum' : pts >= 200 ? 'Gold' : 'Blue';
                const nextTierName = computedTier === 'Blue' ? 'Gold' : computedTier === 'Gold' ? 'Platinum' : computedTier === 'Platinum' ? 'Diamond' : 'Max Rank';
                const tierFloor = computedTier === 'Blue' ? 0 : computedTier === 'Gold' ? 200 : computedTier === 'Platinum' ? 600 : 1200;
                const nextTarget = computedTier === 'Blue' ? 200 : computedTier === 'Gold' ? 600 : computedTier === 'Platinum' ? 1200 : 2000;
                const progressPct = computedTier === 'Diamond'
                  ? 100
                  : Math.min(100, Math.max(5, Math.round(((pts - tierFloor) / (nextTarget - tierFloor)) * 100)));

                return (
                  <div className="bg-[#131d33] rounded-3xl p-5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                          <Award size={20} />
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Hyper Pro Tier</div>
                          <h4 className="font-bold text-white text-base">{computedTier} League Driver</h4>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-400 font-mono font-black text-base">{pts} XP</span>
                        <p className="text-[10px] text-slate-400">{nextTarget - pts} XP to {nextTierName}</p>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => {
                          setIsOpportunitiesDrawerOpen(false);
                          if (onOpenRankPro) onOpenRankPro();
                        }}
                        className="py-2.5 px-3 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5"
                      >
                        <Award size={13} className="text-amber-400" />
                        <span>Pro Perks</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsOpportunitiesDrawerOpen(false);
                          if (onOpenLeague) onOpenLeague();
                        }}
                        className="py-2.5 px-3 bg-blue-600/80 hover:bg-blue-600 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5"
                      >
                        <Zap size={13} className="text-cyan-300" />
                        <span>Leaderboard</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Opportunities & Quests */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Quests & Streaks</span>
                  <button onClick={onOpenOpportunities} className="text-blue-400 hover:underline">View All</button>
                </div>

                <div className="bg-[#131d33] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Weekly Quest</span>
                    <h5 className="font-bold text-sm text-white mt-0.5">Complete 40 trips • Earn +£120</h5>
                    <p className="text-[11px] text-slate-400">18 / 40 completed</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 flex items-center justify-center font-mono font-bold text-xs text-purple-300">
                    45%
                  </div>
                </div>

                <div className="bg-[#131d33] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Streak Reward</span>
                    <h5 className="font-bold text-sm text-white mt-0.5">Complete 3 trips in a row</h5>
                    <p className="text-[11px] text-slate-400">Earn extra £15.00 bonus</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 font-bold text-xs rounded-xl border border-amber-500/30">
                    +£15.00
                  </span>
                </div>
              </div>

              {/* CarPlay Link button */}
              {onOpenCarPlay && (
                <button
                  onClick={() => {
                    setIsOpportunitiesDrawerOpen(false);
                    onOpenCarPlay();
                  }}
                  className="w-full py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-2xl text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Navigation size={14} className="text-emerald-400" />
                  <span>Launch CarPlay Map View (iPad ⇄ PC Sync)</span>
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default OfflineHomeScreen;

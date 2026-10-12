import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Navigation, 
  Phone, 
  Music, 
  MessageSquare, 
  Calendar, 
  Settings, 
  Radio, 
  Compass, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Maximize2, 
  Minimize2, 
  Grid, 
  Car, 
  ChevronRight, 
  X, 
  Check, 
  Clock, 
  Flame, 
  Star, 
  Utensils, 
  Car as CarIcon, 
  Smartphone, 
  Bell, 
  Layers, 
  MapPin, 
  RadioTower, 
  Search, 
  Mic, 
  Send,
  Sparkles,
  Sliders
} from 'lucide-react';
import { Order, UserProfile, Location } from '../types';
import { calculatePayRate } from '../utils/payRate';
import { MediaControls, PLAYLIST } from './MediaControls';

export interface CarPlayDashboardProps {
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

// ==========================================
// AUTHENTIC APPLE CARPLAY APP ICON SVGS
// Crafted with continuous squircle curvature
// ==========================================

export const ApplePhoneIcon = ({ size = 56 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="16" fill="url(#phoneGrad)" />
    <path 
      d="M45.8 37.6C43.7 35.5 41.2 35.5 39.1 37.6L37.3 39.4C36.8 39.9 36.1 40.1 35.5 39.8C32.1 38.3 27.7 33.9 26.2 30.5C25.9 29.9 26.1 29.2 26.6 28.7L28.4 26.9C30.5 24.8 30.5 22.3 28.4 20.2L24.8 16.6C22.7 14.5 20.2 14.5 18.1 16.6L16.2 18.5C14.7 20 13.9 21.9 14 24C14.3 28.7 17.5 35.6 24.6 42.7C31.7 49.8 38.6 53 43.3 53.3C45.4 53.4 47.3 52.6 48.8 51.1L50.7 49.2C52.8 47.1 52.8 44.6 50.7 42.5L45.8 37.6Z" 
      fill="white" 
    />
    <defs>
      <linearGradient id="phoneGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3CD668" />
        <stop offset="1" stopColor="#28B446" />
      </linearGradient>
    </defs>
  </svg>
);

export const AppleMusicIcon = ({ size = 56 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="16" fill="url(#musicGrad)" />
    {/* Double eighth note */}
    <path 
      d="M43.5 16.8V39.2C42.2 38.5 40.5 38.1 38.6 38.1C34.4 38.1 31 40.6 31 43.6C31 46.6 34.4 49 38.6 49C42.6 49 45.9 46.7 46 43.8V23.7L25.5 27.6V42.2C24.2 41.5 22.5 41.1 20.6 41.1C16.4 41.1 13 43.6 13 46.6C13 49.6 16.4 52 20.6 52C24.6 52 27.9 49.7 28 46.8V23C28 21.8 28.9 20.7 30.1 20.5L41.6 18.2C42.7 18 43.5 17.3 43.5 16.8Z" 
      fill="white" 
    />
    <defs>
      <linearGradient id="musicGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF416C" />
        <stop offset="1" stopColor="#FA233B" />
      </linearGradient>
    </defs>
  </svg>
);

export const AppleMapsIcon = ({ size = 56 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="16" fill="#EDEFEF" />
    {/* Map green parks */}
    <path d="M0 16C0 7.16 7.16 0 16 0H32L0 44V16Z" fill="#B7E2B0" />
    <path d="M42 64H64V42L42 64Z" fill="#B7E2B0" />
    {/* Freeway roads */}
    <path d="M0 34L64 12" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
    <path d="M0 34L64 12" stroke="#F6D365" strokeWidth="5" strokeLinecap="round" />
    <path d="M22 64L44 0" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
    <path d="M22 64L44 0" stroke="#F6805D" strokeWidth="5" strokeLinecap="round" />
    {/* Location blue arrow */}
    <g transform="translate(32, 28) rotate(-25)">
      <path d="M0 -12L9 8L0 4L-9 8L0 -12Z" fill="#007AFF" />
      <circle cx="0" cy="1" r="1.5" fill="white" />
    </g>
    {/* Red destination pin */}
    <g transform="translate(18, 18)">
      <circle cx="0" cy="0" r="5" fill="#FF3B30" />
      <circle cx="0" cy="0" r="2.2" fill="white" />
    </g>
  </svg>
);

export const AppleMessagesIcon = ({ size = 56 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="16" fill="url(#msgGrad)" />
    {/* Speech bubble */}
    <path 
      d="M32 15C21.5 15 13 22.4 13 31.5C13 36.4 15.6 40.7 19.8 43.8C19.2 46.2 17.5 48.7 15.2 50.1C14.7 50.4 14.9 51.2 15.5 51.3C18.8 51.6 22.7 50.4 25.5 47.7C27.5 48.2 29.7 48.5 32 48.5C42.5 48.5 51 41.1 51 32C51 22.9 42.5 15 32 15Z" 
      fill="white" 
    />
    <defs>
      <linearGradient id="msgGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3CD668" />
        <stop offset="1" stopColor="#28B446" />
      </linearGradient>
    </defs>
  </svg>
);

export const AppleNowPlayingIcon = ({ size = 56 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="16" fill="url(#npGrad)" />
    {/* Audio visualizer bars */}
    <rect x="18" y="26" width="5" height="18" rx="2.5" fill="white" />
    <rect x="26" y="18" width="5" height="28" rx="2.5" fill="white" />
    <rect x="34" y="22" width="5" height="22" rx="2.5" fill="white" />
    <rect x="42" y="30" width="5" height="12" rx="2.5" fill="white" />
    <defs>
      <linearGradient id="npGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF5E62" />
        <stop offset="1" stopColor="#FF2A2A" />
      </linearGradient>
    </defs>
  </svg>
);

export const ApplePodcastsIcon = ({ size = 56 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="16" fill="url(#podGrad)" />
    {/* Broadcast waves and mic */}
    <circle cx="32" cy="24" r="5" fill="white" />
    <path d="M26 31C26 29.5 27 28 32 28C37 28 38 29.5 38 31V45C38 46 36.5 47 32 47C27.5 47 26 46 26 45V31Z" fill="white" />
    <path d="M19 28C19 20.8 24.8 15 32 15C39.2 15 45 20.8 45 28" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <path d="M14 28C14 18 22 10 32 10C42 10 50 18 50 28" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    <defs>
      <linearGradient id="podGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A855F7" />
        <stop offset="1" stopColor="#7E22CE" />
      </linearGradient>
    </defs>
  </svg>
);

export const AppleCalendarIcon = ({ size = 56, day = 'MON', date = '12' }: { size?: number; day?: string; date?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="16" fill="#F4F4F6" />
    {/* Red top bar */}
    <path d="M0 16C0 7.16 7.16 0 16 0H48C56.84 0 64 7.16 64 16V22H0V16Z" fill="#FF3B30" />
    <text x="32" y="16" fill="white" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">{day}</text>
    <text x="32" y="47" fill="#1C1C1E" fontSize="24" fontWeight="800" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">{date}</text>
  </svg>
);

export const AppleSettingsIcon = ({ size = 56 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="16" fill="url(#setGrad)" />
    {/* Gear Cog */}
    <g transform="translate(32, 32)">
      <circle cx="0" cy="0" r="15" fill="#8E8E93" />
      <circle cx="0" cy="0" r="7" fill="#3A3A3C" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <rect 
          key={deg} 
          x="-3" 
          y="-19" 
          width="6" 
          height="8" 
          rx="2" 
          fill="#8E8E93" 
          transform={`rotate(${deg})`} 
        />
      ))}
    </g>
    <defs>
      <linearGradient id="setGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#636366" />
        <stop offset="1" stopColor="#3A3A3C" />
      </linearGradient>
    </defs>
  </svg>
);

export const AppleAudiobooksIcon = ({ size = 56 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="16" fill="url(#abGrad)" />
    <path 
      d="M32 23C27.5 19.5 22 19 16 20V45C22 44 27.5 44.5 32 47.5C36.5 44.5 42 44 48 45V20C42 19 36.5 19.5 32 23Z" 
      stroke="white" 
      strokeWidth="3.5" 
      strokeLinejoin="round" 
    />
    <line x1="32" y1="23" x2="32" y2="47" stroke="white" strokeWidth="3" />
    <defs>
      <linearGradient id="abGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF9F0A" />
        <stop offset="1" stopColor="#E67E00" />
      </linearGradient>
    </defs>
  </svg>
);

export const HyperDriverAppIcon = ({ size = 56, isOnline = true }: { size?: number; isOnline?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="16" fill="#0C0E14" />
    <rect x="2" y="2" width="60" height="60" rx="14" stroke="url(#hdStroke)" strokeWidth="2" opacity="0.6" />
    {/* Car Silhouette */}
    <path 
      d="M17 38L21 27C21.8 24.8 23.8 23.4 26.2 23.4H37.8C40.2 23.4 42.2 24.8 43 27L47 38M14 38H50C51.5 38 52.5 39.5 52 41L50 46C49.5 47 48.5 48 47 48H17C15.5 48 14.5 47 14 46L12 41C11.5 39.5 12.5 38 14 38Z" 
      stroke="white" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    {/* Wheels */}
    <circle cx="21" cy="46" r="3" fill="#00E5FF" />
    <circle cx="43" cy="46" r="3" fill="#00E5FF" />
    {/* Headlights */}
    <line x1="17" y1="41" x2="23" y2="41" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
    <line x1="41" y1="41" x2="47" y2="41" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
    {/* Online indicator badge */}
    <circle cx="50" cy="14" r="5" fill={isOnline ? "#34C759" : "#8E8E93"} />
    {isOnline && <circle cx="50" cy="14" r="7" stroke="#34C759" strokeWidth="1.5" opacity="0.6" />}
    <defs>
      <linearGradient id="hdStroke" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00E5FF" />
        <stop offset="1" stopColor="#3B82F6" />
      </linearGradient>
    </defs>
  </svg>
);

// Wallpaper options for CarPlay
const CARPLAY_WALLPAPERS = [
  { id: 'dark_mesh', name: 'Dark Nebula', bg: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/70 via-[#0B0D14] to-[#050608]' },
  { id: 'slate_ocean', name: 'Ocean Depth', bg: 'bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-950/60 via-[#090C15] to-[#040507]' },
  { id: 'midnight_purple', name: 'Midnight Violet', bg: 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-950/60 via-[#0C0A14] to-[#050508]' },
  { id: 'pure_dark', name: 'Obsidian Minimal', bg: 'bg-[#07080A]' }
];

export const CarPlayDashboard: React.FC<CarPlayDashboardProps> = ({
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
  // Navigation view: 'dashboard' (multi-window split view), 'apps' (Apple CarPlay home app grid), or 'full_map'
  const [activeCarPlayView, setActiveCarPlayView] = useState<'dashboard' | 'apps' | 'full_map'>('dashboard');
  const [selectedWallpaper, setSelectedWallpaper] = useState('dark_mesh');
  const [activeModalApp, setActiveModalApp] = useState<'none' | 'phone' | 'messages' | 'calendar' | 'settings'>('none');
  const [editingRoom, setEditingRoom] = useState(carPlayRoomCode);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);

  // Time & Date strings formatted like Apple CarPlay
  const [nowDate, setNowDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNowDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = nowDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(' AM', '').replace(' PM', '');
  const dayStr = nowDate.toLocaleDateString([], { weekday: 'short' }).toUpperCase();
  const dateStr = nowDate.getDate().toString();

  const activeOrder = activeOrders[0];

  const milesStr = activeOrder && distanceToTarget
    ? distanceToTarget(activeOrder)
    : lastSyncedDestination?.miles || (activeOrder ? activeOrder.estimatedDistance.toFixed(1) : '0.0');
  const milesNum = parseFloat(milesStr) || 0;
  const minsVal = activeOrder
    ? Math.max(1, Math.ceil(milesNum * 3))
    : lastSyncedDestination?.minutes || 3;

  const isPickupStage = !activeOrder || activeOrder.status === 'accepted' || activeOrder.status === 'en_route_to_pickup' || activeOrder.status === 'arriving' || activeOrder.status === 'arrived' || activeOrder.status === 'scanning_receipt';
  const targetTitle = activeOrder
    ? (isPickupStage ? `Pickup: ${activeOrder.restaurantName || 'Pickup Point'}` : `Dropoff: ${activeOrder.customerName || 'Customer'}`)
    : busyAreaTarget
    ? `Surge Zone: ${busyAreaTarget.name}`
    : lastSyncedDestination?.label || 'Ready to Navigate';

  const targetSubtitle = activeOrder
    ? (isPickupStage ? (activeOrder.restaurantName ? `Pickup collection from ${activeOrder.restaurantName}` : 'Proceed to restaurant collection point') : (activeOrder.customerName ? `Delivery dropoff for ${activeOrder.customerName}` : 'Proceed to delivery dropoff point'))
    : lastSyncedDestination?.subtitle || 'Tap any trip on your iPad or enter a destination';

  // Pay rate calculation for pending job
  const pendingPayRate = pendingOrder
    ? calculatePayRate(pendingOrder.estimatedPay, pendingOrder.estimatedDistance)
    : null;
  const isPendingDouble = !!(pendingOrder?.isStacked || (pendingOrder?.batchCount && pendingOrder.batchCount > 1));
  const isPendingDelivery = pendingOrder?.type === 'delivery';
  const pendingPickupDistance = pendingOrder ? (pendingOrder.estimatedDistance * 0.4).toFixed(1) : '0.8';
  const pendingPickupMinutes = pendingOrder ? Math.max(1, Math.ceil(parseFloat(pendingPickupDistance) * 3)) : 3;

  const activeWallpaperObj = CARPLAY_WALLPAPERS.find(w => w.id === selectedWallpaper) || CARPLAY_WALLPAPERS[0];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className={`fixed inset-0 z-[5000] ${activeWallpaperObj.bg} text-white flex flex-col font-sans select-none overflow-hidden`}
    >
      {/* =========================================================================
          TOP CARPLAY SYSTEM BAR: Discreet In-Car Header & Controls
          ========================================================================= */}
      <div className="h-10 bg-black/60 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between px-4 sm:px-6 shrink-0 z-40 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CARPLAY CONNECTED</span>
          </div>

          <div className="h-3 w-px bg-white/20 hidden sm:block" />

          {/* Online Toggle Button */}
          <button
            onClick={() => onToggleOnline && onToggleOnline()}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              user.isOnline 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30' 
                : 'bg-white/10 text-gray-400 border border-white/10 hover:bg-white/15'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
            <span>{user.isOnline ? "ONLINE • Scanning" : "OFFLINE"}</span>
          </button>

          {/* Today's Earnings */}
          <span className="hidden md:inline-flex items-center text-[11px] font-bold text-gray-300 font-mono">
            Today: <span className="text-emerald-400 ml-1">£{todayEarningsTotal.toFixed(2)}</span>
          </span>

          {/* Cross-device link */}
          <span className="hidden lg:inline-flex text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
            Room: <span className="text-amber-400 font-mono ml-1">{carPlayRoomCode}</span> • {isCarPlayRemoteMode ? 'PC Display' : 'iPad Controller'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Dispatch Demo Trigger */}
          {onTriggerTestJob && (
            <button
              onClick={() => onTriggerTestJob()}
              className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1 shadow-sm active:scale-95"
              title="Test incoming rideshare job request card"
            >
              <Bell size={11} className="text-purple-300" />
              <span>Simulate Job 🔔</span>
            </button>
          )}

          {/* Exit / Return */}
          <button 
            onClick={() => onClose()}
            className="px-3 py-1 bg-white/10 hover:bg-red-500/30 hover:border-red-500/50 hover:text-red-300 border border-white/15 text-gray-300 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all"
          >
            Exit CarPlay
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN CARPLAY DISPLAY (Authentic Left Dock + High-Fidelity Canvas)
          ========================================================================= */}
      <div className="flex-1 flex min-h-0 relative">
        {/* =====================================================================
            LEFT CARPLAY DOCK (Pixel-Perfect Apple CarPlay Dock)
            Contains:
            1. Digital Clock & Signal Bar Stack (4 bars + 5G + Location)
            2. 3 Recent Apple CarPlay Squircles (Maps, Music, Phone / Hyper Driver)
            3. Authentic CarPlay Home/Dashboard Toggle Button
            ===================================================================== */}
        <div className="w-[74px] sm:w-[84px] bg-[#0c0d12]/90 backdrop-blur-3xl flex flex-col items-center py-3.5 justify-between border-r border-white/10 shrink-0 z-30 select-none">
          {/* Top: Authentic Apple CarPlay Status Stack */}
          <div className="flex flex-col items-center gap-1">
            {/* Bold Time */}
            <span className="text-[15px] sm:text-base font-bold tracking-tight text-white font-sans">
              {timeStr}
            </span>

            {/* Apple 4-bar cellular signal bars + 5G */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex items-end gap-[2px] h-3">
                <div className="w-[3px] h-[3.5px] bg-white rounded-[1px]" />
                <div className="w-[3px] h-[6px] bg-white rounded-[1px]" />
                <div className="w-[3px] h-[8.5px] bg-white rounded-[1px]" />
                <div className="w-[3px] h-[11px] bg-white rounded-[1px]" />
              </div>
              <span className="text-[9px] font-bold text-white tracking-tighter">5G</span>
            </div>

            {/* Location Arrow Indicator */}
            <div className="text-cyan-400 mt-0.5" title="Location Services Active">
              <Navigation size={10} className="fill-cyan-400 rotate-45" />
            </div>
          </div>

          {/* Center: 3 Apple CarPlay Recent App Squircles */}
          <div className="flex flex-col items-center gap-3.5 my-auto">
            {/* App 1: Apple Maps / Hyper Navigation */}
            <button
              onClick={() => {
                setActiveCarPlayView('dashboard');
                setActiveModalApp('none');
              }}
              className="group relative transition-transform active:scale-90 cursor-pointer"
              title="Maps & Navigation"
            >
              <div className={`transition-all rounded-[17px] ${
                activeCarPlayView === 'dashboard' ? 'ring-2 ring-white/60 shadow-lg shadow-blue-500/20' : 'opacity-90 hover:opacity-100'
              }`}>
                <AppleMapsIcon size={52} />
              </div>
            </button>

            {/* App 2: Apple Music / Now Playing */}
            <button
              onClick={() => {
                // If on dashboard, toggle view or modal
                setActiveCarPlayView('dashboard');
                setActiveModalApp('none');
              }}
              className="group relative transition-transform active:scale-90 cursor-pointer"
              title="Apple Music"
            >
              <div className="transition-all rounded-[17px] opacity-95 hover:opacity-100">
                <AppleMusicIcon size={52} />
              </div>
            </button>

            {/* App 3: Hyper Driver / Rideshare Dispatch */}
            <button
              onClick={() => {
                setActiveCarPlayView('dashboard');
                setActiveModalApp('none');
              }}
              className="group relative transition-transform active:scale-90 cursor-pointer"
              title="Hyper Driver"
            >
              <div className="transition-all rounded-[17px] opacity-95 hover:opacity-100">
                <HyperDriverAppIcon size={52} isOnline={user.isOnline} />
              </div>
            </button>
          </div>

          {/* Bottom: The Iconic Apple CarPlay Home / Dashboard Switcher */}
          <button
            onClick={() => {
              if (activeCarPlayView === 'apps') {
                setActiveCarPlayView('dashboard');
              } else {
                setActiveCarPlayView('apps');
              }
              setActiveModalApp('none');
            }}
            className="w-12 h-12 rounded-[16px] bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center transition-all cursor-pointer border border-white/10 shadow-md group"
            title={activeCarPlayView === 'apps' ? 'Switch to CarPlay Multi-Window Dashboard' : 'Switch to CarPlay App Grid'}
          >
            {activeCarPlayView === 'apps' ? (
              /* When in App Grid, show the Multi-Window Dashboard icon (1 rect on left + 2 stacked rects on right) */
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-6 bg-white rounded-[3px] shadow-sm" />
                <div className="flex flex-col gap-1">
                  <div className="w-3.5 h-2.5 bg-white rounded-[2px] shadow-sm" />
                  <div className="w-3.5 h-2.5 bg-white rounded-[2px] shadow-sm" />
                </div>
              </div>
            ) : (
              /* When in Dashboard, show the Apple CarPlay 8-dot/squircle Home Grid icon (3x3 grid) */
              <div className="grid grid-cols-3 gap-1">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-white rounded-[2px] shadow-sm" />
                ))}
              </div>
            )}
          </button>
        </div>

        {/* =====================================================================
            VIEW 1: APPLE CARPLAY APP GRID (Home Screen with Authentic App Icons)
            ===================================================================== */}
        {activeCarPlayView === 'apps' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col justify-between p-6 sm:p-10 relative overflow-y-auto"
          >
            {/* Apple CarPlay Apps Grid */}
            <div className="max-w-4xl mx-auto w-full grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 gap-y-7 gap-x-4 sm:gap-x-8 pt-4">
              {/* 1. Phone */}
              <button 
                onClick={() => setActiveModalApp('phone')}
                className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
              >
                <div className="transition-transform group-hover:scale-105 group-active:scale-95 shadow-xl rounded-[18px]">
                  <ApplePhoneIcon size={64} />
                </div>
                <span className="text-xs font-semibold text-white tracking-tight">Phone</span>
              </button>

              {/* 2. Apple Music */}
              <button 
                onClick={() => setActiveCarPlayView('dashboard')}
                className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
              >
                <div className="transition-transform group-hover:scale-105 group-active:scale-95 shadow-xl rounded-[18px]">
                  <AppleMusicIcon size={64} />
                </div>
                <span className="text-xs font-semibold text-white tracking-tight">Music</span>
              </button>

              {/* 3. Apple Maps */}
              <button 
                onClick={() => setActiveCarPlayView('dashboard')}
                className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
              >
                <div className="transition-transform group-hover:scale-105 group-active:scale-95 shadow-xl rounded-[18px]">
                  <AppleMapsIcon size={64} />
                </div>
                <span className="text-xs font-semibold text-white tracking-tight">Maps</span>
              </button>

              {/* 4. Messages */}
              <button 
                onClick={() => setActiveModalApp('messages')}
                className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
              >
                <div className="transition-transform group-hover:scale-105 group-active:scale-95 shadow-xl rounded-[18px]">
                  <AppleMessagesIcon size={64} />
                </div>
                <span className="text-xs font-semibold text-white tracking-tight">Messages</span>
              </button>

              {/* 5. Now Playing */}
              <button 
                onClick={() => setActiveCarPlayView('dashboard')}
                className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
              >
                <div className="transition-transform group-hover:scale-105 group-active:scale-95 shadow-xl rounded-[18px]">
                  <AppleNowPlayingIcon size={64} />
                </div>
                <span className="text-xs font-semibold text-white tracking-tight">Now Playing</span>
              </button>

              {/* 6. Hyper Driver / Rideshare App */}
              <button 
                onClick={() => setActiveCarPlayView('dashboard')}
                className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
              >
                <div className="transition-transform group-hover:scale-105 group-active:scale-95 shadow-xl rounded-[18px]">
                  <HyperDriverAppIcon size={64} isOnline={user.isOnline} />
                </div>
                <span className="text-xs font-semibold text-white tracking-tight">Hyper Driver</span>
              </button>

              {/* 7. Podcasts */}
              <button 
                onClick={() => setActiveCarPlayView('dashboard')}
                className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
              >
                <div className="transition-transform group-hover:scale-105 group-active:scale-95 shadow-xl rounded-[18px]">
                  <ApplePodcastsIcon size={64} />
                </div>
                <span className="text-xs font-semibold text-white tracking-tight">Podcasts</span>
              </button>

              {/* 8. Calendar */}
              <button 
                onClick={() => setActiveModalApp('calendar')}
                className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
              >
                <div className="transition-transform group-hover:scale-105 group-active:scale-95 shadow-xl rounded-[18px]">
                  <AppleCalendarIcon size={64} day={dayStr} date={dateStr} />
                </div>
                <span className="text-xs font-semibold text-white tracking-tight">Calendar</span>
              </button>

              {/* 9. Settings */}
              <button 
                onClick={() => setActiveModalApp('settings')}
                className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
              >
                <div className="transition-transform group-hover:scale-105 group-active:scale-95 shadow-xl rounded-[18px]">
                  <AppleSettingsIcon size={64} />
                </div>
                <span className="text-xs font-semibold text-white tracking-tight">Settings</span>
              </button>

              {/* 10. Audiobooks */}
              <button 
                onClick={() => setActiveCarPlayView('dashboard')}
                className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
              >
                <div className="transition-transform group-hover:scale-105 group-active:scale-95 shadow-xl rounded-[18px]">
                  <AppleAudiobooksIcon size={64} />
                </div>
                <span className="text-xs font-semibold text-white tracking-tight">Audiobooks</span>
              </button>
            </div>

            {/* Apple CarPlay Page Dots */}
            <div className="flex items-center justify-center gap-2 py-4">
              <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
              <span className="w-2 h-2 rounded-full bg-white/30" />
            </div>
          </motion.div>
        )}

        {/* =====================================================================
            VIEW 2: APPLE CARPLAY DASHBOARD (Authentic Multi-Window Split View)
            Left: Interactive Navigation Map with Turn-by-Turn Header & Controls
            Right: Stacked Widgets (Navigation Guidance + Now Playing Card)
            ===================================================================== */}
        {activeCarPlayView !== 'apps' && (
          <div className="flex-1 flex gap-3.5 p-3.5 min-h-0 relative overflow-hidden">
            {/* -------------------------------------------------------------
                LEFT PANEL: Large CarPlay Navigation Map (~60% of viewport)
                ------------------------------------------------------------- */}
            <div className={`relative ${
              activeCarPlayView === 'full_map' ? 'flex-1' : 'flex-[1.5]'
            } rounded-[28px] overflow-hidden border border-white/15 shadow-2xl bg-[#090b10] min-h-0`}>
              {/* The Live Interactive Map */}
              <div className="absolute inset-0 w-full h-full">
                {mapNode}
              </div>

              {/* FLOATING TOP-LEFT: Apple Maps Turn-by-Turn Card */}
              <div className="absolute top-3.5 left-3.5 right-3.5 sm:right-auto sm:w-[360px] z-[3600] pointer-events-auto">
                <div className="bg-[#121318]/90 backdrop-blur-2xl border border-white/15 rounded-[22px] p-3.5 shadow-2xl text-white">
                  <div className="flex items-center gap-3">
                    {/* Big Bold Turn Maneuver Arrow */}
                    <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 shadow-lg ${
                      isNavigating || activeOrder
                        ? 'bg-[#34C759] text-black font-black' 
                        : 'bg-[#007AFF] text-white'
                    }`}>
                      <Navigation size={26} className={isNavigating ? 'rotate-90' : 'rotate-45'} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                          {isNavigating ? 'IN 300 FT' : 'NEXT STEP'}
                        </span>
                        {(activeOrder || lastSyncedDestination) && (
                          <span className="text-[11px] font-mono text-amber-300 font-bold">
                            {milesStr} mi • {minsVal} min
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold tracking-tight text-white truncate mt-0.5">
                        {targetTitle}
                      </h3>
                      <p className="text-[11px] text-gray-300 truncate">
                        {targetSubtitle}
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Navigation Buttons */}
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/10">
                    <button
                      onClick={() => {
                        if (setIsNavigating) setIsNavigating(!isNavigating);
                        if (!isNavigating && onTriggerNavigateSync) onTriggerNavigateSync();
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isNavigating
                          ? 'bg-[#FF9F0A] text-black'
                          : 'bg-[#007AFF] hover:bg-blue-500 text-white shadow-md'
                      }`}
                    >
                      <Navigation size={13} />
                      <span>{isNavigating ? 'Route Active (Sync On)' : 'Start Route Guidance'}</span>
                    </button>

                    {activeOrder && handleNextStep && (
                      <button
                        onClick={() => handleNextStep(activeOrder.id)}
                        className="py-2 px-3.5 rounded-xl font-bold text-xs bg-[#34C759] hover:bg-emerald-400 text-black transition-all cursor-pointer"
                      >
                        {isPickupStage ? 'Arrived at Pickup' : 'Complete Trip'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* FLOATING BOTTOM-LEFT: Authentic Circular Speed Limit Sign */}
              <div className="absolute bottom-4 left-4 z-[3500] pointer-events-none flex items-center gap-2">
                <div className="w-11 h-11 rounded-full bg-white border-[3.5px] border-[#FF3B30] flex flex-col items-center justify-center shadow-lg text-black pointer-events-auto">
                  <span className="text-[7px] font-black leading-none uppercase">SPEED</span>
                  <span className="text-base font-black leading-none font-sans">30</span>
                </div>

                <div className="px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 flex items-center gap-2 pointer-events-auto">
                  <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
                  <span className="text-[11px] font-bold text-white tracking-tight">
                    {user.isOnline ? "Scanning for Trips" : "Driver Offline"}
                  </span>
                </div>
              </div>

              {/* FLOATING BOTTOM-RIGHT: CarPlay Map Controls (Voice Mute + Full Map Toggle) */}
              <div className="absolute bottom-4 right-4 z-[3500] flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={() => setIsVoiceMuted(!isVoiceMuted)}
                  className="w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all cursor-pointer shadow-md"
                  title={isVoiceMuted ? "Unmute Voice Navigation" : "Mute Voice Navigation"}
                >
                  {isVoiceMuted ? <VolumeX size={17} className="text-red-400" /> : <Volume2 size={17} />}
                </button>

                <button
                  onClick={() => setActiveCarPlayView(prev => prev === 'full_map' ? 'dashboard' : 'full_map')}
                  className="w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all cursor-pointer shadow-md"
                  title={activeCarPlayView === 'full_map' ? 'Return to Split View' : 'Expand Full Map'}
                >
                  {activeCarPlayView === 'full_map' ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                </button>
              </div>

              {/* =============================================================
                  INCOMING RIDESHARE JOB REQUEST CARD OVERLAY (UBER CARPLAY STYLE)
                  ============================================================= */}
              <AnimatePresence>
                {pendingOrder && (
                  <motion.div
                    key={`carplay-job-request-${pendingOrder.id}`}
                    initial={{ opacity: 0, scale: 0.94, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 30 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 260 }}
                    className="absolute top-4 right-4 bottom-4 w-[calc(100%-32px)] sm:w-[420px] max-w-full z-[4200] flex flex-col pointer-events-auto"
                  >
                    <div className="flex-1 bg-[#12131a]/95 backdrop-blur-3xl border-2 border-white/20 rounded-[28px] p-5 shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col justify-between text-white overflow-hidden relative">
                      <div>
                        {/* Top Trip Pills & Decline */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Service badge */}
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold text-xs bg-black text-white border border-white/20">
                              {isPendingDelivery ? (
                                <>
                                  <Utensils size={13} className="text-emerald-400" />
                                  <span>{pendingOrder.brand === 'hyper' ? 'Hyper Eats' : 'Uber Eats'}</span>
                                </>
                              ) : (
                                <>
                                  <CarIcon size={13} className="text-blue-400" />
                                  <span>{pendingOrder.restaurantName || (pendingOrder.brand === 'hyper' ? 'Hyper Ride' : 'UberX')}</span>
                                </>
                              )}
                            </div>

                            {/* Customer Rating */}
                            <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-300 border border-white/10">
                              <Star size={11} fill="#eab308" className="text-yellow-500" />
                              <span>4.96</span>
                            </div>

                            {/* Surge pill */}
                            {pendingOrder.surge ? (
                              <span className="px-2 py-0.5 rounded-xl text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                <Flame size={11} className="text-amber-400" />
                                <span>+£{(pendingOrder.surge * 2.2).toFixed(2)} Surge</span>
                              </span>
                            ) : null}
                          </div>

                          {/* Close / Decline X */}
                          <button
                            onClick={() => onDeclineOrder && onDeclineOrder()}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center cursor-pointer active:scale-90 transition-all border border-white/10"
                            title="Decline Job"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* Large Payout Display */}
                        <div className="flex items-baseline justify-between mb-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Guaranteed Fare</span>
                            <h2 className="text-4xl font-extrabold tracking-tight text-white font-sans leading-none mt-0.5">
                              £{pendingOrder.estimatedPay.toFixed(2)}
                            </h2>
                          </div>
                          {pendingPayRate && (
                            <div className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${pendingPayRate.color}`}>
                              <span>{pendingPayRate.icon}</span> <span>{pendingPayRate.label}</span>
                            </div>
                          )}
                        </div>

                        {/* Distance & Time details */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl mb-3 text-xs font-medium text-gray-300">
                          <span className="text-emerald-400 font-bold">{pendingPickupMinutes} min away ({pendingPickupDistance} mi)</span>
                          <span className="text-gray-500">•</span>
                          <span>Total: {pendingOrder.estimatedTime} min ({pendingOrder.estimatedDistance.toFixed(1)} mi)</span>
                        </div>

                        {/* Route Stops */}
                        <div className="pl-4 space-y-3 my-2 border-l-2 border-dashed border-white/20 ml-2">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                              {isPendingDelivery ? 'Pickup' : 'Pickup Point'}
                            </p>
                            <h4 className="text-xs font-bold text-white truncate">
                              {pendingOrder.restaurantName || "High St Collection"}
                            </h4>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                              {isPendingDelivery ? 'Dropoff' : 'Destination'}
                            </p>
                            <h4 className="text-xs font-bold text-white truncate">
                              {pendingOrder.customerName || "Customer Destination"}
                            </h4>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons with countdown progress bar */}
                      <div className="space-y-2.5 pt-3 border-t border-white/10 shrink-0">
                        {/* Countdown bar */}
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            key={`carplay-timer-${pendingOrder.id}`}
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: orderExpiryTimer, ease: 'linear' }}
                            className={`h-full rounded-full ${
                              orderExpiryTimer <= 5 ? 'bg-red-500' : 'bg-[#34C759]'
                            }`}
                          />
                        </div>

                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => onDeclineOrder && onDeclineOrder()}
                            className="h-12 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs uppercase cursor-pointer transition-all active:scale-95"
                          >
                            Decline
                          </button>

                          <button
                            onClick={() => onAcceptOrder && onAcceptOrder()}
                            disabled={isMatchingLoading || isMatchFailed}
                            className={`h-12 flex-1 rounded-xl font-bold text-sm uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer ${
                              isMatchingLoading
                                ? 'bg-emerald-600/50 text-white'
                                : 'bg-[#34C759] hover:bg-emerald-400 text-black shadow-emerald-500/20'
                            }`}
                          >
                            {isMatchingLoading ? (
                              <span>Matching...</span>
                            ) : isMatchFailed ? (
                              <span>Taken by another driver</span>
                            ) : (
                              <>
                                <Check size={18} className="stroke-[3]" />
                                <span>Accept Match ({orderExpiryTimer}s)</span>
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

            {/* -------------------------------------------------------------
                RIGHT PANEL: Apple CarPlay Multi-Window Stacked Widgets (~40%)
                Top: Navigation / Route Status
                Bottom: Apple CarPlay Now Playing Widget
                ------------------------------------------------------------- */}
            {activeCarPlayView === 'dashboard' && (
              <div className="w-[340px] lg:w-[380px] flex flex-col gap-3.5 shrink-0 min-h-0">
                {/* WIDGET 1: Top Navigation / Driver Route Overview */}
                <div className="bg-[#121318]/85 backdrop-blur-2xl rounded-[24px] p-4 border border-white/12 shadow-xl flex flex-col justify-between shrink-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                        {activeOrder ? 'ACTIVE TRIP' : 'DRIVER ROUTE'}
                      </span>
                      <h4 className="text-base font-bold text-white tracking-tight leading-snug mt-0.5 truncate">
                        {targetTitle}
                      </h4>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {targetSubtitle}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-bold font-mono text-emerald-400">
                        {activeOrder ? `£${activeOrder.estimatedPay.toFixed(2)}` : `£${todayEarningsTotal.toFixed(2)}`}
                      </span>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {milesStr} mi • {minsVal}m
                      </p>
                    </div>
                  </div>

                  {/* Quick Controls */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                    <button
                      onClick={() => onTriggerNavigateSync && onTriggerNavigateSync()}
                      className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Navigation size={12} className="text-cyan-400" />
                      <span>Sync iPad Route</span>
                    </button>

                    <button
                      onClick={() => setActiveModalApp('settings')}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 transition-all cursor-pointer"
                      title="CarPlay Settings"
                    >
                      <Settings size={15} />
                    </button>
                  </div>
                </div>

                {/* WIDGET 2: Apple CarPlay Now Playing Widget */}
                <div className="flex-1 bg-[#121318]/85 backdrop-blur-2xl rounded-[24px] p-4 border border-white/12 shadow-xl flex flex-col justify-between min-h-[170px]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
                      <AppleMusicIcon size={20} />
                      <span>Now Playing</span>
                    </div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">CarPlay Audio</span>
                  </div>

                  {/* Embedded MediaControls styled specifically for CarPlay */}
                  <div className="flex-1 flex flex-col justify-center">
                    <MediaControls isCarPlay={true} theme="dark" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          AUTHENTIC CARPLAY APP MODALS (Phone, Messages, Calendar, Settings)
          ========================================================================= */}
      <AnimatePresence>
        {activeModalApp !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-[#16171F] border border-white/20 rounded-[28px] p-6 shadow-2xl text-white relative overflow-hidden"
            >
              {/* Close Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-3">
                  {activeModalApp === 'phone' && <ApplePhoneIcon size={36} />}
                  {activeModalApp === 'messages' && <AppleMessagesIcon size={36} />}
                  {activeModalApp === 'calendar' && <AppleCalendarIcon size={36} day={dayStr} date={dateStr} />}
                  {activeModalApp === 'settings' && <AppleSettingsIcon size={36} />}
                  <div>
                    <h3 className="text-lg font-bold capitalize">{activeModalApp}</h3>
                    <p className="text-xs text-gray-400">Apple CarPlay Integration</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModalApp('none')}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Contents */}
              {activeModalApp === 'phone' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-300">Speed Dial & Driver Support Contacts:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-left flex items-center gap-3 transition-all cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-[#34C759] flex items-center justify-center text-white">
                        <Phone size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">Rider / Customer</h4>
                        <p className="text-[11px] text-gray-400">Direct In-App Call</p>
                      </div>
                    </button>

                    <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-left flex items-center gap-3 transition-all cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <Phone size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">Dispatch Support</h4>
                        <p className="text-[11px] text-gray-400">24/7 Priority Driver Line</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {activeModalApp === 'messages' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-300">Customer Messages & Dispatch Alerts:</p>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="font-bold text-white">Customer (Active Job)</span>
                      <span>Just now</span>
                    </div>
                    <p className="text-sm text-gray-200">
                      "I'm waiting by the main lobby entrance. Thank you!"
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Quick reply: 'On my way', 'I have arrived'..."
                      className="flex-1 bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                    />
                    <button className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold transition-all cursor-pointer">
                      Send
                    </button>
                  </div>
                </div>
              )}

              {activeModalApp === 'calendar' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-300">Driver Schedule & Scheduled Pre-Bookings:</p>
                  <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-purple-400">Scheduled Booking • 14:00</span>
                      <h4 className="text-sm font-bold text-white">Heathrow Airport Terminal 5 Transfer</h4>
                      <p className="text-xs text-gray-400">Guaranteed fare: £48.50</p>
                    </div>
                    <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full font-bold">
                      Confirmed
                    </span>
                  </div>
                </div>
              )}

              {activeModalApp === 'settings' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-2">CarPlay Wallpaper:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {CARPLAY_WALLPAPERS.map((wp) => (
                        <button
                          key={wp.id}
                          onClick={() => setSelectedWallpaper(wp.id)}
                          className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer border ${
                            selectedWallpaper === wp.id
                              ? 'bg-blue-600/30 border-blue-400 text-white'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          <span>{wp.name}</span>
                          {selectedWallpaper === wp.id && <Check size={14} className="text-blue-400" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10">
                    <label className="text-xs font-bold text-gray-300 block mb-1">iPad ⇄ PC Sync Room Code:</label>
                    <div className="flex items-center gap-2">
                      <input 
                        value={editingRoom}
                        onChange={(e) => setEditingRoom(e.target.value.toUpperCase())}
                        className="bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-sm font-mono font-bold text-amber-400 outline-none uppercase w-28 text-center"
                        maxLength={8}
                      />
                      <button
                        onClick={() => setCarPlayRoomCode && setCarPlayRoomCode(editingRoom.trim() || 'HYPER1')}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Save Code
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CarPlayDashboard;

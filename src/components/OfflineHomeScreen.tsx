import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  List
} from 'lucide-react';
import { UserProfile } from '../types';

interface OfflineHomeScreenProps {
  user: UserProfile;
  activeCityKey: string;
  onGoOnline: () => void;
  onOpenPreferences: () => void;
  onOpenOpportunities: () => void;
  onOpenSafetyToolkit: () => void;
  onOpenSearch: () => void;
  onOpenLayers?: () => void;
  onOpenMap?: () => void;
  activeSurgeAreas?: any[];
  theme?: 'light' | 'dark';
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
  activeSurgeAreas = [],
  theme = 'light'
}) => {
  const [selectedOpportunityTab, setSelectedOpportunityTab] = useState<'all' | 'promos' | 'quests' | 'streaks' | 'airports'>('all');

  return (
    <div className="relative w-full h-full bg-white text-neutral-900 flex flex-col overflow-hidden select-none font-sans">
      {/* Top Header Navigation Overlay */}
      <div className="shrink-0 pt-10 px-5 pb-3 flex justify-between items-center bg-white border-b border-gray-100 z-20">
        <button 
          onClick={onOpenSafetyToolkit}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-blue-600 transition-colors active:scale-95"
          title="Safety Toolkit"
        >
          <Shield size={20} className="fill-blue-600/10" />
        </button>

        <div className="flex items-center gap-2">
          {onOpenLayers && (
            <button 
              onClick={onOpenLayers}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-700 transition-colors active:scale-95"
              title="Map Layers"
            >
              <Layers size={18} />
            </button>
          )}
          <button 
            onClick={onOpenSearch}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-700 transition-colors active:scale-95"
            title="Search Destination"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Main Scrollable Offline Home Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pt-4 pb-28 space-y-6">
        
        {/* 1. Status Section ("You're offline" + "Ready to go?") */}
        <div>
          <button 
            onClick={onOpenPreferences}
            className="group text-left w-full focus:outline-none"
          >
            <div className="flex items-center justify-between">
              <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                You're offline
              </h1>
              <div className="p-2 bg-gray-100 rounded-full group-hover:bg-blue-50 transition-colors">
                <SlidersHorizontal size={18} className="text-gray-600 group-hover:text-blue-600" />
              </div>
            </div>
            <p className="text-base font-bold text-gray-500 mt-1">
              Ready to go?
            </p>
          </button>
          <p className="text-xs text-gray-400 mt-1 font-medium leading-relaxed">
            When offline, you won't receive trip requests. Configure preferences or tap below to go online.
          </p>
        </div>

        {/* 2. Mini Map Preview Card */}
        <div 
          onClick={() => {
            if (onOpenMap) onOpenMap();
            else onGoOnline();
          }}
          className="relative w-full rounded-3xl overflow-hidden border border-gray-200 shadow-md bg-neutral-900 min-h-[220px] flex flex-col justify-between p-4 group cursor-pointer hover:shadow-lg transition-all active:scale-[0.99]"
        >
          {/* Simulated Map Background Canvas styling */}
          <div className="absolute inset-0 bg-[#e5e3df] opacity-95">
            {/* Grid street outlines */}
            <svg className="absolute inset-0 w-full h-full opacity-35" stroke="#94a3b8" strokeWidth="2">
              <path d="M -50 40 L 400 120 M -50 140 L 400 220 M 120 -50 L 180 300 M 280 -50 L 220 300" />
              <path d="M -20 200 Q 150 50 350 220" fill="none" stroke="#64748b" strokeWidth="4" />
            </svg>

            {/* Heatmap zones */}
            <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-red-500/35 rounded-full blur-xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/3 w-28 h-28 bg-orange-500/35 rounded-full blur-xl" />

            {/* Wait-Time Badges on Mini Map */}
            <div className="absolute top-1/2 left-8 -translate-y-1/2 bg-red-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1 border border-white">
              <Flame size={10} className="fill-white" />
              <span>1–16 min</span>
            </div>

            <div className="absolute bottom-6 right-12 bg-orange-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1 border border-white">
              <Clock size={10} />
              <span>2–21 min</span>
            </div>

            {/* Driver position marker */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="w-9 h-9 bg-white rounded-full shadow-xl border-2 border-black flex items-center justify-center">
                <Navigation size={18} className="text-black fill-black" style={{ transform: 'rotate(45deg)' }} />
              </div>
            </div>
          </div>

          {/* Top Pill Overlay */}
          <div className="relative z-10 flex justify-between items-center">
            <span className="bg-white/90 backdrop-blur-md text-neutral-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm border border-gray-200/50 flex items-center gap-1.5">
              <MapPin size={11} className="text-blue-600" />
              {activeCityKey} Area Demand
            </span>
            <button 
              onClick={onGoOnline}
              className="w-8 h-8 rounded-full bg-white text-black shadow-md flex items-center justify-center active:scale-90 transition-transform"
              title="Focus map"
            >
              <Play size={14} className="fill-black ml-0.5" />
            </button>
          </div>

          {/* Bottom Caption Overlay */}
          <div className="relative z-10 mt-24 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <div>
                <p className="text-xs font-black text-neutral-900 leading-tight">High Demand Zone Nearby</p>
                <p className="text-[10px] font-bold text-gray-500">Estimated waiting time: 1–16 mins</p>
              </div>
            </div>
            <span className="text-xs font-black text-blue-600">Explore</span>
          </div>
        </div>

        {/* 3. Opportunities Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
              Opportunities
            </h2>
            <button 
              onClick={onOpenOpportunities}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-neutral-800 transition-colors active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Featured Promotion Card (Matching Uber Reference Screenshot) */}
          <div className="bg-neutral-900 text-white rounded-3xl p-5 shadow-xl space-y-4 border border-neutral-800 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2 text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest">Promotion</span>
            </div>

            <div>
              <h3 className="text-xl font-black tracking-tight leading-snug text-white">
                Extra £8.50 per active hour from 3 PM – 4 PM
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Active trip boost valid in {activeCityKey}. Earnings automatically added upon trip completion.
              </p>
            </div>

            {/* Embedded Go Online Button */}
            <button 
              onClick={onGoOnline}
              className="w-full py-4 bg-[#1f52e3] hover:bg-blue-600 text-white rounded-2xl font-black text-base uppercase tracking-wider shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Navigation size={18} className="fill-white" style={{ transform: 'rotate(45deg)' }} />
              <span>Go Online</span>
            </button>
          </div>

          {/* Quest Bonus Card */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-3xl p-5 space-y-3 hover:border-gray-300 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-600">
                <Award size={16} />
                <span className="text-xs font-black uppercase tracking-wider">Quest Bonus</span>
              </div>
              <span className="text-xs font-extrabold text-gray-400 font-mono">18 / 40 Trips</span>
            </div>

            <h4 className="text-base font-black text-neutral-900">
              Complete 40 trips • Earn extra £120.00
            </h4>

            {/* Quest Progress Bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-purple-600 rounded-full w-[45%]" />
            </div>
            <p className="text-[11px] font-bold text-gray-500">22 trips remaining to unlock bonus payout.</p>
          </div>

          {/* Consecutive Trip Streak Card */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-3xl p-5 flex items-center justify-between hover:border-gray-300 transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-600">
                <Zap size={15} className="fill-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider">Streak Reward</span>
              </div>
              <h4 className="text-base font-black text-neutral-900">
                Complete 3 trips in a row
              </h4>
              <p className="text-xs font-bold text-gray-500">Earn an extra £15.00 on your series.</p>
            </div>
            <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl font-black text-amber-600 text-sm whitespace-nowrap">
              +£15.00
            </div>
          </div>

          {/* Airport Queue Opportunity */}
          <div 
            onClick={onOpenOpportunities}
            className="bg-blue-50/70 border border-blue-200 rounded-3xl p-5 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-all"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-600">
                <Plane size={16} />
                <span className="text-xs font-black uppercase tracking-wider">Airport Queue</span>
              </div>
              <h4 className="text-base font-black text-neutral-900">
                LHR Airport Queue Active
              </h4>
              <p className="text-xs font-bold text-gray-500">32 drivers in queue • Short wait time estimated.</p>
            </div>
            <ChevronRight size={20} className="text-blue-600 shrink-0" />
          </div>

        </div>

      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
        <button 
          onClick={onGoOnline}
          className="w-full py-4 bg-[#1f52e3] hover:bg-blue-600 text-white rounded-full font-black text-lg uppercase tracking-wider shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Navigation size={22} className="fill-white" style={{ transform: 'rotate(45deg)' }} />
          <span>Go Online</span>
        </button>
      </div>
    </div>
  );
};

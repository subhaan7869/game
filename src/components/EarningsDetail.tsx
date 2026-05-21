import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, History, Briefcase, Clock, Star, DollarSign, MapPin, Zap, 
  User, Utensils, Landmark, ArrowRight, RefreshCw, ChevronRight,
  TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { CompletedTrip, UserProfile, AppScreen } from '../types';

export const EarningsDetail = ({ 
  earnings, 
  user, 
  setUser,
  setCurrentScreen, 
  getArrivalTime, 
  setBankBalance, 
  setEarnings, 
  sendNotification, 
  playHyperSound,
  completedTrips,
  theme
}: { 
  earnings: number, 
  user: UserProfile, 
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>,
  setCurrentScreen: (screen: AppScreen) => void,
  getArrivalTime: (mins: number) => string,
  setBankBalance: React.Dispatch<React.SetStateAction<number>>,
  setEarnings: React.Dispatch<React.SetStateAction<number>>,
  sendNotification: (title: string, body: string) => void,
  playHyperSound: (type: 'order' | 'accept' | 'complete') => void,
  completedTrips: CompletedTrip[],
  theme: 'light' | 'dark'
}) => {
  const [page, setPage] = useState(0); // 0: Day, 1: Week, 2: Month, 3: Year
  const [selectedTrip, setSelectedTrip] = useState<CompletedTrip | null>(null);
  const [isCashOutLoading, setIsCashOutLoading] = useState(false);
  const pages = ['Day', 'Week', 'Month', 'Year'];

  // Mock data for the chart
  const weeklyData = [
    { day: 'Mon', amount: 45.20 },
    { day: 'Tue', amount: 52.80 },
    { day: 'Wed', amount: 38.50 },
    { day: 'Thu', amount: 65.40 },
    { day: 'Fri', amount: 89.20 },
    { day: 'Sat', amount: 120.50 },
    { day: 'Sun', amount: 95.10 },
  ];

  const monthlyData = Array.from({ length: 30 }).map((_, i) => ({
    date: i + 1,
    amount: Math.random() * 100 + 20
  }));

  const stats = user.earningsStats || { daily: 0, weekly: 0, monthly: 0, ytd: 0 };

  const currentDisplayAmount = page === 0 ? earnings : 
                               page === 1 ? stats.weekly : 
                               page === 2 ? stats.monthly : stats.ytd;

  const handleCashOut = () => {
    if (earnings <= 0 || isCashOutLoading) return;
    
    setIsCashOutLoading(true);
    playHyperSound('accept');
    
    setTimeout(() => {
      const amount = earnings;
      setBankBalance(prev => prev + amount);
      setEarnings(0);
      setUser(u => ({
        ...u,
        walletBalance: 0,
        earningsStats: {
          ...u.earningsStats!,
          daily: 0
        }
      }));
      setIsCashOutLoading(false);
      sendNotification("Instant Pay Received", `£${amount.toFixed(2)} has been transferred to your bank ending in ...4421`);
      playHyperSound('complete');
    }, 2000);
  };

  if (selectedTrip) {
    const b = selectedTrip.breakdown || { base: 2.50, distancePay: 1.50, timePay: 0.80, surge: 0, tip: 1.20 };

    return (
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className={`absolute inset-0 z-[1100] ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'} flex flex-col`}
      >
        <div className="p-6 pt-12 flex items-center justify-between border-b border-white/5">
          <button onClick={() => setSelectedTrip(null)} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
            <ArrowRight className="rotate-180" size={24} />
          </button>
          <h2 className="font-black text-xl">Trip Details</h2>
          <div className="w-10 h-10" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
          <div className="text-center">
            <p className="text-gray-500 font-black text-xs uppercase tracking-[0.2em] mb-2">{new Date(selectedTrip.timestamp).toLocaleDateString()} • {new Date(selectedTrip.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <h1 className="text-6xl font-black mb-2">£{selectedTrip.earnings.toFixed(2)}</h1>
            <p className="text-blue-500 font-bold mb-6">{selectedTrip.type === 'ride' ? 'HyperX Trip' : 'Delivery Trip'}</p>
          </div>

          <div className={`rounded-[32px] overflow-hidden border-2 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5 shadow-2xl' : 'bg-gray-50 border-gray-100'}`}>
            <div className="p-6 border-b border-white/5">
              <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-6">Earnings Breakdown</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold opacity-70">Base Fare</span>
                  <span className="font-black">£{b.base.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold opacity-70 flex items-center gap-2 italic ml-4">
                    <MapPin size={14} className="opacity-40" /> {selectedTrip.distance.toFixed(1)} miles
                  </span>
                  <span className="font-black">£{b.distancePay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold opacity-70 flex items-center gap-2 italic ml-4">
                    <Clock size={14} className="opacity-40" /> {Math.floor(selectedTrip.distance * 4)} mins
                  </span>
                  <span className="font-black">£{b.timePay.toFixed(2)}</span>
                </div>
                {b.surge > 0 && (
                  <div className="flex justify-between items-center text-orange-500">
                    <span className="font-black flex items-center gap-2">
                       <Zap size={16} fill="currentColor" /> Surge Multiplier
                    </span>
                    <span className="font-black">+£{b.surge.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-green-500 pt-2 border-t border-white/5">
                  <span className="font-black flex items-center gap-2">
                    <Star size={16} fill="currentColor" /> Tip
                  </span>
                  <span className="font-black">+£{b.tip.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className={`p-6 flex justify-between items-center ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
              <span className="text-xl font-black">Total Payout</span>
              <span className="text-3xl font-black text-blue-500">£{selectedTrip.earnings.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Trip Route</h3>
             <div className={`h-40 rounded-[32px] overflow-hidden relative border-2 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5' : 'bg-gray-100 border-gray-100'}`}>
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                   <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,1)]" />
                   <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-green-500 rounded-full" />
                   <svg className="absolute inset-0 w-full h-full">
                      <path d="M100,50 L200,100" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" fill="none" className="opacity-50" />
                   </svg>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                   <div className={`flex-1 p-3 rounded-2xl ${theme === 'dark' ? 'bg-black/40' : 'bg-white/80'} backdrop-blur-md`}>
                      <p className="text-[8px] font-black uppercase opacity-60">Pickup</p>
                      <p className="text-[10px] font-bold truncate">{selectedTrip.restaurantName || "HyperX Pick-up"}</p>
                   </div>
                   <div className={`flex-1 p-3 rounded-2xl ${theme === 'dark' ? 'bg-black/40' : 'bg-white/80'} backdrop-blur-md`}>
                      <p className="text-[8px] font-black uppercase opacity-60">Drop-off</p>
                      <p className="text-[10px] font-bold truncate">{selectedTrip.customerName}</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="space-y-3">
             <button className={`w-full py-4 rounded-2xl font-black text-sm border-2 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                Something went wrong with this trip?
             </button>
             <button className={`w-full py-4 rounded-2xl font-black text-sm border-2 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-100 border-gray-100'}`}>
                View Customer Profile
             </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className={`absolute inset-0 z-[1000] ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'} flex flex-col font-sans`}
    >
      <div className="p-6 pt-12 shrink-0">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setCurrentScreen('home')} className={`w-10 h-10 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'} rounded-full flex items-center justify-center active:scale-90 transition-transform`}>
            <X size={24} />
          </button>
          <h2 className="text-xl font-black tracking-tight">Earnings</h2>
          <div className="w-10 h-10" />
        </div>

        <div className={`flex p-1 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-100 border-gray-200'}`}>
          {pages.map((p, i) => (
            <button 
              key={p}
              onClick={() => setPage(i)}
              className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${page === i ? (theme === 'dark' ? 'bg-white text-black shadow-xl' : 'bg-black text-white shadow-xl') : 'text-gray-500'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <AnimatePresence mode="wait">
          <motion.div 
            key={page}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-6"
          >
            <div className="text-center py-10">
              <p className="text-gray-500 font-black text-xs uppercase tracking-[0.2em] mb-3">{pages[page]} TOTAL</p>
              <h1 className="text-6xl font-black tracking-tighter mb-4">£{currentDisplayAmount.toFixed(2)}</h1>
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-1 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest">
                  <TrendingUp size={12} />
                  +12.4%
                </div>
                <p className="text-gray-500 font-bold text-xs">vs last {pages[page].toLowerCase()}</p>
              </div>
            </div>

            <div className={`h-64 w-full mb-10 rounded-[32px] p-6 border-2 ${theme === 'dark' ? 'bg-[#1a1a1a]/50 border-white/5' : 'bg-gray-50 border-gray-100 shadow-inner'}`}>
               <ResponsiveContainer width="100%" height="100%">
                  {page === 1 ? (
                    <BarChart data={weeklyData}>
                       <defs>
                          <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                             <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                       <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} dy={10} />
                       <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#3b82f6', fontWeight: 900 }} cursor={{ fill: 'transparent' }} />
                       <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="url(#colorEarnings)">
                          {weeklyData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={index === 5 ? '#3b82f6' : theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                          ))}
                       </Bar>
                    </BarChart>
                  ) : (
                    <AreaChart data={monthlyData}>
                       <defs>
                          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis hide />
                       <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fill="url(#areaGradient)" />
                    </AreaChart>
                  )}
               </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-10">
              <div className={`p-4 rounded-[28px] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                <div className="text-blue-500 mb-2 font-black italic"><Briefcase size={16} /></div>
                <p className="text-xl font-black">{page === 0 ? user.deliveriesToday : 24 + page * 12}</p>
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Trips</p>
              </div>
              <div className={`p-4 rounded-[28px] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                <div className="text-purple-500 mb-2 font-black italic"><Clock size={16} /></div>
                <p className="text-xl font-black">{(4.5 + page * 6.2).toFixed(1)}</p>
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Hours</p>
              </div>
              <div className={`p-4 rounded-[28px] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                <div className="text-green-500 mb-2 font-black italic"><Star size={16} /></div>
                <p className="text-xl font-black">{user.rating.toFixed(1)}</p>
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Rating</p>
              </div>
            </div>

            <div className={`rounded-[32px] p-6 border-2 mb-10 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
              <h3 className="text-sm font-black uppercase tracking-widest mb-6">Income Breakdown</h3>
              <div className="space-y-4">
                {[
                  { label: 'Net Fare', amount: currentDisplayAmount * 0.72, color: 'text-blue-500', icon: <DollarSign size={14} /> },
                  { label: 'Wait Time Pay', amount: currentDisplayAmount * 0.08, icon: <Clock size={14} /> },
                  { label: 'Surge & Promotions', amount: currentDisplayAmount * 0.12, color: 'text-orange-500', icon: <Zap size={14} /> },
                  { label: 'Tips (100% yours)', amount: currentDisplayAmount * 0.08, color: 'text-green-500', icon: <Star size={14} /> },
                ].map((item, i) => (
                  <div key={`income-item-${i}`} className="flex justify-between items-center">
                    <div className="flex items-center gap-3 text-sm">
                      <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center ${item.color || 'text-gray-400'}`}>
                        {item.icon}
                      </div>
                      <span className="font-bold opacity-60">{item.label}</span>
                    </div>
                    <span className={`font-black ${item.color || (theme === 'dark' ? 'text-white' : 'text-black')}`}>£{item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-black uppercase tracking-widest">Trip History</h3>
                <button className="text-blue-500 text-xs font-black uppercase">Filter</button>
              </div>
              {completedTrips.length === 0 ? (
                <div className="py-12 text-center bg-white/5 rounded-3xl opacity-50 italic text-sm">No recent activity to show</div>
              ) : (
                completedTrips.slice(0, 10).map((trip, i) => (
                  <motion.div 
                    key={`trip-entry-${trip.id}-${i}`} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-5 rounded-[28px] border transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-gray-100 hover:shadow-lg shadow-black/5'}`}
                    onClick={() => setSelectedTrip(trip)}
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${trip.type === 'ride' ? 'bg-blue-600/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                        {trip.type === 'ride' ? <User size={20} /> : <Utensils size={20} />}
                      </div>
                      <div>
                        <h4 className="font-black text-sm truncate max-w-[120px]">{trip.restaurantName || trip.customerName}</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                           {new Date(trip.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {trip.distance.toFixed(1)} mi
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg">£{trip.earnings.toFixed(2)}</p>
                      <ChevronRight size={14} className="opacity-30 inline ml-1" />
                    </div>
                  </motion.div>
                ))
              )}
              <button className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Load More History</button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={`p-6 pb-10 border-t ${theme === 'dark' ? 'bg-black/80 border-white/10' : 'bg-white/80 border-gray-100'} backdrop-blur-xl shrink-0`}>
        <div className="flex justify-between items-center mb-6 px-2">
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Available to cash out</p>
            <h3 className="text-3xl font-black">£{earnings.toFixed(2)}</h3>
          </div>
          <button className="text-blue-500 font-black flex items-center gap-2 text-sm active:scale-95 transition-transform">
             <Landmark size={18} /> Instant Pay
          </button>
        </div>
        <button 
          onClick={handleCashOut}
          disabled={earnings <= 0 || isCashOutLoading}
          className={`w-full py-5 rounded-[24px] font-black text-xl transition-all shadow-2xl relative overflow-hidden flex items-center justify-center gap-3 ${earnings > 0 ? (theme === 'dark' ? 'bg-white text-black active:scale-95' : 'bg-black text-white active:scale-95') : (theme === 'dark' ? 'bg-white/5 text-gray-600 grayscale' : 'bg-gray-100 text-gray-400 grayscale')}`}
        >
          {isCashOutLoading ? (
            <RefreshCw size={24} className="animate-spin" />
          ) : (
            <>CASH OUT <ArrowRight size={20} /></>
          )}
          {isCashOutLoading && <motion.div layoutId="progress" initial={{ x: '-100%' }} animate={{ x: 0 }} className="absolute inset-0 bg-blue-500/10 pointer-events-none" />}
        </button>
      </div>
    </motion.div>
  );
};

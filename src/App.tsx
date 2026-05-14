/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, ReactNode, Component } from 'react';
import { 
  Navigation, 
  Menu, 
  Search, 
  TrendingUp, 
  Mail, 
  User, 
  MapPin, 
  Clock, 
  DollarSign, 
  ChevronUp, 
  X, 
  Check, 
  ArrowRight,
  Moon,
  Sun,
  Music,
  ShieldCheck,
  Zap,
  Star,
  Coffee,
  Camera,
  FileText,
  CreditCard,
  Landmark,
  Bell,
  Code,
  MessageSquare,
  LogOut,
  Plus,
  Minus,
  HelpCircle,
  Briefcase,
  Gift,
  Settings,
  Edit2,
  Trophy,
  ChevronRight,
  Send,
  Phone,
  RefreshCw,
  Smartphone,
  ShieldAlert,
  Share2,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Play,
  Square,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Globe,
  Heart,
  ShoppingBag,
  Truck,
  Bike,
  Car,
  Utensils,
  SlidersHorizontal,
  List,
  Shield,
  Target,
  ArrowUp,
  ArrowDown,
  History,
  Delete,
  Settings2,
  Bike as BikeIcon,
  Car as CarIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Location, Order, JobType, AppScreen, ChatMessage, UserProfile, UberProTier, ScheduledOrder, CompletedTrip } from './types';
import { auth, db, signInWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

// Mock data for nearby restaurants (UK names)
const MOCK_RESTAURANTS = [
  { name: "Greggs", offset: { lat: 0.002, lng: 0.002 }, busyness: 'High' },
  { name: "Costa Coffee", offset: { lat: -0.001, lng: 0.003 }, busyness: 'Medium' },
  { name: "Nando's", offset: { lat: 0.003, lng: -0.001 }, busyness: 'Low' },
  { name: "Wagamama", offset: { lat: -0.002, lng: -0.002 }, busyness: 'High' },
  { name: "Local Chippy", offset: { lat: 0.001, lng: -0.003 }, busyness: 'Medium' },
  { name: "McDonald's", offset: { lat: 0.004, lng: 0.004 }, busyness: 'High' },
  { name: "Starbucks", offset: { lat: -0.003, lng: 0.005 }, busyness: 'Medium' },
  { name: "Burger King", offset: { lat: 0.005, lng: -0.002 }, busyness: 'Low' },
  { name: "Pizza Express", offset: { lat: -0.004, lng: -0.004 }, busyness: 'Medium' },
  { name: "Subway", offset: { lat: 0.002, lng: -0.005 }, busyness: 'Low' },
  { name: "Five Guys", offset: { lat: -0.005, lng: 0.002 }, busyness: 'High' },
  { name: "KFC", offset: { lat: 0.006, lng: 0.001 }, busyness: 'Medium' },
  { name: "Pret A Manger", offset: { lat: -0.002, lng: 0.006 }, busyness: 'High' },
  { name: "Leon", offset: { lat: 0.003, lng: 0.007 }, busyness: 'Medium' },
  { name: "Itsu", offset: { lat: -0.006, lng: -0.001 }, busyness: 'Low' },
  { name: "Wasabi", offset: { lat: 0.001, lng: -0.007 }, busyness: 'Medium' },
  { name: "Zizzi", offset: { lat: -0.007, lng: 0.003 }, busyness: 'Low' },
  { name: "Ask Italian", offset: { lat: 0.004, lng: -0.006 }, busyness: 'Medium' },
  { name: "Taco Bell", offset: { lat: -0.001, lng: -0.008 }, busyness: 'High' },
  { name: "Shake Shack", offset: { lat: 0.008, lng: 0.001 }, busyness: 'High' },
];

const MOCK_CUSTOMERS = ["James", "Sophie", "Oliver", "Emily", "Jack", "Chloe"];

// Helper components moved outside App to prevent flickering
const UpdateScreen = ({ progress }: { progress: number }) => (
  <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-12 text-white">
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-full max-w-sm flex flex-col items-center"
    >
      <div className="w-24 h-24 bg-white rounded-[30px] flex items-center justify-center mb-12">
        <RefreshCw size={48} className="text-black animate-spin" />
      </div>
      <h1 className="text-4xl font-black mb-4 tracking-tighter">UPDATING...</h1>
      <p className="text-gray-500 font-bold mb-12 text-center">We're improving your driver experience. Please wait.</p>
      
      <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
        />
      </div>
      <span className="mt-4 font-black text-xl">{progress}%</span>
    </motion.div>
  </div>
);

const MaintenanceScreen = ({ onRetry }: { onRetry: () => void }) => (
  <div className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center p-12 text-black">
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full max-w-sm flex flex-col items-center text-center"
    >
      <div className="w-24 h-24 bg-red-100 rounded-[30px] flex items-center justify-center mb-12">
        <ShieldAlert size={48} className="text-red-600" />
      </div>
      <h1 className="text-4xl font-black mb-4 tracking-tighter">UNDER MAINTENANCE</h1>
      <p className="text-gray-400 font-bold mb-12">We've detected a minor bug. Our team is fixing it right now. We'll be back shortly!</p>
      
      <button 
        onClick={onRetry}
        className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl"
      >
        RETRY
      </button>
    </motion.div>
  </div>
);

const ScanningScreen = () => (
  <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-white">
    <div className="relative w-48 h-48 mb-12">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full"
      />
      <div className="absolute inset-4 border-2 border-dashed border-gray-700 rounded-full flex items-center justify-center">
        <Search size={48} className="text-gray-500 animate-pulse" />
      </div>
    </div>
    <h2 className="text-3xl font-black mb-2">SCANNING FOR BUGS</h2>
    <p className="text-gray-500 font-bold">Ensuring your app is safe and ready.</p>
  </div>
);


const Heatmap = ({ busynessMode, isLowPerformance }: { busynessMode: 'Low' | 'Medium' | 'High', isLowPerformance?: boolean }) => {
  const intensity = busynessMode === 'High' ? 1 : busynessMode === 'Medium' ? 0.6 : 0.3;
  if (intensity < 0.4 || isLowPerformance) return null; // Disable heatmap on low-perf devices

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      {/* Cluster 1 */}
      <div className="absolute left-[30%] top-[40%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px]">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1 * intensity, 0.3 * intensity, 0.1 * intensity]
          }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-orange-600 blur-[80px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2 * intensity, 0.4 * intensity, 0.2 * intensity]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-[25%] rounded-full bg-red-600 blur-[50px]"
        />
      </div>

      {/* Cluster 2 */}
      <div className="absolute left-[70%] top-[60%] -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px]">
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.1 * intensity, 0.25 * intensity, 0.1 * intensity]
          }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-yellow-600 blur-[70px]"
        />
      </div>

      {/* Center Surge Glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]">
        <div className={`absolute inset-0 rounded-full blur-[100px] transition-opacity duration-1000 ${busynessMode === 'High' ? 'bg-orange-500 opacity-20' : 'bg-transparent opacity-0'}`} />
      </div>
    </div>
  );
};

const OrderDetailsModal = ({ 
  order, 
  theme, 
  onClose, 
  onNextStep, 
  getArrivalTime,
  onOpenChat
}: { 
  order: Order, 
  theme: string, 
  onClose: () => void, 
  onNextStep: (id: string) => void,
  getArrivalTime: (mins: number) => string,
  onOpenChat: (id: string) => void
}) => {
  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className={`absolute inset-0 z-[2500] flex flex-col ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}
    >
      <div className="p-6 flex items-center justify-between border-b border-white/5">
        <h2 className="text-2xl font-black">Trip Details</h2>
        <button onClick={onClose} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
          <X size={24} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Estimated Pay</p>
            <h3 className="text-4xl font-black">£{order.estimatedPay.toFixed(2)}</h3>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Distance</p>
            <h3 className="text-2xl font-black">{order.estimatedDistance.toFixed(1)} mi</h3>
            {order.pin && (
              <div className="flex flex-col items-end gap-1 mt-2">
                <div className="flex items-center gap-1 text-green-500 font-black text-[10px] uppercase tracking-widest">
                  <ShieldCheck size={12} />
                  PIN Required
                </div>
                <div className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                  Code: {order.pin}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1">
              <div className="w-3 h-3 bg-blue-600 rounded-full" />
              <div className="w-0.5 flex-1 bg-gray-200" />
              <div className="w-3 h-3 border-2 border-black rounded-sm" />
            </div>
            <div className="flex-1 space-y-8">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{order.type === 'ride' ? 'Pickup' : 'Pickup'}</p>
                <h4 className="font-black text-lg">{order.type === 'ride' ? `${order.customerName} • ${order.riderRating} ★` : order.restaurantName}</h4>
                <p className="text-sm font-bold text-gray-500">{order.type === 'ride' ? 'Arrive at pickup by' : 'Arrive by'} {getArrivalTime(order.estimatedTime / 2)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{order.type === 'ride' ? 'Dropoff' : 'Dropoff'}</p>
                <h4 className="font-black text-lg">{order.type === 'ride' ? 'Passenger Destination' : order.customerName}</h4>
                <p className="text-sm font-bold text-gray-500">{order.type === 'ride' ? 'Estimated arrival by' : 'Deliver by'} {getArrivalTime(order.estimatedTime)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-white/5 flex gap-4">
        <button 
          onClick={() => onOpenChat(order.id)}
          className={`p-5 rounded-2xl flex items-center justify-center active:scale-95 transition-transform ${theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-100 text-black'}`}
        >
          <MessageSquare size={24} />
        </button>
        <button 
          onClick={() => onNextStep(order.id)}
          className="flex-1 py-5 bg-black text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform"
        >
          {order.status === 'accepted' ? (order.type === 'ride' ? 'START TRIP' : 'START PICKUP') : 'COMPLETE DELIVERY'}
        </button>
      </div>
    </motion.div>
  );
};

const SideMenu = ({ 
  user, 
  setIsSideMenuOpen, 
  setCurrentScreen, 
  setIsInboxOpen, 
  setIsSafetyToolkitOpen,
  theme,
  logout,
  isCarPlaySynced,
  setIsCarPlaySynced,
  earnings,
  earningsGoal,
  setEarningsGoal,
  busynessMode
}: { 
  user: UserProfile, 
  setIsSideMenuOpen: (val: boolean) => void,
  setCurrentScreen: (screen: AppScreen) => void,
  setIsInboxOpen: (val: boolean) => void,
  setIsSafetyToolkitOpen: (val: boolean) => void,
  theme: string,
  logout: () => void,
  isCarPlaySynced: boolean,
  setIsCarPlaySynced: (val: boolean) => void,
  earnings: number,
  earningsGoal: number,
  setEarningsGoal: (val: number) => void,
  busynessMode: 'Low' | 'Medium' | 'High'
}) => (
  <motion.div 
    initial={{ x: '-100%' }}
    animate={{ x: 0 }}
    exit={{ x: '-100%' }}
    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    className="fixed left-0 top-0 bottom-0 w-[85%] max-w-[320px] z-[2000] bg-black text-white flex flex-col shadow-[20px_0_60px_rgba(0,0,0,0.5)] border-r border-white/10"
    onClick={(e) => e.stopPropagation()}
  >
    <div className="p-8 pt-12 flex-1 overflow-y-auto custom-scrollbar">
      {/* User Card */}
      <div className="bg-white/5 rounded-[40px] p-6 mb-8 border border-white/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-blue-500 p-0.5 shadow-lg shadow-blue-500/20">
            <img src={user.profilePic || "https://picsum.photos/seed/driver/100/100"} alt="Profile" className="w-full h-full object-cover rounded-full" />
          </div>
          <div>
            <h3 className="font-display text-2xl font-black tracking-tight">{user.name}</h3>
            <div className="flex items-center gap-1 text-xs font-black text-blue-500 uppercase tracking-widest mt-1">
              <Star size={12} fill="currentColor" />
              <span>{user.rating}</span>
              <span className="mx-1 opacity-30 text-white">•</span>
              <span>{user.tier}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-white/5 rounded-2xl text-center">
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Today</p>
            <p className="text-lg font-black">{user.deliveriesToday || 0}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl text-center">
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Total</p>
            <p className="text-lg font-black">{user.deliveries}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl text-center">
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Points</p>
            <p className="text-lg font-black">{user.points}</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white/5 rounded-2xl flex items-center justify-between border border-white/5">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${busynessMode === 'High' ? 'bg-orange-500' : 'bg-blue-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Demand</span>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${busynessMode === 'High' ? 'text-orange-500' : busynessMode === 'Medium' ? 'text-blue-400' : 'text-gray-500'}`}>
            {busynessMode}
          </span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-10">
        <button onClick={() => { setCurrentScreen('earnings'); setIsSideMenuOpen(false); }} className="flex flex-col items-center justify-center gap-2 p-5 bg-white/5 rounded-3xl active:scale-95 transition-all border border-white/5 hover:bg-white/10 text-center">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/20">
            <TrendingUp size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Earnings</span>
        </button>
        <button onClick={() => { setCurrentScreen('account'); setIsSideMenuOpen(false); }} className="flex flex-col items-center justify-center gap-2 p-5 bg-white/5 rounded-3xl active:scale-95 transition-all border border-white/5 hover:bg-white/10 text-center">
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-600/20">
            <User size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Account</span>
        </button>
      </div>

      {/* Menu Items */}
      <div className="space-y-1 mb-10">
        {[
          { icon: <Zap size={20} />, label: "Work Hub", screen: 'uber_services' },
          { icon: <Mail size={20} />, label: "Inbox", screen: 'inbox' },
          { icon: <Clock size={20} />, label: "Scheduled", screen: 'scheduled_orders' },
          { icon: <History size={20} />, label: "Trip History", screen: 'trip_history' },
          { icon: <Target size={20} />, label: "Rewards", screen: 'uber_pro' },
          { icon: <Gift size={20} />, label: "Promotions", screen: 'opportunities' },
          { icon: <Shield size={20} />, label: "Safety", screen: 'safety' },
          { icon: <Smartphone size={20} />, label: isCarPlaySynced ? "CarPlay Active" : "Sync CarPlay", action: () => setIsCarPlaySynced(!isCarPlaySynced), active: isCarPlaySynced },
        ].map((item, i) => (
          <button 
            key={i}
            onClick={() => {
              if (item.action) {
                item.action();
              } else if (item.screen) {
                setCurrentScreen(item.screen as AppScreen);
                setIsSideMenuOpen(false);
              }
            }}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-98 ${item.active ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-gray-300 hover:text-white'}`}
          >
            <div className={`${item.active ? 'text-white' : 'text-blue-500'}`}>{item.icon}</div>
            <span className="font-bold text-sm">{item.label}</span>
            {item.label === "Inbox" && <div className="ml-auto w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">2</div>}
          </button>
        ))}
      </div>
    </div>

    <div className="p-8 border-t border-white/5 flex items-center justify-between gap-4">
      <button onClick={logout} className="flex items-center gap-3 text-red-500 font-black tracking-tighter hover:opacity-80 transition-opacity">
        <LogOut size={20} />
        <span>SIGN OUT</span>
      </button>
      <button onClick={() => setIsSideMenuOpen(false)} className="p-3 bg-white/10 rounded-full active:scale-90 transition-transform">
        <X size={20} />
      </button>
    </div>
  </motion.div>
);

const ScheduledOrdersScreen = ({ 
  scheduledOrders, 
  setScheduledOrders, 
  onClose,
  firebaseUser,
  sendNotification
}: { 
  scheduledOrders: ScheduledOrder[], 
  setScheduledOrders: React.Dispatch<React.SetStateAction<ScheduledOrder[]>>,
  onClose: () => void,
  firebaseUser: FirebaseUser | null,
  sendNotification: (title: string, body: string) => void
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newOrder, setNewOrder] = useState({ restaurantName: '', time: '' });

  const handleAdd = async () => {
    if (!firebaseUser) return;
    try {
      await addDoc(collection(db, 'scheduled_orders'), {
        driverUid: firebaseUser.uid,
        restaurantName: newOrder.restaurantName,
        scheduledTime: serverTimestamp(), // Use native timestamp for better sorting/rules
        status: 'pending',
        estimatedPay: 10 + Math.random() * 15
      });
      setIsAdding(false);
      sendNotification("Order Scheduled", `Scheduled for ${newOrder.restaurantName}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scheduled_orders');
    }
  };

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="h-full w-full bg-white text-black p-6 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
          <h1 className="text-2xl font-black">Scheduled</h1>
        </div>
        <button onClick={() => setIsAdding(true)} className="p-2 bg-black text-white rounded-full"><Plus size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-24">
        {scheduledOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Clock size={48} className="mb-4 opacity-20" />
            <p className="font-bold">No scheduled orders</p>
          </div>
        ) : (
          scheduledOrders.map(order => (
            <div key={order.id} className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg">{order.restaurantName}</h3>
                <p className="text-sm text-gray-500 font-bold">
                  {order.scheduledTime?.toDate 
                    ? order.scheduledTime.toDate().toLocaleString() 
                    : new Date(order.scheduledTime).toLocaleString()}
                </p>
                <div className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase">
                  {order.status}
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-xl text-green-600">£{order.estimatedPay.toFixed(2)}</p>
                <button 
                  onClick={async () => {
                    if (!firebaseUser) {
                      sendNotification("Auth Required", "Please sign in to delete orders.");
                      return;
                    }
                    try {
                      await deleteDoc(doc(db, 'scheduled_orders', order.id));
                    } catch (error) {
                      handleFirestoreError(error, OperationType.DELETE, `scheduled_orders/${order.id}`);
                    }
                  }}
                  className="mt-2 text-red-500 p-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[500] flex items-end justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl relative z-10">
              <h2 className="text-2xl font-black mb-6">Schedule Order</h2>
              <div className="space-y-4 mb-8">
                <input 
                  type="text" 
                  placeholder="Restaurant Name" 
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                  value={newOrder.restaurantName}
                  onChange={e => setNewOrder({...newOrder, restaurantName: e.target.value})}
                />
                <input 
                  type="datetime-local" 
                  className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
                  value={newOrder.time}
                  onChange={e => setNewOrder({...newOrder, time: e.target.value})}
                />
              </div>
              <button onClick={handleAdd} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl">SCHEDULE</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const TripPreferencesModal = ({ 
  vehicleType, 
  setVehicleType, 
  selectedServices, 
  setSelectedServices, 
  onClose,
  theme 
}: { 
  vehicleType: 'Car' | 'Bike' | 'Scooter', 
  setVehicleType: (val: 'Car' | 'Bike' | 'Scooter') => void,
  selectedServices: JobType[],
  setSelectedServices: (val: JobType[]) => void,
  onClose: () => void,
  theme: string
}) => {
  const toggleService = (service: JobType) => {
    if (selectedServices.includes(service)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter(s => s !== service));
      }
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center px-4 pb-8">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ y: 200, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: 200, opacity: 0 }} 
        className={`w-full max-w-md rounded-[40px] p-8 shadow-2xl relative z-10 ${theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black'}`}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black">Trip Preferences</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/5 rounded-full"><X size={24} /></button>
        </div>

        <div className="space-y-8">
          {/* Vehicle Selector */}
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Select Vehicle</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'Car', icon: <CarIcon size={20} /> },
                { type: 'Bike', icon: <BikeIcon size={20} /> },
                { type: 'Scooter', icon: <Zap size={20} /> }
              ].map(v => (
                <button 
                  key={v.type}
                  onClick={() => setVehicleType(v.type as any)}
                  className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${vehicleType === v.type ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-transparent bg-gray-50 dark:bg-white/5'}`}
                >
                  {v.icon}
                  <span className="text-[10px] font-black uppercase tracking-tight">{v.type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Services Selector */}
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Earning Method</p>
            <div className="space-y-3">
              {[
                { id: 'delivery', label: 'Uber Eats', desc: 'Food and grocery delivery', icon: <Coffee size={20} /> },
                { id: 'ride', label: 'UberX', desc: 'Passenger trips', icon: <User size={20} />, disabled: vehicleType !== 'Car' }
              ].map(s => (
                <button 
                  key={s.id}
                  disabled={s.disabled}
                  onClick={() => toggleService(s.id as JobType)}
                  className={`w-full p-4 rounded-3xl flex items-center justify-between border-2 transition-all ${s.disabled ? 'opacity-30 cursor-not-allowed grayscale' : 'active:scale-[0.98]'} ${selectedServices.includes(s.id as JobType) ? 'border-blue-500 bg-blue-500/5' : 'border-transparent bg-gray-50 dark:bg-white/5'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white dark:bg-black shadow-sm">{s.icon}</div>
                    <div className="text-left">
                      <p className="font-black leading-none mb-1">{s.label}</p>
                      <p className="text-[10px] font-bold text-gray-400">{s.desc}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedServices.includes(s.id as JobType) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                    {selectedServices.includes(s.id as JobType) && <Check size={14} strokeWidth={4} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-10 py-5 bg-black dark:bg-white dark:text-black text-white rounded-[32px] font-black text-xl active:scale-95 transition-transform"
        >
          SAVE PREFERENCES
        </button>
      </motion.div>
    </div>
  );
};

// End of SideMenu helpers

// End of SideMenu helpers

const NewUserForm = ({ 
  newUserDetails, 
  setNewUserDetails, 
  setIsNewUserFormOpen,
  firebaseUser,
  user,
  setUser,
  setCurrentScreen,
  sendNotification,
  setHasSeenOnboarding
}: { 
  newUserDetails: any, 
  setNewUserDetails: React.Dispatch<React.SetStateAction<any>>,
  setIsNewUserFormOpen: (val: boolean) => void,
  firebaseUser: FirebaseUser | null,
  user: UserProfile,
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>,
  setCurrentScreen: (screen: AppScreen) => void,
  sendNotification: (title: string, body: string) => void,
  setHasSeenOnboarding: (val: boolean) => void
}) => (
  <div className="fixed inset-0 z-[500] flex items-center justify-center p-3 sm:p-4">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/70" />
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[28px] p-5 shadow-2xl relative z-10 max-h-[94vh] flex flex-col">
      <div className="overflow-y-auto flex-1 no-scrollbar">
        <h2 className="text-xl font-black mb-1 leading-tight tracking-tighter">New User?</h2>
        <p className="text-gray-500 font-bold mb-4 text-[10px]">Create an account to start earning.</p>
        
        <div className="space-y-2.5 mb-4">
          {!firebaseUser && (
            <button 
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (error) {
                  console.error("Login failed", error);
                }
              }}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 active:scale-95 transition-transform text-sm"
            >
              <Globe size={16} />
              SIGN IN WITH GOOGLE
            </button>
          )}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Full Name</label>
            <input 
              type="text" 
              className="w-full p-3.5 bg-gray-50 rounded-xl border-none font-bold text-sm"
              value={newUserDetails.name}
              onChange={e => setNewUserDetails({...newUserDetails, name: e.target.value})}
              placeholder="Full name"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Email</label>
            <input 
              type="email" 
              className="w-full p-3.5 bg-gray-50 rounded-xl border-none font-bold text-sm"
              value={newUserDetails.email}
              onChange={e => setNewUserDetails({...newUserDetails, email: e.target.value})}
              placeholder="Email"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Date of Birth</label>
            <input 
              type="date" 
              className="w-full p-3.5 bg-gray-50 rounded-xl border-none font-bold text-sm"
              value={newUserDetails.dob}
              onChange={e => setNewUserDetails({...newUserDetails, dob: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Phone Number</label>
            <input 
              type="tel" 
              className="w-full p-3.5 bg-gray-50 rounded-xl border-none font-bold text-sm"
              value={newUserDetails.phone}
              onChange={e => setNewUserDetails({...newUserDetails, phone: e.target.value})}
              placeholder="+1 234 567 8900"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Home Address</label>
            <input 
              type="text" 
              className="w-full p-3.5 bg-gray-50 rounded-xl border-none font-bold text-sm"
              value={newUserDetails.address}
              onChange={e => setNewUserDetails({...newUserDetails, address: e.target.value})}
              placeholder="Address"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-2">
        <button onClick={() => setIsNewUserFormOpen(false)} className="px-5 py-4 bg-gray-100 text-black rounded-xl font-black text-sm">EXIT</button>
        <button 
          disabled={!firebaseUser || !newUserDetails.name || !newUserDetails.email || !newUserDetails.dob || !newUserDetails.phone}
          onClick={async () => {
            try {
              const uid = firebaseUser?.uid;
              if (!uid) return;

              const newUserProfile: UserProfile = {
                ...user,
                name: newUserDetails.name,
                email: newUserDetails.email,
                dob: newUserDetails.dob,
                phone: newUserDetails.phone,
                address: newUserDetails.address,
                uid: uid,
                documentsUploaded: true,
                faceVerified: true,
                rating: 5.0,
                tier: 'Blue',
                points: 0,
                deliveries: 0,
                isOnline: false,
                walletBalance: 0,
                profilePic: newUserDetails.profilePic || "",
                documentExpiries: {
                  "Driving Licence": "2027-01-01",
                  "Vehicle Insurance": "2027-01-01",
                  "Bank Statement": "2027-01-01"
                },
                faceSignature: newUserDetails.faceSignature || ""
              } as any;

              await setDoc(doc(db, 'users', uid), newUserProfile);
              setUser(newUserProfile);
              setIsNewUserFormOpen(false);
              setHasSeenOnboarding(true);
              localStorage.setItem('uber_has_seen_onboarding', 'true');
              setCurrentScreen('home');
              sendNotification("Account Created", `Welcome to Uber Eats, ${newUserDetails.name}!`);
            } catch (error) {
              console.error("Create account failed:", error);
              sendNotification("Error", "Could not create account.");
            }
          }} 
          className={`flex-1 py-4 rounded-xl font-black transition-all text-sm ${(!firebaseUser || !newUserDetails.name || !newUserDetails.email) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black text-white shadow-xl active:scale-95'}`}
        >
          CREATE ACCOUNT
        </button>
      </div>
    </motion.div>
  </div>
);

const PersonalDetailsScreen = ({ 
  user,
  setUser,
  onClose,
  sendNotification,
  theme,
  firebaseUser
}: { 
  user: UserProfile,
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>,
  onClose: () => void,
  sendNotification: (title: string, body: string) => void,
  theme: 'light' | 'dark',
  firebaseUser: any
}) => {
  const [editedUser, setEditedUser] = useState({...user});
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const uid = user.uid || firebaseUser?.uid;
    if (!uid) {
      console.error("No UID found for user");
      sendNotification("Error", "Session expired. Please sign in again.");
      return;
    }
    
    setIsSaving(true);
    try {
      // Use updateDoc for partial updates to avoid overwriting systemic fields accidentally
      // Though here we update the whole object for simplicity as per previous implementation, 
      // but ensuring uid is set in the data as well.
      const dataToSave = { ...editedUser, uid };
      await setDoc(doc(db, 'users', uid), dataToSave);
      setUser(dataToSave);
      sendNotification("Profile Updated", "Your changes have been saved successfully.");
      onClose();
    } catch (error) {
      console.error("Save error:", error);
      if (error instanceof Error && error.message.includes("insufficient permissions")) {
        sendNotification("Error", "You don't have permission to update this profile.");
      } else {
        sendNotification("Error", "Could not save profile. Please check your connection.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedUser(prev => ({ ...prev, profilePic: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className={`fixed inset-0 z-[500] flex flex-col ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}
    >
      <div className="p-4 flex items-center gap-4 border-b border-gray-100 dark:border-white/5 shrink-0">
        <button onClick={onClose} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><ArrowRight className="rotate-180" size={22} /></button>
        <h1 className="text-2xl font-black">Personal Info</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-12">
        <div className="flex flex-col items-center py-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-24 h-24 rounded-full overflow-hidden border-4 shadow-xl mb-3 relative group cursor-pointer active:scale-95 transition-transform ${theme === 'dark' ? 'border-white/10' : 'border-white'}`}
            >
                <img src={editedUser.profilePic || user.profilePic || "https://picsum.photos/seed/driver/200/200"} alt="Me" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="text-white" size={20} />
                </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              className="hidden" 
              accept="image/*"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-500 font-bold text-xs uppercase tracking-wider active:opacity-50"
            >
              Change Photo
            </button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Full Name</label>
            <input 
              type="text" 
              className={`w-full p-4 rounded-2xl border-2 font-bold transition-all text-sm focus:border-black dark:focus:border-white ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}
              value={editedUser.name}
              onChange={e => setEditedUser({...editedUser, name: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Phone Number</label>
            <input 
              type="tel" 
              className={`w-full p-4 rounded-2xl border-2 font-bold transition-all text-sm focus:border-black dark:focus:border-white ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}
              value={editedUser.phone || ''}
              onChange={e => setEditedUser({...editedUser, phone: e.target.value})}
              placeholder="+1 234 567 8900"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Date of Birth</label>
            <input 
              type="date" 
              className={`w-full p-4 rounded-2xl border-2 font-bold transition-all text-sm focus:border-black dark:focus:border-white ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}
              value={editedUser.dob || ''}
              onChange={e => setEditedUser({...editedUser, dob: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Residential Address</label>
            <textarea 
              rows={2}
              className={`w-full p-4 rounded-2xl border-2 font-bold transition-all text-sm focus:border-black dark:focus:border-white ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}
              value={editedUser.address || ''}
              onChange={e => setEditedUser({...editedUser, address: e.target.value})}
              placeholder="123 Driver St, City, Country"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-white/5 shrink-0 bg-white dark:bg-[#0a0a0a]">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 bg-black text-white dark:bg-white dark:text-black rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {isSaving ? <RefreshCw className="animate-spin" size={20} /> : 'SAVE CHANGES'}
        </button>
      </div>
    </motion.div>
  );
};

const CarPlayDashboard = ({ 
  activeOrders, 
  user, 
  onClose,
  isCarPlaySynced,
  setIsCarPlaySynced
}: { 
  activeOrders: Order[], 
  user: UserProfile, 
  onClose: () => void,
  isCarPlaySynced: boolean,
  setIsCarPlaySynced: (val: boolean) => void
}) => {
  const activeOrder = activeOrders[0];
  
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[5000] bg-[#050505] text-white flex flex-col font-sans"
    >
      {/* CarPlay Status Bar */}
      <div className="h-10 bg-black/40 flex items-center justify-between px-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold">19:15</span>
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-white/40 rounded-full" />
            <div className="w-1 h-3 bg-white/40 rounded-full" />
            <div className="w-1 h-3 bg-white rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-2 py-0.5 bg-blue-600 rounded text-[10px] font-black uppercase tracking-widest">CarPlay</div>
          <button 
            onClick={() => {
              setIsCarPlaySynced(false);
              onClose();
            }}
            className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline"
          >
            Disconnect
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Sidebar (App Icons) */}
        <div className="w-20 bg-black/60 flex flex-col items-center py-6 gap-6 border-r border-white/5">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-black font-black text-2xl">U</span>
          </div>
          <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center opacity-40">
            <Navigation size={24} className="text-white" />
          </div>
          <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center opacity-40">
            <Music size={24} className="text-white" />
          </div>
          <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center opacity-40">
            <Phone size={24} className="text-white" />
          </div>
          <div className="mt-auto w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full" />
          </div>
        </div>

        {/* Main Dashboard Area */}
        <div className="flex-1 flex flex-col p-6 gap-6">
          {activeOrder ? (
            <div className="flex-1 flex gap-6">
              {/* Navigation Card */}
              <div className="flex-[2] bg-white/5 rounded-[32px] p-8 border border-white/10 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Navigation size={120} className="rotate-45" />
                </div>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <Navigation size={32} className="text-white" style={{ transform: 'rotate(45deg)' }} />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black mb-1">
                      {activeOrder.status === 'accepted' ? 'Heading to Pickup' : 'Heading to Dropoff'}
                    </h2>
                    <p className="text-xl text-gray-400 font-bold">
                      {activeOrder.status === 'accepted' ? activeOrder.restaurantName : activeOrder.customerName}
                    </p>
                  </div>
                </div>

                <div className="mt-auto space-y-2">
                  <p className="text-6xl font-black tracking-tighter">
                    {activeOrder.status === 'accepted' ? 'Main St' : 'Arriving Soon'}
                  </p>
                  <div className="flex items-center gap-4 text-2xl text-gray-400 font-bold">
                    <span>{activeOrder.estimatedDistance.toFixed(1)} mi</span>
                    <div className="w-2 h-2 bg-white/20 rounded-full" />
                    <span className="text-blue-400">{Math.floor(activeOrder.estimatedTime / 2)} min</span>
                  </div>
                </div>
              </div>

              {/* Order Info Card */}
              <div className="flex-1 flex flex-col gap-6">
                <div className="flex-1 bg-white/5 rounded-[32px] p-6 border border-white/10 flex flex-col justify-center">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Order Items</p>
                  <div className="space-y-1">
                    {(activeOrder.items || []).slice(0, 3).map((item, i) => (
                      <p key={i} className="text-lg font-bold truncate">• {item}</p>
                    ))}
                    {(activeOrder.items?.length || 0) > 3 && (
                      <p className="text-sm text-gray-500 font-bold">+{(activeOrder.items?.length || 0) - 3} more items</p>
                    )}
                  </div>
                </div>
                <div className="flex-1 bg-green-600/10 rounded-[32px] p-6 border border-green-500/20 flex flex-col justify-center">
                  <p className="text-xs font-black text-green-500 uppercase tracking-widest mb-1">Estimated Pay</p>
                  <h3 className="text-4xl font-black text-green-500">£{activeOrder.estimatedPay.toFixed(2)}</h3>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white/5 rounded-[40px] border border-white/10">
              <div className="text-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Navigation size={48} className="text-gray-600" />
                </div>
                <h2 className="text-3xl font-black mb-2">No Active Trips</h2>
                <p className="text-gray-500 font-bold">New requests will appear here</p>
              </div>
            </div>
          )}

          {/* Bottom Quick Actions */}
          <div className="h-24 flex gap-6">
            <button className="flex-1 bg-white/5 rounded-3xl flex items-center justify-center gap-4 border border-white/10 active:bg-white/10 transition-colors">
              <Phone size={24} />
              <span className="font-black text-lg">Call Support</span>
            </button>
            <button className="flex-1 bg-white/5 rounded-3xl flex items-center justify-center gap-4 border border-white/10 active:bg-white/10 transition-colors">
              <MessageSquare size={24} />
              <span className="font-black text-lg">Messages</span>
            </button>
            <button 
              onClick={onClose}
              className="w-24 bg-white text-black rounded-3xl flex items-center justify-center shadow-xl active:scale-95 transition-transform"
            >
              <X size={32} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const EarningsDetail = ({ 
  earnings, 
  user, 
  setCurrentScreen, 
  getArrivalTime, 
  setBankBalance, 
  setEarnings, 
  sendNotification, 
  playUberSound 
}: { 
  earnings: number, 
  user: UserProfile, 
  setCurrentScreen: (screen: AppScreen) => void,
  getArrivalTime: (mins: number) => string,
  setBankBalance: React.Dispatch<React.SetStateAction<number>>,
  setEarnings: React.Dispatch<React.SetStateAction<number>>,
  sendNotification: (title: string, body: string) => void,
  playUberSound: (type: 'order' | 'accept' | 'complete') => void
}) => {
  const [page, setPage] = useState(0);
  const pages = ['Today', 'Weekly', 'Recent'];

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="absolute inset-0 z-[300] bg-black text-white flex flex-col pb-12"
    >
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentScreen('home')} className="p-2 bg-white/10 rounded-full"><X size={24} /></button>
          <h2 className="text-xl font-black">Earnings</h2>
          <div className="w-10" />
        </div>

        <div className="flex bg-white/10 p-1 rounded-2xl">
          {pages.map((p, i) => (
            <button 
              key={p}
              onClick={() => setPage(i)}
              className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${page === i ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 relative">
        <AnimatePresence mode="wait">
          {page === 0 && (
            <motion.div 
              key="today" 
              initial={{ opacity: 0, x: 50 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -50 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="space-y-8"
            >
              <div className="text-center">
                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-2">Today's Earnings</p>
                <h1 className="text-5xl font-black">£{earnings.toFixed(2)}</h1>
                <p className="text-green-500 font-bold mt-2 flex items-center justify-center gap-1">
                  <TrendingUp size={16} /> +12% from yesterday
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-3xl">
                  <p className="text-gray-400 text-xs font-bold mb-1">Trips</p>
                  <p className="text-xl font-black">{user.deliveries}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-3xl">
                  <p className="text-gray-400 text-xs font-bold mb-1">Time Online</p>
                  <p className="text-xl font-black">4h 22m</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-black text-lg">Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-500">Fare</span>
                    <span>£{(earnings * 0.7).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-500">Tips</span>
                    <span>£{(earnings * 0.2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-500">Promotions</span>
                    <span>£{(earnings * 0.1).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {page === 1 && (
            <motion.div 
              key="weekly" 
              initial={{ opacity: 0, x: 50 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -50 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="space-y-8"
            >
              <div className="text-center">
                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-2">Weekly Total</p>
                <h1 className="text-5xl font-black">£{(earnings * 5.4).toFixed(2)}</h1>
                <p className="text-gray-400 font-bold mt-2">Mar 30 - Apr 5</p>
              </div>

              <div className="h-40 flex items-end justify-between gap-2 px-4">
                {[40, 70, 45, 90, 65, 85, 30].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div 
                      initial={{ height: 0 }} 
                      animate={{ height: `${h}%` }} 
                      className={`w-full rounded-t-lg ${i === 6 ? 'bg-blue-600' : 'bg-white/10'}`} 
                    />
                    <span className="text-[10px] font-bold text-gray-400">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                  </div>
                ))}
              </div>

              <div className="bg-blue-900/20 p-6 rounded-3xl border border-blue-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h4 className="font-black">Top Earner</h4>
                    <p className="text-sm text-blue-400 font-bold">You're in the top 5% this week!</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {page === 2 && (
            <motion.div 
              key="recent" 
              initial={{ opacity: 0, x: 50 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -50 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="space-y-4"
            >
              <h3 className="font-black text-lg">Recent Transactions</h3>
              {[
                { label: 'Trip - Greggs', time: getArrivalTime(-120), amount: '£4.50' },
                { label: 'Trip - Wagamama', time: getArrivalTime(-180), amount: '£8.20' },
                { label: 'Promotion - Lunch Rush', time: getArrivalTime(-240), amount: '£2.00' },
                { label: 'Trip - Nando\'s', time: getArrivalTime(-300), amount: '£6.75' },
                { label: 'Trip - Costa Coffee', time: getArrivalTime(-360), amount: '£3.80' },
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <div>
                    <p className="font-bold">{t.label}</p>
                    <p className="text-xs text-gray-400 font-bold">{t.time}</p>
                  </div>
                  <p className="font-black text-lg">{t.amount}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-white/10">
        <div className="flex justify-center gap-2 mb-6">
          {pages.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${page === i ? 'w-4 bg-blue-600' : 'bg-white/10'}`} />
          ))}
        </div>
        <button 
          onClick={() => {
            if (earnings > 0) {
              setBankBalance(prev => prev + earnings);
              setEarnings(0);
              sendNotification("Cash Out Successful", "£" + earnings.toFixed(2) + " has been sent to your bank account.");
              playUberSound('complete');
              setCurrentScreen('home');
            }
          }}
          className="w-full py-4 bg-white text-black rounded-2xl font-black text-lg active:scale-95 transition-transform"
        >
          CASH OUT
        </button>
      </div>
    </motion.div>
  );
};

const VehicleDetailsScreen = ({ 
  user, 
  setUser, 
  onClose,
  theme
}: { 
  user: UserProfile, 
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>,
  onClose: () => void,
  theme: string
}) => {
  const [vehicle, setVehicle] = useState(user.vehicleInfo || { make: '', model: '', year: 2024, plate: '', type: 'Car' });

  const handleSave = () => {
    setUser(u => ({ ...u, vehicleInfo: vehicle }));
    onClose();
  };

  return (
    <motion.div 
      initial={{ x: '100%' }} 
      animate={{ x: 0 }} 
      exit={{ x: '100%' }} 
      className={`h-full w-full p-6 overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}
    >
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onClose} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><ArrowRight className="rotate-180" size={24} /></button>
        <h1 className="text-3xl font-black">Vehicle Details</h1>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Make</label>
            <input 
              type="text" 
              value={vehicle.make}
              onChange={e => setVehicle({...vehicle, make: e.target.value})}
              placeholder="e.g. Toyota"
              className={`w-full p-4 rounded-2xl font-bold outline-none border-2 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 focus:border-blue-500' : 'bg-gray-50 border-transparent focus:bg-white focus:border-blue-500'}`}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Model</label>
            <input 
              type="text" 
              value={vehicle.model}
              onChange={e => setVehicle({...vehicle, model: e.target.value})}
              placeholder="e.g. Prius"
              className={`w-full p-4 rounded-2xl font-bold outline-none border-2 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 focus:border-blue-500' : 'bg-gray-50 border-transparent focus:bg-white focus:border-blue-500'}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Year</label>
              <input 
                type="number" 
                value={vehicle.year}
                onChange={e => setVehicle({...vehicle, year: parseInt(e.target.value) || 2024})}
                className={`w-full p-4 rounded-2xl font-bold outline-none border-2 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 focus:border-blue-500' : 'bg-gray-50 border-transparent focus:bg-white focus:border-blue-500'}`}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">License Plate</label>
              <input 
                type="text" 
                value={vehicle.plate}
                onChange={e => setVehicle({...vehicle, plate: e.target.value.toUpperCase()})}
                placeholder="e.g. AB12 CDE"
                className={`w-full p-4 rounded-2xl font-bold outline-none border-2 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 focus:border-blue-500' : 'bg-gray-50 border-transparent focus:bg-white focus:border-blue-500'}`}
              />
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          className="w-full py-4 bg-black text-white rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-transform mt-8"
        >
          SAVE CHANGES
        </button>
      </div>
    </motion.div>
  );
};

const PaymentMethodsScreen = ({ 
  user, 
  setUser, 
  earnings,
  onClose,
  theme
}: { 
  user: UserProfile, 
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>,
  earnings: number,
  onClose: () => void,
  theme: string
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newMethod, setNewMethod] = useState<{type: 'card' | 'bank', last4: string, bankName?: string}>({ type: 'card', last4: '' });
  
  const paymentMethods = user.paymentMethods || [
    { id: '1', type: 'bank', last4: '9876', bankName: 'Monzo', isDefault: true }
  ];

  const handleAdd = () => {
    const method = {
      id: Math.random().toString(),
      ...newMethod,
      isDefault: false
    };
    setUser(u => ({
      ...u,
      paymentMethods: [...(u.paymentMethods || []), method] as any
    }));
    setIsAdding(false);
  };

  return (
    <motion.div 
      initial={{ x: '100%' }} 
      animate={{ x: 0 }} 
      exit={{ x: '100%' }} 
      className={`h-full w-full p-6 overflow-y-auto pb-32 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}
    >
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onClose} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><ArrowRight className="rotate-180" size={24} /></button>
        <h1 className="text-3xl font-black">Payments</h1>
      </div>

      <div className="bg-blue-600 rounded-[32px] p-8 text-white mb-8 shadow-2xl shadow-blue-600/30 overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Available to cash out</p>
          <h2 className="text-5xl font-black mb-6">£{earnings.toFixed(2)}</h2>
          <button className="w-full py-3 bg-white text-blue-600 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 transition-transform">
            CASH OUT NOW
          </button>
        </div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full" />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-xl">Payment Methods</h3>
          <button onClick={() => setIsAdding(true)} className="p-1 text-blue-600 font-black text-xs uppercase tracking-widest">Add New</button>
        </div>

        <div className="space-y-3">
          {paymentMethods.map(method => (
            <div key={method.id} className={`p-4 rounded-2xl border-2 flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100 text-gray-500'}`}>
                  {method.type === 'bank' ? <Landmark size={24} /> : <CreditCard size={24} />}
                </div>
                <div>
                  <p className="font-bold">{method.type === 'bank' ? method.bankName : 'Personal Card'}</p>
                  <p className="text-xs text-gray-400 font-bold">•••• {method.last4}</p>
                </div>
              </div>
              {method.isDefault && (
                <span className="text-[8px] font-black uppercase tracking-widest bg-blue-600 text-white px-2 py-0.5 rounded">Default</span>
              )}
            </div>
          ))}
        </div>

        <div className="pt-6">
          <h3 className="font-black text-xl mb-4">Transaction History</h3>
          <div className="space-y-4">
            {[
              { id: '1', date: 'Yesterday', amount: 45.20, type: 'earnings', title: 'Daily Earnings' },
              { id: '2', date: '2 days ago', amount: -150.00, type: 'payout', title: 'Bank Transfer' },
              { id: '3', date: '3 days ago', amount: 38.50, type: 'earnings', title: 'Daily Earnings' },
            ].map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-bold">{tx.title}</p>
                  <p className="text-xs text-gray-400 font-bold">{tx.date}</p>
                </div>
                <div className={`font-black ${tx.type === 'payout' ? 'text-gray-400' : 'text-green-500'}`}>
                  {tx.type === 'payout' ? '-' : '+'}£{Math.abs(tx.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[5000] flex items-end justify-center px-4 pb-10 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-xl">Add Method</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-100 rounded-full"><X size={16} /></button>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setNewMethod({...newMethod, type: 'card'})} 
                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest border-2 ${newMethod.type === 'card' ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-400 border-transparent'}`}
                  >
                    Card
                  </button>
                  <button 
                    onClick={() => setNewMethod({...newMethod, type: 'bank'})} 
                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest border-2 ${newMethod.type === 'bank' ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-400 border-transparent'}`}
                  >
                    Bank
                  </button>
                </div>
                
                {newMethod.type === 'bank' && (
                  <input 
                    type="text" 
                    placeholder="Bank Name"
                    className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500"
                    onChange={e => setNewMethod({...newMethod, bankName: e.target.value})}
                  />
                )}

                <input 
                  type="text" 
                  placeholder={newMethod.type === 'bank' ? "Account Number (last 4)" : "Card Number (last 4)"}
                  maxLength={4}
                  className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500"
                  onChange={e => setNewMethod({...newMethod, last4: e.target.value})}
                />

                <button 
                  onClick={handleAdd}
                  disabled={!newMethod.last4}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus size={20} />
                  ADD METHOD
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const TripHistoryScreen = ({ 
  completedTrips, 
  onClose,
  theme
}: { 
  completedTrips: CompletedTrip[], 
  onClose: () => void,
  theme: string
}) => {
  const totalEarnings = completedTrips.reduce((sum, trip) => sum + trip.earnings, 0);
  const totalDistance = completedTrips.reduce((sum, trip) => sum + trip.distance, 0);

  return (
    <motion.div 
      initial={{ x: '100%' }} 
      animate={{ x: 0 }} 
      exit={{ x: '100%' }} 
      className={`h-full w-full p-6 overflow-y-auto pb-32 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}
    >
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onClose} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><ArrowRight className="rotate-180" size={24} /></button>
        <h1 className="font-display text-3xl font-black tracking-tight">Trip History</h1>
      </div>

      {completedTrips.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className={`p-5 rounded-[32px] ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-gray-50 border border-gray-100'}`}>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Earnings</p>
            <p className="text-2xl font-black text-green-500">£{totalEarnings.toFixed(2)}</p>
          </div>
          <div className={`p-5 rounded-[32px] ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-gray-50 border border-gray-100'}`}>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Distance</p>
            <p className="text-2xl font-black">{totalDistance.toFixed(1)} mi</p>
          </div>
        </div>
      )}

      {completedTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
            <History size={40} />
          </div>
          <h3 className="text-xl font-black mb-2">No trips yet</h3>
          <p className="text-gray-400 font-bold text-sm px-8">Your completed deliveries will appear here. Go online to start earning!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 px-2">Recent Activities</h3>
          {completedTrips.slice().reverse().map((trip) => (
            <motion.div 
              key={trip.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`p-5 rounded-[32px] border-2 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 shadow-xl shadow-black/20' : 'bg-white border-gray-100 shadow-sm border-b-4'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Trip Completed</p>
                    <p className="text-sm font-black">{new Date(trip.timestamp).toLocaleDateString()} • {new Date(trip.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-green-500 leading-none">£{trip.earnings.toFixed(2)}</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-1">{trip.distance.toFixed(1)} mi</p>
                </div>
              </div>

              <div className="space-y-4 relative py-2 mb-2">
                <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-white/10" />
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-black flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Restaurant</p>
                    <p className="text-xs font-bold leading-tight">{trip.restaurantName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-4 h-4 rounded-sm bg-orange-500 border-2 border-white dark:border-black flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-sm" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Customer</p>
                    <p className="text-xs font-bold leading-tight">{trip.customerName}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const DeliveryVerificationModal = ({ 
  order, 
  enteredPin, 
  setEnteredPin, 
  isPhotoCaptured, 
  setIsPhotoCaptured, 
  onComplete, 
  onClose 
}: { 
  order: Order, 
  enteredPin: string, 
  setEnteredPin: (val: string) => void,
  isPhotoCaptured: boolean,
  setIsPhotoCaptured: (val: boolean) => void,
  onComplete: () => void,
  onClose: () => void
}) => {
  const vMethod = order.verificationMethod || (order.pin ? 'pin' : 'none');

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="absolute inset-0 z-[4000] bg-white text-black flex flex-col"
    >
      <div className="p-6 flex items-center justify-between border-b border-gray-100">
        <h2 className="text-2xl font-black">Verify Delivery</h2>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        {vMethod === 'pin' && (
          <div className="text-center mb-10">
            <h3 className="font-black text-2xl mb-2">{order.customerName}</h3>
            <p className="text-gray-500 font-bold">Ask customer for the 4-digit PIN</p>
            <div className="mt-2 inline-block px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest">
              Customer's PIN: {order.pin}
            </div>
          </div>
        )}

        {vMethod === 'photo' && (
          <div className="text-center mb-10">
            <h3 className="font-black text-2xl mb-2">{order.customerName}</h3>
            <p className="text-gray-500 font-bold">Photo required for verification</p>
            <div className="mt-4 w-full aspect-video bg-gray-100 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
               {isPhotoCaptured ? <div className="text-green-500 flex flex-col items-center"><CheckCircle2 size={48} /><span className="mt-2 text-xs font-black uppercase">Captured</span></div> : <Camera size={48} className="text-gray-300" />}
            </div>
          </div>
        )}

        {vMethod === 'none' && (
           <div className="text-center mb-10">
            <h3 className="font-black text-2xl mb-2">{order.customerName}</h3>
            <p className="text-gray-500 font-bold italic">No physical verification required for this dropoff.</p>
            <div className="mt-8 p-6 bg-green-50 rounded-3xl flex items-center justify-center">
               <Check size={48} className="text-green-500" />
            </div>
          </div>
        )}
        
        {vMethod === 'pin' && (
          <>
            <div className="flex gap-2 justify-center mb-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`w-10 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black transition-all ${enteredPin[i] ? 'border-black bg-white shadow-lg' : 'border-gray-100 bg-gray-50'}`}>
                  {enteredPin[i] || ""}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(val => (
                <button 
                  key={val}
                  onClick={() => {
                    if (enteredPin.length < 4) {
                      setEnteredPin(enteredPin + val);
                      if (enteredPin.length === 3 && (enteredPin + val) === order.pin) {
                        setTimeout(onComplete, 300);
                      }
                    }
                  }}
                  className="h-10 bg-gray-50 rounded-lg font-black text-lg active:scale-90 transition-transform border border-gray-100"
                >
                  {val}
                </button>
              ))}
              <button onClick={() => setEnteredPin("")} className="h-10 bg-red-50 text-red-500 rounded-lg font-black text-sm active:scale-90 transition-transform border border-red-100">CLR</button>
              <button 
                onClick={() => {
                  if (enteredPin.length < 4) setEnteredPin(enteredPin + "0");
                  if (enteredPin.length === 3 && (enteredPin + "0") === order.pin) {
                    setTimeout(onComplete, 300);
                  }
                }}
                className="h-10 bg-gray-50 rounded-lg font-black text-lg active:scale-90 transition-transform border border-gray-100"
              >
                0
              </button>
              <button 
                onClick={() => {
                  if (enteredPin.length === 4) onComplete();
                }}
                className={`h-10 rounded-lg flex items-center justify-center active:scale-90 transition-transform border ${enteredPin.length === 4 ? 'bg-green-600 text-white border-green-700 shadow-lg' : 'bg-gray-50 text-gray-300 border-gray-100'}`}
              >
                <Check size={20} strokeWidth={4} />
              </button>
            </div>
          </>
        )}

        <div className="mt-auto space-y-3">
          {(enteredPin.length === 4 || isPhotoCaptured || vMethod === 'none') && (
            <motion.button 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={onComplete}
              className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <ShieldCheck size={20} />
              CONFIRM DELIVERY
            </motion.button>
          )}
          
          {vMethod === 'photo' && !isPhotoCaptured && (
            <button 
              onClick={() => setIsPhotoCaptured(true)}
              className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Camera size={18} />
              Take Photo
            </button>
          )}

          {vMethod === 'pin' && (
             <button 
              onClick={() => setIsPhotoCaptured(true)}
              className="w-full py-4 bg-gray-100 text-black rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Camera size={18} />
              Take a photo instead
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ReceiptScanModal = ({ 
  order, 
  onVerify, 
  onClose,
  isVerifying
}: { 
  order: Order, 
  onVerify: (imageBase64: string) => void, 
  onClose: () => void,
  isVerifying: boolean
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera error:", err);
      }
    };
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const captureAndVerify = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        onVerify(canvas.toDataURL('image/jpeg'));
      }
    }
  };

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute inset-0 z-[5000] bg-black text-white flex flex-col overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <h2 className="text-xl font-black">Scan Receipt</h2>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full"><X size={24} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center pb-10">
        <p className="text-gray-400 font-bold mb-4 text-center text-sm">Scan the physical Uber Eats receipt to confirm you've picked up the correct order.</p>
        <div className="w-full max-w-[320px] aspect-[4/5] bg-gray-900 rounded-3xl overflow-hidden relative border-2 border-dashed border-gray-700">
           <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
           <div className="absolute inset-0 border-[30px] border-black/40 pointer-events-none" />
           <motion.div 
             animate={{ y: ['0%', '100%', '0%'] }}
             transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
             className="absolute inset-x-0 h-1 bg-green-500 shadow-[0_0_20px_rgba(34,197,94,1)]"
           />
        </div>
        <div className="w-full max-w-[320px] mt-6">
          <button 
            onClick={captureAndVerify}
            disabled={isVerifying}
            className="w-full py-4 bg-white text-black rounded-2xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg"
          >
            {isVerifying ? <RefreshCw className="animate-spin" /> : <Camera />}
            {isVerifying ? 'VERIFYING...' : 'CAPTURE RECEIPT'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const LoadingScreen = () => {
  useEffect(() => {
    console.log("LoadingScreen mounted. Waiting for Auth...");
    // If stuck for more than 8 seconds, something is likely wrong with auth/firebase
    const timer = setTimeout(() => {
      console.warn("Auth initialization taking too long. Attempting to force start...");
      window.dispatchEvent(new CustomEvent('force-auth-ready'));
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0c1426] flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full"
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-12">
          <div className="w-24 h-24 border-[8px] border-white/10 rounded-full" />
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="absolute inset-0 w-24 h-24 border-[8px] border-blue-500 border-t-transparent rounded-full" 
          />
          <motion.div 
            animate={{ scale: [0.8, 1.1, 0.8] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Navigation className="text-blue-500" size={32} fill="currentColor" />
          </motion.div>
        </div>
        
        <h1 className="text-white text-4xl font-black tracking-tighter uppercase italic mb-2 drop-shadow-2xl">Uber Eats</h1>
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-[0.3em] animate-pulse">
              <span>Systems Ready</span>
              <div className="flex gap-1">
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              </div>
            </div>
            
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('force-auth-ready'))}
                className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95"
              >
                Force Start System
              </button>
              
              <button 
                onClick={() => {
                  if (confirm("This will clear all local data and reset the app. Continue?")) {
                    localStorage.clear();
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(registrations => {
                        for(let registration of registrations) registration.unregister();
                      });
                    }
                    window.location.reload();
                  }
                }}
                className="px-8 py-3 bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
              >
                Reset & Repair App
              </button>
            </div>
          </div>
      </div>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component
class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 text-center font-sans">
          <div className="p-12 bg-gray-900/50 rounded-[40px] border border-white/10 backdrop-blur-xl flex flex-col items-center">
            <div className="w-24 h-24 bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.5)] text-white rounded-full flex items-center justify-center mb-8">
              <ShieldAlert size={56} />
            </div>
            <h1 className="text-4xl font-black mb-4 tracking-tighter uppercase italic text-red-500">System Error</h1>
            <p className="text-gray-400 font-bold mb-10 max-w-sm text-lg">
              The application encountered an unexpected issue. We've logged the error and are working on a fix.
            </p>
            
            {this.state.error && (
              <div className="w-full mb-10 p-6 bg-black/40 rounded-3xl border border-white/5 text-left">
                <div className="flex items-center gap-2 mb-3 text-red-400 font-bold text-[10px] uppercase tracking-widest">
                  <Code size={14} />
                  Error Details
                </div>
                <pre className="text-[10px] font-mono text-gray-500 overflow-auto max-h-40 custom-scrollbar whitespace-pre-wrap">
                  {this.state.error.stack || this.state.error.message}
                </pre>
              </div>
            )}
            
            <div className="flex flex-col w-full gap-4">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full py-5 bg-white text-black rounded-3xl font-black tracking-widest text-lg active:scale-95 transition-transform shadow-2xl hover:bg-gray-100"
              >
                RESTART APPLICATION
              </button>
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black tracking-widest text-sm active:scale-95 transition-transform border border-white/5"
              >
                CLEAR CACHE & RESET
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  // App State
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(() => {
    try {
      const hasSeen = localStorage.getItem('uber_has_seen_onboarding') === 'true';
      if (!hasSeen) return 'onboarding';
      const saved = localStorage.getItem('uber_current_screen');
      const screen = (saved as AppScreen) || 'home';
      if (['onboarding', 'documents', 'face_verification'].includes(screen)) return 'home';
      return screen;
    } catch (e) {
      return 'onboarding';
    }
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getArrivalTime = (mins: number) => {
    // Ensure mins is a valid number and handle potential edge cases
    const validMins = typeof mins === 'number' && !isNaN(mins) ? Math.max(1, Math.round(mins)) : 5;
    const arrival = new Date(currentTime.getTime() + validMins * 60000);
    return formatTime(arrival);
  };
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isCarPlaySynced, setIsCarPlaySynced] = useState(false);
  const [isCarPlayRemoteMode, setIsCarPlayRemoteMode] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('uber_theme');
      return (saved as 'light' | 'dark') || 'light';
    } catch (e) {
      return 'light';
    }
  });
  const [earningsTab, setEarningsTab] = useState<'today' | 'weekly' | 'recent'>('today');
  
  // User Profile State
  const [user, setUser] = useState<UserProfile>(() => {
    const baseUser: UserProfile = {
      name: "Hassen Nabeel",
      rating: 5.00,
      tier: 'Blue',
      points: 0,
      deliveries: 0,
      deliveriesToday: 0,
      rides: 0,
      isOnline: false,
      documentsUploaded: true,
      faceVerified: true,
      walletBalance: 0.00,
      profilePic: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop",
      vehicleInfo: {
        make: "Tesla",
        model: "Model 3 Performance",
        year: 2024,
        plate: "UB3R DRV",
        type: "UberX"
      },
      documentExpiries: {
        "Driving Licence": "2027-05-01",
        "Vehicle Insurance": "2026-12-15",
        "Bank Statement": "Verified"
      }
    };
    try {
      const saved = localStorage.getItem('uber_eats_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...baseUser, ...parsed, isOnline: false };
      }
    } catch (e) {
      console.warn("Failed to load user profile from localStorage", e);
    }
    return baseUser;
  });

  // Persist user profile
  useEffect(() => {
    localStorage.setItem('uber_eats_user', JSON.stringify({
      ...user,
      isOnline: false // Don't persist online status
    }));
  }, [user]);

  // Skip onboarding if already done
  useEffect(() => {
    if (user.documentsUploaded && user.faceVerified && currentScreen === 'onboarding') {
      setCurrentScreen('home');
    }
  }, []);

  // Daily Reset Logic
  useEffect(() => {
    const checkReset = () => {
      const now = new Date();
      const lastResetDate = localStorage.getItem('last_reset_date');
      const todayDate = now.toDateString();

      if (lastResetDate !== todayDate) {
        setUser(prev => ({
          ...prev,
          deliveriesToday: 0
        }));
        localStorage.setItem('last_reset_date', todayDate);
      }
    };

    checkReset();
    const interval = setInterval(checkReset, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Auto-rotation disabled so it stays on what the user selected in the opportunities view.

  // Location & Orders
  const [location, setLocation] = useState<Location | null>({ latitude: 51.5074, longitude: -0.1278 }); // Default to London
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [vehicleType, setVehicleType] = useState<'Car' | 'Bike' | 'Scooter'>(() => {
    try {
      const saved = localStorage.getItem('uber_vehicle_type');
      return (saved as any) || 'Car';
    } catch (e) {
      return 'Car';
    }
  });
  const [isVehicleSettingsOpen, setIsVehicleSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('uber_vehicle_type', vehicleType);
    if (vehicleType === 'Bike' || vehicleType === 'Scooter') {
      setSelectedServices(prev => prev.filter(s => s !== 'ride'));
    }
  }, [vehicleType]);
  const MAP_SCALE = 50000 * zoom;
  const LABEL_SCALE = 10000 * zoom;
  const BUILDING_SCALE = 6000 * zoom;
  const PARK_SCALE = 2000 * zoom;

  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [earnings, setEarnings] = useState(() => {
    try {
      const saved = localStorage.getItem('uber_earnings');
      return saved ? parseFloat(saved) : 0.00;
    } catch (e) {
      return 0.00;
    }
  });
  const [bankBalance, setBankBalance] = useState(() => {
    try {
      const saved = localStorage.getItem('uber_bank_balance');
      return saved ? parseFloat(saved) : 500.00;
    } catch (e) {
      return 500.00;
    }
  });
  const [purchasedItems, setPurchasedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('uber_purchased_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [completedTrips, setCompletedTrips] = useState<CompletedTrip[]>(() => {
    try {
      const saved = localStorage.getItem('uber_completed_trips');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // New Maintenance/Update States
  const [isLowPerformance, setIsLowPerformance] = useState(() => {
    const ua = navigator.userAgent;
    return /iPhone/i.test(ua) && (/6s/i.test(ua) || /iPhone 8/i.test(ua));
  });
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => localStorage.getItem('uber_has_seen_onboarding') === 'true');
  const [isScanning, setIsScanning] = useState(false);
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [isScanningReceipt, setIsScanningReceipt] = useState<string | null>(null);
  const [isVerifyingReceipt, setIsVerifyingReceipt] = useState(false);

  // Persist theme and earnings
  useEffect(() => {
    localStorage.setItem('uber_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('uber_earnings', earnings.toString());
  }, [earnings]);

  useEffect(() => {
    localStorage.setItem('uber_bank_balance', bankBalance.toString());
  }, [bankBalance]);

  useEffect(() => {
    localStorage.setItem('uber_purchased_items', JSON.stringify(purchasedItems));
  }, [purchasedItems]);

  useEffect(() => {
    localStorage.setItem('uber_completed_trips', JSON.stringify(completedTrips));
  }, [completedTrips]);
  
  // Chat & Notifications
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'accepted' | 'picked_up'>('all');
  
  // Trip Stop Logic for Multiple Orders
  const currentStops = useMemo(() => {
    if (activeOrders.length === 0) return [];
    
    const stops: { orderId: string, type: 'pickup' | 'dropoff', location: Location, label: string }[] = [];
    
    // Simple logic: Pickups first, then dropoffs
    // In a more complex app, we'd sort by distance
    activeOrders.forEach(order => {
      if (order.status === 'accepted' || order.status === 'en_route_to_pickup') {
        stops.push({
          orderId: order.id,
          type: 'pickup',
          location: order.restaurantLocation || order.pickupLocation!,
          label: order.type === 'ride' ? `Pickup: ${order.customerName}` : `Pickup: ${order.restaurantName}`
        });
      }
    });
    
    activeOrders.forEach(order => {
      if (order.status === 'picked_up' || order.status === 'arrived') {
        stops.push({
          orderId: order.id,
          type: 'dropoff',
          location: order.customerLocation,
          label: order.type === 'ride' ? `Dropoff: Passenger` : `Deliver to: ${order.customerName}`
        });
      }
    });

    return stops;
  }, [activeOrders]);

  const currentStop = currentStops[0];
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('uber_chat_messages');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('uber_chat_messages', JSON.stringify(messages));
  }, [messages]);
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [verifyingDeliveryId, setVerifyingDeliveryId] = useState<string | null>(null);
  const [enteredPin, setEnteredPin] = useState("");
  const [isPhotoCaptured, setIsPhotoCaptured] = useState(false);
  const [orderExpiryTimer, setOrderExpiryTimer] = useState<number>(10);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [customerTimers, setCustomerTimers] = useState<Record<string, number>>({});
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  
  const [isBottomMenuOpen, setIsBottomMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [heading, setHeading] = useState(0);
  const [isSafetyToolkitOpen, setIsSafetyToolkitOpen] = useState(false);
  const [isDestFilterOpen, setIsDestFilterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifyingToOnline, setIsVerifyingToOnline] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [routeWaypoints, setRouteWaypoints] = useState<Location[]>([]);
  const [trafficSegments, setTrafficSegments] = useState<{ start: Location, end: Location, intensity: 'low' | 'medium' | 'high' }[]>([]);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string | null>(null);
  const [viewingOrderDetailsId, setViewingOrderDetailsId] = useState<string | null>(null);
  const [earningsGoal, setEarningsGoal] = useState(() => {
    try {
      const saved = localStorage.getItem('uber_earnings_goal');
      return saved ? parseFloat(saved) : 50.00;
    } catch (e) {
      return 50.00;
    }
  });
  
  useEffect(() => {
    localStorage.setItem('uber_earnings_goal', earningsGoal.toString());
  }, [earningsGoal]);
  const [hotspots, setHotspots] = useState<{ latitude: number, longitude: number, intensity: number, size: number }[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior, 
        block: "end" 
      });
    });
  };

  useEffect(() => {
    if (currentScreen === 'chat') {
      const timer = setTimeout(() => {
        scrollToBottom("smooth");
        chatInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, currentScreen, isCustomerTyping]);

  useEffect(() => {
    const handleResize = () => {
      if (currentScreen === 'chat') {
        scrollToBottom("auto");
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentScreen]);

  const [jobTypePreference, setJobTypePreference] = useState<'normal' | 'matching' | 'both'>(() => {
    try {
      const saved = localStorage.getItem('uber_job_preference');
      return (saved as any) || 'both';
    } catch (e) {
      return 'both';
    }
  });

  const [busynessMode, setBusynessMode] = useState<'Low' | 'Medium' | 'High'>('Medium');

  useEffect(() => {
    // We removed localStorage setting here to prevent it getting stuck on high.
  }, [busynessMode]);

  useEffect(() => {
    localStorage.setItem('uber_job_preference', jobTypePreference);
  }, [jobTypePreference]);

  const [selectedRestaurant, setSelectedRestaurant] = useState<typeof MOCK_RESTAURANTS[0] | null>(null);
  const [rewards, setRewards] = useState<{ completed: number, target: number, reward: string }[]>([
    { completed: 0, target: 5, reward: "£10 Bonus" },
    { completed: 0, target: 10, reward: "£25 Bonus" },
    { completed: 0, target: 20, reward: "£60 Bonus" },
  ]);
  const wakeLockRef = useRef<any>(null);
  const [activeTopTab, setActiveTopTab] = useState<'status' | 'browse' | 'earnings'>('status');
  const [showLastTripCard, setShowLastTripCard] = useState(false);
  const [scheduledOrders, setScheduledOrders] = useState<ScheduledOrder[]>([
    { id: 'sch_1', driverUid: 'mock', restaurantName: 'Pizza Express', scheduledTime: new Date(Date.now() + 3600000).toISOString(), status: 'pending', estimatedPay: 12.50 },
    { id: 'sch_2', driverUid: 'mock', restaurantName: 'Burger King', scheduledTime: new Date(Date.now() + 7200000).toISOString(), status: 'pending', estimatedPay: 8.75 },
  ]);
  const [isNewUserFormOpen, setIsNewUserFormOpen] = useState(false);
  const [isPersonalDetailsOpen, setIsPersonalDetailsOpen] = useState(false);
  const [newUserDetails, setNewUserDetails] = useState({ 
    name: '', 
    email: '',
    dob: '',
    phone: '',
    address: ''
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [isSimulatingMovement, setIsSimulatingMovement] = useState(false);
  const [lastTrip, setLastTrip] = useState<{ amount: number, time: string, type: string } | null>({
    amount: 7.75,
    time: getArrivalTime(-45),
    type: "Uber Eats"
  });

  // CarPlay Remote Sync
  useEffect(() => {
    if (!firebaseUser || !db) return;

    const syncRef = doc(db, 'carplay_sync', firebaseUser.uid);
    
    // Listen for remote changes
    const unsubscribe = onSnapshot(syncRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        // If we are in remote mode, we follow the isActive flag
        if (isCarPlayRemoteMode) {
          setIsCarPlaySynced(data.isActive);
          if (data.isActive) {
            setCurrentScreen('carplay_dashboard');
          } else if (currentScreen === 'carplay_dashboard') {
            setCurrentScreen('home');
          }
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `carplay_sync/${firebaseUser.uid}`);
    });

    return () => unsubscribe();
  }, [firebaseUser?.uid, isCarPlayRemoteMode, currentScreen]);

  // Listen for active orders in remote mode
  useEffect(() => {
    if (!firebaseUser || !isCarPlayRemoteMode || !db) return;

    const q = query(collection(db, 'active_orders'), where('driverUid', '==', firebaseUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setActiveOrders(orders);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'active_orders');
    });

    return () => unsubscribe();
  }, [firebaseUser?.uid, isCarPlayRemoteMode]);

  // Push local changes to remote (only if NOT in remote display mode)
  useEffect(() => {
    if (!firebaseUser || isCarPlayRemoteMode || !db) return;

    const updateSync = async () => {
      try {
        await setDoc(doc(db, 'carplay_sync', firebaseUser.uid), {
          driverUid: firebaseUser.uid,
          isActive: isCarPlaySynced,
          activeOrderId: activeOrders[0]?.id || null,
          isNavigating: isNavigating,
          lastUpdated: serverTimestamp()
        }, { merge: true });

        // Also sync active orders to Firestore for remote display
        for (const order of activeOrders) {
          await setDoc(doc(db, 'active_orders', order.id), {
            ...order,
            driverUid: firebaseUser.uid,
            lastUpdated: serverTimestamp()
          }, { merge: true });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `carplay_sync/${firebaseUser.uid}`);
      }
    };
    
    updateSync();
  }, [firebaseUser?.uid, isCarPlaySynced, activeOrders, isNavigating, isCarPlayRemoteMode]);

  // Generate random hotspots around driver
  useEffect(() => {
    if (location) {
      const generateHotspots = () => {
        const hCount = isLowPerformance ? 5 : 15;
        const newHotspots = Array.from({ length: hCount }).map(() => ({
          latitude: location.latitude + (Math.random() - 0.5) * 0.05,
          longitude: location.longitude + (Math.random() - 0.5) * 0.05,
          intensity: 0.4 + Math.random() * 0.6,
          size: 150 + Math.random() * 450
        }));
        setHotspots(newHotspots as any);
      };
      
      generateHotspots();
      const interval = setInterval(generateHotspots, 20000); // Refresh every 20s
      return () => clearInterval(interval);
    }
  }, [location === null]);
  
  const [selectedServices, setSelectedServices] = useState<JobType[]>(() => {
    try {
      const saved = localStorage.getItem('uber_selected_services');
      return saved ? JSON.parse(saved) : ['delivery', 'ride'];
    } catch (e) {
      return ['delivery', 'ride'];
    }
  });

  useEffect(() => {
    localStorage.setItem('uber_selected_services', JSON.stringify(selectedServices));
  }, [selectedServices]);
  const currentCity = useMemo(() => {
    if (!location) return "London";
    const lat = location.latitude;
    const lng = location.longitude;
    
    // Proximity check for major UK cities
    if (lat > 53.3 && lat < 53.6 && lng > -2.4 && lng < -2.1) return "Manchester";
    if (lat > 52.3 && lat < 52.6 && lng > -2.0 && lng < -1.7) return "Birmingham";
    if (lat > 55.8 && lat < 56.0 && lng > -4.4 && lng < -4.1) return "Glasgow";
    if (lat > 53.7 && lat < 53.9 && lng > -1.7 && lng < -1.4) return "Leeds";
    if (lat > 51.4 && lat < 51.6 && lng > -2.7 && lng < -2.4) return "Bristol";
    if (lat > 51.3 && lat < 51.7 && lng > -0.5 && lng < 0.3) return "London";
    
    return "United Kingdom"; 
  }, [location]);

  const watchId = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const expiryInterval = useRef<NodeJS.Timeout | null>(null);

  // Order Expiry Timer
  useEffect(() => {
    if (pendingOrder && orderExpiryTimer > 0) {
      expiryInterval.current = setInterval(() => {
        setOrderExpiryTimer(prev => prev - 1);
      }, 1000);
    } else if (orderExpiryTimer === 0) {
      handleDeclineOrder();
    }

    return () => {
      if (expiryInterval.current) clearInterval(expiryInterval.current);
    };
  }, [pendingOrder, orderExpiryTimer]);

  const [isBackgrounded, setIsBackgrounded] = useState(false);

  // Simulated Map Movement
  useEffect(() => {
    if (!isNavigating || !user.isOnline || activeOrders.length === 0 || !location || !currentStop) {
      if (isNavigating && activeOrders.length === 0) setIsNavigating(false);
      return;
    }

    const moveInterval = setInterval(() => {
      if (!currentStop || !location) return;
      
      const target = currentStop.location;
      
      const dLat = target.latitude - location.latitude;
      const dLng = target.longitude - location.longitude;
      const distance = Math.sqrt(dLat * dLat + dLng * dLng);
      
      const speed = 0.00015; 

      if (distance < speed * 1.5) {
        setLocation(target);
        setIsNavigating(false);
        const order = activeOrders.find(o => o.id === currentStop.orderId);
        sendNotification("Arrived", `You have arrived at ${currentStop.label}`, "success");
        return;
      }

      const moveRatio = speed / distance;
      const moveLat = dLat * moveRatio;
      const moveLng = dLng * moveRatio;

      const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
      setHeading(angle);

      setLocation(prev => {
        if (!prev) return prev;
        return {
          latitude: prev.latitude + moveLat,
          longitude: prev.longitude + moveLng
        };
      });
    }, 1000);

    return () => clearInterval(moveInterval);
  }, [isNavigating, user.isOnline, activeOrders, location === null, currentStop]);

  // GPS Drift Effect (Subtle jitter when online but stationary)
  useEffect(() => {
    if (!user.isOnline || isNavigating || !location) return;

    const driftInterval = setInterval(() => {
      // Very small drift: ~0.000005 degrees is approx 0.5 meters
      const latDrift = (Math.random() - 0.5) * 0.00001;
      const lngDrift = (Math.random() - 0.5) * 0.00001;

      setLocation(prev => {
        if (!prev) return prev;
        return {
          latitude: prev.latitude + latDrift,
          longitude: prev.longitude + lngDrift
        };
      });
    }, 3000); // Drift every 3 seconds

    return () => clearInterval(driftInterval);
  }, [user.isOnline, isNavigating, location === null]);

  // Customer Response Timer Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setCustomerTimers(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(orderId => {
          if (next[orderId] > 0) {
            next[orderId] -= 1;
            changed = true;
          } else if (next[orderId] === 0) {
            // Timer expired
            const order = activeOrders.find(o => o.id === orderId);
            if (order && order.status !== 'returning_to_restaurant') {
              setActiveOrders(current => current.map(o => 
                o.id === orderId ? { ...o, status: 'returning_to_restaurant' as any } : o
              ));
              sendNotification("Customer Unresponsive", `Returning order from ${order.restaurantName} to restaurant.`);
              delete next[orderId];
              changed = true;
            }
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeOrders]);

  // Firebase Auth Listener
  useEffect(() => {
    const handleForceReady = () => setIsAuthReady(true);
    window.addEventListener('force-auth-ready', handleForceReady);

    const unsubscribe = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
      setIsAuthReady(true);
      
      if (fUser) {
        // Load user profile from Firestore in background
        getDoc(doc(db, 'users', fUser.uid)).then(userDoc => {
          if (userDoc.exists()) {
            const userData = { ...userDoc.data(), uid: fUser.uid } as UserProfile;
            setUser(userData);
          } else {
            // New user from Google Auth, but profile not created yet
            setNewUserDetails({ 
              name: fUser.displayName || '', 
              email: fUser.email || '',
              dob: '',
              phone: '',
              address: ''
            });
          }
          setIsProfileLoaded(true);
        }).catch(error => {
          console.error("Profile load failed:", error);
        });
      } else {
        setIsProfileLoaded(false);
      }
    });
    
    // Request notification permission on mount
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    return () => {
      unsubscribe();
      window.removeEventListener('force-auth-ready', handleForceReady);
    };
  }, []);

  // Sync User Profile to Firestore
  useEffect(() => {
    if (firebaseUser && user.name && isProfileLoaded) {
      const syncProfile = async () => {
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...user,
            uid: firebaseUser.uid,
            email: firebaseUser.email
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }
      };
      syncProfile();
    }
  }, [user, firebaseUser, isProfileLoaded]);

  // Load Scheduled Orders
  useEffect(() => {
    if (firebaseUser) {
      const q = query(collection(db, 'scheduled_orders'), where('driverUid', '==', firebaseUser.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledOrder));
        setScheduledOrders(orders);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'scheduled_orders');
      });
      return () => unsubscribe();
    }
  }, [firebaseUser]);
  useEffect(() => {
    const checkMidnightTransfer = () => {
      const lastTransfer = localStorage.getItem('uber_last_transfer');
      const today = new Date().toISOString().split('T')[0];
      
      if (lastTransfer !== today) {
        if (earnings > 0) {
          setUser(u => ({ ...u, walletBalance: u.walletBalance + earnings }));
          setEarnings(0);
          sendNotification("Daily Transfer", "Your earnings from yesterday have been moved to your wallet.");
        }
        localStorage.setItem('uber_last_transfer', today);
      }
    };
    
    checkMidnightTransfer();
    const interval = setInterval(checkMidnightTransfer, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [earnings]);

  // Quest & Surge Notifications
  useEffect(() => {
    if (user.isOnline) {
      const interval = setInterval(() => {
        const rand = Math.random();
        if (rand < 0.1) {
          sendNotification("New Quest Available", "Complete 5 trips to earn an extra £10!");
          playUberSound('order');
        } else if (rand < 0.2) {
          sendNotification("Surge Alert", "High demand in your area! Earnings are 1.5x.");
          playUberSound('order');
        }
      }, 120000); // Every 2 mins check for random events
      return () => clearInterval(interval);
    }
  }, [user.isOnline]);

  // Document Expiration Check
  const checkDocsExpired = () => {
    if (!user.documentExpiries) return false;
    const today = new Date();
    return Object.values(user.documentExpiries).some(expiry => new Date(expiry as string) < today);
  };

  // UK Units: Miles
  const MILES_PER_DEGREE = 69;

  // Simulated Update and Scan Sequence
  useEffect(() => {
    // Disabled as per user request to remove non-game features
    setIsUpdating(false);
    setIsScanning(false);
    setIsUnderMaintenance(false);
  }, []);

  // Screen Wake Lock
  useEffect(() => {
    const requestWakeLock = async () => {
      if (user.isOnline && 'wakeLock' in navigator) {
        try {
          if (wakeLockRef.current) return;
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          
          wakeLockRef.current.addEventListener('release', () => {
             wakeLockRef.current = null;
          });
        } catch (err) {
          // Silent fail for wake lock as it's often blocked in iframes
        }
      } else if (!user.isOnline && wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user.isOnline]);

  const routeRef = useRef<Location[]>([]);
  const lastTargetRef = useRef<Location | null>(null);

  // Geolocation tracking & Navigation Simulation
  useEffect(() => {
    let angle = 0;
    let deviationChance = 0.01; // 1% chance to deviate each second

    const generateRoute = (start: Location, end: Location) => {
      const waypoints: Location[] = [start];
      // Create a grid-like path (Manhattan-style)
      waypoints.push({ latitude: start.latitude, longitude: end.longitude });
      waypoints.push(end);
      return waypoints;
    };

    const generateTraffic = (center: Location) => {
      const segments: { start: Location, end: Location, intensity: 'low' | 'medium' | 'high' }[] = [];
      for (let i = 0; i < 15; i++) {
        const start = {
          latitude: center.latitude + (Math.random() - 0.5) * 0.02,
          longitude: center.longitude + (Math.random() - 0.5) * 0.02,
        };
        const end = {
          latitude: start.latitude + (Math.random() - 0.5) * 0.005,
          longitude: start.longitude + (Math.random() - 0.5) * 0.005,
        };
        const intensities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
        segments.push({ start, end, intensity: intensities[Math.floor(Math.random() * 3)] });
      }
      return segments;
    };

    if (isSimulatingMovement || isNavigating) {
      const interval = setInterval(() => {
        setLocation(prev => {
          if (!prev) return { latitude: 51.5074, longitude: -0.1278 };
          
          if (isNavigating && activeOrders.length > 0) {
            const order = activeOrders[0];
            const target = order.status === 'accepted' 
              ? (order.type === 'delivery' ? order.restaurantLocation : order.pickupLocation) 
              : order.customerLocation;
            
            if (!target) return prev;
            
            // Reset route if target changed
            if (!lastTargetRef.current || lastTargetRef.current.latitude !== target.latitude || lastTargetRef.current.longitude !== target.longitude) {
              const newRoute = generateRoute(prev, target);
              routeRef.current = newRoute;
              setRouteWaypoints(newRoute);
              setTrafficSegments(generateTraffic(prev));
              lastTargetRef.current = target;
            }

            // Initial route generation if empty
            if (routeRef.current.length === 0) {
              const newRoute = generateRoute(prev, target);
              routeRef.current = newRoute;
              setRouteWaypoints(newRoute);
            }

            // Check for deviation
            if (Math.random() < deviationChance && !isRecalculating && routeRef.current.length > 1) {
              setIsRecalculating(true);
              sendNotification("Traffic Alert", "Finding a faster route...");
              setTimeout(() => {
                const newRoute = generateRoute(prev, target);
                routeRef.current = newRoute;
                setRouteWaypoints(newRoute);
                setIsRecalculating(false);
              }, 1500);
              return prev;
            }

            if (isRecalculating) return prev;

            // Move towards next waypoint
            const nextWaypoint = routeRef.current[0] || target;
            const dLat = nextWaypoint.latitude - prev.latitude;
            const dLng = nextWaypoint.longitude - prev.longitude;
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);
            
            if (dist < 0.0005) {
              // Arrived at waypoint
              if (routeRef.current.length > 0) {
                const updatedRoute = routeRef.current.slice(1);
                routeRef.current = updatedRoute;
                setRouteWaypoints(updatedRoute);
              } else {
                // Arrived at final destination
                if (order.status === 'accepted') {
                  handleNextStep(order.id);
                } else if (order.status === 'picked_up') {
                  setVerifyingDeliveryId(order.id);
                  setIsNavigating(false);
                }
              }

              // PIN Simulation: Customer sends PIN when driver is close to drop-off
              if (order.status === 'picked_up' && order.pin) {
                const distToCustomer = Math.sqrt(
                  Math.pow(target.latitude - prev.latitude, 2) + 
                  Math.pow(target.longitude - prev.longitude, 2)
                ) * MILES_PER_DEGREE;
                
                if (distToCustomer < 0.2 && !messages.some(m => m.orderId === order.id && m.text.includes(order.pin!))) {
                  setTimeout(() => {
                    const text = `Hi! I'm coming to the door now. My delivery PIN is ${order.pin}. See you soon!`;
                    setMessages(msgs => [...msgs, {
                      id: Math.random().toString(),
                      orderId: order.id,
                      sender: 'customer',
                      text,
                      timestamp: Date.now()
                    }]);
                    sendNotification("Message from Customer", text);
                    playUberSound('message');
                  }, 1000);
                }
              }

              return prev;
            }
            
            const step = 0.0003; // Speed
            return {
              latitude: prev.latitude + (dLat / dist) * step,
              longitude: prev.longitude + (dLng / dist) * step,
            };
          }

          // Reset route if not navigating
          if (routeRef.current.length > 0) {
            routeRef.current = [];
            setRouteWaypoints([]);
          }

          // Circular movement if simulating but not navigating
          if (isSimulatingMovement) {
            angle += 0.05;
            const radius = 0.001;
            return {
              latitude: 51.5074 + Math.sin(angle) * radius,
              longitude: -0.1278 + Math.cos(angle) * radius,
            };
          }

          // Random drift if not navigating
          return {
            latitude: prev.latitude + (Math.random() - 0.5) * 0.0001,
            longitude: prev.longitude + (Math.random() - 0.5) * 0.0001,
          };
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isSimulatingMovement, isNavigating, activeOrders]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => console.error("Error tracking location:", error),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  // Notification API setup
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const [toasts, setToasts] = useState<{ id: string, title: string, body: string, type?: 'info' | 'success' | 'alert' | 'message' }[]>([]);

  const addToast = (title: string, body: string, type: 'info' | 'success' | 'alert' | 'message' = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    setToasts(prev => [{ id, title, body, type }, ...prev.slice(0, 3)]); // Keep max 4
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const lastNoteRef = useRef<{ title: string, body: string, time: number } | null>(null);

  const sendNotification = (title: string, body: string, type: 'info' | 'success' | 'alert' | 'message' = 'info') => {
    const now = Date.now();
    if (lastNoteRef.current && 
        lastNoteRef.current.title === title && 
        lastNoteRef.current.body === body && 
        now - lastNoteRef.current.time < 1000) {
      return;
    }
    lastNoteRef.current = { title, body, time: now };
    
    // Real Notifications
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { 
          body, 
          icon: "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png", // Or app icon 
          tag: title // Group same titles
        });
      } catch (e) {
        console.warn("Notification API failed");
      }
    }

    // Play sound based on type if needed
    if (type === 'success') playUberSound('complete');
    if (type === 'alert') playUberSound('order');
    if (type === 'message') playUberSound('message');

    addToast(title, body, type);
    setNotifications(prev => [body, ...prev.slice(0, 49)]);
  };

  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const toggleDoc = async (label: string) => {
    if (uploadedDocs.includes(label)) {
      setUploadedDocs(prev => prev.filter(l => l !== label));
      return;
    }

    setUploadingDoc(label);
    await new Promise(r => setTimeout(r, 1500)); // Simulate upload time
    setUploadedDocs(prev => [...prev, label]);
    setUploadingDoc(null);
  };

  const allDocsUploaded = uploadedDocs.length === 3;

  // Surge Pricing Configuration
  const [activeSurgeAreas, setActiveSurgeAreas] = useState([
    { id: '1', name: "Shoreditch", lat: 0.005, lng: 0.005, radius: 0.008, multiplier: 1.8, trend: 'stable' as const },
    { id: '2', name: "Soho", lat: -0.005, lng: -0.008, radius: 0.006, multiplier: 1.5, trend: 'rising' as const },
    { id: '3', name: "King's Cross", lat: 0.01, lng: -0.005, radius: 0.007, multiplier: 1.6, trend: 'falling' as const }
  ]);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.0);

  // Dynamic Surge and Busyness Control
  useEffect(() => {
    const updateSurge = () => {
      const modeTarget = busynessMode === 'High' ? 2.5 : busynessMode === 'Medium' ? 1.5 : 1.0;
      setActiveSurgeAreas(prev => prev.map(area => {
        // Drift multiplier towards modeTarget
        const drift = (modeTarget - area.multiplier) * 0.2;
        const randomNoise = (Math.random() - 0.5) * 0.4;
        const newMultiplier = Math.max(1.0, Math.min(4.0, Number((area.multiplier + drift + randomNoise).toFixed(1))));
        const trend = newMultiplier > area.multiplier ? 'rising' : (newMultiplier < area.multiplier ? 'falling' : 'stable');
        const newLat = area.lat + (Math.random() - 0.5) * 0.001;
        const newLng = area.lng + (Math.random() - 0.5) * 0.001;
        return { ...area, multiplier: newMultiplier, trend, lat: newLat, lng: newLng };
      }));
    };

    updateSurge();
    const interval = setInterval(updateSurge, 60000); // More frequent updates for realism
    return () => clearInterval(interval);
  }, [busynessMode]);

  // Update surge based on current location
  useEffect(() => {
    if (location) {
      let maxSurge = 1.0;
      const localLat = location.latitude - 51.5074;
      const localLng = location.longitude - (-0.1278);

      activeSurgeAreas.forEach(area => {
        const d = Math.sqrt(Math.pow(localLat - area.lat, 2) + Math.pow(localLng - area.lng, 2));
        if (d < area.radius) {
          maxSurge = Math.max(maxSurge, area.multiplier);
        }
      });
      
      const hour = new Date().getHours();
      const isPeak = (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21);
      
      if (isPeak && maxSurge === 1.0) {
        maxSurge = 1.2;
      }

      setSurgeMultiplier(maxSurge);
    }
  }, [location, activeSurgeAreas]);

  const [screenSize, setScreenSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setScreenSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, [currentScreen]);

  const centerX = screenSize.width / 2;
  const centerY = screenSize.height / 2;

  // Map Background Component for depth and to prevent "black screen" feel
  const MapGrid = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Background base */}
      <div className="absolute inset-0 bg-[#0c0c0d]" />
      
      {/* Major Roads Grid */}
      <div className="absolute inset-0 opacity-[0.15]" style={{ 
        backgroundImage: `linear-gradient(90deg, #3b82f6 1px, transparent 1px), linear-gradient(#3b82f6 1px, transparent 1px)`,
        backgroundSize: '150px 150px'
      }} />
      
      {/* Minor Roads Grid */}
      <div className="absolute inset-0 opacity-[0.05]" style={{ 
        backgroundImage: `linear-gradient(90deg, #ffffff 1px, transparent 1px), linear-gradient(#ffffff 1px, transparent 1px)`,
        backgroundSize: '30px 30px'
      }} />

      {/* City Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05)_0%,transparent_70%)]" />
      
      {/* Dark Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );

  // Improved Order Matching Algorithm with Surge
  const generateSmartOrder = () => {
    if (!location) return null;

    // Filter services based on vehicle type
    const availableServices = selectedServices.filter(service => {
      if (vehicleType === 'Bike' || vehicleType === 'Scooter') {
        return service === 'delivery';
      }
      return true; // Car can do both
    });

    if (availableServices.length === 0) return null;

      const getJobType = () => {
        // Absolute priority for UberX (ride) if user has a Car and ride service is enabled
        if (vehicleType === 'Car' && availableServices.includes('ride')) {
          const isRideSelected = selectedServices.length === 0 || selectedServices.includes('ride');
          if (isRideSelected) return 'ride';
        }
        return availableServices[Math.floor(Math.random() * availableServices.length)];
      };

    // 1. Generate 5 candidate orders
    const candidates = Array.from({ length: 5 }).map(() => {
      const type = getJobType();
      const customerName = MOCK_CUSTOMERS[Math.floor(Math.random() * MOCK_CUSTOMERS.length)];
      
      const restOffset = MOCK_RESTAURANTS[Math.floor(Math.random() * MOCK_RESTAURANTS.length)].offset;
      const pickupLat = location.latitude + restOffset.lat;
      const pickupLng = location.longitude + restOffset.lng;
      const custLat = pickupLat + (Math.random() - 0.5) * 0.02;
      const custLng = pickupLng + (Math.random() - 0.5) * 0.02;

      const distToPickup = Math.sqrt(Math.pow(pickupLat - location.latitude, 2) + Math.pow(pickupLng - location.longitude, 2)) * MILES_PER_DEGREE;
      const tripDist = Math.sqrt(Math.pow(custLat - pickupLat, 2) + Math.pow(custLng - pickupLng, 2)) * MILES_PER_DEGREE;
      
      let activeSurge = surgeMultiplier;
      activeSurgeAreas.forEach(area => {
        const d = Math.sqrt(Math.pow(pickupLat - 51.5074 - area.lat, 2) + Math.pow(pickupLng - (-0.1278) - area.lng, 2));
        if (d < area.radius) {
          activeSurge = Math.max(activeSurge, area.multiplier);
        }
      });

      const baseFee = type === 'ride' ? 2.50 : 1.50;
      const mileRate = type === 'ride' ? 1.45 : 1.10;
      const minuteRate = 0.15;
      const estTime = Math.floor((tripDist + distToPickup) * 4 + 3);
      
      const calculatedPay = baseFee + ((tripDist + distToPickup) * mileRate) + (estTime * minuteRate);
      const minPay = type === 'ride' ? 5.00 : 4.00;
      const finalBasePay = Math.max(calculatedPay, minPay);
      
      const isStacked = type === 'delivery' && Math.random() < 0.3; // 30% chance for double orders
      let batchCount = isStacked ? 2 : 1;
      
      const pay = (finalBasePay + (Math.random() * 2)) * activeSurge * (isStacked ? 1.7 : 1);

      const verificationMethod = (['pin', 'photo', 'none'] as const)[Math.floor(Math.random() * 3)];
      const receiptRequired = type === 'delivery' && Math.random() < 0.7; // 70% chance for receipt scan

      return {
        id: Math.random().toString(36).substring(2, 11),
        type,
        customerName: isStacked ? `${customerName} + 1 more` : customerName,
        restaurantName: type === 'delivery' ? MOCK_RESTAURANTS[Math.floor(Math.random() * MOCK_RESTAURANTS.length)].name : "UberX",
        restaurantLocation: { latitude: pickupLat, longitude: pickupLng },
        pickupLocation: { latitude: pickupLat, longitude: pickupLng },
        customerLocation: { latitude: custLat, longitude: custLng },
        estimatedPay: pay,
        estimatedDistance: Number(((tripDist + distToPickup) * (isStacked ? 1.4 : 1)).toFixed(1)),
        estimatedTime: Math.floor(((tripDist + distToPickup) * 5 + 4) * (isStacked ? 1.5 : 1)),
        status: 'pending' as const,
        items: type === 'delivery' ? ["Meal Deal", "UberEats Order"] : undefined,
        pin: Math.floor(1000 + Math.random() * 9000).toString(),
        isMatching: activeOrders.length > 0 || Math.random() < 0.25,
        surge: activeSurge > 1.0 ? activeSurge : undefined,
        riderRating: type === 'ride' ? Number((4.6 + Math.random() * 0.4).toFixed(2)) : undefined,
        isUberX: type === 'ride',
        isStacked,
        batchCount,
        verificationMethod,
        receiptRequired,
        receiptVerified: false
      } as Order;
    });

    const scoredCandidates = candidates.map(order => {
      let score = 0;
      score += (10 / (order.type === 'ride' ? order.id.length : 1)); // Mock dist
      score += (order.estimatedPay * 2);
      return { order, score };
    });

    return scoredCandidates.sort((a, b) => b.score - a.score)[0].order;
  };

  // Simulating incoming orders when online
  useEffect(() => {
    if (!user.isOnline) return;

    let timer: NodeJS.Timeout;
    const scheduleNextOrder = () => {
      // Adjusted wait time based on busyness mode
      let baseWait = 1500;
      let randomRange = 2500;

      if (busynessMode === 'Low') {
        baseWait = 15000;
        randomRange = 30000; // 15s to 45s
      } else if (busynessMode === 'Medium') {
        baseWait = 5000;
        randomRange = 10000; // 5s to 15s
      } else {
        // High
        baseWait = 1500;
        randomRange = 2500; // 1.5s to 4s
      }

      const waitTime = baseWait + Math.random() * randomRange;

      timer = setTimeout(() => {
        const canReceive = user.isOnline && activeOrders.length < 3 && !pendingOrder && location;
        
        if (!canReceive) {
          if (user.isOnline) scheduleNextOrder();
          return;
        }

        const services = selectedServices.length > 0 ? selectedServices : ['delivery', 'ride'] as JobType[];

        // 15% chance for a scheduled trip if any exist
        const shouldPickScheduled = Math.random() < 0.15 && scheduledOrders.length > 0;
        
        let newOrder: Order | null = null;
        
        if (shouldPickScheduled) {
          const sch = scheduledOrders[0];
          const restLoc = { 
            latitude: location.latitude + (Math.random() - 0.5) * 0.01, 
            longitude: location.longitude + (Math.random() - 0.5) * 0.01 
          };
          newOrder = {
            id: sch.id,
            type: 'delivery',
            restaurantName: sch.restaurantName,
            customerName: "Scheduled Pickup",
            restaurantLocation: restLoc,
            pickupLocation: restLoc,
            customerLocation: { 
              latitude: location.latitude + (Math.random() - 0.5) * 0.03, 
              longitude: location.longitude + (Math.random() - 0.5) * 0.03 
            },
            estimatedPay: sch.estimatedPay,
            estimatedDistance: 2.5,
            estimatedTime: 12,
            status: 'pending',
            items: ["Scheduled Group Order"],
            pin: Math.floor(1000 + Math.random() * 9000).toString(),
            isMatching: activeOrders.length > 0 || Math.random() < 0.2
          };
          setScheduledOrders(prev => prev.filter(s => s.id !== sch.id));
        } else {
          newOrder = generateSmartOrder();
        }

        // Apply final job preference filter
        if (newOrder) {
          const isMatchPref = jobTypePreference === 'both' || 
            (jobTypePreference === 'matching' && newOrder.isMatching) || 
            (jobTypePreference === 'normal' && !newOrder.isMatching);

          if (isMatchPref) {
            setPendingOrder(newOrder);
            setOrderExpiryTimer(18); // Give 18 seconds to decide
            const prefix = newOrder.isMatching ? "MATCH: " : "TRIP: ";
            const surgeText = newOrder.surge ? ` (${newOrder.surge}x Surge!)` : "";
            sendNotification(prefix + (shouldPickScheduled ? "Scheduled" : "High Priority") + surgeText, `£${newOrder.estimatedPay.toFixed(2)} • ${newOrder.estimatedDistance.toFixed(1)} mi • ${newOrder.restaurantName || "UberX"}`);
            playUberSound('order');
          } else {
            scheduleNextOrder();
          }
        } else {
          scheduleNextOrder();
        }
      }, waitTime);
    };

    scheduleNextOrder();
    return () => clearTimeout(timer);
  }, [user.isOnline, activeOrders.length, pendingOrder === null, location === null, jobTypePreference, busynessMode]);

  const handleAcceptOrder = () => {
    if (pendingOrder) {
      if (activeOrders.length >= 3) {
        sendNotification("Limit Reached", "You can only handle up to 3 active orders at a time.");
        setPendingOrder(null);
        return;
      }
      setActiveOrders(prev => [...prev, { ...pendingOrder, status: 'accepted' }]);
      console.log(`Order Accepted: ${pendingOrder.id}, PIN: ${pendingOrder.pin}`);
      setPendingOrder(null);
      setOrderExpiryTimer(10);
      setIsNavigating(true);
      setMapOffset({ x: 0, y: 0 }); // Snap map back to driver on acceptance
      playUberSound('accept');
    }
  };

  const handleDeclineOrder = () => {
    setPendingOrder(null);
    setOrderExpiryTimer(10);
    playUberSound('accept');
  };

  const handleCancelOrder = (orderId: string, reason: string) => {
    console.log(`Order ${orderId} cancelled. Reason: ${reason}`);
    setActiveOrders(prev => {
      const remaining = prev.filter(o => o.id !== orderId);
      if (remaining.length === 0) setIsNavigating(false);
      return remaining;
    });
    
    // Remote Cleanup
    if (user.uid && firebaseUser && db) {
      deleteDoc(doc(db, 'active_orders', orderId)).catch(() => {});
    }

    setCancellingOrderId(null);
    setSelectedCancelReason(null);
    sendNotification("Trip Cancelled", `Trip cancelled: ${reason}`);
    playUberSound('accept');
  };

  const handleSendMessage = (text: string) => {
    if (!activeChatOrderId || !text.trim()) return;

    // Driver Message
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      orderId: activeChatOrderId,
      sender: 'driver',
      text: text.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setChatInput("");
    chatInputRef.current?.focus();

    // Start response timer if not already active
    setCustomerTimers(prev => ({ 
      ...prev, 
      [activeChatOrderId]: prev[activeChatOrderId] || 300 
    }));

    // Customer Reply Simulation
    setIsCustomerTyping(true);
    setTimeout(() => {
      const order = activeOrders.find(o => o.id === activeChatOrderId);
      let reply = "Got it! Thanks.";
      
      const lowerText = text.toLowerCase();
      if (lowerText.includes('pin') || lowerText.includes('code')) {
        reply = `No problem! My delivery PIN is ${order?.pin || '8866'}.`;
      } else if (lowerText.includes('arrive') || lowerText.includes('outside') || lowerText.includes('door')) {
        reply = "Great! I'll be right there.";
      } else if (lowerText.includes('find') || lowerText.includes('where')) {
        reply = "I'm in the blue house with the red door. Look for the lights!";
      }

      const customerMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        orderId: activeChatOrderId,
        sender: 'customer',
        text: reply,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, customerMsg]);
      setIsCustomerTyping(false);
      playUberSound('message');
      
      // Stop timer on reply
      setCustomerTimers(prev => {
        const next = { ...prev };
        delete next[activeChatOrderId];
        return next;
      });

      sendNotification("Message from Customer", reply);
    }, 2000 + Math.random() * 2000);
  };

  const handleVerifyReceipt = async (orderId: string, imageBase64: string) => {
    setIsVerifyingReceipt(true);
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const prompt = "Analyze this image. Is it a receipt from Uber Eats? Answer strictly 'true' or 'false'. We are verifying it for a driver app.";
      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(',')[1],
        },
      };
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [imagePart, { text: prompt }] },
      });
      
      const isReceipt = response.text ? response.text.toLowerCase().includes('true') : false;
      if (isReceipt) {
        setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'picked_up', receiptVerified: true } : o));
        setIsScanningReceipt(null);
        sendNotification("Receipt Verified", "Order confirmed. Heading to customer.");
        playUberSound('accept');
      } else {
        sendNotification("Invalid Receipt", "The scanned image does not appear to be an Uber Eats receipt. Please try again or find a clearer view.");
      }
    } catch (error) {
      console.error("Receipt verification failed:", error);
      // Fallback for demo
      sendNotification("Receipt Verification", "Scanning completed. Proceeding to delivery.");
      setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'picked_up', receiptVerified: true } : o));
      setIsScanningReceipt(null);
    } finally {
      setIsVerifyingReceipt(false);
    }
  };

  const handleNextStep = (orderId: string) => {
    const order = activeOrders.find(o => o.id === orderId);
    if (!order) return;

    if (order.status === 'accepted') {
      if (order.type === 'delivery' && order.receiptRequired && !order.receiptVerified) {
        setIsScanningReceipt(orderId);
        setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'scanning_receipt' } : o));
      } else {
        setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'picked_up' } : o));
        const msg = order.type === 'ride' ? `Rider ${order.customerName} picked up` : `Order from ${order.restaurantName} picked up`;
        sendNotification(order.type === 'ride' ? "Trip Started" : "Order Picked Up", msg);
        playUberSound('accept');
      }
    } else if (order.status === 'scanning_receipt') {
        setIsScanningReceipt(orderId);
    } else if (order.status === 'picked_up') {
      setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'arriving' as any } : o));
      setIsSimulatingMovement(true);
      setIsNavigating(true);
    } else if (order.status === 'arriving' || order.status === 'arrived') {
       if (order.verificationMethod === 'none') {
         handleCompleteDelivery(orderId);
       } else {
         setVerifyingDeliveryId(orderId);
       }
    }
  };

  const handleCompleteDelivery = (orderId: string) => {
    const order = activeOrders.find(o => o.id === orderId);
    if (!order) return;

    setEarnings(prev => prev + order.estimatedPay);
    setBankBalance(prev => prev + order.estimatedPay);
    setCompletedTrips(prev => [
      {
        id: order.id,
        type: order.type,
        restaurantName: order.restaurantName || "UberX Trip",
        customerName: order.customerName,
        earnings: order.estimatedPay,
        distance: order.estimatedDistance,
        timestamp: Date.now()
      },
      ...prev
    ]);
    
    if (order.type === 'ride') {
      setUser(u => ({ ...u, rides: (u.rides || 0) + 1, deliveriesToday: (u.deliveriesToday || 0) + 1, points: u.points + 10 }));
    } else {
      setUser(u => ({ ...u, deliveries: u.deliveries + 1, deliveriesToday: (u.deliveriesToday || 0) + 1, points: u.points + 10 }));
    }

    setActiveOrders(prev => {
      const remaining = prev.filter(o => o.id !== orderId);
      if (remaining.length === 0) setIsNavigating(false);
      return remaining;
    });

    // Remote Cleanup
    if (user.uid && firebaseUser && db) {
      deleteDoc(doc(db, 'active_orders', orderId)).catch(() => {});
    }

    setVerifyingDeliveryId(null);
    setEnteredPin("");
    setIsPhotoCaptured(false);
    setIsNavigating(false);
    
    // Update Rewards
    setRewards(prev => {
      const updated = prev.map(r => ({ ...r, completed: r.completed + 1 }));
      updated.forEach(r => {
        if (r.completed === r.target) {
          sendNotification("Reward Unlocked!", `Congratulations! You've earned the ${r.reward}`);
        }
      });
      return updated;
    });
    
    sendNotification(order.type === 'ride' ? "Trip Complete" : "Delivery Complete", `You earned £${order.estimatedPay.toFixed(2)}`);
    setLastTrip({
      amount: order.estimatedPay,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: order.type === 'ride' ? "UberX" : "Uber Eats"
    });
    setShowLastTripCard(true);
    playUberSound('accept');
  };

  const distanceToTarget = (order: Order) => {
    if (!location) return "0.0";
    const target = order.status === 'accepted' 
      ? (order.type === 'delivery' ? order.restaurantLocation : order.pickupLocation) 
      : order.customerLocation;
    
    if (!target) return "0.0";
    
    const dLat = target.latitude - location.latitude;
    const dLng = target.longitude - location.longitude;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng) * MILES_PER_DEGREE;
    return dist.toFixed(1);
  };

  const distanceToStop = (stop: { location: Location }) => {
    if (!location || !stop) return 0;
    const dLat = stop.location.latitude - location.latitude;
    const dLng = stop.location.longitude - location.longitude;
    return Math.sqrt(dLat * dLat + dLng * dLng) * MILES_PER_DEGREE;
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const [isFlashing, setIsFlashing] = useState(false);

  const playUberSound = (type: 'order' | 'accept' | 'message' | 'complete') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine', volume = 0.1) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      if (type === 'order') {
        const now = audioCtx.currentTime;
        for (let i = 0; i < 3; i++) {
          playTone(880, now + i * 0.4, 0.3, 'sine', 0.15);
          playTone(1760, now + i * 0.4 + 0.05, 0.1, 'sine', 0.05);
        }
      } else if (type === 'accept') {
        playTone(440, audioCtx.currentTime, 0.1, 'sine', 0.1);
        playTone(880, audioCtx.currentTime + 0.1, 0.2, 'sine', 0.05);
      } else if (type === 'message') {
        playTone(523.25, audioCtx.currentTime, 0.1, 'sine', 0.1);
        playTone(523.25, audioCtx.currentTime + 0.15, 0.1, 'sine', 0.1);
      } else if (type === 'complete') {
        const now = audioCtx.currentTime;
        playTone(523.25, now, 0.1);
        playTone(659.25, now + 0.1, 0.1);
        playTone(783.99, now + 0.2, 0.3);
      }
    } catch (e) {
      console.warn("Audio not supported or blocked", e);
    }
  };

  const handleVerify = async () => {
    if (isVerifying || (lockoutUntil && Date.now() < lockoutUntil)) return;
    
    setIsVerifying(true);
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);
    
    // Capture frame for profile pic
    let capturedPic = "";
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        capturedPic = canvas.toDataURL('image/jpeg');
      }
    }

    // Simulate face signature generation
    // In a real app, this would be a hash of the face features from the video frame
    // We'll use a simple hash of the image data for demo purposes
    const simulatedSignature = "face_sig_" + capturedPic.length % 100;
    
    try {
      if (!firebaseUser) {
        setIsVerifying(false);
        sendNotification("Sign in Required", "Please sign in with Google first.");
        signInWithGoogle().catch(console.error);
        return;
      }
      // Search for user with this face signature
      const q = query(collection(db, 'users'), where('faceSignature', '==', simulatedSignature));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Face recognized!
        const userData = querySnapshot.docs[0].data() as UserProfile;
        setUser({ ...userData, profilePic: capturedPic || userData.profilePic });
        sendNotification("Welcome Back", `Face recognized: ${userData.name}`);
        
        // Mark as verified and go home
        setUser(u => ({ ...u, faceVerified: true }));
        setIsVerifying(false);
        setHasSeenOnboarding(true);
        localStorage.setItem('uber_has_seen_onboarding', 'true');
        setTimeout(() => {
          setCurrentScreen('home');
          if (isVerifyingToOnline) {
            setUser(u => ({ ...u, isOnline: true }));
            setIsVerifyingToOnline(false);
          }
          stopCamera();
        }, 1500);
      } else {
        // Face not recognized
        setIsVerifying(false);
        // Store the signature and pic temporarily for the new user form
        setNewUserDetails(prev => ({ ...prev, faceSignature: simulatedSignature, profilePic: capturedPic } as any));
        setIsNewUserFormOpen(true);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setIsVerifying(false);
    }
  };



  const userTier = useMemo(() => {
    if (user.points >= 3000) return 'Diamond';
    if (user.points >= 1500) return 'Platinum';
    if (user.points >= 500) return 'Gold';
    return 'Blue';
  }, [user.points]);

  const wakeLock = useRef<any>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);

  const requestWakeLock = async () => {
    // Hidden video trick for extra persistence if allowed
    if (!hiddenVideoRef.current && user.isOnline) {
      const vid = document.createElement('video');
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.style.display = 'none';
      vid.src = 'https://raw.githubusercontent.com/anars/blank-audio/master/10-seconds-of-silence.mp3'; // Small silent media
      hiddenVideoRef.current = vid;
      vid.play().catch(() => {});
    }

    if ('wakeLock' in navigator) {
      try {
        if (wakeLock.current) return;
        wakeLock.current = await (navigator as any).wakeLock.request('screen');
        
        wakeLock.current.addEventListener('release', () => {
          wakeLock.current = null;
        });
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (hiddenVideoRef.current) {
      hiddenVideoRef.current.pause();
      hiddenVideoRef.current = null;
    }
    if (wakeLock.current !== null) {
      try {
        await wakeLock.current.release();
        wakeLock.current = null;
      } catch (err) {
        console.warn('Wake Lock release failed:', err);
      }
    }
  };

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user.isOnline) {
        await requestWakeLock();
      }
    };

    let interval: any;
    if (user.isOnline) {
      requestWakeLock();
      interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          requestWakeLock();
        }
      }, 30000); // Re-request every 30 seconds for extra persistence
    } else {
      releaseWakeLock();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      if (interval) clearInterval(interval);
      releaseWakeLock();
    };
  }, [user.isOnline]);

  return (
    <AppErrorBoundary>
      {isUnderMaintenance && <MaintenanceScreen onRetry={() => window.location.reload()} />}
      {isUpdating && <UpdateScreen progress={updateProgress} />}
      {isScanning && <ScanningScreen />}
      
      {!isAuthReady ? (
        <LoadingScreen />
      ) : (
        <div className={`h-[100dvh] w-full font-sans overflow-hidden flex flex-col select-none relative transition-all duration-500 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-100 text-black'}`}>
        {/* In-App Toasts */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-[400px] px-4 pointer-events-none flex flex-col items-center gap-3">
          <AnimatePresence>
            {toasts.map(toast => (
              <motion.div 
                key={toast.id}
                layout
                initial={{ y: -80, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ x: 100, opacity: 0, scale: 0.8 }}
                className="w-full bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-xl p-4 rounded-3xl shadow-2xl flex items-center gap-4 pointer-events-auto border border-black/5 dark:border-white/10"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                  toast.type === 'success' ? 'bg-green-500 text-white' :
                  toast.type === 'alert' ? 'bg-orange-500 text-white' :
                  toast.type === 'message' ? 'bg-blue-500 text-white' :
                  'bg-black dark:bg-white dark:text-black text-white'
                }`}>
                  {toast.type === 'success' ? <Check size={24} /> :
                   toast.type === 'alert' ? <Zap size={24} /> :
                   toast.type === 'message' ? <MessageSquare size={24} /> :
                   <Bell size={24} />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-black text-sm tracking-tight leading-tight uppercase mb-0.5 dark:text-white">{toast.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold truncate">{toast.body}</p>
                </div>
                <button 
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="p-2 text-gray-300 dark:text-gray-500 hover:text-gray-500"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isSideMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSideMenuOpen(false)}
                className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
              />
              <SideMenu 
                user={user} 
                setIsSideMenuOpen={setIsSideMenuOpen}
                setCurrentScreen={setCurrentScreen}
                setIsInboxOpen={setIsInboxOpen}
                setIsSafetyToolkitOpen={setIsSafetyToolkitOpen}
                theme={theme}
                logout={logout}
                isCarPlaySynced={isCarPlaySynced}
                setIsCarPlaySynced={setIsCarPlaySynced}
                earnings={earnings}
                earningsGoal={earningsGoal}
                setEarningsGoal={setEarningsGoal}
                busynessMode={busynessMode}
              />
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 relative overflow-hidden flex flex-col">
          <AnimatePresence>
            {currentScreen === 'onboarding' && (
              <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full bg-white text-black p-8 flex flex-col justify-center pb-24">
              <div className="mb-12">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-white text-4xl font-black">U</span>
                </div>
                <h1 className="font-display text-4xl font-black leading-[0.9] tracking-tighter">Drive when you want,<br/>earn what you need</h1>
              </div>
              <div className="space-y-4">
                <button onClick={() => setCurrentScreen('documents')} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl tracking-wide">
                  CONTINUE
                </button>
                <p className="text-center text-sm text-gray-400 font-bold">By continuing, you agree to our Terms of Service</p>
              </div>
            </motion.div>
          )}

          {currentScreen === 'documents' && (
            <motion.div key="documents" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="h-full w-full bg-white text-black p-6 flex flex-col pb-24">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen(user.isOnline ? 'account' : 'onboarding')} className="p-2 bg-gray-100 rounded-full"><ArrowRight className="rotate-180" size={24} /></button>
                <h1 className="text-3xl font-black">Documents</h1>
              </div>
              <p className="text-gray-400 font-bold mb-8">Tap each item to upload your documents.</p>
              
              <div className="space-y-4 flex-1">
                {[
                  { label: "Driving Licence", icon: <FileText /> },
                  { label: "Vehicle Insurance", icon: <ShieldCheck /> },
                  { label: "Bank Statement", icon: <CreditCard /> },
                ].map((doc, i) => {
                  const isUploaded = uploadedDocs.includes(doc.label);
                  const isUploading = uploadingDoc === doc.label;
                  return (
                    <button 
                      key={i} 
                      onClick={() => !isUploading && toggleDoc(doc.label)}
                      disabled={isUploading}
                      className={`w-full p-6 border-2 rounded-3xl flex items-center justify-between transition-all ${isUploaded ? 'border-green-500 bg-green-50' : isUploading ? 'border-blue-500 bg-blue-50' : 'border-gray-100 active:scale-95'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={isUploaded ? 'text-green-500' : isUploading ? 'text-blue-500' : 'text-gray-400'}>{doc.icon}</div>
                        <span className="font-bold">{isUploading ? 'Uploading...' : doc.label}</span>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isUploaded ? 'bg-green-500 text-white' : isUploading ? 'bg-blue-500 text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                        {isUploaded ? <Check size={20} /> : isUploading ? <Clock size={20} /> : <ChevronRight size={20} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4">
                {!allDocsUploaded && (
                  <p className="text-center text-xs font-bold text-red-500">Please upload all documents to continue</p>
                )}
                <button 
                  onClick={() => {
                    setUser(u => ({ ...u, documentsUploaded: true }));
                    setCurrentScreen('face_verification');
                  }} 
                  disabled={!allDocsUploaded}
                  className={`w-full py-5 rounded-2xl font-black text-xl transition-all ${allDocsUploaded ? 'bg-black text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  NEXT
                </button>
              </div>
            </motion.div>
          )}

          {currentScreen === 'face_verification' && (
            <motion.div key="face" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full bg-black text-white p-6 flex flex-col items-center relative pb-24">
              {/* Flash Effect */}
              <AnimatePresence>
                {isFlashing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white z-[100]"
                  />
                )}
              </AnimatePresence>

              <div className="absolute top-8 left-6">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <h1 className="text-2xl font-black mt-12 mb-4">Face Verification</h1>
              <p className="text-center text-gray-400 mb-12">Position your face in the circle to verify your identity.</p>
              
              <div className="w-72 h-72 rounded-full border-4 border-blue-500 overflow-hidden relative mb-12 shadow-[0_0_30px_rgba(59,130,246,0.5)] bg-gray-900 border-dashed">
                {lockoutUntil && Date.now() < lockoutUntil ? (
                  <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center p-8 text-center">
                    <ShieldAlert size={48} className="text-red-500 mb-4" />
                    <h3 className="font-black text-xl mb-2">LOCKED OUT</h3>
                    <p className="text-sm text-red-200">Too many failed attempts. Try again in {Math.ceil((lockoutUntil - Date.now()) / 1000)}s</p>
                  </div>
                ) : (
                  <>
                    <video 
                      ref={videoRef}
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover scale-x-[-1]" 
                    />
                    
                    {!videoRef.current?.srcObject && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/60">
                        <Camera size={48} className="text-blue-500 mb-4 animate-pulse" />
                        <button 
                          onClick={() => {
                            if (!firebaseUser) {
                              signInWithGoogle().then(() => startCamera()).catch(console.error);
                            } else {
                              startCamera();
                            }
                          }}
                          className="px-6 py-2 bg-blue-600 text-white rounded-full font-black text-sm shadow-xl active:scale-95 transition-transform"
                        >
                          {firebaseUser ? "START CAMERA" : "SIGN IN & START"}
                        </button>
                        <p className="text-[10px] text-gray-500 mt-4 leading-tight">
                          We need camera access for face verification. Please click to allow.
                        </p>
                      </div>
                    )}
                    
                    {/* Scanning Animation Overlay */}
                    <motion.div 
                      animate={{ y: [0, 288, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)] z-10"
                    />
                  </>
                )}
                
                <div className="absolute inset-0 border-[20px] border-black/50 rounded-full" />
                
                {/* Success Overlay */}
                <AnimatePresence>
                  {user.faceVerified && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center z-20"
                    >
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4">
                        <Check size={48} className="text-green-500" strokeWidth={4} />
                      </div>
                      <span className="font-black text-xl">VERIFIED</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={handleVerify}
                id="verify-btn"
                disabled={user.faceVerified || isVerifying || (lockoutUntil ? Date.now() < lockoutUntil : false)}
                className={`w-full py-5 rounded-2xl font-black text-xl transition-all ${user.faceVerified ? 'bg-green-500 text-white' : (lockoutUntil && Date.now() < lockoutUntil) ? 'bg-gray-800 text-gray-500' : 'bg-white text-black active:scale-95'}`}
              >
                {user.faceVerified ? 'SUCCESS' : isVerifying ? 'VERIFYING...' : (lockoutUntil && Date.now() < lockoutUntil) ? 'LOCKED' : 'VERIFY'}
              </button>

              <button 
                onClick={() => {
                  setUser(u => ({ ...u, faceVerified: true }));
                  setCurrentScreen('home');
                  stopCamera();
                }}
                className="mt-4 text-gray-500 font-bold text-sm underline"
              >
                Skip Verification (Demo Mode)
              </button>
            </motion.div>
          )}

          {currentScreen === 'home' && (
            <motion.div ref={mapContainerRef} key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full relative overflow-hidden bg-[#0c0c0d]">
              <MapGrid />
              
              {!location && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-[#0c0c0d]/80 backdrop-blur-sm">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full" />
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="absolute inset-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full" 
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <MapPin className="text-blue-500" size={24} />
                    </motion.div>
                  </div>
                  <p className="text-blue-400 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Establishing GPS Link</p>
                  <p className="text-gray-500 text-[10px] uppercase font-bold mt-2 tracking-widest">Searching for driver coordinates...</p>
                </div>
              )}

              {/* Scanline Effect (Bottom Layer) */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />
                <div 
                  className="absolute inset-0 opacity-[0.03]" 
                  style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}
                />
              </div>
              
                  {/* Heatmap Simulation */}
                  {user.isOnline && !isNavigating && <Heatmap busynessMode={busynessMode} isLowPerformance={isLowPerformance} />}
              {/* Matching / Trip Request Overlay */}
              <AnimatePresence>
                {pendingOrder && (
                  <motion.div 
                    initial={{ y: '100%' }} 
                    animate={{ y: 0 }} 
                    exit={{ y: '100%' }} 
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute inset-x-0 bottom-0 z-[1500] h-[75vh] bg-black/95 text-white rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden border-t border-white/10"
                  >
                    {/* Map Preview (Simulated) */}
                    <div className="h-48 w-full relative overflow-hidden bg-gray-900">
                      <div className="absolute inset-0 opacity-30" style={{ 
                        backgroundImage: 'linear-gradient(90deg, #333 1px, transparent 1px), linear-gradient(#333 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                      }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full h-full max-w-[500px]">
                          {/* Driver to Restaurant line */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 300" preserveAspectRatio="xMidYMid meet">
                            <motion.path 
                              d="M 50 150 Q 150 50 250 150" 
                              fill="none" 
                              stroke="#3b82f6" 
                              strokeWidth="8" 
                              strokeDasharray="12,12"
                              initial={{ strokeDashoffset: 100 }}
                              animate={{ strokeDashoffset: 0 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                            <motion.path 
                              d="M 250 150 Q 350 250 450 150" 
                              fill="none" 
                              stroke="#10b981" 
                              strokeWidth="8" 
                              strokeDasharray="12,12"
                              initial={{ strokeDashoffset: 100 }}
                              animate={{ strokeDashoffset: 0 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                          </svg>
                          <div className="absolute left-[10%] top-[150px] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                          <div className="absolute left-[50%] top-[150px] -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                            <Coffee size={16} className="text-white" />
                          </div>
                          <div className="absolute left-[90%] top-[150px] -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                            <User size={16} className="text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-4 left-6 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/10">
                        Trip Preview
                      </div>
                    </div>

                    <div className="flex-1 p-8 pt-4 flex flex-col">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${pendingOrder.type === 'ride' ? 'bg-white text-black' : pendingOrder.isMatching ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white shadow-[0_5px_15px_rgba(37,99,235,0.3)]'}`}>
                          {pendingOrder.type === 'ride' ? 'UberX' : pendingOrder.isMatching ? 'Matching Trip' : 'New Trip'}
                        </span>
                        {pendingOrder.type === 'ride' && (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-blue-600 text-white flex items-center gap-1 shadow-[0_5px_15px_rgba(37,99,235,0.3)]">
                            <CarIcon size={12} fill="currentColor" />
                            UBERX EXCLUSIVE
                          </span>
                        )}
                            {pendingOrder.type === 'ride' && pendingOrder.riderRating && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-yellow-400 text-black flex items-center gap-1">
                                <Star size={10} fill="currentColor" />
                                {pendingOrder.riderRating}
                              </span>
                            )}
                            {pendingOrder.surge && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-blue-500 text-white flex items-center gap-1">
                                <Zap size={10} fill="currentColor" />
                                {pendingOrder.surge}x
                              </span>
                            )}
                          </div>
                          <h2 className="font-display text-5xl font-black mb-1">£{pendingOrder.estimatedPay.toFixed(2)}</h2>
                          <p className="text-gray-500 font-black tracking-widest uppercase text-[10px]">Total Payment</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-black text-2xl">{getArrivalTime(pendingOrder.estimatedTime)}</p>
                          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">{pendingOrder.estimatedDistance.toFixed(1)} mi • {pendingOrder.estimatedTime} min</p>
                        </div>
                      </div>

                      <div className="space-y-6 mb-12">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${pendingOrder.type === 'ride' ? 'bg-blue-500/20 text-blue-500' : 'bg-orange-500/20 text-orange-500'}`}>
                            {pendingOrder.type === 'ride' ? <User size={20} /> : <Coffee size={20} />}
                          </div>
                          <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${pendingOrder.type === 'ride' ? 'text-blue-500' : 'text-orange-500'}`}>{pendingOrder.type === 'ride' ? 'Rider Pickup' : 'Restaurant Pickup'}</p>
                            <p className="text-xl font-bold">{pendingOrder.type === 'ride' ? `${pendingOrder.customerName} • ${pendingOrder.riderRating} ★` : pendingOrder.restaurantName}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                            <Navigation size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Trip Destination</p>
                            <p className="text-xl font-bold">{pendingOrder.type === 'ride' ? 'Dropoff Location' : pendingOrder.customerName}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto flex flex-col gap-4 relative z-10">
                        <button 
                          onClick={handleAcceptOrder}
                          className="relative w-full py-6 bg-orange-500 rounded-3xl font-black text-2xl shadow-[0_0_40px_rgba(249,115,22,0.4)] active:scale-95 transition-all overflow-hidden"
                        >
                          <motion.div 
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: 15, ease: 'linear' }}
                            className="absolute inset-0 bg-white/20"
                          />
                          <span className="relative z-10">ACCEPT TRIP • {orderExpiryTimer}s</span>
                        </button>
                        
                        <button 
                          onClick={handleDeclineOrder}
                          className="w-full py-4 bg-white/5 rounded-2xl font-black text-gray-400 active:scale-95 transition-all"
                        >
                          DECLINE
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Background Mode Indicator */}
              {user.isOnline && !isNavigating && (
                <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
                  <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 border shadow-2xl transition-all duration-300 ${theme === 'dark' ? 'bg-black border-white/20' : 'bg-white border-black/10'}`}>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                    <span className="text-[10px] font-black tracking-widest uppercase tracking-[0.2em]">Active</span>
                  </div>
                  
                  {surgeMultiplier > 1.0 && (
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-3 py-1 bg-blue-600 text-white rounded-full flex items-center gap-2 shadow-lg border border-blue-400"
                    >
                      <Zap size={10} fill="currentColor" />
                      <span className="text-[10px] font-black tracking-widest uppercase">{surgeMultiplier.toFixed(1)}x Surge Active</span>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Map Simulation */}
              <motion.div 
                onClick={() => {
                  setSelectedMarkerId(null);
                  setSelectedRestaurant(null);
                }}
                onPan={(e, info) => {
                  if (isNaN(info.delta.x) || isNaN(info.delta.y)) return;
                  setMapOffset(prev => ({
                    x: (prev.x || 0) + info.delta.x,
                    y: (prev.y || 0) + info.delta.y
                  }));
                }}
                className={`absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing ${isNightMode || theme === 'dark' ? 'bg-[#0e1014]' : 'bg-[#e5e3df]'} ${(lockoutUntil && Date.now() < lockoutUntil) || Object.values(customerTimers).some(t => Number(t) > 0) ? 'blur-md grayscale opacity-50 pointer-events-none' : ''}`}
              >
                {/* Background Layer (Roads/Blocks Optimized) */}
                <div className="absolute inset-0 pointer-events-none" style={{ 
                  transform: `translate(${mapOffset.x}px, ${mapOffset.y}px)`,
                  willChange: 'transform'
                }}>
                  {/* Uber-like Road Base */}
                  <div className="absolute inset-[-4000px] border-none" style={{ backgroundColor: theme === 'dark' || isNightMode ? '#181a1f' : '#f0ece1' }} />
                  
                  {/* Fine Road Grid */}
                  <div className="absolute inset-[-4000px] opacity-100" style={{ 
                    backgroundImage: `
                      linear-gradient(90deg, ${theme === 'dark' || isNightMode ? '#252830' : '#ffffff'} ${12 * zoom}px, transparent ${12 * zoom}px),
                      linear-gradient(${theme === 'dark' || isNightMode ? '#252830' : '#ffffff'} ${12 * zoom}px, transparent ${12 * zoom}px)
                    `,
                    backgroundSize: `${160 * zoom}px ${160 * zoom}px`
                  }} />
                  
                  {/* Major Arterial Roads */}
                  <div className="absolute inset-[-4000px] opacity-100" style={{ 
                    backgroundImage: `
                      linear-gradient(90deg, ${theme === 'dark' || isNightMode ? '#303440' : '#ffffff'} ${18 * zoom}px, transparent ${18 * zoom}px),
                      linear-gradient(${theme === 'dark' || isNightMode ? '#303440' : '#ffffff'} ${18 * zoom}px, transparent ${18 * zoom}px)
                    `,
                    backgroundSize: `${640 * zoom}px ${640 * zoom}px`
                  }} />
                  
                  {/* Buildings Grid */}
                  <div className="absolute inset-[-4000px] opacity-[0.3]" style={{ 
                    backgroundImage: `
                      linear-gradient(45deg, ${theme === 'dark' || isNightMode ? '#1a1c22' : '#e4e1d5'} 25%, transparent 25%, transparent 75%, ${theme === 'dark' || isNightMode ? '#1a1c22' : '#e4e1d5'} 75%, ${theme === 'dark' || isNightMode ? '#1a1c22' : '#e4e1d5'})
                    `,
                    backgroundSize: `${80 * zoom}px ${80 * zoom}px`,
                    backgroundPosition: `0 0`
                  }} />
                </div>
                
                {/* Traffic Lines (Simulated) */}
                {location && !isLowPerformance && trafficSegments.map((seg, i) => {
                  const x1 = (seg.start.longitude - location.longitude) * MAP_SCALE;
                  const y1 = (location.latitude - seg.start.latitude) * MAP_SCALE;
                  const x2 = (seg.end.longitude - location.longitude) * MAP_SCALE;
                  const y2 = (location.latitude - seg.end.latitude) * MAP_SCALE;
                  
                  return (
                    <svg key={`traffic-${i}`} className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                      <line 
                        x1={centerX + x1 + mapOffset.x} 
                        y1={centerY + y1 + mapOffset.y} 
                        x2={centerX + x2 + mapOffset.x} 
                        y2={centerY + y2 + mapOffset.y} 
                        stroke={seg.intensity === 'high' ? '#ef4444' : seg.intensity === 'medium' ? '#f59e0b' : '#10b981'} 
                        strokeWidth={3 * zoom} 
                        strokeLinecap="round"
                        opacity="0.4"
                      />
                    </svg>
                  );
                })}
                
                {/* Navigation Overlay */}
                <AnimatePresence>
                  {isNavigating && activeOrders.length > 0 && (
                    <motion.div 
                      initial={{ y: -100 }}
                      animate={{ y: 0 }}
                      exit={{ y: -100 }}
                      className="absolute top-0 left-0 right-0 z-[150] bg-[#1a1a1a] text-white px-6 py-4 shadow-2xl flex items-center justify-between border-b border-white/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/20">
                          <Navigation size={24} className="fill-white" style={{ transform: 'rotate(45deg)' }} />
                        </div>
                        <div>
                          <p className="font-display text-xl font-black leading-tight tracking-tight">
                            {currentStop?.label || (activeOrders[0]?.status === 'accepted' ? (activeOrders[0]?.type === 'delivery' ? activeOrders[0]?.restaurantName : 'Pickup Location') : 'Destination')}
                          </p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {activeOrders.length > 1 ? `${activeOrders.length} Trips In Progress • ` : ''}
                            {activeOrders[0]?.status === 'accepted' ? `Pickup by ${getArrivalTime(activeOrders[0]?.estimatedTime / 2)}` : `Arriving by ${getArrivalTime(activeOrders[0]?.estimatedTime / 2)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-display text-lg font-black leading-tight">£{activeOrders.reduce((sum, o) => sum + o.estimatedPay, 0).toFixed(2)}</p>
                          <p className="text-[8px] font-black text-blue-500 tracking-widest uppercase">Ongoing</p>
                        </div>
                        <button onClick={() => setIsNavigating(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                          <X size={20} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Parks/Green areas */}
                <div className="absolute inset-0 opacity-20" style={{ 
                  backgroundImage: `radial-gradient(circle, ${theme === 'dark' ? '#1d3a33' : '#a3d9a5'} 25%, transparent 85%), radial-gradient(circle, ${theme === 'dark' ? '#142a24' : '#88c98a'} 15%, transparent 70%)`,
                  backgroundSize: `${600 * zoom}px ${600 * zoom}px, ${500 * zoom}px ${500 * zoom}px`,
                  transform: location ? `translate(${(location.longitude * PARK_SCALE + mapOffset.x) % (600 * zoom)}px, ${(location.latitude * PARK_SCALE + mapOffset.y) % (600 * zoom)}px)` : 'none'
                }} />

                {/* Surge Zones Visualization */}
                {location && !isLowPerformance && activeSurgeAreas.map((area, i) => {
                  const x = area.lng * MAP_SCALE + mapOffset.x;
                  const y = -area.lat * MAP_SCALE + mapOffset.y;
                  return (
                    <motion.div
                      key={`surge-zone-${i}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: [0.1, 0.2, 0.1],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="absolute rounded-full border-4 border-blue-500/30 bg-blue-500/10 pointer-events-none"
                      style={{
                        width: area.radius * 2 * MAP_SCALE,
                        height: area.radius * 2 * MAP_SCALE,
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                        zIndex: 10
                      }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black text-white whitespace-nowrap shadow-xl">
                        {area.multiplier}x Surge
                      </div>
                    </motion.div>
                  );
                })}

                {/* Hotspots (Busy Areas) */}
                {location && !isLowPerformance && hotspots.map((spot, i) => {
                  const x = (spot.longitude - location.longitude) * MAP_SCALE + mapOffset.x;
                  const y = (location.latitude - spot.latitude) * MAP_SCALE + mapOffset.y;
                  return (
                    <motion.div 
                      key={`hotspot-${i}`}
                      animate={{ 
                        scale: [1, 1.2, 1], 
                        opacity: [spot.intensity * 0.2, spot.intensity * 0.4, spot.intensity * 0.2] 
                      }}
                      transition={{ duration: 5 + i, repeat: Infinity }}
                      className="absolute rounded-full bg-orange-600 blur-[40px] pointer-events-none"
                      style={{ 
                        width: spot.size * zoom,
                        height: spot.size * zoom,
                        left: '50%', 
                        top: '50%', 
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` 
                      }}
                    />
                  );
                })}

                {/* Mock Restaurants (Busy Map) */}
                {location && MOCK_RESTAURANTS.map((rest, i) => {
                  const x = rest.offset.lng * MAP_SCALE + mapOffset.x;
                  const y = -rest.offset.lat * MAP_SCALE + mapOffset.y;
                  const isOrderActive = activeOrders.some(o => o.restaurantName === rest.name);
                  
                  return (
                    <motion.div 
                      key={`rest-${rest.name}`}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRestaurant(rest);
                      }}
                      className="absolute cursor-pointer flex flex-col items-center pointer-events-auto"
                      style={{ 
                        left: '50%', 
                        top: '50%', 
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                        display: isOrderActive ? 'none' : 'flex'
                      }}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${rest.busyness === 'High' ? 'bg-red-500' : rest.busyness === 'Medium' ? 'bg-orange-500' : 'bg-green-500'}`}>
                        <Coffee size={12} className="text-white" />
                      </div>
                      <span className={`text-[8px] font-black mt-1 px-1.5 py-0.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm ${theme === 'dark' ? 'text-black' : 'text-black'}`}>
                        {rest.name}
                      </span>
                    </motion.div>
                  );
                })}

                {/* Restaurant Busyness Modal */}
                <AnimatePresence>
                  {selectedRestaurant && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-32 left-6 right-6 bg-white rounded-3xl p-6 shadow-2xl z-[300] text-black"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-black">{selectedRestaurant.name}</h3>
                          <p className="text-gray-400 font-bold">Popular Restaurant</p>
                        </div>
                        <button onClick={() => setSelectedRestaurant(null)} className="p-2 bg-gray-100 rounded-full">
                          <X size={20} />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                        <div className={`w-3 h-3 rounded-full ${selectedRestaurant.busyness === 'High' ? 'bg-red-500 animate-pulse' : selectedRestaurant.busyness === 'Medium' ? 'bg-orange-500' : 'bg-green-500'}`} />
                        <span className="font-black">{selectedRestaurant.busyness} Demand</span>
                        <span className="text-gray-400 font-bold ml-auto">~5 min wait</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Simulated Street Labels */}
                <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
                  {[
                    { name: "High St", x: 100, y: 200 },
                    { name: "London Rd", x: 400, y: 500 },
                    { name: "Park Ave", x: 700, y: 100 },
                    { name: "Station Way", x: 200, y: 800 },
                    { name: "Broadway", x: 600, y: 400 },
                  ].map((label, i) => (
                    <div 
                      key={i}
                      className={`absolute text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}
                      style={{ 
                        left: label.x * zoom, 
                        top: label.y * zoom,
                        transform: location ? `translate(${(location.longitude * LABEL_SCALE + mapOffset.x) % (1000 * zoom)}px, ${(location.latitude * LABEL_SCALE + mapOffset.y) % (1000 * zoom)}px)` : 'none'
                      }}
                    >
                      {label.name}
                    </div>
                  ))}
                </div>

                {/* Region Outlines (Simulated) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                  <path 
                    d="M 100 100 Q 200 50 300 100 T 500 100 M 50 300 Q 150 250 250 300 T 450 300 M 200 500 Q 300 450 400 500 T 600 500" 
                    fill="none" 
                    stroke="blue" 
                    strokeWidth="2" 
                    strokeDasharray="5,5"
                  />
                  <path 
                    d="M 150 150 L 250 100 L 350 150 L 250 200 Z M 400 400 L 500 350 L 600 400 L 500 450 Z" 
                    fill="rgba(59, 130, 246, 0.05)" 
                    stroke="blue" 
                    strokeWidth="1.5"
                  />
                </svg>

                  {/* Driver Marker */}
                  <motion.div 
                    className="absolute z-[220]"
                    animate={{ 
                      left: (centerX || window.innerWidth/2) + (mapOffset.x || 0),
                      top: (centerY || window.innerHeight/2) + (mapOffset.y || 0),
                      rotate: heading || 0
                    }}
                  transition={{ type: "spring", stiffness: 60, damping: 20 }}
                >
                  <div className="relative group -translate-x-1/2 -translate-y-1/2">
                    <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full scale-150" />
                    <div className="w-12 h-12 bg-[#0a0a0a] rounded-2xl border-2 border-blue-500 shadow-[0_0_25px_0_rgba(59,130,246,0.6)] flex items-center justify-center p-2 relative overflow-hidden transition-transform hover:scale-110">
                      <CarIcon className="text-blue-500 w-full h-full fill-blue-500/10" strokeWidth={2.5} />
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent" />
                    </div>
                    {/* Animated Heading Arrow */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                      <motion.div 
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-3 h-3 bg-blue-500 rotate-45 shadow-[0_0_10px_rgba(59,130,246,0.5)] border border-white/20"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Active and Pending Trip Paths */}
                {location && (isNavigating || pendingOrder) && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-[100]">
                    {/* Path for Pending Order */}
                    {pendingOrder && (
                      <>
                        <motion.path 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.4 }}
                          d={`M ${(centerX || window.innerWidth/2) + (mapOffset.x || 0)} ${(centerY || window.innerHeight/2) + (mapOffset.y || 0)} L ${((centerX || window.innerWidth/2) + (pendingOrder.pickupLocation.longitude - location.longitude) * MAP_SCALE + (mapOffset.x || 0))} ${((centerY || window.innerHeight/2) + (location.latitude - pendingOrder.pickupLocation.latitude) * MAP_SCALE + (mapOffset.y || 0))} L ${((centerX || window.innerWidth/2) + (pendingOrder.customerLocation.longitude - location.longitude) * MAP_SCALE + (mapOffset.x || 0))} ${((centerY || window.innerHeight/2) + (location.latitude - pendingOrder.customerLocation.latitude) * MAP_SCALE + (mapOffset.y || 0))}`}
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth={6 * zoom} 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          strokeDasharray="12,12"
                        />
                      </>
                    )}
                    
                    {/* Main Nav Path */}
                    {isNavigating && routeWaypoints.length > 0 && (
                      <>
                        <motion.path 
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.8 }}
                          d={`M ${(centerX || window.innerWidth/2) + (mapOffset.x || 0)} ${(centerY || window.innerHeight/2) + (mapOffset.y || 0)} ${routeWaypoints.map(wp => {
                            const x = (wp.longitude - location.longitude) * MAP_SCALE + (mapOffset.x || 0);
                            const y = (location.latitude - wp.latitude) * MAP_SCALE + (mapOffset.y || 0);
                            return `L ${(centerX || window.innerWidth/2) + x} ${(centerY || window.innerHeight/2) + y}`;
                          }).join(' ')}`}
                          fill="none" 
                          stroke="#2563eb" 
                          strokeWidth={8 * zoom} 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                        <motion.path 
                          d={`M ${(centerX || window.innerWidth/2) + (mapOffset.x || 0)} ${(centerY || window.innerHeight/2) + (mapOffset.y || 0)} ${routeWaypoints.map(wp => {
                            const x = (wp.longitude - location.longitude) * MAP_SCALE + (mapOffset.x || 0);
                            const y = (location.latitude - wp.latitude) * MAP_SCALE + (mapOffset.y || 0);
                            return `L ${(centerX || window.innerWidth/2) + x} ${(centerY || window.innerHeight/2) + y}`;
                          }).join(' ')}`}
                          fill="none" 
                          stroke="white" 
                          strokeWidth={2 * zoom} 
                          strokeDasharray="4,12"
                          strokeLinecap="round"
                          animate={{ strokeDashoffset: [-16, 0] }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      </>
                    )}
                  </svg>
                )}

                {/* Pending Order Pins on Main Map */}
                {location && pendingOrder && (
                   <div className="absolute inset-0 pointer-events-none z-[220]">
                      {[
                        { loc: pendingOrder.pickupLocation, type: 'pickup', name: pendingOrder.type === 'delivery' ? pendingOrder.restaurantName : 'Rider Pickup' },
                        { loc: pendingOrder.customerLocation, type: 'dropoff', name: pendingOrder.type === 'delivery' ? 'Customer' : 'Dropoff' }
                      ].map((pin, pidx) => {
                        const x = (pin.loc.longitude - location.longitude) * MAP_SCALE + (mapOffset.x || 0);
                        const y = (location.latitude - pin.loc.latitude) * MAP_SCALE + (mapOffset.y || 0);
                        return (
                          <motion.div
                            key={`pending-pin-${pidx}`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute flex flex-col items-center"
                            style={{ 
                              left: (centerX || window.innerWidth/2) + x,
                              top: (centerY || window.innerHeight/2) + y,
                              transform: 'translate(-50%, -100%)'
                            }}
                          >
                            <div className="bg-orange-500 p-2 rounded-full border-2 border-white shadow-xl">
                              {pin.type === 'pickup' ? <Coffee size={14} className="text-white" /> : <Navigation size={14} className="text-white" />}
                            </div>
                            <div className="mt-1 px-2 py-0.5 bg-black/80 rounded text-[8px] font-black text-white whitespace-nowrap">
                              {pin.name}
                            </div>
                            <div className="w-0.5 h-3 bg-orange-500" />
                          </motion.div>
                        );
                      })}
                   </div>
                )}

                {/* All Active Trip Markers (Pickup/Dropoff) */}
                {location && currentStops.map((stop, i) => {
                  const x = (stop.location.longitude - location.longitude) * MAP_SCALE + (mapOffset.x || 0);
                  const y = (location.latitude - stop.location.latitude) * MAP_SCALE + (mapOffset.y || 0);
                  
                  const isCurrentTarget = i === 0 && isNavigating;
                  const order = activeOrders.find(o => o.id === stop.orderId);
                  
                  if (!order) return null;

                  return (
                    <motion.div 
                      key={`stop-pin-${stop.orderId}-${stop.type}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: isCurrentTarget ? 1.2 : 1 }}
                      className="absolute z-[210] flex flex-col items-center"
                      style={{ 
                        left: (centerX || window.innerWidth/2) + x,
                        top: (centerY || window.innerHeight/2) + y,
                        transform: 'translate(-50%, -100%)'
                      }}
                    >
                      <div className={`relative ${isCurrentTarget ? 'z-[250]' : 'z-[210]'}`}>
                        <div className={`w-10 h-10 rounded-full shadow-2xl flex items-center justify-center border-4 border-[#1a1a1a] transition-all ${
                          stop.type === 'pickup' ? 'bg-blue-600 scale-110 shadow-blue-600/30' : 'bg-green-600 shadow-green-600/30'
                        }`}>
                          {stop.type === 'pickup' ? (
                            activeOrders.find(o => o.id === stop.orderId)?.type === 'delivery' ? <Utensils size={18} className="text-white" /> : <User size={18} className="text-white" />
                          ) : (
                            <MapPin size={18} className="text-white" />
                          )}
                        </div>
                        {isCurrentTarget && (
                          <motion.div 
                            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute -inset-2 bg-blue-500 rounded-full blur-md -z-10"
                          />
                        )}
                        <div className="absolute top-1/2 left-full ml-3 -translate-y-1/2 px-3 py-1.5 bg-black/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl whitespace-nowrap">
                          <p className="text-[10px] font-black text-white uppercase tracking-wider">
                            {stop.label}
                          </p>
                        </div>
                      </div>
                      <div className={`w-1.5 h-6 ${stop.type === 'pickup' ? 'bg-blue-600' : 'bg-green-600'} rounded-full mt-[-2px] border border-[#1a1a1a]`} />
                    </motion.div>
                  );
                })}

                {location && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Pulsing blue dot for driver */}
                    <div className="relative z-10" style={{ transform: `translate(${mapOffset.x}px, ${mapOffset.y}px)` }}>
                      {user.isOnline ? (
                        <div className="w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-blue-500">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <Navigation size={18} className="text-white fill-white" style={{ transform: 'rotate(45deg)' }} />
                          </div>
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-[0_0_20px_rgba(59,130,246,0.8)] flex items-center justify-center">
                          <Navigation size={16} className="text-white fill-white" style={{ transform: 'rotate(45deg)' }} />
                        </div>
                      )}
                      <div className="absolute -inset-6 bg-blue-500/30 rounded-full animate-ping" />
                      {pendingOrder && (
                        <motion.div 
                          animate={{ scale: [1, 4], opacity: [0.5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 bg-blue-400 rounded-full"
                        />
                      )}
                    </div>

                    {/* Surge Badges and More Buttons */}
                    {user.isOnline && !isNavigating && (
                      <>
                        <div className="absolute top-1/4 right-1/4 bg-blue-600 text-white px-3 py-1 rounded-lg font-black shadow-lg flex items-center gap-1">
                          <span>1.4x</span>
                        </div>
                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            sendNotification("Trip Planner", "New high-demand area detected in Shoreditch. Head there for 1.5x surge!");
                            setIsDestFilterOpen(true);
                          }}
                          className="absolute bottom-40 left-4 bg-blue-600 text-white px-3 py-2 rounded-xl font-black shadow-xl flex items-center gap-2 pointer-events-auto z-40"
                        >
                          <ArrowUp size={14} />
                          <span className="text-xs">More...</span>
                        </motion.button>
                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            sendNotification("Surge Alert", "Surge is active in your current area. Earn an extra £2 per delivery!");
                            setIsSafetyToolkitOpen(true);
                          }}
                          className="absolute top-40 right-4 bg-blue-600 text-white px-3 py-2 rounded-xl font-black shadow-xl flex items-center gap-2 pointer-events-auto z-40"
                        >
                          <ArrowUp size={14} />
                          <span className="text-xs">More...</span>
                        </motion.button>
                      </>
                    )}

                    {/* Restaurant and Customer markers */}
                    {location && activeOrders.filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter).map(order => {
                      const isPickup = order.status === 'accepted';
                      const target = isPickup 
                        ? (order.type === 'delivery' ? order.restaurantLocation : order.pickupLocation) 
                        : order.customerLocation;
                      
                      if (!target) return null;

                      const x = (target.longitude - location.longitude) * MAP_SCALE + mapOffset.x;
                      const y = (location.latitude - target.latitude) * MAP_SCALE + mapOffset.y;
                      const isSelected = selectedMarkerId === order.id;
                      
                      return (
                        <div 
                          key={order.id} 
                          className="absolute transition-transform duration-1000 pointer-events-auto cursor-pointer" 
                          style={{ transform: `translate(${x}px, ${y}px)`, zIndex: isSelected ? 100 : 10 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMarkerId(isSelected ? null : order.id);
                          }}
                        >
                          {isSelected && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white p-2 rounded-lg shadow-2xl border border-white/20 min-w-[120px] z-50"
                            >
                              <div className="text-[10px] font-black uppercase text-blue-400 mb-1">
                                {isPickup ? 'Pickup' : 'Dropoff'}
                              </div>
                              <div className="text-xs font-bold leading-tight mb-1">
                                {isPickup ? order.restaurantName : order.customerName}
                              </div>
                              <div className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-1 text-[10px] font-bold">
                                  <Navigation size={10} />
                                  {distanceToTarget(order)} mi
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold">
                                  <Clock size={10} />
                                  {Math.floor(parseFloat(distanceToTarget(order)) * 5 + 2)} min
                                </div>
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black" />
                            </motion.div>
                          )}
                          <div className={`p-2 rounded-full border-2 border-white shadow-xl transition-transform ${isSelected ? 'scale-125' : ''} ${isPickup ? 'bg-green-500' : 'bg-blue-600'}`}>
                            {isPickup ? <Coffee size={16} className="text-white" /> : <User size={16} className="text-white" />}
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-bold text-white whitespace-nowrap">
                            {isPickup ? order.restaurantName : order.customerName}
                          </div>
                        </div>
                      );
                    })}

                    {/* Pending Order Marker (Matching) */}
                    {location && pendingOrder && (
                      <>
                        {[(pendingOrder.type === 'delivery' ? pendingOrder.restaurantLocation : pendingOrder.pickupLocation), pendingOrder.customerLocation].map((target, i) => {
                          if (!target) return null;
                          const x = (target.longitude - location.longitude) * MAP_SCALE + mapOffset.x;
                          const y = (location.latitude - target.latitude) * MAP_SCALE + mapOffset.y;
                          return (
                            <motion.div 
                              key={`pending-${i}`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute transition-transform duration-1000 pointer-events-none" 
                              style={{ transform: `translate(${x}px, ${y}px)`, zIndex: 150 }}
                            >
                              <div className={`p-2 rounded-full border-2 border-white shadow-xl ${pendingOrder.isMatching ? 'bg-orange-500 animate-pulse' : 'bg-blue-500'}`}>
                                {i === 0 ? <Coffee size={16} className="text-white" /> : <User size={16} className="text-white" />}
                              </div>
                              <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 rounded text-[8px] font-black text-white whitespace-nowrap shadow-lg ${pendingOrder.isMatching ? 'bg-orange-600' : 'bg-blue-600'}`}>
                                {i === 0 ? (pendingOrder.isMatching ? 'PICKUP MATCH' : 'PICKUP TRIP') : (pendingOrder.isMatching ? 'DROPOFF MATCH' : 'DROPOFF TRIP')}
                              </div>
                            </motion.div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}

                {/* Map Action Buttons */}
                {user.isOnline && (
                  <div className="absolute bottom-32 left-4 right-4 flex flex-col gap-4 items-end pointer-events-none">
                    <div className="flex flex-col gap-2 pointer-events-auto">
                      <button 
                        onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))}
                        className="w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center text-black border border-gray-100 active:scale-95 transition-transform"
                      >
                        <Plus size={24} />
                      </button>
                      <button 
                        onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.4))}
                        className="w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center text-black border border-gray-100 active:scale-95 transition-transform"
                      >
                        <Minus size={24} />
                      </button>
                    </div>
                    <button 
                      onClick={() => setIsNightMode(!isNightMode)}
                      className="w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center text-black border border-gray-100 pointer-events-auto active:scale-90 transition-transform"
                    >
                      {isNightMode ? <Sun size={24} /> : <Moon size={24} />}
                    </button>
                    <div className="flex justify-between items-center w-full">
                      <div className="flex gap-2 pointer-events-auto">
                        <button 
                          onClick={() => setIsSafetyToolkitOpen(true)}
                          className="w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center text-blue-600 border border-gray-100 active:scale-90 transition-transform"
                        >
                          <Shield size={24} />
                        </button>
                        <button 
                          onClick={() => setIsVehicleSettingsOpen(true)}
                          className="w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center text-black border border-gray-100 active:scale-90 transition-transform relative"
                        >
                          <Settings2 size={24} />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                            <div className="w-1 h-1 bg-white rounded-full" />
                          </div>
                        </button>
                      </div>
                      <div className="flex gap-2 pointer-events-auto">
                        <button 
                          onClick={() => {
                            // Re-center logic
                            setMapOffset({ x: 0, y: 0 });
                            sendNotification("GPS Centered", "Map view reset to your current location.");
                          }}
                          className="w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center text-black border border-gray-100 active:scale-90 transition-transform"
                        >
                          <Target size={24} />
                        </button>
                        <button 
                          onClick={() => setIsInboxOpen(true)}
                          className="w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center text-blue-600 border border-gray-100 active:scale-90 transition-transform"
                        >
                          <Bell size={24} />
                          {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                              {notifications.length}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Search Modal */}
              <AnimatePresence>
                {isSearchOpen && (
                  <div className="absolute inset-0 z-[500] flex items-start justify-center p-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSearchOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className={`w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 ${theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black'}`}>
                      <div className="flex items-center gap-4 mb-6">
                        <Search className="text-gray-400" />
                        <input 
                          autoFocus
                          type="text" 
                          placeholder="Search for restaurants or areas..." 
                          className="flex-1 bg-transparent border-none outline-none font-bold text-lg"
                        />
                        <button onClick={() => setIsSearchOpen(false)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-full"><X size={20} /></button>
                      </div>
                      <div className="space-y-4">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Recent Searches</p>
                        {['Shoreditch', 'Westfield Stratford', 'Soho'].map(item => (
                          <button key={item} className="w-full flex items-center gap-4 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                            <Clock size={16} className="text-gray-400" />
                            <span className="font-bold">{item}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Inbox Modal */}
              <AnimatePresence>
                {isInboxOpen && (
                  <div className="absolute inset-0 z-[500] flex items-end justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsInboxOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className={`w-full max-w-md rounded-[40px] p-8 shadow-2xl relative z-10 max-h-[80vh] overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black'}`}>
                      <div className="flex justify-between items-center mb-8">
                        <h2 className="font-display text-3xl font-black tracking-tight">Inbox</h2>
                        <button onClick={() => setIsInboxOpen(false)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-full"><X size={24} /></button>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pb-10">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Mail size={48} className="mb-4 opacity-20" />
                            <p className="font-bold">No new messages</p>
                          </div>
                        ) : (
                          notifications.map((note, i) => (
                            <div key={i} className={`p-5 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Update</p>
                              </div>
                              <p className="font-bold leading-relaxed">{note}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {isDestFilterOpen && (
                  <div className="absolute inset-0 z-[250] flex items-end justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsDestFilterOpen(false)}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div 
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 100, opacity: 0 }}
                      className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl relative z-10"
                    >
                      <div className="flex justify-between items-center mb-8">
                        <h2 className="font-display text-3xl font-black text-black tracking-tight">Set Destination</h2>
                        <button onClick={() => setIsDestFilterOpen(false)} className="p-2 bg-gray-100 rounded-full text-black">
                          <X size={24} />
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Current Filter</p>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
                              <Navigation size={24} />
                            </div>
                            <div>
                              <p className="text-xl font-black text-black">Heading Home</p>
                              <p className="text-sm font-bold text-gray-400">2 uses remaining today</p>
                            </div>
                          </div>
                        </div>

                        <div className="relative">
                          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                          <input 
                            type="text" 
                            placeholder="Where to?" 
                            className="w-full bg-gray-100 border-none rounded-2xl py-6 pl-16 pr-6 text-xl font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                          />
                        </div>

                        <button 
                          onClick={() => setIsDestFilterOpen(false)}
                          className="w-full py-6 bg-black text-white rounded-2xl text-xl font-black shadow-xl active:scale-95 transition-transform"
                        >
                          Set Destination
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Safety Toolkit Modal */}
              <AnimatePresence>
                {isSafetyToolkitOpen && (
                  <div className="absolute inset-0 z-[250] flex items-end justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsSafetyToolkitOpen(false)}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div 
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 100, opacity: 0 }}
                      className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl relative z-10"
                    >
                      <div className="flex justify-between items-center mb-8">
                        <h2 className="font-display text-3xl font-black text-black tracking-tight">Safety Toolkit</h2>
                        <button onClick={() => setIsSafetyToolkitOpen(false)} className="p-2 bg-gray-100 rounded-full text-black">
                          <X size={24} />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <button className="w-full p-6 bg-red-600 text-white rounded-2xl flex items-center justify-between shadow-lg active:scale-95 transition-transform">
                          <div className="flex items-center gap-4">
                            <ShieldAlert size={32} />
                            <div className="text-left">
                              <p className="text-xl font-black">Emergency Assistance</p>
                              <p className="text-sm font-bold opacity-80">Call 911</p>
                            </div>
                          </div>
                          <Phone size={24} />
                        </button>

                        <button className="w-full p-6 bg-gray-50 text-black rounded-2xl flex items-center justify-between border border-gray-100 active:scale-95 transition-transform">
                          <div className="flex items-center gap-4">
                            <Share2 size={32} className="text-blue-600" />
                            <div className="text-left">
                              <p className="text-xl font-black">Share My Trip</p>
                              <p className="text-sm font-bold text-gray-400">Let friends track you</p>
                            </div>
                          </div>
                          <ChevronRight size={24} className="text-gray-300" />
                        </button>

                        <button className="w-full p-6 bg-gray-50 text-black rounded-2xl flex items-center justify-between border border-gray-100 active:scale-95 transition-transform">
                          <div className="flex items-center gap-4">
                            <Camera size={32} className="text-blue-600" />
                            <div className="text-left">
                              <p className="text-xl font-black">Record My Trip</p>
                              <p className="text-sm font-bold text-gray-400">Audio and video recording</p>
                            </div>
                          </div>
                          <ChevronRight size={24} className="text-gray-300" />
                        </button>
                      </div>

                      <p className="mt-8 text-center text-xs font-bold text-gray-400">
                        Your safety is our priority. These tools are available 24/7.
                      </p>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Top Controls */}
              {!user.isOnline ? (
                <div className="absolute top-4 left-4 right-4 flex flex-col gap-4 z-50">
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSideMenuOpen(true);
                      }} 
                      className={`p-3 rounded-full shadow-xl active:scale-95 transition-transform ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}
                    >
                      <Menu size={24} />
                    </button>
                    
                    {/* Top Tabs (Status, Browse, Earnings) */}
                    <div className="flex bg-black/80 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-2xl">
                      {(['status', 'browse', 'earnings'] as const).map(tab => (
                        <button 
                          key={tab}
                          onClick={() => {
                            setActiveTopTab(tab);
                            if (tab === 'earnings') setCurrentScreen('earnings');
                            if (tab === 'browse') setCurrentScreen('opportunities');
                          }}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTopTab === tab ? 'bg-white text-black' : 'text-gray-400'}`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button className={`p-3 rounded-full shadow-xl ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}>
                        <Search size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute top-6 left-4 right-4 flex justify-between items-center z-50">
                  <button 
                    onClick={() => setIsSearchOpen(true)} 
                    className="w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-black active:scale-95 transition-transform"
                  >
                    <Search size={24} />
                  </button>
                  
                  <motion.button 
                    initial={{ y: -50 }}
                    animate={{ y: 0 }}
                    onClick={() => setCurrentScreen('earnings')}
                    className="bg-black text-white px-6 py-2.5 rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform border border-white/10"
                  >
                    <span className="font-display text-2xl font-black tracking-tighter">£{earnings.toFixed(2)}</span>
                  </motion.button>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSideMenuOpen(true);
                    }}
                    className="relative w-12 h-12 rounded-full shadow-xl active:scale-95 transition-transform overflow-hidden border-2 border-white"
                  >
                    <img src={user.profilePic || "https://picsum.photos/seed/driver/100/100"} alt="Profile" className="w-full h-full object-cover" />
                    <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                  </button>
                </div>
              )}

              {/* Bottom Menu Toggle Button / Map Status Bar */}
              {!pendingOrder && !isBottomMenuOpen && (
                <div className="absolute bottom-0 left-0 right-0 z-[150]">
                  {user.isOnline ? (
                    <motion.div 
                      key="online-bar"
                      initial={{ y: 100 }}
                      animate={{ y: 0 }}
                      className="w-full bg-white shadow-[0_-15px_40px_rgba(0,0,0,0.2)] flex flex-col rounded-t-[32px] overflow-hidden"
                    >
                      <div 
                        onClick={() => setIsBottomMenuOpen(true)}
                        className="flex items-center justify-between px-8 py-5 cursor-pointer active:bg-gray-50 transition-colors"
                      >
                        <button className="text-black" onClick={(e) => { e.stopPropagation(); setIsSideMenuOpen(true); }}>
                          <Menu size={28} />
                        </button>
                        
                        <div className="flex flex-col items-center flex-1">
                          {currentStop && distanceToStop(currentStop) <= 0.1 ? (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNextStep(currentStop.orderId);
                              }}
                              className={`px-8 py-3 rounded-full font-display font-black text-lg uppercase tracking-tighter shadow-lg transition-all ${
                                currentStop.type === 'pickup' 
                                  ? 'bg-blue-600 text-white shadow-blue-500/20' 
                                  : 'bg-green-600 text-white shadow-green-500/20'
                              }`}
                            >
                              {currentStop.type === 'pickup' ? (activeOrders.find(o => o.id === currentStop.orderId)?.type === 'delivery' ? 'Confirm Pickup' : 'Confirm Arrival') : 'Confirm Dropoff'}
                            </motion.button>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="font-display text-2xl font-black text-black tracking-tight leading-none">
                                {activeOrders.length > 0 
                                  ? `${activeOrders.length} ${activeOrders.length === 1 ? 'Trip' : 'Trips'} • £${activeOrders.reduce((sum, o) => sum + o.estimatedPay, 0).toFixed(2)}`
                                  : 'Finding trips'}
                              </span>
                              <div className="flex items-center gap-3 mt-1.5">
                                <div className="flex items-center gap-1">
                                  <motion.div 
                                    animate={{ opacity: [1, 0, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="w-1.5 h-1.5 rounded-full bg-blue-500"
                                  />
                                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                    {currentStop ? `${currentStop.label} • ${distanceToStop(currentStop).toFixed(1)} mi` : user.isOnline ? 'Online' : 'Offline'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-gray-300">•</span>
                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${busynessMode === 'High' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
                                  <TrendingUp size={10} />
                                  <span className="text-[9px] font-black uppercase tracking-wider">{busynessMode} Demand</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
  
                        <button className="text-black p-2" onClick={(e) => { e.stopPropagation(); setIsBottomMenuOpen(true); }}>
                          <List size={28} />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center w-full relative">
                      <button 
                        onClick={() => setIsVehicleSettingsOpen(true)}
                        className={`absolute top-6 left-6 z-[160] p-3 rounded-full shadow-2xl backdrop-blur-md border border-white/10 ${theme === 'dark' ? 'bg-black/80 text-white' : 'bg-white/90 text-black shadow-black/5'}`}
                      >
                        <Settings size={20} />
                      </button>

                      {/* GO Button Container - Shifted for prominence */}
                      <motion.div 
                        key="offline-go"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute bottom-[280px] left-1/2 -translate-x-1/2 z-[170]"
                      >
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (checkDocsExpired()) {
                              sendNotification("Documents Expired", "Please update your documents to go online.");
                              setCurrentScreen('documents');
                              return;
                            }
                            if (user.faceVerified) {
                              setUser(u => ({ ...u, isOnline: true }));
                              playUberSound('accept');
                            } else {
                              setIsVerifyingToOnline(true);
                              playUberSound('order');
                              setCurrentScreen('face_verification');
                            }
                          }}
                          className="w-28 h-28 bg-blue-600 text-white rounded-full font-display font-black text-3xl shadow-[0_20px_50px_rgba(37,99,235,0.4)] flex flex-col items-center justify-center relative active:scale-90 transition-transform border-[6px] border-white group"
                        >
                          <span className="relative z-10">GO</span>
                          <motion.div 
                            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }} 
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-blue-400 rounded-full" 
                          />
                        </button>
                      </motion.div>

                      {/* Dashboard Feed (Offline) */}
                      <div className="w-full bg-[#0c0c0d] rounded-t-[40px] shadow-[0_-20px_80px_rgba(0,0,0,0.5)] border-t border-white/5 pt-6 pb-12 px-6 z-[120] max-h-[320px] overflow-y-auto no-scrollbar">
                        <div className="flex justify-center mb-6">
                          <div className="w-12 h-1.5 rounded-full bg-white/10" />
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div 
                              onClick={() => setCurrentScreen('earnings')}
                              className={`p-6 rounded-[30px] border-2 transition-all active:scale-95 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}
                            >
                              <div className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-1">Today</div>
                              <div className="text-2xl font-black">£{earnings.toFixed(2)}</div>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 mt-2 lowercase">
                                <TrendingUp size={12} />
                                details
                              </div>
                            </div>
                            <div 
                              onClick={() => setCurrentScreen('ratings')}
                              className={`p-6 rounded-[30px] border-2 transition-all active:scale-95 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}
                            >
                              <div className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-1">Rating</div>
                              <div className="text-2xl font-black">{user.rating.toFixed(2)} ★</div>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 mt-2 lowercase">
                                <Star size={12} fill="currentColor" />
                                partner
                              </div>
                            </div>
                          </div>

                          <div 
                            onClick={() => setIsVehicleSettingsOpen(true)}
                            className={`p-5 rounded-[32px] border-2 transition-all active:scale-[0.98] flex items-center justify-between col-span-2 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl">
                                {vehicleType === 'Car' ? <CarIcon size={24} /> : vehicleType === 'Bike' ? <BikeIcon size={24} /> : <Zap size={24} />}
                              </div>
                              <div>
                                <h3 className="font-black text-sm">Trip Preferences</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{vehicleType} • {selectedServices.length} Active</p>
                              </div>
                            </div>
                            <Settings size={18} className="text-gray-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Last Trip Card Overlay */}
              {!user.isOnline && lastTrip && showLastTripCard && (
                <div className="absolute bottom-32 left-4 right-4 z-[60] flex justify-center">
                  <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 flex flex-col items-center relative"
                  >
                    <button 
                      onClick={() => setShowLastTripCard(false)}
                      className="absolute top-4 right-4 p-1 bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors"
                    >
                      <X size={16} />
                    </button>
                    <div className="flex justify-between w-full items-center mb-4">
                      <Eye size={20} className="text-gray-300" />
                      <div className="flex flex-col items-center">
                        <span className="text-3xl font-black text-black">£{lastTrip.amount.toFixed(2)}</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Trip</span>
                      </div>
                      <HelpCircle size={20} className="text-gray-300" />
                    </div>
                    
                    <div className="flex flex-col items-center mb-4">
                      <span className="text-sm font-bold text-black">Today at {lastTrip.time}</span>
                      <span className="text-xs font-bold text-gray-400">{lastTrip.type}</span>
                    </div>

                    <button 
                      onClick={() => { setCurrentScreen('earnings'); setShowLastTripCard(false); }}
                      className="text-blue-600 font-black text-xs uppercase tracking-widest"
                    >
                      See all trips
                    </button>
                  </motion.div>
                </div>
              )}

              <AnimatePresence>
                {isBottomMenuOpen && (
                  <div className="absolute inset-0 z-[150]">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsBottomMenuOpen(false)}
                      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div 
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className={`absolute bottom-0 left-0 right-0 rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.5)] flex flex-col max-h-[70vh] ${theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black'}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col items-center pt-4 pb-2 shrink-0">
                        <div className={`w-12 h-1.5 rounded-full mb-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
                      </div>
                      
                      <div className="relative flex-1 flex flex-col min-h-0">
                        <div className="overflow-y-auto px-6 pb-20 custom-scrollbar flex-1">
                          {!user.isOnline ? (
                            <>
                              <div className="flex justify-between w-full mb-8 px-4 relative">
                                <button onClick={() => { setIsSideMenuOpen(true); setIsBottomMenuOpen(false); }} className="flex flex-col items-center gap-2">
                                  <div className={`p-4 rounded-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><Menu size={24} /></div>
                                  <span className="text-xs font-bold">Menu</span>
                                </button>
                                
                                <div className="relative -mt-12">
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    disabled={(lockoutUntil ? Date.now() < lockoutUntil : false) || Object.values(customerTimers).some(t => Number(t) > 0)}
                                    onClick={() => {
                                      if (!firebaseUser) {
                                        signInWithGoogle().catch(console.error);
                                        return;
                                      }
                                      if (user.faceVerified) {
                                        setUser(u => ({ ...u, isOnline: true }));
                                        setIsBottomMenuOpen(false);
                                        playUberSound('accept');
                                      } else {
                                        setIsVerifyingToOnline(true);
                                        playUberSound('order');
                                        setCurrentScreen('face_verification');
                                        setIsBottomMenuOpen(false);
                                      }
                                    }}
                                    className={`w-24 h-24 rounded-full border-4 border-white flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.5)] relative overflow-visible transition-all ${(lockoutUntil && Date.now() < lockoutUntil) || Object.values(customerTimers).some(t => Number(t) > 0) ? 'bg-gray-800 grayscale cursor-not-allowed' : 'bg-blue-600'}`}
                                  >
                                    <motion.div 
                                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }} 
                                      transition={{ duration: 2, repeat: Infinity }} 
                                      className="absolute inset-0 bg-white rounded-full" 
                                    />
                                    <span className="text-xl font-black tracking-widest relative z-10 text-white">{(lockoutUntil && Date.now() < lockoutUntil) || Object.values(customerTimers).some(t => Number(t) > 0) ? 'LOCKED' : 'GO'}</span>
                                  </motion.button>
                                </div>

                              <button onClick={() => setIsSearchOpen(true)} className="flex flex-col items-center gap-2">
                                <div className={`p-4 rounded-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><Search size={24} /></div>
                                <span className="text-xs font-bold">Search</span>
                              </button>
                            </div>

                            <div className={`w-full p-4 rounded-2xl flex items-center justify-between mb-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm">You're offline</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{user.deliveriesToday} deliveries today</span>
                                    <span className="text-[10px] opacity-30 text-white">•</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${busynessMode === 'High' ? 'text-orange-500' : busynessMode === 'Medium' ? 'text-blue-400' : 'text-gray-500'}`}>
                                      {busynessMode} Demand
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-gray-400 font-bold">{currentCity}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between w-full mb-8 px-4">
                              <button onClick={() => { setIsSideMenuOpen(true); setIsBottomMenuOpen(false); }} className="flex flex-col items-center gap-2">
                                <div className={`p-4 rounded-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><Menu size={24} /></div>
                                <span className="text-xs font-bold">Menu</span>
                              </button>
                              
                              <div className="flex flex-col items-center gap-2">
                                <div className="relative">
                                  <motion.div 
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 bg-blue-500 rounded-full"
                                  />
                                  <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg relative z-10">
                                    <Navigation size={28} className="animate-pulse" />
                                  </div>
                                </div>
                                <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase">Finding trips</span>
                              </div>

                              <button onClick={() => setIsSearchOpen(true)} className="flex flex-col items-center gap-2">
                                <div className={`p-4 rounded-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><Search size={24} /></div>
                                <span className="text-xs font-bold">Search</span>
                              </button>
                            </div>

                            <div className={`w-full p-6 rounded-3xl flex items-center justify-between mb-4 border-2 ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'}`}>
                              <div className="flex items-center gap-4">
                                <motion.div 
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                  className="w-3 h-3 bg-blue-500 rounded-full" 
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className={`font-black text-lg leading-none ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Finding trips</p>
                                    <div className="flex items-center gap-1 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/20">
                                      <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                                      <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Awake</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[10px] font-bold text-gray-400">{currentCity}</p>
                                    <span className="text-[10px] opacity-30 text-white">•</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${busynessMode === 'High' ? 'text-orange-500' : busynessMode === 'Medium' ? 'text-blue-400' : 'text-gray-400'}`}>
                                      {busynessMode} Demand
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => { setUser(u => ({ ...u, isOnline: false, faceVerified: false })); setIsBottomMenuOpen(false); }} 
                                className="bg-red-600 text-white px-6 py-3 rounded-full font-black text-sm active:scale-95 transition-transform shadow-lg"
                              >
                                GO OFFLINE
                              </button>
                            </div>
                          </>
                        )}

                        {/* Common scrollable items */}
                        <div className="space-y-6">
                          {/* Active Orders in Menu */}
                          {activeOrders.length > 0 ? (
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center justify-between mb-4 px-2">
                                  <h2 className="text-2xl font-black tracking-tighter uppercase italic">Active Operations</h2>
                                  <div className={`flex p-1 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                                    {(['all', 'accepted', 'picked_up'] as const).map((f) => (
                                      <button
                                        key={f}
                                        onClick={(e) => { e.stopPropagation(); setOrderStatusFilter(f); }}
                                        className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                          orderStatusFilter === f 
                                            ? (theme === 'dark' ? 'bg-blue-600 text-white shadow-xl' : 'bg-black text-white shadow-xl')
                                            : 'text-gray-400 opacity-60 hover:opacity-100'
                                        }`}
                                      >
                                        {f === 'all' ? 'All' : f === 'accepted' ? 'Accepted' : 'Picked Up'}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <AnimatePresence mode="popLayout">
                                  {activeOrders.filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter).map((order, idx) => (
                                    <motion.div 
                                      key={order.id} 
                                      initial={{ y: 20, opacity: 0 }} 
                                      animate={{ y: 0, opacity: 1 }} 
                                      exit={{ x: -100, opacity: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      className={`group relative p-5 rounded-[32px] border-2 transition-all active:scale-[0.97] ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-xl shadow-black/5'}`}
                                      onClick={() => {
                                        setViewingOrderDetailsId(order.id);
                                        setIsBottomMenuOpen(false);
                                      }}
                                    >
                                      <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${order.status === 'accepted' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                                            {order.type === 'delivery' ? <Utensils size={28} /> : <User size={28} />}
                                          </div>
                                          <div>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${order.status === 'accepted' ? 'text-blue-500' : 'text-green-500'}`}>
                                              {order.status === 'accepted' ? 'Incoming Pickup' : 'Ongoing Dropoff'}
                                            </p>
                                            <h3 className="font-display text-xl font-black leading-none">{order.status === 'accepted' ? order.restaurantName : order.customerName}</h3>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-display text-lg font-black text-blue-600">£{order.estimatedPay.toFixed(2)}</p>
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{getArrivalTime(order.estimatedTime)}</p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveChatOrderId(order.id);
                                            setIsBottomMenuOpen(false);
                                            setCurrentScreen('chat');
                                          }}
                                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
                                        >
                                          <MessageSquare size={16} />
                                          Message
                                        </button>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleNextStep(order.id);
                                            setIsBottomMenuOpen(false);
                                          }}
                                          className={`flex-[2] py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all ${
                                            order.status === 'accepted' ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-green-600 text-white shadow-green-500/30'
                                          }`}
                                        >
                                          {order.status === 'accepted' ? 'Start Pickup' : 'Start Dropoff'}
                                        </button>
                                      </div>
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                            </div>
                          ) : (
                            <div className="py-10 text-center">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Navigation size={32} className="text-gray-300" />
                              </div>
                              <p className="text-gray-400 font-bold">No active trips yet</p>
                            </div>
                          )}

                          <div 
                            onClick={() => setIsSafetyToolkitOpen(true)}
                            className={`p-4 rounded-2xl flex items-center gap-4 border cursor-pointer active:scale-95 transition-transform ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}
                          >
                            <div className="p-2 bg-blue-600 text-white rounded-lg"><ShieldCheck size={20} /></div>
                            <div>
                              <p className="text-sm font-black">Safety Toolkit</p>
                              <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Access emergency tools</p>
                            </div>
                          </div>
                          <div 
                            onClick={() => { setIsInboxOpen(true); setIsBottomMenuOpen(false); setCurrentScreen('inbox'); }}
                            className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer active:scale-95 transition-transform ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}
                          >
                            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}><Mail size={20} /></div>
                            <div>
                              <p className="text-sm font-black">Inbox</p>
                              <p className="text-[10px] text-gray-400 font-bold">Check your notifications</p>
                            </div>
                          </div>
                          <div 
                            onClick={() => { setCurrentScreen('earnings'); setIsBottomMenuOpen(false); }}
                            className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer active:scale-95 transition-transform ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}
                          >
                            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}><TrendingUp size={20} /></div>
                            <div>
                              <p className="text-sm font-black">Earnings Trend</p>
                              <p className="text-[10px] text-gray-400 font-bold">Busy area nearby</p>
                            </div>
                          </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Bottom Cards */}
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 pointer-events-none">
                <AnimatePresence>
                  {activeOrders.filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter).map((order, idx) => (
                    <motion.div 
                      key={order.id} 
                      initial={{ y: 100 }} 
                      animate={{ y: 0 }} 
                      exit={{ y: 100 }}
                      className="bg-white text-black rounded-xl shadow-xl overflow-hidden mb-2 cursor-pointer active:scale-[0.98] transition-transform pointer-events-auto"
                      onClick={() => setViewingOrderDetailsId(order.id)}
                    >
                      <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-blue-50">
                        <div className="flex items-center gap-2 text-blue-600 font-bold">
                          <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px] font-black">
                            {idx + 1}
                          </div>
                          <Navigation size={14} />
                          <span className="text-xs">{order.status === 'accepted' ? `Pickup: ${order.restaurantName}` : `Dropoff: ${order.customerName}`}</span>
                        </div>
                        <div className="text-[10px] font-bold text-gray-400">{distanceToTarget(order)} mi</div>
                      </div>
                      
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            {order.status === 'accepted' ? <Coffee size={20} /> : <User size={20} />}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm leading-tight">{order.status === 'accepted' ? order.restaurantName : order.customerName}</h3>
                            <p className="text-[10px] text-gray-500">{(order.items?.length || 0)} items • £{order.estimatedPay.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 items-center" onClick={(e) => e.stopPropagation()}>
                          {order.status === 'returning_to_restaurant' ? (
                            <button 
                              onClick={() => {
                                setActiveOrders(prev => prev.filter(o => o.id !== order.id));
                                sendNotification("Order Returned", `Order from ${order.restaurantName} returned successfully.`);
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-xl font-black text-[10px] active:scale-95 transition-transform"
                            >
                              RETURNED
                            </button>
                          ) : (
                            <>
                              <button 
                                onClick={() => setCancellingOrderId(order.id)} 
                                className={`w-10 h-10 rounded-full flex items-center justify-center border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-red-500' : 'bg-gray-50 border-gray-100 text-red-600'}`}
                              >
                                <X size={20} />
                              </button>
                              <button onClick={() => { setActiveChatOrderId(order.id); setCurrentScreen('chat'); }} className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-100 text-black'}`}>
                                <MessageSquare size={20} />
                              </button>
                              <button 
                                onClick={() => handleNextStep(order.id)} 
                                className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}
                              >
                                {order.status === 'accepted' ? 'Confirm Pickup' : 'Complete Delivery'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Order Details Modal */}
              <AnimatePresence>
                {viewingOrderDetailsId && activeOrders.find(o => o.id === viewingOrderDetailsId) && (
                  <OrderDetailsModal 
                    order={activeOrders.find(o => o.id === viewingOrderDetailsId)!}
                    theme={theme}
                    onClose={() => setViewingOrderDetailsId(null)}
                    onNextStep={handleNextStep}
                    getArrivalTime={getArrivalTime}
                    onOpenChat={(id) => {
                      setActiveChatOrderId(id);
                      setViewingOrderDetailsId(null);
                      setCurrentScreen('chat');
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Cancel Trip Modal */}
              <AnimatePresence>
                {cancellingOrderId && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }} 
                      animate={{ scale: 1, y: 0 }} 
                      exit={{ scale: 0.9, y: 20 }} 
                      className={`w-full max-w-sm rounded-[32px] p-8 shadow-2xl ${theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black'}`}
                    >
                      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <X size={32} strokeWidth={3} />
                      </div>
                      <h2 className="text-2xl font-black text-center mb-2">Cancel Trip?</h2>
                      <p className="text-center text-gray-400 font-bold mb-6">Select a reason for cancelling this trip.</p>
                      
                      <div className="space-y-2 mb-8 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {['Customer unavailable', 'Restaurant delay', 'Vehicle trouble', 'Safety concern', 'Other'].map(reason => (
                          <button
                            key={reason}
                            onClick={() => setSelectedCancelReason(reason)}
                            className={`w-full p-3 rounded-xl text-left font-bold transition-all ${
                              selectedCancelReason === reason 
                                ? 'bg-red-600 text-white' 
                                : theme === 'dark' ? 'bg-white/5 text-gray-300' : 'bg-gray-50 text-gray-600'
                            }`}
                          >
                            {reason}
                          </button>
                        ))}
                      </div>
                      
                      <div className="space-y-3">
                        <button 
                          disabled={!selectedCancelReason}
                          onClick={() => handleCancelOrder(cancellingOrderId, selectedCancelReason!)}
                          className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${
                            selectedCancelReason 
                              ? 'bg-red-600 text-white active:scale-95' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          CONFIRM CANCELLATION
                        </button>
                        <button 
                          onClick={() => {
                            setCancellingOrderId(null);
                            setSelectedCancelReason(null);
                          }}
                          className={`w-full py-4 rounded-2xl font-black text-lg active:scale-95 transition-transform ${theme === 'dark' ? 'bg-white/5 text-white' : 'bg-gray-100 text-black'}`}
                        >
                          KEEP TRIP
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Delivery Verification Modal */}
              <AnimatePresence>
                {verifyingDeliveryId && activeOrders.find(o => o.id === verifyingDeliveryId) && (
                  <DeliveryVerificationModal 
                    order={activeOrders.find(o => o.id === verifyingDeliveryId)!}
                    enteredPin={enteredPin}
                    setEnteredPin={setEnteredPin}
                    isPhotoCaptured={isPhotoCaptured}
                    setIsPhotoCaptured={setIsPhotoCaptured}
                    onComplete={() => {
                      const order = activeOrders.find(o => o.id === verifyingDeliveryId);
                      if (order) {
                        const vMethod = order.verificationMethod || (order.pin ? 'pin' : 'none');
                        if (vMethod === 'pin' && enteredPin === order.pin) {
                          handleCompleteDelivery(order.id);
                        } else if (vMethod === 'photo' && isPhotoCaptured) {
                           handleCompleteDelivery(order.id);
                        } else if (vMethod === 'none') {
                           handleCompleteDelivery(order.id);
                        } else if (vMethod === 'pin' && enteredPin.length === 4) {
                          sendNotification("Invalid PIN", "The PIN you entered is incorrect. Please try again.");
                          setEnteredPin("");
                        }
                      }
                    }}
                    onClose={() => setVerifyingDeliveryId(null)}
                  />
                )}
              </AnimatePresence>

              {/* Receipt Scan Modal */}
              <AnimatePresence>
                {isScanningReceipt && activeOrders.find(o => o.id === isScanningReceipt) && (
                  <ReceiptScanModal 
                    order={activeOrders.find(o => o.id === isScanningReceipt)!}
                    isVerifying={isVerifyingReceipt}
                    onVerify={(img) => handleVerifyReceipt(isScanningReceipt, img)}
                    onClose={() => {
                      setIsScanningReceipt(null);
                      setActiveOrders(prev => prev.map(o => o.id === isScanningReceipt ? { ...o, status: 'accepted' } : o));
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Pending Order Modal */}
              <AnimatePresence>
                {pendingOrder && (
                  <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="absolute inset-x-4 bottom-24 z-[60] flex justify-center">
                    <div className="bg-white text-black rounded-2xl overflow-hidden shadow-2xl w-full max-w-sm">
                      <div className="bg-blue-600 p-4 text-white text-center relative border-b border-white/10">
                        <div className="text-[10px] font-bold tracking-widest opacity-80 mb-1 uppercase">New Delivery Opportunity</div>
                        <div className="text-3xl font-black">£{pendingOrder.estimatedPay.toFixed(2)}</div>
                        <div className="text-[10px] font-bold opacity-80 mt-0.5">Includes expected tip</div>
                        <div className="mt-3 flex justify-center">
                          <div className="w-9 h-9 rounded-full border-4 border-white/20 flex items-center justify-center relative">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                              <circle 
                                cx="18" cy="18" r="14" 
                                fill="none" 
                                stroke="white" 
                                strokeWidth="3" 
                                strokeDasharray="87.92" 
                                strokeDashoffset={87.92 * (1 - orderExpiryTimer / 10)}
                                className="transition-all duration-1000 ease-linear"
                              />
                            </svg>
                            <span className="font-black text-xs">{orderExpiryTimer}</span>
                          </div>
                        </div>
                        <button onClick={handleDeclineOrder} className="absolute top-3 right-3 p-1.5 bg-black/10 rounded-full active:scale-90 transition-transform"><X size={16} /></button>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                              <div className="w-0.5 h-4 bg-gray-100" />
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-sm tracking-tight">{pendingOrder.restaurantName}</div>
                              <div className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">Delivery Task</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-blue-600">{getArrivalTime(pendingOrder.estimatedTime)}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">ETA</p>
                          </div>
                        </div>
                        <button onClick={handleAcceptOrder} className="w-full py-4 bg-black text-white rounded-xl font-black text-lg tracking-wide active:scale-95 transition-transform shadow-lg">ACCEPT</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          <AnimatePresence>
            {currentScreen === 'personal_details' && (
              <PersonalDetailsScreen 
                user={user}
                setUser={setUser}
                onClose={() => setCurrentScreen('account')}
                sendNotification={sendNotification}
                theme={theme}
                firebaseUser={firebaseUser}
              />
            )}
          </AnimatePresence>

          {currentScreen === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-white text-black flex flex-col">
              <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-white sticky top-0 z-10 shrink-0">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full active:scale-90 transition-transform">
                  <X size={22} />
                </button>
                <div className="flex-1 overflow-hidden">
                  <h2 className="font-black text-lg truncate leading-tight">
                    {activeOrders.find(o => o.id === activeChatOrderId)?.customerName || 'Customer'}
                  </h2>
                  <p className="text-[9px] text-gray-400 font-black tracking-widest uppercase truncate">Active Delivery</p>
                </div>
                <button className="p-3 bg-green-500 text-white rounded-full active:scale-95 transition-transform shadow-md">
                  <Phone size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 scroll-smooth no-scrollbar">
                <div className="flex justify-center p-2">
                  <div className="bg-white px-3 py-1.5 rounded-full border border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    Today • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {messages.filter(m => m.orderId === activeChatOrderId).map((msg, i, arr) => {
                  const isLast = i === arr.length - 1;
                  const showTime = isLast;

                  return (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${msg.sender === 'driver' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex flex-col max-w-[80%]">
                        <div className={`p-4 rounded-2xl font-bold text-sm shadow-sm ${
                          msg.sender === 'driver' 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : msg.text.includes('PIN is') 
                              ? 'bg-green-50 text-green-700 border-2 border-green-200' 
                              : 'bg-white text-black border border-gray-100 rounded-tl-none'
                        }`}>
                          {msg.text.includes('PIN is') ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-600 opacity-60">
                                <ShieldCheck size={12} />
                                Security Code Received
                              </div>
                              <div className="text-lg font-black tracking-tight">{msg.text}</div>
                            </div>
                          ) : msg.text}
                        </div>
                        {showTime && (
                          <span className={`text-[8px] font-black mt-1 text-gray-400 uppercase tracking-widest ${msg.sender === 'driver' ? 'text-right' : 'text-left'}`}>
                            {msg.sender === 'driver' ? 'Delivered' : 'Just Now'}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {isCustomerTyping && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white p-3 rounded-2xl border border-gray-100 rounded-tl-none flex gap-1 items-center shadow-sm">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                    </div>
                  </motion.div>
                )}

                {customerTimers[activeChatOrderId!] !== undefined && (
                  <div className="flex justify-center p-4">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-[10px] font-black border border-red-100 uppercase tracking-widest flex items-center gap-2 shadow-sm"
                    >
                      <Clock size={12} />
                      Waiting for Customer: {Math.floor(customerTimers[activeChatOrderId!] / 60)}:{(customerTimers[activeChatOrderId!] % 60).toString().padStart(2, '0')}
                    </motion.div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              <div className="bg-white border-t border-gray-100 p-2 overflow-x-auto no-scrollbar flex gap-2">
                <button 
                  onClick={() => handleSendMessage("Could you please send the delivery PIN?")}
                  className="whitespace-nowrap px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-xs font-black uppercase tracking-wider hover:bg-blue-100 active:scale-95 transition-all shadow-sm flex items-center gap-2"
                >
                  <ShieldCheck size={14} />
                  Request PIN
                </button>
                {["I've arrived", "I'm outside", "Can't find you"].map(text => (
                  <button 
                    key={text}
                    onClick={() => handleSendMessage(text)}
                    className="whitespace-nowrap px-4 py-2 bg-gray-100 rounded-full text-xs font-black uppercase tracking-wider hover:bg-gray-200 active:scale-95 transition-all text-black border border-gray-50 shadow-sm"
                  >
                    {text}
                  </button>
                ))}
              </div>

              <div className="p-4 bg-white border-t border-gray-100 flex gap-2 pb-10">
                <div className="flex-1 bg-gray-100 rounded-[28px] focus-within:bg-white focus-within:ring-2 focus-within:ring-black transition-all flex items-center px-4">
                  <input 
                    ref={chatInputRef}
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..." 
                    className="flex-1 bg-transparent py-4 text-sm font-bold outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && chatInput.trim()) {
                        handleSendMessage(chatInput);
                      }
                    }}
                  />
                  {chatInput.trim() && (
                    <button 
                      onClick={() => handleSendMessage(chatInput)}
                      className="p-2 text-blue-600 font-black text-xs uppercase tracking-widest hover:text-blue-700 transition-colors"
                    >
                      Send
                    </button>
                  )}
                </div>
                <button className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shrink-0 shadow-lg active:scale-90 transition-transform">
                  {chatInput.trim() ? <Send size={24} /> : <Target size={24} />}
                </button>
              </div>
            </motion.div>
          )}

          {currentScreen === 'trip_preferences' && (
            <motion.div key="trip_preferences" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`h-full w-full p-6 overflow-y-auto pb-32 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}>
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('account')} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><ArrowRight className="rotate-180" size={24} /></button>
                <h1 className="text-3xl font-black">Trip Preferences</h1>
              </div>
              
              <div className="space-y-6">
                <div className={`p-6 rounded-[32px] border-2 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                  <h3 className="font-black text-xl mb-4">Job Types</h3>
                  <div className="space-y-3">
                    {[
                      { id: 'both', label: 'All Jobs', desc: 'Matching & Normal deliveries' },
                      { id: 'matching', label: 'Matching Only', desc: 'Only high-value matching jobs' },
                      { id: 'normal', label: 'Normal Only', desc: 'Standard delivery requests' }
                    ].map(pref => (
                      <button
                        key={pref.id}
                        onClick={() => {
                          setJobTypePreference(pref.id as any);
                          localStorage.setItem('uber_job_preference', pref.id);
                          sendNotification("Preferences Updated", `Now receiving ${pref.label}`);
                        }}
                        className={`w-full p-4 rounded-2xl text-left transition-all border-2 ${
                          jobTypePreference === pref.id 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-[1.02]' 
                            : theme === 'dark' ? 'bg-white/5 border-transparent text-gray-400' : 'bg-white border-transparent text-gray-600'
                        }`}
                      >
                        <p className="font-black text-lg">{pref.label}</p>
                        <p className={`text-xs font-bold ${jobTypePreference === pref.id ? 'text-blue-100' : 'text-gray-400'}`}>{pref.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`p-6 rounded-[32px] border-2 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                  <h3 className="font-black text-xl mb-2">Delivery Limit</h3>
                  <p className="text-sm text-gray-400 font-bold mb-4">Maximum active deliveries at one time.</p>
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                    <span className="font-black text-blue-900">Current Limit</span>
                    <span className="text-2xl font-black text-blue-600">3</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {currentScreen === 'uber_pro' && (
            <motion.div key="pro" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="h-full w-full bg-white text-black p-6 overflow-y-auto">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full active:scale-90 transition-transform"><X size={24} /></button>
                <h1 className="text-3xl font-black">Uber Pro</h1>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[40px] p-8 text-white mb-8 relative overflow-hidden shadow-2xl shadow-blue-600/30">
                <div className="relative z-10">
                  <p className="text-xs font-black opacity-60 mb-2 uppercase tracking-[0.2em]">{userTier} Tier</p>
                  <h2 className="text-5xl font-black mb-6">{user.points} <span className="text-xl opacity-60">pts</span></h2>
                  <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mb-4">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${userTier === 'Diamond' ? 100 : (user.points % 500) / 5}%` }}
                      className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                    />
                  </div>
                  <p className="text-sm font-bold opacity-80">
                    {userTier === 'Diamond' ? 'You have reached the highest tier!' : `${500 - (user.points % 500)} points to next tier`}
                  </p>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full" />
              </div>
              <div className="space-y-6">
                <h3 className="font-black text-2xl tracking-tight">Your Rewards</h3>
                {[
                  { title: "Fuel Discount", desc: "Save 3p/litre at BP", icon: <Zap />, color: 'bg-orange-500' },
                  { title: "Free Coffee", desc: "Weekly Costa reward", icon: <Coffee />, color: 'bg-blue-500' },
                  { title: "Priority Support", desc: "Fast-track help", icon: <HelpCircle />, color: 'bg-green-500' },
                  { title: "Tuition Coverage", desc: "100% tuition coverage", icon: <ShieldCheck />, color: 'bg-purple-500' },
                ].map((reward, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-6 bg-gray-50 rounded-[30px] border border-gray-100 shadow-sm"
                  >
                    <div className={`w-14 h-14 ${reward.color} rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0`}>{reward.icon}</div>
                    <div>
                      <p className="font-black text-lg leading-tight">{reward.title}</p>
                      <p className="text-sm text-gray-400 font-bold">{reward.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {currentScreen === 'wallet' && (
            <motion.div key="wallet" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="h-full w-full bg-white text-black p-6 overflow-y-auto pb-32">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
                <h1 className="text-3xl font-black">Wallet</h1>
              </div>
              <div className="bg-gray-100 rounded-3xl p-8 mb-6">
                <p className="text-sm font-bold text-gray-400 mb-1 uppercase tracking-widest">Balance</p>
                <h2 className="text-5xl font-black">£{earnings.toFixed(2)}</h2>
                <button 
                  onClick={() => {
                    if (earnings > 0) {
                      setBankBalance(prev => prev + earnings);
                      setEarnings(0);
                      sendNotification("Cash Out Successful", "£" + earnings.toFixed(2) + " has been sent to your bank account.");
                      setCurrentScreen('banking');
                    }
                  }}
                  className="mt-6 w-full py-4 bg-black text-white rounded-2xl font-black active:scale-95 transition-transform"
                >
                  CASH OUT
                </button>
              </div>
              <div className="space-y-4">
                <h3 className="font-black text-xl">Payment Methods</h3>
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <CreditCard className="text-blue-600" />
                    <span className="font-bold">•••• 4242</span>
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Default</span>
                </div>
              </div>
            </motion.div>
          )}

          {currentScreen === 'opportunities' && (
            <motion.div key="opps" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="h-full w-full bg-white text-black p-6 overflow-y-auto pb-32">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
                <h1 className="text-3xl font-black">Opportunities</h1>
              </div>
              <div className="space-y-4">
                <div className={`p-6 rounded-3xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} mb-8`}>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Area Demand (Timer Control)</p>
                  <div className="grid grid-cols-3 gap-3">
                    {['Low', 'Medium', 'High'].map((mode) => (
                      <button 
                        key={mode}
                        onClick={() => setBusynessMode(mode as any)}
                        className={`py-4 rounded-2xl font-black text-sm transition-all border-2 ${
                          busynessMode === mode 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                            : theme === 'dark' ? 'bg-white/5 border-transparent text-gray-400' : 'bg-white border-gray-100 text-black'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold mt-4 leading-tight">
                    {busynessMode === 'Low' && "Quiet period. Orders will be rare (15-45s wait)."}
                    {busynessMode === 'Medium' && "Steady demand. Orders every 5-15s."}
                    {busynessMode === 'High' && "Peak time! Rapid-fire orders (1.5-4s wait)."}
                  </p>
                </div>

                {activeSurgeAreas.map((area) => (
                  <div key={area.id} className={`p-6 rounded-3xl border-2 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-blue-50 border-blue-100'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 text-blue-600">
                        <TrendingUp size={20} />
                        <span className="font-black">{area.multiplier}x Surge</span>
                      </div>
                      {area.trend === 'rising' && <div className="flex items-center gap-1 text-green-500 text-[10px] font-black uppercase tracking-widest"><ArrowUp size={10} /> Rising</div>}
                      {area.trend === 'falling' && <div className="flex items-center gap-1 text-red-500 text-[10px] font-black uppercase tracking-widest"><ArrowDown size={10} /> Falling</div>}
                    </div>
                    <p className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-blue-900'}`}>{area.name} is busy.</p>
                    <p className="text-sm text-gray-500 font-bold mt-1">Head towards {area.name} for higher earnings potential.</p>
                  </div>
                ))}

                <div className={`p-6 rounded-3xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3 mb-2 text-green-600">
                    <Gift size={20} />
                    <span className="font-black">Quest: £20 Bonus</span>
                  </div>
                  <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Complete 10 more trips today.</p>
                  <div className={`w-full h-2 rounded-full mt-3 overflow-hidden ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}>
                    <div className="h-full bg-green-500" style={{ width: '80%' }} />
                  </div>
                  <p className="text-xs text-gray-400 font-bold mt-2">8/10 completed</p>
                </div>
              </div>
            </motion.div>
          )}

          {currentScreen === 'uber_services' && (
            <motion.div key="uber_services" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`h-full w-full p-6 overflow-y-auto pb-32 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}>
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><X size={24} /></button>
                <h1 className="text-3xl font-black">Work Hub</h1>
              </div>
              <div className="space-y-4">
                <div className={`p-6 rounded-[32px] border-2 transition-all ${selectedServices.includes('ride') ? 'bg-black border-black text-white' : 'bg-white border-gray-100 text-black'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedServices.includes('ride') ? 'bg-white/10' : 'bg-gray-100'}`}>
                        <Car size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black">UberX</h3>
                        <p className="text-xs font-bold opacity-60 italic">Accept passenger requests</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => {
                        setSelectedServices(prev => 
                          prev.includes('ride') ? prev.filter(s => s !== 'ride') : [...prev, 'ride']
                        );
                      }}
                      className={`w-14 h-8 rounded-full p-1 transition-colors relative cursor-pointer ${selectedServices.includes('ride') ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <motion.div animate={{ x: selectedServices.includes('ride') ? 24 : 0 }} className="w-6 h-6 bg-white rounded-full shadow-md" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-black uppercase tracking-widest">Insurance Verified</span>
                    <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-black uppercase tracking-widest">UberX Eligible</span>
                  </div>
                </div>

                <div className={`p-6 rounded-[32px] border-2 transition-all ${selectedServices.includes('delivery') ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-100 text-black'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedServices.includes('delivery') ? 'bg-white/10' : 'bg-gray-100'}`}>
                        <ShoppingBag size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black">Uber Eats</h3>
                        <p className="text-xs font-bold opacity-60 italic">Accept food delivery requests</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => {
                        setSelectedServices(prev => 
                          prev.includes('delivery') ? prev.filter(s => s !== 'delivery') : [...prev, 'delivery']
                        );
                      }}
                      className={`w-14 h-8 rounded-full p-1 transition-colors relative cursor-pointer ${selectedServices.includes('delivery') ? 'bg-white/20' : 'bg-gray-300'}`}
                    >
                      <motion.div animate={{ x: selectedServices.includes('delivery') ? 24 : 0 }} className="w-6 h-6 bg-white rounded-full shadow-md" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-black uppercase tracking-widest">Active</span>
                    <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-black uppercase tracking-widest">Multi-order enabled</span>
                  </div>
                </div>

                <div className={`p-6 bg-gray-50 rounded-[32px] border-dashed border-2 border-gray-200 flex flex-col items-center justify-center text-center py-10 ${theme === 'dark' ? 'bg-white/5 border-white/10' : ''}`}>
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Plus className="text-gray-300" />
                  </div>
                  <h4 className="font-black text-gray-400">Unlock more services</h4>
                  <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">Uber Connect • Uber Pet • Uber Green</p>
                </div>
              </div>
            </motion.div>
          )}

          {currentScreen === 'ratings' && (
            <motion.div key="ratings" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`h-full w-full p-6 overflow-y-auto pb-32 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}>
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><ArrowRight className="rotate-180" size={24} /></button>
                <h1 className="text-3xl font-black">Feedback</h1>
              </div>
              
              <div className="text-center mb-10">
                <p className="text-6xl font-black mb-2">{user.rating.toFixed(2)}</p>
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={24} fill={i <= Math.floor(user.rating) ? "#FBBF24" : "none"} className={i <= Math.floor(user.rating) ? "text-yellow-400" : "text-gray-300"} />
                  ))}
                </div>
                <p className="text-sm font-bold text-gray-400">Based on last 500 trips</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className={`p-6 rounded-[30px] border-2 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                  <p className="text-3xl font-black text-blue-600">98%</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Acceptance Rate</p>
                </div>
                <div className={`p-6 rounded-[30px] border-2 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                  <p className="text-3xl font-black text-red-500">1%</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cancellation Rate</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-black mb-4">Customer Quotes</h3>
                {[
                  "Very professional and quick!",
                  "Friendly driver, handled food with care.",
                  "Great communication during the ride.",
                  "Always on time, 5 stars!"
                ].map((quote, i) => (
                  <div key={i} className={`p-4 rounded-2xl italic font-medium ${theme === 'dark' ? 'bg-white/5 border-l-4 border-blue-500' : 'bg-gray-50 border-l-4 border-black'}`}>
                    "{quote}"
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentScreen === 'vehicle_details' && (
            <VehicleDetailsScreen 
              user={user} 
              setUser={setUser} 
              onClose={() => setCurrentScreen('account')} 
              theme={theme} 
            />
          )}

          {currentScreen === 'payment_methods' && (
            <PaymentMethodsScreen 
              user={user} 
              setUser={setUser} 
              earnings={earnings} 
              onClose={() => setCurrentScreen('account')} 
              theme={theme} 
            />
          )}

          {(currentScreen === 'planner' || currentScreen === 'rewards') && (
            <motion.div key="planner" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="h-full w-full bg-white text-black p-6 overflow-y-auto pb-32">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
                <h1 className="text-3xl font-black">Rewards</h1>
              </div>
              <div className="space-y-6">
                <div className="p-8 bg-black text-white rounded-[40px] relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-4xl font-black mb-2">Quest</h2>
                    <p className="text-gray-400 font-bold mb-6">Complete orders to earn bonuses</p>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-600 rounded-2xl"><Target size={32} /></div>
                      <div>
                        <span className="block text-2xl font-black">{rewards[0].completed} / {rewards[2].target}</span>
                        <span className="text-sm text-gray-400 font-bold">Total Orders Today</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                </div>

                <div className="space-y-4">
                  {rewards.map((reward, i) => {
                    const progress = Math.min(100, (reward.completed / reward.target) * 100);
                    return (
                      <div key={i} className="p-6 bg-gray-50 rounded-[30px] border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-black">{reward.reward}</h3>
                          <span className="font-black text-blue-600">{reward.completed}/{reward.target}</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-blue-600"
                          />
                        </div>
                        <p className="text-sm text-gray-400 font-bold">Complete {reward.target} orders to unlock</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {currentScreen === 'inbox' && (
            <motion.div key="inbox" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="h-full w-full bg-white text-black p-6 overflow-y-auto pb-32">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full active:scale-90 transition-transform"><X size={24} /></button>
                <h1 className="text-3xl font-black">Inbox</h1>
              </div>
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                    <Mail size={64} className="mb-4 opacity-10" />
                    <p className="font-black text-xl">No new messages</p>
                    <p className="text-sm font-bold opacity-60">Check back later for updates</p>
                  </div>
                ) : (
                  notifications.map((note, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-6 bg-gray-50 rounded-[30px] border border-gray-100 flex gap-4 shadow-sm"
                    >
                      <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-600/20">
                        <Bell size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Update</p>
                        </div>
                        <p className="font-black text-lg leading-tight mb-2">{note}</p>
                        <p className="text-xs text-gray-400 font-bold">Just now • Uber Eats Driver</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {currentScreen === 'safety' && (
            <motion.div key="safety" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="h-full w-full bg-white text-black p-6">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
                <h1 className="text-3xl font-black">Safety Toolkit</h1>
              </div>
              <div className="space-y-4">
                <button className="w-full p-6 bg-red-50 text-red-600 rounded-3xl flex items-center gap-4 font-black text-xl">
                  <div className="p-3 bg-red-600 text-white rounded-full"><Phone size={24} /></div>
                  Emergency Assistance
                </button>
                <div className="p-6 bg-gray-50 rounded-3xl space-y-4">
                  <h3 className="font-black text-lg">Safety Features</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Share Trip Status</span>
                    <ArrowRight size={20} className="text-gray-300" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">RideCheck</span>
                    <ArrowRight size={20} className="text-gray-300" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentScreen === 'banking' && (
            <motion.div key="banking" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="h-full w-full bg-[#f4f7f6] text-black p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <CreditCard size={24} />
                  </div>
                  <h1 className="text-2xl font-black text-blue-900">Monzo Clone</h1>
                </div>
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-white rounded-full shadow-sm"><X size={24} /></button>
              </div>

              <div className="bg-white rounded-[32px] p-8 shadow-sm mb-8">
                <p className="text-sm font-bold text-gray-400 mb-1 uppercase tracking-widest">Main Account</p>
                <h2 className="text-5xl font-black text-blue-900">£{bankBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                <div className="flex gap-4 mt-6">
                  <button className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-sm">Add Money</button>
                  <button className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-sm">Transfer</button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-xl text-blue-900">Spend Your Earnings</h3>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{purchasedItems.length} Items Owned</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'coffee', name: 'Premium Coffee', price: 3.50, icon: <Coffee /> },
                    { id: 'jacket', name: 'Uber Eats Jacket', price: 45.00, icon: <Zap /> },
                    { id: 'ebike', name: 'Electric Delivery Bike', price: 1200.00, icon: <Zap /> },
                    { id: 'iphone', name: 'iPhone 15 Pro', price: 999.00, icon: <Smartphone /> },
                    { id: 'tesla', name: 'Tesla Model 3', price: 35000.00, icon: <Zap /> },
                  ].map((item) => {
                    const isOwned = purchasedItems.includes(item.id);
                    return (
                      <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-blue-600">
                            {item.icon}
                          </div>
                          <div>
                            <p className="font-black text-blue-900">{item.name}</p>
                            <p className="text-sm text-gray-400 font-bold">£{item.price.toLocaleString()}</p>
                          </div>
                        </div>
                        <button 
                          disabled={isOwned || bankBalance < item.price}
                          onClick={() => {
                            if (bankBalance >= item.price) {
                              setBankBalance(prev => prev - item.price);
                              setPurchasedItems(prev => [...prev, item.id]);
                              sendNotification("Purchase Successful", `You bought a ${item.name}!`);
                            }
                          }}
                          className={`px-6 py-2 rounded-full font-black text-sm transition-all ${isOwned ? 'bg-green-100 text-green-600' : bankBalance < item.price ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white active:scale-95'}`}
                        >
                          {isOwned ? 'OWNED' : 'BUY'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {purchasedItems.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-black text-xl text-blue-900 mb-4">Your Collection</h3>
                    <div className="flex flex-wrap gap-2">
                      {purchasedItems.map(id => (
                        <span key={id} className="px-4 py-2 bg-white rounded-full text-xs font-black text-blue-900 shadow-sm border border-blue-50 uppercase tracking-widest">
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentScreen === 'account' && (
            <motion.div key="account" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`h-full w-full p-6 overflow-y-auto pb-32 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}>
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><X size={24} /></button>
                <h1 className="text-3xl font-black">Account</h1>
              </div>
              <div className="flex flex-col items-center mb-8">
                <div className={`w-32 h-32 rounded-full overflow-hidden border-4 shadow-xl mb-4 ${theme === 'dark' ? 'border-white/10' : 'border-white'}`}>
                  <img src={user.profilePic || "https://picsum.photos/seed/driver/200/200"} alt="Me" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-2xl font-black">{user.name}</h2>
                <p className="text-sm font-bold text-gray-400">{currentCity} • {userTier} Partner</p>
              </div>
              <div className="space-y-2">
                {[
                  { icon: <User />, label: "Personal Information", action: () => setCurrentScreen('personal_details') },
                  { icon: <CarIcon />, label: "Vehicle Details", action: () => setCurrentScreen('vehicle_details') },
                  { icon: <CreditCard />, label: "Payment", action: () => setCurrentScreen('payment_methods') },
                  { icon: <History />, label: "Trip History", action: () => setCurrentScreen('trip_history') },
                  { icon: <FileText />, label: "Documents", action: () => setCurrentScreen('documents') },
                  { icon: <Settings />, label: "App Settings", action: () => sendNotification("Settings", "Settings updated.") },
                  { icon: <SlidersHorizontal />, label: "Trip Preferences", action: () => setCurrentScreen('trip_preferences') },
                  { icon: <ShieldAlert />, label: "Simulate Bug Scan", action: () => {
                    setIsScanning(true);
                    setTimeout(() => {
                      setIsScanning(false);
                      setIsUnderMaintenance(true);
                    }, 2000);
                  }},
                  { icon: <Zap />, label: "Test All Features", action: async () => {
                    sendNotification("Test Mode", "Starting automated feature test...");
                    setUser(u => ({ ...u, isOnline: true }));
                    await new Promise(r => setTimeout(r, 2000));
                    const testOrder = generateSmartOrder();
                    if (testOrder) {
                      setPendingOrder(testOrder);
                      await new Promise(r => setTimeout(r, 3000));
                      handleAcceptOrder();
                      await new Promise(r => setTimeout(r, 3000));
                      setActiveOrders(prev => prev.map(o => o.id === testOrder.id ? { ...o, status: 'picked_up' } : o));
                      await new Promise(r => setTimeout(r, 3000));
                      handleCompleteDelivery(testOrder.id);
                      sendNotification("Test Mode", "Feature test completed successfully!");
                    }
                  }},
                ].map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={item.action}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-gray-400">{item.icon}</div>
                      <span className="font-bold">{item.label}</span>
                    </div>
                    <ArrowRight size={20} className="text-gray-300" />
                  </button>
                ))}
                
                <div className={`p-4 rounded-2xl mt-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-blue-500"><Moon size={24} /></div>
                      <div>
                        <p className="font-bold">Night Mode</p>
                        <p className="text-xs text-gray-400 font-bold">Always use dark map</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => setIsNightMode(!isNightMode)}
                      className={`w-12 h-6 rounded-full relative p-1 transition-colors cursor-pointer ${isNightMode ? 'bg-blue-500' : 'bg-gray-300'}`}
                    >
                      <motion.div 
                        animate={{ x: isNightMode ? 24 : 0 }}
                        className="w-4 h-4 bg-white rounded-full shadow-sm" 
                      />
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl mt-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-blue-500"><Navigation size={24} /></div>
                      <div>
                        <p className="font-bold">Simulate Movement</p>
                        <p className="text-xs text-gray-400 font-bold">Test map movement without moving</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => setIsSimulatingMovement(!isSimulatingMovement)}
                      className={`w-12 h-6 rounded-full relative p-1 transition-colors cursor-pointer ${isSimulatingMovement ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <motion.div 
                        animate={{ x: isSimulatingMovement ? 24 : 0 }}
                        className="w-4 h-4 bg-white rounded-full shadow-sm" 
                      />
                    </div>
                  </div>
                </div>

                {/* CarPlay Remote Display Section */}
                <div className={`p-6 rounded-3xl mt-6 border-2 ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                  <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                    <Smartphone size={20} className="text-blue-600" />
                    CarPlay Remote Sync
                  </h3>
                  <p className="text-xs text-gray-500 font-bold mb-4">
                    Use this device as a dedicated CarPlay display. Connect another device to control it.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">Remote Display Mode</p>
                        <p className="text-[10px] text-gray-400 font-bold">Follows other device's state</p>
                      </div>
                      <div 
                        onClick={() => setIsCarPlayRemoteMode(!isCarPlayRemoteMode)}
                        className={`w-12 h-6 rounded-full relative p-1 transition-colors cursor-pointer ${isCarPlayRemoteMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                      >
                        <motion.div 
                          animate={{ x: isCarPlayRemoteMode ? 24 : 0 }}
                          className="w-4 h-4 bg-white rounded-full shadow-sm" 
                        />
                      </div>
                    </div>

                    {isCarPlayRemoteMode && (
                      <div className={`p-4 rounded-2xl border text-center ${theme === 'dark' ? 'bg-white/5 border-blue-500/30' : 'bg-white border-blue-200'}`}>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Status</p>
                        <p className="font-black text-sm">Waiting for controller...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trip Preferences Section */}
                <div className={`p-6 rounded-3xl mt-6 border-2 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                  <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                    <SlidersHorizontal size={20} className="text-blue-600" />
                    Trip Preferences
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'both', label: 'All Jobs', desc: 'Normal & Matching' },
                      { id: 'normal', label: 'Normal Only', desc: 'No stacked orders' },
                      { id: 'matching', label: 'Matching Only', desc: 'Only stacked orders' }
                    ].map((pref) => (
                      <button
                        key={pref.id}
                        onClick={() => {
                          setJobTypePreference(pref.id as any);
                          sendNotification("Preference Updated", `Now receiving ${pref.label}`);
                        }}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                          jobTypePreference === pref.id 
                            ? 'border-blue-600 bg-blue-600/5 text-blue-600' 
                            : 'border-transparent bg-white/5 text-gray-400'
                        }`}
                      >
                        <div>
                          <p className="font-black text-sm">{pref.label}</p>
                          <p className="text-[10px] font-bold opacity-60">{pref.desc}</p>
                        </div>
                        {jobTypePreference === pref.id && (
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white">
                            <Check size={14} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest">
                    Limit: Max 3 active deliveries
                  </p>
                </div>

                <button 
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full flex items-center gap-4 p-4 text-red-600 font-black mt-4 bg-red-50 rounded-2xl border border-red-100 active:scale-95 transition-transform"
                >
                  <RefreshCw size={24} />
                  <span>RESET APP & DATA</span>
                </button>
              </div>
            </motion.div>
          )}

          {currentScreen === 'trip_history' && (
            <TripHistoryScreen 
              completedTrips={completedTrips} 
              onClose={() => setCurrentScreen('account')} 
              theme={theme} 
            />
          )}

          {currentScreen === 'earnings' && (
            <motion.div key="earnings" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`h-full w-full p-6 overflow-y-auto pb-32 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}>
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><X size={24} /></button>
                <h1 className="font-display text-3xl font-black tracking-tight">Earnings</h1>
              </div>

              {/* Tabs */}
              <div className={`flex p-1 rounded-2xl mb-8 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                {(['today', 'weekly', 'recent'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setEarningsTab(tab)}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      earningsTab === tab 
                        ? (theme === 'dark' ? 'bg-white text-black shadow-lg' : 'bg-black text-white shadow-lg')
                        : 'text-gray-400'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-black text-white'} rounded-3xl p-8 mb-8 relative overflow-hidden`}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-bold opacity-60 uppercase tracking-widest">
                    {earningsTab === 'today' ? 'Today' : earningsTab === 'weekly' ? 'This Week' : 'Total Earnings'}
                  </p>
                  <button 
                    onClick={() => {
                      const newGoal = prompt("Set your daily earnings goal:", earningsGoal.toString());
                      if (newGoal && !isNaN(parseFloat(newGoal))) {
                        setEarningsGoal(parseFloat(newGoal));
                      }
                    }}
                    className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                  >
                    <Target size={16} />
                  </button>
                </div>
                <h2 className="font-display text-5xl font-black mb-6 tracking-tighter">£{(earningsTab === 'today' ? earnings * 0.15 : earnings).toFixed(2)}</h2>
                
                {earnings > 0 && (
                  <button 
                    onClick={() => setCurrentScreen('wallet')}
                    className="mb-6 w-full py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-transform"
                  >
                    CASH OUT £{earnings.toFixed(2)}
                  </button>
                )}
                
                {/* Goal Progress in Earnings Screen */}
                <div className="mb-6">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">
                    <span>Daily Goal Progress</span>
                    <span>{Math.min(100, Math.round((earnings / earningsGoal) * 100))}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (earnings / earningsGoal) * 100)}%` }}
                      className={`h-full rounded-full ${earnings >= earningsGoal ? 'bg-green-500' : 'bg-blue-500'}`}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 bg-white/10 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold opacity-60 uppercase mb-1">Trips</p>
                    <p className="text-xl font-black">{earningsTab === 'today' ? 2 : user.deliveries}</p>
                  </div>
                  <div className="flex-1 bg-white/10 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold opacity-60 uppercase mb-1">Online</p>
                    <p className="text-xl font-black">{earningsTab === 'today' ? '1h 15m' : '4h 22m'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-xl">
                    {earningsTab === 'recent' ? 'All Activity' : 'Recent Activity'}
                  </h3>
                  <button 
                    onClick={() => setCurrentScreen('payment_methods')}
                    className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                  >
                    <CreditCard size={14} />
                    Payments & Payouts
                  </button>
                </div>
                {(earningsTab === 'today' ? [1, 2] : [1, 2, 3, 4, 5]).map(i => (
                  <div key={i} className={`flex items-center justify-between py-2 border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-green-500 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><Check size={24} /></div>
                      <div>
                        <p className="font-bold">Delivery • {['Greggs', 'McDonald\'s', 'Subway', 'KFC', 'Burger King'][i % 5]}</p>
                        <p className="text-xs text-gray-400">{earningsTab === 'today' ? 'Today' : 'Yesterday'}, {getArrivalTime(-(i * 60))}</p>
                      </div>
                    </div>
                    <p className="font-black text-lg">£{(5 + Math.random() * 5).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentScreen === 'work_hub' && (
            <motion.div key="work_hub" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="h-full w-full bg-white text-black p-6 overflow-y-auto pb-32">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full active:scale-90 transition-transform"><X size={24} /></button>
                <h1 className="text-3xl font-black">Work Hub</h1>
              </div>
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                  <SlidersHorizontal size={32} />
                </div>
                <h2 className="text-2xl font-black mb-2 tracking-tighter uppercase">Opportunities</h2>
                <p className="text-gray-400 font-bold mb-8">Manage your working preferences and discover new ways to earn.</p>
                <div className="w-full grid grid-cols-1 gap-4">
                  <button onClick={() => setCurrentScreen('uber_services')} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 shadow-sm active:scale-95 transition-transform">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-600 text-white rounded-xl"><Zap size={20} /></div>
                      <div className="text-left">
                        <p className="font-black">Services</p>
                        <p className="text-xs text-gray-400 font-bold">Manage vehicle types</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300" />
                  </button>
                  <button onClick={() => setCurrentScreen('trip_preferences')} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 shadow-sm active:scale-95 transition-transform">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-600 text-white rounded-xl"><Target size={20} /></div>
                      <div className="text-left">
                        <p className="font-black">Preferences</p>
                        <p className="text-xs text-gray-400 font-bold">Trip limits & distance</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentScreen === 'scheduled_orders' && (
            <ScheduledOrdersScreen 
              scheduledOrders={scheduledOrders}
              setScheduledOrders={setScheduledOrders}
              onClose={() => setCurrentScreen('home')}
              firebaseUser={firebaseUser}
              sendNotification={sendNotification}
            />
          )}

          {currentScreen === 'carplay_dashboard' && (
            <CarPlayDashboard 
              activeOrders={activeOrders}
              user={user}
              onClose={() => setCurrentScreen('home')}
              isCarPlaySynced={isCarPlaySynced}
              setIsCarPlaySynced={setIsCarPlaySynced}
            />
          )}

          {currentScreen === 'earnings_detail' && (
            <EarningsDetail 
              earnings={earnings}
              user={user}
              setCurrentScreen={setCurrentScreen}
              getArrivalTime={getArrivalTime}
              setBankBalance={setBankBalance}
              setEarnings={setEarnings}
              sendNotification={sendNotification}
              playUberSound={playUberSound}
            />
          )}

          {/* Safety Fallback for unhandled screens */}
          {!['onboarding', 'documents', 'face_verification', 'home', 'earnings', 'inbox', 'account', 'chat', 'uber_pro', 'wallet', 'opportunities', 'safety', 'earnings_detail', 'banking', 'scheduled_orders', 'rewards', 'carplay_dashboard', 'trip_history', 'work_hub', 'ratings', 'planner', 'uber_services', 'vehicle_details', 'payment_methods', 'trip_preferences', 'personal_details'].includes(currentScreen) && (
            <motion.div 
              key="fallback" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className={`h-full w-full flex flex-col items-center justify-center p-6 text-center ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}
            >
              <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-6">
                <Target size={32} />
              </div>
              <h2 className="text-xl font-black mb-2 tracking-tighter uppercase">Screen Not Found</h2>
              <p className="text-gray-400 font-bold mb-8 max-w-[240px] text-sm">This feature is currently being optimized for your profile. Check back soon!</p>
              <button 
                onClick={() => setCurrentScreen('home')} 
                className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-black tracking-widest text-xs active:scale-95 transition-transform shadow-lg shadow-blue-500/20"
              >
                GO BACK
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {isNewUserFormOpen && (
          <NewUserForm 
            newUserDetails={newUserDetails}
            setNewUserDetails={setNewUserDetails}
            setIsNewUserFormOpen={setIsNewUserFormOpen}
            firebaseUser={firebaseUser}
            user={user}
            setUser={setUser}
            setCurrentScreen={setCurrentScreen}
            sendNotification={sendNotification}
            setHasSeenOnboarding={setHasSeenOnboarding}
          />
        )}

        <AnimatePresence>
          {isVehicleSettingsOpen && (
            <TripPreferencesModal 
              vehicleType={vehicleType}
              setVehicleType={setVehicleType}
              selectedServices={selectedServices}
              setSelectedServices={setSelectedServices}
              onClose={() => setIsVehicleSettingsOpen(false)}
              theme={theme}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      <div className="h-16 bg-black border-t border-white/10 flex items-center justify-around px-2 z-[2000] shrink-0 relative">
        <NavButton active={currentScreen === 'home'} onClick={() => setCurrentScreen('home')} icon={<Navigation size={20} />} label="Home" badge={activeOrders.length > 0 ? activeOrders.length : undefined} />
        {activeOrders.length > 0 && (
          <NavButton 
            active={isBottomMenuOpen} 
            onClick={() => setIsBottomMenuOpen(!isBottomMenuOpen)} 
            icon={<List size={20} />} 
            label="Trips" 
            badge={activeOrders.filter(o => o.status === 'accepted').length}
          />
        )}
        <NavButton active={currentScreen === 'earnings'} onClick={() => setCurrentScreen('earnings')} icon={<TrendingUp size={20} />} label="Earnings" />
        <NavButton active={currentScreen === 'inbox'} onClick={() => setCurrentScreen('inbox')} icon={<Mail size={20} />} label="Inbox" />
        <NavButton active={currentScreen === 'account'} onClick={() => setCurrentScreen('account')} icon={<User size={20} />} label="Account" />
      </div>
    </div>
      )}
    </AppErrorBoundary>
  );
}

function NavButton({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: ReactNode, label: string, badge?: number }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center p-1 transition-all relative ${active ? 'text-white' : 'text-gray-500'}`}>
      <div className={`p-1 rounded-full transition-colors flex items-center justify-center ${active ? 'bg-white/10' : ''}`}>
        {icon}
      </div>
      <span className="text-[9px] font-black uppercase tracking-tight leading-none mt-0.5">{label}</span>
      {badge !== undefined && badge > 0 && (
        <div className="absolute top-0 right-0 w-4 h-4 bg-blue-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-black">
          {badge}
        </div>
      )}
    </button>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, ReactNode } from 'react';
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
  Bell,
  MessageSquare,
  LogOut,
  Plus,
  Minus,
  HelpCircle,
  Briefcase,
  Gift,
  Settings,
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
import { Location, Order, AppScreen, ChatMessage, UserProfile, UberProTier, ScheduledOrder, CompletedTrip } from './types';
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


const Heatmap = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px]">
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 rounded-full bg-orange-500 blur-[60px]"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.6, 0.4]
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-[20%] rounded-full bg-red-500 blur-[40px]"
      />
      <div className="absolute inset-[40%] rounded-full bg-red-600 blur-[20px] opacity-60" />
    </div>
  </div>
);

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
      className={`absolute inset-0 z-[500] flex flex-col ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}
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
              <div className="flex items-center gap-1 mt-2 text-green-500 font-black text-[10px] uppercase tracking-widest justify-end">
                <ShieldCheck size={12} />
                PIN Required
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
          {order.status === 'accepted' ? (order.type === 'ride' ? 'START TRIP' : 'START PICKUP') : (order.type === 'ride' ? 'CONFIRM DROPOFF' : 'START DROPOFF')}
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
  setIsCarPlaySynced
}: { 
  user: UserProfile, 
  setIsSideMenuOpen: (val: boolean) => void,
  setCurrentScreen: (screen: AppScreen) => void,
  setIsInboxOpen: (val: boolean) => void,
  setIsSafetyToolkitOpen: (val: boolean) => void,
  theme: string,
  logout: () => void,
  isCarPlaySynced: boolean,
  setIsCarPlaySynced: (val: boolean) => void
}) => (
  <motion.div 
    initial={{ x: '-100%' }}
    animate={{ x: 0 }}
    exit={{ x: '-100%' }}
    className="absolute inset-0 z-[100] bg-black text-white flex flex-col pb-12"
    onClick={(e) => e.stopPropagation()}
  >
    <div className="p-6 pt-12">
      <button onClick={() => setIsSideMenuOpen(false)} className="p-2 bg-white/10 rounded-full mb-8">
        <X size={24} />
      </button>
      
      <div className="flex items-center gap-6 mb-10">
        <div className="w-20 h-20 bg-white/10 rounded-full overflow-hidden border-2 border-white/20">
          <img src={user.profilePic || "https://picsum.photos/seed/driver/200/200"} alt="Me" className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="font-black text-3xl mb-1">{user.name}</h2>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Pro</span>
            <p className="text-sm font-bold text-gray-400">{user.rating} ★</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <button onClick={() => { setCurrentScreen('earnings'); setIsSideMenuOpen(false); }} className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-3xl active:scale-95 transition-transform">
          <TrendingUp size={24} className="text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest">Earnings</span>
        </button>
        <button onClick={() => { setIsInboxOpen(true); setIsSideMenuOpen(false); }} className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-3xl active:scale-95 transition-transform">
          <Mail size={24} className="text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest">Inbox</span>
        </button>
        <button onClick={() => { setCurrentScreen('account'); setIsSideMenuOpen(false); }} className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-3xl active:scale-95 transition-transform">
          <User size={24} className="text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest">Account</span>
        </button>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto px-6 space-y-1">
      {[
        { icon: <Zap size={20} />, label: "Work Hub", screen: 'uber_services' },
        { icon: <Star size={20} />, label: "Feedback", screen: 'ratings' },
        { icon: <Briefcase size={20} />, label: "Opportunities", screen: 'opportunities' },
        { icon: <Clock size={20} />, label: "Scheduled Orders", screen: 'scheduled_orders' },
        { icon: <Gift size={20} />, label: "Uber Pro", screen: 'uber_pro' },
        { icon: <Target size={20} />, label: "Rewards & Quests", screen: 'rewards' },
        { icon: <ShieldCheck size={20} />, label: "Safety Toolkit", action: () => setIsSafetyToolkitOpen(true) },
        { 
          icon: <Smartphone size={20} />, 
          label: isCarPlaySynced ? "CarPlay Dashboard" : "Sync to CarPlay", 
          action: () => {
            if (!isCarPlaySynced) {
              setIsCarPlaySynced(true);
            }
            setCurrentScreen('carplay_dashboard');
          }
        },
        { icon: <Settings size={20} />, label: "App Settings", screen: 'account' },
      ].map((item, idx) => (
        <button 
          key={idx} 
          onClick={() => { 
            if ('action' in item) {
              item.action();
            } else {
              setCurrentScreen(item.screen as AppScreen);
            }
            setIsSideMenuOpen(false); 
          }}
          className="w-full flex items-center gap-6 py-4 active:opacity-50 transition-opacity border-b border-white/5"
        >
          <div className="text-gray-500">{item.icon}</div>
          <span className="font-black text-lg">{item.label}</span>
          {item.label === "CarPlay Dashboard" && isCarPlaySynced && (
            <div className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </button>
      ))}
    </div>

    <div className="p-6 border-t border-white/10">
      <button 
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }} 
        className="flex items-center gap-4 text-red-500 font-black active:scale-95 transition-transform"
      >
        <LogOut size={24} />
        <span>Log out</span>
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
                    try {
                      await deleteDoc(doc(db, 'scheduled_orders', order.id));
                    } catch (error) {
                      handleFirestoreError(error, OperationType.DELETE, `scheduled_orders/${order.id}`);
                    }
                  }}
                  className="mt-2 text-red-500"
                >
                  <X size={16} />
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

const NewUserForm = ({ 
  newUserDetails, 
  setNewUserDetails, 
  setIsNewUserFormOpen,
  firebaseUser,
  user,
  setUser,
  setCurrentScreen,
  sendNotification
}: { 
  newUserDetails: any, 
  setNewUserDetails: React.Dispatch<React.SetStateAction<any>>,
  setIsNewUserFormOpen: (val: boolean) => void,
  firebaseUser: FirebaseUser | null,
  user: UserProfile,
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>,
  setCurrentScreen: (screen: AppScreen) => void,
  sendNotification: (title: string, body: string) => void
}) => (
  <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl relative z-10">
      <h2 className="text-3xl font-black mb-2">New User?</h2>
      <p className="text-gray-500 font-bold mb-8 text-sm">We don't recognize your face. Create an account to start earning.</p>
      
      <div className="space-y-4 mb-8">
        {!firebaseUser && (
          <button 
            onClick={async () => {
              try {
                await signInWithGoogle();
              } catch (error) {
                console.error("Login failed", error);
              }
            }}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-transform"
          >
            <Globe size={20} />
            SIGN IN WITH GOOGLE FIRST
          </button>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Full Name</label>
          <input 
            type="text" 
            className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
            value={newUserDetails.name}
            onChange={e => setNewUserDetails({...newUserDetails, name: e.target.value})}
            placeholder="Enter your full name"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Email</label>
          <input 
            type="email" 
            className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
            value={newUserDetails.email}
            onChange={e => setNewUserDetails({...newUserDetails, email: e.target.value})}
            placeholder="Enter your email"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={() => setIsNewUserFormOpen(false)} className="flex-1 py-4 bg-gray-100 text-black rounded-2xl font-black">CANCEL</button>
        <button 
          disabled={!firebaseUser || !newUserDetails.name || !newUserDetails.email}
          onClick={async () => {
            try {
              const uid = firebaseUser?.uid;
              if (!uid) return;

              const newUserProfile: UserProfile = {
                ...user,
                name: newUserDetails.name,
                email: newUserDetails.email,
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
              setCurrentScreen('home');
              sendNotification("Account Created", `Welcome to Uber Eats, ${newUserDetails.name}!`);
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, 'users');
            }
          }} 
          className={`flex-2 py-4 rounded-2xl font-black transition-all ${(!firebaseUser || !newUserDetails.name || !newUserDetails.email) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black text-white shadow-xl active:scale-95'}`}
        >
          CREATE ACCOUNT
        </button>
      </div>
    </motion.div>
  </div>
);

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
                    {activeOrder.items.slice(0, 3).map((item, i) => (
                      <p key={i} className="text-lg font-bold truncate">• {item}</p>
                    ))}
                    {activeOrder.items.length > 3 && (
                      <p className="text-sm text-gray-500 font-bold">+{activeOrder.items.length - 3} more items</p>
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
        <div className="text-center mb-10">
          <h3 className="font-black text-2xl mb-2">{order.customerName}</h3>
          <p className="text-gray-500 font-bold">Enter the 4-digit PIN to confirm delivery</p>
        </div>
        
        <div className="flex gap-4 justify-center mb-12">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-14 h-20 rounded-2xl border-4 flex items-center justify-center text-4xl font-black transition-all ${enteredPin[i] ? 'border-black bg-white shadow-xl' : 'border-gray-100 bg-gray-50'}`}>
              {enteredPin[i] || ""}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-[320px] mx-auto mb-12">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0].map(val => (
            <button 
              key={val}
              onClick={() => {
                if (val === "C") setEnteredPin("");
                else if (enteredPin.length < 4) {
                  setEnteredPin(enteredPin + val);
                }
              }}
              className="h-16 bg-gray-50 rounded-2xl font-black text-2xl active:scale-90 transition-transform border border-gray-100"
            >
              {val}
            </button>
          ))}
          <button 
            onClick={() => setEnteredPin(enteredPin.slice(0, -1))}
            className="h-16 bg-gray-50 rounded-2xl flex items-center justify-center active:scale-90 transition-transform border border-gray-100"
          >
            <Delete size={24} />
          </button>
        </div>

        <div className="mt-auto space-y-4">
          {(enteredPin.length === 4 || isPhotoCaptured) && (
            <motion.button 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={onComplete}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform"
            >
              {isPhotoCaptured ? 'CONFIRM PHOTO DELIVERY' : 'VERIFY PIN'}
            </motion.button>
          )}
          
          <button 
            onClick={() => {
              setIsPhotoCaptured(true);
            }}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2 ${isPhotoCaptured ? 'bg-green-100 text-green-600 border-2 border-green-500' : 'bg-gray-100 text-black'}`}
          >
            {isPhotoCaptured ? <Check size={18} /> : <Camera size={18} />}
            {isPhotoCaptured ? 'Photo Captured' : 'Take a photo instead'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  // App State
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('onboarding');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getArrivalTime = (mins: number) => {
    const arrival = new Date(currentTime.getTime() + mins * 60000);
    return formatTime(arrival);
  };
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isCarPlaySynced, setIsCarPlaySynced] = useState(false);
  const [isCarPlayRemoteMode, setIsCarPlayRemoteMode] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('uber_theme') as 'light' | 'dark') || 'light';
  });
  const [earningsTab, setEarningsTab] = useState<'today' | 'weekly' | 'recent'>('today');
  
  // User Profile State
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('uber_eats_user');
    const baseUser: UserProfile = {
      name: "Hassen Nabeel",
      rating: 4.98,
      tier: 'Platinum',
      points: 850,
      deliveries: 124,
      rides: 56,
      isOnline: false,
      documentsUploaded: true,
      faceVerified: true,
      walletBalance: 1250.40,
      vehicleInfo: {
        make: "Tesla",
        model: "Model 3",
        year: 2023,
        plate: "UB3R 123",
        type: "UberX"
      },
      documentExpiries: {
        "Driving Licence": "2027-05-01",
        "Vehicle Insurance": "2026-12-15",
        "Bank Statement": "Verified"
      }
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...baseUser, ...parsed, isOnline: false };
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

  // Location & Orders
  const [location, setLocation] = useState<Location | null>({ latitude: 51.5074, longitude: -0.1278 }); // Default to London
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [vehicleType, setVehicleType] = useState<'Car' | 'Bike' | 'Scooter'>(() => {
    const saved = localStorage.getItem('uber_vehicle_type');
    return (saved as any) || 'Car';
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
    const saved = localStorage.getItem('uber_earnings');
    return saved ? parseFloat(saved) : 0.00;
  });
  const [bankBalance, setBankBalance] = useState(() => {
    const saved = localStorage.getItem('uber_bank_balance');
    return saved ? parseFloat(saved) : 500.00;
  });
  const [purchasedItems, setPurchasedItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('uber_purchased_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [completedTrips, setCompletedTrips] = useState<CompletedTrip[]>(() => {
    const saved = localStorage.getItem('uber_completed_trips');
    return saved ? JSON.parse(saved) : [];
  });

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
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('uber_chat_messages');
    return saved ? JSON.parse(saved) : [];
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
  const [earningsGoal, setEarningsGoal] = useState(50.00);
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
    const saved = localStorage.getItem('uber_job_preference');
    return (saved as any) || 'both';
  });

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
  const [newUserDetails, setNewUserDetails] = useState({ name: '', email: '' });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [lastTrip, setLastTrip] = useState<{ amount: number, time: string, type: string } | null>({
    amount: 7.75,
    time: getArrivalTime(-45),
    type: "Uber Eats"
  });

  // CarPlay Remote Sync
  useEffect(() => {
    if (!user.uid || !db) return;

    const syncRef = doc(db, 'carplay_sync', user.uid);
    
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
      handleFirestoreError(error, OperationType.GET, 'carplay_sync');
    });

    return () => unsubscribe();
  }, [user.uid, isCarPlayRemoteMode, currentScreen]);

  // Listen for active orders in remote mode
  useEffect(() => {
    if (!user.uid || !isCarPlayRemoteMode || !db) return;

    const q = query(collection(db, 'active_orders'), where('driverUid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ ...doc.data() } as Order));
      setActiveOrders(orders);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'active_orders');
    });

    return () => unsubscribe();
  }, [user.uid, isCarPlayRemoteMode]);

  // Push local changes to remote (only if NOT in remote display mode)
  useEffect(() => {
    if (!user.uid || isCarPlayRemoteMode || !db) return;

    const updateSync = async () => {
      try {
        await setDoc(doc(db, 'carplay_sync', user.uid), {
          driverUid: user.uid,
          isActive: isCarPlaySynced,
          activeOrderId: activeOrders[0]?.id || null,
          isNavigating: isNavigating,
          lastUpdated: serverTimestamp()
        }, { merge: true });

        // Also sync active orders to Firestore for remote display
        // Note: In a real app, we'd handle individual order docs
        // For this simulation, we'll just overwrite the driver's active orders
        // (Simplified for demo purposes)
        for (const order of activeOrders) {
          await setDoc(doc(db, 'active_orders', order.id), {
            ...order,
            driverUid: user.uid,
            lastUpdated: serverTimestamp()
          });
        }
        
        // Cleanup old orders (simplified)
        // In a real app, handleCompleteDelivery would delete the doc
      } catch (error) {
        // Silent fail for sync
      }
    };

    const timeout = setTimeout(updateSync, 500); // Debounce
    return () => clearTimeout(timeout);
  }, [isCarPlaySynced, activeOrders, isNavigating, user.uid, isCarPlayRemoteMode]);

  // Generate random hotspots around driver
  useEffect(() => {
    if (location) {
      const generateHotspots = () => {
        const newHotspots = Array.from({ length: 15 }).map(() => ({
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
  
  const [selectedServices, setSelectedServices] = useState<JobType[]>(['delivery', 'ride']);
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
    if (!isNavigating || !user.isOnline || activeOrders.length === 0 || !location) {
      if (isNavigating && activeOrders.length === 0) setIsNavigating(false);
      return;
    }

    const moveInterval = setInterval(() => {
      const order = activeOrders[0];
      const target = order.status === 'accepted' ? order.restaurantLocation : order.customerLocation;
      
      const dLat = target.latitude - location.latitude;
      const dLng = target.longitude - location.longitude;
      const distance = Math.sqrt(dLat * dLat + dLng * dLng);
      
      // Speed factor: approx 30mph in degrees/sec
      // 1 degree lat is ~69 miles. 30mph = 30/3600 miles/sec = 0.0083 mps
      // 0.0083/69 = 0.00012 degrees per second
      const speed = 0.00015; 

      if (distance < speed * 1.5) {
        // We have arrived or are very close
        setLocation(target);
        setIsNavigating(false);
        sendNotification("Arrived", `You have arrived at ${order.status === 'accepted' ? order.restaurantName : order.customerName}`);
        return;
      }

      const moveRatio = speed / distance;
      const moveLat = dLat * moveRatio;
      const moveLng = dLng * moveRatio;

      setLocation(prev => {
        if (!prev) return prev;
        return {
          latitude: prev.latitude + moveLat,
          longitude: prev.longitude + moveLng
        };
      });
    }, 1000);

    return () => clearInterval(moveInterval);
  }, [isNavigating, user.isOnline, activeOrders, location === null]);

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
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        // Load user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', fUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            setUser(userData);
          } else {
            // New user from Google Auth, but profile not created yet
            setNewUserDetails({ name: fUser.displayName || '', email: fUser.email || '' });
          }
          setIsProfileLoaded(true);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${fUser.uid}`);
        }
      } else {
        setIsProfileLoaded(false);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
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

  const [isSimulatingMovement, setIsSimulatingMovement] = useState(false);


  // Screen Wake Lock
  useEffect(() => {
    const requestWakeLock = async () => {
      if (user.isOnline && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          // Silent fail for wake lock as it's often blocked in iframes
        }
      } else if (!user.isOnline && wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
    requestWakeLock();
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
            const target = order.status === 'accepted' ? order.restaurantLocation : order.customerLocation;
            
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

  const [toasts, setToasts] = useState<{ id: string, title: string, body: string }[]>([]);

  const addToast = (title: string, body: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    setToasts(prev => [{ id, title, body }, ...prev.slice(0, 2)]); // Keep max 3 at a time, newest at top
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const lastNoteRef = useRef<{ title: string, body: string, time: number } | null>(null);

  const sendNotification = (title: string, body: string) => {
    const now = Date.now();
    if (lastNoteRef.current && 
        lastNoteRef.current.title === title && 
        lastNoteRef.current.body === body && 
        now - lastNoteRef.current.time < 2000) {
      return; // Skip rapid duplicates
    }
    lastNoteRef.current = { title, body, time: now };
    
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body, icon: "https://picsum.photos/seed/uber/100/100" });
      } catch (e) {
        console.warn("Notification API failed, falling back to in-app toast.");
      }
    }
    addToast(title, body);
    setNotifications(prev => [body, ...prev.slice(0, 49)]); // Keep history bounded
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

  // Periodic surge area updates
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSurgeAreas(prev => prev.map(area => {
        // Randomly adjust multiplier slightly
        let newMultiplier = area.multiplier + (Math.random() - 0.5) * 0.1;
        newMultiplier = Math.max(1.1, Math.min(2.5, newMultiplier));
        
        // Randomly shift position slightly to simulate demand movement
        const newLat = area.lat + (Math.random() - 0.5) * 0.0005;
        const newLng = area.lng + (Math.random() - 0.5) * 0.0005;

        // Determine trend
        const trend: 'rising' | 'falling' | 'stable' = 
          newMultiplier > area.multiplier + 0.02 ? 'rising' : 
          newMultiplier < area.multiplier - 0.02 ? 'falling' : 'stable';

        return { ...area, multiplier: Number(newMultiplier.toFixed(2)), lat: newLat, lng: newLng, trend };
      }));
    }, 15000); // Update every 15 seconds

    return () => clearInterval(timer);
  }, []);

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

    // 1. Generate 5 candidate orders
    const candidates = Array.from({ length: 5 }).map(() => {
      const type = availableServices[Math.floor(Math.random() * availableServices.length)];
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

      const basePay = type === 'ride' ? 5.00 + (tripDist * 2.0) : 3.50 + (tripDist * 1.5);
      const pay = (basePay + (Math.random() * 2)) * activeSurge;

      return {
        id: Math.random().toString(36).substr(2, 9),
        type,
        restaurantName: type === 'delivery' ? MOCK_RESTAURANTS[Math.floor(Math.random() * MOCK_RESTAURANTS.length)].name : undefined,
        customerName,
        restaurantLocation: type === 'delivery' ? { latitude: pickupLat, longitude: pickupLng } : undefined,
        pickupLocation: type === 'ride' ? { latitude: pickupLat, longitude: pickupLng } : undefined,
        customerLocation: { latitude: custLat, longitude: custLng },
        estimatedPay: pay,
        estimatedDistance: tripDist,
        estimatedTime: Math.floor(tripDist * 5 + 5),
        status: 'pending' as const,
        items: type === 'delivery' ? ["Meal Deal", "Extra Fries", "Coke Zero"] : undefined,
        distToPickup,
        pin: Math.floor(1000 + Math.random() * 9000).toString(),
        isMatching: activeOrders.length > 0 || Math.random() < 0.3,
        surge: activeSurge > 1.0 ? activeSurge : undefined,
        riderRating: type === 'ride' ? Number((4.5 + Math.random() * 0.5).toFixed(2)) : undefined,
        isUberX: type === 'ride'
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

  // Simulate incoming orders when online
  useEffect(() => {
    if (user.isOnline && activeOrders.length < 3 && !pendingOrder) {
      const timer = setTimeout(() => {
        // 20% chance to pick a scheduled order if available
        const shouldPickScheduled = Math.random() < 0.2 && scheduledOrders.length > 0;
        
        let newOrder: Order | null = null;
        
        if (shouldPickScheduled) {
          const sch = scheduledOrders[Math.floor(Math.random() * scheduledOrders.length)];
          // Convert scheduled order to a real order
          newOrder = {
            id: sch.id,
            restaurantName: sch.restaurantName,
            customerName: "Scheduled Customer",
            restaurantLocation: { 
              latitude: location!.latitude + (Math.random() - 0.5) * 0.02, 
              longitude: location!.longitude + (Math.random() - 0.5) * 0.02 
            },
            customerLocation: { 
              latitude: location!.latitude + (Math.random() - 0.5) * 0.04, 
              longitude: location!.longitude + (Math.random() - 0.5) * 0.04 
            },
            estimatedPay: sch.estimatedPay,
            estimatedDistance: 2.5,
            estimatedTime: 15,
            status: 'pending',
            items: ["Scheduled Meal"],
            pin: Math.floor(1000 + Math.random() * 9000).toString(),
            isMatching: activeOrders.length > 0 || Math.random() < 0.2
          };

          // Check preference for scheduled as well
          if (jobTypePreference === 'matching' && !newOrder.isMatching) return;
          if (jobTypePreference === 'normal' && newOrder.isMatching) return;

          // Remove from scheduled list so it doesn't pop up again
          setScheduledOrders(prev => prev.filter(s => s.id !== sch.id));
        } else {
          newOrder = generateSmartOrder();
          
          // Check preference before showing
          if (newOrder) {
            if (jobTypePreference === 'matching' && !newOrder.isMatching) return;
            if (jobTypePreference === 'normal' && newOrder.isMatching) return;
          }
        }

        if (newOrder) {
          setPendingOrder(newOrder);
          setOrderExpiryTimer(10);
          const prefix = newOrder.isMatching ? "MATCH: " : "TRIP: ";
          const surgeText = newOrder.surge ? ` (${newOrder.surge}x Surge!)` : "";
          sendNotification(prefix + (shouldPickScheduled ? "Scheduled Trip" : "High Priority") + surgeText, `£${newOrder.estimatedPay.toFixed(2)} • ${newOrder.estimatedDistance.toFixed(1)} mi • ${newOrder.restaurantName}`);
          playUberSound('order');
        }
      }, 8000 + Math.random() * 12000);
      return () => clearTimeout(timer);
    }
  }, [user.isOnline, activeOrders, pendingOrder, location, scheduledOrders, jobTypePreference]);

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
    setActiveOrders(prev => prev.filter(o => o.id !== orderId));
    
    // Remote Cleanup
    if (user.uid && db) {
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

  const handleNextStep = (orderId: string) => {
    const order = activeOrders.find(o => o.id === orderId);
    if (!order) return;

    if (order.status === 'accepted') {
      setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'picked_up' } : o));
      const msg = order.type === 'ride' ? `Rider ${order.customerName} picked up` : `Order from ${order.restaurantName} picked up`;
      sendNotification(order.type === 'ride' ? "Trip Started" : "Order Picked Up", msg);
      playUberSound('accept');
    } else if (order.status === 'picked_up') {
      if (order.type === 'ride') {
        handleCompleteDelivery(orderId); // Rides don't usually need PIN/Photo for this demo
      } else {
        setVerifyingDeliveryId(orderId);
      }
    }
  };

  const handleCompleteDelivery = (orderId: string) => {
    const order = activeOrders.find(o => o.id === orderId);
    if (!order) return;

    setEarnings(prev => prev + order.estimatedPay);
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
      setUser(u => ({ ...u, rides: (u.rides || 0) + 1 }));
    } else {
      setUser(u => ({ ...u, deliveries: u.deliveries + 1 }));
    }

    setActiveOrders(prev => prev.filter(o => o.id !== orderId));

    // Remote Cleanup
    if (user.uid && db) {
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
    const target = order.status === 'accepted' ? order.restaurantLocation : order.customerLocation;
    const dLat = target.latitude - location.latitude;
    const dLng = target.longitude - location.longitude;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng) * MILES_PER_DEGREE;
    return dist.toFixed(1);
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
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'order') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
      } else if (type === 'accept') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
      } else if (type === 'message') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'complete') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1046.5, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
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

  return (
    <div className={`h-[100dvh] w-full font-sans overflow-hidden flex flex-col select-none relative transition-all duration-500 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-100 text-black'}`}>
      {/* In-App Toasts */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-[380px] px-4 pointer-events-none flex flex-col items-center gap-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div 
              key={toast.id}
              initial={{ y: -50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.9 }}
              className="bg-black/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl mb-2 flex items-center gap-4 pointer-events-auto border border-white/10"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                <Bell size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-sm">{toast.title}</h4>
                <p className="text-xs text-gray-400 font-bold">{toast.body}</p>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="p-1 hover:bg-white/10 rounded-full"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>


      <AnimatePresence>
        {isSideMenuOpen && (
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
          />
        )}
      </AnimatePresence>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {currentScreen === 'onboarding' && (
            <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full bg-white text-black p-8 flex flex-col justify-center pb-24">
              <div className="mb-12">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-white text-4xl font-black">U</span>
                </div>
                <h1 className="text-4xl font-black leading-tight">Drive when you want,<br/>earn what you need</h1>
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
              
              <div className="w-72 h-72 rounded-full border-4 border-blue-500 overflow-hidden relative mb-12 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                {lockoutUntil && Date.now() < lockoutUntil ? (
                  <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center p-8 text-center">
                    <Lock size={48} className="text-red-500 mb-4" />
                    <h3 className="font-black text-xl mb-2">LOCKED OUT</h3>
                    <p className="text-sm text-red-200">Too many failed attempts. Try again in {Math.ceil((lockoutUntil - Date.now()) / 1000)}s</p>
                  </div>
                ) : (
                  <>
                    <video 
                      ref={(el) => {
                        videoRef.current = el;
                        if (el && !el.srcObject) startCamera();
                      }} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover scale-x-[-1]" 
                    />
                    
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
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full relative">
              {/* Heatmap Simulation */}
              {user.isOnline && !isNavigating && <Heatmap />}
              {/* Matching / Trip Request Overlay */}
              <AnimatePresence>
                {pendingOrder && (
                  <motion.div 
                    initial={{ y: '100%' }} 
                    animate={{ y: 0 }} 
                    exit={{ y: '100%' }} 
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute inset-x-0 bottom-0 z-[200] h-[75vh] bg-black/95 text-white rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden border-t border-white/10"
                  >
                    {/* Map Preview (Simulated) */}
                    <div className="h-48 w-full relative overflow-hidden bg-gray-900">
                      <div className="absolute inset-0 opacity-30" style={{ 
                        backgroundImage: 'linear-gradient(90deg, #333 1px, transparent 1px), linear-gradient(#333 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                      }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full h-full">
                          {/* Driver to Restaurant line */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            <motion.path 
                              d="M 50 150 Q 150 50 250 150" 
                              fill="none" 
                              stroke="#3b82f6" 
                              strokeWidth="4" 
                              strokeDasharray="8,8"
                              initial={{ strokeDashoffset: 100 }}
                              animate={{ strokeDashoffset: 0 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                            <motion.path 
                              d="M 250 150 Q 350 250 450 150" 
                              fill="none" 
                              stroke="#10b981" 
                              strokeWidth="4" 
                              strokeDasharray="8,8"
                              initial={{ strokeDashoffset: 100 }}
                              animate={{ strokeDashoffset: 0 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                          </svg>
                          <div className="absolute left-[50px] top-[150px] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                          <div className="absolute left-[250px] top-[150px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                            <Coffee size={12} className="text-white" />
                          </div>
                          <div className="absolute left-[450px] top-[150px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                            <User size={12} className="text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-4 left-6 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/10">
                        Trip Preview
                      </div>
                    </div>

                    <div className="flex-1 p-8 flex flex-col">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase ${pendingOrder.type === 'ride' ? 'bg-black text-white' : pendingOrder.isMatching ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'}`}>
                              {pendingOrder.type === 'ride' ? 'UberX' : pendingOrder.isMatching ? 'Matching Trip' : 'New Trip'}
                            </span>
                            {pendingOrder.type === 'ride' && pendingOrder.riderRating && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase bg-yellow-500 text-white flex items-center gap-1">
                                <Star size={8} fill="currentColor" />
                                {pendingOrder.riderRating} RATING
                              </span>
                            )}
                            {pendingOrder.pin && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase bg-green-500 text-white flex items-center gap-1">
                                <ShieldCheck size={8} fill="currentColor" />
                                PIN REQUIRED
                              </span>
                            )}
                            {pendingOrder.surge && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase bg-blue-600 text-white flex items-center gap-1">
                                <Zap size={8} fill="currentColor" />
                                {pendingOrder.surge}x Surge
                              </span>
                            )}
                          </div>
                          <h2 className="text-4xl font-black mb-1">£{pendingOrder.estimatedPay.toFixed(2)}</h2>
                          <p className="text-gray-400 font-black tracking-widest uppercase text-xs">Estimated Pay</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black">{getArrivalTime(pendingOrder.estimatedTime)}</p>
                          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{pendingOrder.estimatedDistance.toFixed(1)} mi • {pendingOrder.estimatedTime} min</p>
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

              {/* Earnings Goal Tracker */}
              {user.isOnline && !isNavigating && (
                <motion.div 
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`absolute top-16 left-1/2 -translate-x-1/2 z-[100] w-[85%] max-w-sm p-4 rounded-3xl shadow-2xl border backdrop-blur-md ${theme === 'dark' ? 'bg-black/80 border-white/10' : 'bg-white/90 border-black/5'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Daily Earnings Goal</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-black">£{earnings.toFixed(2)}</p>
                        <p className="text-gray-400 text-sm font-bold">/ £{earningsGoal}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const newGoal = prompt("Set your daily earnings goal:", earningsGoal.toString());
                        if (newGoal && !isNaN(parseFloat(newGoal))) {
                          setEarningsGoal(parseFloat(newGoal));
                          sendNotification("Goal Updated", `Your daily goal is now £${parseFloat(newGoal).toFixed(2)}`);
                        }
                      }}
                      className="p-2 bg-blue-600/10 text-blue-600 rounded-xl hover:bg-blue-600/20 transition-colors"
                    >
                      <Settings size={16} />
                    </button>
                  </div>
                  <div className="h-2 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (earnings / earningsGoal) * 100)}%` }}
                      className={`h-full rounded-full ${earnings >= earningsGoal ? 'bg-green-500' : 'bg-blue-600'}`}
                    />
                  </div>
                  {earnings >= earningsGoal && (
                    <p className="text-[10px] font-black text-green-500 mt-2 uppercase tracking-widest text-center">Goal Achieved! 🏆</p>
                  )}
                </motion.div>
              )}

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
                  setMapOffset(prev => ({
                    x: prev.x + info.delta.x,
                    y: prev.y + info.delta.y
                  }));
                }}
                className={`absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing ${isNightMode || theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#eef2f6]'} ${(lockoutUntil && Date.now() < lockoutUntil) || Object.values(customerTimers).some(t => Number(t) > 0) ? 'blur-md grayscale opacity-50 pointer-events-none' : ''}`}
              >
                {/* Background Layer (Roads/Blocks Optimized) */}
                <div className="absolute inset-0 pointer-events-none" style={{ 
                  transform: `translate(${mapOffset.x}px, ${mapOffset.y}px)`,
                  willChange: 'transform'
                }}>
                  {/* Roads Grid */}
                  <div className="absolute inset-[-4000px] opacity-40" style={{ 
                    backgroundImage: `
                      linear-gradient(90deg, ${isNightMode || theme === 'dark' ? '#333' : '#ccc'} ${4 * zoom}px, transparent ${4 * zoom}px),
                      linear-gradient(${isNightMode || theme === 'dark' ? '#333' : '#ccc'} ${4 * zoom}px, transparent ${4 * zoom}px)
                    `,
                    backgroundSize: `${150 * zoom}px ${150 * zoom}px`
                  }} />
                  
                  {/* Buildings Grid */}
                  <div className="absolute inset-[-4000px] opacity-25" style={{ 
                    backgroundImage: `
                      linear-gradient(45deg, ${theme === 'dark' ? '#444' : '#ddd'} 25%, transparent 25%, transparent 75%, ${theme === 'dark' ? '#444' : '#ddd'} 75%, ${theme === 'dark' ? '#444' : '#ddd'}),
                      radial-gradient(circle, ${theme === 'dark' ? '#333' : '#ccc'} 20%, transparent 20%)
                    `,
                    backgroundSize: `${80 * zoom}px ${80 * zoom}px, ${50 * zoom}px ${50 * zoom}px`,
                    backgroundPosition: `0 0, ${15 * zoom}px ${15 * zoom}px`
                  }} />
                </div>
                
                {/* Traffic Lines (Simulated) */}
                {trafficSegments.map((seg, i) => {
                  const x1 = (seg.start.longitude - location!.longitude) * MAP_SCALE + mapOffset.x;
                  const y1 = (location!.latitude - seg.start.latitude) * MAP_SCALE + mapOffset.y;
                  const x2 = (seg.end.longitude - location!.longitude) * MAP_SCALE + mapOffset.x;
                  const y2 = (location!.latitude - seg.end.latitude) * MAP_SCALE + mapOffset.y;
                  
                  return (
                    <svg key={`traffic-${i}`} className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                      <line 
                        x1={`calc(50% + ${x1}px)`} 
                        y1={`calc(50% + ${y1}px)`} 
                        x2={`calc(50% + ${x2}px)`} 
                        y2={`calc(50% + ${y2}px)`} 
                        stroke={seg.intensity === 'high' ? '#ef4444' : seg.intensity === 'medium' ? '#f59e0b' : '#10b981'} 
                        strokeWidth={4 * zoom} 
                        strokeLinecap="round"
                        opacity="0.6"
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
                        <div className="bg-white/10 p-2 rounded-xl">
                          <Navigation size={24} className="fill-white" style={{ transform: 'rotate(45deg)' }} />
                        </div>
                        <div>
                          <p className="text-xl font-black leading-tight">
                            {activeOrders[0].status === 'accepted' ? 'Main St' : 'Dropoff'}
                          </p>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {activeOrders[0].status === 'accepted' ? `Pickup by ${getArrivalTime(activeOrders[0].estimatedTime / 2)}` : `Arriving by ${getArrivalTime(activeOrders[0].estimatedTime / 2)}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <button onClick={() => setIsNavigating(false)} className="p-2 bg-white/5 rounded-full">
                          <X size={20} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Buildings & Blocks */}
                <div className="absolute inset-0 opacity-25" style={{ 
                  backgroundImage: `
                    linear-gradient(45deg, ${theme === 'dark' ? '#444' : '#ddd'} 25%, transparent 25%, transparent 75%, ${theme === 'dark' ? '#444' : '#ddd'} 75%, ${theme === 'dark' ? '#444' : '#ddd'}),
                    linear-gradient(45deg, ${theme === 'dark' ? '#444' : '#ddd'} 25%, transparent 25%, transparent 75%, ${theme === 'dark' ? '#444' : '#ddd'} 75%, ${theme === 'dark' ? '#444' : '#ddd'}),
                    radial-gradient(circle, ${theme === 'dark' ? '#333' : '#ccc'} 20%, transparent 20%)
                  `,
                  backgroundSize: `${80 * zoom}px ${80 * zoom}px, ${80 * zoom}px ${80 * zoom}px, ${50 * zoom}px ${50 * zoom}px`,
                  backgroundPosition: `0 0, ${40 * zoom}px ${40 * zoom}px, ${15 * zoom}px ${15 * zoom}px`,
                  transform: location ? `translate(${(location.longitude * BUILDING_SCALE + mapOffset.x) % (80 * zoom)}px, ${(location.latitude * BUILDING_SCALE + mapOffset.y) % (80 * zoom)}px)` : 'none'
                }} />
                
                {/* Parks/Green areas */}
                <div className="absolute inset-0 opacity-15" style={{ 
                  backgroundImage: 'radial-gradient(circle, #2d5a27 15%, transparent 85%), radial-gradient(circle, #1e3a1a 10%, transparent 70%)',
                  backgroundSize: `${500 * zoom}px ${500 * zoom}px, ${400 * zoom}px ${400 * zoom}px`,
                  transform: location ? `translate(${(location.longitude * PARK_SCALE + mapOffset.x) % (500 * zoom)}px, ${(location.latitude * PARK_SCALE + mapOffset.y) % (500 * zoom)}px)` : 'none'
                }} />

                {/* Surge Zones Visualization */}
                {location && activeSurgeAreas.map((area, i) => {
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
                {location && hotspots.map((spot, i) => {
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

                {/* Active Order Pins */}
                {location && activeOrders.filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter).map((order, i) => {
                  const target = order.status === 'accepted' ? order.restaurantLocation : order.customerLocation;
                  const x = (target.longitude - location.longitude) * MAP_SCALE + mapOffset.x;
                  const y = (location.latitude - target.latitude) * MAP_SCALE + mapOffset.y;
                  
                  return (
                    <motion.div 
                      key={`order-pin-${order.id}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute flex flex-col items-center z-[200]"
                      style={{ 
                        left: '50%', 
                        top: '50%', 
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` 
                      }}
                    >
                      <div className={`w-10 h-10 rounded-full shadow-2xl flex items-center justify-center border-4 border-white ${order.status === 'accepted' ? 'bg-green-600' : 'bg-blue-600'}`}>
                        {order.status === 'accepted' ? <ShoppingBag size={20} className="text-white" /> : <User size={20} className="text-white" />}
                      </div>
                      <div className="mt-2 px-3 py-1 bg-white rounded-full shadow-lg">
                        <span className="text-[10px] font-black text-black whitespace-nowrap">
                          {order.status === 'accepted' ? order.restaurantName : order.customerName}
                        </span>
                      </div>
                      <div className={`w-1 h-4 ${order.status === 'accepted' ? 'bg-green-600' : 'bg-blue-600'} mt-[-4px]`} />
                    </motion.div>
                  );
                })}

                {/* Active Route Path */}
                {isNavigating && location && routeWaypoints.length > 0 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    <motion.path 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1 }}
                      d={`M ${50}% ${50}% ${routeWaypoints.map(wp => {
                        const x = (wp.longitude - location.longitude) * MAP_SCALE;
                        const y = (location.latitude - wp.latitude) * MAP_SCALE;
                        return `L calc(50% + ${x}px) calc(50% + ${y}px)`;
                      }).join(' ')}`}
                      fill="none" 
                      stroke="#3b82f6" 
                      strokeWidth={6 * zoom} 
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.8"
                    />
                    {/* Animated path overlay */}
                    <motion.path 
                      d={`M calc(50% + ${mapOffset.x}px) calc(50% + ${mapOffset.y}px) ${routeWaypoints.map(wp => {
                        const x = (wp.longitude - location.longitude) * MAP_SCALE + mapOffset.x;
                        const y = (location.latitude - wp.latitude) * MAP_SCALE + mapOffset.y;
                        return `L calc(50% + ${x}px) calc(50% + ${y}px)`;
                      }).join(' ')}`}
                      fill="none" 
                      stroke="white" 
                      strokeWidth={2 * zoom} 
                      strokeDasharray={`${10 * zoom},${10 * zoom}`}
                      animate={{ strokeDashoffset: -20 * zoom }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      opacity="0.5"
                    />
                  </svg>
                )}

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
                    {activeOrders.filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter).map(order => {
                      const isPickup = order.status === 'accepted';
                      const target = isPickup ? order.restaurantLocation : order.customerLocation;
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
                    {pendingOrder && (
                      <>
                        {[pendingOrder.restaurantLocation, pendingOrder.customerLocation].map((target, i) => {
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
                        <h2 className="text-3xl font-black">Inbox</h2>
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
                        <h2 className="text-3xl font-black text-black">Set Destination</h2>
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
                        <h2 className="text-3xl font-black text-black">Safety Toolkit</h2>
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
                    <span className="text-xl font-black tracking-tight">£{earnings.toFixed(2)}</span>
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
                <div className="absolute bottom-0 left-0 right-0 z-50">
                  {user.isOnline ? (
                    <motion.div 
                      initial={{ y: 100 }}
                      animate={{ y: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsBottomMenuOpen(true);
                      }}
                      className="w-full bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.1)] flex items-center justify-between px-8 py-6 cursor-pointer active:scale-[0.99] transition-transform rounded-t-[32px]"
                    >
                      <button className="text-black" onClick={(e) => { e.stopPropagation(); setIsSideMenuOpen(true); }}>
                        <Menu size={28} />
                      </button>
                      
                      <div className="flex flex-col items-center flex-1">
                        {activeOrders.length > 0 && Number(distanceToTarget(activeOrders[0])) <= 1.5 ? (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNextStep(activeOrders[0].id);
                            }}
                            className={`w-full py-6 rounded-3xl font-black text-2xl uppercase tracking-tighter shadow-2xl border-4 border-white animate-pulse transition-all ${
                              activeOrders[0].status === 'accepted' 
                                ? 'bg-blue-600 text-white shadow-blue-600/50' 
                                : 'bg-green-600 text-white shadow-green-600/50'
                            }`}
                          >
                            {activeOrders[0].status === 'accepted' ? 'Confirm Pickup' : 'Confirm Dropoff'}
                          </motion.button>
                        ) : (
                          <>
                            <span className="text-2xl font-black text-black tracking-tight">
                              {activeOrders.length > 0 
                                ? `${activeOrders.length} Active ${activeOrders.length === 1 ? 'Trip' : 'Trips'}`
                                : 'Finding trips'}
                            </span>
                            {activeOrders.length > 0 && (
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                {activeOrders[0].status === 'accepted' ? 'Heading to pickup' : 'Heading to dropoff'}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      <button className="text-black" onClick={(e) => { e.stopPropagation(); setIsBottomMenuOpen(true); }}>
                        <List size={28} />
                      </button>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center w-full">
                      <button 
                        onClick={() => setIsVehicleSettingsOpen(true)}
                        className={`absolute top-6 left-6 z-[120] p-3 rounded-full shadow-2xl backdrop-blur-md border border-white/10 ${theme === 'dark' ? 'bg-black/80 text-white' : 'bg-white/90 text-black shadow-black/5'}`}
                      >
                        <Settings size={20} />
                      </button>
                      {/* GO Button */}
                      {/* Dashboard Feed (Authentic Uber Experience) */}
                      <div className="absolute inset-x-0 bottom-0 max-h-[60%] overflow-y-auto no-scrollbar pb-10">
                        <motion.div 
                          initial={{ y: 200 }}
                          animate={{ y: 0 }}
                          className={`w-full ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'} rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.15)] border-t border-white/5 p-6 space-y-4`}
                        >
                          <div className="flex justify-center mb-2">
                            <div className={`w-12 h-1.5 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div 
                              onClick={() => setCurrentScreen('earnings')}
                              className={`p-6 rounded-[30px] border-2 transition-all active:scale-95 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}
                            >
                              <div className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-1">Today</div>
                              <div className="text-2xl font-black">£{earnings.toFixed(2)}</div>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 mt-2">
                                <TrendingUp size={12} />
                                View Earnings
                              </div>
                            </div>
                            <div 
                              onClick={() => setCurrentScreen('ratings')}
                              className={`p-6 rounded-[30px] border-2 transition-all active:scale-95 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}
                            >
                              <div className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-1">Rating</div>
                              <div className="text-2xl font-black">{user.rating.toFixed(2)} ★</div>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 mt-2">
                                <Star size={12} fill="currentColor" />
                                Top Partner
                              </div>
                            </div>
                          </div>

                          <div 
                            onClick={() => setIsVehicleSettingsOpen(true)}
                            className={`p-6 rounded-[32px] border-2 transition-all active:scale-[0.98] flex items-center justify-between col-span-2 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl">
                                {vehicleType === 'Car' ? <CarIcon size={24} /> : vehicleType === 'Bike' ? <BikeIcon size={24} /> : <Zap size={24} />}
                              </div>
                              <div>
                                <h3 className="font-black">Trip Preferences</h3>
                                <p className="text-xs font-bold text-gray-400">Mode: {vehicleType} • {selectedServices.length} Selected</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                <Settings size={16} className="text-gray-400" />
                              </div>
                            </div>
                          </div>

                          <div 
                            onClick={() => setCurrentScreen('uber_services')}
                            className={`p-6 rounded-[32px] border-2 transition-all active:scale-[0.98] flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl">
                                <Zap size={24} />
                              </div>
                              <div>
                                <h3 className="font-black">Work Hub</h3>
                                <p className="text-xs font-bold text-gray-400">Choose how to earn</p>
                              </div>
                            </div>
                            <ArrowRight size={20} className="text-gray-300" />
                          </div>

                          <div 
                            onClick={() => setCurrentScreen('opportunities')}
                            className={`p-6 rounded-[32px] border-2 transition-all active:scale-[0.98] ${theme === 'dark' ? 'bg-blue-900/20 border-white/5' : 'bg-blue-50 border-blue-100 shadow-sm'}`}
                          >
                            <div className="flex items-center gap-3 mb-2 text-blue-600">
                              <TrendingUp size={20} />
                              <span className="font-black">High Demand Area</span>
                            </div>
                            <p className={`font-black ${theme === 'dark' ? 'text-white' : 'text-blue-900'}`}>Surge is rising in {currentCity}</p>
                            <p className="text-xs text-gray-400 font-bold mt-1">Earn more on every trip</p>
                          </div>

                          <button 
                            onClick={() => {
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
                            className="w-full py-5 bg-blue-600 text-white rounded-[32px] font-black text-xl shadow-xl shadow-blue-600/30 active:scale-95 transition-all"
                          >
                            GO ONLINE
                          </button>
                        </motion.div>
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
                      className={`absolute bottom-0 left-0 right-0 rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.5)] flex flex-col max-h-[70vh] overflow-hidden ${theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black'}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col items-center pt-4 pb-2">
                        <div className={`w-12 h-1.5 rounded-full mb-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
                      </div>
                      
                      <div className="overflow-y-auto px-6 pb-20 custom-scrollbar flex-1">
                        {!user.isOnline ? (
                          <>
                            <div className="flex justify-between w-full mb-8 px-4">
                              <button onClick={() => { setIsSideMenuOpen(true); setIsBottomMenuOpen(false); }} className="flex flex-col items-center gap-2">
                                <div className={`p-4 rounded-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><Menu size={24} /></div>
                                <span className="text-xs font-bold">Menu</span>
                              </button>
                              
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                disabled={(lockoutUntil ? Date.now() < lockoutUntil : false) || Object.values(customerTimers).some(t => Number(t) > 0)}
                                onClick={() => {
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
                                className={`w-24 h-24 rounded-full border-4 border-white flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.5)] relative overflow-hidden transition-all -mt-16 ${(lockoutUntil && Date.now() < lockoutUntil) || Object.values(customerTimers).some(t => Number(t) > 0) ? 'bg-gray-800 grayscale cursor-not-allowed' : 'bg-blue-600'}`}
                              >
                                <motion.div 
                                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }} 
                                  transition={{ duration: 2, repeat: Infinity }} 
                                  className="absolute inset-0 bg-white rounded-full" 
                                />
                                <span className="text-xl font-black tracking-widest relative z-10 text-white">{(lockoutUntil && Date.now() < lockoutUntil) || Object.values(customerTimers).some(t => Number(t) > 0) ? 'LOCKED' : 'GO'}</span>
                              </motion.button>

                              <button onClick={() => setIsSearchOpen(true)} className="flex flex-col items-center gap-2">
                                <div className={`p-4 rounded-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}><Search size={24} /></div>
                                <span className="text-xs font-bold">Search</span>
                              </button>
                            </div>

                            <div className={`w-full p-4 rounded-2xl flex items-center justify-between mb-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                <span className="font-bold text-sm">You're offline</span>
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
                                  <p className={`font-black text-lg leading-none ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Finding trips</p>
                                  <p className="text-xs text-gray-400 font-bold mt-1">{currentCity}</p>
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
                        <div className="space-y-4">
                          {/* Active Orders in Menu */}
                          {activeOrders.length > 0 ? (
                            <div className="space-y-3 mb-6">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Trips</p>
                                <div className={`flex p-0.5 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                                  {(['all', 'accepted', 'picked_up'] as const).map((f) => (
                                    <button
                                      key={f}
                                      onClick={(e) => { e.stopPropagation(); setOrderStatusFilter(f); }}
                                      className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-wider transition-all ${
                                        orderStatusFilter === f 
                                          ? (theme === 'dark' ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm')
                                          : 'text-gray-400 opacity-60 hover:opacity-100'
                                      }`}
                                    >
                                      {f === 'all' ? 'All' : f === 'accepted' ? 'Pickup' : 'Drop'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {activeOrders.filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter).map((order, idx) => (
                                <motion.div 
                                  key={order.id} 
                                  initial={{ x: -20, opacity: 0 }} 
                                  animate={{ x: 0, opacity: 1 }} 
                                  transition={{ delay: idx * 0.1 }}
                                  className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}
                                  onClick={() => {
                                    setViewingOrderDetailsId(order.id);
                                    setIsBottomMenuOpen(false);
                                  }}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${order.status === 'accepted' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                      {order.status === 'accepted' ? <Coffee size={24} /> : <User size={24} />}
                                    </div>
                                    <div>
                                      <h3 className="font-black text-lg leading-tight">{order.status === 'accepted' ? order.restaurantName : order.customerName}</h3>
                                      <p className="text-xs text-gray-400 font-bold">{order.items.length} items • £{order.estimatedPay.toFixed(2)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveChatOrderId(order.id);
                                        setIsBottomMenuOpen(false);
                                        setCurrentScreen('chat');
                                      }}
                                      className={`p-2 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}
                                    >
                                      <MessageSquare size={18} />
                                    </button>
                                    <div className="text-right">
                                      <p className="text-sm font-black">£{order.estimatedPay.toFixed(2)}</p>
                                      <p className="text-[10px] font-bold text-gray-400">{order.status === 'accepted' ? 'Pickup' : 'Dropoff'}</p>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
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
                            <p className="text-[10px] text-gray-500">{order.items.length} items • £{order.estimatedPay.toFixed(2)}</p>
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
                                {order.status === 'accepted' ? 'Confirm Pickup' : 'Confirm Dropoff'}
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
                {viewingOrderDetailsId && (
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
                {verifyingDeliveryId && (
                  <DeliveryVerificationModal 
                    order={activeOrders.find(o => o.id === verifyingDeliveryId)!}
                    enteredPin={enteredPin}
                    setEnteredPin={setEnteredPin}
                    isPhotoCaptured={isPhotoCaptured}
                    setIsPhotoCaptured={setIsPhotoCaptured}
                    onComplete={() => {
                      const order = activeOrders.find(o => o.id === verifyingDeliveryId);
                      if (order) {
                        if (enteredPin === order.pin || isPhotoCaptured) {
                          handleCompleteDelivery(order.id);
                        } else if (enteredPin.length === 4) {
                          sendNotification("Invalid PIN", "The PIN you entered is incorrect. Please try again.");
                          setEnteredPin("");
                        }
                      }
                    }}
                    onClose={() => setVerifyingDeliveryId(null)}
                  />
                )}
              </AnimatePresence>

              {/* Earnings Detail Modal */}
              <AnimatePresence>
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
              </AnimatePresence>

              {/* Pending Order Modal */}
              <AnimatePresence>
                {pendingOrder && (
                  <motion.div initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 50 }} className="absolute inset-x-4 bottom-24 z-[60]">
                    <div className="bg-white text-black rounded-2xl overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.4)]">
                      <div className="bg-blue-600 p-4 text-white text-center relative">
                        <div className="text-[10px] font-bold tracking-widest opacity-80 mb-1 uppercase">New Delivery Opportunity</div>
                        <div className="text-3xl font-black">£{pendingOrder.estimatedPay.toFixed(2)}</div>
                        <div className="text-[10px] font-bold opacity-80 mt-1">Includes expected tip</div>
                        <div className="mt-3 flex justify-center">
                          <div className="w-10 h-10 rounded-full border-4 border-white/30 flex items-center justify-center relative">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                              <circle 
                                cx="20" cy="20" r="16" 
                                fill="none" 
                                stroke="white" 
                                strokeWidth="4" 
                                strokeDasharray="100.48" 
                                strokeDashoffset={100.48 * (1 - orderExpiryTimer / 10)}
                                className="transition-all duration-1000 ease-linear"
                              />
                            </svg>
                            <span className="font-black text-sm">{orderExpiryTimer}</span>
                          </div>
                        </div>
                        <button onClick={handleDeclineOrder} className="absolute top-3 right-3 p-1 bg-black/20 rounded-full"><X size={16} /></button>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <div className="w-0.5 h-4 bg-gray-200" />
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-sm mb-2">{pendingOrder.restaurantName}</div>
                              <div className="font-bold text-sm text-gray-400">Customer Address</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black">{getArrivalTime(pendingOrder.estimatedTime)}</p>
                            <p className="text-[10px] text-gray-400 font-bold">ARRIVAL</p>
                          </div>
                        </div>
                        <button onClick={handleAcceptOrder} className="w-full py-4 bg-black text-white rounded-xl font-black text-lg tracking-wide">ACCEPT</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {currentScreen === 'chat' && (
            <motion.div key="chat" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-0 z-[1000] bg-white text-black flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <X size={24} />
                </button>
                <div className="flex-1">
                  <h2 className="font-black text-xl">
                    {activeOrders.find(o => o.id === activeChatOrderId)?.customerName || 'Customer'}
                  </h2>
                  <p className="text-[10px] text-gray-400 font-black tracking-widest uppercase">Active Delivery</p>
                </div>
                <button className="p-3 bg-green-500 text-white rounded-full transition-transform active:scale-95">
                  <Phone size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scroll-smooth no-scrollbar">
                <div className="flex justify-center p-4">
                  <div className="bg-white px-4 py-2 rounded-full border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest shadow-sm">
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
                          localStorage.setItem('jobTypePreference', pref.id);
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

          {currentScreen === 'planner' && (
            <motion.div key="rewards" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="h-full w-full bg-white text-black p-6 overflow-y-auto pb-32">
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
                  { icon: <User />, label: "Personal Information", action: () => sendNotification("Account", "Personal info updated.") },
                  { icon: <History />, label: "Trip History", action: () => setCurrentScreen('trip_history') },
                  { icon: <FileText />, label: "Documents", action: () => setCurrentScreen('documents') },
                  { icon: <CreditCard />, label: "Payment", action: () => setCurrentScreen('earnings') },
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
            <motion.div key="trip_history" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`h-full w-full p-6 overflow-y-auto pb-32 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}>
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('account')} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><ArrowRight className="rotate-180" size={24} /></button>
                <h1 className="text-3xl font-black">Trip History</h1>
              </div>

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
                  {completedTrips.map((trip) => (
                    <motion.div 
                      key={trip.id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className={`p-5 rounded-3xl border-2 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-50 shadow-sm'}`}
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

                      <div className="space-y-4 relative">
                        {/* Timeline line */}
                        <div className="absolute left-1.5 top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-white/10" />
                        
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                          <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Restaurant</p>
                            <p className="text-xs font-bold leading-tight">{trip.restaurantName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 relative z-10">
                          <div className="w-3 h-3 rounded-sm border-2 border-orange-500" />
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
          )}

          {currentScreen === 'earnings' && (
            <motion.div key="earnings" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`h-full w-full p-6 overflow-y-auto pb-32 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}`}>
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><X size={24} /></button>
                <h1 className="text-3xl font-black">Earnings</h1>
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
                <h2 className="text-5xl font-black mb-6">£{(earningsTab === 'today' ? earnings * 0.15 : earnings).toFixed(2)}</h2>
                
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
                <h3 className="font-black text-xl">
                  {earningsTab === 'recent' ? 'All Activity' : 'Recent Activity'}
                </h3>
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
      {currentScreen !== 'home' && (
        <div className="h-20 bg-black border-t border-white/10 flex items-center justify-around px-4 z-[110]">
          <NavButton active={currentScreen === 'home'} onClick={() => setCurrentScreen('home')} icon={<Navigation size={24} />} label="Home" />
          <NavButton active={currentScreen === 'earnings'} onClick={() => setCurrentScreen('earnings')} icon={<TrendingUp size={24} />} label="Earnings" />
          <NavButton active={currentScreen === 'inbox'} onClick={() => setCurrentScreen('inbox')} icon={<Mail size={24} />} label="Inbox" />
          <NavButton active={currentScreen === 'account'} onClick={() => setCurrentScreen('account')} icon={<User size={24} />} label="Account" />
        </div>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-white' : 'text-gray-500'}`}>
      <div className={`p-1 rounded-full transition-colors ${active ? 'bg-white/10' : ''}`}>{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

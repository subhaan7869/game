/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo, ReactNode } from 'react';
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
  ArrowUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Location, Order, AppScreen, ChatMessage, UserProfile, UberProTier, ScheduledOrder } from './types';
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

export default function App() {
  // App State
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('onboarding');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('uber_theme') as 'light' | 'dark') || 'light';
  });
  const [earningsTab, setEarningsTab] = useState<'today' | 'weekly' | 'recent'>('today');
  
  // User Profile State
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('uber_eats_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, isOnline: false }; // Always start offline
    }
    return {
      name: "Hassen Nabeel",
      rating: 4.95,
      tier: 'Blue',
      points: 120,
      deliveries: 8,
      isOnline: false,
      documentsUploaded: false,
      faceVerified: false,
      walletBalance: 0,
      documentExpiries: {
        "Driving Licence": "2026-05-01",
        "Vehicle Insurance": "2026-06-15",
        "Bank Statement": "2026-04-10"
      }
    };
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
  
  // Chat & Notifications
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);
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
  const [isNightMode, setIsNightMode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifyingToOnline, setIsVerifyingToOnline] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [viewingOrderDetailsId, setViewingOrderDetailsId] = useState<string | null>(null);
  const [hotspots, setHotspots] = useState<{ latitude: number, longitude: number, intensity: number, size: number }[]>([]);

  // New Maintenance/Update States
  const [isUpdating, setIsUpdating] = useState(true);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(false);
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
  const [lastTrip, setLastTrip] = useState<{ amount: number, time: string, type: string } | null>({
    amount: 7.75,
    time: "4:16 PM",
    type: "Uber Eats"
  });

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
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${fUser.uid}`);
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync User Profile to Firestore
  useEffect(() => {
    if (firebaseUser && user.name) {
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
  }, [user, firebaseUser]);

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

  const UpdateScreen = () => (
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
            animate={{ width: `${updateProgress}%` }}
            className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
          />
        </div>
        <span className="mt-4 font-black text-xl">{updateProgress}%</span>
      </motion.div>
    </div>
  );

  const MaintenanceScreen = () => (
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
          onClick={() => setIsUnderMaintenance(false)}
          className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl"
        >
          RETRY
        </button>
      </motion.div>
    </div>
  );

  const OrderDetailsModal = () => {
    const order = activeOrders.find(o => o.id === viewingOrderDetailsId);
    if (!order) return null;

    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 z-[400] bg-black/80 backdrop-blur-sm flex items-end justify-center"
      >
        <motion.div 
          initial={{ y: '100%' }} 
          animate={{ y: 0 }} 
          exit={{ y: '100%' }} 
          className={`w-full max-w-sm rounded-t-[40px] p-8 shadow-2xl ${theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black'}`}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black">Order Details</h2>
            <button onClick={() => setViewingOrderDetailsId(null)} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}><X size={24} /></button>
          </div>

          <div className="space-y-6 mb-12">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <Coffee size={24} />
              </div>
              <div>
                <p className="text-xs font-black text-blue-500 uppercase tracking-widest mb-1">Restaurant</p>
                <p className="text-xl font-bold">{order.restaurantName}</p>
                <p className="text-sm text-gray-400 font-bold">Pickup items: {order.items.join(', ')}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
                <User size={24} />
              </div>
              <div>
                <p className="text-xs font-black text-green-500 uppercase tracking-widest mb-1">Customer</p>
                <p className="text-xl font-bold">{order.customerName}</p>
                <p className="text-sm text-gray-400 font-bold">Estimated Pay: £{order.estimatedPay.toFixed(2)}</p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-500">Order ID</span>
                <span className="font-black">#{order.id.slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-500">Status</span>
                <span className="font-black text-blue-500 uppercase text-xs tracking-widest">{order.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setViewingOrderDetailsId(null)}
            className={`w-full py-5 rounded-3xl font-black text-xl active:scale-95 transition-transform ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}
          >
            CLOSE
          </button>
        </motion.div>
      </motion.div>
    );
  };

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

  // Simulated Update and Scan Sequence
  useEffect(() => {
    const runSequence = async () => {
      // 1. Update Progress
      for (let i = 0; i <= 100; i += 5) {
        setUpdateProgress(i);
        await new Promise(r => setTimeout(r, 100));
      }
      setIsUpdating(false);
      
      // 2. Scanning for Bugs
      setIsScanning(true);
      await new Promise(r => setTimeout(r, 2000));
      
      // 3. Randomly decide if maintenance is needed (simulated bug)
      const hasBug = Math.random() > 0.95; // 5% chance of maintenance
      if (hasBug) {
        setIsUnderMaintenance(true);
      }
      setIsScanning(false);
    };
    runSequence();
  }, []);

  // Screen Wake Lock
  useEffect(() => {
    const requestWakeLock = async () => {
      if (user.isOnline && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.error(`${err.name}, ${err.message}`);
        }
      } else if (!user.isOnline && wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
    requestWakeLock();
  }, [user.isOnline]);
  // Geolocation tracking & Navigation Simulation
  useEffect(() => {
    if (isSimulatingMovement || isNavigating) {
      let angle = 0;
      const interval = setInterval(() => {
        setLocation(prev => {
          if (!prev) return { latitude: 51.5074, longitude: -0.1278 };
          
          if (isNavigating && activeOrders.length > 0) {
            const order = activeOrders[0];
            const target = order.status === 'accepted' ? order.restaurantLocation : order.customerLocation;
            
            // Move towards target
            const dLat = target.latitude - prev.latitude;
            const dLng = target.longitude - prev.longitude;
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);
            
            if (dist < 0.0001) {
              // Arrived!
              return prev;
            }
            
            const step = 0.0002; // Speed
            return {
              latitude: prev.latitude + (dLat / dist) * step,
              longitude: prev.longitude + (dLng / dist) * step,
            };
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
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
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
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, title, body }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const sendNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body, icon: "https://picsum.photos/seed/uber/100/100" });
      } catch (e) {
        console.warn("Notification API failed, falling back to in-app toast.");
      }
    }
    addToast(title, body);
    setNotifications(prev => [body, ...prev]);
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

  // Improved Order Matching Algorithm
  const generateSmartOrder = () => {
    if (!location) return null;

    // 1. Generate 5 candidate orders
    const candidates = Array.from({ length: 5 }).map(() => {
      const randomRest = MOCK_RESTAURANTS[Math.floor(Math.random() * MOCK_RESTAURANTS.length)];
      const customerName = MOCK_CUSTOMERS[Math.floor(Math.random() * MOCK_CUSTOMERS.length)];
      
      const restLat = location.latitude + randomRest.offset.lat;
      const restLng = location.longitude + randomRest.offset.lng;
      const custLat = restLat + (Math.random() - 0.5) * 0.01;
      const custLng = restLng + (Math.random() - 0.5) * 0.01;

      const distToRest = Math.sqrt(Math.pow(restLat - location.latitude, 2) + Math.pow(restLng - location.longitude, 2)) * MILES_PER_DEGREE;
      const tripDist = Math.sqrt(Math.pow(custLat - restLat, 2) + Math.pow(custLng - restLng, 2)) * MILES_PER_DEGREE;
      const pay = 3.50 + (tripDist * 1.5) + (Math.random() * 2);

      return {
        id: Math.random().toString(36).substr(2, 9),
        restaurantName: randomRest.name,
        customerName,
        restaurantLocation: { latitude: restLat, longitude: restLng },
        customerLocation: { latitude: custLat, longitude: custLng },
        estimatedPay: pay,
        estimatedDistance: tripDist,
        estimatedTime: Math.floor(tripDist * 5 + 5),
        status: 'pending' as const,
        items: ["Meal Deal", "Extra Fries", "Coke Zero"],
        distToRest,
        pin: Math.floor(1000 + Math.random() * 9000).toString(),
        isMatching: activeOrders.length > 0
      };
    });

    // 2. Score each candidate
    const scoredCandidates = candidates.map(order => {
      let score = 0;

      // Factor 1: Proximity to driver (Closer is better)
      score += (10 / (order.distToRest + 0.5));

      // Factor 2: Pay (Higher is better)
      score += (order.estimatedPay * 2);

      // Factor 3: Route Alignment (Stacked orders)
      if (activeOrders.length > 0) {
        activeOrders.forEach(active => {
          const target = active.status === 'accepted' ? active.restaurantLocation : active.customerLocation;
          
          // Check if new restaurant is near current target
          const distToRestFromActive = Math.sqrt(
            Math.pow(order.restaurantLocation.latitude - target.latitude, 2) + 
            Math.pow(order.restaurantLocation.longitude - target.longitude, 2)
          ) * MILES_PER_DEGREE;

          // Check if new customer is near current target
          const distToCustFromActive = Math.sqrt(
            Math.pow(order.customerLocation.latitude - target.latitude, 2) + 
            Math.pow(order.customerLocation.longitude - target.longitude, 2)
          ) * MILES_PER_DEGREE;
          
          // Boost score if either restaurant or customer is nearby
          if (distToRestFromActive < 0.5) score += 40;
          if (distToCustFromActive < 0.5) score += 20;
          
          // Extra boost if both are somewhat aligned (efficient route)
          if (distToRestFromActive < 1 && distToCustFromActive < 1) score += 15;
        });
      }

      return { order, score };
    });

    // 3. Pick the best one
    const best = scoredCandidates.sort((a, b) => b.score - a.score)[0].order;
    return best;
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
            isMatching: false
          };
          // Remove from scheduled list so it doesn't pop up again
          setScheduledOrders(prev => prev.filter(s => s.id !== sch.id));
        } else {
          newOrder = generateSmartOrder();
        }

        if (newOrder) {
          setPendingOrder(newOrder);
          setOrderExpiryTimer(10);
          const prefix = newOrder.isMatching ? "MATCH: " : "TRIP: ";
          sendNotification(prefix + (shouldPickScheduled ? "Scheduled Trip" : "High Priority"), `£${newOrder.estimatedPay.toFixed(2)} • ${newOrder.estimatedDistance.toFixed(1)} mi • ${newOrder.restaurantName}`);
          playUberSound('order');
        }
      }, 8000 + Math.random() * 12000);
      return () => clearTimeout(timer);
    }
  }, [user.isOnline, activeOrders, pendingOrder, location, scheduledOrders]);

  const handleAcceptOrder = () => {
    if (pendingOrder) {
      if (activeOrders.length >= 3) {
        sendNotification("Limit Reached", "You can only handle up to 3 active orders at a time.");
        return;
      }
      setActiveOrders(prev => [...prev, { ...pendingOrder, status: 'accepted' }]);
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

  const handleCancelOrder = (orderId: string) => {
    setActiveOrders(prev => prev.filter(o => o.id !== orderId));
    setCancellingOrderId(null);
    sendNotification("Trip Cancelled", "The trip has been removed from your active tasks.");
    playUberSound('accept');
  };

  const handleNextStep = (orderId: string) => {
    const order = activeOrders.find(o => o.id === orderId);
    if (!order) return;

    if (order.status === 'accepted') {
      setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'picked_up' } : o));
      sendNotification("Order Picked Up", `Head to ${order.customerName}'s location`);
      playUberSound('accept');
    } else if (order.status === 'picked_up') {
      setVerifyingDeliveryId(orderId);
    }
  };

  const handleCompleteDelivery = (orderId: string) => {
    const order = activeOrders.find(o => o.id === orderId);
    if (!order) return;

    setEarnings(prev => prev + order.estimatedPay);
    setActiveOrders(prev => prev.filter(o => o.id !== orderId));
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
    
    sendNotification("Delivery Complete", `You earned £${order.estimatedPay.toFixed(2)}`);
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

  // UI Components
  const ScheduledOrdersScreen = () => {
    const [isAdding, setIsAdding] = useState(false);
    const [newOrder, setNewOrder] = useState({ restaurantName: '', time: '' });

    const handleAdd = async () => {
      if (!firebaseUser) return;
      try {
        await addDoc(collection(db, 'scheduled_orders'), {
          driverUid: firebaseUser.uid,
          restaurantName: newOrder.restaurantName,
          scheduledTime: new Date(newOrder.time).toISOString(),
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
            <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
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
                  <p className="text-sm text-gray-500 font-bold">{new Date(order.scheduledTime).toLocaleString()}</p>
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

  const NewUserForm = () => (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl relative z-10">
        <h2 className="text-3xl font-black mb-2">New User?</h2>
        <p className="text-gray-500 font-bold mb-8 text-sm">We don't recognize your face. Create an account to start earning.</p>
        
        <div className="space-y-4 mb-8">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Full Name</label>
            <input 
              type="text" 
              className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
              value={newUserDetails.name}
              onChange={e => setNewUserDetails({...newUserDetails, name: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Email</label>
            <input 
              type="email" 
              className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold"
              value={newUserDetails.email}
              onChange={e => setNewUserDetails({...newUserDetails, email: e.target.value})}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setIsNewUserFormOpen(false)} className="flex-1 py-4 bg-gray-100 text-black rounded-2xl font-black">CANCEL</button>
          <button 
            onClick={async () => {
              // Create user in Firestore
              try {
                // In this demo, we'll use a random UID if not logged in with Google
                const uid = firebaseUser?.uid || "user_" + Math.random().toString(36).substr(2, 9);
                const newUserProfile: UserProfile = {
                  name: newUserDetails.name,
                  rating: 5.0,
                  tier: 'Blue',
                  points: 0,
                  deliveries: 0,
                  isOnline: false,
                  documentsUploaded: true,
                  faceVerified: true,
                  walletBalance: 0,
                  profilePic: (newUserDetails as any).profilePic || "",
                  documentExpiries: {
                    "Driving Licence": "2027-01-01",
                    "Vehicle Insurance": "2027-01-01",
                    "Bank Statement": "2027-01-01"
                  },
                  faceSignature: (newUserDetails as any).faceSignature || ""
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
            className="flex-2 py-4 bg-black text-white rounded-2xl font-black"
          >
            CREATE ACCOUNT
          </button>
        </div>
      </motion.div>
    </div>
  );
  const EarningsDetail = () => {
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
                  { label: 'Trip - Greggs', time: '2:14 PM', amount: '£4.50' },
                  { label: 'Trip - Wagamama', time: '1:45 PM', amount: '£8.20' },
                  { label: 'Promotion - Lunch Rush', time: '1:00 PM', amount: '£2.00' },
                  { label: 'Trip - Nando\'s', time: '12:30 PM', amount: '£6.75' },
                  { label: 'Trip - Costa Coffee', time: '11:15 AM', amount: '£3.80' },
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
                setCurrentScreen('banking');
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

  const DeliveryVerificationModal = () => {
    const order = activeOrders.find(o => o.id === verifyingDeliveryId);
    if (!order) return null;

    const handleComplete = () => {
      if (enteredPin === order.pin || isPhotoCaptured) {
        setActiveOrders(prev => prev.filter(o => o.id !== order.id));
        setEarnings(prev => prev + order.estimatedPay);
        setUser(u => ({ ...u, deliveries: u.deliveries + 1, points: u.points + 10 }));
        sendNotification("Delivery Complete", `You earned £${order.estimatedPay.toFixed(2)}`);
        playUberSound('complete');
        setVerifyingDeliveryId(null);
        setEnteredPin("");
        setIsPhotoCaptured(false);
        setCustomerTimers(prev => {
          const next = { ...prev };
          delete next[order.id];
          return next;
        });
      }
    };

    return (
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="absolute inset-0 z-[200] bg-white text-black p-6 flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black">Verify Delivery</h2>
          <button onClick={() => setVerifyingDeliveryId(null)} className="p-2 bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 space-y-8">
          <div className="p-6 bg-gray-50 rounded-3xl">
            <h3 className="font-bold text-lg mb-2">Customer: {order.customerName}</h3>
            <p className="text-sm text-gray-500 mb-4">Ask the customer for their 4-digit PIN or take a photo of the delivery.</p>
            
            <div className="flex gap-2 justify-center mb-6">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`w-12 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-black ${enteredPin[i] ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  {enteredPin[i] || ""}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "OK"].map(val => (
                <button 
                  key={val}
                  onClick={() => {
                    if (val === "C") setEnteredPin("");
                    else if (val === "OK") handleComplete();
                    else if (enteredPin.length < 4) setEnteredPin(prev => prev + val);
                  }}
                  className="h-16 bg-white rounded-xl font-black text-xl shadow-sm active:scale-95 transition-transform"
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm font-bold text-gray-400">OR</span>
            </div>
          </div>

          <button 
            onClick={() => {
              setIsPhotoCaptured(true);
              setTimeout(handleComplete, 1000);
            }}
            className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all ${isPhotoCaptured ? 'bg-green-500 text-white' : 'bg-gray-100 text-black active:scale-95'}`}
          >
            {isPhotoCaptured ? <Check /> : <Camera />}
            {isPhotoCaptured ? 'PHOTO CAPTURED' : 'TAKE PHOTO'}
          </button>
        </div>
      </motion.div>
    );
  };

  const SideMenu = () => (
    <motion.div 
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      className="absolute inset-0 z-[100] bg-black text-white flex flex-col pb-12"
    >
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/10 rounded-full overflow-hidden">
            <img src={user.profilePic || "https://picsum.photos/seed/driver/200/200"} alt="Me" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-black text-xl">{user.name}</h2>
            <p className="text-sm font-bold text-gray-400">{user.rating} ★ • {user.tier} Tier</p>
          </div>
        </div>
        <button onClick={() => setIsSideMenuOpen(false)} className="p-2 bg-white/10 rounded-full">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {[
          { icon: <Briefcase />, label: "Opportunities", screen: 'opportunities' },
          { icon: <Clock />, label: "Scheduled Orders", screen: 'scheduled_orders' },
          { icon: <TrendingUp />, label: "Earnings", screen: 'earnings_detail' },
          { icon: <CreditCard />, label: "Wallet", screen: 'wallet' },
          { icon: <Star />, label: "Uber Pro", screen: 'uber_pro' },
          { icon: <Target />, label: "Rewards & Quests", screen: 'rewards' },
          { icon: <Mail />, label: "Inbox", screen: 'inbox' },
          { icon: <ShieldCheck />, label: "Safety Toolkit", screen: 'safety' },
          { icon: <Settings />, label: "Account", screen: 'account' },
          { icon: <HelpCircle />, label: "Help", screen: 'home' },
        ].map((item, idx) => (
          <button 
            key={idx} 
            onClick={() => { setCurrentScreen(item.screen as AppScreen); setIsSideMenuOpen(false); }}
            className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-colors"
          >
            <div className="text-gray-400">{item.icon}</div>
            <span className="font-bold text-lg">{item.label}</span>
          </button>
        ))}
        
        <div className="mt-4 p-4 bg-white/5 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm">Background Mode</span>
            <div className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
          </div>
          <p className="text-[10px] text-gray-400 font-bold leading-tight mb-4">
            When online, the app will continue to track your location and send notifications even if you switch to another tab.
          </p>
          {user.isOnline && (
            <button 
              onClick={() => { setUser(u => ({ ...u, isOnline: false, faceVerified: false })); setIsSideMenuOpen(false); }}
              className="w-full py-3 bg-red-900/20 text-red-500 rounded-xl font-black text-xs border border-red-500/20 active:scale-95 transition-transform"
            >
              GO OFFLINE
            </button>
          )}
        </div>
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

  const Heatmap = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[
        { x: '25%', y: '35%', intensity: 0.2, size: 100 },
        { x: '65%', y: '45%', intensity: 0.3, size: 150 },
        { x: '45%', y: '75%', intensity: 0.15, size: 80 },
        { x: '85%', y: '25%', intensity: 0.25, size: 130 },
      ].map((h, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: h.intensity, scale: 1 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute rounded-full bg-orange-500 blur-3xl"
          style={{ 
            left: h.x, 
            top: h.y, 
            width: h.size, 
            height: h.size,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}
    </div>
  );

  return (
    <div className={`h-[100dvh] w-full md:max-w-[420px] md:h-[850px] md:rounded-[3rem] md:border-[12px] md:border-black md:shadow-2xl md:my-8 font-sans overflow-hidden flex flex-col select-none relative transition-all duration-500 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-gray-100 text-black'}`}>
      {/* In-App Toasts */}
      <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-[380px] px-4 pointer-events-none">
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

      {/* Maintenance/Update Screens */}
      <AnimatePresence>
        {isUpdating && <UpdateScreen key="update" />}
        {isScanning && <ScanningScreen key="scanning" />}
        {isUnderMaintenance && <MaintenanceScreen key="maintenance" />}
      </AnimatePresence>

      {/* Desktop Notch */}
      <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-[200]" />
      
      {/* Status Bar */}
      <div className={`h-8 w-full flex justify-between items-center px-6 pt-2 text-[10px] font-medium opacity-80 z-[110] ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
        <span>9:41</span>
        <div className="flex gap-1 items-center">
          <Zap size={10} fill="currentColor" />
          <span>5G</span>
          <div className={`w-4 h-2 border rounded-[2px] relative ${theme === 'dark' ? 'border-white/40' : 'border-black/40'}`}>
            <div className={`absolute left-0 top-0 h-full w-3/4 rounded-[1px] ${theme === 'dark' ? 'bg-white' : 'bg-black'}`} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSideMenuOpen && <SideMenu />}
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
                <button onClick={() => setCurrentScreen('onboarding')} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
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
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase ${pendingOrder.isMatching ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'}`}>
                              {pendingOrder.isMatching ? 'Matching Trip' : 'New Trip'}
                            </span>
                          </div>
                          <h2 className="text-4xl font-black mb-1">£{pendingOrder.estimatedPay.toFixed(2)}</h2>
                          <p className="text-gray-400 font-black tracking-widest uppercase text-xs">Estimated Pay</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black">{pendingOrder.estimatedTime} min</p>
                          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{pendingOrder.estimatedDistance.toFixed(1)} mi • Total</p>
                        </div>
                      </div>

                      <div className="space-y-6 mb-12">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                            <Coffee size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Pickup</p>
                            <p className="text-xl font-bold">{pendingOrder.restaurantName}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Dropoff</p>
                            <p className="text-xl font-bold">{pendingOrder.customerName}</p>
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
                <div className={`absolute top-28 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full flex items-center gap-2 border shadow-2xl transition-all duration-300 ${theme === 'dark' ? 'bg-black border-white/20' : 'bg-white border-black/10'}`}>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                  <span className="text-[10px] font-black tracking-widest uppercase tracking-[0.2em]">Active</span>
                </div>
              )}

              {/* Map Simulation */}
              <div 
                onClick={() => setSelectedMarkerId(null)}
                className={`absolute inset-0 overflow-hidden transition-all duration-500 ${isNightMode || theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#eef2f6]'} ${(lockoutUntil && Date.now() < lockoutUntil) || Object.values(customerTimers).some(t => Number(t) > 0) ? 'blur-md grayscale opacity-50 pointer-events-none' : ''}`}
              >
                {/* Roads */}
                <div className="absolute inset-0 opacity-40" style={{ 
                  backgroundImage: `
                    linear-gradient(90deg, ${isNightMode || theme === 'dark' ? '#333' : '#ccc'} 4px, transparent 4px),
                    linear-gradient(${isNightMode || theme === 'dark' ? '#333' : '#ccc'} 4px, transparent 4px),
                    linear-gradient(90deg, ${isNightMode || theme === 'dark' ? '#222' : '#bbb'} 2px, transparent 2px),
                    linear-gradient(${isNightMode || theme === 'dark' ? '#222' : '#bbb'} 2px, transparent 2px)
                  `,
                  backgroundSize: '150px 150px, 150px 150px, 30px 30px, 30px 30px',
                  transform: location ? `translate(${(location.longitude * 10000) % 150}px, ${(location.latitude * 10000) % 150}px)` : 'none'
                }} />
                
                {/* Traffic Lines (Simulated) */}
                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ 
                  backgroundImage: `
                    linear-gradient(90deg, transparent 48%, #ff4d4d 48%, #ff4d4d 52%, transparent 52%),
                    linear-gradient(transparent 48%, #ffcc00 48%, #ffcc00 52%, transparent 52%)
                  `,
                  backgroundSize: '300px 300px',
                  transform: location ? `translate(${(location.longitude * 8000) % 300}px, ${(location.latitude * 8000) % 300}px)` : 'none'
                }} />
                
                {/* Navigation Overlay */}
                <AnimatePresence>
                  {isNavigating && activeOrders.length > 0 && (
                    <motion.div 
                      initial={{ y: -100 }}
                      animate={{ y: 0 }}
                      exit={{ y: -100 }}
                      className="absolute top-0 left-0 right-0 z-[150] bg-blue-600 text-white px-4 py-2 shadow-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                          <Navigation size={18} className="fill-white" style={{ transform: 'rotate(45deg)' }} />
                        </div>
                        <div>
                          <p className="text-sm font-black leading-none mb-0.5">
                            {activeOrders[0].status === 'accepted' ? 'Head to Restaurant' : 'Head to Customer'}
                          </p>
                          <p className="text-[10px] font-bold opacity-80">
                            {activeOrders[0].status === 'accepted' ? activeOrders[0].restaurantName : activeOrders[0].customerName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black leading-none mb-0.5">
                          {distanceToTarget(activeOrders[0])} mi
                        </p>
                        <p className="text-[10px] font-bold opacity-80">
                          {Math.floor(parseFloat(distanceToTarget(activeOrders[0])) * 5 + 2)} min
                        </p>
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
                  backgroundSize: '80px 80px, 80px 80px, 50px 50px',
                  backgroundPosition: '0 0, 40px 40px, 15px 15px',
                  transform: location ? `translate(${(location.longitude * 6000) % 80}px, ${(location.latitude * 6000) % 80}px)` : 'none'
                }} />
                
                {/* Parks/Green areas */}
                <div className="absolute inset-0 opacity-15" style={{ 
                  backgroundImage: 'radial-gradient(circle, #2d5a27 15%, transparent 85%), radial-gradient(circle, #1e3a1a 10%, transparent 70%)',
                  backgroundSize: '500px 500px, 400px 400px',
                  transform: location ? `translate(${(location.longitude * 2000) % 500}px, ${(location.latitude * 2000) % 500}px)` : 'none'
                }} />

                {/* Hotspots (Busy Areas) */}
                {location && hotspots.map((spot, i) => {
                  const x = (spot.longitude - location.longitude) * 50000;
                  const y = (location.latitude - spot.latitude) * 50000;
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
                        width: spot.size,
                        height: spot.size,
                        left: '50%', 
                        top: '50%', 
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` 
                      }}
                    />
                  );
                })}

                {/* Mock Restaurants (Busy Map) */}
                {location && MOCK_RESTAURANTS.map((rest, i) => {
                  const x = rest.offset.lng * 50000;
                  const y = -rest.offset.lat * 50000;
                  return (
                    <motion.div 
                      key={`rest-${i}`}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedRestaurant(rest)}
                      className="absolute cursor-pointer flex flex-col items-center pointer-events-auto"
                      style={{ 
                        left: '50%', 
                        top: '50%', 
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` 
                      }}
                    >
                      <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${rest.busyness === 'High' ? 'bg-red-500' : rest.busyness === 'Medium' ? 'bg-orange-500' : 'bg-green-500'}`}>
                        <Coffee size={16} className="text-white" />
                      </div>
                      <span className={`text-[10px] font-black mt-1 px-2 py-0.5 rounded-full bg-white shadow-sm ${theme === 'dark' ? 'text-black' : 'text-black'}`}>
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
                        left: label.x, 
                        top: label.y,
                        transform: location ? `translate(${(location.longitude * 10000) % 1000}px, ${(location.latitude * 10000) % 1000}px)` : 'none'
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

                {location && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Pulsing blue dot for driver */}
                    <div className="relative z-10">
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
                    {activeOrders.map(order => {
                      const isPickup = order.status === 'accepted';
                      const target = isPickup ? order.restaurantLocation : order.customerLocation;
                      const x = (target.longitude - location.longitude) * 50000;
                      const y = (location.latitude - target.latitude) * 50000;
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
                          const x = (target.longitude - location.longitude) * 50000;
                          const y = (location.latitude - target.latitude) * 50000;
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
                  <div className="absolute bottom-32 left-4 right-4 flex justify-between items-center pointer-events-none">
                    <button 
                      onClick={() => setIsSafetyToolkitOpen(true)}
                      className="w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center text-blue-600 border border-gray-100 pointer-events-auto active:scale-90 transition-transform"
                    >
                      <Shield size={28} />
                    </button>
                    <button className="w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center text-black border border-gray-100 pointer-events-auto active:scale-90 transition-transform">
                      <Target size={28} />
                    </button>
                    <button 
                      onClick={() => setIsDestFilterOpen(true)}
                      className="w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center text-blue-600 border border-gray-100 pointer-events-auto active:scale-90 transition-transform"
                    >
                      <MapPin size={28} />
                    </button>
                  </div>
                )}
              </div>

              {/* Destination Filter Modal */}
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
                    <button onClick={() => setIsSideMenuOpen(true)} className={`p-3 rounded-full shadow-xl active:scale-95 transition-transform ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}>
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
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-50">
                  <button 
                    onClick={() => setIsSideMenuOpen(true)} 
                    className="w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-black active:scale-95 transition-transform"
                  >
                    <Menu size={24} />
                  </button>
                  
                  <motion.button 
                    initial={{ y: -50 }}
                    animate={{ y: 0 }}
                    onClick={() => setCurrentScreen('earnings')}
                    className="bg-black text-white px-8 py-3 rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <span className="text-2xl font-black tracking-tight">£{earnings.toFixed(2)}</span>
                  </motion.button>

                  <motion.div 
                    initial={{ x: 50 }}
                    animate={{ x: 0 }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 font-black"
                  >
                    <span className="text-lg">1.3x</span>
                    <ArrowUp size={20} />
                  </motion.div>
                </div>
              )}

              {/* Bottom Menu Toggle Button / Map Status Bar */}
              {!pendingOrder && !isBottomMenuOpen && (
                <div className="absolute bottom-0 left-0 right-0 z-50">
                  {user.isOnline ? (
                    <motion.div 
                      initial={{ y: 100 }}
                      animate={{ y: 0 }}
                      className="w-full bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.1)] flex items-center justify-between px-8 py-6"
                    >
                      <button className="text-black">
                        <SlidersHorizontal size={28} />
                      </button>
                      
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-black tracking-tight">
                          Finding trips
                        </span>
                      </div>

                      <button onClick={() => setIsBottomMenuOpen(true)} className="text-black">
                        <List size={28} />
                      </button>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center w-full">
                      {/* GO Button */}
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileTap={{ scale: 0.9 }}
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
                        className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.6)] border-4 border-white mb-8 active:scale-95 transition-transform"
                      >
                        <span className="text-white font-black text-2xl tracking-widest">GO</span>
                      </motion.button>

                      {/* Bottom Status Bar */}
                      <motion.div 
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        className="w-full bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.05)]"
                      >
                        <button onClick={() => setIsBottomMenuOpen(true)} className="text-black">
                          <ChevronUp size={24} />
                        </button>
                        <div className="flex flex-col items-center">
                          <span className="text-xl font-black text-black">Offline</span>
                          <span className="text-xs font-bold text-gray-400">5 min to request</span>
                        </div>
                        <button onClick={() => setIsBottomMenuOpen(true)} className="text-black">
                          <List size={24} />
                        </button>
                      </motion.div>
                    </div>
                  )}
                </div>
              )}

              {/* Last Trip Card Overlay */}
              {!user.isOnline && lastTrip && (
                <div className="absolute top-24 left-4 right-4 z-[60] flex justify-center">
                  <motion.div 
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 flex flex-col items-center"
                  >
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

                    <button className="text-blue-600 font-black text-xs uppercase tracking-widest">
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

                              <button className="flex flex-col items-center gap-2">
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
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 bg-blue-500 rounded-full"
                                  />
                                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg relative z-10">
                                    <Navigation size={32} className="animate-pulse" />
                                  </div>
                                </div>
                                <span className="text-sm font-black text-blue-600">FINDING TRIPS</span>
                              </div>

                              <button className="flex flex-col items-center gap-2">
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
                        <div className="space-y-3">
                          <div className={`p-4 rounded-2xl flex items-center gap-4 border ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                            <div className="p-2 bg-blue-600 text-white rounded-lg"><ShieldCheck size={20} /></div>
                            <div>
                              <p className="text-sm font-black">Safety Toolkit</p>
                              <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Access emergency tools</p>
                            </div>
                          </div>
                          <div className={`p-4 rounded-2xl flex items-center gap-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}><Gift size={20} /></div>
                            <div>
                              <p className="text-sm font-black">Promotions</p>
                              <p className="text-[10px] text-gray-400 font-bold">Earn extra £2.00 per trip</p>
                            </div>
                          </div>
                          <div className={`p-4 rounded-2xl flex items-center gap-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}><Star size={20} /></div>
                            <div>
                              <p className="text-sm font-black">Uber Pro</p>
                              <p className="text-[10px] text-gray-400 font-bold">Gold status active</p>
                            </div>
                          </div>
                          <div className={`p-4 rounded-2xl flex items-center gap-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
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
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                <AnimatePresence>
                  {user.isOnline && activeOrders.length === 0 && (
                    <motion.div 
                      initial={{ y: 200 }} 
                      animate={{ y: 0 }} 
                      exit={{ y: 200 }} 
                      className="bg-white text-black rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] flex flex-col max-h-[45vh] overflow-hidden"
                    >
                      <div className="flex flex-col items-center pt-4 pb-2">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-4" />
                      </div>
                      
                      <div className="overflow-y-auto px-6 pb-8 custom-scrollbar">
                        <div className="flex justify-between w-full mb-6 px-4">
                          <button onClick={() => setIsSideMenuOpen(true)} className="flex flex-col items-center gap-2">
                            <div className="p-4 bg-gray-100 rounded-full"><Menu size={24} /></div>
                            <span className="text-xs font-bold">Menu</span>
                          </button>
                          
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative">
                              <motion.div 
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-blue-500 rounded-full"
                              />
                              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg relative z-10">
                                <Navigation size={32} className="animate-pulse" />
                              </div>
                            </div>
                            <span className="text-sm font-black text-blue-600">FINDING TRIPS</span>
                          </div>

                          <button className="flex flex-col items-center gap-2">
                            <div className="p-4 bg-gray-100 rounded-full"><Search size={24} /></div>
                            <span className="text-xs font-bold">Search</span>
                          </button>
                        </div>

                        <div className={`w-full p-4 rounded-2xl flex items-center justify-between mb-4 border ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                          <div className="flex items-center gap-3">
                            <motion.div 
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="w-2 h-2 bg-blue-500 rounded-full" 
                            />
                            <span className={`font-black text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Finding trips in {currentCity}...</span>
                          </div>
                          <button 
                            onClick={() => setUser(u => ({ ...u, isOnline: false, faceVerified: false }))} 
                            className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}
                          >
                            OFFLINE
                          </button>
                        </div>

                        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                          <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="h-full w-1/3 bg-blue-500" />
                        </div>

                        {/* Extra scrollable items */}
                        <div className="space-y-3">
                          <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><TrendingUp size={20} /></div>
                              <div>
                                <p className="text-sm font-black">Earnings Trend</p>
                                <p className="text-[10px] text-gray-400 font-bold">Busy area nearby</p>
                              </div>
                            </div>
                            <ArrowRight size={16} className="text-gray-300" />
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Star size={20} /></div>
                              <div>
                                <p className="text-sm font-black">Uber Pro</p>
                                <p className="text-[10px] text-gray-400 font-bold">Gold status active</p>
                              </div>
                            </div>
                            <ArrowRight size={16} className="text-gray-300" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeOrders.map((order, idx) => (
                    <motion.div 
                      key={order.id} 
                      initial={{ y: 100 }} 
                      animate={{ y: 0 }} 
                      className="bg-white text-black rounded-xl shadow-xl overflow-hidden mb-2 cursor-pointer active:scale-[0.98] transition-transform"
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
                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
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
                              <button onClick={() => handleNextStep(order.id)} className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                <ArrowRight size={20} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Cancel Trip Modal */}
              <AnimatePresence>
                {viewingOrderDetailsId && <OrderDetailsModal />}
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
                      <p className="text-center text-gray-400 font-bold mb-8">Cancelling may affect your Gold status and points.</p>
                      
                      <div className="space-y-3">
                        <button 
                          onClick={() => handleCancelOrder(cancellingOrderId)}
                          className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-transform"
                        >
                          YES, CANCEL
                        </button>
                        <button 
                          onClick={() => setCancellingOrderId(null)}
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
                {verifyingDeliveryId && <DeliveryVerificationModal />}
              </AnimatePresence>

              {/* Earnings Detail Modal */}
              <AnimatePresence>
                {currentScreen === 'earnings_detail' && <EarningsDetail />}
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
                        <div className="flex items-center gap-3 mb-4">
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
                        <button onClick={handleAcceptOrder} className="w-full py-4 bg-black text-white rounded-xl font-black text-lg tracking-wide">ACCEPT</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {currentScreen === 'chat' && (
            <motion.div key="chat" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="h-full w-full bg-white text-black flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
                <div className="flex-1">
                  <h2 className="font-black text-xl">Chat with Customer</h2>
                  <p className="text-xs text-gray-400 font-bold">Order #{activeChatOrderId?.substr(0, 5)}</p>
                </div>
                <button className="p-3 bg-green-500 text-white rounded-full"><Phone size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.filter(m => m.orderId === activeChatOrderId).map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'driver' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl font-bold ${msg.sender === 'driver' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-black'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {customerTimers[activeChatOrderId!] !== undefined && (
                  <div className="flex justify-center">
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-xs font-black border border-red-100">
                      CUSTOMER RESPONSE TIMER: {Math.floor(customerTimers[activeChatOrderId!] / 60)}:{(customerTimers[activeChatOrderId!] % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="px-4 py-2 border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
                {["I've arrived", "I'm outside", "I'm at the door", "What's the PIN?", "Can't find you"].map(text => (
                  <button 
                    key={text}
                    onClick={() => {
                      setMessages(prev => [...prev, { id: Math.random().toString(), orderId: activeChatOrderId!, sender: 'driver', text, timestamp: Date.now() }]);
                      setCustomerTimers(prev => ({ ...prev, [activeChatOrderId!]: 300 })); // Start 5 min timer
                      // Simulate customer reply
                      setTimeout(() => {
                        const order = activeOrders.find(o => o.id === activeChatOrderId);
                        let reply = "Coming now!";
                        if (text.toLowerCase().includes('pin')) {
                          reply = `My PIN is ${order?.pin || '1234'}.`;
                        }
                        setMessages(prev => [...prev, { id: Math.random().toString(), orderId: activeChatOrderId!, sender: 'customer', text: reply, timestamp: Date.now() }]);
                        playUberSound('message');
                        setCustomerTimers(prev => {
                          const next = { ...prev };
                          delete next[activeChatOrderId!]; // Stop timer on reply
                          return next;
                        });
                      }, 5000);
                    }}
                    className="whitespace-nowrap px-4 py-2 bg-gray-100 rounded-full text-xs font-bold hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    {text}
                  </button>
                ))}
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  className="flex-1 bg-gray-100 rounded-full px-6 py-3 font-bold outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      const text = e.currentTarget.value;
                      setMessages(prev => [...prev, { id: Math.random().toString(), orderId: activeChatOrderId!, sender: 'driver', text, timestamp: Date.now() }]);
                      e.currentTarget.value = '';
                      // Simulate customer reply
                      setTimeout(() => {
                        const order = activeOrders.find(o => o.id === activeChatOrderId);
                        let reply = "Thanks! See you soon.";
                        if (text.toLowerCase().includes('pin') || text.toLowerCase().includes('code')) {
                          reply = `Sure, my delivery PIN is ${order?.pin || '1234'}.`;
                        }
                        setMessages(prev => [...prev, { id: Math.random().toString(), orderId: activeChatOrderId!, sender: 'customer', text: reply, timestamp: Date.now() }]);
                        sendNotification("New Message", `Customer: ${reply}`);
                        playUberSound('message');
                      }, 2000);
                    }
                  }}
                />
                <button className="p-4 bg-black text-white rounded-full"><Send size={20} /></button>
              </div>
            </motion.div>
          )}

          {currentScreen === 'uber_pro' && (
            <motion.div key="pro" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="h-full w-full bg-white text-black p-6 overflow-y-auto">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
                <h1 className="text-3xl font-black">Uber Pro</h1>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white mb-8">
                <p className="text-sm font-bold opacity-60 mb-2 uppercase tracking-widest">{user.tier} Tier</p>
                <h2 className="text-4xl font-black mb-6">{user.points} Points</h2>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-white" style={{ width: `${(user.points / 500) * 100}%` }} />
                </div>
                <p className="text-sm font-bold opacity-80">380 points to Gold</p>
              </div>
              <div className="space-y-6">
                <h3 className="font-black text-xl">Your Rewards</h3>
                {[
                  { title: "Fuel Discount", desc: "Save 3p/litre at BP", icon: <Zap /> },
                  { title: "Free Coffee", desc: "Weekly Costa reward", icon: <Coffee /> },
                  { title: "Priority Support", desc: "Fast-track help", icon: <HelpCircle /> },
                ].map((reward, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">{reward.icon}</div>
                    <div>
                      <p className="font-black">{reward.title}</p>
                      <p className="text-sm text-gray-400 font-bold">{reward.desc}</p>
                    </div>
                  </div>
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
                <div className="p-6 bg-blue-50 rounded-3xl border-2 border-blue-100">
                  <div className="flex items-center gap-3 mb-2 text-blue-600">
                    <TrendingUp size={20} />
                    <span className="font-black">1.5x Surge</span>
                  </div>
                  <p className="font-bold text-lg">Central London is busy right now.</p>
                  <p className="text-sm text-gray-500 font-bold mt-1">Expected earnings are higher than usual.</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-3xl">
                  <div className="flex items-center gap-3 mb-2 text-green-600">
                    <Gift size={20} />
                    <span className="font-black">Quest: £20 Bonus</span>
                  </div>
                  <p className="font-bold">Complete 10 more trips today.</p>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '80%' }} />
                  </div>
                  <p className="text-xs text-gray-400 font-bold mt-2">8/10 completed</p>
                </div>
              </div>
            </motion.div>
          )}

          {currentScreen === 'rewards' && (
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
                <button onClick={() => setCurrentScreen('home')} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
                <h1 className="text-3xl font-black">Inbox</h1>
              </div>
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 font-bold">No new messages</div>
                ) : (
                  notifications.map((note, i) => (
                    <div key={i} className="p-4 border-b border-gray-100 flex gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0"><Bell size={24} /></div>
                      <div>
                        <p className="font-bold">{note}</p>
                        <p className="text-xs text-gray-400 font-bold mt-1">Just now</p>
                      </div>
                    </div>
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
                <p className="text-sm font-bold text-gray-400">London • Gold Partner</p>
              </div>
              <div className="space-y-2">
                {[
                  { icon: <User />, label: "Personal Information", action: () => sendNotification("Account", "Personal info updated.") },
                  { icon: <FileText />, label: "Documents", action: () => setCurrentScreen('documents') },
                  { icon: <CreditCard />, label: "Payment", action: () => setCurrentScreen('earnings') },
                  { icon: <Settings />, label: "App Settings", action: () => sendNotification("Settings", "Settings updated.") },
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
                <p className="text-sm font-bold opacity-60 mb-2 uppercase tracking-widest">
                  {earningsTab === 'today' ? 'Today' : earningsTab === 'weekly' ? 'This Week' : 'Total Earnings'}
                </p>
                <h2 className="text-5xl font-black mb-6">£{(earningsTab === 'today' ? earnings * 0.15 : earnings).toFixed(2)}</h2>
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
                        <p className="text-xs text-gray-400">{earningsTab === 'today' ? 'Today' : 'Yesterday'}, {2 + i}:45 PM</p>
                      </div>
                    </div>
                    <p className="font-black text-lg">£{(5 + Math.random() * 5).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentScreen === 'scheduled_orders' && <ScheduledOrdersScreen />}
        </AnimatePresence>

        {isNewUserFormOpen && <NewUserForm />}
      </div>

      {/* Bottom Nav */}
      {currentScreen !== 'home' && (
        <div className="h-24 bg-black border-t border-white/10 flex items-center justify-around px-4 pb-6 z-[110]">
          <NavButton active={currentScreen === 'home'} onClick={() => setCurrentScreen('home')} icon={<Navigation size={24} />} label="Home" />
          <NavButton active={currentScreen === 'earnings'} onClick={() => setCurrentScreen('earnings')} icon={<TrendingUp size={24} />} label="Earnings" />
          <NavButton active={currentScreen === 'inbox'} onClick={() => setCurrentScreen('inbox')} icon={<Mail size={24} />} label="Inbox" />
          <NavButton active={currentScreen === 'account'} onClick={() => setCurrentScreen('account')} icon={<User size={24} />} label="Account" />
        </div>
      )}

      {/* Home Indicator */}
      <div className="h-1 w-32 bg-white/20 rounded-full mx-auto mb-2 shrink-0 z-[120]" />
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

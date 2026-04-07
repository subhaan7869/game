export interface Location {
  latitude: number;
  longitude: number;
}

export interface Order {
  id: string;
  restaurantName: string;
  restaurantLocation: Location;
  customerLocation: Location;
  estimatedPay: number;
  estimatedDistance: number; // in miles
  estimatedTime: number; // in mins
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered';
  customerName: string;
  items: string[];
  pin?: string;
  isMatching?: boolean;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  sender: 'driver' | 'customer';
  text: string;
  timestamp: number;
}

export interface ScheduledOrder {
  id: string;
  driverUid: string;
  restaurantName: string;
  scheduledTime: string;
  status: 'pending' | 'active' | 'completed';
  estimatedPay: number;
}

export type AppScreen = 'onboarding' | 'documents' | 'face_verification' | 'home' | 'earnings' | 'inbox' | 'account' | 'chat' | 'uber_pro' | 'wallet' | 'opportunities' | 'safety' | 'earnings_detail' | 'banking' | 'scheduled_orders' | 'rewards';

export type UberProTier = 'Blue' | 'Gold' | 'Platinum' | 'Diamond';

export interface UserProfile {
  name: string;
  rating: number;
  tier: UberProTier;
  points: number;
  deliveries: number;
  isOnline: boolean;
  documentsUploaded: boolean;
  faceVerified: boolean;
  profilePic?: string;
  documentExpiries?: Record<string, string>;
  walletBalance: number;
}

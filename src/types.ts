export interface Location {
  latitude: number;
  longitude: number;
}

export type JobType = 'delivery' | 'ride';

export interface Order {
  id: string;
  type: JobType;
  restaurantName?: string;
  restaurantLocation?: Location;
  customerLocation: Location;
  pickupLocation?: Location;
  estimatedPay: number;
  estimatedDistance: number;
  estimatedTime: number;
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered' | 'en_route_to_pickup' | 'on_ride';
  customerName: string;
  items?: string[];
  pin?: string;
  isMatching?: boolean;
  surge?: number;
  riderRating?: number;
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
  scheduledTime: any;
  status: 'pending' | 'active' | 'completed';
  estimatedPay: number;
}

export type AppScreen = 'onboarding' | 'documents' | 'face_verification' | 'home' | 'earnings' | 'inbox' | 'account' | 'chat' | 'uber_pro' | 'wallet' | 'opportunities' | 'safety' | 'earnings_detail' | 'banking' | 'scheduled_orders' | 'rewards' | 'carplay_dashboard' | 'trip_history' | 'work_hub' | 'ratings' | 'planner' | 'uber_services';

export interface CompletedTrip {
  id: string;
  restaurantName?: string;
  customerName: string;
  earnings: number;
  distance: number;
  timestamp: number;
  type: JobType;
}

export type UberProTier = 'Blue' | 'Gold' | 'Platinum' | 'Diamond';

export interface UserProfile {
  name: string;
  rating: number;
  tier: UberProTier;
  points: number;
  deliveries: number;
  rides: number;
  isOnline: boolean;
  documentsUploaded: boolean;
  faceVerified: boolean;
  profilePic?: string;
  documentExpiries?: Record<string, string>;
  walletBalance: number;
}

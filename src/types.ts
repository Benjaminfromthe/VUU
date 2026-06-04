export type UserRole = 'customer' | 'rider' | 'driver' | 'admin';

export interface Profile {
  id: string; // uuid
  full_name: string;
  role: UserRole;
  phone: string;
  is_online: boolean;
  email?: string;
  avatar_url?: string;
  created_at?: string;
  rating?: number; // average rating e.g. 4.8
  num_ratings?: number; // total count of ratings received
}

// Keep UserProfile alias for backward compatibility with existing store uses
export interface UserProfile extends Profile {
  email: string;
  created_at: string;
}

export type RideStatus = 'searching' | 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled' | 'paid';

export interface RideRequest {
  id: string;
  riderId: string;
  riderName: string;
  riderPhone: string;
  riderAvatar?: string;
  pickup: string;
  destination: string;
  fare: number;
  distance: string;
  duration: string;
  rideType: 'standard' | 'comfort' | 'premium' | 'moto';
  status: RideStatus;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverAvatar?: string;
  vehicleInfo?: string;
  etaMinutes?: number;
  createdAt: string;
}

export interface DriverState {
  isOnline: boolean;
  currentLocation: string;
  earningsToday: number;
  tripsCompleted: number;
}

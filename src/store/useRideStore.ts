import { create } from 'zustand';
import { RideRequest, RideStatus } from '../types';

interface RideState {
  activeRide: RideRequest | null;
  history: RideRequest[];
  driverQueue: RideRequest[];
  isSearching: boolean;
  
  // Rider Actions
  requestRide: (pickup: string, destination: string, rideType: 'standard' | 'comfort' | 'premium' | 'moto', fare: number) => void;
  cancelRide: () => void;
  
  // Driver Actions
  acceptRide: (rideId: string, driverName: string, driverPhone: string, vehicleInfo: string) => void;
  updateRideStatus: (status: RideStatus) => void;
  completeRide: () => void;
  
  // System simulation
  seedNewRequest: (riderName: string) => void;
}

export const useRideStore = create<RideState>((set, get) => ({
  activeRide: null,
  history: [],
  driverQueue: [
    {
      id: 'ride-req-1',
      riderId: 'rider-abc',
      riderName: 'Sarah Jenkins',
      riderPhone: '+33 6 99 88 77 66',
      riderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      pickup: 'Gare du Nord, Paris',
      destination: 'Eiffel Tower, Paris',
      fare: 18.50,
      distance: '5.2 km',
      duration: '14 mins',
      rideType: 'standard',
      status: 'searching',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ride-req-2',
      riderId: 'rider-xyz',
      riderName: 'Marc Dubois',
      riderPhone: '+33 6 44 55 66 77',
      riderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
      pickup: 'Champs-Élysées, Paris',
      destination: 'Louvre Museum, Paris',
      fare: 12.00,
      distance: '2.8 km',
      duration: '8 mins',
      rideType: 'comfort',
      status: 'searching',
      createdAt: new Date().toISOString(),
    }
  ],
  isSearching: false,

  requestRide: (pickup, destination, rideType, fare) => {
    const newRide: RideRequest = {
      id: `ride-${Math.random().toString(36).substr(2, 9)}`,
      riderId: 'current-rider',
      riderName: 'You (Rider)',
      riderPhone: '+33 6 12 34 56 78',
      pickup,
      destination,
      fare,
      distance: '4.5 km',
      duration: '12 mins',
      rideType,
      status: 'searching',
      createdAt: new Date().toISOString(),
    };

    set({ activeRide: newRide, isSearching: true });

    // Auto driver simulation after 4 seconds
    setTimeout(() => {
      const active = get().activeRide;
      if (active && active.status === 'searching') {
        get().acceptRide(
          active.id,
          'Serge Dupont',
          '+33 6 55 11 22 33',
          'Black Tesla Model Y (VUU-982-FR)'
        );
      }
    }, 4000);
  },

  cancelRide: () => {
    const active = get().activeRide;
    if (active) {
      const cancelledRide = { ...active, status: 'cancelled' as RideStatus };
      set({ 
        activeRide: null, 
        isSearching: false,
        history: [cancelledRide, ...get().history]
      });
    }
  },

  acceptRide: (rideId, driverName, driverPhone, vehicleInfo) => {
    const active = get().activeRide;
    if (active && active.id === rideId) {
      const updated = {
        ...active,
        status: 'accepted' as RideStatus,
        driverId: 'current-driver',
        driverName,
        driverPhone,
        driverAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
        vehicleInfo,
        etaMinutes: 4,
      };
      set({ activeRide: updated, isSearching: false });

      // Automatically advance ride steps for simulation visual delight
      setTimeout(() => {
        if (get().activeRide?.id === rideId) {
          get().updateRideStatus('arriving');
        }
      }, 5000);

      setTimeout(() => {
        if (get().activeRide?.id === rideId) {
          get().updateRideStatus('in_progress');
        }
      }, 10000);
    } else {
      // Driver action accepting a request from the queue
      const queueItem = get().driverQueue.find(r => r.id === rideId);
      if (queueItem) {
        const acceptedReq = {
          ...queueItem,
          status: 'accepted' as RideStatus,
          driverId: 'current-driver',
          driverName,
          driverPhone,
          vehicleInfo,
          etaMinutes: 3,
        };
        set({
          activeRide: acceptedReq,
          driverQueue: get().driverQueue.filter(r => r.id !== rideId)
        });
      }
    }
  },

  updateRideStatus: (status) => {
    const active = get().activeRide;
    if (active) {
      set({ 
        activeRide: { 
          ...active, 
          status,
          etaMinutes: status === 'arriving' ? 1 : status === 'in_progress' ? 8 : undefined
        } 
      });
    }
  },

  completeRide: () => {
    const active = get().activeRide;
    if (active) {
      const completed = { ...active, status: 'completed' as RideStatus };
      set({
        activeRide: null,
        history: [completed, ...get().history]
      });
    }
  },

  seedNewRequest: (riderName) => {
    const fresh: RideRequest = {
      id: `ride-req-${Math.random().toString(36).substr(2, 9)}`,
      riderId: `rider-${Math.random().toString(36).substr(2, 5)}`,
      riderName,
      riderPhone: '+33 6 ' + Math.floor(10000000 + Math.random() * 90000000),
      riderAvatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 500000)}?auto=format&fit=crop&q=80&w=200`,
      pickup: ['Louvre Museum', 'Panthéon', 'Montmartre Steps', 'Notre-Dame Cathedral'][Math.floor(Math.random() * 4)] + ', Paris',
      destination: ['Bastille Opera', 'Orly Airport', 'Palace of Versailles', 'La Défense'][Math.floor(Math.random() * 4)] + ', Paris',
      fare: Math.round((8 + Math.random() * 32) * 10) / 10,
      distance: (2 + Math.random() * 12).toFixed(1) + ' km',
      duration: Math.floor(5 + Math.random() * 25) + ' mins',
      rideType: ['standard', 'comfort', 'premium', 'moto'][Math.floor(Math.random() * 4)] as any,
      status: 'searching',
      createdAt: new Date().toISOString(),
    };
    set(state => ({
      driverQueue: [fresh, ...state.driverQueue]
    }));
  }
}));

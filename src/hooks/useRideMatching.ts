import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useRideStore } from '../store/useRideStore';
import { RideRequest, RideStatus } from '../types';

// Helper to sanitize database rows to the typed RideRequest structure safely
export function mapRowToRideRequest(row: any): RideRequest {
  return {
    id: row.id,
    riderId: row.rider_id || row.riderId || 'mock-rider-id',
    riderName: row.rider_name || row.riderName || 'Sarah Customer',
    riderPhone: row.rider_phone || row.riderPhone || '+33 6 88 99 00 11',
    riderAvatar: row.rider_avatar || row.riderAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=260',
    pickup: row.pickup || 'Unknown pickup',
    destination: row.destination || 'Unknown destination',
    fare: typeof row.fare === 'number' ? row.fare : parseFloat(row.fare) || 12.50,
    distance: row.distance || '4.5 km',
    duration: row.duration || '12 mins',
    rideType: row.ride_type || row.rideType || 'standard',
    status: row.status === 'pending' ? 'searching' : ((row.status as RideStatus) || 'searching'),
    driverId: row.driver_id || row.driverId || undefined,
    driverName: row.driver_name || row.driverName || undefined,
    driverPhone: row.driver_phone || row.driverPhone || undefined,
    driverAvatar: row.driver_avatar || row.driverAvatar || undefined,
    vehicleInfo: row.vehicle_info || row.vehicleInfo || undefined,
    etaMinutes: typeof row.eta_minutes === 'number' ? row.eta_minutes : (row.etaMinutes || undefined),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

export function useRideMatching() {
  const { user, profile, isDemoMode } = useAuthStore();
  const rideStore = useRideStore();
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read all rides from Supabase-realtime or localStorage
  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);

    if (isSupabaseConfigured && !isDemoMode) {
      // 1. Fetch pending/accepted rides
      const fetchRides = async () => {
        try {
          const { data, error: fetchError } = await supabase
            .from('rides')
            .select('*')
            .or('status.eq.pending,status.eq.accepted,status.eq.searching,status.eq.arriving,status.eq.in_progress')
            .order('created_at', { ascending: false });

          if (fetchError) throw fetchError;

          if (active && data) {
            setRides(data.map(mapRowToRideRequest));
          }
        } catch (err: any) {
          console.error('[Supabase Rides] Error loading list:', err);
          setError(err.message || 'Failed to loading ride lists.');
          // Load fallback demo list just in case of DB issues
          setRides(rideStore.driverQueue);
        } finally {
          if (active) setLoading(false);
        }
      };

      fetchRides();

      // 2. Setup Realtime subscription updates
      const rideChannel = supabase
        .channel('rides-live-matching')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rides'
          },
          (payload) => {
            if (!active) return;
            
            const eventType = payload.eventType;
            const newRow = payload.new;
            const oldRow = payload.old;

            if (eventType === 'INSERT') {
              const inserted = mapRowToRideRequest(newRow);
              setRides((prev) => {
                if (prev.some(r => r.id === inserted.id)) return prev;
                return [inserted, ...prev];
              });
            } else if (eventType === 'UPDATE') {
              const updated = mapRowToRideRequest(newRow);
              setRides((prev) => 
                prev.map((r) => (r.id === updated.id ? updated : r))
              );

              // If this update matches our active ride, sync to global ride store!
              if (rideStore.activeRide && rideStore.activeRide.id === updated.id) {
                useRideStore.setState({ activeRide: updated });
              }
            } else if (eventType === 'DELETE') {
              setRides((prev) => prev.filter((r) => r.id !== (oldRow as any).id));
            }
          }
        )
        .subscribe();

      return () => {
        active = false;
        supabase.removeChannel(rideChannel);
      };
    } else {
      // DEMO OFFLINE SANDBOX FOR RIDES
      const loadLocalRides = () => {
        const stored = localStorage.getItem('vuu_rides_matching_list');
        if (stored) {
          setRides(JSON.parse(stored));
        } else {
          // Sync initial seed queues from useRideStore
          const initialQueue = rideStore.driverQueue;
          setRides(initialQueue);
          localStorage.setItem('vuu_rides_matching_list', JSON.stringify(initialQueue));
        }
        setLoading(false);
      };

      loadLocalRides();

      // Listen for custom dispatch events inside client to emulate realtime multi-user interactions
      const handleLocalUpdate = () => {
        loadLocalRides();
      };
      window.addEventListener('vuu_rides_updated', handleLocalUpdate);

      return () => {
        active = false;
        window.removeEventListener('vuu_rides_updated', handleLocalUpdate);
      };
    }
  }, [isDemoMode, rideStore.driverQueue?.length]);

  // ACTION 1: Request a Ride (Inserts 'pending' into rides database)
  const requestRide = async (
    pickup: string, 
    destination: string, 
    fare: number,
    rideType: 'standard' | 'comfort' | 'premium' | 'moto' = 'standard'
  ): Promise<{ success: boolean; data?: RideRequest; error?: string }> => {
    
    const newRideId = `ride-${Math.random().toString(36).substr(2, 9)}`;
    const riderId = user?.id || 'mock-rider-id';
    const riderName = profile?.full_name || 'Sarah Customer';
    const riderPhone = profile?.phone || '+33 6 88 99 00 11';
    const riderAvatar = profile?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=260';

    const newRequestRow = {
      id: newRideId,
      rider_id: riderId,
      rider_name: riderName,
      rider_phone: riderPhone,
      rider_avatar: riderAvatar,
      pickup,
      destination,
      fare,
      distance: '5.2 km',
      duration: '14 mins',
      ride_type: rideType,
      status: 'pending', // Inserts as pending as requested
      created_at: new Date().toISOString()
    };

    const rideObject: RideRequest = {
      id: newRideId,
      riderId,
      riderName,
      riderPhone,
      riderAvatar,
      pickup,
      destination,
      fare,
      distance: '5.2 km',
      duration: '14 mins',
      rideType,
      status: 'searching',
      createdAt: newRequestRow.created_at
    };

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const { error: insertError } = await supabase
          .from('rides')
          .insert([newRequestRow]);

        if (insertError) throw insertError;

        // Sync local app state so user immediately visualizes transition state
        useRideStore.setState({ activeRide: rideObject, isSearching: true });
        
        return { success: true, data: rideObject };
      } catch (err: any) {
        console.error('[Supabase Request Ride Exception]', err);
        return { success: false, error: err.message || 'Failed to request ride request on database.' };
      }
    } else {
      // Demo fallback - push locally
      const stored = localStorage.getItem('vuu_rides_matching_list');
      const list: RideRequest[] = stored ? JSON.parse(stored) : [];
      
      const updatedList = [rideObject, ...list];
      localStorage.setItem('vuu_rides_matching_list', JSON.stringify(updatedList));
      setRides(updatedList);

      // Sync ride store
      useRideStore.setState({ activeRide: rideObject, isSearching: true });

      // Trigger standard local event to let Rider component reload
      window.dispatchEvent(new Event('vuu_rides_updated'));

      // Automatically mock driver accepting the ride after 5 seconds to show rich interactive flow
      setTimeout(() => {
        const checkStored = localStorage.getItem('vuu_rides_matching_list');
        if (checkStored) {
          const currentList: RideRequest[] = JSON.parse(checkStored);
          const idx = currentList.findIndex(r => r.id === newRideId && r.status === 'searching');
          if (idx !== -1) {
            currentList[idx] = {
              ...currentList[idx],
              status: 'accepted',
              driverId: 'mock-driver-auth-id',
              driverName: 'Alex Driver',
              driverPhone: '+33 6 44 22 11 00',
              driverAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=260',
              vehicleInfo: 'Black Tesla Model Y (VUU-982-FR)',
              etaMinutes: 3
            };
            localStorage.setItem('vuu_rides_matching_list', JSON.stringify(currentList));
            window.dispatchEvent(new Event('vuu_rides_updated'));
            
            // Sync user's ride store
            const currentActive = useRideStore.getState().activeRide;
            if (currentActive && currentActive.id === newRideId) {
              useRideStore.setState({ 
                activeRide: currentList[idx],
                isSearching: false 
              });
            }
          }
        }
      }, 5000);

      return { success: true, data: rideObject };
    }
  };

  // ACTION 2: Accept a Ride Request (Updates pending ➔ accepted, sets rider_id to current user)
  const acceptRideRequest = async (rideId: string): Promise<{ success: boolean; error?: string }> => {
    const currentUserId = user?.id || 'mock-rider-id'; // Maps sets rider_id to current user
    const currentUserName = profile?.full_name || 'Sarah Customer';
    const currentUserPhone = profile?.phone || '+33 6 88 99 00 11';

    const updateFields = {
      status: 'accepted',
      rider_id: currentUserId, //sets the rider_id to the current user as requested
      rider_name: currentUserName,
      rider_phone: currentUserPhone
    };

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const { error: updateError } = await supabase
          .from('rides')
          .update(updateFields)
          .eq('id', rideId);

        if (updateError) throw updateError;

        // Fetch accepted row to update state
        const { data: updatedRow, error: fetchError } = await supabase
          .from('rides')
          .select('*')
          .eq('id', rideId)
          .single();

        if (fetchError) throw fetchError;
        
        const mapped = mapRowToRideRequest(updatedRow);
        
        // Sync our local list
        setRides(prev => prev.map(r => r.id === rideId ? mapped : r));

        // Sync local rideStore activeRide if accepting
        useRideStore.setState({ activeRide: mapped });

        return { success: true };
      } catch (err: any) {
        console.error('[Supabase Accept Ride Request Exception]', err);
        return { success: false, error: err.message || 'Failed to accept ride on server.' };
      }
    } else {
      // Demo fallback update
      const stored = localStorage.getItem('vuu_rides_matching_list');
      if (stored) {
        const list: RideRequest[] = JSON.parse(stored);
        const index = list.findIndex(r => r.id === rideId);
        if (index !== -1) {
          const acceptedRide: RideRequest = {
            ...list[index],
            status: 'accepted',
            riderId: currentUserId,
            riderName: currentUserName,
            riderPhone: currentUserPhone,
            driverId: 'mock-driver-auth-id',
            driverName: 'Alex Driver',
            driverPhone: '+33 6 44 22 11 00',
            vehicleInfo: 'Black Tesla Model Y (VUU-982-FR)',
            driverAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=260',
            etaMinutes: 3
          };

          list[index] = acceptedRide;
          localStorage.setItem('vuu_rides_matching_list', JSON.stringify(list));
          setRides(list);

          // Update active booking state
          useRideStore.setState({ activeRide: acceptedRide });

          // Broadcast local update
          window.dispatchEvent(new Event('vuu_rides_updated'));
        }
      }
      return { success: true };
    }
  };

  // Helper action: Complete ongoing rides
  const advanceRideStep = async (rideId: string, nextStatus: RideStatus): Promise<boolean> => {
    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const { error: uErr } = await supabase
          .from('rides')
          .update({ status: nextStatus })
          .eq('id', rideId);
          
        if (uErr) throw uErr;
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    } else {
      const stored = localStorage.getItem('vuu_rides_matching_list');
      if (stored) {
        const list: RideRequest[] = JSON.parse(stored);
        const index = list.findIndex(r => r.id === rideId);
        if (index !== -1) {
          const updatedRide = { ...list[index], status: nextStatus };
          list[index] = updatedRide;
          localStorage.setItem('vuu_rides_matching_list', JSON.stringify(list));
          setRides(list);
          useRideStore.setState({ activeRide: updatedRide });
          window.dispatchEvent(new Event('vuu_rides_updated'));
        }
      }
      return true;
    }
  };

  return {
    rides,
    loading,
    error,
    requestRide,
    acceptRideRequest,
    advanceRideStep
  };
}

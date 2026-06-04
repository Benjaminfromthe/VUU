import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { RideRequest, RideStatus } from '../types';
import { mapRowToRideRequest } from './useRideMatching';

// Keys for cached queries
export const queryKeys = {
  activeRides: ['rides', 'active'] as const,
  rideHistory: (userId: string) => ['rides', 'history', userId] as const,
};

/**
 * 1. TanStack Query Hook: Fetches and caches active dispatcher rides (pending/searching/accepted)
 */
export function useCachedActiveRides() {
  const { isDemoMode } = useAuthStore();
  const queryClient = useQueryClient();

  const query = useQuery<RideRequest[]>({
    queryKey: queryKeys.activeRides,
    queryFn: async () => {
      if (isSupabaseConfigured && !isDemoMode) {
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .or('status.eq.pending,status.eq.searching,status.eq.accepted,status.eq.arriving,status.eq.in_progress')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }
        return (data || []).map(mapRowToRideRequest);
      } else {
        // Fallback local emulation
        const stored = localStorage.getItem('vuu_rides_matching_list');
        if (stored) {
          return JSON.parse(stored);
        }
        return [];
      }
    },
  });

  // Listen to realtime database changes and update cache on-the-fly without refetching the whole list
  useEffect(() => {
    if (!isSupabaseConfigured || isDemoMode) {
      // Local storage channel replacement listener
      const handleLocalUpdate = () => {
        query.refetch();
      };
      window.addEventListener('vuu_rides_updated', handleLocalUpdate);
      return () => {
        window.removeEventListener('vuu_rides_updated', handleLocalUpdate);
      };
    }

    const channel = supabase
      .channel('realtime-cached-rides')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rides' },
        (payload) => {
          const eventType = payload.eventType;
          const newRow = payload.new;
          const oldRow = payload.old;

          queryClient.setQueryData<RideRequest[]>(queryKeys.activeRides, (oldRides = []) => {
            if (eventType === 'INSERT') {
              const inserted = mapRowToRideRequest(newRow);
              if (oldRides.some(r => r.id === inserted.id)) return oldRides;
              return [inserted, ...oldRides];
            } else if (eventType === 'UPDATE') {
              const updated = mapRowToRideRequest(newRow);
              // If status is no longer active, filter it out of the active list
              const isStillActive = ['pending', 'searching', 'accepted', 'arriving', 'in_progress'].includes(updated.status);
              if (!isStillActive) {
                return oldRides.filter(r => r.id !== updated.id);
              }
              return oldRides.map(r => r.id === updated.id ? updated : r);
            } else if (eventType === 'DELETE') {
              return oldRides.filter(r => r.id !== (oldRow as any).id);
            }
            return oldRides;
          });

          // Also invalidate history query so it picks up any newly completed or status-modified rides
          queryClient.invalidateQueries({ queryKey: ['rides', 'history'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, isDemoMode]);

  return query;
}

/**
 * 2. TanStack Query Hook: Fetches and caches ride history (completed/paid/cancelled) for a given user
 */
export function useCachedRideHistory(userId: string) {
  const { isDemoMode } = useAuthStore();
  const queryClient = useQueryClient();

  const query = useQuery<RideRequest[]>({
    queryKey: queryKeys.rideHistory(userId),
    queryFn: async () => {
      if (!userId) return [];

      if (isSupabaseConfigured && !isDemoMode) {
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .eq('rider_id', userId)
          .in('status', ['completed', 'cancelled', 'paid'])
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }
        return (data || []).map(mapRowToRideRequest);
      } else {
        // Local state fallback emulator
        const stored = localStorage.getItem('vuu_rides_matching_list');
        if (stored) {
          const list: RideRequest[] = JSON.parse(stored);
          return list.filter(
            (r) => r.riderId === userId && ['completed', 'cancelled', 'paid'].includes(r.status)
          );
        }
        return [];
      }
    },
    enabled: !!userId,
  });

  // Track updates to reflect in history view
  useEffect(() => {
    const handleLocalUpdate = () => {
      query.refetch();
    };
    window.addEventListener('vuu_rides_updated', handleLocalUpdate);
    return () => {
      window.removeEventListener('vuu_rides_updated', handleLocalUpdate);
    };
  }, []);

  return query;
}

/**
 * 3. TanStack Query Mutations for atomic fast state changes with immediate Cache update
 */
export function useRequestRideMutation() {
  const queryClient = useQueryClient();
  const { user, profile, isDemoMode } = useAuthStore();

  return useMutation({
    mutationFn: async ({ pickup, destination, fare, rideType }: {
      pickup: string;
      destination: string;
      fare: number;
      rideType: 'standard' | 'comfort' | 'premium' | 'moto';
    }) => {
      const newRideId = `ride-${Math.random().toString(36).substr(2, 9)}`;
      const riderId = user?.id || 'mock-rider-id';
      const riderName = profile?.full_name || 'Sarah Customer';
      const riderPhone = profile?.phone || '+250 789 234 567';
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
        status: 'pending',
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
        const { error } = await supabase.from('rides').insert([newRequestRow]);
        if (error) throw error;
        return rideObject;
      } else {
        // Fallback save to local storage match list
        const stored = localStorage.getItem('vuu_rides_matching_list');
        const list: RideRequest[] = stored ? JSON.parse(stored) : [];
        const updatedList = [rideObject, ...list];
        localStorage.setItem('vuu_rides_matching_list', JSON.stringify(updatedList));

        // Let standard window listen
        window.dispatchEvent(new Event('vuu_rides_updated'));
        return rideObject;
      }
    },
    onSuccess: (newRide) => {
      // Optimistically push into active rides list cache
      queryClient.setQueryData<RideRequest[]>(queryKeys.activeRides, (old = []) => {
        return [newRide, ...old];
      });
    }
  });
}

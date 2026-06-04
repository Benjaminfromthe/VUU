import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Profile, RideRequest, UserRole } from '../types';
import RiderDashboard from '../components/RiderDashboard';
import { useRideMatching } from '../hooks/useRideMatching';
import { 
  Car, 
  MapPin, 
  Navigation, 
  DollarSign, 
  User as UserIcon, 
  LogOut, 
  Power, 
  Compass, 
  ShieldCheck, 
  Check, 
  Loader2, 
  Sparkles, 
  ArrowRight,
  Clock,
  History,
  Smartphone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Home() {
  const { 
    user, 
    profile, 
    signOut, 
    isDemoMode, 
    updateProfile 
  } = useAuthStore();

  const { requestRide } = useRideMatching();

  // State for fetched profile of the current authenticated user
  const [dbProfile, setDbProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Customer 'Ride Request' Input fields
  const [pickup, setPickup] = useState('Gare du Nord, Paris');
  const [destination, setDestination] = useState('Eiffel Tower, Paris');
  const [fare, setFare] = useState('18.50');
  const [selectedTier, setSelectedTier] = useState<'standard' | 'comfort' | 'premium' | 'moto'>('standard');
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rider Availability/Status
  const [isOnline, setIsOnline] = useState(profile?.is_online ?? true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Active status feedback banner state
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Mock list of 'Nearby Ride Requests' for riders
  const [nearbyRequests, setNearbyRequests] = useState<RideRequest[]>([
    {
      id: 'ride-req-101',
      riderId: 'rider-u1',
      riderName: 'Sarah Jenkins',
      riderPhone: '+33 6 99 88 77 66',
      riderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      pickup: 'Gare Saint-Lazare, Paris',
      destination: 'Louvre Museum, Paris',
      fare: 15.50,
      distance: '3.4 km',
      duration: '10 mins',
      rideType: 'standard',
      status: 'searching',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ride-req-102',
      riderId: 'rider-u2',
      riderName: 'Marc Dubois',
      riderPhone: '+33 6 44 55 66 77',
      pickup: 'Champs-Élysées, Paris',
      destination: 'Arc de Triomphe, Paris',
      fare: 8.00,
      distance: '1.2 km',
      duration: '5 mins',
      rideType: 'moto',
      status: 'searching',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ride-req-103',
      riderId: 'rider-u3',
      riderName: 'Nathalie Robert',
      riderPhone: '+33 6 22 33 44 55',
      riderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
      pickup: 'Place de la Bastille, Paris',
      destination: 'Notre-Dame Cathedral, Paris',
      fare: 12.50,
      distance: '2.5 km',
      duration: '8 mins',
      rideType: 'comfort',
      status: 'searching',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ride-req-104',
      riderId: 'rider-u4',
      riderName: 'Guillaume Lamy',
      riderPhone: '+33 6 11 00 22 99',
      pickup: 'Orly Airport, Paris',
      destination: 'Panthéon, Paris',
      fare: 42.00,
      distance: '16.8 km',
      duration: '28 mins',
      rideType: 'premium',
      status: 'searching',
      createdAt: new Date().toISOString(),
    }
  ]);

  // Effect to fetch user profile data directly from database profiles table (Supabase)
  useEffect(() => {
    let active = true;

    async function fetchUserProfile() {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      setProfileError(null);

      if (isDemoMode) {
        // Fallback or Simulated Profile inside Demo Sandbox
        setTimeout(() => {
          if (!active) return;
          if (profile) {
            setDbProfile(profile);
            setIsOnline(profile.is_online ?? true);
          }
          setProfileLoading(false);
        }, 600);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        if (active && data) {
          const profileData: Profile = data as Profile;
          setDbProfile(profileData);
          setIsOnline(profileData.is_online ?? true);
        }
      } catch (err: any) {
        console.error('Error fetching profiles metadata:', err);
        if (active) {
          setProfileError(err.message || 'Failed to fetch saved user profile from cloud database');
          // Fallback to Zustand state
          if (profile) {
            setDbProfile(profile);
            setIsOnline(profile.is_online ?? true);
          }
        }
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    }

    fetchUserProfile();

    return () => {
      active = false;
    };
  }, [user, profile, isDemoMode]);

  // Handle availability toggle for Riders
  const handleAvailabilityToggle = async () => {
    const nextStatus = !isOnline;
    setStatusUpdating(true);
    setFeedback(null);

    // Update in-store state first
    await updateProfile({ is_online: nextStatus });

    if (isDemoMode) {
      setTimeout(() => {
        setIsOnline(nextStatus);
        if (dbProfile) {
          setDbProfile({ ...dbProfile, is_online: nextStatus });
        }
        setStatusUpdating(false);
        setFeedback({
          message: `Availability updated successfully: You are now ${nextStatus ? 'Online' : 'Offline'}.`,
          type: 'success'
        });
      }, 400);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_online: nextStatus })
        .eq('id', user?.id);

      if (error) throw error;

      setIsOnline(nextStatus);
      if (dbProfile) {
        setDbProfile({ ...dbProfile, is_online: nextStatus });
      }
      setFeedback({
        message: `Status synchronized with Supabase: ${nextStatus ? 'Online' : 'Offline'}`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error synchronizing database status:', err);
      // Fallback but show warning
      setIsOnline(nextStatus);
      setFeedback({
        message: `Updated locally but failed to save to Supabase database.`,
        type: 'error'
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  // Realtime submit handler for Customers booking a ride
  const handleRequestRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !destination || !fare) return;

    setIsSubmitting(true);
    setBookingSuccess(false);
    setFeedback(null);

    try {
      const response = await requestRide(pickup, destination, parseFloat(fare), selectedTier);
      if (response.success) {
        setBookingSuccess(true);
        setFeedback({
          message: 'Ride request logged on Supabase database table and broadcast to nearby riders!',
          type: 'success'
        });
        // Auto-dismiss alert after 7s
        setTimeout(() => {
          setBookingSuccess(false);
        }, 7000);
      } else {
        setFeedback({
          message: response.error || 'Database storage error occurred.',
          type: 'error'
        });
      }
    } catch (err: any) {
      setFeedback({
        message: err.message || 'Fatal error submitting ride block.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format Display Name
  const userDisplayName = dbProfile?.full_name || profile?.full_name || user?.email?.split('@')[0] || 'VUU User';
  const resolvedRole: UserRole = dbProfile?.role || profile?.role || 'customer';

  // Quick preset destinations for Paris
  const presets = [
    { label: 'Eiffel Tower 🗼', pickup: 'Gare du Nord, Paris', dest: 'Eiffel Tower, Paris', fare: '18.50' },
    { label: 'Louvre Museum 🏛️', pickup: 'Champs-Élysées, Paris', dest: 'Louvre Museum, Paris', fare: '12.00' },
    { label: 'Orly Airport ✈️', pickup: 'Place de la Bastille, Paris', dest: 'Orly Airport, Paris', fare: '39.00' },
  ];

  const applyPreset = (p: string, d: string, f: string) => {
    setPickup(p);
    setDestination(d);
    setFare(f);
  };

  return (
    <div className="w-full flex flex-col gap-6" id="vuu-home-page">
      
      {/* 🚀 EMERALD-GREEN TITLE HERO PANEL */}
      <div className="bg-emerald-950/40 border border-emerald-900/40 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
        {/* Subtle decorative mesh bg */}
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Navigation className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-bold">VUU Live Portal</span>
                {isDemoMode && (
                  <span className="text-[10px] font-bold text-amber-400 px-1.5 py-0.2 bg-amber-400/10 border border-amber-400/20 rounded">
                    Demo Mode Sandbox
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">Welcome back, {userDisplayName}!</h2>
              <p className="text-xs text-slate-400 mt-1">
                Your role: <strong className="text-emerald-400 font-bold uppercase tracking-wider">{resolvedRole}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={signOut}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-emerald-400" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* ERROR DISPLAY IF ANY */}
      {profileError && (
        <div className="bg-amber-400/5 border border-amber-400/20 p-4 rounded-2xl text-xs text-amber-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold mb-1">Notice: Cloud Table Integration Fallback</p>
            <p className="text-slate-400 leading-relaxed">
              We encountered a minor fallback when contacting Supabase profiles table ("{profileError}"). We gracefully hydrated profile details from memory sandbox.
            </p>
          </div>
        </div>
      )}

      {/* FEEDBACK POPUPS */}
      {feedback && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 border ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ROLE-BASED DASHBOARD RENDER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* 🚗 CUSTOMER DASHBOARD (Role: customer OR admin) */}
        {(resolvedRole === 'customer' || resolvedRole === 'admin') && (
          <div className="md:col-span-8 space-y-6">
            
            {/* RIDE BOOKING CARD (The "Card") */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                    <Car className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Ride Request Card</h3>
                    <p className="text-[10px] text-slate-400">Complete details to hail a private rider partner</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  Instant Match
                </span>
              </div>

              {/* BOOKING CONFIRMATION SCREEN */}
              {bookingSuccess && (
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-5 text-center mb-6 text-xs text-slate-300 animate-fadeIn">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-950 shadow-lg shadow-emerald-500/20">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Ride Request Broad-casted!</h4>
                  <p className="text-slate-400 mt-1 leading-relaxed max-w-[320px] mx-auto">
                    Your request from <strong>{pickup}</strong> to <strong>{destination}</strong> for <strong className="text-emerald-400">${Number(fare).toFixed(2)}</strong> has been broadcasted. A professional Rider partner will contact you shortly.
                  </p>
                </div>
              )}

              {/* RIDE REQUEST FORM */}
              <form onSubmit={handleRequestRide} className="space-y-4">
                
                {/* Preset Fast Locations */}
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2 font-bold">Fast Preset Locations</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {presets.map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => applyPreset(preset.pickup, preset.dest, preset.fare)}
                        className="bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-2.5 text-left text-xs transition-colors flex flex-col justify-between gap-1 group"
                      >
                        <span className="text-white font-bold group-hover:text-emerald-400 transition-colors truncate w-full">{preset.label}</span>
                        <span className="text-[10px] text-slate-500 truncate w-full">{preset.dest}</span>
                        <span className="text-[10.5px] font-mono text-emerald-400 font-bold block mt-1">${preset.fare}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pickup Address Input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Pickup Location</label>
                  <div className="bg-slate-950 rounded-xl px-3.5 py-2.5 border border-slate-850 flex items-center gap-3 focus-within:border-emerald-500 transition-colors">
                    <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
                    <input 
                      type="text" 
                      required
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      placeholder="Enter pickup point"
                      className="bg-transparent text-xs text-white w-full border-none p-0 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Destination Address Input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Destination Address</label>
                  <div className="bg-slate-950 rounded-xl px-3.5 py-2.5 border border-slate-850 flex items-center gap-3 focus-within:border-emerald-500 transition-colors">
                    <Navigation className="w-5 h-5 text-teal-400 shrink-0 animate-pulse" />
                    <input 
                      type="text" 
                      required
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Where are you heading?"
                      className="bg-transparent text-xs text-white w-full border-none p-0 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Fare/Price Input (Input) */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Proposed Fare (USD)</label>
                    <div className="bg-slate-950 rounded-xl px-3.5 py-2.5 border border-slate-850 flex items-center gap-3 focus-within:border-emerald-500 transition-colors">
                      <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" />
                      <input 
                        type="number" 
                        step="0.01"
                        min="5.00"
                        required
                        value={fare}
                        onChange={(e) => setFare(e.target.value)}
                        placeholder="15.00"
                        className="bg-transparent text-xs text-white w-full border-none p-0 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Tier Picker */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Ride Tier Level</label>
                    <select
                      value={selectedTier}
                      onChange={(e: any) => setSelectedTier(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    >
                      <option value="standard">VUU Eco Sedan</option>
                      <option value="comfort">VUU Comfort Plus</option>
                      <option value="premium">VUU Black SUV</option>
                      <option value="moto">VUU Express Moto</option>
                    </select>
                  </div>
                </div>

                {/* Find Rider Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-slate-950 font-black text-xs py-3.5 rounded-xl transition-colors shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      Contacting Nearest Rider Services...
                    </>
                  ) : (
                    <>
                      <Compass className="w-4.5 h-4.5 text-slate-950" />
                      Find Rider Partner • ${Number(fare || 0).toFixed(2)}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 🏍️ RIDER / DRIVER DASHBOARD (Role: rider) */}
        {(resolvedRole === 'rider') && (
          <div className="md:col-span-8 space-y-6">
            
            {/* STATUS TOGGLE CARD FOR RIDER MODULE WITH SWITCH */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                    isOnline 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-slate-950 border-slate-850 text-slate-500'
                  }`}>
                    <Power className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Rider Status & Availability</h3>
                    <p className="text-[10px] text-slate-400">Handle active client notifications in real time</p>
                  </div>
                </div>

                {/* availability status toggle switch */}
                <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-850 px-3">
                  <span className={`text-xs font-bold font-mono tracking-wide ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                    Availability: {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                  
                  {/* Custom Tailwind Powered Switch component */}
                  <button
                    onClick={handleAvailabilityToggle}
                    disabled={statusUpdating}
                    type="button"
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isOnline ? 'bg-emerald-500' : 'bg-slate-800'
                    } ${statusUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                        isOnline ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Status helper banner */}
              <div className="mt-4 text-xs leading-relaxed text-slate-400 flex items-start gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                <p>
                  {isOnline 
                    ? "🚀 You are in Active Service! Nearby customer requests will appear highlighted in the live panel below. Acceptance increases status ranking."
                    : "🔒 You are currently Offline. Turn availability switch 'Online' to join matchmaking pools and accept premium fares."
                  }
                </p>
              </div>
            </div>

            {/* Nearby Ride Requests Dispatch Section */}
            {!isOnline ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20 text-emerald-400 animate-pulse">
                      <Compass className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Nearby Ride Requests</h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">Locked</span>
                </div>
                <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-dashed border-slate-850 p-6">
                  <Power className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs font-semibold text-slate-400">Offline Status Restrictive</p>
                  <p className="text-[11px] text-slate-500 max-w-[280px] mx-auto mt-1 leading-normal">
                    Toggle your Availability status 'Online' above to fetch active customer routes in Paris coordinates.
                  </p>
                </div>
              </div>
            ) : (
              <RiderDashboard />
            )}

          </div>
        )}

        {/* STATS / DOCUMENTATION COLUMN */}
        <div className="md:col-span-4 space-y-6">
          
          {/* SUPABASE STATUS CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Supabase Real-Time</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Connection URL</span>
                <span className="font-mono text-[10px] text-emerald-450 truncate max-w-[120px]" title={(import.meta as any).env?.VITE_SUPABASE_URL || 'Placeholder'}>
                  {isDemoMode ? 'sandbox-memory://' : (import.meta as any).env?.VITE_SUPABASE_URL || 'Active Client'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Database Engine</span>
                <span className="text-white font-semibold">PostgreSQL v15</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Real-Time Sync</span>
                <span className="text-emerald-400 font-extrabold flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" /> Active
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl text-[10.5px] leading-relaxed text-slate-400 border border-slate-850">
              <p className="font-bold text-white mb-1 flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Row-Level Security (RLS)
              </p>
              Supabase enforces strict security rules. Rides table inserts check role credentials to prevent client manipulation.
            </div>
          </div>

          {/* DRIVER STATS CARD */}
          {resolvedRole === 'rider' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Earnings Dashboard</span>
              
              <div className="grid grid-cols-2 gap-3 pb-2">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Trips</span>
                  <p className="text-xl font-black text-white mt-1">12 completed</p>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-mono">Today</span>
                  <p className="text-xl font-black text-emerald-400 mt-1">${(185.50).toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl text-xs text-slate-400 border border-slate-850">
                <p className="text-white font-bold mb-1">Weekly target achieved!</p>
                You are outperforming 85% of other VUU Rider partners in the Paris administrative area this week.
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useRideMatching } from '../hooks/useRideMatching';
import { useCachedActiveRides } from '../hooks/useCachedRides';
import { 
  Car, 
  MapPin, 
  Navigation, 
  DollarSign, 
  Clock, 
  Compass, 
  HeartHandshake, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle
} from 'lucide-react';

export default function RiderDashboard() {
  const { user, profile } = useAuthStore();
  const { data: rides = [], isLoading: loading, error } = useCachedActiveRides();
  const { acceptRideRequest } = useRideMatching();
  const [actingRideId, setActingRideId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter only 'searching' ride requests that are waiting for user acceptance
  const pendingRides = rides.filter(ride => ride.status === 'searching');

  const handleAccept = async (rideId: string) => {
    setActingRideId(rideId);
    setSuccessMsg(null);
    try {
      const result = await acceptRideRequest(rideId);
      if (result.success) {
        setSuccessMsg("Trip accepted! Navigate to Live Tracks or AI Chat tab to communicate inside the vehicle tunnel.");
        // Clear message after 4 seconds
        setTimeout(() => setSuccessMsg(null), 4500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActingRideId(null);
    }
  };

  return (
    <div className="space-y-6" id="rider-acceptance-dashboard">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-br from-blue-950/40 via-indigo-950/40 to-slate-950 border border-indigo-950 rounded-3xl p-5 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
              <Compass className="w-5.5 h-5.5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">VUU Ride Dispatch Center</h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                Listen and respond to live passenger requests. Once accepted, you'll join the rides tunnel, and can access bidirectional GPS tracks and integrated automatic AI chat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-850 p-2.5 rounded-xl font-mono text-[10.5px]">
            <span className="text-slate-500">USER PROFILE:</span>
            <span className="text-blue-400 font-extrabold capitalize">{profile?.role || 'Guest Rider'}</span>
          </div>
        </div>
      </div>

      {/* REACTION TOAST */}
      {successMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs rounded-2xl p-4 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold leading-relaxed">{successMsg}</span>
        </div>
      )}

      {/* CORE QUEUE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
          <div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">LIVE TELEMETRY STATION</span>
            <h4 className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
              Available Dispatch Calls
              <span className="bg-indigo-500/15 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                {pendingRides.length} active
              </span>
            </h4>
          </div>
          <div className="flex items-center gap-1 text-[10.5px] font-mono text-indigo-400 font-bold">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping mr-1"></span>
            Realtime DB Connected
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-xs font-bold text-slate-400">Listening to ride-hailing database events...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-950/20 border border-rose-500/15 rounded-2xl flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-extrabold text-rose-400">Database Query Blocked</p>
              <p className="text-slate-400 mt-1 leading-relaxed">{(error as any)?.message || String(error)}</p>
            </div>
          </div>
        ) : pendingRides.length === 0 ? (
          <div className="py-12 text-center max-w-sm mx-auto flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center text-slate-600 mb-3 border border-slate-850">
              <Car className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-450">All trips matched!</p>
            <p className="text-[10.5px] text-slate-500 mt-1.5 leading-relaxed">
              There are no pending rides waiting for acceptances currently. Tell passengers to submit new pick-up bookings on their portal tab.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRides.map((ride) => (
              <div 
                key={ride.id} 
                className="bg-slate-950/80 hover:bg-slate-950 border border-slate-850 rounded-2xl p-4.5 transition-all flex flex-col justify-between hover:border-indigo-500/35 group relative overflow-hidden"
              >
                {/* Accent glow on hover */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Card header */}
                <div className="flex justify-between items-start gap-3.5 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={ride.riderAvatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"} 
                      alt="Rider avatar" 
                      className="w-10 h-10 rounded-xl object-cover border border-slate-800"
                    />
                    <div>
                      <h5 className="text-xs font-black text-white">{ride.riderName}</h5>
                      <p className="text-[10px] text-indigo-400 font-mono font-bold mt-0.5 uppercase">{ride.rideType} • VUU Class</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-center">
                    <span className="text-[10px] text-emerald-400 font-black font-mono block">${ride.fare.toFixed(2)}</span>
                    <span className="text-[8.5px] font-mono text-slate-500 block">Est. Fare</span>
                  </div>
                </div>

                {/* Path metrics */}
                <div className="my-4 py-3 border-y border-slate-900 space-y-2.5 relative z-10 text-xs">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></div>
                    <div className="min-w-0">
                      <span className="text-[9px] text-slate-550 uppercase tracking-widest font-mono font-bold block leading-none">Pick Location</span>
                      <span className="text-slate-300 font-bold truncate block">{ride.pickup}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0"></div>
                    <div className="min-w-0">
                      <span className="text-[9px] text-slate-550 uppercase tracking-widest font-mono font-bold block leading-none">Drop Location</span>
                      <span className="text-slate-300 font-bold truncate block">{ride.destination}</span>
                    </div>
                  </div>
                </div>

                {/* Additional metadata metrics */}
                <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-900/60 p-2.5 rounded-xl border border-slate-900 text-[10px] font-mono">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Est. {ride.duration || '12 mins'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                    <span>Dist. {ride.distance || '4.5 km'}</span>
                  </div>
                </div>

                {/* Accept Button */}
                <button
                  onClick={() => handleAccept(ride.id)}
                  disabled={actingRideId !== null}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-black py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-1.5 tracking-tight disabled:opacity-50"
                >
                  {actingRideId === ride.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Accepting Call...</span>
                    </>
                  ) : (
                    <>
                      <HeartHandshake className="w-4 h-4 stroke-[2.5]" />
                      <span>Accept Request Only</span>
                    </>
                  )}
                </button>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* DISPATCH PROTOCOL INFORMATION CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5.5 h-5.5" />
        </div>
        <div className="text-xs leading-relaxed max-w-2xl text-slate-400">
          <p className="font-bold text-white mb-0.5">VUU Security Protocol and Fair Compensation</p>
          Both independent riders and drivers are fully covered under active VUU Smart Ride insurance bounds once status shifts to accepted. Our real-time translation module automatically processes messages to bridge multilingual partner conversations.
        </div>
      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TrendingUp, 
  DollarSign, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Map, 
  Clock, 
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { mapRowToRideRequest } from '../hooks/useRideMatching';
import { RideRequest } from '../types';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { isDemoMode } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Fetch ALL rides for analytics calculations using TanStack Query
  const { data: rides = [], isLoading: isLoadingRides, refetch: refetchRides } = useQuery<RideRequest[]>({
    queryKey: ['admin', 'all-rides'],
    queryFn: async () => {
      if (isSupabaseConfigured && !isDemoMode) {
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapRowToRideRequest);
      } else {
        // Fallback local storage emulate
        const stored = localStorage.getItem('vuu_rides_matching_list');
        if (stored) {
          return JSON.parse(stored);
        }
        // Base seed if nothing has been registered yet
        const seed = [
          {
            id: 'ride-seed-1',
            riderId: 'rider-abc',
            riderName: 'Sarah Jenkins',
            pickup: 'Kimironko Market, Kigali',
            destination: 'Kigali Heights, Kigali',
            fare: 15.20,
            distance: '4.8 km',
            duration: '11 mins',
            rideType: 'moto',
            status: 'paid',
            createdAt: new Date().toISOString()
          },
          {
            id: 'ride-seed-2',
            riderId: 'rider-xyz',
            riderName: 'Marc Dubois',
            pickup: 'Kigali International Airport',
            destination: 'Marriott Hotel, Kigali',
            fare: 28.50,
            distance: '9.2 km',
            duration: '18 mins',
            rideType: 'standard',
            status: 'completed',
            createdAt: new Date().toISOString()
          },
          {
            id: 'ride-seed-3',
            riderId: 'rider-mno',
            riderName: 'Kimenyi Olivier',
            pickup: 'Giporoso, Kigali',
            destination: 'Nyamirambo, Kigali',
            fare: 8.00,
            distance: '12.0 km',
            duration: '22 mins',
            rideType: 'moto',
            status: 'paid',
            createdAt: new Date().toISOString()
          },
          {
            id: 'ride-seed-4',
            riderId: 'rider-pqr',
            riderName: 'Bella Rwanyange',
            pickup: 'Kimironko Market, Kigali',
            destination: 'Nyabugogo Bus Park, Kigali',
            fare: 14.50,
            distance: '6.5 km',
            duration: '15 mins',
            rideType: 'comfort',
            status: 'paid',
            createdAt: new Date(Date.now() - 36*60*60*1000).toISOString() // yesterday
          }
        ];
        localStorage.setItem('vuu_rides_matching_list', JSON.stringify(seed));
        return seed;
      }
    }
  });

  // 2. Fetch Complaints Log via TanStack Query
  const { data: complaints = [], isLoading: isLoadingComplaints, refetch: refetchComplaints } = useQuery({
    queryKey: ['admin', 'complaints'],
    queryFn: async () => {
      if (isSupabaseConfigured && !isDemoMode) {
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } else {
        const stored = localStorage.getItem('vuu_complaints');
        if (stored) {
          return JSON.parse(stored);
        }
        // Base seed complaint
        const seed = [
          {
            id: 'complaint-seed-1',
            ride_id: 'ride-seed-4',
            complainant_id: 'rider-pqr',
            issue_type: 'overcharging',
            description: 'Driver requested extra MoMo transaction fees outside standard VUU fare estimation.',
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ];
        localStorage.setItem('vuu_complaints', JSON.stringify(seed));
        return seed;
      }
    }
  });

  // 3. Mutation: Resolve Dispute / Complaint
  const resolveComplaintMutation = useMutation({
    mutationFn: async (complaintId: string) => {
      if (isSupabaseConfigured && !isDemoMode) {
        const { error } = await supabase
          .from('complaints')
          .update({ status: 'resolved' })
          .eq('id', complaintId);

        if (error) throw error;
        return complaintId;
      } else {
        const stored = localStorage.getItem('vuu_complaints');
        if (stored) {
          const list = JSON.parse(stored);
          const idx = list.findIndex((c: any) => c.id === complaintId);
          if (idx !== -1) {
            list[idx].status = 'resolved';
            localStorage.setItem('vuu_complaints', JSON.stringify(list));
          }
        }
        return complaintId;
      }
    },
    onSuccess: (resolvedId) => {
      // Optimistically update cache and trigger refresh
      queryClient.setQueryData<any[]>(['admin', 'complaints'], (old = []) => {
        return old.map(c => c.id === resolvedId ? { ...c, status: 'resolved' } : c);
      });
    }
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchRides(), refetchComplaints()]);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // --- ANALYTICS CALCULATIONS ---
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Filter rides matching today
  const ridesToday = rides.filter(r => {
    const rideDate = new Date(r.createdAt);
    return rideDate >= todayStart;
  });

  // Total rides completed today (statuses 'completed' or 'paid')
  const completedTodayList = ridesToday.filter(r => r.status === 'completed' || r.status === 'paid');
  const totalRidesCompletedToday = completedTodayList.length;

  // Revenue earned today (from sum of successful completions/payments)
  const revenueCalculatedToday = completedTodayList.reduce((sum, r) => sum + r.fare, 0);

  // Active Locations calculations (frequency count on pickup locations)
  const locationFrequencies = rides.reduce((acc: Record<string, number>, r) => {
    // Simplify/clean departure point name for visualization consistency
    const cleanLoc = r.pickup.split(',')[0].trim();
    acc[cleanLoc] = (acc[cleanLoc] || 0) + 1;
    return acc;
  }, {});

  const sortedLocations = Object.entries(locationFrequencies)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4); // Top 4 hubs

  const totalLocTrips = sortedLocations.reduce((sum, l) => sum + l.count, 0) || 1;

  return (
    <div className="space-y-6 select-none" id="vuu-admin-portal-suite">
      
      {/* HEADER CONTROLS Banner */}
      <div className="bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[8px] font-mono font-extrabold text-amber-400 tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> CORPORATE MANAGEMENT PORTAL
            </span>
            <h3 className="text-base font-black text-white tracking-tight">VUU Administrative Ledger</h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Audit operational metrics, track localized revenue in real-time, and manage consumer complaints securely.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 p-2.5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 font-mono text-[10px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isRefreshing ? 'Re-aligning data...' : 'Refresh Logs'}</span>
          </button>
        </div>
      </div>

      {/* THREE ANALYTICS METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Metric 1 - Total completed today */}
        <div className="bg-slate-900 border border-slate-850 p-4.5 rounded-3xl flex flex-col justify-between hover:border-slate-800 transition-colors relative overflow-hidden group">
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-505/10 transition-colors pointer-events-none"></div>
          
          <div className="flex justify-between items-start gap-2 relative z-10">
            <div className="space-y-1">
              <span className="text-[8.5px] font-mono text-slate-450 uppercase tracking-wider font-bold">Rides Completed Today</span>
              <p className="text-2xl font-black font-mono text-white tracking-tight mt-1">{totalRidesCompletedToday}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4.5 h-4.5" />
            </div>
          </div>
          
          <p className="text-[10px] text-slate-500 font-mono mt-4 border-t border-slate-850/60 pt-2 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-400" />
            <span>Target threshold: 10 completions</span>
          </p>
        </div>

        {/* Metric 2 - Revenue earned today */}
        <div className="bg-slate-900 border border-slate-850 p-4.5 rounded-3xl flex flex-col justify-between hover:border-slate-800 transition-colors relative overflow-hidden group">
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-505/10 transition-colors pointer-events-none"></div>
          
          <div className="flex justify-between items-start gap-2 relative z-10">
            <div className="space-y-1">
              <span className="text-[8.5px] font-mono text-slate-450 uppercase tracking-wider font-bold">Revenue Dispatched Today</span>
              <p className="text-2xl font-black font-mono text-emerald-400 tracking-tight mt-1">${revenueCalculatedToday.toFixed(2)}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
          </div>
          
          <p className="text-[10px] text-slate-400 font-mono mt-4 border-t border-slate-850/60 pt-2 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>100% processing rate</span>
          </p>
        </div>

        {/* Metric 3 - Active Disputes pending */}
        <div className="bg-slate-900 border border-slate-850 p-4.5 rounded-3xl flex flex-col justify-between hover:border-slate-800 transition-colors relative overflow-hidden group">
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-505/10 transition-colors pointer-events-none"></div>
          
          <div className="flex justify-between items-start gap-2 relative z-10">
            <div className="space-y-1">
              <span className="text-[8.5px] font-mono text-slate-450 uppercase tracking-wider font-bold">Pending Disputes Pending</span>
              <p className="text-2xl font-black font-mono text-amber-500 tracking-tight mt-1">
                {complaints.filter((c: any) => c.status === 'pending').length}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5 animate-pulse" />
            </div>
          </div>
          
          <p className="text-[10px] text-slate-500 font-mono mt-4 border-t border-slate-850/60 pt-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Resolution window &lt; 24h</span>
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: ACTIVE HUBS / LOCATIONS (2/5 size) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-850 rounded-3xl p-5 shadow-xl space-y-4">
          <div>
            <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-widest font-bold">LOCATIONAL HUB TELEMETRY</span>
            <h4 className="text-sm font-black text-white mt-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" /> Most Active Departure Hubs
            </h4>
          </div>

          <div className="space-y-3 pt-1">
            {sortedLocations.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl italic">
                No route telemetry logs registered.
              </div>
            ) : (
              sortedLocations.map((loc) => {
                const percentage = Math.round((loc.count / totalLocTrips) * 100);
                return (
                  <div key={loc.name} className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-white font-bold truncate max-w-[150px]">{loc.name}</span>
                      <span className="text-slate-400 font-bold">{loc.count} {loc.count === 1 ? 'trip' : 'trips'} ({percentage}%)</span>
                    </div>
                    {/* Progress Bar representation */}
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-850">
                      <div 
                        className="bg-emerald-400 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Map context footer */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex items-start gap-2.5 text-[10px] text-slate-500 leading-normal">
            <Map className="w-4.5 h-4.5 text-slate-600 shrink-0 mt-0.5" />
            <span>
              Realtime pickup coordinates are mapped from high-accuracy GPS registers in Kigali, ensuring precise density analyses inside Rwanda centers.
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: DISPUTE & COMPLAINT LEDGER PANEL (3/5 size) */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-850 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-widest font-bold">HELD DISPUTES ARCHIVE</span>
              <h4 className="text-sm font-black text-white mt-1">Passenger Incident Logs</h4>
            </div>
            <span className="bg-slate-950 text-slate-400 px-2 py-0.5 rounded-lg border border-slate-800 text-[10px] font-mono font-bold">
              {complaints.length} tickets total
            </span>
          </div>

          <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1">
            {complaints.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-slate-850 rounded-2xl italic">
                Clean ledger record. No pending passenger disputes logged.
              </div>
            ) : (
              complaints.map((c: any) => (
                <div 
                  key={c.id} 
                  className={`border rounded-2xl p-3.5 space-y-3 transition-colors ${
                    c.status === 'pending' 
                      ? 'bg-slate-950/60 border-amber-500/15 hover:border-amber-500/25' 
                      : 'bg-slate-950/20 border-slate-850/60 opacity-75'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 text-[10px] font-mono">
                    <span className="text-white font-extrabold uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {c.issue_type.replace('_', ' ')}
                    </span>
                    
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase leading-none border ${
                      c.status === 'pending'
                        ? 'bg-amber-400/5 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-normal bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
                    "{c.description}"
                  </p>

                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      <span>Logged ID {c.id.slice(-6).toUpperCase()}</span>
                    </div>

                    {c.status === 'pending' && (
                      <button
                        onClick={() => resolveComplaintMutation.mutate(c.id)}
                        disabled={resolveComplaintMutation.isPending}
                        className="bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-black px-3 py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>{resolveComplaintMutation.isPending ? 'Syncing...' : 'Resolve Ticket'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
        </div>

      </div>

    </div>
  );
}

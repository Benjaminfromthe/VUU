import React, { useEffect, useState } from 'react';
import { 
  useAuthStore, 
  UserRole 
} from './store/useAuthStore';
import { 
  useRideStore 
} from './store/useRideStore';
import Home from './pages/Home';
import Chat from './pages/Chat';
import RideMap from './components/RideMap';
import PaymentForm from './components/PaymentForm';
import LanguageSwitcher from './components/LanguageSwitcher';
import RatingSystem from './components/RatingSystem';
import SafetyToggle from './components/SafetyToggle';
import DisputeForm from './components/DisputeForm';
import AdminDashboard from './components/AdminDashboard';
import { useCachedRideHistory } from './hooks/useCachedRides';
import { 
  Car, 
  MapPin, 
  Compass, 
  Shield, 
  LogOut, 
  Navigation, 
  DollarSign, 
  Activity, 
  User as UserIcon, 
  Clock, 
  Sparkles, 
  CheckCircle, 
  ChevronRight, 
  AlertTriangle, 
  Github,
  Phone,
  ArrowRight,
  Info,
  Map,
  Layers,
  Smartphone,
  Star,
  MessageSquare
} from 'lucide-react';

export default function App() {
  const { 
    user, 
    profile, 
    loading, 
    error, 
    isDemoMode,
    signUp, 
    signIn, 
    signOut, 
    initialize, 
    updateProfile,
    clearError
  } = useAuthStore();

  const {
    activeRide,
    history,
    driverQueue,
    isSearching,
    requestRide,
    cancelRide,
    acceptRide,
    updateRideStatus,
    completeRide,
    seedNewRequest
  } = useRideStore();

  const { data: cachedHistory = [] } = useCachedRideHistory(profile?.id || '');
  const displayHistory = cachedHistory.length > 0 ? cachedHistory : history;

  // App UI state
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authRole, setAuthRole] = useState<UserRole>('rider');
  const [isRegistering, setIsRegistering] = useState(false);

  // Rider booking variables
  const [pickupAddr, setPickupAddr] = useState('Gare du Nord, Paris');
  const [destAddr, setDestAddr] = useState('Eiffel Tower, Paris');
  const [selectedRideType, setSelectedRideType] = useState<'standard' | 'comfort' | 'premium' | 'moto'>('standard');
  const [showHistory, setShowHistory] = useState(false);

  // Driver states
  const [isOnline, setIsOnline] = useState(true);
  const [earnings, setEarnings] = useState(142.80);
  const [completedTrips, setCompletedTrips] = useState(6);

  // General tab switcher within mobile frame
  const [activeTab, setActiveTab] = useState<'home' | 'portal' | 'chat' | 'settings' | 'admin'>('portal');

  // Rating state for completed trip
  const [tripRating, setTripRating] = useState<number | null>(null);
  const [hasRated, setHasRated] = useState(false);
  const [useLiveGpsMap, setUseLiveGpsMap] = useState(true);
  const [disputingRide, setDisputingRide] = useState<any | null>(null);

  // Initialize Auth listeners
  useEffect(() => {
    const rawSupabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    const rawAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    
    console.log('[Supabase Link Status]');
    console.log(' - Raw URL:', rawSupabaseUrl);
    console.log(' - Raw Key length:', rawAnonKey ? rawAnonKey.length : 0);
    
    const unsub = initialize();
    return () => unsub();
  }, [initialize]);

  // Handle preset locations helper
  const handlePresetSelect = (p: string, d: string) => {
    setPickupAddr(p);
    setDestAddr(d);
  };

  // Safe login presets for developers to speed up testing
  const loginCustomerPreset = async () => {
    setAuthEmail('customer@vuu.com');
    setAuthPassword('password123');
    await signIn('customer@vuu.com', 'password123');
  };

  const loginRiderPreset = async () => {
    setAuthEmail('rider@vuu.com');
    setAuthPassword('password123');
    await signIn('rider@vuu.com', 'password123');
  };

  const loginDriverPreset = async () => {
    setAuthEmail('driver@vuu.com');
    setAuthPassword('password123');
    await signIn('driver@vuu.com', 'password123');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;

    if (isRegistering) {
      await signUp(authEmail, authPassword, authName || 'VUU User', authPhone || '+33 600 000 00', authRole);
    } else {
      await signIn(authEmail, authPassword);
    }
  };

  // Simulated live requests feed for drivers
  useEffect(() => {
    if (!profile || profile.role !== 'driver' || !isOnline) return;

    const interval = setInterval(() => {
      const names = ['Guillaume L.', 'Chloé Martin', 'Thomas B.', 'Nathalie R.', 'Lucas Petit'];
      const randomName = names[Math.floor(Math.random() * names.length)];
      // Add a small chance of a new random ride popping onto the driver queue
      if (Math.random() > 0.4) {
        seedNewRequest(randomName);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [profile, isOnline, seedNewRequest]);

  // Clean-up/Reset rating when a new ride finishes/starts
  useEffect(() => {
    if (activeRide) {
      setHasRated(false);
      setTripRating(null);
    }
  }, [activeRide]);

  // Ride Pricing Matrix
  const pricing = {
    standard: { label: 'VUU Eco', price: 14.50, desc: 'Everyday standard rides', icon: Car },
    comfort: { label: 'VUU Comfort', price: 21.00, desc: 'Spacious sedans with top drivers', icon: Sparkles },
    premium: { label: 'VUU Elite', price: 34.00, desc: 'Luxury Mercedes or Tesla models', icon: Shield },
    moto: { label: 'VUU Moto', price: 18.00, desc: 'Fast scooter transfers', icon: Compass },
  };

  // Map representation helper (simulated map state using pure modern CSS/SVG)
  const renderMockMap = () => {
    if (useLiveGpsMap) {
      return (
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 shadow-md">
          <button 
            type="button"
            onClick={() => setUseLiveGpsMap(false)}
            className="absolute top-3 right-3 z-[1000] bg-slate-950/90 text-[10.5px] font-bold text-slate-350 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-slate-400" />
            Switch to Vector Art
          </button>
          <RideMap />
        </div>
      );
    }

    // Determine driver path animation keyframes based on ride status
    const status = activeRide?.status || 'idle';
    let riderPos = { x: 40, y: 35 };
    let driverPos = { x: 75, y: 70 };
    let destPos = { x: 80, y: 30 };

    if (status === 'accepted') {
      // Driver moving towards rider
      driverPos = { x: 50, y: 45 };
    } else if (status === 'arriving') {
      // Driver right next to rider
      driverPos = { x: 42, y: 38 };
    } else if (status === 'in_progress') {
      // Both moving towards destination
      riderPos = { x: 65, y: 32 };
      driverPos = { x: 63, y: 33 };
    }

    return (
      <div className="relative w-full h-44 bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-inner">
        {/* Toggle to Live GPS map */}
        <button 
          type="button"
          onClick={() => setUseLiveGpsMap(true)}
          className="absolute top-2.5 right-2 a z-20 bg-slate-950/90 text-[10px] font-extrabold text-indigo-400 border border-slate-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          Live GPS
        </button>
        {/* SVG background grid and path */}
        <svg className="absolute inset-0 w-full h-full opacity-30 select-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Main roadways */}
          <path d="M 0 35 H 300" stroke="#ffd60a" strokeWidth="2" strokeDasharray="4 2" fill="none" />
          <path d="M 120 0 V 200" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
          <path d="M 220 0 V 200" stroke="#ffd60a" strokeWidth="1" fill="none" />
          <path d="M 0 100 Q 150 160 300 100" stroke="rgba(255,255,255,0.15)" strokeWidth="4" fill="none" />
        </svg>

        {/* Abstract Paris landmarks on the mini map */}
        <div className="absolute top-4 left-6 text-[10px] font-mono text-slate-500 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800 pointer-events-none">
          📍 Gare du Nord
        </div>
        <div className="absolute bottom-6 right-8 text-[10px] font-mono text-slate-500 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800 pointer-events-none">
          🇫🇷 Eiffel Tower
        </div>

        {/* Dynamic Route Line */}
        {activeRide && (
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full">
              <line 
                x1={`${riderPos.x}%`} 
                y1={`${riderPos.y}%`} 
                x2={`${destPos.x}%`} 
                y2={`${destPos.y}%`} 
                stroke="#ffd60a" 
                strokeWidth="2.5" 
                strokeDasharray="5 4" 
                className="animate-pulse"
              />
            </svg>
          </div>
        )}

        {/* Map Pins */}
        {/* Rider Pin */}
        <div 
          className="absolute transition-all duration-1000 ease-in-out -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
          style={{ left: `${riderPos.x}%`, top: `${riderPos.y}%` }}
        >
          <div className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full shadow-lg border-2 border-white animate-bounce">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[9px] font-semibold text-white bg-slate-900/90 px-1 rounded shadow-sm border border-slate-800 mt-1">Rider</span>
        </div>

        {/* Destination Pin */}
        {activeRide && (
          <div 
            className="absolute transition-all duration-1000 ease-in-out -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
            style={{ left: `${destPos.x}%`, top: `${destPos.y}%` }}
          >
            <div className="flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded-full shadow-lg border-2 border-white">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] font-semibold text-white bg-slate-900/90 px-1 rounded shadow-sm border border-slate-800 mt-1">Dest</span>
          </div>
        )}

        {/* Driver Car Icon */}
        {activeRide && activeRide.driverId && (
          <div 
            className="absolute transition-all duration-1000 ease-in-out -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20"
            style={{ left: `${driverPos.x}%`, top: `${driverPos.y}%` }}
          >
            <div className="flex items-center justify-center w-8 h-8 bg-amber-400 text-slate-950 rounded-full shadow-xl border-2 border-slate-950">
              <Car className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold text-slate-950 bg-amber-400 px-1 rounded shadow-sm scale-95 mt-1 border border-slate-950">VUU CAB</span>
          </div>
        )}

        {/* Radar Overlay (Searching state) */}
        {isSearching && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[1px] pointer-events-none">
            <div className="relative flex items-center justify-center w-16 h-16">
              <div className="absolute inset-0 border-2 border-amber-400 rounded-full animate-ping opacity-60"></div>
              <div className="absolute inset-2 border-2 border-amber-500 rounded-full animate-ping opacity-30"></div>
              <div className="w-10 h-10 bg-amber-400/20 border border-amber-400 rounded-full flex items-center justify-center animate-pulse">
                <Compass className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] font-semibold text-amber-400 shadow-lg">
              Searching for near drivers...
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="vuu-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* HEADER BAR */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50 py-3.5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/10">
              <Navigation className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                VUU Transport
                <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-amber-400 px-1.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20">
                  Mobile-First
                </span>
              </h1>
              <p className="text-xs text-slate-400">Supabase & Zustand Clean Architecture</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            <div className="hidden md:flex items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Dev Server: Port 3000</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="text-[10px] font-medium text-slate-400 uppercase">Dev Mode Status</span>
                {isDemoMode ? (
                  <span className="text-amber-400 font-semibold uppercase tracking-wider text-[10px] bg-amber-400/5 px-2 py-0.5 rounded border border-amber-400/20">
                    ⚠️ Demo Sandbox
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[10px] bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20">
                    🔌 Live Supabase
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER GRIDS */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: PROJECT DIRECTORY & TECHNICAL DOCUMENTATION SIDEBAR */}
        <section className="lg:col-span-5 col-span-1 bg-slate-900/50 border border-slate-900 rounded-3xl p-6 shadow-xl flex flex-col gap-5 self-stretch">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1.5">
              <Layers className="w-5 h-5 text-amber-400" />
              Scalable Project Structure
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Based on enterprise industry standards, this modular architecture guarantees extreme scaling, clean separation of concerns, and ease of unit testing.
            </p>
          </div>

          {/* Directory File-Tree Visualizer */}
          <div className="bg-slate-950 rounded-2xl border border-slate-900 p-4 font-mono text-xs text-slate-300">
            <p className="text-slate-500 mb-2 border-b border-slate-900 pb-1.5 text-[10px] uppercase font-bold tracking-wider flex items-center justify-between">
              <span>📂 File Directory Tree</span>
              <span className="text-amber-400 text-[10px]">VUU Transport Root</span>
            </p>
            <div className="space-y-1.5 overflow-x-auto text-[11px]">
              <div>📦 <span className="text-amber-400 font-bold">src</span>/</div>
              <div className="pl-4">📁 <span className="text-white">components</span>/ <span className="text-slate-600 font-sans italic text-[10px]">(Reusable global UI buttons, forms)</span></div>
              <div className="pl-4">📁 <span className="text-white">lib</span>/ <span className="text-slate-600 font-sans italic text-[10px]">(Third party clients initialize)</span></div>
              <div className="pl-8 text-slate-400">⚡ <span className="text-amber-400">supabase.ts</span> <span className="text-amber-400/70 font-sans text-[10px]">[Generated ✅]</span></div>
              <div className="pl-4">📁 <span className="text-white">store</span>/ <span className="text-slate-600 font-sans italic text-[10px]">(Global client-side stores)</span></div>
              <div className="pl-8 text-slate-400">⚡ <span className="text-emerald-400">useAuthStore.ts</span> <span className="text-emerald-400/70 font-sans text-[10px]">[Generated ✅]</span></div>
              <div className="pl-8 text-slate-500">⚡ <span className="text-slate-500">useRideStore.ts</span> <span className="text-slate-500/70 font-sans text-[10px]">[Simulation Helper ✅]</span></div>
              <div className="pl-4">📁 <span className="text-white">types</span>/ <span className="text-slate-600 font-sans italic text-[10px]">(All strict interface contracts)</span></div>
              <div className="pl-8 text-slate-400">⚡ <span className="text-slate-400">types.ts</span> <span className="text-slate-400/70 font-sans text-[10px]">[Generated ✅]</span></div>
              <div className="pl-4">📁 <span className="text-white">views</span>/ <span className="text-slate-600 font-sans italic text-[10px]">(Feature specific layout view screens)</span></div>
              <div className="pl-8 text-slate-500">📁 <span className="text-slate-500">rider</span>/ <span className="text-slate-500/70 font-sans text-[10px]">(Rider booking workflow)</span></div>
              <div className="pl-8 text-slate-500">📁 <span className="text-slate-500">driver</span>/ <span className="text-slate-500/70 font-sans text-[10px]">(Driver accept workflow)</span></div>
              <div className="pl-4">⚡ <span className="text-pink-400">App.tsx</span> <span className="text-pink-400/70 font-sans text-[10px]">[Entry-point Dashboard ✅]</span></div>
              <div className="pl-4">⚡ <span className="text-white">main.tsx</span></div>
              <div className="pl-4">🎨 <span className="text-white">index.css</span></div>
            </div>
          </div>

          {/* Quick Technical Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900">
              <span className="text-xs text-slate-400 block mb-1">State Handler</span>
              <p className="text-sm font-bold text-white hover:text-amber-400 transition-colors">Zustand store</p>
              <span className="text-[10px] text-slate-500 block mt-1 leading-tight">Lightweight, fast react state engine inside useAuthStore.ts</span>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900">
              <span className="text-xs text-slate-400 block mb-1">Database Client</span>
              <p className="text-sm font-bold text-white hover:text-amber-400 transition-colors">Supabase client</p>
              <span className="text-[10px] text-slate-500 block mt-1 leading-tight">PostgreSQL engine with full real-time listeners inside supabase.ts</span>
            </div>
          </div>

          {/* Sandbox warning if missing Supabase variables */}
          {isDemoMode && (
            <div className="bg-amber-400/5 hover:bg-amber-400/10 transition-colors border border-amber-400/20 rounded-2xl p-4.5 text-xs text-slate-300 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="font-bold text-amber-400">Interactive Demo Mode Active</span>
              </div>
              <p className="leading-relaxed">
                We've built in a complete <strong>simulation fallback layer</strong>. Any actions you perform on the phone simulator directly mutate a mock Supabase engine storing records safely in the client's <strong>localStorage</strong>.
              </p>
              <div className="bg-slate-950/80 p-2.5 rounded-lg font-mono text-[10px] text-slate-400 flex flex-col gap-1 select-all border border-slate-900">
                <span># Setup secrets for live API</span>
                <span>VITE_SUPABASE_URL="https://..."</span>
                <span>VITE_SUPABASE_ANON_KEY="..."</span>
              </div>
            </div>
          )}
        </section>

        {/* COLUMN 2: INTERACTIVE MOBILE SMARTPHONE PREVIEW PHONE FRAME */}
        <section className="lg:col-span-7 col-span-1 flex flex-col items-center">
          
          {/* Smartphone Hardware Frame Wrapper */}
          <div className="w-full max-w-[420px] bg-[#0c101d] rounded-[48px] p-4.5 border-4 border-slate-900/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative">
            
            {/* Top Ear Speaker Notch */}
            <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2.5xl flex items-center justify-around z-50">
              <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
              <div className="w-3.5 h-3.5 bg-[#0a001a] rounded-full border-2 border-slate-800/50"></div>
            </div>

            {/* Simulated Phone Screen Canvas */}
            <div className="w-full bg-[#0a0e1a] rounded-[36px] overflow-hidden min-h-[640px] flex flex-col relative border border-slate-800/40">
              
              {/* SCREEN STATUS BAR */}
              <div className="py-2.5 px-6 pt-5 bg-slate-950 flex justify-between items-center text-[10px] font-mono text-slate-400 select-none z-10">
                <span className="font-semibold">VUU MOBILE</span>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded bg-emerald-500"></span>
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* DYNAMIC SCREEN CONTENT CORES */}
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#070b16]">
                  <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <h3 className="text-base font-semibold text-white">VUU Transport System</h3>
                  <p className="text-xs text-slate-400 mt-1">Bootstrapping local sandbox environment...</p>
                </div>
              ) : !user ? (
                /* AUTH LOGIN / REGISTER SCREEN */
                <div className="flex-1 p-6 flex flex-col justify-between bg-[#070b16] overflow-y-auto">
                  <div className="my-auto py-4">
                    
                    {/* App Logo */}
                    <div className="flex flex-col items-center text-center mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20 mb-3 animate-pulse">
                        <Navigation className="w-8 h-8 text-slate-900" />
                      </div>
                      <h2 className="text-2xl font-black text-white tracking-tight">VUU Transport</h2>
                      <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
                        Your mobile-first ride-hailing alternative powered by real state.
                      </p>
                    </div>

                    {/* Developer Presets Toggle (Extremely useful to avoid manually inputting accounts!) */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4.5 mb-6 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center justify-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-400 font-extrabold" /> Developer Quick-Login Presets
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={loginCustomerPreset}
                          type="button"
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-2.5 rounded-xl font-bold text-[10.5px] transition-colors flex flex-col items-center gap-1 cursor-pointer"
                        >
                          <span className="text-[9px] opacity-80 uppercase tracking-widest font-mono">Customer</span>
                          <span className="truncate w-full">Sarah C.</span>
                        </button>
                        <button 
                          onClick={loginRiderPreset}
                          type="button"
                          className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 px-2 py-2.5 rounded-xl font-bold text-[10.5px] transition-colors flex flex-col items-center gap-1 cursor-pointer"
                        >
                          <span className="text-[9px] opacity-80 uppercase tracking-widest font-mono">Rider</span>
                          <span className="truncate w-full">Benjamin R.</span>
                        </button>
                        <button 
                          onClick={loginDriverPreset}
                          type="button"
                          className="bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/20 px-2 py-2.5 rounded-xl font-bold text-[10.5px] transition-colors flex flex-col items-center gap-1 cursor-pointer"
                        >
                          <span className="text-[9px] opacity-80 uppercase tracking-widest font-mono">Driver</span>
                          <span className="truncate w-full">Alex D.</span>
                        </button>
                      </div>
                    </div>

                    {/* Auth Error Toast */}
                    {error && (
                      <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-rose-400 mb-5 text-[11px] leading-relaxed flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold mb-0.5">Authentication Error</strong>
                          <span>{error}</span>
                        </div>
                      </div>
                    )}

                    {/* Custom Form */}
                    <form onSubmit={handleAuthSubmit} className="space-y-4">
                      {isRegistering && (
                        <>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Full Name</label>
                            <input 
                              type="text" 
                              required 
                              value={authName} 
                              onChange={e => setAuthName(e.target.value)}
                              placeholder="e.g. Jean Dupont" 
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Phone Number</label>
                            <input 
                              type="tel" 
                              required 
                              value={authPhone} 
                              onChange={e => setAuthPhone(e.target.value)}
                              placeholder="e.g. +33 6 12 34 56 78" 
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Enroll as Role</label>
                            <div className="grid grid-cols-4 gap-1.5">
                              <button
                                type="button"
                                onClick={() => setAuthRole('customer')}
                                className={`py-1.5 text-[10px] font-bold rounded-lg border transition-colors ${authRole === 'customer' ? 'bg-emerald-600/25 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                              >
                                Customer
                              </button>
                              <button
                                type="button"
                                onClick={() => setAuthRole('rider')}
                                className={`py-1.5 text-[10px] font-bold rounded-lg border transition-colors ${authRole === 'rider' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                              >
                                Rider
                              </button>
                              <button
                                type="button"
                                onClick={() => setAuthRole('driver')}
                                className={`py-1.5 text-[10px] font-bold rounded-lg border transition-colors ${authRole === 'driver' ? 'bg-amber-400/20 border-amber-500 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                              >
                                Driver
                              </button>
                              <button
                                type="button"
                                onClick={() => setAuthRole('admin')}
                                className={`py-1.5 text-[10px] font-bold rounded-lg border transition-colors ${authRole === 'admin' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                              >
                                Admin
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Email Address</label>
                        <input 
                          type="email" 
                          required 
                          value={authEmail} 
                          onChange={e => setAuthEmail(e.target.value)}
                          placeholder="rider@vuu.com" 
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Password</label>
                        <input 
                          type="password" 
                          required 
                          value={authPassword} 
                          onChange={e => setAuthPassword(e.target.value)}
                          placeholder="••••••••" 
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>

                      <button 
                        type="submit" 
                        className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs py-3 rounded-xl transition-colors shadow-lg shadow-amber-400/10 flex items-center justify-center gap-1.5"
                      >
                        {isRegistering ? 'Complete Registration' : 'Secure Login'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  </div>

                  <div className="text-center pt-4 border-t border-slate-900">
                    <button 
                      onClick={() => {
                        setIsRegistering(!isRegistering);
                        clearError();
                      }}
                      className="text-amber-400 font-bold hover:underline text-xs"
                    >
                      {isRegistering ? 'Already have an account? Sign In' : "Don't have an account yet? Create one"}
                    </button>
                  </div>
                </div>
              ) : (
                /* AUTHENTICATED WORKFLOW HOME PANEL */
                <div className="flex-1 flex flex-col bg-[#070b16] overflow-y-auto">
                  
                  {/* APP SUB-HEADER HEADER WITH APP LOGO & PROFILE CARD */}
                  <div className="p-4 bg-slate-950 border-b border-slate-900 flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'} 
                        alt="Profile avatar"
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-slate-800"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white leading-none">{profile?.full_name}</span>
                          <span className={`text-[8px] font-mono font-black uppercase tracking-wider px-1 py-[1px] rounded ${profile?.role === 'driver' ? 'bg-amber-400 text-slate-950' : 'bg-blue-600 text-white'}`}>
                            {profile?.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-none">{profile?.email}</p>
                      </div>
                    </div>

                    <button 
                      onClick={signOut}
                      className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-rose-950/20 hover:text-rose-400 text-slate-400 transition-colors flex items-center justify-center border border-slate-800"
                      title="Log Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>

                  {/* ACTIVE TAB CONTROL VIEW - SETTINGS AND PROFILE CHANGER */}
                  {activeTab === 'settings' ? (
                    <div className="flex-1 p-5 space-y-5">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-900">
                        <UserIcon className="w-4.5 h-4.5 text-amber-400" />
                        <h3 className="text-sm font-bold text-white">Profile Customizer</h3>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Full Name</label>
                          <input 
                            type="text" 
                            value={profile?.full_name || ''} 
                            onChange={(e) => updateProfile({ full_name: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Phone Number</label>
                          <input 
                            type="text" 
                            value={profile?.phone || ''} 
                            onChange={(e) => updateProfile({ phone: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Database Profile ID</label>
                          <div className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2 text-xs text-slate-400 overflow-x-auto select-all font-mono">
                            {profile?.id}
                          </div>
                        </div>

                        <div className="pt-4">
                          <button 
                            onClick={() => setActiveTab('portal')}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold py-2.5 rounded-lg transition-colors"
                          >
                            Return to Portal
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : activeTab === 'portal' ? (
                    <div className="flex-1 p-4 overflow-y-auto">
                      <Home />
                    </div>
                  ) : activeTab === 'chat' ? (
                    <div className="flex-1 p-4 overflow-y-auto">
                      <Chat />
                    </div>
                  ) : activeTab === 'admin' ? (
                    <div className="flex-1 p-4 overflow-y-auto">
                      <AdminDashboard />
                    </div>
                  ) : (
                    /* HOME CONSOLE CORE - RIDER VS DRIVER SCREENS */
                    <div className="flex-1 flex flex-col p-4 space-y-4">
                      
                      {/* Elite Trust & Safety SOS Gateway */}
                      <SafetyToggle />
                      
                      {/* 🏍️ RIDER VIEW */}
                      {profile?.role === 'rider' && (
                        <div className="flex-1 flex flex-col gap-4">
                          
                          {/* Live Interactive Map Pin Visualizer */}
                          {renderMockMap()}

                          {/* Render booking controls based on active booking state */}
                          {!activeRide && !isSearching ? (
                            <div className="space-y-4 flex-1">
                              {/* Travel Form Header */}
                              <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Book VUU Premium</h3>
                                <button 
                                  onClick={() => setShowHistory(!showHistory)}
                                  className="text-[10px] font-extrabold text-amber-400 underline hover:text-amber-500"
                                >
                                  {showHistory ? 'New Booking' : 'Ride History'}
                                </button>
                              </div>

                              {showHistory ? (
                                <div className="space-y-2.5 max-h-56 overflow-y-auto">
                                  {displayHistory.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic text-center py-6 bg-slate-950 rounded-xl border border-dashed border-slate-900">
                                      No recent ride history recorded on account.
                                    </p>
                                  ) : (
                                    displayHistory.map((h, i) => (
                                      <div key={i} className="bg-slate-900/40 border border-slate-900 p-3 rounded-xl flex justify-between items-center text-xs">
                                        <div className="space-y-0.5">
                                          <p className="text-white font-bold truncate max-w-[140px]">{h.destination}</p>
                                          <p className="text-[10px] text-slate-400">{h.pickup}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1.5 min-w-[70px]">
                                          <p className="text-amber-400 font-extrabold font-mono leading-none">${h.fare.toFixed(2)}</p>
                                          <div className="flex items-center gap-1 leading-none">
                                            <button
                                              onClick={() => setDisputingRide(h)}
                                              className="text-[9px] text-rose-455 hover:text-rose-400 underline font-extrabold mr-1 cursor-pointer"
                                            >
                                              Dispute
                                            </button>
                                            <span className={`text-[8px] uppercase font-bold leading-none ${h.status === 'completed' || h.status === 'paid' ? 'text-emerald-500' : 'text-slate-500'}`}>
                                              {h.status}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              ) : (
                                <>
                                  {/* Presets Grid */}
                                  <div className="bg-slate-900/30 p-2.5 rounded-xl border border-slate-950">
                                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-2">Preset Destination Coordinates</span>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button 
                                        onClick={() => handlePresetSelect('Gare du Nord', 'Eiffel Tower')}
                                        className="bg-slate-950 hover:bg-slate-900 border border-slate-900 text-[10px] text-left p-2 rounded-lg transition-colors flex flex-col"
                                      >
                                        <span className="text-slate-400 font-bold truncate">🗼 Eiffel Tower</span>
                                        <span className="text-slate-500 mt-0.5 text-[9px]">Gare du Nord start</span>
                                      </button>
                                      <button 
                                        onClick={() => handlePresetSelect('Champs-Élysées', 'Louvre Museum')}
                                        className="bg-slate-950 hover:bg-slate-900 border border-slate-900 text-[10px] text-left p-2 rounded-lg transition-colors flex flex-col"
                                      >
                                        <span className="text-slate-400 font-bold truncate">🏛️ Louvre Museum</span>
                                        <span className="text-slate-500 mt-0.5 text-[9px]">Champs-Élysées</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Inputs */}
                                  <div className="space-y-2">
                                    <div className="bg-slate-900 rounded-xl px-3 py-2 border border-slate-800 flex items-center gap-2.5">
                                      <MapPin className="w-4.5 h-4.5 text-blue-400 shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <span className="text-[8px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Pickup point</span>
                                        <input 
                                          type="text" 
                                          value={pickupAddr} 
                                          onChange={e => setPickupAddr(e.target.value)}
                                          className="bg-transparent text-xs text-white w-full border-none p-0 focus:outline-none"
                                        />
                                      </div>
                                    </div>

                                    <div className="bg-slate-900 rounded-xl px-3 py-2 border border-slate-800 flex items-center gap-2.5">
                                      <Navigation className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <span className="text-[8px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Going to</span>
                                        <input 
                                          type="text" 
                                          value={destAddr} 
                                          onChange={e => setDestAddr(e.target.value)}
                                          placeholder="Where to?"
                                          className="bg-transparent text-xs text-white w-full border-none p-0 focus:outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Vehicle selectors */}
                                  <div>
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2 font-bold">Select Ride Tier</span>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      {(Object.keys(pricing) as Array<keyof typeof pricing>).map((tier) => {
                                        const t = pricing[tier];
                                        const Icon = t.icon;
                                        return (
                                          <button
                                            key={tier}
                                            onClick={() => setSelectedRideType(tier)}
                                            className={`p-3 rounded-xl text-left border flex flex-col gap-1 transition-all ${selectedRideType === tier ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-md shadow-amber-400/10' : 'bg-slate-900 hover:bg-slate-900/80 border-slate-850 text-white'}`}
                                          >
                                            <div className="flex items-center justify-between w-full">
                                              <Icon className="w-4 h-4" />
                                              <span className="font-extrabold font-mono text-xs">${t.price.toFixed(2)}</span>
                                            </div>
                                            <span className="font-bold text-xs leading-none mt-1.5">{t.label}</span>
                                            <span className={`text-[8.5px] leading-tight truncate ${selectedRideType === tier ? 'text-slate-800' : 'text-slate-400'}`}>{t.desc}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Request Button */}
                                  <button
                                    onClick={() => requestRide(pickupAddr, destAddr, selectedRideType, pricing[selectedRideType].price)}
                                    className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs py-3 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-1.5"
                                  >
                                    <Car className="w-4 h-4" />
                                    Confirm Ride Booking • ${pricing[selectedRideType].price.toFixed(2)}
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            /* ACTIVE RIDE SCREEN FOR RIDER */
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-4">
                              <div className="flex justify-between items-center text-xs">
                                <div>
                                  <p className="text-xs text-slate-400 uppercase font-mono tracking-wider font-bold">Active Trip Status</p>
                                  <h4 className="text-sm font-bold text-amber-400 mt-1 uppercase flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                                    {activeRide?.status === 'searching' && 'Locating drivers...'}
                                    {activeRide?.status === 'accepted' && 'Driver matched'}
                                    {activeRide?.status === 'arriving' && 'Driver is arriving'}
                                    {activeRide?.status === 'in_progress' && 'Trip in progress'}
                                    {activeRide?.status === 'completed' && 'Trip Completed'}
                                  </h4>
                                </div>
                                <div className="text-right font-mono">
                                  <span className="text-xs text-slate-400 block font-bold">FARE CAP</span>
                                  <span className="text-sm font-extrabold text-white">${activeRide?.fare.toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-amber-400 transition-all duration-1000 ease-in-out"
                                  style={{ 
                                    width: 
                                      activeRide?.status === 'searching' ? '15%' :
                                      activeRide?.status === 'accepted' ? '40%' :
                                      activeRide?.status === 'arriving' ? '70%' :
                                      activeRide?.status === 'in_progress' ? '90%' : '100%'
                                  }}
                                />
                              </div>

                              {/* Driver description card */}
                              {activeRide?.driverId ? (
                                <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex justify-between items-center gap-3">
                                  <div className="flex items-center gap-2.5">
                                    <img 
                                      src={activeRide.driverAvatar} 
                                      alt="Driver avatar"
                                      referrerPolicy="no-referrer"
                                      className="w-10 h-10 rounded-full object-cover border border-slate-800"
                                    />
                                    <div>
                                      <h5 className="text-xs font-bold text-white">{activeRide.driverName}</h5>
                                      <p className="text-[10px] text-amber-400 font-semibold">{activeRide.vehicleInfo}</p>
                                    </div>
                                  </div>
                                  <div className="text-right text-[10.5px]">
                                    <span className="text-emerald-500 font-extrabold flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      {activeRide.status === 'in_progress' ? '7 mins left' : `${activeRide.etaMinutes} min away`}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-4 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-dashed border-slate-900 italic">
                                  Assigning nearest driver partner with optimal rating...
                                </div>
                              )}

                              {/* Trip route specs */}
                              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-900 font-mono text-slate-400">
                                <div>
                                  <span className="text-[8.5px] text-slate-500 block uppercase font-bold mb-0.5">Pickup Point</span>
                                  <p className="text-white font-bold text-[10.5px] truncate">{activeRide?.pickup}</p>
                                </div>
                                <div>
                                  <span className="text-[8.5px] text-slate-500 block uppercase font-bold mb-0.5">Drop Destination</span>
                                  <p className="text-white font-bold text-[10.5px] truncate">{activeRide?.destination}</p>
                                </div>
                              </div>

                              {/* Control Buttons */}
                              <div className="pt-2">
                                {activeRide?.status === 'in_progress' ? (
                                  <button 
                                    onClick={completeRide}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Complete simulated trip
                                  </button>
                                ) : (
                                  <button 
                                    onClick={cancelRide}
                                    className="w-full bg-slate-950 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-800 text-slate-400 text-xs font-bold py-2.5 rounded-xl transition-colors"
                                  >
                                    Cancel Booking
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Trigger rating overlay once simulated trip is completed! */}
                          {/* Settle Payment after ride is completed */}
                          {displayHistory[0]?.status === 'completed' && (
                            <div className="space-y-3 animate-scaleIn">
                              <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-4 text-xs font-semibold text-amber-300 flex items-center gap-2">
                                <Sparkles className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
                                <span>Trip completed! Please settle your fare below:</span>
                              </div>
                              <PaymentForm 
                                ride={displayHistory[0]} 
                                onPaymentSuccess={() => {
                                  console.log('Rider custom payment approved.');
                                }}
                              />
                            </div>
                          )}

                          {/* Trigger rating overlay once payment is successfully settled! */}
                          {displayHistory[0]?.status === 'paid' && !hasRated && (
                            <RatingSystem 
                              ride={displayHistory[0]} 
                              onRatingSubmitted={(stars, comment) => {
                                setTripRating(stars);
                                setHasRated(true);
                              }}
                            />
                          )}

                        </div>
                      )}

                      {/* 🚗 DRIVER VIEW SCREEN */}
                      {profile?.role === 'driver' && (
                        <div className="flex-1 flex flex-col gap-4">
                          
                          {/* Driver stats row */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                              <div>
                                <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider font-mono">Fare earnings today</span>
                                <p className="text-base font-extrabold font-mono text-white mt-1">${earnings.toFixed(2)}</p>
                              </div>
                              <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" />
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                              <div>
                                <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider font-mono">Trips completed</span>
                                <p className="text-base font-extrabold font-mono text-white mt-1">{completedTrips}</p>
                              </div>
                              <Activity className="w-5 h-5 text-blue-400 shrink-0" />
                            </div>
                          </div>

                          {/* Online Toggle */}
                          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                              <span className="font-bold text-white">Status: {isOnline ? 'ONLINE (Accepting)' : 'OFFLINE'}</span>
                            </div>
                            <button
                              onClick={() => setIsOnline(!isOnline)}
                              className={`px-3 py-1.5 font-extrabold rounded-lg tracking-wide uppercase text-[10px] transition-all ${isOnline ? 'bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/20 text-rose-400' : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'}`}
                            >
                              {isOnline ? 'Go Offline' : 'Go Online'}
                            </button>
                          </div>

                          {/* Rider Match SVG map visualization */}
                          {renderMockMap()}

                          {/* Driver Queue list / Ongoing Ride controller */}
                          {activeRide ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-4">
                              <div className="flex justify-between items-center text-xs">
                                <div>
                                  <p className="text-[10px] text-slate-450 uppercase font-mono tracking-wider font-bold">Active Driver Route</p>
                                  <h4 className="text-sm font-bold text-amber-400 capitalize mt-1.5 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                    {activeRide.status === 'accepted' && 'Driving to Pick Rider'}
                                    {activeRide.status === 'arriving' && 'Arrived at Pick location'}
                                    {activeRide.status === 'in_progress' && 'Driving to Destination'}
                                  </h4>
                                </div>
                                <div className="text-right font-mono text-xs">
                                  <span className="text-slate-400 block font-bold">FARE</span>
                                  <span className="text-sm font-extrabold text-white">${activeRide.fare.toFixed(2)}</span>
                                </div>
                              </div>

                              <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex justify-between items-center text-xs gap-3">
                                <div className="flex items-center gap-2.5">
                                  <img 
                                    src={activeRide.riderAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100'} 
                                    alt="Rider avatar"
                                    referrerPolicy="no-referrer"
                                    className="w-10 h-10 rounded-full object-cover border border-slate-800"
                                  />
                                  <div>
                                    <h5 className="text-xs font-bold text-white leading-none">{activeRide.riderName}</h5>
                                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 text-slate-500">
                                      <Phone className="w-3 h-3 text-slate-500" />
                                      {activeRide.riderPhone}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-[11px] bg-slate-950 p-2.5 rounded-xl border border-slate-900 font-mono text-slate-400">
                                <div>
                                  <span className="text-[9px] text-slate-500 block uppercase font-bold mb-0.5">Origin Location</span>
                                  <p className="text-white font-bold truncate">{activeRide.pickup}</p>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 block uppercase font-bold mb-0.5">Drop Coordinates</span>
                                  <p className="text-white font-bold truncate">{activeRide.destination}</p>
                                </div>
                              </div>

                              {/* Drive step simulator */}
                              <div className="grid grid-cols-2 gap-2">
                                {activeRide.status === 'accepted' && (
                                  <button
                                    onClick={() => updateRideStatus('arriving')}
                                    className="col-span-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md"
                                  >
                                    Signify Arrival at Pickup
                                  </button>
                                )}
                                {activeRide.status === 'arriving' && (
                                  <button
                                    onClick={() => updateRideStatus('in_progress')}
                                    className="col-span-2 bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md"
                                  >
                                    Start Trip / Commute
                                  </button>
                                )}
                                {activeRide.status === 'in_progress' && (
                                  <button
                                    onClick={() => {
                                      setEarnings(earnings + activeRide.fare);
                                      setCompletedTrips(completedTrips + 1);
                                      completeRide();
                                    }}
                                    className="col-span-2 bg-emerald-500 hover:bg-emerald-650 text-slate-950 font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md"
                                  >
                                    Mark as Completed & Collect Fare
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* DRIVER OPEN QUEUE FEED LIST */
                            <div className="space-y-3.5 flex-1 select-none">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Rider Request Dispatch Channel ({driverQueue.length})
                              </h3>

                              {!isOnline ? (
                                <div className="text-center py-8 bg-slate-950 rounded-2xl border border-dashed border-slate-900 flex flex-col items-center justify-center gap-1.5">
                                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                                  <span className="text-xs font-semibold text-slate-400">You are offline.</span>
                                  <p className="text-[10px] text-slate-500 max-w-[200px] mt-0.5">
                                    Turn online status switch ON to receive and accept match dispatch coords in real-time.
                                  </p>
                                </div>
                              ) : driverQueue.length === 0 ? (
                                <div className="text-center py-8 bg-slate-950 rounded-2xl border border-dashed border-slate-900 text-slate-500 italic text-[11px]">
                                  Listening for live rider notifications in Paris region...
                                </div>
                              ) : (
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                  {driverQueue.map((req) => (
                                    <div key={req.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                                      <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                          <img 
                                            src={req.riderAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100'} 
                                            alt="Rider avatar"
                                            referrerPolicy="no-referrer"
                                            className="w-8 h-8 rounded-full object-cover border border-slate-800"
                                          />
                                          <div>
                                            <p className="text-white font-bold leading-none">{req.riderName}</p>
                                            <span className="text-[9px] text-slate-450 mt-1 block uppercase font-mono font-bold text-amber-400">
                                              VUU {req.rideType}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-emerald-400 font-extrabold font-mono text-[13px]">${req.fare.toFixed(2)}</p>
                                          <span className="text-[8.5px] text-slate-500 font-bold block mt-0.5">{req.distance} • {req.duration}</span>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 text-[10.5px] bg-slate-950 px-2.5 py-2 rounded-lg font-mono text-slate-500">
                                        <div className="truncate">
                                          <strong className="text-slate-400">FROM:</strong> {req.pickup}
                                        </div>
                                        <div className="truncate">
                                          <strong className="text-slate-400">TO:</strong> {req.destination}
                                        </div>
                                      </div>

                                      <button
                                        onClick={() => acceptRide(req.id, profile?.full_name || 'Partner', profile?.phone || '+33 601', 'Private Tesla (VUU-ECO-FR)')}
                                        className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-[11px] py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                                      >
                                        Accept Request • {req.distance} away
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  )}

                  {/* BOTTOM SCREEN CONTROL MENU RAILS */}
                  <div className={`p-3 bg-slate-950 border-t border-slate-900 grid ${profile?.role === 'admin' ? 'grid-cols-5' : 'grid-cols-4'} gap-1 text-center select-none z-10 text-[11px]`}>
                    <button 
                      onClick={() => setActiveTab('portal')}
                      className={`py-2 rounded-xl font-extrabold flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'portal' ? 'text-emerald-400 bg-slate-900 border border-emerald-950/20' : 'text-slate-500 hover:text-slate-400'}`}
                    >
                      <Car className="w-4 h-4" />
                      <span>VUU Portal</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('home')}
                      className={`py-2 rounded-xl font-extrabold flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'home' ? 'text-amber-400 bg-slate-900' : 'text-slate-500 hover:text-slate-400'}`}
                    >
                      <Map className="w-4 h-4" />
                      <span>Live Tracks</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('chat')}
                      className={`py-2 rounded-xl font-extrabold flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'chat' ? 'text-amber-400 bg-slate-900' : 'text-slate-500 hover:text-slate-400'}`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>AI Chat</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className={`py-2 rounded-xl font-extrabold flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-amber-400 bg-slate-900' : 'text-slate-500 hover:text-slate-400'}`}
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>My Profile</span>
                    </button>
                    {profile?.role === 'admin' && (
                      <button 
                        onClick={() => setActiveTab('admin')}
                        className={`py-2 rounded-xl font-extrabold flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'admin' ? 'text-amber-400 bg-slate-900 border border-slate-800' : 'text-slate-500 hover:text-slate-400'}`}
                      >
                        <Shield className="w-4 h-4 text-amber-500" />
                        <span>Admin</span>
                      </button>
                    )}
                  </div>

                </div>
              )}

            </div>

          </div>

          {/* Minimalist layout credits */}
          <span className="text-[10px] font-mono text-slate-600 mt-4 uppercase tracking-widest block">
            Powered by Google AI Studio
          </span>

        </section>

      </main>

      {/* Dispute Case Resolution Form Modal Overlay */}
      {disputingRide && (
        <DisputeForm 
          ride={disputingRide} 
          onClose={() => setDisputingRide(null)}
          onSubmitted={() => setDisputingRide(null)}
        />
      )}
    </div>
  );
}

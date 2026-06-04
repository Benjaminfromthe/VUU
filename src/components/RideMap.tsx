import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRideStore } from '../store/useRideStore';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Info, 
  Loader2, 
  ShieldAlert,
  Map as MapIcon
} from 'lucide-react';

// Map Auto-Center Controller Helper component
function ChangeMapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function RideMap() {
  const { activeRide } = useRideStore();
  const [coords, setCoords] = useState<[number, number]>([48.8566, 2.3522]); // Fallback GPS (Paris Center)
  const [riderCoords, setRiderCoords] = useState<[number, number] | null>(null);
  const [coordsLoading, setCoordsLoading] = useState(true);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // 1. Gather browser geolocation coordinates
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setCoordsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setCoords([userLat, userLng]);
        setCoordsLoading(false);
        
        // If there is an accepted ride, simulate a rider/driver coordinate slightly offset 
        // to render on screen close to the user!
        if (activeRide && activeRide.status === 'accepted') {
          setRiderCoords([userLat + 0.005, userLng - 0.004]);
        } else {
          setRiderCoords(null);
        }
      },
      (err) => {
        console.warn('Geolocation access restricted:', err.message);
        setGpsError('Standard coordinates fallback. Check location and frame permissions.');
        setCoordsLoading(false);
        
        // Offset fallback coordinates for the demo matched driver
        if (activeRide && activeRide.status === 'accepted') {
          setRiderCoords([48.8566 + 0.005, 2.3522 - 0.004]);
        } else {
          setRiderCoords(null);
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [activeRide?.id, activeRide?.status]);

  // Simulate rider coordinate movement slightly over time for visual tracking simulation
  useEffect(() => {
    if (!riderCoords || !activeRide || activeRide.status !== 'accepted') return;

    const interval = setInterval(() => {
      setRiderCoords((prev) => {
        if (!prev) return null;
        // Step slightly closer to the user coordinates
        const [rLat, rLng] = prev;
        const [uLat, uLng] = coords;
        const stepLat = (uLat - rLat) * 0.08;
        const stepLng = (uLng - rLng) * 0.08;
        
        // Stop moving if extremely close to avoid infinite minor increments
        if (Math.abs(stepLat) < 0.0001 && Math.abs(stepLng) < 0.0001) {
          clearInterval(interval);
          return prev;
        }

        return [rLat + stepLat, rLng + stepLng];
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [riderCoords, coords, activeRide?.status]);

  // Create highly beautiful, modern neon marker icons bypassing default Leaflet loader bugs
  const customerIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-indigo-500/30 opacity-75"></span>
        <div class="w-8.5 h-8.5 rounded-2xl bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-xs shadow-lg shadow-indigo-600/40 font-bold">
          👤
        </div>
      </div>
    `,
    className: 'custom-marker-chassis',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17]
  });

  const driverCarrierIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <span class="absolute inline-flex h-9 w-9 animate-ping rounded-full bg-emerald-500/40 opacity-75"></span>
        <div class="w-9 h-9 rounded-2xl bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-xs shadow-lg shadow-emerald-500/40 font-bold">
          🚗
        </div>
      </div>
    `,
    className: 'custom-marker-chassis',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col h-full min-h-[460px]" id="vuu-live-track-map">
      
      {/* MAP CONTROLLERS TOP rail */}
      <div className="bg-slate-950 p-4 border-b border-slate-850 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/35 flex items-center justify-center text-indigo-400">
            <MapIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">Live Tracking Map</h4>
            {gpsError ? (
              <span className="text-[9.5px] font-semibold text-amber-400 block mt-0.5">{gpsError}</span>
            ) : (
              <span className="text-[9.5px] font-semibold text-slate-500 block mt-0.5">Sourcing real-time coordinate streams</span>
            )}
          </div>
        </div>

        {coordsLoading ? (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Resolving GPS...</span>
          </div>
        ) : (
          <div className="bg-slate-900/60 text-[10px] text-slate-400 px-2.5 py-1.5 border border-slate-850 rounded-lg font-mono">
            lat: {coords[0].toFixed(4)}, lng: {coords[1].toFixed(4)}
          </div>
        )}
      </div>

      {/* CORE LEAFLET MAP ELEMENT */}
      <div className="flex-1 relative min-h-[300px] z-0">
        
        {/* Loader Overlap */}
        {coordsLoading && (
          <div className="absolute inset-0 bg-slate-950/80 z-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400 font-extrabold tracking-tight">Initializing Leaflet Radar Tiles...</p>
          </div>
        )}

        <MapContainer 
          center={coords} 
          zoom={14} 
          scrollWheelZoom={true} 
          className="w-full h-full"
          style={{ height: '380px', width: '100%', background: '#020617' }}
        >
          {/* Using highly accessible, clean vector map style layers */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <ChangeMapCenter center={coords} />

          {/* User / Passenger Pin */}
          <Marker position={coords} icon={customerIcon}>
            <Popup className="custom-leaflet-popup">
              <div className="text-[10.5px] font-sans p-1">
                <p className="font-extrabold text-blue-400">Your Current Coordinate</p>
                <p className="text-slate-200 mt-0.5 font-mono">{coords[0].toFixed(5)}, {coords[1].toFixed(5)}</p>
              </div>
            </Popup>
          </Marker>

          {/* Connected Driver / Rider Pin */}
          {activeRide && activeRide.status === 'accepted' && riderCoords && (
            <Marker position={riderCoords} icon={driverCarrierIcon}>
              <Popup className="custom-leaflet-popup">
                <div className="text-[10.5px] font-sans p-1">
                  <p className="font-extrabold text-emerald-400">Matched Partner (Active Ride)</p>
                  <p className="text-slate-100 font-bold mt-0.5">{activeRide.driverName || 'Alex Driver'}</p>
                  <p className="text-[9.5px] text-slate-400">{activeRide.vehicleInfo || 'Car heading to pickup'}</p>
                </div>
              </Popup>
            </Marker>
          )}

        </MapContainer>

      </div>

      {/* FOOTER CONTROLS / METADATA SUMMARY */}
      <div className="bg-slate-950 p-4 border-t border-slate-850 flex flex-col gap-2 relative z-10 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mt-0.5">
            <Info className="w-3 h-3" />
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            {activeRide && activeRide.status === 'accepted' ? (
              <span>Your matched partner <strong className="text-white font-bold">{activeRide.driverName || 'Alex Driver'}</strong> is actively dispatched back onto your coordinate center tracking node. Open the AI Chat tab to message!</span>
            ) : (
              <span>Map centered. Book a passenger ticket on the portal or accept a dispatch request to simulate cross-coordinate proximity radars.</span>
            )}
          </p>
        </div>
      </div>

    </div>
  );
}

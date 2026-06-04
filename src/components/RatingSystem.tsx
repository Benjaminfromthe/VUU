import React, { useState } from 'react';
import { Star, MessageSquare, Send, CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { RideRequest } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

interface RatingSystemProps {
  ride: RideRequest;
  onRatingSubmitted: (rating: number, comment: string) => void;
}

export default function RatingSystem({ ride, onRatingSubmitted }: RatingSystemProps) {
  const { profile, updateProfile } = useAuthStore();
  const [stars, setStars] = useState<number>(0);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic feedback messages based on star selection
  const getFeedbackMessage = (rating: number) => {
    switch (rating) {
      case 1: return "Extremely disappointing. VUU safety command will investigate.";
      case 2: return "Suboptimal experience. Please tell us what we can improve.";
      case 3: return "Average trip. Standard VUU transit expectations.";
      case 4: return "Very good! Professional delivery.";
      case 5: return "Exemplary Rwandan hospitality! Absolute elite partner standard.";
      default: return "Select feedback star score";
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === 0) {
      setErrorMessage("Please select at least 1 star to submit your review.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Submit rating to Supabase database if configured
      if (isSupabaseConfigured) {
        const ratingRecord = {
          ride_id: ride.id,
          rater_id: profile?.id || 'anonymous_rider',
          driver_id: ride.driverId || 'simulated-driver-id',
          rating: stars,
          comment: comment.trim(),
          created_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('ratings')
          .insert([ratingRecord]);

        if (error) {
          console.warn('[Supabase Ratings Insert Failed] Proceeding with localized emulation:', error);
        }
      }

      // 2. Perform local emulation (Accountability Log) to update driver/rider profile ratings
      const driverId = ride.driverId || 'mock-driver-id';
      const mockUsersRaw = localStorage.getItem('vuu_mock_users');
      if (mockUsersRaw) {
        try {
          const users = JSON.parse(mockUsersRaw);
          const idx = users.findIndex((u: any) => u.id === driverId);
          if (idx !== -1) {
            const drv = users[idx];
            const currentTotalStars = (drv.rating || 4.78) * (drv.num_ratings || 43);
            const newCount = (drv.num_ratings || 43) + 1;
            const newAvg = Math.round(((currentTotalStars + stars) / newCount) * 100) / 100;
            
            users[idx] = {
              ...drv,
              rating: newAvg,
              num_ratings: newCount,
            };
            
            localStorage.setItem('vuu_mock_users', JSON.stringify(users));

            // Also update current active mock credentials state if they matched
            const credsRaw = localStorage.getItem('vuu_mock_credentials');
            if (credsRaw) {
              const creds = JSON.parse(credsRaw);
              for (const k of Object.keys(creds)) {
                if (creds[k].profile.id === driverId) {
                  creds[k].profile.rating = newAvg;
                  creds[k].profile.num_ratings = newCount;
                }
              }
              localStorage.setItem('vuu_mock_credentials', JSON.stringify(creds));
            }
            
            console.log(`[Accountability Log Simulated]: Updated Alex Driver average rating to ${newAvg}⭐ over ${newCount} ratings.`);
          }
        } catch (e) {
          console.error('[Error during simulated accountability ratings calculations]:', e);
        }
      }

      // 3. Complete review transition
      setSuccess(true);
      setTimeout(() => {
        onRatingSubmitted(stars, comment);
      }, 2000);

    } catch (err: any) {
      console.error('[Rating Submission Exception]:', err);
      setErrorMessage(err.message || "Failed to submit rating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-w-sm w-full select-none" id="vuu-completed-rating-suite">
      
      {/* HEADER TITLE */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-850">
        <div>
          <span className="text-[8px] font-mono text-amber-400 font-extrabold tracking-widest uppercase flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" /> PASSENGER REVIEW PORTAL
          </span>
          <h4 className="text-sm font-black text-white mt-1">Review Ride & Service</h4>
        </div>
        <div className="text-right text-[10px] font-mono text-slate-500">
          VUU Ticket {ride.id.slice(-6).toUpperCase()}
        </div>
      </div>

      {success ? (
        <div className="space-y-3 py-6 text-center flex flex-col items-center justify-center animate-scaleIn">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h5 className="font-extrabold text-white text-xs">Review Dispatched Successfully!</h5>
            <p className="text-[10px] text-slate-450 mt-1 max-w-[210px] mx-auto leading-relaxed">
              Accountability ledger updated. Thank you for making VUU Transport in Rwanda secure and hospitable!
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleRatingSubmit} className="space-y-4">
          
          {/* DRIVER PREVIEW */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex items-center gap-3">
            <img 
              src={ride.driverAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'} 
              alt="Driver avatar"
              className="w-9 h-9 rounded-xl object-cover border border-slate-800"
            />
            <div className="text-xs">
              <span className="text-[8px] font-mono text-slate-500 font-bold block leading-none uppercase">VUU DRIVER PARTNER</span>
              <h5 className="font-bold text-white mt-1 leading-none">{ride.driverName || 'Alex Driver'}</h5>
              <p className="text-[9.5px] text-amber-400 font-mono mt-1 leading-none">{ride.vehicleInfo || 'Black Tesla Model Y (VUU-982-FR)'}</p>
            </div>
          </div>

          {/* STAR RATING INTERACTION */}
          <div className="space-y-2 text-center">
            <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">
              Rate Hospitality
            </label>
            <div className="flex justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isSelected = star <= stars;
                const isHovered = star <= hoverStars;
                return (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setStars(star)}
                    onMouseEnter={() => setHoverStars(star)}
                    onMouseLeave={() => setHoverStars(0)}
                    className="p-1 hover:scale-115 transition-transform duration-100 cursor-pointer text-slate-600 focus:outline-none"
                  >
                    <Star 
                      className={`w-7 h-7 stroke-[1.5] ${
                        isHovered || isSelected 
                          ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_4px_rgba(251,191,36,0.2)]' 
                          : 'text-slate-700'
                      }`} 
                    />
                  </button>
                );
              })}
            </div>
            
            {/* Realtime contextual commentary */}
            <p className="text-[10px] text-zinc-400 font-bold font-mono h-4 italic leading-relaxed">
              {getFeedbackMessage(stars || hoverStars)}
            </p>
          </div>

          {/* DYNAMIC FEEDBACK COMMENT */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-slate-400" /> Share specific commentary (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Provide remarks about the route choice, cleanliness, or safety behaviors..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
            />
          </div>

          {errorMessage && (
            <p className="text-[10px] text-rose-450 font-bold p-2 bg-rose-950/20 border border-rose-500/10 rounded-xl">
              {errorMessage}
            </p>
          )}

          {/* BUTTON INTERACTS */}
          <button
            type="submit"
            disabled={loading || stars === 0}
            className={`w-full font-black text-slate-950 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
              loading || stars === 0 
                ? 'bg-amber-400/50 cursor-not-allowed text-slate-750' 
                : 'bg-amber-400 hover:bg-amber-500 relative overflow-hidden group shadow-amber-400/5'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Auditing score calculations...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit Accountability Review</span>
              </>
            )}
          </button>
        </form>
      )}

    </div>
  );
}

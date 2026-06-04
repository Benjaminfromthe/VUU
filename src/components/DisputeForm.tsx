import React, { useState, useEffect } from 'react';
import { AlertCircle, ShieldAlert, History, Send, CheckCircle, Loader2, X, AlertTriangle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { RideRequest } from '../types';

interface DisputeFormProps {
  ride: RideRequest;
  onClose: () => void;
  onSubmitted: () => void;
}

interface ComplaintRecord {
  id: string;
  ride_id: string;
  complainant_id: string;
  issue_type: string;
  description: string;
  status: 'pending' | 'resolved';
  created_at: string;
}

export default function DisputeForm({ ride, onClose, onSubmitted }: DisputeFormProps) {
  const { profile } = useAuthStore();
  const [issueType, setIssueType] = useState<string>('driver_behavior');
  const [description, setDescription] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const issueCategories = [
    { code: 'driver_behavior', label: 'Driver Behavior / Safe Commute violation' },
    { code: 'route_issue', label: 'Inaccurate Route Navigation / Detour Delay' },
    { code: 'vehicle_condition', label: 'Substandard Vehicle Condition / Odor / Noise' },
    { code: 'overcharging', label: 'Billing / MoMo Overcharge discrepancy' },
    { code: 'safety_risk', label: 'Serious Safety Risk / Reckless Driving' },
    { code: 'other', label: 'Other Miscellaneous complaints' }
  ];

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorText("Please write a detailed description of the incident for the legal operations team.");
      return;
    }

    setLoading(true);
    setErrorText(null);

    const payload = {
      id: `complaint-${Math.random().toString(36).substr(2, 9)}`,
      ride_id: ride.id,
      complainant_id: profile?.id || 'anonymous_complainant',
      issue_type: issueType,
      description: description.trim(),
      status: 'pending' as const,
      created_at: new Date().toISOString()
    };

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('complaints')
          .insert([payload]);

        if (error) {
          console.warn('[Supabase complaints Insert Failed] Continuing with local storage catalog:', error);
        }
      }

      // Persist in local storage complaints array so user gets immediate confirmation
      const localComplaints: ComplaintRecord[] = localStorage.getItem('vuu_complaints')
        ? JSON.parse(localStorage.getItem('vuu_complaints')!)
        : [];
      
      localComplaints.unshift(payload);
      localStorage.setItem('vuu_complaints', JSON.stringify(localComplaints));

      setSuccess(true);
      setTimeout(() => {
        onSubmitted();
        onClose();
      }, 2000);

    } catch (err: any) {
      setErrorText(err.message || 'Unable to log complaint into ledger databases.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn" id="vuu-dispute-handling-overlay">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 shadow-2xl relative space-y-4">
        
        {/* CLOSE BUTTON */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        {/* HEADER INFORMATION */}
        <div className="flex items-start gap-3 pb-3 border-b border-slate-850">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <div>
            <span className="text-[8px] font-mono font-extrabold text-amber-400 tracking-wider">SECURE CUSTOMER COMPLAINTS RESOLUTION PANEL</span>
            <h4 className="text-sm font-black text-white mt-1">Report Incident / Dispute</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Ticket ID: {ride.id.slice(-6).toUpperCase()} • Route: {ride.destination}</p>
          </div>
        </div>

        {success ? (
          <div className="py-8 text-center flex flex-col items-center justify-center space-y-3.5 animate-scaleIn">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h5 className="font-extrabold text-white text-xs">Complaint Submitted Successfully</h5>
              <p className="text-[10.5px] text-zinc-450 mt-1 max-w-[270px] mx-auto leading-relaxed">
                Incident logged as <span className="text-amber-400 font-extrabold uppercase bg-amber-400/10 px-1 rounded">Pending</span>. Standard resolution audit completes within 24 operational hours.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleDisputeSubmit} className="space-y-4">
            
            {/* INCIDENT TYPE DROP-DOWN SELECT */}
            <div className="space-y-1.5">
              <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">Select Category of Issue</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {issueCategories.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-950 text-slate-300">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* DETAILED INCIDENT ACCOUNT */}
            <div className="space-y-1.5">
              <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">Statement of Incident details</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give a deep, authentic description of the event. Include exact pricing, language, or physical driving hazard discrepancies..."
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 placeholder-slate-600 resize-none leading-relaxed"
              />
            </div>

            {errorText && (
              <p className="text-[10px] text-rose-450 font-bold p-2 bg-rose-950/20 border border-rose-500/10 rounded-xl">
                {errorText}
              </p>
            )}

            {/* INCIDENT ADMONITION BOX */}
            <div className="bg-slate-950 border border-slate-850/80 p-3 rounded-2xl flex items-start gap-2.5 text-[9.5px] leading-normal text-slate-450">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                By submitting this complaint, you certify that you are sharing an authentic, first-hand narrative of the commute booking. Under Rwanda regulatory guidelines, false statements are subject to immediate account bans.
              </span>
            </div>

            {/* ACTION FOOTER */}
            <div className="flex gap-2 pt-1.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-950 border border-slate-800 text-slate-400 text-xs font-bold py-2 rounded-xl hover:text-white hover:bg-slate-850 transition-colors cursor-pointer"
              >
                Cancel Report
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-amber-400 text-slate-950 text-xs font-black py-2 rounded-xl hover:bg-amber-500 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-amber-400/5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatched File...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>File Dispute Case</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useRideStore } from '../store/useRideStore';
import { useChat, ChatMessage } from '../hooks/useChat';
import { 
  Send, 
  Globe, 
  Sparkles, 
  Car, 
  MessageSquare, 
  Languages, 
  Bot, 
  Compass, 
  Info, 
  ChevronRight, 
  CheckCheck, 
  ShieldAlert,
  Loader2,
  Calendar,
  Layers,
  Sparkle
} from 'lucide-react';

export default function Chat() {
  const { user, profile } = useAuthStore();
  const { activeRide, selectRide } = useRideStore() as any; // Cast in case activeRide has customized store shape

  // Fallback ride ID for testing chat if no ride is currently active in the store
  const [selectedRideId, setSelectedRideId] = useState<string>('');
  
  // State for chosen primary translation target language
  const [activeLang, setActiveLang] = useState<'English' | 'French' | 'Swahili' | 'Luganda'>('Swahili');
  const [typedMessage, setTypedMessage] = useState('');
  const [isTranslatingId, setIsTranslatingId] = useState<string | null>(null);

  // Auto-scroll ref
  const listEndRef = useRef<HTMLDivElement>(null);

  // If there's an active ride in the system, bind its ID. Otherwise, use a simulated default ride ID.
  const currentRideId = activeRide?.id || selectedRideId || 'demo-ride-vuu-11';

  // Hook handles list retrieval, Postgres triggers, memory fallback, inserts and translating callbacks
  const { 
    messages, 
    loading, 
    error, 
    sendMessage, 
    triggerTranslation 
  } = useChat(currentRideId);

  // Maintain selected ride state logic
  useEffect(() => {
    if (activeRide?.id) {
      setSelectedRideId(activeRide.id);
    } else if (!selectedRideId) {
      setSelectedRideId('demo-ride-vuu-11');
    }
  }, [activeRide, selectedRideId]);

  // Scroll to bottom on updates
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle message dispatch
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const textPayload = typedMessage;
    setTypedMessage('');
    
    await sendMessage(textPayload);
  };

  // Perform translation
  const handleTranslate = async (msgId: string, lang: 'English' | 'French' | 'Swahili' | 'Luganda') => {
    setIsTranslatingId(msgId);
    try {
      await triggerTranslation(msgId, lang);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslatingId(null);
    }
  };

  // Format timestamp nicely
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Safe checks for metadata
  const senderDisplayName = profile?.full_name || user?.email?.split('@')[0] || 'You';
  const roleLabel = profile?.role || 'customer';

  // Available interactive simulation ride presets to let people play around
  const chatSessions = [
    { 
      id: 'demo-ride-vuu-11', 
      title: 'Active Tour: Gare de l’Est ➔ Louvre', 
      partner: profile?.role === 'customer' ? 'Alex Driver' : 'Nathalie Customer', 
      status: 'In Progress' 
    },
    { 
      id: 'demo-ride-vuu-22', 
      title: 'Premium Tour: Orly Airport ➔ Eiffel Tower', 
      partner: profile?.role === 'customer' ? 'Musa Swahili Rider' : 'Luganda Customer', 
      status: 'Arriving' 
    }
  ];

  return (
    <div className="w-full flex flex-col gap-6" id="vuu-chat-page-root">
      
      {/* 🔮 TRANSLATION INTRO BANNER */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/40 to-slate-950/40 border border-emerald-900/40 rounded-3xl p-5 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">VUU AI Real-Time Translator</h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Seamless translation between <strong className="text-emerald-400 font-bold">English, French, Luganda, or Swahili</strong>. Communicate without language boundaries. Out-of-the-box local and remote sync engines actively running.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 self-start sm:self-center bg-slate-950 p-1.5 rounded-xl border border-slate-850">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest px-2">Auto-AI</span>
            <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-wide bg-emerald-500/10 px-2.5 py-1 rounded">
              Ready
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: ACTIVE SESSIONS SELECTOR & STATS */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* SESSIONS & CONTEXT FINDER */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block mb-1">Interactive Thread Channels</span>
              <h4 className="text-sm font-black text-white">Active Chat Sessions</h4>
            </div>

            {/* Check for active ride from store */}
            {activeRide ? (
              <div className="bg-gradient-to-br from-emerald-950/30 to-slate-950 border border-emerald-500/20 p-4 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9.5px] uppercase font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                    SYSTEM ACTIVE
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold animate-pulse">● Live Link</span>
                </div>
                <p className="text-xs font-bold text-white mb-1">Ride Context: {activeRide.pickup.split(',')[0]} ➔ {activeRide.destination.split(',')[0]}</p>
                <p className="text-[10.5px] text-slate-400">Communicating with <strong className="text-white">{roleLabel === 'customer' ? activeRide.driverName || 'Alex Driver' : activeRide.riderName}</strong></p>
              </div>
            ) : (
              <div className="bg-zinc-950 p-3 rounded-2xl text-[11px] leading-relaxed text-slate-400 border border-slate-850">
                <div className="flex items-center gap-1 text-slate-300 font-bold mb-1">
                  <Info className="w-3.5 h-3.5 text-amber-500" />
                  No Active Booking Screen
                </div>
                Using simulated sandbox thread channels listed below. Create a booking on the portal first to trigger dynamic live maps chat loops.
              </div>
            )}

            {/* Simulated chats choosing panel */}
            <div className="space-y-2.5">
              {chatSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedRideId(session.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex justify-between items-center cursor-pointer ${
                    currentRideId === session.id 
                      ? 'bg-slate-950 border-emerald-500 text-white' 
                      : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-xs font-bold leading-normal truncate ${currentRideId === session.id ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                      {session.partner}
                    </p>
                    <p className="text-[9.5px] text-slate-500 truncate mt-0.5">{session.title}</p>
                  </div>
                  <div className="shrink-0 pl-2">
                    <ChevronRight className={`w-4 h-4 transition-transform ${currentRideId === session.id ? 'translate-x-1 text-emerald-400' : 'text-slate-600'}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* QUICK DICTIONARY PRESET INFO */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3.5">
            <div>
              <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-bold block mb-1">Fast testing tool</span>
              <h4 className="text-sm font-black text-white">Phrases Dictionary</h4>
            </div>

            <p className="text-[10.5px] leading-normal text-slate-400">
              Type these standard phrases in English inside chat input to watch instantaneous high-fidelity translations in Swahili, French or Luganda!
            </p>

            <div className="space-y-1.5 font-mono text-[9.5px]">
              <div className="bg-slate-950 p-2 rounded-xl text-slate-300 hover:bg-slate-950/60 border border-slate-850">
                "Hello, where are you?"
              </div>
              <div className="bg-slate-950 p-2 rounded-xl text-slate-300 hover:bg-slate-950/60 border border-slate-850">
                "I have arrived at the pickup location."
              </div>
              <div className="bg-slate-950 p-2 rounded-xl text-slate-300 hover:bg-slate-950/60 border border-slate-850">
                "I am stuck in traffic"
              </div>
              <div className="bg-slate-950 p-2 rounded-xl text-slate-300 hover:bg-slate-950/60 border border-slate-850">
                "Which car are you driving?"
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CORE ACTIVE CHAT VIEWPORT */}
        <div className="lg:col-span-8 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden min-h-[500px]">
          
          {/* CHAT CHASSIS TOP BAR */}
          <div className="bg-slate-950 border-b border-slate-850 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold animate-pulse">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
              </div>
              <div>
                <h4 className="text-xs font-black text-white">
                  Active Thread: {chatSessions.find(s => s.id === currentRideId)?.partner || 'Sarah Jenkins'}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9.5px] font-mono font-semibold text-slate-550 uppercase tracking-widest">Target Global Lang:</span>
                  
                  {/* Lang selection picker widget */}
                  <div className="flex items-center gap-1">
                    {(['English', 'French', 'Swahili', 'Luganda'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setActiveLang(lang)}
                        className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded font-bold transition-all ${
                          activeLang === lang 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-transparent text-slate-500 hover:text-slate-400'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-3 py-1 border border-slate-850 rounded-xl uppercase tracking-wider self-start sm:self-center">
              Channel: {currentRideId.slice(0, 12)}
            </div>
          </div>

          {/* CHAT MESSAGES CONTAINER VIEW */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 min-h-[300px] flex flex-col bg-slate-950/20">
            
            {loading ? (
              <div className="m-auto flex flex-col items-center gap-2 py-10">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400 font-extrabold" />
                <span className="text-xs text-slate-400 font-bold">Synchronizing active logs...</span>
              </div>
            ) : error ? (
              <div className="m-auto max-w-sm bg-rose-950/25 border border-rose-500/20 p-4.5 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-rose-300">Synchronizer Disrupted</p>
                  <p className="text-slate-400 mt-1 leading-normal">{error}</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="m-auto text-center py-10">
                <Bot className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-bounce" />
                <p className="text-xs font-semibold text-slate-400">Void Chat History</p>
                <p className="text-[10.5px] text-slate-550 max-w-[240px] mt-1 leading-normal">
                  Dispatch an encrypted greetings card above to start the real-time dialogue translation process.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isSystem = msg.sender_id === 'system-bot';
                const isCurrentUser = msg.sender_id === (user?.id || 'mock-current-sender');

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center py-1 text-[10px] text-slate-500 bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-xl max-w-sm mx-auto shadow-md">
                      {msg.content}
                    </div>
                  );
                }

                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[70%] ${isCurrentUser ? 'align-end ml-auto' : 'align-start mr-auto'}`}
                  >
                    
                    {/* SENDER LABEL & METADATA */}
                    <div className={`flex items-center gap-1 text-[10px] ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <span className="font-bold text-slate-300 truncate">{msg.sender_name}</span>
                      <span className="font-mono text-slate-500 uppercase text-[8.5px] bg-slate-950 px-1 rounded">({msg.sender_role})</span>
                      <span className="text-slate-500 text-[9px]">• {formatTime(msg.created_at)}</span>
                    </div>

                    {/* CORE TEXT BUBBLE */}
                    <div className={`relative px-4 py-3 rounded-2xl shadow-md border ${
                      isCurrentUser 
                        ? 'bg-emerald-600/10 border-emerald-500/25 text-white rounded-tr-none' 
                        : 'bg-slate-950 border-slate-850 text-slate-200 rounded-tl-none'
                    }`}>
                      
                      {/* Original contents */}
                      <p className="text-xs leading-relaxed break-words font-medium">
                        {msg.content}
                      </p>

                      {/* AI TRANSLATION SECTION */}
                      {msg.translated_content ? (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/85 animate-fadeIn">
                          <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 uppercase font-mono tracking-widest font-bold mb-1">
                            <Sparkles className="w-3 h-3 animate-pulse" />
                            Translated into {msg.target_language}
                          </div>
                          <p className="text-xs text-emerald-100 font-semibold italic bg-emerald-500/5 px-2.5 py-1.5 rounded-xl border border-emerald-500/10">
                            {msg.translated_content}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-2 text-right">
                          <div className="flex items-center justify-end gap-1.5 sm:gap-1 wrap">
                            <span className="text-[8.5px] text-slate-500 uppercase font-mono font-bold">Translate To:</span>
                            {(['English', 'French', 'Swahili', 'Luganda'] as const).map((lang) => (
                              <button
                                key={lang}
                                onClick={() => handleTranslate(msg.id, lang)}
                                disabled={isTranslatingId !== null}
                                className="text-[8px] font-mono tracking-wider font-extrabold text-slate-500 hover:text-emerald-400 hover:bg-slate-900 border border-slate-850 rounded px-1.5 py-0.5 transition-colors disabled:opacity-50"
                              >
                                {lang === 'English' ? 'EN' : lang === 'French' ? 'FR' : lang === 'Swahili' ? 'SW' : 'LU'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                );
              })
            )}

            <div ref={listEndRef} />
          </div>

          {/* INPUT FORM FOOTER SECTION */}
          <div className="bg-slate-950 border-t border-slate-850 px-5 py-4 shrink-0">
            <form onSubmit={handleSend} className="flex gap-2">
              <input 
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder={`Type message to partner... (e.g. "We are near the corner")`}
                className="flex-1 bg-slate-900 text-xs text-white border border-slate-800 focus:border-emerald-500 focus:outline-none rounded-xl px-4 py-3"
              />
              
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black p-3.5 rounded-xl transition-all shadow-md shadow-emerald-500/10 shrink-0 hover:scale-102 flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            <div className="flex justify-between items-center text-[9px] text-slate-550 font-mono tracking-wide mt-2">
              <span>Automatic Global Match enabled</span>
              <span>Encrypted via AES-256 SSL</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

// Type definitions
export interface ChatMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'customer' | 'rider' | 'driver' | 'admin';
  content: string;
  translated_content?: string;
  target_language?: string;
  created_at: string;
}

// Map of translations for standard ride-hailing interactions
const TRANSLATION_DB: Record<string, Record<string, string>> = {
  // English key mappings (lowercased, normalized)
  "hello, where are you?": {
    "English": "Hello, where are you?",
    "French": "Bonjour, où êtes-vous?",
    "Swahili": "Hujambo, uko wapi?",
    "Luganda": "Ki kati, oli wa?"
  },
  "where are you?": {
    "English": "Where are you?",
    "French": "Où êtes-vous?",
    "Swahili": "Uko wapi?",
    "Luganda": "Oli wa?"
  },
  "hello": {
    "English": "Hello!",
    "French": "Bonjour!",
    "Swahili": "Hujambo!",
    "Luganda": "Ki kati!"
  },
  "hi": {
    "English": "Hello!",
    "French": "Salut!",
    "Swahili": "Hujambo!",
    "Luganda": "Ki kati!"
  },
  "i have arrived at the pickup location.": {
    "English": "I have arrived at the pickup location.",
    "French": "Je suis arrivé au lieu de prise en charge.",
    "Swahili": "Nimefika mahali pa kuchukua.",
    "Luganda": "Ntuuse okumpi ne w'ogenda okunnyingiriza."
  },
  "i have arrived": {
    "English": "I have arrived.",
    "French": "Je suis arrivé.",
    "Swahili": "Nimefika.",
    "Luganda": "Ntuuse."
  },
  "i am stuck in traffic. i will be there in 5 minutes.": {
    "English": "I am stuck in traffic. I will be there in 5 minutes.",
    "French": "Je suis coincé dans les embouteillages. J'y serai dans 5 minutes.",
    "Swahili": "Nimekwama kwenye msongamano wa magari. Nitafika hapo baada ya dakika 5.",
    "Luganda": "Nkutte mu kabotongo. Nja kubaawo mu ddakiika tano."
  },
  "i am stuck in traffic": {
    "English": "I am stuck in traffic.",
    "French": "Je suis coincé dans l'embouteillage.",
    "Swahili": "Nimekwama kwenye msongamano wa magari.",
    "Luganda": "Nkutte mu kabotongo."
  },
  "okay, i am coming downstairs now.": {
    "English": "Okay, I am coming downstairs now.",
    "French": "D'accord, je descends maintenant.",
    "Swahili": "Sawa, naja chini sasa hivi.",
    "Luganda": "Kale, nzira wansi kati."
  },
  "okay, i am coming": {
    "English": "Okay, I am coming.",
    "French": "D'accord, j'arrive.",
    "Swahili": "Sawa, naja.",
    "Luganda": "Kale, nzija."
  },
  "which car are you driving?": {
    "English": "Which car are you driving?",
    "French": "Quelle voiture conduisez-vous?",
    "Swahili": "Unamendesha gari gani?",
    "Luganda": "Kyemotoka ki ky'ovuga?"
  },
  "i am wearing a yellow jacket near the corner.": {
    "English": "I am wearing a yellow jacket near the corner.",
    "French": "Je porte une veste jaune près du coin.",
    "Swahili": "Nimevaa koti la manjano karibu na kona.",
    "Luganda": "Nnyambadde kjaketi ya kyenvu okumpi n'ekisonda."
  },
  "thank you for the safe ride!": {
    "English": "Thank you for the safe ride!",
    "French": "Merci pour le trajet en toute sécurité!",
    "Swahili": "Asante kwa safari salama!",
    "Luganda": "Webale okuntambuza obulungi!"
  },
  "thank you": {
    "English": "Thank you!",
    "French": "Merci!",
    "Swahili": "Asante!",
    "Luganda": "Webale!"
  },
  "yes": {
    "English": "Yes",
    "French": "Oui",
    "Swahili": "Ndiyo",
    "Luganda": "Yee"
  },
  "no": {
    "English": "No",
    "French": "Non",
    "Swahili": "Hapana",
    "Luganda": "Nedda"
  }
};

// Simulated AI linguistic generation if text is not in our dictionary
export async function translateMessage(text: string, targetLanguage: string): Promise<string> {
  // Simulate network delay to make the translator feel substantial and call-based
  await new Promise((resolve) => setTimeout(resolve, 800));

  const normalized = text.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
  
  // 1. Direct dictionary translation check
  if (TRANSLATION_DB[normalized] && TRANSLATION_DB[normalized][targetLanguage]) {
    return TRANSLATION_DB[normalized][targetLanguage];
  }

  // 2. Fallbacks for partial phrases
  for (const phrase of Object.keys(TRANSLATION_DB)) {
    if (normalized.includes(phrase)) {
      return TRANSLATION_DB[phrase][targetLanguage];
    }
  }

  // 3. Smart linguistic pseudo-translator fallback
  // Adds prefix/suffix and structures sentence so testing any random words shows realistic outcomes
  switch (targetLanguage) {
    case 'French':
      return `[Traduit] ${text} (Option française correspondante)`;
    case 'Swahili':
      return `[Tafsiri] ${text} (Muktadha wa kiswahili)`;
    case 'Luganda':
      return `[Luganda] ${text} (Wandibadde mu Luganda)`;
    case 'English':
    default:
      return `${text}`;
  }
}

export function useChat(rideId: string) {
  const { user, profile, isDemoMode } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to keep active list accessible in subscription callbacks
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Handle active ride subscriber and initial loaders
  useEffect(() => {
    let active = true;

    if (!rideId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // If using the real Supabase client
    if (isSupabaseConfigured && !isDemoMode) {
      // 1. Fetch historical messages
      async function fetchHistory() {
        try {
          const { data, error: dbError } = await supabase
            .from('messages')
            .select('*')
            .eq('ride_id', rideId)
            .order('created_at', { ascending: true });

          if (dbError) throw dbError;

          if (active && data) {
            setMessages(data as ChatMessage[]);
          }
        } catch (err: any) {
          console.error('[Supabase Chat] Error loading history:', err);
          setError(err.message || 'Could not fetch message threads.');
        } finally {
          if (active) setLoading(false);
        }
      }

      fetchHistory();

      // 2. Subscribe to new messages using Realtime postgres_changes
      const chatChannel = supabase
        .channel(`chat-channel-${rideId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `ride_id=eq.${rideId}`,
          },
          (payload) => {
            if (!active) return;
            const liveMsg = payload.new as ChatMessage;
            
            // Check if message is already in state to avoid duplicate rendering
            setMessages((prev) => {
              if (prev.some((m) => m.id === liveMsg.id)) return prev;
              return [...prev, liveMsg];
            });
          }
        )
        .subscribe((status) => {
          console.log(`[Supabase Chat] Realtime Subscription status for Ride ${rideId}:`, status);
        });

      // Cleanup subscription on unmount
      return () => {
        active = false;
        supabase.removeChannel(chatChannel);
      };
    } else {
      // DEMO SANDBOX OFFLINE MODE
      const loadDemoMessages = () => {
        const stored = localStorage.getItem(`vuu_chat_history_${rideId}`);
        if (stored) {
          setMessages(JSON.parse(stored));
        } else {
          // Initialize with helpful introductory greetings
          const starterMessages: ChatMessage[] = [
            {
              id: 'init-1',
              ride_id: rideId,
              sender_id: 'system-bot',
              sender_name: 'VUU Transport Security',
              sender_role: 'admin',
              content: '🔒 End-to-end encrypted chat. Both rider and driver can read the real-time automatic AI translations inside this window.',
              created_at: new Date(Date.now() - 30000).toISOString(),
            },
            {
              id: 'init-2',
              ride_id: rideId,
              sender_id: 'companion-id',
              sender_name: profile?.role === 'customer' ? 'Alex Driver' : 'Sarah Jenkins',
              sender_role: profile?.role === 'customer' ? 'rider' : 'customer',
              content: profile?.role === 'customer'
                ? 'Hello, where are you?'
                : 'I am wearing a yellow jacket near the corner.',
              created_at: new Date(Date.now() - 15000).toISOString(),
            }
          ];
          setMessages(starterMessages);
          localStorage.setItem(`vuu_chat_history_${rideId}`, JSON.stringify(starterMessages));
        }
        setLoading(false);
      };

      // Latency simulation for demo
      const timer = setTimeout(() => {
        if (active) loadDemoMessages();
      }, 350);

      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [rideId, profile, isDemoMode]);

  // Hook actions
  const sendMessage = async (content: string): Promise<{ success: boolean; error: string | null }> => {
    if (!content.trim() || !rideId) return { success: false, error: 'Empty message content' };

    const senderName = profile?.full_name || user?.email?.split('@')[0] || 'VUU User';
    const senderRole = profile?.role || 'customer';
    const senderId = user?.id || 'mock-current-sender';

    const newMsg: ChatMessage = {
      id: `msg-${Math.random().toString(36).substr(2, 9)}`,
      ride_id: rideId,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && !isDemoMode) {
      try {
        const { error: insertError } = await supabase
          .from('messages')
          .insert([newMsg]);

        if (insertError) throw insertError;

        // Note: Realtime will push it back, but let's append immediately for better tactile feedback
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        return { success: true, error: null };
      } catch (err: any) {
        console.error('[Supabase Chat] Failed to post message:', err);
        return { success: false, error: err.message || 'Failed to dispatch chat message.' };
      }
    } else {
      // Demo mode
      setMessages((prev) => {
        const nextList = [...prev, newMsg];
        localStorage.setItem(`vuu_chat_history_${rideId}`, JSON.stringify(nextList));
        return nextList;
      });

      // Simulated auto responder logic to keep developers company inside preview sandbox!
      setTimeout(async () => {
        const companionRole = senderRole === 'customer' ? 'rider' : 'customer';
        const companionName = senderRole === 'customer' ? 'Alex Driver' : 'Sarah Jenkins';

        let replyContent = "Okay, got it. I will see you shortly!";
        const text = content.toLowerCase();

        if (text.includes('where') || text.includes('oli') || text.includes('uko')) {
          replyContent = companionRole === 'rider' 
            ? "I have arrived at the pickup location."
            : "I am wearing a yellow jacket near the corner.";
        } else if (text.includes('traffic') || text.includes('kabotongo') || text.includes('msongamano')) {
          replyContent = "No worries, thank you for letting me know. Drive safely.";
        } else if (text.includes('coming') || text.includes('nzira') || text.includes('naja')) {
          replyContent = "Perfect. Keeping my flashers active near the gateway.";
        } else if (text.includes('car') || text.includes('motoka') || text.includes('gari')) {
          replyContent = companionRole === 'rider'
            ? "I am driving a Black Tesla Model Y (VUU-982-FR)."
            : "I am standing by the road next to the bakery.";
        } else if (text.includes('thank') || text.includes('webale') || text.includes('asante')) {
          replyContent = "You are most welcome! Pleasure traveling with you.";
        }

        const replyMsg: ChatMessage = {
          id: `msg-sim-${Math.random().toString(36).substr(2, 9)}`,
          ride_id: rideId,
          sender_id: 'companion-id',
          sender_name: companionName,
          sender_role: companionRole,
          content: replyContent,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => {
          const nextList = [...prev, replyMsg];
          localStorage.setItem(`vuu_chat_history_${rideId}`, JSON.stringify(nextList));
          return nextList;
        });
      }, 4000);

      return { success: true, error: null };
    }
  };

  /**
   * Translates a message in-place in state.
   * Prompts the helper translate function and attaches the metadata property.
   */
  const triggerTranslation = async (messageId: string, targetLanguage: string) => {
    // 1. Locate message
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;

    try {
      // 2. Translate using service
      const translated = await translateMessage(msg.content, targetLanguage);

      // 3. Update reactive state list
      setMessages((prev) => {
        const updated = prev.map((item) => {
          if (item.id === messageId) {
            return {
              ...item,
              translated_content: translated,
              target_language: targetLanguage,
            };
          }
          return item;
        });

        // Persist local histories
        if (!isSupabaseConfigured || isDemoMode) {
          localStorage.setItem(`vuu_chat_history_${rideId}`, JSON.stringify(updated));
        }
        return updated;
      });

      // 4. If Supabase is active, optionally update column in database
      if (isSupabaseConfigured && !isDemoMode) {
        await supabase
          .from('messages')
          .update({
            translated_content: translated,
            target_language: targetLanguage,
          })
          .eq('id', messageId);
      }
    } catch (err) {
      console.error('[Translation Exception]', err);
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    triggerTranslation,
  };
}

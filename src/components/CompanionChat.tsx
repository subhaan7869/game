import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Coffee, Lightbulb, Heart, HelpCircle, MessageSquare, AlertCircle, RefreshCw, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface CompanionMessage {
  id: string;
  sender: 'driver' | 'copilot';
  text: string;
  timestamp: Date;
}

interface UserProfile {
  name: string;
  rating: number;
  tier: string;
  level: number;
  deliveriesToday: number;
  uid?: string;
}

interface CompanionChatProps {
  theme: 'dark' | 'light';
  user: UserProfile;
  currentEarnings: number;
  activeCityKey?: string;
  activeOrders?: any[];
  activeSurgeAreas?: any[];
  hotspots?: any[];
  isNightMode?: boolean;
  isOnBreak?: boolean;
  location?: { latitude: number; longitude: number } | null;
}


// Fallback responses if the Gemini API is unavailable or environment key is missing
const FALLBACK_RESPONSES = [
  "You're doing great, absolute legend! Smooth roads make seasoned drivers. Keep up the high rating!",
  "Pro-tip: Head toward the Shoreditch hotspot in about 15 minutes. High surge activity is starting to cluster there!",
  "A sandwich walks into a bar. The bartender says, 'Sorry, we don't serve food here!' 🥪 Stay smiling out there!",
  "Remember to stay hydrated! Driving for long shifts demands elite focus. Take 2 mins to sip some water, okay?",
  "Earnings check: You're close to hitting a high streak today! Keep pushing, let's unlock that level-up!",
  "Did you know? The longest passenger ride in history was over 14,000 miles! Let's hope your next dispatch is slightly shorter.",
  "If traffic gets heavy, don't worry. Cozy ambient low-vibe radio is playing. Just glide through.",
];

export const CompanionChat: React.FC<CompanionChatProps> = ({ 
  theme, 
  user, 
  currentEarnings,
  activeCityKey = 'London',
  activeOrders = [],
  activeSurgeAreas = [],
  hotspots = [],
  isNightMode = false,
  isOnBreak = false,
  location = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CompanionMessage[]>(() => {
    try {
      const saved = localStorage.getItem('hyper_driver_copilot_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      }
    } catch (e) {
      console.warn("Failed to load co-pilot chat history:", e);
    }
    return [
      {
        id: 'initial',
        sender: 'copilot',
        text: `Hey Hassen! 🚀 Hyper Co-Pilot is online. Need some shift energy, a quick road tip, or a joke? Ask me anything or tap the mic!`,
        timestamp: new Date()
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(!process.env.GEMINI_API_KEY);
  
  // Reload chats from Firestore on database mount
  useEffect(() => {
    const loadFromFirestore = async () => {
      const uid = auth?.currentUser?.uid || user?.uid || 'driver_123';
      try {
        const { getDoc } = await import('firebase/firestore');
        const docRef = doc(db, 'copilot_chats', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.messages && data.messages.length > 0) {
            const parsed = data.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }));
            setMessages(parsed);
          }
        }
      } catch (err) {
        console.warn("Firestore copilot reload skipped:", err);
      }
    };
    loadFromFirestore();
  }, []);

  // Save history on changes
  useEffect(() => {
    try {
      localStorage.setItem('hyper_driver_copilot_history', JSON.stringify(messages));
    } catch (e) {
      console.warn("Failed to save co-pilot chat history:", e);
    }

    const backupToFirestore = async () => {
      const uid = auth?.currentUser?.uid || user?.uid || 'driver_123';
      try {
        await setDoc(doc(db, 'copilot_chats', uid), {
          messages: messages.map(m => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date(m.timestamp).toISOString()
          })),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore copilot backup failed:", err);
      }
    };
    backupToFirestore();
  }, [messages]);

  // Voice preferences, default to TRUE so Gemini speaks aloud automatically!
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(true);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isSimulatingVoice, setIsSimulatingVoice] = useState(false);
  const [simulatedVoiceText, setSimulatedVoiceText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Unblock speech synthesis during synchronous click gestures (Web Audio Policy unblocker)
  const preUnblockSpeech = () => {
    if ('speechSynthesis' in window && window.speechSynthesis) {
      try {
        const dummyUtterance = new SpeechSynthesisUtterance('');
        dummyUtterance.volume = 0;
        window.speechSynthesis.speak(dummyUtterance);
      } catch (e) {
        console.warn("Could not pre-unblock Speech synthesis:", e);
      }
    }
  };

  // Initialize Speech Synthesis & Speech Recognition capabilities
  useEffect(() => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSpeechSupported(true);
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-GB';

        rec.onstart = () => {
          setIsListening(true);
          setVoiceError(null);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript?.trim()) {
            handleSendMessage(transcript);
          }
        };

        rec.onerror = (err: any) => {
          console.error("Speech recognition error:", err);
          setIsListening(false);
          if (err.error === 'not-allowed') {
            setVoiceError("Microphone restricted in this secure frame. Tap below to use our high-fidelity Voice Simulation Controller!");
          } else {
            setVoiceError(`Voice Input Issue: ${err.error || 'unsupported'}. Try using the Interactive Voice Controller below.`);
          }
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      } else {
        setIsSpeechSupported(false);
      }
    } catch (e) {
      console.warn("Speech Recognition not supported in this frame environment:", e);
      setIsSpeechSupported(false);
    }
  }, []);

  // Clean speech on unmount or chat close
  useEffect(() => {
    if (!isOpen) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (isListening && recognitionRef.current) {
        recognitionRef.current.abort();
      }
    }
  }, [isOpen, isListening]);

  // Read response aloud (TTS) if enabled
  const speakText = (text: string) => {
    if (!isVoiceOutputEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Abort active read alouds
      
      const sanitized = text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '');
      const utterance = new SpeechSynthesisUtterance(sanitized);
      
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US')) || voices[0];
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech Synthesis read-back error:", err);
    }
  };

  // Auto-scroll to view the latest messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const toggleMicListening = () => {
    preUnblockSpeech();
    
    // Check if browser restricts permissions, or error previously occurred
    if (voiceError && voiceError.includes("restricted")) {
      // Enable Voice Simulation Overlay dynamically to keep the user experience smooth and interactive
      setIsSimulatingVoice(true);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSimulatingVoice(true);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      try {
        setVoiceError(null);
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Restarting voice capture:", e);
        // Fallback to Simulation Controller if startup fails in secure context
        setIsSimulatingVoice(true);
      }
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    preUnblockSpeech();

    const userMsg: CompanionMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'driver',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    let finalReply = "";

    try {
      if (process.env.GEMINI_API_KEY) {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });

        // Safe format of historical messages
        const formattedHistory = messages.slice(-10).map(msg => ({
          role: msg.sender === 'driver' ? 'user' as const : 'model' as const,
          parts: [{ text: msg.text }]
        }));

        formattedHistory.push({
          role: 'user',
          parts: [{ text: textToSend }]
        });

        // Rich system context injection for highly useful road advice
        const activeOrdersDetails = activeOrders && activeOrders.length > 0 
          ? activeOrders.map(o => `[Order: ${o.id}, Status: ${o.status}, Type: ${o.type}, Customer: ${o.customerName}, Restaurant: ${o.restaurantName || 'Standard'}]`).join(', ') 
          : 'None';
        
        const activeSurgeDetails = activeSurgeAreas && activeSurgeAreas.length > 0
          ? activeSurgeAreas.map(s => `Surge ${s.name || 'Zone'} (${s.multiplier || '1.2'}x)`).join(', ')
          : 'Normal traffic demand';

        const coordinatesStr = location 
          ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
          : 'Standard Location';

        const systemInstruction = `You are 'Hyper Co-Pilot', Hassen Nabeel's elite spatial digital co-driver.
Hassen is navigating the workspace in City: ${activeCityKey}.
Coordinates Telemetry: ${coordinatesStr}.

Live shift state updates:
- Rider/Driver Name: Hassen Nabeel
- Quality Rating: ${user.rating} ★
- Carrier Upgrade Tier: ${user.tier}
- Today's completed delivery orders: ${user.deliveriesToday}
- Today's total cash earnings: £${currentEarnings.toFixed(2)}
- On break status: ${isOnBreak ? 'YES' : 'NO'}
- Night mode status: ${isNightMode ? 'YES' : 'NO'}
- Active dispatch jobs: ${activeOrdersDetails}
- Surge multipliers: ${activeSurgeDetails}
- Nearby demand hotspots: ${hotspots ? hotspots.length : 0} surge nodes active.

Rules:
1. Always address him as Hassen.
2. Keep responses witty, energetic, motivating, and incredibly tailored to his coordinates or city.
3. Keep replies very brief (usually 2 sentences max) so he can parse them safely while driving.
4. Offer tactical advice: suggest specific streets, hotspots, rest times, tell snappy driving jokes, or cheer his milestones!`;

        const result = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: formattedHistory,
          config: {
            systemInstruction,
            temperature: 0.85,
          }
        });

        finalReply = result.text || "I was thinking, but the signal fluctuated! Keep driving, you've got this Hassen!";
      } else {
        await new Promise(resolve => setTimeout(resolve, 1200));
        const lowerText = textToSend.toLowerCase();

        if (lowerText.includes('joke')) {
          finalReply = "Why did the driver cross the road? To deliver that extra order during high surge! Safe driving, Hassen!";
        } else if (lowerText.includes('motivation') || lowerText.includes('cheer')) {
          finalReply = `Let's go, Hassen! You've got an elite ${user.rating} star rating. Absolute powerhouse! Let's conquer this shift.`;
        } else if (lowerText.includes('break') || lowerText.includes('rest')) {
          finalReply = "If you've been on the road for over 3 hours, a quick espresso break in Soho is highly recommended. Safety first!";
        } else if (lowerText.includes('tip') || lowerText.includes('optimize')) {
          finalReply = "Shift Tip: Keep an eye out for CPI metrics! High multiplier orders are concentrating around retail hotspots now.";
        } else {
          finalReply = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
        }
      }

      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-reply`,
        sender: 'copilot',
        text: finalReply,
        timestamp: new Date()
      }]);
      speakText(finalReply);

    } catch (err) {
      console.error("Gemini Co-Pilot integration error:", err);
      finalReply = "Signal is slightly spotty behind this tunnel, but Hassen, remember: focus on the road, maintain the momentum, and let's win this shift!";
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-err-reply`,
        sender: 'copilot',
        text: finalReply,
        timestamp: new Date()
      }]);
      speakText(finalReply);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputText);
    }
  };

  const handleSimulatedVoiceClick = (phrase: string) => {
    preUnblockSpeech();
    setSimulatedVoiceText(phrase);
    setIsListening(true);
    
    // Simulate vocal recording wave countdown
    setTimeout(() => {
      setIsListening(false);
      setIsSimulatingVoice(false);
      handleSendMessage(phrase);
    }, 1800);
  };

  const quickPrompts = [
    { text: "Optimise Shift 📍", label: "tip" },
    { text: "Motivate Me! ⚡", label: "motivation" },
    { text: "Tell a Joke 🛣️", label: "joke" },
    { text: "Should I rest? ☕", label: "break" }
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed left-6 bottom-[230px] z-[2300] pointer-events-auto">
        <motion.button
          id="co-pilot-toggle-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            preUnblockSpeech();
            setIsOpen(!isOpen);
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl relative border transition-all duration-300 overflow-hidden ${
            isOpen 
              ? 'bg-[#121214] border-[#22c55e]/50 text-[#22c55e]' 
              : 'bg-[#121214] border-white/5 text-[#22c55e] hover:border-[#22c55e]/30'
          }`}
        >
          {isOpen ? (
            <X size={20} />
          ) : (
            <>
              <span className="absolute inset-0 bg-gradient-to-tr from-[#22c55e]/10 to-transparent animate-pulse" />
              <div className="relative flex items-center justify-center">
                <Sparkles size={22} className="animate-pulse text-[#22c55e]" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22c55e]"></span>
                </span>
              </div>
            </>
          )}
        </motion.button>
      </div>

      {/* Chat Window Panel Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="co-pilot-chat-modal"
            initial={{ opacity: 0, scale: 0.9, y: 50, x: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50, x: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed left-6 bottom-[290px] w-[340px] h-[460px] rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.65)] border border-white/5 flex flex-col overflow-hidden z-[2350] bg-[#0a0a0c]/95 backdrop-blur-xl text-white pointer-events-auto"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#121214] border border-white/5 flex items-center justify-center text-[#22c55e] relative shadow-lg">
                  <Sparkles size={18} fill="currentColor" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#22c55e] rounded-full border-2 border-[#090a0f] shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                </div>
                <div>
                  <h3 className="font-sans font-black text-xs uppercase tracking-wider flex items-center gap-1 text-white">
                    Hyper Co-Pilot
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5 font-mono">
                    <span className="text-[8px] font-black uppercase text-[#22c55e] tracking-widest leading-none">Voice Enabled</span>
                    <span className="text-[7.5px] text-[#22c55e]/90 bg-[#22c55e]/15 px-1.5 py-0.5 rounded-full uppercase leading-none border border-[#22c55e]/30 font-black">Live Talk</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Voice Read Aloud Toggle */}
                <button
                  onClick={() => {
                    preUnblockSpeech();
                    setIsVoiceOutputEnabled(!isVoiceOutputEnabled);
                  }}
                  title={isVoiceOutputEnabled ? "Mute co-pilot voice readings" : "Enable co-pilot voice reading"}
                  className={`p-1.5 rounded-xl transition-all ${
                    isVoiceOutputEnabled 
                      ? 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 shadow-[0_0_8px_rgba(34,197,94,0.1)]' 
                      : 'hover:bg-white/5 text-gray-500 border border-transparent'
                  }`}
                >
                  {isVoiceOutputEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>

                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 font-sans">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col max-w-[85%] ${msg.sender === 'driver' ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <div 
                    className={`px-4 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                      msg.sender === 'driver' 
                        ? 'bg-[#22c55e] text-black font-bold rounded-br-none' 
                        : 'bg-[#121214] text-slate-100 rounded-bl-none border border-white/5'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-wider mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              
              {isTyping && (
                <div className="self-start items-start flex flex-col">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-none bg-[#121214] flex items-center gap-1.5 shadow-sm border border-white/5">
                    <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Simulated Voice Controller Interactive Center Pane */}
            <AnimatePresence>
              {isSimulatingVoice && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  className="absolute inset-x-0 bottom-0 top-[70px] bg-[#0a0a0c] border-t border-white/10 z-[2400] flex flex-col p-5"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-black text-xs uppercase tracking-wider text-[#22c55e] flex items-center gap-1.5">
                      <Mic size={14} /> Voice Assistant Emulation
                    </h4>
                    <button 
                      onClick={() => setIsSimulatingVoice(false)}
                      className="p-1 rounded-full bg-white/5 text-gray-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-gray-400 leading-normal mb-5 font-bold">
                    Microphone streaming is restricted inside nested sandboxes. Tap any phrase below to mock high-fidelity speech input, which Gemini will read back aloud!
                  </p>
                  
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    {[
                      { phrase: "Give me a high-vibe motivation boost!", label: "⚡ Request Motivation" },
                      { phrase: "Tell me a quick food delivery joke!", label: "🛣️ Request Road Joke" },
                      { phrase: "Where are the high surge cluster zones right now?", label: "📍 Query Route Hotspots" },
                      { phrase: "Should I take an espresso rest break?", label: "☕ Break Diagnostic" },
                    ].map((item, idx) => (
                      <button
                        key={`sv-${idx}`}
                        onClick={() => handleSimulatedVoiceClick(item.phrase)}
                        className="w-full text-left p-3.5 rounded-xl bg-[#121214] border border-white/5 hover:border-[#22c55e]/30 flex items-center justify-between text-xs font-bold text-white transition-all active:scale-[0.98]"
                      >
                        <span className="text-gray-400 font-medium italic">"{item.phrase}"</span>
                        <span className="text-[8.5px] font-black uppercase text-[#22c55e] leading-none shrink-0 font-mono">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {isListening && (
                    <div className="absolute inset-0 bg-[#0a0a0c]/95 flex flex-col items-center justify-center p-6 text-center z-10">
                      <div className="flex items-center gap-1.5 h-12 mb-4">
                        <motion.span animate={{ height: [12, 40, 12] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1 bg-[#22c55e] rounded-full" />
                        <motion.span animate={{ height: [8, 48, 8] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} className="w-1 bg-[#22c55e] rounded-full" />
                        <motion.span animate={{ height: [16, 32, 16] }} transition={{ duration: 0.7, repeat: Infinity, delay: 0.2 }} className="w-1 bg-[#22c55e] rounded-full" />
                        <motion.span animate={{ height: [10, 44, 10] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.35 }} className="w-1 bg-[#22c55e] rounded-full" />
                      </div>
                      <p className="font-mono text-[10px] uppercase text-[#22c55e] tracking-widest font-black animate-pulse">Capturing simulated voice coordinates...</p>
                      <p className="text-[11px] text-gray-400 font-bold mt-2 truncate w-full italic">"{simulatedVoiceText}"</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Listening HUD Overlay inside Chat */}
            <AnimatePresence>
              {isListening && !isSimulatingVoice && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="absolute inset-x-4 bottom-[72px] bg-[#22c55e] text-black px-4 py-3 rounded-2xl flex items-center justify-between shadow-2xl z-10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 h-4">
                      <span className="w-0.5 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '600ms' }} />
                      <span className="w-0.5 h-4 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '600ms' }} />
                      <span className="w-0.5 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '600ms' }} />
                      <span className="w-0.5 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '450ms', animationDuration: '600ms' }} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider">Listening to road speech...</span>
                  </div>
                  <button 
                    onClick={toggleMicListening}
                    className="text-[9px] font-black bg-black/10 hover:bg-black/20 uppercase tracking-widest px-2.5 py-1 rounded-lg"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Replies Tray */}
            <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto border-t scrollbar-hide shrink-0 border-white/5 bg-white/5">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={`qp-${idx}`}
                  onClick={() => {
                    preUnblockSpeech();
                    handleSendMessage(prompt.text);
                  }}
                  className="px-3 py-1.5 rounded-full text-[10px] uppercase font-black tracking-wider border whitespace-nowrap transition-all duration-200 active:scale-95 bg-neutral-900 border-white/10 text-[#22c55e] hover:text-white hover:border-[#22c55e]/40"
                >
                  {prompt.text}
                </button>
              ))}
            </div>

            {/* Error Alert Info Box */}
            <AnimatePresence>
              {voiceError && !isSimulatingVoice && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onClick={() => setIsSimulatingVoice(true)}
                  className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/15 border-t border-amber-500/20 text-xs text-amber-500 flex items-start gap-2 relative leading-normal shrink-0 cursor-pointer"
                >
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-400" />
                  <span className="flex-1 font-sans font-bold text-[10.5px] text-amber-400">{voiceError}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setVoiceError(null);
                    }}
                    className="p-0.5 hover:bg-amber-500/15 rounded-lg text-amber-400 shrink-0"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Bar */}
            <div className="p-3 border-t flex items-center gap-2 shrink-0 border-white/5 bg-black/40">
              <button
                onClick={toggleMicListening}
                className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                  isListening 
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                    : 'bg-neutral-900 border-white/10 text-[#22c55e] hover:text-white hover:border-[#22c55e]/30 shadow-[0_0_8px_rgba(34,197,94,0.1)]'
                }`}
                title="Hands-free Voice Shift Chat Input"
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={isListening ? "Listening..." : "Speak or ask Co-Pilot..."}
                disabled={isListening}
                className={`flex-1 px-4 py-2 rounded-2xl text-xs font-medium outline-none border transition-all ${
                  isListening 
                    ? 'bg-neutral-900/20 cursor-not-allowed opacity-50'
                    : 'bg-[#18181b] border-white/10 text-white focus:border-[#22c55e]/50'
                }`}
              />
              <button
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim() || isListening}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  inputText.trim() && !isListening
                    ? 'bg-[#22c55e] text-black font-black shadow-lg shadow-[#22c55e]/20 active:scale-95'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                }`}
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

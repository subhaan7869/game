import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, Radio, Disc, Maximize2, Minimize2 } from 'lucide-react';

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  url: string;
  isSynth: boolean;
  genre: string;
}

export const PLAYLIST: AudioTrack[] = [
  {
    id: 'track-1',
    title: 'Neon Horizon',
    artist: 'AI Auto-Synth',
    album: 'Procedural Cyber Vol. 1',
    cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=120&h=120&fit=crop',
    url: '',
    isSynth: true,
    genre: 'Synthwave'
  },
  {
    id: 'track-2',
    title: 'Cyberpunk Alley',
    artist: 'Lofi Chords Engine',
    album: 'Procedural Cyber Vol. 1',
    cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop',
    url: '',
    isSynth: true,
    genre: 'Lo-Fi Chill'
  },
  {
    id: 'track-3',
    title: 'Echoes of Shoreditch',
    artist: 'Royalty Free Radio',
    album: 'Modern Beats',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    isSynth: false,
    genre: 'Electronic'
  },
  {
    id: 'track-4',
    title: 'Midnight Fuel',
    artist: 'Royalty Free Lounge',
    album: 'Hyper Driving Mix',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&h=120&fit=crop',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    isSynth: false,
    genre: 'Chill Chill'
  }
];

interface MediaControlsProps {
  theme?: 'light' | 'dark';
  compact?: boolean;
  isCarPlay?: boolean;
}

export const MediaControls: React.FC<MediaControlsProps> = ({ 
  theme = 'dark', 
  compact = false,
  isCarPlay = false 
}) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // Default to 3 mins for aesthetic
  const [expanded, setExpanded] = useState(false);

  const track = PLAYLIST[currentTrackIndex];

  // Sound & Synthesis Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Synth Beats Engine Refs
  const synthIntervalRef = useRef<number | null>(null);
  const synthNodesRef = useRef<AudioNode[]>([]);
  const synthTimeRef = useRef<number>(0);

  // Initialize/recreate HTML Audio Element
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!track.isSynth) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (!track.isSynth && audio.duration) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      handleNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      stopSynth();
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Track change
  useEffect(() => {
    stopSynth();
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.pause();
      
      if (!track.isSynth) {
        audioRef.current.src = track.url;
        audioRef.current.load();
        if (isPlaying) {
          audioRef.current.play().catch(() => setIsPlaying(false));
        }
      } else {
        setDuration(240); // Prodedural synth length
        if (isPlaying) {
          startSynth();
        }
      }
    }
  }, [currentTrackIndex]);

  // Handle Play / Pause trigger
  const togglePlay = () => {
    // Resume shared audio context to bypass browser security blockers
    initAudioContext();
    const nextState = !isPlaying;
    setIsPlaying(nextState);

    if (nextState) {
      if (track.isSynth) {
        startSynth();
      } else if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    } else {
      if (track.isSynth) {
        stopSynth();
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (!track.isSynth && audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  // Web Audio Context Visualizer Hook Setup
  const initAudioContext = () => {
    if (audioContextRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = (window as any).__sharedAudioCtx || new AudioContextClass();
      (window as any).__sharedAudioCtx = ctx;
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64; 
      analyserRef.current = analyser;

      // Connect HTML5 audio element
      if (audioRef.current) {
        // Safe check to avoid re-connecting same element source
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        sourceRef.current = source;
      }
    } catch (err) {
      console.warn("AudioContext init error:", err);
    }
  };

  // Custom AI / Procedural Synth Drum & Synthwave Sound Generator
  const startSynth = () => {
    initAudioContext();
    stopSynth();

    const ctx = audioContextRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    synthTimeRef.current = 0;
    let stepCount = 0;

    // Fast interval for sequencer: sixteenth notes at 95 BPM (approx every 158 ms)
    const stepDuration = 0.158; 

    const playStep = () => {
      if (!ctx || ctx.state === 'suspended') return;
      const time = ctx.currentTime;

      // Master Gain for Synthwave
      const masterNode = ctx.createGain();
      masterNode.gain.setValueAtTime(isMuted ? 0 : volume * 0.15, time); // Keep soft and elegant
      masterNode.connect(analyserRef.current || ctx.destination);
      synthNodesRef.current.push(masterNode);

      // Increment progress timers
      setCurrentTime((prev) => {
        const next = prev + stepDuration;
        return next > duration ? 0 : next;
      });

      // 1. Kick Drum (Step 0, 4, 8, 12 out of 16)
      if (stepCount % 4 === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterNode);

        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.12);

        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

        osc.start(time);
        osc.stop(time + 0.15);
      }

      // 2. Snare / Clap (Step 4, 12)
      if (stepCount % 8 === 4) {
        // High frequency white sound approximation
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(masterNode);

        osc.frequency.setValueAtTime(180, time);
        gain.gain.setValueAtTime(0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);

        osc.start(time);
        osc.stop(time + 0.2);
      }

      // 3. Cyber Bass Line (Deep low pulsing notes)
      const bassNotes = [55, 55, 65.4, 65.4, 73.4, 73.4, 82.4, 82.4];
      const currentBassNote = bassNotes[Math.floor(stepCount / 2) % bassNotes.length];
      
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.connect(bassGain);
      bassGain.connect(masterNode);

      bassOsc.frequency.setValueAtTime(currentBassNote, time);
      bassGain.gain.setValueAtTime(0.4, time);
      bassGain.gain.exponentialRampToValueAtTime(0.01, time + stepDuration * 0.9);

      bassOsc.start(time);
      bassOsc.stop(time + stepDuration);

      // 4. Retro Lead Arpeggio (Only in Synthwave, Track 1)
      if (track.id === 'track-1') {
        const arpeggioNotes = [220, 261.6, 329.6, 392, 440, 523.3, 659.3, 784];
        const leadNote = arpeggioNotes[(stepCount * 3 + 2) % arpeggioNotes.length];

        const leadOsc = ctx.createOscillator();
        const leadGain = ctx.createGain();
        leadOsc.type = 'sine';
        leadOsc.connect(leadGain);
        leadGain.connect(masterNode);

        leadOsc.frequency.setValueAtTime(leadNote, time);
        leadGain.gain.setValueAtTime(0.15, time);
        leadGain.gain.linearRampToValueAtTime(0.001, time + stepDuration * 0.85);

        leadOsc.start(time);
        leadOsc.stop(time + stepDuration);
      } else {
        // Track 2: Cyberpunk Alley (Chill Square waves and softer keys)
        const chordNotes = [220, 277, 330, 415]; // Amaj7 chord arpeggio
        const chillNote = chordNotes[stepCount % chordNotes.length];

        const squareOsc = ctx.createOscillator();
        const squareGain = ctx.createGain();
        squareOsc.type = 'triangle';
        squareOsc.connect(squareGain);
        squareGain.connect(masterNode);

        squareOsc.frequency.setValueAtTime(chillNote, time);
        squareGain.gain.setValueAtTime(0.18, time);
        squareGain.gain.exponentialRampToValueAtTime(0.01, time + stepDuration * 1.5);

        squareOsc.start(time);
        squareOsc.stop(time + stepDuration * 1.5);
      }

      stepCount = (stepCount + 1) % 16;
    };

    // Run custom sequence interval
    const synthTimer = window.setInterval(playStep, stepDuration * 1000);
    synthIntervalRef.current = synthTimer;
  };

  const stopSynth = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
  };

  // Canvas visualizer rendering loop
  useEffect(() => {
    let active = true;

    const render = () => {
      if (!active) return;
      
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      const bufferLength = analyser ? analyser.frequencyBinCount : 16;
      const dataArray = new Uint8Array(bufferLength);
      
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // If dummy visualizer, create nice subtle moving simulated waveform
        const time = Date.now() * 0.004;
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = isPlaying 
            ? Math.abs(Math.sin(i * 0.5 + time) * 80) + 20 
            : Math.sin(i * 0.3) * 10 + 10;
        }
      }

      const barWidth = (width / bufferLength) * 1.6;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] * (height / 256) * 1.1;

        // Custom Neon Glow Gradients
        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, '#1d4ed8'); // Deep blue
        grad.addColorStop(0.5, '#3b82f6'); // Electric blue
        grad.addColorStop(1, '#00e5ff'); // Bright neon cyan

        ctx.fillStyle = grad;
        
        // Draw elegant rounded pillar visual bar
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, height - barHeight, barWidth - 4, barHeight, 3);
        } else {
          ctx.rect(x, height - barHeight, barWidth - 4, barHeight);
        }
        ctx.fill();

        x += barWidth;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTrackIndex]);

  // Format seconds to text e.g. 120 -> "2:00"
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentThemeStyles = theme === 'dark' 
    ? 'bg-black/90 border-white/10 text-white' 
    : 'bg-white border-gray-200 text-black';

  // CarPlay Interface Render (Takes Full screen or side layout)
  if (isCarPlay) {
    return (
      <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 flex flex-col h-full relative overflow-hidden select-none">
        
        {/* Background Visualizer Behind Player */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <canvas ref={canvasRef} className="w-full h-full" width={600} height={120} />
        </div>

        {/* CarPlay Header Title */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <Radio className="text-blue-400 animate-pulse" size={24} />
            <span className="text-xs font-black uppercase tracking-widest text-gray-400">HYPER MUSIC RECEIVER</span>
          </div>
          <span className="text-xs font-bold text-blue-500 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">{track.genre}</span>
        </div>

        <div className="flex-1 flex gap-8 items-center relative z-10">
          {/* Album Cover Art with Spinning Disc Indicator */}
          <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-2xl shrink-0 group border border-white/15">
            <img src={track.cover} alt="Album cover" className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}>
              <Disc className="text-blue-400 animate-spin" size={32} style={{ animationDuration: '6s' }} />
            </div>
          </div>

          {/* Song Details & Waveforms */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="mb-4">
              <h3 className="text-3xl font-black truncate">{track.title}</h3>
              <p className="text-lg text-gray-400 font-bold truncate mt-1">{track.artist}</p>
              <p className="text-xs text-gray-500 leading-tight truncate mt-0.5">{track.album}</p>
            </div>

            {/* Compact Progress Line */}
            <div className="space-y-1">
              <input 
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs font-bold text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wide CarPlay Buttons Layout */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5 relative z-10">
          {/* Player controls */}
          <div className="flex items-center gap-6">
            <button 
              onClick={handlePrev}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full active:scale-90 transition-transform"
            >
              <SkipBack size={26} className="text-white" />
            </button>

            <button 
              onClick={togglePlay}
              className="p-5 bg-blue-500 hover:bg-blue-400 rounded-full active:scale-95 transition-transform shadow-lg shadow-blue-500/20"
            >
              {isPlaying ? (
                <Pause size={30} className="text-white fill-white" />
              ) : (
                <Play size={30} className="text-white fill-white translate-x-0.5" />
              )}
            </button>

            <button 
              onClick={handleNext}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full active:scale-90 transition-transform"
            >
              <SkipForward size={26} className="text-white" />
            </button>
          </div>

          {/* Volume Control widget */}
          <div className="flex items-center gap-3 bg-black/40 py-2.5 px-4 rounded-full border border-white/5">
            <button onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} className="text-gray-400" />}
            </button>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
              className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>
      </div>
    );
  }

  // Floating Desktop Bar Compact View
  if (compact) {
    return (
      <div className={`p-3 rounded-2xl shadow-xl flex items-center justify-between transition-all border ${currentThemeStyles}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-black/10">
            <img src={track.cover} alt="Cover" className="w-full h-full object-cover" />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Disc className="text-white animate-spin" size={16} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold truncate">{track.title}</p>
            <p className="text-[10px] text-gray-500 font-bold truncate leading-tight">{track.artist}</p>
          </div>
        </div>

        {/* Minimal Actions */}
        <div className="flex items-center gap-2">
          <canvas ref={canvasRef} className="w-16 h-8 opacity-70" width={80} height={40} />
          <button 
            onClick={handlePrev}
            className={`p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'} active:scale-90`}
          >
            <SkipBack size={15} />
          </button>
          <button 
            onClick={togglePlay}
            className="p-2 bg-blue-600 text-white rounded-full active:scale-95 transition-transform"
          >
            {isPlaying ? <Pause size={15} className="fill-white" /> : <Play size={15} className="fill-white translate-x-[1px]" />}
          </button>
          <button 
            onClick={handleNext}
            className={`p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'} active:scale-90`}
          >
            <SkipForward size={15} />
          </button>
        </div>
      </div>
    );
  }

  // Expanded Dashboard Music Player Panel style
  return (
    <div className={`p-6 rounded-3xl border shadow-xl ${currentThemeStyles}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-gray-400">
          <Music size={18} />
          Entertainment & Cabin Ambient
        </h3>
        
        {/* Track Playlist Trigger dropdown or selection state */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 items-end justify-center h-4 w-6">
            <span className={`w-0.5 bg-blue-500 rounded-full transition-all duration-300 ${isPlaying ? 'animate-bounce h-3' : 'h-1'}`} style={{ animationDelay: '0.1s' }} />
            <span className={`w-0.5 bg-blue-500 rounded-full transition-all duration-300 ${isPlaying ? 'animate-bounce h-4' : 'h-1.5'}`} style={{ animationDelay: '0.3s' }} />
            <span className={`w-0.5 bg-blue-400 rounded-full transition-all duration-300 ${isPlaying ? 'animate-bounce h-2' : 'h-1'}`} style={{ animationDelay: '0.5s' }} />
            <span className={`w-0.5 bg-cyan-400 rounded-full transition-all duration-300 ${isPlaying ? 'animate-bounce h-3.5' : 'h-2'}`} style={{ animationDelay: '0.2s' }} />
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-white p-1">
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Quick select track bar */}
        <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl overflow-x-auto select-none no-scrollbar">
          {PLAYLIST.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setCurrentTrackIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${
                idx === currentTrackIndex 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>

        <div className="flex items-start gap-4">
          {/* Main Album Art */}
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shrink-0 group shadow-md">
            <img src={track.cover} alt="Cover" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Disc className="text-white animate-spin" size={24} style={{ animationDuration: '4s' }} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-extrabold text-base truncate">{track.title}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400 font-medium truncate">{track.artist}</span>
              <span className="text-[9px] bg-blue-500/15 text-blue-500 font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">{track.genre}</span>
            </div>
            
            {/* Real Waveform Visualizer */}
            <div className="mt-2 h-10 w-full overflow-hidden rounded-xl bg-black/20 relative">
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" width={320} height={40} />
            </div>
          </div>
        </div>

        {/* Progress Timeline seek */}
        <div className="space-y-1 mt-1">
          <input 
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-blue-500/30 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-cyan-400 transition-colors"
          />
          <div className="flex justify-between text-[10px] font-bold text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Core Buttons Interface */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className="p-2 text-gray-400 hover:text-white rounded-full transition-colors active:scale-95"
            >
              {isMuted ? <VolumeX size={18} className="text-red-500" /> : <Volume2 size={18} />}
            </button>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
              className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrev}
              className="p-2 text-gray-300 hover:text-white rounded-full active:scale-90 transition-transform"
            >
              <SkipBack size={18} />
            </button>
            <button 
              onClick={togglePlay}
              className="p-3 bg-blue-600 text-white rounded-full active:scale-95 shadow-lg shadow-blue-600/10 transition-transform hover:bg-blue-500"
            >
              {isPlaying ? <Pause size={18} className="fill-white" /> : <Play size={18} className="fill-white translate-x-[1px]" />}
            </button>
            <button 
              onClick={handleNext}
              className="p-2 text-gray-300 hover:text-white rounded-full active:scale-90 transition-transform"
            >
              <SkipForward size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

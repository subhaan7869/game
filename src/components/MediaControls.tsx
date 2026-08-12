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

// Persistent Singleton Global Music Controller
class GlobalMusicController {
  isPlaying = false;
  currentTrackIndex = 0;
  volume = 0.7;
  isMuted = false;
  isDucked = false;
  currentTime = 0;
  duration = 180;
  
  audio: HTMLAudioElement;
  listeners = new Set<() => void>();
  
  synthInterval: number | null = null;
  synthNodes: AudioNode[] = [];
  masterGainNode: GainNode | null = null;
  audioCtx: AudioContext | null = null;
  analyser: AnalyserNode | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';

    this.audio.addEventListener('timeupdate', () => {
      const track = PLAYLIST[this.currentTrackIndex];
      if (!track.isSynth) {
        this.currentTime = this.audio.currentTime;
        this.notify();
      }
    });

    this.audio.addEventListener('loadedmetadata', () => {
      const track = PLAYLIST[this.currentTrackIndex];
      if (!track.isSynth && this.audio.duration) {
        this.duration = this.audio.duration;
        this.notify();
      }
    });

    this.audio.addEventListener('ended', () => {
      this.next();
    });
  }

  notify() {
    this.listeners.forEach(fn => fn());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  initAudioCtx() {
    if (this.audioCtx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = (window as any).__sharedAudioCtx || new AudioContextClass();
      (window as any).__sharedAudioCtx = ctx;
      this.audioCtx = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      this.analyser = analyser;

      const source = ctx.createMediaElementSource(this.audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
    } catch (e) {
      console.warn("Global Music AudioCtx error:", e);
    }
  }

  getEffectiveVolume() {
    if (this.isMuted) return 0;
    return this.isDucked ? this.volume * 0.25 : this.volume;
  }

  updateAudioVolume() {
    const effVol = this.getEffectiveVolume();
    this.audio.volume = effVol;
    if (this.masterGainNode && this.audioCtx) {
      this.masterGainNode.gain.setValueAtTime(effVol * 0.15, this.audioCtx.currentTime);
    }
  }

  duckVolume() {
    this.isDucked = true;
    this.updateAudioVolume();
    this.notify();
  }

  unduckVolume() {
    this.isDucked = false;
    this.updateAudioVolume();
    this.notify();
  }

  togglePlay() {
    this.initAudioCtx();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    this.isPlaying = !this.isPlaying;
    const track = PLAYLIST[this.currentTrackIndex];

    if (this.isPlaying) {
      if (track.isSynth) {
        this.startSynth();
      } else {
        if (!this.audio.src || !this.audio.src.includes(track.url)) {
          this.audio.src = track.url;
          this.audio.load();
        }
        this.updateAudioVolume();
        this.audio.play().catch(() => { this.isPlaying = false; });
      }
    } else {
      if (track.isSynth) {
        this.stopSynth();
      } else {
        this.audio.pause();
      }
    }
    this.notify();
  }

  setTrackIndex(idx: number) {
    this.stopSynth();
    this.audio.pause();
    this.currentTrackIndex = idx;
    this.currentTime = 0;
    const track = PLAYLIST[idx];

    if (track.isSynth) {
      this.duration = 240;
      if (this.isPlaying) this.startSynth();
    } else {
      this.audio.src = track.url;
      this.audio.load();
      if (this.isPlaying) {
        this.updateAudioVolume();
        this.audio.play().catch(() => { this.isPlaying = false; });
      }
    }
    this.notify();
  }

  next() {
    const nextIdx = (this.currentTrackIndex + 1) % PLAYLIST.length;
    this.setTrackIndex(nextIdx);
  }

  prev() {
    const prevIdx = (this.currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    this.setTrackIndex(prevIdx);
  }

  setVolume(vol: number) {
    this.volume = vol;
    this.isMuted = false;
    this.updateAudioVolume();
    this.notify();
  }

  setIsMuted(muted: boolean) {
    this.isMuted = muted;
    this.updateAudioVolume();
    this.notify();
  }

  seek(secs: number) {
    this.currentTime = secs;
    const track = PLAYLIST[this.currentTrackIndex];
    if (!track.isSynth) {
      this.audio.currentTime = secs;
    }
    this.notify();
  }

  startSynth() {
    this.initAudioCtx();
    this.stopSynth();
    const ctx = this.audioCtx;
    if (!ctx) return;

    let stepCount = 0;
    const stepDuration = 0.158;

    const playStep = () => {
      if (!ctx || ctx.state === 'suspended' || !this.isPlaying) return;
      const time = ctx.currentTime;
      const track = PLAYLIST[this.currentTrackIndex];

      const masterNode = ctx.createGain();
      const effVol = this.getEffectiveVolume();
      masterNode.gain.setValueAtTime(effVol * 0.15, time);
      masterNode.connect(this.analyser || ctx.destination);
      this.masterGainNode = masterNode;

      this.currentTime = (this.currentTime + stepDuration) % this.duration;

      // Kick
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

      // Snare
      if (stepCount % 8 === 4) {
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

      // Bass
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

      // Lead / Melody
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
        const chordNotes = [220, 277, 330, 415];
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

    this.synthInterval = window.setInterval(playStep, stepDuration * 1000);
  }

  stopSynth() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }
}

// Instantiate singleton on window
if (typeof window !== 'undefined' && !(window as any).__globalMusicController) {
  (window as any).__globalMusicController = new GlobalMusicController();
}

const getGlobalMusicController = (): GlobalMusicController => {
  if (typeof window === 'undefined') return new GlobalMusicController();
  if (!(window as any).__globalMusicController) {
    (window as any).__globalMusicController = new GlobalMusicController();
  }
  return (window as any).__globalMusicController;
};

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
  const controller = getGlobalMusicController();
  const [, setTick] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Subscribe to global player state changes
  useEffect(() => {
    const unsubscribe = controller.subscribe(() => {
      setTick(t => t + 1);
    });
    return () => {
      unsubscribe();
    };
  }, [controller]);

  const track = PLAYLIST[controller.currentTrackIndex] || PLAYLIST[0];
  const isPlaying = controller.isPlaying;
  const currentTime = controller.currentTime;
  const duration = controller.duration;
  const volume = controller.volume;
  const isMuted = controller.isMuted;

  const togglePlay = () => controller.togglePlay();
  const handleNext = () => controller.next();
  const handlePrev = () => controller.prev();
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => controller.seek(parseFloat(e.target.value));

  // Canvas visualizer rendering loop
  useEffect(() => {
    let active = true;

    const render = () => {
      if (!active) return;
      
      const canvas = canvasRef.current;
      const analyser = controller.analyser;
      if (!canvas) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const bufferLength = analyser ? analyser.frequencyBinCount : 16;
      const dataArray = new Uint8Array(bufferLength);
      
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else {
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

        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, '#1d4ed8');
        grad.addColorStop(0.5, '#3b82f6');
        grad.addColorStop(1, '#00e5ff');

        ctx.fillStyle = grad;
        
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
  }, [isPlaying, controller.currentTrackIndex, controller]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentThemeStyles = theme === 'dark' 
    ? 'bg-black/90 border-white/10 text-white' 
    : 'bg-white border-gray-200 text-black';

  if (isCarPlay) {
    return (
      <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 flex flex-col h-full relative overflow-hidden select-none">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <canvas ref={canvasRef} className="w-full h-full" width={600} height={120} />
        </div>

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <Radio className="text-blue-400 animate-pulse" size={24} />
            <span className="text-xs font-black uppercase tracking-widest text-gray-400">HYPER MUSIC RECEIVER</span>
          </div>
          <span className="text-xs font-bold text-blue-500 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">{track.genre}</span>
        </div>

        <div className="flex-1 flex gap-8 items-center relative z-10">
          <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-2xl shrink-0 group border border-white/15">
            <img src={track.cover} alt="Album cover" className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}>
              <Disc className="text-blue-400 animate-spin" size={32} style={{ animationDuration: '6s' }} />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="mb-4">
              <h3 className="text-3xl font-black truncate">{track.title}</h3>
              <p className="text-lg text-gray-400 font-bold truncate mt-1">{track.artist}</p>
              <p className="text-xs text-gray-500 leading-tight truncate mt-0.5">{track.album}</p>
            </div>

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

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5 relative z-10">
          <div className="flex items-center gap-6">
            <button 
              onClick={handlePrev}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full active:scale-90 transition-transform cursor-pointer"
            >
              <SkipBack size={26} className="text-white" />
            </button>

            <button 
              onClick={togglePlay}
              className="p-5 bg-blue-500 hover:bg-blue-400 rounded-full active:scale-95 transition-transform shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              {isPlaying ? (
                <Pause size={30} className="text-white fill-white" />
              ) : (
                <Play size={30} className="text-white fill-white translate-x-0.5" />
              )}
            </button>

            <button 
              onClick={handleNext}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full active:scale-90 transition-transform cursor-pointer"
            >
              <SkipForward size={26} className="text-white" />
            </button>
          </div>

          <div className="flex items-center gap-3 bg-black/40 py-2.5 px-4 rounded-full border border-white/5">
            <button onClick={() => controller.setIsMuted(!isMuted)} className="cursor-pointer">
              {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} className="text-gray-400" />}
            </button>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => controller.setVolume(parseFloat(e.target.value))}
              className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>
      </div>
    );
  }

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

        <div className="flex items-center gap-2">
          <canvas ref={canvasRef} className="w-16 h-8 opacity-70" width={80} height={40} />
          <button 
            onClick={handlePrev}
            className={`p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'} active:scale-90 cursor-pointer`}
          >
            <SkipBack size={15} />
          </button>
          <button 
            onClick={togglePlay}
            className="p-2 bg-blue-600 text-white rounded-full active:scale-95 transition-transform cursor-pointer"
          >
            {isPlaying ? <Pause size={15} className="fill-white" /> : <Play size={15} className="fill-white translate-x-[1px]" />}
          </button>
          <button 
            onClick={handleNext}
            className={`p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'} active:scale-90 cursor-pointer`}
          >
            <SkipForward size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-3xl border shadow-xl ${currentThemeStyles}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-gray-400">
          <Music size={18} />
          Entertainment & Cabin Ambient
        </h3>
        
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 items-end justify-center h-4 w-6">
            <span className={`w-0.5 bg-blue-500 rounded-full transition-all duration-300 ${isPlaying ? 'animate-bounce h-3' : 'h-1'}`} style={{ animationDelay: '0.1s' }} />
            <span className={`w-0.5 bg-blue-500 rounded-full transition-all duration-300 ${isPlaying ? 'animate-bounce h-4' : 'h-1.5'}`} style={{ animationDelay: '0.3s' }} />
            <span className={`w-0.5 bg-blue-400 rounded-full transition-all duration-300 ${isPlaying ? 'animate-bounce h-2' : 'h-1'}`} style={{ animationDelay: '0.5s' }} />
            <span className={`w-0.5 bg-cyan-400 rounded-full transition-all duration-300 ${isPlaying ? 'animate-bounce h-3.5' : 'h-2'}`} style={{ animationDelay: '0.2s' }} />
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl overflow-x-auto select-none no-scrollbar">
          {PLAYLIST.map((item, idx) => (
            <button
              key={`media-track-${item.id || idx}-${idx}`}
              onClick={() => controller.setTrackIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                idx === controller.currentTrackIndex 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>

        <div className="flex items-start gap-4">
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
            
            <div className="mt-2 h-10 w-full overflow-hidden rounded-xl bg-black/20 relative">
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" width={320} height={40} />
            </div>
          </div>
        </div>

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

        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => controller.setIsMuted(!isMuted)} 
              className="p-2 text-gray-400 hover:text-white rounded-full transition-colors active:scale-95 cursor-pointer"
            >
              {isMuted ? <VolumeX size={18} className="text-red-500" /> : <Volume2 size={18} />}
            </button>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => controller.setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrev}
              className="p-2 text-gray-300 hover:text-white rounded-full active:scale-90 transition-transform cursor-pointer"
            >
              <SkipBack size={18} />
            </button>
            <button 
              onClick={togglePlay}
              className="p-3 bg-blue-600 text-white rounded-full active:scale-95 shadow-lg shadow-blue-600/10 transition-transform hover:bg-blue-500 cursor-pointer"
            >
              {isPlaying ? <Pause size={18} className="fill-white" /> : <Play size={18} className="fill-white translate-x-[1px]" />}
            </button>
            <button 
              onClick={handleNext}
              className="p-2 text-gray-300 hover:text-white rounded-full active:scale-90 transition-transform cursor-pointer"
            >
              <SkipForward size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


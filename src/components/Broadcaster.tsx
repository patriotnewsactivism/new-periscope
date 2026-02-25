'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Mic, MicOff, AlertCircle, MapPin, Clock, Settings, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- Types ---
interface GPSData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface StreamStats {
  fps: number;
  resolution: string;
  bitrate: string;
}

// --- Constants ---
const WATERMARK_TEXT = "VibeStream LIVE";
const GPS_INTERVAL = 1000;

export default function Broadcaster() {
  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();
  const gpsWatchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  // --- State ---
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'streaming' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [gpsData, setGpsData] = useState<GPSData | null>(null);
  const [stats, setStats] = useState<StreamStats>({ fps: 0, resolution: '0x0', bitrate: '0kbps' });
  const [showSettings, setShowSettings] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // --- Helpers ---
  const updateStatus = (newStatus: typeof status, err?: string) => {
    setStatus(newStatus);
    if (err) setError(err);
  };

  // --- GPS Tracking ---
  const startGpsTracking = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsData({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      (err) => {
        console.warn('GPS Error:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: GPS_INTERVAL * 2
      }
    );
  }, []);

  const stopGpsTracking = useCallback(() => {
    if (gpsWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
    }
    setGpsData(null);
  }, []);

  // --- Canvas Render Loop ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video || !isActive) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // 1. Draw Video Frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 2. Draw Overlay Text
    ctx.save();
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Black background
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';

    // Timestamp
    const now = new Date();
    const timeStr = now.toISOString().split('.')[0];
    ctx.fillRect(10, canvas.height - 30, ctx.measureText(timeStr).width + 10, 20);
    ctx.fillStyle = 'white';
    ctx.fillText(timeStr, 15, canvas.height - 15);

    // GPS Coords
    if (gpsData) {
      const gpsStr = `${gpsData.latitude.toFixed(6)}, ${gpsData.longitude.toFixed(6)}`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(10, canvas.height - 60, ctx.measureText(gpsStr).width + 10, 20);
      ctx.fillStyle = 'white';
      ctx.fillText(gpsStr, 15, canvas.height - 45);
    }

    // 3. Watermark (Top Right)
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '14px monospace';
    ctx.fillText(WATERMARK_TEXT, canvas.width - 20, 30);

    ctx.restore();

    // 4. Update Stats (FPS)
    frameCountRef.current++;
    const elapsed = performance.now() - startTimeRef.current;
    if (elapsed >= 1000) {
      setStats(prev => ({
        ...prev,
        fps: Math.round((frameCountRef.current / elapsed) * 1000)
      }));
      frameCountRef.current = 0;
      startTimeRef.current = performance.now();
    }

    // Continue loop
    animationRef.current = requestAnimationFrame(draw);
  }, [isActive, gpsData]);

  // --- Stream Management ---
  const startStream = async () => {
    try {
      updateStatus('loading');

      // 1. Get Media Stream (Camera + Mic)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await new Promise(resolve => {
          if (videoRef.current!.readyState >= 2) {
            resolve(true);
          } else {
            videoRef.current!.onloadeddata = resolve;
          }
        });
      }

      // 2. Capture Canvas Stream
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');

      // 3. Start GPS & Loop
      startGpsTracking();
      startTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(draw);

      // 4. Generate output stream
      const outputStream = canvas.captureStream(30);
      const audioTracks = mediaStream.getAudioTracks();
      audioTracks.forEach(track => outputStream.addTrack(track));
      // You can use outputStream for streaming or recording

      // Simulate bitrate measurement
      setStats({
        fps: 0,
        resolution: `${canvas.width}x${canvas.height}`,
        bitrate: '1.2 Mbps'
      });

      setIsActive(true);
      updateStatus('streaming');
    } catch (err: any) {
      console.error(err);
      updateStatus('error', err.message || 'Failed to access media devices');
    }
  };

  const stopStream = async () => {
    setIsActive(false);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    stopGpsTracking();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    updateStatus('idle');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  // --- UI Handlers ---
  const toggleMute = () => {
    if (!streamRef.current) return;
    const audioTracks = streamRef.current.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = isMuted;
    });
    setIsMuted(!isMuted);
  };

  // --- Render ---
  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* --- Top Bar --- */}
      <header className="flex justify-between items-center p-4 bg-slate-900/50 border-b border-slate-800 backdrop-blur-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Camera className="text-white w-5 h-5" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">VibeStream <span className="text-blue-500">PRO</span></span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-400">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", status === 'streaming' ? 'bg-green-500' : 'bg-orange-500')} />
            {status.toUpperCase()}
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 relative flex flex-col md:flex-row">
        {/* Camera Feed */}
        <div className="flex-1 relative bg-black group">
          {/* Raw Video (Hidden visually but must be loaded to capture stream) */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover opacity-0"
          />
          
          {/* Canvas Output (Visually shown to user) */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Overlays when idle/loading */}
          {status === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white">
               <div className="text-center space-y-4">
                 <div className="w-24 h-24 border-4 border-dashed border-slate-700 rounded-full flex items-center justify-center mx-auto">
                    <Camera className="w-10 h-10 text-slate-500" />
                 </div>
                 <h2 className="text-2xl font-semibold">Ready to Broadcast</h2>
                 <p className="text-slate-400 max-w-sm mx-auto">Connect your camera and microphone to start streaming to thousands instantly.</p>
                 <button 
                    onClick={startStream}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg shadow-blue-600/25 transform hover:scale-105 active:scale-95"
                 >
                    Go Live
                 </button>
               </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white z-50">
               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
               <p className="text-lg font-medium">Initializing Camera...</p>
            </div>
          )}
        </div>

        {/* Controls Sidebar (Overlay on mobile) */}
        <div className={cn(
          "w-full md:w-80 bg-slate-900 border-l border-slate-800 flex flex-col z-30 transform transition-transform duration-300 md:static md:translate-x-0",
          showSettings ? "translate-x-0" : "md:translate-x-0 -translate-x-full"
        )}>
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                 <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">FPS</span>
                 </div>
                 <div className="text-2xl font-mono text-white">{stats.fps}</div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                 <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <Wifi className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Bitrate</span>
                 </div>
                 <div className="text-2xl font-mono text-white">{stats.bitrate}</div>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-300">Camera</p>
                      <p className="text-xs text-slate-500">720p HD</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
               </div>

               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-300">Audio</p>
                      <p className="text-xs text-slate-500">{isMuted ? 'Muted' : 'Active'}</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
               </div>

               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-300">Location</p>
                      <p className="text-xs text-slate-500">
                        {gpsData ? 'Tracking Enabled' : 'Permission Required'}
                      </p>
                    </div>
                  </div>
                  <div className={cn("w-2 h-2 rounded-full", gpsData ? 'bg-blue-500' : 'bg-slate-600')} />
               </div>
            </div>

            {error && (
              <div className="mt-8 p-4 bg-red-950/30 border border-red-900/50 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-6 bg-slate-950 border-t border-slate-800">
            {!isActive ? (
              <button 
                onClick={startStream}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
              >
                <Camera className="w-5 h-5" />
                Start Broadcast
              </button>
            ) : (
              <div className="flex gap-3">
                 <button 
                  onClick={toggleMute}
                  className={cn(
                    "flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all",
                    isMuted ? "bg-slate-800 text-slate-400 border border-slate-700" : "bg-slate-800 text-white hover:bg-slate-700"
                  )}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>

                <button 
                  onClick={stopStream}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 transition-all active:scale-95"
                >
                  <X className="w-4 h-4" />
                  Stop
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Settings Toggle Overlay */}
      {!showSettings && isActive && (
        <button
          onClick={() => setShowSettings(true)}
          className="absolute bottom-6 left-6 z-20 bg-slate-900/90 backdrop-blur text-white p-3 rounded-full shadow-xl border border-slate-700"
        >
          <Settings className="w-6 h-6" />
        </button>
      )}
      
      {showSettings && isActive && (
        <button
           onClick={() => setShowSettings(false)}
           className="absolute top-4 left-4 z-40 bg-slate-900/90 backdrop-blur text-white p-2 rounded-full border border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

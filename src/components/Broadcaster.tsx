'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Mic, MicOff, AlertCircle, MapPin, Clock, Settings, Wifi, ShieldCheck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { startBroadcast } from '@/actions/startBroadcast';
import { stopBroadcast } from '@/actions/stopBroadcast';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import timesync from 'timesync';

// --- Types ---
interface GPSData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export default function Broadcaster() {
  const router = useRouter();
  const supabase = createClient();
  
  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();
  const gpsWatchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const tsRef = useRef<any>(null);

  // --- Initialize TimeSync ---
  useEffect(() => {
    tsRef.current = timesync.create({
      server: '/api/timesync',
      interval: 10000
    });

    return () => {
      if (tsRef.current) tsRef.current.destroy();
    };
  }, []);

  // --- State ---
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'streaming' | 'error' | 'stopping'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [gpsData, setGpsData] = useState<GPSData | null>(null);
  const [broadcastInfo, setBroadcastInfo] = useState<any>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([])

  // --- Real-time Hearts ---
  useEffect(() => {
    if (!isActive || !broadcastInfo?.id || !supabase) return;

    const channel = supabase
      .channel(`hearts-${broadcastInfo.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hearts', filter: `stream_id=eq.${broadcastInfo.id}` }, 
        (payload: any) => {
          const id = Date.now();
          const x = Math.random() * 80 - 40;
          setHearts(prev => [...prev, { id, x }]);
          setTimeout(() => setHearts(prev => prev.filter(h => h.id !== id)), 2000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, [isActive, broadcastInfo, supabase]);

  // --- GPS Tracking ---
  const startGpsTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setGpsData({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      }),
      (err) => console.warn('GPS Error:', err.message),
      { enableHighAccuracy: true }
    );
  }, []);

  const stopGpsTracking = useCallback(() => {
    if (gpsWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
    }
  }, []);

  // --- Canvas Render Loop (The "Truth Layer") ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !isActive) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ensure canvas matches video aspect ratio but fits 9:16 focus
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // 1. Draw Video Frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 2. Burn-in Overlays
    ctx.save();
    
    // Background for text (for readability)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    
    // Timestamp (Bottom Left)
    const now = tsRef.current ? new Date(tsRef.current.now()) : new Date();
    const timeStr = now.toISOString();
    ctx.font = 'bold 14px monospace';
    const timeMetrics = ctx.measureText(timeStr);
    ctx.fillRect(10, canvas.height - 30, timeMetrics.width + 10, 20);
    ctx.fillStyle = 'white';
    ctx.fillText(timeStr, 15, canvas.height - 15);

    // GPS (Bottom Left, above timestamp)
    if (gpsData) {
      const gpsStr = `LAT: ${gpsData.latitude.toFixed(6)} LNG: ${gpsData.longitude.toFixed(6)}`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      const gpsMetrics = ctx.measureText(gpsStr);
      ctx.fillRect(10, canvas.height - 55, gpsMetrics.width + 10, 20);
      ctx.fillStyle = '#00ff00'; // Green for coordinates
      ctx.fillText(gpsStr, 15, canvas.height - 40);
    }

    // Verified Source Watermark (Top Right)
    ctx.textAlign = 'right';
    const watermark = "VERIFIED SOURCE - CIVIL RIGHTS DOCUMENTATION";
    ctx.font = '900 12px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(watermark, canvas.width - 15, 25);
    
    ctx.restore();

    animationRef.current = requestAnimationFrame(draw);
  }, [isActive, gpsData]);

  // --- Stream Management ---
  const handleStartBroadcast = async () => {
    try {
      setStatus('loading');
      setError(null);
      
      // 1. Get User Media
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
        audio: true
      });
      streamRef.current = mediaStream;
      if (videoRef.current) videoRef.current.srcObject = mediaStream;

      // 2. Start Mux Broadcast via Server Action
      const info = await startBroadcast(
        "Live Documentation", 
        "Verified investigative journalism feed.", 
        "user-123" // Replace with real user ID from auth
      );
      
      if (!info || !info.streamKey) {
        throw new Error("Failed to initialize broadcast stream. Please check configuration.");
      }
      
      setBroadcastInfo(info);

      // 3. Start Overlays & Loop
      setIsActive(true);
      startGpsTracking();
      startTimeRef.current = Date.now(); // Track start time for duration
      setStatus('streaming');
      
      // Note: In a real implementation, we would use a library like 
      // amazon-ivs-web-broadcast to pipe canvas.captureStream(30) to Mux.
      console.log("Broadcasting started to Mux with Key:", info.streamKey);

    } catch (err: any) {
      console.error("Broadcast Error:", err);
      setError(err.message || "Failed to start broadcast. Please try again.");
      setStatus('error');
    }
  };

  const handleStopBroadcast = async () => {
    if (!broadcastInfo) return;
    
    try {
        setStatus('stopping');
        
        // Calculate duration
        const duration = Date.now() - startTimeRef.current;
        
        // Stop local tracking
        setIsActive(false);
        stopGpsTracking();
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Call server action to archive and log
        await stopBroadcast(
            broadcastInfo.id, 
            broadcastInfo.streamId, 
            "user-123", // Replace with real user ID
            { 
                gps: gpsData,
                duration: duration
            }
        );
        
        setStatus('idle');
        setBroadcastInfo(null);
        router.push('/');
        
    } catch (err: any) {
        console.error("Stop Broadcast Error:", err);
        setError(err.message || "Failed to stop broadcast cleanly.");
        setStatus('error');
    }
  };

  useEffect(() => {
    if (isActive) animationRef.current = requestAnimationFrame(draw);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isActive, draw]);

  return (
    <div className="h-screen w-full bg-black flex items-center justify-center overflow-hidden">
      {/* 9:16 Mobile Preview Container */}
      <div className="relative w-full max-w-[56.25vh] h-full bg-slate-900 overflow-hidden shadow-2xl flex flex-col">
        
        {/* Hidden Source Video */}
        <video ref={videoRef} autoPlay playsInline muted className="hidden" />
        
        {/* Burned-in Canvas Output */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

        {/* Floating Hearts */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            <AnimatePresence>
                {hearts.map(heart => (
                    <motion.div
                        key={heart.id}
                        initial={{ opacity: 1, y: "80vh", x: `calc(50% + ${heart.x}px)`, scale: 0.5 }}
                        animate={{ opacity: 0, y: "20vh", x: `calc(50% + ${heart.x * 2}px)`, scale: 1.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="absolute"
                    >
                        <Heart className="w-8 h-8 fill-red-500 text-red-500 drop-shadow-lg" />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>

        {/* UI Overlays */}
        <div className="relative z-30 flex flex-col h-full pointer-events-none">
          
          {/* Top Bar */}
          <div className="p-4 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-2">
              <div className={cn("h-3 w-3 rounded-full animate-pulse", status === 'streaming' ? "bg-red-600" : "bg-slate-500")} />
              <span className="text-white text-xs font-black uppercase tracking-tighter">REC</span>
              {status === 'streaming' && (
                <div className="ml-2 px-2 py-0.5 bg-blue-600 rounded text-[10px] font-bold text-white uppercase">Live</div>
              )}
            </div>
            <button 
              onClick={() => router.push('/')}
              className="pointer-events-auto p-2 rounded-full bg-black/20 text-white/70 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1" />

          {/* Bottom Bar Controls */}
          <div className="p-6 bg-gradient-to-t from-black/80 to-transparent space-y-4">
            
            {status === 'idle' && (
              <div className="text-center space-y-4 pointer-events-auto">
                <ShieldCheck className="w-12 h-12 text-blue-500 mx-auto" />
                <div className="text-white">
                  <h2 className="text-xl font-bold">Start Secure Broadcast</h2>
                  <p className="text-xs text-slate-400 mt-1">Video will be watermarked with GPS & Time for evidentiary integrity.</p>
                </div>
                <button 
                  onClick={handleStartBroadcast}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg transition-transform active:scale-95"
                >
                  GO LIVE
                </button>
              </div>
            )}

            {status === 'streaming' && (
              <div className="flex items-center gap-4 pointer-events-auto">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={cn("p-4 rounded-full backdrop-blur-md border transition-all", isMuted ? "bg-red-500/20 border-red-500 text-red-500" : "bg-white/10 border-white/20 text-white")}
                >
                  {isMuted ? <MicOff /> : <Mic />}
                </button>
                <button 
                  onClick={handleStopBroadcast}
                  className="flex-1 py-4 bg-white text-black font-black rounded-xl shadow-lg active:scale-95 transition-transform"
                >
                  STOP BROADCAST
                </button>
              </div>
            )}

            {status === 'loading' && (
              <div className="text-center py-4">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-white text-xs mt-2 font-bold uppercase tracking-widest">Initializing...</p>
              </div>
            )}
            
            {status === 'stopping' && (
              <div className="text-center py-4">
                <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-white text-xs mt-2 font-bold uppercase tracking-widest">Finishing & Archiving...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="p-4 bg-red-950/80 backdrop-blur-md border border-red-500 rounded-lg pointer-events-auto">
                <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-red-200 font-bold text-xs">Broadcast Failed</h3>
                        <p className="text-red-200/80 text-[10px] mt-1">{error || "Connection failed. Please check your network and try again."}</p>
                    </div>
                </div>
                <button onClick={() => setStatus('idle')} className="w-full mt-3 py-2 bg-red-900/50 hover:bg-red-900 text-white text-xs font-bold rounded border border-red-800">
                    DISMISS
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

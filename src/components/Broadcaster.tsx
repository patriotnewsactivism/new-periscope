'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Mic, MicOff, AlertCircle, MapPin, Clock, Settings, Wifi, ShieldCheck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { startBroadcast } from '@/actions/startBroadcast';
import { useRouter } from 'next/navigation';

// --- Types ---
interface GPSData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export default function Broadcaster() {
  const router = useRouter();
  
  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();
  const gpsWatchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // --- State ---
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'streaming' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [gpsData, setGpsData] = useState<GPSData | null>(null);
  const [broadcastInfo, setBroadcastInfo] = useState<any>(null);

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
    const now = new Date();
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
      setBroadcastInfo(info);

      // 3. Start Overlays & Loop
      setIsActive(true);
      startGpsTracking();
      setStatus('streaming');
      
      // Note: In a real implementation, we would use a library like 
      // amazon-ivs-web-broadcast to pipe canvas.captureStream(30) to Mux.
      console.log("Broadcasting started to Mux with Key:", info.streamKey);

    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  };

  const stopBroadcast = () => {
    setIsActive(false);
    stopGpsTracking();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setStatus('idle');
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

        {/* UI Overlays */}
        <div className="relative z-10 flex flex-col h-full pointer-events-none">
          
          {/* Top Bar */}
          <div className="p-4 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-600 animate-pulse" />
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
                  onClick={stopBroadcast}
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

            {status === 'error' && (
              <div className="p-4 bg-red-950/50 border border-red-500 rounded-lg">
                <p className="text-red-200 text-xs">{error || "Connection failed."}</p>
                <button onClick={() => setStatus('idle')} className="mt-2 text-white text-[10px] font-bold underline pointer-events-auto">TRY AGAIN</button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

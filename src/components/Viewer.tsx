"use client"

import React, { useState, useRef, useEffect } from "react"
import MuxPlayer from "@mux/mux-player-react"
import { MessageCircle, Heart, Share2, X, MoreVertical, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import ChatOverlay from "./ChatOverlay"
import HeartEngine, { HeartEngineHandle } from "./HeartEngine"
import { motion, AnimatePresence } from "framer-motion"
import { saveStreamForEvidence } from "@/actions/saveStreamForEvidence"
import { cn } from "@/lib/utils"

interface ViewerProps {
  streamId: string
  muxPlaybackId: string
  title?: string
  description?: string
}

export default function Viewer({ streamId, muxPlaybackId, title, description }: ViewerProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const heartEngineRef = useRef<HeartEngineHandle>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  
  const handleSaveForEvidence = async () => {
    setIsSaving(true)
    try {
      await saveStreamForEvidence(streamId, {
        description: "User requested evidence capture",
        metadata: {
          captured_at: new Date().toISOString(),
          viewer_id: "anonymous"
        }
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error("Save for evidence failed:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleHeartClick = () => {
    heartEngineRef.current?.addHeart()
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center">
      <div 
        ref={playerContainerRef} 
        className="relative w-full max-w-[56.25vh] h-full bg-slate-900 shadow-2xl flex flex-col"
      >
        <div className="absolute inset-0 z-0">
          <MuxPlayer
            playbackId={muxPlaybackId}
            className="w-full h-full object-cover"
            streamType="live"
            autoPlay
            muted={false}
          />
        </div>

        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
              <img src={`https://i.pravatar.cc/150?u=${streamId}`} alt="Broadcaster" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm drop-shadow-md">{title || "Live Stream"}</h3>
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded text-white uppercase tracking-wider">Live</span>
                <span className="text-white/80 text-xs drop-shadow-md">Verified Feed</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-black/20" onClick={() => window.history.back()}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col">
          <div className="h-[40vh] px-4 pointer-events-none">
            <div className="h-full pointer-events-auto overflow-hidden flex flex-col justify-end">
              <ChatOverlay streamId={streamId} className="bg-transparent" />
            </div>
          </div>

          <div className="p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-3">
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSaveForEvidence}
                disabled={isSaving || saveSuccess}
                className={cn(
                  "w-12 h-12 rounded-full backdrop-blur-md border flex items-center justify-center transition-all active:scale-90",
                  saveSuccess ? "bg-green-500 border-green-400 text-white" : "bg-blue-600/20 border-blue-500/50 text-blue-400 hover:bg-blue-600/30"
                )}
              >
                <Shield className={cn("w-6 h-6", isSaving && "animate-pulse")} />
              </button>
              <button 
                onClick={handleHeartClick}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
              >
                <Heart className="w-6 h-6 fill-red-500 text-red-500" />
              </button>
              <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                <Share2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <HeartEngine ref={heartEngineRef} />
      </div>
    </div>
  )
}

"use client"

import React, { useState, useRef, useEffect } from "react"
import { MuxPlayer } from "@mux/mux-player-react"
import { MessageCircle, Volume2, Settings, Maximize, Monitor, Headphones } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ChatOverlay from "./ChatOverlay"
import HeartEngine from "./HeartEngine"

interface ViewerProps {
  streamId: string
  muxPlaybackId: string
}

export default function Viewer({ streamId, muxPlaybackId }: ViewerProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(70)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [showChat, setShowChat] = useState(true)
  
  // Refs for fullscreen functionality
  const playerContainerRef = useRef<HTMLDivElement>(null)
  
  // Handle volume changes
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }
  
  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])
  
  return (
    <div className={`w-full h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Player Container with Overlays */}
      <div ref={playerContainerRef} className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
        {/* Mux Player */}
        <MuxPlayer
          playbackId={muxPlaybackId}
          poster="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=1000"
          className="w-full h-full"
          streamType="on-demand"
          playbackRate={playbackRate}
          muted={isMuted}
          volume={isMuted ? 0 : volume}
          autoPlay
        />
        
        {/* Stream Title Overlay */}
        <div className="absolute bottom-20 left-0 right-0 p-4 flex items-end justify-between z-10">
          <div className="bg-black/60 backdrop-blur-sm p-3 rounded-lg max-w-md">
            <h1 className="text-xl font-bold text-white mb-1">
              The Future of Digital Health
            </h1>
            <p className="text-white/80 text-sm">
              Live stream with interactive health metrics and AI insights
            </p>
          </div>
        </div>
        
        {/* Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 z-20">
          {/* Volume Control */}
          <div className="flex items-center space-x-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted || volume === 0 ? <Volume2 className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <div className="w-24">
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
              />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Live Stream Controls */}
      <div className="flex flex-col lg:flex-row h-[calc(100%-66.67%)] mt-4 gap-4">
        {/* Main Content and Chat */}
        <div className={`flex-1 flex ${showChat ? 'flex-row' : 'flex-col'} gap-4`}>
          {/* Heart Engine Animation Container */}
          <div className="bg-white rounded-lg p-4 shadow-md flex-1 min-h-[200px]">
            <h2 className="text-xl font-semibold mb-4">Live Health Metrics</h2>
            <div className="w-full h-64 flex items-center justify-center">
              <HeartEngine />
            </div>
          </div>
          
          {/* Chat Overlay */}
          {showChat && (
            <div className="lg:w-80 bg-white rounded-lg p-4 shadow-md flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Chat</h3>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Live
                </span>
              </div>
              <ChatOverlay streamId={streamId} />
            </div>
          )}
        </div>
      </div>
      
      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Playback Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="h-4 w-4" />
                <span className="text-sm">Playback Speed</span>
              </div>
              <div className="flex items-center space-x-2">
                {[0.5, 1, 1.5, 2].map((rate) => (
                  <Button
                    key={rate}
                    variant={playbackRate === rate ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPlaybackRate(rate)}
                    className={playbackRate === rate ? "bg-blue-600" : ""}
                  >
                    {rate}x
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Headphones className="h-4 w-4" />
                <span className="text-sm">Audio Quality</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  Auto
                </Button>
                <Button variant="ghost" size="sm">
                  High
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
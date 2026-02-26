"use client"

import React from 'react';
import MuxPlayer from "@mux/mux-player-react";
import { X } from 'lucide-react';

interface MapPreviewProps {
  playbackId: string;
  title: string;
  viewerCount: number;
  onClose: () => void;
}

export default function MapPreview({ playbackId, title, viewerCount, onClose }: MapPreviewProps) {
  return (
    <div className="w-64 bg-slate-900 rounded-lg overflow-hidden shadow-2xl border border-slate-700 font-sans">
      <div className="relative aspect-video bg-black">
        <MuxPlayer
          playbackId={playbackId}
          streamType="live"
          autoPlay
          muted
          className="w-full h-full object-cover"
        />
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
        >
          <X className="w-3 h-3" />
        </button>
        <div className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
          Live
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-white font-bold text-sm truncate">{title}</h3>
        <p className="text-slate-400 text-xs mt-1">{viewerCount} watching</p>
      </div>
    </div>
  );
}

"use client"

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Types
type Stream = {
  id: string;
  streamer_id: string;
  title: string;
  mux_playback_id: string;
  is_live: boolean;
  latitude?: number;
  longitude?: number;
  created_at: string;
};

// DiscoveryMap Component
const DiscoveryMap: React.FC = () => {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!mapboxAccessToken) {
      console.error('Mapbox access token not found');
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-98.0, 38.0],
      zoom: 3,
      accessToken: mapboxAccessToken,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => map.remove();
  }, []);

  // Fetch Active Streams from Supabase
  useEffect(() => {
    const fetchActiveStreams = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('streams')
          .select('*')
          .eq('is_live', true);

        if (error) throw error;
        setStreams(data || []);
      } catch (error) {
        console.error('Error fetching active streams:', error);
      }
    };

    fetchActiveStreams();
    const intervalId = setInterval(fetchActiveStreams, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Update Map Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    streams.forEach((stream) => {
      // Use random coordinates if not available for demo purposes, 
      // but in real app we'd filter or handle missing data.
      const lat = stream.latitude || (Math.random() * 40 + 20);
      const lng = stream.longitude || (Math.random() * 60 - 110);

      const el = document.createElement('div');
      el.className = 'pulsing-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#ef4444';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(map);

      el.addEventListener('click', () => {
        router.push(`/viewer/${stream.id}`);
      });

      markersRef.current.push(marker);
    });
  }, [streams, router]);

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden shadow-2xl border border-slate-800">
      <div ref={mapContainerRef} className="absolute inset-0" />
      {streams.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
          <p className="text-white/60 text-sm font-medium">Scanning for live broadcasts...</p>
        </div>
      )}
    </div>
  );
};

export default DiscoveryMap;

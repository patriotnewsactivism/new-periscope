import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Types
type Stream = {
  id: string;
  user_id: string;
  username: string;
  title: string;
  thumbnail_url?: string;
  viewer_count: number;
  latitude?: number;
  longitude?: number;
  created_at: string;
};

// DiscoveryMap Component
const DiscoveryMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check for Mapbox access token
    const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!mapboxAccessToken) {
      console.error('Mapbox access token not found');
      return;
    }

    // Initialize map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-98.0, 38.0], // Centered on US
      zoom: 3,
      accessToken: mapboxAccessToken,
    });

    mapRef.current = map;

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Handle map load
    map.on('load', () => {
      // Add map source and layer for streams (using GeoJSON)
      map.addSource('active-streams', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Cleanup
      return () => map.remove();
    });
  }, []);

  // Fetch Active Streams from Supabase
  useEffect(() => {
    const fetchActiveStreams = async () => {
      try {
        // In a real app, you'd use your Supabase client here
        // For demo purposes, I'll use mock data
        const mockStreams: Stream[] = [
          {
            id: '1',
            user_id: 'user1',
            username: 'streamer1',
            title: 'Amazing stream from New York!',
            thumbnail_url: 'https://picsum.photos/200/113',
            viewer_count: 42,
            latitude: 40.7128,
            longitude: -74.0060,
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            user_id: 'user2',
            username: 'streamer2',
            title: 'Exploring the mountains!',
            thumbnail_url: 'https://picsum.photos/200/114',
            viewer_count: 105,
            latitude: 39.7392,
            longitude: -104.9903,
            created_at: new Date().toISOString(),
          },
          {
            id: '3',
            user_id: 'user3',
            username: 'streamer3',
            title: 'Live from the beach!',
            thumbnail_url: 'https://picsum.photos/200/115',
            viewer_count: 73,
            latitude: 33.7490,
            longitude: -84.3880,
            created_at: new Date().toISOString(),
          },
        ];

        setStreams(mockStreams);
      } catch (error) {
        console.error('Error fetching active streams:', error);
      }
    };

    // Initial fetch
    fetchActiveStreams();

    // Poll for updates (every 30 seconds)
    const intervalId = setInterval(fetchActiveStreams, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Update Map Markers with Streams
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers for active streams
    streams.forEach((stream) => {
      if (!stream.latitude || !stream.longitude) return;

      // Create marker element
      const el = document.createElement('div');
      el.className = 'pulsing-marker';
      
      // Add styles (we'll also define these in CSS)
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#ef4444';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 0 0 0 rgba(239, 68, 68, 1)';
      el.style.animation = 'pulse 2s infinite';

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([stream.longitude, stream.latitude]);

      // Add click event for popup
      marker.getElement().addEventListener('click', () => {
        showStreamPreview(stream);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    // Update GeoJSON source
    const source = map.getSource('active-streams') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: streams
          .filter((s) => s.latitude && s.longitude)
          .map((stream) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [stream.longitude as number, stream.latitude as number],
            },
            properties: stream,
          })),
      } as mapboxgl.GeoJSONSource['data']);
    }
  }, [streams]);

  // Show Stream Preview Popup
  const showStreamPreview = (stream: Stream) => {
    const map = mapRef.current;
    if (!map || !stream.latitude || !stream.longitude) return;

    // Create popup
    const popup = new mapboxgl.Popup({
      offset: 30,
      className: 'stream-preview-popup',
    })
      .setLngLat([stream.longitude, stream.latitude])
      .setHTML(`
        <div class="stream-preview-content">
          <div class="stream-preview-thumbnail">
            <img 
              src="${stream.thumbnail_url}" 
              alt="${stream.title}"
              class="w-full h-24 object-cover rounded-t-lg"
            />
            <div class="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
              ${stream.viewer_count} viewers
            </div>
          </div>
          <div class="p-3">
            <h3 class="font-semibold text-sm text-gray-900 truncate">${stream.username}</h3>
            <p class="text-xs text-gray-600 line-clamp-2 mt-1">${stream.title}</p>
          </div>
        </div>
      `);

    // Remove existing popup if open
    if (popupRef.current) {
      popupRef.current.remove();
    }

    popup.addTo(map);
    popupRef.current = popup;
  };

  return (
    <div className="relative w-full h-[600px] md:h-[800px] rounded-xl overflow-hidden shadow-2xl">
      {/* Map Container - responsive height for mobile */}
      <div 
        ref={mapContainerRef} 
        className="absolute inset-0"
      />
      
      {/* Loading indicator */}
      {streams.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-sm">Loading active streams...</p>
          </div>
        </div>
      )}
      
      {/* Mobile Map Controls - Custom positioning for better accessibility */}
      <div className="absolute top-4 left-4 z-10 md:hidden">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2">
          <button 
            onClick={() => mapRef.current?.zoomIn()}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-md shadow-sm hover:bg-gray-50 text-gray-700 mb-2"
            aria-label="Zoom in"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button 
            onClick={() => mapRef.current?.zoomOut()}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-md shadow-sm hover:bg-gray-50 text-gray-700"
            aria-label="Zoom out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryMap;
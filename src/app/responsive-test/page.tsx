'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MapPin, MessageSquare, ThumbsUp, MoreHorizontal, Camera, X } from 'lucide-react';

// Mock thumbnail component with different sizes
const Thumbnail = ({ size = 'md', optimized = true }: { size?: 'sm' | 'md' | 'lg' | 'xl'; optimized?: boolean }) => {
  const sizes = {
    sm: 'w-24 h-16',
    md: 'w-32 h-20',
    lg: 'w-48 h-32',
    xl: 'w-64 h-40',
  };

  return (
    <div className={`${sizes[size]} relative overflow-hidden rounded-lg bg-gray-100`}>
      <Image
        src={optimized ? 'https://picsum.photos/seed/optimized/800/600' : 'https://picsum.photos/seed/unoptimized/2000/1500'}
        alt="Thumbnail"
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-300 hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
        <div className="p-2 text-white text-xs font-medium">
          {optimized ? 'Optimized (800×600)' : 'Unoptimized (2000×1500)'}
        </div>
      </div>
    </div>
  );
};

// Mock map component
const MapComponent = () => {
  return (
    <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-600 text-sm">Map Placeholder</p>
          <p className="text-gray-400 text-xs mt-1">Mapbox GL integration test</p>
        </div>
      </div>
    </div>
  );
};

// Mock chat component
const ChatComponent = ({ isOpen = true }: { isOpen?: boolean }) => {
  const [messages, setMessages] = useState([
    { id: 1, user: 'User1', text: 'This is a test message', time: '10:30' },
    { id: 2, user: 'User2', text: 'Another message to test chat', time: '10:31' },
    { id: 3, user: 'User3', text: 'Responsive chat interface works well!', time: '10:32' },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      setMessages([
        ...messages,
        { id: messages.length + 1, user: 'You', text: inputText, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
      ]);
      setInputText('');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-medium text-gray-900">Chat</h3>
        <div className="text-xs text-gray-500">{messages.length} messages</div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
              {message.user.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline space-x-2">
                <span className="text-sm font-medium text-gray-900">{message.user}</span>
                <span className="text-xs text-gray-500">{message.time}</span>
              </div>
              <p className="text-sm text-gray-700 mt-1">{message.text}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="p-3 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

// Mobile view test component
const MobileTestView = () => {
  const [isChatOpen, setIsChatOpen] = useState(true);

  return (
    <div className="relative w-full max-w-sm mx-auto bg-gray-100 rounded-lg overflow-hidden shadow-xl">
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <h2 className="text-xl font-bold text-gray-900">9:16 Mobile Test</h2>
        <div className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
          9:16 Aspect Ratio
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Thumbnail test */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Thumbnail Optimization</h3>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <Thumbnail size="sm" optimized={true} />
            <Thumbnail size="sm" optimized={false} />
          </div>
        </div>

        {/* Map component test */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Map Interaction</h3>
          <div className="h-40">
            <MapComponent />
          </div>
        </div>

        {/* Chat toggle */}
        <div className="flex justify-end">
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            {isChatOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Chat component - takes full width on mobile */}
      <div className={`h-64 transition-all duration-300 ${isChatOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <ChatComponent isOpen={isChatOpen} />
      </div>
    </div>
  );
};

// Tablet view test component
const TabletTestView = () => {
  return (
    <div className="relative w-full max-w-3xl mx-auto bg-gray-100 rounded-lg overflow-hidden shadow-xl">
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <h2 className="text-xl font-bold text-gray-900">Tablet Test</h2>
        <div className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
          4:3 / 16:9 Aspect Ratio
        </div>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Thumbnail test */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Thumbnail Sizes</h3>
          <div className="space-y-2">
            <Thumbnail size="md" optimized={true} />
            <Thumbnail size="md" optimized={false} />
          </div>
        </div>

        {/* Map component test */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Map Component</h3>
          <div className="h-40">
            <MapComponent />
          </div>
        </div>

        {/* Chat component - side panel */}
        <div className="col-span-2 h-64">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Chat Interface</h3>
          <ChatComponent isOpen={true} />
        </div>
      </div>
    </div>
  );
};

// Desktop view test component
const DesktopTestView = () => {
  return (
    <div className="relative w-full max-w-5xl mx-auto bg-gray-100 rounded-lg overflow-hidden shadow-xl">
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <h2 className="text-xl font-bold text-gray-900">Desktop Test</h2>
        <div className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
          16:9 Aspect Ratio
        </div>
      </div>
      
      <div className="p-4 grid grid-cols-3 gap-4">
        {/* Thumbnail test */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Thumbnail Grid</h3>
          <div className="space-y-3">
            <Thumbnail size="lg" optimized={true} />
            <Thumbnail size="lg" optimized={false} />
          </div>
        </div>

        {/* Map component test */}
        <div className="col-span-2">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Map & Location</h3>
          <div className="h-64">
            <MapComponent />
          </div>
        </div>

        {/* Chat component - side panel */}
        <div className="col-span-1 h-64">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Chat Widget</h3>
          <ChatComponent isOpen={true} />
        </div>
      </div>
    </div>
  );
};

export default function ResponsiveTestPage() {
  const [activeView, setActiveView] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Responsive UI Test Suite</h1>
          <p className="text-gray-600">Verify your interface on different screen sizes and aspect ratios</p>
        </div>

        {/* View selector */}
        <div className="flex justify-center mb-8 space-x-4">
          <button
            onClick={() => setActiveView('mobile')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${activeView === 'mobile' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            Mobile (9:16)
          </button>
          <button
            onClick={() => setActiveView('tablet')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${activeView === 'tablet' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            Tablet (4:3)
          </button>
          <button
            onClick={() => setActiveView('desktop')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${activeView === 'desktop' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            Desktop (16:9)
          </button>
        </div>

        {/* Test view */}
        <div className="relative min-h-[600px] flex items-center justify-center">
          {activeView === 'mobile' && (
            <div className="aspect-[9/16] w-full max-w-sm">
              <MobileTestView />
            </div>
          )}
          {activeView === 'tablet' && (
            <div className="aspect-[4/3] w-full max-w-3xl">
              <TabletTestView />
            </div>
          )}
          {activeView === 'desktop' && (
            <div className="aspect-video w-full max-w-5xl">
              <DesktopTestView />
            </div>
          )}
        </div>

        {/* Test checklist */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Test Checklist</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start space-x-2">
              <div className="mt-1 h-4 w-4 text-purple-600">✅</div>
              <div>
                <h3 className="font-medium text-gray-900">Mobile Responsiveness</h3>
                <p className="text-sm text-gray-600">Test components fit 9:16 screen</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="mt-1 h-4 w-4 text-blue-600">✅</div>
              <div>
                <h3 className="font-medium text-gray-900">Thumbnail Optimization</h3>
                <p className="text-sm text-gray-600">Verify image loading and sizing</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="mt-1 h-4 w-4 text-green-600">✅</div>
              <div>
                <h3 className="font-medium text-gray-900">Map Interactions</h3>
                <p className="text-sm text-gray-600">Check map component on small screens</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="mt-1 h-4 w-4 text-orange-600">✅</div>
              <div>
                <h3 className="font-medium text-gray-900">Chat Interface</h3>
                <p className="text-sm text-gray-600">Test chat on different screen sizes</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="mt-1 h-4 w-4 text-red-600">✅</div>
              <div>
                <h3 className="font-medium text-gray-900">Vertical Layout</h3>
                <p className="text-sm text-gray-600">Ensure content flows vertically</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="mt-1 h-4 w-4 text-indigo-600">✅</div>
              <div>
                <h3 className="font-medium text-gray-900">Performance</h3>
                <p className="text-sm text-gray-600">Check loading times and responsiveness</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
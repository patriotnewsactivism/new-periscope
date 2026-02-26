import Link from 'next/link';
import DiscoveryMap from '@/components/DiscoveryMap';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2 font-bold text-xl text-white">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-lg">⚓</span>
            </div>
            Periscope
          </div>
          <div className="flex items-center gap-4">
            <Link href="/broadcast">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Go Live
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 md:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-500/10 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full" />
        <div className="absolute bottom-0 left-0 w-1/2 h-full bg-purple-500/10 blur-3xl translate-y-1/2 -translate-x-1/2 rounded-full" />
        
        <div className="container mx-auto relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
            <span className="block bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              See the World
            </span>
            <span className="block text-white mt-2">Through Someone Else's Eyes</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Discover live streams from around the globe. Broadcast your moment. Connect with people everywhere.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Link href="/broadcast">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6">
                Start Broadcasting
              </Button>
            </Link>
            <Link href="#discover">
              <Button className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white text-lg px-8 py-6">
                Watch Live
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Discovery Section */}
      <section id="discover" className="py-20 px-4 md:px-8 bg-slate-900/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-white">
            Discover Live Streams
          </h2>
          <DiscoveryMap />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
              <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                <span className="text-xl">🎥</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">HD Streaming</h3>
              <p className="text-slate-400">
                Broadcast and watch in high definition quality with low latency.
              </p>
            </div>
            
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
              <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                <span className="text-xl">🌍</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Global Map</h3>
              <p className="text-slate-400">
                Explore live streams from all over the world on our interactive map.
              </p>
            </div>
            
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
              <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 mb-6">
                <span className="text-xl">💬</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Live Chat</h3>
              <p className="text-slate-400">
                Connect with streamers and other viewers in real-time chat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 md:px-8 border-t border-slate-800 bg-slate-950">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 font-bold text-xl text-white mb-4">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-lg">⚓</span>
            </div>
            Periscope
          </div>
          <p className="text-slate-500 mb-6">
            A modern live streaming platform built with Next.js and Mux.
          </p>
          <div className="flex justify-center gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

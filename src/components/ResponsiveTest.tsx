'use client';

import { useState, useEffect } from 'react';

export function ResponsiveTest() {
  const [viewWidth, setViewWidth] = useState(0);
  const [viewHeight, setViewHeight] = useState(0);

  useEffect(() => {
    const updateSize = () => {
      setViewWidth(window.innerWidth);
      setViewHeight(window.innerHeight);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getBreakpoint = (width: number) => {
    if (width < 640) return 'sm';
    if (width < 768) return 'md';
    if (width < 1024) return 'lg';
    if (width < 1280) return 'xl';
    if (width < 1536) return '2xl';
    return '3xl+';
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-slate-950/90 border border-slate-800 rounded-lg p-4 shadow-xl backdrop-blur-sm max-w-xs">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Viewport Information
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Width:</span>
          <span className="text-white font-mono">{viewWidth}px</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Height:</span>
          <span className="text-white font-mono">{viewHeight}px</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Breakpoint:</span>
          <span className="text-white font-mono">{getBreakpoint(viewWidth)}</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
          &lt;640px (sm)
        </div>
        <div className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
          640-768px (md)
        </div>
        <div className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
          768-1024px (lg)
        </div>
        <div className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
          1024-1280px (xl)
        </div>
        <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded col-span-2">
          &gt;1536px (3xl+)
        </div>
      </div>
    </div>
  );
}

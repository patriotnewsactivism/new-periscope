import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Periscope Clone - Live Streaming Platform',
  description: 'A modern live streaming platform built with Next.js and Mux',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

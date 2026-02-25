"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Activity } from "lucide-react"

interface HeartEngineProps {
  className?: string
}

// Optimized SVG Heart Component
const SVGHeart = ({ size = 128, color = "#ef4444", opacity = 1 }: { size?: number; color?: string; opacity?: number }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      opacity={opacity}
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Floating Heart Particles
const FloatingHearts = () => {
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number; size: number; speed: number; delay: number; color: string }>>([])

  useEffect(() => {
    // Generate initial floating hearts
    const initialHearts = Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 0.5 + 0.5,
      speed: Math.random() * 0.5 + 0.3,
      delay: Math.random() * 2,
      color: ["#ef4444", "#f87171", "#ec4899", "#f43f5e", "#fb7185"][Math.floor(Math.random() * 5)]
    }))
    setHearts(initialHearts)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          initial={{ opacity: 0, y: "100%" }}
          animate={{
            y: "-100%",
            x: [0, Math.random() * 50 - 25, Math.random() * 50 - 25, 0],
            opacity: [0, 0.6, 0.8, 0.3, 0],
            scale: [0.8, 1, 1.2, 1, 0.8]
          }}
          transition={{
            duration: heart.speed * 10,
            repeat: Infinity,
            delay: heart.delay,
            ease: "easeOut"
          }}
          className="absolute"
          style={{
            left: `${heart.x}%`,
            transform: `translate(-50%, 0) scale(${heart.size})`
          }}
        >
          <SVGHeart size={32} color={heart.color} opacity={0.7} />
        </motion.div>
      ))}
    </div>
  )
}

export default function HeartEngine({ className = "" }: HeartEngineProps) {
  const [isBeating, setIsBeating] = useState(false)
  const [heartRate, setHeartRate] = useState(72)
  const [lastBeatTime, setLastBeatTime] = useState(Date.now())
  
  // Refs for performance optimization
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Simulate real-time heart rate fluctuations
  useEffect(() => {
    heartbeatIntervalRef.current = setInterval(() => {
      const now = Date.now()
      const timeSinceLastBeat = now - lastBeatTime
      
      // Calculate expected time between beats based on current heart rate
      const expectedInterval = (60 / heartRate) * 1000
      
      // If it's time for a beat
      if (timeSinceLastBeat >= expectedInterval) {
        setIsBeating(true)
        setLastBeatTime(now)
        
        // Stop the beat after a short duration
        setTimeout(() => {
          setIsBeating(false)
        }, 200)
        
        // Random fluctuation in heart rate (±5 BPM) for realism
        const fluctuation = Math.floor(Math.random() * 11) - 5
        const newHeartRate = Math.max(60, Math.min(85, heartRate + fluctuation))
        setHeartRate(newHeartRate)
      }
    }, 50)
    
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [heartRate, lastBeatTime])
  
  // Enhanced heartbeat animation variants with improved easing
  const heartVariants = {
    normal: { scale: 1, opacity: 1 },
    beating: { 
      scale: [1, 1.4, 1.1, 1.3, 1],
      opacity: [1, 0.9, 1, 0.9, 1],
      transition: { 
        duration: 0.4,
        ease: "easeInOut",
        times: [0, 0.3, 0.5, 0.7, 1]
      }
    },
    stopped: { scale: 0.8, opacity: 0.5 }
  }

  // Dynamic background pulse based on heart rate
  const pulseDuration = useMemo(() => 60 / heartRate, [heartRate])
  
  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center ${className}`}>
      {/* Floating Heart Particles */}
      <FloatingHearts />
      
      {/* Main Animated Heart */}
      <motion.div
        variants={heartVariants}
        initial="normal"
        animate={isBeating ? "beating" : "normal"}
        className="relative z-10"
      >
        <SVGHeart size={128} color="#ef4444" opacity={1} />
      </motion.div>
      
      {/* Multi-layer Pulse Effects */}
      <AnimatePresence>
        {isBeating && (
          <>
            <motion.div
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <SVGHeart size={128} color="#f87171" opacity={0.6} />
            </motion.div>
            <motion.div
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <SVGHeart size={128} color="#fb7185" opacity={0.4} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Heart Rate Display */}
      <div className="absolute bottom-0 left-0 right-0 text-center z-20">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Activity className="w-5 h-5 text-red-500" />
          <h2 className="text-2xl font-bold">Heart Rate</h2>
        </div>
        <motion.div
          key={heartRate}
          initial={{ scale: 1.1, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="text-4xl font-bold text-red-600 drop-shadow-md"
        >
          {heartRate} <span className="text-lg font-normal text-gray-600">BPM</span>
        </motion.div>
        <p className="text-sm text-gray-500 mt-1">Average resting heart rate</p>
      </div>
      
      {/* Enhanced Background Pulse Effect */}
      <motion.div
        animate={{
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: pulseDuration * 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-64 h-64 bg-red-200 rounded-full blur-2xl" />
      </motion.div>
      
      {/* Subtle Glow Effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-30" />
      </div>
    </div>
  )
}
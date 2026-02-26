"use client"

import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

export interface HeartEngineHandle {
  addHeart: () => void
}

const SVGHeart = ({ size = 32, color = "#ef4444" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
)

const HeartEngine = forwardRef<HeartEngineHandle, {}>((props, ref) => {
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; color: string; scale: number }>>([])

  const addHeart = useCallback(() => {
    const id = Date.now() + Math.random()
    const x = Math.random() * 80 - 40 // Random horizontal spread
    const colors = ["#ef4444", "#ec4899", "#f43f5e", "#fb7185", "#ff85a2"]
    const color = colors[Math.floor(Math.random() * colors.length)]
    const scale = Math.random() * 0.5 + 0.8

    setHearts(prev => [...prev, { id, x, color, scale }])
    
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id))
    }, 3000)
  }, [])

  useImperativeHandle(ref, () => ({
    addHeart
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ opacity: 1, y: "90vh", x: `calc(50% + ${heart.x}px)`, scale: 0.5 }}
            animate={{ 
              opacity: [1, 1, 0],
              y: "-10vh", 
              x: `calc(50% + ${heart.x + (Math.sin(heart.id) * 50)}px)`,
              scale: heart.scale 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute"
          >
            <SVGHeart color={heart.color} size={32} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
})

HeartEngine.displayName = "HeartEngine"

export default HeartEngine

"use client"

import React, { useState, useEffect, useRef } from "react"
import { ArrowUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/utils/supabase/client"

interface ChatMessage {
  id: string
  user_id: string
  username: string
  message: string
  created_at: string
}

interface ChatOverlayProps {
  streamId: string
  className?: string
}

export default function ChatOverlay({ streamId, className = "" }: ChatOverlayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  
  useEffect(() => {
    if (isScrolledToBottom && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, isScrolledToBottom])
  
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
      setIsScrolledToBottom(scrollTop + clientHeight >= scrollHeight - 10)
    }
  }
  
  useEffect(() => {
    const fetchMessages = async () => {
      if (!supabase) return
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("stream_id", streamId)
        .order("created_at", { ascending: true })
      if (data) setMessages(data)
    }
    
    fetchMessages()
    
    if (!supabase) return
    const channel = supabase
      .channel(`chat-${streamId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `stream_id=eq.${streamId}` }, 
      (payload: { new: ChatMessage }) => setMessages(prev => [...prev, payload.new]))
      .subscribe()
      
    return () => { supabase.removeChannel(channel) }
  }, [streamId, supabase])
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !supabase) return
    
    const { error } = await supabase.from("chat_messages").insert({
      stream_id: streamId,
      user_id: "user-demo",
      username: "Viewer",
      message: newMessage.trim()
    })
    
    if (!error) setNewMessage("")
  }
  
  return (
    <div className={`flex flex-col h-full pointer-events-none ${className}`}>
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto pointer-events-auto px-2 space-y-2 scrollbar-hide"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-[85%]"
            >
              <div className="bg-black/40 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/10">
                <span className="text-blue-400 font-black text-[10px] uppercase mr-2 tracking-tighter">
                  {msg.username}
                </span>
                <p className="text-white text-sm font-medium leading-tight drop-shadow-sm">
                  {msg.message}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 pointer-events-auto">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Send message..."
          className="flex-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-white/40"
        />
        <button type="submit" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
          <ArrowUp className="w-5 h-5" />
        </button>
      </form>
    </div>
  )
}

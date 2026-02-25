"use client"

import React, { useState, useEffect, useRef } from "react"
import { MessageCircle, PlusCircle, ArrowUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/utils/supabase/client"

interface ChatMessage {
  id: string
  user_id: string
  username: string
  message: string
  created_at: string
  user_avatar?: string
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
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isScrolledToBottom && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, isScrolledToBottom])
  
  // Handle scroll events to determine if user is at bottom
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
      setIsScrolledToBottom(scrollTop + clientHeight >= scrollHeight - 5)
    }
  }
  
  // Connect to real-time chat messages
  useEffect(() => {
    // Fetch initial messages
    const fetchInitialMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("stream_id", streamId)
        .order("created_at", { ascending: true })
        
      if (data) {
        setMessages(data)
      }
    }
    
    fetchInitialMessages()
    
    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat-${streamId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `stream_id=eq.${streamId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage])
        }
      )
      .subscribe()
      
    return () => {
      supabase.removeChannel(subscription)
    }
  }, [streamId, supabase])
  
  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newMessage.trim()) {
      // For demo purposes, we'll use a dummy user data
      const userData = {
        id: "user-1",
        username: "DemoUser",
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
      }
      
      const { error } = await supabase
        .from("chat_messages")
        .insert({
          stream_id: streamId,
          user_id: userData.id,
          username: userData.username,
          message: newMessage.trim(),
          user_avatar: userData.avatar
        })
        
      if (!error) {
        setNewMessage("")
      }
    }
  }
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat messages container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto pr-1 mb-4"
        onScroll={handleScroll}
      >
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start space-x-2 mb-3"
            >
              <Avatar className="h-8 w-8">
                <img
                  src={message.user_avatar || `https://i.pravatar.cc/150?img=${message.user_id}`}
                  alt={message.username}
                />
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline space-x-2">
                  <span className="text-sm font-semibold">{message.username}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm mt-1">{message.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Scroll to bottom indicator */}
        {!isScrolledToBottom && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => {
              if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
                setIsScrolledToBottom(true)
              }
            }}
            className="absolute bottom-16 right-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition-colors"
          >
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        )}
      </div>
      
      {/* Message input form */}
      <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage(e)
            }
          }}
        />
        <Button type="submit" disabled={!newMessage.trim()}>
          <ArrowUp className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
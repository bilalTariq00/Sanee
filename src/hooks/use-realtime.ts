"use client"

import { useEffect, useRef, useCallback } from "react"
import type { Message } from "@/types/chat"

interface RealtimeHookProps {
  currentUserId?: number
  onNewMessage?: (message: Message) => void
  onUserStatusChange?: (userUid: string, isOnline: boolean) => void
  onTypingChange?: (userUid: string, isTyping: boolean) => void
}

export function useRealtime({ currentUserId, onNewMessage, onUserStatusChange, onTypingChange }: RealtimeHookProps) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (!currentUserId) return

    try {
      // Replace with your WebSocket URL
      const ws = new WebSocket(`ws://localhost:6001/app/your-app-key?protocol=7&client=js&version=4.3.1`)

      ws.onopen = () => {
        console.log("🔌 Connected to WebSocket")
        reconnectAttempts.current = 0

        // Subscribe to user-specific channel
        ws.send(
          JSON.stringify({
            event: "pusher:subscribe",
            data: {
              channel: `private-chat.${currentUserId}`,
            },
          }),
        )
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          switch (data.event) {
            case "new-message":
              if (onNewMessage) {
                onNewMessage(data.message)
              }
              break
            case "user-online":
              if (onUserStatusChange) {
                onUserStatusChange(data.user_uid, true)
              }
              break
            case "user-offline":
              if (onUserStatusChange) {
                onUserStatusChange(data.user_uid, false)
              }
              break
            case "user-typing":
              if (onTypingChange) {
                onTypingChange(data.user_uid, data.is_typing)
              }
              break
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      ws.onclose = () => {
        console.log("🔌 WebSocket disconnected")

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔌 Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`)
            connect()
          }, delay)
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
      }

      wsRef.current = ws
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error)
    }
  }, [currentUserId, onNewMessage, onUserStatusChange, onTypingChange])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const sendTypingStatus = useCallback((receiverUid: string, isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: "client-typing",
          data: {
            receiver_uid: receiverUid,
            is_typing: isTyping,
          },
        }),
      )
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    sendTypingStatus,
    reconnect: connect,
    disconnect,
  }
}

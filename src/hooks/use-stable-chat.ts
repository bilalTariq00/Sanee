"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import axios from "axios"

interface Message {
  id: number
  sender_id: number
  receiver_id: number
  message: string
  attachment?: string
  created_at: string
  is_custom_order?: boolean
  order_id?: number
  chat_order_id?: number
  service_uid?: string
  amount?: number
  note?: string
  is_deleted?: boolean
  status?: "pending" | "accepted" | "rejected" | "paid"
  sender?: {
    uid: string
    first_name: string
    last_name: string
    image?: string
  }
}

interface UseStableChatProps {
  currentUserId: number
  receiverUid: string
  apiBaseUrl: string
  onNewMessage?: (message: Message) => void
}

export function useStableChat({ currentUserId, receiverUid, apiBaseUrl, onNewMessage }: UseStableChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected")
  const [loading, setLoading] = useState(false)

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageIdRef = useRef<number>(0)
  const mountedRef = useRef(true)
  const isPollingRef = useRef(false)

  // Simple polling-based message fetching
  const fetchNewMessages = useCallback(async () => {
    if (!receiverUid || !currentUserId || !mountedRef.current) return

    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await axios.get(`${apiBaseUrl}/chat/messages/${receiverUid}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: 1,
          limit: 20,
          after: lastMessageIdRef.current,
        },
        timeout: 5000,
      })

      const newMessages = response.data.messages || []

      if (newMessages.length > 0 && mountedRef.current) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const uniqueNewMessages = newMessages.filter(
            (msg: Message) => !existingIds.has(msg.id) && msg.id > lastMessageIdRef.current,
          )

          if (uniqueNewMessages.length > 0) {
            const maxId = Math.max(...uniqueNewMessages.map((m: Message) => m.id))
            lastMessageIdRef.current = maxId

            // Notify about new messages from others
            uniqueNewMessages.forEach((msg: Message) => {
              if (msg.sender_id !== currentUserId && onNewMessage) {
                onNewMessage(msg)
              }
            })

            return [...prev, ...uniqueNewMessages]
          }
          return prev
        })
      }

      if (mountedRef.current) {
        setConnectionStatus("connected")
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
      if (mountedRef.current) {
        setConnectionStatus("disconnected")
      }
    }
  }, [receiverUid, currentUserId, apiBaseUrl, onNewMessage])

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!receiverUid || !currentUserId || loading) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await axios.get(`${apiBaseUrl}/chat/messages/${receiverUid}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, limit: 50 },
        timeout: 10000,
      })

      const fetchedMessages = response.data.messages || []

      if (mountedRef.current) {
        setMessages(fetchedMessages)
        if (fetchedMessages.length > 0) {
          const maxId = Math.max(...fetchedMessages.map((m: Message) => m.id))
          lastMessageIdRef.current = maxId
        }
        setConnectionStatus("connected")
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
      if (mountedRef.current) {
        setConnectionStatus("disconnected")
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [receiverUid, currentUserId, apiBaseUrl, loading])

  // Start polling
  const startPolling = useCallback(() => {
    if (isPollingRef.current) return

    console.log("🔄 Starting message polling")
    isPollingRef.current = true
    setConnectionStatus("connecting")

    // Initial fetch
    fetchNewMessages()

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchNewMessages()
    }, 2000) // Poll every 2 seconds
  }, [fetchNewMessages])

  // Stop polling
  const stopPolling = useCallback(() => {
    console.log("⏹️ Stopping message polling")
    isPollingRef.current = false

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    setConnectionStatus("disconnected")
  }, [])

  // Send message
  const sendMessage = useCallback(
    async (messageText: string, file?: File) => {
      if ((!messageText.trim() && !file) || !receiverUid || !currentUserId) {
        return { success: false, error: "Invalid message data" }
      }

      try {
        const token = localStorage.getItem("token")
        if (!token) {
          return { success: false, error: "No authentication token" }
        }

        const formData = new FormData()
        formData.append("receiver_id", receiverUid)
        formData.append("type", file ? "file" : "text")

        if (messageText.trim()) {
          formData.append("message", messageText.trim())
        }
        if (file) {
          formData.append("attachment", file)
        }

        const response = await axios.post(`${apiBaseUrl}/chat/send`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        })

        const newMessage = response.data.message

        if (mountedRef.current) {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMessage.id)
            if (exists) return prev

            if (newMessage.id > lastMessageIdRef.current) {
              lastMessageIdRef.current = newMessage.id
            }
            return [...prev, newMessage]
          })
        }

        return { success: true, message: newMessage }
      } catch (error: any) {
        console.error("Failed to send message:", error)
        return {
          success: false,
          error: error.response?.data?.message || "Failed to send message",
        }
      }
    },
    [receiverUid, currentUserId, apiBaseUrl],
  )

  // Initialize when receiver changes
  useEffect(() => {
    if (!receiverUid || !currentUserId) return

    // Reset state
    setMessages([])
    lastMessageIdRef.current = 0

    // Load initial messages
    loadMessages()

    // Start polling
    startPolling()

    return () => {
      stopPolling()
    }
  }, [receiverUid, currentUserId, loadMessages, startPolling, stopPolling])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      stopPolling()
    }
  }, [stopPolling])

  return {
    messages,
    connectionStatus,
    loading,
    sendMessage,
    refreshMessages: loadMessages,
  }
}

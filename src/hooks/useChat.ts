"use client"

import { useState, useRef, useCallback } from "react"
import axios from "axios"
import type { User, Message, MessagesResponse, UnreadMessagesResponse } from "@/types/chat"
import config from "@/config"

export const useChat = (receiverUid?: string) => {
  const [users, setUsers] = useState<User[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [unread, setUnread] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pageRef = useRef(1)
  const scrollCompleted = useRef(false)
  const scrollLock = useRef(false)

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No authentication token found")
    }
    return { Authorization: `Bearer ${token}` }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      setError(null)
      const response = await axios.get<User[]>(`${config.API_BASE_URL}/chat/users`, {
        headers: getAuthHeaders(),
      })
      setUsers(response.data || [])
    } catch (err) {
      console.error("Failed to fetch users:", err)
      setError("Failed to load conversations")
      setUsers([])
    }
  }, [getAuthHeaders])

  const fetchMessages = useCallback(async () => {
    if (!receiverUid || !hasMore || loading || scrollCompleted.current) return

    setLoading(true)
    setError(null)

    try {
      const response = await axios.get<MessagesResponse>(
        `${config.API_BASE_URL}/chat/messages/${receiverUid}?page=${pageRef.current}`,
        { headers: getAuthHeaders() },
      )

      const fetched = response.data.messages || []

      if (!response.data.next_page) {
        setHasMore(false)
        scrollCompleted.current = true
      }

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id))
        const newMessages = fetched.filter((m) => !existingIds.has(m.id))
        return [...newMessages, ...prev]
      })

      if (response.data.next_page) {
        pageRef.current = response.data.next_page
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err)
      setError("Failed to load messages")
    } finally {
      setLoading(false)
    }
  }, [receiverUid, hasMore, loading, getAuthHeaders])

  const sendMessage = useCallback(
    async (messageText: string, file?: File) => {
      if (!receiverUid || (!messageText.trim() && !file)) return false

      setSending(true)
      setError(null)

      try {
        const formData = new FormData()
        formData.append("receiver_id", receiverUid)
        formData.append("type", file ? "file" : "text")

        if (messageText.trim()) {
          formData.append("message", messageText.trim())
        }

        if (file) {
          formData.append("attachment", file)
        }

        const response = await axios.post<{ message: Message }>(`${config.API_BASE_URL}/chat/send`, formData, {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        })

        const newMessage = response.data.message
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === newMessage.id)
          return exists ? prev : [...prev, newMessage]
        })

        return true
      } catch (err) {
        console.error("Failed to send message:", err)
        setError("Failed to send message")
        return false
      } finally {
        setSending(false)
      }
    },
    [receiverUid, getAuthHeaders],
  )

  const checkUnreadMessages = useCallback(async () => {
    try {
      const response = await axios.get<UnreadMessagesResponse>(`${config.API_BASE_URL}/chat/unread-messages`, {
        headers: getAuthHeaders(),
      })

      const unreadMap: Record<string, boolean> = {}
      if (response.data?.messages && Array.isArray(response.data.messages)) {
        response.data.messages.forEach((msg) => {
          if (msg.sender?.uid) {
            unreadMap[msg.sender.uid] = true
          }
        })
      }

      setUnread(unreadMap)
    } catch (err) {
      console.error("Failed to check unread messages:", err)
    }
  }, [getAuthHeaders])

  const deleteMessage = useCallback(
    async (messageId: number) => {
      try {
        await axios.delete(`${config.API_BASE_URL}/chat/messages/${messageId}`, {
          headers: getAuthHeaders(),
        })

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, is_deleted: true, message: "This message is removed" } : msg,
          ),
        )

        return true
      } catch (err) {
        console.error("Failed to delete message:", err)
        setError("Failed to delete message")
        return false
      }
    },
    [getAuthHeaders],
  )

  const resetChat = useCallback(() => {
    setMessages([])
    setHasMore(true)
    setError(null)
    pageRef.current = 1
    scrollCompleted.current = false
    scrollLock.current = false
  }, [])

  const markAsRead = useCallback((userUid: string) => {
    setUnread((prev) => ({ ...prev, [userUid]: false }))
  }, [])

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === message.id)
      return exists ? prev : [...prev, message]
    })
  }, [])

  return {
    users,
    messages,
    unread,
    loading,
    sending,
    hasMore,
    error,
    scrollLock,
    fetchUsers,
    fetchMessages,
    sendMessage,
    checkUnreadMessages,
    deleteMessage,
    resetChat,
    markAsRead,
    addMessage,
    setError,
  }
}

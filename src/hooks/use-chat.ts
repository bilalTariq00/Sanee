"use client"

import { useState, useCallback } from "react"
import type { Message, ChatUser, UserProfile } from "@/types/chat"

export function useChat() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [users, setUsers] = useState<ChatUser[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [unread, setUnread] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Simulated API calls - replace with your actual API
  const fetchCurrentUser = useCallback(async () => {
    try {
      setIsLoading(true)
      // Replace with actual API call
      const mockUser: UserProfile = {
        id: 1,
        uid: "user123",
        first_name: "John",
        last_name: "Doe",
        account_type: "seller",
      }
      setCurrentUser(mockUser)
    } catch (err) {
      setError("Failed to fetch user profile")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      // Replace with actual API call
      const mockUsers: ChatUser[] = [
        {
          id: 2,
          uid: "user456",
          first_name: "Jane",
          last_name: "Smith",
          image: "/placeholder.svg?height=48&width=48",
          headline: "Web Developer",
          last_message: "Hello, how are you?",
          last_message_time: new Date().toISOString(),
          is_online: true,
          is_typing: false,
        },
        {
          id: 3,
          uid: "user789",
          first_name: "Mike",
          last_name: "Johnson",
          image: "/placeholder.svg?height=48&width=48",
          headline: "Designer",
          last_message: "Great work!",
          last_message_time: new Date(Date.now() - 3600000).toISOString(),
          is_online: false,
          is_typing: false,
        },
      ]
      setUsers(mockUsers)
    } catch (err) {
      setError("Failed to fetch users")
    }
  }, [])

  const fetchMessages = useCallback(async (receiverUid: string) => {
    try {
      setIsLoading(true)
      // Replace with actual API call
      const mockMessages: Message[] = [
        {
          id: 1,
          sender_id: 2,
          receiver_id: 1,
          message: "Hello! How can I help you today?",
          created_at: new Date(Date.now() - 7200000).toISOString(),
          delivery_status: "read",
        },
        {
          id: 2,
          sender_id: 1,
          receiver_id: 2,
          message: "Hi! I need help with my website.",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          delivery_status: "delivered",
        },
        {
          id: 3,
          sender_id: 2,
          receiver_id: 1,
          message: "I can definitely help you with that. What specific issues are you facing?",
          created_at: new Date(Date.now() - 1800000).toISOString(),
          delivery_status: "read",
        },
      ]
      setMessages(mockMessages)
    } catch (err) {
      setError("Failed to fetch messages")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const sendMessage = useCallback(
    async (receiverUid: string, message: string, file?: File) => {
      try {
        // Replace with actual API call
        const newMessage: Message = {
          id: Date.now(),
          sender_id: currentUser?.id || 1,
          receiver_id: Number.parseInt(receiverUid),
          message,
          created_at: new Date().toISOString(),
          delivery_status: "sent",
        }

        setMessages((prev) => [...prev, newMessage])

        // Simulate delivery status updates
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === newMessage.id ? { ...msg, delivery_status: "delivered" as const } : msg)),
          )
        }, 1000)

        return newMessage
      } catch (err) {
        setError("Failed to send message")
        throw err
      }
    },
    [currentUser],
  )

  const markAsRead = useCallback(async (senderUid: string) => {
    setUnread((prev) => ({ ...prev, [senderUid]: false }))
  }, [])

  const updateTypingStatus = useCallback((userUid: string, isTyping: boolean) => {
    setUsers((prev) => prev.map((user) => (user.uid === userUid ? { ...user, is_typing: isTyping } : user)))
  }, [])

  const updateOnlineStatus = useCallback((userUid: string, isOnline: boolean) => {
    setUsers((prev) => prev.map((user) => (user.uid === userUid ? { ...user, is_online: isOnline } : user)))
  }, [])

  return {
    currentUser,
    users,
    messages,
    unread,
    isLoading,
    error,
    fetchCurrentUser,
    fetchUsers,
    fetchMessages,
    sendMessage,
    markAsRead,
    updateTypingStatus,
    updateOnlineStatus,
  }
}

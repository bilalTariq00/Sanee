"use client"

import { useEffect, useRef } from "react"
import Echo from "laravel-echo"
import Pusher from "pusher-js"
import type { Message } from "@/types/chat"
import config from "@/config"

// Declare Pusher globally
declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

window.Pusher = Pusher

interface UsePusherProps {
  currentUserId: number | null
  receiverUid?: string
  onNewMessage: (message: Message) => void
  onUpdateUnread: (senderUid: string) => void
  onRefreshUsers: () => void
}

export const usePusher = ({
  currentUserId,
  receiverUid,
  onNewMessage,
  onUpdateUnread,
  onRefreshUsers,
}: UsePusherProps) => {
  const echo = useRef<Echo | null>(null)

  useEffect(() => {
    if (!currentUserId) return

    try {
      // Initialize Echo with Pusher
      echo.current = new Echo({
        broadcaster: "pusher",
        key: "fb3d6f3052ad033ccb47",
        cluster: "ap2",
        forceTLS: true,
        encrypted: true,
        authEndpoint: `${config.API_BASE_URL}/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            Accept: "application/json",
          },
        },
        enabledTransports: ["ws", "wss"],
      })

      // Subscribe to private channel
      const channel = echo.current.private(`chat.${currentUserId}`)

      // Listen for new messages
      channel.listen(".new-message", (e: { message: Message }) => {
        const message = e.message

        // Add message to state
        onNewMessage(message)

        // Update unread status if not from current chat
        if (message.sender?.uid && message.sender.uid !== receiverUid) {
          onUpdateUnread(message.sender.uid)
        }

        // Refresh users list
        onRefreshUsers()
      })

      // Connection event handlers
      echo.current.connector.pusher.connection.bind("connected", () => {
        console.log("Pusher connected successfully")
      })

      echo.current.connector.pusher.connection.bind("error", (error: any) => {
        console.error("Pusher connection error:", error)
      })

      echo.current.connector.pusher.connection.bind("disconnected", () => {
        console.log("Pusher disconnected")
      })
    } catch (error) {
      console.error("Failed to initialize Pusher:", error)
    }

    // Cleanup function
    return () => {
      if (echo.current && currentUserId) {
        try {
          echo.current.leave(`chat.${currentUserId}`)
          echo.current.disconnect()
        } catch (error) {
          console.error("Error cleaning up Pusher:", error)
        }
      }
    }
  }, [currentUserId, receiverUid, onNewMessage, onUpdateUnread, onRefreshUsers])

  return echo.current
}

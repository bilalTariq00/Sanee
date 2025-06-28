"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Menu,
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Search,
  Check,
  CheckCheck,
} from "lucide-react"
import { useChat } from "@/hooks/use-chat"
import { useRealtime } from "@/hooks/use-realtime"
import type { Message } from "@/types/chat"

interface ChatComponentProps {
  selectedUserUid?: string
  onUserSelect?: (userUid: string) => void
}

export default function ChatComponent({ selectedUserUid, onUserSelect }: ChatComponentProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const {
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
  } = useChat()

  const { isConnected, sendTypingStatus } = useRealtime({
    currentUserId: currentUser?.id,
    onNewMessage: (message: Message) => {
      // Handle new message
      console.log("New message received:", message)
    },
    onUserStatusChange: updateOnlineStatus,
    onTypingChange: updateTypingStatus,
  })

  const selectedUser = users.find((user) => user.uid === selectedUserUid)
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase()
    return (
      fullName.includes(searchTerm.toLowerCase()) || user.headline?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedUserUid) return

    try {
      await sendMessage(selectedUserUid, newMessage)
      setNewMessage("")
      scrollToBottom()
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }, [newMessage, selectedUserUid, sendMessage, scrollToBottom])

  const handleTyping = useCallback(
    (value: string) => {
      setNewMessage(value)

      if (!selectedUserUid) return

      if (!isTyping) {
        setIsTyping(true)
        sendTypingStatus(selectedUserUid, true)
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        sendTypingStatus(selectedUserUid, false)
      }, 1000)
    },
    [selectedUserUid, isTyping, sendTypingStatus],
  )

  const handleUserSelect = useCallback(
    (userUid: string) => {
      onUserSelect?.(userUid)
      markAsRead(userUid)
      setIsMobileMenuOpen(false)
      fetchMessages(userUid)
    },
    [onUserSelect, markAsRead, fetchMessages],
  )

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getMessageStatusIcon = (status?: string) => {
    switch (status) {
      case "sent":
        return <Check className="w-3 h-3" />
      case "delivered":
        return <CheckCheck className="w-3 h-3" />
      case "read":
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      default:
        return null
    }
  }

  useEffect(() => {
    fetchCurrentUser()
    fetchUsers()
  }, [fetchCurrentUser, fetchUsers])

  useEffect(() => {
    if (selectedUserUid) {
      fetchMessages(selectedUserUid)
    }
  }, [selectedUserUid, fetchMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const UsersList = () => (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Messages</h2>
          <Badge variant={isConnected ? "default" : "destructive"}>{isConnected ? "Online" : "Offline"}</Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers.map((user) => (
          <div
            key={user.uid}
            onClick={() => handleUserSelect(user.uid)}
            className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
              selectedUserUid === user.uid ? "bg-muted" : ""
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src={user.image || "/placeholder.svg"} alt={user.first_name} />
                  <AvatarFallback>
                    {user.first_name[0]}
                    {user.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                {user.is_online && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  {user.last_message_time && (
                    <p className="text-xs text-muted-foreground">{formatTime(user.last_message_time)}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground truncate flex-1">
                    {user.is_typing ? (
                      <span className="text-blue-500 italic">typing...</span>
                    ) : (
                      user.last_message || user.headline
                    )}
                  </p>
                  {unread[user.uid] && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const ChatArea = () => (
    <div className="flex flex-col h-full">
      {selectedUser ? (
        <>
          {/* Chat Header */}
          <div className="p-4 border-b bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => onUserSelect?.("")}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>

                <div className="relative">
                  <Avatar>
                    <AvatarImage src={selectedUser.image || "/placeholder.svg"} alt={selectedUser.first_name} />
                    <AvatarFallback>
                      {selectedUser.first_name[0]}
                      {selectedUser.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {selectedUser.is_online && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                  )}
                </div>

                <div>
                  <h3 className="font-semibold">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.is_typing ? (
                      <span className="text-blue-500">typing...</span>
                    ) : selectedUser.is_online ? (
                      "Online"
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.sender_id === currentUser?.id
              const messageTime = formatTime(message.created_at)

              return (
                <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] ${isCurrentUser ? "order-2" : "order-1"}`}>
                    <div
                      className={`p-3 rounded-lg ${isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      <p className="text-sm">{message.message}</p>
                    </div>

                    <div
                      className={`flex items-center space-x-1 mt-1 text-xs text-muted-foreground ${
                        isCurrentUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span>{messageTime}</span>
                      {isCurrentUser && getMessageStatusIcon(message.delivery_status)}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t bg-background">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="w-4 h-4" />
              </Button>

              <Button variant="ghost" size="sm" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                <Smile className="w-4 h-4" />
              </Button>

              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                className="flex-1"
              />

              <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="sm">
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" />
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-muted-foreground">Select a conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-80 border-r">
        <UsersList />
      </div>

      {/* Mobile Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <UsersList />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <h1 className="font-semibold">Chat</h1>
            <div className="w-8" /> {/* Spacer */}
          </div>
        </div>

        <ChatArea />
      </div>
    </div>
  )
}

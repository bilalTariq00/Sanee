"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { Upload, User, Search, Send, Wifi, WifiOff, X, Smile, Trash2, Bell, BellOff } from "lucide-react"
import { toast } from "sonner"
import EmojiPicker from "emoji-picker-react"
import config from "../config"

interface Service {
  id: number
  title: string
  price: number
  uid: string
}

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
  gig_uid?: string
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

interface ChatUser {
  id: number
  uid: string
  first_name: string
  last_name: string
  image?: string
  headline?: string
  last_message?: string
  last_message_time?: string
  is_online?: boolean
}

interface UserProfile {
  id: number
  uid: string
  first_name: string
  last_name: string
  account_type: string
  image?: string
}

export default function Chat() {
  const { userId: receiverUid } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageIdRef = useRef<number>(0)
  const chatBodyRef = useRef<HTMLDivElement>(null)
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null)

  // State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [receiverUser, setReceiverUser] = useState<ChatUser | null>(null)
  const [users, setUsers] = useState<ChatUser[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedService, setSelectedService] = useState("")
  const [orderAmount, setOrderAmount] = useState("")
  const [orderExpiry, setOrderExpiry] = useState("1_hour")
  const [orderNote, setOrderNote] = useState("")
  const [myServices, setMyServices] = useState<Service[]>([])
  const [isSeller, setIsSeller] = useState(false)
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({})
  const [showEmoji, setShowEmoji] = useState(false)
  const [unread, setUnread] = useState<Record<string, boolean>>({})
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [acceptingOrder, setAcceptingOrder] = useState<number | null>(null)

  const isBuyer = currentUser?.account_type === "buyer"

  // Initialize notification sound
  useEffect(() => {
    notificationSoundRef.current = new Audio("/notification-sound.mp3")
    notificationSoundRef.current.volume = 0.5
  }, [])

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === "granted")
      if (permission === "granted") {
        toast.success("Notifications enabled!")
      } else {
        toast.error("Notifications denied")
      }
    } else {
      toast.error("Notifications not supported in this browser")
    }
  }

  // Show notification
  const showNotification = (title: string, body: string, icon?: string) => {
    if (notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
      // Only show notification if the page is not visible or user is not on the current chat
      if (document.hidden || document.visibilityState === "hidden") {
        const notification = new Notification(title, {
          body,
          icon: icon || "/favicon.ico",
          badge: "/favicon.ico",
          tag: "chat-message",
          requireInteraction: false,
          silent: false,
        })

        // Auto close after 5 seconds
        setTimeout(() => {
          notification.close()
        }, 5000)

        // Focus window when notification is clicked
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      }
    }
  }

  // Play notification sound
  const playNotificationSound = () => {
    if (notificationSoundRef.current && notificationsEnabled) {
      notificationSoundRef.current.play().catch((e) => {
        console.log("Could not play notification sound:", e)
      })
    }
  }

  // Auto scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  // Get auth headers
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  })

  // Check if message is recent (for deletion)
  const isMessageRecent = (createdAt: string) => {
    const messageTime = new Date(createdAt)
    const now = new Date()
    const diffInMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60)
    return diffInMinutes <= 5
  }

  // Delete message
  const deleteMessage = async (messageId: number) => {
    try {
      await axios.delete(`${config.API_BASE_URL}/chat/messages/${messageId}`, {
        headers: getAuthHeaders(),
      })
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              is_deleted: true,
              message: "This message was deleted",
            }
          }
          return msg
        }),
      )
      toast.success("Message deleted")
    } catch (err) {
      console.error("❌ Failed to delete message:", err)
      toast.error("Failed to delete message")
    }
  }

  // Check unread messages
  const checkUnreadMessages = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/chat/unread-messages`, {
        headers: getAuthHeaders(),
      })
      const unreadMap: Record<string, boolean> = {}
      if (res.data?.messages && Array.isArray(res.data.messages)) {
        res.data.messages.forEach((msg: any) => {
          if (msg.sender?.uid) {
            unreadMap[msg.sender.uid] = true
          }
        })
      }
      setUnread(unreadMap)
    } catch (err) {
      console.error("❌ Failed to check unread messages:", err)
    }
  }

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }
      const res = await axios.get(`${config.API_BASE_URL}/me`, {
        headers: getAuthHeaders(),
        timeout: 5000,
      })
      setCurrentUser(res.data)
      setIsSeller(res.data.account_type === "seller")
      setConnected(true)
    } catch (error) {
      console.error("Failed to fetch user:", error)
      setConnected(false)
      navigate("/login")
    }
  }

  // Fetch users list
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/chat/users`, {
        headers: getAuthHeaders(),
        timeout: 5000,
      })
      setUsers(res.data || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  // Fetch receiver user
  const fetchReceiverUser = async () => {
    if (!receiverUid) return
    try {
      const res = await axios.get(`${config.API_BASE_URL}/chat/user/${receiverUid}`, {
        headers: getAuthHeaders(),
        timeout: 5000,
      })
      setReceiverUser(res.data)
    } catch (error) {
      console.error("Failed to fetch receiver:", error)
    }
  }

  // Load initial messages
  const loadMessages = async () => {
    if (!receiverUid || !currentUser) return
    setLoading(true)
    try {
      const res = await axios.get(`${config.API_BASE_URL}/chat/messages/${receiverUid}`, {
        headers: getAuthHeaders(),
        params: { page: 1, limit: 50 },
        timeout: 10000,
      })
      const fetchedMessages = res.data.messages || []
      setMessages(fetchedMessages)
      if (fetchedMessages.length > 0) {
        lastMessageIdRef.current = Math.max(...fetchedMessages.map((m: Message) => m.id))
      }
      setConnected(true)
      scrollToBottom()
    } catch (error) {
      console.error("Failed to load messages:", error)
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }

  // Check for new messages
  const checkNewMessages = async () => {
    if (!receiverUid || !currentUser) return
    try {
      const res = await axios.get(`${config.API_BASE_URL}/chat/messages/${receiverUid}`, {
        headers: getAuthHeaders(),
        params: {
          page: 1,
          limit: 10,
          after: lastMessageIdRef.current,
        },
        timeout: 5000,
      })
      const newMessages = res.data.messages || []
      if (newMessages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const uniqueNew = newMessages.filter((m: Message) => !existingIds.has(m.id))
          if (uniqueNew.length > 0) {
            lastMessageIdRef.current = Math.max(...uniqueNew.map((m: Message) => m.id))

            // Show notification for new messages from others
            uniqueNew.forEach((message: Message) => {
              if (message.sender_id !== currentUser.id) {
                const senderName = message.sender
                  ? `${message.sender.first_name} ${message.sender.last_name}`
                  : "Someone"

                let notificationBody = message.message
                if (message.is_custom_order) {
                  notificationBody = "📋 Sent you a custom order"
                } else if (message.attachment) {
                  notificationBody = "📎 Sent an attachment"
                }

                showNotification(
                  `New message from ${senderName}`,
                  notificationBody,
                  message.sender?.image ? `${config.IMG_BASE_URL}/storage/${message.sender.image}` : undefined,
                )
                playNotificationSound()
              }
            })

            scrollToBottom()
            return [...prev, ...uniqueNew]
          }
          return prev
        })
      }
      setConnected(true)
    } catch (error) {
      console.error("Failed to check new messages:", error)
      setConnected(false)
    }
  }

  // Send message
  const sendMessage = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!newMessage.trim() && !file) return
    if (!receiverUid || !currentUser) return

    setSending(true)
    try {
      const formData = new FormData()
      formData.append("receiver_id", receiverUid);
    if (file) {
      formData.append("type", "file");
      // make sure to include the filename
      formData.append("attachment", file, file.name);
    } else {
      formData.append("type", "text");
      formData.append("message", newMessage.trim());
    }

      const res = await axios.post(`${config.API_BASE_URL}/chat/send`, formData, {
        headers: {
          ...getAuthHeaders(),
        },
        timeout: 30000,
      })

      const sentMessage = res.data.message
      // Add message immediately
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === sentMessage.id)
        if (!exists) {
          lastMessageIdRef.current = Math.max(lastMessageIdRef.current, sentMessage.id)
          return [...prev, sentMessage]
        }
        return prev
      })

      setNewMessage("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setShowEmoji(false)
      scrollToBottom()
      toast.success("Message sent!")
      setConnected(true)
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error("Failed to send message")
      setConnected(false)
    } finally {
      setSending(false)
    }
  }

  // Fetch services for sellers
  const fetchMyServices = async () => {
    if (!isSeller) return
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get(`${config.API_BASE_URL}/seller/gigs`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      })
      setMyServices(res.data || [])
    } catch (error) {
      console.error("Failed to fetch services:", error)
    }
  }

  // Handle custom order creation
  const handleCreateOrder = async () => {
    if (!selectedService || !orderAmount || !receiverUid) {
      toast.error("Please fill in all required fields")
      return
    }

    const selectedServiceData = myServices.find((s) => s.id === Number.parseInt(selectedService))
    if (!selectedServiceData) {
      toast.error("Selected service not found")
      return
    }

    try {
      const orderRes = await axios.post(
        `${config.API_BASE_URL}/seller/chat/create-order`,
        {
          receiver_id: receiverUid,
          sender_uid: currentUser?.uid,
          gig_id: selectedService,
          amount: Number.parseFloat(orderAmount),
          expiry_date: getExpiryDate(orderExpiry),
          note: orderNote,
        },
        {
          headers: getAuthHeaders(),
          timeout: 10000,
        },
      )

      const orderData = orderRes.data.data
      const messageText = `Custom order created: ${selectedServiceData.title}\n\nPrice: ${orderAmount} Riyals\n\nExpires in: ${
        expiryOptions.find((opt) => opt.value === orderExpiry)?.label
      }${orderNote ? `\n\nNote: ${orderNote}` : ""}\n\nUID: ${orderData.service_uid || orderData.gig_uid}`

      const messageFormData = new FormData()
      messageFormData.append("receiver_id", receiverUid)
      messageFormData.append("type", "text")
      messageFormData.append("message", messageText)
      messageFormData.append("is_custom_order", "true")
      messageFormData.append("gig_uid", orderData.gig_uid || orderData.service_uid)
      messageFormData.append("amount", orderAmount)
      messageFormData.append("note", orderNote)
      messageFormData.append("order_id", orderData.id.toString())
      messageFormData.append("chat_order_id", orderData.id.toString())
      messageFormData.append("gig_id", selectedService)

      const messageRes = await axios.post(`${config.API_BASE_URL}/chat/send`, messageFormData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      })

      const newMessage = {
        ...messageRes.data.message,
        gig_uid: orderData.gig_uid || orderData.service_uid,
        service_uid: orderData.service_uid || orderData.gig_uid,
        amount: Number.parseFloat(orderAmount),
        note: orderNote,
        is_custom_order: true,
        order_id: orderData.id,
        chat_order_id: orderData.id,
        status: "pending" as const,
      }

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === newMessage.id)
        if (!exists) {
          lastMessageIdRef.current = Math.max(lastMessageIdRef.current, newMessage.id)
          return [...prev, newMessage]
        }
        return prev
      })

      setShowOrderModal(false)
      setSelectedService("")
      setOrderAmount("")
      setOrderExpiry("1_hour")
      setOrderNote("")
      scrollToBottom()
      toast.success("Custom order created successfully!")
    } catch (err) {
      console.error("❌ Failed to create order:", err)
      toast.error("Failed to create custom order")
    }
  }

  // Handle order acceptance - ENHANCED
  const handleAcceptOrder = async (message: Message) => {
    const orderId = message.order_id || message.chat_order_id
    if (!orderId) {
      toast.error("Order ID not found")
      return
    }

    setAcceptingOrder(orderId)

    try {
      // First, accept the order on the backend
     

        // Update message status locally
        setMessages((prev) => prev.map((msg) => (msg.id === message.id ? { ...msg, status: "accepted" } : msg)))

        toast.success("Order accepted! Redirecting to payment...")

        // Get the gig UID for checkout
        const gigUid = message.gig_uid || message.service_uid
        if (!gigUid) {
          // Try to extract from message text as fallback
          const lines = message.message.split("\n")
          const uidLine = lines.find((line) => line.includes("UID:"))
          const extractedUid = uidLine?.split("UID:")[1]?.trim()

          if (!extractedUid) {
            toast.error("Could not find order details for checkout")
            return
          }
        }

        // Navigate to checkout
        setTimeout(() => {
          navigate(`/checkout/${gigUid}`, {
            state: {
              message: message.note || "",
              price: message.amount,
              is_custom_order: true,
              order_id: orderId,
              from_chat: true,
            },
          })
        }, 1000)
      
    } catch (err: any) {
      console.error("Error accepting order:", err)
      toast.error(err.response?.data?.message || "Failed to accept order")

      // Revert status if there was an error
      setMessages((prev) => prev.map((msg) => (msg.id === message.id ? { ...msg, status: "pending" } : msg)))
    } finally {
      setAcceptingOrder(null)
    }
  }

  // Handle order rejection
  const handleRejectOrder = async (message: Message) => {
    try {
      const orderId = message.order_id || message.chat_order_id
      if (!orderId) {
        throw new Error("Order ID not found")
      }

      await axios.post(
        `${config.API_BASE_URL}/orders/${orderId}/reject`,
        {},
        {
          headers: getAuthHeaders(),
          timeout: 10000,
        },
      )

      setMessages((prev) => prev.map((msg) => (msg.id === message.id ? { ...msg, status: "rejected" } : msg)))
      toast.success("Order rejected")
    } catch (error) {
      console.error("❌ Error rejecting order:", error)
      toast.error("Failed to reject order")
    }
  }

  // Utility functions for orders
  const expiryOptions = [
    { value: "30_min", label: "30 minutes" },
    { value: "1_hour", label: "1 hour" },
    { value: "5_hours", label: "5 hours" },
    { value: "12_hours", label: "12 hours" },
    { value: "1_day", label: "1 day" },
    { value: "7_days", label: "7 days" },
    { value: "14_days", label: "14 days" },
    { value: "30_days", label: "30 days" },
  ]

  const getExpiryDate = (expiryValue: string) => {
    const now = new Date()
    let expiryDate: Date
    switch (expiryValue) {
      case "30_min":
        expiryDate = new Date(now.getTime() + 30 * 60000)
        break
      case "1_hour":
        expiryDate = new Date(now.getTime() + 60 * 60000)
        break
      case "5_hours":
        expiryDate = new Date(now.getTime() + 5 * 60 * 60000)
        break
      case "12_hours":
        expiryDate = new Date(now.getTime() + 12 * 60 * 60000)
        break
      case "1_day":
        expiryDate = new Date(now.getTime() + 24 * 60 * 60000)
        break
      case "7_days":
        expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60000)
        break
      case "14_days":
        expiryDate = new Date(now.getTime() + 14 * 24 * 60 * 60000)
        break
      case "30_days":
        expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60000)
        break
      default:
        expiryDate = new Date(now.getTime() + 60 * 60000)
    }
    return expiryDate.toISOString().slice(0, 19).replace("T", " ")
  }

  const isCustomOrderMessage = (message: Message) => {
    return message.is_custom_order && message.order_id !== null && message.order_id !== undefined
  }

  // Start polling for new messages
  const startPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }
    pollingRef.current = setInterval(() => {
      checkNewMessages()
    }, 3000) // Check every 3 seconds
  }, [receiverUid, currentUser])

  // Stop polling
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  // Filter users
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase()
    const searchLower = searchTerm.toLowerCase()
    return (
      fullName.includes(searchLower) ||
      user.last_message?.toLowerCase().includes(searchLower) ||
      user.headline?.toLowerCase().includes(searchLower)
    )
  })

  // Initialize
  useEffect(() => {
    fetchCurrentUser()

    // Check if notifications are already enabled
    if ("Notification" in window && Notification.permission === "granted") {
      setNotificationsEnabled(true)
    }

    return () => stopPolling()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchUsers()
      checkUnreadMessages()
      if (isSeller) {
        fetchMyServices()
      }
      // Set up interval for checking unread messages
      const intervalId = setInterval(checkUnreadMessages, 30000)
      return () => clearInterval(intervalId)
    }
  }, [currentUser, isSeller])

  useEffect(() => {
    if (receiverUid && currentUser) {
      setMessages([])
      lastMessageIdRef.current = 0
      fetchReceiverUser()
      loadMessages()
      startPolling()
      // Clear unread for this user
      if (unread[receiverUid]) {
        setUnread((prev) => ({ ...prev, [receiverUid]: false }))
      }
    } else {
      stopPolling()
    }
    return () => stopPolling()
  }, [receiverUid, currentUser, startPolling])

  const selectedUser = users.find((u) => u.uid === receiverUid)

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-[20px] overflow-hidden m-5">
      {/* Users Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-slate-50 relative overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] relative z-10">
          <div className="flex items-center justify-between">
            <h4 className="m-0 text-slate-800 font-semibold text-xl flex items-center gap-2 before:content-['💬'] before:text-2xl">
              Messages
            </h4>
            <button
              onClick={requestNotificationPermission}
              className={`p-2 rounded-lg transition-colors ${
                notificationsEnabled
                  ? "bg-green-100 text-green-600 hover:bg-green-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title={notificationsEnabled ? "Notifications enabled" : "Enable notifications"}
            >
              {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="p-4 bg-white border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl outline-none transition-all duration-300 text-sm bg-slate-50 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] focus:bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-slate-50 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const isUnread = unread[user.uid] === true
              return (
                <Link
                  key={user.uid}
                  to={`/messages/${user.uid}`}
                  className={`group flex items-center p-4 rounded-2xl cursor-pointer transition-all duration-300 mb-3 gap-3 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)] border border-transparent relative overflow-hidden hover:bg-slate-100 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:translate-x-1 ${
                    receiverUid === user.uid
                      ? "bg-blue-50 border-l-4 border-l-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.12)]"
                      : ""
                  } ${
                    isUnread
                      ? "bg-blue-50 border-l-4 border-l-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.12)] animate-pulse"
                      : ""
                  }`}
                  onClick={() => {
                    if (isUnread) {
                      setUnread((prev) => ({ ...prev, [user.uid]: false }))
                    }
                  }}
                >
                  <div className="relative">
                    <img
                      src={
                        user.image
                          ? `${user.image}`
                          : "/placeholder.svg?height=48&width=48"
                      }
                      alt={user.first_name}
                      className="w-12 h-12 rounded-full bg-slate-100 flex-shrink-0 shadow-[0_2px_4px_rgba(0,0,0,0.05)] border-2 border-white transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_4px_8px_rgba(0,0,0,0.1)]"
                    />
                    {user.is_online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1)]"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 relative">
                    <h6 className="text-slate-800 m-0 whitespace-nowrap overflow-hidden text-ellipsis font-semibold text-sm">
                      {user.first_name} {user.last_name}
                    </h6>
                    <small className="block whitespace-nowrap overflow-hidden text-ellipsis text-slate-500 text-xs mt-1 font-medium">
                      {user.last_message}
                    </small>
                  </div>
                  {isUnread && (
                    <span className="absolute top-1/2 right-4 -translate-y-1/2 bg-blue-500 text-white px-2 py-1 rounded-xl text-xs font-semibold">
                      New
                    </span>
                  )}
                  {user.last_message_time && (
                    <span className="absolute top-4 right-4 text-xs text-slate-500">
                      {new Date(user.last_message_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </Link>
              )
            })
          ) : (
            <div className="text-center py-8 text-slate-500">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm">No conversations found</p>
              <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {receiverUid ? (
          <>
            {/* Chat Header */}
            <div className="flex flex-row items-center justify-between p-5 border-b border-gray-200 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    className="h-12 w-12 rounded-full"
                    src={
                      selectedUser?.image
                        ? `${selectedUser.image}`
                        : "/placeholder.svg?height=48&width=48"
                    }
                    alt={selectedUser?.first_name}
                  />
                  {selectedUser?.is_online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div>
                  <h5 className="text-slate-800 font-semibold m-0 text-lg">
                    {selectedUser?.first_name} {selectedUser?.last_name}
                  </h5>
                  <small className="text-slate-500">{selectedUser?.headline}</small>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Connection Status */}
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    connected
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}
                >
                  {connected ? (
                    <>
                      <Wifi className="w-4 h-4" />
                      Connected
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4" />
                      Disconnected
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {isSeller && (
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                      onClick={() => setShowOrderModal(true)}
                    >
                      Create Custom Order
                    </button>
                  )}
                  <Link
                    to={`/profile/${receiverUid}`}
                    className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg text-sm hover:bg-blue-50 transition-colors flex items-center gap-1"
                  >
                    <User className="w-4 h-4" /> View Profile
                  </Link>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              className="flex-1 overflow-y-auto p-6 bg-slate-50 bg-[linear-gradient(rgba(255,255,255,0.9),rgba(255,255,255,0.9)),url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%239C92AC' fillOpacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400"
              ref={chatBodyRef}
            >
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender_id === currentUser?.id
                  const isCustomOrder = isCustomOrderMessage(message)
                  const isDeleted = message.is_deleted === true
                  const messageTime = new Date(message.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  const canDelete = isOwn && !isDeleted && isMessageRecent(message.created_at)
                  const hasNote = message.message?.includes("Note:") || message.note

                  return (
                    <div
                      key={`${message.id}-${message.created_at}`}
                      className={`group flex mb-6 animate-[fadeIn_0.3s_ease] flex-col relative ${
                        isOwn ? "items-end" : "items-start"
                      } ${isOwn ? "animate-[slideInRight_0.3s_ease-out]" : "animate-[slideInLeft_0.3s_ease-out]"}`}
                    >
                      <div className={`flex items-center gap-2 mb-1.5 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <span className={`font-semibold text-sm ${isOwn ? "text-blue-600" : "text-slate-800"}`}>
                          {isOwn ? "You" : selectedUser?.first_name}
                        </span>
                        <span className={`text-xs ${isOwn ? "text-blue-600" : "text-slate-500"}`}>{messageTime}</span>
                      </div>

                      <div
                        className={`max-w-[70%] p-4 rounded-[20px] relative shadow-[0_2px_8px_rgba(0,0,0,0.08)] leading-relaxed transition-all duration-300 ${
                          isOwn
                            ? "bg-blue-500 text-white hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(59,130,246,0.2)]"
                            : "bg-white border border-gray-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                        } ${isDeleted ? "p-2 italic" : ""}`}
                      >
                        {message.message && (
                          <div>
                            {isCustomOrder ? (
                              <div className="bg-white border border-yellow-300 rounded-2xl p-5 mb-2 shadow-[0_4px_12px_rgba(252,211,77,0.1)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(252,211,77,0.15)]">
                                <div className="flex justify-between items-center mb-4 pb-3 border-b border-yellow-300">
                                  <span className="font-semibold text-slate-800 text-lg">Custom Order</span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      message.status === "accepted"
                                        ? "bg-green-100 text-green-800"
                                        : message.status === "rejected"
                                          ? "bg-red-100 text-red-800"
                                          : message.status === "paid"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {message.status === "accepted"
                                      ? "Accepted"
                                      : message.status === "rejected"
                                        ? "Rejected"
                                        : message.status === "paid"
                                          ? "Paid"
                                          : "Pending"}
                                  </span>
                                </div>
                                <div className="mt-4 text-slate-800">
                                  {message.message.split("\n").map((line, index) => {
                                    if (line.startsWith("Custom order created:")) {
                                      return (
                                        <div key={index} className="flex items-center gap-3 mb-3">
                                          <span className="font-medium text-slate-500 min-w-[80px]">Service:</span>
                                          <span className="text-slate-800">
                                            {line.replace("Custom order created:", "").trim()}
                                          </span>
                                        </div>
                                      )
                                    }
                                    if (line.startsWith("Price:")) {
                                      return (
                                        <div key={index} className="flex items-center gap-3 mb-3">
                                          <span className="font-medium text-slate-500 min-w-[80px]">Price:</span>
                                          <span className="text-slate-800">{line}</span>
                                        </div>
                                      )
                                    }
                                    if (line.startsWith("Expires in:")) {
                                      return (
                                        <div key={index} className="flex items-center gap-3 mb-3">
                                          <span className="font-medium text-slate-500 min-w-[80px]">Expires:</span>
                                          <span className="text-slate-800">
                                            {line.replace("Expires in:", "").trim()}
                                          </span>
                                        </div>
                                      )
                                    }
                                    if (line.startsWith("UID:")) {
                                      return (
                                        <div key={index} className="flex items-center gap-3 mb-3">
                                          <span className="font-medium text-slate-500 min-w-[80px]">Order ID:</span>
                                          <span className="text-slate-800">{line.replace("UID:", "").trim()}</span>
                                        </div>
                                      )
                                    }
                                    return null
                                  })}
                                  {hasNote && (
                                    <div className="mt-4 p-4 bg-yellow-50 rounded-xl text-amber-800 text-sm flex items-start gap-2 shadow-[0_2px_4px_rgba(252,211,77,0.1)] before:content-['📝'] before:text-base">
                                      {message.note ||
                                        message.message
                                          .split("\n")
                                          .find((line) => line.startsWith("Note:"))
                                          ?.replace("Note:", "")
                                          .trim()}
                                    </div>
                                  )}
                                </div>
                                {isBuyer &&
                                  message.is_custom_order &&
                                  message.receiver_id === currentUser?.id &&
                                  //  message.status === "pending" && 
                                  message.status !=="accepted" && (
                                  
                                    <div className="flex gap-2 mt-3">
                                      <button
                                        onClick={() => handleAcceptOrder(message)}
                                        disabled={acceptingOrder === (message.order_id || message.chat_order_id)}
                                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                      >
                                        {acceptingOrder === (message.order_id || message.chat_order_id) ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Processing...
                                          </>
                                        ) : (
                                          <>✓ Accept & Pay</>
                                        )}
                                      </button>
                                      <button
                                        onClick={() => handleRejectOrder(message)}
                                        disabled={acceptingOrder === (message.order_id || message.chat_order_id)}
                                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                                      >
                                        ✗ Reject
                                      </button>
                                    </div>
                                  )}
                                {isSeller && message.status === "accepted" && (
                                  <div className="mt-2 text-xs text-green-600 font-medium">
                                    ✓ Order accepted - Awaiting payment
                                  </div>
                                )}
                                {isSeller && message.status === "rejected" && (
                                  <div className="mt-2 text-xs text-red-600 font-medium">✗ Order rejected</div>
                                )}
                              </div>
                            ) : (
                              <>
                                {hasNote ? (
                                  <>
                                    <div className="p-4 bg-white border-b border-gray-300">
                                      {message.message
                                        .split("\n")
                                        .filter((line) => !line.startsWith("Note:"))
                                        .join("\n")}
                                    </div>
                                    <div className="p-3 bg-slate-100 text-slate-600 text-sm flex items-start gap-2 before:content-['📝'] before:text-base">
                                      {message.note ||
                                        message.message
                                          .split("\n")
                                          .find((line) => line.startsWith("Note:"))
                                          ?.replace("Note:", "")
                                          .trim()}
                                    </div>
                                  </>
                                ) : (
                                  <div className={isDeleted ? "p-2.5 italic" : ""}>{message.message}</div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {message.attachment && !isDeleted && (
                          <div className="flex items-center gap-2 p-3 bg-white/10 rounded-xl mt-3 transition-all duration-300 hover:bg-white/15 hover:-translate-y-0.5">
                            <a
                              href={`${config.IMG_BASE_URL}/storage/${message.attachment}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-inherit no-underline flex items-center gap-2 hover:underline"
                            >
                              <span className="text-xl">📎</span>
                              Download Attachment
                            </a>
                          </div>
                        )}
                      </div>

                      {canDelete && (
                        <div className="absolute -right-9 top-1/2 -translate-y-1/2 opacity-0 invisible transition-all duration-200 z-10 group-hover:opacity-100 group-hover:visible">
                          <button
                            className="bg-white border-none cursor-pointer w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 shadow-[0_2px_5px_rgba(0,0,0,0.1)] hover:bg-red-50 hover:scale-110"
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this message?")) {
                                deleteMessage(message.id)
                              }
                            }}
                            title="Delete message"
                          >
                            <Trash2 className="w-4 h-4 text-slate-600 hover:text-red-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-gray-300 flex gap-3 items-center relative">
              <div className="relative">
                <button
                  className="w-10 h-10 border border-gray-300 rounded-lg bg-white flex items-center justify-center cursor-pointer transition-all duration-200 text-xl text-slate-600 p-0 min-w-[40px] shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:bg-slate-50 hover:border-green-500 hover:text-green-500 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.08)] active:translate-y-0 active:shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                  onClick={() => setShowEmoji(!showEmoji)}
                >
                  <Smile className="w-5 h-5" />
                </button>
                {showEmoji && (
                  <div className="absolute bottom-[calc(100%+8px)] left-0 z-[1000] bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-300 overflow-hidden">
                    <EmojiPicker
                      height={300}
                      width={250}
                      onEmojiClick={(emoji) => setNewMessage((prev) => prev + emoji.emoji)}
                      searchDisabled={false}
                      skinTonesDisabled={true}
                      previewConfig={{
                        showPreview: false,
                      }}
                    />
                  </div>
                )}
              </div>

              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 p-3 border border-gray-300 rounded-lg outline-none transition-all duration-200 text-sm bg-slate-100 min-h-[40px] max-h-[120px] resize-none focus:border-green-500 focus:shadow-[0_0_0_2px_rgba(29,191,115,0.1)] focus:bg-white"
                rows={1}
              />

              <input type="file" ref={fileInputRef} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-[40px] h-[40px] p-2 border border-gray-300 rounded bg-white text-sm cursor-pointer text-slate-600 hover:border-green-500 hover:text-green-500 flex items-center justify-center transition-colors"
                disabled={sending}
              >
                <Upload className="w-5 h-5" />
              </button>

              <button
                className="h-10 rounded-lg border-none bg-green-500 text-white inline-flex items-center justify-center cursor-pointer transition-all duration-200 text-sm px-5 min-w-[80px] font-medium shadow-[0_2px_4px_rgba(29,191,115,0.15)] hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(29,191,115,0.2)] active:translate-y-0 active:shadow-[0_2px_4px_rgba(29,191,115,0.15)] disabled:bg-slate-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:opacity-70"
                onClick={sendMessage}
                disabled={sending || (!newMessage.trim() && !fileInputRef.current?.files?.[0])}
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <div className="text-5xl mb-4 text-slate-300">💬</div>
            <div className="text-sm leading-relaxed">Select a conversation to start chatting</div>
          </div>
        )}
      </div>

      {/* Custom Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-[modalFadeIn_0.3s_ease-out]">
          <div className="fixed inset-0 bg-black/50 animate-[backdropFadeIn_0.3s_ease-out]"></div>
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h5 className="text-lg font-semibold">Create Custom Order</h5>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none"
                onClick={() => setShowOrderModal(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleCreateOrder()
                }}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Service</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    value={selectedService}
                    onChange={(e) => {
                      setSelectedService(e.target.value)
                      const service = myServices.find((s) => s.id === Number.parseInt(e.target.value))
                      if (service) {
                        setOrderAmount(service.price.toString())
                      }
                    }}
                    required
                  >
                    <option value="">Select a service</option>
                    {myServices && myServices.length > 0 ? (
                      myServices.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.title} - {service.price} Riyals
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No services available
                      </option>
                    )}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Amount (Riyals)</label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(e.target.value)}
                    required
                    min="1"
                    step="0.01"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Expiry Time</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    value={orderExpiry}
                    onChange={(e) => setOrderExpiry(e.target.value)}
                    required
                  >
                    {expiryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Note (Optional)</label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 focus:outline-none resize-none"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    rows={3}
                    placeholder="Add any additional details..."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="h-10 rounded-lg border border-gray-300 bg-white text-slate-600 inline-flex items-center justify-center cursor-pointer transition-all duration-200 text-sm px-5 min-w-[80px] font-medium shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:bg-slate-50 hover:border-green-500 hover:text-green-500 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.08)] active:translate-y-0 active:shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                    onClick={() => setShowOrderModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 rounded-lg border-none bg-green-500 text-white inline-flex items-center justify-center cursor-pointer transition-all duration-200 text-sm px-5 min-w-[80px] font-medium shadow-[0_2px_4px_rgba(29,191,115,0.15)] hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(29,191,115,0.2)] active:translate-y-0 active:shadow-[0_2px_4px_rgba(29,191,115,0.15)]"
                  >
                    Create Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideInLeft {
          from {
            transform: translateX(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes backdropFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

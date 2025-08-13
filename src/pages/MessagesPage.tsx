"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { Upload, User, Search, Send, Wifi, WifiOff, X, Smile, Trash2, Bell, BellOff, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import EmojiPicker from "emoji-picker-react"
import config from "../config"
import { useTranslation } from "react-i18next"

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
  const { t, i18n } = useTranslation()
  const lang = i18n.language || "en"
  const isRTL = i18n.language === "ar"

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)

  const [showMobileChat, setShowMobileChat] = useState(false)

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
        toast.success(t("notifications.enabled"))
      } else {
        toast.error(t("notifications.denied"))
      }
    } else {
      toast.error(t("notifications.notSupported"))
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
              message: t("messages.deleted"),
            }
          }
          return msg
        }),
      )
      toast.success(t("messages.deleteSuccess"))
    } catch (err) {
      console.error("❌ Failed to delete message:", err)
      toast.error(t("messages.deleteError"))
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
                  : t("common.someone")

                let notificationBody = message.message
                if (message.is_custom_order) {
                  notificationBody = t("notifications.customOrderSent")
                } else if (message.attachment) {
                  notificationBody = t("notifications.attachmentSent")
                }

                showNotification(
                  t("notifications.newMessageFrom", { name: senderName }),
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
      formData.append("receiver_id", receiverUid)
      if (file) {
        formData.append("type", "file")
        // make sure to include the filename
        formData.append("attachment", file, file.name)
      } else {
        formData.append("type", "text")
        formData.append("message", newMessage.trim())
      }
      setSelectedFile(null)
      setFilePreviewUrl(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
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
      toast.success(t("messages.sendSuccess"))
      setConnected(true)
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error(t("messages.sendError"))
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
      toast.error(t("orders.fillAllFields"))
      return
    }

    const selectedServiceData = myServices.find((s) => s.id === Number.parseInt(selectedService))
    if (!selectedServiceData) {
      toast.error(t("orders.serviceNotFound"))
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
          expiry_date: orderExpiry,
          note: orderNote,
        },
        {
          headers: getAuthHeaders(),
          timeout: 10000,
        },
      )
      // console.log("Sending expiry_date to API:", orderExpiry)

      const orderData = orderRes.data.data
      const messageText = `${t("orders.customOrderCreated")}: ${selectedServiceData.title}\n\n${t("orders.price")}: ${orderAmount} ${t("common.currency")}\n\n${t("orders.expiresIn")}: ${
        expiryOptions.find((opt) => opt.value === orderExpiry)?.label
      }${orderNote ? `\n\n${t("orders.note")}: ${orderNote}` : ""}\n\n${t("orders.uid")}: ${orderData.service_uid || orderData.gig_uid}`

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
      setOrderExpiry("1_hour") // keep default
      setOrderNote("")
      scrollToBottom()
      toast.success(t("orders.createSuccess"))
    } catch (err) {
      console.error("❌ Failed to create order:", err)
      toast.error(t("orders.createError"))
    }
  }

  // Handle order acceptance - ENHANCED
  const handleAcceptOrder = async (message: Message) => {
    const orderId = message.order_id || message.chat_order_id
    if (!orderId) {
      toast.error(t("orders.orderIdNotFound"))
      return
    }

    setAcceptingOrder(orderId)

    try {
      const response = await fetch(`${config.API_BASE_URL}/buyer/chat/order/accept/${orderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      const result = await response.json()
      console.log("API Response result:", result)

      // Handle common failure cases explicitly
      if (!response.ok || !result.success) {
        const msg = result.message?.toLowerCase() || ""

        if (msg.includes("already been accepted")) {
          // Mark as accepted
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === message.id ? { ...msg, is_expired: false, is_approved: true, status: "accepted" } : msg,
            ),
          )
          toast.info(t("orders.alreadyAccepted"))
        } else if (msg.includes("expired")) {
          // Mark as expired
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === message.id ? { ...msg, is_expired: true, is_approved: false, status: "expired" } : msg,
            ),
          )
          toast.error(t("orders.expired"))
        } else {
          toast.error(result.message || t("orders.acceptError"))
        }
        return
      }

      // Success: update the message flags from API response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id
            ? {
                ...msg,
                is_expired: result.data?.is_expired ?? false,
                is_approved: result.data?.is_approved ?? false,
                is_rejected: result.data?.is_rejected ?? false,
                status: result.data?.is_approved
                  ? "accepted"
                  : result.data?.is_expired
                    ? "expired"
                    : result.data?.is_rejected
                      ? "rejected"
                      : "pending",
              }
            : msg,
        ),
      )

      toast.success(result.message || t("orders.acceptSuccess"))

      // Redirect only if approved & not expired
      if (!result.data?.is_expired && result.data?.is_approved) {
        let gigUid = message.gig_uid || message.service_uid
        if (!gigUid) {
          const uidLine = message.message.split("\n").find((line) => line.includes("UID:"))
          gigUid = uidLine?.split("UID:")[1]?.trim()
        }

        if (gigUid) {
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
        }
      }
    } catch (err: any) {
      console.error("Error accepting order:", err)
      toast.error(err.message || t("orders.acceptError"))
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
        throw new Error(t("orders.orderIdNotFound"))
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
      toast.success(t("orders.rejectSuccess"))
    } catch (error) {
      console.error("❌ Error rejecting order:", error)
      toast.error(t("orders.rejectError"))
    }
  }

  // Utility functions for orders
  const expiryOptions = [
    { value: "15_minutes", label: t("time.15minutes") },
    { value: "30_minutes", label: t("time.30minutes") },
    { value: "1_hour", label: t("time.1hour") },
    { value: "2_hours", label: t("time.2hours") },
    { value: "4_hours", label: t("time.4hours") },
    { value: "6_hours", label: t("time.6hours") },
    { value: "12_hours", label: t("time.12hours") },
    { value: "1_day", label: t("time.1day") },
    { value: "2_days", label: t("time.2days") },
    { value: "3_days", label: t("time.3days") },
    { value: "1_week", label: t("time.1week") },
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

  useEffect(() => {
    if (receiverUid) {
      setShowMobileChat(true)
    }
  }, [receiverUid])

  const handleMobileBack = () => {
    setShowMobileChat(false)
    navigate("/messages")
  }

  return (
    <div className={`flex h-[calc(100vh-100px)] bg-white rounded-[20px] overflow-hidden m-5 ${isRTL ? "rtl" : "ltr"}`}>
      {/* Users Sidebar - Hidden on mobile when chat is open */}
      <div
        className={`w-full md:w-80 border-r border-gray-200 flex flex-col bg-slate-50 relative overflow-hidden ${
          showMobileChat ? "hidden md:flex" : "flex"
        } ${isRTL ? "border-l border-r-0" : ""}`}
      >
        <div className="p-6 border-b border-gray-200 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] relative z-10">
          <div className="flex items-center justify-between">
            <h4 className="m-0 text-slate-800 font-semibold text-xl flex items-center gap-2 before:content-['💬'] before:text-2xl">
              {t("chat.messages")}
            </h4>
            <button
              onClick={requestNotificationPermission}
              className={`p-2 rounded-lg transition-colors ${
                notificationsEnabled
                  ? "bg-green-100 text-green-600 hover:bg-green-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title={notificationsEnabled ? t("notifications.enabled") : t("notifications.enable")}
            >
              {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="p-4 bg-white border-b border-gray-200">
          <div className="relative">
            <Search
              className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`}
            />
            <input
              type="text"
              placeholder={t("chat.searchMessages")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} py-3 border border-gray-300 rounded-xl outline-none transition-all duration-300 text-sm bg-slate-50 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] focus:bg-white`}
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
                  className={`group flex items-center p-4 rounded-2xl cursor-pointer transition-all duration-300 mb-3 gap-3 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)] border border-transparent relative overflow-hidden hover:bg-slate-100 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${isRTL ? "hover:-translate-x-1" : "hover:translate-x-1"} ${
                    receiverUid === user.uid
                      ? `bg-blue-50 ${isRTL ? "border-r-4 border-r-blue-500" : "border-l-4 border-l-blue-500"} shadow-[0_4px_12px_rgba(59,130,246,0.12)]`
                      : ""
                  } ${
                    isUnread
                      ? `bg-blue-50 ${isRTL ? "border-r-4 border-r-blue-500" : "border-l-4 border-l-blue-500"} shadow-[0_4px_12px_rgba(59,130,246,0.12)] animate-pulse`
                      : ""
                  }`}
                  onClick={() => {
                    if (isUnread) {
                      setUnread((prev) => ({ ...prev, [user.uid]: false }))
                    }
                    setShowMobileChat(true)
                  }}
                >
                  <div className="relative">
                    <img
                      src={user.image ? `${user.image}` : "/placeholder.svg?height=48&width=48"}
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
                    <span
                      className={`absolute top-1/2 ${isRTL ? "left-4" : "right-4"} -translate-y-1/2 bg-blue-500 text-white px-2 py-1 rounded-xl text-xs font-semibold`}
                    >
                      {t("common.new")}
                    </span>
                  )}
                  {user.last_message_time && (
                    <span className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} text-xs text-slate-500`}>
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
              <p className="text-sm">{t("chat.noConversations")}</p>
              <p className="text-xs text-slate-400 mt-1">{t("chat.tryDifferentSearch")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area - Full width on mobile when chat is open */}
      <div className={`flex-1 flex flex-col bg-white ${!showMobileChat ? "hidden md:flex" : "flex"}`}>
        {receiverUid ? (
          <>
            {/* Chat Header */}
            <div className="flex flex-row items-center justify-between md:p-5 border-b border-gray-200 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleMobileBack}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className={`w-5 h-5 text-gray-600 ${isRTL ? "rotate-180" : ""}`} />
                </button>
                <div className="relative">
                  <img
                    className="h-12 w-12 rounded-full"
                    src={selectedUser?.image ? `${selectedUser.image}` : "/placeholder.svg?height=48&width=48"}
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
                      <span className="hidden sm:inline">{t("connection.connected")}</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4" />
                      <span className="hidden sm:inline">{t("connection.disconnected")}</span>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                 {isSeller && (
  <button
    className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
    onClick={() => setShowOrderModal(true)}
  >
    {/* Icon (visible on small screens only) */}
    <span className="block md:hidden">
      📦 {/* You can replace this with any icon component */}
    </span>

    {/* Text (hidden on small screens) */}
    <span className="hidden md:inline">
      {t("orders.createCustomOrder")}
    </span>
  </button>
)}

                  <Link
                    to={`/profile/${receiverUid}`}
                    className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg text-sm hover:bg-blue-50 transition-colors flex items-center gap-1"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("orders.viewProfile")}</span>
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
                  const hasNote = message.message?.includes(t("orders.note")) || message.note

                  const order = message.chat_order || {}
                  const isAccepted = order.is_approved === true
                  const isRejected = order.is_rejected === true
                  const isExpired = order.is_expired === true || order.is_past_expiry === true

                  return (
                    <div
                      key={`${message.id}-${message.created_at}`}
                      className={`group flex mb-6 animate-[fadeIn_0.3s_ease] flex-col relative ${
                        isOwn ? "items-end" : "items-start"
                      } ${isOwn ? "animate-[slideInRight_0.3s_ease-out]" : "animate-[slideInLeft_0.3s_ease-out]"}`}
                    >
                      <div className={`flex items-center gap-2 mb-1.5 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <span className={`font-semibold text-sm ${isOwn ? "text-blue-600" : "text-slate-800"}`}>
                          {isOwn ? t("common.you") : selectedUser?.first_name}
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
                                <div className="flex  flex-col justify-between items-center mb-4 pb-3 border-b border-yellow-300">
                                  <span className="font-semibold text-slate-800 text-lg">
                                    {t("orders.customOrder")}
                                  </span>
                                  <span className="flex justify-between items-center mb-4 pb-1 text-gray-500 text-xs">
                                    {message.message}
                                  </span>
                                </div>
                                <div className="mt-2 text-slate-800">
                                  {message.message.split("\n").map((line, index) => {
                                    if (line.startsWith(t("orders.customOrderCreated"))) {
                                      return (
                                        <div key={index} className="flex items-center gap-3 mb-3 text-sm">
                                          <span className="font-medium text-slate-500 min-w-[80px]">
                                            {t("orders.service")}:
                                          </span>
                                          <span className="text-slate-800">
                                            {line.replace(`${t("orders.customOrderCreated")}:`, "").trim()}
                                          </span>
                                        </div>
                                      )
                                    }
                                    if (line.startsWith(t("orders.price"))) {
                                      return (
                                        <div key={index} className="flex items-center gap-3 mb-3 text-sm">
                                          <span className="font-medium text-slate-500 min-w-[80px]">
                                            {t("orders.price")}:
                                          </span>
                                          <span className="text-slate-800">{line}</span>
                                        </div>
                                      )
                                    }
                                    if (line.startsWith(t("orders.expiresIn"))) {
                                      return (
                                        <div key={index} className="flex items-center gap-3 mb-3 text-sm">
                                          <span className="font-medium text-slate-500 min-w-[80px]">
                                            {t("orders.expires")}:
                                          </span>
                                          <span className="text-slate-800">
                                            {line.replace(`${t("orders.expiresIn")}:`, "").trim()}
                                          </span>
                                        </div>
                                      )
                                    }
                                    if (line.startsWith(t("orders.uid"))) {
                                      return (
                                        <div key={index} className="flex items-center gap-3 mb-3 text-sm">
                                          <span className="font-medium text-slate-500 min-w-[80px]">
                                            {t("orders.orderId")}:
                                          </span>
                                          <span className="text-slate-800">
                                            {line.replace(`${t("orders.uid")}:`, "").trim()}
                                          </span>
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
                                          .find((line) => line.startsWith(`${t("orders.note")}:`))
                                          ?.replace(`${t("orders.note")}:`, "")
                                          .trim()}
                                    </div>
                                  )}
                                </div>

                                {isBuyer && message.is_custom_order && message.receiver_id === currentUser?.id && (
                                  <>
                                    {/* Show Accept & Reject only when order is pending */}
                                    {!isAccepted && !isRejected && !isExpired && (
                                      <div className="flex gap-2 mt-3">
                                        <button
                                          onClick={() => handleAcceptOrder(message)}
                                          disabled={acceptingOrder === (message.order_id || message.chat_order_id)}
                                          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                          {acceptingOrder === (message.order_id || message.chat_order_id) ? (
                                            <>
                                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                              {t("orders.processing")}
                                            </>
                                          ) : (
                                            <>✓ {t("orders.acceptAndPay")}</>
                                          )}
                                        </button>
                                        <button
                                          onClick={() => handleRejectOrder(message)}
                                          disabled={acceptingOrder === (message.order_id || message.chat_order_id)}
                                          className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                                        >
                                          ✗ {t("orders.reject")}
                                        </button>
                                      </div>
                                    )}

                                    {/* Show final status as styled buttons */}
                                    {isAccepted && (
                                      <button
                                        type="button"
                                        disabled
                                        className="flex-1 mt-3 px-4 py-2 bg-green-100 text-green-700 border border-green-300 rounded-lg text-sm font-medium cursor-default"
                                      >
                                        ✓ {t("orders.orderAccepted")}
                                      </button>
                                    )}
                                    {isRejected && (
                                      <button
                                        type="button"
                                        disabled
                                        className="flex-1 mt-3 px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm font-medium cursor-default"
                                      >
                                        ✗ {t("orders.orderRejected")}
                                      </button>
                                    )}
                                    {isExpired && (
                                      <button
                                        type="button"
                                        disabled
                                        className="flex-1 mt-3 px-4 py-2 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-lg text-sm font-medium cursor-default"
                                      >
                                        ⏳ {t("orders.orderExpired")}
                                      </button>
                                    )}
                                  </>
                                )}

                                {isSeller && message.status === "accepted" && (
                                  <div className="mt-2 text-xs text-green-600 font-medium">
                                    ✓ {t("orders.acceptedAwaitingPayment")}
                                  </div>
                                )}
                                {isSeller && message.status === "rejected" && (
                                  <div className="mt-2 text-xs text-red-600 font-medium">
                                    ✗ {t("orders.orderRejected")}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                {hasNote ? (
                                  <>
                                    <div className="p-4 bg-white border-b border-gray-300">
                                      {message.message
                                        .split("\n")
                                        .filter((line) => !line.startsWith(`${t("orders.note")}:`))
                                        .join("\n")}
                                    </div>
                                    <div className="p-3 bg-slate-100 text-slate-600 text-sm flex items-start gap-2 before:content-['📝'] before:text-base">
                                      {message.note ||
                                        message.message
                                          .split("\n")
                                          .find((line) => line.startsWith(`${t("orders.note")}:`))
                                          ?.replace(`${t("orders.note")}:`, "")
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
                              {t("messages.downloadAttachment")}
                            </a>
                          </div>
                        )}
                      </div>

                      {canDelete && (
                        <div
                          className={`absolute ${isRTL ? "-left-9" : "-right-9"} top-1/2 -translate-y-1/2 opacity-0 invisible transition-all duration-200 z-10 group-hover:opacity-100 group-hover:visible`}
                        >
                          <button
                            className="bg-white border-none cursor-pointer w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 shadow-[0_2px_5px_rgba(0,0,0,0.1)] hover:bg-red-50 hover:scale-110"
                            onClick={() => {
                              if (window.confirm(t("messages.confirmDelete"))) {
                                deleteMessage(message.id)
                              }
                            }}
                            title={t("messages.deleteMessage")}
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
            {filePreviewUrl && (
              <div className="p-2 bg-slate-100 rounded-lg mb-2 max-h-24 overflow-hidden">
                {selectedFile?.type.startsWith("image/") ? (
                  <img src={filePreviewUrl || "/placeholder.svg"} alt="preview" className="max-h-20 rounded-md" />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="text-xl">📎</span>
                    {selectedFile?.name}
                  </div>
                )}
                <button
                  className="absolute top-1 right-1 text-slate-500 hover:text-slate-800"
                  onClick={() => {
                    setSelectedFile(null)
                    setFilePreviewUrl(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="p-4 bg-white border-t border-gray-300 flex gap-3 items-center relative">
              <div className="relative">
                <button
                  className="w-10 h-10 border border-gray-300 rounded-lg bg-white flex items-center justify-center cursor-pointer transition-all duration-200 text-xl text-slate-600 p-0 min-w-[40px] shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:bg-slate-50 hover:border-green-500 hover:text-green-500 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.08)] active:translate-y-0 active:shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                  onClick={() => setShowEmoji(!showEmoji)}
                >
                  <Smile className="w-5 h-5" />
                </button>
                {showEmoji && (
                  <div
                    className={`absolute bottom-[calc(100%+8px)] ${isRTL ? "right-0" : "left-0"} z-[1000] bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-300 overflow-hidden`}
                  >
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
                placeholder={t("chat.typeMessage")}
                className="flex-1 p-3 border border-gray-300 rounded-lg outline-none transition-all duration-200 text-sm bg-slate-100 min-h-[40px] max-h-[120px] resize-none focus:border-green-500 focus:shadow-[0_0_0_2px_rgba(29,191,115,0.1)] focus:bg-white"
                rows={1}
              />

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  setSelectedFile(file)
                  if (file) {
                    setFilePreviewUrl(URL.createObjectURL(file))
                  } else {
                    setFilePreviewUrl(null)
                  }
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-[40px] h-[40px] p-2 border border-gray-300 rounded bg-white text-sm cursor-pointer text-slate-600 hover:border-green-500 hover:text-green-500 flex items-center justify-center transition-colors"
                disabled={sending}
              >
                <Upload className="w-5 h-5" />
              </button>

              <button
                className="h-10 rounded-lg border-none bg-green-500 text-white inline-flex items-center justify-center cursor-pointer transition-all duration-200 text-sm px-3 sm:px-5 min-w-[60px] sm:min-w-[80px] font-medium shadow-[0_2px_4px_rgba(29,191,115,0.15)] hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(29,191,115,0.2)] active:translate-y-0 active:shadow-[0_2px_4px_rgba(29,191,115,0.15)] disabled:bg-slate-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:opacity-70"
                onClick={sendMessage}
                disabled={sending || (!newMessage.trim() && !fileInputRef.current?.files?.[0])}
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white sm:mr-2"></div>
                    <span className="hidden sm:inline">{t("messages.sending")}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t("messages.send")}</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <div className="text-5xl mb-4 text-slate-300">💬</div>
            <div className="text-sm leading-relaxed">{t("chat.selectConversation")}</div>
          </div>
        )}
      </div>

      {/* Custom Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-[modalFadeIn_0.3s_ease-out]">
          <div className="fixed inset-0 bg-black/50 animate-[backdropFadeIn_0.3s_ease-out]"></div>
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h5 className="text-lg font-semibold">{t("orders.createCustomOrder")}</h5>
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t("orders.selectService")}</label>
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
                    <option value="">{t("orders.selectAService")}</option>
                    {myServices && myServices.length > 0 ? (
                      myServices.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.title} - {service.price} {t("common.currency")}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {t("orders.noServicesAvailable")}
                      </option>
                    )}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t("orders.amount")} ({t("common.currency")})
                  </label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t("orders.expiryTime")}</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t("orders.noteOptional")}</label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 focus:outline-none resize-none"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    rows={3}
                    placeholder={t("orders.addAdditionalDetails")}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="h-10 rounded-lg border border-gray-300 bg-white text-slate-600 inline-flex items-center justify-center cursor-pointer transition-all duration-200 text-sm px-5 min-w-[80px] font-medium shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:bg-slate-50 hover:border-green-500 hover:text-green-500 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.08)] active:translate-y-0 active:shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                    onClick={() => setShowOrderModal(false)}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="h-10 rounded-lg border-none bg-green-500 text-white inline-flex items-center justify-center cursor-pointer transition-all duration-200 text-sm px-5 min-w-[80px] font-medium shadow-[0_2px_4px_rgba(29,191,115,0.15)] hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(29,191,115,0.2)] active:translate-y-0 active:shadow-[0_2px_4px_rgba(29,191,115,0.15)]"
                  >
                    {t("orders.createOrder")}
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

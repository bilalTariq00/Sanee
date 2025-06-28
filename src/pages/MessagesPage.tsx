"use client"

import type React from "react"
import { useEffect, useLayoutEffect, useState, useRef } from "react"
import { useParams, useNavigate, useLocation, Link } from "react-router-dom"
import axios from "axios"
import config from "@/config"
import Echo from "laravel-echo"
import Pusher from "pusher-js"
import EmojiPicker from "emoji-picker-react"
import { Upload, User, X } from "lucide-react"
import { toast } from "sonner"

// Add this at the top of the file, after imports
declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}
window.Pusher = Pusher

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
  gig_uid?: string
  amount?: number
  note?: string
  is_deleted?: boolean
  sender?: {
    uid: string
    first_name: string
    last_name: string
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

interface Gig {
  id: number
  title: string
  price: number
}

interface UserProfile {
  id: number
  uid: string
  first_name: string
  last_name: string
  account_type: string
}

function Chat() {
  const { userId: receiverUid } = useParams<{ userId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatBodyRef = useRef<HTMLDivElement>(null)
  const topMessageRef = useRef<HTMLDivElement>(null)
  const echo = useRef<Echo | null>(null)
  const scrollLock = useRef(false)
  const scrollCompleted = useRef(false)
  const pageRef = useRef(1)

  // State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [receiverUser, setReceiverUser] = useState<ChatUser | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedGig, setSelectedGig] = useState("")
  const [orderAmount, setOrderAmount] = useState("")
  const [orderExpiry, setOrderExpiry] = useState("1_hour")
  const [orderNote, setOrderNote] = useState("")
  const [myGigs, setMyGigs] = useState<Gig[]>([])
  const [isSeller, setIsSeller] = useState(false)
  const [users, setUsers] = useState<ChatUser[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [unread, setUnread] = useState<Record<string, boolean>>({})
  const [hasMore, setHasMore] = useState(true)
  const [showEmoji, setShowEmoji] = useState(false)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Get current user ID from state instead of localStorage directly
  const currentUserId = currentUser?.id || 0
  const currentUserUid = currentUser?.uid || localStorage.getItem("uid")

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "auto" })

  // Fetch current user profile first
  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      console.log("🔍 Current user from API:", res.data)

      setCurrentUser(res.data)
      setIsSeller(res.data.account_type === "seller")

      // Also update localStorage to ensure consistency
      localStorage.setItem("user_id", res.data.id.toString())
      localStorage.setItem("uid", res.data.uid)
    } catch (err) {
      console.error("❌ Failed to fetch current user:", err)
    }
  }

  const fetchReceiverUser = async () => {
    if (!receiverUid) return
    try {
      const res = await axios.get(`${config.API_BASE_URL}/chat/user/${receiverUid}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      console.log("🔍 Receiver user:", res.data)
      setReceiverUser(res.data)
    } catch (err) {
      console.error("❌ Receiver user fetch failed:", err)
    }
  }

  const fetchMyGigs = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/seller/gigs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setMyGigs(res.data)
    } catch (err) {
      console.error("❌ Failed to fetch gigs:", err)
    }
  }

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

  const handleAcceptOrder = async (message: Message) => {
    try {
      const lines = message.message.split("\n")
      const uidLine = lines.find((line) => line.includes("UID:"))
      const gigUid = uidLine?.split("UID:")[1]?.trim()

      const priceLine = lines.find((line) => line.includes("Price:"))
      const priceMatch = priceLine?.match(/\$(\d+(\.\d+)?)/)
      const amount = priceMatch ? Number.parseFloat(priceMatch[1]) : null

      const orderId = message.order_id || message.chat_order_id

      if (!gigUid) {
        throw new Error("❌ Gig UID not found in message")
      }

      if (!amount) {
        throw new Error("❌ Price not found in message")
      }

      if (!orderId) {
        throw new Error("❌ Order ID not found in message")
      }

      navigate(`/checkout/${gigUid}`, {
        state: {
          message: message.note || "",
          price: amount,
          is_custom_order: true,
          order_id: orderId,
        },
      })
    } catch (error) {
      console.error("Error in handleAcceptOrder:", error)
      toast((error as Error).message)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/chat/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setUsers(res.data)
    } catch (err) {
      console.error("❌ User fetch error:", err)
    }
  }

  const selectedUser = users.find((u) => u.uid === receiverUid)

  const fetchMessages = async () => {
    if (!hasMore || loading || scrollCompleted.current || !receiverUid) return

    setLoading(true)
    try {
      const res = await axios.get(`${config.API_BASE_URL}/chat/messages/${receiverUid}?page=${pageRef.current}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      const fetched = res.data.messages || []
      console.log("🔍 Fetched messages:", fetched)

      if (!res.data.next_page) {
        setHasMore(false)
        scrollCompleted.current = true
      }

      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id))
        const unique = fetched.filter((m: Message) => !ids.has(m.id))
        return [...unique, ...prev]
      })

      if (res.data.next_page) {
        pageRef.current = res.data.next_page
      }
    } catch (err) {
      console.error("❌ Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!newMessage && !file) return
    if (!receiverUid || !currentUserId) return

    console.log("📤 Sending message with currentUserId:", currentUserId)

    setSending(true)
    const formData = new FormData()
    formData.append("receiver_id", receiverUid)
    formData.append("type", file ? "file" : "text")
    if (newMessage) formData.append("message", newMessage)
    if (file) formData.append("attachment", file)

    try {
      const res = await axios.post(`${config.API_BASE_URL}/chat/send`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      })

      const newMsg = res.data.message
      console.log("📤 Message sent response:", newMsg)
      console.log("📤 Message sender_id:", newMsg.sender_id, "Current user ID:", currentUserId)

      setMessages((prev) => {
        const messageExists = prev.some((m) => m.id === newMsg.id)
        if (messageExists) return prev
        return [...prev, newMsg]
      })

      setNewMessage("")
      if (fileInputRef.current) fileInputRef.current.value = ""

      setTimeout(scrollToBottom, 100)
    } catch (err) {
      console.error("❌ Send error:", err)
      toast("Failed to send message. Please try again.")
    } finally {
      setSending(false)
    }
  }

  const checkUnreadMessages = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/chat/unread-messages`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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

  const handleCreateOrder = async () => {
    if (!selectedGig || !orderAmount || !receiverUid) {
      toast("Please fill in all fields")
      return
    }

    const expiryDate = getExpiryDate(orderExpiry)
    const selectedGigData = myGigs.find((g) => g.id === Number.parseInt(selectedGig))

    try {
      const orderRes = await axios.post(
        `${config.API_BASE_URL}/seller/chat/create-order`,
        {
          receiver_id: receiverUid,
          sender_uid: currentUserUid,
          gig_id: selectedGig,
          amount: Number.parseFloat(orderAmount),
          expiry_date: expiryDate,
          note: orderNote,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      )

      const orderData = orderRes.data.data
      const messageText = `Custom order created: ${selectedGigData?.title}\n\nPrice: $${orderAmount}\n\nExpires in: ${
        expiryOptions.find((opt) => opt.value === orderExpiry)?.label
      }${orderNote ? `\n\nNote: ${orderNote}` : ""}\n\nUID: ${orderData.gig_uid}`

      const messageFormData = new FormData()
      messageFormData.append("receiver_id", receiverUid)
      messageFormData.append("type", "text")
      messageFormData.append("message", messageText)
      messageFormData.append("is_custom_order", "true")
      messageFormData.append("gig_uid", orderData.gig_uid)
      messageFormData.append("amount", orderAmount)
      messageFormData.append("note", orderNote)
      messageFormData.append("order_id", orderData.id.toString())
      messageFormData.append("chat_order_id", orderData.id.toString())

      const messageRes = await axios.post(`${config.API_BASE_URL}/chat/send`, messageFormData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      })

      const newMessage = {
        ...messageRes.data.message,
        gig_uid: orderData.gig_uid,
        amount: Number.parseFloat(orderAmount),
        note: orderNote,
        is_custom_order: true,
        order_id: orderData.id,
        chat_order_id: orderData.id,
      }

      setMessages((prev) => [...prev, newMessage])

      setShowOrderModal(false)
      setSelectedGig("")
      setOrderAmount("")
      setOrderExpiry("1_hour")
      setOrderNote("")
    } catch (err) {
      console.error("❌ Failed to create order:", err)
      toast("Failed to create order")
    }
  }

  const deleteMessage = async (messageId: number) => {
    try {
      await axios.delete(`${config.API_BASE_URL}/chat/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              is_deleted: true,
              message: "This message is removed",
            }
          }
          return msg
        }),
      )
    } catch (err) {
      console.error("❌ Failed to delete message:", err)
      toast("Failed to delete message")
    }
  }

  const isMessageRecent = (createdAt: string) => {
    const messageTime = new Date(createdAt)
    const now = new Date()
    const diffInMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60)
    return diffInMinutes <= 5
  }

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

  const isCustomOrderMessage = (message: Message) => {
    return message.is_custom_order && message.order_id !== null && message.order_id !== undefined
  }

  const handleGigSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedGigId = e.target.value
    setSelectedGig(selectedGigId)

    if (selectedGigId) {
      const selectedGigData = myGigs.find((g) => g.id === Number.parseInt(selectedGigId))
      if (selectedGigData) {
        setOrderAmount(selectedGigData.price.toString())
      }
    } else {
      setOrderAmount("")
    }
  }

  // Effects
  useEffect(() => {
    // Fetch current user first, then other data
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchReceiverUser()
    }
  }, [receiverUid, currentUser])

  useEffect(() => {
    if (isSeller && currentUser) {
      fetchMyGigs()
    }
  }, [isSeller, currentUser])

  useEffect(() => {
    if (showOrderModal && isSeller) {
      fetchMyGigs()
    }
  }, [showOrderModal, isSeller])

  useEffect(() => {
    if (currentUser) {
      const checkNewMessages = async () => {
        await checkUnreadMessages()
      }

      checkNewMessages()
      const intervalId = setInterval(checkNewMessages, 30000)
      return () => clearInterval(intervalId)
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser) {
      const initializeChat = async () => {
        try {
          await checkUnreadMessages()
          await fetchUsers()
        } catch (err) {
          console.error("❌ Initialization error:", err)
        }
      }

      initializeChat()
    }
  }, [currentUser])

  useEffect(() => {
    if (receiverUid && currentUser) {
      setMessages([])
      pageRef.current = 1
      setHasMore(true)
      scrollCompleted.current = false
      scrollLock.current = false
      fetchMessages()
    }
  }, [receiverUid, currentUser])

  useLayoutEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const container = chatBodyRef.current
    if (!container || !topMessageRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && !scrollLock.current) {
          scrollLock.current = true
          const prevHeight = container.scrollHeight

          fetchMessages().then(() => {
            setTimeout(() => {
              container.scrollTop = container.scrollHeight - prevHeight
              scrollLock.current = false
            }, 100)
          })
        }
      },
      {
        root: container,
        threshold: 0.9,
      },
    )

    observer.observe(topMessageRef.current)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, loading])

  // Pusher initialization
  useEffect(() => {
    if (!currentUserId) return

    console.log("🔌 Initializing Pusher for user:", currentUserId)

    Pusher.logToConsole = true

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

    const channel = echo.current.private(`chat.${currentUserId}`)

    channel.listen(".new-message", (e: any) => {
      const msg = e.message
      console.log("📨 Received message via Pusher:", msg)

      setMessages((prev) => {
        const messageExists = prev.some((m) => m.id === msg.id)
        if (messageExists) return prev
        return [...prev, msg]
      })

      if (msg.sender?.uid === receiverUid) {
        setTimeout(scrollToBottom, 100)
      }

      if (msg.sender?.uid && msg.sender.uid !== receiverUid) {
        setUnread((prev) => ({ ...prev, [msg.sender.uid]: true }))
      }

      fetchUsers()
    })

    return () => {
      if (echo.current) {
        echo.current.leave(`chat.${currentUserId}`)
        echo.current.disconnect()
      }
    }
  }, [currentUserId, receiverUid])

  // Debug panel (remove in production)
  const DebugPanel = () => (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded text-xs max-w-xs z-50">
      <h4 className="text-yellow-400 mb-2">Debug Info</h4>
      <div>Current User ID: {currentUserId}</div>
      <div>Current User UID: {currentUserUid}</div>
      <div>Is Seller: {isSeller ? "Yes" : "No"}</div>
      <div>Receiver UID: {receiverUid}</div>
      <div>Messages Count: {messages.length}</div>
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-[20px] overflow-hidden m-5">
      {/* Debug Panel - Remove in production */}
      {/* <DebugPanel /> */}

      {/* Users List */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-slate-50 relative overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] relative z-10">
          <h4 className="m-0 text-slate-800 font-semibold text-xl flex items-center gap-2 before:content-['💬'] before:text-2xl">
            Messages
          </h4>
        </div>
        <div className="p-4 bg-white border-b border-gray-200">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl outline-none transition-all duration-300 text-sm bg-slate-50 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] focus:bg-white"
          />
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
                      src={user.image || "/placeholder.svg?height=48&width=48"}
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
                <img
                  className="h-12 w-12 rounded-full"
                  src={selectedUser?.image || "/placeholder.svg?height=48&width=48"}
                  alt={selectedUser?.first_name}
                />
                <div>
                  <h5 className="text-slate-800 font-semibold m-0 text-lg">
                    {selectedUser?.first_name} {selectedUser?.last_name}
                  </h5>
                  <small className="text-slate-500">{selectedUser?.headline}</small>
                </div>
              </div>
              <div className="flex gap-2">
                {isSeller && (
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                    onClick={() => setShowOrderModal(true)}
                  >
                    Create Custom Order
                  </button>
                )}
                <Link
                  to={`/profile/${receiverUid}`}
                  className="px-4 py-2 border border-blue-500 text-blue-500 rounded text-sm hover:bg-blue-50 transition-colors flex items-center gap-1"
                >
                  <User className="w-4 h-4" /> View Profile
                </Link>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              className="flex-1 overflow-y-auto p-6 bg-slate-50 bg-[linear-gradient(rgba(255,255,255,0.9),rgba(255,255,255,0.9)),url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%239C92AC' fillOpacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400"
              ref={chatBodyRef}
            >
              <div ref={topMessageRef}></div>
              {!hasMore && <div className="text-center text-slate-500 mb-2">No more messages to load.</div>}
              {messages.map((msg) => {
                const isCustomOrder = isCustomOrderMessage(msg)
                // Enhanced message positioning logic with better debugging
                const isCurrentUser = Number(msg.sender_id) === Number(currentUserId)
                const hasNote = msg.message?.includes("Note:") || msg.note
                const isDeleted = msg.is_deleted === true
                const messageTime = new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
                const canDelete = isCurrentUser && !isDeleted && isMessageRecent(msg.created_at)

                // Enhanced debug logging
                console.log(
                  `🔍 Message ${msg.id}: sender_id=${msg.sender_id} (${typeof msg.sender_id}), currentUserId=${currentUserId} (${typeof currentUserId}), isCurrentUser=${isCurrentUser}`,
                )

                return (
                  <div
                    key={`${msg.id}-${msg.created_at}`}
                    className={`group flex mb-6 animate-[fadeIn_0.3s_ease] flex-col relative ${
                      isCurrentUser ? "items-end" : "items-start"
                    } ${isCurrentUser ? "animate-[slideInRight_0.3s_ease-out]" : "animate-[slideInLeft_0.3s_ease-out]"}`}
                  >
                    {/* Debug info for each message */}
                    {/* <div className="text-xs text-gray-400 mb-1">
                      Debug: sender_id={msg.sender_id}, current={currentUserId}, isMe={isCurrentUser ? "YES" : "NO"}
                    </div> */}

                    <div className={`flex items-center gap-2 mb-1.5 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                      <span className={`font-semibold text-sm ${isCurrentUser ? "text-blue-600" : "text-slate-800"}`}>
                        {isCurrentUser ? "You" : selectedUser?.first_name}
                      </span>
                      <span className={`text-xs ${isCurrentUser ? "text-blue-600" : "text-slate-500"}`}>
                        {messageTime}
                      </span>
                    </div>
                    <div
                      className={`max-w-[70%] p-4 rounded-[20px] relative shadow-[0_2px_8px_rgba(0,0,0,0.08)] leading-relaxed transition-all duration-300 ${
                        isCurrentUser
                          ? "bg-blue-500 text-white hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(59,130,246,0.2)]"
                          : "bg-white border border-gray-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                      } ${isDeleted ? "p-2 italic" : ""}`}
                    >
                      {msg.message && (
                        <div>
                          {isCustomOrder ? (
                            <div className="bg-white border border-yellow-300 rounded-2xl p-5 mb-2 shadow-[0_4px_12px_rgba(252,211,77,0.1)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(252,211,77,0.15)]">
                              <div className="flex justify-between items-center mb-4 pb-3 border-b border-yellow-300">
                                <span className="font-semibold text-slate-800 text-lg">Custom Order</span>
                                {!isCurrentUser && (
                                <button
                                  className="text-blue-500 hover:underline text-sm"
                                  onClick={() => handleAcceptOrder(msg)}
                                  disabled={sending}
                                >
                                  {sending ? "Processing..." : "Accept Order"}
                                </button>
                                
                                
                                )} 
                              </div>
                              <div className="mt-4 text-slate-800">
                                {msg.message.split("\n").map((line, index) => {
                                  if (line.startsWith("Custom order created:")) {
                                    return (
                                      <div key={index} className="flex items-center gap-3 mb-3">
                                        <span className="font-medium text-slate-500 min-w-[80px]">Gig:</span>
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
                                        <span className="text-slate-800">{line.replace("Expires in:", "").trim()}</span>
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
                                    {msg.note ||
                                      msg.message
                                        .split("\n")
                                        .find((line) => line.startsWith("Note:"))
                                        ?.replace("Note:", "")
                                        .trim()}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <>
                              {hasNote ? (
                                <>
                                  <div className="p-4 bg-white border-b border-gray-300">
                                    {msg.message
                                      .split("\n")
                                      .filter((line) => !line.startsWith("Note:"))
                                      .join("\n")}
                                  </div>
                                  <div className="p-3 bg-slate-100 text-slate-600 text-sm flex items-start gap-2 before:content-['📝'] before:text-base">
                                    {msg.note ||
                                      msg.message
                                        .split("\n")
                                        .find((line) => line.startsWith("Note:"))
                                        ?.replace("Note:", "")
                                        .trim()}
                                  </div>
                                </>
                              ) : (
                                <div className={isDeleted ? "p-2.5 italic" : ""}>{msg.message}</div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      {msg.attachment && !isDeleted && (
                        <div className="flex items-center gap-2 p-3 bg-white/10 rounded-xl mt-3 transition-all duration-300 hover:bg-white/15 hover:-translate-y-0.5">
                          <a
                            href={`${config.IMG_BASE_URL}/storage/${msg.attachment}`}
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
                              deleteMessage(msg.id)
                            }
                          }}
                          title="Delete message"
                        >
                          <span className="text-sm text-slate-600 transition-colors duration-200 hover:text-red-500">
                            🗑️
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-gray-300 flex gap-3 items-center relative">
              <div className="relative">
                <button
                  className="w-10 h-10 border border-gray-300 rounded-lg bg-white flex items-center justify-center cursor-pointer transition-all duration-200 text-xl text-slate-600 p-0 min-w-[40px] shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:bg-slate-50 hover:border-green-500 hover:text-green-500 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.08)] active:translate-y-0 active:shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                  onClick={() => setShowEmoji(!showEmoji)}
                >
                  😊
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
              <input
                type="text"
                placeholder="Type a message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                className="flex-1 p-3 border border-gray-300 rounded outline-none transition-all duration-200 text-sm bg-slate-100 min-h-[40px] focus:border-green-500 focus:shadow-[0_0_0_2px_rgba(29,191,115,0.1)] focus:bg-white"
              />
              <input type="file" ref={fileInputRef} id="file-upload" className="hidden" />

              <label
                htmlFor="file-upload"
                className="w-[40px] h-[40px] p-2 border border-gray-300 rounded bg-white text-sm cursor-pointer text-slate-600 hover:border-green-500 hover:text-green-500 flex items-center justify-center"
              >
                <Upload className="w-5 h-5" />
              </label>

              <button
                className="h-10 rounded-lg border-none bg-green-500 text-white inline-flex items-center justify-center cursor-pointer transition-all duration-200 text-sm px-5 min-w-[80px] font-medium shadow-[0_2px_4px_rgba(29,191,115,0.15)] hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(29,191,115,0.2)] active:translate-y-0 active:shadow-[0_2px_4px_rgba(29,191,115,0.15)] disabled:bg-slate-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:opacity-70"
                onClick={sendMessage}
                disabled={sending || !currentUserId}
              >
                {sending ? "Sending..." : "Send"}
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Gig</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                    value={selectedGig}
                    onChange={handleGigSelect}
                    required
                  >
                    <option value="">Select a gig</option>
                    {myGigs && myGigs.length > 0 ? (
                      myGigs.map((gig) => (
                        <option key={gig.id} value={gig.id}>
                          {gig.title} - ${gig.price}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No gigs available
                      </option>
                    )}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Amount ($)</label>
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
    </div>
  )
}

export default Chat

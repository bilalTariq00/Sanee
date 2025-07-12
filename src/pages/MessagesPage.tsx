"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { Upload, User, Search, Send, Wifi, WifiOff, X } from "lucide-react"
import { toast } from "sonner"
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
  const [unreadMap, setUnreadMap] = useState<Record<string,number>>({});

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
const isBuyer = currentUser?.account_type === "buyer"
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
      formData.append("type", file ? "file" : "text")

      if (newMessage.trim()) {
        formData.append("message", newMessage.trim())
      }
      if (file) {
        formData.append("attachment", file)
      }

      const res = await axios.post(`${config.API_BASE_URL}/chat/send`, formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
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
      const token = localStorage.getItem("token");
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
      }${orderNote ? `\n\nNote: ${orderNote}` : ""}\n\nUID: ${orderData.service_uid}`

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
       gig_uid:     orderData.gig_uid,
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

  // Handle order acceptance - FIXED
  const handleAcceptOrder = async (message: Message) => {
  try {
    const orderId = message.order_id || message.chat_order_id;
    if (!orderId) throw new Error("Order ID not found");

    // Grab the UID straight off the message object:
    const gigUid = message.gig_uid;
  if (!gigUid) {
    toast.error("❌ Gig UID not found on message");
    console.error("Message object:", message);
    return;
  }


    // If you need the amount or note, you already have them on message.amount and message.note
    const amount = message.amount;
    const note   = message.note || "";

    // Navigate to checkout
    navigate(`/checkout/${gigUid}`, {
      state: {
        message: note,
        price:   amount,
        is_custom_order: true,
        order_id: orderId,
      },
    });
  } catch (err: any) {
    console.error("Error in handleAcceptOrder:", err);
    toast.error(err.message);
  }
};



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
    return fullName.includes(searchTerm.toLowerCase())
  })

  // Initialize
  useEffect(() => {
    fetchCurrentUser()
    return () => stopPolling()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchUsers()
      if (isSeller) {
        fetchMyServices()
      }
    }
  }, [currentUser, isSeller])

  useEffect(() => {
    if (receiverUid && currentUser) {
      setMessages([])
      lastMessageIdRef.current = 0
      fetchReceiverUser()
      loadMessages()
      startPolling()
    } else {
      stopPolling()
    }

    return () => stopPolling()
  }, [receiverUid, currentUser, startPolling])
  console.log({ 
  accountType: currentUser?.account_type,
  isBuyer,
  currentUserId: currentUser?.id
})


  return (
    <div className="flex h-screen bg-gray-100">
      {/* Connection Status */}
      {/* <div className="fixed top-4 right-4 z-50">
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
      </div> */}

      {/* Users Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.map((user) => (
            <Link
              key={user.uid}
              to={`/messages/${user.uid}`}
              className={`flex items-center p-4 hover:bg-gray-50 border-b border-gray-100 ${
                receiverUid === user.uid ? "bg-blue-50 border-blue-200" : ""
              }`}
            >
              <img
                src={user.image || "/placeholder.svg?height=40&width=40"}
                alt={user.first_name}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-sm text-gray-500 truncate">{user.last_message}</p>
              </div>
              {user.is_online && <div className="w-3 h-3 bg-green-500 rounded-full"></div>}
            </Link>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {receiverUid ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center">
               <img
  src={
    receiverUser?.image
      ? `${config.IMG_BASE_URL}/storage/${receiverUser.image}`
      : "/placeholder.svg?height=40&width=40"
  }
  alt={`${receiverUser?.first_name}’s avatar`}
  className="w-10 h-10 rounded-full mr-3"
/>
{/* connection badge */}
<div className="absolute  z-50">
  <div
    className={`flex items-center  px-1 mt-4 py-1 rounded-full text-sm font-medium ${
      connected
        ? "bg-green-100 text-green-800 border border-green-200"
        : "bg-red-100 text-red-800 border border-red-200"
    }`}
  >
  </div>
</div>
                <div>
                  
                  <h3 className="text-lg font-semibold text-gray-900">
                    {receiverUser?.first_name} {receiverUser?.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{receiverUser?.headline}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {isSeller && (
                  <button
                    onClick={() => setShowOrderModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Custom Order
                  </button>
                )}
                <Link
                  to={`/profile/${receiverUid}`}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender_id === currentUser?.id
                  const isCustomOrder = isCustomOrderMessage(message)

                  return (
                    <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwn ? "bg-blue-600 text-white" : "bg-white text-gray-900 border border-gray-200"
                        }`}
                      >
                        {isCustomOrder ? (
                          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-gray-800">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-sm">Custom Order</span>
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

                            <div className="space-y-1 text-xs">
                              {message.message.split("\n").map((line, index) => {
                                if (line.startsWith("Custom order created:")) {
                                  return (
                                    <div key={index}>
                                      <strong>Service:</strong> {line.replace("Custom order created:", "").trim()}
                                    </div>
                                  )
                                }
                                if (line.startsWith("Price:")) {
                                  return (
                                    <div key={index}>
                                      <strong>Price:</strong> {line.replace("Price:", "").trim()}
                                    </div>
                                  )
                                }
                                if (line.startsWith("Expires in:")) {
                                  return (
                                    <div key={index}>
                                      <strong>Expires:</strong> {line.replace("Expires in:", "").trim()}
                                    </div>
                                  )
                                }
                                if (line.startsWith("UID:")) {
                                  return (
                                    <div key={index}>
                                      <strong>Order ID:</strong> {line.replace("UID:", "").trim()}
                                    </div>
                                  )
                                }
                                return null
                              })}

                              {message.note && (
                                <div className="mt-2 p-2 bg-yellow-100 rounded">
                                  <strong>Note:</strong> {message.note}
                                </div>
                              )}
                            </div>

                           {isBuyer
  && message.is_custom_order
  // && message.status === "pending"
  && message.receiver_id === currentUser?.id && (
  <div className="flex gap-2 mt-3">
    <button
      onClick={() => handleAcceptOrder(message)}
      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
    >
      ✓ Accept & Pay
    </button>
    <button
      onClick={() => handleRejectOrder(message)}
      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
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
                            <p className="text-sm">{message.message}</p>
                            {message.attachment && (
                              <a
                                href={`${config.IMG_BASE_URL}/storage/${message.attachment}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline mt-1 block"
                              >
                                📎 Attachment
                              </a>
                            )}
                          </>
                        )}
                        <p className="text-xs mt-1 opacity-70">{new Date(message.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
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
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={1}
                  />
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={() => {
                    // Auto-send when file is selected
                    if (fileInputRef.current?.files?.[0]) {
                      sendMessage()
                    }
                  }}
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={sending}
                >
                  <Upload className="w-5 h-5" />
                </button>

                <button
                  onClick={sendMessage}
                  disabled={sending || (!newMessage.trim() && !fileInputRef.current?.files?.[0])}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose someone from your contacts to start messaging</p>
            </div>
          </div>
        )}
      </div>
      {/* Custom Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Create Custom Order</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-gray-400 hover:text-gray-600">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Service</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    {myServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.title} - {service.price} Riyals
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (Riyals)</label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(e.target.value)}
                    required
                    min="1"
                    step="0.01"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Time</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Note (Optional)</label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    rows={3}
                    placeholder="Add any additional details..."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    onClick={() => setShowOrderModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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

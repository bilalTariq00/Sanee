"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  Filter,
  Trash2,
  Mail,
  Briefcase,
  DollarSign,
  Settings,
  TestTube,
  ArrowRight,
} from "lucide-react"
import axios from "axios"
import config from "@/config"
import { useAuth } from "@/contexts/AuthContext"
import { useNotificationSettingsSafe } from "@/hooks/useNotificationSettingsSafe"
import { useTranslation } from "react-i18next"

interface NotificationType {
  id: string
  name: string
  description: string
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  data?: any
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { playNotificationSound, settings } = useNotificationSettingsSafe()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0)

  const [selectedType, setSelectedType] = useState<string>("")
  const [showOnlyUnread, setShowOnlyUnread] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(20)

  const isRTL = i18n.dir() === "rtl"

  const testNotificationSound = () => {
    playNotificationSound()
  }

  const fetchNotificationTypes = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get(`${config.API_BASE_URL}/notifications/types`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    const data = res.data?.data
if (Array.isArray(data)) {
  setNotificationTypes(data)
} else {
  setNotificationTypes([])
}
    } catch {
      setNotificationTypes([])
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get(`${config.API_BASE_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const newCount = res.data?.count || 0
      if (newCount > previousUnreadCount && previousUnreadCount > 0) {
        playNotificationSound()
      }
      setPreviousUnreadCount(unreadCount)
      setUnreadCount(newCount)
    } catch {
      // ignore
    }
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const params = new URLSearchParams()
      if (selectedType) params.append("type", selectedType)
      if (showOnlyUnread) params.append("is_read", "false")
      params.append("per_page", perPage.toString())

      const res = await axios.get(
        `${config.API_BASE_URL}/notifications?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const items = res.data?.data?.notifications || []
      setNotifications(Array.isArray(items) ? items : [])
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    setLoadingAction(id)
    try {
      const token = localStorage.getItem("token")
      await axios.post(
        `${config.API_BASE_URL}/notifications/${id}/mark-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      fetchUnreadCount()
    } catch {
      // ignore
    } finally {
      setLoadingAction(null)
    }
  }

  const markAllAsRead = async () => {
    setLoadingAction("mark-all")
    try {
      const token = localStorage.getItem("token")
      const suffix = selectedType ? `?type=${selectedType}` : ""
      await axios.post(
        `${config.API_BASE_URL}/notifications/mark-all-read${suffix}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      fetchUnreadCount()
    } catch {
      // ignore
    } finally {
      setLoadingAction(null)
    }
  }

  const deleteNotification = async (id: string) => {
    setLoadingAction(id)
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`${config.API_BASE_URL}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      fetchUnreadCount()
    } catch {
      // ignore
    } finally {
      setLoadingAction(null)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "job_application":
        return <Briefcase className="w-5 h-5 text-blue-500" />
      case "payment":
        return <DollarSign className="w-5 h-5 text-green-500" />
      case "message":
        return <Mail className="w-5 h-5 text-purple-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  useEffect(() => {
    if (!user) return
    fetchNotificationTypes()
    fetchUnreadCount()
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchNotifications()
  }, [user, selectedType, showOnlyUnread, currentPage])

  useEffect(() => {
    if (!user) return
    const iv = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(iv)
  }, [user, unreadCount])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {t("notifications.login_required")}
      </div>
    )
  }

  const hasUnread = notifications.some((n) => !n.is_read)

  return (
    <div dir={i18n.dir()} className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className={`flex items-center justify-between`}>
            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              className={`flex items-center text-gray-600 hover:text-gray-900 ${
                isRTL ? "ml-4" : "mr-4"
              }`}
            >{isRTL ? <ArrowRight className="w-5 h-5 mr-2"/> : <ArrowLeft className="w-5 h-5 mr-2" />}
              
              {t("back")}
            </button>

            {/* Title */}
            <div className="flex items-center">
              <Bell className="w-6 h-6 mr-2 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">
                {t("notifications.title")}
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
            </div>

            {/* Actions */}
            <div className={`flex items-center space-x-3 ${isRTL ? "space-x-reverse" : ""}`}>
              <button onClick={testNotificationSound} className="flex items-center px-3 py-2 bg-gray-100 rounded-lg">
                <TestTube className="w-5 h-5 mr-1" />
                {t("notifications.test_sound")}
              </button>
              <button
                onClick={() => navigate("/notification-settings")}
                className="flex items-center px-3 py-2 bg-gray-100 rounded-lg"
              >
                <Settings className="w-5 h-5 mr-1" />
                {t("settings")}
              </button>
              <button
                onClick={() => setShowFilters((f) => !f)}
                className="flex items-center px-3 py-2 bg-gray-100 rounded-lg"
              >
                <Filter className="w-5 h-5 mr-1" />
                {t("notifications.filters")}
              </button>
              {hasUnread && (
                <button
                  onClick={markAllAsRead}
                  disabled={loadingAction === "mark-all"}
                  className="flex items-center px-3 py-2 bg-gray-100 rounded-lg"
                >
                  <CheckCheck className="w-5 h-5 mr-1" />
                  {loadingAction === "mark-all"
                    ? t("notifications.marking_all")
                    : t("notifications.mark_all_read")}
                </button>
              )}
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 bg-white p-4 rounded-lg shadow-inner space-y-4">
                <div className="flex items-center space-x-2">
                  <label className="font-medium">{t("type")}:</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="p-2 border rounded"
                  >
                    <option value="">{t("all_types")}</option>
                    {notificationTypes.map((nt) => (
                      <option key={nt.id} value={nt.name}>
                        {t(`type_${nt.name}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="unread-only"
                    checked={showOnlyUnread}
                    onChange={() => setShowOnlyUnread((v) => !v)}
                  />
                  <label htmlFor="unread-only">{t("show_only_unread")}</label>
                </div>
                <button
                  onClick={() => {
                    setSelectedType("")
                    setShowOnlyUnread(false)
                  }}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded"
                >
                  {t("clear_filters")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-full mx-auto p-6 space-y-4">
        {loading ? (
          <div className="text-center text-gray-600">{t("notifications.loading")}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-gray-500">
            <Bell className="mx-auto mb-2 w-8 h-8" />
            <h3 className="text-lg">{t("notifications.no_notifications")}</h3>
            <p className="text-sm">
              {selectedType || showOnlyUnread
                ? t("notifications.no_filtered")
                : t("notifications.no_new")}
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`
                bg-white rounded-lg shadow-sm p-6 flex items-start space-x-4
                ${notif.is_read ? "border-l-gray-200" : "border-l-red-500 bg-red-50/30"}
                ${isRTL ? "flex-row-reverse space-x-reverse" : ""}
                ${isRTL && (notif.is_read ? "border-r-gray-200" : "border-r-red-500")}
              `}
            >
              <div className="mt-1">{getNotificationIcon(notif.type)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-semibold ${isRTL ? "text-right" : ""}`}>
                    {notif.title}
                  </h3>
                  {!notif.is_read && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                </div>
                <p className={`${isRTL ? "text-right" : ""} text-gray-600 my-2`}>
                  {notif.message}
                </p>
                <div className="flex items-center text-sm text-gray-500 space-x-2">
                  <span className="capitalize bg-gray-100 px-2 py-1 rounded text-xs">
                    {notif.type.replace("_", " ")}
                  </span>
                  <span>
                    {new Date(notif.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
              <div className={`flex items-center space-x-2 ${isRTL ? "space-x-reverse" : ""}`}>
                {!notif.is_read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    disabled={loadingAction === notif.id}
                    className="p-2 hover:bg-green-50 rounded"
                  >
                    <Check className="w-4 h-4 text-green-600" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notif.id)}
                  disabled={loadingAction === notif.id}
                  className="p-2 hover:bg-red-50 rounded"
                >
                  {loadingAction === notif.id ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="w-4 h-4 text-red-600" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}

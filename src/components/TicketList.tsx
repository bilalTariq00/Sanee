"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import config from "@/config"

interface TicketListProps {
  onViewTicket: (ticket: any) => void
  refreshTrigger: number
}

export default function TicketList({ onViewTicket, refreshTrigger }: TicketListProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === "ar"
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  useEffect(() => {
    fetchTickets()
  }, [refreshTrigger, i18n.language])

  const fetchTickets = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    const language = i18n.language.startsWith("ar") ? "ar" : "en"

    try {
      const response = await fetch(`${config.API_BASE_URL}/support-tickets`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Accept-Language": language,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTickets(data.data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
      case "عاجل":
        return "bg-red-100 text-red-800"
      case "high":
      case "عالي":
        return "bg-orange-100 text-orange-800"
      case "medium":
      case "متوسط":
        return "bg-yellow-100 text-yellow-800"
      case "low":
      case "منخفض":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open":
      case "مفتوح":
        return "bg-red-100 text-red-800"
      case "in_progress":
      case "قيد_التنفيذ":
        return "bg-orange-100 text-orange-800"
      case "closed":
      case "مغلق":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const translateStatus = (status: string) => {
    const statusTranslations: { [key: string]: string } = {
      open: t("open") || "Open",
      in_progress: t("in_progress") || "In Progress",
      closed: t("closed") || "Closed",
    }
    return statusTranslations[status] || status
  }

  const translatePriority = (priority: string) => {
    const priorityTranslations: { [key: string]: string } = {
      low: t("low") || "Low",
      medium: t("medium") || "Medium",
      high: t("high") || "High",
      urgent: t("urgent") || "Urgent",
    }
    return priorityTranslations[priority] || priority
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchStatus = statusFilter === "all" || ticket.status?.toLowerCase() === statusFilter
    const matchPriority = priorityFilter === "all" || ticket.priority?.toLowerCase() === priorityFilter
    return matchStatus && matchPriority
  })

  const summary = useMemo(() => {
    const openCount = tickets.filter((t) => t.status?.toLowerCase() === "open").length
    const inProgressCount = tickets.filter((t) => t.status?.toLowerCase() === "in_progress").length
    const closedCount = tickets.filter((t) => t.status?.toLowerCase() === "closed").length
    return { openCount, inProgressCount, closedCount }
  }, [tickets])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-red-100">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards + Filters */}
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-center shadow-sm">
            <h4 className="text-sm font-medium text-red-600">{t("open") || "Open"}</h4>
            <p className="text-2xl font-bold text-red-700">{summary.openCount}</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 text-center shadow-sm">
            <h4 className="text-sm font-medium text-orange-600">{t("in_progress") || "In Progress"}</h4>
            <p className="text-2xl font-bold text-orange-700">{summary.inProgressCount}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center shadow-sm">
            <h4 className="text-sm font-medium text-green-600">{t("closed") || "Closed"}</h4>
            <p className="text-2xl font-bold text-green-700">{summary.closedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className={`flex gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="all">{t("all_statuses") || "All Statuses"}</option>
            <option value="open">{t("open") || "Open"}</option>
            <option value="in_progress">{t("in_progress") || "In Progress"}</option>
            <option value="closed">{t("closed") || "Closed"}</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2"
          >
            <option value="all">{t("all_priorities") || "All Priorities"}</option>
            <option value="low">{t("low") || "Low"}</option>
            <option value="medium">{t("medium") || "Medium"}</option>
            <option value="high">{t("high") || "High"}</option>
            <option value="urgent">{t("urgent") || "Urgent"}</option>
          </select>
        </div>
      </div>

      {/* Ticket List */}
      {filteredTickets.length === 0 ? (
        <div className={`bg-white p-12 rounded-lg shadow-sm border border-red-100 text-center ${isRTL ? "text-right" : ""}`}>
          <div className="text-gray-400 text-6xl mb-4">🎫</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t("no_tickets_found") || "No tickets found"}</h3>
          <p className="text-gray-500">
            {t("create_first_ticket") || "Create your first support ticket to get started."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-red-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onViewTicket(ticket)}
            >
              <div className={`flex justify-between items-start mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className={isRTL ? "text-right" : ""}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{ticket.subject}</h3>
                  <p className="text-sm text-red-600 font-medium">{ticket.ticket_id}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewTicket(ticket)
                  }}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  {t("view") || "View"} →
                </button>
              </div>

              <p className={`text-gray-600 mb-4 line-clamp-2 ${isRTL ? "text-right" : ""}`}>{ticket.description}</p>

              <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {translatePriority(ticket.priority)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {translateStatus(ticket.status)}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {ticket.category?.charAt(0).toUpperCase() + ticket.category?.slice(1)}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {ticket.user && `${t("by") || "By"} ${ticket.user.first_name} ${ticket.user.last_name}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

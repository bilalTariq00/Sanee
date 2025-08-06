"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import config from "@/config"

interface TicketDetailProps {
  ticket: any
  onBack: () => void
  onTicketUpdated: () => void
}

export default function TicketDetail({ ticket: initialTicket, onBack, onTicketUpdated }: TicketDetailProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === "ar"
  const [ticket, setTicket] = useState(initialTicket)
  const [replyMessage, setReplyMessage] = useState("")
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [closingTicket, setClosingTicket] = useState(false)

  useEffect(() => {
    fetchTicketDetails()
  }, [i18n.language])

  const fetchTicketDetails = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    const language = i18n.language.startsWith("ar") ? "ar" : "en"

    try {
      const response = await fetch(`${config.API_BASE_URL}/support-tickets/${ticket.id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Accept-Language": language,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTicket(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch ticket details:", error)
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyMessage.trim() && !replyAttachment) return

    const token = localStorage.getItem("token")
    if (!token) return

    const language = i18n.language.startsWith("ar") ? "ar" : "en"
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("message", replyMessage)
      if (replyAttachment) {
        formData.append("attachment", replyAttachment)
      }

      const response = await fetch(`${config.API_BASE_URL}/support-tickets/${ticket.id}/reply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": language,
        },
        body: formData,
      })

      if (response.ok) {
        setReplyMessage("")
        setReplyAttachment(null)
        fetchTicketDetails()
        alert(t("reply_added_success") || "Reply added successfully!")
      } else {
        alert(t("reply_add_error") || "Failed to add reply. Please try again.")
      }
    } catch (error) {
      alert(t("reply_add_error") || "Failed to add reply. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseTicket = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    const language = i18n.language.startsWith("ar") ? "ar" : "en"
    setClosingTicket(true)

    try {
      const response = await fetch(`${config.API_BASE_URL}/support-tickets/${ticket.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Accept-Language": language,
        },
        body: JSON.stringify({ status: "closed" }),
      })

      if (response.ok) {
        setTicket({ ...ticket, status: "closed" })
        onTicketUpdated()
        alert(t("ticket_closed_success") || "Ticket closed successfully!")
      } else {
        alert(t("ticket_close_error") || "Failed to close ticket. Please try again.")
      }
    } catch (error) {
      alert(t("ticket_close_error") || "Failed to close ticket. Please try again.")
    } finally {
      setClosingTicket(false)
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

  const isImage = (filename: string) => /\.(jpg|jpeg|png|gif)$/i.test(filename)

  return (
    <div className={`space-y-6 ${isRTL ? "text-right" : ""}`}>
      <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
        <button onClick={onBack} className="text-red-600 hover:text-red-700 font-medium">
          {isRTL ? "→" : "←"} {t("back_to_tickets") || "Back to Tickets"}
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
        <div className={`flex justify-between items-start mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={isRTL ? "text-right" : ""}>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{ticket.subject}</h1>
            <p className="text-red-600 font-medium mb-2">{ticket.ticket_id}</p>
            <p className="text-gray-500 text-sm">
              {ticket.user && `${t("created_by") || "Created by"} ${ticket.user.first_name} ${ticket.user.last_name}`}
            </p>
          </div>
          <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
              {translatePriority(ticket.priority)}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
              {translateStatus(ticket.status)}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-2">{t("description") || "Description"}</h3>
          <p className="text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {/* Attachment Display */}
        {ticket.attachment && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">{t("attachment") || "Attachment"}</h3>
            {isImage(ticket.attachment) ? (
              <img
                src={`${config.IMG_BASE_URL}/storage/${ticket.attachment}`}
                alt="Attachment"
                className="max-w-sm rounded border"
              />
            ) : (
              <a
                href={`${config.IMG_BASE_URL}/storage/${ticket.attachment}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:underline"
              >
                {t("download_attachment") || "Download Attachment"}
              </a>
            )}
          </div>
        )}

        {ticket.status !== "closed" && ticket.status !== "مغلق" && (
          <div className={`flex justify-end ${isRTL ? "flex-row-reverse" : ""}`}>
            <button
              onClick={handleCloseTicket}
              disabled={closingTicket}
              className="border border-red-200 text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {closingTicket ? t("closing") || "Closing..." : t("close_ticket") || "Close Ticket"}
            </button>
          </div>
        )}
      </div>

      {/* Replies Section */}
      {ticket.replies && ticket.replies.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("replies") || "Replies"}</h3>
          <div className="space-y-4">
            {ticket.replies.map((reply: any, index: number) => (
              <div key={reply.id || index} className={`border-l-4 border-red-200 pl-4 ${isRTL ? "border-r-4 border-l-0 pr-4 pl-0" : ""}`}>
                <div className={`flex items-center gap-2 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <span className="font-medium text-gray-900">
                    {reply.user?.first_name} {reply.user?.last_name}
                  </span>
                  <span className="text-sm text-gray-500">{reply.created_at}</span>
                </div>
                <p className={`text-gray-600 whitespace-pre-wrap ${isRTL ? "text-right" : ""}`}>{reply.message}</p>

                {/* Reply Attachment */}
                {reply.attachment && (
                  <div className="mt-2">
                    {isImage(reply.attachment) ? (
                      <img
                        src={`${config.IMG_BASE_URL}/storage/${reply.attachment}`}
                        alt="Reply Attachment"
                        className="max-w-xs rounded border"
                      />
                    ) : (
                      <a
                        href={`${config.IMG_BASE_URL}/storage/${reply.attachment}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 hover:underline"
                      >
                        {t("download_attachment") || "Download Attachment"}
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply Form */}
      {ticket.status !== "closed" && ticket.status !== "مغلق" && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("add_reply") || "Add Reply"}</h3>
          <form onSubmit={handleReply} className="space-y-4" encType="multipart/form-data">
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              className={`w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:border-red-500 ${isRTL ? "text-right" : ""}`}
              rows={4}
              placeholder={t("type_reply") || "Type your reply here..."}
            />
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              onChange={(e) => setReplyAttachment(e.target.files?.[0] || null)}
              className="w-full"
            />
            {replyAttachment && <p className="text-sm text-gray-500">{replyAttachment.name}</p>}
            <button
              type="submit"
              disabled={loading || (!replyMessage.trim() && !replyAttachment)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? t("sending") || "Sending..." : t("send_reply") || "Send Reply"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

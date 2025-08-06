"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import config from "@/config"

export default function TicketStats() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === "ar"
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("token")
      if (!token) return

      const language = i18n.language.startsWith("ar") ? "ar" : "en"

      try {
        const response = await fetch(`${config.API_BASE_URL}/support-tickets/stats`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "Accept-Language": language,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [i18n.language])

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 ${isRTL ? "rtl" : ""}`}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-red-100">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 ${isRTL ? "rtl" : ""}`}>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100">
        <h3 className={`text-sm font-medium text-gray-500 mb-2 ${isRTL ? "text-right" : ""}`}>
          {t("total_tickets") || "Total Tickets"}
        </h3>
        <p className={`text-3xl font-bold text-red-600 ${isRTL ? "text-right" : ""}`}>{stats.total || 0}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100">
        <h3 className={`text-sm font-medium text-gray-500 mb-2 ${isRTL ? "text-right" : ""}`}>
          {t("open_tickets") || "Open"}
        </h3>
        <p className={`text-3xl font-bold text-red-500 ${isRTL ? "text-right" : ""}`}>{stats.open || 0}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100">
        <h3 className={`text-sm font-medium text-gray-500 mb-2 ${isRTL ? "text-right" : ""}`}>
          {t("in_progress_tickets") || "In Progress"}
        </h3>
        <p className={`text-3xl font-bold text-orange-500 ${isRTL ? "text-right" : ""}`}>{stats.in_progress || 0}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100">
        <h3 className={`text-sm font-medium text-gray-500 mb-2 ${isRTL ? "text-right" : ""}`}>
          {t("resolved_tickets") || "Resolved"}
        </h3>
        <p className={`text-3xl font-bold text-green-500 ${isRTL ? "text-right" : ""}`}>{stats.resolved || 0}</p>
      </div>
    </div>
  )
}

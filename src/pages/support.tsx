"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import TicketStats from "@/components/TicketStats"
import CreateTicketForm from "@/components/CreateTicketForm"
import TicketList from "@/components/TicketList"
import TicketDetail from "@/components/TicketDetail"

export default function SupportPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === "ar"
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Set RTL/LTR on <html>
  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr")
    document.documentElement.setAttribute("lang", i18n.language)
  }, [i18n.language, isRTL])

  const handleTicketCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleTicketUpdated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket)
  }

  const handleBackToList = () => {
    setSelectedTicket(null)
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? "text-right" : "text-left"}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className={`mb-8 ${isRTL ? "text-right" : ""}`}>
          <h1 className={`text-3xl font-bold mb-2 ${isRTL ? "text-red-600" : "text-red-600"}`}>
            {t("support_center") || "Support Center"}
          </h1>
          <p className="text-gray-600">
            {t("support_center_description") || "Get help with your account, billing, and technical issues."}
          </p>
        </div>

        {selectedTicket ? (
          <TicketDetail ticket={selectedTicket} onBack={handleBackToList} onTicketUpdated={handleTicketUpdated} />
        ) : (
          <div className="space-y-8">
            <TicketStats />

            <div className={`flex flex-col justify-between items-center ${isRTL ? "" : ""}`}>
              <h2 className="text-2xl font-semibold text-gray-900">{t("your_tickets") || "Your Tickets"}</h2>
              <CreateTicketForm onTicketCreated={handleTicketCreated} />
            </div>

            <TicketList onViewTicket={handleViewTicket} refreshTrigger={refreshTrigger} />
          </div>
        )}
      </div>
    </div>
  )
}

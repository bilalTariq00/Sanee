"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import config from "@/config"
import { useAuth } from "@/contexts/AuthContext"

interface CreateTicketFormProps {
  onTicketCreated: () => void
}

export default function CreateTicketForm({ onTicketCreated }: CreateTicketFormProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === "ar"
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([])
  const [priorities, setPriorities] = useState<{ value: string; label: string }[]>([])
  const [attachment, setAttachment] = useState<File | null>(null)
  const { user } = useAuth() 

  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "",
    category: "",
  })

  useEffect(() => {
    if (isOpen) {
      fetchOptions()
    }
  }, [isOpen, i18n.language])

  const fetchOptions = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    const language = i18n.language.startsWith("ar") ? "ar" : "en"

    try {
      const [categoriesRes, prioritiesRes] = await Promise.all([
        fetch(`${config.API_BASE_URL}/support-tickets/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Accept-Language": language,
          },
        }),
        fetch(`${config.API_BASE_URL}/support-tickets/priorities`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Accept-Language": language,
          },
        }),
      ])

      if (categoriesRes.ok && prioritiesRes.ok) {
        const categoriesData = await categoriesRes.json()
        const prioritiesData = await prioritiesRes.json()

        const categoriesArray = Object.entries(categoriesData.data).map(([value, label]) => ({
          value,
          label,
        }))
        const prioritiesArray = Object.entries(prioritiesData.data).map(([value, label]) => ({
          value,
          label,
        }))

        setCategories(categoriesArray)
        setPriorities(prioritiesArray)
      }
    } catch (error) {
      console.error("Failed to fetch options:", error)
      const language = i18n.language.startsWith("ar") ? "ar" : "en"
      if (language === "ar") {
        setCategories([{ value: "billing", label: "الفواتير" }, { value: "technical", label: "تقني" }, { value: "general", label: "عام" }])
        setPriorities([{ value: "low", label: "منخفض" }, { value: "medium", label: "متوسط" }, { value: "high", label: "عالي" }, { value: "urgent", label: "عاجل" }])
      } else {
        setCategories([{ value: "billing", label: "Billing" }, { value: "technical", label: "Technical" }, { value: "general", label: "General" }])
        setPriorities([{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }])
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token) return

    const language = i18n.language.startsWith("ar") ? "ar" : "en"
    setLoading(true)

    try {
      const data = new FormData()
      data.append("subject", formData.subject)
      data.append("description", formData.description)
      data.append("priority", formData.priority)
      data.append("category", formData.category)
     if (user?.type) {
  data.append("account_type", user.type)
}
      if (attachment) data.append("attachment", attachment)

      const response = await fetch(`${config.API_BASE_URL}/support-tickets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": language,
        },
        body: data,
      })

      if (response.ok) {
        alert(t("ticket_created_success") || "Ticket created successfully!")
        setFormData({ subject: "", description: "", priority: "", category: "" })
        setAttachment(null)
        setIsOpen(false)
        onTicketCreated()
      } else {
        alert(t("ticket_create_error") || "Failed to create ticket. Please try again.")
      }
    } catch (error) {
      alert(t("ticket_create_error") || "Failed to create ticket. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
      >
        + {t("create_new_ticket") || "Create New Ticket"}
      </button>
    )
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-red-200 mb-6 ${isRTL ? "text-right" : ""}`}>
      <h2 className="text-xl font-bold text-gray-900 mb-4">{t("create_support_ticket") || "Create Support Ticket"}</h2>
      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("subject") || "Subject"}</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className={`w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:border-red-500 ${
              isRTL ? "text-right" : ""
            }`}
            placeholder={t("brief_description") || "Brief description of your issue"}
            required
          />
        </div>

        {/* Category & Priority */}
        <div className={`grid grid-cols-2 gap-4 ${isRTL ? "rtl" : ""}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("category") || "Category"}</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={`w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:border-red-500 ${
                isRTL ? "text-right" : ""
              }`}
              required
            >
              <option value="">{t("select_category") || "Select category"}</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("priority") || "Priority"}</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className={`w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:border-red-500 ${
                isRTL ? "text-right" : ""
              }`}
              required
            >
              <option value="">{t("select_priority") || "Select priority"}</option>
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("description") || "Description"}</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={`w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:border-red-500 ${
              isRTL ? "text-right" : ""
            }`}
            rows={4}
            placeholder={t("detailed_information") || "Provide detailed information about your issue..."}
            required
          />
        </div>

        {/* Attachment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("attachment") || "Attachment"}</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
            className="w-full"
          />
          {attachment && <p className="text-sm text-gray-500 mt-1">{attachment.name}</p>}
        </div>

        {/* Buttons */}
        <div className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <button
            type="submit"
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? t("creating") || "Creating..." : t("create_ticket") || "Create Ticket"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="border border-red-200 text-red-700 hover:bg-red-50 px-6 py-2 rounded-lg font-medium"
          >
            {t("cancel") || "Cancel"}
          </button>
        </div>
      </form>
    </div>
  )
}

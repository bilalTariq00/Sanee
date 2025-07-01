"use client"

import React, { useEffect, useState } from "react"
import axios from "axios"
import config from "../config"
import Swal from "sweetalert2"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function BuyerContracts() {
  const { t } = useTranslation()

  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get(`${config.API_BASE_URL}/buyer/contracts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setContracts(res.data)
    } catch (err) {
      console.error("Error fetching contracts:", err)
      Swal.fire(t("error"), t("fetch_contracts_error"), "error")
    } finally {
      setLoading(false)
    }
  }

  const handleEndContract = async (id: number) => {
    const confirm = await Swal.fire({
      title: t("end_contract_confirm_title"),
      text: t("end_contract_confirm_text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("yes_finish"),
      confirmButtonColor: "#dc2626",
    })
    if (!confirm.isConfirmed) return

    try {
      const token = localStorage.getItem("token")
      await axios.put(`${config.API_BASE_URL}/contracts/${id}/finish`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      await Swal.fire(t("contract_finished_title"), t("leave_review_msg"), "success")
      window.location.href = `/review/${id}`
    } catch (err) {
      console.error(err)
      Swal.fire(t("error"), t("generic_error"), "error")
    }
  }

  const handleRejectContract = async (id: number) => {
    const confirm = await Swal.fire({
      title: t("reject_submission_title"),
      text: t("reject_submission_text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("yes_reject"),
      confirmButtonColor: "#dc2626",
    })
    if (!confirm.isConfirmed) return

    try {
      const token = localStorage.getItem("token")
      await axios.put(`${config.API_BASE_URL}/contracts/${id}`, { status: "in_progress" }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      Swal.fire(t("rejected_title"), t("contract_back_progress"), "info")
      fetchContracts()
    } catch (err) {
      console.error(err)
      Swal.fire(t("error"), t("reject_contract_error"), "error")
    }
  }

  const renderBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-red-100 text-red-600 border border-red-200">{t("pending")}</Badge>
      case "in_progress":
        return <Badge className="bg-white text-red-700 border border-red-400">{t("in_progress")}</Badge>
      case "completed":
      case "finished":
        return <Badge className="bg-green-100 text-green-700 border border-green-200">{t("completed")}</Badge>
      case "cancelled":
        return <Badge className="bg-red-200 text-red-800 border border-red-300">{t("cancelled")}</Badge>
      default:
        return <Badge className="bg-gray-200 text-gray-700">{t("unknown")}</Badge>
    }
  }

  useEffect(() => {
    fetchContracts()
  }, [])

  if (loading) return <p className="text-center py-10 text-gray-500">{t("loading_contracts")}</p>

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-semibold mb-4 text-red-700">{t("my_contracts")}</h2>

      {contracts.length === 0 ? (
        <p className="text-gray-500">{t("no_contracts")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {contracts.map((c: any) => (
            <Card key={c.id} className="bg-white border border-red-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-red-700">{c.gig?.title || t("untitled_gig")}</CardTitle>
                <p className="text-sm text-gray-500">{t("seller")}: {c.seller?.first_name} {c.seller?.last_name}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-700">
                <p><strong>{t("price")}:</strong> ${c.price}</p>
                <div><strong>{t("status")}:</strong> {renderBadge(c.status)}</div>
                <p><strong>{t("start")}:</strong> {c.started_at ? new Date(c.started_at).toLocaleDateString() : "-"}</p>
                <p><strong>{t("end")}:</strong> {c.completed_at ? new Date(c.completed_at).toLocaleDateString() : "-"}</p>
                <div>
                  <strong>{t("payment")}:</strong>{" "}
                  {c.payment?.status === "confirmed" && (
                    <Badge className="bg-green-100 text-green-700 border border-green-200">{t("paid")}</Badge>
                  )}
                  {c.payment?.status === "pending" && (
                    <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300">{t("pending")}</Badge>
                  )}
                  {c.payment?.status === "rejected" && (
                    <Badge className="bg-red-100 text-red-700 border border-red-200">{t("rejected")}</Badge>
                  )}
                  {!c.payment && (
                    <Badge className="bg-gray-100 text-gray-500 border border-gray-300">{t("no_payment")}</Badge>
                  )}
                </div>

                {c.status === "completed" && c.seller_note && (
                  <div className="bg-red-50 p-3 rounded space-y-2 border border-red-100">
                    <p className="font-medium text-red-700">📩 {t("seller_submission")}</p>
                    <p><strong>{t("note")}:</strong> {c.seller_note}</p>

                    {c.seller_attachments?.length > 0 && (
                      <div>
                        <strong>{t("attachments")}:</strong>
                        <ul className="list-disc pl-5">
                          {c.seller_attachments.map((file: string, idx: number) => (
                            <li key={idx}>
                              <a
                                href={`${config.IMG_BASE_URL}/storage/${file}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 underline"
                              >
                                {t("download_file", { index: idx + 1 })}
                              </a>
                            </li>
                          ))}
                        </ul>
                        <a
                          href={`${config.API_BASE_URL}/contracts/${c.id}/download-attachments`}
                          className="text-sm underline text-blue-500"
                        >
                          {t("download_all_zip")}
                        </a>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => handleEndContract(c.id)}>
                        ✅ {t("end_contract")}
                      </Button>
                      <Button className="border border-red-600 text-red-600 hover:bg-red-100" onClick={() => handleRejectContract(c.id)}>
                        ❌ {t("reject_work")}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default BuyerContracts

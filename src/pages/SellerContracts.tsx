"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import config from "../config"
import Swal from "sweetalert2"
import SubmitWorkModal from "@/components/SubmitWorkModal"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"

export default function SellerContracts() {
  const { t } = useTranslation()

  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null)

  // pull reviewed IDs out of localStorage so “Review” only shows once
  const storedReviewed = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("reviewedContracts") || "[]")
    : []
  const [reviewedContracts, setReviewedContracts] = useState<number[]>(storedReviewed)

  // mark a contract as “reviewed”
  const markReviewed = (id: number) => {
    const next = Array.from(new Set([...reviewedContracts, id]))
    localStorage.setItem("reviewedContracts", JSON.stringify(next))
    setReviewedContracts(next)
  }

  const openSubmitModal = (id: number) => {
    setSelectedContractId(id)
    setShowSubmitModal(true)
  }

  // fetch and tag each row with reviewed flag
  const fetchContracts = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get(`${config.API_BASE_URL}/seller/contracts`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // the API returns { data: [ ... ] }
      const rows = res.data.data as any[]

      const cleaned = rows.map((c) => ({
        ...c,
        reviewed: reviewedContracts.includes(c.id),
        // clear attachments if just in_progress
        ...(c.status === "in_progress" && { seller_note: "", seller_attachments: [] }),
      }))

      setContracts(cleaned)
    } catch (err) {
      console.error("Error fetching contracts", err)
    } finally {
      setLoading(false)
    }
  }

  // generic status update (start / complete)
  const handleAction = async (id: number, newStatus: "in_progress" | "completed" | "cancelled") => {
    const labels: Record<string, string> = {
      in_progress: "start this contract",
      completed: "mark as completed",
      cancelled: "cancel this contract",
    }

    const result = await Swal.fire({
      title: t("seller_contracts.confirm_title"),
      text: `You are about to ${labels[newStatus]}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("seller_contracts.yes_do_it"),
      cancelButtonText: t("seller_contracts.no_cancel"),
      confirmButtonColor: "#dc2626",
    })
    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem("token")
      const payload: any = { status: newStatus }
      if (newStatus === "in_progress") {
        payload.started_at = new Date().toISOString().slice(0, 19).replace("T", " ")
      }
      if (newStatus === "completed") {
        payload.completed_at = new Date().toISOString().slice(0, 19).replace("T", " ")
      }

      await axios.put(`${config.API_BASE_URL}/contracts/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      Swal.fire({
        title: t("seller_contracts.success_title"),
        text: t(`seller_contracts.${newStatus}_success`),
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      })

      fetchContracts()
    } catch (err) {
      console.error("Error updating contract", err)
      Swal.fire(t("seller_contracts.error"), t("seller_contracts.try_again"), "error")
    }
  }

  // reject endpoint
  const handleReject = async (id: number) => {
    const result = await Swal.fire({
      title: t("seller_contracts.reject_confirm_title"),
      text: t("seller_contracts.reject_confirm_text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("seller_contracts.yes_reject"),
      cancelButtonText: t("seller_contracts.no_cancel"),
      confirmButtonColor: "#dc2626",
    })
    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem("token")
      await axios.post(
        `${config.API_BASE_URL}/contracts/${id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      Swal.fire({
        title: t("seller_contracts.reject_success_title"),
        text: t("seller_contracts.reject_success_text"),
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      })

      fetchContracts()
    } catch (err) {
      console.error("Error rejecting contract", err)
      Swal.fire(t("seller_contracts.error"), t("seller_contracts.try_again"), "error")
    }
  }

  // review flow
  const handleReview = (id: number) => {
    markReviewed(id)
    window.location.href = `/review/${id}`
  }

  useEffect(() => {
    fetchContracts()
    return () => {
      fetchContracts()
    }
  }, [reviewedContracts])

  const renderBadge = (status: string, hasSubmission = false) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-red-100 text-red-600">Pending</Badge>
      case "in_progress":
        if (hasSubmission) {
          return <Badge className="bg-blue-100 text-blue-700">Work Submitted</Badge>
        }
        return <Badge className="bg-white text-red-700">In Progress</Badge>
      case "completed":
      case "finished":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-red-200 text-red-800">Cancelled</Badge>
      case "rejected":
        return <Badge className="bg-gray-200 text-gray-700">Rejected</Badge>
      default:
        return <Badge className="bg-gray-200 text-gray-700">Unknown</Badge>
    }
  }

  return (
    <>
      <h2 className="text-2xl font-semibold mb-4 text-red-700">
        {t("seller_contracts.title")}
      </h2>
      <Card className="border-none shadow-none pt-4">
        <CardContent>
          {loading ? (
            <p className="text-gray-500">{t("seller_contracts.loading")}</p>
          ) : contracts.length === 0 ? (
            <p className="text-gray-500">{t("seller_contracts.no_contracts")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {contracts.map((c) => {
                const hasWorkSubmission =
                  Boolean(c.seller_note) || c.seller_attachments?.length > 0

                return (
                  <Card key={c.id} className="bg-white border border-red-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold text-red-700">
                        {c.gig?.title || t("seller_contracts.untitled_gig")}
                      </CardTitle>
                      <div className="text-sm text-gray-500">
                        {t("seller_contracts.buyer")}: {c.buyer?.first_name}{" "}
                        {c.buyer?.last_name}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-2 text-sm text-gray-700">
                      <div>
                         <span className="font-medium  flex items-center"><strong>{t("seller_contracts.price")}:</strong> <img src='/riyal.svg' className="h-3 w-3 mr-1" />{c.price}</span>
                      </div>
                      <div>
                        <strong>{t("seller_contracts.status")}:</strong>{" "}
                        {renderBadge(c.status, hasWorkSubmission)}
                      </div>
                      <div>
                        <strong>{t("seller_contracts.start")}:</strong>{" "}
                        {c.started_at
                          ? new Date(c.started_at).toLocaleDateString()
                          : "-"}
                      </div>
                      <div>
                        <strong>{t("seller_contracts.end")}:</strong>{" "}
                        {c.completed_at
                          ? new Date(c.completed_at).toLocaleDateString()
                          : "-"}
                      </div>

                      {/* BUTTONS */}
                     <div className="pt-2 space-x-2">
  {/* 1) pending → show Start + Reject */}
  {c.status === "pending" && (
    <>
      <Button
        size="sm"
        className="bg-red-600 hover:bg-red-700 text-white"
        onClick={() => handleAction(c.id, "in_progress")}
      >
        {t("seller_contracts.start_button")}
      </Button>
      <Button
        size="sm"
        className="bg-gray-600 hover:bg-gray-700 text-white"
        onClick={() => handleReject(c.id)}
      >
        {t("seller_contracts.reject_button")}
      </Button>
    </>
  )}

  {/* 2) in_progress & no submission yet → show Submit Work */}
  {c.status === "in_progress" && !hasWorkSubmission && (
    <Button
      size="sm"
      className="bg-blue-600 hover:bg-blue-700 text-white"
      onClick={() => openSubmitModal(c.id)}
    >
      {t("seller_contracts.submit_work")}
    </Button>
  )}

  {/* 3) completed/finished & not reviewed → show Review Buyer */}
  {( c.status === "finished") && !c.reviewed && (
    <Button
      size="sm"
      className="bg-red-500 hover:bg-red-600 text-white"
      onClick={() => handleReview(c.id)}
    >
      {t("seller_contracts.review_buyer")}
    </Button>
  )}
</div>

                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>

        <SubmitWorkModal
          show={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          contractId={selectedContractId!}
          onSubmitted={fetchContracts}
        />
      </Card>
    </>
  )
}
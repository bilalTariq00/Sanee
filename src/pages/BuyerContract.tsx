"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import config from "../config"
import Swal from "sweetalert2"
import SubmitWorkModal from "@/components/SubmitWorkModal"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslation } from "react-i18next"


export default function ContractsPage() {
  const { user } = useAuth()
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingContract, setEditingContract] = useState<any>(null)
  const { t } = useTranslation()


  // ─── 1) Load reviewed IDs from localStorage ─────────────────────────
  const [reviewedContracts, setReviewedContracts] = useState<number[]>(() => {
    if (typeof window === "undefined") return []
    return JSON.parse(localStorage.getItem("reviewedContracts") || "[]")
  })

  const markReviewed = (id: number) => {
    const next = Array.from(new Set([...reviewedContracts, id]))
    localStorage.setItem("reviewedContracts", JSON.stringify(next))
    setReviewedContracts(next)
  }

  // ─── 2) Fetch buyer contracts, tag reviewed ────────────────────────
  const fetchContracts = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get(`${config.API_BASE_URL}/buyer/contracts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const raw: any[] =
        Array.isArray(res.data)      ? res.data :
        Array.isArray(res.data.data) ? res.data.data :
                                       []

      const cleaned = raw
        // strip in_progress submissions
        .map((c: any) => c.status === "in_progress"
          ? { ...c, seller_note: "", seller_attachments: [] }
          : c
        )
        // add `reviewed` flag
        .map((c: any) => ({
          ...c,
          reviewed: reviewedContracts.includes(c.id),
        }))

      // dedupe by id
      const deduped = Array.from(new Map(cleaned.map(c => [c.id, c])).values())
      setContracts(deduped)
    } catch (err) {
      console.error(err)
     Swal.fire(t("buyer_contracts.error"), t("buyer_contracts.could_not_load"), "error")

    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.account_type === "buyer") {
      fetchContracts()
    }
  }, [user, reviewedContracts])

  // // ─── 3) Render helper ──────────────────────────────────────────────
  // const renderBadge = (status: string, hasSubmission = false) => {
  //   switch (status) {
  //     case "pending":      return <Badge className="bg-red-100 text-red-600">Pending</Badge>
  //     case "in_progress":  return hasSubmission
  //                               ? <Badge className="bg-blue-100 text-blue-700">Work Submitted</Badge>
  //                               : <Badge className="bg-white text-red-700 border border-red-400">In Progress</Badge>
  //     case "completed":
  //     case "finished":     return <Badge className="bg-green-100 text-green-700">Finished</Badge>
  //     case "rejected":     return <Badge className="bg-gray-200 text-gray-700">Rejected</Badge>
  //     case "cancelled":    return <Badge className="bg-red-200 text-red-800">Cancelled</Badge>
  //     default:             return <Badge>Unknown</Badge>
  //   }
  // }

  // ─── 4) Review button handler ──────────────────────────────────────
  const handleReview = (id: number) => {
    markReviewed(id)
    window.location.href = `/review/${id}`
  }

  // ─── 5) Existing contract actions (view submission / end / reject) ─
  const openSubmitModal = (c: any) => {
    setEditingContract(c)
    setShowModal(true)
  }

  const onSubmitted = () => {
    setShowModal(false)
    fetchContracts()
  }

  const handleViewSubmission = (c: any) => {
    let html = ""
    if (c.seller_note) html += `<p><strong>Note:</strong> ${c.seller_note}</p>`

    const files: string[] = Array.isArray(c.seller_attachments)
      ? c.seller_attachments
      : c.seller_attachments
      ? [c.seller_attachments]
      : []

    if (files.length) {
      html +=
        "<p><strong>Attachments:</strong></p><div style='display:flex;flex-wrap:wrap;gap:8px'>"
      files.forEach((file, idx) => {
        const url = `${config.IMG_BASE_URL}/storage/${file}`
        const isImage = /\.(jpe?g|png|gif|webp)$/i.test(file)
        html += isImage
          ? `<div style="border:1px solid #ddd;padding:4px;">
               <img src="${url}" style="max-width:120px;max-height:120px;" />
               <div><a href="${url}" target="_blank">View full</a></div>
             </div>`
          : `<div><a href="${url}" target="_blank">Download File ${idx + 1}</a></div>`
      })
      html += "</div>"
    }

    if (!html) html = "<p>No submission details available.</p>"

    Swal.fire({
      title: "Work Submission Details",
      html,
      width: 700,
      showCloseButton: true,
      focusConfirm: false,
      confirmButtonText: "Close",
    })
  }

  const handleEndContract = async (id: number) => {
    const confirm = await Swal.fire({
      title: t("buyer_contracts.end_confirm_title"),
      text: t("buyer_contracts.end_confirm_text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("buyer_contracts.yes_finish"),
      confirmButtonColor: "#dc2626",
    })
    if (!confirm.isConfirmed) return

    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `${config.API_BASE_URL}/contracts/${id}/finish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      await Swal.fire(
        t("buyer_contracts.finished_title"),
       t("buyer_contracts.leave_review"),
        "success"
      )
    } catch (err) {
      console.error(err)
      Swal.fire("Error", "Could not finish the contract.", "error")
    }
  }

  const handleRejectContract = async (id: number) => {
    const { isConfirmed } = await Swal.fire({
      title: t("buyer_contracts.reject_confirm_title"),
      text: t("buyer_contracts.reject_confirm_text"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText:t("buyer_contracts.yes_reject"),
      confirmButtonColor: "#dc2626",
    })
    if (!isConfirmed) return

    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `${config.API_BASE_URL}/contracts/${id}`,
        {
          status: "in_progress",
          seller_note: "",
          seller_attachments: [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // optimistic UI update
      setContracts((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, status: "in_progress", seller_note: "", seller_attachments: [] }
            : c
        )
      )
      await Swal.fire(t("buyer_contracts.rejected"),t("buyer_contracts.reset_to_progress"), "info")
    } catch (err) {
      console.error(err)
      Swal.fire("Error",t("buyer_contracts.could_not_reject"), "error")
    }
  }

  const renderBadge = (status: string, hasSubmission = false) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-red-100 text-red-600">Pending</Badge>
        )
      case "in_progress":
        return hasSubmission ? (
          <Badge className="bg-blue-100 text-blue-700">Work Submitted</Badge>
        ) : (
          <Badge className="bg-white text-red-700 border border-red-400">
            In Progress
          </Badge>
        )
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700">Completed</Badge>
        )
      case "finished":
        return (
          <Badge className="bg-green-100 text-green-700">Finished</Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-gray-200 text-gray-700">Rejected</Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-red-200 text-red-800">Cancelled</Badge>
        )
      default:
        return <Badge>Unknown</Badge>
    }
  }

  if (loading) {
    return <p className="text-center py-10 text-gray-500">{t("buyer_contracts.loading")}</p>

  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-semibold mb-4 text-red-700">{t("buyer_contracts.title")}</h2>

      {contracts.length === 0 ? (
        <p className="text-gray-500">{t("buyer_contracts.no_contracts")}</p>

      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {contracts.map((c) => {
            const hasSubmission = Boolean(c.seller_note) || (c.seller_attachments?.length > 0)
            return (
              <Card key={c.id} className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-red-700">
                    {c.gig?.title || t("buyer_contracts.untitled_gig")}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    {t("buyer_contracts.buyer")}: {user?.first_name} {user?.last_name}
                  </p>
                </CardHeader>

                <CardContent className="space-y-2 text-sm text-gray-700">
                   <span className="font-medium  flex items-center"><strong>{t("buyer_contracts.price")}</strong> <img src='/riyal.svg' className="h-3 w-3 mr-1" />{c.price}</span>
                  <div><strong>{t("buyer_contracts.status")}:</strong> {renderBadge(c.status, hasSubmission)}</div>
                  <p>
                    <strong>{t("buyer_contracts.start")}:</strong>{" "}
                    {c.started_at ? new Date(c.started_at).toLocaleDateString() : "-"}
                  </p>
                  <p>
                    <strong>{t("buyer_contracts.end")}:</strong>{" "}
                    {c.completed_at ? new Date(c.completed_at).toLocaleDateString() : "-"}
                  </p>

                  {/* existing actions */}
                 {hasSubmission && c.status !== "finished" && (
    <>
      <Button onClick={() => handleViewSubmission(c)} className="mt-2 block">
         {t("buyer_contracts.view_submission")}
      </Button>
      <Button onClick={() => handleEndContract(c.id)} className="mt-2 bg-green-600 text-white">
        {t("buyer_contracts.accept_end")}
      </Button>
      <Button
        onClick={() => handleRejectContract(c.id)}
        variant="outline"
        className="mt-2 border-red-600 text-red-600"
      >
        {t("buyer_contracts.reject_work")}
      </Button>
    </>
  )}

                  {/* ─── 7) NEW: Review Seller when finished ─────────────────────────── */}
                  {(c.status === "finished" ) && !c.reviewed && (
                    <Button
                      className="mt-4 bg-red-500 text-white hover:bg-red-600"
                      onClick={() => handleReview(c.id)}
                    >
                      {t("buyer_contracts.review_seller")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {editingContract && (
        <SubmitWorkModal
          show={showModal}
          onClose={() => setShowModal(false)}
          contractId={editingContract.id}
          onSubmitted={onSubmitted}
        />
      )}
    </div>
  )
}

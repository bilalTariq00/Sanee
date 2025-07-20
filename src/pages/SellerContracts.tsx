// src/pages/SellerContracts.tsx
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
import { useAuth } from "@/contexts/AuthContext"

export default function SellerContracts() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [selectedContract, setSelectedContract] = useState<any>(null)

  // Fetch seller contracts
  const fetchContracts = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get(`${config.API_BASE_URL}/seller/contracts`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const rows: any[] =
        Array.isArray(res.data) ? res.data : Array.isArray(res.data.data)
          ? res.data.data
          : []

      // Clear any in_progress submissions
     const cleaned = rows.map(c =>
  c.status === "in_progress"
    ? { ...c, seller_note: "", seller_attachments: [] }
    : c
)

      setContracts(cleaned)
    } catch (err) {
      console.error("Error fetching contracts", err)
      Swal.fire(t("seller_contracts.error"), t("seller_contracts.try_again"), "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.account_type === "seller") {
      fetchContracts()
    }
  }, [user])

  const openSubmitModal = (contract: any) => {
    setSelectedContract(contract)
    setShowSubmitModal(true)
  }

  const onSubmitted = () => {
    setShowSubmitModal(false)
    fetchContracts()
  }

  const renderBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-red-100 text-red-600">Pending</Badge>
      case "in_progress":
        return <Badge className="bg-white text-red-700 border border-red-400">In Progress</Badge>
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

  if (loading) {
    return <p className="text-center py-10 text-gray-500">{t("seller_contracts.loading")}</p>
  }

  return (
    <>
      <h2 className="text-2xl font-semibold mb-4 text-red-700">
        {t("seller_contracts.title")}
      </h2>

      {contracts.length === 0 ? (
        <p className="text-gray-500">{t("seller_contracts.no_contracts")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {contracts.map((c) => (
            <Card key={c.id} className="bg-white border border-red-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-red-700">
                  {c.gig?.title || t("seller_contracts.untitled_gig")}
                </CardTitle>
                <div className="text-sm text-gray-500">
                  {t("seller_contracts.buyer")}: {c.buyer?.first_name} {c.buyer?.last_name}
                </div>
              </CardHeader>

              <CardContent className="space-y-2 text-sm text-gray-700">
                <div>
                  <strong>{t("seller_contracts.price")}:</strong> ${c.price}
                </div>
                <div>
                  <strong>{t("seller_contracts.status")}:</strong> {renderBadge(c.status)}
                </div>
                <div>
                  <strong>{t("seller_contracts.start")}:</strong>{" "}
                  {c.started_at ? new Date(c.started_at).toLocaleDateString() : "-"}
                </div>
                <div>
                  <strong>{t("seller_contracts.end")}:</strong>{" "}
                  {c.completed_at ? new Date(c.completed_at).toLocaleDateString() : "-"}
                </div>

                {/* Only Submit Work for in_progress */}
                {c.status === "in_progress" && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white mt-2"
                    onClick={() => openSubmitModal(c)}
                  >
                    {t("seller_contracts.submit_work")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedContract && (
        <SubmitWorkModal
          show={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          contractId={selectedContract.id}
          onSubmitted={onSubmitted}
        />
      )}
    </>
  )
}

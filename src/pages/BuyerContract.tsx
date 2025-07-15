"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import config from "../config"
import Swal from "sweetalert2"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import SubmitWorkModal from "@/components/SubmitWorkModal"
import { useAuth } from "@/contexts/AuthContext"

export default function ContractsPage() {
  const { user } = useAuth()
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingContract, setEditingContract] = useState<any>(null)

  // Fetch either buyer or seller contracts
  const fetchContracts = async () => {
  try {
    const token = localStorage.getItem("token");
    const url =
      user?.account_type === "seller"
        ? `${config.API_BASE_URL}/seller/contracts`
        : `${config.API_BASE_URL}/buyer/contracts`;

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const rawList: any[] =
  Array.isArray(res.data)       // seller endpoint: [ {...}, {...} ]
    ? res.data
    : Array.isArray(res.data.data) // buyer endpoint: { data: [ ... ] }
      ? res.data.data
      : []

    // >>> POST-PROCESS: strip submissions for any in_progress item
    const cleaned: any[] = rawList.map((c: any) => {
      if (c.status === "in_progress") {
        return {
          ...c,
          seller_note: "",
          seller_attachments: [],
        };
      }
      return c;
    });

    setContracts(cleaned);
  } catch (err) {
    console.error("Error fetching contracts:", err);
    Swal.fire("Error", "There was a problem fetching your contracts.", "error");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    if (user) fetchContracts()
  }, [user])

  const openSubmitModal = (contract: any) => {
    setEditingContract(contract)
    setShowModal(true)
  }

  const onSubmitted = () => {
    setShowModal(false)
    fetchContracts() // Refresh contracts after submission
  }

  const handleEndContract = async (id: number) => {
    const confirm = await Swal.fire({
      title: "End Contract?",
      text: "Release funds and finish this contract?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, finish",
      confirmButtonColor: "#dc2626",
    })

    if (!confirm.isConfirmed) return

    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `${config.API_BASE_URL}/contracts/${id}/finish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      await Swal.fire("Contract Finished!", "Please leave a review for the seller.", "success")
      window.location.href = `/review/${id}`
    } catch (err) {
      console.error(err)
      Swal.fire("Error", "Something went wrong!", "error")
    }
  }
// Show seller’s submission in a Swal modal
const handleViewSubmission = (c: any) => {
  let html = "";

  if (c.seller_note) {
    html += `<p><strong>Note:</strong> ${c.seller_note}</p>`;
  }

  const files: string[] = Array.isArray(c.seller_attachments)
    ? c.seller_attachments
    : c.seller_attachments
    ? [c.seller_attachments]
    : [];

  if (files.length) {
    html += "<p><strong>Attachments:</strong></p><div style='display:flex;flex-wrap:wrap;gap:8px'>";
    files.forEach((file, i) => {
      const url = `${config.IMG_BASE_URL}/storage/${file}`;
      const isImage = /\.(jpe?g|png|gif|webp)$/i.test(file);
      if (isImage) {
        html += `<div style="border:1px solid #ddd;padding:4px;">
                   <img src="${url}" style="max-width:120px;max-height:120px;" />
                   <div><a href="${url}" target="_blank">View full</a></div>
                 </div>`;
      } else {
        html += `<div><a href="${url}" target="_blank">Download File ${i + 1}</a></div>`;
      }
    });
    html += "</div>";
  }

  if (!html) {
    html = "<p>No submission details available.</p>";
  }

  Swal.fire({
    title: "Work Submission Details",
    html,
    width: 700,
    showCloseButton: true,
    focusConfirm: false,
    confirmButtonText: "Close",
  });
};


  const handleRejectContract = async (id: number) => {
  const { isConfirmed } = await Swal.fire({
    title: "Reject Submission?",
    text: "Are you sure? Seller will be notified.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, reject it",
    confirmButtonColor: "#dc2626",
  });
  if (!isConfirmed) return;

  try {
    const token = localStorage.getItem("token");
    await axios.put(
      `${config.API_BASE_URL}/contracts/${id}`,
      {
        status: "in_progress",
        seller_note: "",            // clear on your end
        seller_attachments: [],     // clear on your end
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // OPTIMISTIC UPDATE — clear locally without refetch
    setContracts((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: "in_progress", seller_note: "", seller_attachments: [] }
          : c
      )
    );

    await Swal.fire("Rejected", "Contract is now back in progress.", "info");
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Could not reject contract.", "error");
  }
};


  const renderBadge = (status: string, hasSubmission = false) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-red-100 text-red-600 border border-red-200">Pending</Badge>
      case "in_progress":
        if (hasSubmission) {
          return <Badge className="bg-blue-100 text-blue-700 border border-blue-200">Work Submitted</Badge>
        }
        return <Badge className="bg-white text-red-700 border border-red-400">In Progress</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-700 border border-green-200">Completed</Badge>
      case "finished":
        return <Badge className="bg-green-100 text-green-700 border border-green-200">Finished</Badge>
         case "rejected":
       return <Badge className="bg-gray-200 text-gray-700 border border-gray-300">Rejected</Badge>
      case "cancelled":
        return <Badge className="bg-red-200 text-red-800 border border-red-300">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-200 text-gray-700">Unknown</Badge>
    }
  }

  if (loading) {
    return <p className="text-center py-10 text-gray-500">Loading contracts...</p>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-semibold mb-4 text-red-700">
        {user?.account_type === "seller" ? "My Selling Contracts" : "My Contracts"}
      </h2>

      {contracts.length === 0 ? (
        <p className="text-gray-500">No contracts found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {contracts.map((c) => {
            const hasWorkSubmission = c.seller_note || (c.seller_attachments && c.seller_attachments.length > 0)

            return (
              <Card key={c.id} className="bg-white border border-red-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-red-700">{c.gig?.title || "Untitled Gig"}</CardTitle>
                 <p className="text-sm text-gray-500">
                      {user?.account_type === "seller"
                        ? `Buyer: ${c.buyer.first_name} ${c.buyer.last_name}`
                        : `Seller ID: ${c.seller_id /* or use c.gig.user_id until you have the full object */}`}
                    </p>
                </CardHeader>

                <CardContent className="space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>Price:</strong> ${c.price}
                  </p>
                  <div>
                    <strong>Status:</strong> {renderBadge(c.status, hasWorkSubmission)}
                  </div>
                  <p>
                    <strong>Start:</strong> {c.started_at ? new Date(c.started_at).toLocaleDateString() : "-"}
                  </p>
                  <p>
                    <strong>End:</strong> {c.completed_at ? new Date(c.completed_at).toLocaleDateString() : "-"}
                  </p>

                  {/* Seller: In-progress → show Submit Work button */}
                  {user?.account_type === "seller" && c.status === "in_progress" && !hasWorkSubmission && (
                    <Button
                      className="mt-2 bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => openSubmitModal(c)}
                    >
                      Submit Work
                    </Button>
                  )}

                  {/* Show if work has been submitted */}
                  {user?.account_type === "seller" && c.status === "in_progress" && hasWorkSubmission && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="font-medium text-blue-700">✅ Work Submitted - Awaiting buyer review</p>
                    </div>
                  )}

                  {/* Buyer or Seller: once work is submitted */}
                 { hasWorkSubmission  && c.status !== "rejected" && c.status !== "finished"&&(
                    <div className="bg-red-50 p-3 rounded border border-red-100 space-y-2">
                      <p className="font-medium text-red-700">📩 Work Submission</p>

                      {c.seller_note && (
                        <p>
                          <strong>Note:</strong> {c.seller_note}
                        </p>
                      )}

                      {c.seller_attachments?.length > 0 && (
                        <div>
                          <strong>Attachments:</strong>
                          <ul className="list-disc pl-5">
                            {c.seller_attachments.map((file: string, idx: number) => (
                              <li key={idx}>
                                <a
                                  href={`${config.IMG_BASE_URL}/storage/${file}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 underline"
                                >
                                  Download File {idx + 1}
                                </a>
                              </li>
                            ))}
                          </ul>
                          <a
                            href={`${config.API_BASE_URL}/contracts/${c.id}/download-attachments`}
                            className="text-sm underline text-blue-500"
                          >
                            Download All as ZIP
                          </a>
                        </div>
                      )}

                      {/* Buyer: End or Reject buttons */}
                    {/* Buyer: View Submission → then End or Reject */}
{user?.account_type === "buyer" && (
  <div className="space-y-2 pt-2">
    <Button
      className="bg-blue-600 text-white hover:bg-blue-700"
      onClick={() => handleViewSubmission(c)}
    >
      👀 View Submission
    </Button>
    <div className="flex gap-2">
      <Button
        className="bg-green-600 text-white hover:bg-green-700"
        onClick={() => handleEndContract(c.id)}
      >
        ✅ Accept & End Contract
      </Button>
      <Button
        variant="outline"
        className="border-red-600 text-red-600 hover:bg-red-100 bg-transparent"
        onClick={() => handleRejectContract(c.id)}
      >
        ❌ Reject Work
      </Button>
    </div>
  </div>
)}

                    </div>
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

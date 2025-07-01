"use client";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";
import JobPaymentModal from "@/components/JobPaymentModal";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

function JobProposals() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
const { t } = useTranslation();

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/buyer/jobs/${id}/proposals`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setProposals(res.data);
    } catch (err) {
      console.error("Failed to fetch proposals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (proposalId) => {
    try {
      const confirm = await Swal.fire({
        title: "Reject Proposal?",
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, reject",
      });
      if (!confirm.isConfirmed) return;

      await axios.post(
        `${config.API_BASE_URL}/buyer/proposals/${proposalId}/status`,
        { status: "rejected" },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      Swal.fire("Success", `Proposal rejected`, "success");
      fetchProposals();
    } catch (err) {
      console.error("Failed to reject", err);
      Swal.fire("Error", "Could not reject proposal", "error");
    }
  };

  const handlePaymentStart = (gig, message = "", proposal) => {
    setSelectedGig(gig);
    setPaymentMessage(message);
    setSelectedProposal(proposal); // used later in redirect
    setShowPaymentModal(true);
  };

  const handleCheckoutRedirect = async ({ gig_uid, message }) => {
    setShowPaymentModal(false);

    // Accept proposal upon payment initiation
    try {
      await axios.post(
        `${config.API_BASE_URL}/buyer/proposals/${selectedProposal.id}/status`,
        { status: "accepted" },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
    } catch (err) {
      console.error("Error auto-accepting proposal after payment:", err);
    }

    navigate(`/checkout/${gig_uid}`, {
      state: {
        message,
        job_id: selectedProposal?.job_id,
        job_title: selectedProposal?.job?.title,
        price: selectedProposal?.price,
      },
    });
  };
if (loading)
  return <p className="text-center mt-6">{t("proposals.loading")}</p>;

return (
  <div className="max-w-6xl mx-auto px-4 py-6 bg-white text-red-800">
    <h2 className="text-3xl font-bold mb-6 border-b-2 border-red-600 pb-2 text-center">
      🧾 {t("proposals.title", { id })}
    </h2>

    {proposals.length === 0 ? (
      <div className="text-center py-6 text-gray-500">
        {t("proposals.none")}
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {proposals.map((proposal) => (
          <Card key={proposal.id} className="border-red-600 shadow-md hover:shadow-lg">
            <CardHeader className="bg-red-600 text-white rounded-t px-4 py-2">
              <CardTitle>
                {`${proposal.seller?.first_name || ""} ${proposal.seller?.last_name || ""}`.trim() || t("proposals.seller")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm p-4">
              <p><strong>{t("proposals.gig")}:</strong> {proposal.gig?.title}</p>
              <p><strong>{t("proposals.price")}:</strong> ${proposal.price}</p>
              <p><strong>{t("proposals.after_commission")}:</strong> ${(proposal.price * 0.9).toFixed(2)}</p>
              <p><strong>{t("proposals.duration")}:</strong> {proposal.duration}</p>
              <p><strong>{t("proposals.deadline")}:</strong> {proposal.deadline}</p>
              <p>
                <strong>{t("proposals.status")}:</strong>{" "}
                <span className={`font-semibold ${
                  proposal.status === "pending"
                    ? "text-yellow-600"
                    : proposal.status === "accepted"
                    ? "text-green-600"
                    : "text-red-600"
                }`}>
                  {t(`proposals.status_${proposal.status}`)}
                </span>
              </p>
              <p>
                <strong>{t("proposals.cover")}:</strong>{" "}
                {proposal.cover_letter.length > 80
                  ? proposal.cover_letter.slice(0, 80) + "..."
                  : proposal.cover_letter}
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  variant="outline"
                  className="border-red-600 text-red-600"
                  onClick={() => {
                    setSelectedProposal(proposal);
                    setOpenDialog(true);
                  }}
                >
                  {t("proposals.view")}
                </Button>

                {proposal.status === "pending" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(proposal.id)}
                    >
                      {t("proposals.reject")}
                    </Button>
                    <Button
                      variant="default"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() =>
                        handlePaymentStart(proposal.gig, proposal.cover_letter, proposal)
                      }
                    >
                      💰 {t("proposals.make_payment")}
                    </Button>
                  </>
                )}

                {proposal.status === "accepted" && (
                  <Button disabled className="opacity-70">
                    📃 {t("proposals.contract_started")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )}

    {selectedProposal && (
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl bg-white text-red-800 border-red-600">
          <DialogHeader>
            <DialogTitle>{t("proposals.full_details")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p><strong>{t("proposals.seller")}:</strong> {`${selectedProposal.seller?.first_name || ''} ${selectedProposal.seller?.last_name || ''}`}</p>
            <p><strong>{t("proposals.gig")}:</strong> {selectedProposal.gig?.title}</p>
            <p><strong>{t("proposals.price")}:</strong> ${selectedProposal.price}</p>
            <p><strong>{t("proposals.after_commission")}:</strong> ${(selectedProposal.price * 0.9).toFixed(2)}</p>
            <p><strong>{t("proposals.duration")}:</strong> {selectedProposal.duration}</p>
            <p><strong>{t("proposals.deadline")}:</strong> {selectedProposal.deadline}</p>
            <p><strong>{t("proposals.status")}:</strong> {t(`proposals.status_${selectedProposal.status}`)}</p>
            <p><strong>{t("proposals.cover_letter")}:</strong></p>
            <div className="border p-3 bg-red-100 rounded text-red-900">
              {selectedProposal.cover_letter}
            </div>
            {selectedProposal.attachments?.length > 0 && (
              <div>
                <strong>{t("proposals.attachments")}:</strong>
                <ul className="list-disc pl-5">
                  {selectedProposal.attachments.map((file, idx) => (
                    <li key={idx}>
                      <a
                        href={`${config.IMG_BASE_URL}/storage/${file}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        {t("proposals.download_file", { index: idx + 1 })}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() =>
                handlePaymentStart(selectedProposal.gig, selectedProposal.cover_letter, selectedProposal)
              }
            >
              💰 {t("proposals.make_payment")}
            </Button>
            <Button onClick={() => setOpenDialog(false)}>{t("proposals.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}

    {showPaymentModal && selectedGig && (
      <JobPaymentModal
        gig={selectedGig}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handleCheckoutRedirect}
        defaultMessage={paymentMessage}
        defaultPrice={selectedProposal?.price}
      />
    )}
  </div>
);

}
export default JobProposals;

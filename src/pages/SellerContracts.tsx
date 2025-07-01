"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";
import SubmitWorkModal from "@/components/SubmitWorkModal";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

function SellerContracts() {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedContractId, setSelectedContractId] = useState(null);
const { t } = useTranslation();

    const openSubmitModal = (id) => {
        setSelectedContractId(id);
        setShowSubmitModal(true);
    };

    const fetchContracts = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${config.API_BASE_URL}/seller/contracts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setContracts(res.data);
            console.log("Fetched contracts:", res.data);
        } catch (err) {
            console.error("Error fetching contracts", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        const actionMessages = {
            in_progress: "start this contract",
            completed: "mark this contract as completed",
            cancelled: "cancel this contract"
        };

        const confirm = await Swal.fire({
            title: "Are you sure?",
            text: `You are about to ${actionMessages[status]}.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, do it!",
            cancelButtonText: "No",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#ccc"
        });

        if (!confirm.isConfirmed) return;

        try {
            const token = localStorage.getItem("token");
            const now = new Date().toISOString().slice(0, 19).replace("T", " ");

            const payload = {
                status,
                ...(status === "in_progress" && { started_at: now }),
                ...(status === "completed" && { completed_at: now })
            };

            await axios.put(`${config.API_BASE_URL}/contracts/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire({
                title: "Success!",
                text: `Contract ${status.replace("_", " ")} successfully.`,
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });

            fetchContracts();
        } catch (err) {
            console.error("Error updating contract", err);
            Swal.fire("Error", "Something went wrong!", "error");
        }
    };

    useEffect(() => {
        fetchContracts();
    }, []);

    const renderBadge = (status) => {
        switch (status) {
            case "pending":
                return <Badge className="bg-red-100 text-red-600 border border-red-200">Pending</Badge>;
            case "in_progress":
                return <Badge className="bg-white text-red-700 border border-red-400">In Progress</Badge>;
            case "completed":
            case "finished":
                return <Badge className="bg-green-100 text-green-700 border border-green-200">Completed</Badge>;
            case "cancelled":
                return <Badge className="bg-red-200 text-red-800 border border-red-300">Cancelled</Badge>;
            default:
                return <Badge className="bg-gray-200 text-gray-700">Unknown</Badge>;
        }
    };

    return (
  <>
    <h2 className="text-2xl font-semibold mb-4 text-red-700">{t("seller_contracts.title")}</h2>
    <Card className="border-none shadow-none pt-4">
      <CardContent>
        {loading ? (
          <p className="text-gray-500">{t("seller_contracts.loading")}</p>
        ) : contracts.length === 0 ? (
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
                  <div><strong>{t("seller_contracts.price")}:</strong> ${c.price}</div>
                  <div><strong>{t("seller_contracts.status")}:</strong> {renderBadge(c.status)}</div>
                  <div><strong>{t("seller_contracts.start")}:</strong> {c.started_at ? new Date(c.started_at).toLocaleDateString() : "-"}</div>
                  <div><strong>{t("seller_contracts.end")}:</strong> {c.completed_at ? new Date(c.completed_at).toLocaleDateString() : "-"}</div>
                  <div>
                    <strong>{t("seller_contracts.payment")}:</strong>{" "}
                    {c.payment?.status === 'confirmed' && (
                      <Badge className="bg-green-100 text-green-700 border border-green-200">{t("seller_contracts.paid")}</Badge>
                    )}
                    {c.payment?.status === 'pending' && (
                      <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300">{t("seller_contracts.pending")}</Badge>
                    )}
                    {c.payment?.status === 'rejected' && (
                      <Badge className="bg-red-100 text-red-700 border border-red-200">{t("seller_contracts.rejected")}</Badge>
                    )}
                    {!c.payment && <Badge className="bg-gray-100 text-gray-500 border border-gray-300">{t("seller_contracts.no_payment")}</Badge>}
                  </div>

                  <div className="pt-2 space-y-2">
                    {c.status === "pending" && (
                      <>
                        {c.payment?.status === "pending" && (
                          <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300">{t("seller_contracts.waiting_payment")}</Badge>
                        )}
                        {c.payment?.status === "rejected" && (
                          <Badge className="bg-red-200 text-red-800 border border-red-300">{t("seller_contracts.client_failed")}</Badge>
                        )}
                        {!c.payment || c.payment?.status === "confirmed" ? (
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => handleAction(c.id, "in_progress")}
                          >
                            {t("seller_contracts.start_button")}
                          </Button>
                        ) : null}
                      </>
                    )}

                    {c.status === "in_progress" && (
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => openSubmitModal(c.id)}
                      >
                        {t("seller_contracts.submit_work")}
                      </Button>
                    )}

                    {(c.status === "completed" || c.status === "finished") && !c.reviewed_by_seller && (
                      <Button
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => window.location.href = `/review/${c.seller_id}`}
                      >
                        {t("seller_contracts.review_buyer")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <SubmitWorkModal
        show={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        contractId={selectedContractId}
        onSubmitted={fetchContracts}
      />
    </Card>
  </>
);

}

export default SellerContracts;
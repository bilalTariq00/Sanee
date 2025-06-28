"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";
import SubmitWorkModal from "@/components/SubmitWorkModal";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function SellerContracts() {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedContractId, setSelectedContractId] = useState(null);

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
        <h2 className="text-2xl font-semibold mb-4 text-red-700">My Contracts</h2>
        <Card className="border-none shadow-none pt-4">
            <CardContent>
                {loading ? (
                    <p className="text-gray-500">Loading contracts...</p>
                ) : contracts.length === 0 ? (
                    <p className="text-gray-500">No contracts found.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {contracts.map((c) => (
                            <Card key={c.id} className="bg-white border border-red-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold text-red-700">
                                        {c.gig?.title || "Untitled Gig"}
                                    </CardTitle>
                                    <div className="text-sm text-gray-500">
                                        Buyer: {c.buyer?.first_name} {c.buyer?.last_name}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm text-gray-700">
                                    <div><strong>Price:</strong> ${c.price}</div>
                                    <div><strong>Status:</strong> {renderBadge(c.status)}</div>
                                    <div><strong>Start:</strong> {c.started_at ? new Date(c.started_at).toLocaleDateString() : "-"}</div>
                                    <div><strong>End:</strong> {c.completed_at ? new Date(c.completed_at).toLocaleDateString() : "-"}</div>
                                    <div>
                                        <strong>Payment:</strong>{" "}
                                        {c.payment?.status === 'confirmed' && (
                                            <Badge className="bg-green-100 text-green-700 border border-green-200">Paid</Badge>
                                        )}
                                        {c.payment?.status === 'pending' && (
                                            <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300">Pending</Badge>
                                        )}
                                        {c.payment?.status === 'rejected' && (
                                            <Badge className="bg-red-100 text-red-700 border border-red-200">Rejected</Badge>
                                        )}
                                        {!c.payment && <Badge className="bg-gray-100 text-gray-500 border border-gray-300">No Payment</Badge>}
                                    </div>
                                    <div className="pt-2 space-y-2">
                                        {c.status === "pending" && (
                                            <>
                                                {c.payment?.status === "pending" && (
                                                    <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300">Waiting for payment</Badge>
                                                )}
                                                {c.payment?.status === "rejected" && (
                                                    <Badge className="bg-red-200 text-red-800 border border-red-300">Client failed to pay</Badge>
                                                )}
                                                {!c.payment || c.payment?.status === "confirmed" ? (
                                                    <Button
                                                        size="sm"
                                                        className="bg-red-600 hover:bg-red-700 text-white"
                                                        onClick={() => handleAction(c.id, "in_progress")}
                                                    >
                                                        Start
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
                                                Submit Work
                                            </Button>
                                        )}
                                        {(c.status === "completed" || c.status === "finished") && !c.reviewed_by_seller && (
                                            <Button
                                                size="sm"
                                                className="bg-red-500 hover:bg-red-600 text-white"
                                                onClick={() => window.location.href = `/review/${c.seller_id}`}
                                            >
                                                Review Buyer
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
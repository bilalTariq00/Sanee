"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function BuyerContracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${config.API_BASE_URL}/buyer/contracts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContracts(res.data);
    } catch (err) {
      console.error("Error fetching contracts:", err);
      Swal.fire("Error", "There was a problem fetching your contracts.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (contract) => {
    setEditingContract(contract);
    setShowModal(true);
  };

  const handleEndContract = async (id) => {
    const confirm = await Swal.fire({
      title: "End Contract?",
      text: "Are you sure you want to release funds and finish this contract?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, finish",
      confirmButtonColor: "#dc2626", // red
    });
    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(`${config.API_BASE_URL}/contracts/${id}/finish`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await Swal.fire("Contract Finished!", "Please leave a review for the seller.", "success");
      window.location.href = `/review/${id}`;
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Something went wrong!", "error");
    }
  };

  const handleRejectContract = async (id) => {
    const confirm = await Swal.fire({
      title: "Reject Submission?",
      text: "Are you sure? Seller will be notified.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, reject it",
      confirmButtonColor: "#dc2626",
    });
    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(`${config.API_BASE_URL}/contracts/${id}`, { status: "in_progress" }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire("Rejected", "Contract is now back in progress.", "info");
      fetchContracts();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Could not reject contract.", "error");
    }
  };

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

  useEffect(() => {
    fetchContracts();
  }, []);

  if (loading) return <p className="text-center py-10 text-gray-500">Loading contracts...</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-semibold mb-4 text-red-700">My Contracts</h2>

      {contracts.length === 0 ? (
        <p className="text-gray-500">No contracts found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {contracts.map((c) => (
            <Card key={c.id} className="bg-white border border-red-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-red-700">{c.gig?.title || "Untitled Gig"}</CardTitle>
                <p className="text-sm text-gray-500">Seller: {c.seller?.first_name} {c.seller?.last_name}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-700">
                <p><strong>Price:</strong> ${c.price}</p>
                <div><strong>Status:</strong> {renderBadge(c.status)}</div>
                <p><strong>Start:</strong> {c.started_at ? new Date(c.started_at).toLocaleDateString() : "-"}</p>
                <p><strong>End:</strong> {c.completed_at ? new Date(c.completed_at).toLocaleDateString() : "-"}</p>
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
                {c.status === "completed" && c.seller_note && (
                  <div className="bg-red-50 p-3 rounded space-y-2 border border-red-100">
                    <p className="font-medium text-red-700">📩 Seller Submission</p>
                    <p><strong>Note:</strong> {c.seller_note}</p>

                    {c.seller_attachments?.length > 0 && (
                      <div>
                        <strong>Attachments:</strong>
                        <ul className="list-disc pl-5">
                          {c.seller_attachments.map((file, idx) => (
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

                    <div className="flex gap-2 pt-2">
                      <Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => handleEndContract(c.id)}>
                        ✅ End Contract
                      </Button>
                      <Button className="border border-red-600 text-red-600 hover:bg-red-100" onClick={() => handleRejectContract(c.id)}>
                        ❌ Reject Work
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
  );
}

export default BuyerContracts;

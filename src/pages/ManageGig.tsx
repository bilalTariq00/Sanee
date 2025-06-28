import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import config from "../config";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function ManageGigs() {
  const [gigs, setGigs] = useState([]);

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${config.API_BASE_URL}/seller/gigs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setGigs(res.data);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (window.confirm("Are you sure you want to delete this gig?")) {
      await axios.delete(`${config.API_BASE_URL}/seller/gigs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGigs((prev) => prev.filter((gig) => gig.id !== id));
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 bg-white min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-red-600">Manage Your Gigs</h1>
        <Link to="/create-gig">
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            + Create New Gig
          </Button>
        </Link>
      </div>

      <Separator className="mb-6 bg-red-200" />

      {gigs.length === 0 ? (
        <p className="text-gray-500 text-center">
          No gigs found. Create your first gig now!
        </p>
      ) : (
        <div className="space-y-4">
          {gigs.map((gig) => (
            <Card
              key={gig.id}
              className="bg-white border border-red-200 hover:shadow-lg transition-shadow"
            >
              <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-red-700">
                    {gig.title}
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    Status: {gig.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/edit-gig/${gig.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-600 hover:bg-red-50"
                    >
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => handleDelete(gig.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Gig ID: {gig.id}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

export default ManageGigs;

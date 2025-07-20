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
import { useTranslation } from "react-i18next";

function ManageGigs() {
  const [gigs, setGigs] = useState<any[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${config.API_BASE_URL}/seller/gigs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // make sure the API returns an `available_for_hire` boolean
    setGigs(res.data);
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("token");
    if (window.confirm(t("manage_gigs.confirm_delete"))) {
      await axios.delete(`${config.API_BASE_URL}/seller/gigs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGigs((prev) => prev.filter((gig) => gig.id !== id));
    }
  };

  const handleToggleAvailability = async (gigId: number) => {
    const token = localStorage.getItem("token");
    // toggle endpoint – adjust if you want to use PUT instead
   const res= await axios.post(
      `${config.API_BASE_URL}/seller/gig-availability/${gigId}/toggle`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
     const nowAvailable = res.data.data.is_available_for_hire;
    // reflect change locally
    setGigs((prev) =>
      prev.map((g) =>
        g.id === gigId
          ? { ...g, available_for_hire: nowAvailable }
          : g
      )
    );
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 bg-white min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-red-600">
          {t("manage_gigs.title")}
        </h1>
        <Link to="/create-gig">
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            {t("manage_gigs.create_button")}
          </Button>
        </Link>
      </div>

      <Separator className="mb-6 bg-red-200" />

      {gigs.length === 0 ? (
        <p className="text-gray-500 text-center">
          {t("manage_gigs.no_gigs")}
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
                    {t("manage_gigs.status")}: {gig.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Availability Toggle */}
                 <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleAvailability(gig.id)}
                    className={
                      gig.available_for_hire
                        ? "border-green-500 text-green-600 hover:bg-green-50"
                        : "border-gray-400 text-gray-600 hover:bg-gray-100"
                    }
                  >
                    {gig.available_for_hire
                      ? t("manage_gigs.available")
                      : t("manage_gigs.unavailable")}
                  </Button>

                  {/* Edit */}
                  <Link to={`/edit-gig/${gig.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-600 hover:bg-red-50"
                    >
                      {t("manage_gigs.edit")}
                    </Button>
                  </Link>

                  {/* Delete */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => handleDelete(gig.id)}
                  >
                    {t("manage_gigs.delete")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  {t("manage_gigs.gig_id")}: {gig.id}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

export default ManageGigs;

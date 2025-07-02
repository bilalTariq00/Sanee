import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import config from "../config";
import { User } from "lucide-react";

export default function AllGigs() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [gigs, setGigs] = useState([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllGigs();
  }, []);

  const fetchAllGigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${config.API_BASE_URL}/all-gigs`);
      setGigs(res.data);
    } catch (err) {
      console.error("Error fetching gigs:", err);
      setError(t("error_generic") || "Failed to load gigs. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive p-8">
        <p>{error}</p>
        <Button variant="outline" onClick={fetchAllGigs} className="mt-4">
          {t("retry") || "Retry"}
        </Button>
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-7xl mx-auto ${isRTL ? "text-right" : "text-left"}`}>
      {/* Header and View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">{t("all_gigs")}</h2>
        <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
            className="bg-red-500 text-white hover:bg-red-600 focus:bg-red-800 hover:text-white"
          >
            {t("list_view") || "List View"}
          </Button>
          <Button
            variant={view === "grid" ? "default" : "outline"}
            onClick={() => setView("grid")}
            className="text-white bg-red-500 focus:bg-red-800 hover:bg-red-600 hover:text-white"
          >
            {t("grid_view") || "Grid View"}
          </Button>
        </div>
      </div>

      {/* Views */}
      {view === "list" ? (


        <div className="space-y-4">
          {gigs.map((gig) => {
            const imageUrl = gig.images?.[0]?.image_path
              ? `${config.IMG_BASE_URL}/storage/${gig.images[0].image_path}`
              : "https://via.placeholder.com/400x200";

            return (
              <Card key={gig.gig_uid} className="flex justify-between items-center px-4 py-3">
                <div className="flex items-center gap-4">
                  <img src={imageUrl} alt={gig.title} className="w-20 h-20 object-cover rounded-md" />
                  <div>
                    <h3 className="font-semibold">{gig.title}</h3>
                    <p className="text-sm text-muted-foreground">{gig.category?.name}</p>
                    <Badge className="mt-1 bg-red-500 flex"> <img src='/riyal-dark.svg' className="h-3 w-3 mr-1" />{gig.price}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/profile/${gig.user?.uid}`}>
                    <Button variant="outline" size="sm" className="bg-red-500 text-white">
                      <User className="mr-2" /> {t("view_profile")}
                    </Button>
                  </Link>
                  <Link to={`/gig/${gig.gig_uid}`}>
                    <Button size="sm" className="bg-red-500 text-white">
                      {t("view_details")}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gigs.map((gig) => {
            const imageUrl = gig.images?.[0]?.image_path
              ? `${config.IMG_BASE_URL}/storage/${gig.images[0].image_path}`
              : "https://via.placeholder.com/400x200";

            return (
              <Card key={gig.gig_uid} className="overflow-hidden">
                <img src={imageUrl} alt={gig.title} className="w-full h-[200px] object-cover" />
                <CardHeader>
                  <CardTitle>{gig.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{gig.category?.name}</p>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge className="bg-red-500"><img src='/riyal-dark.svg' className="h-3 w-3 mr-1" />{gig.price}</Badge>
                  <div className="flex gap-2">
                    <Link to={`/profile/${gig.user?.uid}`}>
                      <Button variant="outline" size="sm" className="bg-red-500 text-white">
                        <User className="mr-2" /> {t("view_profile")}
                      </Button>
                    </Link>
                    <Link to={`/gig/${gig.gig_uid}`}>
                      <Button size="sm" className="bg-red-500 text-white">
                        {t("view_details")}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

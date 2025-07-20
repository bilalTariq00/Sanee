import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import config from "../config";
import { toast } from "sonner";

interface Gig {
  gig_uid: string;
  title: string;
  price: number;
  category?: { name: string };
  images?: Array<{ image_path: string }>;
  user?: { uid: string };
}

interface SavedRecord {
  id: number;
  gig_id: string;
}

interface AllGigsProps {
  searchQuery: string;
}

export default function AllGigs({ searchQuery }: AllGigsProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [gigs, setGigs] = useState<Gig[]>([]);
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>([]);
  const [savedLookup, setSavedLookup] = useState<Record<string, number>>({});
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all gigs
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get<Gig[]>(`${config.API_BASE_URL}/all-gigs`);
        setGigs(res.data);
        setFilteredGigs(res.data);
      } catch (err) {
        console.error(err);
        setError(t("error_generic") || "Failed to load gigs.");
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  // Fetch saved gigs once
  useEffect(() => {
  const token = localStorage.getItem("token");
  axios
    .get<SavedRecord[]>(`${config.API_BASE_URL}/saved-gigs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => {
      const lookup: Record<string, number> = {};
      res.data.forEach(r => { lookup[r.gig_id] = r.id });
      setSavedLookup(lookup);
    })
    .catch(console.error);
}, []);


  // Filter on searchQuery
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    setFilteredGigs(
      q
        ? gigs.filter(g =>
            g.title.toLowerCase().includes(q) ||
            g.category?.name.toLowerCase().includes(q)
          )
        : gigs
    );
  }, [searchQuery, gigs]);

  // Toggle save/unsave
 // 1. Update the toggle handler:
const handleToggleSave = async (gigId: number) => {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.post<{
      success: boolean;
      message: string;
      data: {
        is_saved: boolean;
        action: "saved" | "unsaved";
        saved_gig: { id: number; notes: string | null; saved_at: string };
      };
    }>(
      `${config.API_BASE_URL}/saved-gigs/toggle`,
      { gig_id: gigId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success("" + res.data.message);
    const { is_saved, saved_gig } = res.data.data;
    setSavedLookup(prev => {
      const next = { ...prev };
      const key = String(gigId);
      if (is_saved) next[key] = saved_gig.id;
      else delete next[key];
      return next;
    });
  } catch (err: any) {
    console.error("Toggle failed:", err.response?.data || err);
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
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t("retry") || "Retry"}
        </Button>
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-7xl mx-auto ${isRTL ? "text-right" : "text-left"}`}>
      {/* Header & toggles */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">{t("all_gigs")}</h2>
        <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
            className="bg-red-500 text-white"
          >
            {t("list_view") || "List View"}
          </Button>
          <Button
            variant={view === "grid" ? "default" : "outline"}
            onClick={() => setView("grid")}
            className="bg-red-500 text-white"
          >
            {t("grid_view") || "Grid View"}
          </Button>
        </div>
      </div>

      {/* List view */}
      {view === "list" ? (
        <div className="space-y-4">
          {filteredGigs.map(gig => {
            const isSaved = Boolean(savedLookup[gig.gig_uid]);
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
                    <Badge className="mt-1 bg-red-500 flex">
                      <img src="/riyal-dark.svg" className="h-3 w-3 mr-1" />
                      {gig.price}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isSaved ? "outline" : "default"}
                    className={isSaved ? "border-gray-500 text-gray-700" : "bg-red-600 text-white"}
                    onClick={() => handleToggleSave(gig.gig_uid)}
                  >
                    {isSaved ? t("unsave") || "Unsave" : t("save") || "Save"}
                  </Button>
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
        /* Grid view */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGigs.map(gig => {
            const isSaved = Boolean(savedLookup[gig.gig_uid]);
            const imageUrl = gig.images?.[0]?.image_path
              ? `${config.IMG_BASE_URL}/storage/${gig.images[0].image_path}`
              : "https://via.placeholder.com/400x200";

            return (
              <Card key={gig.gig_uid} className="overflow-hidden">
                <img src={imageUrl} alt={gig.title} className="w-full h-[200px] object-cover" />
                <CardHeader>
                  <CardTitle>{gig.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{gig.category?.name}</p>
                   <p className="text-sm text-muted-foreground">{gig.subcategory?.name}</p>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex flex-col items-center gap-2">
                  <Badge className="bg-red-500">
                    <img src="/riyal-dark.svg" className="h-3 w-3 mr-1" />
                    {gig.price}
                  </Badge>
                    <Button
          size="sm"
          variant={isSaved ? "outline" : "default"}
          className={isSaved ? "border-gray-500 text-gray-700 px-8" : "bg-red-600 text-white px-8"}
          onClick={() => handleToggleSave(gig.id)}
        >
          {isSaved ? (t("unsave") || "Unsave") : (t("save") || "Save")}
        </Button>
        </div>
                  <div className="flex flex-col gap-2">
                  
                    <Link to={`/profile/${gig.user?.uid}`}>
                      <Button variant="outline" size="sm" className="bg-red-500 text-white">
                        <User className="mr-2" /> {t("view_profile")}
                      </Button>
                    </Link>
                    <Link to={`/gig/${gig.gig_uid}`}>
                      <Button size="sm" className="bg-red-500 text-white px-7">
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

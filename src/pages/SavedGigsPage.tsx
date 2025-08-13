// src/pages/SavedGigsPage.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import config from "../config";
import { useTranslation } from "react-i18next"

interface SavedGig {
  id: number;
  notes: string | null;
  saved_at: string;
  gig: {
    id: number;
    gig_uid: string;
    title: string;
    price: number;
    category?: { name: string };
    images?: { image_path: string }[];
    user?: { uid: string };
  };
}

export default function SavedGigsPage() {
  const [savedGigs, setSavedGigs] = useState<SavedGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
const { t } = useTranslation()
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get<{
  success: boolean;
  data: { saved_gigs: SavedGig[]; total_count: number };
}>(`${config.API_BASE_URL}/saved-gigs`, {
  headers: { Authorization: `Bearer ${token}` }
});
setSavedGigs(res.data.data.saved_gigs);

      } catch (err: any) {
        console.error(err);
        setError("Failed to load saved gigs.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

 if (loading) return <p className="p-6 text-center">{t("saved_gig.loading")}</p>
  if (error) return <p className="p-6 text-center text-red-600">{error}</p>;
 if (!savedGigs.length)
  return <p className="p-6 text-center">{t("saved_gig.no_saved")}</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">{t("saved_gig.title")}</h1>
      <div className="space-y-4">
        {savedGigs.map(sg => {
          const { gig, notes, saved_at, id: savedId } = sg;
         const imageUrl =
           sg.gig.images && sg.gig.images.length > 0
             ? sg.gig.images[0]
             : "https://via.placeholder.com/400x200";

          return (
            <Card key={savedId} className="flex flex-col sm:flex-row overflow-hidden">
              <img
                src={imageUrl}
                alt={gig.title}
                className="w-32 h-24 object-cover rounded-l-md"
              />
              <div className="flex-1 p-4">
                <CardHeader>
                  <CardTitle>{gig.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <Badge className="bg-red-500 flex items-center">
                      <img
                        src="/riyal-dark.svg"
                        className="h-3 w-3 mr-1"
                        alt=""
                      />
                      {gig.price}
                    </Badge>
                  <p className="text-sm text-gray-500 mt-1">
  {t("saved_gig.saved_on")}{" "}
  {new Date(saved_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}
</p>

                    {notes && (
                      <p className="text-sm italic mt-1">“{notes}”</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link to={`/gig/${gig.gig_uid}`}>
                      <Button size="sm" className="bg-red-600 text-white">
                        {t("saved_gig.view_details")}
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const token = localStorage.getItem("token");
                        await axios.delete(
                          `${config.API_BASE_URL}/saved-gigs/${savedId}`,
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        setSavedGigs(prev =>
                          prev.filter(x => x.id !== savedId)
                        );
                      }}
                    >
                     {t("saved_gig.remove")}
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// src/pages/CreatorProfilePage.tsx
import {
  ArrowLeft,
  MapPin,
  Star,
  DollarSign,
  Edit,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import config from "@/config";

interface Service {
  name: string;
  description: string;
  price: string;
  unit: string;
}

interface Review {
  id: number;
  client: { name: string; avatar: string };
  rating: number;
  comment: string;
  date: string;
  likes: number;
}

interface Gig {
  id: string;
  title: string;
  description: string;
  price: number;
  delivery_time: number;
  images: { id: string; image_path: string }[];
  category: { name: string };
}

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  location: string | null;
  bio: string | null;
  stats: {
    completedProjects: number;
    rating: number;
    responseRate: string;
  };
}

export default function CreatorProfilePage() {
  const { creatorId } = useParams<{ creatorId: string }>();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"services" | "portfolio" | "reviews">(
    "services"
  );

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  /* -------------------------------------------------- */
  /*                 DATA FETCHING                       */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (!creatorId) return;

    const token = localStorage.getItem("token");
    const auth = token ? { Authorization: `Bearer ${token}` } : {};

    async function loadProfile() {
      try {
        const res = await axios.get(`${config.API_BASE_URL}/users/${creatorId}`, {
          headers: auth,
        });
        setProfile(res.data);
      } catch (e) {
        console.error("Profile fetch failed", e);
      }
    }

    async function loadServices() {
      try {
        const res = await axios.get(
          `${config.API_BASE_URL}/users/${creatorId}/gigs`,
          { headers: auth }
        );
        setServices(res.data);
      } catch (e) {
        console.warn("No services:", e);
      }
    }

    async function loadReviews() {
      try {
        const res = await axios.get(
          `${config.API_BASE_URL}/users/${creatorId}/reviews`,
          { headers: auth }
        );
        setReviews(res.data);
      } catch (e) {
        console.warn("No reviews:", e);
      }
    }

    loadProfile();
    loadServices();
    loadReviews();
  }, [creatorId]);

  /* fetch gigs only when portfolio tab is opened */
  useEffect(() => {
    if (tab !== "portfolio" || !creatorId) return;
    const token = localStorage.getItem("token");
    const auth = token ? { Authorization: `Bearer ${token}` } : {};
    setLoading(true);
    axios
      .get(`${config.API_BASE_URL}/users/${creatorId}/gigs`, {
        headers: auth,
      })
      .then((r) => setGigs(r.data))
      .catch((e) => console.error("Gigs fetch failed", e))
      .finally(() => setLoading(false));
  }, [tab, creatorId]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading profile…
      </div>
    );
  }

  const currentUser = profile.id === localStorage.getItem("uid");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-white/90 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          {/* top section */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-24 h-24 rounded-full border-4 border-white object-cover"
              />
              <div>
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                {profile.location && (
                  <div className="flex items-center mt-2">
                    <MapPin className="h-5 w-5 mr-1" />
                    {profile.location}
                  </div>
                )}
                {profile.bio && (
                  <p className="mt-4 max-w-2xl whitespace-pre-line">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {currentUser && (
              <button
                onClick={() => navigate("/profile/edit")}
                className="bg-white text-red-500 px-6 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* stats */}
          <div className="flex items-center space-x-12 mt-8">
            <div>
              <div className="text-3xl font-bold">
                {profile.stats.completedProjects}
              </div>
              <div className="text-white/90">Projects Completed</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {profile.stats.rating.toFixed(1)}
              </div>
              <div className="text-white/90">Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {profile.stats.responseRate}
              </div>
              <div className="text-white/90">Response Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(["services", "portfolio", "reviews"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-4 px-2 font-medium relative ${
                tab === t
                  ? "text-red-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t[0].toUpperCase() + t.slice(1)}
              {tab === t && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SERVICES TAB */}
        {tab === "services" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((s, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm p-6 space-y-4"
              >
                <h3 className="text-xl font-semibold text-gray-900">
                  {s.name}
                </h3>
                <p className="text-gray-600">{s.description}</p>
                <div className="flex items-center text-gray-900">
                 <img src='src/public/riyal.svg' className="h-5 w-5 mr-1" />
                  <span className="text-xl font-semibold">{s.price}</span>
                  <span className="text-gray-500 ml-1">{s.unit}</span>
                </div>
              </div>
            ))}
            {services.length === 0 && (
              <p className="text-gray-500">No services listed.</p>
            )}
          </div>
        )}

        {/* PORTFOLIO TAB */}
        {tab === "portfolio" && (
          <>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading gigs…
              </div>
            ) : gigs.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gigs.map((g) => (
                  <div
                    key={g.id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden group"
                  >
                    <div className="relative">
                      <img
                        src={
                          g.images?.[0]?.image_path
                            ? `${config.IMG_BASE_URL}/${
                                g.images[0].image_path.startsWith("storage")
                                  ? g.images[0].image_path
                                  : `storage/${g.images[0].image_path}`
                              }`
                            : "https://placehold.co/600x400?text=No+Image"
                        }
                        alt={g.title}
                        className="w-full h-48 object-cover"
                      />
                      {currentUser && (
                        <button
                          onClick={() => navigate(`/edit-gig/${g.id}`)}
                          className="absolute top-2 right-2 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {g.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {g.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {g.category?.name}
                        </span>
                        <div className="flex items-center text-green-600">
                        <img src='src/public/riyal.svg' className="h-5 w-5 mr-1" />
                          <span className="font-semibold">{g.price}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Delivery: {g.delivery_time} days
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No gigs found.</div>
            )}
          </>
        )}

        {/* REVIEWS TAB */}
        {tab === "reviews" && (
          <div className="space-y-6">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-lg shadow-sm p-6 space-y-2"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={r.client.avatar}
                    alt={r.client.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {r.client.name}
                        </h3>
                        <div className="flex mt-1">
                          {[...Array(r.rating)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-5 h-5 text-yellow-400 fill-current"
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{r.date}</span>
                    </div>
                    <p className="mt-2 text-gray-600">{r.comment}</p>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <button className="flex items-center hover:text-red-500">
                        <Star className="w-4 h-4 mr-1" />
                        Helpful ({r.likes})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-gray-500">No reviews yet.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, MapPin, Star, Wallet } from "lucide-react"
import axios from "axios"
import config from "@/config"
import { useAuth } from "@/contexts/AuthContext"

interface Gig {
  id: string
  title: string
  description: string
  price: number
  delivery_time: number
  category?: { name: string }
}

interface Job {
  id: string
  title: string
  description: string
  budget: number
  status: string
  experience_level?: string
  location_type?: string
  visibility?: string
  skills?: string[]
  created_at?: string
}

interface Review {
  id: number
  rating: number
  comment: string
  type: string
  review_type: string
  other_user: {
    id: number
    uid: string
    first_name: string
    last_name: string
    username: string
    image: string
  }
  created_at: string
}

export default function ProfilePage() {
  /* routing / auth */
  const { uid: uidParam } = useParams<{ uid?: string }>()
  const { user: authUser } = useAuth()
  const uid = uidParam || authUser?.uid
  const navigate = useNavigate()

  /* local state */
  const [user, setUser] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const [gigs, setGigs] = useState<Gig[]>([])
  const [loadingGigs, setLoadingGigs] = useState(false)

  const [jobs, setJobs] = useState<Job[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)

  const [reviews, setReviews] = useState<Review[]>([])
  const [statss, setStats] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)

  const [activeTab, setActiveTab] = useState<"services" | "jobs" | "portfolio" | "reviews">("services")

  /* who is viewing? */
  const currentUser = !!authUser && authUser.uid?.toString() === uid?.toString()

  /* fetch profile */
  useEffect(() => {
    if (!uid) return
    ;(async () => {
      setLoadingProfile(true)
      try {
        const res = await axios.get(`${config.API_BASE_URL}/users/${uid}`)
        const u = res.data?.data
        setUser(u)
        // default tab for buyers should be 'jobs'
        if (u?.account_type === "buyer") setActiveTab("jobs")
      } catch {
        setUser(null)
      } finally {
        setLoadingProfile(false)
      }
    })()
  }, [uid])

  /* fetch gigs (seller) */
  useEffect(() => {
    if (!uid || user?.account_type !== "seller") return
    ;(async () => {
      setLoadingGigs(true)
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get(`${config.API_BASE_URL}/users/${uid}/gigs`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = res.data?.data
        setGigs(data?.gigs || [])
      } catch {
        setGigs([])
      } finally {
        setLoadingGigs(false)
      }
    })()
  }, [uid, user?.account_type])

  /* fetch jobs (buyer) */
  useEffect(() => {
    if (!uid || user?.account_type !== "buyer" || activeTab !== "jobs") return

    const fetchJobs = async () => {
      setLoadingJobs(true)
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get(`${config.API_BASE_URL}/users/${uid}/jobs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = res.data?.data
        setJobs(data?.jobs || [])
      } catch (error) {
        console.error("Failed to fetch jobs:", error)
        setJobs([])
      } finally {
        setLoadingJobs(false)
      }
    }

    fetchJobs()
  }, [uid, user?.account_type, activeTab])

  /* fetch reviews - FIXED to use review_type */
  useEffect(() => {
    if (!uid) return

    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get(`${config.API_BASE_URL}/users/${uid}/reviews`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = res.data?.data
        const allReviews = data?.reviews || []
        const stats=data?.stats || {}

        console.log("All reviews received:", allReviews)
        console.log("User account type:", user?.account_type)

        // Filter to show only reviews that the user RECEIVED (not gave)
        // This shows reviews ABOUT the user on their profile
        const receivedReviews = allReviews.filter((rv: any) => rv.review_type === "given")

        console.log("Filtered received reviews:", receivedReviews)

        setReviews(receivedReviews)
        setStats(stats)
      } catch (error) {
        console.error("Failed to fetch reviews:", error)
        setReviews([])
      }
    }

    fetchReviews()
  }, [uid, user])

  /* early exits */
  if (!uid) return <div className="min-h-screen flex items-center justify-center text-red-500">No user id provided</div>

  if (loadingProfile)
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading profile…</div>

  if (!user) return <div className="min-h-screen flex items-center justify-center text-red-500">User not found</div>

  /* derived */
  const avatar = user.image ? `${user.image}` : "https://placehold.co/256x256?text=Avatar"
  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
  const location = user.country?.name ?? "—"
  const bio = user.summary ?? user.headline ?? ""
  const stats = {
    completed: user.completed_projects ?? 0,
    rating: statss.average_rating ?? 0,
    response: user.response_rate ? `${user.response_rate}%` : "—",
  }

  /* tab labels - Updated to remove wallet tab */
  const tabOrder =
    user.account_type === "buyer"
      ? (["jobs", "portfolio", "reviews"] as const)
      : (["services", "portfolio", "reviews"] as const)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* header */}
      <div className="bg-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => navigate(-1)} className="flex items-center text-white/90 hover:text-white mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <img
                src={avatar || "/placeholder.svg"}
                alt={fullName}
                className="w-24 h-24 rounded-full border-4 border-white object-cover"
              />
              <div>
                <h1 className="text-3xl font-bold capitalize">{fullName}</h1>
                <div className="flex items-center mt-2">
                  <MapPin className="h-5 w-5 mr-1" /> {location}
                </div>
                <p className="mt-4 max-w-2xl">{bio}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Wallet Button for Sellers */}
              {currentUser && user.account_type === "seller" && (
                <button
                  onClick={() => navigate("/wallet")}
                  className="bg-white text-red-500 px-6 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  My Wallet
                </button>
              )}

              {currentUser && (
                <button
                  onClick={() => navigate("/profile/edit")}
                  className="bg-white text-red-500 px-6 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-12 mt-8">
            <div>
              <div className="text-3xl font-bold">{stats.completed}</div>
              <div className="text-white/90">Projects Completed</div>
            </div>
           <div>
  <div className="text-3xl font-bold">{Number(stats.rating).toFixed(1)}</div>
  <div className="text-white/90">Rating</div>
</div>

            <div>
  <div className="inline-block rounded-full bg-green-500 text-white text-sm font-semibold px-3 py-3">
    Available Now
  </div>
</div>

          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabOrder.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 font-medium relative ${
                  activeTab === tab ? "text-red-500" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SELLER – Services = gigs */}
        {activeTab === "services" && user.account_type === "seller" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loadingGigs ? (
              <p className="text-gray-500">Loading gigs…</p>
            ) : gigs.length > 0 ? (
              gigs.map((g) => (
                <div key={g.id} className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{g.title}</h3>
                  <p className="mt-2 text-gray-600">{g.description}</p>
                  <div className="mt-4 flex items-center">
                    <span className="text-xl font-semibold">${g.price}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{g.category?.name ?? "Uncategorized"}</div>
                  <div className="text-xs text-gray-400 mt-1">Delivery: {g.delivery_time} days</div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No gigs listed.</p>
            )}
          </div>
        )}

        {/* BUYER – Jobs */}
        {activeTab === "jobs" && user.account_type === "buyer" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loadingJobs ? (
              <p className="text-gray-500">Loading jobs…</p>
            ) : jobs.length > 0 ? (
              jobs.map((j) => (
                <div key={j.id} className="bg-white rounded-lg shadow-sm p-6 space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">{j.title}</h3>
                  <p className="text-gray-600">{j.description}</p>
                  <div className="flex items-center pt-2">
                    <span className="text-xl font-semibold">${j.budget}</span>
                  </div>
                  <div className="text-sm text-gray-500">Status: {j.status}</div>
                  {j.experience_level && (
                    <div className="text-sm text-gray-500">Experience Level: {j.experience_level}</div>
                  )}
                  {j.location_type && <div className="text-sm text-gray-500">Location: {j.location_type}</div>}
                  {j.visibility && <div className="text-sm text-gray-500">Visibility: {j.visibility}</div>}
                  {Array.isArray(j.skills) && j.skills.length > 0 && (
                    <div className="text-sm text-gray-500">
                      Skills: <span className="text-gray-700">{j.skills.join(", ")}</span>
                    </div>
                  )}
                  {j.created_at && (
                    <div className="text-xs text-gray-400">
                      Posted on: {new Date(j.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No jobs posted.</p>
            )}
          </div>
        )}

        {/* Portfolio */}
        {activeTab === "portfolio" && (
          <div>
            {user.portfolios && user.portfolios.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {user.portfolios.map((portfolio: any) => (
                  <div key={portfolio.id} className="bg-white rounded-lg shadow-sm overflow-hidden group">
                    <div className="relative">
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                        {portfolio.image?.[0] ? (
                          <img
                            src={portfolio.image}
                            alt={portfolio.title}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          "No image"
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{portfolio.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{portfolio.description}</p>
                      <div className="flex items-center justify-between">
                       {portfolio.link?.[0] && (
  <a
    href={portfolio.link}
    target="_blank"
    rel="noopener noreferrer"
    className="text-red-500 hover:text-red-600 text-sm font-medium"
  >
    View Project
  </a>
)}

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">No portfolio items.</p>
            )}
          </div>
        )}

        {/* Reviews */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Reviews</h2>
              <p className="text-gray-600">Reviews for this user</p>
            </div>

            {Array.isArray(reviews) && reviews.length > 0 ? (
              reviews.map((rv: any) => (
                <div key={rv.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start space-x-4">
                    <img
                      src={rv.other_user?.image || avatar}
                      alt={rv.other_user?.first_name || "Reviewer"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {rv.other_user?.first_name} {rv.other_user?.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">@{rv.other_user?.username}</p>
                          <div className="flex mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${i < rv.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                              />
                            ))}
                            <span className="ml-2 text-sm text-gray-600">({rv.rating}/5)</span>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {rv.created_at ? new Date(rv.created_at).toLocaleDateString() : ""}
                        </span>
                      </div>
                      {rv.comment && <p className="mt-2 text-gray-600">{rv.comment}</p>}
                      <div className="mt-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">
                        {rv.type === "seller_to_buyer" ? "Review from Buyer" : "Review from Seller"}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                <p className="text-gray-500">This user hasn't received any reviews yet.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

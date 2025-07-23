"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { User } from "@/types/User"
import axios from "axios"
import config from "@/config"

interface UserCardProps {
  user: User
  userType: "buyer" | "seller"
  authUserType?: string
  onUserClick?: (user: User) => void
}

export default function UserCard({
  user,
  onUserClick,
  userType,
  authUserType,
}: UserCardProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  // State to store the real rating and project data from the API
  const [userRating, setUserRating] = useState<number | null>(null)
  const [totalCompletedProjects, setTotalCompletedProjects] = useState<number | null>(null)
  const [loadingRating, setLoadingRating] = useState<boolean>(true)
  const [ratingError, setRatingError] = useState<string | null>(null)

  // Fetch user rating and completed projects
  useEffect(() => {
    if (!user.uid) return
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get(
          `${config.API_BASE_URL}/users/${user.uid}/jss`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        )
        const data = res.data?.data
        const rating =
          data?.jss?.breakdown?.average_rating ||
          data?.summary?.average_rating ||
          0
        const completed =
          data?.jss?.breakdown?.total_completed_projects ||
          data?.summary?.total_completed_projects ||
          0

        setUserRating(rating)
        setTotalCompletedProjects(completed)
      } catch (err) {
        console.error(err)
        setRatingError("Failed to load")
      } finally {
        setLoadingRating(false)
      }
    }
    fetchUserData()
  }, [user.uid])

  const goToProfile = () => navigate(`/profile/${user.uid}`)
  const goToChat = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/messages/${user.uid}`)
  }

  const isJob = user.badge === "Job"
  const isGig = user.badge === "Gig"

  // Show all projects/services for this user
// Show at most 3 projects/services for this user
const previewItems = isJob
    ? (user.projects || []).slice(0, 3)
    : (user.portfolios || []).slice(0, 3)


  // Helper to build full URLs
  const getImageUrl = (path: string) => {
    if (!path) return "/placeholder.svg?height=200&width=300"
    if (path.startsWith("http")) return path
    return `${config.API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
  }

  return (
    <Card
      onClick={goToProfile}
      className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 rounded-2xl bg-white flex flex-col h-full"
    >
      {/* — Header — */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar || "/placeholder.svg"}
            alt={user.name}
            className="w-14 h-14 rounded-full object-cover border border-gray-300"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src =
                "/placeholder.svg?height=100&width=100"
            }}
          />
          <div>
            <h3
              onClick={goToProfile}
              className="font-semibold text-lg text-gray-900 hover:underline"
            >
              {user.name}
            </h3>
            <p className="text-gray-600 text-sm mt-1">{user.location}</p>
            <Badge
              variant="outline"
              className={`mt-1 text-xs ${
                isJob ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"
              }`}
            >
              {isJob ? "Job Poster" : "Service Provider"}
            </Badge>
          </div>
        </div>

        {/* Rating & projects count */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-yellow-500 text-base">★</span>
            {loadingRating ? (
              <span className="font-medium text-gray-400">...</span>
            ) : ratingError ? (
              <span className="font-medium text-gray-400">N/A</span>
            ) : (
              <span className="font-medium">
                {userRating && userRating > 0
                  ? userRating.toFixed(1)
                  : "New"}
              </span>
            )}
          </div>
          <Badge className="mb-2 whitespace-nowrap bg-blue-100 text-blue-800">
            {loadingRating
              ? "..."
              : `${totalCompletedProjects || 0} ${t("projects")}`}
          </Badge>
        </div>
      </div>

      {/* — Basic Info — */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span className="flex items-center">
            <img
              src="/riyal.svg"
              className="h-5 w-5 mr-1"
              alt="Price"
            />
            {user.hourlyRate}+ &nbsp;|&nbsp; {user.experience}
          </span>
          <span>
            {user.followers} {t("followers") || "followers"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.skills.slice(0, 3).map((skill) => (
            <Badge
              key={skill}
              variant="outline"
              className="text-xs px-2 py-1 rounded-full"
            >
              {skill}
            </Badge>
          ))}
          {user.skills.length > 3 && (
            <Badge
              variant="outline"
              className="text-xs px-2 py-1 rounded-full"
            >
              +{user.skills.length - 3}
            </Badge>
          )}
        </div>
      </div>

      {/* — All Services/Projects Preview — */}
      {/* — Preview Grid — */}
      {previewItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {previewItems.map((item, idx) => (
            <div
              key={idx}
              className="cursor-pointer overflow-hidden rounded-lg border border-gray-100 hover:shadow-md transition"
              onClick={(e) => {
                e.stopPropagation()
                if (isJob) {
                  // for jobs/gigs navigate to gig page
                  navigate(`/gig/${encodeURIComponent(item.title)}`)
                } else {
                  // for portfolios open external link
                  window.open(item.link, "_blank")
                }
              }}
            >
              <img
                src={getImageUrl(item.image)}
                alt={item.title}
                className="w-full h-24 object-cover"
              />
              <div className="p-2">
                <h4 className="text-sm font-semibold line-clamp-1">
                  {item.title}
                </h4>
                {isJob && item.subcategoryName && (
                  <p className="text-xs text-gray-500">
                    {item.subcategoryName}
                  </p>
                )}
                {!isJob && item.description && (
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* — Footer Actions — */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <Button
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            onUserClick?.(user)
          }}
          className="flex-1 rounded-full"
        >
          {t("view_profile") || "View Profile"}
        </Button>

        {/* hide “Apply Now” for buyers on a Job card */}
        {!(authUserType === "buyer" && isJob) && (
          <Button
            onClick={goToChat}
            className="px-6 bg-red-500 text-white hover:bg-red-800 rounded-full"
          >
            { t("get_in_touch") || "Get in Touch"}
          </Button>
        )}
      </div>
    </Card>
  )
}

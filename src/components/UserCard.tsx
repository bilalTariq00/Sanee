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

export default function UserCard({ user, onUserClick, userType, authUserType }: UserCardProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  // State to store the real rating and project data from the API
  const [userRating, setUserRating] = useState<number | null>(null)
  const [totalCompletedProjects, setTotalCompletedProjects] = useState<number | null>(null)
  const [loadingRating, setLoadingRating] = useState<boolean>(true)
  const [ratingError, setRatingError] = useState<string | null>(null)

  // Fetch user rating and total completed projects data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${config.API_BASE_URL}/users/${user.uid}/jss`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        // Extract data from the correct path based on your API response
        const jssData = response.data?.data

        // Try both summary and jss.breakdown for rating
        const rating = jssData?.summary?.average_rating || jssData?.jss?.breakdown?.average_rating || 0

        // Try both projects_stats and summary for completed projects
        const completedProjects =
          jssData?.projects_stats?.total_completed_projects ||
          jssData?.summary?.total_completed_projects ||
          jssData?.jss?.breakdown?.total_completed_projects ||
          0

        setUserRating(rating)
        setTotalCompletedProjects(completedProjects)
      } catch (error) {
        console.error("Error fetching user rating or projects:", error)
        setRatingError("Failed to load data")
      } finally {
        setLoadingRating(false)
      }
    }

    if (user?.uid) {
      fetchUserData()
    }
  }, [user?.uid])

  const goToProfile = () => navigate(`/profile/${user.uid}`)
  const goToChat = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/messages/${user.uid}`)
  }

  // Enhanced image URL function
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "/placeholder.svg?height=200&width=300"

    // If it's already a complete URL, return as is
    if (imagePath.startsWith("http")) {
      return imagePath
    }

    // If it's a relative path, construct the full URL
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`
    return `${config.API_BASE_URL}${cleanPath}`
  }

  // Check if this is a job (buyer) or gig (seller)
  const isJob = user.badge === "Job"
  const isGig = user.badge === "Gig"

  return (
    <Card
      onClick={goToProfile}
      className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 rounded-2xl bg-white flex flex-col h-full"
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar || "/placeholder.svg"}
            alt={user.name}
            className="w-14 h-14 rounded-full object-cover border border-gray-300 shadow-sm"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=100&width=100"
            }}
          />
          <div>
            <h3 onClick={goToProfile} className="font-semibold text-lg text-gray-900 hover:underline">
              {user.name}
            </h3>
            <p className="text-gray-600 text-sm mt-1">{user.location}</p>
            {/* Show badge to indicate if it's a job or gig */}
            <Badge
              variant="outline"
              className={`mt-1 text-xs ${isJob ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}
            >
              {isJob ? "Job Poster" : "Service Provider"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-yellow-500 text-base">★</span>
            {loadingRating ? (
              <span className="font-medium text-gray-400">...</span>
            ) : ratingError ? (
              <span className="font-medium text-gray-400">N/A</span>
            ) : (
              <span className="font-medium">{userRating && userRating > 0 ? userRating.toFixed(1) : "New"}</span>
            )}
          </div>
          {/* Display total completed projects */}
          <Badge className="mb-2 whitespace-nowrap bg-blue-100 text-blue-800">
            {loadingRating ? "..." : `${totalCompletedProjects || 0} ${t("projects") || "projects"}`}
          </Badge>
        </div>
      </div>

      {/* Details Section */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          {/* Show price for both gigs and jobs */}
          <span className="flex items-center">
            <img src="/riyal.svg" className="h-5 w-5 mr-1" alt="Price" />
            {user.hourlyRate}+ &nbsp;|&nbsp; {user.experience}
          </span>
          <span>
            {user.followers} {t("followers") || "followers"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="outline" className="text-xs px-2 py-1 rounded-full">
              {skill}
            </Badge>
          ))}
          {user.skills.length > 3 && (
            <Badge variant="outline" className="text-xs px-2 py-1 rounded-full">
              +{user.skills.length - 3}
            </Badge>
          )}
        </div>
      </div>

      {/* Projects Preview - Different handling for jobs vs gigs */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {isGig ? (
          // For gigs, show actual project images
          user.projects
            .slice(0, 4)
            .map((proj, i) => (
              <div key={i} className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={proj.image || "/placeholder.svg"}
                  alt={proj.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=300"
                  }}
                />
              </div>
            ))
        ) : (
          // For jobs, show job information cards instead of images
          <>
            <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 flex flex-col items-center justify-center p-2">
              <div className="text-blue-600 text-xs font-semibold text-center">
                {user.projects[0]?.title || "Job Available"}
              </div>
              <div className="text-blue-500 text-xs mt-1">💼</div>
            </div>
            <div className="aspect-video bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 flex flex-col items-center justify-center p-2">
              <div className="text-green-600 text-xs font-semibold">Budget</div>
              <div className="text-green-500 text-xs mt-1">💰 {user.hourlyRate}+</div>
            </div>
            <div className="aspect-video bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 flex flex-col items-center justify-center p-2">
              <div className="text-purple-600 text-xs font-semibold">Experience</div>
              <div className="text-purple-500 text-xs mt-1">⭐ {user.experience}</div>
            </div>
            <div className="aspect-video bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 flex flex-col items-center justify-center p-2">
              <div className="text-orange-600 text-xs font-semibold">Location</div>
              <div className="text-orange-500 text-xs mt-1">📍 {user.location}</div>
            </div>
          </>
        )}
      </div>

      {/* Footer Action Buttons */}
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
        <Button onClick={goToChat} className="px-6 bg-red-500 text-white hover:bg-red-800 rounded-full">
          {isJob ? t("apply_now") || "Apply Now" : t("get_in_touch") || "Get in Touch"}
        </Button>
      </div>
    </Card>
  )
}

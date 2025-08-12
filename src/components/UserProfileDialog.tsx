"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { User } from "@/types/User"
import axios from "axios"
import config from "@/config"

const fallbackAvatar = "https://ui-avatars.com/api/?name=Unknown&background=ECECEC&color=555&size=128"

interface UserProfileDialogProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  gotoChat: (e: React.MouseEvent) => void
}

export default function UserProfileDialog({ user, gotoChat, isOpen, onClose }: UserProfileDialogProps) {
  const { t } = useTranslation()

  // States for handling projects and rating
  const [userRating, setUserRating] = useState<number | null>(null)
  const [totalCompletedProjects, setTotalCompletedProjects] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [ratingError, setRatingError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.uid) return

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
        console.error("Error fetching user data:", error)
        setRatingError("Failed to load rating or project data.")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user?.uid])

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

  if (!user) return null

  // Check if this is a job (buyer) or gig (seller)
  const isJob = user.badge === "Job"
  const isGig = user.badge === "Gig"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{t("profile_details")}</DialogTitle>
        </DialogHeader>

        {/* -------- Header -------- */}
        <div className="flex flex-col sm:flex-row items-start sm:space-x-6 space-y-4 sm:space-y-0">
          <img
            src={user.avatar || fallbackAvatar}
            alt={user.name}
            className="w-24 h-24 rounded-full object-cover shrink-0"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = fallbackAvatar
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2 sm:gap-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-bold text-gray-900 truncate max-w-full sm:max-w-none">{user.name ?? t("unknown")}</h2>
                {/* Show badge to indicate if it's a job or gig */}
                <Badge
                  variant="outline"
                  className={`${isJob ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-green-50 text-green-700 border-green-200"}`}
                >
                  {isJob ? "Job Poster" : "Service Provider"}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 min-w-0">
                <span className="text-yellow-500 text-xl">★</span>
                {loading ? (
                  <span className="text-xl font-semibold text-gray-400">...</span>
                ) : ratingError ? (
                  <span className="text-xl font-semibold text-gray-400">N/A</span>
                ) : (
                  <span className="text-xl font-semibold">
                    {userRating && userRating > 0 ? userRating.toFixed(1) : "New"}
                  </span>
                )}
              </div>
            </div>

            {user.location && <p className="text-gray-600 mb-2 break-words">{user.location}</p>}

            {!loading && (
              <Badge className="mb-4 bg-blue-100 text-blue-800 truncate max-w-full">
                {totalCompletedProjects || 0} {t("projects") || "projects"}
              </Badge>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 min-w-0">
              {user.hourlyRate !== undefined && (
                <span className="flex items-center">
                  <img src="/riyal.svg" className="h-4 w-4 mr-1" alt="Price" />
                  {user.hourlyRate}+ {isJob ? t("budget") || "Budget" : `/${t("hour") || "hour"}`}
                </span>
              )}
              {user.experience && <span>📊 {user.experience}</span>}
              {user.followers !== undefined && (
                <span>
                  👥 {user.followers} {t("followers")}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Add this after the user details in the header section */}
        {/* <div className="mt-4">
          <Button onClick={gotoChat} className="bg-red-500 text-white hover:bg-red-600 px-6 py-2">
            {t("get_in_touch") || "Get in Touch"}
          </Button>
        </div> */}

        {/* -------- About -------- */}
        {user.bio && (
          <section>
            <h3 className="text-lg font-semibold mb-2">{t("about")}</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{user.bio}</p>
          </section>
        )}

        {/* -------- Skills -------- */}
        {user.skills?.length ? (
          <section>
            <h3 className="text-lg font-semibold mb-3">{t("skills_expertise")}</h3>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <Badge key={skill} variant="outline" className="px-3 py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}

        {/* -------- Projects/Jobs Section -------- */}
        {user.projects?.length ? (
          <section>
            <h3 className="text-lg font-semibold mb-4">
              {isJob ? t("job_opportunities") || "Job Opportunities" : t("featured_projects") || "Featured Projects"}
            </h3>

           {isGig ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(user.portfolios || []).map((portfolio, idx) => (
                  <article key={idx} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow p-2 sm:p-4">
                     {portfolio.image && (
                        <img
                          src={getImageUrl(portfolio.image)}
                        alt={portfolio.title}
                        className="w-full h-40 object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=300"
                        }}
                      />
                    )}
                     <div className="p-4">
                   <h4 className="font-semibold mb-2">{portfolio.title}</h4>
                   {portfolio.description && (
                     <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                       {portfolio.description}
                     </p>
                   )}
                   {portfolio.link && (
                     <a
                       href={portfolio.link}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="text-blue-600 text-sm hover:underline"
                     >
                       View More
                     </a>
                   )}
                 </div>
                  </article>
                ))}
              </div>
            ) : (
              // For jobs, show job details in a different format
              <div className="space-y-4">
                {user.projects.slice(0, 1).map((project, idx) => (
                  <article key={idx} className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-xl mb-2 text-blue-900">{project.title}</h4>
                        {project.description && (
                          <p className="text-gray-700 mb-4 leading-relaxed">{project.description}</p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-sm text-gray-600">Budget</div>
                          <div className="text-lg font-bold text-green-600 flex items-center">
                            <img src="/riyal.svg" className="h-4 w-4 mr-1" alt="Price" />
                            {user.hourlyRate}+
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Job Requirements */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 w-full">
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-600">Experience Level</div>
                        <div className="text-gray-900">{user.experience}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-600">Location</div>
                        <div className="text-gray-900">{user.location}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-600">Posted by</div>
                        <div className="text-gray-900">{user.name}</div>
                      </div>
                    </div>

                    {/* Required Skills */}
                    {project.tags?.length && (
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-2">Required Skills</div>
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map((tag) => (
                            <Badge key={tag} className="bg-blue-100 text-blue-800">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {/* -------- Contact -------- */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t">
          <Button className="flex-1 w-full sm:w-auto bg-red-500 text-white hover:bg-red-600" onClick={gotoChat}>
            {t("get_in_touch") || "Get in Touch"}
          </Button>
          <Button variant="outline" className="flex-1 w-full sm:w-auto bg-transparent">
            {isJob ? t("save_job") || "Save Job" : t("follow") || "Follow"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

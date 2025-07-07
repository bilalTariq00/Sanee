"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import type { User } from "@/types/User"
import config from "@/config"
import type { DiscoverFilter } from "./useDiscover"

function buildImageUrl(path: string) {
  if (!path) return "/placeholder.svg?height=200&width=300"

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }

  const clean = path.startsWith("/storage/") ? path.replace(/^\/storage\//, "") : path.replace(/^\//, "")
  return `${config.API_BASE_URL}/storage/${clean}`
}

function isValidImageUrl(url: string): boolean {
  if (!url) return false
  if (url.includes("placeholder.svg")) return true
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return !url.endsWith("/storage")
  }
  return false
}

async function fetchGigImagesForUsers(userIds: string[]) {
  try {
    const response = await api.get("/all-gigs")
    const gigs = response.data?.data?.gigs || response.data?.gigs || []

    const userGigImages: Record<string, any[]> = {}

    for (const gig of gigs) {
      const userId = gig.user?.uid || gig.user?.id?.toString()
      if (!userId || !userIds.includes(userId)) continue

      if (!userGigImages[userId]) {
        userGigImages[userId] = []
      }

      // Process gig images
      const projectImages = []
      if (gig.images && Array.isArray(gig.images) && gig.images.length > 0) {
        for (const imageUrl of gig.images) {
          let finalImageUrl = null

          if (isValidImageUrl(imageUrl)) {
            finalImageUrl = imageUrl
          } else if (imageUrl && !imageUrl.endsWith("/storage")) {
            const builtUrl = buildImageUrl(imageUrl)
            if (isValidImageUrl(builtUrl)) {
              finalImageUrl = builtUrl
            }
          }

          if (finalImageUrl) {
            projectImages.push({
              title: `${gig.title} - Image ${projectImages.length + 1}`,
              description: gig.description,
              image: finalImageUrl,
              tags: gig.tags || [],
            })
          }
        }
      }

      // If no valid images, add placeholder
      if (projectImages.length === 0) {
        projectImages.push({
          title: gig.title,
          description: gig.description,
          image: "/placeholder.svg?height=200&width=300",
          tags: gig.tags || [],
        })
      }

      userGigImages[userId].push(...projectImages)
    }

    return userGigImages
  } catch (error) {
    console.error("Error fetching gig images:", error)
    return {}
  }
}

function normalizeApiResponse(apiData: any): { users: User[]; totalPages: number } {
  const users: User[] = []
  let totalPages = 1

  // Process gigs → sellers
  if (apiData.gigs?.data) {
    totalPages = Math.max(totalPages, apiData.gigs.last_page || 1)
    for (const gig of apiData.gigs.data) {
      const u = gig.user
      if (!u) continue

      // We'll update projects later with real gig images
      const placeholderProjects = [
        {
          title: gig.title,
          description: gig.description,
          image: "/placeholder.svg?height=200&width=300",
          tags: gig.tags || [],
        },
      ]

      users.push({
        id: u.id.toString(),
        uid: u.uid,
        name: `${u.first_name} ${u.last_name}`.trim(),
        avatar: u.image || "/placeholder.svg?height=100&width=100",
        location: u.country_id ? "Location Available" : "Remote",
        rating: 4.5,
        badge: "Gig",
        hourlyRate: Number.parseFloat(gig.price ?? "0"),
        experience: u.headline || "Professional",
        followers: 0,
        skills: [...(gig.skills || []), ...(gig.tags || [])],
        projects: placeholderProjects,
        bio: u.summary || "",
        categoryId: gig.category?.id || null,
      })
    }
  }

  // Process jobs → buyers (unchanged)
  if (apiData.jobs?.data) {
    totalPages = Math.max(totalPages, apiData.jobs.last_page || 1)
    for (const job of apiData.jobs.data) {
      const b = job.buyer || job.user
      if (!b) continue

      const jobProjects = [
        {
          title: job.title,
          description: job.description,
          image: "/placeholder.svg?height=200&width=300",
          tags: job.skills || [],
        },
      ]

      users.push({
        id: b.id.toString(),
        uid: b.uid,
        name: `${b.first_name} ${b.last_name}`.trim(),
        avatar: b.image || "/placeholder.svg?height=100&width=100",
        location: job.location_type === "remote" ? "Remote" : "On-site",
        rating: 4.0,
        badge: "Job",
        hourlyRate: Number.parseFloat(job.budget ?? "0"),
        experience: job.experience_level || "Any Level",
        followers: 0,
        skills: job.skills || [],
        projects: jobProjects,
        bio: b.summary || "",
        categoryId: job.category?.id || null,
      })
    }
  }

  return { users, totalPages }
}

export function useDiscoverWithGigImages(rawFilter: DiscoverFilter, search: string, page: number) {
  const { user: authUser } = useAuth()
  const [data, setData] = useState<User[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    let filter: DiscoverFilter = rawFilter
    if (rawFilter === "all" && authUser?.account_type) {
      filter = "all"
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const params: Record<string, any> = { page }
        if (filter.startsWith("category:")) {
          params.category = filter.split(":")[1]
        }
        if (search) {
          params.q = search
        }

        const res = await api.get("/discover", { params })
        const { users: allUsers, totalPages: pages } = normalizeApiResponse(res.data.data || res.data)

        // Get user IDs for gig sellers only
        const gigSellerIds = allUsers.filter((user) => user.badge === "Gig").map((user) => user.uid)

        // Fetch real gig images for these users
        const userGigImages = await fetchGigImagesForUsers(gigSellerIds)

        // Update users with real gig images
        const updatedUsers = allUsers.map((user) => {
          if (user.badge === "Gig" && userGigImages[user.uid]) {
            return {
              ...user,
              projects: userGigImages[user.uid],
            }
          }
          return user
        })

        // Client-side filtering
        let filtered = updatedUsers
        if (filter.startsWith("category:")) {
          const catId = Number(filter.split(":")[1])
          filtered = updatedUsers.filter((u) => u.categoryId === catId)
        } else if (filter === "seller" || filter === "sellerpeople") {
          filtered = updatedUsers.filter((u) => u.badge === "Gig")
        } else if (filter === "buyer" || filter === "buyerpeople") {
          filtered = updatedUsers.filter((u) => u.badge === "Job")
        } else if (filter === "featured") {
          filtered = updatedUsers.filter((u) => ["Gig", "Job"].includes(u.badge))
        }

        if (alive) {
          setData(filtered)
          setTotalPages(pages)
        }
      } catch (err: any) {
        if (alive) {
          setError(err?.response?.data?.message || err?.message || "Failed to load discover data.")
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    fetchData()
    return () => {
      alive = false
    }
  }, [rawFilter, search, page, authUser?.account_type])

  return { users: data, totalPages, loading, error }
}

"use client"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import type { User } from "@/types/User"
import config from "@/config"

export type DiscoverFilter =
  | "all"
  | "seller"
  | "buyer"
  | "sellerpeople"
  | "buyerpeople"
  | "featured"
  | `category:${string}`

function buildImageUrl(path: string) {
  if (!path) return "/placeholder.svg?height=100&width=100"

  // If it's already a complete URL, return as is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }

  // Clean the path and build complete URL
  const clean = path.startsWith("/storage/") ? path.replace(/^\/storage\//, "") : path.replace(/^\//, "")

  // Return complete URL with base URL
  return `${config.API_BASE_URL}/storage/${clean}`
}

function normalizeApiResponse(apiData: any): { users: User[]; totalPages: number } {
  const users: User[] = []
  let totalPages = 1

  // --- GIGS → sellers (these have images)
  if (apiData.gigs?.data) {
    totalPages = Math.max(totalPages, apiData.gigs.last_page || 1)
    for (const gig of apiData.gigs.data) {
      const u = gig.user
      if (!u) continue

      // Gigs have actual project images
      const projectImages = []
      if (gig.images && gig.images.length > 0) {
        // Add up to 4 images from the gig
        for (let i = 0; i < Math.min(4, gig.images.length); i++) {
          const imgPath = gig.images[i]
          if (imgPath) {
            // Handle the case where the API returns incomplete URLs
            let imageUrl = imgPath
            if (imgPath.endsWith("/storage")) {
              // If the URL ends with /storage, it's incomplete - use placeholder
              imageUrl = "/placeholder.svg?height=200&width=300"
            } else if (!imgPath.startsWith("http")) {
              // If it's a relative path, build the complete URL
              imageUrl = buildImageUrl(imgPath)
            }

            projectImages.push({
              title: gig.title,
              description: gig.description,
              image: imageUrl,
              tags: gig.tags || [],
            })
          }
        }
      }

      // If no valid images or all images are incomplete, add placeholder project
      if (projectImages.length === 0) {
        projectImages.push({
          title: gig.title,
          description: gig.description,
          image: "/placeholder.svg?height=200&width=300",
          tags: gig.tags || [],
        })
      }

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
        projects: projectImages,
        bio: u.summary || "",
        categoryId: gig.category_id,
      })
    }
  }

  // --- JOBS → buyers (these don't have images, just job details)
  if (apiData.jobs?.data) {
    totalPages = Math.max(totalPages, apiData.jobs.last_page || 1)
    for (const job of apiData.jobs.data) {
      const b = job.buyer || job.user
      if (!b) continue

      // Jobs don't have images - create placeholder projects showing job details
      const jobProjects = [
        {
          title: job.title,
          description: job.description,
          image: "/placeholder.svg?height=200&width=300", // Always placeholder for jobs
          tags: job.skills || [],
        },
      ]

      // Add more placeholder projects to fill the grid (jobs don't have multiple projects)
      while (jobProjects.length < 4) {
        jobProjects.push({
          title: "Job Opportunity",
          description: "Looking for skilled professionals",
          image: "/placeholder.svg?height=200&width=300",
          tags: [],
        })
      }

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
        categoryId: job.category_id,
      })
    }
  }

  return { users, totalPages }
}

export function useDiscover(rawFilter: DiscoverFilter, search: string, page: number) {
  const { user: authUser } = useAuth()
  const [data, setData] = useState<User[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    // Fix: Use account_type instead of role
    let filter: DiscoverFilter = rawFilter
    if (rawFilter === "all" && authUser?.account_type) {
      // Don't change the filter for "all" - let it fetch everything
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

        // Client-side filtering
        let filtered = allUsers

        if (filter.startsWith("category:")) {
          const catId = Number(filter.split(":")[1])
          filtered = allUsers.filter((u) => u.categoryId === catId)
        } else if (filter === "seller" || filter === "sellerpeople") {
          filtered = allUsers.filter((u) => u.badge === "Gig")
        } else if (filter === "buyer" || filter === "buyerpeople") {
          filtered = allUsers.filter((u) => u.badge === "Job")
        } else if (filter === "featured") {
          filtered = allUsers.filter((u) => ["Gig", "Job"].includes(u.badge))
        }
        // For "all", don't filter - return all users

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

"use client"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import type { User } from "@/types/User"
import config from "@/config"

export type DiscoverFilter = "all" | "seller" | "buyer" | "sellerpeople" | "buyerpeople" | "featured" | "gigs" | "jobs"

// Helper: build full image URL
function buildImageUrl(path: string) {
  if (!path) return "/placeholder.svg?height=200&width=300"
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  const clean = path.startsWith("/storage/") ? path.replace(/^\/storage\//, "") : path.replace(/^\//, "")
  return `${config.API_BASE_URL}/storage/${clean}`
}

// Helper: check if URL is already valid
function isValidImageUrl(url: string): boolean {
  if (!url) return false
  if (url.includes("placeholder.svg")) return true
  if (url.startsWith("http://") || url.startsWith("https://")) return !url.endsWith("/storage")
  return false
}

/**
 * Normalize the API response into a flat list of User objects + totalPages
 * Handles both paginated (apiData.gigs.data) and flat-array (apiData.gigs) shapes.
 */
function normalizeApiResponse(apiData: any): { users: User[]; totalPages: number } {
  let totalPages = 1
  const userMap: Record<string, User> = {}

  // Shared helper to add or update user in the map
  const addOrUpdate = (
    u: any,
    badge: "Gig" | "Job",
    projectItems: Array<{
      title: string
      description?: string
      image: string
      tags?: string[]
      category?: any
      subcategory?: any
      price?: number
      budget?: number
    }>,
  ) => {
    const uid = u.uid
    if (!userMap[uid]) {
      userMap[uid] = {
        id: u.id.toString(),
        uid,
        name: `${u.first_name} ${u.last_name}`.trim(),
        avatar: u.image || "/placeholder.svg?height=100&width=100",
        location:
          badge === "Gig"
            ? u.country_id
              ? "Location Available"
              : "Remote"
            : projectItems[0]?.category?.name || "Remote",
        rating: 0,
        badge,
        hourlyRate:
          badge === "Gig"
            ? Number.parseFloat(projectItems[0]?.price?.toString() || "0")
            : Number.parseFloat(projectItems[0]?.budget?.toString() || "0"),
        experience: u.headline || u.experience_level || "Professional",
        followers: 0,
        skills: [...(u.skills || []), ...(u.tags || [])],
        projects: [] as any[],
        bio: u.summary || "",
        categoryId: projectItems[0]?.category?.id || null,
        categoryName: projectItems[0]?.category?.name,
        subcategoryName: projectItems[0]?.subcategory?.name,
      }
    }
    userMap[uid].projects.push(...projectItems)
  }

  // Determine gigs array (flat or paginated)
  const gigArray: any[] = Array.isArray(apiData.gigs) ? apiData.gigs : apiData.gigs?.data || []

  // If paginated shape includes .last_page, update totalPages
  if (apiData.gigs?.last_page) {
    totalPages = Math.max(totalPages, apiData.gigs.last_page)
  }

  // Process each gig
  for (const gig of gigArray) {
    const u = gig.user
    if (!u) continue
    const items = (gig.images || []).map((img: string) => {
      const image = isValidImageUrl(img) ? img : buildImageUrl(img)
      return {
        title: gig.title,
        description: gig.description,
        image,
        tags: gig.tags || [],
        category: gig.category,
        subcategory: gig.subcategory,
        price: Number.parseFloat(gig.price),
      }
    })
    if (items.length === 0) {
      items.push({
        title: gig.title,
        description: gig.description,
        image: "/placeholder.svg?height=200&width=300",
        tags: gig.tags || [],
        category: gig.category,
        subcategory: gig.subcategory,
        price: Number.parseFloat(gig.price),
      })
    }
    addOrUpdate(u, "Gig", items)
  }

  // Determine jobs array (flat or paginated)
  const jobArray: any[] = Array.isArray(apiData.jobs) ? apiData.jobs : apiData.jobs?.data || []
  if (apiData.jobs?.last_page) {
    totalPages = Math.max(totalPages, apiData.jobs.last_page)
  }

  // Process each job
  for (const job of jobArray) {
    const u = job.buyer || job.user
    if (!u) continue
    const imageUrl = u.image && isValidImageUrl(u.image) ? u.image : "/placeholder.svg?height=200&width=300"
    const item = {
      title: job.title,
      description: job.description,
      image: imageUrl,
      tags: job.skills || [],
      category: job.category,
      subcategory: null,
      budget: Number.parseFloat(job.budget),
    }
    addOrUpdate(u, "Job", [item])
  }

  return { users: Object.values(userMap), totalPages }
}

// Map rawFilter → API 'type' param
function filterToType(filter: DiscoverFilter): string {
  switch (filter) {
    case "seller":
    case "sellerpeople":
      return "seller"
    case "buyer":
    case "buyerpeople":
      return "buyer"
    case "featured":
      return "featured"
    case "all":
      return "all"
    case "gigs":
      return "seller" // gigs come from sellers
    case "jobs":
      return "buyer" // jobs come from buyers
    default:
      return filter
  }
}

/**
 * useDiscover
 * @param rawFilter one of your DiscoverFilter values
 * @param search search string
 * @param page   page number
 * @param sortBy server sort key (default "price_asc")
 * @param perPage number of items per page (default 10)
 * @param categoryId optional category ID for filtering
 */
export function useDiscover(
  rawFilter: DiscoverFilter,
  search: string,
  page: number,
  sortBy = "price_asc",
  perPage = 10,
  categoryId?: string, // New parameter
) {
  const { user: authUser } = useAuth()
  const [data, setData] = useState<User[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const filter = rawFilter === "all" ? "all" : rawFilter
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const typeParam = filterToType(filter)
        const token = localStorage.getItem("token")

        const requestParams = {
          type: typeParam,
          search: search || undefined,
          sort_by: sortBy,
          per_page: perPage,
          page,
          category_id: categoryId && categoryId !== "all" ? categoryId : undefined, // Add category_id
        }

        console.log("useDiscover API Request Params:", requestParams) // Log params

        // Call the search endpoint
        const res = await api.get("/discover/search", {
          params: requestParams,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })

        // Normalize and set
        let { users: fetched, totalPages: pages } = normalizeApiResponse(res.data.data || res.data)

        // Apply user-specific filtering logic
        if (authUser?.account_type === "buyer" && rawFilter === "all") {
          // Buyers see only Gigs when "all" is selected
          fetched = fetched.filter((u) => u.badge === "Gig")
        } else if (authUser?.account_type === "seller" && rawFilter === "gigs") {
          // Sellers see only Gigs when "gigs" filter is selected
          fetched = fetched.filter((u) => u.badge === "Gig")
        } else if (authUser?.account_type === "seller" && rawFilter === "jobs") {
          // Sellers see only Jobs when "jobs" filter is selected
          fetched = fetched.filter((u) => u.badge === "Job")
        }
        // For seller "all" filter, show both gigs and jobs (no filtering needed)
        // The component will handle grouping them by badge type
        if (alive) {
          setData(fetched)
          setTotalPages(pages)
        }
      } catch (err: any) {
        if (alive) setError(err.response?.data?.message || err.message)
      } finally {
        if (alive) setLoading(false)
      }
    }
    fetchData()
    return () => {
      alive = false
    }
  }, [rawFilter, search, page, sortBy, perPage, authUser?.account_type, categoryId]) // Add categoryId to dependencies
  return { users: data, totalPages, loading, error }
}

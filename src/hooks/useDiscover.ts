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
  if (!path) return "/placeholder.svg?height=200&width=300"
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  const clean = path.startsWith("/storage/") ? path.replace(/^\/storage\//, "") : path.replace(/^\//, "")
  return `${config.API_BASE_URL}/storage/${clean}`
}

function isValidImageUrl(url: string): boolean {
  if (!url) return false
  if (url.includes("placeholder.svg")) return true
  if (url.startsWith("http://") || url.startsWith("https://")) return !url.endsWith("/storage")
  return false
}

function normalizeApiResponse(apiData: any): { users: User[]; totalPages: number } {
  let totalPages = 1
  const userMap: Record<string, User> = {}

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
    }>
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
            ? u.country_id ? "Location Available" : "Remote"
            : projectItems[0]?.category
              ? projectItems[0].category.name
              : "Remote",
        rating: 0,
        badge,
        hourlyRate: badge === "Gig"
          ? parseFloat(projectItems[0]?.price || "0")
          : parseFloat(projectItems[0]?.budget || "0"),
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

  // GIGS → sellers
  if (apiData.gigs?.data) {
    totalPages = Math.max(totalPages, apiData.gigs.last_page || 1)
    for (const gig of apiData.gigs.data) {
      const u = gig.user
      if (!u) continue

      const items: any[] = (gig.images || []).map((img: string, i: number) => {
        let image = isValidImageUrl(img) ? img : buildImageUrl(img)
        return {
          title: gig.title,
          description: gig.description,
          image,
          tags: gig.tags || [],
          category: gig.category,
          subcategory: gig.subcategory,
          price: gig.price,
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
          price: gig.price,
        })
      }
      addOrUpdate(u, "Gig", items)
    }
  }

  // JOBS → buyers
  if (apiData.jobs?.data) {
    totalPages = Math.max(totalPages, apiData.jobs.last_page || 1)
    for (const job of apiData.jobs.data) {
      const b = job.buyer || job.user
      if (!b) continue
const imageUrl = b.image
      ? (isValidImageUrl(b.image) ? b.image : buildImageUrl(b.image))
      : "/placeholder.svg?height=200&width=300"
      const item = {
        title: job.title,
        description: job.description,
        image: imageUrl,
        tags: job.skills || [],
        category: job.category,
        subcategory: null,
        budget: job.budget,
      }
      addOrUpdate(b, "Job", [item])
    }
  }

  return { users: Object.values(userMap), totalPages }
}

export function useDiscover(rawFilter: DiscoverFilter, search: string, page: number) {
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
        const params: any = { page }
        if (filter.startsWith("category:")) params.category = filter.split(":")[1]
        if (search) params.q = search

        const res = await api.get("/discover", { params })
        const { users: allUsers, totalPages: pages } = normalizeApiResponse(res.data.data || res.data)

        let filtered = allUsers
        if (filter.startsWith("category:")) {
          filtered = allUsers.filter(u => u.categoryId === Number(filter.split(":")[1]))
        } else if (filter === "seller" || filter === "sellerpeople") {
          filtered = allUsers.filter(u => u.badge === "Gig")
        } else if (filter === "buyer" || filter === "buyerpeople") {
          filtered = allUsers.filter(u => u.badge === "Job")
        } else if (filter === "featured") {
          filtered = allUsers.filter(u => ["Gig", "Job"].includes(u.badge))
        }

        if (alive) {
          setData(filtered)
          setTotalPages(pages)
        }
      } catch (err: any) {
        if (alive) setError(err?.response?.data?.message || err.message || "Failed to load data.")
      } finally {
        if (alive) setLoading(false)
      }
    }

    fetchData()
    return () => { alive = false }
  }, [rawFilter, search, page, authUser?.account_type])

  return { users: data, totalPages, loading, error }
}

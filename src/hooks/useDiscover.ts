"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
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

function normalizeApiResponse(apiData: any): { users: User[]; totalPages: number } {
  const users: User[] = []
  let totalPages = 1

  // Normalize Gigs (sellers)
  if (apiData.gigs?.data) {
    totalPages = Math.max(totalPages, apiData.gigs.last_page || 1)

    for (const gig of apiData.gigs.data) {
      const user = gig.user
      if (user) {
        users.push({
          id: user.id.toString(),
          uid: user.uid,
          name: `${user.first_name} ${user.last_name}`.trim(),
          avatar: user.image
            ? `${config.IMG_BASE_URL}/storage/${user.image}`
            : "/placeholder.svg?height=100&width=100",
          location: user.country_id ? "Location Available" : "Remote",
          rating: 4.5, // Placeholder
          badge: "Gig",
          hourlyRate: Number.parseFloat(gig.price || "0"),
          experience: user.headline || "Professional",
          followers: 0,
          skills: [...(gig.skills || []), ...(gig.tags || [])],
          projects: [
            {
              title: gig.title,
              description: gig.description,
              image:
               gig.images?.[0]?.image_path
    ? `${config.IMG_BASE_URL}/storage/${gig.images[0].image_path}`
    : "/placeholder.svg?height=200&width=300",
              tags: gig.tags || [],
            },
          ],
          bio: user.summary || "",
          categoryId: gig.category_id,
        })
      }
    }
  }

  // Normalize Jobs (buyers)
  if (apiData.jobs?.data) {
    totalPages = Math.max(totalPages, apiData.jobs.last_page || 1)

    for (const job of apiData.jobs.data) {
      const buyer = job.buyer
      if (buyer) {
        users.push({
          id: buyer.id.toString(),
          uid: buyer.uid,
          name: `${buyer.first_name} ${buyer.last_name}`.trim(),
          avatar: buyer.image
            ? `${config.IMG_BASE_URL}/storage/${buyer.image}`
            : "/placeholder.svg?height=100&width=100",
          location: job.location_type === "remote" ? "Remote" : "On-site",
          rating: 4.0, // Placeholder
          badge: "Job",
          hourlyRate: Number.parseFloat(job.budget || "0"),
          experience: job.experience_level || "Any Level",
          followers: 0,
          skills: job.skills || [],
          projects: [
            {
              title: job.title,
              description: job.description,
              image:
                job.image
                  ? `${config.IMG_BASE_URL}/storage/${job.image}`
                  : job.attachments?.[0]
                    ? `${config.IMG_BASE_URL}/storage/${job.attachments[0]}`
                    : "/placeholder.svg?height=200&width=300",
              tags: [],
            },
          ],
          bio: buyer.summary || "",
          categoryId: job.category_id,
        })
      }
    }
  }

  return { users, totalPages }
}

export function useDiscover(filter: DiscoverFilter, search: string, page: number) {
  const [data, setData] = useState<User[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const params: Record<string, any> = { page }

        // Category filter
        if (filter.startsWith("category:")) {
          params.category = filter.split(":")[1]
        }

        // Search query
        if (search) {
          params.q = search
        }

        const res = await api.get("/discover", { params })
        const { users: normalizedUsers, totalPages: pages } = normalizeApiResponse(res.data.data || res.data)

        let filteredUsers = normalizedUsers

        // Apply client-side filtering
        if (filter.startsWith("category:")) {
          const categoryId = Number.parseInt(filter.split(":")[1])
          filteredUsers = normalizedUsers.filter((user) => user.categoryId === categoryId)
        } else if (filter === "seller" || filter === "sellerpeople") {
          filteredUsers = normalizedUsers.filter((user) => user.badge === "Gig")
        } else if (filter === "buyer" || filter === "buyerpeople") {
          filteredUsers = normalizedUsers.filter((user) => user.badge === "Job")
        } else if (filter === "featured") {
          filteredUsers = normalizedUsers.filter((user) => ["Gig", "Job"].includes(user.badge))
        }

        if (alive) {
          setData(filteredUsers)
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
  }, [filter, search, page])

  return { users: data, totalPages, loading, error }
}

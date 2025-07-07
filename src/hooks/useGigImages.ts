"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import config from "@/config"

interface GigImage {
  id: string
  title: string
  description: string
  image: string
  tags: string[]
  userId: string
}

function buildImageUrl(path: string) {
  if (!path) return "/placeholder.svg?height=200&width=300"

  // If it's already a complete URL, return as is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }

  // Clean the path and build complete URL
  const clean = path.startsWith("/storage/") ? path.replace(/^\/storage\//, "") : path.replace(/^\//, "")

  // Return complete URL with base URL
  return `${config.API_BASE_URL}/storage/${clean}`
}

function isValidImageUrl(url: string): boolean {
  if (!url) return false

  // Check if it's a placeholder
  if (url.includes("placeholder.svg")) return true

  // Check if it's a complete URL
  if (url.startsWith("http://") || url.startsWith("https://")) {
    // Make sure it doesn't end with just "/storage" (incomplete URL)
    return !url.endsWith("/storage")
  }

  return false
}

export function useGigImages(userId?: string) {
  const [gigImages, setGigImages] = useState<GigImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGigImages = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await api.get("/all-gigs")
        const gigs = response.data?.data?.gigs || response.data?.gigs || []

        let filteredGigs = gigs

        // If userId is provided, filter gigs for that specific user
        if (userId) {
          filteredGigs = gigs.filter((gig: any) => gig.user?.uid === userId || gig.user?.id?.toString() === userId)
        }

        const processedImages: GigImage[] = []

        for (const gig of filteredGigs) {
          if (gig.images && Array.isArray(gig.images) && gig.images.length > 0) {
            // Process each image in the gig
            for (const imageUrl of gig.images) {
              let finalImageUrl = null

              if (isValidImageUrl(imageUrl)) {
                finalImageUrl = imageUrl
              } else if (imageUrl && !imageUrl.endsWith("/storage")) {
                // Try to build the complete URL if it's a relative path
                const builtUrl = buildImageUrl(imageUrl)
                if (isValidImageUrl(builtUrl)) {
                  finalImageUrl = builtUrl
                }
              }

              // Only add if we have a valid image URL
              if (finalImageUrl) {
                processedImages.push({
                  id: `${gig.id}-${processedImages.length}`,
                  title: gig.title,
                  description: gig.description,
                  image: finalImageUrl,
                  tags: gig.tags || [],
                  userId: gig.user?.uid || gig.user?.id?.toString() || "",
                })
              }
            }
          }

          // If no valid images were found for this gig, add one placeholder
          if (gig.images?.length === 0 || !processedImages.some((img) => img.title === gig.title)) {
            processedImages.push({
              id: `${gig.id}-placeholder`,
              title: gig.title,
              description: gig.description,
              image: "/placeholder.svg?height=200&width=300",
              tags: gig.tags || [],
              userId: gig.user?.uid || gig.user?.id?.toString() || "",
            })
          }
        }

        setGigImages(processedImages)
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Failed to load gig images")
      } finally {
        setLoading(false)
      }
    }

    fetchGigImages()
  }, [userId])

  return { gigImages, loading, error }
}

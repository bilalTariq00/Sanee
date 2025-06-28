"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import type { Gig } from "@/types/chat"
import config from "@/config"

export const useGigs = () => {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSeller, setIsSeller] = useState(false)

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No authentication token found")
    }
    return { Authorization: `Bearer ${token}` }
  }, [])

  const checkUserRole = useCallback(async () => {
    try {
      const response = await axios.get<{ account_type: string }>(`${config.API_BASE_URL}/me`, {
        headers: getAuthHeaders(),
      })
      setIsSeller(response.data.account_type === "seller")
    } catch (err) {
      console.error("Failed to check user role:", err)
      setIsSeller(false)
    }
  }, [getAuthHeaders])

  const fetchGigs = useCallback(async () => {
    if (!isSeller) return

    setLoading(true)
    setError(null)

    try {
      const response = await axios.get<Gig[]>(`${config.API_BASE_URL}/seller/gigs`, { headers: getAuthHeaders() })
      setGigs(response.data || [])
    } catch (err) {
      console.error("Failed to fetch gigs:", err)
      setError("Failed to load gigs")
      setGigs([])
    } finally {
      setLoading(false)
    }
  }, [isSeller, getAuthHeaders])

  useEffect(() => {
    checkUserRole()
  }, [checkUserRole])

  useEffect(() => {
    if (isSeller) {
      fetchGigs()
    }
  }, [isSeller, fetchGigs])

  return {
    gigs,
    loading,
    error,
    isSeller,
    fetchGigs,
    checkUserRole,
  }
}

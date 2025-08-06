import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import config from "@/config"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Extract token & email from query params
  const params = new URLSearchParams(location.search)
  const tokenParam = params.get("token") || ""
  const emailParam = params.get("email") || ""

  const [form, setForm] = useState({
    token: tokenParam,
    email: emailParam,
    password: "",
    password_confirmation: "",
  })
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState("")

  // Verify token on page load
  useEffect(() => {
    const verifyToken = async () => {
      if (!form.token || !form.email) {
        setError("Invalid reset link.")
        return
      }
      try {
        const res = await fetch(`${config.API_BASE_URL}/verify-reset-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: form.token, email: form.email }),
        })
        if (res.ok) {
          setVerified(true)
        } else {
          setError("Invalid or expired reset token.")
        }
      } catch {
        setError("Something went wrong while verifying.")
      }
    }
    verifyToken()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) {
      toast.error("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${config.API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Password reset successfully. Please login.")
        navigate("/login")
      } else {
        toast.error(data.message || "Failed to reset password")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h2 className="text-2xl font-bold text-red-500">{error}</h2>
      </div>
    )
  }

  if (!verified) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h2 className="text-lg text-gray-500">Verifying reset link...</h2>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={form.password_confirmation}
            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  )
}

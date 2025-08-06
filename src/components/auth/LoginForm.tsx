import React, { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useTranslation } from "react-i18next"
import config from "../../config"
import { toast } from "sonner"

export default function LoginForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [error, setError] = useState("")

  const [showForgotDialog, setShowForgotDialog] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [loadingForgot, setLoadingForgot] = useState(false)

  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetForm, setResetForm] = useState({
    token: "",
    email: "",
    password: "",
    password_confirmation: "",
  })
  const [resetMessage, setResetMessage] = useState("")
  const [loadingReset, setLoadingReset] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.email || !formData.password) {
      setError(t("login.errorFillAll"))
      return
    }

    const result = await login(formData.email, formData.password)
    if (result.success) {
      const from = (location.state as any)?.from?.pathname
      navigate(from || "/")
    } else {
      setError(result.error || t("login.errorLoginFailed"))
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingForgot(true)
    try {
      const res = await fetch(`${config.API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Password reset link sent to your email.")
        setShowForgotDialog(false)
        setForgotEmail("")
      } else {
        toast.error(data.message || "Failed to send reset link.")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoadingForgot(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingReset(true)
    setResetMessage("")
    try {
      const verify = await fetch(`${config.API_BASE_URL}/verify-reset-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetForm.token, email: resetForm.email }),
      })
      if (!verify.ok) {
        setResetMessage("Invalid or expired token.")
        setLoadingReset(false)
        return
      }

      const res = await fetch(`${config.API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resetForm),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Password reset successfully. You can now log in.")
        setShowResetDialog(false)
      } else {
        toast.error(data.message || "Failed to reset password.")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoadingReset(false)
    }
  }

  return (
    <>
      {/* Login Form */}
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">{error}</div>}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t("login.email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-red-500 focus:border-red-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            {t("login.password")}
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={formData.password}
              onChange={handleChange}
              className="block w-full px-3 py-2 border rounded-md focus:ring-red-500 focus:border-red-500 pr-10"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-red-500 focus:ring-red-500 border-gray-300 rounded" />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">{t("login.remember")}</label>
          </div>
          <button type="button" onClick={() => setShowForgotDialog(true)} className="text-sm font-medium text-red-500 hover:text-red-600">
            {t("login.forgot")}
          </button>
        </div>

        <button type="submit" className="w-full py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none">
          {t("login.signin")}
        </button>

        <div className="text-sm text-center">
          <span className="text-gray-600">{t("login.noAccount")}</span>{" "}
          <Link to="/signup" className="font-medium text-red-500 hover:text-red-600">{t("login.signup")}</Link>
        </div>
      </form>

      {/* Forgot Password Modal */}
      {showForgotDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Forgot Password</h2>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input type="email" placeholder="Enter your email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required className="w-full border rounded px-3 py-2" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForgotDialog(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" disabled={loadingForgot} className="px-4 py-2 bg-red-500 text-white rounded">
                  {loadingForgot ? "Sending..." : "Send Link"}
                </button>
              </div>
              <div className="text-sm mt-2">
                Already have token?{" "}
                <button type="button" className="text-red-500" onClick={() => { setShowForgotDialog(false); setShowResetDialog(true) }}>
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Reset Password</h2>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input type="text" placeholder="Token" value={resetForm.token} onChange={(e) => setResetForm({ ...resetForm, token: e.target.value })} required className="w-full border rounded px-3 py-2" />
              <input type="email" placeholder="Email" value={resetForm.email} onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })} required className="w-full border rounded px-3 py-2" />
              <input type="password" placeholder="New Password" value={resetForm.password} onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })} required className="w-full border rounded px-3 py-2" />
              <input type="password" placeholder="Confirm Password" value={resetForm.password_confirmation} onChange={(e) => setResetForm({ ...resetForm, password_confirmation: e.target.value })} required className="w-full border rounded px-3 py-2" />
              {resetMessage && <div className="text-sm text-red-500">{resetMessage}</div>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowResetDialog(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" disabled={loadingReset} className="px-4 py-2 bg-red-500 text-white rounded">
                  {loadingReset ? "Resetting..." : "Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

import React, { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import config from "@/config"
import { toast } from "sonner"
import { Mail, MapPin, Phone,Instagram,
  Twitter,
  Facebook,
  Linkedin, } from 'lucide-react';
import { useTranslation } from "react-i18next";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
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
      <h2 className="text-2xl font-bold text-red-500">{t("reset.invalidLink")}</h2>
    </div>
  )
}

if (!verified) {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h2 className="text-lg text-gray-500">{t("reset.verifying")}</h2>
    </div>
  )
}


  return (

    <>  <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-center h-16">
                    <Link to="/">
                    <img src="/sanee.png" alt="logo" className="w-14 h-10" />
                    </Link>
                    <div className="flex items-center space-x-4">
                      <Link to="/login" className="text-gray-700 hover:text-red-500 font-medium">
                        {t("landing.header.signin")}
                      </Link>
                      <Link to="/signup" className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                        {t("landing.header.getStarted")}
                      </Link>
                        {/* <button
                      onClick={toggleLanguage}
                      className="text-gray-700 hover:text-red-500 flex items-center gap-2"
                    >
                      <Globe2 className="h-5 w-5" />
                      <span className="text-sm capitalize">
                        {language === 'en' ? t('arabic') : t('english')}
                      </span>
                    </button> */}
                    </div>
                  </div>
                </div>
              </header>
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
  <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-semibold mb-4">{t("reset.title")}</h2>
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="password"
        placeholder={t("reset.newPassword")}
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
        className="w-full border rounded px-3 py-2"
      />
      <input
        type="password"
        placeholder={t("reset.confirmPassword")}
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
        {loading ? t("reset.loading") : t("reset.submit")}
      </button>
    </form>
  </div>
</div>

        <section className="py-20 bg-red-500 text-white">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-center px-4">
                  <div><div className="text-4xl font-bold mb-2">5,000+</div><div className="text-red-100">{t("landing.stats.creators")}</div></div>
                  <div><div className="text-4xl font-bold mb-2">10,000+</div><div className="text-red-100">{t("landing.stats.projects")}</div></div>
                  <div><div className="text-4xl font-bold mb-2">98%</div><div className="text-red-100">{t("landing.stats.satisfaction")}</div></div>
                  <div><div className="text-4xl font-bold mb-2">24/7</div><div className="text-red-100">{t("landing.stats.support")}</div></div>
                </div>
              </section>
        
              {/* Footer */}
              <footer className="bg-gray-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="col-span-1 md:col-span-2">
                    <img src="/sanee.png" alt="logo" className="w-20 h-16" />
                    <p className="text-gray-300 mb-6 max-w-md">
                      {t("landing.footer.mission")}
                    </p>
                    <div className="flex space-x-4 mb-6">
                      {[Instagram, Twitter, Facebook, Linkedin].map((Icon, idx) => (
                        <a key={idx} href="#" className="bg-gray-800 p-3 rounded-full hover:bg-red-500 transition-colors">
                          <Icon className="h-5 w-5" />
                        </a>
                      ))}
                    </div>
                    <div className="space-y-2 text-gray-300">
                      <div className="flex items-center"><Mail className="h-4 w-4 mr-2" /> <span>hello@sanee.com</span></div>
                      <div className="flex items-center"><Phone className="h-4 w-4 mr-2" /> <span>+971 50 123 4567</span></div>
                      <div className="flex items-center"><MapPin className="h-4 w-4 mr-2" /> <span>Dubai, UAE</span></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-4">{t("landing.footer.missionTitle")}</h4>
                    <p className="text-gray-300 text-sm mb-6">{t("landing.footer.mission")}</p>
                    <h4 className="text-lg font-semibold mb-4">{t("landing.footer.visionTitle")}</h4>
                    <p className="text-gray-300 text-sm">{t("landing.footer.vision")}</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-4">{t("landing.footer.quickLinks")}</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li><Link to="/categories" className="hover:text-red-500">{t("landing.footer.links.categories")}</Link></li>
                      <li><Link to="/jobs" className="hover:text-red-500">{t("landing.footer.links.jobs")}</Link></li>
                      <li><Link to="/signup" className="hover:text-red-500">{t("landing.footer.links.creator")}</Link></li>
                      <li><Link to="/signup" className="hover:text-red-500">{t("landing.footer.links.job")}</Link></li>
                      <li><a href="#" className="hover:text-red-500">{t("landing.footer.links.help")}</a></li>
                      <li><a href="#" className="hover:text-red-500">{t("landing.footer.links.privacy")}</a></li>
                      <li><a href="#" className="hover:text-red-500">{t("landing.footer.links.terms")}</a></li>
                    </ul>
                  </div>
                </div>
                <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                  <p>{t("landing.footer.copy")}</p>
                </div>
              </footer>
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import SearchBar from "@/components/SearchBar"
import UserCard from "@/components/UserCard"
import UserProfileDialog from "@/components/UserProfileDialog"
import type { User } from "@/types/User"
import { useDiscover } from "@/hooks/useDiscover"
import axios from "axios"
import config from "@/config"
import AllGigs from "./AllGigs"
import JobsPage from "./JobsPage"
import { useAuth } from "@/contexts/AuthContext"

interface Category {
  id: string
  name: string
}

export default function Discover() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === "ar"
  const navigate = useNavigate()
  const { user: authUser } = useAuth()

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const token = localStorage.getItem("token")

  // Fetch categories (unchanged)
  useEffect(() => {
    const language = i18n.language.startsWith("ar") ? "ar" : "en"
    axios
      .get(`${config.API_BASE_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}`, "Accept-Language": language },
      })
      .then((res) => {
        const cats = res.data.data.categories.map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
        }))
        setCategories(cats)
      })
      .catch(() => {
        setCategories([
          { id: "1", name: language === "ar" ? "تطوير الويب" : "Web Development" },
          { id: "2", name: language === "ar" ? "الصوت" : "Audio" },
          { id: "3", name: language === "ar" ? "الفيديو" : "Video" },
          { id: "4", name: language === "ar" ? "التصميم الجرافيكي" : "Graphic Design" },
        ])
      })
  }, [token, i18n.language])

  // RTL / LTR
  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr")
    document.documentElement.setAttribute("lang", i18n.language)
  }, [i18n.language, isRTL])

  // Determine adjusted filter for hook
  const userType: "seller" | "buyer" = authUser?.account_type === "seller" ? "buyer" : "seller"
  const adjustedFilter =
    filter === "people"
      ? userType === "buyer"
        ? "buyerpeople"
        : "sellerpeople"
      : ["all", "seller", "buyer"].includes(filter)
      ? filter
      : `category:${filter}`

  // Fetch discover data
  const { users, loading, error, totalPages } = useDiscover(adjustedFilter, search, page)

  const goToChat = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (selectedId) navigate(`/messages/${selectedId}`)
  }

  // --- MAIN CONTENT RENDERER ---
  const renderMainContent = () => {
    // 1️⃣ “All” → one UserCard per user (each UserCard shows all that user’s services)
    if (filter === "all") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((u) => (
            <UserCard
              key={u.uid}
              user={u}
              userType={userType}
              authUserType={authUser?.account_type}
              onUserClick={() => {
                setSelected(u)
                setSelectedId(u.uid)
                setOpen(true)
              }}
            />
          ))}
        </div>
      )
    }

    // 2️⃣ “jobs” and “gigs” still use their special pages
    if (filter === "jobs") return <JobsPage />
    if (filter === "gigs") return <AllGigs />

    // 3️⃣ All other filters → list matching UserCards
    return (
      <>
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        )}
        {error && (
          <div className="text-center py-16">
            <div className="text-red-500 text-xl mb-2">⚠️ Error</div>
            <p className="text-red-500">{error}</p>
          </div>
        )}
        {!loading && !error && users.length > 0 && (
          <>
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isRTL ? "rtl" : ""}`}>
              {users.map((u) => (
                <UserCard
                  key={u.uid}
                  user={u}
                  userType={userType}
                  authUserType={authUser?.account_type}
                  onUserClick={() => {
                    setSelected(u)
                    setSelectedId(u.uid)
                    setOpen(true)
                  }}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className={`flex justify-center mt-10 gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                >
                  {t("prev") || "Prev"}
                </button>
                <span className="py-2 px-4 bg-white rounded border">
                  {t("page")} {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                >
                  {t("next") || "Next"}
                </button>
              </div>
            )}
          </>
        )}
        {!loading && !error && users.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-500 mb-2">
              {t("no_results") || "No results found"}
            </p>
          </div>
        )}
      </>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? "text-right" : "text-left"}`}>
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1
          className={`text-4xl font-bold mb-6 text-center ${
            isRTL ? "text-red-600" : "text-red-500"
          }`}
        >
          {t("discover")}
        </h1>

        <SearchBar
          searchTerm={search}
          onSearchChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          activeFilter={filter}
          onFilterChange={(f) => {
            setFilter(f)
            setPage(1)
          }}
          userType={userType}
          authUserType={authUser?.account_type}
          categories={categories}
          isRTL={isRTL}
        />

        {renderMainContent()}
      </main>

      <UserProfileDialog
        user={selected}
        isOpen={open}
        onClose={() => {
          setOpen(false)
          setSelected(null)
          setSelectedId(null)
        }}
        gotoChat={goToChat}
      />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import SearchBar from "@/components/SearchBar"
import UserCard from "@/components/UserCard"
import UserProfileDialog from "@/components/UserProfileDialog"
import type { User } from "@/types/User"
import { useDiscover } from "@/hooks/useDiscover"
import axios from "axios"
import config from "@/config"

interface Category {
  id: string
  name: string
}

export default function Discover() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === "ar"

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  // Define userType - you can make this dynamic based on your app logic
  const [userType] = useState<"buyer" | "seller">("seller")

  const token = localStorage.getItem("token")

  // Fetch categories using your existing config
  useEffect(() => {
    axios
      .get(`${config.API_BASE_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCategories(res.data))
      .catch((err) => {
        console.error("Failed to fetch categories:", err)
        // Set some default categories if API fails
        setCategories([
          { id: "1", name: "Web Development" },
          { id: "2", name: "Audio" },
          { id: "3", name: "Video" },
          { id: "4", name: "Graphic Design" },
        ])
      })
  }, [token])

  useEffect(() => {
    const dir = isRTL ? "rtl" : "ltr"
    document.documentElement.setAttribute("dir", dir)
    document.documentElement.setAttribute("lang", i18n.language)
  }, [i18n.language, isRTL])

  const adjustedFilter =
    filter === "people"
      ? userType === "buyer"
        ? "buyerpeople"
        : "sellerpeople"
      : filter === "all" || filter === "seller" || filter === "buyer"
        ? filter
        : `category:${filter}`

  const { users, loading, error, totalPages } = useDiscover(adjustedFilter, search, page)

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? "text-right" : "text-left"}`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className={`text-4xl font-bold mb-6 text-center ${isRTL ? "text-red-600" : "text-red-500"}`}>
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
          categories={categories}
          isRTL={isRTL}
        />

        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <div className="text-red-500 text-xl mb-2">⚠️ Error</div>
            <p className="text-red-500">{error}</p>
            <p className="text-gray-500 text-sm mt-2">API Endpoint: {config.API_BASE_URL}/discover</p>
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <>
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isRTL ? "rtl" : ""}`}>
              {users.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  onUserClick={(x) => {
                    setSelected(x)
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
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors"
                >
                  {t("prev") || "Prev"}
                </button>
                <span className="py-2 px-4 bg-white rounded border">
                  {t("page")} {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition-colors"
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
            <p className="text-xl text-gray-500 mb-2">{t("no_results") || "No results found"}</p>
            <p className="text-gray-400">{t("try_different_search") || "Try adjusting your search or filters"}</p>
          </div>
        )}
      </main>

      <UserProfileDialog user={selected} isOpen={open} onClose={() => setOpen(false)} />
    </div>
  )
}

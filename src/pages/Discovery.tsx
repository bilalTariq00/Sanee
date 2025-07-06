"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { useTranslation } from "react-i18next"
import SearchBar from "@/components/SearchBar"
import UserCard from "@/components/UserCard"
import UserProfileDialog from "@/components/UserProfileDialog"
import type { User } from "@/types/User"
import { useDiscover } from "@/hooks/useDiscover"
import axios from "axios"
import config from "@/config"
import AllGigs from "./AllGigs"
import JobsPage from "./JobsPage"
import { useNavigate } from "react-router-dom"
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
  const [user, setUser] = useState<any>(null)
  const [jssData, setJssData] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Fixed logic: if user is seller, show buyers (jobs), if user is buyer, show sellers (gigs)
  const userType: "seller" | "buyer" = authUser?.account_type === "seller" ? "buyer" : "seller"

  const [subcategories, setSubcategories] = useState<Category[]>([])
  const token = localStorage.getItem("token")

  // Fetch categories
  useEffect(() => {
    const language = i18n.language.startsWith("ar") ? "ar" : "en"
    axios
      .get(`${config.API_BASE_URL}/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": language,
        },
      })
      .then((res) => {
        const cats = res.data.data.categories.map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
        }))
        setCategories(cats)
      })
      .catch((err) => {
        console.error("Failed to fetch categories:", err)
        setCategories([
          { id: "1", name: language === "ar" ? "تطوير الويب" : "Web Development" },
          { id: "2", name: language === "ar" ? "الصوت" : "Audio" },
          { id: "3", name: language === "ar" ? "الفيديو" : "Video" },
          { id: "4", name: language === "ar" ? "التصميم الجرافيكي" : "Graphic Design" },
        ])
      })
  }, [token, i18n.language])

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

  // Fixed display logic
  // Remove this entire displayUsers filter:
  // const displayUsers = users.filter((u) => {
  //   if (authUser?.account_type === "seller") {
  //     // Sellers should see jobs (buyers)
  //     return u.badge === "Job"
  //   } else {
  //     // Buyers should see gigs (sellers)
  //     return u.badge === "Gig"
  //   }
  // })

  const goToChat = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedId) return
    navigate(`/messages/${selectedId}`)
  }

  useEffect(() => {
    if (!user?.uid) return
    const fetchJssData = async () => {
      try {
        const response = await axios.get(`${config.API_BASE_URL}/users/${user?.uid}/jss`)
        const jssData = response.data?.data?.jss
        setJssData(jssData)
        const projects = jssData?.projects || []
        setProjects(projects)
      } catch (error) {
        console.error("Error fetching JSS data", error)
        setJssData(null)
      }
    }
    fetchJssData()
  }, [user])

  // Function to determine what content to show
  const renderMainContent = () => {
    // Show JobsPage only when specifically clicking "All Jobs" (jobs filter)
    if (filter === "jobs") {
      return <JobsPage />
    }

    // Show AllGigs only when specifically clicking "All Gigs/Services" (gigs filter)
    if (filter === "gigs") {
      return <AllGigs />
    }

    // For all other filters (all, seller, buyer, categories), show the user cards
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
                  onUserClick={() => {
                    setSelected(u)
                    setSelectedId(u.uid)
                    setOpen(true)
                  }}
                  userType={userType}
                  authUserType={authUser?.account_type}
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
      </>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? "text-right" : "text-left"}`}>
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          authUserType={authUser?.account_type}
          categories={categories}
          isRTL={isRTL}
        />

        {renderMainContent()}
      </main>

      {projects.length > 0 && (
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h3 className="text-2xl font-semibold">Projects</h3>
          <ul className="mt-4 space-y-4">
            {projects.map((project, i) => (
              <li key={i} className="bg-white p-4 rounded-lg shadow-md">
                <h4 className="text-lg font-bold">{project.title}</h4>
                <p>{project.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

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

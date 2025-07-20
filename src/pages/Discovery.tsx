"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import SearchBar from "@/components/SearchBar" // Changed to kebab-case
import UserCard from "@/components/UserCard" // Changed to kebab-case
import UserProfileDialog from "@/components/UserProfileDialog" // Changed to kebab-case
import type { User } from "@/types/User"
import { useDiscover } from "@/hooks/useDiscover"
import axios from "axios"
import config from "@/config"
import AllGigs from "@/pages/AllGigs" // Assuming these are in components now
import JobsPage from "@/pages/JobsPage" // Assuming these are in components now
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button" // Added Button import

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
  type DiscoverFilter = "all" | "jobs" | "gigs"
  const [filter, setFilter] = useState<DiscoverFilter>("all")
  // New state for sub-tabs when 'all' filter is active for sellers
  const [activeSubFilter, setActiveSubFilter] = useState<"job_posters" | "service_providers">("job_posters")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc">("price_asc")
  const perPage = 10

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
      .catch(() => {
        setCategories([
          { id: "1", name: language === "ar" ? "تطوير الويب" : "Web Development" },
          { id: "2", name: language === "ar" ? "الصوت" : "Audio" },
          { id: "3", name: language === "ar" ? "الفيديو" : "Video" },
          { id: "4", name: language === "ar" ? "التصميم الجرافيكي" : "Graphic Design" },
        ])
      })
  }, [token, i18n.language])

  // Set RTL/LTR on <html>
  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr")
    document.documentElement.setAttribute("lang", i18n.language)
  }, [i18n.language, isRTL])

  const userType: "seller" | "buyer" = authUser?.account_type === "seller" ? "buyer" : "seller"

  // Pull discover results
  const { users, loading, error, totalPages } = useDiscover(filter, search, page, sortBy, perPage)

  const goToChat = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (selectedId) navigate(`/messages/${selectedId}`)
  }

  // Main renderer
  const renderMainContent = () => {
    // 1. Jobs/Gigs routes
    if (filter === "jobs") return <JobsPage searchQuery={search} />
    if (filter === "gigs") return <AllGigs searchQuery={search} />

    // 2. Seller "all" grouping with sub-tabs
    if (authUser?.account_type === "seller" && filter === "all") {
      const serviceProviders = users.filter((u) => u.badge === "Gig")
      const jobPosters = users.filter((u) => u.badge === "Job")

      // Determine which list to paginate based on activeSubFilter
      const currentList = activeSubFilter === "job_posters" ? jobPosters : serviceProviders
      const localTotalPages = Math.ceil(currentList.length / perPage)
      const paginatedList = currentList.slice((page - 1) * perPage, page * perPage)

      return (
        <>
          <div className={`flex justify-center mb-6 gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Button
             className="selection:bg-red-500 focus:bg-red-500 selection:text-white focus:text-white text-black hover:bg-red-600 hover:text-white rounded-2xl"
              variant={activeSubFilter === "job_posters" ? "default" : "outline"}
              onClick={() => {
                setActiveSubFilter("job_posters")
                setPage(1) // Reset page when changing sub-filter
              }}
            >
              {t("job_posters_tab") || "Job Posters"}
            </Button>
            <Button
             className="selection:bg-red-500 focus:bg-red-500 selection:text-white focus:text-white text-black hover:bg-red-600 hover:text-white rounded-2xl"
              variant={activeSubFilter === "service_providers" ? "default" : "outline"}
              onClick={() => {
                setActiveSubFilter("service_providers")
                setPage(1) // Reset page when changing sub-filter
              }}
            >
              {t("service_providers_tab") || "Service Providers"}
            </Button>
          </div>

          {/* Loading and Error states for sub-filtered content */}
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

          {!loading && !error && (
            <>
              {activeSubFilter === "job_posters" && (
                <>
                  {paginatedList.length > 0 ? (
                    <section className="mb-12">
                      <div className={`flex items-center mb-6 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div className="bg-green-500 p-2 rounded-lg mr-3">
                          <span className="text-white font-bold text-sm">💼</span>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">{t("job_posters") || "Job Posters"}</h2>
                          <p className="text-gray-600 text-sm">
                            {t("find_job_opportunities") || "Find job opportunities from clients"}
                          </p>
                        </div>
                        <div
                          className={`bg-green-100 px-3 py-1 rounded-full text-green-600 text-sm font-medium ${
                            isRTL ? "mr-auto" : "ml-auto"
                          }`}
                        >
                          {jobPosters.length} {t("jobs") || "Jobs"}
                        </div>
                      </div>
                      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isRTL ? "rtl" : ""}`}>
                        {paginatedList.map((u) => (
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
                    </section>
                  ) : (
                    <div className="text-center py-16">
                      <div className="text-gray-400 text-6xl mb-4">🔍</div>
                      <p className="text-xl text-gray-500 mb-2">
                        {t("no_job_posters_found") || "No job posters found"}
                      </p>
                    </div>
                  )}
                </>
              )}

              {activeSubFilter === "service_providers" && (
                <>
                  {paginatedList.length > 0 ? (
                    <section className="mb-12">
                      <div className={`flex items-center mb-6 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div className="bg-blue-500 p-2 rounded-lg mr-3">
                          <span className="text-white font-bold text-sm">🛠️</span>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">
                            {t("service_providers") || "Service Providers"}
                          </h2>
                          <p className="text-gray-600 text-sm">
                            {t("browse_available_services") || "Browse available services from freelancers"}
                          </p>
                        </div>
                        <div
                          className={`bg-blue-100 px-3 py-1 rounded-full text-blue-600 text-sm font-medium ${
                            isRTL ? "mr-auto" : "ml-auto"
                          }`}
                        >
                          {serviceProviders.length} {t("services") || "Services"}
                        </div>
                      </div>
                      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isRTL ? "rtl" : ""}`}>
                        {paginatedList.map((u) => (
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
                    </section>
                  ) : (
                    <div className="text-center py-16">
                      <div className="text-gray-400 text-6xl mb-4">🔍</div>
                      <p className="text-xl text-gray-500 mb-2">
                        {t("no_service_providers_found") || "No service providers found"}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Pagination for sub-filtered content */}
              {localTotalPages > 1 && (
                <div className={`flex justify-center mt-10 gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                  >
                    {t("prev") || "Prev"}
                  </button>
                  <span className="py-2 px-4 bg-white rounded border">
                    {t("page")} {page} / {localTotalPages}
                  </span>
                  <button
                    disabled={page === localTotalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                  >
                    {t("next") || "Next"}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )
    }

    // 3. Generic grid + pagination for all other filters (non-seller 'all', or 'jobs', 'gigs')
    return (
      <>
        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-16">
            <div className="text-red-500 text-xl mb-2">⚠️ Error</div>
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Results */}
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

        {/* Empty */}
        {!loading && !error && users.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-500 mb-2">{t("no_results") || "No results found"}</p>
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
            setFilter(f as DiscoverFilter)
            setPage(1)
            // Reset sub-filter to default when main filter changes to 'all'
            if (f === "all" && authUser?.account_type === "seller") {
              setActiveSubFilter("job_posters")
            }
          }}
          authUserType={authUser?.account_type}
          categories={categories}
          isRTL={isRTL}
          tabs={[
            { id: "all", label: t("all_people") || "All People" },
            { id: "gigs", label: t("service_providers") || "Service Providers" },
            { id: "jobs", label: t("job_posters") || "Job Posters" },
          ]}
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

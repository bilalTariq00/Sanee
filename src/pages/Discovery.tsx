"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import SearchBar from "@/components/SearchBar";
import UserCard from "@/components/UserCard";
import UserProfileDialog from "@/components/UserProfileDialog";
import type { User } from "@/types/User";
import { useDiscover } from "@/hooks/useDiscover";
import axios from "axios";
import config from "@/config";
import AllGigs from "./AllGigs";
import { useNavigate } from "react-router-dom";

interface Category {
  id: string;
  name: string;
}

export default function Discover() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [jssData, setJssData] = useState<any>(null); // State to store JSS data
  const [projects, setProjects] = useState<any[]>([]); // State to store projects
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userType] = useState<"buyer" | "seller">("seller");

  const token = localStorage.getItem("token");

  // Fetch categories using your existing config
  useEffect(() => {
    const language = i18n.language.startsWith("ar") ? "ar" : "en";
    axios.get(`${config.API_BASE_URL}/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": language,      // ← send the locale here
      },
    })
      .then((res) => setCategories(res.data))
      .catch((err) => {
        console.error("Failed to fetch categories:", err);
        // Set some default categories if API fails
        setCategories([
        { id: "1", name: language === "ar" ? "تطوير الويب" : "Web Development" },
        { id: "2", name: language === "ar" ? "الصوت" : "Audio" },
        { id: "3", name: language === "ar" ? "الفيديو" : "Video" },
        { id: "4", name: language === "ar" ? "التصميم الجرافيكي" : "Graphic Design" },
      ]);
      });
  }, [token]);

  useEffect(() => {
    const dir = isRTL ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", i18n.language);
  }, [i18n.language, isRTL]);

  const adjustedFilter =
    filter === "people"
      ? userType === "buyer"
        ? "buyerpeople"
        : "sellerpeople"
      : filter === "all" || filter === "seller" || filter === "buyer"
      ? filter
      : `category:${filter}`;

  const { users, loading, error, totalPages } = useDiscover(adjustedFilter, search, page);
  const displayUsers = users.filter(
    (u) =>
      userType === "seller"
        ? u.badge === "Gig"
        : userType === "buyer"
        ? u.badge === "Job"
        : true
  );

  const goToChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedId) return; // guard in case it's still null
    navigate(`/messages/${selectedId}`);
  };

  useEffect(() => {
    if (!user?.uid) return;

    const fetchJssData = async () => {
      try {
        const response = await axios.get(`${config.API_BASE_URL}/users/${user?.uid}/jss`);
        const jssData = response.data?.data?.jss;
        setJssData(jssData);

        // Assuming JSS data has a list of projects
        const projects = jssData?.projects || []; // Modify based on actual API response structure
        setProjects(projects);
      } catch (error) {
        console.error("Error fetching JSS data", error);
        setJssData(null);
      }
    };

    fetchJssData();
  }, [user]);

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? "text-right" : "text-left"}`}>
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className={`text-4xl font-bold mb-6 text-center ${isRTL ? "text-red-600" : "text-red-500"}`}>
          {t("discover")}
        </h1>

        <SearchBar
          searchTerm={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          activeFilter={filter}
          onFilterChange={(f) => {
            setFilter(f);
            setPage(1);
          }}
          userType={userType}
          categories={categories}
          isRTL={isRTL}
        />

        {filter === "gigs" ? (
          <AllGigs />
        ) : (
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
          </>
        )}

        {!loading && !error && users.length > 0 && (
          <>
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isRTL ? "rtl" : ""}`}>
              {displayUsers.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  onUserClick={() => {
                    setSelected(u);
                    setSelectedId(u.uid); // store uid here
                    setOpen(true);
                  }}
                   userType={userType} // Pass the userType prop here
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

      {/* Display Projects */}
      {jssData && jssData.projects  (
        <div>
          <h3 className="text-2xl font-semibold">Projects</h3>
          <ul className="mt-4 space-y-4">
            {projects.map((project: any, index: number) => (
              <li key={index} className="bg-white p-4 rounded-lg shadow-md">
                <h4 className="text-lg font-bold">{project.title}</h4>
                <p>{project.description}</p>
                {/* Display other project details here */}
              </li>
            ))}
          </ul>
        </div>
      ) }

      <UserProfileDialog
        user={selected}
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setSelected(null);
          setSelectedId(null);
        }}
        gotoChat={goToChat} // pass the corrected handler
      />
    </div>
  );
}

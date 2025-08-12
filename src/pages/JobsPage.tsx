"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import config from "../config"
import { useAuth } from "../contexts/AuthContext"
import { Clock, Building } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

interface Job {
  id: number
  title: string
  description: string
  budget: string
  status: string
  skills: string[]
  created_at: string
  category: { id: string; name: string } // Ensure category has id
  subcategory: { id: string; name: string } // Ensure subcategory has id
  buyer?: {
    id: number
    uid: string
    first_name: string
    last_name: string
    image?: string
  }
}

interface JobsPageProps {
  searchQuery: string
  activeCategory: string // New prop
}

export default function JobsPage({ searchQuery, activeCategory }: JobsPageProps) {
  const { t,i18n } = useTranslation()
const isRTL = i18n.language === "ar"
  const { user } = useAuth()
  const navigate = useNavigate()
  const [allJobs, setAllJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [savedJobIds, setSavedJobIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [skillsList, setSkillsList] = useState<string[]>([])

  // Fetch jobs + saved jobs
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const params: { search?: string; category_id?: string } = {}
        if (searchQuery) {
          params.search = searchQuery
        }
        if (activeCategory && activeCategory !== "all") {
          params.category_id = activeCategory
        }

        console.log("JobsPage API Request Params:", params) // Log params

        const [jobsRes, savedRes] = await Promise.all([
          axios.get(`${config.API_BASE_URL}/all-jobs`, {
            headers: { Authorization: `Bearer ${token}` },
            params: params, // Pass params here
          }),
          axios.get(`${config.API_BASE_URL}/saved-jobs`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        // Extract jobs array
        const jobsData: Job[] = Array.isArray(jobsRes.data?.data?.jobs) ? jobsRes.data.data.jobs : []
     const normalizedJobs = jobsData.map((job) => ({
  ...job,
  skills: Array.isArray(job.skills)
    ? job.skills
    : job.skills?.[i18n.language] || []
}));
        setAllJobs(normalizedJobs)

        // Extract saved job IDs
        const savedArr: any[] = Array.isArray(savedRes.data?.data?.saved_jobs) ? savedRes.data.data.saved_jobs : []
        const ids = savedArr.map((item) => item.job.id)
        setSavedJobIds(ids)

        // Build unique skills list
        const uniqueSkills = Array.from(new Set(jobsData.flatMap((j) => j.skills)))
        setSkillsList(uniqueSkills)
      } catch (err) {
        console.error("Error fetching jobs or saved jobs", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [searchQuery, activeCategory]) // Add activeCategory to dependencies

  // Filter by searchQuery (now redundant as API handles filtering)
  useEffect(() => {
    setFilteredJobs(allJobs) // allJobs is already filtered by category and search from API
  }, [searchQuery, allJobs])

  // Toggle save/unsave
  const toggleSave = async (jobId: number) => {
    const token = localStorage.getItem("token")
    if (!token) return
    const isCurrentlySaved = savedJobIds.includes(jobId)

    // Optimistic update
    setSavedJobIds((ids) => (isCurrentlySaved ? ids.filter((id) => id !== jobId) : [...ids, jobId]))
    try {
      await axios.post(
        `${config.API_BASE_URL}/saved-jobs/toggle`,
        { job_id: jobId },
        { headers: { Authorization: `Bearer ${token}` } },
      )
    } catch (err) {
      console.error("Toggle save failed, reverting UI", err)
      // Revert on error
      setSavedJobIds((ids) => (isCurrentlySaved ? [...ids, jobId] : ids.filter((id) => id !== jobId)))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("all_jobs")}</h1>
          {user?.account_type === "buyer" && (
            <button
              onClick={() => navigate("/post-job")}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
            >
              {t("post_a_job")}
            </button>
          )}
        </div>
        {/* Jobs List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center text-gray-500">{t("loading_jobs")}</div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center text-gray-500">{t("no_jobs_found")}</div>
          ) : (
            filteredJobs.map((job) => {
              const isSaved = savedJobIds.includes(job.id)
              return (
                <div key={job.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      {/* Title & Employer */}
                      <div className="flex justify-between items-start">
                        <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                        {job.buyer && (
                          <Link
                            to={`/profile/${job.buyer.uid}`}
                            className="inline-flex items-center text-sm text-red-500 hover:text-red-600"
                          >
                            <Building className="h-4 w-4 mr-1" />
                            {t("view_employer_profile")}
                          </Link>
                        )}
                      </div>
                      <p className="mt-2 text-gray-600">{job.description}</p>
                      {/* Budget & Date */}
                      <div className="mt-4 flex flex-wrap gap-4 text-gray-500">
                       <div
  className={`flex items-center text-gray-700 ${
    isRTL ? "flex-row-reverse space-x-reverse space-x-1" : "space-x-1"
  }`}
>
  <img src="/riyal.svg" className="h-5 w-5" alt="Budget" />
  <span className="font-medium">{job.budget}</span>
</div>

                        <div  className={`flex items-center text-gray-700 ${
    isRTL ? "flex-row-reverse space-x-reverse space-x-1" : "space-x-1"
  }`}>
                          <Clock className="h-5 w-5 mr-1" />
                          {new Date(job.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {/* Skills */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <div className="mt-4">
                          <h3 className="text-sm font-medium text-gray-900 mb-2">{t("skills")}</h3>
                          <div className="flex flex-wrap gap-2">
                            {job.skills.map((skill) => (
                              <span
                                key={skill}
                                className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        {job.category && (
                          <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">{t("category")}</h3>
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {job.category.name}
                              </span>
                            </div>
                          </div>
                        )}
                        {job.subcategory && (
                          <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">{t("subcategory")}</h3>
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {job.subcategory.name}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Actions */}
                      <div className="mt-6 flex space-x-4">
                        <Link
                          to={`/jobs/${job.id}`}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          {t("view_details")}
                        </Link>
                        <button
                          onClick={() => toggleSave(job.id)}
                          className={`px-4 py-2 rounded-lg transition-all ${
                            isSaved
                              ? "bg-gray-100 text-red-600 hover:bg-gray-200"
                              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {isSaved ? t("unsave_job") : t("save_job")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Clock, MapPin, Briefcase, Eye, ArrowRight } from 'lucide-react';
import axios from 'axios';
import config from '../config';
import { useTranslation } from 'react-i18next';

export default function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
   const { t,i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';
    const lang = i18n.language || "en";

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
   const [savedJobIds, setSavedJobIds] = useState<number[]>([])

  useEffect(() => {
   const fetchJob = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(
      `${config.API_BASE_URL}/jobs/${id}`,
      { headers: { Authorization: `Bearer ${token}` ,
    'X-Language': lang} }
    );
    // make sure the top-level `success` is true, and data exists
    if (res.data?.success && res.data.data) {
      setJob(res.data.data);
    } else {
      setError(t('job_not_found'));
    }
  } catch (err) {
    console.error('❌ Error fetching job:', err);
    setError(t('job_load_failed'));
  } finally {
    setLoading(false);
  }
};

    fetchJob();
  }, [id, t]);

   const toggleSave = async () => {
  if (!job) return
  const token = localStorage.getItem('token')
  if (!token) return

  // flip locally
  setJob(prev => prev && ({ ...prev, is_saved: !prev.is_saved }))

  try {
    await axios.post(
      `${config.API_BASE_URL}/saved-jobs/toggle`,
      { job_id: job.id },
      { headers: { Authorization: `Bearer ${token}` } }
    )
  } catch (err) {
    console.error('Toggle save failed, reverting UI', err)
    // revert
    setJob(prev => prev && ({ ...prev, is_saved: !prev.is_saved }))
  }
}
const isSaved = Boolean(job?.is_saved)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">{t('loading_job_details')}</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">{t('job_not_found')}</h2>
            <p className="mt-2 text-gray-600">{t('job_not_found_subtext')}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600"
            >
             {isArabic ?<ArrowRight className="w-4 h-4" />:<ArrowLeft className="w-4 h-4" />}
              {t('go_back')}
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          {isArabic ?<ArrowRight className="w-4 h-4" />:<ArrowLeft className="w-4 h-4" />}
          {t('back')}
        </button>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start space-x-4">
            <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 font-bold m-5">
              {job.title?.charAt(0)?.toUpperCase() || 'J'}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between ">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                  {/* <div className="text-sm text-gray-600 mt-1">
                    {job.experience_level?.toUpperCase() || 'N/A'} • {job.visibility?.toUpperCase() || 'PUBLIC'}
                  </div> */}
                </div>

              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
  {job.location_type
    ? t(job.location_type.toLowerCase().replace(/\s+/g, '_'))
    : t('remote')}
</span>

              </div>

              <p className="mt-4 text-gray-600">{job.description}</p>

              <div className="mt-6 flex flex-wrap gap-4">
                <div className="flex items-center text-gray-500">
                 <img src='/riyal.svg' className="h-5 w-5 mr-1" />
                  {job.budget}
                </div>
                <div className="flex items-center text-gray-500">
                  <Clock className="h-5 w-5 mr-1" />
                  {new Date(job.created_at).toLocaleDateString()}
                </div>
                {/* <div className="flex items-center text-gray-500">
                  <Briefcase className="h-5 w-5 mr-1" />
                  {job.experience_level || t('not_specified')}
                </div> */}
                {/* <div className="flex items-center text-gray-500">
                  <Eye className="h-5 w-5 mr-1" />
                  {job.status || t('status_unknown')}
                </div> */}
              </div>

              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900">{t('skills_required')}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
  {Array.isArray(job.skills)
    ? job.skills.map((skill: string, idx: number) => (
        <span
          key={idx}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
        >
          {skill}
        </span>
      ))
    : (job.skills?.[lang] || []).map((skill: string, idx: number) => (
        <span
          key={idx}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
        >
          {skill}
        </span>
      ))
  }
  {(!job.skills || 
    (Array.isArray(job.skills) && job.skills.length === 0) || 
    (!Array.isArray(job.skills) && (!job.skills?.[lang] || job.skills[lang].length === 0))) && (
      <span className="text-sm text-gray-500">{t('no_skills_listed')}</span>
  )}
</div>

              </div>

              <div className="mt-8 flex space-x-4 gap-2">
                <button
                  onClick={() => navigate(`/job/${id}/applicants`)}
                  className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
                >
                  {t('apply_now')}
                </button>

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
      </main>
    </div>
  );
}

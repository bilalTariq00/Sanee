import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Job {
  id: number;
  title: string;
  description: string;
  budget: string;
  skills: string[];
  created_at: string;
  buyer?: { first_name: string; last_name: string; uid: string };
}

export default function SavedJobsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchSaved = async () => {
    const token = localStorage.getItem('token');
    if (!token) return setLoading(false);

    try {
      const res = await axios.get(
        `${config.API_BASE_URL}/saved-jobs`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 1️⃣ Grab the saved_jobs array
      const savedItems: any[] = Array.isArray(res.data?.data?.saved_jobs)
        ? res.data.data.saved_jobs
        : [];

      // 2️⃣ Pull out the inner `job` object
      const jobs = savedItems.map(item => item.job);

      setSavedJobs(jobs);
    } catch (err) {
      console.error('Failed to fetch saved jobs:', err);
    } finally {
      setLoading(false);
    }
  };
  fetchSaved();
}, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">
          {t('your_saved_jobs')}
        </h1>
        {loading ? (
          <div className="text-center text-gray-500">
            {t('loading_jobs')}
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="text-center text-gray-500">
            {t('no_saved_jobs')}
          </div>
        ) : (
          <div className="space-y-6">
            {savedJobs.map(job => (
              <div
                key={job.id}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {job.title}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {job.buyer
                        ? `${job.buyer.first_name} ${job.buyer.last_name}`
                        : t('anonymous_employer')}
                    </p>
                  </div>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="text-red-500 hover:text-red-600"
                  >
                    {t('view_details')}
                  </Link>
                </div>

                <p className="mt-2 text-gray-600">
                  {job.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-4 text-gray-500">
                  <div className="flex items-center">
                    <img
                      src="/riyal.svg"
                      className="h-5 w-5 mr-1"
                    />
                    {job.budget}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-1" />
                    {new Date(
                      job.created_at
                    ).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';
import { Search, DollarSign, Clock, Building } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useTranslation } from 'react-i18next';

interface Job {
  id: number;
  title: string;
  description: string;
  budget: string;
  status: string;
  skills: string[];
  created_at: string;
  employer?: {
    id: string;
    name: string;
    image?: string;
  };
}

export default function JobsPage() {
  const { t } = useTranslation();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [skillsFilter, setSkillsFilter] = useState('__all__');
  const [skillsList, setSkillsList] = useState<string[]>([]);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [searchQuery, skillsFilter, allJobs]);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await axios.get(`${config.API_BASE_URL}/all-jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const jobs = Array.isArray(res.data) ? res.data : [];
      setAllJobs(jobs);

      const uniqueSkills = [...new Set(jobs.flatMap((job) => job.skills || []))];
      setSkillsList(uniqueSkills);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...allJobs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((job) =>
        job.title.toLowerCase().includes(q)
      );
    }

    if (skillsFilter !== '__all__') {
      filtered = filtered.filter((job) =>
        job.skills?.includes(skillsFilter)
      );
    }

    setFilteredJobs(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('available_jobs')}</h1>
          {user?.account_type === 'buyer' && (
            <button
              onClick={() => navigate('/post-job')}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
            >
              {t('post_a_job')}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('search_jobs') || 'Search jobs...'}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={skillsFilter} onValueChange={setSkillsFilter}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder={t('all_skills')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t('all_skills')}</SelectItem>
              {skillsList.map((skill) => (
                <SelectItem key={skill} value={skill}>
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Job Listings */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center text-gray-500">{t('loading_jobs')}</div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center text-gray-500">{t('no_jobs_found')}</div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                        <div className="flex items-center space-x-2">
                          <p className="text-gray-600">{job.employer?.name || t('anonymous_employer')}</p>
                          {job.employer?.id && (
                            <Link
                              to={`/organization/${job.employer.id}`}
                              className="inline-flex items-center text-sm text-red-500 hover:text-red-600"
                            >
                              <Building className="h-4 w-4 mr-1" />
                              {t('view_organization')}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="mt-2 text-gray-600">{job.description}</p>

                    <div className="mt-4 flex flex-wrap gap-4 text-gray-500">
                      <div className="flex items-center">
<img src='/dist/assets/riyal.svg' className="h-5 w-5 mr-1" />
                        {job.budget}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 mr-1" />
                        {new Date(job.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">{t('skills')}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.skills?.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex space-x-4">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        {t('view_details')}
                      </Link>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        {t('save_job')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
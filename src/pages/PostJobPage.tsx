import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
  skills: string[];
}

export default function PostJobPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    experience_level: 'entry',
    visibility: 'public',
    location_type: 'remote',
    category_id: '',
    sub_category_id: '',
    skills: [] as string[]
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.account_type !== 'buyer') {
      navigate('/jobs');
      return;
    }
    fetchCategories();
  }, [user, navigate]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_BASE_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data.data.categories);
    } catch {
      setError(t('error_fetch_categories'));
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/categories/${categoryId}/subcategories`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      // assuming the shape is { success: true, data: { subcategories: SubCategory[] } }
      setSubcategories(response.data.data.subcategories);
    } catch {
      setError(t('error_fetch_subcategories'));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'category_id') {
      setFormData(prev => ({ ...prev, category_id: value, sub_category_id: '' }));
      fetchSubcategories(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t('error_login_required'));
        navigate('/login');
        return;
      }

      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'skills') {
          (value as string[]).forEach(skill => data.append('skills[]', skill.trim()));
        } else {
          data.append(key, value as string);
        }
      });

      const response = await axios.post(`${config.API_BASE_URL}/buyer/jobs`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data) {
        toast(t('job_posted_success'));
        setFormData({ title: '', description: '', budget: '', experience_level: 'entry', visibility: 'public', location_type: 'remote', category_id: '', sub_category_id: '', skills: [] });
        navigate('/');
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError(t('error_no_permission'));
      } else {
        setError(t('error_generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.account_type !== 'buyer') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5 mr-2" /> {t('back') || 'Back'}
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{t('post_job_title')}</h1>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('basic_information') || 'Basic Information'}
            </h2>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={t('title_placeholder') || 'Job Title *'}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder={t('description_placeholder') || 'Job Description *'}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  required
                />
              </div>
              <div>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder={t('budget_placeholder') || 'Budget (USD) *'}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Category & Subcategory */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('category_section') || 'Category'}
            </h2>
            <div className="space-y-4">
              <Select
                value={formData.category_id}
                onValueChange={(val) => {
                  setFormData(prev => ({
                    ...prev,
                    category_id: val,
                    sub_category_id: '',
                    skills: []
                  }));
                  fetchSubcategories(val);
                }}
              >
                <SelectTrigger className="w-full border border-gray-300 focus:ring-2 focus:ring-red-500">
                <SelectValue>
                  {categories.find(c => String(c.id) === formData.category_id)?.name
                  ?? t('select_category')}
                 </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {subcategories.length > 0 && (
                <Select
                  value={formData.sub_category_id}
                  onValueChange={(val) => {
                    setFormData(prev => ({ ...prev, sub_category_id: val, skills: [] }));
                  }}
                >
                  <SelectTrigger className="w-full border border-gray-300 focus:ring-2 focus:ring-red-500">
                 {subcategories.find(c => String(c.id) === formData.sub_category_id)?.name
                  ?? t('select_sub_category')}
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map(sub => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Skills Section */}
          {formData.sub_category_id && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('skills_section') || 'Required Skills'}
              </h2>
              <div className="space-y-4">
                {/* Selected skills display */}
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map(skill => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-50 text-red-600"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() =>
                            setFormData(prev => ({
                              ...prev,
                              skills: prev.skills.filter(s => s !== skill)
                            }))
                          }
                          className="ml-2 text-red-500 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Skills dropdown */}
                <div className="flex gap-2">
                  <Select
                    value=""
                    onValueChange={(val) => {
                      if (val && !formData.skills.includes(val)) {
                        setFormData(prev => ({
                          ...prev,
                          skills: [...prev.skills, val]
                        }))
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1 border border-gray-300 focus:ring-2 focus:ring-red-500">
                      <SelectValue placeholder={t('choose_skill') || 'Choose a skill'} />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const chosen = subcategories.find(s => String(s.id) === formData.sub_category_id)
                        return chosen
                          ? chosen.skills.map(skill => (
                              <SelectItem key={skill} value={skill}>
                                {skill}
                              </SelectItem>
                            ))
                          : null
                      })()}
                    </SelectContent>
                  </Select>
                
                </div>
              </div>
            </div>
          )}

          {/* Job Details */}
       <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
  <h2 className="text-xl font-semibold text-gray-900 mb-4">
    {t('job_details') || 'Job Details'}
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Experience Level */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('experience_level') || 'Experience Level'}
      </label>
      <Select
        value={formData.experience_level}
        onValueChange={(val) =>
          setFormData((p) => ({ ...p, experience_level: val }))
        }
      >
        <SelectTrigger className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
          <SelectValue placeholder={t('select_option')!} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="entry">{t('entry') || 'Entry Level'}</SelectItem>
          <SelectItem value="intermediate">
            {t('intermediate') || 'Intermediate'}
          </SelectItem>
          <SelectItem value="expert">{t('expert') || 'Expert'}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Visibility */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('visibility') || 'Visibility'}
      </label>
      <Select
        value={formData.visibility}
        onValueChange={(val) =>
          setFormData((p) => ({ ...p, visibility: val }))
        }
      >
        <SelectTrigger className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
          <SelectValue placeholder={t('select_option')!} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="public">{t('public') || 'Public'}</SelectItem>
          <SelectItem value="private">{t('private') || 'Private'}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Location Type */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('location_type') || 'Location Type'}
      </label>
      <Select
        value={formData.location_type}
        onValueChange={(val) =>
          setFormData((p) => ({ ...p, location_type: val }))
        }
      >
        <SelectTrigger className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
          <SelectValue placeholder={t('select_option')!} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="remote">{t('remote') || 'Remote'}</SelectItem>
          <SelectItem value="onsite">{t('onsite') || 'On-site'}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</div>


          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (t('posting') || 'Posting...') : (t('post_job') || 'Post Job')}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
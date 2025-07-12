import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
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
    skills: ''
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
          value.split(',').forEach(skill => data.append('skills[]', skill.trim()));
        } else {
          data.append(key, value);
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
        setFormData({ title: '', description: '', budget: '', experience_level: 'entry', visibility: 'public', location_type: 'remote', category_id: '', sub_category_id: '', skills: '' });
        navigate('/jobs');
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
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('post_job_title')}</h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {['title', 'budget', 'skills'].map(field => (
              <div key={field}>
                <label htmlFor={field} className="block text-sm font-medium text-gray-700">
                  {t(field)}<span className="text-red-500">*</span>
                </label>
                <input
                  type={field === 'budget' ? 'number' : 'text'}
                  id={field}
                  name={field}
                  required
                  value={(formData as any)[field]}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder={t(`${field}_placeholder`)}
                />
              </div>
            ))}

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">{t('description')}<span className="text-red-500">*</span></label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder={t('description_placeholder')}
              />
            </div>

            {[{ name: 'category_id', label: 'category', options: categories }, { name: 'sub_category_id', label: 'subcategory', options: subcategories }].map(({ name, label, options }) => (
              <div key={name}>
                <label htmlFor={name} className="block text-sm font-medium text-gray-700">{t(label)}<span className="text-red-500">*</span></label>
                <select
                  id={name}
                  name={name}
                  required
                  value={(formData as any)[name]}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">{t('select_option')}</option>
               {Array.isArray(options)
  ? options.map(option => (
      <option key={option.id} value={option.id}>
        {option.name}
      </option>
    )):null}
                </select>
              </div>
            ))}

            {[{ name: 'experience_level', options: ['entry', 'intermediate', 'expert'] }, { name: 'visibility', options: ['public', 'private'] }, { name: 'location_type', options: ['remote', 'onsite'] }].map(({ name, options }) => (
              <div key={name}>
                <label htmlFor={name} className="block text-sm font-medium text-gray-700">{t(name)}</label>
                <select
                  id={name}
                  name={name}
                  required
                  value={(formData as any)[name]}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500"
                >
                  {options.map(option => (
                    <option key={option} value={option}>{t(option)}</option>
                  ))}
                </select>
              </div>
            ))}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/jobs')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading ? t('posting') : t('post_job')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

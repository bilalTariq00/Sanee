import React, { useState, useRef } from 'react';
import { Eye, EyeOff, Upload, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../config';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function SignupForm() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    account_type: 'seller',
    headline: '',
    summary: ''
  });

  const [image, setImage] = useState<File | null>(null);
  const [govCertificate, setGovCertificate] = useState<File | null>(null);
  const [imageError, setImageError] = useState('');
  const [certificateError, setCertificateError] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    const file = files?.[0];
    if (!file) return;

    if (name === 'image') {
      if (!file.type.startsWith('image/')) {
        setImageError(t('signup.errors.imageInvalid'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageError(t('signup.errors.imageTooBig'));
        return;
      }
      setImage(file);
      setImageError('');
    }

    if (name === 'gov_certificate') {
      if (!(file.type === 'application/pdf' || file.type.startsWith('image/'))) {
        setCertificateError(t('signup.errors.certificateInvalid'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setCertificateError(t('signup.errors.certificateTooBig'));
        return;
      }
      setGovCertificate(file);
      setCertificateError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { first_name, last_name, email, username, password, account_type } = formData;

    if (!first_name || !last_name || !email || !username || !password) {
      setError(t('signup.errors.fillAll'));
      return;
    }

    if (account_type === 'seller' && !govCertificate) {
      setCertificateError(t('signup.errors.certificateRequired'));
      return;
    }

    if (imageError || certificateError) {
      setError(t('signup.errors.fixFileErrors'));
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (image) data.append('image', image);
    if (govCertificate) data.append('gov_certificate', govCertificate);

    try {
      await axios.post(`${config.API_BASE_URL}/register`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/login');
    } catch (err: any) {
      console.error('Registration Error:', err.response?.data || err.message);
      setError(t('signup.errors.registrationFailed'));
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data ||
        err.message ||
        t('signup.errors.unexpected');
      toast.error(serverMsg);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit} encType="multipart/form-data">
      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
            {t('signup.firstName')} *
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            required
            value={formData.first_name}
            onChange={handleChange}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
            {t('signup.lastName')} *
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            required
            value={formData.last_name}
            onChange={handleChange}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          {t('signup.email')} *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
        />
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          {t('signup.username')} *
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          value={formData.username}
          onChange={handleChange}
          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          {t('signup.password')} *
        </label>
        <div className="mt-1 relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.password}
            onChange={handleChange}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t('signup.accountType')} *
        </label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setFormData({ ...formData, account_type: 'seller' });
              setCertificateError('');
            }}
            className={`px-3 py-2 border rounded-md text-sm font-medium ${
              formData.account_type === 'seller'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('signup.creator')}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormData({ ...formData, account_type: 'buyer' });
              setCertificateError('');
            }}
            className={`px-3 py-2 border rounded-md text-sm font-medium ${
              formData.account_type === 'buyer'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('signup.business')}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="headline" className="block text-sm font-medium text-gray-700">
          {t('signup.headline')}
        </label>
        <input
          id="headline"
          name="headline"
          type="text"
          value={formData.headline}
          onChange={handleChange}
          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
        />
      </div>

      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
          {t('signup.summary')}
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={3}
          value={formData.summary}
          onChange={handleChange}
          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t('signup.profileImage')}
        </label>
        <div
          className={`border-2 border-dashed rounded-md p-4 cursor-pointer hover:border-red-500 transition-colors ${
            imageError ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" name="image" onChange={handleFileChange} />
          <div className="flex items-center justify-center">
            {image ? (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Upload className="h-5 w-5 text-gray-400" />
                <span>{image.name}</span>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-1 text-sm text-gray-500">{t('signup.uploadProfileHint')}</p>
              </div>
            )}
          </div>
        </div>
        {imageError && (
          <div className="mt-1 flex items-center text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            {imageError}
          </div>
        )}
      </div>

      {formData.account_type === 'seller' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t('signup.govCertificate')} <span className="text-red-500">*</span>
          </label>
          <div
            className={`border-2 border-dashed rounded-md p-4 cursor-pointer hover:border-red-500 transition-colors ${
              certificateError ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            onClick={() => certInputRef.current?.click()}
          >
            <input type="file" name="gov_certificate" ref={certInputRef} className="hidden" accept=".pdf,image/*" onChange={handleFileChange} required />
            <div className="flex items-center justify-center">
              {govCertificate ? (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span>{govCertificate.name}</span>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-1 text-sm text-gray-500">{t('signup.uploadCertHint')}</p>
                </div>
              )}
            </div>
          </div>
          {certificateError && (
            <div className="mt-1 flex items-center text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {certificateError}
            </div>
          )}
        </div>
      )}

      <div>
        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
          {t('signup.createAccount')}
        </button>
      </div>

      <div className="text-sm text-center">
        <span className="text-gray-600">{t('signup.alreadyHaveAccount')}</span>{' '}
        <Link to="/login" className="font-medium text-red-500 hover:text-red-600">
          {t('signup.signin')}
        </Link>
      </div>
    </form>
  );
}

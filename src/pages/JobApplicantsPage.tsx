import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import config from '../config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function JobApplicantsPage() {
  const { t } = useTranslation();
  const { jobId } = useParams<{jobId: string}>();
  const navigate = useNavigate();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gigs, setGigs] = useState<any[]>([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [price, setPrice] = useState('');
  const [deadline, setDeadline] = useState('');
  const [duration, setDuration] = useState('less than 1 month');
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [selectedGig, setSelectedGig] = useState('');
  const [applied, setApplied] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchJob();
    fetchGigs();
  }, []);

  const fetchJob = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJob(res.data.data);
    } catch {
      toast.error(t('job_load_failed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchGigs = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/seller/gigs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGigs(res.data.data || res.data);
    } catch {
      toast.error(t('gigs_load_failed'));
    }
  };

  const handleApply = async () => {
    // ... your validation logic ...
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">{t('loading_job')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Back & Title */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('back')}
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{job?.title}</h1>
        </div>

        {/* Job Description */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('job_details')}</h2>
          <p className="text-gray-700">{job?.description}</p>
        </div>

        {/* Already Applied Banner */}
        {applied && (
          <div className="bg-green-100 border border-green-300 text-green-700 rounded-lg p-4">
            {t('already_applied')}
          </div>
        )}

        {/* Application Form */}
        {!applied && (
          <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleApply(); }}>

            {/* Cover Letter */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('cover_letter')}</h2>
              <Textarea
                placeholder={t('write_message')}
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                required
                className="w-full"
              />
            </div>

            {/* Deadline & Duration */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('project_timing')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">{t('deadline')}</label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">{t('project_duration')}</label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('select_duration')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="less than 1 month">{t('less_than_1_month')}</SelectItem>
                      <SelectItem value="1 to 3 months">{t('one_to_three_months')}</SelectItem>
                      <SelectItem value="3 to 6 months">{t('three_to_six_months')}</SelectItem>
                      <SelectItem value="more than 6 months">{t('more_than_six_months')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Select Gig */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('select_gig')}</h2>
              <Select value={selectedGig} onValueChange={setSelectedGig}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('select_a_gig')} />
                </SelectTrigger>
                <SelectContent>
                  {gigs.map(g => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price & Attachments */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('pricing_attachments')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">{t('price')}</label>
                  <Input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder={t('enter_price')}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">{t('attachments')}</label>
                  <Input
                    type="file"
                    multiple
                    onChange={e => setAttachments(e.target.files)}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <Button type="submit" className="bg-red-500 hover:bg-red-600 text-white">
                {t('submit_proposal')}
              </Button>
            </div>

          </form>
        )}
      </main>
    </div>
  );
}

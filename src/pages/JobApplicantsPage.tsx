"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import config from '../config';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function JobApplicantsPage() {
  const { t,i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gigs, setGigs] = useState<any[]>([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [price, setPrice] = useState('');
  const [deadline, setDeadline] = useState('');
  const [duration, setDuration] = useState('less than 1 month');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedGig, setSelectedGig] = useState<string>('');
  const [applied, setApplied] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchJob();
    fetchGigs();
  }, []);

  const fetchJob = async () => {
    try {
      const res = await axios.get(
        `${config.API_BASE_URL}/jobs/${jobId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJob(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to load job:", err);
      toast.error(t('job_load_failed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchGigs = async () => {
    try {
      const res = await axios.get(
        `${config.API_BASE_URL}/seller/gigs`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGigs(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to fetch gigs:", err);
      toast.error(t('gigs_load_failed'));
    }
  };

  const handleApply = async () => {
    if (!coverLetter.trim()) {
      return Swal.fire(t('missing_field'), t('cover_letter_required'), 'warning');
    }
    if (!selectedGig) {
      return Swal.fire(t('missing_field'), t('please_select_gig'), 'warning');
    }
    if (!price || Number(price) <= 0) {
      return Swal.fire(t('missing_field'), t('enter_valid_price'), 'warning');
    }
    if (!deadline) {
      return Swal.fire(t('missing_field'), t('select_deadline'), 'warning');
    }
    if (attachments.length > 10) {
      return Swal.fire(t('too_many_files'), t('upload_limit'), 'warning');
    }
    for (let file of attachments) {
      if (file.size > 25 * 1024 * 1024) {
        return Swal.fire(
          t('file_too_large'),
          `${file.name} ${t('exceeds_limit')}`,
          'warning'
        );
      }
    }

    const formData = new FormData();
    formData.append('cover_letter', coverLetter);
    formData.append('price', price);
    formData.append('deadline', deadline);
    formData.append('duration', duration);
    formData.append('gig_id', selectedGig);
    attachments.forEach((file) => formData.append('attachments[]', file));

    try {
      await axios.post(
        `${config.API_BASE_URL}/jobs/${jobId}/apply`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      Swal.fire(t('success'), t('proposal_submitted'), 'success');
      setApplied(true);
    } catch (err: any) {
      console.error("Apply failed:", err);
      const status = err.response?.status;
      if (status === 429) {
        Swal.fire(t('limit_reached'), t('daily_limit_message'), 'error');
      } else if (status === 409) {
        Swal.fire(t('already_applied_title'), t('already_applied_msg'), 'info');
        setApplied(true);
      } else {
        Swal.fire(t('error'), err.response?.data?.message || err.message, 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">{t('loading_job')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10 max-w-full mx-auto">
      <Button
        onClick={() => navigate(-1)}
        variant="ghost"
        className="flex items-center gap-2 mb-6 text-muted-foreground"
      >
        {isArabic ?<ArrowRight className="w-4 h-4" />:<ArrowLeft className="w-4 h-4" />}
        {t('back')}
      </Button>

      <div className="bg-white rounded-2xl shadow-md p-6 space-y-6 border border-red-200">
        <h2 className="text-2xl font-bold text-red-700">{job?.title}</h2>
        <p className="text-gray-700">{job?.description}</p>

        {applied && (
          <div className="p-3 bg-green-100 text-green-700 rounded-md border border-green-300">
            {t('already_applied')}
          </div>
        )}

        {!applied && (
          <div className={`${isArabic ? "text-right" : "text-left"} space-y-4 `}>
            {/* Cover Letter */}
            <div>
              <label className="block mb-1 text-sm font-medium">{t('cover_letter')}</label>
              <Textarea
                placeholder={t('write_message')}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>

            {/* Deadline */}
          <div>
  <label className="block mb-1 text-sm font-medium">{t('deadline')}</label>
  <Input
    type="date"
    value={deadline}
    onChange={(e) => setDeadline(e.target.value)}
    dir={isArabic ? "rtl" : "ltr"} // flips the calendar icon + value side
    className={isArabic ? "text-right justify-end" : "text-left justify-start"} // start/end effect
  />
</div>



            {/* Duration */}
            <div>
              <label className="block mb-1 text-sm font-medium">{t('project_duration')}</label>
             <Select value={duration} onValueChange={setDuration}>
  <SelectTrigger
    dir={isArabic ? "rtl" : "ltr"}
    className={isArabic ? "justify-between text-right" : "justify-between text-left"}
  >
    <SelectValue placeholder={t('select_duration')} />
  </SelectTrigger>
  <SelectContent dir={isArabic ? "rtl" : "ltr"}>
    <SelectItem value="less than 1 month">{t('less_than_1_month')}</SelectItem>
    <SelectItem value="1 to 3 months">{t('one_to_three_months')}</SelectItem>
    <SelectItem value="3 to 6 months">{t('three_to_six_months')}</SelectItem>
    <SelectItem value="more than 6 months">{t('more_than_six_months')}</SelectItem>
  </SelectContent>
</Select>

            </div>

            {/* Select Gig */}
            <div>
              <label className="block mb-1 text-sm font-medium">{t('select_gig')}</label>
             <Select value={selectedGig} onValueChange={setSelectedGig}>
  <SelectTrigger
    dir={isArabic ? "rtl" : "ltr"}
    className={`justify-between ${isArabic ? "text-right" : "text-left"}`}
  >
    <SelectValue placeholder={t('select_a_gig')} />
  </SelectTrigger>
  <SelectContent dir={isArabic ? "rtl" : "ltr"}>
    {gigs.map((gig) => (
      <SelectItem key={gig.id} value={String(gig.id)}>
        {gig.title}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

            </div>

            {/* Price */}
            <div>
              <label className="block mb-1 text-sm font-medium">{t('price')}</label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={t('enter_price')}
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block mb-1 text-sm font-medium">{t('attachments')}</label>
              <Input
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setAttachments(Array.from(e.target.files));
                  }
                }}
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleApply}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {t('submit_proposal')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

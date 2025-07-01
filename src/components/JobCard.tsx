import React from 'react';
import { Clock, CheckCircle, MoreVertical, HourglassIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type JobStatus = 'waiting' | 'in_progress' | 'completed';

interface JobCardProps {
  id: number;
  title: string;
  company: string;
  companyId?: string;
  image: string;
  status: JobStatus;
  assignee?: string;
}

export default function JobCard({ id, title, company, companyId, image, status, assignee }: JobCardProps) {
    const { t } = useTranslation();
  const getStatusDisplay = (status: JobStatus) => {
    switch (status) {
      case 'waiting':
        return {
          text: t('job_card.waiting'),
          icon: HourglassIcon,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50'
        };
      case 'in_progress':
        return {
          text: t('job_card.in_progress'),
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        };
      case 'completed':
        return {
          text: t('job_card.completed'),
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        };
    }
  };
  const statusDisplay = getStatusDisplay(status);
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-100">
      <div className="flex items-start space-x-4">
        {/* <img
          src={image}
          alt={company}
          className="h-12 w-12 rounded-full object-cover"
        /> */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-600">{company}</p>
                {companyId && (
                  <Link
                    to={`/organization/${companyId}`}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                     {t('job_card.view_org')}
                  </Link>
                )}
              </div>
              {assignee && (
                <p className="text-sm text-gray-600 mt-1">  {t('job_card.by_assignee')} {assignee}</p>
              )}
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className={`flex items-center px-3 py-1 rounded-full ${statusDisplay.bgColor} ${statusDisplay.color}`}>
              <StatusIcon className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">{statusDisplay.text}</span>
            </div>
            {status === 'waiting' ? (
              <Link
                to={`/job/${id}/applicants`}
                className="text-red-500 hover:text-red-600 text-sm font-medium"
              >
                {t('job_card.expand_progress')}
              </Link>
            ) : (
              <button
                className="text-red-500 hover:text-red-600 text-sm font-medium"
              >
               {t('job_card.click_to')} {status === 'completed' ? t('job_card.expand_rate') : t('job_card.expand_progress')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
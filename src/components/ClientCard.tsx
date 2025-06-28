import React from 'react';
import { Star, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type JobProps = {
  id: number;
  title: string;
  company: string;
  companyId: string;
  description: string;
  budget: string;
  deadline: string;
  location: string;
  type: string;
  requirements: string[];
  logo: string;
  tags: string[];
};

export default function ClientCard({ job }: { job: JobProps }) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/jobs/${job.id}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-100">
      <div className="flex items-start space-x-4">
        <img
          src={job.logo}
          alt={job.company}
          className="h-16 w-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
              <p className="text-sm text-gray-600">{job.company}</p>
            </div>
            <span className="text-green-600 font-medium">{job.budget}</span>
          </div>

          <p className="mt-2 text-gray-700">{job.description}</p>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {job.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-500">Deadline: {job.deadline}</span>
          </div>

          <div className="mt-4">
            <button
              onClick={handleViewDetails}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
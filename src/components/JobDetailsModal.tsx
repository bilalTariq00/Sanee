import React from 'react';
import { X, DollarSign, Clock, MapPin, Building } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Job {
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
}

interface JobDetailsModalProps {
  job: Job;
  onClose: () => void;
}

export default function JobDetailsModal({ job, onClose }: JobDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={onClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="bg-white p-6">
            <div className="flex items-start space-x-4">
              <img
                src={job.logo}
                alt={job.company}
                className="h-16 w-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-gray-600">{job.company}</span>
                      <Link
                        to={`/organization/${job.companyId}`}
                        className="inline-flex items-center text-sm text-red-500 hover:text-red-600"
                      >
                        <Building className="h-4 w-4 mr-1" />
                        View Organization
                      </Link>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    {job.type}
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
                    {job.deadline}
                  </div>
                  <div className="flex items-center text-gray-500">
                    <MapPin className="h-5 w-5 mr-1" />
                    {job.location}
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900">Requirements:</h2>
                  <ul className="mt-2 space-y-2">
                    {job.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-center text-gray-600">
                        <span className="h-1.5 w-1.5 bg-red-500 rounded-full mr-2"></span>
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 flex space-x-4">
                  <button className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors">
                    Apply Now
                  </button>
                  <button className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    Save Job
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
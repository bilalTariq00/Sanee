import React from 'react';
import { Clock, DollarSign } from 'lucide-react';

type ProjectProps = {
  title: string;
  company: string;
  description: string;
  budget: string;
  deadline: string;
  tags: string[];
  logo: string;
};

export default function ProjectCard({
  title,
  company,
  description,
  budget,
  deadline,
  tags,
  logo,
}: ProjectProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-100">
      <div className="flex items-start space-x-4">
        <img
          src={logo}
          alt={company}
          className="h-12 w-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
            <span className="flex items-center text-green-600 text-sm font-medium">
             <img src='src/public/riyal.svg' className="h-5 w-5 mr-1" />
              {budget}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{company}</p>
          <p className="text-gray-700 mt-2">{description}</p>
          
          <div className="flex items-center space-x-4 mt-4">
            <span className="flex items-center text-gray-500 text-sm">
              <Clock className="h-4 w-4 mr-1" />
              {deadline}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { Star } from 'lucide-react';

type CreatorProps = {
  name: string;
  title: string;
  rating: number;
  image: string;
  skills: string[];
};

export default function CreatorCard({ name, title, rating, image, skills }: CreatorProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-100">
      <div className="flex items-start space-x-4">
        <img
          src={image}
          alt={name}
          className="h-16 w-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{name}</h3>
              <p className="text-sm text-gray-600">{title}</p>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm font-medium text-gray-600">{rating}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-4">
            <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
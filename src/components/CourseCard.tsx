import React from 'react';
import { Clock, Users, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CourseCardProps {
  id: number;
  title: string;
  image: string;
  category: string;
  level: string;
  duration: string;
  students: number;
  rating: number;
  price: number;
  instructor: {
    name: string;
    title: string;
    avatar: string;
  };
}

export default function CourseCard({
  id,
  title,
  image,
  category,
  level,
  duration,
  students,
  rating,
  price,
  instructor
}: CourseCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-sm">
          <span className="font-medium text-red-500">${price}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex gap-2 mb-2">
          <span className="px-2 py-1 bg-red-50 text-red-600 text-sm rounded-full">
            {category}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
            {level}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </h3>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {duration}
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {students} students
          </div>
          <div className="flex items-center text-yellow-500">
            <Star className="h-4 w-4 mr-1 fill-current" />
            {rating}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center">
            <img
              src={instructor.avatar}
              alt={instructor.name}
              className="h-8 w-8 rounded-full mr-2"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{instructor.name}</p>
              <p className="text-xs text-gray-500">{instructor.title}</p>
            </div>
          </div>
          <Link
            to={`/courses/${id}`}
            className="inline-flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <span className="mr-2">View</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
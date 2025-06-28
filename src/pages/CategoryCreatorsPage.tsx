import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import Header from '../components/Header';

// Sample data for creators in different categories
const categoryCreators = {
  Photography: [
    {
      id: 'marwan-salem',
      name: 'Marwan Salem',
      bio: 'I take great pictures.',
      rating: 4.9,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      portfolio: [
        'https://images.unsplash.com/photo-1601564921647-b446839a013f?ixlib=rb-1.2.1&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1548013146-72479768bada?ixlib=rb-1.2.1&auto=format&fit=crop&w=2076&q=80',
        'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-1.2.1&auto=format&fit=crop&w=2070&q=80'
      ]
    },
    {
      id: 'dwayne-johnson',
      name: 'Dwayne Johnson',
      bio: 'I take some of the best pictures.',
      rating: 4.7,
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      portfolio: [
        'https://images.unsplash.com/photo-1565967511849-76a60a516170?ixlib=rb-1.2.1&auto=format&fit=crop&w=2071&q=80',
        'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1480796927426-f609979314bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=2070&q=80'
      ]
    }
  ],
  // Add more categories as needed
};

export default function CategoryCreatorsPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const creators = categoryCreators[category as keyof typeof categoryCreators] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Header /> */}
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 ml-4">
            Top Rated Creators in {category}
          </h1>
        </div>

        <div className="space-y-8">
          {creators.map((creator) => (
            <div key={creator.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Portfolio Image Carousel */}
              <div className="relative h-64 bg-gray-200">
                <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                  {creator.portfolio.map((image, index) => (
                    <div
                      key={index}
                      className="flex-none w-full h-64 snap-center"
                    >
                      <img
                        src={image}
                        alt={`${creator.name}'s work ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                {/* Carousel Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {creator.portfolio.map((_, index) => (
                    <div
                      key={index}
                      className="w-2 h-2 rounded-full bg-white opacity-60"
                    />
                  ))}
                </div>
              </div>

              {/* Creator Info */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {creator.name}
                      </h3>
                      <p className="text-gray-500">{creator.bio}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="font-semibold text-gray-900">
                      {creator.rating}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6">
                  <Link
                    to={`/creator/${category}/${creator.id}`}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Click to View Profile & Connect
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
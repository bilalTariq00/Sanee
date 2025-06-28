import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Camera, Video, Mic, Palette, BadgeCheck, Music, Film, Target, ChevronRight, Users, Sparkles, TrendingUp } from 'lucide-react';

const categories = [
  {
    title: 'Photography',
    count: 1234,
    icon: Camera,
    description: 'Professional photographers for events, products, and portraits',
    trending: true,
    growth: '+12%'
  },
  {
    title: 'Video Editing',
    count: 856,
    icon: Video,
    description: 'Expert video editors for all types of content',
    trending: false,
    growth: '+8%'
  },
  {
    title: 'Voice Acting',
    count: 643,
    icon: Mic,
    description: 'Voice talent for commercials, animation, and more',
    trending: true,
    growth: '+15%'
  },
  {
    title: 'Graphic Design',
    count: 1567,
    icon: Palette,
    description: 'Creative designers for all your visual needs',
    trending: true,
    growth: '+10%'
  },
  {
    title: 'Brand Identity',
    count: 987,
    icon: BadgeCheck,
    description: 'Build and evolve your brand identity',
    trending: false,
    growth: '+7%'
  },
  {
    title: 'Music Production',
    count: 754,
    icon: Music,
    description: 'Professional music producers and composers',
    trending: false,
    growth: '+9%'
  },
  {
    title: 'Content Creation',
    count: 1432,
    icon: Film,
    description: 'Full-service content creation for all platforms',
    trending: true,
    growth: '+20%'
  },
  {
    title: 'Marketing Campaigns',
    count: 892,
    icon: Target,
    description: 'Strategic marketing campaign development',
    trending: true,
    growth: '+14%'
  }
];

export default function CategoriesPage() {
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleCategoryClick = (title: string) => {
    navigate(`/category/${title}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Header /> */}
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Categories</h1>
          <p className="mt-2 text-gray-600">Explore all creative categories and find the perfect creator for your project</p>
        </div>

        <div className="space-y-4">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const isHovered = hoveredCategory === index;

            return (
              <div
                key={index}
                className={`transform transition-all duration-300 ${
                  isHovered ? 'scale-102 -translate-y-1' : ''
                }`}
                onMouseEnter={() => setHoveredCategory(index)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => handleCategoryClick(category.title)}
              >
                <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className={`p-4 rounded-xl ${
                        isHovered ? 'bg-red-500' : 'bg-red-50'
                      } transition-colors`}>
                        <Icon className={`h-8 w-8 ${
                          isHovered ? 'text-white' : 'text-red-500'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {category.title}
                          </h3>
                          {category.trending && (
                            <span className="flex items-center text-green-500 text-sm font-medium">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              {category.growth}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 mt-1">{category.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="flex items-center text-gray-600 text-sm">
                            <Users className="h-4 w-4 mr-1" />
                            {category.count} creators
                          </span>
                          {category.trending && (
                            <span className="flex items-center text-purple-500 text-sm">
                              <Sparkles className="h-4 w-4 mr-1" />
                              Trending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight className={`h-6 w-6 ${
                      isHovered ? 'text-red-500' : 'text-gray-400'
                    } transition-colors`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
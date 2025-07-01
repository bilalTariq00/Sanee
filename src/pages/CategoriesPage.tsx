import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Video, Mic, Palette, BadgeCheck,
  Music, Film, Target, ChevronRight,
  Users, Sparkles, TrendingUp
} from 'lucide-react';
import { useTranslation } from "react-i18next";

const categories = [
  { key: 'photography', count: 1234, icon: Camera, trending: true, growth: '+12%' },
  { key: 'video_editing', count: 856, icon: Video, trending: false, growth: '+8%' },
  { key: 'voice_acting', count: 643, icon: Mic, trending: true, growth: '+15%' },
  { key: 'graphic_design', count: 1567, icon: Palette, trending: true, growth: '+10%' },
  { key: 'brand_identity', count: 987, icon: BadgeCheck, trending: false, growth: '+7%' },
  { key: 'music_production', count: 754, icon: Music, trending: false, growth: '+9%' },
  { key: 'content_creation', count: 1432, icon: Film, trending: true, growth: '+20%' },
  { key: 'marketing_campaigns', count: 892, icon: Target, trending: true, growth: '+14%' },
];

export default function CategoriesPage() {
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCategoryClick = (titleKey: string) => {
    navigate(`/category/${titleKey}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("categories_page.title")}</h1>
          <p className="mt-2 text-gray-600">{t("categories_page.subtitle")}</p>
        </div>

        <div className="space-y-4">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const isHovered = hoveredCategory === index;
            const title = t(`categorie.${category.key}.title`);
            const description = t(`categorie.${category.key}.description`);

            return (
              <div
                key={index}
                className={`transform transition-all duration-300 ${isHovered ? 'scale-102 -translate-y-1' : ''}`}
                onMouseEnter={() => setHoveredCategory(index)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => handleCategoryClick(category.key)}
              >
                <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className={`p-4 rounded-xl ${isHovered ? 'bg-red-500' : 'bg-red-50'} transition-colors`}>
                        <Icon className={`h-8 w-8 ${isHovered ? 'text-white' : 'text-red-500'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                          {category.trending && (
                            <span className="flex items-center text-green-500 text-sm font-medium">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              {category.growth}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 mt-1">{description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="flex items-center text-gray-600 text-sm">
                            <Users className="h-4 w-4 mr-1" />
                            {category.count} {t("categories_page.creators")}
                          </span>
                          {category.trending && (
                            <span className="flex items-center text-purple-500 text-sm">
                              <Sparkles className="h-4 w-4 mr-1" />
                              {t("categories_page.trending")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`h-6 w-6 ${isHovered ? 'text-red-500' : 'text-gray-400'} transition-colors`} />
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

import React from 'react';
import { Camera, Video, Mic, Palette, Code, Music, BadgeCheck, Film, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type CategoryProps = {
  title: string;
  count: number;
  icon: string;
};

const iconMap = {
  camera: Camera,
  video: Video,
  mic: Mic,
  palette: Palette,
  code: Code,
  music: Music,
  badge: BadgeCheck,
  film: Film,
  target: Target,
};

export default function CategoryCard({ title, count, icon }: CategoryProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const Icon = iconMap[icon as keyof typeof iconMap];

  const handleClick = () => {
    navigate(`/category/${title}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-red-50 p-3 rounded-lg">
            <Icon className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{t(`categoriee.${title}`)}</h3>
            <p className="text-sm text-gray-500">
              {count} {t('categoriee.creators')}
            </p>
          </div>
        </div>
        <button className="text-red-500 hover:text-red-600">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

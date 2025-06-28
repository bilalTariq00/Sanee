import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ClientCard from '../components/ClientCard';
import { useAuth } from '../contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

const trendingJobs = [
  {
    id: 1,
    title: 'Restaurant Menu Photography Needed',
    company: 'ABC Restaurant',
    companyId: 'abc-restaurant',
    description: 'Looking for a professional photographer to capture our new menu items. Need high-quality shots that highlight the details and appeal of our dishes.',
    budget: '$500',
    deadline: 'March 30, 2024',
    location: 'Dubai, UAE',
    type: 'Photography',
    requirements: [
      '5+ years experience',
      'Food photography portfolio',
      'Own equipment'
    ],
    logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
    tags: ['Food Photography', 'Menu', 'Restaurant']
  },
  {
    id: 2,
    title: 'Wedding Photography for Luxury Event',
    company: 'Elite Events',
    companyId: 'elite-events',
    description: 'Seeking an experienced wedding photographer for a high-end wedding. Must have experience with luxury events and a strong portfolio.',
    budget: '$2000',
    deadline: 'April 15, 2024',
    location: 'Dubai, UAE',
    type: 'Photography',
    requirements: [
      'Wedding photography experience',
      'Luxury event portfolio',
      'Team of 2-3 photographers'
    ],
    logo: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
    tags: ['Wedding', 'Events', 'Luxury']
  }
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (

    <div className="min-h-screen bg-gray-50">
      {/* <Header /> */}
      {/* <SidebarProvider>
        <AppSidebar /> */}
     
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trending Jobs Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Trending Photography Jobs</h2>
          </div>
          <div className="space-y-6">
            {trendingJobs.map((job) => (
              <ClientCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      </main>
       {/* </SidebarProvider> */}
    </div>
  );
}
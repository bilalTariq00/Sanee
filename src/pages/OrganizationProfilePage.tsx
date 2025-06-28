import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Building, DollarSign, Users } from 'lucide-react';
import Header from '../components/Header';

// Sample organization data
const organizationData = {
  'abc-restaurant': {
    name: 'ABC Restaurant',
    logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
    location: 'Dubai, UAE',
    description: "We're a specialty coffee company focused on creating exceptional coffee experiences through innovative branding and welcoming spaces.",
    stats: {
      jobsPosted: 28,
      rating: 4.9,
      responseRate: '95%',
      totalHires: 156
    },
    activeJobs: [
      {
        id: 1,
        title: 'Restaurant Menu Photography',
        budget: '$500',
        deadline: '2 weeks',
        status: 'Active'
      }
    ],
    previousJobs: [
      {
        id: 2,
        title: 'Brand Identity Design',
        budget: '$1,500',
        completedDate: '1 month ago',
        status: 'Completed'
      }
    ],
    reviews: [
      {
        id: 1,
        creator: {
          name: 'Sarah Chen',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          role: 'Brand Designer'
        },
        rating: 5,
        comment: 'Working with ABC Company was a great experience. They were clear with their requirements and responsive throughout the project.',
        date: '2 weeks ago'
      }
    ]
  },
  'elite-events': {
    name: 'Elite Events',
    logo: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
    location: 'Abu Dhabi, UAE',
    description: "Premier event planning company specializing in luxury weddings and high-end corporate events.",
    stats: {
      jobsPosted: 45,
      rating: 4.8,
      responseRate: '92%',
      totalHires: 234
    },
    activeJobs: [
      {
        id: 1,
        title: 'Wedding Event Photography',
        budget: '$2,000',
        deadline: '1 month',
        status: 'Active'
      }
    ],
    previousJobs: [
      {
        id: 2,
        title: 'Corporate Event Coverage',
        budget: '$3,500',
        completedDate: '2 months ago',
        status: 'Completed'
      }
    ],
    reviews: [
      {
        id: 1,
        creator: {
          name: 'Michael Ross',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          role: 'Event Photographer'
        },
        rating: 5,
        comment: 'Elite Events is a pleasure to work with. Their events are well-organized and they have a clear vision of what they want.',
        date: '1 month ago'
      }
    ]
  },
  'dubai-safari': {
    name: 'Dubai Safari Park',
    logo: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
    location: 'Dubai, UAE',
    description: "Dubai's premier wildlife conservation park, dedicated to preserving and showcasing diverse wildlife species.",
    stats: {
      jobsPosted: 15,
      rating: 4.7,
      responseRate: '89%',
      totalHires: 42
    },
    activeJobs: [
      {
        id: 1,
        title: 'Wildlife Safari Photography Project',
        budget: '$3,000',
        deadline: '3 weeks',
        status: 'Active'
      }
    ],
    previousJobs: [
      {
        id: 2,
        title: 'Conservation Campaign Photography',
        budget: '$2,500',
        completedDate: '3 months ago',
        status: 'Completed'
      }
    ],
    reviews: [
      {
        id: 1,
        creator: {
          name: 'David Chen',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          role: 'Wildlife Photographer'
        },
        rating: 4,
        comment: 'Great opportunity to work with exotic animals. The staff is very professional and safety-conscious.',
        date: '3 months ago'
      }
    ]
  },
  'premium-properties': {
    name: 'Premium Properties Dubai',
    logo: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
    location: 'Dubai Marina, UAE',
    description: "Leading luxury real estate agency specializing in high-end properties across Dubai's most prestigious locations.",
    stats: {
      jobsPosted: 67,
      rating: 4.9,
      responseRate: '97%',
      totalHires: 189
    },
    activeJobs: [
      {
        id: 1,
        title: 'Luxury Real Estate Photography',
        budget: '$1,500',
        deadline: '1 week',
        status: 'Active'
      }
    ],
    previousJobs: [
      {
        id: 2,
        title: 'Penthouse Virtual Tour',
        budget: '$2,000',
        completedDate: '1 month ago',
        status: 'Completed'
      }
    ],
    reviews: [
      {
        id: 1,
        creator: {
          name: 'Emma White',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          role: 'Real Estate Photographer'
        },
        rating: 5,
        comment: 'Premium Properties maintains the highest standards. Their properties are always well-prepared for shoots.',
        date: '2 months ago'
      }
    ]
  }
};

export default function OrganizationProfilePage() {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'jobs' | 'reviews'>('jobs');

  const organization = organizationId ? organizationData[organizationId as keyof typeof organizationData] : null;

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* <Header /> */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Organization not found</h2>
            <p className="mt-2 text-gray-600">The organization you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Header /> */}
      
      {/* Organization Header */}
      <div className="bg-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-white/90 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <img
                src={organization.logo}
                alt={organization.name}
                className="w-24 h-24 rounded-lg border-4 border-white object-cover"
              />
              <div>
                <h1 className="text-3xl font-bold">{organization.name}</h1>
                <div className="flex items-center mt-2">
                  <MapPin className="h-5 w-5 mr-1" />
                  {organization.location}
                </div>
                <p className="mt-4 max-w-2xl">{organization.description}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-12 mt-8">
            <div>
              <div className="text-3xl font-bold">{organization.stats.jobsPosted}</div>
              <div className="text-white/90">Jobs Posted</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{organization.stats.rating}</div>
              <div className="text-white/90">Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{organization.stats.responseRate}</div>
              <div className="text-white/90">Response Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{organization.stats.totalHires}</div>
              <div className="text-white/90">Total Hires</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`py-4 px-2 font-medium relative ${
                activeTab === 'jobs' ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Jobs
              {activeTab === 'jobs' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-2 font-medium relative ${
                activeTab === 'reviews' ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Reviews
              {activeTab === 'reviews' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'jobs' ? (
          <div className="space-y-8">
            {/* Active Jobs */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Jobs</h2>
              <div className="space-y-4">
                {organization.activeJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <img src='src/public/riyal.svg' className="h-5 w-5 mr-1" />
                            {job.budget}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {job.status}
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {job.deadline} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Previous Jobs */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Previous Jobs</h2>
              <div className="space-y-4">
                {organization.previousJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-lg shadow-sm p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <img src='src/public/riyal.svg' className="h-5 w-5 mr-1" />
                            {job.budget}
                          </div>
                          <div>Completed {job.completedDate}</div>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {organization.reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={review.creator.avatar}
                    alt={review.creator.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {review.creator.name}
                        </h3>
                        <p className="text-sm text-gray-500">{review.creator.role}</p>
                      </div>
                      <div className="flex items-center">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-5 h-5 text-yellow-400 fill-current"
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-gray-600">{review.comment}</p>
                    <p className="mt-2 text-sm text-gray-500">{review.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
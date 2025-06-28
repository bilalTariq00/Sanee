import React from 'react';
import { Clock, MoreVertical, Check, X, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

const projects = {
  applied: [
    {
      id: 1,
      title: 'Restaurant Menu Photo Session',
      company: 'Fine Dining Co.',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
      status: 'waiting' as const,
      deadline: 'March 30, 2024'
    }
  ],
  inProgress: [
    {
      id: 2,
      title: 'Luxury Hotel Interior Photography',
      company: 'Dubai Grand Hotel',
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
      status: 'selected' as const,
      deadline: 'April 5, 2024'
    },
    {
      id: 3,
      title: 'ABC Coffee Shop Brand Identity',
      company: 'ABC Coffee',
      assignee: 'You',
      image: 'https://images.unsplash.com/photo-1518226203301-8e7f833c6a94?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
      status: 'waiting_payment' as const,
      deadline: 'April 10, 2024'
    },
    {
      id: 4,
      title: 'Elite Events Wedding Photography',
      company: 'Elite Events',
      assignee: 'You',
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
      status: 'in_progress' as const,
      deadline: 'April 15, 2024'
    }
  ],
  completed: [
    {
      id: 5,
      title: 'XYZ Restaurant Photoshoot',
      company: 'XYZ Restaurant',
      assignee: 'You',
      image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150&q=80',
      status: 'completed' as const,
      completedDate: 'March 15, 2024'
    }
  ]
};

export default function MyProjectsPage() {
  const handleAccept = (projectId: number) => {
    // Handle accept logic here
    console.log('Accepted project:', projectId);
  };

  const handleReject = (projectId: number) => {
    // Handle reject logic here
    console.log('Rejected project:', projectId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Header /> */}
      
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-center text-gray-900">
            My Projects
          </h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Applied Jobs Section */}
        {projects.applied.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Applied Jobs</h2>
            <div className="space-y-4">
              {projects.applied.map((project) => (
                <div key={project.id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={project.image}
                        alt={project.company}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{project.title}</h3>
                        <p className="text-sm text-gray-500">{project.company}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Deadline: {project.deadline}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm">
                        <Clock className="h-4 w-4 mr-2" />
                        Waiting for applicants
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* In Works Section */}
        {projects.inProgress.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">In Works</h2>
            <div className="space-y-4">
              {projects.inProgress.map((project) => (
                <div key={project.id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={project.image}
                        alt={project.company}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{project.title}</h3>
                        <p className="text-sm text-gray-500">{project.company}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Deadline: {project.deadline}
                        </p>
                        {project.status === 'selected' ? (
                          <p className="text-sm text-purple-600">Selected</p>
                        ) : project.status === 'waiting_payment' ? (
                          <p className="text-sm text-orange-600">Waiting for payment</p>
                        ) : (
                          <p className="text-sm text-gray-500">By {project.assignee}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {project.status === 'selected' ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleAccept(project.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                          >
                            <Check className="h-4 w-4" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleReject(project.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : project.status === 'waiting_payment' ? (
                        <div className="flex items-center text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-sm">
                          <img src='/riyal.svg' className="h-5 w-5 mr-1" />
                          Waiting for payment
                        </div>
                      ) : (
                        <div className="flex items-center text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
                          <Clock className="h-4 w-4 mr-2" />
                          In Works
                        </div>
                      )}
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Previous Jobs Section */}
        {projects.completed.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Previous Jobs</h2>
            <div className="space-y-4">
              {projects.completed.map((project) => (
                <div key={project.id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={project.image}
                        alt={project.company}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{project.title}</h3>
                        <p className="text-sm text-gray-500">{project.company}</p>
                        <p className="text-sm text-gray-500">By {project.assignee}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Completed: {project.completedDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
                        Completed
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
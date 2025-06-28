import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';
import { Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import JobCard from '../components/JobCard';
import Header from '../components/Header';

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: string;
  skills: string[];
  created_at: string;
  client: {
    id: string;
    name: string;
    image: string;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_BASE_URL}/projects`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProjects(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch projects');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading projects...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* <Header /> */}
      
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-center text-gray-900">
            Post & Track Jobs
          </h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Posted Jobs Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Posted Jobs</h2>
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
              >
                <div className="px-4 py-5 sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={project.client.image || 'https://via.placeholder.com/40'}
                        alt={project.client.name}
                      />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                      <p className="text-sm text-gray-500">Posted by {project.client.name}</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <p className="text-sm text-gray-500 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                      >
                        {skill}
                      </span>
            ))}
          </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Budget: ${project.budget}</span>
                    <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="px-4 py-4 sm:px-6">
                  <button
                    onClick={() => {/* TODO: Implement view details */}}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    View Details
                  </button>
                </div>
          </div>
            ))}
          </div>
        </section>

        {/* New Job Button */}
        <Link
          to="/post-job"
          className="fixed bottom-20 right-6 bg-red-500 text-white p-4 rounded-full shadow-lg hover:bg-red-600 transition-colors"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </main>
    </div>
  );
}
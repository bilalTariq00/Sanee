import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  Video,
  Mic,
  Palette,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const categories = [
  {
    title: "Photography",
    description: "Professional photographers for events, products, and portraits",
    icon: Camera,
    count: "1,234+ creators",
  },
  {
    title: "Video Editing",
    description: "Expert video editors for all types of content",
    icon: Video,
    count: "856+ creators",
  },
  {
    title: "Voice Acting",
    description: "Voice talent for commercials, animation, and more",
    icon: Mic,
    count: "643+ creators",
  },
  {
    title: "Graphic Design",
    description: "Creative designers for all your visual needs",
    icon: Palette,
    count: "1,567+ creators",
  },
];

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"project" | "creator">("project");

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/sanee.png" alt="" className="w-14 h-10" />
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-red-500 font-medium">
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Tabs */}
      <section className="py-20 bg-gradient-to-br from-red-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
                Connect with Top Creative Talent
              </h1>
              {/* <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Creva is the premier platform connecting businesses with skilled creative professionals.
              </p> */}
               {activeTab === "project" && (
                <div className="">
                  <h3 className="text-xl font-semibold mb-2">Kickstart Your Creative Journey</h3>
                  <p className="text-gray-600 mb-4">
                    Easily post your project, describe your needs, and let top professionals come to you.
                  </p>
                  {/* <Link
                    to="/signup"
                    className="inline-block bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    Post Your Project Now
                  </Link> */}
                </div>
              )}

              {activeTab === "creator" && (
                <div className="">
                  <h3 className="text-xl font-semibold mb-2">Find the Perfect Creative Partner</h3>
                  <p className="text-gray-600 mb-4">
                    Browse through thousands of talented creators ready to bring your vision to life.
                  </p>
                  {/* <Link
                    to="/categories"
                    className="inline-block bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    Browse Creators
                  </Link> */}
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-4 mb-6">
                
                <button
                  onClick={() => setActiveTab("project")}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    activeTab === "project"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Start Your Project
                </button>
                <button
                  onClick={() => setActiveTab("creator")}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    activeTab === "creator"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Browse Creators
                </button>
              </div>

              {/* Tab Content */}
             
            </div>

            {/* Hero Image */}
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=2071&q=80"
                alt="Creative professional working"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Camera className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">2,500+ Projects</p>
                    <p className="text-sm text-gray-600">Completed Successfully</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Creative Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover talented creators across various creative disciplines, 
              ready to bring your vision to life with professional expertise.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all group cursor-pointer"
                >
                  <div className="bg-red-50 p-4 rounded-xl w-fit mb-6 group-hover:bg-red-100 transition-colors">
                    <Icon className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {category.description}
                  </p>
                  <p className="text-sm font-medium text-red-500">
                    {category.count}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section with Buttons */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Join thousands of businesses and creators who trust Creva for their creative projects.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Link
              to="/signup"
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-4 rounded-full hover:bg-gray-200 transition-colors text-center font-medium border-2 border-gray-300"
            >
              Find Talent
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <div className="text-red-100">Active Creators</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-red-100">Projects Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-red-100">Client Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-red-100">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <img src="/sanee.png" alt="" className='w-20 h-16' />
              <p className="text-gray-300 mb-6 max-w-md">
                Connecting businesses with top creative talent worldwide. 
                Your vision, our creators, endless possibilities.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4 mb-6">
                <a href="#" className="bg-gray-800 p-3 rounded-full hover:bg-red-500 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="bg-gray-800 p-3 rounded-full hover:bg-red-500 transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="bg-gray-800 p-3 rounded-full hover:bg-red-500 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="bg-gray-800 p-3 rounded-full hover:bg-red-500 transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-gray-300">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>hello@creva.com</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>+971 50 123 4567</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Dubai, UAE</span>
                </div>
              </div>
            </div>

            {/* Mission & Vision */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Our Mission</h4>
              <p className="text-gray-300 text-sm mb-6">
                To democratize access to creative talent and empower businesses 
                to bring their visions to life through seamless collaboration 
                with skilled professionals.
              </p>
              
              <h4 className="text-lg font-semibold mb-4">Our Vision</h4>
              <p className="text-gray-300 text-sm">
                To become the world's leading platform where creativity meets 
                opportunity, fostering innovation and excellence in every project.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <Link to="/categories" className="hover:text-red-500 transition-colors">
                    Browse Categories
                  </Link>
                </li>
                <li>
                  <Link to="/jobs" className="hover:text-red-500 transition-colors">
                    Find Jobs
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-red-500 transition-colors">
                    Join as Creator
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-red-500 transition-colors">
                    Post a Job
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-red-500 transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-500 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-red-500 transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Creva. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
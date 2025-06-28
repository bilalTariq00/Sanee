import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Users, Play, ThumbsUp, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../components/Header';

// ... rest of the file content ...

export default function CourseDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Header /> */}
      {/* ... component content ... */}
    </div>
  );
}
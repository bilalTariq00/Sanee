"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User } from "@/types/User";
import axios from "axios";
import config from "@/config";

interface UserCardProps {
  user: User;
  userType: "buyer" | "seller"; // Add userType prop
  onUserClick?: (user: User) => void;
}

export default function UserCard({ user, onUserClick, userType }: UserCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // State to store the real rating and project data from the API
  const [userRating, setUserRating] = useState<number | null>(null);
  const [totalCompletedProjects, setTotalCompletedProjects] = useState<number | null>(null);
  const [loadingRating, setLoadingRating] = useState<boolean>(true); // State to track loading state
  const [ratingError, setRatingError] = useState<string | null>(null); // State for error handling
  
  // Fetch user rating and total completed projects data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${config.API_BASE_URL}/users/${user.uid}/jss`);
        
        // Extracting rating and total completed projects from the response
        const rating = response.data?.data?.summary?.average_rating;
        const completedProjects = response.data?.data?.projects_stats?.total_completed_projects;
        
        setUserRating(rating); // Update the rating state
        setTotalCompletedProjects(completedProjects); // Update the completed projects state
      } catch (error) {
        console.error("Error fetching user rating or projects:", error);
        setRatingError("Failed to load data");
      } finally {
        setLoadingRating(false); // Set loading to false after the fetch attempt
      }
    };

    if (user?.uid) {
      fetchUserData();
    }
  }, [user?.uid]);

  const goToProfile = () => navigate(`/profile/${user.uid}`);
  
  const goToChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/messages/${user.uid}`);
  };

  return (
    <Card
      onClick={goToProfile}
      className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 rounded-2xl bg-white flex flex-col h-full"
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          
          <img
            src={user.avatar}
            alt={user.name}
            className="w-14 h-14 rounded-full object-cover border border-gray-300 shadow-sm"
          />
          <div>
            <h3
              onClick={goToProfile}
              className="font-semibold text-lg text-gray-900 hover:underline"
            >
              {user.name}
            </h3>
            <p className="text-gray-600 text-sm mt-1">{user.location}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-yellow-500 text-base">★</span>
            {/* Display the real rating */}
            {loadingRating ? (
              <span className="font-medium">Loading...</span>
            ) : ratingError ? (
              <span className="font-medium text-red-500">{ratingError}</span>
            ) : (
              <span className="font-medium">{userRating ? userRating.toFixed(1) : "N/A"}</span>
            )}
          </div>
          {/* Display total completed projects */}
          {totalCompletedProjects !== null && (
            <Badge className="mb-4 whitespace-nowrap">
              {totalCompletedProjects} {t("projects")}
            </Badge>
          )}
        </div>
      </div>

      {/* Details Section */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          {userType === "seller" && (
            <span className="flex items-center">
              <img src='/riyal.svg' className="h-5 w-5 mr-1" />{user.hourlyRate}+ &nbsp;|&nbsp; {user.experience}
            </span>
          )}
          <span>{user.followers} {t("followers")}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {user.skills.slice(0, 3).map((skill) => (
            <Badge
              key={skill}
              variant="outline"
              className="text-xs px-2 py-1 rounded-full"
            >
              {skill}
            </Badge>
          ))}
          {user.skills.length > 3 && (
            <Badge variant="outline" className="text-xs px-2 py-1 rounded-full">
              +{user.skills.length - 3}
            </Badge>
          )}
        </div>
      </div>

      {/* Projects Preview */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {user.projects.slice(0, 4).map((proj, i) => (
          <div
            key={i}
            className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200"
          >
            <img
              src={proj.image}
              alt={proj.title}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Display Total Completed Projects */}


      {/* Footer Action Buttons */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <Button
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onUserClick?.(user);
          }}
          className="flex-1 rounded-full"
        >
          {t("view_profile")}
        </Button>
        <Button 
          onClick={goToChat}
          className="px-6 bg-red-500 text-white hover:bg-red-800 rounded-full"
        >
          {t("get_in_touch")}
        </Button>
      </div>
    </Card>
  );
}

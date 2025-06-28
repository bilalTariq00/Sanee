export interface Project {
  title: string;
  description: string;
  image: string;
  tags: string[];
}

export interface User {
  id: string;
  uid: string; // ✅ add this
  name: string;
  avatar: string;
  location?: string;
  badge?: string;
  rating?: number;
  hourlyRate?: number;
  experience?: string;
  followers?: number;
  skills: string[];
  projects: {
    image: string;
    title: string;
    description?: string;
    tags?: string[];
  }[];
  bio?: string;
}

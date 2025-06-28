import { User } from "@/types/User";

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Daniel G Bright",
    location: "Barcelona, Spain",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    hourlyRate: 50,
    experience: "26x",
    rating: 4.9,
    followers: 683,
    badge: "Top Independent",
    skills: ["React", "TypeScript", "Node.js", "UI/UX Design", "Figma", "Next.js"],
    bio: "Experienced full-stack developer and designer with over 8 years of experience building scalable web applications. I specialize in React, TypeScript, and modern web technologies. I've worked with startups and Fortune 500 companies to deliver high-quality digital products.",
    projects: [
      {
        title: "E-commerce Platform",
        description: "Modern e-commerce solution built with React and Node.js",
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
        tags: ["React", "Node.js", "MongoDB"]
      },
      {
        title: "Design System",
        description: "Comprehensive design system for SaaS platform",
        image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop",
        tags: ["Figma", "React", "Storybook"]
      },
      {
        title: "Mobile Banking App",
        description: "Secure banking application with modern UI",
        image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop",
        tags: ["React Native", "Security", "FinTech"]
      },
      {
        title: "Analytics Dashboard",
        description: "Real-time analytics dashboard for enterprise clients",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
        tags: ["D3.js", "React", "Data Viz"]
      }
    ],
    category: "web-developer"
  },
  {
    id: "2",
    name: "Studio Duo",
    location: "East Stafford, UK",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
    hourlyRate: 55,
    experience: "55x",
    rating: 4.7,
    followers: 398,
    badge: "Framer Expert",
    skills: ["Framer", "Web Design", "Motion Design", "Branding", "Figma", "After Effects"],
    bio: "Creative studio specializing in web design and motion graphics. We create stunning digital experiences that combine beautiful design with smooth animations. Our team has worked with brands across various industries to create memorable digital presences.",
    projects: [
      {
        title: "Brand Identity System",
        description: "Complete brand identity and web presence for tech startup",
        image: "https://images.unsplash.com/photo-1545670723-196ed0954986?w=400&h=300&fit=crop",
        tags: ["Branding", "Web Design", "Figma"]
      },
      {
        title: "Interactive Portfolio",
        description: "Award-winning portfolio website with custom animations",
        image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400&h=300&fit=crop",
        tags: ["Framer", "Motion Design", "WebGL"]
      },
      {
        title: "SaaS Landing Page",
        description: "High-converting landing page for B2B SaaS product",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
        tags: ["Conversion", "Design", "A/B Testing"]
      },
      {
        title: "Mobile App Design",
        description: "iOS and Android app design for fitness platform",
        image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop",
        tags: ["Mobile", "UI/UX", "Fitness"]
      }
    ],
    category: "designer"
  },
  {
    id: "3",
    name: "Alex Rodriguez",
    location: "San Francisco, CA",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    hourlyRate: 75,
    experience: "12x",
    rating: 4.8,
    followers: 1240,
    badge: "Featured Expert",
    skills: ["Content Strategy", "Video Production", "Social Media", "SEO", "Photography"],
    bio: "Content strategist and video producer helping brands tell their stories through compelling visual content. I've produced content for major brands and helped them grow their social media presence by 300%+ on average.",
    projects: [
      {
        title: "Brand Documentary",
        description: "60-minute documentary showcasing company culture",
        image: "https://images.unsplash.com/photo-1489844097929-c8d5b91c456e?w=400&h=300&fit=crop",
        tags: ["Video", "Documentary", "Storytelling"]
      },
      {
        title: "Social Media Campaign",
        description: "Viral social media campaign reaching 2M+ people",
        image: "https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=400&h=300&fit=crop",
        tags: ["Social Media", "Viral", "Strategy"]
      }
    ],
    category: "content-creator"
  },
  {
    id: "4",
    name: "Sarah Chen",
    location: "London, UK",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    hourlyRate: 65,
    experience: "8x",
    rating: 4.9,
    followers: 892,
    badge: "UI/UX Specialist",
    skills: ["UI Design", "UX Research", "Prototyping", "User Testing", "Design Systems"],
    bio: "UX designer passionate about creating user-centered digital experiences. I combine research-driven insights with beautiful design to create products that users love and businesses value.",
    projects: [
      {
        title: "Healthcare App",
        description: "Patient portal app improving healthcare accessibility",
        image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop",
        tags: ["Healthcare", "Mobile", "Accessibility"]
      },
      {
        title: "EdTech Platform",
        description: "Learning management system for online education",
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop",
        tags: ["Education", "Web App", "Learning"]
      }
    ],
    category: "designer"
  },
  {
    id: "5",
    name: "Marcus Johnson",
    location: "Austin, TX",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    hourlyRate: 80,
    experience: "15x",
    rating: 4.7,
    followers: 567,
    badge: "Backend Expert",
    skills: ["Python", "Django", "AWS", "DevOps", "PostgreSQL", "Redis"],
    bio: "Senior backend engineer with expertise in scalable system architecture. I help companies build robust, secure, and performant backend systems that can handle millions of users.",
    projects: [
      {
        title: "Microservices Architecture",
        description: "Scalable microservices system for e-commerce platform",
        image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop",
        tags: ["Microservices", "AWS", "Python"]
      },
      {
        title: "API Gateway",
        description: "High-performance API gateway handling 1M+ requests/day",
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop",
        tags: ["API", "Performance", "Security"]
      }
    ],
    category: "web-developer"
  },
  {
    id: "6",
    name: "Emily Foster",
    location: "Toronto, Canada",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
    hourlyRate: 70,
    experience: "10x",
    rating: 4.8,
    followers: 1156,
    badge: "Brand Strategist",
    skills: ["Brand Strategy", "Marketing", "Content Creation", "Photography", "Copywriting"],
    bio: "Brand strategist and creative director helping businesses build authentic brand identities. I work with companies to develop comprehensive brand strategies that resonate with their target audience.",
    projects: [
      {
        title: "Restaurant Rebrand",
        description: "Complete rebrand for upscale restaurant chain",
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop",
        tags: ["Branding", "Restaurant", "Photography"]
      },
      {
        title: "Startup Brand Launch",
        description: "Brand identity and go-to-market strategy for tech startup",
        image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop",
        tags: ["Startup", "Strategy", "Launch"]
      }
    ],
    category: "content-creator"
  }
];

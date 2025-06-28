import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Play, Pause, VolumeX, Volume2, Loader } from 'lucide-react';
import Header from '../components/Header';

const videos = [
  {
    id: 1,
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-person-editing-a-video-on-a-computer-5495-large.mp4",
    thumbnail: "https://images.unsplash.com/photo-1536240478700-b869070f9279?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    creator: {
      name: "Sarah Johnson",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      username: "sarahj_editor"
    },
    title: "Behind the scenes of a professional video editing session",
    description: "Check out my workflow for editing commercial videos. Tools used: Premiere Pro, After Effects.",
    likes: 1234,
    comments: 89,
    shares: 45,
    tags: ["#videoediting", "#behindthescenes", "#workflow"]
  },
  {
    id: 2,
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-photographer-taking-photos-of-a-model-34486-large.mp4",
    thumbnail: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    creator: {
      name: "Michael Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      username: "mchenphoto"
    },
    title: "Fashion photography session with natural lighting",
    description: "Natural light is your best friend in fashion photography. Here's how I use it.",
    likes: 2567,
    comments: 156,
    shares: 78,
    tags: ["#photography", "#fashion", "#naturallighting"]
  }
];

export default function ContentPage() {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likedVideos, setLikedVideos] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean[]>(new Array(videos.length).fill(true));
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const containerHeight = containerRef.current.clientHeight;
      const scrollTop = containerRef.current.scrollTop;
      const index = Math.round(scrollTop / containerHeight);
      
      if (index !== activeVideoIndex) {
        setActiveVideoIndex(index);
        videoRefs.current.forEach((video, i) => {
          if (!video) return;
          if (i === index) {
            if (isPlaying) video.play().catch(() => {});
          } else {
            video.pause();
            video.currentTime = 0;
          }
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [activeVideoIndex, isPlaying]);

  const handleVideoLoad = (index: number) => {
    const newLoadingState = [...isLoading];
    newLoadingState[index] = false;
    setIsLoading(newLoadingState);
  };

  const handleVideoError = (index: number) => {
    console.error(`Error loading video at index ${index}`);
    const newLoadingState = [...isLoading];
    newLoadingState[index] = false;
    setIsLoading(newLoadingState);
  };

  const togglePlay = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRefs.current[activeVideoIndex];
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(!isMuted);
  };

  const toggleLike = (videoId: number) => {
    setLikedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* <Header /> */}
      
      <div 
        ref={containerRef}
        className="h-[calc(100vh-64px)] overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {videos.map((video, index) => (
          <div
            key={video.id}
            className="h-[calc(100vh-64px)] snap-start relative flex items-center justify-center"
          >
            <div className="relative w-[360px] h-full">
              {isLoading[index] && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader className="w-8 h-8 text-red-500 animate-spin" />
                </div>
              )}
              
              <video
                ref={el => videoRefs.current[index] = el}
                src={video.videoUrl}
                poster={video.thumbnail}
                loop
                playsInline
                muted={isMuted}
                className="absolute inset-0 w-full h-full object-cover"
                onLoadedData={() => handleVideoLoad(index)}
                onError={() => handleVideoError(index)}
                onClick={() => togglePlay(index)}
              />

              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50">
                {!isPlaying && (
                  <button
                    onClick={() => togglePlay(index)}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                  >
                    <Play className="w-8 h-8 text-white" />
                  </button>
                )}

                <button
                  onClick={toggleMute}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-6 h-6 text-white" />
                  ) : (
                    <Volume2 className="w-6 h-6 text-white" />
                  )}
                </button>

                <div className="absolute bottom-4 left-4 right-16">
                  <div className="flex items-center space-x-3 mb-3">
                    <img
                      src={video.creator.avatar}
                      alt={video.creator.name}
                      className="w-10 h-10 rounded-full border-2 border-white"
                    />
                    <div>
                      <h3 className="text-white font-semibold">
                        {video.creator.name}
                      </h3>
                      <p className="text-white/80 text-sm">
                        @{video.creator.username}
                      </p>
                    </div>
                  </div>
                  <p className="text-white text-sm mb-2">{video.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, i) => (
                      <span key={i} className="text-white/90 text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="absolute right-2 bottom-4 flex flex-col items-center space-y-4">
                  <button
                    onClick={() => toggleLike(video.id)}
                    className="group"
                  >
                    <div className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors">
                      <Heart
                        className={`w-6 h-6 ${
                          likedVideos.includes(video.id)
                            ? 'text-red-500 fill-current'
                            : 'text-white'
                        } group-hover:scale-110 transition-transform`}
                      />
                    </div>
                    <span className="text-white text-xs mt-1 block">
                      {likedVideos.includes(video.id) ? video.likes + 1 : video.likes}
                    </span>
                  </button>
                  <button className="group">
                    <div className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors">
                      <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-white text-xs mt-1 block">{video.comments}</span>
                  </button>
                  <button className="group">
                    <div className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors">
                      <Share2 className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-white text-xs mt-1 block">{video.shares}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import type React from "react";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import config from "@/config";
import axios from "axios";

// Extend the Window interface to include showToast
declare global {
  interface Window {
    showToast?: (options: { title: string; message: string; type: string }) => void;
  }
}

// Notification Sound Settings Types
interface NotificationSettings {
  soundEnabled: boolean;
  volume: number;
  soundType: "default" | "chime" | "bell" | "pop";
}

interface NotificationContextType {
  settings: NotificationSettings;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  playNotificationSound: () => void;
  testSound: () => void;
  notifications: any[];
  unreadCount: number;
  isConnected: boolean;
}

// Context for Notification Settings
const NotificationContext = createContext<NotificationContextType | null>(null);

// Default Notification Settings
const STORAGE_KEY = "notification_settings";

const DEFAULT_SETTINGS: NotificationSettings = {
  soundEnabled: true,
  volume: 0.7,
  soundType: "default",
};

// Notification Provider with Sound and Real-time Pusher Integration
export function NotificationProvider({ children, user }: { children: React.ReactNode, user: any }) {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error("Failed to parse notification settings:", error);
      }
    }
    setIsInitialized(true);
  }, []);
  useEffect(() => {
    if (!user) return;

    const fetchInitialUnreadCount = async () => {
      try {
        const res = await axios.get(`${config.API_BASE_URL}/notifications/unread-count`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const count = res.data?.data?.unread_count ?? 0;
        console.log("📥 Initial unread count:", count);
        setUnreadCount(count);
      } catch (error) {
        console.error("❌ Failed to fetch unread count", error);
      }
    };

    fetchInitialUnreadCount();
  }, [user]);
  // Initialize Web Audio API
  useEffect(() => {
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (error) {
          console.warn("Web Audio API not supported:", error);
        }
      }
    };

    const events = ["click", "touchstart", "keydown"];
    events.forEach((event) => {
      document.addEventListener(event, initAudioContext, { once: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, initAudioContext);
      });
    };
  }, []);

  // Update settings function
  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
  };

  // Simple beep sound fallback
  const playSimpleBeep = () => {
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/Eeyw"
      );
      audio.volume = settings.volume;
      audio.play().catch((e) => console.warn("Could not play audio:", e));
    } catch (error) {
      console.warn("Error creating audio:", error);
    }
  };

  // Sound generation using Web Audio API
  const generateSound = (type: string) => {
    if (!audioContextRef.current) {
      playSimpleBeep();
      return;
    }

    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      gainNode.gain.setValueAtTime(settings.volume * 0.3, ctx.currentTime);

      switch (type) {
        case "default":
          oscillator.frequency.setValueAtTime(800, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;

        case "chime":
          oscillator.frequency.setValueAtTime(600, ctx.currentTime);
          oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.4);
          break;

        case "bell":
          oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.6);
          break;

        case "pop":
          oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.1);
          break;

        default:
          oscillator.frequency.setValueAtTime(800, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
      }
    } catch (error) {
      console.warn("Error generating sound:", error);
      playSimpleBeep();
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    if (!settings.soundEnabled || !isInitialized) return;

    try {
      generateSound(settings.soundType);
    } catch (error) {
      console.warn("Error playing notification sound:", error);
      playSimpleBeep();
    }
  };

  // Test sound function
  const testSound = () => {
    if (!isInitialized) return;

    try {
      generateSound(settings.soundType);
    } catch (error) {
      console.warn("Error playing test sound:", error);
      playSimpleBeep();
    }
  };

  // Pusher integration for real-time notifications
 useEffect(() => {
  if (!user) {
    console.warn("❌ No user provided to NotificationProvider");
    return;
  }

  console.log("📡 Connecting to Pusher for user:", user.id);

  const pusher = new Pusher("fb3d6f3052ad033ccb47", {
    cluster: "ap2",
    authEndpoint: `${config.API_BASE_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    },
  });

  const channelName = `private-notifications.${user.id}`;
  const channel = pusher.subscribe(channelName);

  console.log("✅ Subscribed to", channelName);

  channel.bind("notification.created", (data) => {
    console.log("🔔 Notification received:", data);
    setNotifications((prev) => [data.notification, ...prev]);
    setUnreadCount(data.unread_count);
    showToast(data.notification);
  });

  pusher.connection.bind("connected", () => {
    console.log("✅ Pusher connected");
    setIsConnected(true);
  });

  pusher.connection.bind("disconnected", () => {
    console.log("⚠️ Pusher disconnected");
    setIsConnected(false);
  });

  return () => {
    pusher.unsubscribe(channelName);
    pusher.disconnect();
  };
}, [user]);

  const showToast = (notification: { title: any; message: any; }) => {
    if (window.showToast) {
      window.showToast({
        title: notification.title,
        message: notification.message,
        type: "info",
      });
    }
  };

  const value: NotificationContextType = {
    settings,
    updateSettings,
    playNotificationSound,
    testSound,
    notifications,
    unreadCount,
    isConnected,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

// Hook to access notification settings and data
export function useNotificationSettings(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationSettings must be used within a NotificationProvider");
  }
  return context;
}

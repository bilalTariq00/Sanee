import React, { useState, useEffect, useRef } from 'react';
import { Bell, Mail, Menu, X, Settings, LogOut, Wallet, Globe2, Search } from 'lucide-react'; // Added Search icon import
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSidebar } from './ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import config from '@/config';
import { useTranslation } from 'react-i18next';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);  // Notifications count
  const [messages, setMessages] = useState(0);  // Messages count
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [language, setLanguage] = useState(() => {
    const savedLang = sessionStorage.getItem('lang') || 'en';
    i18n.changeLanguage(savedLang);
    return savedLang;
  });

  const profileRef = useRef(null);
  const { user } = useAuth();
  const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || t('user');
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const avatar = user?.image ? `${config.IMG_BASE_URL}/storage/${user.image}` : 'https://placehold.co/256x256?text=Avatar';

  // Initialize real-time updates using Echo
  useEffect(() => {
    if (!user) return;

    const echo = new Echo({
      broadcaster: "pusher",
      key: "fb3d6f3052ad033ccb47",
      cluster: "ap2",
      forceTLS: true,
      encrypted: true,
      authEndpoint: `${config.API_BASE_URL}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
      enabledTransports: ["ws", "wss"],
    });

    // Subscribe to Pusher channel for notifications and messages
    const notificationChannel = echo.private(`notifications.${user.id}`);
    const messageChannel = echo.private(`messages.${user.id}`);

    // Listen for new notification
    notificationChannel.listen(".notification.created", (data: any) => {
      setNotifications(prev => prev + 1); // Increment notification count
    });

    // Listen for new message
    messageChannel.listen(".message.received", (data: any) => {
      setMessages(prev => prev + 1); // Increment message count
    });

    return () => {
      echo.leave(`notifications.${user.id}`);
      echo.leave(`messages.${user.id}`);
      echo.disconnect();
    };
  }, [user]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const isActiveRoute = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-16 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          {isCollapsed && (
            <Link to="/" className="text-red-500 text-3xl font-bold tracking-tight">
              Sanee
            </Link>
          )}

          <nav className={`hidden md:flex items-center ${language === 'ar' ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
            <div className="relative w-64">
              <input
                type="text"
                placeholder={t("search_placeholder")}
                className={`w-full py-2 pl-10 pr-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500`}
              />
              <Search className={`absolute top-2.5 h-5 w-5 text-gray-400`} />
            </div>
          </nav>

          <div className={`hidden md:flex items-center ${language === 'ar' ? 'space-x-reverse space-x-5' : 'space-x-5'}`}>
            <button
              onClick={toggleLanguage}
              className="text-gray-700 hover:text-red-500 flex items-center gap-2"
            >
              <Globe2 className="h-5 w-5" />
              <span className="text-sm capitalize">
                {language === 'en' ? t('arabic') : t('english')}
              </span>
            </button>

            <button
              onClick={() => user?.uid && navigate(`/messages/${user.uid}`)}
              className="relative text-gray-700 hover:text-red-500"
            >
              <Mail className="h-6 w-6" />
              {messages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {messages}
                </span>
              )}
            </button>

            <button onClick={() => navigate('/notifications')} className="relative text-gray-700 hover:text-red-500">
              <Bell className="h-6 w-6" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            <div className="relative" ref={profileRef}>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="relative">
                <img
                  src={avatar}
                  alt="Profile"
                  className="h-8 w-8 rounded-full border border-gray-300 object-cover cursor-pointer"
                />
              </button>

              {isProfileOpen && (
                <div
                  className={`absolute mt-2 w-52 bg-white rounded-xl shadow-lg py-2 border`}
                >
                  <p className="text-gray-800 px-4 py-2 text-sm font-medium">{userName}</p>
                  <div className="divide-y text-sm">
                    <Link to="/profile" className={`block px-4 py-2 ${isActiveRoute('/profile') ? 'text-red-500 bg-red-50' : 'text-gray-700 hover:bg-gray-100'}`}>
                      {t("view_profile")}
                    </Link>
                    <button
                      onClick={() => user?.uid && navigate(`/messages/${user.uid}`)}
                      className={`flex w-full text-left items-center px-4 py-2 ${isActiveRoute('/messages') ? 'text-red-500 bg-red-50' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <Mail className="h-4 w-4 mr-2" /> {t("messages")}
                    </button>
                    <Link to="/wallet" className={`flex items-center px-4 py-2 ${isActiveRoute('/balance') ? 'text-red-500 bg-red-50' : 'text-gray-700 hover:bg-gray-100'}`}>
                      <Wallet className="h-4 w-4 mr-2" /> {t("balance")}
                    </Link>
                    <Link to="/notification-settings" className={`flex items-center px-4 py-2 ${isActiveRoute('/settings') ? 'text-red-500 bg-red-50' : 'text-gray-700 hover:bg-gray-100'}`}>
                      <Settings className="h-4 w-4 mr-2" /> {t("settings")}
                    </Link>
                    <Link to="/logout" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                      <LogOut className="h-4 w-4 mr-2" /> {t("sign_out")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button className="md:hidden text-gray-700" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-sm">
          <div className="px-4 py-4 space-y-2 text-sm">
            <Link to="/" className={`block px-3 py-2 rounded-md ${isActiveRoute('/') ? 'text-red-500 bg-red-50' : 'text-gray-700'} hover:text-red-500`}>
              {t("home")}
            </Link>
            <Link to="/my-projects" className={`block px-3 py-2 rounded-md ${isActiveRoute('/my-projects') ? 'text-red-500 bg-red-50' : 'text-gray-700'} hover:text-red-500`}>
              {t("my_projects")}
            </Link>
            <Link to="/jobs" className={`block px-3 py-2 rounded-md ${isActiveRoute('/jobs') ? 'text-red-500 bg-red-50' : 'text-gray-700'} hover:text-red-500`}>
              {t("jobs")}
            </Link>
            <button
              onClick={() => user?.uid && navigate(`/messages/${user.uid}`)}
              className={`w-full text-left block px-3 py-2 rounded-md ${isActiveRoute('/messages') ? 'text-red-500 bg-red-50' : 'text-gray-700'} hover:text-red-500`}
            >
              {t("messages")}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

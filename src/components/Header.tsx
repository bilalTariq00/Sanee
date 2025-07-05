import React, { useState, useRef, useEffect } from 'react';
import {
  Bell, Mail, Menu, Search, X, Settings, LogOut, Wallet, Globe2
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSidebar } from './ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import config from '@/config';
import { useTranslation } from 'react-i18next';
import { useNotificationSettings } from '@/contexts/NotificationContext'; // ✅ Import notification context
import Swal from 'sweetalert2'; 
export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { unreadCount: notificationCount } = useNotificationSettings(); // ✅ Real-time notifications
  const messageCount = 0; // 🔁 TODO: Replace with real unread message count from context or API
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [language, setLanguage] = useState(() => {
    const savedLang = sessionStorage.getItem('lang') || 'en';
    i18n.changeLanguage(savedLang);
    return savedLang;
  });

  const location = useLocation();
  const profileRef = useRef(null);
  const { user } = useAuth();
  const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || t('user');
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const avatar = user?.image
    ? `${config.IMG_BASE_URL}/storage/${user.image}`
    : 'https://placehold.co/256x256?text=Avatar';

  const isRTL = language === 'ar';

  useEffect(() => {
    const dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    sessionStorage.setItem('lang', language);
    i18n.changeLanguage(language);
  }, [language, i18n]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !(profileRef.current as any).contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const isActiveRoute = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };
const handleSignOut = () => {
  Swal.fire({
    title: 'Are you sure?',
    text: "You will be signed out!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#aaa',
    confirmButtonText: 'Yes, sign out!',
  }).then((result) => {
    if (result.isConfirmed) {
      navigate('/logout'); // ✅ Perform signout navigation
    }
  });
};
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className={`flex items-center justify-between h-16 ${isRTL ? 'flex-end' : ''}`}>
          {isCollapsed && (
            <Link to="/" className="text-red-500 text-3xl font-bold tracking-tight">
              <img src='/sanee.png' className="h-16 w-fit" alt="Logo" />
            </Link>
          )}

         <nav className={`hidden md:flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
            {/* <div className="relative w-64">
              <input
                type="text"
                placeholder={t("search_placeholder")}
                className="w-full py-2 pl-10 pr-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <Search className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
            </div> */}
          </nav>

          <div className={`hidden md:flex items-center ${isRTL ? 'space-x-reverse space-x-5' : 'space-x-5'}`}>
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
              {messageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {messageCount}
                </span>
              )}
            </button>

            <button onClick={() => navigate('/notifications')} className="relative text-gray-700 hover:text-red-500">
              <Bell className="h-6 w-6" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notificationCount}
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
                <div className={`absolute mt-2 w-52 bg-white rounded-xl shadow-lg py-2 border ${isRTL ? 'left-0' : 'right-0'}`}>
                  <p className="text-gray-800 px-4 py-2 text-sm font-medium">{userName}</p>
                  <div className="divide-y text-sm">
                    <Link to={`/profile/${user?.uid}`} className={`block px-4 py-2 ${isActiveRoute('/profile') ? 'text-red-500 bg-red-50' : 'text-gray-700 hover:bg-gray-100'}`}>
                      {t("view_profile")}
                    </Link>
                    <button
                      onClick={() => user?.uid && navigate(`/messages/${user.uid}`)}
                      className={`flex w-full text-left items-center px-4 py-2 ${isActiveRoute('/messages') ? 'text-red-500 bg-red-50' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <Mail className="h-4 w-4 mr-2" /> {t("messages")}
                    </button>
                    <Link to="/wallet" className={`flex items-center px-4 py-2 ${isActiveRoute('/balance') ? 'text-red-500 bg-red-50' : 'text-gray-700 hover:bg-gray-100'}`}>
                      <Wallet className="h-4 w-4 mr-2" /> {t("Wallet")}
                    </Link>
                    <Link to="/notification-settings" className={`flex items-center px-4 py-2 ${isActiveRoute('/settings') ? 'text-red-500 bg-red-50' : 'text-gray-700 hover:bg-gray-100'}`}>
                      <Settings className="h-4 w-4 mr-2" /> {t("settings")}
                    </Link>
                    <div onClick={handleSignOut} className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                      <LogOut className="h-4 w-4 mr-2" /> {t("sign_out")}
                    </div>
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

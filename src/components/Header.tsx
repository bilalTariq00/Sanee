import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Mail,
  Menu,
  X,
  Settings,
  LogOut,
  Wallet,
  Globe2,
  Navigation,
  Notebook,
  Workflow,
  Paperclip,
  Laptop,
  User,
  FileIcon,
  FileX2Icon,
  WorkflowIcon,
  Bookmark,
  HelpCircle,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import config from '@/config';
import { useTranslation } from 'react-i18next';
import { useNotificationSettings } from '@/contexts/NotificationContext';
import Swal from 'sweetalert2';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount: notificationCount } = useNotificationSettings();
  const { count: messageCount, markRead } = useUnreadMessages();

  // Language state and effect
  const [language, setLanguage] = useState(() => {
    const savedLang = sessionStorage.getItem('lang') || 'en';
    i18n.changeLanguage(savedLang);
    return savedLang;
  });

  useEffect(() => {
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    sessionStorage.setItem('lang', language);
    i18n.changeLanguage(language);
  }, [language, i18n]);

  const isRTL = language === 'ar';

  // User name and avatar
  const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || t('user');
  const avatar = user?.image
    ? `${config.IMG_BASE_URL}/storage/${user.image}`
    : 'https://placehold.co/256x256?text=Avatar';

  // Navigation items mimicking sidebar content
  const navigationItems = [
    { title: t('discover'), url: '/', icon: Navigation },
    { title: t('profile'), url: `/profile/${user?.uid}`, icon: User },
    ...(user?.account_type === 'seller'
      ? [
          { title: t('create_gig'), url: '/create-gig', icon: FileIcon },
          { title: t('manage_gig'), url: '/manage-gigs', icon: FileX2Icon },
          { title: t('seller_contract'), url: '/seller/contracts', icon: Workflow },
          { title: t('Wallet'), url: '/wallet', icon: Wallet },
          { title: t('save_job'), url: '/save-jobs', icon: WorkflowIcon },
        ]
      : []),
    ...(user?.account_type === 'buyer'
      ? [
          { title: t('add_job'), url: '/post-job', icon: Paperclip },
          { title: t('all_gigs'), url: '/gigs', icon: Laptop },
          { title: t('manage_jobs'), url: '/manage-jobs', icon: WorkflowIcon },
          { title: t('buyer_contract'), url: '/contracts', icon: Notebook },
          { title: t('saved_gigs'), url: '/saved-gigs', icon: Bookmark },
        ]
      : []),
    { title: t('support'), url: '/support', icon: HelpCircle },
  ];

  // Active route checker
  const isActiveRoute = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Toggle language
  const toggleLanguage = () => setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));

  // Go to messages
  const goToMessages = () => {
    if (user?.uid) {
      markRead(user.uid);
      navigate(`/messages/${user.uid}`);
    }
  };

  // Sign out handler
  const handleSignOut = () => {
    Swal.fire({
      title: t('are_you_sure'),
      text: t('signed_out_text'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: t('yes_sign_out'),
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${config.API_BASE_URL}/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (response.ok) {
            localStorage.removeItem('token');
            navigate('/');
            window.location.reload();
          } else {
            Swal.fire(t('error'), t('sign_out_failed'), 'error');
          }
        } catch (error) {
          Swal.fire(t('error'), t('something_went_wrong'), 'error');
          console.error('Logout error:', error);
        }
      }
    });
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-16 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Logo */}
          <Link to="/" className="text-red-500 text-3xl font-bold tracking-tight flex-shrink-0">
            <img src="/sanee.png" className="h-16 w-auto" alt="Logo" />
          </Link>

          {/* Navigation links for md+ */}
          {/* <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map(({ title, url, icon: Icon }) => (
              <Link
                key={url}
                to={url}
                className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium
                  ${isActiveRoute(url) ? 'text-red-600 bg-red-100' : 'text-gray-700 hover:text-red-500 hover:bg-red-50'}`}
              >
                <Icon className="h-5 w-5" />
                <span>{title}</span>
              </Link>
            ))}
          </nav> */}

          {/* Right side buttons */}
          <div className={`hidden md:flex items-center space-x-5 ${isRTL ? 'space-x-reverse' : ''}`}>
            {/* Language toggle */}
            <button onClick={toggleLanguage} className="text-gray-700 hover:text-red-500 flex items-center gap-2">
              <Globe2 className="h-5 w-5" />
              <span className="text-sm capitalize">{language === 'en' ? t('arabic') : t('english')}</span>
            </button>

            {/* Messages */}
            <button onClick={goToMessages} className="relative text-gray-700 hover:text-red-500">
              <Mail className="h-6 w-6" />
              {messageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {messageCount}
                </span>
              )}
            </button>

            {/* Notifications */}
            <button onClick={() => navigate('/notifications')} className="relative text-gray-700 hover:text-red-500">
              <Bell className="h-6 w-6" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Profile dropdown */}
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
                  className={`absolute mt-2 w-52 bg-white rounded-xl shadow-lg py-2 border ${
                    isRTL ? 'left-0' : 'right-0'
                  }`}
                >
                  <p className="text-gray-800 px-4 py-2 text-sm font-medium">{userName}</p>
                  <div className="divide-y text-sm">
                    <Link
                      to={`/profile/${user?.uid}`}
                      className={`block px-4 py-2 ${
                        isActiveRoute('/profile') ? 'text-red-500 bg-red-50' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {t('view_profile')}
                    </Link>
                    <button
                      onClick={() => user?.uid && navigate(`/messages/${user.uid}`)}
                      className={`flex w-full text-left items-center px-4 py-2 ${
                        isActiveRoute('/messages') ? 'text-red-500 bg-red-50' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Mail className="h-4 w-4 mr-2" /> {t('messages')}
                    </button>
                    <Link
                      to="/wallet"
                      className={`flex items-center px-4 py-2 ${
                        isActiveRoute('/wallet') ? 'text-red-500 bg-red-50' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Wallet className="h-4 w-4 mr-2" /> {t('Wallet')}
                    </Link>
                    <Link
                      to="/notification-settings"
                      className={`flex items-center px-4 py-2 ${
                        isActiveRoute('/notification-settings')
                          ? 'text-red-500 bg-red-50'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Settings className="h-4 w-4 mr-2" /> {t('settings')}
                    </Link>
                    <div
                      onClick={handleSignOut}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" /> {t('sign_out')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden text-gray-700" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-sm">
          <div className="px-4 py-4 space-y-2 text-sm">
            {navigationItems.map(({ title, url }) => (
              <Link
                key={url}
                to={url}
                className={`block px-3 py-2 rounded-md ${
                  isActiveRoute(url) ? 'text-red-500 bg-red-50' : 'text-gray-700'
                } hover:text-red-500`}
                onClick={() => setIsMenuOpen(false)}
              >
                {title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

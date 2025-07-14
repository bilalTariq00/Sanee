import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Navigation,
  Notebook,
  Workflow,
  Paperclip,
  Laptop,
  User,
  FileIcon,
  FileX2Icon,
  Wallet,
  WorkflowIcon,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import config from '@/config';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';


export function AppSidebar() {
   const navigate = useNavigate();
  const { t } = useTranslation();
  const { state } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  const [userStatus, setUserStatus] = useState({
    status: 'available',
    icon: '🟢',
    color: '#28a745',
  });

  const isCollapsed = state === 'collapsed';
  const currentPath = location.pathname;
  const isRTL = document.documentElement.dir === 'rtl';

  const avatar = user?.image
    ? `${config.IMG_BASE_URL}/storage/${user.image}`
    : 'https://placehold.co/256x256?text=Avatar';

  const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User';

  const navigationItems = [
    { title: t('discover'), url: '/', icon: Navigation },
    { title: t('profile'), url: `/profile/${user?.uid}`, icon: User },
  ];
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
  const isActive = (path) =>
    path.startsWith('/profile')
      ? currentPath.startsWith('/profile')
      : currentPath === path;

  // Fetch user status on component mount
  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const response = await fetch(`/api/users/${user?.uid}/status`);
        const data = await response.json();
        if (data.success) {
          setUserStatus(data.data);
        }
      } catch (error) {
        console.error('Error fetching user status:', error);
      }
    };

    if (user?.uid) {
      fetchUserStatus();
    }
  }, [user]);

  return (
    <Sidebar
      className={`border-gray-100 transition-all duration-300 fixed top-0 bottom-0 z-50 ${
        isCollapsed ? 'w-fit' : 'w-fit'
      } ${isRTL ? 'right-0 border-l' : 'left-0 border-r'}`}
      collapsible="icon"
    >
      <SidebarContent className="bg-white w-fit">
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          {!isCollapsed && (
            <Link to="/" className=" ">
              <img src='/sanee.png' className="text-xl font-semibold text-red-500 h-16 w-fit"/>
            </Link>
          )}
        </div>

        {/* Profile Block */}
        <SidebarGroup className="px-6 py-4">
          <SidebarGroupContent>
            <div className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="relative">
                <img
                  src={avatar}
                  alt="Profile"
                  className="h-10 w-10 rounded-full ring-2 ring-white shadow-sm"
                />
                 <span
    className="absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full border-2 border-white"
    style={{ backgroundColor: userStatus.color }}
    title={userStatus.status === 'online' ? 'Online' : 'Offline'}
  />
                {/* <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" /> */}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{userName}</p>
                  <p className="text-sm text-gray-500 truncate"></p>
                  <div className="flex items-center gap-2 mt-2">
                  </div>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation Menu */}
        <SidebarGroup className="px-6 py-4">
          {!isCollapsed && (
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
              {t('navigation')}
            </div>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                        isActive(item.url)
                          ? 'bg-red-500 text-white shadow-md'
                          : 'text-gray-700 hover:bg-red-100 hover:text-red-600'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* Seller Routes */}
              {user?.account_type === 'seller' && (
                <>
                  {[
  { path: '/create-gig',     label: t('create_gig'),     icon: FileIcon },
  { path: '/manage-gigs',    label: t('manage_gig'),     icon: FileX2Icon },
  { path: '/seller/contracts',label: t('seller_contract'),icon: Workflow },
  { path: '/wallet',         label: t('Wallet'),          icon: Wallet },
  // { path: '/jobs',           label: t('jobs'),            icon: WorkflowIcon },
  { path: '/save-jobs',           label: t('Save jobs'),            icon: WorkflowIcon },
].map(({ path, label, icon: Icon }) => (
  <SidebarMenuItem key={path}>
    <SidebarMenuButton asChild>
      <Link
        to={path}
        className={`
          flex items-center gap-3 p-3 rounded-xl transition-all duration-200
          text-gray-700 hover:bg-red-100 hover:text-red-600
          ${isCollapsed ? 'justify-center' : ''}
        `}
      >
        {/* now use the capitalized Icon */}
        <Icon className="h-5 w-5" />
        {!isCollapsed && <span className="font-medium">{label}</span>}
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
))}

                </>
              )}
              {/* Buyer Routes */}
              {user?.account_type === 'buyer' && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/post-job" className={`flex items-center gap-3 p-3 rounded-xl text-gray-700 hover:bg-red-100 hover:text-red-600 ${isCollapsed ? 'justify-center' : ''}`}>
                        <Paperclip className="h-4 w-4" />
                        {!isCollapsed && <span className="font-medium">{t('add_job')}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/gigs" className={`flex items-center gap-3 p-3 rounded-xl text-gray-700 hover:bg-red-100 hover:text-red-600 ${isCollapsed ? 'justify-center' : ''}`}>
                        <Laptop className="h-4 w-4" />
                        {!isCollapsed && <span className="font-medium">{t('all_gigs')}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/manage-jobs" className={`flex items-center gap-3 p-3 rounded-xl text-gray-700 hover:bg-red-100 hover:text-red-600 ${isCollapsed ? 'justify-center' : ''}`}>
                        <span className="h-5 w-5">🔧</span>
                        {!isCollapsed && <span className="font-medium">{t('manage_jobs')}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/contracts" className={`flex items-center gap-3 p-3 rounded-xl text-gray-700 hover:bg-red-100 hover:text-red-600 ${isCollapsed ? 'justify-center' : ''}`}>
                        <Notebook className="h-5 w-5" />
                        {!isCollapsed && <span className="font-medium">{t('buyer_contract')}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="flex-1" />

        {/* Sign Out */}
        <SidebarGroup className="px-6 py-4 border-t border-gray-100">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button onClick={handleSignOut} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-red-50 hover:text-red-600 w-full text-left ${isCollapsed ? 'justify-center' : ''}`}>
                    <LogOut className="h-5 w-5" />
                    {!isCollapsed && <span className="font-medium">{t('sign_out')}</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sidebar Toggle */}
        <div className={`absolute top-6 ${isRTL ? 'left-0 pl-1' : 'right-0 pr-1'}`}>
          <SidebarTrigger className="h-6 w-6 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow" />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

import React, { useState, useCallback, useEffect } from 'react';
import SidebarItem from './SidebarItem';
import {
  CubeTransparentIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  UsersIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  BookOpenIcon,
  UserCircleIcon,
  EnvelopeIcon,
} from './icons';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '../../shared/firebase-config';
import { signOut } from 'firebase/auth';
import { auth } from '../../shared/firebase-config';


export interface IconProps {
  className?: string;
  strokeWidth?: string | number;
  fill?: string;
}

export interface SidebarItemInfo {
  id: string;
  label: string;
  icon: React.ElementType<IconProps>;
  action?: () => void;
}

interface SidebarProps {
  activeItemId: string;
  onItemClick: (id: string) => void;
  onExpandChange?: (isExpanded: boolean) => void;
}

const mainNavItems: SidebarItemInfo[] = [
  { id: 'dashboard', label: 'Bảng điều khiển', icon: Squares2X2Icon },
  { id: 'manage-courses', label: 'Quản lý môn học', icon: BookOpenIcon },
  { id: 'manage-users', label: 'Quản lý người dùng', icon: UsersIcon },
];

const accountNavItems: SidebarItemInfo[] = [
  { id: 'admin-profile', label: 'Hồ sơ quản trị', icon: UserCircleIcon },
  { id: 'settings', label: 'Hộp thư', icon: EnvelopeIcon },
  { id: 'notifications', label: 'Thông báo', icon: BellIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ activeItemId, onItemClick, onExpandChange }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const navigate = useNavigate();
  const [hasNewWarning, setHasNewWarning] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const handleItemClick = useCallback((id: string) => {
    if (id === 'manage-students') {
      navigate('/admin/manage-students');
      return;
    }
    onItemClick(id);
    console.log(`Sidebar item clicked: ${id}`);
  }, [onItemClick, navigate]);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => {
      const newState = !prev;
      onExpandChange?.(newState);
      return newState;
    });
  }, [onExpandChange]);



  useEffect(() => {
    const violationsRef = ref(realtimeDb, 'exam-violations');
    const handle = onValue(violationsRef, (snapshot) => {
      const data = snapshot.val();
      let arr = [];
      if (data) {
        Object.entries(data).forEach(([examId, users]) => {
          if (typeof users === 'object' && users !== null) {
            Object.entries(users as Record<string, any>).forEach(([userId, info]) => {
              arr.push({ ...info, examId, userId });
            });
          }
        });
      }
      setHasNewWarning(arr.length > 0);
    });
    return () => handle();
  }, []);

  // Lắng nghe notifications từ Realtime Database
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notificationsRef = ref(realtimeDb, `notifications/${user.uid}`);
    const handle = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notifications = Object.values(data);
        const unreadCount = notifications.filter((notification: any) => !notification.isRead).length;
        setUnreadNotificationCount(unreadCount);
      } else {
        setUnreadNotificationCount(0);
      }
    });

    return () => handle();
  }, []);



  // Lấy user info từ firebase auth
  const user = auth.currentUser;
  const userName = user?.displayName || 'Admin';
  const userEmail = user?.email || '';
  const userPhoto = user?.photoURL || 'https://picsum.photos/seed/user123/40/40';

  return (
    <aside className={`sidebar-transition bg-slate-900 text-slate-300 flex flex-col fixed top-0 left-0 h-screen z-50 shadow-2xl overflow-y-hidden ${isExpanded ? 'w-48 sm:w-64 p-2 sm:p-4' : 'w-16 sm:w-20 md:w-24 p-1 sm:p-3 items-center'}`}>
      {/* Nút thu gọn/mở rộng sidebar */}
      {/* Header: Logo, Title (if expanded) */}
      <div className={`flex items-center w-full mb-5 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
        <div
          className={`flex items-center ${!isExpanded ? 'cursor-pointer relative group' : ''}`}
          onClick={!isExpanded ? toggleExpand : undefined}
          role={!isExpanded ? "button" : undefined}
          aria-label={!isExpanded ? "Expand Sidebar" : "ADMIN Company Logo"}
          tabIndex={!isExpanded ? 0 : undefined}
          onKeyDown={!isExpanded ? (e) => (e.key === 'Enter' || e.key === ' ') && toggleExpand() : undefined}
        >
          <CubeTransparentIcon className={`text-sky-400 flex-shrink-0 ${isExpanded ? 'w-7 h-7' : 'w-7 h-7 md:w-8 md:h-8'}`} />
          {isExpanded && <span className="ml-3 text-xl font-bold text-slate-100">ADMIN MANAGER</span>}
          {!isExpanded && (
            <>
              <ChevronRightIcon className="w-4 h-4 md:w-5 md:h-5 absolute right-[-10px] md:right-[-12px] top-1/2 transform -translate-y-1/2 text-slate-500 group-hover:text-sky-400 transition-colors duration-150" />
              <div
                className="absolute left-full ml-4 px-3 py-2 text-sm font-medium text-white bg-slate-800/95 backdrop-blur-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none transform translate-x-[-8px] group-hover:translate-x-0 z-50"
                role="tooltip"
              >
                Expand
                <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800/95 transform rotate-45"></div>
              </div>
            </>
          )}
        </div>
      </div>



      {/* Main Navigation Items */}
      <nav className={`flex-grow space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50 ${isExpanded ? 'pr-0 -mr-0.5' : 'pr-1 -mr-1'}`}>
        {isExpanded && <h3 className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Chính</h3>}
        {mainNavItems.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            isActive={activeItemId === item.id}
            isExpanded={isExpanded}
            onClick={() => handleItemClick(item.id)}
          />
        ))}
      </nav>

      {/* Account Navigation Items & Profile */}
      <div className={`mt-auto pt-3 border-t w-full flex flex-col justify-end ${isExpanded ? 'border-slate-700/60' : 'border-slate-700 items-center'}`}>
        {isExpanded && <h3 className="px-3 pt-1 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tài khoản</h3>}
        {accountNavItems.map((item) => (
          <div style={{ position: 'relative' }} key={item.id}>
            <SidebarItem
              item={item}
              isActive={activeItemId === item.id}
              isExpanded={isExpanded}
              onClick={() => handleItemClick(item.id)}
            />
            {item.id === 'notifications' && (hasNewWarning || unreadNotificationCount > 0) && (
              <span style={{
                position: 'absolute',
                top: 8,
                right: isExpanded ? 24 : 8,
                background: unreadNotificationCount > 0 ? '#3b82f6' : 'red',
                color: 'white',
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 'bold',
              }}>
                {unreadNotificationCount > 0 ? unreadNotificationCount : '!'}
              </span>
            )}
          </div>
        ))}

        {/* User Info / Logout Button */}
        <div className={`w-full ${isExpanded ? 'mt-2' : 'mt-1 md:mt-2'}`}>
          <div className="flex items-center w-full p-2.5 rounded-lg group text-left">
            <img
              src={userPhoto}
              alt="User profile"
              className="w-8 h-8 rounded-full border-2 border-slate-600 group-hover:border-sky-500 transition-colors flex-shrink-0"
            />
            <div className="ml-2.5 flex-grow overflow-hidden">
              <p className="text-sm font-semibold text-slate-100 truncate">{userName}</p>
              <p className="text-xs text-slate-400 truncate">{userEmail}</p>
            </div>
            <button
              className="ml-2 flex-shrink-0 text-slate-400 hover:text-red-400 transition-colors"
              aria-label="Đăng xuất"
              onClick={async () => {
                if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                  await signOut(auth);
                  console.log('Đã đăng xuất!');
                }
              }}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
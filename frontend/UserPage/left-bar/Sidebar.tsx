import React, { useState, useCallback, useRef, useEffect } from 'react';
import SidebarItem from './SidebarItem';
import { auth, storage, realtimeDb } from '../../shared/firebase-config';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, onValue } from 'firebase/database';
import { signOut } from 'firebase/auth';

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

import {
  CubeTransparentIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon, // My Courses
  DocumentTextIcon, // My Assignments
  ChartBarIcon, // My Grades
  UserCircleIcon, // Profile
  Cog6ToothIcon, // Settings
  BellIcon, // Notifications
  ArrowRightOnRectangleIcon, // Logout
  CameraIcon,
  EnvelopeIcon, // Hộp thư
} from './icons'; // Adjusted path

const mainNavItems: SidebarItemInfo[] = [
  { id: 'my-courses', label: 'Khóa học của tôi', icon: AcademicCapIcon },
];

const accountNavItems: SidebarItemInfo[] = [
  { id: 'profile', label: 'Hồ sơ', icon: UserCircleIcon },
  { id: 'settings', label: 'Hộp thư', icon: EnvelopeIcon },
  { id: 'notifications', label: 'Thông báo', icon: BellIcon },
];

interface SidebarProps {
  activeItemId: string;
  onItemClick: (id: string) => void;
  onExpandChange?: (isExpanded: boolean) => void;
  unreadMessageCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItemId, onItemClick, onExpandChange, unreadMessageCount }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const handleItemClick = useCallback((id: string) => {
    onItemClick(id);
    if (id === 'my-courses') {
      window.dispatchEvent(new CustomEvent('user-sidebar-click', { detail: 'my-courses' }));
    }
    // In a real app, this would trigger navigation or content update in UserForm.tsx
    console.log(`User sidebar item clicked: ${id}`);
  }, [onItemClick]);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => {
      const newState = !prev;
      onExpandChange?.(newState);
      return newState;
    });
  }, [onExpandChange]);
  
  const [focusSearchOnExpand, setFocusSearchOnExpand] = useState(false);
  useEffect(() => {
    if (isExpanded && focusSearchOnExpand && searchInputRef.current) {
      searchInputRef.current.focus();
      setFocusSearchOnExpand(false);
    }
  }, [isExpanded, focusSearchOnExpand]);

  // Lấy user info từ firebase auth
  const user = auth.currentUser;
  const userName = user?.displayName || 'User';
  const userEmail = user?.email || 'user@example.com';
  const userPhoto = user?.photoURL || 'https://picsum.photos/seed/user99/40/40';

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Vui lòng chọn file hình ảnh!' });
      return;
    }

    // Kiểm tra kích thước file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Kích thước file không được vượt quá 5MB!' });
      return;
    }

    setIsUploadingAvatar(true);
    setMessage(null);

    try {
      // Tạo reference cho file trong storage
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Lấy URL download
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Cập nhật profile với avatar mới
      await updateProfile(user, {
        photoURL: downloadURL
      });
      
      setMessage({ type: 'success', text: 'Cập nhật avatar thành công!' });
      
      // Tự động ẩn message sau 3 giây
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Lỗi upload avatar:', error);
      setMessage({ 
        type: 'error', 
        text: 'Có lỗi xảy ra khi cập nhật avatar'
      });
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Lắng nghe notifications từ Realtime Database
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notificationsRef = dbRef(realtimeDb, `notifications/${user.uid}`);
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

  return (
    <aside className={`sidebar-transition bg-slate-900 text-slate-300 flex flex-col fixed top-0 left-0 h-screen z-50 shadow-2xl overflow-y-hidden ${isExpanded ? 'w-48 sm:w-64 p-2 sm:p-4' : 'w-16 sm:w-20 md:w-24 p-1 sm:p-3 items-center'}`}>
      {/* Message */}
      {message && (
        <div className={`absolute top-4 left-4 right-4 z-50 p-3 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}
      {/* Header */}
      <div className={`flex items-center w-full mb-5 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
        <div
          className={`flex items-center ${!isExpanded ? 'cursor-pointer relative group' : ''}`}
          onClick={!isExpanded ? toggleExpand : undefined}
          role={!isExpanded ? "button" : undefined}
          aria-label={!isExpanded ? "Expand Sidebar" : "User Portal Logo"}
          tabIndex={!isExpanded ? 0 : undefined}
          onKeyDown={!isExpanded ? (e) => (e.key === 'Enter' || e.key === ' ') && toggleExpand() : undefined}
        >
          <CubeTransparentIcon className={`text-sky-400 flex-shrink-0 ${isExpanded ? 'w-7 h-7' : 'w-7 h-7 md:w-8 md:h-8'}`} />
          {isExpanded && <span className="ml-3 text-xl font-bold text-slate-100">User Portal</span>}
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

        {isExpanded && (
          <button
            onClick={toggleExpand}
            aria-label="Thu gọn thanh bên"
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-700/70 hover:text-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-sky-500"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Area */}
      {isExpanded ? (
        <div className="relative mb-5">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Tìm kiếm..."
            aria-label="Tìm kiếm"
            className="w-full bg-slate-800 border border-slate-700/60 text-slate-200 placeholder-slate-500 rounded-lg py-2 pl-10 pr-3 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 focus:outline-none text-sm"
          />
        </div>
      ) : (
        <div className="mb-4 md:mb-5 w-full flex justify-center relative group">
          <button
            onClick={() => { 
              setIsExpanded(true);
              setFocusSearchOnExpand(true);
            }}
            aria-label="Mở tìm kiếm"
            className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-sky-400 focus-visible:bg-slate-700 focus-visible:text-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-opacity-75"
          >
            <MagnifyingGlassIcon className="w-5 h-5 md:w-6 md:h-6" />
          </button>
           <div className="absolute left-full ml-3 px-3 py-2 text-sm font-medium text-white bg-slate-800/95 backdrop-blur-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none transform translate-x-[-8px] group-hover:translate-x-0 z-50" role="tooltip">
            Search
            <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800/95 transform rotate-45"></div>
          </div>
        </div>
      )}

      {/* Main Navigation Items */}
      <nav className={`flex-grow space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50 ${isExpanded ? 'pr-0 -mr-0.5' : 'pr-1 -mr-1'}`}>
        {isExpanded && <h3 className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu</h3>}
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
          </div>
        ))}
        
        {/* User Info / Logout Button */}
        <div className={`w-full ${isExpanded ? 'mt-2' : 'mt-1 md:mt-2'}`}>
          {isExpanded ? (
            <div className="flex items-center w-full p-2.5 rounded-lg group text-left">
              <div className="relative group/avatar">
                <img
                  src={userPhoto}
                  alt="User profile picture" 
                  className="w-8 h-8 rounded-full border-2 border-slate-600 group-hover:border-sky-500 transition-colors flex-shrink-0"
                />
                
                {/* Overlay với nút upload */}
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <button
                    onClick={triggerFileInput}
                    disabled={isUploadingAvatar}
                    className="p-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
                    title="Thay đổi avatar"
                  >
                    {isUploadingAvatar ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CameraIcon className="w-3 h-3 text-white" />
                    )}
                  </button>
                </div>
              </div>
              
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
          ) : (
            <div className="relative group flex justify-center">
              <div className="relative group/avatar">
                <img
                  src={userPhoto}
                  alt="User Profile"
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-slate-600 group-hover:border-sky-500 transition-colors"
                />
                
                {/* Overlay với nút upload cho collapsed mode */}
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <button
                    onClick={triggerFileInput}
                    disabled={isUploadingAvatar}
                    className="p-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
                    title="Thay đổi avatar"
                  >
                    {isUploadingAvatar ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CameraIcon className="w-3 h-3 text-white" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="absolute left-full ml-3 px-3 py-2 text-sm font-medium text-white bg-slate-800/95 backdrop-blur-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none transform translate-x-[-8px] group-hover:translate-x-0 z-50" role="tooltip">
                {userName}
                <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800/95 transform rotate-45"></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="hidden"
        />
      </div>
    </aside>
  );
};

export default Sidebar;
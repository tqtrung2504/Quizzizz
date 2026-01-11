import React, { useState, useEffect } from 'react';
import { realtimeDb, auth } from '../shared/firebase-config';
import { ref, onValue } from 'firebase/database';
import { notificationService, type Notification as NotificationType } from '../services/notificationService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UserNotification: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Lấy notifications của user hiện tại
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userNotifications = await notificationService.getUserNotifications();
          setNotifications(userNotifications);
          setUnreadCount(userNotifications.filter(n => !n.isRead).length);
        }
      } catch (error) {
        console.error('Lỗi khi tải notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();
  }, []);

  // Lắng nghe notifications realtime
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const notificationsRef = ref(realtimeDb, `notifications/${user.uid}`);
    const handle = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationsList = Object.values(data).map((notification: any) => ({
          id: notification.id,
          userId: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          relatedId: notification.relatedId,
          isRead: notification.isRead,
          createdAt: new Date(notification.createdAt),
          readAt: notification.readAt ? new Date(notification.readAt) : undefined,
        }));
        // Sắp xếp mới nhất lên đầu
        notificationsList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        // Nếu có notification mới, hiện popup
        if (notificationsList.length > notifications.length) {
          const newNoti = notificationsList.find(n => !notifications.some(o => o.id === n.id));
          if (newNoti) {
            toast.info(`${newNoti.title}: ${newNoti.message}`, { autoClose: 4000 });
          }
        }
        setNotifications(notificationsList);
        setUnreadCount(notificationsList.filter(n => !n.isRead).length);
        // Scroll lên notification mới nhất
        setTimeout(() => {
          if (listRef.current) listRef.current.scrollTop = 0;
        }, 100);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    });
    return () => handle();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      // Sau khi đánh dấu đã đọc, cập nhật lại notifications
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Lỗi khi đánh dấu notification đã đọc:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      // Sau khi xóa, cập nhật lại notifications
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Lỗi khi xóa notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllNotificationsAsRead();
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả notifications đã đọc:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'exam_created':
        return '📝';
      case 'course_added':
        return '📚';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'exam_created':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'course_added':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-8 gap-2 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Thông báo của tôi</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="bg-sky-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 transition-colors"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="text-slate-400 mb-4">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5v-5zM4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-600 mb-2">Chưa có thông báo nào</h3>
          <p className="text-slate-500">Bạn sẽ nhận được thông báo khi có hoạt động mới.</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl shadow-sm border p-3 sm:p-4 transition-all duration-200 ${
                !notification.isRead ? 'border-sky-200 bg-sky-50/50' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                    notification.type === 'exam' ? 'bg-orange-100 text-orange-600' :
                    notification.type === 'course' ? 'bg-green-100 text-green-600' :
                    notification.type === 'message' ? 'bg-blue-100 text-blue-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {notification.type === 'exam' && (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {notification.type === 'course' && (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    )}
                    {notification.type === 'message' && (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm sm:text-base text-slate-800 truncate">
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="bg-sky-500 text-white text-xs px-2 py-0.5 rounded-full">Mới</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-slate-500">
                        {new Date(notification.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 mb-2 sm:mb-3 line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      notification.type === 'exam' ? 'bg-orange-100 text-orange-700' :
                      notification.type === 'course' ? 'bg-green-100 text-green-700' :
                      notification.type === 'message' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {notification.type === 'exam' ? 'Bài Thi Mới' :
                       notification.type === 'course' ? 'Được Thêm' :
                       notification.type === 'message' ? 'Tin Nhắn' : 'Thông Báo'}
                    </span>
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className={`px-2 py-1 text-xs rounded ${
                        notification.isRead
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                      }`}
                      disabled={notification.isRead}
                    >
                      {notification.isRead ? 'Đã đọc' : 'Đánh dấu đã đọc'}
                    </button>
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {notifications.length > 0 && (
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="text-sm sm:text-base text-slate-600">
              Tổng cộng: {notifications.length} thông báo ({unreadCount} chưa đọc)
            </div>
            <div className="text-xs sm:text-sm text-slate-500">
              Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN', { hour12: false })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserNotification; 
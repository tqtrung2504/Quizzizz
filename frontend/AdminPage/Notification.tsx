import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { realtimeDb, auth } from '../shared/firebase-config';
import { ref, onValue } from 'firebase/database';
import { notificationService, type Notification as NotificationType } from '../services/notificationService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Group {
  id: string;
  name: string;
  type: 'class' | 'subject';
}

const Notification: React.FC = () => {
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notifications' | 'violations'>('notifications');

  useEffect(() => {
    // Lấy danh sách lớp/môn học từ backend
    axios.get<Group[]>('/api/notification-groups').then(res => setGroups(res.data));

    const violationsRef = ref(realtimeDb, 'exam-violations');
    const handle = onValue(violationsRef, (snapshot) => {
      const data = snapshot.val();
      let arr: any[] = [];
      if (data) {
        Object.entries(data).forEach(([examId, users]: any) => {
          Object.entries(users).forEach(([userId, info]: any) => {
            arr.push({ ...info, examId, userId });
          });
        });
      }
      arr.sort((a, b) => b.timestamp - a.timestamp);
      setViolations(arr);
      setHasNew(arr.length > 0);
    });
    return () => handle();
  }, []);

  // Lấy notifications của user hiện tại
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userNotifications = await notificationService.getUserNotifications();
          setNotifications(userNotifications);
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
        setNotifications(notificationsList);
      } else {
        setNotifications([]);
      }
    });

    return () => handle();
  }, []);

  const handleSend = async () => {
    setStatus('');
    if (!message.trim()) {
      setStatus('Vui lòng nhập nội dung thông báo!');
      return;
    }
    try {
      await axios.post('/api/notifications', {
        message,
        targets: target,
      });
      setStatus('Đã gửi thông báo!');
      setMessage('');
      setTarget([]);
    } catch (err: any) {
      setStatus('Gửi thông báo thất bại: ' + (err?.message || err));
    }
  };

  const handleTargetChange = (id: string) => {
    setTarget(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Lỗi khi đánh dấu notification đã đọc:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Quản lý thông báo</h1>
      
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'notifications'
              ? 'bg-sky-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Thông báo ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('violations')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'violations'
              ? 'bg-sky-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Cảnh báo phòng thi ({violations.length})
        </button>
      </div>

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-800">Thông báo hệ thống</h2>
              {notifications.some(n => !n.isRead) && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-slate-500">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500">Không có thông báo nào</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                    !notification.isRead ? 'bg-sky-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-slate-800">{notification.title}</h3>
                        {!notification.isRead && (
                          <span className="px-2 py-1 bg-sky-100 text-sky-700 text-xs rounded-full">
                            Mới
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 mb-2">{notification.message}</p>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span>
                          {format(notification.createdAt, 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </span>
                        <span className="capitalize">{notification.type}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                          Đã đọc
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Violations Tab */}
      {activeTab === 'violations' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">Cảnh báo phòng thi</h2>
          </div>
          <div className="max-h-96 overflow-y-auto p-6">
            {violations.length === 0 ? (
              <div className="text-center text-slate-500">Không có cảnh báo nào.</div>
            ) : (
              violations.map((v, idx) => (
                <div
                  key={v.examId + v.userId}
                  className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4"
                >
                  <div className="font-semibold text-amber-800 mb-2">
                    Thí sinh {v.userName} vừa thoát ra khỏi màn hình thi ở bài "{v.examName}"
                  </div>
                  <div className="text-sm text-amber-700">
                    Thời gian: {new Date(v.timestamp).toLocaleString()} | Số lần vi phạm: {v.count}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;

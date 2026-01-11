import { auth } from '../shared/firebase-config';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

const API_BASE_URL = '/api';

export const notificationService = {
  /**
   * Lấy tất cả notifications của user hiện tại
   */
  async getUserNotifications(): Promise<Notification[]> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User chưa đăng nhập');
    }

    const response = await fetch(`${API_BASE_URL}/notifications/user/${user.uid}`);
    if (!response.ok) {
      throw new Error('Lỗi khi lấy notifications');
    }
    return response.json();
  },

  /**
   * Đánh dấu notification đã đọc
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User chưa đăng nhập');
    }

    const response = await fetch(
      `${API_BASE_URL}/notifications/user/${user.uid}/notification/${notificationId}/read`,
      { method: 'PUT' }
    );
    if (!response.ok) {
      throw new Error('Lỗi khi đánh dấu notification đã đọc');
    }
  },

  /**
   * Xóa notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User chưa đăng nhập');
    }

    const response = await fetch(
      `${API_BASE_URL}/notifications/user/${user.uid}/notification/${notificationId}`,
      { method: 'DELETE' }
    );
    if (!response.ok) {
      throw new Error('Lỗi khi xóa notification');
    }
  },

  /**
   * Đánh dấu tất cả notifications đã đọc
   */
  async markAllNotificationsAsRead(): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User chưa đăng nhập');
    }

    const response = await fetch(
      `${API_BASE_URL}/notifications/user/${user.uid}/read-all`,
      { method: 'PUT' }
    );
    if (!response.ok) {
      throw new Error('Lỗi khi đánh dấu tất cả notifications đã đọc');
    }
  },

  /**
   * Lấy số lượng notifications chưa đọc
   */
  async getUnreadCount(): Promise<number> {
    const user = auth.currentUser;
    if (!user) {
      return 0;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/user/${user.uid}/unread-count`);
      if (!response.ok) {
        return 0;
      }
      const data = await response.json();
      return data.unreadCount || 0;
    } catch (error) {
      console.error('Lỗi khi lấy số lượng notifications chưa đọc:', error);
      return 0;
    }
  }
}; 
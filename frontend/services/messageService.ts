import axios from 'axios';

const API_BASE_URL = '/api/messages';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  senderName?: string;
  senderEmail?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Date;
  lastSenderId: string;
  unreadCount: number;
  createdAt: Date;
}

export interface UserInfo {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  photoURL: string;
  role: string;
}

class MessageService {
  /**
   * Gửi tin nhắn
   */
  async sendMessage(senderId: string, receiverId: string, content: string): Promise<string> {
    try {
      const response = await axios.post(`${API_BASE_URL}/send`, {
        senderId,
        receiverId,
        content
      });
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      throw new Error(error.response?.data || 'Lỗi khi gửi tin nhắn');
    }
  }

  /**
   * Lấy tin nhắn của conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/conversation/${conversationId}`);
      return response.data.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    } catch (error: any) {
      console.error('Lỗi khi lấy tin nhắn:', error);
      throw new Error(error.response?.data || 'Lỗi khi lấy tin nhắn');
    }
  }

  /**
   * Lấy danh sách conversations của user
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/conversations/${userId}`);
      return response.data.map((conv: any) => ({
        ...conv,
        lastMessageTime: new Date(conv.lastMessageTime),
        createdAt: new Date(conv.createdAt)
      }));
    } catch (error: any) {
      console.error('Lỗi khi lấy conversations:', error);
      throw new Error(error.response?.data || 'Lỗi khi lấy conversations');
    }
  }

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<string> {
    try {
      const response = await axios.put(`${API_BASE_URL}/conversation/${conversationId}/read/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
      throw new Error(error.response?.data || 'Lỗi khi đánh dấu tin nhắn đã đọc');
    }
  }

  /**
   * Lấy unread count của user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await axios.get(`${API_BASE_URL}/unread-count/${userId}`);
      return response.data.unreadCount;
    } catch (error: any) {
      console.error('Lỗi khi lấy unread count:', error);
      return 0;
    }
  }

  /**
   * Tìm user theo email
   */
  async findUserByEmail(email: string): Promise<{ found: boolean; userId?: string; email?: string; message?: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/find-user/${encodeURIComponent(email)}`);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi tìm user:', error);
      throw new Error(error.response?.data || 'Lỗi khi tìm user');
    }
  }

  /**
   * Lấy thông tin user
   */
  async getUserInfo(userId: string): Promise<UserInfo> {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-info/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi lấy thông tin user:', error);
      throw new Error(error.response?.data || 'Lỗi khi lấy thông tin user');
    }
  }
}

export const messageService = new MessageService(); 
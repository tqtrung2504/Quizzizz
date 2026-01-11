import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { messageService, type UserInfo } from '../services/messageService';
import { auth } from '../shared/firebase-config';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ref, onChildAdded, off, push, serverTimestamp, get, set, update, onValue } from 'firebase/database';
import { realtimeDb } from '../shared/firebase-config';

const AdminMailbox: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<UserInfo | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [unreadCounts, setUnreadCounts] = useState<{[key: string]: number}>({});
  const [unreadCount, setUnreadCount] = useState(0);

  // Lấy danh sách tất cả users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        // Lấy user hiện tại
        const user = auth.currentUser;
        if (user) {
          setCurrentUser(user);
          
          // Lấy danh sách users từ API
          const response = await axios.get('/api/users/all');
          const allUsers = response.data.map((u: any) => ({
            uid: u.uid,
            email: u.email,
            username: u.username,
            displayName: u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
            photoURL: u.photoURL || u.imageUrl || `https://picsum.photos/seed/${u.uid}/40/40`,
            role: u.role
          }));
          
          // Loại bỏ user hiện tại khỏi danh sách
          const filteredUsers = allUsers.filter((u: UserInfo) => u.uid !== user.uid);
          setUsers(filteredUsers);

          // Lấy unread counts cho tất cả users
          const counts: {[key: string]: number} = {};
          for (const u of filteredUsers) {
            try {
              const count = await messageService.getUnreadCount(u.uid);
              counts[u.uid] = count;
            } catch (error) {
              counts[u.uid] = 0;
            }
          }
          setUnreadCounts(counts);
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách users:', error);
        toast.error('Lỗi khi tải danh sách người dùng');
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  // Lắng nghe tất cả conversationId liên quan đến currentUser để tính unreadCount
  useEffect(() => {
    if (!currentUser) return;
    // Lấy tất cả conversationId có liên quan đến currentUser
    const messagesRef = ref(realtimeDb, 'messages');
    const handle = onValue(messagesRef, (snapshot) => {
      let count = 0;
      if (snapshot.exists()) {
        const allConvs = snapshot.val();
        Object.values(allConvs).forEach((conv: any) => {
          Object.values(conv).forEach((msg: any) => {
            if (!msg.isRead && msg.receiverId === currentUser.uid) {
              count++;
              // Thông báo ngoài modal nếu là tin nhắn mới
              if (msg.timestamp > Date.now() - 10000) {
                // 10s gần nhất, tránh spam toast khi load lại
                toast.info(`Bạn có tin nhắn mới từ ${msg.senderId}: "${msg.content}"`);
              }
            }
          });
        });
      }
      setUnreadCount(count);
    });
    return () => handle();
  }, [currentUser]);

  // Tìm user theo email
  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      setSearchResult(null);
      return;
    }
    // Nếu là email
    if (searchEmail.includes('@')) {
      try {
        const result = await messageService.findUserByEmail(searchEmail);
        if (result.found && result.userId) {
          const userInfo = await messageService.getUserInfo(result.userId);
          setSearchResult(userInfo);
          toast.success('Tìm thấy người dùng!');
        } else {
          setSearchResult(null);
          toast.warning(result.message || 'Không tìm thấy người dùng');
        }
      } catch (error: any) {
        console.error('Lỗi khi tìm user:', error);
        toast.error(error.message || 'Lỗi khi tìm kiếm');
      }
    } else {
      // Tìm theo username (lọc từ users đã load)
      const found = users.find(u => u.username && u.username.toLowerCase() === searchEmail.trim().toLowerCase());
      if (found) {
        setSearchResult(found);
        toast.success('Tìm thấy người dùng!');
      } else {
        setSearchResult(null);
        toast.warning('Không tìm thấy người dùng');
      }
    }
  };

  // Mở chat với user
  const handleOpenChat = (user: UserInfo) => {
    setSelectedUser(user);
    setShowChat(true);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            📧 Hộp thư Admin
          </h1>
          <p className="text-slate-600 mt-1">Gửi tin nhắn cho người dùng trong hệ thống</p>
        </div>

        {/* Search Section */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tìm kiếm người dùng theo email
              </label>
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Nhập email người dùng..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
              />
            </div>
            <button
              onClick={handleSearchUser}
              className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium"
            >
              Tìm kiếm
            </button>
          </div>

          {/* Search Result */}
          {searchResult && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={searchResult.photoURL || `https://picsum.photos/seed/${searchResult.uid}/40/40`}
                    alt={searchResult.displayName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium text-slate-800">{searchResult.username || searchResult.email}</h3>
                    <p className="text-sm text-slate-600">{searchResult.email}</p>
                    <span className="inline-block px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-full mt-1">
                      {searchResult.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenChat(searchResult)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
                >
                  <span>💬</span>
                  Gửi tin nhắn
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Danh sách người dùng</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-slate-500">Đang tải danh sách người dùng...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-medium mb-2">Không có người dùng nào</h3>
              <p className="text-sm">Hiện tại chỉ có bạn trong hệ thống</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {users.map((user) => (
                <div
                  key={user.uid}
                  className="flex items-center justify-between p-3 sm:p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`}
                      alt={user.displayName}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h3 className="font-medium text-slate-800">{user.username || user.email}</h3>
                      <p className="text-sm text-slate-600">{user.email}</p>
                      <span className="inline-block px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-full mt-1">
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCounts[user.uid] > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                        {unreadCounts[user.uid]}
                      </span>
                    )}
                    <button
                      onClick={() => handleOpenChat(user)}
                      className="p-2 text-sky-500 hover:bg-sky-50 rounded-full transition-colors relative"
                      title="Gửi tin nhắn"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && selectedUser && (
        <ChatModal
          user={selectedUser}
          currentUser={currentUser}
          onClose={() => {
            setShowChat(false);
            setSelectedUser(null);
          }}
        />
      )}

      <ToastContainer position="top-right" />
    </div>
  );
};

// Chat Modal Component
interface ChatModalProps {
  user: UserInfo;
  currentUser: any;
  onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ user, currentUser, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Hàm tạo conversationId duy nhất giữa 2 user
  const getConversationId = (uid1: string, uid2: string) => {
    const id = [uid1, uid2].sort().join('_');
    console.log('DEBUG conversationId:', id, 'uid1:', uid1, 'uid2:', uid2);
    return id;
  };

  // Đánh dấu đã đọc tất cả tin nhắn khi mở chat
  const markAllAsRead = (msgs: any[]) => {
    if (!conversationId || !currentUser) return;
    msgs.forEach((msg) => {
      if (!msg.isRead && msg.receiverId === currentUser.uid) {
        const msgRef = ref(realtimeDb, `messages/${conversationId}/${msg.id}`);
        update(msgRef, { isRead: true });
      }
    });
  };

  // Lắng nghe realtime tin nhắn
  useEffect(() => {
    if (!currentUser || !user) return;
    const convId = getConversationId(currentUser.uid, user.uid);
    setConversationId(convId);
    console.log('DEBUG useEffect - lắng nghe conversationId:', convId);
    const messagesRef = ref(realtimeDb, `messages/${convId}`);
    setMessages([]); // clear khi đổi user
    
    let isInitialLoad = true;
    
    // Sử dụng onValue để lắng nghe tất cả thay đổi (bao gồm cả tin nhắn mới và cũ)
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      console.log('DEBUG onValue triggered, exists:', snapshot.exists());
      if (snapshot.exists()) {
        const data = snapshot.val();
        const allMsgs: any[] = [];
        
        // Convert object thành array
        Object.keys(data).forEach((key) => {
          const msg = data[key];
          if (msg && msg.id) {
            allMsgs.push(msg);
          }
        });
        
        // Sắp xếp theo timestamp
        const sortedMsgs = allMsgs.sort((a, b) => {
          const tsA = typeof a.timestamp === 'number' ? a.timestamp : (a.timestamp?.seconds ? a.timestamp.seconds * 1000 : 0);
          const tsB = typeof b.timestamp === 'number' ? b.timestamp : (b.timestamp?.seconds ? b.timestamp.seconds * 1000 : 0);
          return tsA - tsB;
        });
        
        console.log('DEBUG loaded messages:', sortedMsgs.length);
        setMessages(sortedMsgs);
        
        // Đánh dấu đã đọc tất cả khi mở chat
        markAllAsRead(sortedMsgs);
        
        // Thông báo nếu có tin nhắn mới từ người khác
        if (!isInitialLoad) {
          sortedMsgs.forEach((msg) => {
            if (msg.senderId !== currentUser.uid && !msg.isRead) {
              toast.info(`Bạn có tin nhắn mới từ ${user.username || user.email}: "${msg.content}"`);
            }
          });
        }
        
        isInitialLoad = false;
      } else {
        console.log('DEBUG no messages found');
        setMessages([]);
        isInitialLoad = false;
      }
    }, (error) => {
      console.error('DEBUG error listening to messages:', error);
    });
    
    return () => {
      console.log('DEBUG cleanup listener');
      unsubscribe();
    };
  }, [currentUser, user]);

  // Gửi tin nhắn qua backend API
  const handleSendMessage = async () => {
    if (!message.trim() || !currentUser || !user) return;
    setSending(true);
    try {
      console.log('DEBUG gửi message từ:', currentUser.uid, 'đến:', user.uid);
      await messageService.sendMessage(currentUser.uid, user.uid, message.trim());
      console.log('DEBUG đã gửi message thành công qua API');
      setMessage('');
      toast.success('Đã gửi tin nhắn');
    } catch (error: any) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      toast.error(error.message || 'Lỗi khi gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  // Scroll đến cuối khi có tin nhắn mới
  useEffect(() => {
    const chatBox = document.querySelector('.flex-1.p-4.overflow-y-auto');
    if (chatBox) {
      setTimeout(() => { chatBox.scrollTop = chatBox.scrollHeight; }, 100);
    }
  }, [messages]);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`}
              alt={user.username || user.email}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className="font-medium text-slate-800 text-base">{user.username || user.email}</h3>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages - Dark background */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-800">
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 mt-8">
              <div className="text-4xl mb-4">💬</div>
              <p>Chưa có tin nhắn nào</p>
              <p className="text-sm">Bắt đầu cuộc trò chuyện với {user.username || user.email}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`flex ${msg.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.senderId === currentUser?.uid
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.senderId === currentUser?.uid ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      {format(new Date(typeof msg.timestamp === 'number' ? msg.timestamp : msg.timestamp?.seconds ? msg.timestamp.seconds * 1000 : Date.now()), 'HH:mm', { locale: vi })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={sending}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || sending}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Đang gửi...' : 'Gửi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMailbox; 
import React, { useState, useEffect, useRef } from 'react';
import { auth, storage } from '../shared/firebase-config';
import { updateProfile, updateEmail, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  UserIcon, 
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  AcademicCapIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon
} from './left-bar/icons';
import axios from 'axios';

interface UserProfile {
  displayName: string;
  email: string;
  username: string;
  phone?: string;
  address?: string;
  bio?: string;
  studentId?: string;
  major?: string;
  year?: string;
}

const UserProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    displayName: '',
    email: '',
    username: '',
    phone: '',
    address: '',
    bio: '',
    studentId: '',
    major: '',
    year: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      // Lấy thông tin user từ backend
      axios.get(`/api/users/${user.uid}`)
        .then(res => {
          const data = res.data;
          setProfile({
            displayName: data.displayName || user.displayName || '',
            email: data.email || user.email || '',
            username: data.username || user.displayName?.toLowerCase().replace(/\s+/g, '.') || '',
            phone: data.phone || '',
            address: data.address || '',
            bio: data.bio || '',
            studentId: data.studentId || '',
            major: data.major || '',
            year: data.year || ''
          });
        })
        .catch(() => {
          setProfile({
            displayName: user.displayName || '',
            email: user.email || '',
            username: user.displayName?.toLowerCase().replace(/\s+/g, '.') || '',
            phone: '',
            address: '',
            bio: '',
            studentId: '',
            major: '',
            year: ''
          });
        });
    }
  }, [user]);

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    setMessage(null);
    try {
      // Cập nhật displayName
      if (profile.displayName !== user.displayName) {
        await updateProfile(user, { displayName: profile.displayName });
      }
      // Cập nhật email nếu thay đổi
      if (profile.email !== user.email) {
        await updateEmail(user, profile.email);
      }
      // Gọi API backend để cập nhật các trường bổ sung
      await axios.put(`/api/users/${user.uid}`, {
        ...profile,
        uid: user.uid
      });
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Lỗi cập nhật profile:', error);
      setMessage({
        type: 'error',
        text: error.code === 'auth/requires-recent-login'
          ? 'Vui lòng xác thực lại để thay đổi email'
          : 'Có lỗi xảy ra khi cập nhật thông tin'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setProfile({
        displayName: user.displayName || '',
        email: user.email || '',
        username: user.displayName?.toLowerCase().replace(/\s+/g, '.') || '',
        phone: profile.phone || '',
        address: profile.address || '',
        bio: profile.bio || '',
        studentId: profile.studentId || '',
        major: profile.major || '',
        year: profile.year || ''
      });
    }
    setIsEditing(false);
    setMessage(null);
  };

  const handleChangePassword = async () => {
    if (!user || !user.email) return;

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu mới không khớp!' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự!' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Cập nhật mật khẩu mới
      await updatePassword(user, newPassword);
      
      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Lỗi đổi mật khẩu:', error);
      setMessage({ 
        type: 'error', 
        text: error.code === 'auth/wrong-password' 
          ? 'Mật khẩu hiện tại không đúng' 
          : 'Có lỗi xảy ra khi đổi mật khẩu'
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <UserCircleIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Vui lòng đăng nhập để xem thông tin cá nhân</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="w-12 h-12" />
                )}
              </div>
              
              {/* Overlay với nút upload */}
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <button
                  onClick={triggerFileInput}
                  disabled={isUploadingAvatar}
                  className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
                  title="Thay đổi avatar"
                >
                  {isUploadingAvatar ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CameraIcon className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold">Hồ sơ sinh viên</h1>
              <p className="text-blue-100">Quản lý thông tin cá nhân và tài khoản</p>
            </div>
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

        {/* Message */}
        {message && (
          <div className={`mx-6 mt-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckIcon className="w-5 h-5 text-green-600" />
            ) : (
              <XMarkIcon className="w-5 h-5 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-3 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
            {/* Thông tin cơ bản */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
                Thông tin cơ bản
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Họ và tên
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập họ và tên"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-slate-50 rounded-lg text-slate-700">
                      {profile.displayName || 'Chưa cập nhật'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập email"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-slate-50 rounded-lg text-slate-700 flex items-center">
                      <EnvelopeIcon className="w-4 h-4 mr-2 text-slate-500" />
                      {profile.email}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tên đăng nhập
                  </label>
                  <div className="px-3 py-2 bg-slate-50 rounded-lg text-slate-700">
                    {profile.username}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Số điện thoại
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập số điện thoại"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-slate-50 rounded-lg text-slate-700 flex items-center">
                      <PhoneIcon className="w-4 h-4 mr-2 text-slate-500" />
                      {profile.phone || 'Chưa cập nhật'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Thông tin học tập */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                <AcademicCapIcon className="w-5 h-5 mr-2 text-blue-600" />
                Thông tin học tập
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mã sinh viên
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.studentId}
                      onChange={(e) => handleInputChange('studentId', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập mã sinh viên"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-slate-50 rounded-lg text-slate-700">
                      {profile.studentId || 'Chưa cập nhật'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ngành học
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.major}
                      onChange={(e) => handleInputChange('major', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập ngành học"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-slate-50 rounded-lg text-slate-700">
                      {profile.major || 'Chưa cập nhật'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Khóa học
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập khóa học (VD: K15)"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-slate-50 rounded-lg text-slate-700">
                      {profile.year || 'Chưa cập nhật'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin bổ sung */}
          <div className="mt-8 space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-600" />
              Thông tin bổ sung
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Địa chỉ
                </label>
                {isEditing ? (
                  <textarea
                    value={profile.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập địa chỉ"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 rounded-lg text-slate-700 min-h-[60px] flex items-start">
                    <MapPinIcon className="w-4 h-4 mr-2 text-slate-500 mt-0.5 flex-shrink-0" />
                    <span>{profile.address || 'Chưa cập nhật'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Giới thiệu
                </label>
                {isEditing ? (
                  <textarea
                    value={profile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập thông tin giới thiệu"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 rounded-lg text-slate-700 min-h-[60px]">
                    {profile.bio || 'Chưa cập nhật'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nút đổi mật khẩu */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
            >
              <KeyIcon className="w-4 h-4 mr-2" />
              Đổi mật khẩu
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-slate-200">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu thay đổi'
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Chỉnh sửa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              <KeyIcon className="w-5 h-5 mr-2 text-blue-600" />
              Đổi mật khẩu
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    placeholder="Nhập mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showNewPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setMessage(null);
                }}
                disabled={isLoading}
                className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Đang đổi...
                  </>
                ) : (
                  'Đổi mật khẩu'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 
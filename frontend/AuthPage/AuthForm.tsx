import React, { useState } from 'react';
import InputField from './InputField';
import SocialIcons from './SocialIcons';
import { UserIcon, LockIcon, EmailIcon } from './Icons';
import { useNavigate } from 'react-router-dom';

import { auth, db, googleProvider, githubProvider } from '../shared/firebase-config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthFormProps {
  onClose: () => void;
  initialPanel?: 'signIn' | 'signUp';
}

const AuthForm: React.FC<AuthFormProps> = ({ onClose, initialPanel = 'signIn' }) => {
  const [activePanel, setActivePanel] = useState<'signIn' | 'signUp'>(initialPanel);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animateToCover, setAnimateToCover] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // State cho form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<'user' | 'admin'>('user');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // -------- Animation overlay ---------
  const DURATION_VAL = 600; // ms
  const DURATION_CLASS = `duration-[${DURATION_VAL}ms]`;

  const handleTogglePanel = (targetPanel: 'signIn' | 'signUp') => {
    if (isAnimating || targetPanel === activePanel) return;
    setIsAnimating(true);
    setAnimateToCover(true);
    setTimeout(() => {
      setActivePanel(targetPanel);
      setAnimateToCover(false);
    }, DURATION_VAL);
    setTimeout(() => {
      setIsAnimating(false);
    }, DURATION_VAL * 2);
  };

  // Hàm xử lý lỗi Firebase và trả về thông báo thân thiện
  const getErrorMessage = (error: any): string => {
    console.error('Firebase Error:', error.code, error.message);

    switch (error.code) {
      case 'auth/invalid-credential':
        return 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.';
      case 'auth/user-not-found':
        return 'Tài khoản không tồn tại. Vui lòng đăng ký trước.';
      case 'auth/wrong-password':
        return 'Mật khẩu không đúng. Vui lòng thử lại.';
      case 'auth/email-already-in-use':
        return 'Email đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.';
      case 'auth/weak-password':
        return 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn (ít nhất 6 ký tự).';
      case 'auth/invalid-email':
        return 'Email không hợp lệ. Vui lòng nhập email đúng định dạng.';
      case 'auth/too-many-requests':
        return 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau vài phút.';
      case 'auth/network-request-failed':
        return 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.';
      case 'auth/popup-closed-by-user':
        return 'Đăng nhập bị hủy. Vui lòng thử lại.';
      case 'auth/popup-blocked':
        return 'Popup bị chặn. Vui lòng cho phép popup và thử lại.';
      default:
        return `Lỗi: ${error.message}`;
    }
  };

  // Đăng ký user, lưu profile kèm role được chọn
  const handleSignUpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Kiểm tra mật khẩu xác nhận
    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    // Kiểm tra độ mạnh mật khẩu
    if (signUpPassword.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Đang đăng ký tài khoản:', signUpEmail, 'với role:', signUpRole);
      const userCredential = await createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword);
      const user = userCredential.user;

      console.log('Tạo user thành công, đang lưu profile...');
      await setDoc(doc(db, 'users', user.uid), {
        username: signUpUsername,
        email: signUpEmail,
        role: signUpRole,
        createdAt: new Date()
      });

      console.log('Lưu profile thành công với role:', signUpRole);
      setSuccessMsg(`Đăng ký thành công với quyền ${signUpRole === 'admin' ? 'Quản trị viên' : 'Người dùng'}! Đăng nhập ngay để tiếp tục.`);
      setActivePanel('signIn');
      setSignInEmail(signUpEmail); // Tự động điền email vào form đăng nhập

      // Reset form
      setSignUpUsername('');
      setSignUpEmail('');
      setSignUpPassword('');
      setSignUpConfirmPassword('');
      setSignUpRole('user');
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng nhập, lấy quyền từ Firestore, chuyển trang phù hợp
  const handleSignInSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      console.log('Đang đăng nhập:', signInEmail);
      const userCredential = await signInWithEmailAndPassword(auth, signInEmail, signInPassword);
      const user = userCredential.user;

      console.log('Đăng nhập thành công, đang kiểm tra quyền...');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) throw new Error('Không tìm thấy profile!');

      const { role } = userDoc.data() as { role: string };
      console.log('Quyền user:', role);

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng nhập Google, lấy/tạo profile trên Firestore, điều hướng
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      console.log('Đang đăng nhập bằng Google...');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log('Đăng nhập Google thành công, đang kiểm tra profile...');
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      let role = 'user';

      if (!userDoc.exists()) {
        console.log('Tạo profile mới cho user Google...');
        await setDoc(userDocRef, {
          username: user.displayName || '',
          email: user.email || '',
          role: 'user',
          createdAt: new Date()
        });
      } else {
        role = (userDoc.data() as { role: string }).role;
      }

      console.log('Quyền user:', role);
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng nhập GitHub, lấy/tạo profile trên Firestore, điều hướng
  const handleGithubSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      console.log('Đang đăng nhập bằng GitHub...');
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;

      console.log('Đăng nhập GitHub thành công, đang kiểm tra profile...');
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      let role = 'user';

      if (!userDoc.exists()) {
        console.log('Tạo profile mới cho user GitHub...');
        await setDoc(userDocRef, {
          username: user.displayName || user.email?.split('@')[0] || '',
          email: user.email || '',
          role: 'user',
          createdAt: new Date()
        });
      } else {
        role = (userDoc.data() as { role: string }).role;
      }

      console.log('Quyền user:', role);
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Chức năng quên mật khẩu
  const handleForgotPassword = async () => {
    if (!signInEmail.trim()) {
      setErrorMsg('Vui lòng nhập email để gửi link đặt lại mật khẩu.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      console.log('Đang gửi email đặt lại mật khẩu:', signInEmail);
      await sendPasswordResetEmail(auth, signInEmail);
      setSuccessMsg('Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư.');
      setShowForgotPassword(false);
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // --------- UI PART ----------

  const commonIconClass = "w-4 h-4 text-gray-400";
  const overlayBaseClasses = `absolute top-0 h-full bg-indigo-500 text-white overflow-hidden z-30 transition-all ${DURATION_CLASS} ease-in-out`;
  let overlayDynamicClasses = '';
  if (animateToCover) {
    overlayDynamicClasses = 'w-full left-0 rounded-2xl';
  } else {
    if (activePanel === 'signIn') {
      overlayDynamicClasses = 'w-1/2 left-0 rounded-l-2xl rounded-r-[150px]';
    } else {
      overlayDynamicClasses = 'w-1/2 left-[50%] rounded-r-2xl rounded-l-[150px]';
    }
  }
  const signUpFormBaseClasses = `absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center items-center p-6 sm:p-10 text-center transition-all ${DURATION_CLASS} ease-in-out`;
  let signUpFormDynamicClasses = '';
  if (activePanel === 'signUp' && !animateToCover) {
    signUpFormDynamicClasses = 'opacity-100 z-10 translate-x-0';
  } else {
    signUpFormDynamicClasses = 'opacity-0 z-0 -translate-x-full pointer-events-none';
  }
  const signInFormBaseClasses = `absolute top-0 left-1/2 w-1/2 h-full flex flex-col justify-center items-center p-6 sm:p-10 text-center transition-all ${DURATION_CLASS} ease-in-out`;
  let signInFormDynamicClasses = '';
  if (activePanel === 'signIn' && !animateToCover) {
    signInFormDynamicClasses = 'opacity-100 z-10 translate-x-0';
  } else {
    signInFormDynamicClasses = 'opacity-0 z-0 translate-x-full pointer-events-none';
  }
  const overlayContentBaseClasses = `absolute inset-0 flex flex-col justify-center items-center p-6 sm:p-10 text-center transition-all ${DURATION_CLASS} ease-in-out`;

  let signInPromptTextClasses = overlayContentBaseClasses;
  if (activePanel === 'signIn') {
    signInPromptTextClasses += animateToCover ? ' opacity-0 -translate-x-[20%]' : ' opacity-100 translate-x-0';
  } else {
    signInPromptTextClasses += ' opacity-0 translate-x-[20%] pointer-events-none';
  }
  let signUpPromptTextClasses = overlayContentBaseClasses;
  if (activePanel === 'signUp') {
    signUpPromptTextClasses += animateToCover ? ' opacity-0 translate-x-[20%]' : ' opacity-100 translate-x-0';
  } else {
    signUpPromptTextClasses += ' opacity-0 -translate-x-[20%] pointer-events-none';
  }

  return (
    <div className="bg-white w-[900px] max-w-[95vw] min-h-[550px] sm:h-[550px] rounded-2xl shadow-2xl relative overflow-hidden">
      <button
        className="absolute top-4 right-4 text-2xl text-slate-400 hover:text-slate-700 z-50"
        onClick={onClose}
        aria-label="Đóng"
      >
        &times;
      </button>

      {/* Sign Up Form Panel */}
      <div className={`${signUpFormBaseClasses} ${signUpFormDynamicClasses}`}>
        <h1 className="text-3xl font-bold text-indigo-600 mb-6 mt-6">Tạo tài khoản</h1>
        <form onSubmit={handleSignUpSubmit} className="w-full max-w-xs">
          <InputField
            type="text"
            placeholder="Tên người dùng"
            required
            icon={<UserIcon className={commonIconClass} />}
            value={signUpUsername}
            onChange={e => setSignUpUsername(e.target.value)}
            aria-label="Tên người dùng"
          />
          <InputField
            type="email"
            placeholder="Email"
            required
            icon={<EmailIcon className={commonIconClass} />}
            value={signUpEmail}
            onChange={e => setSignUpEmail(e.target.value)}
            aria-label="Email"
          />
          <InputField
            type="password"
            placeholder="Mật khẩu"
            required
            icon={<LockIcon className={commonIconClass} />}
            value={signUpPassword}
            onChange={e => setSignUpPassword(e.target.value)}
            aria-label="Mật khẩu"
          />
          <InputField
            type="password"
            placeholder="Xác nhận mật khẩu"
            required
            icon={<LockIcon className={commonIconClass} />}
            value={signUpConfirmPassword}
            onChange={e => setSignUpConfirmPassword(e.target.value)}
            aria-label="Xác nhận mật khẩu"
          />

          {/* Chọn role */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Đăng ký với vai trò:
            </label>
            <div className="flex gap-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={signUpRole === 'user'}
                  onChange={(e) => setSignUpRole(e.target.value as 'user' | 'admin')}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Người dùng</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={signUpRole === 'admin'}
                  onChange={(e) => setSignUpRole(e.target.value as 'user' | 'admin')}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Quản trị viên</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-500 text-white py-3 rounded-lg font-semibold hover:bg-indigo-600 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        {errorMsg && <div className="text-red-500 mt-2 text-sm">{errorMsg}</div>}
        {successMsg && <div className="text-green-500 mt-2 text-sm">{successMsg}</div>}
        <p className="text-gray-500 text-sm mt-6 mb-3">hoặc đăng ký bằng</p>
        <SocialIcons onGoogleSignIn={handleGoogleSignIn} onGithubSignIn={handleGithubSignIn} />
      </div>

      {/* Sign In Form Panel */}
      <div className={`${signInFormBaseClasses} ${signInFormDynamicClasses}`}>
        <h1 className="text-3xl font-bold text-indigo-600 mb-6">Đăng nhập</h1>
        <form onSubmit={handleSignInSubmit} className="w-full max-w-xs">
          <InputField
            type="email"
            placeholder="Email"
            required
            icon={<EmailIcon className={commonIconClass} />}
            value={signInEmail}
            onChange={e => setSignInEmail(e.target.value)}
            aria-label="Email"
          />
          <InputField
            type="password"
            placeholder="Mật khẩu"
            required
            icon={<LockIcon className={commonIconClass} />}
            value={signInPassword}
            onChange={e => setSignInPassword(e.target.value)}
            aria-label="Mật khẩu"
          />

          {/* Chức năng quên mật khẩu */}
          {!showForgotPassword ? (
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-xs text-gray-500 hover:text-indigo-500 my-3 block"
            >
              Quên mật khẩu?
            </button>
          ) : (
            <div className="my-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Nhập email để nhận link đặt lại mật khẩu:</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={signInEmail}
                  onChange={e => setSignInEmail(e.target.value)}
                  placeholder="Email"
                  className="flex-1 px-2 py-1 text-xs border rounded"
                />
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  className="px-3 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
                >
                  {isLoading ? 'Gửi...' : 'Gửi'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-500 text-white py-3 rounded-lg font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        {errorMsg && <div className="text-red-500 mt-2 text-sm">{errorMsg}</div>}
        {successMsg && <div className="text-green-500 mt-2 text-sm">{successMsg}</div>}
        <p className="text-gray-500 text-sm mt-6 mb-3">hoặc đăng nhập bằng</p>
        <SocialIcons onGoogleSignIn={handleGoogleSignIn} onGithubSignIn={handleGithubSignIn} />
      </div>

      {/* Overlay Container */}
      <div className={`${overlayBaseClasses} ${overlayDynamicClasses}`}>
        <div className={signInPromptTextClasses}>
          <h2 className="text-3xl font-bold mb-3">Xin chào bạn!</h2>
          <p className="text-sm mb-6 leading-relaxed max-w-xs">
            Nhập thông tin cá nhân để bắt đầu hành trình cùng chúng tôi
          </p>
          <button
            onClick={() => handleTogglePanel('signUp')}
            disabled={isAnimating}
            className="px-8 py-3 border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-indigo-500 transition-all duration-300 disabled:opacity-50"
          >
            Đăng ký
          </button>
        </div>
        <div className={signUpPromptTextClasses}>
          <h2 className="text-3xl font-bold mb-3">Chào mừng trở lại!</h2>
          <p className="text-sm mb-6 leading-relaxed max-w-xs">
            Để tiếp tục kết nối, vui lòng đăng nhập bằng thông tin cá nhân của bạn
          </p>
          <button
            onClick={() => handleTogglePanel('signIn')}
            disabled={isAnimating}
            className="px-8 py-3 border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-indigo-500 transition-all duration-300 disabled:opacity-50"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;

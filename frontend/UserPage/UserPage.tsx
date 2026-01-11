import React, { useEffect, useState } from 'react';
import Sidebar from './left-bar/Sidebar';
import UserForm from './my-course/user-test/UserForm';
import UserProfile from './UserProfile';
import UserNotification from './UserNotification';
import UserMailbox from './UserMailbox';
import { fetchParts, Part } from '../AdminPage/manage-part/PartApi';
import { fetchCourses, Course } from '../AdminPage/manage-course/courseApi';
import * as CourseStudentApi from '../AdminPage/manage-course/course-student/CourseStudentApi';
import { auth } from '../shared/firebase-config';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { toast } from 'react-toastify';
import { realtimeDb } from '../shared/firebase-config';

const UserPage: React.FC = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('my-courses');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);
  const myCoursesRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const lastToastTimestampRef = React.useRef(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const allCourses = await fetchCourses();
      setCourses(allCourses);
      // Lấy user hiện tại
      const user = auth.currentUser;
      if (user) {
        const my: Course[] = [];
        for (const course of allCourses) {
          if (!course.id || typeof course.id !== 'string') continue;
          try {
            const students = await CourseStudentApi.getStudents(course.id);
            const normalizedStudents = students.map((s: string) =>
              s.toLowerCase().trim().replace(/^"+|"+$/g, '')
            );
            const userEmail = (user.email || '').toLowerCase().trim();
            const userUid = (user.uid || '').toLowerCase().trim();
            if (normalizedStudents.includes(userEmail) || normalizedStudents.includes(userUid)) {
              my.push(course);
            }
          } catch {}
        }
        setMyCourses(my);
      }
      setParts(await fetchParts());
      setLoading(false);
    };
    fetchData();
  }, []);

  // Lắng nghe sự kiện custom từ sidebar
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail === 'my-courses' && myCoursesRef.current) {
        myCoursesRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener('user-sidebar-click', handler as EventListener);
    return () => window.removeEventListener('user-sidebar-click', handler as EventListener);
  }, []);

  // Lắng nghe số tin nhắn chưa đọc từ UserMailbox
  useEffect(() => {
    const handleUnread = (e: any) => setUnreadMessageCount(e.detail || 0);
    window.addEventListener('user-unread-message', handleUnread);
    return () => window.removeEventListener('user-unread-message', handleUnread);
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const messagesRef = ref(realtimeDb, 'messages');
    const handle = onValue(messagesRef, (snapshot) => {
      let count = 0;
      let latestSender = '';
      let latestContent = '';
      let latestTimestamp = 0;
      if (snapshot.exists()) {
        const allConvs = snapshot.val();
        Object.values(allConvs).forEach((conv: any) => {
          Object.values(conv).forEach((msg: any) => {
            if (!msg.isRead && msg.receiverId === user.uid) {
              count++;
              if (msg.timestamp > latestTimestamp) {
                latestSender = msg.senderName || msg.senderId;
                latestContent = msg.content;
                latestTimestamp = msg.timestamp;
              }
            }
          });
        });
      }
      setUnreadMessageCount(count);
      // Hiện toast popup nếu có tin nhắn mới đến (timestamp mới nhất)
      if (count > 0 && latestTimestamp > lastToastTimestampRef.current && latestTimestamp > Date.now() - 60000) {
        toast.info(`Bạn có tin nhắn mới từ ${latestSender}: "${latestContent}"`);
        lastToastTimestampRef.current = latestTimestamp;
      }
    });
    return () => handle();
  }, []);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return <UserProfile />;
      case 'notifications':
        return <UserNotification />;
      case 'settings':
        return <UserMailbox onUnreadCountChange={(count: number) => {
          setUnreadMessageCount(count);
          window.dispatchEvent(new CustomEvent('user-unread-message', { detail: count }));
        }} />;
      case 'my-courses':
      default:
        return (
          <div ref={myCoursesRef} className="max-w-6xl mx-auto mb-8">
            <h1 className="text-3xl font-extrabold mb-8 text-slate-800 flex items-center gap-3">
              <span className="inline-block bg-sky-100 text-sky-600 rounded-full p-2 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>
              </span>
              Khóa học của tôi
              <span className="ml-2 bg-sky-600 text-white text-xs font-semibold px-3 py-1 rounded-full">{myCourses.length}</span>
            </h1>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
              </div>
            ) : (
              myCourses.length === 0 ? (
                <div className="text-center text-slate-500 text-lg py-16">Bạn chưa tham gia khóa học nào.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {myCourses.map(course => (
                    <div key={course.id} className="bg-white rounded-2xl shadow-xl p-6 flex flex-col justify-between border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 group cursor-pointer relative overflow-hidden"
                      onClick={() => navigate(`/my-course/${course.id}`)}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-block bg-sky-50 text-sky-600 rounded-lg p-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>
                        </span>
                        <h2 className="text-lg font-bold text-slate-800 group-hover:text-sky-700 transition-colors truncate">{course.name}</h2>
                        <span className="ml-auto bg-sky-100 text-sky-600 text-xs font-semibold px-2 py-0.5 rounded-full">{course.credits} TC</span>
                      </div>
                      <div className="text-slate-600 text-sm mb-1">Mã: <span className="font-mono text-sky-700">{course.code}</span></div>
                      <div className="text-slate-600 text-sm mb-1">Khoa: <span className="font-semibold">{course.department}</span></div>
                      <div className="text-slate-500 text-xs mb-2 line-clamp-2">{course.description}</div>
                      <div className="flex items-center gap-2 mt-3">
                        {/* Avatar giảng viên nếu có */}
                        {/* {course.teacherAvatar && (
                          <img src={course.teacherAvatar} alt="GV" className="w-8 h-8 rounded-full border-2 border-sky-200 object-cover" />
                        )}
                        {course.teacherName && (
                          <span className="text-slate-700 text-sm font-medium">{course.teacherName}</span>
                        )} */}
                      </div>
                      <button className="mt-4 w-full py-2 rounded-lg bg-sky-600 text-white font-semibold shadow hover:bg-sky-700 transition-colors text-sm">Xem chi tiết</button>
                      {/* Hiệu ứng nền khi hover */}
                      <div className="absolute inset-0 bg-sky-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-2xl z-0"></div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
      <style>{`::-webkit-scrollbar { display: none; }`}</style>
      <Sidebar
        activeItemId={activeSection}
        onItemClick={setActiveSection}
        onExpandChange={setIsSidebarExpanded}
        unreadMessageCount={unreadMessageCount}
      />
      <div className={`user-main-content flex-1 p-2 sm:p-4 md:p-8${!isSidebarExpanded ? ' sidebar-collapsed' : ''}`}>
        {renderActiveSection()}
      </div>
    </div>
  );
};

export default UserPage;
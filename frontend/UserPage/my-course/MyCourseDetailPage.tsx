import React, { useState, useEffect } from 'react';
import { Routes, Route, Outlet, useParams, useLocation, useSearchParams } from 'react-router-dom';
import UserCourseSidebar from './left-bar/UserCourseSidebar';
import UserCourseTests from './tests/UserCourseTests';
import UserCourseResults from './results/UserCourseResults';
import UserForm from './user-test/UserForm';

const MyCourseDetailPage: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'tests'|'results'>('tests');

  // Tự động chuyển tab sang 'results' nếu path là /results hoặc có query testId
  useEffect(() => {
    if (location.pathname.endsWith('/results') || searchParams.get('testId')) {
      setActiveTab('results');
    }
  }, [location.pathname, searchParams]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <UserCourseSidebar activeTab={activeTab} onTabChange={(id) => setActiveTab(id as 'tests' | 'results')} />
      <main className="flex-1 p-8">
        <Routes>
          <Route index element={
            activeTab === 'tests' && id ? <UserCourseTests courseId={id} /> :
            activeTab === 'results' && id ? <UserCourseResults courseId={id} /> : null
          } />
          <Route path="user-test/:partId" element={<UserFormWrapper />} />
        </Routes>
        <Outlet />
      </main>
    </div>
  );
};

// Wrapper để lấy partId từ params và truyền cho UserForm
const UserFormWrapper: React.FC = () => {
  const { partId } = useParams();
  return partId ? <UserForm partId={partId} onBack={() => window.history.back()} /> : null;
};

export default MyCourseDetailPage; 
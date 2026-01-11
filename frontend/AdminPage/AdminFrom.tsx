// AdminForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './left-bar/Sidebar';
import CourseCreateForm from './manage-course/CourseCreateForm';
import CourseUpdateForm from  './manage-course/CourseUpdateForm';
import ManageCourse from './manage-course/ManageCourse';
import ManagePart from './manage-part/ManagePart';
import ManageQuestion from './manage-question/ManageQuestion';
import ManageUser from './manage-user/ManageUser';
import ManageTests from './manage-tests/ManageTests';
import ExamResults from './manage-tests/ExamResults';
import { fetchCourses, Course } from './manage-course/courseApi';
import { fetchQuestionBanks, QuestionBank } from './manage-question/QuestionBankApi';
import { fetchParts, Part } from './manage-part/PartApi';
import { fetchQuestions, Question } from './manage-question/QuestionApi';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import Notification from './Notification';
import SystemSettings from './SystemSettings';
import AdminProfile from './AdminProfile';
import OverviewCards from './dashboard/OverviewCards';
import { fetchUsers, User } from './manage-user/UserApi';
import { fetchExamResults, ExamResult } from './manage-tests/ExamResultApi';
import ScoreDistributionChart from './dashboard/ScoreDistributionChart';
import PassFailPieChart from './dashboard/PassFailPieChart';
import StackedBarChart from './dashboard/StackedBarChart';
import LineChart from './dashboard/LineChart';
import Leaderboard from './dashboard/Leaderboard';
import PerQuestionBarChart from './dashboard/PerQuestionBarChart';
import RadarChart from './dashboard/RadarChart';
import TestNotification from './TestNotification';
import AdminMailbox from './AdminMailbox';

const Dashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  useEffect(() => {
    const loadData = async () => {
      try {
        const [coursesData, banksData, partsData, usersData, examResultsData] = await Promise.all([
          fetchCourses(),
          fetchQuestionBanks(),
          fetchParts(),
          fetchUsers(),
          fetchExamResults(),
        ]);
        setCourses(coursesData);
        setBanks(banksData);
        setParts(partsData);
        setUsers(usersData);
        setExamResults(examResultsData);
        // Lấy tất cả câu hỏi từ tất cả ngân hàng
        const qLists = await Promise.all(banksData.map(b => fetchQuestions(b.id!)));
        setQuestions(qLists.flat());
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu dashboard:', err);
      }
    };
    loadData();
  }, []);
  // Thống kê
  const totalCourses = courses.length;
  const totalBanks = banks.length;
  const totalParts = parts.length;
  const totalQuestions = questions.length;
  const totalUsers = users.length;
  // Số lượt thi đã diễn ra
  const totalExamAttempts = examResults.length;
  // Tỷ lệ hoàn thành: số bài đã nộp / tổng số lượt thi (nếu có trường status)
  const submittedCount = examResults.filter(r => r.status === 'submitted').length;
  const completionRate = totalExamAttempts > 0 ? Math.round((submittedCount / totalExamAttempts) * 100) : 0;
  // Tỷ lệ đậu: số bài >=5 / số bài đã nộp
  const passCount = examResults.filter(r => r.status === 'submitted' && r.score >= 5).length;
  const passRate = submittedCount > 0 ? Math.round((passCount / submittedCount) * 100) : 0;
  // Biểu đồ số lượng đề theo môn học
  const partStats = courses.map(c => ({
    name: c.name,
    count: parts.filter(p => p.courseId === c.id).length
  }));
  // Biểu đồ số lượng câu hỏi theo ngân hàng
  const questionStats = banks.map(b => ({
    name: b.name,
    count: questions.filter(q => q.questionBankId === b.id).length
  }));
  // Lọc dữ liệu theo thời gian
  const filterByDate = (dateStr: string | undefined) => {
    if (!dateStr) return true;
    try {
      const date = parseISO(dateStr);
      const from = dateFrom ? parseISO(dateFrom) : undefined;
      const to = dateTo ? parseISO(dateTo) : undefined;
      if (from && isBefore(date, from)) return false;
      if (to && isAfter(date, to)) return false;
      return true;
    } catch {
      return true;
    }
  };
  const filteredCourses = courses.filter(c => filterByDate(typeof c.createdAt === 'string' ? c.createdAt : undefined));
  const filteredBanks = banks.filter(b => filterByDate((b as any).createdAt));
  const filteredParts = parts.filter(p => filterByDate(typeof p.createdAt === 'string' ? p.createdAt : undefined));
  const filteredQuestions = questions.filter(q => filterByDate((q as any).createdAt));
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard Thống kê</h1>
      <div className="flex gap-4 mb-6 items-center">
        <label className="flex items-center gap-2">Từ ngày
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded px-2 py-1" />
        </label>
        <label className="flex items-center gap-2">Đến ngày
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded px-2 py-1" />
        </label>
        <button className="px-3 py-1 bg-slate-200 rounded" onClick={()=>{setDateFrom('');setDateTo('')}}>Xóa lọc</button>
      </div>
      <OverviewCards
        totalCourses={filteredCourses.length}
        totalBanks={filteredBanks.length}
        totalParts={filteredParts.length}
        totalQuestions={filteredQuestions.length}
        totalUsers={totalUsers}
        totalExamAttempts={totalExamAttempts}
        completionRate={completionRate}
        passRate={passRate}
      />
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <ScoreDistributionChart examResults={examResults} />
        <PassFailPieChart examResults={examResults} />
      </div>
      <div className="grid md:grid-cols-2 gap-8 mb-8 items-start">
        <div className="max-w-xl w-full mx-auto">
          <StackedBarChart
            courses={courses}
            parts={parts}
            banks={banks}
            questions={questions}
            users={users}
          />
        </div>
        <div className="max-w-xl w-full mx-auto">
          <LineChart examResults={examResults} />
        </div>
      </div>
      <RadarChart courses={courses} examResults={examResults} parts={parts} />
      <Leaderboard users={users} examResults={examResults} courses={courses} parts={parts} questions={questions} />
      <PerQuestionBarChart examResults={examResults} />
      
    </div>
  );
};

const AdminForm: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);
  const [showTestNotification, setShowTestNotification] = useState<boolean>(false);

  const handleItemClick = useCallback((id: string) => {
    setActiveSection(id);
  }, []);

  const handleExpandChange = useCallback((isExpanded: boolean) => {
    setIsSidebarExpanded(isExpanded);
  }, []);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'manage-courses':
        return <ManageCourse />;
      case 'manage-parts':
        return <ManagePart />;
      case 'manage-questions':
        return <ManageQuestion />;
      case 'manage-users':
        return <ManageUser />;
      case 'manage-tests':
        return <ManageTests />;
      case 'exam-results':
        return <ExamResults />;
      case 'notifications':
        return <Notification />;
      case 'settings':
        return <AdminMailbox />;
      case 'system-settings':
        return <SystemSettings />;
      case 'admin-profile':
        return <AdminProfile />;
      case 'manage-question-banks':
        return <ManageQuestion />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar 
        activeItemId={activeSection} 
        onItemClick={handleItemClick} 
        onExpandChange={handleExpandChange}
      />
      <main className={`main-content bg-slate-50 p-8 overflow-y-auto min-h-screen ${!isSidebarExpanded ? 'sidebar-collapsed' : ''}`}>
        {/* Test Notification Button */}
        {/* <div className="fixed top-4 right-4 z-40">
          <button
            onClick={() => setShowTestNotification(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 shadow-lg"
          >
            Test Notification
          </button>
        </div> */}
        
        {renderActiveSection()}
      </main>
      
      {/* Test Notification Modal */}
      {showTestNotification && (
        <TestNotification onClose={() => setShowTestNotification(false)} />
      )}
    </div>
  );
};

export default AdminForm;
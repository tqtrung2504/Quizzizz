import React, { useEffect, useState } from 'react';
import { fetchParts, Part } from '../../../AdminPage/manage-part/PartApi';
import { useNavigate } from 'react-router-dom';
import TestCard from './TestCard';
import { getCourseById } from '../../../AdminPage/manage-course/courseApi';

const UserCourseTests: React.FC<{ courseId: string }> = ({ courseId }) => {
  const [parts, setParts] = useState<Part[]>([]);
  const [courseName, setCourseName] = useState<string>('');
  const [courseCode, setCourseCode] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchParts().then(all => setParts(all.filter(p => p.courseId === courseId)));
    getCourseById(courseId)
      .then(course => {
        setCourseName(course.name);
        setCourseCode(course.code);
      })
      .catch(() => {
        setCourseName('');
        setCourseCode('');
      });
  }, [courseId]);

  const handleStartTest = (partId: string) => {
    navigate(`user-test/${partId}`);
  };

  const handleViewResults = (partId: string) => {
    // Chuyển đến tab kết quả và filter theo bài thi
    navigate(`../results?testId=${partId}`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {(courseName || courseCode) && (
            <span className="text-lg font-bold text-sky-700 bg-sky-50 px-4 py-2 rounded-xl shadow-sm border border-sky-100 mr-4">
              {courseName}
              {courseCode && (
                <span className="text-slate-500 font-normal ml-2">(Mã: <span className="font-mono">{courseCode}</span>)</span>
              )}
            </span>
          )}
          <h2 className="text-3xl font-bold text-slate-800">Bài thi của tôi</h2>
        </div>
        <div className="text-sm text-slate-600">
          Tổng cộng: {parts.length} bài thi
        </div>
      </div>
      
      {parts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-600 mb-2">Chưa có bài thi nào</h3>
          <p className="text-slate-500">Môn học này chưa có bài thi nào được tạo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {parts.map(part => (
            <TestCard
              key={part.id}
              part={part}
              onStartTest={handleStartTest}
              onViewResults={handleViewResults}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserCourseTests; 
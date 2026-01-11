import React from 'react';
import { User } from '../manage-user/UserApi';
import { ExamResult } from '../manage-tests/ExamResultApi';
import { Course } from '../manage-course/courseApi';
import { Part } from '../manage-part/PartApi';
import { Question } from '../manage-question/QuestionApi';

interface LeaderboardProps {
  users: User[];
  examResults: ExamResult[];
  courses: Course[];
  parts: Part[];
  questions: Question[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ users, examResults, courses, parts, questions }) => {
  // Top 5 thí sinh điểm cao nhất
  const topResults = [...examResults]
    .filter(r => r.status === 'submitted')
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  // Top môn học có nhiều đề/câu hỏi nhất
  const courseStats = courses.map(c => {
    const courseParts = parts.filter(p => p.courseId === c.id);
    const partCount = courseParts.length;
    // Đếm tổng số câu hỏi của tất cả đề thi thuộc môn này
    const questionCount = courseParts.reduce((sum, p) => sum + (Array.isArray(p.questions) ? p.questions.length : 0), 0);
    return {
      course: c,
      partCount,
      questionCount,
    };
  });
  const topCourses = [...courseStats].sort((a, b) => (b.partCount + b.questionCount) - (a.partCount + a.questionCount)).slice(0, 3);
  return (
    <div className="mb-8 grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-bold text-lg mb-3">Top 5 thí sinh điểm cao nhất</h3>
        <ol className="list-decimal ml-6">
          {topResults.map((r) => (
            <li key={r.userEmail + r.testName} className="mb-1">
              <span className="font-semibold">{r.userName || r.userEmail}</span> - {r.score} điểm ({r.testName})
            </li>
          ))}
        </ol>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-bold text-lg mb-3">Top 3 môn học nhiều đề/câu hỏi nhất</h3>
        <ol className="list-decimal ml-6">
          {topCourses.map((stat) => (
            <li key={stat.course.id} className="mb-1">
              <span className="font-semibold">{stat.course.name}</span> - {stat.partCount} đề, {stat.questionCount} câu hỏi
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default Leaderboard; 
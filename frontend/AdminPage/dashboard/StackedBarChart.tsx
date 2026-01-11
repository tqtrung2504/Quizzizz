import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Course } from '../manage-course/courseApi';
import { Part } from '../manage-part/PartApi';
import { QuestionBank } from '../manage-question/QuestionBankApi';
import { Question } from '../manage-question/QuestionApi';
import { User } from '../manage-user/UserApi';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface StackedBarChartProps {
  courses: Course[];
  parts: Part[];
  banks: QuestionBank[];
  questions: Question[];
  users: User[];
}

const StackedBarChart: React.FC<StackedBarChartProps> = ({ courses, parts, banks, questions, users }) => {
  // Thống kê theo môn học
  const labels = courses.map(c => c.name);
  const partCounts = courses.map(c => parts.filter(p => p.courseId === c.id).length);
  // Số câu hỏi theo môn: tổng số câu hỏi của tất cả part thuộc môn đó
  const questionCounts = courses.map(c => {
    const courseParts = parts.filter(p => p.courseId === c.id);
    return courseParts.reduce((sum, p) => sum + (Array.isArray(p.questions) ? p.questions.length : 0), 0);
  });
  // Không có mapping user-môn học, để 0
  const userCounts = courses.map(_ => 0);
  const data = {
    labels,
    datasets: [
      {
        label: 'Đề thi',
        data: partCounts,
        backgroundColor: 'rgba(59,130,246,0.7)',
      },
      {
        label: 'Câu hỏi',
        data: questionCounts,
        backgroundColor: 'rgba(16,185,129,0.7)',
      },
      {
        label: 'Thí sinh',
        data: userCounts,
        backgroundColor: 'rgba(251,191,36,0.7)',
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'So sánh số lượng đề/câu hỏi/thí sinh theo môn học' },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true },
    },
  };
  return (
    <div className="mb-8">
      <Bar data={data} options={options} height={220} />
    </div>
  );
};

export default StackedBarChart; 
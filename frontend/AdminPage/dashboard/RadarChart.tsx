import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Course } from '../manage-course/courseApi';
import { ExamResult } from '../manage-tests/ExamResultApi';
import { Part } from '../manage-part/PartApi';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface RadarChartProps {
  courses: Course[];
  examResults: ExamResult[];
  parts: Part[];
}

const RadarChart: React.FC<RadarChartProps> = ({ courses, examResults, parts }) => {
  // Tính điểm trung bình từng môn học
  const labels = courses.map(c => c.name);
  const avgScores = courses.map(c => {
    // Lấy tất cả part (đề) của môn này
    const partIds = parts.filter(p => p.courseId === c.id).map(p => p.id);
    // Lấy tất cả kết quả thi của các đề này
    const results = examResults.filter(r => r.testId && partIds.includes(r.testId));
    if (!results.length) return 0;
    return +(results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(2);
  });
  const data = {
    labels,
    datasets: [
      {
        label: 'Điểm trung bình',
        data: avgScores,
        backgroundColor: 'rgba(59,130,246,0.2)',
        borderColor: 'rgba(59,130,246,1)',
        pointBackgroundColor: 'rgba(59,130,246,1)',
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Điểm trung bình từng môn học' },
    },
    scales: {
      r: { beginAtZero: true, min: 0, max: 10 },
    },
  };
  return (
    <div className="mb-8 max-w-xl mx-auto">
      {/* <Radar data={data} options={options} /> */}
    </div>
  );
};

export default RadarChart; 
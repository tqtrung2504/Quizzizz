import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { ExamResult } from '../manage-tests/ExamResultApi';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface LineChartProps {
  examResults: ExamResult[];
}

const LineChart: React.FC<LineChartProps> = ({ examResults }) => {
  // Gom nhóm theo ngày
  const dateMap: Record<string, number> = {};
  examResults.forEach(r => {
    if (!r.submittedAt) return;
    const d = new Date(r.submittedAt);
    const key = d.toLocaleDateString('vi-VN');
    dateMap[key] = (dateMap[key] || 0) + 1;
  });
  const labels = Object.keys(dateMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const data = {
    labels,
    datasets: [
      {
        label: 'Lượt thi',
        data: labels.map(l => dateMap[l]),
        borderColor: 'rgba(59,130,246,1)',
        backgroundColor: 'rgba(59,130,246,0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Xu hướng số lượt thi theo ngày' },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };
  return (
    <div className="mb-8">
      <Line data={data} options={options} height={220} />
    </div>
  );
};

export default LineChart; 
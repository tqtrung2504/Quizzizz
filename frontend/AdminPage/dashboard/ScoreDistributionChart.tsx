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
import { ExamResult } from '../manage-tests/ExamResultApi';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ScoreDistributionChartProps {
  examResults: ExamResult[];
}

const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({ examResults }) => {
  // Chia điểm thành các khoảng: 0-2, 2-4, 4-6, 6-8, 8-10
  const bins = [0, 2, 4, 6, 8, 10];
  const binLabels = ['0-2', '2-4', '4-6', '6-8', '8-10'];
  const binCounts = [0, 0, 0, 0, 0];
  examResults.forEach(r => {
    if (typeof r.score !== 'number') return;
    for (let i = 0; i < bins.length - 1; i++) {
      if (r.score >= bins[i] && (i === bins.length - 2 ? r.score <= bins[i + 1] : r.score < bins[i + 1])) {
        binCounts[i]++;
        break;
      }
    }
  });
  const data = {
    labels: binLabels,
    datasets: [
      {
        label: 'Số lượng thí sinh',
        data: binCounts,
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderRadius: 4,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Phân phối điểm số thí sinh' },
    },
    scales: {
      y: { beginAtZero: true, stepSize: 1 },
    },
  } as const;
  return (
    <div className="mb-8">
      <Bar data={data} options={options} height={220} />
    </div>
  );
};

export default ScoreDistributionChart; 
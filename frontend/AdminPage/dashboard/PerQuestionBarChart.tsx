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

interface PerQuestionBarChartProps {
  examResults: ExamResult[];
}

const PerQuestionBarChart: React.FC<PerQuestionBarChartProps> = ({ examResults }) => {
  // Gom thống kê đúng/sai từng câu hỏi (theo id hoặc nội dung)
  const questionStats: Record<string, { correct: number; wrong: number }> = {};
  examResults.forEach(r => {
    if (r.status !== 'submitted' || !r.details) return;
    r.details.forEach(d => {
      if (!questionStats[d.question]) questionStats[d.question] = { correct: 0, wrong: 0 };
      if (d.correct) questionStats[d.question].correct++;
      else questionStats[d.question].wrong++;
    });
  });
  const labels = Object.keys(questionStats);
  const correctData = labels.map(q => questionStats[q].correct);
  const wrongData = labels.map(q => questionStats[q].wrong);
  const data = {
    labels,
    datasets: [
      {
        label: 'Đúng',
        data: correctData,
        backgroundColor: 'rgba(34,197,94,0.8)',
      },
      {
        label: 'Sai',
        data: wrongData,
        backgroundColor: 'rgba(239,68,68,0.8)',
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Tỷ lệ đúng/sai từng câu hỏi' },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label;
            const value = context.raw;
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true },
    },
  };
  return (
    <div className="mb-8 max-w-2xl w-full mx-auto">
      <Bar data={data} options={options} height={180} />
    </div>
  );
};

export default PerQuestionBarChart; 
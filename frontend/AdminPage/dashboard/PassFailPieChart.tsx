import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { ExamResult } from '../manage-tests/ExamResultApi';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PassFailPieChartProps {
  examResults: ExamResult[];
}

const PassFailPieChart: React.FC<PassFailPieChartProps> = ({ examResults }) => {
  const submitted = examResults.filter(r => r.status === 'submitted');
  const pass = submitted.filter(r => r.score >= 5).length;
  const fail = submitted.length - pass;
  const data = {
    labels: ['Đậu (>=5)', 'Rớt (<5)'],
    datasets: [
      {
        data: [pass, fail],
        backgroundColor: [
          'rgba(34,197,94,0.8)', // xanh lá
          'rgba(239,68,68,0.8)', // đỏ
        ],
        borderWidth: 1,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const },
      title: { display: true, text: 'Tỷ lệ đậu/rớt' },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw;
            const total = pass + fail;
            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percent}%)`;
          },
        },
      },
    },
  };
  return (
    <div className="mb-8 max-w-xs mx-auto">
      <Pie data={data} options={options} />
    </div>
  );
};

export default PassFailPieChart; 
import React, { useEffect, useState } from 'react';
import { fetchExamResults, ExamResult } from './ExamResultApi';
import { saveAs } from 'file-saver';
import {
  Chart as ChartJS,
  CategoryScale,  
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { fetchUsers, User } from '../manage-user/UserApi';
import { fetchTests, Test } from './TestApi';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface ExamResultsProps {
  courseId?: string;
}

const ExamResults: React.FC<ExamResultsProps> = ({ courseId }) => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showDetail, setShowDetail] = useState<ExamResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tests, setTests] = useState<Test[]>([]);

  useEffect(() => {
    fetchExamResults()
      .then(data => {
        if (courseId) {
          // Lọc kết quả theo courseId dựa vào testId và danh sách bài thi
          fetchTests().then(tests => {
            const testIds = tests.filter(t => t.courseId === courseId).map(t => t.id);
            setResults(data.filter(r => testIds.includes(r.testId)));
          });
        } else {
          setResults(data);
        }
      })
      .catch((e: any) => {
        setError('Không thể tải dữ liệu kết quả thi. Vui lòng kiểm tra kết nối backend hoặc thử lại.');
        console.error('Lỗi fetchExamResults:', e);
      });
    fetchUsers().then(setUsers);
    fetchTests().then(setTests);
  }, [courseId]);

  let filtered = results;
  if (search.trim()) {
    const keyword = search.trim().toLowerCase();
    filtered = filtered.filter(r =>
      r.userName?.toLowerCase().includes(keyword) ||
      r.userEmail?.toLowerCase().includes(keyword) ||
      r.userStudentId?.toLowerCase().includes(keyword) ||
      r.testName?.toLowerCase().includes(keyword)
    );
  }
  if (filterStatus) {
    filtered = filtered.filter(r => r.status === filterStatus);
  }

  const avgScore = filtered.length ? (filtered.reduce((sum, r) => sum + r.score, 0) / filtered.length).toFixed(2) : 0;
  const passCount = filtered.filter(r => r.score >= 5).length;
  const failCount = filtered.length - passCount;

  const exportCSV = () => {
    const header = 'Tên học sinh,Email,Mã sinh viên,Đề thi,Điểm,Thời gian nộp,Trạng thái,Số lần thoát màn hình\n';
    const rows = filtered.map(r => [
      r.userName || '',
      r.userEmail || '',
      r.userStudentId || '',
      r.testName || '',
      r.score,
      r.submittedAt || '',
      r.status === 'submitted' ? 'Đã nộp' : 'Chưa nộp',
      r.leaveScreenCount || 0
    ].join(',')).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'exam_results.csv');
  };

  const testNames = Array.from(new Set(results.map(r => r.testName)));

  const getUserName = (userName: string) => {
    // Vì ExamResult đã có userName, chỉ cần trả về trực tiếp
    return userName;
  };

  const getTestName = (testName: string) => {
    // Vì ExamResult đã có testName, chỉ cần trả về trực tiếp
    return testName;
  };

  const getUserInfo = (result: ExamResult) => {
    const info = [];
    if (result.userName) info.push(result.userName);
    if (result.userEmail) info.push(`Email: ${result.userEmail}`);
    if (result.userStudentId) info.push(`MSSV: ${result.userStudentId}`);
    return info.join(' | ');
  };

  // Phổ điểm dạng histogram chia nhỏ mỗi 0.25 điểm
  const binSize = 0.25;
  const minScore = 0;
  const maxScore = 10;
  const binCount = Math.ceil((maxScore - minScore) / binSize) + 1;
  const scoreLabels = Array.from({ length: binCount }, (_, i) => (minScore + i * binSize).toFixed(2));
  const scoreDistribution = Array(binCount).fill(0);

  filtered.forEach(r => {
    let idx = Math.round((r.score - minScore) / binSize);
    if (idx < 0) idx = 0;
    if (idx >= binCount) idx = binCount - 1;
    scoreDistribution[idx]++;
  });

  const barData = {
    labels: scoreLabels,
    datasets: [
      {
        label: 'Số lượng thí sinh',
        data: scoreDistribution,
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderRadius: 2,
        barPercentage: 1.0,
        categoryPercentage: 1.0,
      },
    ],
  };

  // Pie chart đạt/không đạt
  const pieData = {
    labels: ['Đạt', 'Không đạt'],
    datasets: [
      {
        data: [passCount, failCount],
        backgroundColor: ['#4ade80', '#f87171'],
      },
    ],
  };

  // Thống kê đúng/sai từng câu hỏi
  const questionStats: Record<string, { correct: number; wrong: number; content: string }> = {};
  filtered.forEach(result => {
    result.details?.forEach((detail: any) => {
      const qid = detail.questionId;
      if (!questionStats[qid]) {
        questionStats[qid] = { correct: 0, wrong: 0, content: detail.question };
      }
      if (detail.correct) questionStats[qid].correct += 1;
      else questionStats[qid].wrong += 1;
    });
  });
  const questionLabels = Object.values(questionStats).map(q => q.content);
  const correctRates = Object.values(questionStats).map(q => {
    const total = q.correct + q.wrong;
    return total ? Math.round((q.correct / total) * 100) : 0;
  });
  const wrongRates = Object.values(questionStats).map(q => {
    const total = q.correct + q.wrong;
    return total ? Math.round((q.wrong / total) * 100) : 0;
  });
  const questionBarData = {
    labels: questionLabels,
    datasets: [
      {
        label: 'Tỉ lệ đúng (%)',
        data: correctRates,
        backgroundColor: '#4ade80',
      },
      {
        label: 'Tỉ lệ sai (%)',
        data: wrongRates,
        backgroundColor: '#f87171',
      },
    ],
  };

  // Câu hỏi đúng/sai nhiều nhất
  const mostCorrect = Object.values(questionStats).reduce((max, q) => q.correct > max.correct ? q : max, {correct: 0, wrong: 0, content: ''});
  const mostWrong = Object.values(questionStats).reduce((max, q) => q.wrong > max.wrong ? q : max, {correct: 0, wrong: 0, content: ''});

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Quản lý kết quả thi</h1>
      {error && <div className="mb-4 text-red-600 font-semibold">{error}</div>}
      {!error && filtered.length === 0 && <div className="mb-4 text-slate-500">Không có dữ liệu kết quả thi.</div>}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <div className="relative w-full sm:w-64">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" /></svg>
          </span>
          <input type="text" className="pl-10 pr-3 py-2 border rounded-2xl w-full focus:ring-2 focus:ring-sky-300 transition" placeholder="Tìm kiếm học sinh, đề thi..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="px-3 py-2 border rounded-2xl w-full sm:w-64" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">-- Tất cả trạng thái --</option>
          <option value="submitted">Đã nộp</option>
          <option value="not_submitted">Chưa nộp</option>
        </select>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 focus:outline-none text-base font-semibold" onClick={exportCSV}>Xuất file CSV</button>
      </div>
      <div className="mb-4 flex flex-wrap gap-6">
        <div className="flex items-center gap-2 bg-sky-100 rounded-xl px-4 py-2 min-w-[180px]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 7v7" /></svg>
          <span>Điểm trung bình: <span className="font-bold">{avgScore}</span></span>
        </div>
        <div className="flex items-center gap-2 bg-green-100 rounded-xl px-4 py-2 min-w-[120px]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <span>Đạt: <span className="font-bold">{passCount}</span></span>
        </div>
        <div className="flex items-center gap-2 bg-red-100 rounded-xl px-4 py-2 min-w-[120px]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          <span>Không đạt: <span className="font-bold">{failCount}</span></span>
        </div>
      </div>
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-2">Phổ điểm</h3>
          <Bar
            data={barData}
            options={{
              plugins: {
                legend: { display: false },
                tooltip: { enabled: true },
              },
              scales: {
                x: {
                  title: { display: true, text: 'Điểm' },
                  ticks: { maxRotation: 90, minRotation: 90, autoSkip: false, font: { size: 10 } },
                },
                y: {
                  title: { display: true, text: 'Số lượng thí sinh' },
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
        <div>
          <h3 className="font-semibold mb-2">Tỉ lệ đạt/không đạt</h3>
          <div style={{ maxWidth: 350, margin: '0 auto' }}>
            <Pie data={pieData} />
          </div>
        </div>
        <div className="md:col-span-2">
          <h3 className="font-semibold mb-2">Tỉ lệ đúng/sai từng câu hỏi</h3>
          <Bar data={questionBarData} options={{ indexAxis: 'y' }} />
        </div>
        <div className="md:col-span-2">
          <h3 className="font-semibold mb-2">Câu hỏi làm đúng/sai nhiều nhất</h3>
          <table className="w-full border text-sm rounded-xl shadow">
            <thead>
              <tr className="bg-slate-100">
                <th>Câu hỏi</th>
                <th>Làm đúng</th>
                <th>Làm sai</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold">{mostCorrect.content}</td>
                <td className="text-green-600 font-bold">{mostCorrect.correct}</td>
                <td>{mostCorrect.wrong}</td>
              </tr>
              <tr>
                <td className="font-semibold">{mostWrong.content}</td>
                <td>{mostWrong.correct}</td>
                <td className="text-red-600 font-bold">{mostWrong.wrong}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border text-sm mb-6 rounded-xl shadow">
          <thead>
            <tr className="bg-slate-100">
              <th>Thông tin thí sinh</th>
              <th>Đề thi</th>
              <th className="text-center">Điểm</th>
              <th>Thời gian nộp</th>
              <th className="text-center">Trạng thái</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition">
                <td className="max-w-xs">
                  <div className="font-semibold">{getUserName(r.userName)}</div>
                  {r.userEmail && <div className="text-xs text-slate-600">Email: {r.userEmail}</div>}
                </td>
                <td>{getTestName(r.testName)}</td>
                <td className="text-center font-bold">{r.score}</td>
                <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '-'}</td>
                <td className="text-center">
                  {r.status === 'submitted' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Đã nộp
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" /></svg>
                      Chưa nộp
                    </span>
                  )}
                </td>
                <td className="text-center">
                  <button className="px-3 py-1 bg-sky-600 text-white rounded-full flex items-center gap-1 hover:bg-sky-700 transition font-semibold" onClick={() => setShowDetail(r)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-6 0a6 6 0 1112 0 6 6 0 01-12 0z" /></svg>
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white shadow-2xl w-full max-w-lg sm:max-w-xl md:max-w-2xl relative p-2 sm:p-6 md:p-8 max-h-[90vh] overflow-y-auto rounded-[20px] overflow-hidden scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`
              .scrollbar-none::-webkit-scrollbar { display: none; }
            `}</style>
            <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 text-2xl font-bold" onClick={() => setShowDetail(null)}>&times;</button>
            <h2 className="text-2xl font-bold mb-4">Chi tiết bài làm: <span className="text-sky-700">{showDetail.userName}</span> - <span className="text-sky-700">{showDetail.testName}</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-sky-50 rounded-xl p-4">
                <div className="font-semibold">Điểm:</div>
                <div className="text-2xl font-bold text-sky-700">{showDetail.score}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="font-semibold">Thời gian nộp:</div>
                <div>{showDetail.submittedAt ? new Date(showDetail.submittedAt).toLocaleString() : '-'}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="font-semibold">Trạng thái:</div>
                <div>
                  {showDetail.status === 'submitted' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Đã nộp
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" /></svg>
                      Chưa nộp
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4">
                <div className="font-semibold">Số lần thoát khỏi màn hình thi:</div>
                <div className={(showDetail.leaveScreenCount ?? 0) > 0 ? 'text-orange-600 font-bold' : 'font-bold'}>
                  {showDetail.leaveScreenCount ?? 0}
                </div>
              </div>
              {showDetail.userEmail && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="font-semibold">Email:</div>
                  <div className="text-blue-700">{showDetail.userEmail}</div>
                </div>
              )}
            </div>
            <div className="font-semibold mt-4 mb-2">Chi tiết từng câu hỏi:</div>
            <ol className="list-decimal ml-6">
              {showDetail.details?.map((d: any, idx: number) => (
                <li key={idx} className="mb-2">
                  <div className="font-semibold">
                    {typeof d.question === 'string'
                      ? d.question
                      : JSON.stringify(d.question)}
                  </div>
                  <div>
                    Trả lời: {d.answer}{' '}
                    {d.correct ? (
                      <span className="text-green-600">(Đúng)</span>
                    ) : (
                      <span className="text-red-600">(Sai)</span>
                    )}
                  </div>
                  <div>Điểm: {d.point}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamResults;

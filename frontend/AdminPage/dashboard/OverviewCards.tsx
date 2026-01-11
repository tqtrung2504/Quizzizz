import React from 'react';

interface OverviewCardsProps {
  totalCourses: number;
  totalBanks: number;
  totalParts: number;
  totalQuestions: number;
  totalUsers: number;
  totalExamAttempts: number;
  completionRate: number; // 0-100
  passRate: number; // 0-100
}

const cardStyle =
  'rounded-xl p-6 text-center flex flex-col items-center justify-center shadow bg-white';

const OverviewCards: React.FC<OverviewCardsProps> = ({
  totalCourses,
  totalBanks,
  totalParts,
  totalQuestions,
  totalUsers,
  totalExamAttempts,
  completionRate,
  passRate,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
      <div className={`bg-sky-100/80 border-sky-200/60 border-2 ${cardStyle}`}>
        <div className="text-3xl font-bold">{totalCourses}</div>
        <div className="text-slate-600 mt-2">Môn học</div>
      </div>
      <div className={`bg-green-100/80 border-green-200/60 border-2 ${cardStyle}`}>
        <div className="text-3xl font-bold">{totalBanks}</div>
        <div className="text-slate-600 mt-2">Ngân hàng câu hỏi</div>
      </div>
      <div className={`bg-yellow-100/80 border-yellow-200/60 border-2 ${cardStyle}`}>
        <div className="text-3xl font-bold">{totalParts}</div>
        <div className="text-slate-600 mt-2">Đề thi</div>
      </div>
      <div className={`bg-pink-100/80 border-pink-200/60 border-2 ${cardStyle}`}>
        <div className="text-3xl font-bold">{totalQuestions}</div>
        <div className="text-slate-600 mt-2">Câu hỏi</div>
      </div>
      <div className={`bg-indigo-100/80 border-indigo-200/60 border-2 ${cardStyle}`}>
        <div className="text-3xl font-bold">{totalUsers}</div>
        <div className="text-slate-600 mt-2">Tổng thí sinh</div>
      </div>
      <div className={`bg-orange-100/80 border-orange-200/60 border-2 ${cardStyle}`}>
        <div className="text-3xl font-bold">{totalExamAttempts}</div>
        <div className="text-slate-600 mt-2">Lượt thi đã diễn ra</div>
      </div>
      <div className={`bg-teal-100/80 border-teal-200/60 border-2 ${cardStyle}`}>
        <div className="text-3xl font-bold">{completionRate}%</div>
        <div className="text-slate-600 mt-2">Tỷ lệ hoàn thành</div>
      </div>
      <div className={`bg-lime-100/80 border-lime-200/60 border-2 ${cardStyle}`}>
        <div className="text-3xl font-bold">{passRate}%</div>
        <div className="text-slate-600 mt-2">Tỷ lệ đậu</div>
      </div>
    </div>
  );
};

export default OverviewCards; 
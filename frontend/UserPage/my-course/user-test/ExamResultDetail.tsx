import React from 'react';

interface ResultDetail {
  questionId: string;
  correct: boolean;
  point: number;
  optionIds: string;
  answer?: string;
  question?: string;
}

interface ExamResultDetailProps {
  details: ResultDetail[];
  score: number;
  totalScore: number;
  onClose: () => void;
  onExitToResults?: () => void;
}

const ExamResultDetail: React.FC<ExamResultDetailProps> = ({ details, score, totalScore, onClose, onExitToResults }) => {
  const correctCount = details.filter(d => d.correct).length;
  const incorrectCount = details.filter(d => !d.correct).length;
  const unansweredCount = details.filter(d => d.answer === "Không trả lời").length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Kết quả chi tiết bài thi</h2>
          <button 
            className="text-slate-400 hover:text-red-500 text-2xl font-bold" 
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Tổng quan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{details.length}</div>
            <div className="text-sm text-slate-600">Tổng số câu</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{correctCount}</div>
            <div className="text-sm text-slate-600">Câu đúng</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{incorrectCount}</div>
            <div className="text-sm text-slate-600">Câu sai</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{score.toFixed(1)}/{totalScore}</div>
            <div className="text-sm text-slate-600">Điểm số</div>
          </div>
        </div>

        {/* Chi tiết từng câu */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Chi tiết từng câu hỏi:</h3>
          {details.map((detail, index) => (
            <div 
              key={detail.questionId} 
              className={`border rounded-lg p-4 ${
                detail.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${
                    detail.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="font-semibold">
                    {detail.question || `Câu hỏi ${index + 1}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    detail.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {detail.correct ? 'Đúng' : 'Sai'}
                  </span>
                  <span className="text-sm font-semibold">
                    {detail.point.toFixed(1)} điểm
                  </span>
                </div>
              </div>
              
              <div className="ml-8">
                <div className="text-sm text-slate-600 mb-1">
                  <strong>Trả lời của bạn:</strong> {detail.answer || 'Không trả lời'}
                </div>
                {!detail.correct && detail.answer !== "Không trả lời" && (
                  <div className="text-sm text-red-600">
                    <strong>Đáp án đúng:</strong> {getCorrectAnswerText(detail)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Thống kê bổ sung */}
        {unansweredCount > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-semibold text-yellow-800">
                Lưu ý: Bạn có {unansweredCount} câu chưa trả lời
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700"
          >
            Đóng
          </button>
          {onExitToResults && (
            <button 
              onClick={onExitToResults}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
            >
              Thoát ra màn hình kết quả
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function để lấy đáp án đúng (cần implement dựa trên dữ liệu thực tế)
const getCorrectAnswerText = (detail: ResultDetail): string => {
  // Trong thực tế, bạn cần truyền thêm thông tin về đáp án đúng
  // từ backend hoặc từ context của bài thi
  return "Đáp án đúng sẽ được hiển thị ở đây";
};

export default ExamResultDetail; 
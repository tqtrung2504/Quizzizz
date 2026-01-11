import React, { useEffect, useState } from 'react';
import { fetchQuestions, deleteQuestion, Question } from './QuestionApi';
import QuestionForm from './QuestionForm';

interface Props {
  bankId: string;
  onClose: () => void;
}

const QuestionList: React.FC<Props> = ({ bankId, onClose }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await fetchQuestions(bankId);
      setQuestions(data);
    } catch (err) {
      console.error('Lỗi khi tải câu hỏi:', err);
      alert('Lỗi khi tải câu hỏi!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line
  }, [bankId]);

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    try {
      await deleteQuestion(bankId, id);
      await loadQuestions();
    } catch (err) {
      console.error('Lỗi khi xóa câu hỏi:', err);
      alert('Lỗi khi xóa câu hỏi!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative">
        <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-700" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4">Danh sách câu hỏi</h2>
        {loading ? (
          <div className="text-center text-slate-500">Đang tải...</div>
        ) : questions.length === 0 ? (
          <div className="text-center text-slate-500">Chưa có câu hỏi nào.</div>
        ) : (
          <ul className="space-y-4 max-h-[60vh] overflow-y-auto">
            {questions.map((q, idx) => (
              <li key={q.id} className="border rounded p-3 flex flex-col gap-1 bg-slate-50">
                <div className="font-semibold">{idx + 1}. {q.content}</div>
                <div className="text-xs text-slate-500">Loại: {q.type} | Độ khó: {q.level}</div>
                <ul className="pl-4 text-sm">
                  {q.options.map((opt, i) => (
                    <li key={i} className={opt.correct ? 'text-green-600 font-bold' : ''}>
                      {q.type !== 'truefalse' ? String.fromCharCode(65 + i) + '. ' : ''}{opt.text} {opt.correct ? '(Đúng)' : ''}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 self-end mt-2">
                  <button className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600" onClick={() => setEditingQuestion(q)}>Chỉnh sửa</button>
                  <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600" onClick={() => handleDelete(q.id)}>Xóa</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {editingQuestion && (
          <QuestionForm
            bankId={bankId}
            question={editingQuestion}
            isCustomQuestion={false}
            onSuccess={async () => {
              setEditingQuestion(null);
              await loadQuestions();
            }}
            onClose={() => setEditingQuestion(null)}
          />
        )}
      </div>
    </div>
  );
};

export default QuestionList; 
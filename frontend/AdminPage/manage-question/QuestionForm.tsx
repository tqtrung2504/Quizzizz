import React, { useState } from 'react';
import { createQuestion, Question, updateQuestion } from './QuestionApi';
import axios from 'axios';

interface Props {
  bankId: string;
  onSuccess?: (newQuestion: any) => void;
  onClose: () => void;
  question?: Question;
  isCustomQuestion?: boolean;
}

const defaultOptions = {
  truefalse: [
    { text: 'Đúng', correct: true },
    { text: 'Sai', correct: false }
  ],
  single: [
    { text: '', correct: false },
    { text: '', correct: false },
    { text: '', correct: false },
    { text: '', correct: false }
  ],
  multiple: [
    { text: '', correct: false },
    { text: '', correct: false }
  ]
};

const QuestionForm: React.FC<Props> = ({ bankId, onSuccess, onClose, question, isCustomQuestion }) => {
  const [content, setContent] = useState(question?.content || '');
  const [type, setType] = useState<'truefalse' | 'single' | 'multiple'>(question?.type || 'truefalse');
  const [level, setLevel] = useState<'easy' | 'medium' | 'hard'>(question?.level || 'easy');
  const [options, setOptions] = useState(question?.options || defaultOptions[question?.type || 'truefalse']);
  const [loading, setLoading] = useState(false);

  // Khi đổi loại câu hỏi, reset options phù hợp
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const t = e.target.value as 'truefalse' | 'single' | 'multiple';
    setType(t);
    setOptions(defaultOptions[t]);
  };

  // Khi đổi số lượng đáp án (multiple)
  const handleAddOption = () => {
    setOptions([...options, { text: '', correct: false }]);
  };
  const handleRemoveOption = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx));
  };

  // Khi nhập nội dung đáp án
  const handleOptionChange = (idx: number, value: string) => {
    setOptions(options.map((opt, i) => i === idx ? { ...opt, text: value } : opt));
  };

  // Chọn đáp án đúng
  const handleCorrectChange = (idx: number) => {
    if (type === 'single' || type === 'truefalse') {
      setOptions(options.map((opt, i) => ({ ...opt, correct: i === idx })));
    } else {
      setOptions(options.map((opt, i) => i === idx ? { ...opt, correct: !opt.correct } : opt));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || options.some(opt => !opt.text.trim())) {
      alert('Vui lòng nhập đầy đủ nội dung và đáp án!');
      return;
    }
    if (type === 'single' && options.filter(opt => opt.correct).length !== 1) {
      alert('Phải chọn đúng 1 đáp án đúng!');
      return;
    }
    if (type === 'multiple' && options.filter(opt => opt.correct).length < 1) {
      alert('Phải chọn ít nhất 1 đáp án đúng!');
      return;
    }
    setLoading(true);
    try {
      let createdQuestion: any = null;
      if (question && question.id) {
        if (isCustomQuestion) {
          createdQuestion = { ...question, content, type, level, options };
        } else {
          // Log id và data để kiểm tra
          console.log('updateQuestion', question.id, { content, type, level, options, questionBankId: question.questionBankId });
          await import('./QuestionApi').then(api => api.updateQuestion(question.id!, {
            content,
            type,
            level,
            options,
            questionBankId: question.questionBankId
          }));
          createdQuestion = { ...question, content, type, level, options, questionBankId: question.questionBankId };
        }
      } else {
        const bankId = question?.questionBankId || '';
        createdQuestion = await import('./QuestionApi').then(api => api.createQuestion(bankId, {
          content,
          type,
          level,
          options,
          questionBankId: bankId
        }));
      }
      onSuccess && onSuccess(createdQuestion);
    } catch (err) {
      console.error('Lỗi khi lưu câu hỏi:', err);
      alert('Lỗi khi lưu câu hỏi!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative">
        <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-700" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4">{question ? 'Chỉnh sửa câu hỏi' : 'Chỉnh sửa câu hỏi'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Nội dung câu hỏi" className="w-full px-3 py-2 border rounded" required />
          <div className="flex gap-2">
            <select value={type} onChange={handleTypeChange} className="px-3 py-2 border rounded">
              <option value="truefalse">Đúng/Sai</option>
              <option value="single">1 đáp án đúng</option>
              <option value="multiple">Nhiều đáp án đúng</option>
            </select>
            <select value={level} onChange={e => setLevel(e.target.value as any)} className="px-3 py-2 border rounded">
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {type !== 'truefalse' && (
                  <span className="text-slate-500">{String.fromCharCode(65 + idx)}.</span>
                )}
                <input
                  type="text"
                  value={opt.text}
                  onChange={e => handleOptionChange(idx, e.target.value)}
                  className="flex-1 px-3 py-2 border rounded"
                  placeholder={type === 'truefalse' ? (idx === 0 ? 'Đúng' : 'Sai') : 'Đáp án'}
                  required
                  disabled={type === 'truefalse'}
                />
                <input
                  type={type === 'multiple' ? 'checkbox' : 'radio'}
                  checked={opt.correct}
                  onChange={() => handleCorrectChange(idx)}
                  name="correct"
                />
                {type === 'multiple' && options.length > 2 && (
                  <button type="button" className="text-red-500" onClick={() => handleRemoveOption(idx)}>X</button>
                )}
              </div>
            ))}
            {type === 'multiple' && (
              <button type="button" className="px-2 py-1 bg-slate-200 rounded" onClick={handleAddOption}>+ Thêm đáp án</button>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 bg-slate-200 rounded" onClick={onClose}>Hủy</button>
            <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700" disabled={loading}>Lưu</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionForm; 
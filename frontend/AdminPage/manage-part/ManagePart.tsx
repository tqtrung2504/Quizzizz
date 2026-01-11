import React, { useEffect, useState } from 'react';
import { fetchParts, createPart, updatePart, deletePart, Part } from './PartApi';
import { fetchCourses, Course } from '../manage-course/courseApi';
import { fetchQuestionBanks, QuestionBank } from '../manage-question/QuestionBankApi';
import { fetchQuestions, Question, updateQuestion, deleteQuestion } from '../manage-question/QuestionApi';
import QuestionForm from '../manage-question/QuestionForm';
import ImportQuestionExcel from '../manage-question/ImportQuestionExcel';

const emptyPart: Omit<Part, 'id'> = {
  name: '',
  description: '',
  duration: 60,
  courseId: '',
  maxRetake: 1,
  randomizeQuestions: true,
  enableAntiCheat: false,
  enableTabWarning: false,
  openTime: '',
  closeTime: '',
  showAnswerAfterSubmit: false
};

interface QuestionInTest {
  id: string;
  content: string;
  type: string;
  level: string;
  score: number;
  options?: any[];
  answer?: string;
}

interface ManagePartProps {
  courseId?: string;
}

const scoringModes = [
  { value: 'even', label: 'Chia đều cho tất cả câu hỏi' },
  { value: 'byDifficulty', label: 'Chia theo độ khó' },
  { value: 'manual', label: 'Tự chỉnh điểm từng câu' },
];

const ManagePart: React.FC<ManagePartProps> = ({ courseId }) => {
  const [parts, setParts] = useState<Part[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [formData, setFormData] = useState<Omit<Part, 'id'>>(emptyPart);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [selectMode, setSelectMode] = useState<'manual'|'auto'>('manual');
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [autoEasy, setAutoEasy] = useState(0);
  const [autoMedium, setAutoMedium] = useState(0);
  const [autoHard, setAutoHard] = useState(0);
  const [score, setScore] = useState(10);
  const [questionScores, setQuestionScores] = useState<{[id: string]: number}>({});
  const [totalScore, setTotalScore] = useState(10);
  const [scoreMode, setScoreMode] = useState<'total'|'per-question'>('total');
  const [showView, setShowView] = useState<{open: boolean, part: Part|null}>({open: false, part: null});
  const [editingQuestion, setEditingQuestion] = useState<any|null>(null);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<string[]>([]);
  const [showSelectQuestionModal, setShowSelectQuestionModal] = useState(false);
  const [tempSelectedQuestions, setTempSelectedQuestions] = useState<Question[]>([]);
  const [editingModalQuestion, setEditingModalQuestion] = useState<Question|null>(null);
  const [questionSource, setQuestionSource] = useState<'bank'|'custom'>('bank');
  const [bankTab, setBankTab] = useState<'auto'|'manual'>('auto');
  const [showImportExcel, setShowImportExcel] = useState<{open: boolean, bankId: string | null}>({open: false, bankId: null});
  const [showViewQuestions, setShowViewQuestions] = useState(false);
  const [scoringMode, setScoringMode] = useState('even');
  const [manualScores, setManualScores] = useState<any>({});
  const [scoreError, setScoreError] = useState('');

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

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [partData, courseData] = await Promise.all([
        fetchParts(),
        fetchCourses()
      ]);
      setParts(courseId ? partData.filter(p => p.courseId === courseId) : partData);
      setCourses(courseData);
      if (courseData.length === 0) {
        setLoadError('Không có dữ liệu môn học. Vui lòng tạo môn học trước khi tạo bài thi!');
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
      setLoadError('Lỗi khi tải dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.courseId) {
      fetchQuestionBanks('', formData.courseId).then(setQuestionBanks);
    }
  }, [formData.courseId]);

  useEffect(() => {
    if (selectedBankId) {
      fetchQuestions(selectedBankId).then(setQuestions);
    }
  }, [selectedBankId]);

  const handleOpenCreate = () => {
    setFormData(courseId ? { ...emptyPart, courseId } : emptyPart);
    setShowCreate(true);
  };

  const handleOpenEdit = (part: Part) => {
    setEditId(part.id);
    setFormData({
      name: part.name,
      description: part.description,
      duration: part.duration,
      courseId: part.courseId,
      maxRetake: part.maxRetake,
      randomizeQuestions: part.randomizeQuestions,
      enableAntiCheat: part.enableAntiCheat,
      enableTabWarning: part.enableTabWarning,
      openTime: part.openTime ? new Date(part.openTime).toISOString().slice(0, 16) : '',
      closeTime: part.closeTime ? new Date(part.closeTime).toISOString().slice(0, 16) : '',
      showAnswerAfterSubmit: part.showAnswerAfterSubmit ?? false,
      questions: part.questions || [],
      score: part.score,
      scoringMode: part.scoringMode,
    });
    setShowEdit(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Bạn có chắc muốn xóa bài thi này?')) return;
    try {
      await deletePart(id);
      await loadData();
    } catch (err) {
      console.error('Lỗi khi xóa bài thi:', err);
      alert('Lỗi khi xóa bài thi!');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) || 0 : value
    }));
    if (name === 'courseId') {
      setSelectedBankId('');
      setQuestions([]);
      setSelectedQuestions([]);
      setAutoEasy(0);
      setAutoMedium(0);
      setAutoHard(0);
    }
  };

  const isDuplicateName = (name: string, courseId: string, ignoreId?: string) => {
    return parts.some(p => p.name.trim().toLowerCase() === name.trim().toLowerCase() && p.courseId === courseId && p.id !== ignoreId);
  };

  const handleToggleQuestion = (q: Question) => {
    setSelectedQuestions(prev => {
      const id = q.id?.toString() || '';
      const exists = prev.some(x => x.id === id);
      if (exists) {
        const filtered = prev.filter(x => x.id !== id);
        const newScores = {...questionScores};
        delete newScores[id];
        setQuestionScores(newScores);
        return filtered;
      } else {
        setQuestionScores(s => ({...s, [id]: 1}));
        return [...prev, {...q, id, options: q.options ? JSON.parse(JSON.stringify(q.options)) : undefined, answer: q.answer}];
      }
    });
  };

  const handleAutoSelect = () => {
    const easy = questions.filter(q => q.level === 'easy');
    const medium = questions.filter(q => q.level === 'medium');
    const hard = questions.filter(q => q.level === 'hard');
    const selected = [
      ...easy.slice(0, autoEasy),
      ...medium.slice(0, autoMedium),
      ...hard.slice(0, autoHard)
    ].map(q => ({...q, id: q.id?.toString() || '', options: q.options ? JSON.parse(JSON.stringify(q.options)) : undefined, answer: q.answer}));
    setSelectedQuestions(selected);
    const newScores: {[id: string]: number} = {};
    selected.forEach(q => { newScores[q.id] = 1; });
    setQuestionScores(newScores);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId) {
      alert('Vui lòng chọn môn học!');
      return;
    }
    if (isDuplicateName(formData.name, formData.courseId)) {
      alert('Tên bài thi đã tồn tại trong môn học này!');
      return;
    }
    if (selectedQuestions.length === 0) {
      alert('Vui lòng chọn ít nhất 1 câu hỏi cho bài thi!');
      return;
    }
    let questionsToSave: QuestionInTest[] = selectedQuestions.map(q => ({
      id: q.id?.toString() || '',
      content: q.content,
      type: q.type,
      level: q.level,
      score: scoreMode==='per-question' ? questionScores[q.id?.toString() || ''] || 1 : +(totalScore/selectedQuestions.length).toFixed(2),
      options: q.options ? JSON.parse(JSON.stringify(q.options)) : undefined,
      answer: q.answer
    }));
    try {
      const payload = {
        ...formData,
        openTime: formData.openTime ? new Date(formData.openTime).toISOString() : '',
        closeTime: formData.closeTime ? new Date(formData.closeTime).toISOString() : '',
        questions: questionsToSave,
        score: scoreMode==='total' ? totalScore : questionsToSave.reduce((a,b)=>a+b.score,0),
        showAnswerAfterSubmit: formData.showAnswerAfterSubmit
      };
      await createPart(payload);
      setShowCreate(false);
      setStep(1);
      setSelectedQuestions([]);
      setQuestionScores({});
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data || 'Lỗi khi tạo bài thi!');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    if (!formData.courseId) {
      alert('Vui lòng chọn môn học!');
      return;
    }
    if (isDuplicateName(formData.name, formData.courseId, editId)) {
      alert('Tên bài thi đã tồn tại trong môn học này!');
      return;
    }
    try {
      const payload = {
        ...formData,
        openTime: formData.openTime ? new Date(formData.openTime).toISOString() : '',
        closeTime: formData.closeTime ? new Date(formData.closeTime).toISOString() : '',
      };
      await updatePart(editId, payload);
      setShowEdit(false);
      setEditId(undefined);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data || 'Lỗi khi cập nhật bài thi!');
    }
  };

  const filteredParts = courseId ? parts.filter(p => p.courseId === courseId) : parts.filter(part => {
    const keyword = search.trim().toLowerCase();
    const course = courses.find(c => c.id === part.courseId);
    return (
      part.name.toLowerCase().includes(keyword) ||
      (course && course.name.toLowerCase().includes(keyword)) ||
      (course && course.code.toLowerCase().includes(keyword))
    );
  });

  const handleView = (part: Part) => {
    setShowView({open: true, part});
    setEditingQuestion(null);
    setAddingQuestion(false);
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!showView.part) return;
    const newQuestions = (showView.part.questions || []).filter((q: any) => q.id !== qId);
    await updatePart(String(showView.part.id), {...showView.part, questions: newQuestions});
    setShowView({open: true, part: {...showView.part, questions: newQuestions}});
  };

  const handleSaveEditQuestion = async (q: any) => {
    if (!showView.part) return;
    const newQuestions = (showView.part.questions || []).map((item: any) => item.id === q.id ? q : item);
    await updatePart(String(showView.part.id), { ...showView.part, questions: newQuestions });
    setShowView({ open: true, part: { ...showView.part, questions: newQuestions } });
    setEditingQuestion(null);
  };

  const handleAddQuestion = async (q: any) => {
    if (!showView.part) return;
    const newQuestions = [...(showView.part.questions || []), q];
    await updatePart(String(showView.part.id), {...showView.part, questions: newQuestions});
    setShowView({open: true, part: {...showView.part, questions: newQuestions}});
    setAddingQuestion(false);
  };

  const handleOpenBankModal = async () => {
    if (!selectedBankId) return;
    const qs = await fetchQuestions(selectedBankId);
    setBankQuestions(qs);
    setSelectedBankQuestions([]);
    setShowBankModal(true);
  };

  const handleAddFromBank = async () => {
    if (!showView.part) return;
    const toAdd = bankQuestions.filter(q => selectedBankQuestions.includes(String(q.id)));
    const newQuestions = [...(showView.part.questions || []), ...toAdd];
    await updatePart(String(showView.part.id), {...showView.part, questions: newQuestions});
    setShowView({open: true, part: {...showView.part, questions: newQuestions}});
    setShowBankModal(false);
  };

  const handleAddNewQuestion = async (newQuestion: any) => {
    if (!showView.part) return;
    const newQuestions = [...(showView.part.questions || []), newQuestion];
    await updatePart(String(showView.part.id), {...showView.part, questions: newQuestions});
    setShowView({ open: true, part: { ...showView.part, questions: newQuestions } });
    setAddingQuestion(false);
    setEditingQuestion(null);
  };

  const handleImportExcel = (questionsFromExcel: any[]) => {
    setSelectedQuestions([...selectedQuestions, ...questionsFromExcel]);
  };

  // Hàm chuyển type sang text tiếng Việt
  const getTypeLabel = (type: string) => {
    if (type === 'truefalse') return 'Đúng/Sai';
    if (type === 'single') return '1 đáp án đúng';
    if (type === 'multiple') return 'Nhiều đáp án đúng';
    return type;
  };

  // Thêm hàm tính điểm theo cơ chế
  function calculateScores(questions: any[], totalScore: number, mode: string, manualScores: any = {}) {
    if (mode === 'even') {
      const perQ = totalScore / questions.length;
      return questions.map(q => ({ ...q, score: perQ }));
    }
    if (mode === 'byDifficulty') {
      const weights: any = { easy: 1, medium: 1.5, hard: 2 };
      const totalWeight = questions.reduce((sum, q) => sum + (weights[q.level] || 1), 0);
      return questions.map(q => ({
        ...q,
        score: totalScore * (weights[q.level] || 1) / totalWeight
      }));
    }
    if (mode === 'manual') {
      return questions.map(q => ({ ...q, score: parseFloat(manualScores[q.id]) || 0 }));
    }
    return questions;
  }

  return (
    <div className="relative min-h-screen bg-slate-50 p-2 sm:p-6 overflow-x-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Quản lý bài thi</h1>
        <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" /></svg>
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm bài thi, tên hoặc mã môn học..."
              className="pl-10 pr-3 py-2 border rounded-2xl w-full focus:ring-2 focus:ring-sky-300 transition"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            className="px-4 py-2 bg-sky-600 text-white rounded-lg shadow hover:bg-sky-700 focus:outline-none text-base font-semibold w-full sm:w-auto"
            onClick={handleOpenCreate}
          >
            + Thêm bài thi
          </button>
        </div>
      </div>
      {loading ? (
        <div className="text-center text-slate-500">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 mt-4 sm:mt-8">
          {parts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center text-gray-400 mt-8 sm:mt-16">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 018 0v2m-4-4v4m0 0v4m0-4h4m-4 0H7" /></svg>
              <span className="text-lg">Chưa có bài thi nào</span>
            </div>
          ) : (
            parts.map(part => {
              const course = courses.find(c => c.id === part.courseId);
              const totalQuestions = (part.questions || []).length;
              const easyCount = (part.questions || []).filter(q => q.level === 'easy').length;
              const mediumCount = (part.questions || []).filter(q => q.level === 'medium').length;
              const hardCount = (part.questions || []).filter(q => q.level === 'hard').length;
              return (
                <div
                  key={part.id}
                  className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col min-h-[180px] sm:min-h-[220px] transition-transform hover:scale-105 hover:shadow-2xl border border-slate-100 relative overflow-x-auto"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 mb-2">
                    <div className="bg-sky-100 text-sky-600 rounded-full p-2 w-fit mx-auto sm:mx-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 7v7" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-lg sm:text-xl mb-1 truncate">{part.name}</div>
                      <div className="text-gray-600 text-sm truncate">Môn học: <span className="font-semibold">{course?.name || ''}</span></div>
                      <div className="text-gray-600 text-sm truncate">Mã môn học: <span className="font-semibold">{course?.code || ''}</span></div>
                      <div className="text-gray-600 text-sm truncate">Thời gian: <span className="font-semibold">{part.duration} phút</span></div>
                      <div className="text-slate-700 text-xs mt-2">Tổng số câu hỏi: <b>{totalQuestions}</b> | Dễ: <b>{easyCount}</b> | Trung bình: <b>{mediumCount}</b> | Khó: <b>{hardCount}</b></div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                    <button className="px-2 py-1 bg-yellow-500 text-white rounded w-full sm:w-auto" onClick={() => handleOpenEdit(part)}>Chỉnh sửa</button>
                    <button className="px-2 py-1 bg-red-500 text-white rounded w-full sm:w-auto" onClick={() => handleDelete(part.id)}>Xóa</button>
                    <button className="px-2 py-1 bg-blue-500 text-white rounded w-full sm:w-auto" onClick={() => handleView(part)}>Xem đề thi</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-xl shadow-2xl p-4 sm:p-8 w-full max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
              onClick={() => {
                setShowCreate(false);
                setStep(1);
                setSelectedQuestions([]);
                setQuestionScores({});
              }}
              aria-label="Đóng"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4">Thêm bài thi</h2>
            <div className="flex gap-2 mb-6">
              <div className={`flex-1 text-center py-2 rounded ${step===1?'bg-sky-600 text-white':'bg-slate-200'}`}>1. Thông tin</div>
              <div className={`flex-1 text-center py-2 rounded ${step===2?'bg-sky-600 text-white':'bg-slate-200'}`}>2. Chọn câu hỏi</div>
              <div className={`flex-1 text-center py-2 rounded ${step===3?'bg-sky-600 text-white':'bg-slate-200'}`}>3. Thiết lập điểm</div>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <label className="block font-medium">Tên bài thi</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nhập tên bài thi" className="w-full px-3 py-2 border rounded" required />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-medium">Mô tả</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Nhập mô tả" className="w-full px-3 py-2 border rounded" />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-medium">Thời gian làm bài (phút)</label>
                    <input type="number" name="duration" value={formData.duration} onChange={handleChange} placeholder="Thời gian (phút)" className="w-full px-3 py-2 border rounded" min={1} />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-medium">Môn học</label>
                    {courseId ? (
                      <div className="w-full px-3 py-2 border rounded bg-slate-100 text-slate-700">
                        {courses.find(c => c.id === courseId)?.name || 'Môn học hiện tại'}
                      </div>
                    ) : (
                    <select name="courseId" value={formData.courseId} onChange={handleChange} className="w-full px-3 py-2 border rounded" required>
                      <option value="">Chọn môn học</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
                      ))}
                    </select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block font-medium">Số lần thi lại tối đa</label>
                    <input type="number" name="maxRetake" value={formData.maxRetake ?? 1} onChange={handleChange} placeholder="Số lần thi lại tối đa" className="w-full px-3 py-2 border rounded" min={0} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-medium">Thời gian mở đề thi</label>
                    <input
                      type="datetime-local"
                      name="openTime"
                      value={formData.openTime ? formData.openTime.slice(0, 16) : ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-medium">Thời gian đóng đề thi</label>
                    <input
                      type="datetime-local"
                      name="closeTime"
                      value={formData.closeTime ? formData.closeTime.slice(0, 16) : ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  </div>
                  <div className="flex flex-wrap gap-6 items-center mt-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="randomizeQuestions" checked={!!formData.randomizeQuestions} onChange={e => setFormData(f => ({ ...f, randomizeQuestions: e.target.checked }))} />
                      Random câu hỏi
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="enableAntiCheat" checked={!!formData.enableAntiCheat} onChange={e => setFormData(f => ({ ...f, enableAntiCheat: e.target.checked }))} />
                      Chống gian lận
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="enableTabWarning" checked={!!formData.enableTabWarning} onChange={e => setFormData(f => ({ ...f, enableTabWarning: e.target.checked }))} />
                      Cảnh báo chuyển tab
                    </label>
                  </div>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="showAnswerAfterSubmit"
                      checked={!!formData.showAnswerAfterSubmit}
                      onChange={e => setFormData(f => ({ ...f, showAnswerAfterSubmit: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="showAnswerAfterSubmit">Hiển thị đáp án sau khi nộp bài</label>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button type="button" className="px-4 py-2 bg-sky-600 text-white rounded" onClick={() => setStep(2)} disabled={!formData.name || (!formData.courseId && !courseId)}>
                      Tiếp tục
                    </button>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="flex gap-2 mb-4">
                    <button type="button" className={`px-4 py-2 rounded font-semibold ${questionSource==='bank'?'bg-sky-600 text-white':'bg-slate-200'}`} onClick={()=>setQuestionSource('bank')}>Thêm từ ngân hàng đề</button>
                    <button type="button" className={`px-4 py-2 rounded font-semibold ${questionSource==='custom'?'bg-sky-600 text-white':'bg-slate-200'}`} onClick={()=>setQuestionSource('custom')}>Tạo câu hỏi mới</button>
                  </div>
                  {questionSource==='bank' && (
                    <>
                      <div className="mb-4">
                        <label className="block font-medium mb-1">Ngân hàng đề</label>
                        <select value={selectedBankId} onChange={e => {setSelectedBankId(e.target.value); setSelectedQuestions([]);}} className="w-full border rounded px-3 py-2">
                          <option value="">Chọn ngân hàng đề</option>
                          {questionBanks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      {selectedBankId && (
                        <>
                          <div className="flex gap-2 mb-2">
                            <button type="button" onClick={()=>setBankTab('auto')} className={bankTab==='auto'?'bg-sky-600 text-white px-3 py-1 rounded':'bg-slate-200 px-3 py-1 rounded'}>Chọn tự động</button>
                            <button type="button" onClick={()=>setBankTab('manual')} className={bankTab==='manual'?'bg-sky-600 text-white px-3 py-1 rounded':'bg-slate-200 px-3 py-1 rounded'}>Chọn thủ công</button>
                          </div>
                          {bankTab==='auto' && (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <label className="block font-medium">Số câu dễ</label>
                                  <input type="number" min={0} value={autoEasy} onChange={e=>setAutoEasy(+e.target.value)} className="w-full px-3 py-2 border rounded" />
                                </div>
                                <div>
                                  <label className="block font-medium">Số câu trung bình</label>
                                  <input type="number" min={0} value={autoMedium} onChange={e=>setAutoMedium(+e.target.value)} className="w-full px-3 py-2 border rounded" />
                                </div>
                                <div>
                                  <label className="block font-medium">Số câu khó</label>
                                  <input type="number" min={0} value={autoHard} onChange={e=>setAutoHard(+e.target.value)} className="w-full px-3 py-2 border rounded" />
                                </div>
                              </div>
                              <button type="button" className="px-4 py-2 bg-green-600 text-white rounded" onClick={()=>{
                                const qs = questions.filter(q=>q.questionBankId===selectedBankId);
                                const easy = qs.filter(q=>q.level==='easy');
                                const medium = qs.filter(q=>q.level==='medium');
                                const hard = qs.filter(q=>q.level==='hard');
                                const getRandom = (arr: any[], n: number) => arr.sort(()=>Math.random()-0.5).slice(0, n);
                                const selected = [
                                  ...getRandom(easy, autoEasy),
                                  ...getRandom(medium, autoMedium),
                                  ...getRandom(hard, autoHard)
                                ];
                                setSelectedQuestions(selected);
                              }}>Chọn câu hỏi ngẫu nhiên</button>
                              <button type="button" className="ml-2 px-4 py-2 bg-blue-600 text-white rounded" onClick={()=>setShowViewQuestions(true)}>Xem câu hỏi</button>
                    </>
                  )}
                          {bankTab==='manual' && (
                            <>
                              <div className="mt-2">Tổng số câu đã thêm: {selectedQuestions.length}</div>
                              <ul className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                                {questions.filter(q=>q.questionBankId===selectedBankId).map((q, idx) => (
                                  <li key={q.id || idx} className="border rounded p-3 bg-slate-50 flex items-center gap-2">
                                    <input type="checkbox" checked={selectedQuestions.some(x=>x.id===q.id)} onChange={()=>{
                                      if(selectedQuestions.some(x=>x.id===q.id)) setSelectedQuestions(selectedQuestions.filter(x=>x.id!==q.id));
                                      else setSelectedQuestions([...selectedQuestions, q]);
                                    }} />
                                    <span className="font-semibold">{q.content} <span className="ml-2 text-xs text-slate-500">({q.level})</span></span>
                                  </li>
                                ))}
                              </ul>
                              <button type="button" className="mt-2 px-4 py-2 bg-green-600 text-white rounded" onClick={()=>setSelectedQuestions([...selectedQuestions])} disabled={selectedQuestions.length===0}>Lưu câu hỏi đã chọn</button>
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                  {questionSource==='custom' && (
                    <>
                      <div className="flex gap-2 mb-2">
                        <button type="button" className="px-3 py-1 bg-green-600 text-white rounded" onClick={()=>{
                          setEditingQuestion({ content: '', type: 'truefalse', level: 'easy', options: defaultOptions['truefalse'] });
                          setAddingQuestion(true);
                        }}>Tạo câu hỏi mới</button>
                        <button type="button" className="px-3 py-1 bg-blue-600 text-white rounded" onClick={()=>setShowImportExcel({open: true, bankId: null})}>Import Excel</button>
                      </div>
                      <div className="mt-2">Tổng số câu đã thêm: {selectedQuestions.length}</div>
                      <ul className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                        {selectedQuestions.map((q, idx) => (
                          <li key={q.id || idx} className="border rounded p-3 flex flex-col gap-1">
                              <span className="font-semibold">{idx+1}. {q.content} <span className="ml-2 text-xs text-slate-500">({q.level})</span></span>
                              </li>
                            ))}
                      </ul>
                    </>
                  )}
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Danh sách câu hỏi đã chọn:</h4>
                    <ul className="space-y-1 max-h-40 overflow-y-auto">
                      {selectedQuestions.map((q, idx) => (
                        <li key={q.id || idx} className="flex items-center gap-2">
                          <span>{idx+1}. {q.content} <span className="text-xs text-slate-500">({q.level})</span></span>
                          <button
                            className="ml-2 px-2 py-1 bg-red-500 text-white rounded"
                            type="button"
                            onClick={() => setSelectedQuestions(selectedQuestions.filter(x => x.id !== q.id))}
                          >Xóa</button>
                          </li>
                        ))}
                      </ul>
                  </div>
                  {showViewQuestions && (
                        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
                        <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 text-2xl font-bold" onClick={()=>setShowViewQuestions(false)}>&times;</button>
                        <h2 className="text-xl font-bold mb-4">Danh sách câu hỏi đã chọn</h2>
                        <ul className="space-y-4 max-h-96 overflow-y-auto">
                          {selectedQuestions.map((q, idx) => (
                            <li key={q.id || idx} className="border rounded p-3 bg-slate-50">
                              <div className="font-semibold mb-1">{idx+1}. {q.content}</div>
                              <div className="text-xs text-slate-500">
                                Loại: {getTypeLabel(q.type)} | Độ khó: {q.level}
                              </div>
                              {q.options && (
                                <ul className="pl-4">
                                  {q.options.map((opt: any, i: number) => (
                                    <li key={i} className={opt.correct ? 'font-bold text-green-600' : ''}>
                                      {String.fromCharCode(65+i)}. {opt.text} {opt.correct ? '(Đúng)' : ''}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                          </div>
                        </div>
                  )}
                  <div className="flex justify-end gap-2 mt-4">
                    <button type="button" className="px-4 py-2 bg-slate-200 rounded" onClick={()=>setStep(1)}>Quay lại</button>
                    <button type="button" className="px-4 py-2 bg-sky-600 text-white rounded" onClick={()=>setStep(3)} disabled={selectedQuestions.length===0}>Tiếp tục</button>
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <div className="flex gap-2 mb-2">
                    <button type="button" onClick={()=>setScoreMode('total')} className={scoreMode==='total'?'bg-sky-600 text-white px-3 py-1 rounded':'bg-slate-200 px-3 py-1 rounded'}>Tổng điểm</button>
                    <button type="button" onClick={()=>setScoreMode('per-question')} className={scoreMode==='per-question'?'bg-sky-600 text-white px-3 py-1 rounded':'bg-slate-200 px-3 py-1 rounded'}>Điểm từng câu</button>
                  </div>
                  {scoreMode==='total' ? (
                    <input type="number" value={totalScore} onChange={e=>setTotalScore(+e.target.value)} placeholder="Tổng điểm bài thi" className="border rounded px-2" />
                  ) : (
                    <ul className="max-h-48 overflow-y-auto border rounded p-2">
                      {selectedQuestions.map(q=>(
                        <li key={q.id} className="flex items-center gap-2">
                          <span>{q.content} ({q.level})</span>
                          <input type="number" value={questionScores[q.id?.toString()||'']||1} min={1} onChange={e=>setQuestionScores(s=>({...s,[q.id?.toString()||'']: +e.target.value}))} className="border rounded px-2 w-16" />
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex justify-end gap-2 mt-4">
                    <button type="button" className="px-4 py-2 bg-slate-200 rounded" onClick={()=>setStep(2)}>Quay lại</button>
                    <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700">Lưu bài thi</button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
              onClick={() => setShowEdit(false)}
              aria-label="Đóng"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4">Chỉnh sửa bài thi</h2>
            {loadError ? (
              <div className="text-red-500 mb-4">{loadError}</div>
            ) : null}
            <form onSubmit={handleEdit} className="space-y-4">
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Tên bài thi" className="w-full px-3 py-2 border rounded" required disabled={!!loadError} />
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả" className="w-full px-3 py-2 border rounded" disabled={!!loadError} />
              <input type="number" name="duration" value={formData.duration} onChange={handleChange} placeholder="Thời gian (phút)" className="w-full px-3 py-2 border rounded" min={1} disabled={!!loadError} />
              {courses.length > 0 ? (
                <select name="courseId" value={formData.courseId} onChange={handleChange} className="w-full px-3 py-2 border rounded" required disabled={!!loadError}>
                  <option value="">Chọn môn học</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
                  ))}
                </select>
              ) : (
                <div className="text-slate-500">Không có môn học nào để chọn.</div>
              )}
              <input type="number" name="maxRetake" value={formData.maxRetake ?? 1} onChange={handleChange} placeholder="Số lần thi lại tối đa" className="w-full px-3 py-2 border rounded" min={0} />
              <div className="space-y-2">
                <label className="block font-medium">Thời gian mở đề thi</label>
                <input
                  type="datetime-local"
                  name="openTime"
                  value={formData.openTime ? formData.openTime.slice(0, 16) : ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="space-y-2">
                <label className="block font-medium">Thời gian đóng đề thi</label>
                <input
                  type="datetime-local"
                  name="closeTime"
                  value={formData.closeTime ? formData.closeTime.slice(0, 16) : ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="flex gap-4 items-center mt-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="randomizeQuestions" checked={!!formData.randomizeQuestions} onChange={e => setFormData(f => ({ ...f, randomizeQuestions: e.target.checked }))} />
                  Random câu hỏi
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="enableAntiCheat" checked={!!formData.enableAntiCheat} onChange={e => setFormData(f => ({ ...f, enableAntiCheat: e.target.checked }))} />
                  Chống gian lận
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="enableTabWarning" checked={!!formData.enableTabWarning} onChange={e => setFormData(f => ({ ...f, enableTabWarning: e.target.checked }))} />
                  Cảnh báo chuyển tab
                </label>
              </div>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="showAnswerAfterSubmit"
                  checked={!!formData.showAnswerAfterSubmit}
                  onChange={e => setFormData(f => ({ ...f, showAnswerAfterSubmit: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="showAnswerAfterSubmit">Hiển thị đáp án sau khi nộp bài</label>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 bg-slate-200 rounded" onClick={() => setShowEdit(false)}>Hủy</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700" disabled={!!loadError || courses.length === 0}>Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showView.open && showView.part && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="relative bg-white border border-slate-200 shadow-2xl rounded-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
              onClick={() => setShowView({open: false, part: null})}
              aria-label="Đóng"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4">Chi tiết bài thi: {showView.part.name}</h2>
            <div className="mb-4 text-slate-600">
              <div><b>Tổng điểm:</b> {showView.part.score}</div>
              <div><b>Thời gian làm bài:</b> {showView.part.duration} phút</div>
              <div><b>Số lần thi lại tối đa:</b> {showView.part.maxRetake ?? 'Không giới hạn'}</div>
              <div><b>Random câu hỏi:</b> {showView.part.randomizeQuestions ? 'Có' : 'Không'}</div>
              <div><b>Chống gian lận:</b> {showView.part.enableAntiCheat ? 'Có' : 'Không'}</div>
              <div><b>Cảnh báo chuyển tab:</b> {showView.part.enableTabWarning ? 'Có' : 'Không'}</div>
              {(() => {
                const totalQuestions = (showView.part.questions || []).length;
                const easyCount = (showView.part.questions || []).filter(q => q.level === 'easy').length;
                const mediumCount = (showView.part.questions || []).filter(q => q.level === 'medium').length;
                const hardCount = (showView.part.questions || []).filter(q => q.level === 'hard').length;
                return (
                  <div className="mt-2 text-sm text-slate-700">
                    Tổng số câu hỏi: <b>{totalQuestions}</b> | Dễ: <b>{easyCount}</b> | Trung bình: <b>{mediumCount}</b> | Khó: <b>{hardCount}</b>
                  </div>
                );
              })()}
            </div>
            <div className="mb-4">
              <label className="font-semibold mr-2">Cơ chế tính điểm:</label>
              <select value={scoringMode} onChange={e => setScoringMode(e.target.value)} className="px-3 py-2 border rounded">
                {scoringModes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            {scoringMode === 'even' && (
              <div className="mb-2 text-green-700">Điểm mỗi câu hỏi sẽ được chia đều: {showView.part.questions && showView.part.questions.length > 0 && showView.part.score !== undefined ? (showView.part.score / showView.part.questions.length).toFixed(2) : 0} điểm/câu</div>
            )}
            {scoringMode === 'byDifficulty' && showView.part.score !== undefined && (
              <div className="mb-2 text-blue-700">
                Điểm sẽ chia theo độ khó (ví dụ: Dễ 1, Trung bình 1.5, Khó 2, chuẩn hóa tổng điểm thành {showView.part.score}).
              </div>
            )}
            {scoringMode === 'manual' && showView.part.score !== undefined && (
              <div className="mb-2 text-orange-700">Nhập điểm cho từng câu hỏi. Tổng điểm phải bằng {showView.part.score}.
                {scoreError && <div className="text-red-600 font-semibold">{scoreError}</div>}
              </div>
            )}
            <div className="flex gap-4 mb-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded font-semibold" type="button" onClick={()=>{ setEditingQuestion({ content: '', type: 'truefalse', level: 'easy', options: defaultOptions['truefalse'] }); setAddingQuestion(true); }}>
                + Thêm thủ công
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded font-semibold" type="button" onClick={async () => {
                if (!showView.part) return;
                setSelectedBankId('');
                setBankQuestions([]);
                setSelectedBankQuestions([]);
                const banks = await fetchQuestionBanks('', showView.part.courseId);
                setQuestionBanks(banks);
                setShowBankModal(true);
              }}>
                + Thêm từ ngân hàng đề
              </button>
            </div>
            <ul className="space-y-4 max-h-[60vh] overflow-y-auto">
              {(showView.part.questions||[]).map((q: any, idx: number) => (
                <li key={q.id || `question-${idx}`} className="border rounded p-3 flex flex-col gap-1 bg-slate-50">
                  <div className="font-semibold">{idx + 1}. {q.content}</div>
                  <div className="text-xs text-slate-500">
                    Loại: {getTypeLabel(q.type)} | Độ khó: {q.level}
                  </div>
                  {scoringMode === 'manual' && (
                    <div className="mt-1">
                      <input type="number" min={0} step={0.1} value={manualScores[q.id] ?? q.score ?? ''} onChange={e => {
                        const val = parseFloat(e.target.value);
                        setManualScores((s:any) => ({ ...s, [q.id]: isNaN(val) ? '' : val }));
                      }} className="w-24 px-2 py-1 border rounded" placeholder="Điểm" />
                      <span className="ml-2 text-xs text-slate-500">điểm</span>
                    </div>
                  )}
                  {q.options && (
                    <ul className="pl-4 text-sm">
                      {q.options.map((opt: any, i: number) => (
                        <li key={i} className={opt.correct ? 'text-green-600 font-bold' : ''}>
                          {q.type !== 'truefalse' ? String.fromCharCode(65 + i) + '. ' : ''}{opt.text} {opt.correct ? '(Đúng)' : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                  {q.answer && !q.options && (
                    <div className="pl-4 text-green-700 font-bold">Đáp án: {q.answer}</div>
                  )}
                  <div className="flex gap-2 self-end mt-2">
                    <button className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600" onClick={()=>setEditingQuestion(q)}>Sửa</button>
                    <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600" onClick={()=>handleDeleteQuestion(q.id)}>Xóa</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-4 py-2 bg-green-600 text-white rounded font-bold" type="button" onClick={async () => {
                if (!showView.part || !showView.part.questions || showView.part.score === undefined) return;
                const newQuestions = calculateScores(showView.part.questions, showView.part.score, scoringMode, manualScores);
                await updatePart(String(showView.part.id), { ...showView.part, scoringMode, questions: newQuestions });
                setShowView({ ...showView, part: { ...showView.part, questions: newQuestions, scoringMode } });
                alert('Lưu đề thi thành công!');
              }}>
                Lưu đề thi
              </button>
            </div>
            {showBankModal && showView.open && showView.part && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
                    onClick={() => setShowBankModal(false)}
                    aria-label="Đóng"
                  >
                    ×
                  </button>
                  <h3 className="text-xl font-bold mb-4">Chọn ngân hàng đề</h3>
                  <select value={selectedBankId} onChange={e => setSelectedBankId(e.target.value)} className="w-full border rounded mb-4">
                    <option value="">Chọn ngân hàng đề</option>
                    {questionBanks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <div className="flex justify-end gap-2">
                    <button type="button" className="px-4 py-2 bg-slate-200 rounded" onClick={()=>setShowBankModal(false)}>Hủy</button>
                    <button type="button" className="px-4 py-2 bg-sky-600 text-white rounded" onClick={async()=>{
                      if (!selectedBankId) { alert('Vui lòng chọn ngân hàng đề!'); return; }
                      await fetchQuestions(selectedBankId).then(setBankQuestions);
                      setShowBankModal(false);
                      setShowSelectQuestionModal(true);
                    }}>Tiếp tục</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showSelectQuestionModal && showView.open && showView.part && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
              onClick={() => setShowSelectQuestionModal(false)}
              aria-label="Đóng"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4">Chọn câu hỏi cho đề thi</h2>
            <ul className="space-y-4">
              {bankQuestions.map((q, idx) => (
                <li key={q.id} className="border rounded p-3 bg-slate-50 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedBankQuestions.includes(String(q.id))} onChange={()=>{
                      const idStr = String(q.id);
                      setSelectedBankQuestions(sel => sel.includes(idStr) ? sel.filter(id => id !== idStr) : [...sel, idStr]);
                    }} />
                    <span className="font-semibold">{idx+1}. {q.content} <span className="ml-2 text-xs text-slate-500">({q.level})</span></span>
                  </div>
                  {q.options && (
                    <ul className="pl-4 text-sm">
                      {q.options.map((opt: any, i: number) => (
                        <li key={i} className={opt.correct ? 'text-green-600 font-bold' : ''}>
                          {q.type !== 'truefalse' ? String.fromCharCode(65 + i) + '. ' : ''}{opt.text} {opt.correct ? '(Đúng)' : ''}
                    </li>
                  ))}
                    </ul>
                  )}
                  {q.answer && !q.options && (
                    <div className="pl-4 text-green-700 font-bold">Đáp án: {q.answer}</div>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" className="px-4 py-2 bg-slate-200 rounded" onClick={()=>setShowSelectQuestionModal(false)}>Hủy</button>
              <button type="button" className="px-4 py-2 bg-sky-600 text-white rounded" onClick={async()=>{
                if (!showView.part) return;
                const toAdd = bankQuestions.filter(q => selectedBankQuestions.includes(String(q.id)));
                const newQuestions = [...(showView.part.questions || []), ...toAdd];
                await updatePart(String(showView.part.id), { ...showView.part, questions: newQuestions });
                setShowView({ open: true, part: { ...showView.part, questions: newQuestions } });
                setShowSelectQuestionModal(false);
              }}>Thêm vào đề</button>
            </div>
                    </div>
        </div>
      )}

      {(addingQuestion || (editingQuestion && !addingQuestion)) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100]">
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
              onClick={() => { setAddingQuestion(false); setEditingQuestion(null); }}
              aria-label="Đóng"
            >×</button>
            <h3 className="text-2xl font-bold mb-6 text-center">
              {addingQuestion ? 'Thêm câu hỏi thủ công' : 'Chỉnh sửa câu hỏi trong bài thi'}
            </h3>
            <QuestionForm
              bankId={''}
              question={editingQuestion}
              isCustomQuestion={true}
              onSuccess={addingQuestion ? handleAddNewQuestion : handleSaveEditQuestion}
              onClose={() => { setAddingQuestion(false); setEditingQuestion(null); }}
            />
              </div>
              </div>
      )}

      {questionSource === 'custom' && showImportExcel.open && (
        <ImportQuestionExcel
          bankId={showImportExcel.bankId || ''}
          onSuccess={(questionsFromExcel: any) => handleImportExcel(questionsFromExcel)}
          onClose={() => setShowImportExcel({open: false, bankId: null})}
        />
      )}
    </div>
  );
};

export default ManagePart; 
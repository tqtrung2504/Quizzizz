import React, { useEffect, useState } from 'react';
import { fetchTests, createTest, updateTest, deleteTest, Test, getTestById } from './TestApi';
import { fetchQuestionBanks, QuestionBank } from '../manage-question/QuestionBankApi';
import { fetchQuestions, Question } from '../manage-question/QuestionApi';
import { fetchCourses, Course } from '../manage-course/courseApi';
import { useAuthRole } from '../../App';
import QuestionForm from '../manage-question/QuestionForm';

const emptyTest: Omit<Test, 'id'> = {
  name: '',
  description: '',
  duration: 60,
  courseId: '',
  score: 10,
  questionBankId: '',
  questions: [],
};

const PAGE_SIZE = 10;

interface ManageTestsProps {
  courseId?: string;
}

const ManageTests: React.FC<ManageTestsProps> = ({ courseId }) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Omit<Test, 'id'>>(emptyTest);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filterCourse, setFilterCourse] = useState('');
  const [showDetail, setShowDetail] = useState<{ open: boolean; test?: Test }>({ open: false });
  const [showPreview, setShowPreview] = useState<{ open: boolean; test?: Test }>({ open: false });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { role } = useAuthRole ? useAuthRole() : { role: 'admin' };
  const [showAddManual, setShowAddManual] = useState<{open: boolean, testId?: string}>({open: false});

  useEffect(() => {
    loadData();
    loadBanks();
    loadCourses();
  }, [courseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchTests();
      setTests(courseId ? data.filter(t => t.courseId === courseId) : data);
    } finally {
      setLoading(false);
    }
  };

  const loadBanks = async () => {
    const banks = await fetchQuestionBanks();
    setQuestionBanks(banks);
  };

  const loadCourses = async () => {
    const data = await fetchCourses();
    setCourses(data);
  };

  const handleOpenCreate = () => {
    setFormData(emptyTest);
    setEditId(undefined);
    setQuestions([]);
    setSelectedQuestions([]);
    setShowForm(true);
  };

  const handleOpenEdit = async (test: Test) => {
    setFormData({
      name: test.name,
      description: test.description,
      duration: test.duration,
      courseId: test.courseId,
      score: test.score,
      questionBankId: test.questionBankId || '',
      questions: test.questions || [],
    });
    setEditId(test.id);
    if (test.questionBankId) {
      const qs = await fetchQuestions(test.questionBankId);
      setQuestions(qs);
      setSelectedQuestions((test.questions || []).map((q: any) => q.id));
    } else {
      setQuestions([]);
      setSelectedQuestions([]);
    }
    setShowForm(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    const test = tests.find(t => t.id === id);
    const questionNames = (test?.questions || []).map((q: any) => q.content).join(', ');
    let confirmMsg = `Xóa đề thi này sẽ xóa toàn bộ dữ liệu đề thi.\n`;
    if (test?.questions?.length) {
      confirmMsg += `Các câu hỏi trong đề thi: ${questionNames}\n`;
    }
    confirmMsg += 'Bạn có chắc chắn không?';
    if (!window.confirm(confirmMsg)) return;
    try {
      await deleteTest(id);
      await loadData();
    } catch (err: any) {
      alert('Lỗi khi xóa đề thi: ' + (err?.message || err));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'score' ? parseInt(value) || 0 : value,
    }));
    if (name === 'questionBankId') {
      if (value) {
        fetchQuestions(value).then(qs => setQuestions(qs));
        setSelectedQuestions([]);
      } else {
        setQuestions([]);
        setSelectedQuestions([]);
      }
    }
  };

  const handleQuestionSelect = (id: string) => {
    setSelectedQuestions(prev => prev.includes(id) ? prev.filter(qid => qid !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.duration || !formData.score) {
      alert('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    const selectedQs = questions.filter(q => selectedQuestions.includes(q.id!));
    const submitData = { ...formData, questions: selectedQs };
    if (editId) {
      await updateTest(editId, submitData);
    } else {
      await createTest(submitData);
    }
    setShowForm(false);
    await loadData();
  };

  // Tìm kiếm nâng cao
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Lọc, tìm kiếm, phân trang
  let filteredTests = filterCourse ? tests.filter(t => t.courseId && t.courseId === filterCourse) : tests;
  if (search.trim()) {
    const keyword = search.trim().toLowerCase();
    filteredTests = filteredTests.filter(t =>
      t.name.toLowerCase().includes(keyword) ||
      t.description?.toLowerCase().includes(keyword) ||
      (t.courseId && courses.find(c => c.id === t.courseId)?.name.toLowerCase().includes(keyword))
    );
  }
  const totalPages = Math.ceil(filteredTests.length / PAGE_SIZE) || 1;
  const pagedTests = filteredTests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Thống kê số lượng đề theo môn
  const statsByCourse = courses.map(c => ({
    course: c,
    count: tests.filter(t => t.courseId && t.courseId === c.id).length
  }));

  // Xuất file CSV
  const handleExport = () => {
    const rows = [
      ['Tên đề thi', 'Môn học', 'Thời gian', 'Tổng điểm', 'Số câu hỏi'],
      ...filteredTests.map(t => [
        t.name,
        courses.find(c => c.id === t.courseId)?.name || '',
        t.duration,
        t.score,
        t.questions?.length || 0
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'danh_sach_de_thi.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Nhập file CSV (placeholder, cần backend hỗ trợ)
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    alert('Chức năng nhập file cần backend hỗ trợ.');
  };

  // Xem chi tiết đề thi
  const handleShowDetail = async (test: Test) => {
    const detail = await getTestById(test.id!);
    setShowDetail({ open: true, test: detail });
  };

  // Xem trước đề thi (hiển thị danh sách câu hỏi)
  const handleShowPreview = async (test: Test) => {
    const detail = await getTestById(test.id!);
    setShowPreview({ open: true, test: detail });
  };

  // Hàm thêm câu hỏi thủ công vào bài thi
  const handleAddManualQuestion = async (test: Test, questionData: any) => {
    // Lấy danh sách câu hỏi hiện tại + câu hỏi mới
    const questions = [...(test.questions || []), questionData];
    // Tính lại điểm cho từng câu hỏi (chia đều tổng điểm)
    const totalScore = test.score || 10;
    const perQuestionScore = +(totalScore / questions.length).toFixed(2);
    questions.forEach(q => q.score = perQuestionScore);
    await updateTest(test.id!, { questions });
    // Đóng modal và reload lại chi tiết
    setShowAddManual({open: false});
    const detail = await getTestById(test.id!);
    setShowDetail({ open: true, test: detail });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Quản lý đề thi</h1>
      {/* Thống kê số lượng đề theo môn */}
      <div className="mb-4 flex flex-wrap gap-4">
        {statsByCourse.map(stat => (
          <div key={stat.course.id} className="bg-slate-100 rounded px-4 py-2 text-sm">
            <span className="font-semibold">{stat.course.name}:</span> {stat.count} đề
          </div>
        ))}
      </div>
      <div className="flex gap-4 mb-4 items-center">
        {role === 'admin' && (
          <button className="px-4 py-2 bg-sky-600 text-white rounded" onClick={handleOpenCreate}>+ Thêm đề thi</button>
        )}
        <select className="border rounded px-3 py-2" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
          <option value="">-- Lọc theo môn học --</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="text" className="border rounded px-3 py-2" placeholder="Tìm kiếm đề thi..." value={search} onChange={handleSearchChange} />
        <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleExport}>Xuất CSV</button>
        <label className="px-4 py-2 bg-yellow-500 text-white rounded cursor-pointer">
          Nhập CSV
          <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
        </label>
      </div>
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <>
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-slate-100">
              <th>Tên đề thi</th>
              <th>Mô tả</th>
              <th>Thời gian (phút)</th>
              <th>Môn học</th>
              <th>Ngân hàng câu hỏi</th>
              <th>Số câu hỏi</th>
              <th>Điểm</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {pagedTests.map(test => (
              <tr key={test.id}>
                <td>{test.name}</td>
                <td>{test.description}</td>
                <td>{test.duration}</td>
                <td>{courses.find(c => c.id === test.courseId)?.name || '-'}</td>
                <td>{questionBanks.find(b => b.id === test.questionBankId)?.name || '-'}</td>
                <td>{test.questions?.length || 0}</td>
                <td>{test.score}</td>
                <td>
                  <button className="px-2 py-1 bg-sky-500 text-white rounded mr-2" onClick={() => handleShowDetail(test)}>Chi tiết</button>
                  <button className="px-2 py-1 bg-green-500 text-white rounded mr-2" onClick={() => handleShowPreview(test)}>Xem trước</button>
                  {role === 'admin' && <>
                    <button className="px-2 py-1 bg-yellow-500 text-white rounded mr-2" onClick={() => handleOpenEdit(test)}>Sửa</button>
                    <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={() => handleDelete(test.id)}>Xóa</button>
                  </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Phân trang */}
        <div className="flex justify-center mt-4 gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">&lt;</button>
          <span className="px-3 py-1">{page}/{totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50">&gt;</button>
        </div>
        </>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl relative p-4 sm:p-8">
            <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 text-2xl" onClick={() => setShowForm(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">{editId ? 'Chỉnh sửa đề thi' : 'Thêm đề thi'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <input type="text" name="name" className="w-full border rounded px-3 py-2" placeholder="Tên đề thi" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="sm:col-span-2">
                <textarea name="description" className="w-full border rounded px-3 py-2" placeholder="Mô tả" value={formData.description} onChange={handleChange} />
              </div>
              <div>
                <input type="number" name="duration" className="w-full border rounded px-3 py-2" placeholder="Thời gian (phút)" value={formData.duration} onChange={handleChange} min={1} required />
              </div>
              <div>
                <input type="number" name="score" className="w-full border rounded px-3 py-2" placeholder="Tổng điểm" value={formData.score} onChange={handleChange} min={1} required />
              </div>
              <div className="sm:col-span-2">
                <select name="courseId" className="w-full border rounded px-3 py-2" value={formData.courseId} onChange={handleChange} required>
                  <option value="">-- Chọn môn học --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <select name="questionBankId" className="w-full border rounded px-3 py-2" value={formData.questionBankId} onChange={handleChange} required>
                  <option value="">-- Chọn ngân hàng câu hỏi --</option>
                  {questionBanks.map(bank => (
                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                  ))}
                </select>
              </div>
              {questions.length > 0 && (
                <div className="sm:col-span-2">
                  <div className="font-semibold mb-2">Chọn câu hỏi cho đề thi:</div>
                  <div className="max-h-40 overflow-y-auto border rounded p-2 bg-slate-50 grid grid-cols-1 gap-1">
                    {questions.map(q => (
                      <label key={q.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(q.id!)}
                          onChange={() => handleQuestionSelect(q.id!)}
                        />
                        <span className="text-sm">{q.content}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-2 mt-2">
                <button type="button" className="px-4 py-2 bg-slate-200 rounded w-full sm:w-auto" onClick={() => setShowForm(false)}>Hủy</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 w-full sm:w-auto">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal xem chi tiết đề thi */}
      {showDetail.open && showDetail.test && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl relative">
            <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-700" onClick={() => setShowDetail({ open: false })}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Chi tiết đề thi: {showDetail.test.name}</h2>
            <div className="mb-2">Môn học: {courses.find(c => c.id === showDetail.test!.courseId)?.name || '-'}</div>
            <div className="mb-2">Ngân hàng câu hỏi: {questionBanks.find(b => b.id === showDetail.test!.questionBankId)?.name || '-'}</div>
            <div className="mb-2">Thời gian: {showDetail.test.duration} phút</div>
            <div className="mb-2">Tổng điểm: {showDetail.test.score}</div>
            <div className="mb-2">Mô tả: {showDetail.test.description}</div>
            {/* Thống kê số lượng câu hỏi và độ khó */}
            {(() => {
              const totalQuestions = (showDetail.test.questions || []).length;
              const easyCount = (showDetail.test.questions || []).filter(q => q.level === 'easy').length;
              const mediumCount = (showDetail.test.questions || []).filter(q => q.level === 'medium').length;
              const hardCount = (showDetail.test.questions || []).filter(q => q.level === 'hard').length;
              return (
                <div className="mb-2 text-sm text-slate-700">
                  Tổng số câu hỏi: <b>{totalQuestions}</b> | Dễ: <b>{easyCount}</b> | Trung bình: <b>{mediumCount}</b> | Khó: <b>{hardCount}</b>
                </div>
              );
            })()}
            <div className="flex gap-2 mb-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={()=>setShowAddManual({open:true, testId:showDetail.test!.id})}>+ Thêm thủ công</button>
            </div>
            <div className="font-semibold mt-4 mb-2">Danh sách câu hỏi:</div>
            <ul className="list-decimal ml-6">
              {showDetail.test.questions?.map((q: any, idx: number) => (
                <li key={q.id || idx}>{q.content}</li>
              ))}
            </ul>
          </div>
          {/* Modal thêm thủ công */}
          {showAddManual.open && (
            <QuestionForm
              bankId={showDetail.test!.questionBankId || ''}
              onSuccess={async (newQuestion: any) => {
                await handleAddManualQuestion(showDetail.test!, newQuestion);
              }}
              onClose={()=>setShowAddManual({open:false})}
            />
          )}
        </div>
      )}
      {/* Modal xem trước đề thi */}
      {showPreview.open && showPreview.test && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-xl relative">
            <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-700" onClick={() => setShowPreview({ open: false })}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Xem trước đề thi: {showPreview.test.name}</h2>
            <div className="mb-2">Thời gian: {showPreview.test.duration} phút</div>
            <div className="mb-2">Tổng điểm: {showPreview.test.score}</div>
            <div className="font-semibold mt-4 mb-2">Danh sách câu hỏi:</div>
            <ol className="list-decimal ml-6">
              {showPreview.test.questions?.map((q: any, idx: number) => (
                <li key={q.id || idx} className="mb-2">
                  <div className="font-semibold">Câu {idx + 1}: {q.content}</div>
                  {q.options && q.options.length > 0 && (
                    <ul className="list-disc ml-6">
                      {q.options.map((opt: any, i: number) => (
                        <li key={i}>{opt.text}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTests; 
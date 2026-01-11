import React, { useEffect, useState } from 'react';
import { fetchQuestionBanks, createQuestionBank, deleteQuestionBank, QuestionBank } from './QuestionBankApi';
import { fetchCourses, Course } from '../manage-course/courseApi';
import { fetchParts, Part } from '../manage-part/PartApi';
import QuestionForm from './QuestionForm';
import ImportQuestionExcel from './ImportQuestionExcel';
import QuestionList from './QuestionList';
import { fetchQuestions } from './QuestionApi';

const emptyBank: Omit<QuestionBank, 'id'|'totalQuestions'|'easyCount'|'mediumCount'|'hardCount'> = {
  name: '',
  courseId: '',
  courseName: '',
  description: ''
};

interface ManageQuestionProps {
  courseId?: string;
}

const ManageQuestion: React.FC<ManageQuestionProps> = ({ courseId }) => {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState(emptyBank);
  const [search, setSearch] = useState('');
  const [searchCourse, setSearchCourse] = useState(courseId || '');
  const [showQuestionForm, setShowQuestionForm] = useState<{ open: boolean; bankId: string | null }>({ open: false, bankId: null });
  const [showImportExcel, setShowImportExcel] = useState<{ open: boolean; bankId: string | null }>({ open: false, bankId: null });
  const [showQuestionList, setShowQuestionList] = useState<{ open: boolean; bankId: string | null }>({ open: false, bankId: null });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bankData, courseData] = await Promise.all([
        fetchQuestionBanks(search, courseId),
        fetchCourses()
      ]);
      setBanks(bankData);
      setCourses(courseData);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
      alert('Lỗi khi tải dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) setSearchCourse(courseId);
    loadData();
    fetchParts().then(setParts);
    // eslint-disable-next-line
  }, [search, searchCourse, courseId]);

  const handleOpenCreate = () => {
    setFormData(courseId ? { ...emptyBank, courseId } : emptyBank);
    setShowCreate(true);
    setErrorMsg(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Nếu chọn courseId thì tự động set courseName
    if (name === 'courseId') {
      console.log('Đang chọn courseId:', value);
      const selectedCourse = courses.find(c => c.id === value);
      if (selectedCourse) {
        console.log('Tìm thấy course:', selectedCourse.name);
        setFormData(prev => ({ 
          ...prev, 
          courseId: value,
          courseName: selectedCourse.name 
        }));
      } else {
        console.log('Không tìm thấy course với id:', value);
        setFormData(prev => ({ 
          ...prev, 
          courseId: value,
          courseName: '' 
        }));
      }
    }
    
    // Xóa lỗi khi user thay đổi input
    setErrorMsg(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (!formData.name || !formData.courseId) {
      setErrorMsg('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    
    // Kiểm tra trùng tên ngân hàng đề
    const existingBank = banks.find(bank => 
      bank.name.toLowerCase().trim() === formData.name.toLowerCase().trim() &&
      bank.courseId === formData.courseId
    );
    
    if (existingBank) {
      console.log('Phát hiện trùng tên ngân hàng đề:', {
        existingBank: existingBank.name,
        newBank: formData.name,
        courseId: formData.courseId
      });
      setErrorMsg(`Đã tồn tại ngân hàng đề "${formData.name}" cho môn học này. Vui lòng chọn tên khác!`);
      return;
    }
    
    try {
      console.log('Đang tạo ngân hàng đề:', {
        name: formData.name,
        courseId: formData.courseId,
        courseName: formData.courseName,
        description: formData.description
      });
      
      await createQuestionBank(formData);
      console.log('Tạo ngân hàng đề thành công');
      setShowCreate(false);
      await loadData();
    } catch (err) {
      console.error('Lỗi khi tạo ngân hàng đề:', err);
      setErrorMsg('Lỗi khi tạo ngân hàng đề! Vui lòng thử lại.');
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    // Lấy danh sách câu hỏi liên quan
    const questions = await fetchQuestions(id);
    const questionNames = questions.map(q => q.content).join(', ');
    let confirmMsg = `Xóa ngân hàng đề này sẽ xóa toàn bộ câu hỏi liên quan (không xóa đề thi).\n`;
    if (questions.length > 0) {
      confirmMsg += `Các câu hỏi liên quan: ${questionNames}\n`;
    }
    confirmMsg += 'Bạn có chắc chắn không?';
    if (!window.confirm(confirmMsg)) return;
    try {
      await deleteQuestionBank(id);
      await loadData();
    } catch (err: any) {
      alert('Lỗi khi xóa ngân hàng đề: ' + (err?.message || err));
    }
  };



  return (
    <div className="relative min-h-screen bg-slate-50 p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Quản lý ngân hàng đề</h1>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" /></svg>
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên ngân hàng đề..."
              className="pl-10 pr-3 py-2 border rounded-2xl w-full focus:ring-2 focus:ring-sky-300 transition"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {!courseId && (
            <select
              className="px-3 py-2 border rounded-2xl w-full sm:w-64"
              value={searchCourse}
              onChange={e => setSearchCourse(e.target.value)}
            >
              <option value="">Tất cả môn học</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
              ))}
            </select>
          )}
          <button
            className="px-4 py-2 bg-sky-600 text-white rounded-lg shadow hover:bg-sky-700 focus:outline-none text-base font-semibold"
            onClick={handleOpenCreate}
          >
            + Tạo ngân hàng đề
          </button>
        </div>
      </div>
      {loading ? (
        <div className="text-center text-slate-500">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8 mt-4 sm:mt-8">
          {banks.length === 0 ? (
            <div className="col-span-full flex flex-col items-center text-gray-400 mt-8 sm:mt-16">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 018 0v2m-4-4v4m0 0v4m0-4h4m-4 0H7" /></svg>
              <span className="text-lg">Chưa có ngân hàng đề nào</span>
            </div>
          ) : (
            banks.map(bank => (
              <div key={bank.id} className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col min-h-[180px] sm:min-h-[220px] transition-transform hover:scale-105 hover:shadow-2xl border border-slate-100 relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-100 text-green-600 rounded-full p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 7v7" /></svg>
                  </div>
                  <div>
                    <h2 className="font-bold text-xl mb-1">{bank.name}</h2>
                    <div className="text-gray-600 text-sm">Môn học: <span className="font-semibold">{bank.courseName}</span></div>
                    <div className="text-gray-600 text-sm">Mã môn học: <span className="font-semibold">{bank.courseId}</span></div>
                    <div className="text-gray-600 text-sm">Tổng số câu hỏi: <span className="font-semibold">{bank.totalQuestions ?? 0}</span></div>
                    <div className="text-gray-600 text-sm">Dễ: <span className="font-semibold">{bank.easyCount ?? 0}</span> | Trung bình: <span className="font-semibold">{bank.mediumCount ?? 0}</span> | Khó: <span className="font-semibold">{bank.hardCount ?? 0}</span></div>
                    <div className="text-slate-500 text-xs mt-2">{bank.description}</div>
                  </div>
                </div>
                <div className="flex gap-3 mt-auto pt-4 flex-wrap justify-center">
                  <button className="flex-1 min-w-[120px] flex items-center justify-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow transition text-base font-semibold" title="Thêm câu hỏi" onClick={() => setShowQuestionForm({ open: true, bankId: bank.id! })}>
                    Thêm câu hỏi
                  </button>
                  <button className="flex-1 min-w-[120px] flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow transition text-base font-semibold" title="Import Excel" onClick={() => setShowImportExcel({ open: true, bankId: bank.id! })}>
                    Import Excel
                  </button>
                  <button className="flex-1 min-w-[120px] flex items-center justify-center px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg shadow transition text-base font-semibold" title="Xem câu hỏi" onClick={() => setShowQuestionList({ open: true, bankId: bank.id! })}>
                    Xem câu hỏi
                  </button>
                  <button className="flex-1 min-w-[120px] flex items-center justify-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition text-base font-semibold" title="Xóa ngân hàng đề" onClick={() => handleDelete(bank.id)}>
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Tạo ngân hàng đề */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-700" onClick={() => setShowCreate(false)}>&times;</button>
            <h2 className="text-2xl font-bold mb-4">Tạo ngân hàng đề</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Tên ngân hàng đề" 
                className="w-full px-3 py-2 border rounded" 
                required 
              />
              {courseId ? (
                <div className="w-full px-3 py-2 border rounded bg-slate-100 text-slate-700">
                  {courses.find(c => c.id === courseId)?.name || 'Môn học hiện tại'}
                </div>
              ) : (
                <select 
                  name="courseId" 
                  value={formData.courseId} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border rounded" 
                  required
                >
                  <option value="">Chọn môn học</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
                  ))}
                </select>
              )}
              
              {/* Hiển thị tên môn học đã chọn */}
              {formData.courseName && (
                <div className="w-full px-3 py-2 border rounded bg-slate-50 text-slate-700">
                  <span className="text-sm text-slate-500">Môn học:</span> {formData.courseName}
                </div>
              )}
              
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Mô tả" 
                className="w-full px-3 py-2 border rounded" 
              />
              
              {/* Hiển thị lỗi */}
              {errorMsg && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded border border-red-200">
                  {errorMsg}
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 bg-slate-200 rounded" onClick={() => setShowCreate(false)}>Hủy</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700">Tạo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm câu hỏi */}
      {showQuestionForm.open && showQuestionForm.bankId && (
        <QuestionForm
          bankId={showQuestionForm.bankId}
          onSuccess={async () => {
            setShowQuestionForm({ open: false, bankId: null });
            await loadData();
          }}
          onClose={() => setShowQuestionForm({ open: false, bankId: null })}
        />
      )}

      {/* Modal Import Excel */}
      {showImportExcel.open && showImportExcel.bankId && (
        <ImportQuestionExcel
          bankId={showImportExcel.bankId}
          onSuccess={async () => {
            setShowImportExcel({ open: false, bankId: null });
            await loadData();
          }}
          onClose={() => setShowImportExcel({ open: false, bankId: null })}
        />
      )}

      {showQuestionList.open && showQuestionList.bankId && (
        <QuestionList
          bankId={showQuestionList.bankId}
          onClose={async () => {
            setShowQuestionList({ open: false, bankId: null });
            await loadData();
          }}
        />
      )}


    </div>
  );
};

export default ManageQuestion; 
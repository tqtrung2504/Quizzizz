import React, { useEffect, useState } from 'react';
import { fetchCourses, createCourse, updateCourse, deleteCourse, Course } from './courseApi';
import { fetchParts, deletePart, Part } from '../manage-part/PartApi';
import { fetchQuestionBanks, QuestionBank } from '../manage-question/QuestionBankApi';
import ManagePart from '../manage-part/ManagePart';
import { useNavigate } from 'react-router-dom';
import CourseStudentManager from "./course-student/CourseStudentManager";

const emptyCourse: Omit<Course, 'id'> = {
  name: '',
  code: '',
  description: '',
  credits: 0,
  department: ''
};

const ManageCourse: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [formData, setFormData] = useState<Omit<Course, 'id'>>(emptyCourse);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [showDetail, setShowDetail] = useState<{open: boolean, course: Course|null}>({open: false, course: null});
  const [activeTab, setActiveTab] = useState<'info'|'parts'|'students'>('info');
  const navigate = useNavigate();

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await fetchCourses();
      setCourses(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách môn học:', err);
      alert('Lỗi khi tải danh sách môn học!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    fetchQuestionBanks().then(setQuestionBanks);
    fetchParts().then(setParts);
  }, []);

  const handleOpenCreate = () => {
    setFormData(emptyCourse);
    setShowCreate(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditId(course.id);
    setFormData({
      name: course.name,
      code: course.code,
      description: course.description,
      credits: course.credits,
      department: course.department
    });
    setShowEdit(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    // Lấy danh sách đề thi liên quan
    const relatedParts = await fetchParts();
    const partsToDelete = relatedParts.filter(p => p.courseId === id);
    const partNames = partsToDelete.map(p => p.name).join(', ');
    let confirmMsg = `Xóa môn học này sẽ xóa toàn bộ đề thi liên quan (không xóa ngân hàng câu hỏi).\n`;
    if (partsToDelete.length > 0) {
      confirmMsg += `Các đề thi liên quan: ${partNames}\n`;
    }
    confirmMsg += 'Bạn có chắc chắn không?';
    if (!window.confirm(confirmMsg)) return;
    try {
      for (const part of partsToDelete) {
        await deletePart(part.id!);
      }
      await deleteCourse(id);
      await loadCourses();
    } catch (err: any) {
      alert('Lỗi khi xóa môn học: ' + (err?.message || err));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'credits' ? parseInt(value) || 0 : value
    }));
  };

  // Kiểm tra trùng mã môn học khi thêm mới
  const isDuplicateCode = (code: string, ignoreId?: string) => {
    return courses.some(c => c.code.trim().toLowerCase() === code.trim().toLowerCase() && c.id !== ignoreId);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicateCode(formData.code)) {
      alert('Mã môn học đã tồn tại!');
      return;
    }
    try {
      await createCourse(formData);
      setShowCreate(false);
      await loadCourses();
    } catch (err) {
      console.error('Lỗi khi tạo môn học:', err);
      alert('Lỗi khi tạo môn học!');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    if (isDuplicateCode(formData.code, editId)) {
      alert('Mã môn học đã tồn tại!');
      return;
    }
    try {
      await updateCourse(editId, formData);
      setShowEdit(false);
      setEditId(undefined);
      await loadCourses();
    } catch (err) {
      console.error('Lỗi khi cập nhật môn học:', err);
      alert('Lỗi khi cập nhật môn học!');
    }
  };

  // Lọc danh sách theo tìm kiếm
  const filteredCourses = courses.filter(course => {
    const keyword = search.trim().toLowerCase();
    return (
      course.code.toLowerCase().includes(keyword) ||
      course.name.toLowerCase().includes(keyword)
    );
  });

  // Thống kê số lượng ngân hàng câu hỏi và đề thi cho từng môn học
  const statsByCourse = courses.map(c => ({
    course: c,
    bankCount: questionBanks.filter(b => b.courseId === c.id).length,
    partCount: parts.filter(p => p.courseId === c.id).length
  }));

  return (
    <div className="relative min-h-screen bg-slate-50 p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Quản lý môn học</h1>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <input
            type="text"
            placeholder="Tìm kiếm môn học"
            className="px-3 py-2 border rounded w-full sm:w-64"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-sky-600 text-white rounded-md shadow hover:bg-sky-700 focus:outline-none"
            onClick={handleOpenCreate}
          >
            + Thêm môn học
          </button>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-4">
        {statsByCourse.map(stat => (
          <div key={stat.course.id} className="bg-slate-100 rounded px-4 py-2 text-sm">
            <span className="font-semibold">{stat.course.name}:</span> {stat.bankCount} ngân hàng đề, {stat.partCount} đề thi
          </div>
        ))}
      </div>
      {loading ? (
        <div className="text-center text-slate-500">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredCourses.map(course => (
            <div
              key={course.id}
              className="bg-white rounded-lg shadow p-4 sm:p-5 flex flex-col justify-between cursor-pointer transition-transform hover:scale-105 hover:shadow-2xl border border-slate-100"
              onClick={() => navigate(`/admin/course/${course.id}`)}
            >
              <div>
                <h2 className="text-xl font-semibold mb-2">{course.name}</h2>
                <div className="text-slate-600 text-sm mb-1">Mã: <span className="font-mono">{course.code}</span></div>
                <div className="text-slate-600 text-sm mb-1">Khoa: {course.department}</div>
                <div className="text-slate-600 text-sm mb-1">Số tín chỉ: {course.credits}</div>
                <div className="text-slate-500 text-xs mt-2">{course.description}</div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="flex-1 px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500"
                  onClick={e => { e.stopPropagation(); handleOpenEdit(course); }}
                >Chỉnh sửa</button>
                <button
                  className="flex-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={e => { e.stopPropagation(); handleDelete(course.id); }}
                >Xóa</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm môn học */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-700" onClick={() => setShowCreate(false)}>&times;</button>
            <h2 className="text-2xl font-bold mb-4">Thêm môn học</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Tên môn học" className="w-full px-3 py-2 border rounded" required />
              <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="Mã môn học" className="w-full px-3 py-2 border rounded" required />
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả" className="w-full px-3 py-2 border rounded" />
              <input type="number" name="credits" value={formData.credits} onChange={handleChange} placeholder="Số tín chỉ" className="w-full px-3 py-2 border rounded" min={0} />
              <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="Khoa" className="w-full px-3 py-2 border rounded" />
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 bg-slate-200 rounded" onClick={() => setShowCreate(false)}>Hủy</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700">Thêm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa môn học */}
      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-700" onClick={() => setShowEdit(false)}>&times;</button>
            <h2 className="text-2xl font-bold mb-4">Chỉnh sửa môn học</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Tên môn học" className="w-full px-3 py-2 border rounded" required />
              <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="Mã môn học" className="w-full px-3 py-2 border rounded" required />
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả" className="w-full px-3 py-2 border rounded" />
              <input type="number" name="credits" value={formData.credits} onChange={handleChange} placeholder="Số tín chỉ" className="w-full px-3 py-2 border rounded" min={0} />
              <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="Khoa" className="w-full px-3 py-2 border rounded" />
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 bg-slate-200 rounded" onClick={() => setShowEdit(false)}>Hủy</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail.open && showDetail.course && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl relative">
            <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-700" onClick={()=>setShowDetail({open:false,course:null})}>&times;</button>
            <h2 className="text-2xl font-bold mb-4">Môn học: {showDetail.course.name}</h2>
            <div className="flex gap-4 mb-4">
              <button className={`px-4 py-2 rounded ${activeTab==='info'?'bg-sky-600 text-white':'bg-slate-200'}`} onClick={()=>setActiveTab('info')}>Thông tin</button>
              <button className={`px-4 py-2 rounded ${activeTab==='parts'?'bg-sky-600 text-white':'bg-slate-200'}`} onClick={()=>setActiveTab('parts')}>Phần thi</button>
              <button className={`px-4 py-2 rounded ${activeTab==='students'?'bg-sky-600 text-white':'bg-slate-200'}`} onClick={()=>setActiveTab('students')}>Quản lý sinh viên</button>
            </div>
            {activeTab==='info' && (
              <div>
                <div><b>Mã môn học:</b> {showDetail.course.code}</div>
                <div><b>Khoa:</b> {showDetail.course.department}</div>
                <div><b>Số tín chỉ:</b> {showDetail.course.credits}</div>
                <div><b>Mô tả:</b> {showDetail.course.description}</div>
              </div>
            )}
            {activeTab==='parts' && (
              <ManagePart courseId={showDetail.course.id} />
            )}
            {activeTab==='students' && showDetail.course && showDetail.course.id && (
              <CourseStudentManager courseId={showDetail.course.id} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourse; 
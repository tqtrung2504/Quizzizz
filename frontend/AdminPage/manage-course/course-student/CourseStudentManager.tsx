import React, { useEffect, useState, useRef } from "react";
import * as CourseStudentApi from "./CourseStudentApi";
import * as XLSX from "xlsx";

interface Props {
  courseId: string;
}

const CourseStudentManager: React.FC<Props> = ({ courseId }) => {
  const [students, setStudents] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load danh sách sinh viên khi courseId thay đổi
  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    CourseStudentApi.getStudents(courseId)
      .then(setStudents)
      .catch(() => setError("Không lấy được danh sách sinh viên"))
      .finally(() => setLoading(false));
  }, [courseId]);

  // Thêm sinh viên
  const handleAdd = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await CourseStudentApi.addStudent(courseId, input.trim());
      setStudents((prev) => [...prev, input.trim()]);
      setInput("");
      setSuccess("Thêm sinh viên thành công!");
    } catch {
      setError("Thêm sinh viên thất bại!");
    } finally {
      setLoading(false);
    }
  };

  // Xóa sinh viên
  const handleRemove = async (studentId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await CourseStudentApi.removeStudent(courseId, studentId);
      setStudents((prev) => prev.filter((s) => s !== studentId));
      setSuccess("Xóa sinh viên thành công!");
    } catch {
      setError("Xóa sinh viên thất bại!");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý import Excel
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        // Lấy tất cả giá trị ở cột đầu tiên (email/ID)
        const studentList: string[] = rows
          .map((row) => (row[0] ? String(row[0]).trim() : ""))
          .filter((v) => v && !students.includes(v));
        let added = 0, failed = 0;
        for (const studentId of studentList) {
          try {
            await CourseStudentApi.addStudent(courseId, studentId);
            setStudents((prev) => [...prev, studentId]);
            added++;
          } catch {
            failed++;
          }
        }
        setSuccess(`Đã import ${added} sinh viên thành công${failed ? ", " + failed + " thất bại" : ""}`);
      } catch (err) {
        setError("Lỗi khi đọc file Excel!");
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto mt-6">
      <h3 className="text-xl font-bold mb-4 text-sky-700 flex items-center gap-2">
        <span>Quản lý sinh viên</span>
        <span className="text-xs text-slate-400 font-normal">(Thêm thủ công hoặc import Excel)</span>
      </h3>
      <div className="flex flex-col sm:flex-row gap-2 mb-4 items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập email hoặc ID sinh viên"
          disabled={loading}
          className="border px-3 py-2 rounded w-full sm:w-64"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !input.trim()}
          className="bg-sky-600 text-white px-4 py-2 rounded hover:bg-sky-700 font-semibold"
        >
          Thêm
        </button>
        <input
          type="file"
          accept=".xlsx,.csv"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImportExcel}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold"
        >
          Import Excel
        </button>
      </div>
      {error && <div className="mb-2 text-red-600 font-semibold">{error}</div>}
      {success && <div className="mb-2 text-green-600 font-semibold">{success}</div>}
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded shadow text-sm">
            <thead className="bg-sky-100">
              <tr>
                <th className="px-3 py-2 border">STT</th>
                <th className="px-3 py-2 border">Email/ID</th>
                <th className="px-3 py-2 border">Xóa</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => (
                <tr key={student} className="hover:bg-slate-50">
                  <td className="px-3 py-2 border text-center">{idx + 1}</td>
                  <td className="px-3 py-2 border">{student}</td>
                  <td className="px-3 py-2 border text-center">
                    <button
                      onClick={() => handleRemove(student)}
                      disabled={loading}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-4 text-slate-400">Chưa có sinh viên nào trong môn học này.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CourseStudentManager; 
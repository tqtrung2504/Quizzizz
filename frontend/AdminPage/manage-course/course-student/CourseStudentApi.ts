const API_BASE = "/api/courses";

export async function getStudents(courseId: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/${courseId}/students`);
  if (!res.ok) throw new Error("Không lấy được danh sách sinh viên");
  return res.json();
}

export async function addStudent(courseId: string, studentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${courseId}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentId),
  });
  if (!res.ok) throw new Error("Không thêm được sinh viên");
}

export async function removeStudent(courseId: string, studentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${courseId}/students/${studentId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Không xóa được sinh viên");
} 
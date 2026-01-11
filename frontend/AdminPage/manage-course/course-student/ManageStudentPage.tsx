import React, { useEffect, useState } from "react";
import { fetchCourses, Course } from "../courseApi";
import CourseStudentManager from "./CourseStudentManager";

const ManageStudentPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  useEffect(() => {
    fetchCourses().then(setCourses);
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Quản trị sinh viên</h2>
      <div className="mb-4">
        <label className="mr-2 font-semibold">Chọn môn học:</label>
        <select
          value={selectedCourseId}
          onChange={e => setSelectedCourseId(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="">-- Chọn môn học --</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.name} ({course.code})
            </option>
          ))}
        </select>
      </div>
      {selectedCourseId ? (
        <CourseStudentManager courseId={selectedCourseId} />
      ) : (
        <div>Vui lòng chọn môn học để quản lý sinh viên.</div>
      )}
    </div>
  );
};

export default ManageStudentPage; 
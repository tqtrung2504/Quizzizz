// courseApi.ts
import axios from 'axios';

// Định nghĩa base URL cho API backend (sử dụng relative path để đi qua Vite proxy)
const API_URL = '/api/courses';

// Interface cho Course
export interface Course {
  id?: string; // Firestore sử dụng string ID
  code: string;
  name: string;
  description: string;
  credits: number;
  department: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Lấy danh sách tất cả khóa học
export const fetchCourses = async (): Promise<Course[]> => {
  try {
    const response = await axios.get<Course[]>(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

// Lấy thông tin chi tiết khóa học
export const getCourseById = async (id: string): Promise<Course> => {
  try {
    const response = await axios.get<Course>(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching course with id ${id}:`, error);
    throw error;
  }
};

// Tạo mới khóa học
export const createCourse = async (courseData: Omit<Course, 'id'>): Promise<Course> => {
  try {
    const response = await axios.post<Course>(API_URL, courseData);
    return response.data;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

// Cập nhật khóa học
export const updateCourse = async (id: string, courseData: Partial<Course>): Promise<Course> => {
  try {
    const response = await axios.put<Course>(`${API_URL}/${id}`, courseData);
    return response.data;
  } catch (error) {
    console.error(`Error updating course with id ${id}:`, error);
    throw error;
  }
};

// Xóa khóa học
export const deleteCourse = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/${id}`);
  } catch (error) {
    console.error(`Error deleting course with id ${id}:`, error);
    throw error;
  }
};
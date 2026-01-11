import axios from 'axios';

export interface ExamResult {
  id: string;
  userName: string;
  userEmail?: string;
  userStudentId?: string;
  testName: string;
  testId?: string;
  score: number;
  submittedAt: string;
  status: 'submitted' | 'not_submitted';
  details?: { question: string; answer: string; correct: boolean; point: number }[];
  leaveScreenCount?: number;
}

const API_URL = '/api/exam-results';

export const fetchExamResults = async (): Promise<ExamResult[]> => {
  const response = await axios.get<ExamResult[]>(API_URL);
  return response.data;
};
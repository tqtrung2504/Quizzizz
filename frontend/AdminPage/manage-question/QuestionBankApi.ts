import axios from 'axios';

export interface QuestionBank {
  id?: string;
  name: string;
  courseId: string;
  courseName: string;
  description: string;
  totalQuestions?: number;
  easyCount?: number;
  mediumCount?: number;
  hardCount?: number;
}

const API_URL = '/api/question-banks';

export const fetchQuestionBanks = async (search?: string, courseId?: string): Promise<QuestionBank[]> => {
  const params: any = {};
  if (search) params.search = search;
  if (courseId) params.courseId = courseId;
  const response = await axios.get<QuestionBank[]>(API_URL, { params });
  return response.data;
};

export const createQuestionBank = async (data: Omit<QuestionBank, 'id'|'totalQuestions'|'easyCount'|'mediumCount'|'hardCount'>): Promise<QuestionBank> => {
  const response = await axios.post<QuestionBank>(API_URL, data);
  return response.data;
};

export const updateQuestionBank = async (id: string, data: Partial<QuestionBank>): Promise<QuestionBank> => {
  const response = await axios.put<QuestionBank>(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteQuestionBank = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};

export const getQuestionBankById = async (id: string): Promise<QuestionBank> => {
  const response = await axios.get<QuestionBank>(`${API_URL}/${id}`);
  return response.data;
};

export const fetchQuestions = async (bankId: string): Promise<void> => {
  // Implementation of fetchQuestions function
}; 
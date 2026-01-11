import axios from 'axios';

export interface Test {
  id?: string;
  name: string;
  description?: string;
  duration: number;
  courseId: string;
  createdAt?: string;
  updatedAt?: string;
  questions?: any[];
  score?: number;
  questionBankId?: string;
}

const API_URL = '/api/parts';

export const fetchTests = async (search?: string): Promise<Test[]> => {
  const params = search ? { params: { search } } : {};
  const response = await axios.get<Test[]>(API_URL, params);
  return response.data;
};

export const createTest = async (test: Omit<Test, 'id'>): Promise<Test> => {
  const response = await axios.post<Test>(API_URL, test);
  return response.data;
};

export const updateTest = async (id: string, test: Partial<Test>): Promise<Test> => {
  const response = await axios.put<Test>(`${API_URL}/${id}`, test);
  return response.data;
};

export const deleteTest = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};

export const getTestById = async (id: string): Promise<Test> => {
  const response = await axios.get<Test>(`${API_URL}/${id}`);
  return response.data;
};

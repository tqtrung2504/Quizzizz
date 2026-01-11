import axios from 'axios';

export interface Part {
  id?: string;
  name: string;
  description: string;
  duration: number;
  courseId: string;
  questionBankId?: string;
  createdAt?: string;
  updatedAt?: string;
  questions?: any[];
  score?: number;
  maxRetake?: number;
  randomizeQuestions?: boolean;
  enableAntiCheat?: boolean;
  enableTabWarning?: boolean;
  openTime?: string | null;
  closeTime?: string | null;
  showAnswerAfterSubmit?: boolean;
  courseName?: string;
  scoringMode?: string;
}

const API_URL = '/api/parts';

export const fetchParts = async (search?: string): Promise<Part[]> => {
  const params = search ? { params: { search } } : {};
  const response = await axios.get<Part[]>(API_URL, params);
  return response.data;
};

export const createPart = async (part: Omit<Part, 'id'>): Promise<Part> => {
  const response = await axios.post<Part>(API_URL, part);
  return response.data;
};

export const updatePart = async (id: string, part: Partial<Part>): Promise<Part> => {
  const response = await axios.put<Part>(`${API_URL}/${id}`, part);
  return response.data;
};

export const deletePart = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};

export const getPartById = async (id: string): Promise<Part> => {
  const response = await axios.get<Part>(`${API_URL}/${id}`);
  return response.data;
}; 
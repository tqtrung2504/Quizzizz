import axios from 'axios';

export interface QuestionOption {
  text: string;
  correct: boolean;
}

export interface Question {
  questionBankId: string;
  id?: string;
  bankId: string;
  content: string;
  type: 'truefalse' | 'single' | 'multiple';
  level: 'easy' | 'medium' | 'hard';
  options: QuestionOption[];
  answer?: string;
}

const API_URL = '/api/question-banks';
const QUESTIONS_API_URL = '/api/questions';

export const fetchQuestions = async (bankId: string): Promise<Question[]> => {
  const response = await axios.get<Question[]>(QUESTIONS_API_URL, {
    params: { questionBankId: bankId }
  });
  return response.data;
};

export const createQuestion = async (bankId: string, data: Omit<Question, 'id'|'bankId'>): Promise<Question> => {
  const response = await axios.post<Question>(QUESTIONS_API_URL, {
    ...data,
    questionBankId: bankId
  });
  return response.data;
};

export const updateQuestion = async (id: string, data: Partial<Question>): Promise<Question> => {
  const response = await axios.put<Question>(`${QUESTIONS_API_URL}/${id}`, data);
  return response.data;
};

export const deleteQuestion = async (bankId: string, id: string): Promise<void> => {
  await axios.delete(QUESTIONS_API_URL, {
    params: { id, questionBankId: bankId }
  });
};

export const getQuestionById = async (bankId: string, id: string): Promise<Question> => {
  const response = await axios.get<Question>(`${QUESTIONS_API_URL}/${id}`);
  return response.data;
}; 
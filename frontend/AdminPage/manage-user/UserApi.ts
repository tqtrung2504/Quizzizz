import axios from 'axios';

export interface User {
  uid: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  role: string;
  isDeleted?: boolean;
}

const API_URL = '/api/users';

export const fetchUsers = async (): Promise<User[]> => {
  const res = await axios.get<User[]>(API_URL);
  return res.data;
};

export const createUser = async (data: Partial<User>): Promise<User> => {
  const res = await axios.post<User>(API_URL, data);
  return res.data;
};

export const updateUser = async (uid: string, data: Partial<User>): Promise<User> => {
  const res = await axios.put<User>(`${API_URL}/${uid}`, data);
  return res.data;
};

export const deleteUser = async (uid: string): Promise<void> => {
  await axios.delete(`${API_URL}/${uid}`);
};

export const changeRole = async (uid: string, role: string): Promise<User> => {
  const res = await axios.patch<User>(`${API_URL}/${uid}/role`, { role });
  return res.data;
};

export const disableUser = async (uid: string, isDeleted: boolean): Promise<User> => {
  const res = await axios.patch<User>(`${API_URL}/${uid}/disable`, { isDeleted });
  return res.data;
}; 
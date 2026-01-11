const API_URL = "/api/subjects";

export interface Subject {
    id: string;
    name: string;
}

export const getSubjects = async (): Promise<Subject[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Failed to fetch subjects');
    }
    return response.json();
};

export const createSubject = async (name: string): Promise<Subject> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
    });
    if (!response.ok) {
        throw new Error('Failed to create subject');
    }
    return response.json();
};

export const updateSubject = async (id: string, name: string): Promise<Subject> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, name }),
    });
    if (!response.ok) {
        throw new Error('Failed to update subject');
    }
    return response.json();
};

export const deleteSubject = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete subject');
    }
};
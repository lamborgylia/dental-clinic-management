import api from './api';

export interface Clinic {
  id: number;
  name: string;
  description?: string;
  address: string;
  contacts: string;
  is_active: boolean;
}

export const clinicApi = {
  // Получить информацию о текущей клинике
  getCurrentClinic: async (): Promise<Clinic> => {
    const response = await api.get('/clinics/current');
    return response.data;
  },

  // Получить список всех клиник (только для админа)
  getClinics: async (): Promise<Clinic[]> => {
    const response = await api.get('/clinics/');
    return response.data;
  },

  // Создать новую клинику (только для админа)
  createClinic: async (clinic: Omit<Clinic, 'id' | 'is_active'>): Promise<Clinic> => {
    const response = await api.post('/clinics/', clinic);
    return response.data;
  },

  // Обновить информацию о клинике (только для админа)
  updateClinic: async (clinicId: number, clinic: Partial<Clinic>): Promise<Clinic> => {
    const response = await api.put(`/clinics/${clinicId}`, clinic);
    return response.data;
  },

  // Удалить клинику (только для админа)
  deleteClinic: async (clinicId: number): Promise<void> => {
    await api.delete(`/clinics/${clinicId}`);
  }
};

import api from './api';
import type { Doctor } from '../types/doctor';

export const doctorsApi = {
  // Получить список врачей клиники
  getDoctors: async (clinicId?: number): Promise<Doctor[]> => {
    const params = clinicId ? `?clinic_id=${clinicId}` : '';
    const response = await api.get<Doctor[]>(`/users/doctors${params}`);
    return response.data;
  },

  // Получить врача по ID
  getDoctorById: async (id: number): Promise<Doctor> => {
    const response = await api.get<Doctor>(`/users/${id}`);
    return response.data;
  }
};

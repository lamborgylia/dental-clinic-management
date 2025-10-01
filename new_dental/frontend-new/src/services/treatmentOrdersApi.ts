import api from './api';
import type { TreatmentOrder, TreatmentOrderCreate, TreatmentOrderService } from '../types/treatmentOrder';

// Реэкспортируем типы для обратной совместимости
export type { TreatmentOrder, TreatmentOrderCreate, TreatmentOrderService } from '../types/treatmentOrder';

export const treatmentOrdersApi = {
  // Получить все наряды
  getAll: async (params?: { patient_id?: number; skip?: number; limit?: number }): Promise<TreatmentOrder[]> => {
    const queryParams = new URLSearchParams();
    if (params?.patient_id) queryParams.append('patient_id', params.patient_id.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await api.get(`/treatment-orders/?${queryParams.toString()}`);
    return response.data;
  },

  // Получить наряд по ID
  getById: async (id: number): Promise<TreatmentOrder> => {
    const response = await api.get(`/treatment-orders/${id}`);
    return response.data;
  },

  // Создать наряд
  create: async (treatmentOrder: TreatmentOrderCreate): Promise<TreatmentOrder> => {
    const response = await api.post('/treatment-orders/', treatmentOrder);
    return response.data;
  },

  // Обновить наряд
  update: async (id: number, treatmentOrder: { notes?: string }): Promise<TreatmentOrder> => {
    const response = await api.put(`/treatment-orders/${id}`, treatmentOrder);
    return response.data;
  },

  // Удалить наряд
  delete: async (id: number): Promise<void> => {
    await api.delete(`/treatment-orders/${id}`);
  }
};

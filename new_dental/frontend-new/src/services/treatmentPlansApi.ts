import api from './api';

export interface TreatmentPlan {
  id: number;
  patient_id: number;
  patient_name?: string;
  patient_phone?: string;
  patient_iin?: string;
  patient_birth_date?: string;
  patient_allergies?: string;
  patient_chronic_diseases?: string;
  patient_contraindications?: string;
  patient_special_notes?: string;
  doctor_id: number;
  diagnosis: string;
  treatment_description: string;
  services: number[];
  total_cost: number;
  selected_teeth: number[];
  status: string;
  created_at: string;
  updated_at?: string;
  teethServices?: Record<number, number[]>;
  toothServicesData?: any[];
}

export interface TreatmentPlanCreate {
  patient_id: number;
  doctor_id: number;
  diagnosis: string;
  treatment_description: string;
  services: number[];
  total_cost: number;
  selected_teeth: number[];
  status?: string;
}

export interface TreatmentPlanUpdate {
  diagnosis?: string;
  treatment_description?: string;
  services?: number[];
  total_cost?: number;
  selected_teeth?: number[];
  status?: string;
}

export interface TreatmentPlanService {
  id: number;
  treatment_plan_id: number;
  service_id: number;
  service_name: string;
  service_price: number;
  tooth_number: number;
  quantity: number;
  is_completed: number;
  notes?: string;
}

export const treatmentPlansApi = {
  // Получить все планы лечения
  getAll: async (): Promise<TreatmentPlan[]> => {
    const response = await api.get('/treatment-plans/');
    return response.data;
  },

  // Получить планы по ID врача
  getByDoctorId: async (doctorId: number): Promise<TreatmentPlan[]> => {
    const response = await api.get(`/treatment-plans/?doctor_id=${doctorId}`);
    return response.data;
  },

  // Получить планы по ID пациента
  getByPatientId: async (patientId: number): Promise<TreatmentPlan[]> => {
    const response = await api.get(`/treatment-plans/?patient_id=${patientId}`);
    return response.data;
  },

  // Получить план по ID
  getById: async (id: number): Promise<TreatmentPlan> => {
    const response = await api.get(`/treatment-plans/${id}`);
    return response.data;
  },

  // Создать новый план лечения
  create: async (plan: TreatmentPlanCreate): Promise<TreatmentPlan> => {
    const response = await api.post('/treatment-plans/', plan);
    return response.data;
  },

  // Обновить план лечения
  update: async (id: number, plan: TreatmentPlanUpdate): Promise<TreatmentPlan> => {
    const response = await api.put(`/treatment-plans/${id}`, plan);
    return response.data;
  },

  // Удалить план лечения
  delete: async (id: number): Promise<void> => {
    await api.delete(`/treatment-plans/${id}`);
  },

  // Получить услуги из плана лечения для конкретного пациента
  getPatientServices: async (patientId: number): Promise<TreatmentPlanService[]> => {
    const response = await api.get(`/treatment-plans/patient/${patientId}/services`);
    return response.data;
  }
};

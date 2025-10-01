import api from './api';

export interface Appointment {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  patient_iin: string;
  patient_birth_date: string;
  patient_allergies: string;
  patient_chronic_diseases: string;
  patient_contraindications: string;
  patient_special_notes: string;
  doctor_id: number;
  registrar_id: number;
  appointment_datetime: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentCreate {
  patient_id: number;
  doctor_id?: number;
  registrar_id: number;
  appointment_datetime: string;
  status?: string;
  notes?: string;
}

export interface AppointmentUpdate {
  patient_id?: number;
  doctor_id?: number;
  appointment_datetime?: string;
  status?: string;
  notes?: string;
}

export const appointmentsApi = {
  // Получить все записи на прием
  getAll: async (): Promise<Appointment[]> => {
    // Получаем все записи с пагинацией
    let allAppointments: Appointment[] = [];
    let page = 1;
    const pageSize = 100;
    
    while (true) {
      const response = await api.get(`/appointments/?page=${page}&size=${pageSize}`);
      const appointments = response.data;
      
      if (!appointments || appointments.length === 0) {
        break;
      }
      
      allAppointments = allAppointments.concat(appointments);
      
      // Если получили меньше записей, чем размер страницы, значит это последняя страница
      if (appointments.length < pageSize) {
        break;
      }
      
      page++;
    }
    
    return allAppointments;
  },

  // Получить записи по ID врача
  getByDoctorId: async (doctorId: number): Promise<Appointment[]> => {
    // Получаем записи на текущую неделю
    const response = await api.get(`/appointments/?doctor_id=${doctorId}&current_week_only=true&limit=1000`);
    return response.data;
  },

  // Получить записи по ID врача в заданном диапазоне дат
  getAppointmentsByDateRange: async (doctorId: number, startDate: string, endDate: string): Promise<Appointment[]> => {
    const response = await api.get(`/appointments/?doctor_id=${doctorId}&start_date=${startDate}&end_date=${endDate}&limit=1000`);
    return response.data;
  },

  // Получить записи по ID пациента
  getByPatientId: async (patientId: number): Promise<Appointment[]> => {
    // Получаем все записи с пагинацией
    let allAppointments: Appointment[] = [];
    let page = 1;
    const pageSize = 100;
    
    while (true) {
      const response = await api.get(`/appointments/?patient_id=${patientId}&page=${page}&size=${pageSize}`);
      const appointments = response.data;
      
      if (!appointments || appointments.length === 0) {
        break;
      }
      
      allAppointments = allAppointments.concat(appointments);
      
      // Если получили меньше записей, чем размер страницы, значит это последняя страница
      if (appointments.length < pageSize) {
        break;
      }
      
      page++;
    }
    
    return allAppointments;
  },

  // Получить запись по ID
  getById: async (id: number): Promise<Appointment> => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  // Создать новую запись
  create: async (appointment: AppointmentCreate): Promise<Appointment> => {
    const response = await api.post('/appointments/', appointment);
    return response.data;
  },

  // Обновить запись
  update: async (id: number, appointment: AppointmentUpdate): Promise<Appointment> => {
    const response = await api.put(`/appointments/${id}`, appointment);
    return response.data;
  },

  // Отменить запись
  cancel: async (id: number): Promise<void> => {
    await api.delete(`/appointments/${id}`);
  }
};

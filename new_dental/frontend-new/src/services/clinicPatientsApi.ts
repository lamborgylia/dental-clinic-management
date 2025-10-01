import api from './api';

export interface ClinicPatient {
  id: number;
  clinic_id: number;
  patient_id: number;
  first_visit_date: string;
  last_visit_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  patient_name?: string;
  patient_phone?: string;
  patient_iin?: string;
  clinic_name?: string;
}

export interface PatientSearchResult {
  id: number;
  full_name: string;
  phone: string;
  iin: string;
  birth_date?: string;
  allergies?: string;
  chronic_diseases?: string;
  contraindications?: string;
  special_notes?: string;
  is_in_clinic: boolean;
  first_visit_date?: string;
}

export interface DoctorStats {
  id: number;
  full_name: string;
  role: string;
  patient_count: number;
}

export const clinicPatientsApi = {
  // Получить список пациентов клиники с фильтрацией
  getClinicPatients: async (
    page: number = 1, 
    size: number = 100, 
    doctorId?: number, 
    search?: string
  ): Promise<ClinicPatient[]> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });
    
    if (doctorId) {
      params.append('doctor_id', doctorId.toString());
    }
    
    if (search) {
      params.append('search', search);
    }
    
    const response = await api.get<ClinicPatient[]>(`/clinic-patients/?${params.toString()}`);
    return response.data;
  },

  // Получить статистику по врачам
  getDoctorsStats: async (): Promise<DoctorStats[]> => {
    const response = await api.get<DoctorStats[]>('/clinic-patients/doctors-stats');
    return response.data;
  },

  // Поиск пациентов по общей базе
  searchPatients: async (query: string): Promise<PatientSearchResult[]> => {
    const response = await api.get<PatientSearchResult[]>(`/clinic-patients/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Добавить пациента в клинику
  addPatientToClinic: async (patientId: number): Promise<ClinicPatient> => {
    const response = await api.post<ClinicPatient>(`/clinic-patients/?patient_id=${patientId}`);
    return response.data;
  },

  // Обновить информацию о пациенте в клинике
  updateClinicPatient: async (clinicPatientId: number, updateData: Partial<ClinicPatient>): Promise<ClinicPatient> => {
    const response = await api.put<ClinicPatient>(`/clinic-patients/${clinicPatientId}`, updateData);
    return response.data;
  },

  // Удалить пациента из клиники
  removePatientFromClinic: async (clinicPatientId: number): Promise<void> => {
    await api.delete(`/clinic-patients/${clinicPatientId}`);
  }
};

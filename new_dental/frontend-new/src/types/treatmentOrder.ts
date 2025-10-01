export interface TreatmentOrderService {
  id?: number;
  service_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface TreatmentOrder {
  id: number;
  patient_id: number;
  treatment_plan_id?: number;
  created_by_id: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  services: TreatmentOrderService[];
}

export interface TreatmentOrderCreate {
  patient_id: number;
  treatment_plan_id?: number;
  created_by_id: number;
  total_amount: number;
  notes?: string;
  services: Omit<TreatmentOrderService, 'id'>[];
}

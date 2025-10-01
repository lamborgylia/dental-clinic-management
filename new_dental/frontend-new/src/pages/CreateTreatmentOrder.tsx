import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { doctorsApi } from '../services/doctorsApi';
import { treatmentPlansApi } from '../services/treatmentPlansApi';

interface TreatmentPlanService {
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
import TeethMap from '../components/TeethMap';

interface Patient {
  id: number;
  full_name: string;
  phone: string;
  iin: string;
  birth_date: string;
}

interface Doctor {
  id: number;
  full_name: string;
  phone: string;
  role: string;
}

interface Service {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
}

interface TreatmentOrderService {
  service_id: number;
  service_name: string;
  service_price: number;
  quantity: number;
  tooth_number: number;
  is_completed: number;
}

interface TreatmentPlan {
  id: number;
  patient_id: number;
  doctor_id: number;
  diagnosis: string;
  treatment_description: string;
  services: any[]; // Массив объектов TreatmentPlanServiceResponse
  total_cost: number;
  created_at: string;
}

interface ToothService {
  tooth_id: number;
  service_id: number;
  service_name: string;
  service_price: number;
  quantity: number;
}

interface SelectedToothService {
  tooth_id: number;
  service_id: number;
  service_name: string;
  service_price: number;
  quantity: number;
  is_from_plan: boolean;
}

const CreateTreatmentOrder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointment_id');
  const patientId = searchParams.get('patient_id');
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [planServices, setPlanServices] = useState<TreatmentPlanService[]>([]);
  const [toothServices, setToothServices] = useState<ToothService[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedToothService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Состояния для карты зубов
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [teethServicesMap, setTeethServicesMap] = useState<Record<number, number[]>>({});
  const [showTeethMap, setShowTeethMap] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentData();
    } else if (patientId) {
      fetchPatientData();
    }
    fetchServices();
    loadDoctors();
  }, [appointmentId, patientId]);

  useEffect(() => {
    if (patient) {
      fetchTreatmentPlans();
      fetchPlanServices();
    }
  }, [patient]);

  const fetchAppointmentData = async () => {
    try {
      const response = await api.get(`/appointments/${appointmentId}`);
      const appointment = response.data;
      
      // Загружаем данные пациента
      if (appointment.patient_id) {
        const patientResponse = await api.get(`/patients/${appointment.patient_id}`);
        setPatient(patientResponse.data);
      }
      
      // Загружаем данные врача
      if (appointment.doctor_id) {
        const doctorResponse = await api.get(`/users/${appointment.doctor_id}`);
        setDoctor(doctorResponse.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных записи:', error);
    }
  };

  const fetchPatientData = async () => {
    try {
      const response = await api.get(`/patients/${patientId}`);
      setPatient(response.data);
    } catch (error) {
      console.error('Ошибка загрузки данных пациента:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get('/services/');
      setServices(response.data);
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const doctorsList = await doctorsApi.getDoctors();
      setDoctors(doctorsList);
      console.log('👨‍⚕️ Загружены врачи:', doctorsList);
    } catch (error) {
      console.error('Ошибка загрузки врачей:', error);
    }
  };

  const fetchTreatmentPlans = async () => {
    if (!patient) return;
    
    try {
      const response = await api.get(`/treatment-plans/patient/${patient.id}`);
      setTreatmentPlans(response.data);
      console.log('📋 Загружены планы лечения:', response.data);
      
      // Загружаем услуги для зубов из планов лечения
      const allToothServices: ToothService[] = [];
      response.data.forEach((plan: TreatmentPlan) => {
        if (plan.services && plan.services.length > 0) {
          // plan.services теперь содержит объекты TreatmentPlanServiceResponse
          plan.services.forEach((service: any) => {
            if (service && service.service_id) {
              allToothServices.push({
                tooth_id: service.tooth_id || 0,
                service_id: service.service_id,
                service_name: service.service_name || 'Неизвестная услуга',
                service_price: service.service_price || 0,
                quantity: service.quantity || 1
              });
            }
          });
        }
      });
      
      setToothServices(allToothServices);
      console.log('🦷 Загружены услуги для зубов:', allToothServices);
    } catch (error) {
      console.error('Ошибка загрузки планов лечения:', error);
    }
  };

  const fetchPlanServices = async () => {
    if (!patient) return;
    
    try {
      const services = await treatmentPlansApi.getPatientServices(patient.id);
      setPlanServices(services);
      console.log('📋 Загружены услуги из плана лечения:', services);
      
      // Преобразуем услуги из плана лечения в формат для карты зубов
      const toothServicesFromPlan: ToothService[] = services.map(service => ({
        tooth_id: service.tooth_number,
        service_id: service.service_id,
        service_name: service.service_name,
        service_price: service.service_price,
        quantity: service.quantity
      }));
      
      setToothServices(prev => [...prev, ...toothServicesFromPlan]);
      console.log('🦷 Добавлены услуги из плана лечения в карту зубов:', toothServicesFromPlan);
    } catch (error) {
      console.error('Ошибка загрузки услуг из плана лечения:', error);
    }
  };

  const handleToothServiceToggle = (toothId: number, serviceId: number, serviceName: string, servicePrice: number) => {
    const existingService = selectedServices.find(s => s.tooth_id === toothId && s.service_id === serviceId);
    
    if (existingService) {
      // Убираем услугу
      console.log('🗑️ Убираем услугу из плана:', { toothId, serviceId, serviceName });
      setSelectedServices(prev => prev.filter(s => !(s.tooth_id === toothId && s.service_id === serviceId)));
    } else {
      // Добавляем услугу
      console.log('✅ Добавляем услугу из плана:', { toothId, serviceId, serviceName, servicePrice });
      const newService: SelectedToothService = {
        tooth_id: toothId,
        service_id: serviceId,
        service_name: serviceName,
        service_price: servicePrice,
        quantity: 1,
        is_from_plan: true
      };
      setSelectedServices(prev => [...prev, newService]);
    }
  };

  const handleServiceRemove = (index: number) => {
    setSelectedServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    if (quantity < 1) return;
    
    setSelectedServices(prev => 
      prev.map((service, i) => 
        i === index ? { ...service, quantity } : service
      )
    );
  };

  const calculateTotal = () => {
    const total = selectedServices.reduce((total, service) => {
      const serviceTotal = (service.service_price || 0) * (service.quantity || 1);
      console.log(`💰 Услуга "${service.service_name}" (зуб ${service.tooth_id}): ${service.service_price} × ${service.quantity} = ${serviceTotal}`);
      return total + serviceTotal;
    }, 0);
    console.log(`💰 Общая сумма: ${total}`);
    return total;
  };

  // Функции для работы с картой зубов
  const handleToothSelect = (toothId: number) => {
    setSelectedTeeth(prev => {
      if (prev.includes(toothId)) {
        return prev.filter(id => id !== toothId);
      } else {
        return [...prev, toothId];
      }
    });
  };

  const handleAddServiceToTooth = (toothId: number, serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    console.log('🦷 Добавляем услугу к зубу:', { toothId, serviceId, serviceName: service.name });

    setTeethServicesMap(prev => {
      const newMap = { ...prev };
      if (!newMap[toothId]) {
        newMap[toothId] = [];
      }
      if (!newMap[toothId].includes(serviceId)) {
        newMap[toothId].push(serviceId);
      }
      return newMap;
    });

    // Добавляем услугу в выбранные услуги
    const newService: SelectedToothService = {
      tooth_id: toothId,
      service_id: serviceId,
      service_name: service.name,
      service_price: service.price,
      quantity: 1,
      is_from_plan: false
    };

    setSelectedServices(prev => {
      const exists = prev.some(s => s.tooth_id === toothId && s.service_id === serviceId);
      if (!exists) {
        console.log('✅ Услуга добавлена в selectedServices:', newService);
        return [...prev, newService];
      }
      console.log('⚠️ Услуга уже существует в selectedServices');
      return prev;
    });
  };

  const handleRemoveServiceFromTooth = (toothId: number, serviceId: number) => {
    setTeethServicesMap(prev => {
      const newMap = { ...prev };
      if (newMap[toothId]) {
        newMap[toothId] = newMap[toothId].filter(id => id !== serviceId);
        if (newMap[toothId].length === 0) {
          delete newMap[toothId];
        }
      }
      return newMap;
    });

    // Удаляем услугу из выбранных услуг
    setSelectedServices(prev => 
      prev.filter(s => !(s.tooth_id === toothId && s.service_id === serviceId))
    );
  };

  const handleClearSelection = () => {
    setSelectedTeeth([]);
    setTeethServicesMap({});
  };

  const handleSave = async () => {
    if (!patient || !doctor || selectedServices.length === 0) {
      alert('Выберите хотя бы одну услугу');
      return;
    }

    try {
      setSaving(true);
      
      // Услуги из плана
      const allServices = selectedServices.map(s => ({
        service_id: s.service_id,
        service_name: s.service_name,
        service_price: s.service_price,
        quantity: s.quantity,
        tooth_number: s.tooth_id,
        is_completed: 1  // Услуги из плана считаются выполненными
      }));
      
      const treatmentOrderData = {
        patient_id: patient.id,
        doctor_id: doctor.id,
        appointment_id: appointmentId ? parseInt(appointmentId) : null,
        visit_date: new Date().toISOString(),
        services: allServices,
        total_amount: calculateTotal(),
        status: 'completed'
      };

      const response = await api.post('/treatment-orders/', treatmentOrderData);
      
      // Обновляем план лечения с новыми услугами, если они были добавлены через карту зубов
      const newServicesFromTeeth = selectedServices.filter(s => !s.is_from_plan);
      if (newServicesFromTeeth.length > 0 && treatmentPlans.length > 0) {
        try {
          const latestPlan = treatmentPlans[treatmentPlans.length - 1]; // Берем последний план лечения
          
          // Подготавливаем данные для обновления плана лечения
          const planUpdateData = newServicesFromTeeth.map(s => ({
            tooth_number: s.tooth_id,
            service_id: s.service_id,
            service_name: s.service_name,
            service_price: s.service_price,
            quantity: s.quantity
          }));
          
          // Обновляем план лечения
          await api.post(`/treatment-plans/${latestPlan.id}/update-from-order`, planUpdateData);
          console.log('✅ План лечения обновлен новыми услугами из карты зубов');
        } catch (planError) {
          console.error('Ошибка обновления плана лечения:', planError);
          // Не прерываем процесс, так как наряд уже сохранен
        }
      }
      
      navigate('/treatment-orders');
    } catch (error) {
      console.error('Ошибка сохранения наряда:', error);
      alert('Ошибка сохранения наряда');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Загрузка...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 'clamp(1rem, 3vw, 2rem)',
      borderRadius: '20px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        padding: 'clamp(0.5rem, 2vw, 2rem)',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Заголовок */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 'clamp(1rem, 3vw, 2rem)',
          flexWrap: 'wrap',
          gap: 'clamp(0.5rem, 2vw, 1rem)',
          background: 'rgba(255,255,255,0.95)',
          padding: 'clamp(1rem, 3vw, 1.5rem)',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <h1 style={{ 
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            margin: 0,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: '700'
          }}>Создание наряда</h1>
          <button
            onClick={() => navigate('/treatment-orders')}
            style={{
              background: 'linear-gradient(135deg, #6b7280, #4b5563)',
              color: 'white',
              border: 'none',
              padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
              borderRadius: '15px',
              cursor: 'pointer',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              whiteSpace: 'nowrap',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(107,114,128,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(107,114,128,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(107,114,128,0.3)';
            }}
          >
            ← Назад к нарядам
          </button>
        </div>

        {/* Информация о пациенте и враче */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(1rem, 3vw, 2rem)',
          marginBottom: 'clamp(1rem, 3vw, 2rem)'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            padding: 'clamp(1rem, 3vw, 1.5rem)',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h2 style={{ 
              fontSize: 'clamp(1.125rem, 3vw, 1.25rem)',
              margin: '0 0 1rem 0',
              color: '#1f2937',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Информация о пациенте</h2>
            {patient ? (
              <div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>ФИО:</strong> {patient.full_name}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Телефон:</strong> {patient.phone}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>ИИН:</strong> {patient.iin}
                </div>
                <div>
                  <strong>Дата рождения:</strong> {new Date(patient.birth_date).toLocaleDateString('ru-RU')}
                </div>
              </div>
            ) : (
              <div style={{ color: '#6b7280' }}>Данные пациента не загружены</div>
            )}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.95)',
            padding: 'clamp(1rem, 3vw, 1.5rem)',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h2 style={{ 
              fontSize: 'clamp(1.125rem, 3vw, 1.25rem)',
              margin: '0 0 1rem 0',
              color: '#1f2937',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Информация о враче</h2>
            {doctor ? (
              <div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>ФИО:</strong> {doctor.full_name}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Телефон:</strong> {doctor.phone}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Роль:</strong> {doctor.role}
                </div>
                
                {/* Выбор врача */}
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Изменить врача:
                  </label>
                  <select
                    value={doctor.id}
                    onChange={(e) => {
                      const selectedDoctorId = parseInt(e.target.value);
                      const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
                      if (selectedDoctor) {
                        setDoctor(selectedDoctor);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                      backgroundColor: 'white'
                    }}
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div style={{ color: '#6b7280' }}>Данные врача не загружены</div>
            )}
          </div>
        </div>

        {/* Услуги из плана лечения */}
        {toothServices.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            padding: 'clamp(1rem, 3vw, 1.5rem)',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: 'clamp(1rem, 3vw, 1.5rem)'
          }}>
            <h2 style={{ 
              fontSize: 'clamp(1.125rem, 3vw, 1.25rem)',
              margin: '0 0 1rem 0',
              color: '#1f2937'
            }}>Услуги из плана лечения</h2>
            <div style={{ 
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              color: '#6b7280',
              marginBottom: '1rem'
            }}>
              Выберите услуги, которые были оказаны пациенту
            </div>
            
            {/* Группируем услуги по зубам */}
            {Array.from(new Set(toothServices.map(ts => ts.tooth_id))).map(toothId => (
              <div key={toothId} style={{
                marginBottom: '1rem',
                padding: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                backgroundColor: '#f9fafb'
              }}>
                <h3 style={{ 
                  fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                  margin: '0 0 0.75rem 0',
                  color: '#1f2937'
                }}>
                  Зуб {toothId}
                </h3>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {toothServices
                    .filter(ts => ts.tooth_id === toothId)
                    .map(service => {
                      const isSelected = selectedServices.some(s => 
                        s.tooth_id === toothId && s.service_id === service.service_id
                      );
                      return (
                        <div
                          key={`${toothId}-${service.service_id}`}
                          onClick={() => handleToothServiceToggle(
                            toothId, 
                            service.service_id, 
                            service.service_name, 
                            service.service_price
                          )}
                          style={{
                            border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                            borderRadius: '0.375rem',
                            padding: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            backgroundColor: isSelected ? '#eff6ff' : 'white'
                          }}
                        >
                          <div style={{ 
                            fontWeight: '500', 
                            marginBottom: '0.25rem',
                            color: isSelected ? '#1e40af' : '#1f2937'
                          }}>
                            {service.service_name}
                          </div>
                          <div style={{ 
                            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', 
                            color: '#6b7280' 
                          }}>
                            {(service.service_price || 0).toLocaleString('ru-RU')} ₸
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Карта зубов */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          padding: 'clamp(1rem, 3vw, 1.5rem)',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          marginBottom: 'clamp(1rem, 3vw, 1.5rem)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 style={{ 
              fontSize: 'clamp(1.125rem, 3vw, 1.25rem)',
              margin: '0',
              color: '#1f2937',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Карта зубов</h2>
            <button
              type="button"
              onClick={() => setShowTeethMap(!showTeethMap)}
              style={{
                padding: '0.5rem 1rem',
                background: showTeethMap 
                  ? 'linear-gradient(135deg, #dc2626, #b91c1c)' 
                  : 'linear-gradient(135deg, #059669, #047857)',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
              }}
            >
              {showTeethMap ? 'Скрыть карту' : 'Показать карту зубов'}
            </button>
          </div>
          
          {showTeethMap && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ 
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                color: '#6b7280',
                marginBottom: '1rem'
              }}>
                Выберите зубы и назначьте на них услуги
              </div>
              
              <TeethMap
                services={services}
                onToothServicesChange={(toothServices) => {
                  console.log('🦷 Получены услуги зубов:', toothServices);
                }}
                selectedTeeth={selectedTeeth}
                onToothSelect={handleToothSelect}
                teethServices={teethServicesMap}
                onAddServiceToTooth={handleAddServiceToTooth}
                onRemoveServiceFromTooth={handleRemoveServiceFromTooth}
                onClearSelection={handleClearSelection}
              />
              
              {selectedTeeth.length > 0 && (
                <div style={{ 
                  marginTop: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '0.375rem',
                  border: '1px solid #0ea5e9'
                }}>
                  <div style={{ 
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#0c4a6e',
                    marginBottom: '0.5rem'
                  }}>
                    Выбранные зубы: {selectedTeeth.join(', ')}
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    Очистить выбор
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Выбранные услуги */}
        {(() => {
          console.log('📋 Отображаем выбранные услуги:', selectedServices);
          return selectedServices.length > 0;
        })() && (
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            padding: 'clamp(1rem, 3vw, 1.5rem)',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            marginBottom: 'clamp(1rem, 3vw, 1.5rem)'
          }}>
            <h2 style={{ 
              fontSize: 'clamp(1.125rem, 3vw, 1.25rem)',
              margin: '0 0 1rem 0',
              color: '#1f2937',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Выбранные услуги</h2>
            
            {/* Услуги из плана лечения */}
            {selectedServices.filter(s => s.is_from_plan).length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ 
                  fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                  margin: '0 0 0.75rem 0',
                  color: '#374151'
                }}>Из плана лечения:</h3>
                {selectedServices.filter(s => s.is_from_plan).map((service, index) => {
                  const originalIndex = selectedServices.findIndex(s => s === service);
                  return (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      marginBottom: '0.5rem',
                      backgroundColor: '#f0f9ff'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>
                          Зуб {service.tooth_id}: {service.service_name}
                        </div>
                        <div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#6b7280' }}>
                          {(service.service_price || 0).toLocaleString('ru-RU')} ₸ за единицу
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="number"
                          min="1"
                          value={service.quantity}
                          onChange={(e) => handleQuantityChange(originalIndex, parseInt(e.target.value) || 1)}
                          style={{
                            width: '60px',
                            padding: '0.25rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            textAlign: 'center'
                          }}
                        />
                        <button
                          onClick={() => handleServiceRemove(originalIndex)}
                          style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
                          }}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Услуги, добавленные через карту зубов */}
            {selectedServices.filter(s => !s.is_from_plan).length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ 
                  fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                  margin: '0 0 0.75rem 0',
                  color: '#374151'
                }}>Добавленные через карту зубов:</h3>
                {selectedServices.filter(s => !s.is_from_plan).map((service, index) => {
                  const originalIndex = selectedServices.findIndex(s => s === service);
                  return (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      marginBottom: '0.5rem',
                      backgroundColor: '#fef3c7'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>
                          Зуб {service.tooth_id}: {service.service_name}
                        </div>
                        <div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#6b7280' }}>
                          {(service.service_price || 0).toLocaleString('ru-RU')} ₸ за единицу
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="number"
                          min="1"
                          value={service.quantity}
                          onChange={(e) => handleQuantityChange(originalIndex, parseInt(e.target.value) || 1)}
                          style={{
                            width: '60px',
                            padding: '0.25rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            textAlign: 'center'
                          }}
                        />
                        <button
                          onClick={() => handleServiceRemove(originalIndex)}
                          style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
                          }}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            
            <div style={{
              borderTop: '1px solid #e5e7eb',
              paddingTop: '1rem',
              marginTop: '1rem',
              textAlign: 'right'
            }}>
              <div style={{ 
                fontSize: 'clamp(1.125rem, 3vw, 1.25rem)',
                fontWeight: '600',
                color: '#059669'
              }}>
                Итого: {calculateTotal().toLocaleString('ru-RU')} ₸
              </div>
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'flex-end',
          background: 'rgba(255,255,255,0.95)',
          padding: 'clamp(1rem, 3vw, 1.5rem)',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <button
            onClick={() => navigate('/treatment-orders')}
            style={{
              background: 'linear-gradient(135deg, #6b7280, #4b5563)',
              color: 'white',
              border: 'none',
              padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
              borderRadius: '15px',
              cursor: 'pointer',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(107,114,128,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(107,114,128,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(107,114,128,0.3)';
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!patient || !doctor || selectedServices.length === 0 || saving}
            style={{
              background: selectedServices.length === 0 
                ? 'linear-gradient(135deg, #9ca3af, #6b7280)' 
                : 'linear-gradient(135deg, #059669, #047857)',
              color: 'white',
              border: 'none',
              padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
              borderRadius: '15px',
              cursor: selectedServices.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: selectedServices.length === 0 
                ? '0 4px 15px rgba(156,163,175,0.3)' 
                : '0 4px 15px rgba(5,150,105,0.3)',
              opacity: saving ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!saving && selectedServices.length > 0) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(5,150,105,0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving && selectedServices.length > 0) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(5,150,105,0.3)';
              }
            }}
          >
            {saving ? 'Сохранение...' : 'Сохранить наряд'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTreatmentOrder;

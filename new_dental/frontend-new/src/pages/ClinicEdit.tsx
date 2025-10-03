import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useClinic } from '../contexts/ClinicContext';

interface User {
  id: number;
  full_name: string;
  phone: string;
  role: string;
  clinic_id: number | null;
  is_active: boolean;
}

interface Service {
  id: number;
  name: string;
  price: number;
  description: string;
  is_active: boolean;
}

interface ClinicPatient {
  id: number;
  clinic_id: number;
  patient_id: number;
  first_visit_date: string;
  last_visit_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  patient_name: string;
  patient_phone: string;
  patient_iin: string;
  clinic_name: string;
}

interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_datetime: string;
  status: string;
  notes: string;
}

interface TreatmentPlan {
  id: number;
  patient_id: number;
  diagnosis: string;
  treatment_description: string;
  status: string;
  created_at: string;
}

interface TreatmentOrder {
  id: number;
  patient_id: number;
  total_amount: number;
  status: string;
  created_at: string;
}

type TabType = 'info' | 'staff' | 'services' | 'patients' | 'appointments' | 'treatment_plans' | 'treatment_orders';

const ClinicEdit: React.FC = () => {
  const navigate = useNavigate();
  const { clinicId } = useParams<{ clinicId: string }>();
  const { clinic, refreshClinic } = useClinic();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Данные для разных вкладок
  const [staff, setStaff] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [patients, setPatients] = useState<ClinicPatient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [treatmentOrders, setTreatmentOrders] = useState<TreatmentOrder[]>([]);
  
  // Состояние поиска
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    contacts: ''
  });

  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name || '',
        description: clinic.description || '',
        address: clinic.address || '',
        contacts: clinic.contacts || ''
      });
    }
  }, [clinic]);

  useEffect(() => {
    if (clinicId && activeTab !== 'info') {
      loadTabData();
    }
  }, [clinicId, activeTab]);

  const loadTabData = async () => {
    if (!clinicId) return;
    
    setLoading(true);
    try {
      switch (activeTab) {
        case 'staff':
          const staffRes = await api.get(`/users/?clinic_id=${clinicId}`);
          setStaff(staffRes.data);
          break;
        case 'services':
          const servicesRes = await api.get('/services/');
          setServices(servicesRes.data);
          break;
        case 'patients':
          const patientsRes = await api.get('/clinic-patients/');
          setPatients(patientsRes.data);
          break;
        case 'appointments':
          const appointmentsRes = await api.get(`/appointments/?clinic_id=${clinicId}`);
          setAppointments(appointmentsRes.data);
          break;
        case 'treatment_plans':
          const plansRes = await api.get(`/treatment-plans/?clinic_id=${clinicId}`);
          setTreatmentPlans(plansRes.data);
          break;
        case 'treatment_orders':
          const ordersRes = await api.get(`/treatment-orders/?clinic_id=${clinicId}`);
          setTreatmentOrders(ordersRes.data);
          break;
      }
    } catch (error) {
      console.error(`Ошибка загрузки данных для вкладки ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const searchInClinic = async (query: string) => {
    if (!query.trim() || !clinicId) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    console.log('🔍 Начинаем поиск:', { query: query.trim(), clinicId });
    console.log('👤 Текущий пользователь:', JSON.parse(localStorage.getItem('user') || '{}'));

    try {
      const results: any[] = [];

      // Поиск пациентов
      try {
        console.log('🔍 Поиск пациентов...');
        
        // Сначала проверим, можем ли мы получить всех пациентов
        const allPatientsRes = await api.get('/clinic-patients/');
        console.log('📋 Все пациенты клиники:', allPatientsRes.data);
        
        const patientsRes = await api.get('/clinic-patients/', {
          params: { search: query.trim() }
        });
        console.log('📋 Результат поиска пациентов:', patientsRes.data);
        if (patientsRes.data && Array.isArray(patientsRes.data)) {
          patientsRes.data.forEach((patient: any) => {
            results.push({
              type: 'patient',
              id: patient.id,
              title: patient.patient_name,
              subtitle: `Телефон: ${patient.patient_phone} | ИИН: ${patient.patient_iin}`,
              data: patient
            });
          });
        }
      } catch (error) {
        console.error('❌ Ошибка поиска пациентов:', error);
        console.error('❌ Детали ошибки:', error.response?.data);
      }

      // Поиск записей
      try {
        console.log('🔍 Поиск записей...');
        const appointmentsRes = await api.get('/appointments/', {
          params: { search: query.trim(), clinic_id: clinicId }
        });
        console.log('📅 Результат поиска записей:', appointmentsRes.data);
        if (appointmentsRes.data && Array.isArray(appointmentsRes.data)) {
          appointmentsRes.data.forEach((appointment: any) => {
            results.push({
              type: 'appointment',
              id: appointment.id,
              title: `Запись #${appointment.id}`,
              subtitle: `Пациент: ${appointment.patient_name || 'Неизвестно'} | ${new Date(appointment.appointment_datetime).toLocaleString('ru-RU')}`,
              data: appointment
            });
          });
        }
      } catch (error) {
        console.error('❌ Ошибка поиска записей:', error);
      }

      // Поиск планов лечения
      try {
        console.log('🔍 Поиск планов лечения...');
        const plansRes = await api.get('/treatment-plans/', {
          params: { search: query.trim(), clinic_id: clinicId }
        });
        console.log('📋 Результат поиска планов:', plansRes.data);
        if (plansRes.data && Array.isArray(plansRes.data)) {
          plansRes.data.forEach((plan: any) => {
            results.push({
              type: 'treatment_plan',
              id: plan.id,
              title: `План лечения #${plan.id}`,
              subtitle: `Диагноз: ${plan.diagnosis || 'Не указан'} | Статус: ${plan.status}`,
              data: plan
            });
          });
        }
      } catch (error) {
        console.error('❌ Ошибка поиска планов лечения:', error);
      }

      // Поиск нарядов
      try {
        console.log('🔍 Поиск нарядов...');
        const ordersRes = await api.get('/treatment-orders/', {
          params: { search: query.trim(), clinic_id: clinicId }
        });
        console.log('📄 Результат поиска нарядов:', ordersRes.data);
        if (ordersRes.data && Array.isArray(ordersRes.data)) {
          ordersRes.data.forEach((order: any) => {
            results.push({
              type: 'treatment_order',
              id: order.id,
              title: `Наряд #${order.id}`,
              subtitle: `Сумма: ${order.total_amount?.toLocaleString()} ₸ | Статус: ${order.status}`,
              data: order
            });
          });
        }
      } catch (error) {
        console.error('❌ Ошибка поиска нарядов:', error);
      }

      console.log('🎯 Итоговые результаты поиска:', results);
      setSearchResults(results.slice(0, 10)); // Ограничиваем до 10 результатов
      setShowSearchResults(true);
    } catch (error) {
      console.error('❌ Общая ошибка поиска:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic) return;

    setSaving(true);
    try {
      await api.put(`/clinics/${clinic.id}`, formData);
      
      // Обновляем данные клиники в контексте
      await refreshClinic();
      
      alert('✅ Данные клиники успешно обновлены!');
    } catch (error) {
      console.error('Ошибка при обновлении клиники:', error);
      alert('❌ Ошибка при обновлении данных клиники');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  const tabs = [
    { id: 'info', label: 'Информация', icon: '🏥' },
    { id: 'staff', label: 'Персонал', icon: '👥' },
    { id: 'services', label: 'Услуги', icon: '🛠️' },
    { id: 'patients', label: 'Пациенты', icon: '👤' },
    { id: 'appointments', label: 'Записи', icon: '📅' },
    { id: 'treatment_plans', label: 'Планы лечения', icon: '📋' },
    { id: 'treatment_orders', label: 'Наряды', icon: '📄' }
  ];

  const renderTabContent = () => {
    if (loading) {
  return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px' 
        }}>
          <div>Загрузка...</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'info':
        return (
          <form onSubmit={handleSubmit} style={{ 
            backgroundColor: 'white', 
            padding: '2rem', 
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Название клиники *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Введите название клиники"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Описание
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                placeholder="Описание клиники, специализация, услуги..."
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Адрес *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Полный адрес клиники"
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Контакты *
              </label>
              <textarea
                name="contacts"
                value={formData.contacts}
                onChange={handleInputChange}
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                placeholder="Телефоны, email, часы работы..."
              />
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end' 
            }}>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  opacity: saving ? 0.5 : 1
                }}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: saving ? '#9ca3af' : '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  opacity: saving ? 0.5 : 1
                }}
              >
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        );

      case 'staff':
        return (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Персонал клиники</h3>
              <button
                onClick={() => navigate('/admin?tab=users')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Управление персоналом
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {Array.isArray(staff) && staff.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ФИО</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Телефон</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Роль</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map(user => (
                      <tr key={user.id}>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{user.full_name}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{user.phone}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{user.role}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            backgroundColor: user.is_active ? '#dcfce7' : '#fee2e2',
                            color: user.is_active ? '#166534' : '#dc2626'
                          }}>
                            {user.is_active ? 'Активен' : 'Неактивен'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <p>Нет данных о персонале</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'services':
        return (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Услуги клиники</h3>
              <button
                onClick={() => navigate('/admin?tab=services')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Управление услугами
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {Array.isArray(services) && services.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Название</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Цена</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Описание</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(service => (
                      <tr key={service.id}>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{service.name}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{service.price.toLocaleString()} ₸</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{service.description}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            backgroundColor: service.is_active ? '#dcfce7' : '#fee2e2',
                            color: service.is_active ? '#166534' : '#dc2626'
                          }}>
                            {service.is_active ? 'Активна' : 'Неактивна'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <p>Нет данных об услугах</p>
        </div>
      )}
            </div>
          </div>
        );

      case 'patients':
        return (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Пациенты клиники</h3>
              <button
                onClick={() => navigate('/patients')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Управление пациентами
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {Array.isArray(patients) && patients.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ФИО</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Телефон</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ИИН</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Первое посещение</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Последнее посещение</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map(clinicPatient => (
                      <tr key={clinicPatient.id}>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{clinicPatient.patient_name}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{clinicPatient.patient_phone}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{clinicPatient.patient_iin}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                          {new Date(clinicPatient.first_visit_date).toLocaleDateString('ru-RU')}
                        </td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                          {clinicPatient.last_visit_date ? new Date(clinicPatient.last_visit_date).toLocaleDateString('ru-RU') : 'Не было'}
                        </td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            backgroundColor: clinicPatient.is_active ? '#dcfce7' : '#fee2e2',
                            color: clinicPatient.is_active ? '#166534' : '#dc2626'
                          }}>
                            {clinicPatient.is_active ? 'Активен' : 'Неактивен'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <p>Нет данных о пациентах</p>
        </div>
      )}
            </div>
          </div>
        );

      case 'appointments':
        return (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Записи на прием</h3>
              <button
                onClick={() => navigate('/doctor')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Управление записями
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {Array.isArray(appointments) && appointments.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Дата и время</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Статус</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Примечания</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(appointment => (
                      <tr key={appointment.id}>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>#{appointment.id}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                          {new Date(appointment.appointment_datetime).toLocaleString('ru-RU')}
                        </td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            backgroundColor: appointment.status === 'completed' ? '#dcfce7' : '#fef3c7',
                            color: appointment.status === 'completed' ? '#166534' : '#92400e'
                          }}>
                            {appointment.status === 'completed' ? 'Завершена' : 'Запланирована'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{appointment.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <p>Нет данных о записях</p>
        </div>
      )}
            </div>
          </div>
        );

      case 'treatment_plans':
        return (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Планы лечения</h3>
              <button
                onClick={() => navigate('/doctor')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Управление планами
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {Array.isArray(treatmentPlans) && treatmentPlans.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Диагноз</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Статус</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Дата создания</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treatmentPlans.map(plan => (
                      <tr key={plan.id}>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>#{plan.id}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{plan.diagnosis}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            backgroundColor: plan.status === 'completed' ? '#dcfce7' : '#fef3c7',
                            color: plan.status === 'completed' ? '#166534' : '#92400e'
                          }}>
                            {plan.status === 'completed' ? 'Завершен' : 'В процессе'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                          {new Date(plan.created_at).toLocaleDateString('ru-RU')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <p>Нет данных о планах лечения</p>
        </div>
      )}
            </div>
          </div>
        );

      case 'treatment_orders':
        return (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Наряды</h3>
              <button
                onClick={() => navigate('/treatment-orders')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Управление нарядами
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {Array.isArray(treatmentOrders) && treatmentOrders.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Сумма</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Статус</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Дата создания</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treatmentOrders.map(order => (
                      <tr key={order.id}>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>#{order.id}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{order.total_amount.toLocaleString()} ₸</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            backgroundColor: order.status === 'completed' ? '#dcfce7' : '#fef3c7',
                            color: order.status === 'completed' ? '#166534' : '#92400e'
                          }}>
                            {order.status === 'completed' ? 'Завершен' : 'В процессе'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                          {new Date(order.created_at).toLocaleDateString('ru-RU')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <p>Нет данных о нарядах</p>
        </div>
      )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: '#1f2937',
          marginBottom: '0.5rem'
        }}>
          Управление клиникой
        </h1>
        <p style={{ color: '#6b7280' }}>
          Полное управление клиникой и всеми её данными
        </p>
        
        {/* Поиск в клинике */}
        <div style={{ marginTop: '1rem', position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value;
              setSearchQuery(value);
              
              // Очищаем предыдущий таймер
              if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
              }
              
              // Устанавливаем новый таймер
              searchTimeoutRef.current = setTimeout(() => {
                searchInClinic(value);
              }, 300);
            }}
            placeholder="Поиск пациентов, записей, планов лечения, нарядов в клинике..."
            style={{
              width: '100%',
              maxWidth: '600px',
              padding: '0.75rem 1rem',
              paddingRight: '2.5rem',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onFocus={() => showSearchResults && setShowSearchResults(true)}
            onBlur={() => {
              // Задержка для возможности кликнуть по результату
              setTimeout(() => setShowSearchResults(false), 200);
            }}
          />
          
          <div style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '1.25rem'
          }}>
            🔍
          </div>
        </div>
        
        {/* Результаты поиска */}
        {showSearchResults && searchResults.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxHeight: '400px',
            overflowY: 'auto',
            marginTop: '0.5rem'
          }}>
            {searchResults.map((result, index) => (
              <div
                key={`${result.type}-${result.id}`}
                onClick={() => {
                  // Переключаемся на соответствующую вкладку
                  if (result.type === 'patient') setActiveTab('patients');
                  else if (result.type === 'appointment') setActiveTab('appointments');
                  else if (result.type === 'treatment_plan') setActiveTab('treatment_plans');
                  else if (result.type === 'treatment_order') setActiveTab('treatment_orders');
                  
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                style={{
                  padding: '1rem',
                  borderBottom: index < searchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>
                  {result.type === 'patient' ? '👤' : 
                   result.type === 'appointment' ? '📅' : 
                   result.type === 'treatment_plan' ? '📋' : '📄'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '0.25rem'
                  }}>
                    {result.title}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginBottom: '0.25rem'
                  }}>
                    {result.subtitle}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#059669',
                    fontWeight: '500'
                  }}>
                    {result.type === 'patient' ? 'Пациент' : 
                     result.type === 'appointment' ? 'Запись' : 
                     result.type === 'treatment_plan' ? 'План лечения' : 'Наряд'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showSearchResults && searchResults.length === 0 && searchQuery.trim() && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            zIndex: 1000,
            padding: '2rem',
            textAlign: 'center',
            marginTop: '0.5rem'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
            <div style={{ color: '#6b7280' }}>Ничего не найдено</div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.25rem' }}>
              Попробуйте изменить поисковый запрос
            </div>
          </div>
        )}
        </div>

      {/* Вкладки */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '2rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: activeTab === tab.id ? '#059669' : '#f3f4f6',
              color: activeTab === tab.id ? 'white' : '#374151',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Содержимое вкладки */}
      {renderTabContent()}
    </div>
  );
};

export default ClinicEdit;
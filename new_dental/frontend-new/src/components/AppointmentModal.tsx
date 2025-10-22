import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TreatmentOrderModal from './TreatmentOrderModal';
import { doctorsApi } from '../services/doctorsApi';
import type { Doctor } from '../types/doctor';
import { clinicPatientsApi } from '../services/clinicPatientsApi';
import type { PatientSearchResult } from '../services/clinicPatientsApi';

// Интерфейсы прямо в компоненте
interface Patient {
  id: number;
  full_name: string;
  phone: string;
  iin: string;
  birth_date: string;
  allergies: string;
  chronic_diseases: string;
  contraindications: string;
  special_notes: string;
  created_at: string;
}

interface Appointment {
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
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string;
}

interface TreatmentPlan {
  id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  diagnosis: string;
  treatment_description: string;
  services: number[];
  total_cost: number;
  selected_teeth: number[];
  status: string;
  created_at: string;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  time: string;
  appointment: Appointment | null;
  doctorId: number;
  treatmentPlanForAppointment?: {
    plan: any;
    teethServices: Record<number, number[]>;
  } | null;
  onAppointmentCreated: (appointment: Appointment) => void;
  onAppointmentUpdated: (appointment: Appointment) => void;
  onNavigateToTreatmentPlan?: (patient: Patient) => void;
  onCreateTreatmentPlan?: (patient: Patient) => void;
}

// API функции прямо в компоненте
const treatmentPlansApi = {
  getByPatientId: async (patientId: number): Promise<TreatmentPlan[]> => {
    try {
      const response = await api.get(`/treatment-plans/patient/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки планов лечения:', error);
      return [];
    }
  }
};



const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  date,
  time,
  appointment,
  doctorId,
  treatmentPlanForAppointment,
  onAppointmentCreated,
  onAppointmentUpdated,
  onNavigateToTreatmentPlan,
  onCreateTreatmentPlan
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '+7 ',
    iin: '',
    birth_date: '',
    allergies: '',
    chronic_diseases: '',
    contraindications: '',
    special_notes: '',
    start_time: time,
    end_time: '',
    notes: '',
    doctor_id: doctorId // Устанавливаем текущего врача по умолчанию
  });

  // Отладочная информация при изменении formData
  useEffect(() => {
    console.log('📝 formData изменился:', formData);
  }, [formData]);

  // Загрузка планов лечения для пациента
  const loadTreatmentPlans = async (patientId: number) => {
    if (!patientId) return;
    
    setLoadingPlans(true);
    try {
      const plans = await treatmentPlansApi.getByPatientId(patientId);
      setTreatmentPlans(plans);
      console.log('📋 Загружены планы лечения:', plans);
      console.log('📋 Количество планов:', plans.length);
      console.log('📋 Первый план:', plans[0]);
    } catch (error) {
      console.error('❌ Ошибка загрузки планов лечения:', error);
      setTreatmentPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingPatient, setExistingPatient] = useState<Patient | null>(null);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [showTreatmentOrderModal, setShowTreatmentOrderModal] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Загрузка списка врачей клиники
  const loadDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const doctorsList = await doctorsApi.getDoctors();
      setDoctors(doctorsList);
      console.log('👨‍⚕️ Загружены врачи:', doctorsList);
    } catch (error) {
      console.error('❌ Ошибка загрузки врачей:', error);
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Инициализация формы при открытии модала
  useEffect(() => {
    if (isOpen) {
      console.log('🚀 Модал открыт, инициализируем форму');
      if (appointment) {
        console.log('📝 Редактирование существующей записи:', appointment);
        // Редактирование существующей записи
        setFormData({
          full_name: appointment.patient_name,
          phone: appointment.patient_phone,
          iin: appointment.patient_iin,
          birth_date: toDateInput(appointment.patient_birth_date),
          allergies: appointment.patient_allergies || '',
          chronic_diseases: appointment.patient_chronic_diseases || '',
          contraindications: appointment.patient_contraindications || '',
          special_notes: appointment.patient_special_notes || '',
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          notes: appointment.notes,
          doctor_id: appointment.doctor_id
        });
        setExistingPatient({
          id: appointment.patient_id,
          full_name: appointment.patient_name,
          phone: appointment.patient_phone,
          iin: appointment.patient_iin,
          birth_date: toDateInput(appointment.patient_birth_date),
          allergies: appointment.patient_allergies || '',
          chronic_diseases: appointment.patient_chronic_diseases || '',
          contraindications: appointment.patient_contraindications || '',
          special_notes: appointment.patient_special_notes || '',
          created_at: ''
        });
        
        // Загружаем планы лечения для пациента
        loadTreatmentPlans(appointment.patient_id);
      } else {
        console.log('🆕 Создание новой записи');
        // Создание новой записи
        setFormData({
          full_name: '',
          phone: '+7 ',
          iin: '',
          birth_date: '',
          allergies: '',
          chronic_diseases: '',
          contraindications: '',
          special_notes: '',
          start_time: time,
          end_time: '',
          notes: '',
          doctor_id: doctorId
        });
        setExistingPatient(null);
        setTreatmentPlans([]);
      }
      
      // Загружаем список врачей при открытии модала
      loadDoctors();
    }
  }, [isOpen, appointment, time]);

  // Автоматическое заполнение формы данными из плана лечения
  useEffect(() => {
    if (isOpen && !appointment && treatmentPlanForAppointment?.plan) {
      console.log('📋 Автоматическое заполнение формы данными из плана лечения:', treatmentPlanForAppointment);
      
      const plan = treatmentPlanForAppointment.plan;
      
      // Заполняем форму данными пациента из плана лечения
      setFormData(prev => ({
        ...prev,
        full_name: plan.patient_name || '',
        phone: plan.patient_phone || '+7 ',
        iin: plan.patient_iin || '',
        birth_date: plan.patient_birth_date || '',
        allergies: plan.patient_allergies || '',
        chronic_diseases: plan.patient_chronic_diseases || '',
        contraindications: plan.patient_contraindications || '',
        special_notes: plan.patient_special_notes || '',
        notes: `План лечения: ${plan.diagnosis || 'Не указан'}. Услуги: ${Object.entries(treatmentPlanForAppointment.teethServices)
          .map(([toothId, serviceIds]) => `Зуб ${toothId} - ${serviceIds.length} услуг`)
          .join(', ')}`
      }));
      
      // Устанавливаем существующего пациента
      setExistingPatient({
        id: plan.patient_id || 0,
        full_name: plan.patient_name || '',
        phone: plan.patient_phone || '',
        iin: plan.patient_iin || '',
        birth_date: plan.patient_birth_date || '',
        allergies: plan.patient_allergies || '',
        chronic_diseases: plan.patient_chronic_diseases || '',
        contraindications: plan.patient_contraindications || '',
        special_notes: plan.patient_special_notes || '',
        created_at: ''
      });
      
      console.log('✅ Форма автоматически заполнена данными из плана лечения');
    }
  }, [isOpen, appointment, treatmentPlanForAppointment]);

  // Автоматически заполняем время окончания (1 час после начала)
  useEffect(() => {
    if (formData.start_time) {
      const [hours, minutes] = formData.start_time.split(':');
      const endTime = new Date();
      endTime.setHours(parseInt(hours) + 1, parseInt(minutes), 0);
      const endTimeString = endTime.toTimeString().slice(0, 5);
      setFormData(prev => ({ ...prev, end_time: endTimeString }));
    }
  }, [formData.start_time]);

  // Флаг, чтобы не запускать форматирование во время автозаполнения
  const isAutoFilling = useRef(false);

  const toDateInput = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : '');

  const formatPhoneFromDigits = (digits: string) => {
    // ожидаем 11 цифр, первая должна быть 7
    if (!digits) return '+7 ';
    const d = digits.replace(/\D/g, '');
    if (d.length < 1) return '+7 ';
    let out = '+7 (' + (d.slice(1, 4) || '');
    if (d.length >= 4) {
      out += ') ' + d.slice(4, 7);
      if (d.length >= 7) {
        out += '-' + d.slice(7, 9);
        if (d.length >= 9) {
          out += '-' + d.slice(9, 11);
        }
      }
    }
    return out;
  };

  // Функция для извлечения даты рождения из ИИН
  const extractBirthDateFromIIN = (iin: string): string => {
    if (iin.length >= 6) {
      const datePart = iin.substring(0, 6);
      const year = datePart.substring(0, 2);
      const month = datePart.substring(2, 4);
      const day = datePart.substring(4, 6);
      
      // Определяем век (если год > 50, то 19xx, иначе 20xx)
      const century = parseInt(year) > 50 ? '19' : '20';
      const fullYear = century + year;
      
      return `${fullYear}-${month}-${day}`;
    }
    return '';
  };

  // Обработчик изменения ИИН
  const handleIINChange = async (iin: string) => {
    console.log('🔍 handleIINChange вызван с ИИН:', iin);
    if (isAutoFilling.current) return;
    // оставляем только цифры
    const digits = iin.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, iin: digits }));
    
    if (digits.length === 12) {
      console.log('✅ ИИН содержит 12 цифр, ищем пациента...');
      
      // Автоматически заполняем дату рождения
      const birthDate = extractBirthDateFromIIN(digits);
      console.log('📅 Извлеченная дата рождения:', birthDate);
      setFormData(prev => ({ ...prev, birth_date: birthDate }));
      
      // Проверяем, есть ли пациент с таким ИИН в базе
      try {
        console.log('🔎 Вызываем findPatient с ИИН:', digits);
        const patient = await findPatient(digits);
        console.log('👤 Результат поиска пациента:', patient);
        
        if (patient) {
          console.log('✅ Пациент найден, заполняем поля:', patient);
          isAutoFilling.current = true;
          setExistingPatient(patient as unknown as Patient);
          setFormData(prev => ({
            ...prev,
            full_name: patient.full_name || '',
            phone: patient.phone || '',
            iin: patient.iin || digits,
            birth_date: toDateInput(patient.birth_date) || birthDate,
            allergies: patient.allergies || '',
            chronic_diseases: patient.chronic_diseases || '',
            contraindications: patient.contraindications || '',
            special_notes: patient.special_notes || ''
          }));
          isAutoFilling.current = false;
          console.log('✅ Поля формы заполнены');
          
          // Загружаем планы лечения для найденного пациента
          loadTreatmentPlans(patient.id);
        } else {
          console.log('❌ Пациент не найден');
          setExistingPatient(null);
        }
      } catch (error) {
        console.error('❌ Ошибка поиска пациента:', error);
      }
    } else {
      console.log('❌ ИИН не содержит 12 цифр:', iin.length);
      setExistingPatient(null);
    }
  };

  // Обработчик изменения телефона
  const handlePhoneChange = async (phone: string) => {
    console.log('📱 handlePhoneChange вызван с телефоном:', phone);
    if (isAutoFilling.current) return;
    
    // Если начинается с 8, заменяем на 7
    if (phone.startsWith('8')) {
      phone = '7' + phone.slice(1);
    }
    
    // Если уже начинается с 7, оставляем как есть
    if (!phone.startsWith('+7')) {
      phone = '+7 ' + phone;
    }
    
    // Форматируем номер телефона
    const digits = phone.replace(/\D/g, '');
    let formattedPhone = phone;
    
    if (digits.length >= 1) {
      formattedPhone = '+7 (' + digits.slice(1, 4);
      if (digits.length >= 4) {
        formattedPhone += ') ' + digits.slice(4, 7);
        if (digits.length >= 7) {
          formattedPhone += '-' + digits.slice(7, 9);
          if (digits.length >= 9) {
            formattedPhone += '-' + digits.slice(9, 11);
          }
        }
      }
    }
    
    setFormData(prev => ({ ...prev, phone: formattedPhone }));
    
    // Если номер телефона полный (11 цифр), ищем пациента
    if (digits.length === 11) {
      console.log('📱 Телефон полный (11 цифр), ищем пациента...');
      try {
        const patient = await findPatient(undefined, formattedPhone);
        if (patient) {
          console.log('✅ Пациент найден по телефону, заполняем поля:', patient);
          isAutoFilling.current = true;
          setExistingPatient(patient as unknown as Patient);
          const patientDigitsPhone = (patient.phone || '').replace(/\D/g, '');
          setFormData(prev => ({
            ...prev,
            full_name: patient.full_name || '',
            phone: patientDigitsPhone ? formatPhoneFromDigits(patientDigitsPhone) : formattedPhone,
            iin: patient.iin || prev.iin,
            birth_date: toDateInput(patient.birth_date) || prev.birth_date,
            allergies: patient.allergies || '',
            chronic_diseases: patient.chronic_diseases || '',
            contraindications: patient.contraindications || '',
            special_notes: patient.special_notes || ''
          }));
          isAutoFilling.current = false;
          // Подгружаем планы лечения
          loadTreatmentPlans(patient.id);
        } else {
          console.log('❌ Пациент по телефону не найден');
          setExistingPatient(null);
        }
      } catch (e) {
        console.error('❌ Ошибка поиска по телефону:', e);
      }
    } else {
      console.log('📱 Телефон неполный, сбрасываем пациента');
      setExistingPatient(null);
    }
  };

  // Функция поиска пациента
  const findPatient = async (iin?: string, phone?: string): Promise<PatientSearchResult | null> => {
    try {
      console.log('🔍 findPatient вызван с параметрами:', { iin, phone });
      
      let searchQuery = '';
      if (iin) {
        searchQuery = iin;
        console.log('🔍 Ищем по ИИН:', iin);
      } else if (phone) {
        // Убираем форматирование для поиска
        searchQuery = phone.replace(/\D/g, '');
        console.log('📱 Ищем по телефону:', searchQuery);
      } else {
        console.log('❌ Не указаны параметры для поиска');
        return null;
      }
      
      // Используем новый API для поиска по общей базе
      const searchResults = await clinicPatientsApi.searchPatients(searchQuery);
      
      if (searchResults && searchResults.length > 0) {
        const foundPatient = searchResults[0]; // Берем первый результат
        console.log('👤 Результат поиска:', foundPatient);
        return foundPatient;
      }
      
      console.log('❌ Пациент не найден');
      return null;
    } catch (error) {
      console.error('❌ Ошибка поиска пациента:', error);
      return null;
    }
  };

  // Валидация формы
  const validateForm = (): boolean => {
    if (!formData.full_name.trim()) {
      setError('Введите ФИО пациента');
      return false;
    }
    if (formData.phone.replace(/\D/g, '').length !== 11) {
      setError('Введите корректный номер телефона');
      return false;
    }
    if (!formData.iin || formData.iin.length !== 12) {
      setError('ИИН должен содержать 12 цифр');
      return false;
    }
    if (!formData.birth_date) {
      setError('Введите дату рождения');
      return false;
    }
    if (!formData.start_time || !formData.end_time) {
      setError('Введите время начала и окончания приема');
      return false;
    }
    if (!formData.doctor_id) {
      setError('Выберите врача');
      return false;
    }
    return true;
  };

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      let patientId = existingPatient?.id || 0;
      
      // Если пациента нет в БД, создаем его
      if (!existingPatient) {
        console.log('🆕 Создаем нового пациента в БД...');
        
        const { data: newPatient } = await api.post('/patients/', {
          full_name: formData.full_name,
          phone: formData.phone,
          iin: formData.iin,
          birth_date: formData.birth_date,
          allergies: formData.allergies || '',
          chronic_diseases: formData.chronic_diseases || '',
          contraindications: formData.contraindications || '',
          special_notes: formData.special_notes || ''
        });

        if (newPatient) {
          patientId = newPatient.id;
          console.log('✅ Новый пациент создан в БД:', newPatient);
        } else {
          console.error('❌ Ошибка при создании пациента через API');
          setError('Ошибка при создании пациента');
          setLoading(false);
          return;
        }
      } else {
        // Если пациент найден, используем его ID
        patientId = existingPatient.id;
        console.log('👤 Используем существующего пациента:', existingPatient);
      }
      
      // Добавляем пациента в клинику (если еще не добавлен)
      try {
        console.log('🏥 Добавляем пациента в клинику...');
        await clinicPatientsApi.addPatientToClinic(patientId);
        console.log('✅ Пациент добавлен в клинику');
      } catch (error) {
        // Игнорируем ошибку, если пациент уже в клинике
        console.log('ℹ️ Пациент уже в клинике или ошибка добавления:', error);
      }
      
      const appointmentData = {
        patient_id: patientId,
        doctor_id: formData.doctor_id, // Используем выбранного врача
        appointment_date: date.toISOString().split('T')[0],
        start_time: formData.start_time,
        end_time: formData.end_time,
        notes: formData.notes,
        // Добавляем данные пациента для новой записи
        patient_name: formData.full_name,
        patient_phone: formData.phone,
        patient_iin: formData.iin,
        patient_birth_date: formData.birth_date,
        patient_allergies: formData.allergies,
        patient_chronic_diseases: formData.chronic_diseases,
        patient_contraindications: formData.contraindications,
        patient_special_notes: formData.special_notes
      };
      
      if (appointment) {
        // Обновление существующей записи
        console.log('💾 Обновляем запись в БД:', appointmentData);
        const { data: updatedAppointment } = await api.put(`/appointments/${appointment.id}`, appointmentData);
        console.log('✅ Запись обновлена в БД:', updatedAppointment);
        onAppointmentUpdated(updatedAppointment);
      } else {
        // Создание новой записи
        console.log('💾 Создаем новую запись в БД:', appointmentData);
        const { data: newAppointment } = await api.post('/appointments/', appointmentData);
        console.log('✅ Запись создана в БД:', newAppointment);
        onAppointmentCreated(newAppointment);
      }
      
      onClose();
    } catch (error) {
      setError('Ошибка при сохранении записи');
      console.error('Ошибка при сохранении записи:', error);
    } finally {
      setLoading(false);
    }
  };

  // Генерация временных слотов
  const generateTimeSlots = (): string[] => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: 0
          }}>
            {appointment ? 'Редактирование записи' : `Запись на прием ${date.toLocaleDateString('ru-RU')}`}
          </h2>
          <button
            onClick={onClose}
            style={{
              color: '#6b7280',
              fontSize: '24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {existingPatient && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px'
          }}>
            <p style={{
              color: '#1e40af',
              fontSize: '14px',
              margin: 0
            }}>
              ✅ Найден существующий пациент: {existingPatient.full_name}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Основные данные пациента */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
                          <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  ФИО пациента *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Введите ФИО"
                  required
                />
              </div>

                          <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Номер телефона *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="+7 (XXX) XXX-XX-XX"
                  required
                />
              </div>

                          <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  ИИН *
                </label>
                <input
                  type="text"
                  value={formData.iin}
                  onChange={(e) => handleIINChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="12 цифр"
                  maxLength={12}
                  required
                />
              </div>

                          <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Дата рождения *
                </label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
          </div>

          {/* Анамнез пациента */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '500',
              color: '#111827',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '8px',
              margin: 0
            }}>
              Анамнез пациента
            </h3>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Аллергии
              </label>
              <textarea
                value={formData.allergies}
                onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: '60px'
                }}
                placeholder="Укажите аллергии на лекарства, материалы и т.д."
                rows={2}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Хронические заболевания
              </label>
              <textarea
                value={formData.chronic_diseases}
                onChange={(e) => setFormData(prev => ({ ...prev, chronic_diseases: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: '60px'
                }}
                placeholder="Сахарный диабет, гипертония, астма и т.д."
                rows={2}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Противопоказания
              </label>
              <textarea
                value={formData.contraindications}
                onChange={(e) => setFormData(prev => ({ ...prev, contraindications: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: '60px'
                }}
                placeholder="Ограничения по лечению, наркозу и т.д."
                rows={2}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Особые заметки
              </label>
              <textarea
                value={formData.special_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, special_notes: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: '60px'
                }}
                placeholder="Беременность, прием лекарств, курение и т.д."
                rows={2}
              />
            </div>
          </div>

          {/* Время приема */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Время начала *
              </label>
              <select
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                required
              >
                <option value="">Выберите время</option>
                {generateTimeSlots().map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Время окончания *
              </label>
              <select
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                required
              >
                <option value="">Выберите время</option>
                {generateTimeSlots().map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Выбор врача */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Врач *
            </label>
            <select
              value={formData.doctor_id}
              onChange={(e) => setFormData(prev => ({ ...prev, doctor_id: parseInt(e.target.value) }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              required
              disabled={loadingDoctors}
            >
              <option value="">{loadingDoctors ? 'Загрузка врачей...' : 'Выберите врача'}</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.full_name} ({doctor.role === 'doctor' ? 'Врач' : 'Медсестра'})
                </option>
              ))}
            </select>
          </div>

          {/* Заметки */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Заметки к записи
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                resize: 'vertical',
                minHeight: '80px'
              }}
              placeholder="Дополнительная информация о записи"
              rows={3}
            />
          </div>

          {/* Ошибки */}
          {error && (
            <div style={{
              color: '#dc2626',
              fontSize: '14px',
              backgroundColor: '#fef2f2',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          {/* План лечения */}
          {(existingPatient || (appointment && appointment.patient_id)) && (
            <div style={{
              marginBottom: '16px',
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                📋 План лечения
              </h4>
              
              {loadingPlans ? (
                <div style={{ color: '#64748b', fontSize: '14px' }}>
                  Загрузка планов лечения...
                </div>
              ) : treatmentPlans.length > 0 ? (
                <div>
                  <div style={{ marginBottom: '12px', fontSize: '14px', color: '#64748b' }}>
                    Найдено планов лечения: {treatmentPlans.length}
                  </div>
                  
                  {/* Список планов лечения */}
                  <div style={{ marginBottom: '12px' }}>
                    {treatmentPlans.map((plan, index) => (
                      <div key={plan.id || index} style={{
                        padding: '12px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        marginBottom: '8px'
                      }}>
                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                          План лечения #{plan.id}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                          Диагноз: {plan.diagnosis || 'Не указан'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                          Описание: {plan.treatment_description || 'Не указано'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                          Создан: {new Date(plan.created_at).toLocaleDateString('ru-RU')}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToTreatmentPlan) {
                              // Создаем объект пациента с данными из формы
                              const patientFromForm: Patient = {
                                id: existingPatient?.id || 0,
                                full_name: formData.full_name,
                                phone: formData.phone,
                                iin: formData.iin,
                                birth_date: formData.birth_date,
                                allergies: formData.allergies,
                                chronic_diseases: formData.chronic_diseases,
                                contraindications: formData.contraindications,
                                special_notes: formData.special_notes,
                                created_at: new Date().toISOString().split('T')[0]
                              };
                              console.log('📋 Переход к плану лечения с данными из формы:', patientFromForm);
                              onNavigateToTreatmentPlan(patientFromForm);
                              onClose();
                            }
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          📋 Открыть план
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Кнопка создания наряда при наличии планов лечения */}
                  <button
                    type="button"
                    onClick={() => {
                      if (appointment) {
                        navigate(`/treatment-orders/create?appointment_id=${appointment.id}`);
                      } else if (existingPatient) {
                        navigate(`/treatment-orders/create?patient_id=${existingPatient.id}`);
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginTop: '12px'
                    }}
                  >
                    📋 Создать наряд
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '12px', fontSize: '14px', color: '#64748b' }}>
                    План лечения не создан
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onCreateTreatmentPlan) {
                        // Создаем объект пациента с данными из формы
                        const patientFromForm: Patient = {
                          id: existingPatient?.id || 0,
                          full_name: formData.full_name,
                          phone: formData.phone,
                          iin: formData.iin,
                          birth_date: formData.birth_date,
                          allergies: formData.allergies,
                          chronic_diseases: formData.chronic_diseases,
                          contraindications: formData.contraindications,
                          special_notes: formData.special_notes,
                          created_at: new Date().toISOString().split('T')[0]
                        };
                        console.log('📋 Создание плана лечения с данными из формы:', patientFromForm);
                        onCreateTreatmentPlan(patientFromForm);
                        onClose();
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    ➕ Создать план лечения
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (appointment) {
                        navigate(`/treatment-orders/create?appointment_id=${appointment.id}`);
                      } else if (existingPatient) {
                        navigate(`/treatment-orders/create?patient_id=${existingPatient.id}`);
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginLeft: '8px'
                    }}
                  >
                    📋 Создать наряд
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Кнопки */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '16px'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                color: '#374151',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: loading ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {loading ? 'Сохранение...' : (appointment ? 'Обновить' : 'Создать')}
            </button>
          </div>
        </form>
      </div>

      {/* Treatment Order Modal */}
      <TreatmentOrderModal
        isOpen={showTreatmentOrderModal}
        onClose={() => setShowTreatmentOrderModal(false)}
        patient={existingPatient}
        appointmentId={appointment?.id}
        onSuccess={() => {
          console.log('✅ Наряд успешно создан');
          // Можно добавить уведомление или обновление данных
        }}
      />
    </div>
  );
};

export default AppointmentModal;
